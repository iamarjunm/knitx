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
import V2CurtainEntrance from "./V2CurtainEntrance";
import V2Navbar from "./V2Navbar";
import V2HeroDeck from "./V2HeroDeck";
import V2GarmentRack, { V2GarmentInspectorModal } from "./V2GarmentRack";
import V2FabricSwatchBar from "./V2FabricSwatchBar";
import V2SplitFlapVault from "./V2SplitFlapVault";
import V2SwipeVote from "./V2SwipeVote";
import V2CreatorTagLab from "./V2CreatorTagLab";

export interface V2ExperienceProps {
  drop: DropCampaign;
  products: Product[];
  candidates: VoteCandidate[];
  submissions: CreatorSubmissionItem[];
}

export default function V2Experience({
  drop,
  products,
  candidates,
  submissions,
}: V2ExperienceProps) {
  const [inspectedProduct, setInspectedProduct] = useState<Product | null>(null);

  return (
    <div className="min-h-screen bg-porcelain text-ink selection:bg-klein selection:text-white">
      <V2CurtainEntrance />
      <V2Navbar />

      <V2HeroDeck
        drop={drop}
        products={products}
        onOpenProduct={setInspectedProduct}
      />

      <V2GarmentRack
        products={products}
        onInspectProduct={setInspectedProduct}
      />

      <V2FabricSwatchBar />

      <V2SplitFlapVault drop={drop} />

      <V2SwipeVote initialCandidates={candidates} />

      <V2CreatorTagLab initialSubmissions={submissions} />

      {/* Bespoke Serene V2 Exhibition Footer */}
      <footer className="border-t border-ink/10 bg-linen pb-24 pt-20 text-ink">
        <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
          <div className="grid grid-cols-1 gap-10 pb-16 sm:grid-cols-2 lg:grid-cols-12">
            {/* Editorial Colophon */}
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-klein" />
                <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.22em] text-muted">
                  THE PHYSICAL ARCHIVE ROOM · DROP 01
                </span>
              </div>
              <p className="mt-5 max-w-sm font-editorial text-2xl leading-snug text-ink sm:text-[1.7rem]">
                Micro-batch silhouettes cut in India — strictly numbered,
                community voted, and never restocked.
              </p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                SMALL-BATCH 03–04 UNITS · 1-OF-1 ARCHIVE · 0.0% DEADSTOCK
              </p>
            </div>

            {/* Room Index */}
            <div className="lg:col-span-2">
              <p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-klein">
                EXHIBITION ROOMS
              </p>
              <ul className="space-y-2.5 text-sm text-ink/80">
                <li>
                  <a href="#deck" className="transition-colors hover:text-klein">
                    01 · Lookbook Deck
                  </a>
                </li>
                <li>
                  <a href="#rack" className="transition-colors hover:text-klein">
                    02 · Garment Rack
                  </a>
                </li>
                <li>
                  <a
                    href="#vault-gate"
                    className="transition-colors hover:text-klein"
                  >
                    03 · Waitlist Gate
                  </a>
                </li>
                <li>
                  <a
                    href="#swipe-vote"
                    className="transition-colors hover:text-klein"
                  >
                    04 · Drop 02 Jury
                  </a>
                </li>
                <li>
                  <a
                    href="#tag-lab"
                    className="transition-colors hover:text-klein"
                  >
                    05 · Woven Tag Lab
                  </a>
                </li>
                <li>
                  <a
                    href="#dissect"
                    className="transition-colors hover:text-klein"
                  >
                    06 · Garment Anatomy
                  </a>
                </li>
              </ul>
            </div>

            {/* Direct Spaces */}
            <div className="lg:col-span-2">
              <p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-klein">
                ARCHIVE SPACES
              </p>
              <ul className="space-y-2.5 text-sm text-ink/80">
                <li>
                  <Link
                    href="/vault"
                    className="inline-flex items-center gap-1 transition-colors hover:text-klein"
                  >
                    Private Vault <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/vote"
                    className="inline-flex items-center gap-1 transition-colors hover:text-klein"
                  >
                    Full Vote Board <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/submit"
                    className="inline-flex items-center gap-1 transition-colors hover:text-klein"
                  >
                    Creator Bench <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/atelier"
                    className="inline-flex items-center gap-1 transition-colors hover:text-klein"
                  >
                    Sample-First Notes <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Edition Standards */}
            <div className="lg:col-span-3">
              <p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-klein">
                PRODUCTION STANDARDS
              </p>
              <div className="space-y-2.5 rounded-2xl border border-ink/10 bg-white/75 p-4 font-mono text-[10.5px] leading-relaxed text-muted">
                <p className="flex justify-between">
                  <span>SMALL-BATCH</span>
                  <span className="font-semibold text-ink">
                    3–4 UNITS · ₹2.5K–₹4K
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>ONE-OF-ONE</span>
                  <span className="font-semibold text-archive-red">
                    1 UNIT · ₹5K–₹10K+
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>ORIGIN</span>
                  <span className="font-semibold text-ink">MADE IN INDIA</span>
                </p>
                <p className="flex justify-between">
                  <span>DISPATCH</span>
                  <span className="font-semibold text-ink">
                    PAN-INDIA INSURED
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Monumental Serene Wordmark */}
          <div className="border-t border-ink/10 pt-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <h2 className="font-syne text-[18vw] font-extrabold leading-[0.82] tracking-[-0.04em] text-ink sm:text-[13vw] lg:text-[10.5rem]">
                KNITX<span className="text-klein">.</span>
              </h2>
              <div className="pb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted sm:text-right">
                <p className="font-semibold text-ink">
                  KNITX® INDIA · ARCHIVE EDITION
                </p>
                <p className="mt-1">
                  WAITLIST ONLY · COMMUNITY CURATED · ZERO RESTOCKS
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <V2GarmentInspectorModal
        product={inspectedProduct}
        onClose={() => setInspectedProduct(null)}
      />
    </div>
  );
}
