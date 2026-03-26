import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { cardSummarySelect, getSessionUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const createCardSchema = z.object({
  recipientName: z.string().trim().min(1, "Recipient name is required").max(80, "Name is too long"),
  occasion: z
    .enum(["birthday", "romantic", "anniversary", "friendship", "celebration"])
    .default("birthday"),
  relationship: z.string().trim().max(80, "Relationship label is too long").optional().default(""),
  personalNote: z
    .string()
    .trim()
    .max(800, "Personal note is too long")
    .optional()
    .default(""),
  theme: z.enum(["default", "sunset", "confetti", "memory-book"]).default("default"),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      return NextResponse.json({ message: "Not signed in" }, { status: 401 });
    }

    const cards = await prisma.card.findMany({
      where: { userId: user.id },
      select: cardSummarySelect,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ cards }, { status: 200 });
  } catch (error) {
    console.error("Card list error", error);

    return NextResponse.json(
      { message: "Unable to load cards right now" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      return NextResponse.json({ message: "Not signed in" }, { status: 401 });
    }

    const body = await request.json();
    const { recipientName, occasion, relationship, personalNote, theme } = createCardSchema.parse(body);

    const card = await prisma.card.create({
      data: {
        recipientName,
        occasion,
        relationship: relationship || null,
        personalizedText: personalNote || null,
        theme,
        userId: user.id,
      },
      select: cardSummarySelect,
    });

    return NextResponse.json(card, { status: 201 });
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

    console.error("Card create error", error);

    return NextResponse.json(
      { message: "Unable to create a new card right now" },
      { status: 500 },
    );
  }
}
