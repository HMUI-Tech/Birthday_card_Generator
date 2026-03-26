import { WorkspacePanel } from "@/components/workspace-panel";

const studioNotes = [
  "AI writes the card cover and inside message from the brief, memories, and references you provide.",
  "Each uploaded photo can be assigned to the cover, inside feature, inside strip, or back accent.",
  "The final output should feel like one polished shareable page that can later be exported as image or PDF.",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f4ede4_0%,#efe3d2_42%,#f8f3ea_100%)] px-4 py-6 text-stone-900 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-[1.6rem] border border-white/70 bg-white/75 px-5 py-4 shadow-[0_14px_45px_rgba(74,52,30,0.10)] backdrop-blur md:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.36em] text-rose-700">
                Digital Card Studio
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 md:text-4xl">
                Build the card on a page, not inside a dashboard.
              </h1>
            </div>
            <p className="max-w-xl text-sm leading-6 text-stone-600">
              This screen is now treated as the working page for the card generator, so the
              auth/workspace area sits inside a paper-like layout instead of a product splash.
            </p>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[0.32fr_0.68fr] xl:items-start">
          <aside className="order-2 space-y-4 xl:order-1">
            <div className="rounded-[1.8rem] border border-white/70 bg-white/78 p-5 shadow-[0_14px_45px_rgba(74,52,30,0.10)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
                Page Intent
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">
                Think printable sheet, not homepage.
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-stone-600">
                {studioNotes.map((note) => (
                  <p key={note} className="rounded-[1.25rem] bg-[#fffaf2] px-4 py-3 shadow-sm">
                    {note}
                  </p>
                ))}
              </div>
            </div>
          </aside>

          <div className="order-1 xl:order-2">
            <section className="relative overflow-hidden rounded-[2rem] border border-[#dccbb8] bg-[#fffdf9] shadow-[0_28px_90px_rgba(82,58,33,0.16)]">
              <div className="border-b border-stone-200/80 bg-[linear-gradient(180deg,#fffefb_0%,#f6efe5_100%)] px-5 py-4 md:px-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-700">
                      Working Page
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                      AI card builder canvas
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                    <span className="rounded-full bg-[#f2e8d9] px-3 py-2">Share link</span>
                    <span className="rounded-full bg-[#f2e8d9] px-3 py-2">Image/PDF next</span>
                  </div>
                </div>
              </div>

              <div className="bg-[linear-gradient(180deg,#fffdf9_0%,#fffaf3_100%)] px-3 py-3 md:px-5 md:py-5">
                <WorkspacePanel />
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
