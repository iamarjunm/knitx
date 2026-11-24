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
import { V4Navbar } from "./V4Navbar";
import { V4ZineHero } from "./V4ZineHero";
import { V4ClaimModal, V4ScratchBoard } from "./V4ScratchBoard";
import V4StampWaitlist from "./V4StampWaitlist";
import V4StickerVote from "./V4StickerVote";
import V4PostcardSubmit from "./V4PostcardSubmit";

export interface V4ExperienceProps {
  drop: DropCampaign;
  products: Product[];
  candidates: VoteCandidate[];
  submissions: CreatorSubmissionItem[];
}

export function V4Experience({
  drop,
  products,
  candidates,
  submissions,
}: V4ExperienceProps) {
  const [inspectedProduct, setInspectedProduct] = useState<Product | null>(
    null
  );

  return (
    <div className="min-h-screen bg-newsprint text-ink selection:bg-riso selection:text-white">
      <V4Navbar />

      <main>
        <V4ZineHero
          drop={drop}
          products={products}
          onInspectProduct={setInspectedProduct}
        />

        <V4ScratchBoard
          products={products}
          onInspectProduct={setInspectedProduct}
        />

        <V4StampWaitlist drop={drop} />

        <V4StickerVote initialCandidates={candidates} />

        <V4PostcardSubmit initialSubmissions={submissions} />
      </main>

      {/* Broadsheet Zine Back-Cover Footer (pb-24 clearance for VersionSwitcher) */}
      <footer className="border-t-2 border-ink bg-manila px-4 pb-24 pt-12 text-ink sm:px-8">
        <div className="mx-auto max-w-[1320px] border-2 border-ink bg-newsprint stamp-shadow">
          {/* Top Broadsheet Colophon Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink bg-white px-5 py-3.5 sm:px-8">
            <div className="flex flex-wrap items-center gap-2.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.2em]">
              <span className="border border-ink bg-riso px-2 py-0.5 text-white">
                BACK COVER
              </span>
              <span>
                THE KNITX ZINE · VOL. 01 · DROP {drop.dropNumber}
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
              PRINTED IN INDIA · SAMPLE-FIRST · ZERO DEADSTOCK
            </span>
          </div>

          {/* 4-Column Broadsheet Index Grid */}
          <div className="grid grid-cols-1 divide-y-2 divide-ink sm:grid-cols-2 lg:grid-cols-12 lg:divide-x-2 lg:divide-y-0">
            {/* Editorial Colophon */}
            <div className="p-6 sm:p-8 lg:col-span-5">
              <p className="font-editorial text-3xl leading-[1.08] text-ink sm:text-[2.15rem]">
                Heavyweight Indian streetwear printed like an underground zine —{" "}
                <span className="italic text-riso">
                  numbered forever, never restocked.
                </span>
              </p>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
                Every drop is co-created with independent Indian designers,
                voted on live by the community, and cut strictly after your
                vault order is placed.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 font-mono text-[9.5px] font-bold uppercase tracking-[0.16em]">
                <span className="border border-ink bg-ochre px-2.5 py-1 text-ink">
                  0.0% DEADSTOCK
                </span>
                <span className="border border-ink bg-white px-2.5 py-1 text-ink">
                  PAN-INDIA INSURED DISPATCH
                </span>
              </div>
            </div>

            {/* Issue Index Anchors */}
            <div className="p-6 sm:p-8 lg:col-span-2">
              <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-riso">
                ISSUE INDEX
              </p>
              <ul className="space-y-2.5 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-ink">
                <li>
                  <a
                    href="#spread"
                    className="transition-colors hover:text-riso"
                  >
                    01 · Cover Spread
                  </a>
                </li>
                <li>
                  <a
                    href="#scratch"
                    className="transition-colors hover:text-riso"
                  >
                    02 · Scratch Board
                  </a>
                </li>
                <li>
                  <a
                    href="#stamp-card"
                    className="transition-colors hover:text-riso"
                  >
                    03 · Postcard Queue
                  </a>
                </li>
                <li>
                  <a
                    href="#sticker-poll"
                    className="transition-colors hover:text-riso"
                  >
                    04 · Sticker Vote
                  </a>
                </li>
                <li>
                  <a
                    href="#postcard"
                    className="transition-colors hover:text-riso"
                  >
                    05 · Open Call
                  </a>
                </li>
              </ul>
            </div>

            {/* Direct Archive Rooms */}
            <div className="p-6 sm:p-8 lg:col-span-2">
              <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-riso">
                DIRECT ROOMS
              </p>
              <ul className="space-y-2.5 font-sans text-sm font-medium text-ink">
                <li>
                  <Link
                    href="/vault"
                    className="inline-flex items-center gap-1 transition-colors hover:text-riso"
                  >
                    Private Vault <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/vote"
                    className="inline-flex items-center gap-1 transition-colors hover:text-riso"
                  >
                    Community Vote <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/submit"
                    className="inline-flex items-center gap-1 transition-colors hover:text-riso"
                  >
                    Creator Bench <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/atelier"
                    className="inline-flex items-center gap-1 transition-colors hover:text-riso"
                  >
                    Atelier Notes <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Edition Standards Print Box */}
            <div className="p-6 sm:p-8 lg:col-span-3">
              <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-riso">
                EDITION STANDARDS
              </p>
              <div className="space-y-2.5 border-2 border-ink bg-white p-4 font-mono text-[10.5px] leading-relaxed text-ink">
                <p className="flex items-center justify-between border-b border-dashed border-ink/40 pb-2">
                  <span className="text-muted">SMALL-BATCH</span>
                  <span className="font-bold text-ink">3–4 UNITS</span>
                </p>
                <p className="flex items-center justify-between border-b border-dashed border-ink/40 pb-2">
                  <span className="text-muted">ONE-OF-ONE</span>
                  <span className="bg-riso px-1.5 py-0.5 font-bold text-white">
                    1 UNIT ONLY
                  </span>
                </p>
                <p className="flex items-center justify-between border-b border-dashed border-ink/40 pb-2">
                  <span className="text-muted">PRE-LAUNCH</span>
                  <span className="font-bold text-ink">10 SAMPLES</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-muted">ORIGIN</span>
                  <span className="font-bold text-ink">MADE IN INDIA</span>
                </p>
              </div>
            </div>
          </div>

          {/* Monumental Back-Cover Risograph Masthead Band */}
          <div className="border-t-2 border-ink bg-white px-5 pb-7 pt-6 sm:px-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div className="relative">
                <h2 className="font-poster text-[18vw] uppercase leading-[0.82] tracking-[-0.01em] text-ink sm:text-[13vw] lg:text-[9.5rem]">
                  KNITX
                  <span className="text-riso">®</span>
                </h2>
              </div>

              <div className="flex flex-col items-start gap-2 pb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted sm:items-end sm:text-right">
                <div className="inline-flex items-center gap-2 border border-ink bg-ochre px-2.5 py-1 font-bold text-ink">
                  <span>ISSN 001-KX</span>
                  <span>·</span>
                  <span>WAITLIST EDITION</span>
                </div>
                <p className="font-bold text-ink">
                  KNITX® INDIA · PRINTED STREET ZINE
                </p>
                <p>ZERO RESTOCKS · COMMUNITY CURATED · SAMPLE-FIRST</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <V4ClaimModal
        product={inspectedProduct}
        onClose={() => setInspectedProduct(null)}
      />
    </div>
  );
}

export default V4Experience;
