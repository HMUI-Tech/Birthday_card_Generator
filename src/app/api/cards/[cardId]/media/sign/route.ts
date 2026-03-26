import { NextResponse, type NextRequest } from "next/server";

import { getSessionUser } from "@/lib/current-user";
import { getCloudinaryConfig, getCloudinaryUploadUrl, signCloudinaryParams } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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

    const timestamp = Math.floor(Date.now() / 1000);
    const { apiKey, folderBase } = getCloudinaryConfig();
    const folder = `${folderBase}/${user.id}/${card.slug}`;

    const paramsToSign = {
      folder,
      timestamp,
    };

    return NextResponse.json(
      {
        apiKey,
        cloudName: getCloudinaryConfig().cloudName,
        folder,
        timestamp,
        signature: signCloudinaryParams(paramsToSign),
        uploadUrl: getCloudinaryUploadUrl(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Cloudinary sign error", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to prepare media uploads right now",
      },
      { status: 500 },
    );
  }
}
