/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useTransition } from "react";

import {
  buildBackNotePlaceholder,
  buildFallbackCoverLine,
  buildFallbackInsideMessage,
  formatOccasionLabel,
  formatThemeLabel,
  getCardDesign,
  occasionOptions,
  themeOptions,
} from "@/lib/card-design";
import {
  filterStyleOptions,
  formatFilterStyleLabel,
  formatMediaPlacementLabel,
  mediaPlacementOptions,
} from "@/lib/media-presentation";

type AuthMode = "login" | "register";
type SourceKind = "note" | "link" | "instagram" | "pdf";
type NoticeTone = "neutral" | "error" | "success";

type SessionUser = { id: string; email: string; createdAt: string; updatedAt: string };
type CardMedia = {
  id: string;
  publicId: string;
  originalFilename: string | null;
  resourceType: string;
  format: string | null;
  secureUrl: string;
  bytes: number | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  placement: string;
  filterStyle: string;
  order: number;
  createdAt: string;
};
type CardSource = {
  id: string;
  kind: string;
  title: string | null;
  textContent: string | null;
  url: string | null;
  filename: string | null;
  mimeType: string | null;
  createdAt: string;
};
type CardSummary = {
  id: string;
  slug: string;
  title: string | null;
  personalizedText: string | null;
  recipientName: string | null;
  occasion: string;
  relationship: string | null;
  insideMessage: string | null;
  theme: string;
  media: CardMedia[];
  sources: CardSource[];
  createdAt: string;
  updatedAt: string;
  _count: { media: number; sources: number };
};
type SessionPayload = { user: SessionUser; cards: CardSummary[] };

const sourceKinds: Array<{ value: SourceKind; label: string }> = [
  { value: "note", label: "Memory note" },
  { value: "link", label: "Reference link" },
  { value: "instagram", label: "Instagram URL" },
  { value: "pdf", label: "PDF" },
];

const sourceHints: Record<SourceKind, string> = {
  note: "Paste memories, milestones, and inside jokes the AI should use directly.",
  link: "Paste any useful URL and explain what the AI should take from it.",
  instagram:
    "Paste the Instagram URL and add your own summary. The app stores the URL as a reference.",
  pdf: "Upload a PDF the AI should read for context before rewriting the cover and inside.",
};

function getShareUrl(slug: string) {
  const sharePath = `/card/${slug}`;
  return typeof window === "undefined" ? sharePath : `${window.location.origin}${sharePath}`;
}

function renderMediaTile(item: CardMedia, compact = false) {
  const mediaClass = compact ? "aspect-[4/3]" : "aspect-square sm:aspect-[4/3]";

  return (
    <div
      key={item.id}
      className="overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white shadow-sm"
    >
      {item.resourceType === "video" ? (
        <video
          className={`${mediaClass} w-full bg-stone-950 object-cover`}
          controls
          preload="metadata"
          src={item.secureUrl}
        />
      ) : (
        <img
          className={`${mediaClass} w-full bg-stone-100 object-cover`}
          src={item.secureUrl}
          alt={item.originalFilename || item.publicId}
        />
      )}
      <div className="px-4 py-3 text-sm text-stone-600">
        <p className="truncate">{item.originalFilename || item.publicId}</p>
        <p className="mt-1 uppercase tracking-[0.2em] text-rose-700">
          {formatMediaPlacementLabel(item.placement)} • {formatFilterStyleLabel(item.filterStyle)}
        </p>
      </div>
    </div>
  );
}

export function WorkspacePanel() {
  const [mode, setMode] = useState<AuthMode>("register");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [cards, setCards] = useState<CardSummary[]>([]);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string }>({
    tone: "neutral",
    message: "Create an account or sign in to build an AI-generated card.",
  });
  const [isPending, startTransition] = useTransition();
  const [uploadingCardId, setUploadingCardId] = useState<string | null>(null);
  const [busyCardId, setBusyCardId] = useState<string | null>(null);
  const [savingMediaId, setSavingMediaId] = useState<string | null>(null);
  const [sourceModes, setSourceModes] = useState<Record<string, SourceKind>>({});

  useEffect(() => {
    void loadSession();
  }, []);

  async function loadSession() {
    setIsCheckingSession(true);
    try {
      const response = await fetch("/api/auth/session", { method: "GET", cache: "no-store" });
      if (response.status === 401) {
        setUser(null);
        setCards([]);
        return { ok: false as const, reason: "unauthorized" as const };
      }
      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setNotice({ tone: "error", message: data.message ?? "Unable to load the workspace." });
        return { ok: false as const, reason: "error" as const };
      }
      const data = (await response.json()) as SessionPayload;
      setUser(data.user);
      setCards(data.cards);
      setNotice({
        tone: "success",
        message: `Signed in as ${data.user.email}. Front cover and inside copy can now be generated from your card briefs.`,
      });
      return { ok: true as const, user: data.user };
    } finally {
      setIsCheckingSession(false);
    }
  }

  function updateCard(nextCard: CardSummary) {
    setCards((currentCards) =>
      currentCards.map((card) => (card.id === nextCard.id ? nextCard : card)),
    );
  }

  async function handleAuthSubmit(formData: FormData) {
    const payload = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { message?: string };
    if (!response.ok) {
      setNotice({
        tone: "error",
        message: data.message ?? `${mode === "login" ? "Sign in" : "Account creation"} failed.`,
      });
      return;
    }
    const sessionResult = await loadSession();
    if (!sessionResult?.ok) {
      setNotice({
        tone: "error",
        message:
          mode === "login"
            ? "Login returned successfully, but the session did not load. Refresh the page and try again."
            : "Account was created, but the session did not load. Refresh the page and try again.",
      });
    }
  }

  async function handleCreateCard(formData: FormData) {
    const payload = {
      recipientName: String(formData.get("recipientName") ?? ""),
      occasion: String(formData.get("occasion") ?? "birthday"),
      relationship: String(formData.get("relationship") ?? ""),
      personalNote: String(formData.get("personalNote") ?? ""),
      theme: String(formData.get("theme") ?? "default"),
    };
    const response = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as CardSummary & { message?: string };
    if (!response.ok) {
      setNotice({ tone: "error", message: data.message ?? "Card creation failed." });
      return;
    }
    setCards((currentCards) => [data, ...currentCards]);
    setSourceModes((current) => ({ ...current, [data.id]: "note" }));
    setNotice({
      tone: "success",
      message: `Draft created for ${data.recipientName ?? "your recipient"}. Generate the cover and inside message when you are ready.`,
    });
  }

  async function handleUploadMedia(cardId: string, files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploadingCardId(cardId);
    try {
      const signResponse = await fetch(`/api/cards/${cardId}/media/sign`, { method: "POST" });
      const signData = (await signResponse.json()) as {
        apiKey?: string;
        folder?: string;
        timestamp?: number;
        signature?: string;
        uploadUrl?: string;
        message?: string;
      };
      if (!signResponse.ok || !signData.uploadUrl) {
        setNotice({
          tone: "error",
          message: signData.message ?? "Cloudinary is not configured yet.",
        });
        return;
      }
      const uploadFormData = new FormData();
      uploadFormData.set("file", file);
      uploadFormData.set("api_key", String(signData.apiKey));
      uploadFormData.set("timestamp", String(signData.timestamp));
      uploadFormData.set("signature", String(signData.signature));
      uploadFormData.set("folder", String(signData.folder));
      const uploadResponse = await fetch(signData.uploadUrl, {
        method: "POST",
        body: uploadFormData,
      });
      const uploadData = (await uploadResponse.json()) as Record<string, unknown> & {
        message?: string;
      };
      if (!uploadResponse.ok) {
        setNotice({
          tone: "error",
          message: uploadData.message?.toString() ?? "Upload failed.",
        });
        return;
      }
      const saveResponse = await fetch(`/api/cards/${cardId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadData),
      });
      const savedCard = (await saveResponse.json()) as CardSummary & { message?: string };
      if (!saveResponse.ok) {
        setNotice({ tone: "error", message: savedCard.message ?? "Saving media failed." });
        return;
      }
      updateCard(savedCard);
      setNotice({ tone: "success", message: `Uploaded "${file.name}".` });
    } finally {
      setUploadingCardId(null);
    }
  }

  async function handleUpdateMedia(
    cardId: string,
    mediaId: string,
    payload: { placement: string; filterStyle: string },
  ) {
    setSavingMediaId(mediaId);
    try {
      const response = await fetch(`/api/cards/${cardId}/media/${mediaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as CardSummary & { message?: string };
      if (!response.ok) {
        setNotice({ tone: "error", message: data.message ?? "Unable to update media." });
        return;
      }
      updateCard(data);
      setNotice({
        tone: "success",
        message: "Media placement and filter updated for the card layout.",
      });
    } finally {
      setSavingMediaId(null);
    }
  }

  async function handleAddSource(cardId: string, formData: FormData) {
    setBusyCardId(cardId);
    try {
      formData.set("kind", sourceModes[cardId] ?? "note");
      const response = await fetch(`/api/cards/${cardId}/sources`, {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { card?: CardSummary; message?: string };
      if (!response.ok || !data.card) {
        setNotice({ tone: "error", message: data.message ?? "Unable to save source." });
        return;
      }
      updateCard(data.card);
      setNotice({ tone: "success", message: "Source saved for the next AI pass." });
    } finally {
      setBusyCardId(null);
    }
  }

  async function handleGenerateDraft(cardId: string) {
    setBusyCardId(cardId);
    try {
      const response = await fetch(`/api/cards/${cardId}/generate`, { method: "POST" });
      const data = (await response.json()) as {
        card?: CardSummary;
        rationale?: string;
        message?: string;
      };
      if (!response.ok || !data.card) {
        setNotice({
          tone: "error",
          message:
            data.message ??
            "AI generation failed. Check your card brief, memory sources, and OpenAI configuration.",
        });
        return;
      }
      updateCard(data.card);
      setNotice({
        tone: "success",
        message: data.rationale
          ? `Card updated. ${data.rationale}`
          : "Card updated. The front cover and inside message were regenerated.",
      });
    } finally {
      setBusyCardId(null);
    }
  }

  async function handleSignOut() {
    const response = await fetch("/api/auth/session", { method: "DELETE" });
    if (!response.ok) {
      setNotice({ tone: "error", message: "Unable to sign out right now." });
      return;
    }
    setUser(null);
    setCards([]);
    setSourceModes({});
    setNotice({ tone: "neutral", message: "Signed out." });
  }

  async function handleCopyShareLink(slug: string) {
    try {
      const shareUrl = getShareUrl(slug);
      await navigator.clipboard.writeText(shareUrl);
      setNotice({ tone: "success", message: `Copied share link: ${shareUrl}` });
    } catch {
      setNotice({ tone: "error", message: "Unable to copy the share link on this browser." });
    }
  }

  function renderCard(card: CardSummary) {
    const sourceMode = sourceModes[card.id] ?? "note";
    const cardBusy = busyCardId === card.id;
    const design = getCardDesign(card.occasion, card.theme);
    const shareUrl = getShareUrl(card.slug);
    const coverLine =
      card.title?.trim() ||
      buildFallbackCoverLine({
        recipientName: card.recipientName,
        occasion: card.occasion,
      });
    const insideMessage =
      card.insideMessage?.trim() ||
      buildFallbackInsideMessage({
        recipientName: card.recipientName,
        occasion: card.occasion,
        relationship: card.relationship,
      });
    const backNote = card.personalizedText?.trim() || buildBackNotePlaceholder(card.recipientName);
    const coverMedia = card.media.find((item) => item.placement === "cover") ?? null;
    const insideFeatureMedia = card.media.find((item) => item.placement === "inside-feature") ?? null;
    const backAccentMedia = card.media.find((item) => item.placement === "back-accent") ?? null;
    const insideStripMedia = card.media.filter(
      (item) =>
        item.id !== coverMedia?.id &&
        item.id !== insideFeatureMedia?.id &&
        item.id !== backAccentMedia?.id,
    );
    const previewMedia = insideStripMedia.slice(0, 2);
    const hasGeneratedDraft = Boolean(card.title?.trim() || card.insideMessage?.trim());

    return (
      <article
        key={card.id}
        className="rounded-[2.25rem] border border-stone-200/80 bg-white/92 p-5 shadow-[0_18px_50px_rgba(84,49,28,0.10)] md:p-6"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-700">
              Card preview
            </p>
            <h4 className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">
              {card.recipientName ? `For ${card.recipientName}` : "For your recipient"}
            </h4>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              The AI writes the personalized card, while each uploaded photo can be placed on the
              cover, inside, or back and given a light style treatment.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-rose-700">
              {formatOccasionLabel(card.occasion)}
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-stone-600">
              {formatThemeLabel(card.theme)}
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-stone-600">
              {card._count.media} media
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-stone-600">
              {card._count.sources} sources
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
          <div className={`rounded-[2.1rem] p-4 ${design.frameClass}`}>
            <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
              <section
                className={`relative min-h-[22rem] overflow-hidden rounded-[2rem] p-6 ${design.frontPanelClass}`}
              >
                <div
                  className={`absolute right-[-3rem] top-[-3rem] h-32 w-32 rounded-full blur-2xl ${design.accentClass}`}
                />
                <div
                  className={`absolute bottom-6 right-6 h-16 w-16 rounded-full border border-white/20 ${design.accentClass}`}
                />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.34em]">
                        {design.coverEyebrow}
                      </p>
                      <p className={`mt-3 text-sm ${design.metaClass}`}>
                        {formatOccasionLabel(card.occasion)} card
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${design.badgeClass}`}
                    >
                      {hasGeneratedDraft ? "AI draft ready" : "Draft brief only"}
                    </span>
                  </div>

                  <div className="mt-12">
                    <p className={`text-sm ${design.mutedClass}`}>
                      {card.recipientName ? `For ${card.recipientName}` : "Recipient pending"}
                    </p>
                    <h5 className="mt-4 max-w-xs text-4xl font-semibold leading-tight tracking-[-0.04em]">
                      {coverLine}
                    </h5>
                  </div>

                  <div className="space-y-2">
                    {coverMedia ? (
                      <div className="overflow-hidden rounded-[1.5rem] border border-white/20 bg-white/10 shadow-lg">
                        {renderMediaTile(coverMedia, true)}
                      </div>
                    ) : null}
                    {card.relationship ? (
                      <p className={`text-sm ${design.mutedClass}`}>{card.relationship}</p>
                    ) : null}
                    <p className={`max-w-xs text-sm leading-6 ${design.mutedClass}`}>
                      {design.coverPrompt}
                    </p>
                  </div>
                </div>
              </section>

              <div className="grid gap-4">
                <section className={`rounded-[2rem] p-6 ${design.insidePanelClass}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-700">
                        {design.insideEyebrow}
                      </p>
                      <p className="mt-2 text-sm text-stone-500">{formatThemeLabel(card.theme)}</p>
                    </div>
                    <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-600">
                      Inside
                    </span>
                  </div>

                  <p className="mt-5 whitespace-pre-line text-sm leading-7 text-stone-700">
                    {insideMessage}
                  </p>

                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">
                      Photo placement preview
                    </p>
                    {insideFeatureMedia ? (
                      <div className="mt-3">{renderMediaTile(insideFeatureMedia, true)}</div>
                    ) : null}
                    {previewMedia.length > 0 ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {previewMedia.map((item) => renderMediaTile(item, true))}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-[1.5rem] border border-dashed border-stone-300 bg-white/70 px-4 py-5 text-sm leading-6 text-stone-500">
                        Choose photo placement after upload so the card knows what belongs on the
                        cover, inside feature, strip, or back.
                      </div>
                    )}
                  </div>
                </section>

                <section className={`rounded-[2rem] p-6 ${design.backPanelClass}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-stone-500">
                        {design.backEyebrow}
                      </p>
                      <p className="mt-2 text-sm text-stone-500">
                        This stays yours and is not rewritten by AI.
                      </p>
                    </div>
                    <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-600">
                      Back
                    </span>
                  </div>

                  <p className="mt-5 whitespace-pre-line text-sm leading-7 text-stone-700">
                    {backNote}
                  </p>
                  {backAccentMedia ? (
                    <div className="mt-4">{renderMediaTile(backAccentMedia, true)}</div>
                  ) : null}
                </section>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.9rem] bg-stone-950 p-5 text-stone-50 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-200">
                Share and generate
              </p>
              <h5 className="mt-3 text-2xl font-semibold tracking-tight">{coverLine}</h5>
              <p className="mt-3 text-sm leading-6 text-stone-300">
                Use the brief, memory sources, and placed photos together. Then regenerate until
                the card text and visual mood feel right.
              </p>

              <button
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:bg-stone-300"
                type="button"
                onClick={() => {
                  void handleGenerateDraft(card.id);
                }}
                disabled={cardBusy}
              >
                {cardBusy
                  ? "Generating..."
                  : hasGeneratedDraft
                    ? "Regenerate cover + inside"
                    : "Generate cover + inside"}
              </button>

              <label className="mt-5 block space-y-2">
                <span className="text-sm font-medium text-stone-200">Share link</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none"
                  type="text"
                  value={shareUrl}
                  readOnly
                />
              </label>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/18 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  type="button"
                  onClick={() => {
                    void handleCopyShareLink(card.slug);
                  }}
                >
                  Copy link
                </button>
                <a
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/18 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  href={`/card/${card.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open public card
                </a>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-stone-200 bg-[#fff8f1] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-stone-500">
                Card media
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Add pictures, GIFs, or short videos, then choose where each one should appear on
                the card and how lightly it should be styled.
              </p>
              <input
                className="mt-4 block w-full text-sm text-stone-700 file:mr-4 file:rounded-full file:border-0 file:bg-stone-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                type="file"
                accept="image/*,video/mp4,video/webm,image/gif"
                onChange={(event) => {
                  void handleUploadMedia(card.id, event.target.files);
                  event.currentTarget.value = "";
                }}
                disabled={uploadingCardId === card.id}
              />
            </div>

            <div className="rounded-[1.75rem] border border-stone-200 bg-[#fffaf5] p-4">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-700">
                    AI memory box
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Notes, PDFs, links, and Instagram references give the AI better material for
                    the cover and inside message. Your back note stays untouched.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-[1.5rem] bg-stone-100 p-1 md:grid-cols-4">
                  {sourceKinds.map((kind) => (
                    <button
                      key={kind.value}
                      className={`rounded-[1.2rem] px-3 py-2 text-sm font-semibold transition ${
                        sourceMode === kind.value
                          ? "bg-white text-stone-950 shadow-sm"
                          : "text-stone-600 hover:text-stone-950"
                      }`}
                      type="button"
                      onClick={() =>
                        setSourceModes((current) => ({ ...current, [card.id]: kind.value }))
                      }
                    >
                      {kind.label}
                    </button>
                  ))}
                </div>
              </div>

              <form
                className="mt-4 space-y-4"
                action={(formData) => {
                  startTransition(() => {
                    void handleAddSource(card.id, formData);
                  });
                }}
              >
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-stone-800">Source title</span>
                  <input
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-950 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                    name="title"
                    type="text"
                    placeholder="Optional label"
                    maxLength={100}
                  />
                </label>

                {sourceMode === "link" || sourceMode === "instagram" ? (
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-stone-800">URL</span>
                    <input
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-950 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                      name="url"
                      type="url"
                      placeholder={
                        sourceMode === "instagram"
                          ? "https://www.instagram.com/p/..."
                          : "https://..."
                      }
                      required
                    />
                  </label>
                ) : null}

                {sourceMode === "pdf" ? (
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-stone-800">PDF</span>
                    <input
                      className="block w-full text-sm text-stone-700 file:mr-4 file:rounded-full file:border-0 file:bg-stone-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                      name="file"
                      type="file"
                      accept="application/pdf"
                      required
                    />
                  </label>
                ) : (
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-stone-800">
                      {sourceMode === "note" ? "Memory details" : "Why this matters"}
                    </span>
                    <textarea
                      className="min-h-24 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-950 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                      name="textContent"
                      placeholder={
                        sourceMode === "note"
                          ? "Write the moments, tone, and details the AI should weave into the card."
                          : "Explain why this URL matters and what the AI should take from it."
                      }
                      maxLength={4000}
                      required={sourceMode === "note"}
                    />
                  </label>
                )}

                <p className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-stone-600">
                  {sourceHints[sourceMode]}
                </p>

                <button
                  className="inline-flex w-full items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-stone-400"
                  type="submit"
                  disabled={cardBusy}
                >
                  {cardBusy ? "Working..." : "Add source"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {card.sources.length > 0 ? (
          <div className="mt-5 rounded-[1.75rem] bg-stone-50 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-stone-500">
                  Memory directions
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  These are the details the AI uses to personalize the card.
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                {card.sources.length} saved
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              {card.sources.map((source) => (
                <div
                  key={source.id}
                  className="rounded-[1.5rem] border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-stone-900">
                        {source.title || source.filename || "Untitled source"}
                      </p>
                      <p className="mt-1 uppercase tracking-[0.2em] text-rose-700">
                        {source.kind}
                      </p>
                    </div>
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                      Added {new Date(source.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {source.url ? <p className="mt-3 break-all">{source.url}</p> : null}
                  {source.textContent ? (
                    <p className="mt-3 whitespace-pre-line leading-6">{source.textContent}</p>
                  ) : null}
                  {source.filename ? <p className="mt-3">{source.filename}</p> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {card.media.length > 0 ? (
          <div className="mt-5 rounded-[1.75rem] bg-stone-50 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-stone-500">
                  Attached media
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  These files now act as design elements for the generated card, not just
                  attachments.
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                {card.media.length} items
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {card.media.map((item) => (
                <div key={item.id} className="space-y-3">
                  {renderMediaTile(item)}
                  <form
                    className="space-y-3 rounded-[1.5rem] border border-stone-200 bg-white p-4"
                    action={(formData) => {
                      const placement = String(formData.get("placement") ?? item.placement);
                      const filterStyle = String(formData.get("filterStyle") ?? item.filterStyle);
                      startTransition(() => {
                        void handleUpdateMedia(card.id, item.id, { placement, filterStyle });
                      });
                    }}
                  >
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-stone-800">Placement</span>
                      <select
                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-950 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                        name="placement"
                        defaultValue={item.placement}
                      >
                        {mediaPlacementOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-stone-800">Light filter</span>
                      <select
                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-950 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                        name="filterStyle"
                        defaultValue={item.filterStyle}
                      >
                        {filterStyleOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      className="inline-flex w-full items-center justify-center rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-stone-400"
                      type="submit"
                      disabled={savingMediaId === item.id}
                    >
                      {savingMediaId === item.id ? "Saving..." : "Apply placement + filter"}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <section className="rounded-[2rem] border border-white/40 bg-white/78 p-6 shadow-[0_30px_80px_rgba(76,31,23,0.15)] backdrop-blur md:p-8">
      {isCheckingSession ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rose-700">
            Workspace access
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-stone-900">
            Checking your session
          </h2>
          <p className="text-sm leading-6 text-stone-600">
            Loading the current creator workspace and any card drafts already attached to it.
          </p>
        </div>
      ) : user ? (
        <div className="space-y-8">
          <div className="rounded-[1.85rem] bg-stone-950 p-6 text-stone-50">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-200">
                  AI card studio
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">{user.email}</h2>
              </div>
              <button
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                type="button"
                onClick={() => {
                  startTransition(() => {
                    void handleSignOut();
                  });
                }}
                disabled={isPending}
              >
                {isPending ? "Working..." : "Sign out"}
              </button>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-300">
              Build the brief here, let AI draft the personalized card, place each photo where
              you want it on the layout, and keep your private note on the back.
            </p>
          </div>

          <form
            className="space-y-5 rounded-[1.9rem] border border-stone-200 bg-[linear-gradient(160deg,#fff8f2,#fffdf9_55%,#f9ece6)] p-5"
            action={(formData) => {
              startTransition(() => {
                void handleCreateCard(formData);
              });
            }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-700">
                Start a new card
              </p>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                Give the AI the basics first
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                The front cover and inside message are generated. Your personal note stays on the
                back of the card.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-800">Recipient name</span>
                <input
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-950 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                  name="recipientName"
                  type="text"
                  placeholder="Ollie"
                  maxLength={80}
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-800">Occasion</span>
                <select
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-950 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                  name="occasion"
                  defaultValue="birthday"
                >
                  {occasionOptions.map((occasion) => (
                    <option key={occasion.value} value={occasion.value}>
                      {occasion.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-800">Relationship</span>
                <input
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-950 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                  name="relationship"
                  type="text"
                  placeholder="Boyfriend, sister, best friend"
                  maxLength={80}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-800">Visual direction</span>
                <select
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-950 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                  name="theme"
                  defaultValue="default"
                >
                  {themeOptions.map((theme) => (
                    <option key={theme.value} value={theme.value}>
                      {theme.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-800">Back note</span>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-950 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                name="personalNote"
                placeholder="Write the private note that should appear on the back of the card."
                maxLength={800}
              />
            </label>

            <button
              className="inline-flex w-full items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-stone-400"
              type="submit"
              disabled={isPending}
            >
              {isPending ? "Creating card brief..." : "Create card brief"}
            </button>
          </form>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-stone-500">
                Your cards
              </p>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                Drafts, previews, and share links
              </h3>
            </div>
            {cards.length === 0 ? (
              <div className="rounded-[1.75rem] bg-stone-100 px-5 py-4 text-sm leading-6 text-stone-600">
                No cards yet. Start with a card brief above, then generate the cover and inside.
              </div>
            ) : (
              <div className="space-y-5">{cards.map(renderCard)}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rose-700">
              Workspace access
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-stone-900">
              Create an account or sign in
            </h2>
            <p className="max-w-md text-sm leading-6 text-stone-600">
              This workspace builds actual shareable cards: AI handles the front and inside,
              while your private note stays on the back.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-full bg-stone-100 p-1">
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "register"
                  ? "bg-white text-stone-950 shadow-sm"
                  : "text-stone-600 hover:text-stone-950"
              }`}
              type="button"
              onClick={() => setMode("register")}
            >
              Create account
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-white text-stone-950 shadow-sm"
                  : "text-stone-600 hover:text-stone-950"
              }`}
              type="button"
              onClick={() => setMode("login")}
            >
              Sign in
            </button>
          </div>

          <form
            className="space-y-4"
            action={(formData) => {
              startTransition(() => {
                void handleAuthSubmit(formData);
              });
            }}
          >
            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-800">Email</span>
              <input
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-950 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-800">Password</span>
              <input
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-950 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                name="password"
                type="password"
                placeholder={
                  mode === "login" ? "Your secure password" : "Use at least 8 characters"
                }
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
            </label>

            <button
              className="inline-flex w-full items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-stone-400"
              type="submit"
              disabled={isPending}
            >
              {isPending
                ? mode === "login"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          <div className="rounded-[1.75rem] bg-[#fff7ef] px-5 py-4 text-sm leading-6 text-stone-600">
            <p className="font-semibold text-stone-900">Current workspace flow</p>
            <p className="mt-2">
              Create a card brief, add memories or media, generate the cover and inside, then
              share the finished public card by slug.
            </p>
          </div>
        </div>
      )}

      <div
        className={`mt-5 rounded-2xl px-4 py-3 text-sm ${
          notice.tone === "error"
            ? "bg-red-50 text-red-700"
            : notice.tone === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-stone-100 text-stone-600"
        }`}
      >
        {notice.message}
      </div>
    </section>
  );
}
