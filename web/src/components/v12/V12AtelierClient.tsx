"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { V10_MEDIA } from "@/components/v10/v10-media";

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
    label: "HALF REVEALED",
    phase: "STAGE II · EXHIBITION",
    description:
      "Half of each ten-piece edition is previewed publicly while the remaining silhouettes stay veiled until private admission opens.",
  },
  {
    step: "03",
    label: "PRIVATE CLAIM",
    phase: "STAGE III · ALLOCATION",
    description:
      "Admitted waitlist collectors claim either a small-batch run (3–4 numbered units) or a singular one-of-one garment.",
  },
  {
    step: "04",
    label: "CUT TO ORDER",
    phase: "STAGE IV · FULFILLMENT",
    description:
      "Once claimed, each garment is cut, embroidered, hand-finished, individually numbered, and dispatched insured across India.",
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

export default function V12AtelierClient() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#000000]">
      {/* Act 1 — Pure-White Manifesto Spread */}
      <section className="border-b border-black/10 bg-[#FFFFFF] py-14 sm:py-20">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.22em] text-[#666666] uppercase">
                <span className="inline-block h-2 w-2 bg-[#E11D2E]" />
                <span>THE ATELIER · SAMPLE-FIRST METHODOLOGY</span>
              </div>

              <h1 className="mt-5 font-syne text-5xl font-extrabold leading-[0.92] tracking-[-0.03em] text-[#000000] uppercase sm:text-7xl lg:text-[82px]">
                <span className="text-[#E11D2E]">0% DEADSTOCK.</span> CUT ONLY
                WHEN CLAIMED.
              </h1>
            </div>

            <div className="lg:col-span-4">
              <p className="font-sans text-sm leading-relaxed text-[#666666]">
                KNITX operates without open stockrooms, seasonal markdowns, or
                speculative overproduction. Every garment across every edition
                is cut strictly to order from a single physical studio sample.
              </p>

              <div className="mt-6 grid grid-cols-2 border border-black/10 bg-[#F4F4F5] divide-x divide-black/10 font-mono text-[10px] tracking-[0.16em] uppercase">
                <div className="px-4 py-3">
                  <span className="block text-[#666666]">PROTOTYPE</span>
                  <span className="mt-1 block font-semibold text-[#000000]">
                    01 SAMPLE / DESIGN
                  </span>
                </div>
                <div className="px-4 py-3">
                  <span className="block text-[#666666]">WASTE RATE</span>
                  <span className="mt-1 block font-semibold text-[#E11D2E]">
                    0% DEADSTOCK
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Full-Width 21:9 Atelier Cutting Table Photograph */}
          <figure className="mt-12 sm:mt-16">
            <div className="relative aspect-[16/10] w-full overflow-hidden border border-black/10 bg-[#F4F4F5] sm:aspect-[21/9]">
              <Image
                src={V10_MEDIA.atelierCuttingTable}
                alt="KNITX daylight atelier cutting table and heavyweight textile samples"
                fill
                priority
                sizes="(max-width: 1440px) 100vw, 1440px"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4 font-mono text-[10px] tracking-[0.18em] text-[#666666] uppercase">
              <span>FIG. 01 — DAYLIGHT PATTERN CUTTING &amp; SAMPLE TABLE</span>
              <span className="text-[#000000]">
                INDIA · PERMANENT STUDIO STANDARD
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Act 2 — 4-Stage Crisp Numbered Grid */}
      <section className="border-b border-black/10 bg-[#FFFFFF] py-16 sm:py-24">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[10px] tracking-[0.22em] text-[#666666] uppercase">
                PRODUCTION SEQUENCE · FOUR STAGES
              </p>
              <h2 className="mt-3 font-syne text-3xl font-extrabold leading-[1.0] tracking-[-0.02em] text-[#000000] uppercase sm:text-5xl">
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
                    <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#E11D2E] uppercase">
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

      {/* Act 3 — 2-Column Garment Detail Showcase + Material Spec Table */}
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

          {/* 2-Column Garment Detail Showcase */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <figure className="border border-black/10 bg-[#FFFFFF] p-4 sm:p-5">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F4F4F5]">
                <Image
                  src={V10_MEDIA.knit1of1}
                  alt="Heavyweight flat-bed knitwear detail study"
                  fill
                  sizes="(max-width: 768px) 100vw, 48vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-4 flex items-center justify-between gap-2 font-mono text-[10px] tracking-[0.16em] uppercase">
                <span className="font-semibold text-[#000000]">
                  PLATE A · FLAT-BED KNITWEAR
                </span>
                <span className="text-[#666666]">520 GSM STRUCTURE</span>
              </figcaption>
            </figure>

            <figure className="border border-black/10 bg-[#FFFFFF] p-4 sm:p-5">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F4F4F5]">
                <Image
                  src={V10_MEDIA.chainStitchTee}
                  alt="Artisanal Ari chain-stitch heavyweight jersey detail study"
                  fill
                  sizes="(max-width: 768px) 100vw, 48vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-4 flex items-center justify-between gap-2 font-mono text-[10px] tracking-[0.16em] uppercase">
                <span className="font-semibold text-[#000000]">
                  PLATE B · ARI CHAIN-STITCH JERSEY
                </span>
                <span className="text-[#666666]">310 GSM DRY-HAND</span>
              </figcaption>
            </figure>
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
                  <div className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#E11D2E] uppercase md:col-span-2">
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
                EDITION ROOM · PERMANENT ARCHIVE
              </p>
              <h2 className="mt-4 font-syne text-4xl font-extrabold leading-[0.96] tracking-[-0.02em] text-[#FFFFFF] uppercase sm:text-6xl">
                FEWER GARMENTS. BUILT TO OUTLAST SEASONS.
              </h2>
              <p className="mt-5 max-w-xl font-sans text-sm leading-relaxed text-white/70">
                Enter the active private release or review our sequential
                editions calendar and permanent tier structure.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
              <Link
                href="/v12/release"
                className="inline-flex items-center justify-center gap-2.5 border border-[#FFFFFF] bg-[#FFFFFF] px-7 py-4 font-sans text-[11px] font-semibold tracking-[0.2em] text-[#000000] uppercase transition-colors hover:border-[#E11D2E] hover:bg-[#E11D2E] hover:text-[#FFFFFF]"
              >
                <span>ENTER RELEASE</span>
                <ArrowUpRight className="h-3.5 w-3.5 stroke-[2]" />
              </Link>

              <Link
                href="/v12/releases"
                className="inline-flex items-center justify-center gap-2.5 border border-white/25 bg-transparent px-7 py-4 font-sans text-[11px] font-semibold tracking-[0.2em] text-[#FFFFFF] uppercase transition-colors hover:border-[#FFFFFF]"
              >
                <span>RELEASES &amp; ARCHIVE</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
