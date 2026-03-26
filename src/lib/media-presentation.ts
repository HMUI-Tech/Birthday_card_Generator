export const mediaPlacements = ["cover", "inside-feature", "inside-strip", "back-accent"] as const;
export type MediaPlacement = (typeof mediaPlacements)[number];

export const filterStyles = [
  "auto",
  "cinematic",
  "vintage",
  "neon",
  "minimalist",
  "soft-glow",
] as const;
export type FilterStyle = (typeof filterStyles)[number];

export const mediaPlacementOptions = [
  { value: "cover", label: "Front cover" },
  { value: "inside-feature", label: "Inside feature" },
  { value: "inside-strip", label: "Inside strip" },
  { value: "back-accent", label: "Back accent" },
] as const satisfies ReadonlyArray<{ value: MediaPlacement; label: string }>;

export const filterStyleOptions = [
  { value: "auto", label: "AI subtle" },
  { value: "cinematic", label: "Cinematic" },
  { value: "vintage", label: "Vintage" },
  { value: "neon", label: "Neon" },
  { value: "minimalist", label: "Minimalist" },
  { value: "soft-glow", label: "Soft glow" },
] as const satisfies ReadonlyArray<{ value: FilterStyle; label: string }>;

const placementLabels = Object.fromEntries(mediaPlacementOptions.map((item) => [item.value, item.label]));
const filterLabels = Object.fromEntries(filterStyleOptions.map((item) => [item.value, item.label]));

export function formatMediaPlacementLabel(placement: string) {
  return placementLabels[placement as MediaPlacement] ?? "Inside strip";
}

export function formatFilterStyleLabel(filterStyle: string) {
  return filterLabels[filterStyle as FilterStyle] ?? "AI subtle";
}

export function resolveAutoFilterStyle({
  filterStyle,
  occasion,
  theme,
}: {
  filterStyle: string;
  occasion?: string | null;
  theme?: string | null;
}): FilterStyle {
  if (filterStyle !== "auto" && filterStyles.includes(filterStyle as FilterStyle)) {
    return filterStyle as FilterStyle;
  }

  if (theme === "confetti" || occasion === "birthday") {
    return "neon";
  }

  if (theme === "memory-book" || occasion === "anniversary") {
    return "vintage";
  }

  if (theme === "sunset" || occasion === "romantic") {
    return "soft-glow";
  }

  if (occasion === "friendship") {
    return "cinematic";
  }

  return "minimalist";
}

export function getDefaultMediaPlacement({
  nextOrder,
  resourceType,
}: {
  nextOrder: number;
  resourceType: string;
}): MediaPlacement {
  if (resourceType === "video") {
    return nextOrder === 0 ? "inside-feature" : "inside-strip";
  }

  if (nextOrder === 0) {
    return "cover";
  }

  if (nextOrder === 1) {
    return "inside-feature";
  }

  return "inside-strip";
}
