"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Minus, Plus } from "lucide-react";
import type { CreatorSubmissionItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface V5AtelierFolioProps {
  initialSubmissions: CreatorSubmissionItem[];
}

interface CraftChapter {
  index: string;
  title: string;
  heading: string;
  body: string;
  specLabel: string;
  specValue: string;
  plateCode: string;
  plateCaption: string;
  imageUrl: string;
}

const CRAFT_CHAPTERS: readonly CraftChapter[] = [
  {
    index: "01",
    title: "01 — One Sample for the Lens",
    heading: "Ten archive prototypes before a single order opens.",
    body: "Before an exhibition launches, KNITX produces only one physical master sample per silhouette—photographed under natural daylight so collectors examine true drape, seam weight, and stitch architecture without speculative bulk inventory.",
    specLabel: "PRE-LAUNCH STUDIO RUN",
    specValue: "10 SAMPLES TOTAL · ZERO MASS STOCK",
    plateCode: "FIG. 01",
    plateCaption: "DAYLIGHT ATELIER ARCHIVE · INDIA",
    imageUrl: "/images/atelier-daylight.jpg",
  },
  {
    index: "02",
    title: "02 — Heavyweight Indian Cotton",
    heading: "460–520 GSM architectural loopback & combed jersey.",
    body: "Every silhouette is milled exclusively with partner Indian knit houses using dense, dry-hand combed cotton fleece and raw slub yarns—engineered to hold sculptural shoulders and develop quiet patina across decades of wear.",
    specLabel: "TEXTILE PROVENANCE",
    specValue: "460–520 GSM · 100% INDIAN COTTON",
    plateCode: "FIG. 02",
    plateCaption: "HEAVYWEIGHT LOOPBACK STUDY · SMALL-BATCH",
    imageUrl: "/images/look-batch-hoodie.jpg",
  },
  {
    index: "03",
    title: "03 — Hand-Numbered Micro Editions",
    heading: "Three to four small-batch pieces. Two singular 1-of-1s.",
    body: "Each edition carries an interior cotton credit plate hand-stamped with its permanent serial number and collaborating designer credit. Once claimed inside the private gallery, patterns are sealed in the archive forever.",
    specLabel: "EDITION CEILING",
    specValue: "03–04 SMALL-BATCH · 01/01 COLLECTOR",
    plateCode: "FIG. 03",
    plateCaption: "ARCHIVAL OUTERWEAR · SERIAL 01/01",
    imageUrl: "/images/look-1of1-jacket.jpg",
  },
  {
    index: "04",
    title: "04 — Zero Deadstock Production",
    heading: "Cut, finished, and inspected strictly after your claim.",
    body: "Only claimed garments enter the cutting room. Within 10 to 14 days of gallery admission, each numbered garment is tailored to order, hand-finished with puff embroidery or raw brushwork, and dispatched insured across India.",
    specLabel: "WASTE LEDGER",
    specValue: "0.0% DEADSTOCK · CUT ON CLAIM",
    plateCode: "FIG. 04",
    plateCaption: "OPEN-GAUGE ARCHIVE KNIT · MADE TO ORDER",
    imageUrl: "/images/look-1of1-knit.jpg",
  },
] as const;

interface SilhouettePreset {
  id: string;
  label: string;
  categoryValue: string;
  editionStamp: string;
  imageUrl: string;
  shortTag: string;
}

const SILHOUETTE_PRESETS: readonly SilhouettePreset[] = [
  {
    id: "hoodie",
    label: "Heavyweight Hoodie",
    categoryValue: "Small-Batch · Heavyweight Hoodie",
    editionStamp: "EDITION 01/04",
    imageUrl: "/images/look-batch-hoodie.jpg",
    shortTag: "Small-Batch",
  },
  {
    id: "tee",
    label: "Boxy Graphic Tee",
    categoryValue: "Small-Batch · Boxy Graphic Tee",
    editionStamp: "EDITION 01/04",
    imageUrl: "/images/look-batch-tee.jpg",
    shortTag: "Small-Batch",
  },
  {
    id: "jacket",
    label: "1-of-1 Archive Jacket",
    categoryValue: "One-of-One · Archive Jacket",
    editionStamp: "EDITION 01/01",
    imageUrl: "/images/look-1of1-jacket.jpg",
    shortTag: "1-of-1",
  },
  {
    id: "knit",
    label: "Distressed Knit",
    categoryValue: "One-of-One · Distressed Knit",
    editionStamp: "EDITION 01/01",
    imageUrl: "/images/look-1of1-knit.jpg",
    shortTag: "1-of-1",
  },
] as const;

function getSubmissionStatusLabel(status: CreatorSubmissionItem["status"]): {
  label: string;
  tone: string;
} {
  switch (status) {
    case "selected":
      return {
        label: "Selected for Sample",
        tone: "border-terracotta/40 bg-terracotta/10 text-terracotta",
      };
    case "approved_for_vote":
      return {
        label: "Drop 02 Ballot",
        tone: "border-umber/25 bg-plaster text-umber",
      };
    default:
      return {
        label: "Under Review",
        tone: "border-champagne bg-plaster text-muted",
      };
  }
}

export default function V5AtelierFolio({
  initialSubmissions,
}: V5AtelierFolioProps) {
  // Part 1: Craft Accordion State
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);

  // Part 2: Designer Commission State
  const [submissions, setSubmissions] =
    useState<CreatorSubmissionItem[]>(initialSubmissions);
  const [pieceTitle, setPieceTitle] = useState<string>("");
  const [designerName, setDesignerName] = useState<string>("");
  const [handle, setHandle] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [selectedSilhouetteId, setSelectedSilhouetteId] =
    useState<string>("hoodie");
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>(
    SILHOUETTE_PRESETS[0].imageUrl
  );
  const [craftNotes, setCraftNotes] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const activeChapter = CRAFT_CHAPTERS[activeChapterIdx] ?? CRAFT_CHAPTERS[0];

  const activeSilhouette = useMemo(
    () =>
      SILHOUETTE_PRESETS.find((s) => s.id === selectedSilhouetteId) ??
      SILHOUETTE_PRESETS[0],
    [selectedSilhouetteId]
  );

  const normalizedHandle = useMemo(() => {
    const cleaned = handle.trim().replace(/^@+/, "");
    if (cleaned) return `@${cleaned.toUpperCase()}`;
    const fromName = designerName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, ".");
    return fromName ? `@${fromName}` : "@YOUR.STUDIO";
  }, [handle, designerName]);

  function handleSelectSilhouette(preset: SilhouettePreset) {
    setSelectedSilhouetteId(preset.id);
    setSelectedImageUrl(preset.imageUrl);
  }

  async function handleCommissionSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!pieceTitle.trim() || !designerName.trim() || !craftNotes.trim()) {
      setSubmitError(
        "Please complete Piece Title, Designer Name, and Craft Notes to file your folio."
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pieceTitle.trim(),
          creatorName: designerName.trim(),
          creatorHandle: handle.trim() || normalizedHandle.toLowerCase(),
          email: email.trim(),
          category: activeSilhouette.categoryValue,
          craftsmanshipNotes: craftNotes.trim(),
          imageUrl: selectedImageUrl,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        submission?: CreatorSubmissionItem;
        error?: string;
      };

      if (!res.ok || !data.ok || !data.submission) {
        throw new Error(
          data.error || "Unable to file commission folio right now."
        );
      }

      setSubmissions((prev) => [data.submission!, ...prev]);
      setSubmitSuccess(
        `Commission folio “${data.submission.title}” logged under ${data.submission.creatorHandle}.`
      );
      setPieceTitle("");
      setCraftNotes("");
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Unable to submit commission folio."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="folio"
      className="relative border-t border-champagne bg-plaster py-28"
    >
      <div className="mx-auto max-w-[1340px] px-6 sm:px-10 lg:px-12">
        {/* ============================================================
            PART 1 — SAMPLE-FIRST CRAFT ACCORDION
            ============================================================ */}
        <div>
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-muted">
              ATELIER FOLIO · SAMPLE-FIRST METHODOLOGY
            </p>
            <h2 className="mt-4 font-editorial text-5xl leading-[0.98] tracking-[-0.015em] text-umber sm:text-6xl lg:text-[4.25rem]">
              Craft Before{" "}
              <span className="italic text-terracotta">Commerce.</span>
            </h2>
            <p className="mt-5 font-sans text-sm leading-relaxed text-muted sm:text-[15px]">
              Every KNITX edition begins as a single photographed studio sample
              and enters cutting only after collectors claim their numbered
              piece.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left — 4 Expandable Hairline Chapters */}
            <div className="lg:col-span-6">
              <div className="border-b border-champagne">
                {CRAFT_CHAPTERS.map((chapter, idx) => {
                  const isOpen = idx === activeChapterIdx;
                  return (
                    <div
                      key={chapter.index}
                      className="border-t border-champagne"
                    >
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setActiveChapterIdx(idx)}
                        aria-expanded={isOpen}
                        className="group flex w-full items-center justify-between gap-4 py-6 text-left transition-colors"
                      >
                        <div className="flex items-baseline gap-4">
                          <span
                            className={cn(
                              "font-mono text-[11px] uppercase tracking-[0.22em] transition-colors",
                              isOpen ? "text-terracotta" : "text-muted"
                            )}
                          >
                            {chapter.index}
                          </span>
                          <span
                            className={cn(
                              "font-editorial text-2xl leading-tight transition-colors sm:text-[1.9rem]",
                              isOpen
                                ? "text-umber"
                                : "text-umber/70 group-hover:text-umber"
                            )}
                          >
                            {chapter.title.replace(`${chapter.index} — `, "")}
                          </span>
                        </div>

                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                            isOpen
                              ? "border-terracotta bg-terracotta text-plaster"
                              : "border-champagne bg-plaster text-muted group-hover:border-umber group-hover:text-umber"
                          )}
                        >
                          {isOpen ? (
                            <Minus className="h-3.5 w-3.5" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key={`chapter-panel-${chapter.index}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                              duration: 0.35,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="overflow-hidden"
                          >
                            <div className="pb-7 pl-9 pr-4">
                              <p className="font-editorial text-xl italic text-umber">
                                {chapter.heading}
                              </p>
                              <p className="mt-3 font-sans text-sm leading-relaxed text-muted">
                                {chapter.body}
                              </p>
                              <div className="mt-5 inline-flex flex-wrap items-center gap-3 rounded-sm border border-champagne bg-travertine/65 px-3.5 py-2 font-mono text-[9.5px] uppercase tracking-[0.2em]">
                                <span className="text-muted">
                                  {chapter.specLabel}
                                </span>
                                <span className="text-champagne">·</span>
                                <span className="font-medium text-terracotta">
                                  {chapter.specValue}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right — Smooth Crossfading Editorial Studio Photography */}
            <div className="lg:sticky lg:top-24 lg:col-span-6">
              <div className="rounded-sm border border-champagne bg-travertine p-3.5 sm:p-5">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-plaster">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeChapter.imageUrl}
                      initial={{ opacity: 0, scale: 1.03 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.99 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={activeChapter.imageUrl}
                        alt={activeChapter.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Top Museum Plate Stamp */}
                  <div className="pointer-events-none absolute left-4 top-4 rounded-sm border border-champagne/90 bg-plaster/92 px-3 py-1 font-mono text-[9.5px] uppercase tracking-[0.22em] text-umber backdrop-blur-sm">
                    {activeChapter.plateCode} · {activeChapter.index}/04
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 px-1 font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted">
                  <span>{activeChapter.plateCaption}</span>
                  <span className="text-umber">{activeChapter.specValue}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            PART 2 — DESIGNER COMMISSION OPEN CALL + LIVE CREDIT PLATE
            ============================================================ */}
        <div className="mt-28 border-t border-champagne pt-24">
          <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-muted">
                OPEN COMMISSION · INDEPENDENT INDIAN DESIGNERS
              </p>
              <h3 className="mt-4 font-editorial text-4xl leading-[1.02] text-umber sm:text-5xl lg:text-[3.5rem]">
                Co-Sign the{" "}
                <span className="italic text-terracotta">Archive.</span>
              </h3>
            </div>
            <div className="lg:col-span-5">
              <p className="font-sans text-sm leading-relaxed text-muted">
                Submit a silhouette proposal for Drop 02 &amp; 03. Selected
                creators receive studio sample milling, heavyweight Indian
                cotton production, and a permanent interior credit plate.
              </p>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-14">
            {/* Left — Serene Architectural Creator Application Form */}
            <form
              onSubmit={handleCommissionSubmit}
              className="space-y-6 rounded-sm border border-champagne bg-travertine/40 p-6 sm:p-8 lg:col-span-7"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="v5-piece-title"
                    className="block font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted"
                  >
                    Piece Title
                  </label>
                  <input
                    id="v5-piece-title"
                    type="text"
                    suppressHydrationWarning
                    required
                    value={pieceTitle}
                    onChange={(e) => setPieceTitle(e.target.value)}
                    placeholder="e.g. Terracotta Indigo Sashiko Overshirt"
                    className="mt-2 w-full rounded-sm border border-champagne bg-plaster px-4 py-3 font-sans text-sm text-umber placeholder:text-muted/55 focus:border-umber focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="v5-designer-name"
                    className="block font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted"
                  >
                    Designer Name
                  </label>
                  <input
                    id="v5-designer-name"
                    type="text"
                    suppressHydrationWarning
                    required
                    value={designerName}
                    onChange={(e) => setDesignerName(e.target.value)}
                    placeholder="e.g. Kabir Menon"
                    className="mt-2 w-full rounded-sm border border-champagne bg-plaster px-4 py-3 font-sans text-sm text-umber placeholder:text-muted/55 focus:border-umber focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="v5-designer-handle"
                    className="block font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted"
                  >
                    Handle
                  </label>
                  <input
                    id="v5-designer-handle"
                    type="text"
                    suppressHydrationWarning
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="@kabir.atelier"
                    className="mt-2 w-full rounded-sm border border-champagne bg-plaster px-4 py-3 font-mono text-xs text-umber placeholder:text-muted/55 focus:border-umber focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="v5-designer-email"
                    className="block font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted"
                  >
                    Email
                  </label>
                  <input
                    id="v5-designer-email"
                    type="email"
                    suppressHydrationWarning
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="studio@domain.in"
                    className="mt-2 w-full rounded-sm border border-champagne bg-plaster px-4 py-3 font-sans text-sm text-umber placeholder:text-muted/55 focus:border-umber focus:outline-none"
                  />
                </div>
              </div>

              {/* Silhouette Selector */}
              <div>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted">
                  Silhouette
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {SILHOUETTE_PRESETS.map((preset) => {
                    const active = preset.id === selectedSilhouetteId;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        suppressHydrationWarning
                        onClick={() => handleSelectSilhouette(preset)}
                        className={cn(
                          "rounded-sm border px-3 py-2.5 text-left transition-all",
                          active
                            ? "border-terracotta bg-plaster text-umber shadow-[0_6px_18px_rgba(28,25,23,0.06)]"
                            : "border-champagne bg-plaster/65 text-muted hover:border-umber/40 hover:text-umber"
                        )}
                      >
                        <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-terracotta">
                          {preset.shortTag}
                        </span>
                        <span className="mt-1 block font-sans text-xs font-medium text-umber">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Studio Reference Image Presets */}
              <div>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted">
                  Reference Studio Plate
                </p>
                <div className="mt-2.5 grid grid-cols-4 gap-2.5">
                  {SILHOUETTE_PRESETS.map((preset) => {
                    const selected = selectedImageUrl === preset.imageUrl;
                    return (
                      <button
                        key={`img-${preset.id}`}
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setSelectedImageUrl(preset.imageUrl)}
                        className={cn(
                          "group relative aspect-[3/4] overflow-hidden rounded-sm border transition-all",
                          selected
                            ? "border-terracotta ring-1 ring-terracotta"
                            : "border-champagne opacity-75 hover:opacity-100"
                        )}
                        aria-label={`Select ${preset.label} reference photograph`}
                      >
                        <Image
                          src={preset.imageUrl}
                          alt={preset.label}
                          fill
                          sizes="120px"
                          className="object-cover"
                        />
                        {selected && (
                          <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-terracotta text-plaster">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Craft Notes */}
              <div>
                <label
                  htmlFor="v5-craft-notes"
                  className="block font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted"
                >
                  Craft Notes
                </label>
                <textarea
                  id="v5-craft-notes"
                  suppressHydrationWarning
                  required
                  rows={4}
                  value={craftNotes}
                  onChange={(e) => setCraftNotes(e.target.value)}
                  placeholder="Describe cotton GSM weight, dye bath, hand-stitching, patchwork, or surface treatment..."
                  className="mt-2 w-full resize-none rounded-sm border border-champagne bg-plaster px-4 py-3 font-sans text-sm leading-relaxed text-umber placeholder:text-muted/55 focus:border-umber focus:outline-none"
                />
              </div>

              {submitError && (
                <p className="font-mono text-[11px] text-terracotta">
                  {submitError}
                </p>
              )}

              {submitSuccess && (
                <div className="flex items-center gap-2.5 rounded-sm border border-terracotta/30 bg-plaster px-4 py-3 font-mono text-[10.5px] text-umber">
                  <Check className="h-4 w-4 shrink-0 text-terracotta" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                suppressHydrationWarning
                disabled={submitting}
                className="group flex w-full items-center justify-center gap-2.5 rounded-sm bg-umber px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.22em] text-plaster transition-colors hover:bg-terracotta disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>
                  {submitting
                    ? "Filing Commission Folio..."
                    : "Submit Commission Folio"}
                </span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>

            {/* Right — Live Embossed Cotton Designer Credit Plate */}
            <div className="lg:sticky lg:top-24 lg:col-span-5">
              <div className="rounded-sm border border-champagne bg-travertine p-6 shadow-[0_22px_54px_rgba(28,25,23,0.07)] sm:p-8">
                <div className="flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted">
                  <span>LIVE GARMENT LABEL PREVIEW</span>
                  <span className="text-terracotta">EMBOSSED COTTON</span>
                </div>

                {/* Stitched Cotton Interior Label Plate */}
                <div className="relative mt-5 rounded-[2px] border border-champagne bg-plaster p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_24px_rgba(28,25,23,0.05)] sm:p-7">
                  {/* Four Corner Tack Stitches */}
                  <span
                    aria-hidden="true"
                    className="absolute left-2.5 top-2.5 h-2 w-2 border-l border-t border-terracotta/50"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute right-2.5 top-2.5 h-2 w-2 border-r border-t border-terracotta/50"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute bottom-2.5 left-2.5 h-2 w-2 border-b border-l border-terracotta/50"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute bottom-2.5 right-2.5 h-2 w-2 border-b border-r border-terracotta/50"
                  />

                  <p className="text-center font-mono text-[9.5px] uppercase tracking-[0.2em] text-umber">
                    KNITX · IN COLLABORATION WITH{" "}
                    <span className="text-terracotta">{normalizedHandle}</span>{" "}
                    · {activeSilhouette.editionStamp}
                  </p>

                  <div className="my-5 h-px w-full bg-champagne" />

                  <div className="flex items-start gap-4">
                    <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-[2px] border border-champagne bg-travertine">
                      <Image
                        src={selectedImageUrl}
                        alt={pieceTitle.trim() || activeSilhouette.label}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
                        {activeSilhouette.label}
                      </p>
                      <h4 className="mt-1 truncate font-editorial text-2xl leading-tight text-umber">
                        {pieceTitle.trim() || "Untitled Commission Study"}
                      </h4>
                      <p className="mt-1 font-sans text-xs text-muted">
                        By {designerName.trim() || "Independent Designer"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 line-clamp-3 border-t border-champagne/80 pt-4 font-sans text-xs leading-relaxed text-muted">
                    {craftNotes.trim() ||
                      "Your fabric weight, wash formula, embroidery specification, and surface finish notes will appear engraved on the interior edition folio."}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-champagne/80 pt-3.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
                    <span>CUT AFTER CLAIM</span>
                    <span className="text-umber">MADE IN INDIA</span>
                  </div>
                </div>

                <p className="mt-4 font-sans text-xs leading-relaxed text-muted">
                  Every approved commission receives permanent co-branding on
                  the woven cotton neck plate and participates in the Drop 02
                  community token ballot.
                </p>
              </div>
            </div>
          </div>

          {/* Recent Submissions Gallery Row */}
          {submissions.length > 0 && (
            <div className="mt-16 border-t border-champagne pt-12">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted">
                    RECENT COMMISSION FOLIOS
                  </p>
                  <h4 className="mt-1.5 font-editorial text-3xl text-umber">
                    Submissions in{" "}
                    <span className="italic text-terracotta">Review.</span>
                  </h4>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                  {submissions.length}{" "}
                  {submissions.length === 1 ? "Concept" : "Concepts"} Logged
                </span>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {submissions.slice(0, 6).map((item) => {
                  const badge = getSubmissionStatusLabel(item.status);
                  return (
                    <article
                      key={item._id}
                      className="flex gap-4 rounded-sm border border-champagne bg-travertine/45 p-4 transition-colors hover:bg-travertine/75"
                    >
                      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-[2px] border border-champagne bg-plaster">
                        <Image
                          src={item.imageUrl || "/images/look-batch-hoodie.jpg"}
                          alt={item.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <span className="truncate font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted">
                            {item.creatorHandle}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 rounded-sm border px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.14em]",
                              badge.tone
                            )}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <h5 className="mt-1.5 truncate font-editorial text-xl leading-snug text-umber">
                          {item.title}
                        </h5>

                        <p className="mt-1 line-clamp-2 font-sans text-xs leading-relaxed text-muted">
                          {item.craftsmanshipNotes}
                        </p>

                        <p className="mt-auto pt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted/85">
                          {item.category}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
