import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { cardSummarySelect, getSessionUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const updateCardSchema = z.object({
  recipientName: z.string().trim().min(1, "Recipient name is required").max(80, "Name is too long"),
  occasion: z.enum(["birthday", "romantic", "anniversary", "friendship", "celebration"]),
  relationship: z.string().trim().max(80, "Relationship label is too long").optional().default(""),
  personalNote: z.string().trim().max(800, "Personal note is too long").optional().default(""),
  theme: z.enum(["default", "sunset", "confetti", "memory-book"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> },
) {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      return NextResponse.json({ message: "Not signed in" }, { status: 401 });
    }

    const body = await request.json();
    const { recipientName, occasion, relationship, personalNote, theme } = updateCardSchema.parse(
      body,
    );
    const { cardId } = await params;

    const existingCard = await prisma.card.findFirst({
      where: {
        id: cardId,
        userId: user.id,
      },
      select: {
        id: true,
        recipientName: true,
        occasion: true,
        relationship: true,
      },
    });

    if (!existingCard) {
      return NextResponse.json({ message: "Card not found" }, { status: 404 });
    }

    const normalizedRelationship = relationship || null;
    const generationInputsChanged =
      existingCard.recipientName !== recipientName ||
      existingCard.occasion !== occasion ||
      existingCard.relationship !== normalizedRelationship;

    const card = await prisma.card.update({
      where: { id: existingCard.id },
      data: {
        recipientName,
        occasion,
        relationship: normalizedRelationship,
        personalizedText: personalNote || null,
        theme,
        ...(generationInputsChanged
          ? {
              title: null,
              insideMessage: null,
            }
          : {}),
      },
      select: cardSummarySelect,
    });

    return NextResponse.json(
      {
        card,
        generationReset: generationInputsChanged,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Please provide a recipient, occasion, theme, and optional back note",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Card update error", error);

    return NextResponse.json(
      { message: "Unable to update this card right now" },
      { status: 500 },
    );
  }
}
