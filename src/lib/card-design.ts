export const occasionOptions = [
  { value: "birthday", label: "Birthday" },
  { value: "romantic", label: "Romantic" },
  { value: "anniversary", label: "Anniversary" },
  { value: "friendship", label: "Friendship" },
  { value: "celebration", label: "Celebration" },
] as const;

export const themeOptions = [
  { value: "default", label: "Let occasion decide" },
  { value: "sunset", label: "Sunset glow" },
  { value: "confetti", label: "Confetti burst" },
  { value: "memory-book", label: "Memory book" },
] as const;

const occasionLabels = Object.fromEntries(occasionOptions.map((option) => [option.value, option.label]));
const themeLabels = Object.fromEntries(themeOptions.map((option) => [option.value, option.label]));

type CardDesign = {
  pageBackgroundClass: string;
  frameClass: string;
  frontPanelClass: string;
  insidePanelClass: string;
  backPanelClass: string;
  badgeClass: string;
  metaClass: string;
  accentClass: string;
  mutedClass: string;
  coverEyebrow: string;
  insideEyebrow: string;
  backEyebrow: string;
  coverPrompt: string;
};

const designs: Record<string, CardDesign> = {
  birthday: {
    pageBackgroundClass:
      "bg-[radial-gradient(circle_at_top,#ffe0cf_0%,#fff5e9_36%,#f9eee5_100%)]",
    frameClass: "border border-white/60 bg-white/78 shadow-[0_32px_90px_rgba(108,52,28,0.16)]",
    frontPanelClass:
      "border border-white/35 bg-[linear-gradient(155deg,#ff8f70_0%,#ffc85d_44%,#fff4bf_100%)] text-stone-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]",
    insidePanelClass:
      "border border-amber-100 bg-[linear-gradient(180deg,#fffaf5_0%,#fff2e1_100%)] text-stone-900",
    backPanelClass:
      "border border-rose-100 bg-[linear-gradient(180deg,#fff9fb_0%,#ffe8ef_100%)] text-stone-900",
    badgeClass: "bg-stone-950/80 text-amber-200",
    metaClass: "text-rose-800",
    accentClass: "bg-white/35",
    mutedClass: "text-stone-700/85",
    coverEyebrow: "Make a wish",
    insideEyebrow: "Inside the card",
    backEyebrow: "Back note",
    coverPrompt: "Warm, festive, candle-lit",
  },
  romantic: {
    pageBackgroundClass:
      "bg-[radial-gradient(circle_at_top,#4d0f28_0%,#8f3558_28%,#f6d9df_76%,#fff7f7_100%)]",
    frameClass: "border border-white/30 bg-white/12 shadow-[0_34px_90px_rgba(74,11,34,0.28)] backdrop-blur",
    frontPanelClass:
      "border border-white/12 bg-[linear-gradient(160deg,#5c0f2f_0%,#a73162_48%,#f2cad6_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
    insidePanelClass:
      "border border-rose-200/80 bg-[linear-gradient(180deg,#fff8fb_0%,#ffe7ef_100%)] text-stone-900",
    backPanelClass:
      "border border-stone-200/80 bg-[linear-gradient(180deg,#fffdfb_0%,#f5ebe7_100%)] text-stone-900",
    badgeClass: "bg-white/16 text-rose-50",
    metaClass: "text-rose-100",
    accentClass: "bg-white/12",
    mutedClass: "text-white/80",
    coverEyebrow: "For my heart",
    insideEyebrow: "Inside the card",
    backEyebrow: "Private note",
    coverPrompt: "Intimate, elegant, soft",
  },
  anniversary: {
    pageBackgroundClass:
      "bg-[radial-gradient(circle_at_top,#20324d_0%,#375677_28%,#ead9bb_72%,#fffaf1_100%)]",
    frameClass: "border border-white/35 bg-white/18 shadow-[0_34px_90px_rgba(27,48,80,0.24)] backdrop-blur",
    frontPanelClass:
      "border border-white/15 bg-[linear-gradient(160deg,#183153_0%,#345d86_46%,#e4bf86_100%)] text-white",
    insidePanelClass:
      "border border-amber-100 bg-[linear-gradient(180deg,#fffbf4_0%,#f6ebd9_100%)] text-stone-900",
    backPanelClass:
      "border border-blue-100 bg-[linear-gradient(180deg,#f6f8fb_0%,#e4edf6_100%)] text-stone-900",
    badgeClass: "bg-white/14 text-amber-100",
    metaClass: "text-blue-100",
    accentClass: "bg-white/10",
    mutedClass: "text-white/78",
    coverEyebrow: "Still and always",
    insideEyebrow: "Inside the card",
    backEyebrow: "Back note",
    coverPrompt: "Enduring, graceful, polished",
  },
  friendship: {
    pageBackgroundClass:
      "bg-[radial-gradient(circle_at_top,#d6ffe8_0%,#efffe9_32%,#fff4d3_76%,#fff9ef_100%)]",
    frameClass: "border border-white/60 bg-white/78 shadow-[0_32px_90px_rgba(41,99,72,0.15)]",
    frontPanelClass:
      "border border-white/35 bg-[linear-gradient(160deg,#15705f_0%,#75bf7c_52%,#ffe1a1_100%)] text-stone-950",
    insidePanelClass:
      "border border-emerald-100 bg-[linear-gradient(180deg,#fbfff8_0%,#ecfbe7_100%)] text-stone-900",
    backPanelClass:
      "border border-amber-100 bg-[linear-gradient(180deg,#fffdf7_0%,#fff0d5_100%)] text-stone-900",
    badgeClass: "bg-stone-950/72 text-emerald-100",
    metaClass: "text-emerald-950",
    accentClass: "bg-white/28",
    mutedClass: "text-stone-800/80",
    coverEyebrow: "Favorite human energy",
    insideEyebrow: "Inside the card",
    backEyebrow: "Back note",
    coverPrompt: "Bright, playful, grateful",
  },
  celebration: {
    pageBackgroundClass:
      "bg-[radial-gradient(circle_at_top,#d9e2ff_0%,#e7f2ff_28%,#d4fff0_72%,#fffef7_100%)]",
    frameClass: "border border-white/60 bg-white/78 shadow-[0_32px_90px_rgba(52,66,129,0.16)]",
    frontPanelClass:
      "border border-white/30 bg-[linear-gradient(160deg,#423272_0%,#2567d9_46%,#9bf1d5_100%)] text-white",
    insidePanelClass:
      "border border-sky-100 bg-[linear-gradient(180deg,#f8fbff_0%,#eaf4ff_100%)] text-stone-900",
    backPanelClass:
      "border border-emerald-100 bg-[linear-gradient(180deg,#f7fffd_0%,#e4fbf2_100%)] text-stone-900",
    badgeClass: "bg-white/14 text-sky-50",
    metaClass: "text-sky-50",
    accentClass: "bg-white/12",
    mutedClass: "text-white/78",
    coverEyebrow: "A moment worth marking",
    insideEyebrow: "Inside the card",
    backEyebrow: "Back note",
    coverPrompt: "Fresh, bright, generous",
  },
  sunset: {
    pageBackgroundClass:
      "bg-[radial-gradient(circle_at_top,#ffc4a4_0%,#ffe3cc_28%,#fff4ec_74%,#fffdf8_100%)]",
    frameClass: "border border-white/60 bg-white/76 shadow-[0_32px_90px_rgba(136,77,36,0.16)]",
    frontPanelClass:
      "border border-white/30 bg-[linear-gradient(160deg,#6e3350_0%,#db6f57_42%,#ffcc7a_100%)] text-white",
    insidePanelClass:
      "border border-orange-100 bg-[linear-gradient(180deg,#fffaf6_0%,#fff0e1_100%)] text-stone-900",
    backPanelClass:
      "border border-rose-100 bg-[linear-gradient(180deg,#fffafb_0%,#ffe8f0_100%)] text-stone-900",
    badgeClass: "bg-white/14 text-amber-100",
    metaClass: "text-amber-50",
    accentClass: "bg-white/12",
    mutedClass: "text-white/78",
    coverEyebrow: "Golden-hour mood",
    insideEyebrow: "Inside the card",
    backEyebrow: "Back note",
    coverPrompt: "Glowing, cinematic, tender",
  },
  confetti: {
    pageBackgroundClass:
      "bg-[radial-gradient(circle_at_top,#ffe0d6_0%,#fff0bf_24%,#ebffe7_52%,#e7f7ff_78%,#fffdf8_100%)]",
    frameClass: "border border-white/60 bg-white/80 shadow-[0_32px_90px_rgba(115,67,38,0.15)]",
    frontPanelClass:
      "border border-white/30 bg-[linear-gradient(150deg,#ff6b6b_0%,#ffb347_30%,#8bd96f_64%,#4aa3ff_100%)] text-stone-950",
    insidePanelClass:
      "border border-amber-100 bg-[linear-gradient(180deg,#fffdf8_0%,#fff3df_100%)] text-stone-900",
    backPanelClass:
      "border border-rose-100 bg-[linear-gradient(180deg,#fffafc_0%,#ffe7f5_100%)] text-stone-900",
    badgeClass: "bg-stone-950/72 text-white",
    metaClass: "text-stone-950",
    accentClass: "bg-white/32",
    mutedClass: "text-stone-900/78",
    coverEyebrow: "Full celebration mode",
    insideEyebrow: "Inside the card",
    backEyebrow: "Back note",
    coverPrompt: "Bold, bright, lively",
  },
  "memory-book": {
    pageBackgroundClass:
      "bg-[radial-gradient(circle_at_top,#e7d4bd_0%,#f3e6d4_28%,#fbf6ef_78%,#fffefb_100%)]",
    frameClass: "border border-[#d9c5ad] bg-[#fbf4e8] shadow-[0_28px_80px_rgba(102,72,39,0.18)]",
    frontPanelClass:
      "border border-[#d9c5ad] bg-[linear-gradient(160deg,#a8703f_0%,#d8b184_42%,#f4e4c7_100%)] text-stone-950",
    insidePanelClass:
      "border border-[#d5c4ad] bg-[linear-gradient(180deg,#fffdf7_0%,#f4ecde_100%)] text-stone-900",
    backPanelClass:
      "border border-[#d5c4ad] bg-[linear-gradient(180deg,#fffaf4_0%,#f0e6d7_100%)] text-stone-900",
    badgeClass: "bg-stone-950/78 text-amber-100",
    metaClass: "text-amber-950",
    accentClass: "bg-white/30",
    mutedClass: "text-stone-800/78",
    coverEyebrow: "Collected with care",
    insideEyebrow: "Inside the card",
    backEyebrow: "Back note",
    coverPrompt: "Keepsake, tactile, nostalgic",
  },
  default: {
    pageBackgroundClass:
      "bg-[radial-gradient(circle_at_top,#ffe7d8_0%,#fff5eb_32%,#fffdf8_100%)]",
    frameClass: "border border-white/60 bg-white/78 shadow-[0_30px_80px_rgba(76,31,23,0.14)]",
    frontPanelClass:
      "border border-white/30 bg-[linear-gradient(160deg,#35261f_0%,#7f5a44_52%,#f6dcc0_100%)] text-white",
    insidePanelClass:
      "border border-stone-200 bg-[linear-gradient(180deg,#fffcf8_0%,#f7efe5_100%)] text-stone-900",
    backPanelClass:
      "border border-stone-200 bg-[linear-gradient(180deg,#fffcfb_0%,#f6ece8_100%)] text-stone-900",
    badgeClass: "bg-white/14 text-stone-100",
    metaClass: "text-stone-100",
    accentClass: "bg-white/12",
    mutedClass: "text-white/78",
    coverEyebrow: "Made just for them",
    insideEyebrow: "Inside the card",
    backEyebrow: "Back note",
    coverPrompt: "Warm, personal, crafted",
  },
};

type CardToneInput = {
  recipientName?: string | null;
  occasion?: string | null;
  relationship?: string | null;
};

type CardCopyInput = {
  title?: string | null;
  insideMessage?: string | null;
};

export type CardCopyState = "starter" | "partial" | "generated";

export function formatOccasionLabel(occasion: string) {
  return occasionLabels[occasion as keyof typeof occasionLabels] ?? "Celebration";
}

export function formatThemeLabel(theme: string) {
  return themeLabels[theme as keyof typeof themeLabels] ?? "Let occasion decide";
}

export function getCardDesign(occasion: string, theme: string) {
  if (theme !== "default" && designs[theme]) {
    return designs[theme];
  }

  return designs[occasion] ?? designs.default;
}

export function getCardCopyState({ title, insideMessage }: CardCopyInput): CardCopyState {
  const hasTitle = Boolean(title?.trim());
  const hasInsideMessage = Boolean(insideMessage?.trim());

  if (hasTitle && hasInsideMessage) {
    return "generated";
  }

  if (hasTitle || hasInsideMessage) {
    return "partial";
  }

  return "starter";
}

export function formatCardCopyStateLabel(state: CardCopyState) {
  switch (state) {
    case "generated":
      return "AI copy ready";
    case "partial":
      return "Partial AI copy";
    case "starter":
    default:
      return "Starter copy only";
  }
}

export function buildCardCopyStateDescription(state: CardCopyState) {
  switch (state) {
    case "generated":
      return "The current front cover and inside message were generated and saved for this card.";
    case "partial":
      return "Part of this card has been regenerated, but one section is still showing starter text from the brief.";
    case "starter":
    default:
      return "This card is still showing starter text from the brief. Generate the cover and inside to replace it with personalized copy.";
  }
}

export function buildFallbackCoverLine({ recipientName, occasion }: CardToneInput) {
  const name = recipientName?.trim();

  switch (occasion) {
    case "romantic":
      return name ? `To My Love, ${name}` : "To My Love";
    case "anniversary":
      return name ? `For ${name}, Still and Always` : "Still and Always";
    case "friendship":
      return name ? `For ${name}, My Favorite Human` : "My Favorite Human";
    case "celebration":
      return name ? `Celebrating ${name}` : "A Beautiful Celebration";
    case "birthday":
    default:
      return name ? `Happy Birthday, ${name}` : "Happy Birthday";
  }
}

export function buildFallbackInsideMessage({
  recipientName,
  occasion,
  relationship,
}: CardToneInput) {
  const name = recipientName?.trim() || "you";
  const relation = relationship?.trim();

  switch (occasion) {
    case "romantic":
      return `Every day with ${name} feels softer, brighter, and more meaningful. ${
        relation ? `Being your ${relation} is a gift.` : "Being close to you is a gift."
      } This card is waiting for the AI to turn your memories into something intimate and beautiful.`;
    case "anniversary":
      return `This card is being shaped into a keepsake for ${name}. ${
        relation ? `It will reflect your ${relation}.` : "It will reflect your shared history."
      } Add memories, milestones, or photos, then generate the inside message.`;
    case "friendship":
      return `This card is being built for ${name} with the kind of stories only real friends know. Add memories, jokes, and photos, then let the AI turn them into a playful inside message.`;
    case "celebration":
      return `This card is set up to celebrate ${name} with a polished, occasion-matched message. Add details and references, then generate the inside copy.`;
    case "birthday":
    default:
      return `This birthday card is ready for ${name}. Add memories, photos, and references, then let the AI generate a warm cover and inside message that feels personal rather than generic.`;
  }
}

export function buildBackNotePlaceholder(recipientName?: string | null) {
  return recipientName?.trim()
    ? `Add the private note that should sit on the back of ${recipientName}'s card. The AI leaves this part personal.`
    : "Add the private note that should sit on the back of the card. The AI leaves this part personal.";
}
