import { notFound } from "next/navigation";

import { PdfPrintToolbar } from "@/components/pdf-print-toolbar";
import { PublicCardLayout } from "@/components/public-card-layout";
import { getPublicCardViewModel } from "@/lib/public-card";

export const dynamic = "force-dynamic";

export default async function PublicCardPdfPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const card = await getPublicCardViewModel(slug);

  if (!card) {
    notFound();
  }

  return <PublicCardLayout card={card} printMode toolbar={<PdfPrintToolbar />} />;
}
