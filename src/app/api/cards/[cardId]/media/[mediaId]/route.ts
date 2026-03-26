import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { cardSummarySelect, getSessionUser } from "@/lib/current-user";
import { filterStyles, mediaPlacements } from "@/lib/media-presentation";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const updateMediaSchema = z
  .object({
    placement: z.enum(mediaPlacements).optional(),
    filterStyle: z.enum(filterStyles).optional(),
  })
  .refine((value) => value.placement || value.filterStyle, {
    message: "Provide at least one media setting to update",
  });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string; mediaId: string }> },
) {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      return NextResponse.json({ message: "Not signed in" }, { status: 401 });
    }

    const { cardId, mediaId } = await params;
    const body = await request.json();
    const payload = updateMediaSchema.parse(body);

    const media = await prisma.media.findFirst({
      where: {
        id: mediaId,
        cardId,
        card: {
          userId: user.id,
        },
      },
      select: {
        id: true,
        cardId: true,
      },
    });

    if (!media) {
      return NextResponse.json({ message: "Media not found" }, { status: 404 });
    }

    await prisma.media.update({
      where: { id: media.id },
      data: {
        placement: payload.placement,
        filterStyle: payload.filterStyle,
      },
    });

    const updatedCard = await prisma.card.findUnique({
      where: { id: media.cardId },
      select: cardSummarySelect,
    });

    return NextResponse.json(updatedCard, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Invalid media update payload",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Media update error", error);

    return NextResponse.json(
      { message: "Unable to update media right now" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string; mediaId: string }> },
) {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      return NextResponse.json({ message: "Not signed in" }, { status: 401 });
    }

    const { cardId, mediaId } = await params;

    const media = await prisma.media.findFirst({
      where: {
        id: mediaId,
        cardId,
        card: {
          userId: user.id,
        },
      },
      select: {
        id: true,
        cardId: true,
      },
    });

    if (!media) {
      return NextResponse.json({ message: "Media not found" }, { status: 404 });
    }

    await prisma.media.delete({
      where: { id: media.id },
    });

    const updatedCard = await prisma.card.findUnique({
      where: { id: media.cardId },
      select: cardSummarySelect,
    });

    return NextResponse.json({ card: updatedCard }, { status: 200 });
  } catch (error) {
    console.error("Media delete error", error);

    return NextResponse.json(
      { message: "Unable to delete media right now" },
      { status: 500 },
    );
  }
}
