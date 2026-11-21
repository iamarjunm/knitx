"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Layers,
  Scissors,
  Sparkles,
  Tag,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { CreatorSubmissionItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface V2CreatorTagLabProps {
  initialSubmissions: CreatorSubmissionItem[];
}

const CATEGORIES = [
  "Small-Batch Hoodie",
  "Small-Batch Tee",
  "1-of-1 Outerwear",
  "1-of-1 Knitwear",
  "Utility Trouser",
] as const;

const CRAFT_SPECS = [
  "450 GSM Loopback",
  "High-Density Puff",
  "Ari Chain-Stitch",
  "Hand-Distressed",
  "Raw Khadi Panel",
  "Engraved Steel Plate",
] as const;

const VISUAL_PRESETS = [
  {
    id: "hoodie",
    label: "Boxy Hoodie",
    src: "/images/look-batch-hoodie.jpg",
  },
  {
    id: "tee",
    label: "Heavy Tee",
    src: "/images/look-batch-tee.jpg",
  },
  {
    id: "jacket",
    label: "1-of-1 Bomber",
    src: "/images/look-1of1-jacket.jpg",
  },
  {
    id: "knit",
    label: "Raw Knitwear",
    src: "/images/look-1of1-knit.jpg",
  },
] as const;

interface DissectPin {
  id: string;
  num: string;
  label: string;
  metric: string;
  headline: string;
  description: string;
  specs: string[];
  xPercent: number;
  yPercent: number;
}

const DISSECT_PINS: DissectPin[] = [
  {
    id: "gsm",
    num: "01",
    label: "450 GSM LOOPBACK",
    metric: "450 GSM · COMBED INDIAN COTTON",
    headline: "Architectural weight that holds its own geometry.",
    description:
      "Knitted on slow-gauge circular mills using long-staple Indian cotton. Dense enough to sculpt a boxy silhouette right off the hanger without synthetic stiffness.",
    specs: [
      "100% ring-spun diagonal loopback terry",
      "Enzyme pre-shrunk for zero wash distortion",
      "Heavy 2x2 ribbed cuffs & structured hem",
    ],
    xPercent: 27,
    yPercent: 34,
  },
  {
    id: "craft",
    num: "02",
    label: "PUFF & CHAIN-STITCH",
    metric: "MULTI-PASS INK · HAND ARI THREAD",
    headline: "Tactile relief you feel before you read it.",
    description:
      "Every graphic is engineered either with 4-pass high-density matte puff ink or artisanal Ari chain-stitching executed by master karigars across India.",
    specs: [
      "3D raised puff cured for crack-resistant flex",
      "Hand-guided chain-stitch typographic detailing",
      "Individually inspected under daylight lamps",
    ],
    xPercent: 52,
    yPercent: 52,
  },
  {
    id: "tag",
    num: "03",
    label: "NUMBERED 01/04 TAG",
    metric: "RAW HERRINGBONE · BAR-TACKED",
    headline: "Permanent provenance stitched at the collar.",
    description:
      "Every garment receives a raw unbleached cotton woven label bearing its exact micro-batch serial number and the community designer handle — never reprinted.",
    specs: [
      "Hand-numbered 01/04 or 01/01 archive edition",
      "Woven co-credit with community creator handle",
      "Quadruple bar-tack corner stitch reinforcement",
    ],
    xPercent: 64,
    yPercent: 22,
  },
  {
    id: "sample-first",
    num: "04",
    label: "CUT AFTER YOU CLAIM",
    metric: "1 MASTER SAMPLE · 0% DEADSTOCK",
    headline: "Zero warehouse dust. Zero overproduction.",
    description:
      "We cut and sew a single physical sample to test drape, wash, and photography. The remaining 3 to 4 units enter production only after waitlist collectors claim them.",
    specs: [
      "1 master prototype photographed in daylight",
      "5–14 day bespoke cut-and-sew dispatch window",
      "Pattern permanently retired once drop closes",
    ],
    xPercent: 72,
    yPercent: 73,
  },
];

function formatSubmissionStatus(status: CreatorSubmissionItem["status"]): {
  label: string;
  tone: "klein" | "red" | "neutral";
} {
  if (status === "selected") {
    return { label: "SELECTED FOR CUT", tone: "klein" };
  }
  if (status === "approved_for_vote") {
    return { label: "IN DROP 02 VOTE", tone: "red" };
  }
  return { label: "ATELIER REVIEW", tone: "neutral" };
}

export default function V2CreatorTagLab({
  initialSubmissions,
}: V2CreatorTagLabProps) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Module A: Woven Neck Tag Form state
  const [submissions, setSubmissions] =
    useState<CreatorSubmissionItem[]>(initialSubmissions);
  const [title, setTitle] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [creatorHandle, setCreatorHandle] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([
    "450 GSM Loopback",
    "High-Density Puff",
  ]);
  const [notes, setNotes] = useState("");
  const [presetSrc, setPresetSrc] = useState<string>(VISUAL_PRESETS[0].src);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedReceipt, setSubmittedReceipt] = useState<{
    title: string;
    handle: string;
  } | null>(null);

  // Module B: Dissect a Garment interactive pins state
  const [activePinId, setActivePinId] = useState<string>(DISSECT_PINS[0].id);
  const [studioView, setStudioView] = useState<"prototype" | "atelier">(
    "prototype"
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    setCreatorName((prev) => prev || user.displayName || "");
    setEmail((prev) => prev || user.email || "");
  }, [mounted, user]);

  const normalizedHandle = useMemo(() => {
    const trimmed = creatorHandle.trim();
    if (!trimmed) return "@YOURHANDLE";
    const cleaned = trimmed.replace(/\s+/g, "");
    return cleaned.startsWith("@")
      ? cleaned.toUpperCase()
      : `@${cleaned.toUpperCase()}`;
  }, [creatorHandle]);

  const displayTitle = useMemo(() => {
    const t = title.trim();
    return t ? t.toUpperCase() : "MONOLITH RAW SHELL";
  }, [title]);

  const isOneOfOneCategory = category.toLowerCase().includes("1-of-1");

  const activePin = useMemo(
    () => DISSECT_PINS.find((p) => p.id === activePinId) ?? DISSECT_PINS[0],
    [activePinId]
  );

  function toggleCraftSpec(spec: string) {
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((item) => item !== spec) : [...prev, spec]
    );
  }

  async function handleSubmitConcept(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);
    setSubmittedReceipt(null);

    const cleanTitle = title.trim();
    const cleanName = creatorName.trim();
    const combinedNotes = [
      selectedSpecs.length > 0 ? `Specs: ${selectedSpecs.join(", ")}.` : "",
      notes.trim(),
    ]
      .filter(Boolean)
      .join(" ");

    if (!cleanTitle) {
      setSubmitError("Enter a piece title to weave onto your neck label.");
      return;
    }
    if (!cleanName) {
      setSubmitError("Enter your name so we can credit your design.");
      return;
    }
    if (!combinedNotes) {
      setSubmitError("Select at least one craft spec or add construction notes.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          creatorName: cleanName,
          creatorHandle: creatorHandle.trim() || cleanName,
          email: email.trim(),
          category,
          craftsmanshipNotes: combinedNotes,
          imageUrl: presetSrc,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        submission?: CreatorSubmissionItem;
      };

      const created = data.submission;
      if (!res.ok || !data.ok || !created) {
        throw new Error(data.error || "Unable to submit design right now.");
      }

      setSubmissions((prev) => [created, ...prev]);
      setSubmittedReceipt({
        title: created.title,
        handle: created.creatorHandle,
      });
      setTitle("");
      setNotes("");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not submit your concept."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* ================================================================ */}
      {/* MODULE A: LIVE WOVEN NECK TAG CREATOR STUDIO                     */}
      {/* ================================================================ */}
      <section
        id="tag-lab"
        className="relative border-y border-ink/10 bg-linen py-24 text-ink"
      >
        <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
          {/* Header */}
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2.5 rounded-full border border-ink/10 bg-white/85 px-3.5 py-1.5">
                <Tag className="h-3 w-3 text-klein" />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
                  ROOM 05 · OPEN CREATOR BENCH
                </span>
              </div>
              <h2 className="font-syne text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-[3.4rem] lg:leading-[1.02]">
                Put your name on{" "}
                <span className="font-editorial font-normal italic text-klein">
                  the neck tag.
                </span>
              </h2>
            </div>

            <p className="max-w-md text-sm leading-relaxed text-muted sm:text-[15px]">
              Pitch a silhouette for Drop 02. Winning community designs enter
              production in India with your handle permanently woven into every
              cotton neck label.
            </p>
          </div>

          {/* 12-Col Creator Bench: Form + Live Macro Woven Cotton Tag */}
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            {/* LEFT (7 COLS): Minimalist White Studio Form */}
            <div className="lg:col-span-7">
              <form
                onSubmit={handleSubmitConcept}
                className="rounded-[28px] border border-ink/10 bg-white p-7 shadow-[0_24px_60px_-32px_rgba(14,14,14,0.1)] sm:p-9"
              >
                <div className="mb-6 flex items-center justify-between border-b border-ink/8 pb-4">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-klein">
                    DESIGN BRIEF · DROP 02 CANDIDATE
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                    LIVE LABEL SYNC ON
                  </span>
                </div>

                <div className="space-y-5">
                  {/* Piece Title */}
                  <div>
                    <label
                      htmlFor="v2-tag-title"
                      className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
                    >
                      Piece Title
                    </label>
                    <input
                      id="v2-tag-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. STEPWELL RAW LOOPBACK HOODIE"
                      className="w-full rounded-2xl border border-ink/12 bg-porcelain px-4 py-3 text-sm text-ink placeholder:text-muted/55 transition-colors focus:border-klein focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Name + Handle + Email */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label
                        htmlFor="v2-tag-name"
                        className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
                      >
                        Your Name
                      </label>
                      <input
                        id="v2-tag-name"
                        type="text"
                        value={creatorName}
                        onChange={(e) => setCreatorName(e.target.value)}
                        placeholder="Meera Nair"
                        className="w-full rounded-2xl border border-ink/12 bg-porcelain px-4 py-3 text-sm text-ink placeholder:text-muted/55 transition-colors focus:border-klein focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="v2-tag-handle"
                        className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
                      >
                        Handle
                      </label>
                      <input
                        id="v2-tag-handle"
                        type="text"
                        value={creatorHandle}
                        onChange={(e) => setCreatorHandle(e.target.value)}
                        placeholder="@yourhandle"
                        className="w-full rounded-2xl border border-ink/12 bg-porcelain px-4 py-3 font-mono text-sm text-ink placeholder:text-muted/55 transition-colors focus:border-klein focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="v2-tag-email"
                        className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
                      >
                        Email
                      </label>
                      <input
                        id="v2-tag-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="studio@domain.in"
                        className="w-full rounded-2xl border border-ink/12 bg-porcelain px-4 py-3 text-sm text-ink placeholder:text-muted/55 transition-colors focus:border-klein focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Silhouette Category */}
                  <div>
                    <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                      Silhouette Category
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => {
                        const active = category === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={cn(
                              "rounded-full border px-3.5 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] transition-all",
                              active
                                ? cat.includes("1-of-1")
                                  ? "border-archive-red bg-archive-red text-white"
                                  : "border-klein bg-klein text-white"
                                : "border-ink/12 bg-porcelain text-ink/80 hover:border-ink/30"
                            )}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Craftsmanship Toggles */}
                  <div>
                    <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                      Craftsmanship Spec Toggles
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {CRAFT_SPECS.map((spec) => {
                        const selected = selectedSpecs.includes(spec);
                        return (
                          <button
                            key={spec}
                            type="button"
                            onClick={() => toggleCraftSpec(spec)}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.13em] transition-colors",
                              selected
                                ? "border-klein/35 bg-klein/[0.08] text-klein"
                                : "border-ink/12 bg-white text-muted hover:border-ink/25 hover:text-ink"
                            )}
                          >
                            {selected && <Check className="h-3 w-3" />}
                            <span>{spec}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label
                      htmlFor="v2-tag-notes"
                      className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
                    >
                      Construction &amp; Finish Notes
                    </label>
                    <textarea
                      id="v2-tag-notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Describe drape, wash patina, seam lines, or graphic placement..."
                      className="w-full resize-none rounded-2xl border border-ink/12 bg-porcelain px-4 py-3 text-sm text-ink placeholder:text-muted/55 transition-colors focus:border-klein focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Preset Silhouette Visual Picker */}
                  <div>
                    <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                      Base Reference Silhouette
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {VISUAL_PRESETS.map((preset) => {
                        const active = presetSrc === preset.src;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setPresetSrc(preset.src)}
                            className={cn(
                              "group relative overflow-hidden rounded-2xl border p-1.5 text-left transition-all",
                              active
                                ? "border-klein bg-klein/[0.05] shadow-sm"
                                : "border-ink/10 bg-porcelain hover:border-ink/25"
                            )}
                          >
                            <div className="relative h-20 w-full overflow-hidden rounded-xl bg-linen">
                              <Image
                                src={preset.src}
                                alt={preset.label}
                                fill
                                sizes="140px"
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              {active && (
                                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-klein text-white shadow">
                                  <Check className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                            <p className="mt-1.5 px-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink">
                              {preset.label}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {submitError && (
                    <p className="rounded-2xl border border-archive-red/20 bg-archive-red/5 px-4 py-2.5 text-xs text-archive-red">
                      {submitError}
                    </p>
                  )}

                  {submittedReceipt && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2.5 rounded-2xl border border-klein/20 bg-klein/[0.06] px-4 py-3 text-xs text-klein"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-mono font-bold uppercase tracking-[0.14em]">
                          LABEL ARCHIVED · {submittedReceipt.title}
                        </p>
                        <p className="mt-0.5 text-ink/80">
                          Added to the live studio review board under{" "}
                          {submittedReceipt.handle}.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-klein px-7 py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_14px_30px_-10px_rgba(0,43,255,0.45)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      <span>
                        {submitting
                          ? "WEAVING SUBMISSION..."
                          : "SUBMIT CONCEPT FOR DROP 02"}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* RIGHT (5 COLS): Real-Time Macro Woven Cotton Neck Label Preview */}
            <div className="lg:sticky lg:top-24 lg:col-span-5">
              <div className="overflow-hidden rounded-[28px] border border-ink/10 bg-white p-6 shadow-[0_24px_60px_-32px_rgba(14,14,14,0.12)] sm:p-7">
                <div className="mb-5 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
                    LIVE MACRO LABEL PROOF
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-porcelain px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-ink">
                    <Sparkles className="h-2.5 w-2.5 text-klein" />
                    RAW COTTON WEAVE
                  </span>
                </div>

                {/* Macro Garment Backing Fabric Canvas */}
                <div
                  className="relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-3xl border border-ink/10 p-6 sm:p-9"
                  style={{
                    backgroundColor: "#E8E4DC",
                    backgroundImage:
                      "repeating-linear-gradient(45deg, rgba(14,14,14,0.03) 0px, rgba(14,14,14,0.03) 2px, transparent 2px, transparent 6px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 2px, transparent 2px, transparent 6px)",
                  }}
                >
                  {/* Curved collar stitch line above label */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-5 border-b border-dashed border-ink/18"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-6.5 border-b border-dashed border-ink/10"
                  />

                  {/* Physical Off-White Raw Herringbone Cotton Woven Neck Tag */}
                  <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                    className="relative w-full max-w-[330px] rounded-[4px] border border-[#D4CCB9] px-6 py-6 shadow-[0_18px_36px_-18px_rgba(14,14,14,0.32),0_2px_4px_rgba(14,14,14,0.08)]"
                    style={{
                      backgroundColor: "#F6F2E8",
                      backgroundImage:
                        "repeating-linear-gradient(135deg, rgba(120,108,86,0.06) 0px, rgba(120,108,86,0.06) 3px, transparent 3px, transparent 6px), repeating-linear-gradient(45deg, rgba(255,255,255,0.45) 0px, rgba(255,255,255,0.45) 3px, transparent 3px, transparent 6px)",
                    }}
                  >
                    {/* 4 Corner Bar-Tack Stitches */}
                    <span
                      aria-hidden="true"
                      className="absolute left-2.5 top-2.5 h-[2.5px] w-4 rounded-full bg-ink/85 shadow-[0_1px_0_rgba(255,255,255,0.7)]"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute right-2.5 top-2.5 h-[2.5px] w-4 rounded-full bg-ink/85 shadow-[0_1px_0_rgba(255,255,255,0.7)]"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute bottom-2.5 left-2.5 h-[2.5px] w-4 rounded-full bg-ink/85 shadow-[0_1px_0_rgba(255,255,255,0.7)]"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute bottom-2.5 right-2.5 h-[2.5px] w-4 rounded-full bg-ink/85 shadow-[0_1px_0_rgba(255,255,255,0.7)]"
                    />

                    {/* Subtle woven top selvedge seam */}
                    <div
                      aria-hidden="true"
                      className="mb-4 border-b border-ink/15 pb-3 text-center"
                    >
                      <p className="font-mono text-[10px] font-bold tracking-[0.22em] text-ink">
                        KNITX<span className="text-klein">®</span> ×{" "}
                        <span className="text-klein">{normalizedHandle}</span>
                      </p>
                    </div>

                    {/* Live Piece Title Woven Center */}
                    <div className="my-4 text-center">
                      <p className="break-words font-syne text-base font-extrabold uppercase leading-tight tracking-[0.06em] text-ink/90 sm:text-[17px]">
                        {displayTitle}
                      </p>
                      <p className="mt-1.5 font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted">
                        {category.toUpperCase()}
                      </p>
                    </div>

                    {/* Edition Number Stamp */}
                    <div className="my-4 flex items-center justify-center">
                      <span
                        className={cn(
                          "rounded-sm border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.24em]",
                          isOneOfOneCategory
                            ? "border-archive-red/40 bg-archive-red/[0.06] text-archive-red"
                            : "border-klein/35 bg-klein/[0.06] text-klein"
                        )}
                      >
                        {isOneOfOneCategory
                          ? "EDITION 01/01 · ARCHIVE"
                          : "EDITION 01/04 · SMALL BATCH"}
                      </span>
                    </div>

                    {/* Active Craftsmanship Specs */}
                    <div className="border-y border-ink/12 py-2.5 text-center">
                      <p className="font-mono text-[9px] leading-relaxed uppercase tracking-[0.16em] text-ink/75">
                        {selectedSpecs.length > 0
                          ? selectedSpecs.slice(0, 3).join(" · ")
                          : "CUSTOM ATELIER CONSTRUCTION"}
                      </p>
                    </div>

                    {/* Provenance Bottom Line */}
                    <div className="mt-3.5 flex items-center justify-between font-mono text-[8.5px] font-semibold uppercase tracking-[0.2em] text-muted">
                      <span>MADE IN INDIA</span>
                      <span>ZERO DEADSTOCK</span>
                    </div>
                  </motion.div>
                </div>

                {/* Selected Reference Footer */}
                <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-ink/8 bg-porcelain px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-ink/10 bg-linen">
                      <Image
                        src={presetSrc}
                        alt="Selected silhouette reference"
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted">
                        SELECTED SILHOUETTE
                      </p>
                      <p className="text-xs font-semibold text-ink">
                        {category}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-klein">
                    CO-CREDIT ACTIVE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Community Submissions Strip */}
          <div className="mt-14">
            <div className="mb-5 flex items-center justify-between">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
                RECENT COMMUNITY SUBMISSIONS · DROP 02 ARCHIVE
              </p>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink">
                {submissions.length} CONCEPTS ON THE BENCH
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {submissions.slice(0, 4).map((sub) => {
                const badge = formatSubmissionStatus(sub.status);
                return (
                  <motion.div
                    key={sub._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col justify-between rounded-2xl border border-ink/10 bg-white p-4 shadow-[0_12px_30px_-22px_rgba(14,14,14,0.12)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-ink/10 bg-linen">
                        <Image
                          src={sub.imageUrl || "/images/look-batch-hoodie.jpg"}
                          alt={sub.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-syne text-xs font-bold tracking-tight text-ink">
                          {sub.title}
                        </p>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-muted">
                          {sub.creatorHandle} · {sub.category}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">
                      {sub.craftsmanshipNotes}
                    </p>

                    <div className="mt-3.5 border-t border-ink/8 pt-2.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em]",
                          badge.tone === "klein" &&
                            "bg-klein/10 text-klein",
                          badge.tone === "red" &&
                            "bg-archive-red/10 text-archive-red",
                          badge.tone === "neutral" &&
                            "bg-linen text-muted"
                        )}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* MODULE B: INTERACTIVE "DISSECT A GARMENT" SAMPLE-FIRST VIEW      */}
      {/* ================================================================ */}
      <section
        id="dissect"
        className="relative bg-porcelain py-24 text-ink"
      >
        <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
          {/* Header */}
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2.5 rounded-full border border-ink/10 bg-white px-3.5 py-1.5">
                <Scissors className="h-3 w-3 text-klein" />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
                  ROOM 06 · SAMPLE-FIRST GARMENT ANATOMY
                </span>
              </div>
              <h2 className="font-syne text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-[3.4rem] lg:leading-[1.02]">
                One sample for{" "}
                <span className="font-editorial font-normal italic text-klein">
                  the camera.
                </span>{" "}
                Zero deadstock.
              </h2>
            </div>

            {/* Subtle Studio Lens Switcher */}
            <div className="inline-flex items-center gap-1 self-start rounded-full border border-ink/10 bg-white p-1 md:self-auto">
              <button
                type="button"
                onClick={() => setStudioView("prototype")}
                className={cn(
                  "rounded-full px-3.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors",
                  studioView === "prototype"
                    ? "bg-klein text-white"
                    : "text-muted hover:text-ink"
                )}
              >
                GARMENT SAMPLE
              </button>
              <button
                type="button"
                onClick={() => setStudioView("atelier")}
                className={cn(
                  "rounded-full px-3.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors",
                  studioView === "atelier"
                    ? "bg-klein text-white"
                    : "text-muted hover:text-ink"
                )}
              >
                ATELIER BENCH
              </button>
            </div>
          </div>

          {/* 12-Col Exploded Callout Frame + Expanding Drafting Spec Card */}
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
            {/* LEFT (8 COLS): Studio Frame with 4 Pulsing Klein-Blue Architectural Callout Pins */}
            <div className="lg:col-span-8">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] border border-ink/10 bg-linen shadow-[0_30px_80px_-36px_rgba(14,14,14,0.16)] sm:aspect-[16/11]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={studioView}
                    initial={{ opacity: 0.4, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0.4 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="relative h-full w-full"
                  >
                    <Image
                      src={
                        studioView === "prototype"
                          ? "/images/look-batch-hoodie.jpg"
                          : "/images/atelier-daylight.jpg"
                      }
                      alt="KNITX Sample-First Garment Prototype"
                      fill
                      sizes="(max-width: 1024px) 100vw, 880px"
                      className="object-cover"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Delicate architectural drafting reticle corners */}
                <div className="pointer-events-none absolute inset-4 rounded-2xl border border-white/25" />
                <div className="pointer-events-none absolute left-6 top-6 rounded-full border border-white/30 bg-white/85 px-3 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.18em] text-ink backdrop-blur-md">
                  CLICK ANY PIN TO DISSECT
                </div>

                {/* 4 Pulsing Klein-Blue Callout Pins */}
                {DISSECT_PINS.map((pin) => {
                  const isActive = pin.id === activePin.id;
                  return (
                    <button
                      key={pin.id}
                      type="button"
                      onClick={() => setActivePinId(pin.id)}
                      style={{
                        left: `${pin.xPercent}%`,
                        top: `${pin.yPercent}%`,
                      }}
                      aria-label={`Inspect ${pin.num} ${pin.label}`}
                      aria-pressed={isActive}
                      className="group absolute z-20 -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                    >
                      <span className="relative flex items-center gap-2">
                        {/* Pulsing Aura */}
                        <span
                          className={cn(
                            "absolute -inset-2 rounded-full bg-klein/35 transition-opacity",
                            isActive
                              ? "animate-ping opacity-75"
                              : "opacity-40 group-hover:opacity-75"
                          )}
                        />
                        {/* Pin Core */}
                        <span
                          className={cn(
                            "relative flex h-9 w-9 items-center justify-center rounded-full border-2 font-mono text-[10px] font-bold shadow-lg transition-transform",
                            isActive
                              ? "scale-110 border-white bg-klein text-white"
                              : "border-white bg-white/95 text-klein group-hover:scale-105"
                          )}
                        >
                          {pin.num}
                        </span>

                        {/* Crisp Architectural Tag on Desktop */}
                        <span
                          className={cn(
                            "hidden whitespace-nowrap rounded-full border px-3 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] shadow-md backdrop-blur-md transition-all sm:inline-flex",
                            isActive
                              ? "border-klein bg-klein text-white"
                              : "border-white/50 bg-white/90 text-ink group-hover:border-klein/40"
                          )}
                        >
                          {pin.label}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT (4 COLS): Expanding Drafting Spec Card */}
            <div className="flex flex-col justify-between rounded-[28px] border border-ink/10 bg-white p-7 shadow-[0_24px_60px_-32px_rgba(14,14,14,0.1)] sm:p-8 lg:col-span-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePin.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-1 flex-col"
                >
                  <div className="flex items-center justify-between border-b border-ink/8 pb-4">
                    <span className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-klein">
                      <Layers className="h-3.5 w-3.5" />
                      SPEC {activePin.num} · 04
                    </span>
                    <span className="rounded-full bg-porcelain px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.15em] text-muted">
                      {activePin.label}
                    </span>
                  </div>

                  <p className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-klein">
                    {activePin.metric}
                  </p>

                  <h3 className="mt-2 font-syne text-2xl font-bold leading-snug tracking-tight text-ink">
                    {activePin.headline}
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {activePin.description}
                  </p>

                  <ul className="mt-6 space-y-2.5 border-t border-ink/8 pt-5">
                    {activePin.specs.map((spec) => (
                      <li
                        key={spec}
                        className="flex items-start gap-2.5 text-xs leading-relaxed text-ink/85"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-klein" />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>

              {/* Quick Pin Stepper */}
              <div className="mt-8 border-t border-ink/8 pt-5">
                <p className="mb-2.5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted">
                  CALLOUT INDEX
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {DISSECT_PINS.map((pin) => {
                    const active = pin.id === activePin.id;
                    return (
                      <button
                        key={pin.id}
                        type="button"
                        onClick={() => setActivePinId(pin.id)}
                        className={cn(
                          "rounded-xl border py-2 font-mono text-[11px] font-bold transition-all",
                          active
                            ? "border-klein bg-klein text-white shadow-sm"
                            : "border-ink/10 bg-porcelain text-muted hover:border-ink/25 hover:text-ink"
                        )}
                      >
                        {pin.num}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
