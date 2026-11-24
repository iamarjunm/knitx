"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Newspaper,
  Pin,
  Scissors,
  Send,
  Sparkles,
} from "lucide-react";
import type { CreatorSubmissionItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface V4PostcardSubmitProps {
  initialSubmissions: CreatorSubmissionItem[];
}

interface PresetArtwork {
  id: string;
  label: string;
  silhouette: string;
  imageUrl: string;
  editionHint: string;
}

const PRESET_ARTWORKS: readonly PresetArtwork[] = [
  {
    id: "hoodie",
    label: "Heavyweight Hoodie",
    silhouette: "Heavyweight Hoodie",
    imageUrl: "/images/look-batch-hoodie.jpg",
    editionHint: "SMALL-BATCH · 3–4 UNITS",
  },
  {
    id: "tee",
    label: "Boxy Graphic Tee",
    silhouette: "Boxy Graphic Tee",
    imageUrl: "/images/look-batch-tee.jpg",
    editionHint: "SMALL-BATCH · 3–4 UNITS",
  },
  {
    id: "jacket",
    label: "1-of-1 Archive Jacket",
    silhouette: "1-of-1 Archive Jacket",
    imageUrl: "/images/look-1of1-jacket.jpg",
    editionHint: "1-OF-1 GRAIL · 1 UNIT",
  },
  {
    id: "knit",
    label: "Distressed Knit",
    silhouette: "Distressed Knit",
    imageUrl: "/images/look-1of1-knit.jpg",
    editionHint: "1-OF-1 GRAIL · 1 UNIT",
  },
] as const;

const SILHOUETTE_OPTIONS = [
  "Heavyweight Hoodie",
  "Boxy Graphic Tee",
  "1-of-1 Archive Jacket",
  "Distressed Knit",
  "Cut-and-Sew Cargo",
] as const;

const MANIFESTO_COLUMNS = [
  {
    num: "01",
    heading: "HALF REVEALED",
    body: "Every archive drop launches half-concealed beneath metallic scratch foil. Collectors step in for heavyweight fabric, cut, and finish — never noisy mass-market hype.",
  },
  {
    num: "02",
    heading: "CROWD VOTED",
    body: "Independent Indian creators submit silhouettes directly to our press desk. Community sticker polls decide which top 4 concepts graduate into the next release.",
  },
  {
    num: "03",
    heading: "ONE SAMPLE SHOT",
    body: "Before launch day, our studio stitches only 10 physical samples across the entire collection to lock drape, 450+ GSM density, puff print, and distress zones.",
  },
  {
    num: "04",
    heading: "CUT AFTER ORDER",
    body: "Once your vault slot is called and you claim a piece, your exact numbered garment is cut, woven-tagged, and dispatched across India. Zero unsold racks. 0% deadstock.",
  },
] as const;

function getSubmissionStatusTag(status: CreatorSubmissionItem["status"]): {
  label: string;
  className: string;
} {
  switch (status) {
    case "selected":
      return {
        label: "SELECTED",
        className: "bg-riso text-white border-ink",
      };
    case "approved_for_vote":
      return {
        label: "ON PIN-UP BOARD",
        className: "bg-ochre text-ink border-ink",
      };
    default:
      return {
        label: "AT PRESS DESK",
        className: "bg-manila text-ink border-ink",
      };
  }
}

export default function V4PostcardSubmit({
  initialSubmissions,
}: V4PostcardSubmitProps) {
  const [title, setTitle] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [creatorHandle, setCreatorHandle] = useState("");
  const [email, setEmail] = useState("");
  const [silhouette, setSilhouette] = useState<string>(SILHOUETTE_OPTIONS[0]);
  const [notes, setNotes] = useState("");
  const [selectedArtId, setSelectedArtId] = useState<string>(
    PRESET_ARTWORKS[0].id
  );

  const [submissions, setSubmissions] =
    useState<CreatorSubmissionItem[]>(initialSubmissions);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{
    id: string;
    title: string;
    handle: string;
  } | null>(null);

  const selectedArt = useMemo(
    () =>
      PRESET_ARTWORKS.find((art) => art.id === selectedArtId) ??
      PRESET_ARTWORKS[0],
    [selectedArtId]
  );

  const previewHandle = useMemo(() => {
    const clean = creatorHandle.trim().replace(/^@+/, "");
    if (clean) return `@${clean}`;
    const slug = creatorName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".");
    return slug ? `@${slug}` : "@your.handle";
  }, [creatorHandle, creatorName]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setReceipt(null);

    const cleanTitle = title.trim();
    const cleanName = creatorName.trim();
    const cleanNotes = notes.trim();

    if (!cleanTitle || !cleanName || !cleanNotes) {
      setErrorMsg(
        "Fill in your concept title, creator name, and craftsmanship notes before mailing."
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          creatorName: cleanName,
          creatorHandle: creatorHandle.trim() || previewHandle,
          email: email.trim(),
          category: silhouette,
          craftsmanshipNotes: cleanNotes,
          imageUrl: selectedArt.imageUrl,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        submission?: CreatorSubmissionItem;
      };

      if (!response.ok || !data.ok || !data.submission) {
        setErrorMsg(
          data.error || "Unable to log your postcard right now. Please retry."
        );
        return;
      }

      setSubmissions((prev) => [data.submission as CreatorSubmissionItem, ...prev]);
      setReceipt({
        id: data.submission._id,
        title: data.submission.title,
        handle: data.submission.creatorHandle,
      });
      setTitle("");
      setNotes("");
    } catch {
      setErrorMsg("Network hiccup while mailing your studio postcard.");
    } finally {
      setSubmitting(false);
    }
  };

  const recentPinned = submissions.slice(0, 4);

  return (
    <section
      id="postcard"
      className="relative overflow-hidden bg-newsprint py-20 text-ink"
    >
      <div className="mx-auto max-w-[1320px] px-4 sm:px-8">
        {/* ============================================================
            PART 1: FOLDED STUDIO POSTCARD OPEN CALL
            ============================================================ */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2.5">
            <span className="bg-ink px-2 py-0.5 text-white">PAGE 05</span>
            <span>CREATOR CLASSIFIEDS · FOLDED STUDIO POSTCARD</span>
          </div>
          <span className="text-muted">
            {String(submissions.length).padStart(2, "0")} CONCEPTS ON FILE ·
            DROP 02 CALL OPEN
          </span>
        </div>

        {/* Open Call Header */}
        <div className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 border border-ink bg-ochre px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink">
              <Newspaper className="h-3.5 w-3.5" />
              <span>WANTED: INDEPENDENT INDIAN DESIGNERS</span>
            </div>
            <h2 className="mt-4 font-poster text-5xl uppercase leading-[0.92] tracking-[0.01em] text-ink sm:text-6xl">
              MAIL YOUR CONCEPT TO{" "}
              <span className="inline-block bg-riso px-2 text-white">
                THE PRESS.
              </span>
            </h2>
            <p className="mt-3.5 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Pitch a silhouette for Drop 02. Community winners get sampled in
              heavyweight cotton, woven-tagged with your name, and promoted
              across India.
            </p>
          </div>

          <div className="border-2 border-dashed border-ink bg-manila/70 px-4 py-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em]">
            <p className="font-bold text-riso">CO-CREDIT GUARANTEE</p>
            <p className="text-ink">
              WOVEN CREATOR NECK LABEL · FULL STUDIO SAMPLING
            </p>
          </div>
        </div>

        {/* 2-Column Classifieds + Folded Postcard Split */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT: FOLDED STUDIO POSTCARD FORM */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col justify-between border-2 border-ink bg-white p-5 stamp-shadow sm:p-7 lg:col-span-7"
          >
            <div>
              {/* Form Fold Header */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-3.5">
                <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.22em] text-ink">
                  STUDIO POSTCARD FORM · SECTION B
                </span>
                <span className="border border-ink bg-newsprint px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-riso">
                  FREE TO SUBMIT
                </span>
              </div>

              <div className="space-y-5">
                {/* Concept Title */}
                <div>
                  <label
                    htmlFor="v4-sub-title"
                    className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink"
                  >
                    01 · GARMENT CONCEPT TITLE *
                  </label>
                  <input
                    id="v4-sub-title"
                    type="text"
                    suppressHydrationWarning
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Monsoon Acid-Wash Boxy Hoodie"
                    className="w-full border-2 border-ink bg-newsprint px-3.5 py-2.5 text-sm font-medium text-ink placeholder:text-muted/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-riso"
                  />
                </div>

                {/* Creator Name & Handle */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="v4-sub-name"
                      className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink"
                    >
                      02 · CREATOR NAME *
                    </label>
                    <input
                      id="v4-sub-name"
                      type="text"
                      suppressHydrationWarning
                      value={creatorName}
                      onChange={(e) => setCreatorName(e.target.value)}
                      placeholder="Rhea Kulkarni"
                      className="w-full border-2 border-ink bg-newsprint px-3.5 py-2.5 text-sm font-medium text-ink placeholder:text-muted/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-riso"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="v4-sub-handle"
                      className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink"
                    >
                      03 · INSTAGRAM / HANDLE
                    </label>
                    <input
                      id="v4-sub-handle"
                      type="text"
                      suppressHydrationWarning
                      value={creatorHandle}
                      onChange={(e) => setCreatorHandle(e.target.value)}
                      placeholder="@rhea.stitches"
                      className="w-full border-2 border-ink bg-newsprint px-3.5 py-2.5 font-mono text-sm font-medium text-ink placeholder:text-muted/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-riso"
                    />
                  </div>
                </div>

                {/* Email & Silhouette */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="v4-sub-email"
                      className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink"
                    >
                      04 · CONTACT EMAIL
                    </label>
                    <input
                      id="v4-sub-email"
                      type="email"
                      suppressHydrationWarning
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="designer@studio.in"
                      className="w-full border-2 border-ink bg-newsprint px-3.5 py-2.5 font-mono text-sm text-ink placeholder:text-muted/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-riso"
                    />
                  </div>

                  <div>
                    <span className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink">
                      05 · SILHOUETTE BASE
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {SILHOUETTE_OPTIONS.map((opt) => {
                        const active = silhouette === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            suppressHydrationWarning
                            onClick={() => setSilhouette(opt)}
                            className={cn(
                              "border border-ink px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] transition-colors",
                              active
                                ? "bg-ink text-white"
                                : "bg-newsprint text-ink hover:bg-ochre"
                            )}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Preset Art Reference Selector */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink">
                      06 · ATTACH REFERENCE PROOF SHEET
                    </span>
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">
                      {selectedArt.editionHint}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {PRESET_ARTWORKS.map((art) => {
                      const active = art.id === selectedArtId;
                      return (
                        <button
                          key={art.id}
                          type="button"
                          suppressHydrationWarning
                          onClick={() => {
                            setSelectedArtId(art.id);
                            setSilhouette(art.silhouette);
                          }}
                          className={cn(
                            "group relative overflow-hidden border-2 text-left transition-all",
                            active
                              ? "border-riso bg-riso/10 stamp-shadow-sm"
                              : "border-ink bg-newsprint hover:border-riso"
                          )}
                        >
                          <div className="relative aspect-[4/3.6] w-full overflow-hidden border-b border-ink">
                            <Image
                              src={art.imageUrl}
                              alt={art.label}
                              fill
                              sizes="(max-width: 640px) 45vw, 150px"
                              className="object-cover"
                            />
                            {active && (
                              <span className="absolute right-1.5 top-1.5 border border-ink bg-riso px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase text-white">
                                PICKED
                              </span>
                            )}
                          </div>
                          <p className="truncate px-2 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-ink">
                            {art.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Craftsmanship Notes */}
                <div>
                  <label
                    htmlFor="v4-sub-notes"
                    className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink"
                  >
                    07 · PATTERN, FABRIC &amp; CRAFTSMANSHIP NOTES *
                  </label>
                  <textarea
                    id="v4-sub-notes"
                    rows={3}
                    suppressHydrationWarning
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Call out GSM weight, puff-print graphic placement, chain-stitching, sun-fade wash, or raw hem details..."
                    className="w-full resize-none border-2 border-ink bg-newsprint px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-riso"
                  />
                </div>
              </div>
            </div>

            {/* Submit & Receipt */}
            <div className="mt-6 space-y-3 border-t-2 border-dashed border-ink/40 pt-5">
              <AnimatePresence mode="wait">
                {errorMsg && (
                  <motion.div
                    key="sub-error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="border-2 border-riso bg-riso/10 px-3.5 py-2.5 font-mono text-[11px] font-bold text-riso"
                  >
                    ✕ {errorMsg}
                  </motion.div>
                )}

                {receipt && (
                  <motion.div
                    key="sub-ok"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2.5 border-2 border-ink bg-ochre/50 px-3.5 py-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
                    <div className="font-mono text-[11px] leading-relaxed">
                      <p className="font-bold uppercase tracking-[0.14em] text-ink">
                        POSTCARD LOGGED · {receipt.handle}
                      </p>
                      <p className="text-ink/85">
                        &ldquo;{receipt.title}&rdquo; is now pinned to the Drop
                        02 community classifieds board.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                suppressHydrationWarning
                disabled={submitting}
                className="flex w-full items-center justify-between border-2 border-ink bg-ink px-5 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-white stamp-shadow-sm transition-colors hover:bg-riso active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-65"
              >
                <span className="inline-flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  {submitting
                    ? "DISPATCHING POSTCARD..."
                    : "MAIL POSTCARD TO PRESS DESK"}
                </span>
                <span className="bg-ochre px-2 py-0.5 text-[10px] text-ink">
                  DROP 02
                </span>
              </button>
            </div>
          </form>

          {/* RIGHT: LIVE CLASSIFIEDS CLIPPING PREVIEW + PINNED BOARD */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            {/* LIVE PRINTED ZINE CLASSIFIEDS CLIPPING PREVIEW */}
            <div className="relative border-2 border-dashed border-ink bg-manila/75 p-5">
              <span
                aria-hidden="true"
                className="absolute -top-3 right-4 inline-flex items-center gap-1 border border-ink bg-white px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ink"
              >
                <Scissors className="h-3 w-3 text-riso" />
                LIVE CLASSIFIEDS CLIPPING
              </span>

              <div className="border-2 border-ink bg-newsprint p-4">
                <div className="flex items-center justify-between border-b border-ink pb-2 font-mono text-[9.5px] font-bold uppercase tracking-[0.18em]">
                  <span className="text-riso">AD #KX-02-PREVIEW</span>
                  <span className="text-muted">{silhouette}</span>
                </div>

                <div className="mt-3.5 grid grid-cols-12 gap-3.5">
                  <div className="relative col-span-5 aspect-[3/4] overflow-hidden border-2 border-ink bg-white">
                    <Image
                      src={selectedArt.imageUrl}
                      alt={title.trim() || selectedArt.label}
                      fill
                      sizes="160px"
                      className="object-cover contrast-110"
                    />
                    <span className="absolute bottom-1 left-1 bg-ink px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase text-white">
                      PROOF
                    </span>
                  </div>

                  <div className="col-span-7 flex flex-col justify-between">
                    <div>
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-muted">
                        PROPOSED BY {creatorName.trim() || "YOUR NAME"}
                      </p>
                      <h3 className="mt-1 font-poster text-2xl uppercase leading-[0.98] text-ink">
                        {title.trim() || "UNTITLED SILHOUETTE"}
                      </h3>
                      <p className="mt-1 font-mono text-[10px] font-bold text-riso">
                        {previewHandle}
                      </p>
                      <p className="mt-2 line-clamp-4 font-sans text-xs leading-relaxed text-ink/80">
                        {notes.trim() ||
                          "Start typing your fabric weight, wash, embroidery, or graphic notes to preview your printed zine classified listing."}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-dashed border-ink/50 pt-2 font-mono text-[8.5px] font-bold uppercase tracking-[0.16em] text-muted">
                      <span>INDIA PRESS</span>
                      <span className="text-ink">READY TO PRINT</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RECENT COMMUNITY SUBMISSIONS PINNED BOARD */}
            <div className="flex-1 border-2 border-ink bg-white p-5 stamp-shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b-2 border-ink pb-2.5">
                <div className="inline-flex items-center gap-2">
                  <Pin className="h-4 w-4 text-riso" />
                  <h3 className="font-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-ink">
                    RECENT PINNED CLASSIFIEDS
                  </h3>
                </div>
                <span className="font-mono text-[10px] font-bold text-muted">
                  {submissions.length} TOTAL
                </span>
              </div>

              <div className="space-y-3">
                {recentPinned.map((item) => {
                  const statusTag = getSubmissionStatusTag(item.status);
                  return (
                    <div
                      key={item._id}
                      className="flex items-start gap-3 border border-ink bg-newsprint p-3 transition-colors hover:bg-manila/60"
                    >
                      <div className="relative h-14 w-12 shrink-0 overflow-hidden border border-ink bg-white">
                        <Image
                          src={item.imageUrl || "/images/look-batch-hoodie.jpg"}
                          alt={item.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <p className="truncate font-poster text-lg uppercase leading-none text-ink">
                            {item.title}
                          </p>
                          <span
                            className={cn(
                              "border px-1.5 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.14em]",
                              statusTag.className
                            )}
                          >
                            {statusTag.label}
                          </span>
                        </div>

                        <p className="mt-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                          {item.creatorName} · {item.creatorHandle} ·{" "}
                          {item.category}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs leading-snug text-ink/80">
                          {item.craftsmanshipNotes}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            PART 2: 4-COLUMN BROADSHEET SAMPLE-FIRST MANIFESTO
            ============================================================ */}
        <div className="mt-20 border-t-4 border-double border-ink pt-12">
          {/* Newspaper Broadsheet Masthead */}
          <div className="border-y-2 border-ink py-4 text-center">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-riso">
              SPECIAL EDITORIAL SUPPLEMENT · SAMPLE-FIRST PRODUCTION CHARTER
            </p>
            <h2 className="mt-1.5 font-poster text-4xl uppercase leading-none tracking-[0.02em] text-ink sm:text-6xl lg:text-7xl">
              ZERO DEADSTOCK. CUT AFTER ORDER.
            </h2>
            <p className="mt-2 font-editorial text-xl italic text-muted sm:text-2xl">
              Why KNITX produces 10 studio proofs before launch and refuses
              warehouse overproduction.
            </p>
          </div>

          {/* Halftone-Framed Atelier Photo Spread */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="relative border-2 border-ink bg-white p-3 stamp-shadow lg:col-span-7">
              <div className="relative aspect-[16/10] w-full overflow-hidden border-2 border-ink bg-manila">
                <Image
                  src="/images/atelier-daylight.jpg"
                  alt="KNITX Sample-First Indian Atelier Studio"
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover contrast-110 saturate-90"
                />
                {/* Subtle Halftone Dot Texture Overlay */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-25 mix-blend-multiply"
                  style={{
                    backgroundImage:
                      "radial-gradient(#0A0A0A 0.85px, transparent 0.85px)",
                    backgroundSize: "6px 6px",
                  }}
                />

                {/* Corner 0% Deadstock Seal */}
                <div className="absolute left-3 top-3 border-2 border-ink bg-ochre px-3 py-1.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.18em] text-ink shadow-[3px_3px_0px_#0A0A0A]">
                  0% DEADSTOCK GUARANTEE
                </div>

                {/* Bottom Right Risograph Tag */}
                <div className="absolute bottom-3 right-3 border-2 border-ink bg-riso px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-white">
                  FIG 01 · SAMPLE ROOM · INDIA
                </div>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                <span>
                  PHOTO PLATE 01: DAYLIGHT PATTERN BENCH · 450+ GSM LOOPBACK
                </span>
                <span className="font-bold text-ink">10 PROOFS MAX</span>
              </div>
            </div>

            {/* Editorial Pull-Quote & Ledger Column */}
            <div className="flex flex-col justify-between border-2 border-ink bg-manila/65 p-6 lg:col-span-5">
              <div>
                <span className="inline-flex items-center gap-1.5 border border-ink bg-white px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.2em] text-riso">
                  <Sparkles className="h-3 w-3" />
                  EDITOR&apos;S NOTE · ISSUE 01
                </span>
                <blockquote className="mt-4 font-editorial text-3xl leading-[1.12] text-ink sm:text-4xl">
                  &ldquo;Streetwear broke when brands began printing five
                  thousand copies of a feeling meant for four people.&rdquo;
                </blockquote>
                <p className="mt-4 text-sm leading-relaxed text-ink/80">
                  Every KNITX drop exists in tiny runs of{" "}
                  <strong className="font-semibold text-ink">
                    3–4 Small-Batch units
                  </strong>{" "}
                  and{" "}
                  <strong className="font-semibold text-ink">
                    true 1-of-1 archive grails
                  </strong>
                  . Once a piece sells out, the pattern is retired permanently.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2.5 border-t-2 border-ink pt-4 font-mono">
                <div className="border border-ink bg-white p-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted">
                    DEADSTOCK WASTE
                  </p>
                  <p className="mt-1 font-poster text-3xl leading-none text-riso">
                    0.0%
                  </p>
                </div>
                <div className="border border-ink bg-white p-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted">
                    PRE-LAUNCH SAMPLES
                  </p>
                  <p className="mt-1 font-poster text-3xl leading-none text-ink">
                    10 ONLY
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4-COLUMN NEWSPAPER MANIFESTO GRID */}
          <div className="mt-8 grid grid-cols-1 border-2 border-ink bg-white md:grid-cols-2 lg:grid-cols-4">
            {MANIFESTO_COLUMNS.map((col, idx) => (
              <div
                key={col.num}
                className={cn(
                  "flex flex-col justify-between p-6",
                  idx !== 0 && "border-t-2 border-ink lg:border-l-2 lg:border-t-0",
                  idx === 1 && "md:border-l-2 md:border-t-0 lg:border-l-2",
                  idx === 2 && "md:border-t-2 lg:border-t-0",
                  idx === 3 && "md:border-l-2 md:border-t-2 lg:border-t-0"
                )}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-ink pb-2.5">
                    <span className="font-poster text-3xl leading-none text-riso">
                      {col.num}
                    </span>
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-muted">
                      RULE {col.num}
                    </span>
                  </div>
                  <h3 className="mt-4 font-poster text-2xl uppercase tracking-[0.02em] text-ink">
                    {col.heading}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink/80">
                    {col.body}
                  </p>
                </div>

                <div className="mt-5 pt-3 font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted">
                  KNITX PRESS · INDIA
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Broadsheet Rule Ticker */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-2 border-ink bg-ochre px-4 py-2.5 font-mono text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-ink">
            <span>01 HALF REVEALED · 02 CROWD VOTED</span>
            <span>03 ONE SAMPLE SHOT · 04 CUT AFTER ORDER · 0% DEADSTOCK</span>
          </div>
        </div>
      </div>
    </section>
  );
}
