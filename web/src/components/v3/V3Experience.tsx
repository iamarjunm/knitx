"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type {
  CreatorSubmissionItem,
  DropCampaign,
  Product,
  VoteCandidate,
} from "@/lib/types";
import V3Navbar from "./V3Navbar";
import V3FilmHero from "./V3FilmHero";
import V3LockerVault, { V3LockerClaimModal } from "./V3LockerVault";
import V3PassbookWaitlist from "./V3PassbookWaitlist";
import V3BracketVote from "./V3BracketVote";
import V3CreatorConsole from "./V3CreatorConsole";
import V3SampleCalculator from "./V3SampleCalculator";

export interface V3ExperienceProps {
  drop: DropCampaign;
  products: Product[];
  candidates: VoteCandidate[];
  submissions: CreatorSubmissionItem[];
}

export default function V3Experience({
  drop,
  products,
  candidates,
  submissions,
}: V3ExperienceProps) {
  const [inspectedProduct, setInspectedProduct] = useState<Product | null>(
    null
  );

  return (
    <div className="min-h-screen bg-alabaster text-espresso selection:bg-chartreuse selection:text-espresso">
      <V3Navbar />

      <V3FilmHero
        drop={drop}
        products={products}
        onInspectProduct={setInspectedProduct}
      />

      <V3LockerVault
        products={products}
        onInspectProduct={setInspectedProduct}
      />

      <V3PassbookWaitlist drop={drop} />

      <V3BracketVote initialCandidates={candidates} />

      <V3CreatorConsole initialSubmissions={submissions} />

      <V3SampleCalculator />

      {/* Bespoke V3 Hunter-Green & Alabaster Architectural Footer */}
      <footer className="border-t border-hunter/20 bg-alabaster px-3 pb-24 pt-6 sm:px-6">
        <div className="mx-auto max-w-[1380px] overflow-hidden rounded-[28px] border border-hunter bg-hunter text-alabaster shadow-[0_24px_60px_-28px_rgba(20,54,40,0.55)]">
          {/* Top Telemetry Rail */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-alabaster/15 px-6 py-4 sm:px-10">
            <div className="inline-flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-chartreuse shadow-[0_0_8px_#C8F200]" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-chartreuse">
                KNITX® VAULT OS · DROP {drop.dropNumber} ARCHIVE
              </span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-alabaster/70">
              SAMPLE-FIRST · COMMUNITY CURATED · MADE IN INDIA
            </span>
          </div>

          {/* Footer Grid */}
          <div className="grid grid-cols-1 gap-10 px-6 py-14 sm:grid-cols-2 sm:px-10 lg:grid-cols-12">
            {/* Editorial Colophon */}
            <div className="lg:col-span-5">
              <p className="max-w-md font-editorial text-3xl leading-[1.08] text-white sm:text-[2.15rem]">
                Heavyweight silhouettes cut strictly after claim —{" "}
                <span className="italic text-chartreuse">
                  numbered forever, never restocked.
                </span>
              </p>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-alabaster/75">
                Designed with independent Indian creators, verified by live
                community brackets, and crafted in 450+ GSM cotton with zero
                deadstock.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 font-mono text-[9.5px] uppercase tracking-[0.18em]">
                <span className="rounded-md border border-chartreuse/40 bg-chartreuse/10 px-2.5 py-1 text-chartreuse">
                  0.0% DEADSTOCK
                </span>
                <span className="rounded-md border border-alabaster/20 bg-white/5 px-2.5 py-1 text-alabaster/85">
                  PAN-INDIA INSURED DISPATCH
                </span>
              </div>
            </div>

            {/* Vault OS Modules */}
            <div className="lg:col-span-2">
              <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-chartreuse">
                VAULT MODULES
              </p>
              <ul className="space-y-2.5 font-sans text-sm text-alabaster/80">
                <li>
                  <a
                    href="#lockers"
                    className="transition-colors hover:text-chartreuse"
                  >
                    01 · Vault Lockers
                  </a>
                </li>
                <li>
                  <a
                    href="#passbook"
                    className="transition-colors hover:text-chartreuse"
                  >
                    02 · Passbook Queue
                  </a>
                </li>
                <li>
                  <a
                    href="#bracket"
                    className="transition-colors hover:text-chartreuse"
                  >
                    03 · Drop 02 Bracket
                  </a>
                </li>
                <li>
                  <a
                    href="#console"
                    className="transition-colors hover:text-chartreuse"
                  >
                    04 · Spec Console
                  </a>
                </li>
                <li>
                  <a
                    href="#calculator"
                    className="transition-colors hover:text-chartreuse"
                  >
                    05 · Zero-Waste Ledger
                  </a>
                </li>
              </ul>
            </div>

            {/* Direct Spaces */}
            <div className="lg:col-span-2">
              <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-chartreuse">
                DIRECT ROOMS
              </p>
              <ul className="space-y-2.5 font-sans text-sm text-alabaster/80">
                <li>
                  <Link
                    href="/vault"
                    className="inline-flex items-center gap-1 transition-colors hover:text-chartreuse"
                  >
                    Private Vault <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/vote"
                    className="inline-flex items-center gap-1 transition-colors hover:text-chartreuse"
                  >
                    Community Vote <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/submit"
                    className="inline-flex items-center gap-1 transition-colors hover:text-chartreuse"
                  >
                    Creator Bench <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/atelier"
                    className="inline-flex items-center gap-1 transition-colors hover:text-chartreuse"
                  >
                    Atelier Notes <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Alabaster Spec Ledger Card */}
            <div className="lg:col-span-3">
              <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-chartreuse">
                EDITION STANDARDS
              </p>
              <div className="space-y-2.5 rounded-2xl border border-alabaster/20 bg-alabaster p-4 font-mono text-[10.5px] leading-relaxed text-espresso">
                <p className="flex items-center justify-between border-b border-hunter/10 pb-2">
                  <span className="text-espresso/65">SMALL-BATCH</span>
                  <span className="font-bold text-hunter">
                    3–4 UNITS · ₹2.5K–₹4K
                  </span>
                </p>
                <p className="flex items-center justify-between border-b border-hunter/10 pb-2">
                  <span className="text-espresso/65">ONE-OF-ONE</span>
                  <span className="rounded bg-chartreuse px-1.5 py-0.5 font-bold text-espresso">
                    1 UNIT · ₹5K–₹10K+
                  </span>
                </p>
                <p className="flex items-center justify-between border-b border-hunter/10 pb-2">
                  <span className="text-espresso/65">PRE-LAUNCH</span>
                  <span className="font-bold text-espresso">
                    10 SAMPLES ONLY
                  </span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-espresso/65">ORIGIN</span>
                  <span className="font-bold text-hunter">MADE IN INDIA</span>
                </p>
              </div>
            </div>
          </div>

          {/* Monumental Architectural Wordmark Band */}
          <div className="border-t border-alabaster/15 bg-alabaster px-6 pb-8 pt-7 text-espresso sm:px-10">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <h2 className="font-syne text-[17vw] font-extrabold leading-[0.82] tracking-[-0.04em] text-hunter sm:text-[12vw] lg:text-[9.5rem]">
                KNITX
                <span className="inline-block text-chartreuse drop-shadow-[0_1px_0_#143628]">
                  ®
                </span>
              </h2>
              <div className="pb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-espresso/65 sm:text-right">
                <p className="font-bold text-hunter">
                  KNITX® INDIA · VAULT OS
                </p>
                <p className="mt-1">
                  WAITLIST ACCESS · ZERO RESTOCKS · COMMUNITY DRIVEN
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <V3LockerClaimModal
        product={inspectedProduct}
        onClose={() => setInspectedProduct(null)}
      />
    </div>
  );
}
