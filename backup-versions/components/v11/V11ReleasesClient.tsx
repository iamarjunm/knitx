"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DropCampaign, Product } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";
import {
  buildReleaseSchedule,
  cleanV10Text,
  formatEditionLabel,
  getV10CleanImage,
} from "@/components/v10/v10-media";

interface V11ReleasesClientProps {
  drop: DropCampaign;
  products: Product[];
  candidateCount: number;
}

function cleanNoirText(text: string): string {
  return cleanV10Text(text).replace(/\bbombay\b/gi, "India");
}

function mapV11Href(href: string): string {
  return href.replace(/^\/v10\b/, "/v11");
}

export default function V11ReleasesClient({
  drop,
  products,
  candidateCount,
}: V11ReleasesClientProps) {
  const editionLabel = formatEditionLabel(drop.dropNumber);
  const activeTitle = cleanNoirText(drop.title);

  const oneOfOneCount = useMemo(
    () => products.filter((item) => item.tier === "one-of-one").length,
    [products]
  );

  const smallBatchCount = useMemo(
    () => products.filter((item) => item.tier === "small-batch").length,
    [products]
  );

  const schedule = useMemo(() => {
    const base = buildReleaseSchedule(
      drop.dropNumber,
      activeTitle,
      candidateCount
    );
    return base.map((item) => {
      const remappedHref = mapV11Href(item.href);
      if (item.status === "active") {
        return {
          ...item,
          href: remappedHref,
          piecesSummary: `${products.length} Silhouettes · ${oneOfOneCount} One-of-One · ${smallBatchCount} Small-Batch`,
        };
      }
      return {
        ...item,
        href: remappedHref,
      };
    });
  }, [
    drop.dropNumber,
    activeTitle,
    candidateCount,
    products.length,
    oneOfOneCount,
    smallBatchCount,
  ]);

  const revealedPieces = useMemo(
    () => products.filter((item) => !item.isMystery).slice(0, 4),
    [products]
  );

  return (
    <div className="min-h-screen bg-[#070709] text-[#F4F2ED]">
      {/* Monumental Obsidian Header */}
      <header className="border-b border-white/10 bg-[#070709] py-14 sm:py-20">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.26em] text-[#8E8C87] uppercase">
                <span className="inline-block h-1.5 w-1.5 bg-[#C81E1E]" />
                <span>SEQUENTIAL EDITION CALENDAR · PERMANENT ARCHIVE</span>
              </div>

              <h1 className="mt-6 font-syne text-5xl leading-[0.9] font-extrabold tracking-[-0.03em] text-[#F4F2ED] uppercase sm:text-7xl lg:text-[84px]">
                RELEASES &amp; ARCHIVE
              </h1>

              <p className="mt-7 max-w-2xl font-sans text-sm leading-relaxed text-[#8E8C87] sm:text-base">
                Every KNITX edition moves through a strict sequential cycle —
                open creator brief, community ballot, and numbered studio
                cutting. Once an edition&apos;s allocation is claimed, its
                patterns are retired permanently and never restocked.
              </p>
            </div>

            {/* Live Edition Metadata Ledger */}
            <aside className="lg:col-span-4 lg:border-l lg:border-white/10 lg:pl-10">
              <dl className="divide-y divide-white/10 border-t border-b border-white/10">
                <div className="flex items-baseline justify-between gap-4 py-4">
                  <dt className="font-mono text-[10px] tracking-[0.2em] text-[#8E8C87] uppercase">
                    ACTIVE EDITION
                  </dt>
                  <dd className="font-mono text-[11px] tracking-[0.16em] text-[#F4F2ED] uppercase">
                    {editionLabel}
                  </dd>
                </div>

                <div className="flex items-baseline justify-between gap-4 py-4">
                  <dt className="font-mono text-[10px] tracking-[0.2em] text-[#8E8C87] uppercase">
                    DESIGNATION
                  </dt>
                  <dd className="font-mono text-[11px] tracking-[0.16em] text-[#C81E1E] uppercase">
                    {activeTitle}
                  </dd>
                </div>

                <div className="flex items-baseline justify-between gap-4 py-4">
                  <dt className="font-mono text-[10px] tracking-[0.2em] text-[#8E8C87] uppercase">
                    RELEASE LINEUP
                  </dt>
                  <dd className="font-mono text-[11px] tracking-[0.16em] text-[#F4F2ED] uppercase">
                    {String(products.length).padStart(2, "0")} SILHOUETTES
                  </dd>
                </div>

                <div className="flex items-baseline justify-between gap-4 py-4">
                  <dt className="font-mono text-[10px] tracking-[0.2em] text-[#8E8C87] uppercase">
                    NEXT BALLOT SLATE
                  </dt>
                  <dd className="font-mono text-[11px] tracking-[0.16em] text-[#F4F2ED] uppercase">
                    {String(candidateCount).padStart(2, "0")} CONCEPTS
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      </header>

      {/* Full-Width Horizontal Release Bands */}
      <section className="bg-[#070709]">
        <div className="divide-y divide-white/10 border-b border-white/10">
          {schedule.map((item, idx) => {
            const isActive = item.status === "active";
            const isVoting = item.status === "voting";
            const bandIndex = String(idx + 1).padStart(2, "0");

            return (
              <article
                key={item.id}
                className={cn(
                  "relative transition-colors",
                  isActive ? "bg-[#0E0E12]" : "bg-[#070709] hover:bg-[#0E0E12]/60"
                )}
              >
                <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-12 lg:gap-14 lg:px-14">
                  {/* Large Moody 16:10 Full-Bleed Frame */}
                  <div
                    className={cn(
                      "lg:col-span-6",
                      idx % 2 === 1 ? "lg:order-2" : "lg:order-1"
                    )}
                  >
                    <Link
                      href={item.href}
                      className="group relative block aspect-[16/10] w-full overflow-hidden border border-white/10 bg-[#141419]"
                    >
                      <Image
                        src={getV10CleanImage(item.image, idx)}
                        alt={cleanNoirText(item.title)}
                        fill
                        sizes="(max-width: 1024px) 100vw, 48vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070709]/85 via-[#070709]/20 to-transparent" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between px-5 py-4 font-mono text-[10px] tracking-[0.22em] uppercase">
                        <span className="text-[#F4F2ED]/85">
                          CYCLE {bandIndex} — {item.editionLabel}
                        </span>
                        <span
                          className={cn(
                            isActive ? "text-[#C81E1E]" : "text-[#8E8C87]"
                          )}
                        >
                          {item.season}
                        </span>
                      </div>
                    </Link>
                  </div>

                  {/* Release Dossier & Action */}
                  <div
                    className={cn(
                      "lg:col-span-6",
                      idx % 2 === 1 ? "lg:order-1" : "lg:order-2"
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] tracking-[0.24em] uppercase">
                      <span
                        className={cn(
                          "inline-block h-1.5 w-1.5",
                          isActive
                            ? "bg-[#C81E1E]"
                            : isVoting
                              ? "bg-[#F4F2ED]"
                              : "bg-[#8E8C87]/50"
                        )}
                      />
                      <span
                        className={cn(
                          isActive
                            ? "text-[#C81E1E]"
                            : isVoting
                              ? "text-[#F4F2ED]"
                              : "text-[#8E8C87]"
                        )}
                      >
                        {item.editionLabel} · {item.season}
                      </span>
                    </div>

                    <h2 className="mt-5 font-syne text-4xl leading-[0.94] font-extrabold tracking-[-0.025em] text-[#F4F2ED] uppercase sm:text-5xl lg:text-6xl">
                      {cleanNoirText(item.title)}
                    </h2>

                    <p className="mt-4 border-y border-white/10 py-3 font-mono text-[11px] tracking-[0.18em] text-[#F4F2ED]/80 uppercase">
                      {cleanNoirText(item.piecesSummary)}
                    </p>

                    <p className="mt-5 max-w-xl font-sans text-sm leading-relaxed text-[#8E8C87] sm:text-[15px]">
                      {cleanNoirText(item.note)}
                    </p>

                    <div className="mt-8">
                      <Link
                        href={item.href}
                        className={cn(
                          "inline-flex items-center gap-3 rounded-none px-7 py-4 font-sans text-[11px] font-semibold tracking-[0.22em] uppercase transition-colors",
                          isActive
                            ? "border border-[#F4F2ED] bg-[#F4F2ED] text-[#070709] hover:border-[#C81E1E] hover:bg-[#C81E1E] hover:text-[#F4F2ED]"
                            : "border border-white/20 bg-transparent text-[#F4F2ED] hover:border-[#F4F2ED] hover:bg-[#F4F2ED] hover:text-[#070709]"
                        )}
                      >
                        <span>{item.cta.toUpperCase()}</span>
                        <ArrowRight className="h-3.5 w-3.5 stroke-[1.75]" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 2-Column Dark Hairline Tier Specification Split */}
      <section className="border-b border-white/10 bg-[#0E0E12] py-20 sm:py-28">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] tracking-[0.24em] text-[#8E8C87] uppercase">
              ALLOCATION ARCHITECTURE · PERMANENT HOUSE STANDARD
            </p>
            <h2 className="mt-4 font-syne text-4xl leading-[0.95] font-extrabold tracking-[-0.025em] text-[#F4F2ED] uppercase sm:text-5xl">
              TWO TIERS OF NUMBERED SCARCITY
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 border border-white/10 bg-[#070709] md:grid-cols-2">
            {/* Tier 01 — One-of-One */}
            <div className="flex flex-col justify-between border-b border-white/10 p-8 sm:p-12 md:border-r md:border-b-0">
              <div>
                <p className="font-mono text-[10px] tracking-[0.24em] text-[#C81E1E] uppercase">
                  TIER 01 · SINGULAR WORK
                </p>
                <h3 className="mt-4 font-syne text-3xl leading-[1] font-extrabold tracking-[-0.02em] text-[#F4F2ED] uppercase sm:text-4xl">
                  ONE-OF-ONE
                </h3>
                <p className="mt-3 border-b border-white/10 pb-6 font-mono text-[11px] tracking-[0.18em] text-[#F4F2ED]/85 uppercase">
                  01 UNIT · ₹5K–₹10K+
                </p>
                <p className="mt-6 font-sans text-sm leading-relaxed text-[#8E8C87]">
                  Hand-painted pigment brushwork, heavy flat-bed jacquard knits,
                  and bespoke textile distressing. Constructed as singular
                  collector garments with engraved serial plates and retired
                  permanently upon claim.
                </p>
              </div>

              <dl className="mt-10 space-y-3 border-t border-white/10 pt-6 font-mono text-[10px] tracking-[0.18em] uppercase">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-[#8E8C87]">EDITION CAP</dt>
                  <dd className="text-[#F4F2ED]">01 / 01 WORLDWIDE</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-[#8E8C87]">PRICE BAND</dt>
                  <dd className="text-[#F4F2ED]">₹5,000 – ₹10,000+</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-[#8E8C87]">AUTHENTICATION</dt>
                  <dd className="text-[#C81E1E]">ENGRAVED ARCHIVE PLATE</dd>
                </div>
              </dl>
            </div>

            {/* Tier 02 — Small Batch */}
            <div className="flex flex-col justify-between p-8 sm:p-12">
              <div>
                <p className="font-mono text-[10px] tracking-[0.24em] text-[#8E8C87] uppercase">
                  TIER 02 · MICRO-RUN SERIES
                </p>
                <h3 className="mt-4 font-syne text-3xl leading-[1] font-extrabold tracking-[-0.02em] text-[#F4F2ED] uppercase sm:text-4xl">
                  SMALL BATCH
                </h3>
                <p className="mt-3 border-b border-white/10 pb-6 font-mono text-[11px] tracking-[0.18em] text-[#F4F2ED]/85 uppercase">
                  3–4 UNITS · ₹2.5K–₹4K
                </p>
                <p className="mt-6 font-sans text-sm leading-relaxed text-[#8E8C87]">
                  Heavyweight 310–480 GSM Indian cotton jerseys, diagonal
                  loopback terry, artisanal Ari chain-stitching, and multi-pass
                  raised puff ink. Cut strictly to order with zero restocks.
                </p>
              </div>

              <dl className="mt-10 space-y-3 border-t border-white/10 pt-6 font-mono text-[10px] tracking-[0.18em] uppercase">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-[#8E8C87]">EDITION CAP</dt>
                  <dd className="text-[#F4F2ED]">03 – 04 UNITS PER RUN</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-[#8E8C87]">PRICE BAND</dt>
                  <dd className="text-[#F4F2ED]">₹2,500 – ₹4,000</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-[#8E8C87]">RESTOCK POLICY</dt>
                  <dd className="text-[#F4F2ED]">PERMANENTLY RETIRED</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Active Edition Public Contact Sheet */}
      {revealedPieces.length > 0 && (
        <section className="bg-[#070709] py-20 sm:py-28">
          <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
            <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-10 sm:flex-row sm:items-end">
              <div>
                <p className="font-mono text-[10px] tracking-[0.24em] text-[#8E8C87] uppercase">
                  {editionLabel} · REVEALED SILHOUETTES
                </p>
                <h2 className="mt-3 font-syne text-3xl leading-[0.95] font-extrabold tracking-[-0.025em] text-[#F4F2ED] uppercase sm:text-5xl">
                  CURRENT ARCHIVE INDEX
                </h2>
              </div>

              <Link
                href="/v11/release"
                className="inline-flex items-center gap-3 self-start rounded-none border border-white/20 px-6 py-3.5 font-sans text-[11px] font-medium tracking-[0.2em] text-[#F4F2ED] uppercase transition-colors hover:border-[#F4F2ED] hover:bg-[#F4F2ED] hover:text-[#070709] sm:self-auto"
              >
                <span>ENTER PRIVATE RELEASE</span>
                <ArrowRight className="h-3.5 w-3.5 stroke-[1.75]" />
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {revealedPieces.map((piece, idx) => {
                const isOneOfOne = piece.tier === "one-of-one";

                return (
                  <Link
                    key={piece._id}
                    href="/v11/release"
                    className="group block"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden border border-white/10 bg-[#141419]">
                      <Image
                        src={getV10CleanImage(piece.imageUrl, idx)}
                        alt={cleanNoirText(piece.title)}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 24vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070709]/80 via-transparent to-transparent" />
                    </div>

                    <div className="pt-4">
                      <div className="flex items-center justify-between gap-2 font-mono text-[10px] tracking-[0.18em] uppercase">
                        <span className="text-[#8E8C87]">
                          {piece.serialCode}
                        </span>
                        <span
                          className={
                            isOneOfOne ? "text-[#C81E1E]" : "text-[#8E8C87]"
                          }
                        >
                          {isOneOfOne
                            ? "01 / 01"
                            : `${String(piece.totalUnits).padStart(2, "0")} UNITS`}
                        </span>
                      </div>

                      <h3 className="mt-2 font-syne text-lg leading-[1.1] font-bold tracking-[-0.01em] text-[#F4F2ED] uppercase transition-colors group-hover:text-[#F4F2ED]/75">
                        {cleanNoirText(piece.title)}
                      </h3>

                      <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-[#8E8C87]">
                        <span>{formatInr(piece.priceInr)}</span>
                        <span>{piece.gsmWeight}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
