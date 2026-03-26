import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { cardSummarySelect, getSessionUser } from "@/lib/current-user";
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const sourceKinds = ["note", "link", "instagram", "facebook", "pdf"] as const;

const sourceSchema = z.object({
  kind: z.enum(sourceKinds),
  title: z.string().trim().max(100).optional(),
  textContent: z.string().trim().max(4000).optional(),
  url: z.string().url().optional(),
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
      },
    });

    if (!card) {
      return NextResponse.json({ message: "Card not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const rawKind = String(formData.get("kind") ?? "");
    const parsed = sourceSchema.parse({
      kind: rawKind,
      title: String(formData.get("title") ?? "").trim() || undefined,
      textContent: String(formData.get("textContent") ?? "").trim() || undefined,
      url: String(formData.get("url") ?? "").trim() || undefined,
    });

    if (parsed.kind === "note" && !parsed.textContent) {
      return NextResponse.json(
        { message: "A note source needs some text" },
        { status: 400 },
      );
    }

    if (
      (parsed.kind === "link" || parsed.kind === "instagram" || parsed.kind === "facebook") &&
      !parsed.url
    ) {
      return NextResponse.json(
        { message: "A link source needs a URL" },
        { status: 400 },
      );
    }

    if (parsed.kind === "pdf") {
      const file = formData.get("file");

      if (!(file instanceof File)) {
        return NextResponse.json(
          { message: "Choose a PDF file to upload" },
          { status: 400 },
        );
      }

      if (file.type !== "application/pdf") {
        return NextResponse.json(
          { message: "Only PDF files are supported for this source type" },
          { status: 400 },
        );
      }

      if (!isOpenAIConfigured()) {
        return NextResponse.json(
          {
            message:
              "OpenAI is not configured. Set OPENAI_API_KEY before adding PDF sources.",
          },
          { status: 500 },
        );
      }

      const client = getOpenAIClient();
      const uploaded = await client.files.create({
        file: new File([await file.arrayBuffer()], file.name, { type: file.type }),
        purpose: "user_data",
      });

      const createdSource = await prisma.memorySource.create({
        data: {
          cardId: card.id,
          kind: parsed.kind,
          title: parsed.title || file.name,
          textContent: parsed.textContent ?? null,
          filename: file.name,
          mimeType: file.type,
          openaiFileId: uploaded.id,
        },
      });

      const updatedCard = await prisma.card.findUnique({
        where: { id: card.id },
        select: cardSummarySelect,
      });

      return NextResponse.json(
        { card: updatedCard, sourceId: createdSource.id },
        { status: 201 },
      );
    }

    const createdSource = await prisma.memorySource.create({
      data: {
        cardId: card.id,
        kind: parsed.kind,
        title: parsed.title ?? null,
        textContent: parsed.textContent ?? null,
        url: parsed.url ?? null,
      },
    });

    const updatedCard = await prisma.card.findUnique({
      where: { id: card.id },
      select: cardSummarySelect,
    });

    return NextResponse.json(
      { card: updatedCard, sourceId: createdSource.id },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "The source details are incomplete or invalid",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Source create error", error);

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to save source right now" },
      { status: 500 },
    );
  }
}
