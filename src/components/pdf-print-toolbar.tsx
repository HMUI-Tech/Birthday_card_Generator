"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function PdfPrintToolbar() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("autoprint") !== "1") {
      return;
    }

    const timer = window.setTimeout(() => {
      window.print();
    }, 200);

    return () => window.clearTimeout(timer);
  }, [searchParams]);

  return (
    <div className="rounded-[1.6rem] border border-stone-200 bg-white/95 px-4 py-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-700">
            PDF export
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            This view is static for printing. Motion, music, and playable videos stay on the live web card.
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
          type="button"
          onClick={() => {
            window.print();
          }}
        >
          Print / save PDF
        </button>
      </div>
    </div>
  );
}
