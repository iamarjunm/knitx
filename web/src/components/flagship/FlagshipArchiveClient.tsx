"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { DropCampaign, Product } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";
import { useStorefrontConfig } from "@/context/StorefrontConfigContext";
import {
  buildFlagshipTimeline,
  cleanFlagshipText,
  formatDropEditionLabel,
  getFlagshipCleanImage,
} from "@/lib/flagship-media";

interface FlagshipArchiveClientProps {
  drop: DropCampaign;
  products: Product[];
  candidateCount: number;
}

function cleanLabel(raw: string): string {
  return cleanFlagshipText(raw).trim();
}

export default function FlagshipArchiveClient({
  drop,
  products,
  candidateCount,
}: FlagshipArchiveClientProps) {
  const { config } = useStorefrontConfig();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const accent =
    mounted && config.accentColor ? config.accentColor : "#E11D2E";
  const coreOffsetDays = mounted ? config.coreLaunchOffsetDays : 14;
  const activeDropNumber =
    mounted && config.activeDropNumber
      ? config.activeDropNumber
      : drop.dropNumber;
  const activeDropTitle =
    mounted && config.activeDropTitle ? config.activeDropTitle : drop.title;

  const editionLabel = formatDropEditionLabel(activeDropNumber);
  const cleanDropTitle = cleanLabel(activeDropTitle);

  const timeline = useMemo(
    () =>
      buildFlagshipTimeline(
        activeDropNumber,
        cleanDropTitle,
        candidateCount,
        coreOffsetDays
      ),
    [activeDropNumber, cleanDropTitle, candidateCount, coreOffsetDays]
  );

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
    <div
      className="min-h-screen overflow-x-clip bg-[#FFFFFF] text-[#000000]"
      style={{ "--flagship-accent": accent } as React.CSSProperties}
    >
      {/* Pure-White Architectural Header */}
      <header className="border-b border-black/10 bg-[#FFFFFF] py-12 sm:py-20">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 items-end gap-8 sm:gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.2em] text-[#666666] uppercase sm:tracking-[0.22em]">
                <span className="inline-block h-2 w-2 shrink-0 bg-[var(--flagship-accent)]" />
                <span>KNITX EDITION CALENDAR · PERMANENT ARCHIVE</span>
              </div>

              <h1 className="mt-4 font-poster text-[36px] leading-[0.9] tracking-[-0.01em] text-[#000000] uppercase break-words sm:text-6xl lg:text-[80px]">
                EDITIONS &amp; ARCHIVE
              </h1>

              <p className="mt-5 max-w-2xl font-sans text-sm leading-relaxed text-[#666666] sm:mt-6 sm:text-base">
                Every KNITX edition is issued sequentially and permanently
                retired once allocated. Each cycle moves from active private
                drop to the heavyweight KNITX CORE wardrobe, then forward into
                community ballot and open creator residency.
              </p>
            </div>

            {/* Active Edition Spec Ledger */}
            <aside className="lg:col-span-4">
              <div className="divide-y divide-black/10 border border-black/10 bg-[#F4F4F5]">
                <div className="flex items-baseline justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4">
                  <span className="shrink-0 font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase sm:tracking-[0.18em]">
                    ACTIVE EDITION
                  </span>
                  <span className="text-right font-mono text-[11px] font-semibold tracking-[0.14em] text-[#000000] uppercase">
                    {editionLabel}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4">
                  <span className="shrink-0 font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase sm:tracking-[0.18em]">
                    CURRENT TITLE
                  </span>
                  <span className="truncate text-right font-mono text-[11px] font-semibold tracking-[0.12em] text-[#000000] uppercase">
                    {cleanDropTitle}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4">
                  <span className="shrink-0 font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase sm:tracking-[0.18em]">
                    EDITION PIECES
                  </span>
                  <span className="text-right font-mono text-[10px] tracking-[0.12em] text-[#000000] uppercase sm:text-[11px] sm:tracking-[0.14em]">
                    {String(products.length).padStart(2, "0")} TOTAL ·{" "}
                    {String(oneOfOneCount).padStart(2, "0")} 1-OF-1 ·{" "}
                    {String(smallBatchCount).padStart(2, "0")} BATCH
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4">
                  <span className="shrink-0 font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase sm:tracking-[0.18em]">
                    CORE WINDOW
                  </span>
                  <span className="text-right font-mono text-[11px] font-semibold tracking-[0.14em] text-[var(--flagship-accent)] uppercase">
                    +{coreOffsetDays} DAYS POST-DROP
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </header>

      {/* Sequential 4-Stage Editions & Core Pipeline */}
      <section className="border-b border-black/10 bg-[#FFFFFF]">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14">
          <div className="flex items-center justify-between border-b border-black/10 py-5">
            <span className="font-mono text-[10px] tracking-[0.22em] text-[#666666] uppercase">
              SEQUENTIAL RELEASE PIPELINE
            </span>
            <span className="font-mono text-[10px] tracking-[0.18em] text-[#000000] uppercase">
              {String(timeline.length).padStart(2, "0")} LIVE STAGES
            </span>
          </div>

          <div className="divide-y divide-black/10">
            {timeline.map((item, idx) => {
              const isActive = item.status === "active";
              const isCore = item.status === "core";
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
                            ? "bg-[var(--flagship-accent)]"
                            : isCore || isVoting
                              ? "bg-[#000000]"
                              : "bg-[#666666]"
                        )}
                      />
                      <span
                        className={cn(
                          isActive
                            ? "text-[var(--flagship-accent)]"
                            : "text-[#000000]"
                        )}
                      >
                        {item.timingLabel}
                      </span>
                    </div>
                  </div>

                  {/* Gallery Frame */}
                  <div className="lg:col-span-4">
                    <div className="relative aspect-[4/3] w-full overflow-hidden border border-black/10 bg-[#F4F4F5]">
                      <Image
                        src={getFlagshipCleanImage(item.image, idx)}
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
                      {cleanLabel(item.summary)}
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
                            ? "border-[#000000] bg-[#000000] text-[#FFFFFF] hover:border-[var(--flagship-accent)] hover:bg-[var(--flagship-accent)]"
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

      {/* 3-Column House Architecture — ONE-OF-ONE · SMALL BATCH · KNITX CORE */}
      <section className="border-b border-black/10 bg-[#F4F4F5] py-16 sm:py-24">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          <div className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[10px] tracking-[0.22em] text-[#666666] uppercase">
                HOUSE ARCHITECTURE · PERMANENT STANDARD
              </p>
              <h2 className="mt-3 font-syne text-3xl font-extrabold leading-[1.0] tracking-[-0.02em] text-[#000000] uppercase sm:text-5xl">
                THREE PILLARS OF KNITX.
              </h2>
            </div>
            <p className="max-w-md font-sans text-xs leading-relaxed text-[#666666] sm:text-sm">
              Every silhouette cut inside our atelier belongs to one of three
              permanent house tiers — from singular collector pieces to our
              minimalist everyday KNITX CORE wardrobe finished with subtle
              signature branding.
            </p>
          </div>

          <div className="grid grid-cols-1 border border-black/10 bg-[#FFFFFF] lg:grid-cols-3">
            {/* Tier 01 — ONE-OF-ONE */}
            <div className="flex flex-col justify-between border-b border-black/10 p-8 sm:p-10 lg:border-r lg:border-b-0">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[10px] font-semibold tracking-[0.2em] text-[var(--flagship-accent)] uppercase">
                    TIER 01 · ARCHIVE SINGULAR
                  </span>
                  <span className="bg-[#000000] px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-[#FFFFFF] uppercase">
                    01 / 01
                  </span>
                </div>

                <h3 className="mt-5 font-syne text-3xl font-extrabold tracking-[-0.02em] text-[#000000] uppercase">
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
                  <dd className="font-semibold text-[var(--flagship-accent)]">
                    NEVER REPRODUCED
                  </dd>
                </div>
              </dl>
            </div>

            {/* Tier 02 — SMALL BATCH */}
            <div className="flex flex-col justify-between border-b border-black/10 p-8 sm:p-10 lg:border-r lg:border-b-0">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase">
                    TIER 02 · MICRO-BATCH SERIES
                  </span>
                  <span className="border border-black/15 bg-[#F4F4F5] px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-[#000000] uppercase">
                    CURATED LIMITED RUNS
                  </span>
                </div>

                <h3 className="mt-5 font-syne text-3xl font-extrabold tracking-[-0.02em] text-[#000000] uppercase">
                  SMALL BATCH
                </h3>

                <p className="mt-3 border-b border-black/10 pb-6 font-mono text-[11px] tracking-[0.14em] text-[#666666] uppercase">
                  CURATED LIMITED RUNS · ₹2,500 – ₹4,000
                </p>

                <p className="mt-6 font-sans text-sm leading-relaxed text-[#666666]">
                  Architectural silhouettes cut from 310–480 GSM Indian textiles
                  with raised multi-pass puff prints and chain-stitch detailing.
                  Strictly limited batch quantities decided per drop, produced
                  only after reservation with zero excess stock.
                </p>
              </div>

              <dl className="mt-10 divide-y divide-black/10 border-t border-black/10 font-mono text-[10px] tracking-[0.16em] uppercase">
                <div className="flex items-baseline justify-between gap-4 py-3.5">
                  <dt className="text-[#666666]">ALLOCATION</dt>
                  <dd className="font-semibold text-[#000000]">
                    LIMITED PER DROP
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

            {/* Tier 03 — KNITX CORE */}
            <div className="flex flex-col justify-between bg-[#F4F4F5]/40 p-8 sm:p-10">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[10px] font-semibold tracking-[0.2em] text-[#000000] uppercase">
                    TIER 03 · ESSENTIAL WARDROBE
                  </span>
                  <span className="border border-black/15 bg-[#FFFFFF] px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-[#000000] uppercase">
                    +{coreOffsetDays} DAYS
                  </span>
                </div>

                <h3 className="mt-5 font-syne text-3xl font-extrabold tracking-[-0.02em] text-[#000000] uppercase">
                  KNITX CORE
                </h3>

                <p className="mt-3 border-b border-black/10 pb-6 font-mono text-[11px] tracking-[0.14em] text-[#666666] uppercase">
                  06 HEAVYWEIGHT SILHOUETTES · ₹1,850 – ₹3,900
                </p>

                <p className="mt-6 font-sans text-sm leading-relaxed text-[#666666]">
                  Minimalist everyday essentials in curated mineral colorways,
                  finished with subtle signature KNITX branding (tonal
                  embroidery &amp; woven labels). Opens {coreOffsetDays} days
                  after the active drop for community waitlist members.
                </p>
              </div>

              <div>
                <dl className="mt-10 divide-y divide-black/10 border-t border-black/10 font-mono text-[10px] tracking-[0.16em] uppercase">
                  <div className="flex items-baseline justify-between gap-4 py-3.5">
                    <dt className="text-[#666666]">ACCESS WINDOW</dt>
                    <dd className="font-semibold text-[#000000]">
                      COMMUNITY PRIORITY
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 py-3.5">
                    <dt className="text-[#666666]">PALETTE</dt>
                    <dd className="font-semibold text-[#000000]">
                      MINERAL GARMENT DYE
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 py-3.5">
                    <dt className="text-[#666666]">BRANDING</dt>
                    <dd className="font-semibold text-[#000000]">
                      SUBTLE SIGNATURE KNITX
                    </dd>
                  </div>
                </dl>

                <Link
                  href="/core"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 border border-[#000000] bg-[#000000] px-5 py-3.5 font-sans text-[11px] font-semibold tracking-[0.2em] text-[#FFFFFF] uppercase transition-colors hover:border-[var(--flagship-accent)] hover:bg-[var(--flagship-accent)]"
                >
                  <span>EXPLORE KNITX CORE</span>
                  <ArrowUpRight className="h-3.5 w-3.5 stroke-[2]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column Revealed Contact Sheet */}
      <section className="bg-[#FFFFFF] py-16 sm:py-24">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          <div className="flex flex-col justify-between gap-6 border-b border-black/10 pb-8 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[10px] tracking-[0.22em] text-[#666666] uppercase">
                {editionLabel} · {products.length} CURATED PIECES · PUBLIC CONTACT SHEET
              </p>
              <h2 className="mt-2.5 font-syne text-3xl font-extrabold leading-[1.02] tracking-[-0.02em] text-[#000000] uppercase sm:text-5xl">
                REVEALED SILHOUETTES
              </h2>
            </div>

            <Link
              href="/drops"
              className="inline-flex items-center gap-2.5 self-start border border-[#000000] bg-[#000000] px-6 py-3.5 font-sans text-[11px] font-semibold tracking-[0.2em] text-[#FFFFFF] uppercase transition-colors hover:border-[var(--flagship-accent)] hover:bg-[var(--flagship-accent)] sm:self-auto"
            >
              <span>ENTER CURRENT DROP</span>
              <ArrowUpRight className="h-3.5 w-3.5 stroke-[2]" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {revealedPieces.map((piece, idx) => {
              const isOneOfOne = piece.tier === "one-of-one";

              return (
                <Link
                  key={piece._id}
                  href={`/product/${piece.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden border border-black/10 bg-[#F4F4F5]">
                    <Image
                      src={getFlagshipCleanImage(piece.imageUrl, idx)}
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
                          isOneOfOne
                            ? "text-[var(--flagship-accent)]"
                            : "text-[#000000]"
                        )}
                      >
                        {isOneOfOne
                          ? "1 OF 1"
                          : `ED. OF ${String(piece.totalUnits).padStart(2, "0")}`}
                      </span>
                    </div>

                    <h3 className="mt-3 font-syne text-base font-bold leading-snug tracking-[-0.01em] text-[#000000] uppercase transition-colors group-hover:text-[var(--flagship-accent)]">
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
