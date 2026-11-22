"use client";

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
      "Only one physical garment per silhouette is cut, finished, and photographed in the studio. Zero speculative stockrooms.",
  },
  {
    step: "02",
    label: "HALF REVEALED",
    phase: "STAGE II · CURATION",
    description:
      "Half of each edition is exhibited publicly; the remaining silhouettes stay veiled until private admission opens.",
  },
  {
    step: "03",
    label: "PRIVATE CLAIM",
    phase: "STAGE III · ALLOCATION",
    description:
      "Admitted waitlist collectors claim either a numbered small-batch unit (3–4 pieces) or a singular one-of-one work.",
  },
  {
    step: "04",
    label: "CUT TO ORDER",
    phase: "STAGE IV · DISPATCH",
    description:
      "Claimed garments are cut, embroidered, hand-finished, tagged with individual serial plates, and dispatched insured across India.",
  },
] as const;

const MATERIAL_LEDGER = [
  {
    index: "01",
    title: "310–520 GSM INDIAN COTTON & WOOL",
    note: "Dry-hand ring-spun single jerseys, diagonal loopback French terry, waxed duck canvas, and heavy flat-bed jacquard knits milled for architectural drape.",
  },
  {
    index: "02",
    title: "ARI CHAIN-STITCHING",
    note: "Hand-guided chain-stitch typography and geometric linework executed by master Indian artisans using matte tonal and metallic threads.",
  },
  {
    index: "03",
    title: "MULTI-PASS RAISED PUFF PRINTS",
    note: "High-density architectural ink layers cured across multiple passes for sculptural surface relief engineered to age with wear.",
  },
  {
    index: "04",
    title: "ENGRAVED & WOVEN NUMBERED PLATES",
    note: "Every garment carries an engraved metal or woven archive plate designating its exact serial number, edition code, and creator credit.",
  },
  {
    index: "05",
    title: "PERMANENT PATTERN RETIREMENT",
    note: "Once a one-of-one or micro-batch run is claimed, the pattern block is archived permanently and never put back into production.",
  },
] as const;

export default function V11AtelierClient() {
  return (
    <div className="min-h-screen bg-[#070709] text-[#F4F2ED]">
      {/* Act 1 — Dark Cinema Opening Spread */}
      <section className="border-b border-white/10 bg-[#070709] py-14 sm:py-20">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 items-end gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.26em] text-[#8E8C87] uppercase">
                <span className="inline-block h-1.5 w-1.5 bg-[#C81E1E]" />
                <span>THE ATELIER · SAMPLE-FIRST METHODOLOGY</span>
              </div>

              <h1 className="mt-6 font-syne text-5xl leading-[0.9] font-extrabold tracking-[-0.03em] text-[#F4F2ED] uppercase sm:text-7xl lg:text-[84px]">
                ZERO DEADSTOCK. CUT ONLY WHEN CLAIMED.
              </h1>
            </div>

            <div className="lg:col-span-4">
              <p className="font-sans text-sm leading-relaxed text-[#8E8C87]">
                KNITX operates without open retail shelves, markdown cycles, or
                speculative bulk inventory. Every numbered edition across the
                house is realized strictly to order from one physical sample.
              </p>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 font-mono text-[10px] tracking-[0.2em] uppercase">
                <span className="text-[#F4F2ED]">01 SAMPLE PER DESIGN</span>
                <span className="text-[#C81E1E]">0% DEADSTOCK</span>
              </div>
            </div>
          </div>

          {/* Full-Width 21:9 Atelier Hero Melting Into Obsidian */}
          <figure className="mt-14 sm:mt-16">
            <div className="relative aspect-[16/10] w-full overflow-hidden border border-white/10 bg-[#141419] sm:aspect-[21/9]">
              <Image
                src={V10_MEDIA.atelierCuttingTable}
                alt="KNITX atelier cutting table and heavyweight textile archive"
                fill
                priority
                sizes="(max-width: 1440px) 100vw, 1440px"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070709]/85 via-[#070709]/25 to-transparent" />
            </div>

            <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 font-mono text-[10px] tracking-[0.2em] text-[#8E8C87] uppercase">
              <span>FIG. 01 — PATTERN CUTTING &amp; SAMPLE PROTOTYPING TABLE</span>
              <span>INDIA · HOUSE STANDARD</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Act 2 — 4-Stage Hairline Production Sequence */}
      <section className="border-b border-white/10 bg-[#0E0E12] py-20 sm:py-28">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] tracking-[0.24em] text-[#8E8C87] uppercase">
              PRODUCTION SEQUENCE · FOUR STAGES
            </p>
            <h2 className="mt-4 font-syne text-4xl leading-[0.95] font-extrabold tracking-[-0.025em] text-[#F4F2ED] uppercase sm:text-5xl">
              FROM SINGLE PROTOTYPE TO NUMBERED DISPATCH
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 divide-y divide-white/10 border-t border-b border-white/10 md:grid-cols-2 md:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {PRODUCTION_STAGES.map((stage, index) => (
              <article
                key={stage.step}
                className={`flex flex-col justify-between py-8 lg:px-8 lg:py-10 ${
                  index === 0 ? "md:pr-8 lg:pl-0" : ""
                } ${index === PRODUCTION_STAGES.length - 1 ? "lg:pr-0" : ""} ${
                  index === 1
                    ? "md:border-l md:border-white/10 md:pl-8 lg:border-l"
                    : ""
                } ${
                  index === 2
                    ? "md:border-t md:border-white/10 md:pr-8 lg:border-t-0"
                    : ""
                } ${
                  index === 3
                    ? "md:border-t md:border-l md:border-white/10 md:pl-8 lg:border-t-0"
                    : ""
                }`}
              >
                <div>
                  <p className="font-mono text-[11px] font-semibold tracking-[0.22em] text-[#C81E1E] uppercase">
                    {stage.step} {stage.label}
                  </p>
                  <p className="mt-5 font-sans text-sm leading-relaxed text-[#8E8C87]">
                    {stage.description}
                  </p>
                </div>

                <p className="mt-10 border-t border-white/10 pt-4 font-mono text-[10px] tracking-[0.18em] text-[#F4F2ED]/65 uppercase">
                  {stage.phase}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Act 3 — Dark Garment Diptych + Material Ledger */}
      <section className="border-b border-white/10 bg-[#070709] py-20 sm:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-start gap-12 px-6 sm:px-10 lg:grid-cols-12 lg:gap-16 lg:px-14">
          {/* Dark Garment Diptych */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-7">
            <figure>
              <div className="relative aspect-[3/4] w-full overflow-hidden border border-white/10 bg-[#141419]">
                <Image
                  src={V10_MEDIA.knit1of1}
                  alt="Heavyweight flat-bed jacquard knitwear study"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 28vw"
                  className="object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070709]/80 via-transparent to-transparent" />
              </div>
              <figcaption className="mt-3.5 font-mono text-[10px] tracking-[0.18em] text-[#8E8C87] uppercase">
                PLATE A · HEAVYWEIGHT FLAT-BED KNITWEAR
              </figcaption>
            </figure>

            <figure className="sm:mt-14">
              <div className="relative aspect-[3/4] w-full overflow-hidden border border-white/10 bg-[#141419]">
                <Image
                  src={V10_MEDIA.chainStitchTee}
                  alt="Artisanal Ari chain-stitch heavyweight cotton jersey study"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 28vw"
                  className="object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070709]/80 via-transparent to-transparent" />
              </div>
              <figcaption className="mt-3.5 font-mono text-[10px] tracking-[0.18em] text-[#8E8C87] uppercase">
                PLATE B · ARI CHAIN-STITCH SURFACE WORK
              </figcaption>
            </figure>
          </div>

          {/* Material Ledger */}
          <div className="lg:col-span-5">
            <p className="font-mono text-[10px] tracking-[0.24em] text-[#8E8C87] uppercase">
              MATERIAL LEDGER · HOUSE STANDARDS
            </p>
            <h2 className="mt-4 font-syne text-4xl leading-[0.95] font-extrabold tracking-[-0.025em] text-[#F4F2ED] uppercase sm:text-5xl">
              CRAFT BUILT FOR PERMANENCE
            </h2>
            <p className="mt-5 font-sans text-sm leading-relaxed text-[#8E8C87]">
              Every silhouette begins with heavyweight Indian textiles and
              tactile handwork. Specifications are held constant across every
              numbered release.
            </p>

            <dl className="mt-10 divide-y divide-white/10 border-t border-b border-white/10">
              {MATERIAL_LEDGER.map((spec) => (
                <div key={spec.index} className="py-5">
                  <dt className="flex items-baseline gap-3">
                    <span className="font-mono text-[10px] tracking-[0.2em] text-[#C81E1E]">
                      {spec.index}
                    </span>
                    <span className="font-syne text-base font-bold tracking-[0.02em] text-[#F4F2ED] uppercase">
                      {spec.title}
                    </span>
                  </dt>
                  <dd className="mt-2 pl-7 font-sans text-xs leading-relaxed text-[#8E8C87]">
                    {spec.note}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Act 4 — Closing CTAs */}
      <section className="bg-[#0E0E12] py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center sm:px-10">
          <p className="font-mono text-[10px] tracking-[0.26em] text-[#C81E1E] uppercase">
            PRIVATE EDITION ROOM · PERMANENT ARCHIVE
          </p>
          <h2 className="mt-4 font-syne text-4xl leading-[0.95] font-extrabold tracking-[-0.025em] text-[#F4F2ED] uppercase sm:text-6xl">
            FEWER GARMENTS. CUT TO ENDURE.
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-sans text-sm leading-relaxed text-[#8E8C87]">
            Enter the current numbered release or review our sequential calendar
            of active, balloted, and upcoming editions.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/v11/release"
              className="inline-flex w-full items-center justify-center gap-3 rounded-none border border-[#F4F2ED] bg-[#F4F2ED] px-8 py-4 font-sans text-[11px] font-semibold tracking-[0.22em] text-[#070709] uppercase transition-colors hover:border-[#C81E1E] hover:bg-[#C81E1E] hover:text-[#F4F2ED] sm:w-auto"
            >
              <span>ENTER CURRENT RELEASE</span>
              <ArrowRight className="h-3.5 w-3.5 stroke-[1.75]" />
            </Link>

            <Link
              href="/v11/releases"
              className="inline-flex w-full items-center justify-center gap-3 rounded-none border border-white/20 bg-transparent px-8 py-4 font-sans text-[11px] font-medium tracking-[0.22em] text-[#F4F2ED] uppercase transition-colors hover:border-[#F4F2ED] hover:bg-[#F4F2ED] hover:text-[#070709] sm:w-auto"
            >
              <span>RELEASES &amp; ARCHIVE</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
