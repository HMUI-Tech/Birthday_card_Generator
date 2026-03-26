import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { cardSummarySelect, getSessionUser } from "@/lib/current-user";
import {
  getCloudinaryConfig,
  getCloudinaryUploadUrl,
  signCloudinaryParams,
  verifyCloudinaryUploadResponse,
} from "@/lib/cloudinary";
import { getDefaultMediaPlacement } from "@/lib/media-presentation";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const maxUploadBytes = 25 * 1024 * 1024;
const acceptedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const mediaSchema = z.object({
  public_id: z.string().min(1),
  version: z.union([z.string(), z.number()]).transform((value) => String(value)),
  signature: z.string().min(1),
  resource_type: z.string().min(1),
  secure_url: z.string().url(),
  original_filename: z.string().optional(),
  format: z.string().optional(),
  bytes: z.number().int().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  duration: z.number().optional(),
});

async function persistUploadedMedia({
  cardId,
  upload,
}: {
  cardId: string;
  upload: z.infer<typeof mediaSchema>;
}) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: {
      id: true,
      media: {
        select: {
          order: true,
        },
        orderBy: {
          order: "desc",
        },
        take: 1,
      },
    },
  });

  if (!card) {
    return NextResponse.json({ message: "Card not found" }, { status: 404 });
  }

  const nextOrder = (card.media[0]?.order ?? -1) + 1;
  const placement = getDefaultMediaPlacement({
    nextOrder,
    resourceType: upload.resource_type,
  });

  if (!verifyCloudinaryUploadResponse(upload.public_id, upload.version, upload.signature)) {
    return NextResponse.json(
      { message: "Upload verification failed" },
      { status: 400 },
    );
  }

  await prisma.media.upsert({
    where: {
      publicId: upload.public_id,
    },
    update: {
      originalFilename: upload.original_filename ?? null,
      resourceType: upload.resource_type,
      format: upload.format ?? null,
      secureUrl: upload.secure_url,
      bytes: upload.bytes ?? null,
      width: upload.width ?? null,
      height: upload.height ?? null,
      duration: upload.duration ?? null,
    },
      create: {
        cardId: card.id,
        publicId: upload.public_id,
        originalFilename: upload.original_filename ?? null,
        resourceType: upload.resource_type,
      format: upload.format ?? null,
      secureUrl: upload.secure_url,
      bytes: upload.bytes ?? null,
      width: upload.width ?? null,
      height: upload.height ?? null,
        duration: upload.duration ?? null,
        placement,
        filterStyle: "auto",
        motionStyle: "none",
        order: nextOrder,
      },
    });

  const updatedCard = await prisma.card.findUnique({
    where: { id: card.id },
    select: cardSummarySelect,
  });

  return NextResponse.json(updatedCard, { status: 201 });
}

async function uploadFileToCloudinary({
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
  const folder = `${folderBase}/${userId}/${cardSlug}`;
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
    | (z.input<typeof mediaSchema> & { error?: { message?: string } })
    | { error?: { message?: string }; message?: string };

  if (!response.ok) {
    const cloudinaryMessage =
      data.error?.message ??
      ("message" in data ? data.message : undefined) ??
      "Cloudinary upload failed";

    if (cloudinaryMessage.toLowerCase().includes("invalid cloud_name")) {
      throw new Error(
        "Cloudinary rejected CLOUDINARY_CLOUD_NAME. Use the exact cloud name from your Cloudinary dashboard or API environment string, not a project label or folder name.",
      );
    }

    throw new Error(cloudinaryMessage);
  }

  return mediaSchema.parse(data);
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

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!(file instanceof File)) {
        return NextResponse.json({ message: "Choose a file to upload" }, { status: 400 });
      }

      if (!acceptedMimeTypes.has(file.type)) {
        return NextResponse.json(
          {
            message:
              "Unsupported file type. Upload a JPG, PNG, WebP, GIF, MP4, WebM, or MOV file.",
          },
          { status: 400 },
        );
      }

      if (file.size > maxUploadBytes) {
        return NextResponse.json(
          {
            message: "File is too large. Keep uploads at 25 MB or below for now.",
          },
          { status: 400 },
        );
      }

      const upload = await uploadFileToCloudinary({
        file,
        userId: user.id,
        cardSlug: card.slug,
      });

      return persistUploadedMedia({ cardId: card.id, upload });
    }

    const body = await request.json();
    const upload = mediaSchema.parse(body);
    return persistUploadedMedia({ cardId: card.id, upload });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "The uploaded media response is incomplete",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Media save error", error);

    return NextResponse.json(
      { message: "Unable to save uploaded media right now" },
      { status: 500 },
    );
  }
}
