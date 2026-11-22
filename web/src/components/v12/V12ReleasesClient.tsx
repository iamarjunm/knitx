"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { DropCampaign, Product } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";
import {
  buildReleaseSchedule,
  cleanV10Text,
  formatEditionLabel,
  getV10CleanImage,
} from "@/components/v10/v10-media";

interface V12ReleasesClientProps {
  drop: DropCampaign;
  products: Product[];
  candidateCount: number;
}

function mapScheduleHrefToV12(
  status: "active" | "voting" | "upcoming"
): string {
  if (status === "active") return "/v12/release";
  if (status === "voting") return "/v12/vote";
  return "/v12/submit";
}

function cleanLabel(raw: string): string {
  return cleanV10Text(raw).trim();
}

export default function V12ReleasesClient({
  drop,
  products,
  candidateCount,
}: V12ReleasesClientProps) {
  const editionLabel = formatEditionLabel(drop.dropNumber);
  const cleanDropTitle = cleanLabel(drop.title);

  const schedule = useMemo(() => {
    const base = buildReleaseSchedule(
      drop.dropNumber,
      cleanDropTitle,
      candidateCount
    );
    return base.map((item) => ({
      ...item,
      href: mapScheduleHrefToV12(item.status),
    }));
  }, [drop.dropNumber, cleanDropTitle, candidateCount]);

  const revealedPieces = useMemo(
    () => products.filter((product) => !product.isMystery).slice(0, 4),
    [products]
  );

  const oneOfOneCount = useMemo(
    () => products.filter((product) => product.tier === "one-of-one").length,
    [products]
  );

  const smallBatchCount = useMemo(
    () => products.filter((product) => product.tier === "small-batch").length,
    [products]
  );

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#000000]">
      {/* Pure-White Architectural Header */}
      <header className="border-b border-black/10 bg-[#FFFFFF] py-14 sm:py-20">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.22em] text-[#666666] uppercase">
                <span className="inline-block h-2 w-2 bg-[#E11D2E]" />
                <span>KNITX EDITION CALENDAR · PERMANENT ARCHIVE</span>
              </div>

              <h1 className="mt-4 font-poster text-6xl leading-[0.88] tracking-[-0.01em] text-[#000000] uppercase sm:text-8xl lg:text-[96px]">
                RELEASES &amp; ARCHIVE
              </h1>

              <p className="mt-6 max-w-2xl font-sans text-sm leading-relaxed text-[#666666] sm:text-base">
                Every KNITX edition is issued sequentially and permanently
                retired once allocated. Each cycle moves from open creator
                brief to community ballot, then into sample-first cutting in
                strictly numbered runs.
              </p>
            </div>

            {/* Active Edition Spec Ledger */}
            <aside className="lg:col-span-4">
              <div className="border border-black/10 bg-[#F4F4F5] divide-y divide-black/10">
                <div className="flex items-baseline justify-between gap-4 px-5 py-4">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-[#666666] uppercase">
                    ACTIVE EDITION
                  </span>
                  <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[#000000] uppercase">
                    {editionLabel}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-4 px-5 py-4">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-[#666666] uppercase">
                    CURRENT TITLE
                  </span>
                  <span className="truncate font-mono text-[11px] font-semibold tracking-[0.12em] text-[#000000] uppercase">
                    {cleanDropTitle}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-4 px-5 py-4">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-[#666666] uppercase">
                    SILHOUETTE SPLIT
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.14em] text-[#000000] uppercase">
                    {String(oneOfOneCount).padStart(2, "0")} 1-OF-1 ·{" "}
                    {String(smallBatchCount).padStart(2, "0")} BATCH
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-4 px-5 py-4">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-[#666666] uppercase">
                    NEXT BALLOT SLATE
                  </span>
                  <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[#E11D2E] uppercase">
                    {String(candidateCount).padStart(2, "0")} CONCEPTS LIVE
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </header>

      {/* Sequential Multi-Release Schedule */}
      <section className="border-b border-black/10 bg-[#FFFFFF]">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          <div className="flex items-center justify-between border-b border-black/10 py-5">
            <span className="font-mono text-[10px] tracking-[0.22em] text-[#666666] uppercase">
              SEQUENTIAL RELEASE PIPELINE
            </span>
            <span className="font-mono text-[10px] tracking-[0.18em] text-[#000000] uppercase">
              03 ACTIVE STAGES
            </span>
          </div>

          <div className="divide-y divide-black/10">
            {schedule.map((item, idx) => {
              const isActive = item.status === "active";
              const isVoting = item.status === "voting";
              const indexCode = String(idx + 1).padStart(2, "0");

              return (
                <article
                  key={item.id}
                  className="grid grid-cols-1 items-center gap-8 py-10 sm:py-14 lg:grid-cols-12 lg:gap-10"
                >
                  {/* Stage Index & Status Indicator */}
                  <div className="space-y-3 lg:col-span-3">
                    <p className="font-poster text-4xl leading-none text-[#000000] sm:text-5xl">
                      {indexCode}
                    </p>
                    <p className="font-mono text-[11px] font-semibold tracking-[0.2em] text-[#000000] uppercase">
                      {item.editionLabel}
                    </p>
                    <div className="inline-flex items-center gap-2 border border-black/10 bg-[#F4F4F5] px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] uppercase">
                      <span
                        className={cn(
                          "inline-block h-1.5 w-1.5",
                          isActive
                            ? "bg-[#E11D2E]"
                            : isVoting
                              ? "bg-[#000000]"
                              : "bg-[#666666]"
                        )}
                      />
                      <span
                        className={cn(
                          isActive ? "text-[#E11D2E]" : "text-[#000000]"
                        )}
                      >
                        {item.season}
                      </span>
                    </div>
                  </div>

                  {/* Gallery Frame */}
                  <div className="lg:col-span-4">
                    <div className="relative aspect-[4/3] w-full overflow-hidden border border-black/10 bg-[#F4F4F5]">
                      <Image
                        src={getV10CleanImage(item.image, idx)}
                        alt={cleanLabel(item.title)}
                        fill
                        sizes="(max-width: 1024px) 100vw, 32vw"
                        className="object-cover transition-transform duration-700 ease-out hover:scale-[1.03]"
                      />
                    </div>
                  </div>

                  {/* Edition Copy & Navigation CTA */}
                  <div className="lg:col-span-5 lg:pl-4">
                    <h2 className="font-syne text-2xl font-extrabold leading-[1.02] tracking-[-0.02em] text-[#000000] uppercase sm:text-4xl">
                      {cleanLabel(item.title)}
                    </h2>

                    <p className="mt-3 font-mono text-[11px] tracking-[0.14em] text-[#000000] uppercase">
                      {cleanLabel(item.piecesSummary)}
                    </p>

                    <p className="mt-3 max-w-lg font-sans text-sm leading-relaxed text-[#666666]">
                      {cleanLabel(item.note)}
                    </p>

                    <div className="mt-7">
                      <Link
                        href={item.href}
                        className={cn(
                          "inline-flex items-center gap-2.5 border px-6 py-3.5 font-sans text-[11px] font-semibold tracking-[0.2em] uppercase transition-colors",
                          isActive
                            ? "border-[#000000] bg-[#000000] text-[#FFFFFF] hover:border-[#E11D2E] hover:bg-[#E11D2E]"
                            : "border-[#000000] bg-[#FFFFFF] text-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF]"
                        )}
                      >
                        <span>{cleanLabel(item.cta)}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 stroke-[2]" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2-Column Tier Comparison — ONE-OF-ONE vs SMALL BATCH */}
      <section className="border-b border-black/10 bg-[#F4F4F5] py-16 sm:py-24">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          <div className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[10px] tracking-[0.22em] text-[#666666] uppercase">
                EDITION ARCHITECTURE · PERMANENT HOUSE STANDARD
              </p>
              <h2 className="mt-3 font-syne text-3xl font-extrabold leading-[1.0] tracking-[-0.02em] text-[#000000] uppercase sm:text-5xl">
                TWO TIERS OF SCARCITY.
              </h2>
            </div>
            <p className="max-w-md font-sans text-xs leading-relaxed text-[#666666] sm:text-sm">
              Every silhouette released by KNITX falls into one of two numbered
              production formats. Neither tier is ever restocked.
            </p>
          </div>

          <div className="grid grid-cols-1 border border-black/10 bg-[#FFFFFF] md:grid-cols-2">
            {/* Tier 01 — ONE-OF-ONE */}
            <div className="flex flex-col justify-between border-b border-black/10 p-8 sm:p-12 md:border-r md:border-b-0">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[10px] font-semibold tracking-[0.2em] text-[#E11D2E] uppercase">
                    TIER 01 · ARCHIVE SINGULAR
                  </span>
                  <span className="bg-[#000000] px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-[#FFFFFF] uppercase">
                    01 / 01
                  </span>
                </div>

                <h3 className="mt-5 font-syne text-3xl font-extrabold tracking-[-0.02em] text-[#000000] uppercase sm:text-4xl">
                  ONE-OF-ONE
                </h3>

                <p className="mt-3 border-b border-black/10 pb-6 font-mono text-[11px] tracking-[0.14em] text-[#666666] uppercase">
                  01 UNIT WORLDWIDE · ₹5,000 – ₹10,000+
                </p>

                <p className="mt-6 font-sans text-sm leading-relaxed text-[#666666]">
                  Singular collector garments finished by hand with bespoke
                  surface treatments, heavy flat-bed knitwork, or artisanal
                  embroidery. Once claimed, the pattern is retired permanently.
                </p>
              </div>

              <dl className="mt-10 divide-y divide-black/10 border-t border-black/10 font-mono text-[10px] tracking-[0.16em] uppercase">
                <div className="flex items-baseline justify-between gap-4 py-3.5">
                  <dt className="text-[#666666]">ALLOCATION</dt>
                  <dd className="font-semibold text-[#000000]">
                    01 UNIT WORLDWIDE
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-3.5">
                  <dt className="text-[#666666]">IDENTIFICATION</dt>
                  <dd className="font-semibold text-[#000000]">
                    ENGRAVED ARCHIVE PLATE
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-3.5">
                  <dt className="text-[#666666]">REPRODUCTION</dt>
                  <dd className="font-semibold text-[#E11D2E]">
                    NEVER REPRODUCED
                  </dd>
                </div>
              </dl>
            </div>

            {/* Tier 02 — SMALL BATCH */}
            <div className="flex flex-col justify-between p-8 sm:p-12">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase">
                    TIER 02 · MICRO-BATCH SERIES
                  </span>
                  <span className="border border-black/15 bg-[#F4F4F5] px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-[#000000] uppercase">
                    03 – 04 UNITS
                  </span>
                </div>

                <h3 className="mt-5 font-syne text-3xl font-extrabold tracking-[-0.02em] text-[#000000] uppercase sm:text-4xl">
                  SMALL BATCH
                </h3>

                <p className="mt-3 border-b border-black/10 pb-6 font-mono text-[11px] tracking-[0.14em] text-[#666666] uppercase">
                  03–04 UNITS PER DESIGN · ₹2,500 – ₹4,000
                </p>

                <p className="mt-6 font-sans text-sm leading-relaxed text-[#666666]">
                  Architectural silhouettes cut from 310–480 GSM Indian textiles
                  with raised multi-pass puff prints and chain-stitch detailing.
                  Produced strictly after reservation with zero excess stock.
                </p>
              </div>

              <dl className="mt-10 divide-y divide-black/10 border-t border-black/10 font-mono text-[10px] tracking-[0.16em] uppercase">
                <div className="flex items-baseline justify-between gap-4 py-3.5">
                  <dt className="text-[#666666]">ALLOCATION</dt>
                  <dd className="font-semibold text-[#000000]">
                    03 – 04 NUMBERED UNITS
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-3.5">
                  <dt className="text-[#666666]">FABRIC SPEC</dt>
                  <dd className="font-semibold text-[#000000]">
                    310 – 480 GSM COTTON
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-3.5">
                  <dt className="text-[#666666]">RESTOCK POLICY</dt>
                  <dd className="font-semibold text-[#000000]">
                    ZERO RESTOCKS
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column Revealed Lookbook Strip */}
      <section className="bg-[#FFFFFF] py-16 sm:py-24">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          <div className="flex flex-col justify-between gap-6 border-b border-black/10 pb-8 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[10px] tracking-[0.22em] text-[#666666] uppercase">
                {editionLabel} · PUBLIC CONTACT SHEET
              </p>
              <h2 className="mt-2.5 font-syne text-3xl font-extrabold leading-[1.02] tracking-[-0.02em] text-[#000000] uppercase sm:text-5xl">
                REVEALED SILHOUETTES
              </h2>
            </div>

            <Link
              href="/v12/release"
              className="inline-flex items-center gap-2.5 self-start border border-[#000000] bg-[#000000] px-6 py-3.5 font-sans text-[11px] font-semibold tracking-[0.2em] text-[#FFFFFF] uppercase transition-colors hover:border-[#E11D2E] hover:bg-[#E11D2E] sm:self-auto"
            >
              <span>OPEN RELEASE ROOM</span>
              <ArrowUpRight className="h-3.5 w-3.5 stroke-[2]" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {revealedPieces.map((piece, idx) => {
              const isOneOfOne = piece.tier === "one-of-one";

              return (
                <Link
                  key={piece._id}
                  href="/v12/release"
                  className="group block"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden border border-black/10 bg-[#F4F4F5]">
                    <Image
                      src={getV10CleanImage(piece.imageUrl, idx)}
                      alt={cleanLabel(piece.title)}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 24vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  </div>

                  <div className="pt-4">
                    <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-2.5 font-mono text-[10px] tracking-[0.16em] uppercase">
                      <span className="text-[#666666]">{piece.serialCode}</span>
                      <span
                        className={cn(
                          "font-semibold",
                          isOneOfOne ? "text-[#E11D2E]" : "text-[#000000]"
                        )}
                      >
                        {isOneOfOne
                          ? "1 OF 1"
                          : `ED. OF ${String(piece.totalUnits).padStart(2, "0")}`}
                      </span>
                    </div>

                    <h3 className="mt-3 font-syne text-base font-bold leading-snug tracking-[-0.01em] text-[#000000] uppercase transition-colors group-hover:text-[#E11D2E]">
                      {cleanLabel(piece.title)}
                    </h3>

                    <div className="mt-2 flex items-center justify-between gap-2 font-mono text-[11px] text-[#666666]">
                      <span>{piece.gsmWeight}</span>
                      <span className="font-semibold text-[#000000]">
                        {formatInr(piece.priceInr)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
