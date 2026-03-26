import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { cardSummarySelect, getSessionUser } from "@/lib/current-user";
import { getOpenAIClient, getOpenAIModel, isOpenAIConfigured } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const generatedCardSchema = z.object({
  title: z.string().min(1).max(80),
  insideMessage: z.string().min(1).max(1200),
  theme: z.enum(["default", "sunset", "confetti", "memory-book"]),
  rationale: z.string().min(1).max(600),
});

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("The AI response did not contain valid JSON");
  }

  return text.slice(start, end + 1);
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

    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        {
          message:
            "OpenAI is not configured. Set OPENAI_API_KEY before generating card drafts.",
        },
        { status: 500 },
      );
    }

    const { cardId } = await params;
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        userId: user.id,
      },
      select: {
        id: true,
        title: true,
        personalizedText: true,
        recipientName: true,
        occasion: true,
        relationship: true,
        insideMessage: true,
        theme: true,
        sources: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            kind: true,
            title: true,
            textContent: true,
            url: true,
            filename: true,
            openaiFileId: true,
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ message: "Card not found" }, { status: 404 });
    }

    const sourceSummary = card.sources
      .filter((source) => source.kind !== "pdf")
      .map((source, index) => {
        const parts = [
          `Source ${index + 1}`,
          `kind=${source.kind}`,
          source.title ? `title=${source.title}` : null,
          source.url ? `url=${source.url}` : null,
          source.textContent ? `text=${source.textContent}` : null,
        ].filter(Boolean);

        return parts.join(" | ");
      })
      .join("\n");

    const client = getOpenAIClient();
    const response = await client.responses.create({
      model: getOpenAIModel(),
      input: [
        {
          role: "developer",
          content: [
            {
              type: "input_text",
              text:
                "You generate warm, personal greeting card drafts. Return only JSON with keys title, insideMessage, theme, and rationale. Themes must be one of default, sunset, confetti, memory-book. The title is the front cover line. The insideMessage is the main message inside the card. Never rewrite the user's personal note for the back of the card. If there are no extra sources, generate from the card brief alone instead of refusing.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Card brief:\nRecipient: ${card.recipientName ?? "not provided"}\nOccasion: ${card.occasion}\nRelationship: ${card.relationship ?? "not provided"}\nCurrent cover line: ${card.title ?? "none"}\nCurrent inside message: ${card.insideMessage ?? "none"}\nBack note from user: ${card.personalizedText ?? "none"}\nTheme: ${card.theme}\n\nReference sources:\n${sourceSummary || "No text sources were attached."}\n\nIf a source is just an Instagram or general URL, do not assume you can read the URL contents; only use the text given around it as evidence. Generate a card front and inside that match the occasion. Birthday cards should feel festive and warm. Romantic cards should feel intimate and elegant. Anniversary cards should feel lasting and sincere. Friendship cards should feel playful and affectionate. Celebration cards should feel generous and elevated. The user's back note stays personal and separate.`,
            },
            ...card.sources
              .filter((source) => source.openaiFileId)
              .map((source) => ({
                type: "input_file" as const,
                file_id: source.openaiFileId!,
              })),
          ],
        },
      ],
    });

    const parsed = generatedCardSchema.parse(
      JSON.parse(extractJsonObject(response.output_text)),
    );

    const updatedCardRecord = await prisma.card.update({
      where: { id: card.id },
      data: {
        title: parsed.title,
        insideMessage: parsed.insideMessage,
        theme: parsed.theme,
      },
      select: cardSummarySelect,
    });

    return NextResponse.json(
      { card: updatedCardRecord, rationale: parsed.rationale },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "The AI returned an invalid draft format",
          issues: error.issues,
        },
        { status: 500 },
      );
    }

    console.error("Generate card error", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to generate a card draft right now",
      },
      { status: 500 },
    );
  }
}
