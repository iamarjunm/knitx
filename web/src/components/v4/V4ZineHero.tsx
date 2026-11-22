"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Eye,
  Sparkles,
  Stamp,
} from "lucide-react";
import type { DropCampaign, Product } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";

export interface V4ZineHeroProps {
  drop: DropCampaign;
  products: Product[];
  onInspectProduct: (p: Product) => void;
}

interface ZineSpread {
  id: string;
  pageRange: string;
  chapterCode: string;
  chapterLabel: string;
  stickers: Array<{ text: string; tone: "riso" | "ochre" | "ink"; tilt: string }>;
  headlineTop: string;
  headlineItalic: string;
  leadCopy: string;
  footnoteLeft: string;
  footnoteRight: string;
  imageUrl: string;
  figureCode: string;
  captionTitle: string;
  captionMeta: string;
  editorialStamp: string;
  productMatch: (products: Product[]) => Product | undefined;
}

const SPREADS: ZineSpread[] = [
  {
    id: "cover-story",
    pageRange: "01–02",
    chapterCode: "01",
    chapterLabel: "COVER STORY",
    stickers: [
      { text: "3–4 UNITS MAX", tone: "riso", tilt: "-rotate-2" },
      { text: "TWO 1-OF-1S", tone: "ochre", tilt: "rotate-2" },
    ],
    headlineTop: "NO OPEN STORE.",
    headlineItalic: "Waitlist Only.",
    leadCopy:
      "Ten garments printed into reality across India—five visible on this newsprint sheet, five locked beneath silver scratch-off foil until your waitlist card clears. When a pattern closes, the screens are destroyed.",
    footnoteLeft: "FIG. 01 · ISSUE 001 MANIFESTO",
    footnoteRight: "ZERO PUBLIC CHECKOUT · INVITE WINDOW",
    imageUrl: "/images/hero-editorial-light.jpg",
    figureCode: "PLATE 01A",
    captionTitle: "Drop 001 Heavyweight Editorial Study",
    captionMeta: "SHOT IN NATURAL DAYLIGHT · PAN-INDIA EDITION",
    editorialStamp: "COVER PRINT",
    productMatch: (items) =>
      items.find((p) => !p.isMystery) ?? items[0],
  },
  {
    id: "one-of-one",
    pageRange: "03–04",
    chapterCode: "02",
    chapterLabel: "ONE-OF-ONE ARCHIVE",
    stickers: [
      { text: "STRICTLY 1 UNIT", tone: "riso", tilt: "-rotate-1" },
      { text: "NEVER RE-ISSUED", tone: "ink", tilt: "rotate-1" },
    ],
    headlineTop: "TWO 1-OF-1",
    headlineItalic: "Singular Artifacts.",
    leadCopy:
      "Hand-cut, enzyme-washed, and finished individually by independent atelier hands. Each One-of-One carries a stamped woven edition number, raw seam documentation, and zero duplicate runs anywhere on earth.",
    footnoteLeft: "FIG. 02 · COLLECTOR TIER LEDGER",
    footnoteRight: "1 SERIAL · 1 OWNER · ARCHIVE SEAL",
    imageUrl: "/images/look-1of1-jacket.jpg",
    figureCode: "PLATE 02B",
    captionTitle: "Constructed Archive Outerwear Specimen",
    captionMeta: "SINGLE PATTERN CUT · HAND-STAMPED SERIAL",
    editorialStamp: "1 OF 1",
    productMatch: (items) =>
      items.find((p) => !p.isMystery && p.tier === "one-of-one") ??
      items.find((p) => p.tier === "one-of-one") ??
      items[0],
  },
  {
    id: "small-batch",
    pageRange: "05–06",
    chapterCode: "03",
    chapterLabel: "SMALL-BATCH RUNS",
    stickers: [
      { text: "3 TO 4 PIECES", tone: "ochre", tilt: "-rotate-2" },
      { text: "HEAVYWEIGHT KNIT", tone: "riso", tilt: "rotate-2" },
    ],
    headlineTop: "SMALL-BATCH",
    headlineItalic: "Heavyweight Runs.",
    leadCopy:
      "Engineered from dense 480–560 GSM loopback fleece and double-faced jersey. Capped strictly at three to four garments per colorway so every drop wears like an independent zine print rather than mass merch.",
    footnoteLeft: "FIG. 03 · MILL & FABRIC DOSSIER",
    footnoteRight: "MICRO-LOT DYEING · RETIRED AFTER DROP",
    imageUrl: "/images/look-batch-hoodie.jpg",
    figureCode: "PLATE 03C",
    captionTitle: "Architectural Fleece & Drop-Shoulder Cut",
    captionMeta: "MAX RUN 04 UNITS · ARCHIVAL PIGMENT WASH",
    editorialStamp: "BATCH / 04",
    productMatch: (items) =>
      items.find((p) => !p.isMystery && p.tier === "small-batch") ??
      items.find((p) => p.tier === "small-batch") ??
      items[0],
  },
  {
    id: "zero-deadstock",
    pageRange: "07–08",
    chapterCode: "04",
    chapterLabel: "ZERO DEADSTOCK",
    stickers: [
      { text: "ZERO OVERSTOCK", tone: "riso", tilt: "-rotate-1" },
      { text: "PAN-INDIA DISPATCH", tone: "ochre", tilt: "rotate-2" },
    ],
    headlineTop: "ZERO DEADSTOCK.",
    headlineItalic: "Atelier Made.",
    leadCopy:
      "No warehouse racks, no seasonal clearance bins, no algorithmically inflated restocks. Every silhouette is claimed directly by waitlist members and finished to order in numbered garment folios.",
    footnoteLeft: "FIG. 04 · ATELIER ETHOS NOTE",
    footnoteRight: "10–14 DAY FINISH · INSURED COURIER",
    imageUrl: "/images/atelier-daylight.jpg",
    figureCode: "PLATE 04D",
    captionTitle: "Daylight Pattern Table & Garment Proofing",
    captionMeta: "ZERO SURPLUS FABRIC · INDEPENDENT PRESS",
    editorialStamp: "ZERO WASTE",
    productMatch: (items) => {
      const revealed = items.filter((p) => !p.isMystery);
      return revealed[revealed.length - 1] ?? items[0];
    },
  },
];

const spreadVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 44 : -44,
    rotateY: direction > 0 ? -12 : 12,
    scale: 0.985,
  }),
  center: {
    opacity: 1,
    x: 0,
    rotateY: 0,
    scale: 1,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -44 : 44,
    rotateY: direction > 0 ? 12 : -12,
    scale: 0.985,
  }),
};

export function V4ZineHero({
  drop,
  products,
  onInspectProduct,
}: V4ZineHeroProps) {
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const activeSpread = SPREADS[spreadIndex];

  const featuredProduct = useMemo(
    () => activeSpread.productMatch(products),
    [activeSpread, products]
  );

  const goToSpread = (nextIndex: number) => {
    const normalized = (nextIndex + SPREADS.length) % SPREADS.length;
    if (normalized === spreadIndex) return;
    setDirection(normalized > spreadIndex ? 1 : -1);
    setSpreadIndex(normalized);
  };

  const handleNext = () => {
    setDirection(1);
    setSpreadIndex((prev) => (prev + 1) % SPREADS.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setSpreadIndex((prev) => (prev - 1 + SPREADS.length) % SPREADS.length);
  };

  return (
    <section
      id="spread"
      className="relative overflow-hidden border-b-2 border-ink bg-newsprint py-10 sm:py-16 text-ink"
    >
      {/* Subtle broadsheet newsprint column guides */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #0A0A0A 0px, #0A0A0A 1px, transparent 1px, transparent 160px)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Issue Masthead Strip above the Physical Zine */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink/70">
              <BookOpen className="h-3.5 w-3.5 text-riso" />
              <span>INTERACTIVE PRINTED ZINE</span>
              <span aria-hidden="true">·</span>
              <span>{drop.dropNumber || "DROP 001"}</span>
              <span aria-hidden="true">·</span>
              <span>{drop.title || "ARCHIVAL EDITION"}</span>
            </div>
            <p className="mt-1 font-editorial text-xl sm:text-2xl italic text-ink/90">
              Flip the open broadsheet spread — click any pinned plate to inspect its archival garment spec.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.12em]">
            <div className="border border-ink bg-white px-3 py-1.5">
              <span className="text-ink/60">WAITLIST QUEUE </span>
              <span className="font-bold text-riso">
                {drop.waitlistCount.toLocaleString("en-IN")}
              </span>
              <span className="text-ink/50"> / {drop.totalSlots}</span>
            </div>
            <div className="hidden sm:block border border-ink bg-ochre px-3 py-1.5 font-bold text-ink">
              PAGE {activeSpread.pageRange}
            </div>
          </div>
        </div>

        {/* Physical Open 2-Page Magazine Spread */}
        <div className="relative [perspective:1800px]">
          {/* Stacked Newsprint Pages Depth Effect Behind Magazine */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-2 left-2 right-2 top-2 border-2 border-ink/40 bg-manila"
          />

          <AnimatePresence mode="wait" custom={direction}>
            <motion.article
              key={activeSpread.id}
              custom={direction}
              variants={spreadVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: 0.44,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ transformOrigin: "center center" }}
              className="relative grid grid-cols-1 lg:grid-cols-2 border-2 border-ink bg-white shadow-[8px_8px_0px_rgba(10,10,10,0.12)]"
            >
              {/* Center Physical Magazine Spine Crease Shadow & Saddle-Stitch Staples */}
              <div
                aria-hidden="true"
                className="pointer-events-none hidden lg:block absolute inset-y-0 left-1/2 z-20 w-14 -translate-x-1/2"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.06) 36%, rgba(10,10,10,0.18) 50%, rgba(10,10,10,0.06) 64%, rgba(10,10,10,0) 100%)",
                }}
              >
                <div className="absolute inset-y-0 left-1/2 w-[1px] -translate-x-1/2 bg-ink/25" />
                <div className="absolute left-1/2 top-[24%] h-7 w-[3px] -translate-x-1/2 rounded-full bg-ink/45" />
                <div className="absolute left-1/2 bottom-[24%] h-7 w-[3px] -translate-x-1/2 rounded-full bg-ink/45" />
              </div>

              {/* LEFT PAGE — Editorial Broadsheet Typography */}
              <div className="relative flex flex-col justify-between border-b-2 border-ink lg:border-b-0 lg:border-r lg:border-ink/15 bg-white p-6 sm:p-10 lg:pr-12">
                {/* Page Top Folio */}
                <div>
                  <div className="flex items-center justify-between border-b border-ink/20 pb-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink/65">
                    <span>
                      SPREAD {activeSpread.chapterCode} · {activeSpread.chapterLabel}
                    </span>
                    <span>P. {activeSpread.pageRange.split("–")[0]}</span>
                  </div>

                  {/* Risograph Kicker Stickers */}
                  <div className="mt-6 flex flex-wrap items-center gap-2.5">
                    {activeSpread.stickers.map((sticker) => (
                      <span
                        key={sticker.text}
                        className={cn(
                          "inline-flex items-center gap-1 border-2 border-ink px-2.5 py-1 font-mono text-[10px] font-extrabold uppercase tracking-[0.14em] shadow-[2.5px_2.5px_0px_#0A0A0A]",
                          sticker.tilt,
                          sticker.tone === "riso" && "bg-riso text-white",
                          sticker.tone === "ochre" && "bg-ochre text-ink",
                          sticker.tone === "ink" && "bg-ink text-newsprint"
                        )}
                      >
                        <Sparkles className="h-3 w-3" />
                        {sticker.text}
                      </span>
                    ))}
                  </div>

                  {/* Monumental Tabloid + Editorial Serif Headline */}
                  <div className="mt-6">
                    <h1 className="font-poster text-5xl sm:text-6xl xl:text-[4.65rem] uppercase leading-[0.9] tracking-tight text-ink">
                      {activeSpread.headlineTop}
                    </h1>
                    <p className="mt-1 font-editorial text-5xl sm:text-6xl xl:text-[4.3rem] italic leading-[0.95] text-riso">
                      {activeSpread.headlineItalic}
                    </p>
                  </div>

                  {/* Broadsheet Two-Rule Editorial Deck */}
                  <div className="mt-6 border-y border-ink/20 py-4">
                    <p className="font-sans text-sm sm:text-base leading-relaxed text-ink/85">
                      {activeSpread.leadCopy}
                    </p>
                  </div>

                  {/* Mini Print Telemetry Grid */}
                  <div className="mt-5 grid grid-cols-3 gap-2 font-mono text-[10px] uppercase tracking-[0.1em]">
                    <div className="border border-ink/25 bg-newsprint/70 p-2.5">
                      <div className="text-ink/55">REVEALED</div>
                      <div className="mt-0.5 text-sm font-bold text-ink">
                        05 CUTS
                      </div>
                    </div>
                    <div className="border border-ink/25 bg-newsprint/70 p-2.5">
                      <div className="text-ink/55">FOIL SEALED</div>
                      <div className="mt-0.5 text-sm font-bold text-riso">
                        05 VAULT
                      </div>
                    </div>
                    <div className="border border-ink/25 bg-newsprint/70 p-2.5">
                      <div className="text-ink/55">RESTOCKS</div>
                      <div className="mt-0.5 text-sm font-bold text-ink">
                        NEVER
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTAs & Issue Footnotes */}
                <div className="mt-8">
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href="#stamp-card"
                      className="inline-flex items-center gap-2 border-2 border-ink bg-riso px-5 py-3 font-mono text-xs font-extrabold uppercase tracking-[0.14em] text-white shadow-[4px_4px_0px_#0A0A0A] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#0A0A0A]"
                    >
                      <Stamp className="h-4 w-4" />
                      <span>STAMP MY WAITLIST CARD →</span>
                    </a>

                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 border-2 border-ink bg-newsprint px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-newsprint cursor-pointer"
                    >
                      <span>TURN TO NEXT PAGE →</span>
                    </button>
                  </div>

                  <div className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-ink/20 pt-2.5 font-mono text-[9px] uppercase tracking-[0.16em] text-ink/55">
                    <span>{activeSpread.footnoteLeft}</span>
                    <span>{activeSpread.footnoteRight}</span>
                  </div>
                </div>
              </div>

              {/* RIGHT PAGE — Full-Bleed Pinned Editorial Print */}
              <div className="relative flex flex-col justify-between bg-newsprint/50 p-6 sm:p-10 lg:pl-12">
                {/* Page Top Folio */}
                <div className="mb-4 flex items-center justify-between border-b border-ink/20 pb-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink/65">
                  <span>{activeSpread.figureCode} · ARCHIVE PHOTOGRAPH</span>
                  <span>P. {activeSpread.pageRange.split("–")[1]}</span>
                </div>

                {/* Pinned Editorial Print Frame with Masking Tape Strips */}
                <div className="relative my-2 flex-1">
                  {/* Top-Left Masking Tape Strip */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-3 -top-3 z-10 h-6 w-20 -rotate-12 border border-ink/15 bg-[#EFE7D1]/85 shadow-sm backdrop-blur-[1px]"
                  />
                  {/* Top-Right Masking Tape Strip */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-3 -top-3 z-10 h-6 w-20 rotate-12 border border-ink/15 bg-[#EFE7D1]/85 shadow-sm backdrop-blur-[1px]"
                  />

                  <div className="group relative h-[360px] sm:h-[440px] lg:h-[470px] w-full overflow-hidden border-2 border-ink bg-manila p-2.5 shadow-[5px_5px_0px_rgba(10,10,10,0.1)]">
                    <div className="relative h-full w-full overflow-hidden border border-ink/25 bg-ink/5">
                      <img
                        src={activeSpread.imageUrl}
                        alt={activeSpread.captionTitle}
                        className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />

                      {/* Corner Risograph Stamp */}
                      <div className="absolute left-3 top-3 -rotate-2 border-2 border-ink bg-ochre px-2.5 py-1 font-mono text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink shadow-[2px_2px_0px_#0A0A0A]">
                        {activeSpread.editorialStamp}
                      </div>

                      {/* Clickable Inspect Piece Floating Action */}
                      {featuredProduct && (
                        <button
                          type="button"
                          suppressHydrationWarning
                          onClick={() => onInspectProduct(featuredProduct)}
                          className="absolute bottom-3 right-3 inline-flex items-center gap-2 border-2 border-ink bg-white/95 px-3.5 py-2 font-mono text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink shadow-[3px_3px_0px_#0A0A0A] transition-all hover:bg-riso hover:text-white cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>INSPECT PIECE</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Caption Ledger Footer */}
                <div className="mt-4 border-t-2 border-ink pt-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-editorial text-xl sm:text-2xl italic leading-tight text-ink">
                        {activeSpread.captionTitle}
                      </p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60">
                        {activeSpread.captionMeta}
                      </p>
                    </div>

                    {featuredProduct && (
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={() => onInspectProduct(featuredProduct)}
                        className="text-right font-mono text-[10px] uppercase tracking-[0.12em] hover:text-riso transition-colors cursor-pointer"
                      >
                        <div className="font-bold text-ink">
                          {featuredProduct.serialCode}
                        </div>
                        <div className="font-extrabold text-riso">
                          {formatInr(featuredProduct.priceInr)} · VIEW →
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.article>
          </AnimatePresence>
        </div>

        {/* Bottom Page-Curl Navigation Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-white px-3 py-2.5 shadow-[4px_4px_0px_#0A0A0A] sm:px-4">
          <button
            type="button"
            suppressHydrationWarning
            onClick={handlePrev}
            className="inline-flex items-center gap-1.5 border border-ink bg-newsprint px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-newsprint cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>PREV SPREAD</span>
          </button>

          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {SPREADS.map((spread, idx) => {
              const isActive = idx === spreadIndex;
              return (
                <button
                  key={spread.id}
                  type="button"
                  suppressHydrationWarning
                  onClick={() => goToSpread(idx)}
                  className={cn(
                    "inline-flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] transition-all cursor-pointer",
                    isActive
                      ? "border-ink bg-ink text-newsprint shadow-[2px_2px_0px_#E6007A]"
                      : "border-ink/25 bg-newsprint/60 text-ink/75 hover:border-ink hover:bg-manila"
                  )}
                >
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-riso" />
                  )}
                  <span>
                    {idx === 0 ? `PAGE ${spread.pageRange}` : spread.pageRange}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            suppressHydrationWarning
            onClick={handleNext}
            className="group relative inline-flex items-center gap-1.5 border border-ink bg-ochre px-3.5 py-2 font-mono text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-riso hover:text-white cursor-pointer"
          >
            <span>NEXT SPREAD</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
