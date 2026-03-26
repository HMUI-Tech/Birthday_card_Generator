/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";

import { buildCloudinaryDeliveryUrl, isCloudinaryConfigured } from "@/lib/cloudinary";
import {
  buildBackNotePlaceholder,
  buildCardCopyStateDescription,
  buildFallbackCoverLine,
  buildFallbackInsideMessage,
  formatCardCopyStateLabel,
  formatOccasionLabel,
  formatThemeLabel,
  getCardCopyState,
  getCardDesign,
} from "@/lib/card-design";
import {
  formatFilterStyleLabel,
  formatMediaPlacementLabel,
} from "@/lib/media-presentation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PublicCardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const card = await prisma.card.findUnique({
    where: { slug },
    select: {
      recipientName: true,
      occasion: true,
      relationship: true,
      title: true,
      insideMessage: true,
      personalizedText: true,
      theme: true,
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
        },
      },
    },
  });

  if (!card) {
    notFound();
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
  const copyState = getCardCopyState({
    title: card.title,
    insideMessage: card.insideMessage,
  });
  const copyStateLabel = formatCardCopyStateLabel(copyState);
  const copyStateDescription = buildCardCopyStateDescription(copyState);
  const coverMedia = card.media.find((item) => item.placement === "cover") ?? null;
  const insideFeatureMedia = card.media.find((item) => item.placement === "inside-feature") ?? null;
  const backAccentMedia = card.media.find((item) => item.placement === "back-accent") ?? null;
  const insideStripMedia = card.media.filter(
    (item) =>
      item.id !== coverMedia?.id &&
      item.id !== insideFeatureMedia?.id &&
      item.id !== backAccentMedia?.id,
  );

  return (
    <main className={`min-h-screen px-6 py-10 text-stone-900 md:px-10 ${design.pageBackgroundClass}`}>
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-rose-700">
              Shareable card
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950 md:text-6xl">
              {coverLine}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700 md:text-lg">
              {copyState === "generated"
                ? `A ${formatOccasionLabel(card.occasion).toLowerCase()} card with an AI-written cover and inside message, plus a private note on the back.`
                : `A ${formatOccasionLabel(card.occasion).toLowerCase()} card currently showing starter text from the brief until the AI cover and inside message are generated.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-stone-700 shadow-sm">
              {formatOccasionLabel(card.occasion)}
            </span>
            <span className="rounded-full bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-stone-700 shadow-sm">
              {formatThemeLabel(card.theme)}
            </span>
            <span className="rounded-full bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-stone-700 shadow-sm">
              {copyStateLabel}
            </span>
            {card.relationship ? (
              <span className="rounded-full bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-stone-700 shadow-sm">
                {card.relationship}
              </span>
            ) : null}
          </div>
        </header>

        <section className={`rounded-[2.75rem] p-5 md:p-6 ${design.frameClass}`}>
          <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
            <section
              className={`relative min-h-[30rem] overflow-hidden rounded-[2.35rem] p-8 md:p-10 ${design.frontPanelClass}`}
            >
              <div
                className={`absolute right-[-4rem] top-[-4rem] h-40 w-40 rounded-full blur-3xl ${design.accentClass}`}
              />
              <div
                className={`absolute bottom-10 right-10 h-20 w-20 rounded-full border border-white/20 ${design.accentClass}`}
              />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.34em]">
                      {design.coverEyebrow}
                    </p>
                    <p className={`mt-3 text-sm ${design.metaClass}`}>
                      {formatOccasionLabel(card.occasion)} card
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] ${design.badgeClass}`}
                  >
                    Front cover
                  </span>
                </div>

                <div className="mt-16">
                  <p className={`text-sm ${design.mutedClass}`}>
                    {card.recipientName ? `For ${card.recipientName}` : "Made with care"}
                  </p>
                  <h2 className="mt-5 max-w-lg text-5xl font-semibold leading-tight tracking-[-0.05em] md:text-6xl">
                    {coverLine}
                  </h2>
                </div>

                <div className="space-y-3">
                  {coverMedia ? (
                    <div className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 shadow-lg">
                      {coverMedia.resourceType === "video" ? (
                        <video
                          className="aspect-[4/5] w-full object-cover"
                          controls
                          preload="metadata"
                          src={
                            cloudinaryReady
                              ? buildCloudinaryDeliveryUrl({
                                  publicId: coverMedia.publicId,
                                  resourceType: coverMedia.resourceType,
                                  placement: coverMedia.placement,
                                  filterStyle: coverMedia.filterStyle,
                                  occasion: card.occasion,
                                  theme: card.theme,
                                })
                              : coverMedia.secureUrl
                          }
                        />
                      ) : (
                        <img
                          className="aspect-[4/5] w-full object-cover"
                          src={
                            cloudinaryReady
                              ? buildCloudinaryDeliveryUrl({
                                  publicId: coverMedia.publicId,
                                  resourceType: coverMedia.resourceType,
                                  placement: coverMedia.placement,
                                  filterStyle: coverMedia.filterStyle,
                                  occasion: card.occasion,
                                  theme: card.theme,
                                })
                              : coverMedia.secureUrl
                          }
                          alt={coverMedia.originalFilename || "Cover memory"}
                        />
                      )}
                      <div className="px-4 py-3 text-xs uppercase tracking-[0.22em] text-white/80">
                        {formatMediaPlacementLabel(coverMedia.placement)} •{" "}
                        {formatFilterStyleLabel(coverMedia.filterStyle)}
                      </div>
                    </div>
                  ) : null}
                  {card.relationship ? (
                    <p className={`text-sm ${design.mutedClass}`}>{card.relationship}</p>
                  ) : null}
                  <p className={`max-w-sm text-sm leading-6 ${design.mutedClass}`}>
                    {design.coverPrompt}
                  </p>
                </div>
              </div>
            </section>

            <div className="grid gap-5">
              <section className={`rounded-[2.35rem] p-8 md:p-10 ${design.insidePanelClass}`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-700">
                      {design.insideEyebrow}
                    </p>
                    <p className="mt-3 text-sm text-stone-500">
                      {copyState === "generated"
                        ? "The main message the recipient reads when the card opens."
                        : "Starter text from the card brief. Generate the inside message in the workspace to replace it."}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-600">
                    Inside
                  </span>
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-stone-200/80 bg-white/75 px-5 py-4 text-sm leading-6 text-stone-600">
                  {copyStateDescription}
                </div>

                <p className="mt-6 whitespace-pre-line text-base leading-8 text-stone-700 md:text-lg">
                  {insideMessage}
                </p>

                <div className="mt-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">
                    Card images and clips
                  </p>

                  {insideFeatureMedia ? (
                    <article className="mt-4 overflow-hidden rounded-[1.9rem] border border-stone-200 bg-white shadow-sm">
                      {insideFeatureMedia.resourceType === "video" ? (
                        <video
                          className="aspect-[16/10] w-full bg-stone-950 object-cover"
                          controls
                          preload="metadata"
                          src={
                            cloudinaryReady
                              ? buildCloudinaryDeliveryUrl({
                                  publicId: insideFeatureMedia.publicId,
                                  resourceType: insideFeatureMedia.resourceType,
                                  placement: insideFeatureMedia.placement,
                                  filterStyle: insideFeatureMedia.filterStyle,
                                  occasion: card.occasion,
                                  theme: card.theme,
                                })
                              : insideFeatureMedia.secureUrl
                          }
                        />
                      ) : (
                        <img
                          className="aspect-[16/10] w-full bg-stone-100 object-cover"
                          src={
                            cloudinaryReady
                              ? buildCloudinaryDeliveryUrl({
                                  publicId: insideFeatureMedia.publicId,
                                  resourceType: insideFeatureMedia.resourceType,
                                  placement: insideFeatureMedia.placement,
                                  filterStyle: insideFeatureMedia.filterStyle,
                                  occasion: card.occasion,
                                  theme: card.theme,
                                })
                              : insideFeatureMedia.secureUrl
                          }
                          alt={insideFeatureMedia.originalFilename || "Inside feature"}
                        />
                      )}
                      <div className="px-5 py-4 text-sm text-stone-600">
                        <p>{insideFeatureMedia.originalFilename || insideFeatureMedia.publicId}</p>
                        <p className="mt-1 uppercase tracking-[0.2em] text-rose-700">
                          {formatMediaPlacementLabel(insideFeatureMedia.placement)} •{" "}
                          {formatFilterStyleLabel(insideFeatureMedia.filterStyle)}
                        </p>
                      </div>
                    </article>
                  ) : null}

                  {card.media.length === 0 ? (
                    <div className="mt-4 rounded-[1.75rem] border border-dashed border-stone-300 bg-white/70 px-5 py-8 text-sm leading-6 text-stone-500">
                      No pictures, GIFs, or video memories were attached to this card yet.
                    </div>
                  ) : insideStripMedia.length > 0 ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {insideStripMedia.map((item) => {
                        const src =
                          cloudinaryReady &&
                          (item.resourceType === "image" || item.resourceType === "video")
                            ? buildCloudinaryDeliveryUrl({
                                publicId: item.publicId,
                                resourceType: item.resourceType,
                                placement: item.placement,
                                filterStyle: item.filterStyle,
                                occasion: card.occasion,
                                theme: card.theme,
                              })
                            : item.secureUrl;

                        return (
                          <article
                            key={item.id}
                            className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm"
                          >
                            {item.resourceType === "video" ? (
                              <video
                                className="aspect-[4/3] w-full bg-stone-950 object-cover"
                                controls
                                preload="metadata"
                                src={src}
                              />
                            ) : (
                              <img
                                className="aspect-[4/3] w-full bg-stone-100 object-cover"
                                src={src}
                                alt={item.originalFilename || "Card memory"}
                              />
                            )}

                            <div className="px-5 py-4 text-sm text-stone-600">
                              <p>{item.originalFilename || item.publicId}</p>
                              <p className="mt-1 uppercase tracking-[0.2em] text-rose-700">
                                {formatMediaPlacementLabel(item.placement)} •{" "}
                                {formatFilterStyleLabel(item.filterStyle)}
                              </p>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-[1.75rem] border border-dashed border-stone-300 bg-white/70 px-5 py-8 text-sm leading-6 text-stone-500">
                      The chosen media is already being used on the cover, inside feature, or back.
                    </div>
                  )}
                </div>
              </section>

              <section className={`rounded-[2.35rem] p-8 md:p-10 ${design.backPanelClass}`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-stone-500">
                      {design.backEyebrow}
                    </p>
                    <p className="mt-3 text-sm text-stone-500">
                      The private note added by the sender and kept separate from the AI copy.
                    </p>
                  </div>
                  <span className="rounded-full bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-600">
                    Back
                  </span>
                </div>

                {backAccentMedia ? (
                  <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm">
                    {backAccentMedia.resourceType === "video" ? (
                      <video
                        className="aspect-[4/3] w-full bg-stone-950 object-cover"
                        controls
                        preload="metadata"
                        src={
                          cloudinaryReady
                            ? buildCloudinaryDeliveryUrl({
                                publicId: backAccentMedia.publicId,
                                resourceType: backAccentMedia.resourceType,
                                placement: backAccentMedia.placement,
                                filterStyle: backAccentMedia.filterStyle,
                                occasion: card.occasion,
                                theme: card.theme,
                              })
                            : backAccentMedia.secureUrl
                        }
                      />
                    ) : (
                      <img
                        className="aspect-[4/3] w-full bg-stone-100 object-cover"
                        src={
                          cloudinaryReady
                            ? buildCloudinaryDeliveryUrl({
                                publicId: backAccentMedia.publicId,
                                resourceType: backAccentMedia.resourceType,
                                placement: backAccentMedia.placement,
                                filterStyle: backAccentMedia.filterStyle,
                                occasion: card.occasion,
                                theme: card.theme,
                              })
                            : backAccentMedia.secureUrl
                        }
                        alt={backAccentMedia.originalFilename || "Back accent"}
                      />
                    )}
                    <div className="px-5 py-4 text-sm text-stone-600">
                      <p>{backAccentMedia.originalFilename || backAccentMedia.publicId}</p>
                      <p className="mt-1 uppercase tracking-[0.2em] text-rose-700">
                        {formatMediaPlacementLabel(backAccentMedia.placement)} •{" "}
                        {formatFilterStyleLabel(backAccentMedia.filterStyle)}
                      </p>
                    </div>
                  </div>
                ) : null}

                <p className="mt-6 whitespace-pre-line text-base leading-8 text-stone-700 md:text-lg">
                  {backNote}
                </p>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
