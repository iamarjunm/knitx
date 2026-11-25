"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useStorefrontConfig } from "@/context/StorefrontConfigContext";
import { FLAGSHIP_MEDIA } from "@/lib/flagship-media";

const PRODUCTION_STAGES = [
  {
    step: "01",
    label: "SINGLE SAMPLE",
    phase: "STAGE I · PROTOTYPING",
    description:
      "Only one physical garment per silhouette is cut and finished for editorial documentation. Zero speculative bulk stock.",
  },
  {
    step: "02",
    label: "SELECT PREVIEW",
    phase: "STAGE II · EXHIBITION",
    description:
      "Selected silhouettes from each drop are previewed publicly while remaining pieces unlock automatically once your account receives access.",
  },
  {
    step: "03",
    label: "PRIVATE CLAIM",
    phase: "STAGE III · ALLOCATION",
    description:
      "Admitted collector accounts claim either a curated small-batch run or a singular one-of-one garment—no access code required.",
  },
  {
    step: "04",
    label: "CUT TO ORDER",
    phase: "STAGE IV · FULFILLMENT",
    description:
      "Once claimed, each garment is cut, embroidered, hand-finished, individually numbered, and dispatched insured across India.",
  },
] as const;

const DETAIL_PLATES = [
  {
    plate: "PLATE A · FLAT-BED KNITWEAR",
    spec: "520 GSM STRUCTURE",
    image: FLAGSHIP_MEDIA.knit1of1,
    alt: "Heavyweight flat-bed knitwear detail study",
    caption:
      "Singular one-of-one knit architecture engineered on industrial flat-bed gauges with zero repeat runs.",
  },
  {
    plate: "PLATE B · ARI CHAIN-STITCH JERSEY",
    spec: "310 GSM DRY-HAND",
    image: FLAGSHIP_MEDIA.chainStitchTee,
    alt: "Artisanal Ari chain-stitch heavyweight jersey detail study",
    caption:
      "Hand-guided karigar chain-stitch linework executed across dense combed Indian single jersey.",
  },
  {
    plate: "PLATE C · KNITX CORE MINERAL STACK",
    spec: "320–480 GSM ESSENTIALS",
    image: FLAGSHIP_MEDIA.coreColorwaysStack,
    alt: "KNITX Core minimalist everyday essentials stacked in curated mineral colorways",
    caption:
      "Minimalist everyday essentials in curated mineral colorways, finished with subtle signature KNITX branding (tonal embroidery & woven labels).",
  },
] as const;

const MATERIAL_SPECS = [
  {
    code: "MAT-01",
    spec: "310–520 GSM INDIAN COTTON & WOOL",
    metric: "HEAVYWEIGHT STRUCTURE",
    detail:
      "Dry-hand single jerseys, diagonal loopback French terry, waxed duck canvas, and heavy flat-bed jacquard knits milled for architectural drape.",
  },
  {
    code: "MAT-02",
    spec: "ARTISANAL ARI CHAIN-STITCHING",
    metric: "HAND-GUIDED KARIGAR WORK",
    detail:
      "Chain-stitch typography and geometric linework executed by skilled artisans using matte tonal and contrast threads.",
  },
  {
    code: "MAT-03",
    spec: "MULTI-PASS RAISED PUFF PRINTS",
    metric: "HIGH-DENSITY RELIEF",
    detail:
      "Layered ink applications cured across multiple passes to produce sculptural surface relief engineered to endure wear.",
  },
  {
    code: "MAT-04",
    spec: "NUMBERED WOVEN ARCHIVE TAGS",
    metric: "SERIAL PROVENANCE",
    detail:
      "Every piece carries an interior edition label recording its exact serial number, edition code, and creator credit.",
  },
  {
    code: "MAT-05",
    spec: "PERMANENT PATTERN RETIREMENT",
    metric: "ZERO RESTOCKS",
    detail:
      "Once an edition's small-batch or one-of-one allocation closes, the pattern block is archived permanently and never re-cut.",
  },
] as const;

export default function FlagshipAtelierClient() {
  const { config } = useStorefrontConfig();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const accent =
    mounted && config.accentColor ? config.accentColor : "#E11D2E";

  return (
    <div
      className="min-h-screen overflow-x-clip bg-[#FFFFFF] text-[#000000]"
      style={{ "--flagship-accent": accent } as React.CSSProperties}
    >
      {/* Act 1 — Pure-White Manifesto Spread */}
      <header className="border-b border-black/10 bg-[#FFFFFF] py-12 sm:py-20">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 items-end gap-8 sm:gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.2em] text-[#666666] uppercase sm:tracking-[0.22em]">
                <span className="inline-block h-2 w-2 shrink-0 bg-[var(--flagship-accent)]" />
                <span>THE ATELIER · SAMPLE-FIRST METHODOLOGY</span>
              </div>

              <h1 className="mt-4 font-syne text-[36px] font-extrabold leading-[0.94] tracking-[-0.03em] text-[#000000] uppercase break-words sm:mt-5 sm:text-6xl lg:text-[80px]">
                <span className="text-[var(--flagship-accent)]">
                  0% DEADSTOCK.
                </span>{" "}
                CUT ONLY WHEN CLAIMED.
              </h1>
            </div>

            <div className="lg:col-span-4">
              <p className="font-sans text-sm leading-relaxed text-[#666666]">
                KNITX operates without open stockrooms, seasonal markdowns, or
                speculative overproduction. Every garment across every edition
                is cut strictly to order from a single physical studio sample.
              </p>

              <div className="mt-6 grid grid-cols-2 divide-x divide-black/10 border border-black/10 bg-[#F4F4F5] font-mono text-[10px] tracking-[0.14em] uppercase sm:tracking-[0.16em]">
                <div className="px-3.5 py-3 sm:px-4">
                  <span className="block text-[#666666]">PROTOTYPE</span>
                  <span className="mt-1 block font-semibold text-[#000000]">
                    01 SAMPLE / DESIGN
                  </span>
                </div>
                <div className="px-3.5 py-3 sm:px-4">
                  <span className="block text-[#666666]">WASTE RATE</span>
                  <span className="mt-1 block font-semibold text-[var(--flagship-accent)]">
                    0% DEADSTOCK
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Full-Width 16:10 Mobile / 21:9 Desktop Sunlit Atelier Hero Photograph */}
          <figure className="mt-10 sm:mt-16">
            <div className="relative aspect-[16/10] w-full overflow-hidden border border-black/10 bg-[#F4F4F5] sm:aspect-[21/9]">
              <Image
                src={FLAGSHIP_MEDIA.atelierSunlit}
                alt="Sunlit KNITX atelier cutting room with heavyweight textile bolts and garment patterns"
                fill
                priority
                sizes="(max-width: 1440px) 100vw, 1440px"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-4 font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase sm:gap-3 sm:tracking-[0.18em]">
              <span>FIG. 01 — SUNLIT PATTERN CUTTING &amp; SAMPLE ATELIER</span>
              <span className="text-[#000000]">
                INDIA · PERMANENT STUDIO STANDARD
              </span>
            </figcaption>
          </figure>
        </div>
      </header>

      {/* Act 2 — 4-Stage Crisp Numbered Grid */}
      <section className="border-b border-black/10 bg-[#FFFFFF] py-14 sm:py-24">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[10px] tracking-[0.22em] text-[#666666] uppercase">
                PRODUCTION SEQUENCE · FOUR STAGES
              </p>
              <h2 className="mt-3 font-syne text-[28px] font-extrabold leading-[1.02] tracking-[-0.02em] text-[#000000] uppercase break-words sm:text-5xl">
                FROM SINGLE SAMPLE TO NUMBERED DISPATCH.
              </h2>
            </div>
            <span className="font-mono text-[10px] tracking-[0.18em] text-[#666666] uppercase">
              04 CONTROLLED GATES
            </span>
          </div>

          <div className="mt-12 grid grid-cols-1 border border-black/10 md:grid-cols-2 lg:grid-cols-4">
            {PRODUCTION_STAGES.map((stage, idx) => (
              <article
                key={stage.step}
                className={`flex flex-col justify-between bg-[#FFFFFF] p-7 sm:p-8 ${
                  idx > 0 ? "border-t border-black/10" : ""
                } ${idx === 1 ? "md:border-t-0 md:border-l" : ""} ${
                  idx === 2 ? "lg:border-t-0 lg:border-l" : ""
                } ${idx === 3 ? "md:border-l lg:border-t-0" : ""}`}
              >
                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-poster text-4xl leading-none text-[#000000]">
                      {stage.step}
                    </span>
                    <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[var(--flagship-accent)] uppercase">
                      {stage.label}
                    </span>
                  </div>

                  <p className="mt-6 font-sans text-sm leading-relaxed text-[#666666]">
                    {stage.description}
                  </p>
                </div>

                <p className="mt-10 border-t border-black/10 pt-4 font-mono text-[10px] tracking-[0.16em] text-[#000000] uppercase">
                  {stage.phase}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Act 3 — 3-Plate Textile & Garment Detail Showcase + Material Spec Table */}
      <section className="border-b border-black/10 bg-[#F4F4F5] py-16 sm:py-24">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          <div className="mb-12 max-w-2xl">
            <p className="font-mono text-[10px] tracking-[0.22em] text-[#666666] uppercase">
              GARMENT DETAIL STUDY · MATERIAL SPECIFICATION
            </p>
            <h2 className="mt-3 font-syne text-3xl font-extrabold leading-[1.0] tracking-[-0.02em] text-[#000000] uppercase sm:text-5xl">
              HEAVYWEIGHT TEXTILES. ARCHIVAL PERMANENCE.
            </h2>
          </div>

          {/* 3-Column Garment & Core Textile Plates */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {DETAIL_PLATES.map((plate) => (
              <figure
                key={plate.plate}
                className="flex flex-col border border-black/10 bg-[#FFFFFF] p-4 sm:p-5"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F4F4F5]">
                  <Image
                    src={plate.image}
                    alt={plate.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 31vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-4 flex flex-1 flex-col justify-between">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-3 font-mono text-[10px] tracking-[0.16em] uppercase">
                    <span className="font-semibold text-[#000000]">
                      {plate.plate}
                    </span>
                    <span className="text-[#666666]">{plate.spec}</span>
                  </div>
                  <p className="mt-3 font-sans text-xs leading-relaxed text-[#666666]">
                    {plate.caption}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>

          {/* Crisp Material Spec Table */}
          <div className="mt-14 border border-black/10 bg-[#FFFFFF]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 bg-[#000000] px-6 py-4 text-[#FFFFFF]">
              <span className="font-mono text-[10px] font-semibold tracking-[0.2em] uppercase">
                MATERIAL SPECIFICATION TABLE
              </span>
              <span className="font-mono text-[10px] tracking-[0.18em] text-white/70 uppercase">
                HELD CONSTANT ACROSS EVERY EDITION
              </span>
            </div>

            <div className="divide-y divide-black/10">
              {MATERIAL_SPECS.map((row) => (
                <div
                  key={row.code}
                  className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-12 md:items-baseline"
                >
                  <div className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[var(--flagship-accent)] uppercase md:col-span-2">
                    {row.code}
                  </div>
                  <div className="md:col-span-4">
                    <p className="font-syne text-sm font-extrabold tracking-[0.02em] text-[#000000] uppercase">
                      {row.spec}
                    </p>
                    <p className="mt-1 font-mono text-[10px] tracking-[0.14em] text-[#666666] uppercase">
                      {row.metric}
                    </p>
                  </div>
                  <p className="font-sans text-xs leading-relaxed text-[#666666] sm:text-sm md:col-span-6">
                    {row.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Act 4 — High-Contrast Jet-Black Closing CTAs */}
      <section className="bg-[#000000] py-20 text-[#FFFFFF] sm:py-24">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="font-mono text-[10px] tracking-[0.22em] text-white/60 uppercase">
                CURRENT EDITION · KNITX CORE · PERMANENT ARCHIVE
              </p>
              <h2 className="mt-4 font-syne text-4xl font-extrabold leading-[0.96] tracking-[-0.02em] text-[#FFFFFF] uppercase sm:text-6xl">
                FEWER GARMENTS. BUILT TO OUTLAST SEASONS.
              </h2>
              <p className="mt-5 max-w-xl font-sans text-sm leading-relaxed text-white/70">
                Enter the active private drop, inspect the heavyweight KNITX
                CORE wardrobe, or review our sequential editions calendar.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:col-span-5 lg:justify-end">
              <Link
                href="/drops"
                className="inline-flex items-center justify-center gap-2.5 border border-[#FFFFFF] bg-[#FFFFFF] px-7 py-4 font-sans text-[11px] font-semibold tracking-[0.2em] text-[#000000] uppercase transition-colors hover:border-[var(--flagship-accent)] hover:bg-[var(--flagship-accent)] hover:text-[#FFFFFF]"
              >
                <span>ENTER DROP</span>
                <ArrowUpRight className="h-3.5 w-3.5 stroke-[2]" />
              </Link>

              <Link
                href="/core"
                className="inline-flex items-center justify-center gap-2.5 border border-white/25 bg-transparent px-7 py-4 font-sans text-[11px] font-semibold tracking-[0.2em] text-[#FFFFFF] uppercase transition-colors hover:border-[#FFFFFF]"
              >
                <span>KNITX CORE</span>
              </Link>

              <Link
                href="/archive"
                className="inline-flex items-center justify-center gap-2.5 border border-white/25 bg-transparent px-7 py-4 font-sans text-[11px] font-semibold tracking-[0.2em] text-[#FFFFFF] uppercase transition-colors hover:border-[#FFFFFF]"
              >
                <span>EDITIONS &amp; ARCHIVE</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
