import { notFound } from "next/navigation";

import { CardSoundtrackPlayer } from "@/components/card-soundtrack-player";
import { PublicCardLayout } from "@/components/public-card-layout";
import { getPublicCardViewModel } from "@/lib/public-card";

export const dynamic = "force-dynamic";

export default async function PublicCardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const card = await getPublicCardViewModel(slug);

  if (!card) {
    notFound();
  }

  return (
    <>
      <PublicCardLayout card={card} />
      {card.soundtrack ? (
        <CardSoundtrackPlayer title={card.soundtrack.label} src={card.soundtrack.src} />
      ) : null}
    </>
  );
}
