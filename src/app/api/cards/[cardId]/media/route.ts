import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { cardSummarySelect, getSessionUser } from "@/lib/current-user";
import { verifyCloudinaryUploadResponse } from "@/lib/cloudinary";
import { getDefaultMediaPlacement } from "@/lib/media-presentation";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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

    const body = await request.json();
    const upload = mediaSchema.parse(body);
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
        order: nextOrder,
      },
    });

    const updatedCard = await prisma.card.findUnique({
      where: { id: card.id },
      select: cardSummarySelect,
    });

    return NextResponse.json(updatedCard, { status: 201 });
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
