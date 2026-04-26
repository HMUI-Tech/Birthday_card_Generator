import { buildBackNotePlaceholder, buildFallbackCoverLine, buildFallbackInsideMessage, getCardDesign } from "@/lib/card-design";
import { resolveCardSoundtrack } from "@/lib/card-soundtrack";
import { buildCloudinaryDeliveryUrl, isCloudinaryConfigured } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

export type PublicCardMedia = {
  id: string;
  publicId: string;
  secureUrl: string;
  resourceType: string;
  format: string | null;
  originalFilename: string | null;
  duration: number | null;
  placement: string;
  filterStyle: string;
  motionStyle: string;
};

export type PublicCardViewModel = {
  slug: string;
  recipientName: string | null;
  occasion: string;
  relationship: string | null;
  theme: string;
  design: ReturnType<typeof getCardDesign>;
  coverLine: string;
  insideMessage: string;
  backNote: string;
  coverMedia: PublicCardMedia | null;
  insideFeatureMedia: PublicCardMedia | null;
  backAccentMedia: PublicCardMedia | null;
  insideStripMedia: PublicCardMedia[];
  soundtrack: { label: string; src: string } | null;
  cloudinaryReady: boolean;
};

export async function getPublicCardViewModel(slug: string): Promise<PublicCardViewModel | null> {
  const card = await prisma.card.findUnique({
    where: { slug },
    select: {
      slug: true,
      recipientName: true,
      occasion: true,
      relationship: true,
      title: true,
      insideMessage: true,
      personalizedText: true,
      theme: true,
      soundtrackMode: true,
      soundtrackTitle: true,
      soundtrackUrl: true,
      soundtrackOriginalFilename: true,
      media: {
        orderBy: {
          order: "asc",
        },
        select: {
          id: true,
          publicId: true,
          secureUrl: true,
          resourceType: true,
          format: true,
          originalFilename: true,
          duration: true,
          placement: true,
          filterStyle: true,
          motionStyle: true,
        },
      },
    },
  });

  if (!card) {
    return null;
  }

  const cloudinaryReady = isCloudinaryConfigured();
  const design = getCardDesign(card.occasion, card.theme);
  const coverLine =
    card.title ||
    buildFallbackCoverLine({
      recipientName: card.recipientName,
      occasion: card.occasion,
    });
  const insideMessage =
    card.insideMessage ||
    buildFallbackInsideMessage({
      recipientName: card.recipientName,
      occasion: card.occasion,
      relationship: card.relationship,
    });
  const backNote = card.personalizedText || buildBackNotePlaceholder(card.recipientName);
  const coverMedia = card.media.find((item) => item.placement === "cover") ?? null;
  const insideFeatureMedia = card.media.find((item) => item.placement === "inside-feature") ?? null;
  const backAccentMedia = card.media.find((item) => item.placement === "back-accent") ?? null;
  const insideStripMedia = card.media.filter(
    (item) =>
      item.id !== coverMedia?.id &&
      item.id !== insideFeatureMedia?.id &&
      item.id !== backAccentMedia?.id,
  );

  return {
    slug: card.slug,
    recipientName: card.recipientName,
    occasion: card.occasion,
    relationship: card.relationship,
    theme: card.theme,
    design,
    coverLine,
    insideMessage,
    backNote,
    coverMedia,
    insideFeatureMedia,
    backAccentMedia,
    insideStripMedia,
    soundtrack: resolveCardSoundtrack({
      soundtrackMode: card.soundtrackMode,
      soundtrackTitle: card.soundtrackTitle,
      soundtrackUrl: card.soundtrackUrl,
      soundtrackOriginalFilename: card.soundtrackOriginalFilename,
    }),
    cloudinaryReady,
  };
}

export function getPublicCardMediaUrl({
  media,
  occasion,
  theme,
  cloudinaryReady,
}: {
  media: PublicCardMedia;
  occasion: string;
  theme: string;
  cloudinaryReady: boolean;
}) {
  if (!cloudinaryReady || (media.resourceType !== "image" && media.resourceType !== "video")) {
    return media.secureUrl;
  }

  return buildCloudinaryDeliveryUrl({
    publicId: media.publicId,
    resourceType: media.resourceType,
    placement: media.placement,
    filterStyle: media.filterStyle,
    occasion,
    theme,
  });
}
