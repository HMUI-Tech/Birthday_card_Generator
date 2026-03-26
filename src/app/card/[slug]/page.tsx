/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";

import { buildCloudinaryDeliveryUrl, isCloudinaryConfigured } from "@/lib/cloudinary";
import {
  buildBackNotePlaceholder,
  buildFallbackCoverLine,
  buildFallbackInsideMessage,
  getCardDesign,
} from "@/lib/card-design";
import { getMotionStyleClass } from "@/lib/media-presentation";
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
          motionStyle: true,
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
      <div className="mx-auto max-w-6xl">
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
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.34em]">
                    {design.coverEyebrow}
                  </p>
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
                          className={`aspect-[4/5] w-full object-cover ${getMotionStyleClass(coverMedia.motionStyle)}`}
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
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            <div className="grid gap-5">
              <section className={`rounded-[2.35rem] p-8 md:p-10 ${design.insidePanelClass}`}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-700">
                    {design.insideEyebrow}
                  </p>
                </div>

                <p className="mt-6 whitespace-pre-line text-base leading-8 text-stone-700 md:text-lg">
                  {insideMessage}
                </p>

                <div className="mt-8 space-y-4">
                  {insideFeatureMedia ? (
                    <article className="overflow-hidden rounded-[1.9rem] border border-stone-200 bg-white shadow-sm">
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
                          className={`aspect-[16/10] w-full bg-stone-100 object-cover ${getMotionStyleClass(insideFeatureMedia.motionStyle)}`}
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
                    </article>
                  ) : null}

                  {insideStripMedia.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
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
                                className={`aspect-[4/3] w-full bg-stone-100 object-cover ${getMotionStyleClass(item.motionStyle)}`}
                                src={src}
                                alt={item.originalFilename || "Card memory"}
                              />
                            )}
                          </article>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </section>

              <section className={`rounded-[2.35rem] p-8 md:p-10 ${design.backPanelClass}`}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-stone-500">
                    {design.backEyebrow}
                  </p>
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
                        className={`aspect-[4/3] w-full bg-stone-100 object-cover ${getMotionStyleClass(backAccentMedia.motionStyle)}`}
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
