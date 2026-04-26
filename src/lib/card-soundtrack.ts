export const soundtrackModeOptions = [
  { value: "none", label: "No soundtrack" },
  { value: "upload", label: "Uploaded soundtrack" },
] as const;

export function formatSoundtrackModeLabel(mode: string | null | undefined) {
  switch (mode) {
    case "upload":
      return "Uploaded soundtrack";
    case "none":
    default:
      return "No soundtrack";
  }
}

export function buildSoundtrackTitle({
  soundtrackTitle,
  soundtrackOriginalFilename,
}: {
  soundtrackTitle?: string | null;
  soundtrackOriginalFilename?: string | null;
}) {
  return soundtrackTitle?.trim() || soundtrackOriginalFilename?.trim() || "Card soundtrack";
}

export function resolveCardSoundtrack({
  soundtrackMode,
  soundtrackTitle,
  soundtrackUrl,
  soundtrackOriginalFilename,
}: {
  soundtrackMode?: string | null;
  soundtrackTitle?: string | null;
  soundtrackUrl?: string | null;
  soundtrackOriginalFilename?: string | null;
}) {
  if (soundtrackMode !== "upload" || !soundtrackUrl) {
    return null;
  }

  return {
    label: buildSoundtrackTitle({
      soundtrackTitle,
      soundtrackOriginalFilename,
    }),
    src: soundtrackUrl,
  };
}
