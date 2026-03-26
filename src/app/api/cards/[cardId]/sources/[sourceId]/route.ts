import { NextResponse, type NextRequest } from "next/server";

import { cardSummarySelect, getSessionUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string; sourceId: string }> },
) {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      return NextResponse.json({ message: "Not signed in" }, { status: 401 });
    }

    const { cardId, sourceId } = await params;

    const source = await prisma.memorySource.findFirst({
      where: {
        id: sourceId,
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

    if (!source) {
      return NextResponse.json({ message: "Source not found" }, { status: 404 });
    }

    await prisma.memorySource.delete({
      where: {
        id: source.id,
      },
    });

    const updatedCard = await prisma.card.findUnique({
      where: { id: source.cardId },
      select: cardSummarySelect,
    });

    return NextResponse.json({ card: updatedCard }, { status: 200 });
  } catch (error) {
    console.error("Source delete error", error);

    return NextResponse.json(
      { message: "Unable to delete this source right now" },
      { status: 500 },
    );
  }
}
