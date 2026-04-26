"use client";

import { useEffect, useRef, useState } from "react";

export function CardSoundtrackPlayer({
  title,
  src,
}: {
  title: string;
  src: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Tap play if your browser blocks auto-start.");

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    let cancelled = false;

    const tryAutoStart = async () => {
      try {
        await audio.play();
        if (!cancelled) {
          setIsPlaying(true);
          setStatusMessage("Soundtrack is playing.");
        }
      } catch {
        if (!cancelled) {
          setIsPlaying(false);
          setStatusMessage("Tap play to start the soundtrack. Some browsers block autoplay with sound.");
        }
      }
    };

    void tryAutoStart();

    return () => {
      cancelled = true;
      audio.pause();
    };
  }, [src]);

  async function togglePlayback() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
        setStatusMessage("Soundtrack is playing.");
      } catch {
        setIsPlaying(false);
        setStatusMessage("This browser blocked playback. Try the button again after interacting with the page.");
      }
      return;
    }

    audio.pause();
    setIsPlaying(false);
    setStatusMessage("Soundtrack paused.");
  }

  return (
    <div className="print-hidden fixed bottom-4 right-4 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-[1.4rem] border border-stone-900/10 bg-white/92 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur">
      <audio ref={audioRef} src={src} loop preload="none" />
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-rose-700">
        Soundtrack
      </p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-950">{title}</p>
          <p className="mt-1 text-xs leading-5 text-stone-500">{statusMessage}</p>
        </div>
        <button
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          type="button"
          onClick={() => {
            void togglePlayback();
          }}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>
    </div>
  );
}
