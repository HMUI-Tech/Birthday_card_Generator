import { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";

import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const publicUserSelect = {
  id: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const cardSummarySelect = {
  id: true,
  slug: true,
  title: true,
  personalizedText: true,
  recipientName: true,
  occasion: true,
  relationship: true,
  insideMessage: true,
  theme: true,
  soundtrackMode: true,
  soundtrackTitle: true,
  soundtrackUrl: true,
  soundtrackPublicId: true,
  soundtrackOriginalFilename: true,
  soundtrackFormat: true,
  soundtrackDuration: true,
  media: {
    orderBy: {
      order: "asc",
    },
    select: {
      id: true,
      publicId: true,
      originalFilename: true,
      resourceType: true,
      format: true,
      secureUrl: true,
      bytes: true,
      width: true,
      height: true,
      duration: true,
      placement: true,
      filterStyle: true,
      motionStyle: true,
      order: true,
      createdAt: true,
    },
  },
  createdAt: true,
  updatedAt: true,
  sources: {
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      kind: true,
      title: true,
      textContent: true,
      url: true,
      filename: true,
      mimeType: true,
      createdAt: true,
    },
  },
  _count: {
    select: {
      media: true,
      sources: true,
    },
  },
} satisfies Prisma.CardSelect;

export async function getSessionUser(request: NextRequest) {
  const userId = getSessionUserId(request);

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
}
