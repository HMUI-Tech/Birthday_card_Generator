import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { cardSummarySelect, getSessionUser } from "@/lib/current-user";
import {
  getCloudinaryConfig,
  getCloudinaryUploadUrl,
  signCloudinaryParams,
  verifyCloudinaryUploadResponse,
} from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const maxUploadBytes = 15 * 1024 * 1024;
const acceptedAudioMimeTypes = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/aac",
  "audio/x-m4a",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
]);

const soundtrackUploadSchema = z.object({
  public_id: z.string().min(1),
  version: z.union([z.string(), z.number()]).transform((value) => String(value)),
  signature: z.string().min(1),
  resource_type: z.string().min(1),
  secure_url: z.string().url(),
  original_filename: z.string().optional(),
  format: z.string().optional(),
  duration: z.number().optional(),
});

function stripExtension(filename: string) {
  return filename.replace(/\.[^.]+$/, "");
}

async function uploadSoundtrackToCloudinary({
  file,
  userId,
  cardSlug,
}: {
  file: File;
  userId: string;
  cardSlug: string;
}) {
  const timestamp = Math.floor(Date.now() / 1000);
  const { apiKey, folderBase } = getCloudinaryConfig();
  const folder = `${folderBase}/${userId}/${cardSlug}/soundtrack`;
  const paramsToSign = {
    folder,
    timestamp,
  };

  const formData = new FormData();
  formData.set("file", new File([await file.arrayBuffer()], file.name, { type: file.type }));
  formData.set("api_key", apiKey);
  formData.set("timestamp", String(timestamp));
  formData.set("signature", signCloudinaryParams(paramsToSign));
  formData.set("folder", folder);

  const response = await fetch(getCloudinaryUploadUrl(), {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as
    | (z.input<typeof soundtrackUploadSchema> & { error?: { message?: string } })
    | { error?: { message?: string }; message?: string };

  if (!response.ok) {
    const cloudinaryMessage =
      data.error?.message ??
      ("message" in data ? data.message : undefined) ??
      "Cloudinary soundtrack upload failed";

    throw new Error(cloudinaryMessage);
  }

  return soundtrackUploadSchema.parse(data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> },
) {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      return NextResponse.json({ message: "Not signed in" }, { status: 401 });
    }

    const { cardId } = await params;

    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        userId: user.id,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    if (!card) {
      return NextResponse.json({ message: "Card not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Choose an audio file to upload" }, { status: 400 });
    }

    if (!acceptedAudioMimeTypes.has(file.type)) {
      return NextResponse.json(
        {
          message: "Unsupported soundtrack type. Upload an MP3, M4A, AAC, OGG, or WAV file.",
        },
        { status: 400 },
      );
    }

    if (file.size > maxUploadBytes) {
      return NextResponse.json(
        {
          message: "Soundtrack is too large. Keep audio files at 15 MB or below.",
        },
        { status: 400 },
      );
    }

    const upload = await uploadSoundtrackToCloudinary({
      file,
      userId: user.id,
      cardSlug: card.slug,
    });

    if (!verifyCloudinaryUploadResponse(upload.public_id, upload.version, upload.signature)) {
      return NextResponse.json({ message: "Upload verification failed" }, { status: 400 });
    }

    const soundtrackTitle = stripExtension(upload.original_filename ?? file.name);

    const updatedCard = await prisma.card.update({
      where: { id: card.id },
      data: {
        soundtrackMode: "upload",
        soundtrackTitle,
        soundtrackUrl: upload.secure_url,
        soundtrackPublicId: upload.public_id,
        soundtrackOriginalFilename: upload.original_filename ?? file.name,
        soundtrackFormat: upload.format ?? null,
        soundtrackDuration: upload.duration ?? null,
      },
      select: cardSummarySelect,
    });

    return NextResponse.json(updatedCard, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "The soundtrack upload response is incomplete",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Soundtrack upload error", error);

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to upload soundtrack right now" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> },
) {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      return NextResponse.json({ message: "Not signed in" }, { status: 401 });
    }

    const { cardId } = await params;

    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!card) {
      return NextResponse.json({ message: "Card not found" }, { status: 404 });
    }

    const updatedCard = await prisma.card.update({
      where: { id: card.id },
      data: {
        soundtrackMode: "none",
        soundtrackTitle: null,
        soundtrackUrl: null,
        soundtrackPublicId: null,
        soundtrackOriginalFilename: null,
        soundtrackFormat: null,
        soundtrackDuration: null,
      },
      select: cardSummarySelect,
    });

    return NextResponse.json({ card: updatedCard }, { status: 200 });
  } catch (error) {
    console.error("Soundtrack delete error", error);

    return NextResponse.json(
      { message: "Unable to remove the soundtrack right now" },
      { status: 500 },
    );
  }
}
