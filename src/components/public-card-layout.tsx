/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";

import { getMotionStyleClass } from "@/lib/media-presentation";
import { getPublicCardMediaUrl, type PublicCardMedia, type PublicCardViewModel } from "@/lib/public-card";

function CardMediaBlock({
  media,
  card,
  aspectClass,
  alt,
  printMode,
}: {
  media: PublicCardMedia;
  card: PublicCardViewModel;
  aspectClass: string;
  alt: string;
  printMode: boolean;
}) {
  const src = getPublicCardMediaUrl({
    media,
    occasion: card.occasion,
    theme: card.theme,
    cloudinaryReady: card.cloudinaryReady,
  });

  if (printMode && media.resourceType === "video") {
    return (
      <div className={`${aspectClass} flex items-end bg-stone-900 p-5 text-white`}>
        <p className="max-w-xs text-sm leading-6 text-white/85">
          This card includes a video clip. The moving version stays on the live web card.
        </p>
      </div>
    );
  }

  if (media.resourceType === "video") {
    return (
      <video className={`${aspectClass} w-full bg-stone-950 object-cover`} controls preload="metadata" src={src} />
    );
  }

  return (
    <img
      className={`${aspectClass} w-full bg-stone-100 object-cover ${printMode ? "" : getMotionStyleClass(media.motionStyle)}`}
      src={src}
      alt={alt}
    />
  );
}

export function PublicCardLayout({
  card,
  toolbar,
  printMode = false,
}: {
  card: PublicCardViewModel;
  toolbar?: ReactNode;
  printMode?: boolean;
}) {
  const { design, coverMedia, insideFeatureMedia, insideStripMedia, backAccentMedia } = card;

  return (
    <main className={`min-h-screen px-6 py-10 text-stone-900 md:px-10 ${design.pageBackgroundClass}`}>
      <div className={`mx-auto ${printMode ? "max-w-[980px]" : "max-w-6xl"}`}>
        {toolbar ? <div className="print-hidden mb-5">{toolbar}</div> : null}

        <section className={`public-card-frame rounded-[2.75rem] p-5 md:p-6 ${design.frameClass}`}>
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
                    {card.coverLine}
                  </h2>
                </div>

                {coverMedia ? (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 shadow-lg">
                      <CardMediaBlock
                        media={coverMedia}
                        card={card}
                        aspectClass="aspect-[4/5]"
                        alt={coverMedia.originalFilename || "Cover memory"}
                        printMode={printMode}
                      />
                    </div>
                  </div>
                ) : null}
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
                  {card.insideMessage}
                </p>

                <div className="mt-8 space-y-4">
                  {insideFeatureMedia ? (
                    <article className="overflow-hidden rounded-[1.9rem] border border-stone-200 bg-white shadow-sm">
                      <CardMediaBlock
                        media={insideFeatureMedia}
                        card={card}
                        aspectClass="aspect-[16/10]"
                        alt={insideFeatureMedia.originalFilename || "Inside feature"}
                        printMode={printMode}
                      />
                    </article>
                  ) : null}

                  {insideStripMedia.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {insideStripMedia.map((item) => (
                        <article
                          key={item.id}
                          className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm"
                        >
                          <CardMediaBlock
                            media={item}
                            card={card}
                            aspectClass="aspect-[4/3]"
                            alt={item.originalFilename || "Card memory"}
                            printMode={printMode}
                          />
                        </article>
                      ))}
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
                    <CardMediaBlock
                      media={backAccentMedia}
                      card={card}
                      aspectClass="aspect-[4/3]"
                      alt={backAccentMedia.originalFilename || "Back accent"}
                      printMode={printMode}
                    />
                  </div>
                ) : null}

                <p className="mt-6 whitespace-pre-line text-base leading-8 text-stone-700 md:text-lg">
                  {card.backNote}
                </p>

                {printMode ? (
                  <p className="mt-8 text-sm leading-6 text-stone-500">
                    The live web version keeps any motion, music, and video playback.
                  </p>
                ) : null}
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
