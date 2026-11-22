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
import { formatInr } from "@/lib/utils";
import V8Navbar from "./V8Navbar";
import V8Hero from "./V8Hero";
import V8RackSection, { V8ProductSheet } from "./V8RackSection";
import V8CommunityVault from "./V8CommunityVault";

export interface V8ExperienceProps {
  drop: DropCampaign;
  products: Product[];
  candidates: VoteCandidate[];
  submissions: CreatorSubmissionItem[];
}

export default function V8Experience({
  drop,
  products,
  candidates,
  submissions,
}: V8ExperienceProps) {
  const [inspectedProduct, setInspectedProduct] = useState<Product | null>(
    null
  );

  return (
    <div className="min-h-screen bg-porcelain text-ink selection:bg-orange selection:text-white">
      <V8Navbar />

      <main>
        <V8Hero drop={drop} />

        <V8RackSection
          products={products}
          onInspectProduct={setInspectedProduct}
        />

        <V8CommunityVault
          drop={drop}
          initialCandidates={candidates}
          initialSubmissions={submissions}
        />
      </main>

      {/* Serene Porcelain & Linen V8 Showroom Footer */}
      <footer className="border-t border-ink/10 bg-linen pt-20 pb-24 text-ink">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-8">
          <div className="grid grid-cols-1 gap-10 pb-16 sm:grid-cols-2 lg:grid-cols-12">
            {/* Editorial Statement */}
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/85 px-3.5 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-orange" />
                <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.2em] text-muted">
                  {drop.dropNumber || "DROP 01"} · PAN-INDIA ARCHIVE
                </span>
              </div>

              <p className="mt-5 max-w-sm text-lg leading-relaxed font-medium tracking-[-0.01em] text-ink">
                Ultra-limited silhouettes cut in India — strictly numbered,
                community voted, and never restocked.
              </p>

              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                SMALL-BATCH 03–04 UNITS · 1-OF-1 ARCHIVE · 0% DEADSTOCK
              </p>
            </div>

            {/* Showroom Anchors */}
            <div className="lg:col-span-2">
              <p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-orange">
                SHOWROOM
              </p>
              <ul className="space-y-2.5 text-sm text-ink/80">
                <li>
                  <a
                    href="#v8-hero"
                    className="transition-colors hover:text-orange"
                  >
                    01 · Drop Overview
                  </a>
                </li>
                <li>
                  <a
                    href="#v8-rack"
                    className="transition-colors hover:text-orange"
                  >
                    02 · The 10-Piece Rack
                  </a>
                </li>
                <li>
                  <a
                    href="#v8-waitlist"
                    className="transition-colors hover:text-orange"
                  >
                    03 · Waitlist Keycard
                  </a>
                </li>
                <li>
                  <a
                    href="#v8-community"
                    className="transition-colors hover:text-orange"
                  >
                    04 · Community Studio
                  </a>
                </li>
              </ul>
            </div>

            {/* Archive Routes */}
            <div className="lg:col-span-2">
              <p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-orange">
                ARCHIVE
              </p>
              <ul className="space-y-2.5 text-sm text-ink/80">
                <li>
                  <Link
                    href="/vault"
                    className="inline-flex items-center gap-1 transition-colors hover:text-orange"
                  >
                    Private Vault <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/vote"
                    className="inline-flex items-center gap-1 transition-colors hover:text-orange"
                  >
                    Drop 02 Vote <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/submit"
                    className="inline-flex items-center gap-1 transition-colors hover:text-orange"
                  >
                    Creator Lab <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/atelier"
                    className="inline-flex items-center gap-1 transition-colors hover:text-orange"
                  >
                    Sample-First Notes <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Edition Standards */}
            <div className="lg:col-span-3">
              <p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-orange">
                EDITION STANDARDS
              </p>
              <div className="space-y-2.5 rounded-2xl border border-ink/10 bg-white/85 p-4 font-mono text-[10.5px] leading-relaxed text-muted">
                <p className="flex items-center justify-between gap-2">
                  <span>SMALL-BATCH</span>
                  <span className="font-semibold text-ink">
                    3–4 · {formatInr(2500)}–{formatInr(4000)}
                  </span>
                </p>
                <p className="flex items-center justify-between gap-2">
                  <span>ONE-OF-ONE</span>
                  <span className="font-semibold text-orange">
                    1 UNIT · {formatInr(5000)}–{formatInr(10000)}+
                  </span>
                </p>
                <p className="flex items-center justify-between gap-2">
                  <span>ORIGIN</span>
                  <span className="font-semibold text-ink">MADE IN INDIA</span>
                </p>
                <p className="flex items-center justify-between gap-2">
                  <span>DISPATCH</span>
                  <span className="font-semibold text-ink">
                    PAN-INDIA INSURED
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Oversized Anton Poster Wordmark */}
          <div className="border-t border-ink/10 pt-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <h2 className="font-poster text-[21vw] leading-[0.82] tracking-tight text-ink uppercase select-none sm:text-[14vw] lg:text-[11.5rem]">
                KNITX<span className="text-orange">.</span>
              </h2>

              <div className="pb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted sm:text-right">
                <p className="font-semibold text-ink">
                  KNITX® INDIA · WAITLIST ARCHIVE
                </p>
                <p className="mt-1">
                  CUT TO ORDER · COMMUNITY VOTED · NEVER RESTOCKED
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <V8ProductSheet
        product={inspectedProduct}
        onClose={() => setInspectedProduct(null)}
      />
    </div>
  );
}
