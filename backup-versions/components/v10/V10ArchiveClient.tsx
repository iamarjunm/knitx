"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { DropCampaign, Product } from "@/lib/types";
import { formatInr } from "@/lib/utils";
import {
  buildReleaseSchedule,
  cleanV10Text,
  formatEditionLabel,
  getV10CleanImage,
} from "@/components/v10/v10-media";

interface V10ArchiveClientProps {
  drop: DropCampaign;
  products: Product[];
  candidateCount: number;
}

export default function V10ArchiveClient({
  drop,
  products,
  candidateCount,
}: V10ArchiveClientProps) {
  const editionLabel = formatEditionLabel(drop.dropNumber);

  const schedule = useMemo(
    () => buildReleaseSchedule(drop.dropNumber, drop.title, candidateCount),
    [drop.dropNumber, drop.title, candidateCount]
  );

  const revealedPieces = useMemo(
    () => products.filter((p) => !p.isMystery).slice(0, 4),
    [products]
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111110]">
      {/* Editorial Header */}
      <header className="bg-[#FAF9F6] border-b border-[#111110]/10">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:items-end">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.22em] uppercase text-[#6E6A63]">
                <span className="inline-block h-1.5 w-1.5 bg-[#8C1D18]" />
                <span>THE ARCHIVE &amp; RELEASE SCHEDULE</span>
              </div>

              <h1 className="font-editorial text-5xl sm:text-7xl leading-[0.95] tracking-[-0.02em] text-[#111110] mt-5">
                Limited releases,{" "}
                <span className="italic">issued sequentially.</span>
              </h1>

              <p className="font-sans text-base leading-relaxed text-[#6E6A63] max-w-xl mt-6">
                Once an edition closes, its pattern is retired permanently.
                Every KNITX release moves from open creator brief to community
                ballot, then enters small-batch cutting in strictly numbered
                runs.
              </p>
            </div>

            <div className="lg:col-span-4 lg:border-l border-[#111110]/10 lg:pl-10 space-y-4">
              <div className="flex items-baseline justify-between gap-4 border-b border-[#111110]/10 pb-3">
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#6E6A63]">
                  ACTIVE EDITION
                </span>
                <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-[#111110]">
                  {editionLabel}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-[#111110]/10 pb-3">
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#6E6A63]">
                  CURRENT SILHOUETTES
                </span>
                <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-[#111110]">
                  {String(products.length).padStart(2, "0")} PIECES
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#6E6A63]">
                  NEXT BALLOT SLATE
                </span>
                <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-[#111110]">
                  {String(candidateCount).padStart(2, "0")} CONCEPTS
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Release Timeline Spread */}
      <section className="bg-[#FFFFFF]">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          {schedule.map((item, idx) => {
            const isActive = item.status === "active";
            const indexLabel = String(idx + 1).padStart(2, "0");

            return (
              <article
                key={item.id}
                className="py-12 sm:py-16 border-b border-[#111110]/10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center"
              >
                {/* Stage Index & Status */}
                <div className="lg:col-span-3 space-y-3">
                  <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#6E6A63]">
                    {indexLabel} — {item.editionLabel}
                  </div>

                  <div className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] uppercase">
                    <span
                      className={`inline-block h-1.5 w-1.5 ${
                        isActive ? "bg-[#8C1D18]" : "bg-[#111110]/30"
                      }`}
                    />
                    <span
                      className={isActive ? "text-[#8C1D18]" : "text-[#6E6A63]"}
                    >
                      {item.season}
                    </span>
                  </div>
                </div>

                {/* Editorial Frame */}
                <div className="lg:col-span-3">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#141413]">
                    <Image
                      src={getV10CleanImage(item.image, idx)}
                      alt={item.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 24vw"
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Release Details & Action */}
                <div className="lg:col-span-6 lg:pl-4">
                  <h2 className="font-editorial text-3xl sm:text-5xl leading-[1.02] text-[#111110]">
                    {item.title}
                  </h2>

                  <p className="mt-3 font-mono text-[11px] tracking-[0.16em] uppercase text-[#6E6A63]">
                    {item.piecesSummary}
                  </p>

                  <p className="mt-4 font-sans text-sm leading-relaxed text-[#6E6A63] max-w-lg">
                    {cleanV10Text(item.note)}
                  </p>

                  <div className="mt-7">
                    <Link
                      href={item.href}
                      className={`inline-flex items-center gap-3 rounded-none px-6 py-3.5 font-sans text-[11px] font-medium uppercase tracking-[0.2em] transition-colors ${
                        isActive
                          ? "bg-[#111110] text-[#FAF9F6] hover:bg-[#111110]/90"
                          : "border border-[#111110]/20 bg-transparent text-[#111110] hover:border-[#111110] hover:bg-[#111110] hover:text-[#FAF9F6]"
                      }`}
                    >
                      <span>{item.cta.toUpperCase()}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Permanent Edition Architecture Ledger */}
      <section className="bg-[#F2EFE9] border-b border-[#111110]/10 py-16 sm:py-24">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          <div className="max-w-2xl mb-12">
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#6E6A63]">
              EDITION ARCHITECTURE · PERMANENT HOUSE STANDARD
            </span>
            <h2 className="font-editorial text-4xl sm:text-5xl leading-[1.02] text-[#111110] mt-3">
              Two tiers of <span className="italic">numbered</span> scarcity.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 border border-[#111110]/10 bg-[#FAF9F6]">
            {/* Column 1 — One-of-One Collector Works */}
            <div className="p-8 sm:p-12 md:border-r border-b md:border-b-0 border-[#111110]/10 flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#8C1D18]">
                  TIER 01 · ARCHIVE SINGULAR
                </span>

                <h3 className="font-editorial text-3xl sm:text-4xl text-[#111110] mt-3">
                  ONE-OF-ONE COLLECTOR WORKS
                </h3>

                <p className="mt-3 pb-6 border-b border-[#111110]/10 font-mono text-[11px] tracking-[0.16em] uppercase text-[#6E6A63]">
                  01 Unit Worldwide · ₹5,000 – ₹10,000+
                </p>

                <p className="mt-6 font-sans text-sm leading-relaxed text-[#6E6A63]">
                  Bespoke brushwork, hand-loomed distressing, and individually
                  numbered archive plates. Constructed in-house as singular
                  wearable works and never reproduced.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-[#111110]/10 space-y-3 font-mono text-[10px] tracking-[0.16em] uppercase">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[#6E6A63]">EDITION SIZE</span>
                  <span className="text-[#111110]">01 / 01 WORLDWIDE</span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[#6E6A63]">PROVENANCE</span>
                  <span className="text-[#111110]">
                    ENGRAVED ARCHIVE PLATE
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[#6E6A63]">REPRODUCTION</span>
                  <span className="text-[#111110]">NEVER REPRODUCED</span>
                </div>
              </div>
            </div>

            {/* Column 2 — Small-Batch Editions */}
            <div className="p-8 sm:p-12 flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#6E6A63]">
                  TIER 02 · MICRO-BATCH SERIES
                </span>

                <h3 className="font-editorial text-3xl sm:text-4xl text-[#111110] mt-3">
                  SMALL-BATCH EDITIONS
                </h3>

                <p className="mt-3 pb-6 border-b border-[#111110]/10 font-mono text-[11px] tracking-[0.16em] uppercase text-[#6E6A63]">
                  03–04 Units Per Design · ₹2,500 – ₹4,000
                </p>

                <p className="mt-6 font-sans text-sm leading-relaxed text-[#6E6A63]">
                  Heavyweight 310–480 GSM fabrics, chain-stitch embroidery, and
                  high-density puff prints. Cut upon reservation in strict
                  micro-runs with zero restocks once claimed.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-[#111110]/10 space-y-3 font-mono text-[10px] tracking-[0.16em] uppercase">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[#6E6A63]">EDITION SIZE</span>
                  <span className="text-[#111110]">03 – 04 UNITS PER RUN</span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[#6E6A63]">FABRIC WEIGHT</span>
                  <span className="text-[#111110]">
                    310 – 480 GSM INDIAN COTTON
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[#6E6A63]">RESTOCK POLICY</span>
                  <span className="text-[#111110]">ZERO RESTOCKS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Current Edition Preview Strip */}
      <section className="bg-[#FFFFFF] py-16 sm:py-24">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-10 border-b border-[#111110]/10">
            <div>
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#6E6A63]">
                {editionLabel} · PUBLIC CONTACT SHEET
              </span>
              <h2 className="font-editorial text-3xl sm:text-5xl leading-[1.02] text-[#111110] mt-3">
                Publicly revealed silhouettes.
              </h2>
            </div>

            <Link
              href="/v10/release"
              className="inline-flex items-center gap-2.5 rounded-none border border-[#111110]/20 hover:border-[#111110] px-5 py-3 font-sans text-[11px] uppercase tracking-[0.2em] text-[#111110] transition-colors self-start sm:self-auto"
            >
              <span>ENTER PRIVATE RELEASE</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {revealedPieces.map((piece, idx) => {
              const isOneOfOne = piece.tier === "one-of-one";

              return (
                <Link
                  key={piece._id}
                  href="/v10/release"
                  className="group block rounded-none"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#141413]">
                    <Image
                      src={getV10CleanImage(piece.imageUrl, idx)}
                      alt={piece.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 24vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  </div>

                  <div className="pt-3.5">
                    <div className="flex items-center justify-between gap-2 font-mono text-[10px] tracking-[0.18em] uppercase">
                      <span className="text-[#6E6A63]">{piece.serialCode}</span>
                      <span
                        className={
                          isOneOfOne ? "text-[#8C1D18]" : "text-[#6E6A63]"
                        }
                      >
                        {isOneOfOne
                          ? "ONE OF ONE"
                          : `EDITION OF ${String(piece.totalUnits).padStart(2, "0")}`}
                      </span>
                    </div>

                    <h3 className="font-editorial text-xl leading-[1.2] text-[#111110] mt-1.5 group-hover:text-[#111110]/70 transition-colors">
                      {piece.title}
                    </h3>

                    <p className="mt-1.5 font-mono text-[11px] text-[#6E6A63]">
                      {formatInr(piece.priceInr)}
                    </p>
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
