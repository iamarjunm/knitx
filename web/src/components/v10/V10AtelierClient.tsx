"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { V10_MEDIA } from "@/components/v10/v10-media";

const PRODUCTION_STAGES = [
  {
    step: "01",
    label: "SINGLE SAMPLE",
    phase: "STAGE I · PROTOTYPING",
    description:
      "Only one garment per design is cut and finished for editorial documentation. No speculative bulk inventory.",
  },
  {
    step: "02",
    label: "HALF REVEALED",
    phase: "STAGE II · EXHIBITION",
    description:
      "Half of each ten-piece release is previewed publicly; five silhouettes remain veiled until private waitlist admission.",
  },
  {
    step: "03",
    label: "PRIVATE CLAIM",
    phase: "STAGE III · ALLOCATION",
    description:
      "Admitted waitlist collectors reserve either a small-batch edition (3–4 units) or a singular one-of-one work.",
  },
  {
    step: "04",
    label: "CUT TO ORDER",
    phase: "STAGE IV · FULFILLMENT",
    description:
      "Once claimed, each garment is cut, embroidered, hand-finished, individually numbered, and dispatched insured across India.",
  },
] as const;

const MATERIAL_LEDGER = [
  {
    index: "01",
    title: "310–520 GSM Indian Cotton & Wool",
    note: "Dry-hand single jerseys, diagonal loopback French terry, waxed duck canvas, and heavy flat-bed jacquard knits milled for architectural drape.",
  },
  {
    index: "02",
    title: "Artisanal Ari Chain-Stitching",
    note: "Hand-guided chain-stitch typography and geometric linework executed by master karigars using matte tonal and metallic threads.",
  },
  {
    index: "03",
    title: "Multi-Pass Raised Puff Prints",
    note: "High-density architectural ink layers cured across multiple passes for sculptural surface relief built to endure wear.",
  },
  {
    index: "04",
    title: "Individually Numbered Woven Archive Tags",
    note: "Every garment carries an interior edition tag specifying its serial allocation, release designation, and creator attribution.",
  },
  {
    index: "05",
    title: "Permanent Pattern Retirement",
    note: "Once an edition's small-batch or one-of-one allocation is claimed, the pattern block enters the house archive and is never restocked.",
  },
] as const;

export default function V10AtelierClient() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111110]">
      {/* Act 1 — Monumental Opening Spread */}
      <section className="border-b border-[#111110]/10 bg-[#FAF9F6] py-16 sm:py-24">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="font-sans text-[11px] tracking-[0.22em] text-[#6E6A63] uppercase">
                THE ATELIER · SAMPLE-FIRST METHODOLOGY
              </p>
              <h1 className="mt-5 font-editorial text-5xl leading-[0.94] tracking-[-0.015em] text-[#111110] sm:text-7xl lg:text-[82px]">
                Zero deadstock.{" "}
                <span className="italic">Cut only when claimed.</span>
              </h1>
            </div>

            <div className="lg:col-span-4">
              <p className="font-sans text-sm leading-relaxed text-[#6E6A63]">
                KNITX operates without open stockrooms, seasonal markdowns, or
                speculative overproduction. Every edition across our house is
                realized strictly to order from a single physical studio sample.
              </p>
              <div className="mt-6 flex items-center justify-between border-t border-[#111110]/10 pt-4 font-mono text-[10px] tracking-[0.18em] text-[#111110] uppercase">
                <span>1 SAMPLE PER DESIGN</span>
                <span className="text-[#8C1D18]">0% DEADSTOCK</span>
              </div>
            </div>
          </div>

          {/* Full-Bleed Architectural Photograph */}
          <figure className="mt-12 sm:mt-16">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-none bg-[#141413] sm:aspect-[21/9]">
              <Image
                src={V10_MEDIA.atelierCuttingTable}
                alt="KNITX daylight atelier cutting table and textile specimens"
                fill
                priority
                sizes="(max-width: 1380px) 100vw, 1380px"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#111110]/10 pb-4 font-mono text-[10px] tracking-[0.18em] text-[#6E6A63] uppercase">
              <span>FIG. 01 — DAYLIGHT PATTERN CUTTING &amp; SAMPLE TABLE</span>
              <span>INDIA · PERMANENT HOUSE STANDARD</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Act 2 — 4-Stage Architectural Production Sequence */}
      <section className="bg-[#FFFFFF] py-20 sm:py-28">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 lg:px-14">
          <div className="max-w-2xl">
            <p className="font-sans text-[11px] tracking-[0.22em] text-[#6E6A63] uppercase">
              PRODUCTION SEQUENCE · FOUR STAGES
            </p>
            <h2 className="mt-4 font-editorial text-4xl leading-[1.02] text-[#111110] sm:text-5xl">
              From single prototype to{" "}
              <span className="italic">numbered dispatch.</span>
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 divide-y divide-[#111110]/10 border-t border-b border-[#111110]/10 md:grid-cols-2 md:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {PRODUCTION_STAGES.map((stage, index) => (
              <article
                key={stage.step}
                className={`flex flex-col justify-between py-8 lg:px-8 lg:py-10 ${
                  index === 0 ? "md:pr-8 lg:pl-0" : ""
                } ${index === PRODUCTION_STAGES.length - 1 ? "lg:pr-0" : ""} ${
                  index === 1 ? "md:border-l md:border-[#111110]/10 md:pl-8 lg:border-l" : ""
                } ${
                  index === 2
                    ? "md:border-t md:border-[#111110]/10 md:pr-8 lg:border-t-0"
                    : ""
                } ${
                  index === 3
                    ? "md:border-t md:border-l md:border-[#111110]/10 md:pl-8 lg:border-t-0"
                    : ""
                }`}
              >
                <div>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-[#8C1D18] uppercase">
                    {stage.step} · {stage.label}
                  </p>
                  <p className="mt-5 font-sans text-sm leading-relaxed text-[#6E6A63]">
                    {stage.description}
                  </p>
                </div>

                <p className="mt-10 border-t border-[#111110]/8 pt-4 font-mono text-[10px] tracking-[0.16em] text-[#111110]/70 uppercase">
                  {stage.phase}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Act 3 — Materiality & Craft Diptych */}
      <section className="border-t border-[#111110]/10 bg-[#F2EFE9] py-20 sm:py-28">
        <div className="mx-auto grid max-w-[1380px] grid-cols-1 items-start gap-12 px-6 sm:px-10 lg:grid-cols-12 lg:gap-16 lg:px-14">
          {/* Diptych Photography */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-7">
            <figure>
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-none bg-[#141413]">
                <Image
                  src={V10_MEDIA.knit1of1}
                  alt="Heavyweight hand-loomed KNITX knitwear study"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 28vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-3.5 font-mono text-[10px] tracking-[0.16em] text-[#6E6A63] uppercase">
                PLATE A · HEAVYWEIGHT FLAT-BED KNITWEAR
              </figcaption>
            </figure>

            <figure className="sm:mt-12">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-none bg-[#141413]">
                <Image
                  src={V10_MEDIA.chainStitchTee}
                  alt="Artisanal Ari chain-stitch jersey garment study"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 28vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-3.5 font-mono text-[10px] tracking-[0.16em] text-[#6E6A63] uppercase">
                PLATE B · ARI CHAIN-STITCH SURFACE WORK
              </figcaption>
            </figure>
          </div>

          {/* Razor-Clean Material Ledger */}
          <div className="lg:col-span-5">
            <p className="font-sans text-[11px] tracking-[0.22em] text-[#6E6A63] uppercase">
              MATERIAL LEDGER · HOUSE STANDARDS
            </p>
            <h2 className="mt-4 font-editorial text-4xl leading-[1.02] text-[#111110] sm:text-5xl">
              Craft built for{" "}
              <span className="italic">archival permanence.</span>
            </h2>
            <p className="mt-5 font-sans text-sm leading-relaxed text-[#6E6A63]">
              Every silhouette begins with heavyweight Indian textiles and
              tactile handwork. Specifications are held constant across every
              numbered edition.
            </p>

            <dl className="mt-10 divide-y divide-[#111110]/12 border-t border-b border-[#111110]/12">
              {MATERIAL_LEDGER.map((spec) => (
                <div key={spec.index} className="py-5">
                  <dt className="flex items-baseline gap-3">
                    <span className="font-mono text-[10px] tracking-[0.18em] text-[#8C1D18]">
                      {spec.index}
                    </span>
                    <span className="font-editorial text-2xl leading-snug text-[#111110]">
                      {spec.title}
                    </span>
                  </dt>
                  <dd className="mt-1.5 pl-7 font-sans text-xs leading-relaxed text-[#6E6A63]">
                    {spec.note}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Act 4 — Calm Closing Invitation */}
      <section className="border-t border-[#111110]/10 bg-[#FAF9F6] py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center sm:px-10">
          <p className="font-sans text-[11px] tracking-[0.22em] text-[#6E6A63] uppercase">
            EDITION ROOM · PERMANENT ARCHIVE
          </p>
          <h2 className="mt-4 font-editorial text-4xl leading-[1.02] text-[#111110] sm:text-6xl">
            Fewer garments, cut to{" "}
            <span className="italic">endure beyond seasons.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-sans text-sm leading-relaxed text-[#6E6A63]">
            Step inside the current ten-silhouette release or explore our
            permanent archive of retired small-batch and one-of-one editions.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/v10/release"
              className="inline-flex w-full items-center justify-center gap-3 rounded-none border border-[#111110] bg-[#111110] px-8 py-4 font-sans text-[11px] tracking-[0.2em] text-[#FAF9F6] uppercase transition-colors hover:border-[#8C1D18] hover:bg-[#8C1D18] sm:w-auto"
            >
              <span>ENTER CURRENT RELEASE</span>
              <ArrowRight className="h-3.5 w-3.5 stroke-[1.75]" />
            </Link>

            <Link
              href="/v10/archive"
              className="inline-flex w-full items-center justify-center gap-3 rounded-none border border-[#111110]/25 bg-transparent px-8 py-4 font-sans text-[11px] tracking-[0.2em] text-[#111110] uppercase transition-colors hover:border-[#111110] sm:w-auto"
            >
              <span>EXPLORE ARCHIVE</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
