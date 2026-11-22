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
import V5Navbar from "./V5Navbar";
import V5ApertureHero from "./V5ApertureHero";
import V5CurtainGallery, { V5GarmentDrawer } from "./V5CurtainGallery";
import V5EnvelopeWaitlist from "./V5EnvelopeWaitlist";
import V5CuratorVote from "./V5CuratorVote";
import V5AtelierFolio from "./V5AtelierFolio";

export interface V5ExperienceProps {
  drop: DropCampaign;
  products: Product[];
  candidates: VoteCandidate[];
  submissions: CreatorSubmissionItem[];
}

export default function V5Experience({
  drop,
  products,
  candidates,
  submissions,
}: V5ExperienceProps) {
  const [inspectedProduct, setInspectedProduct] = useState<Product | null>(
    null
  );

  return (
    <div className="min-h-screen bg-plaster text-umber selection:bg-terracotta selection:text-plaster">
      <V5Navbar />

      <V5ApertureHero drop={drop} />

      <V5CurtainGallery
        products={products}
        onInspectProduct={setInspectedProduct}
      />

      <V5EnvelopeWaitlist drop={drop} />

      <V5CuratorVote initialCandidates={candidates} />

      <V5AtelierFolio initialSubmissions={submissions} />

      {/* Whisper-Quiet Museum Colophon Footer */}
      <footer className="border-t border-champagne bg-travertine pb-24 pt-20 text-umber">
        <div className="mx-auto max-w-[1340px] px-6 sm:px-10 lg:px-12">
          {/* Top Museum Provenance Rail */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-champagne pb-6 font-mono text-[10px] uppercase tracking-[0.24em] text-muted">
            <span className="inline-flex items-center gap-2.5 text-umber">
              <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
              <span>KNITX MUSEUM GALLERY · DROP {drop.dropNumber}</span>
            </span>
            <span>SAMPLE-FIRST · COMMUNITY CURATED · MADE IN INDIA</span>
          </div>

          {/* 4-Column Colophon Grid */}
          <div className="grid grid-cols-1 gap-12 py-14 sm:grid-cols-2 lg:grid-cols-12">
            {/* Editorial Colophon Note */}
            <div className="lg:col-span-5">
              <p className="max-w-md font-editorial text-3xl leading-[1.1] text-umber sm:text-[2.25rem]">
                Heavyweight garments cut strictly after claim —{" "}
                <span className="italic text-terracotta">
                  numbered forever, never restocked.
                </span>
              </p>
              <p className="mt-5 max-w-sm font-sans text-sm leading-relaxed text-muted">
                Co-created with independent Indian designers, curated by
                community token ballots, and milled in heavyweight cotton with
                zero unsold inventory.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 font-mono text-[9.5px] uppercase tracking-[0.18em]">
                <span className="rounded-sm border border-champagne bg-plaster px-2.5 py-1 text-terracotta">
                  0.0% DEADSTOCK
                </span>
                <span className="rounded-sm border border-champagne bg-plaster px-2.5 py-1 text-muted">
                  PAN-INDIA INSURED DISPATCH
                </span>
              </div>
            </div>

            {/* Exhibition Wing Index */}
            <div className="lg:col-span-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                EXHIBITION ROOMS
              </p>
              <ul className="mt-4 space-y-2.5 font-sans text-sm text-umber/85">
                <li>
                  <a
                    href="#aperture"
                    className="transition-colors hover:text-terracotta"
                  >
                    01 · Archway Exhibition
                  </a>
                </li>
                <li>
                  <a
                    href="#curtain-gallery"
                    className="transition-colors hover:text-terracotta"
                  >
                    02 · Silk Curtain Gallery
                  </a>
                </li>
                <li>
                  <a
                    href="#envelope"
                    className="transition-colors hover:text-terracotta"
                  >
                    03 · Private Admission
                  </a>
                </li>
                <li>
                  <a
                    href="#curator-vote"
                    className="transition-colors hover:text-terracotta"
                  >
                    04 · Community Curation
                  </a>
                </li>
                <li>
                  <a
                    href="#folio"
                    className="transition-colors hover:text-terracotta"
                  >
                    05 · Atelier Folio
                  </a>
                </li>
              </ul>
            </div>

            {/* Direct Spaces */}
            <div className="lg:col-span-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                ARCHIVE SPACES
              </p>
              <ul className="mt-4 space-y-2.5 font-sans text-sm text-umber/85">
                <li>
                  <Link
                    href="/vault"
                    className="inline-flex items-center gap-1 transition-colors hover:text-terracotta"
                  >
                    <span>Private Vault</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/vote"
                    className="inline-flex items-center gap-1 transition-colors hover:text-terracotta"
                  >
                    <span>Drop 02 Ballot</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/submit"
                    className="inline-flex items-center gap-1 transition-colors hover:text-terracotta"
                  >
                    <span>Designer Commission</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/atelier"
                    className="inline-flex items-center gap-1 transition-colors hover:text-terracotta"
                  >
                    <span>Atelier Journal</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Edition Standards Plaque */}
            <div className="lg:col-span-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                EDITION STANDARDS
              </p>
              <div className="mt-4 space-y-2.5 rounded-sm border border-champagne bg-plaster p-4 font-mono text-[10px] uppercase tracking-[0.14em]">
                <p className="flex items-center justify-between border-b border-champagne/80 pb-2">
                  <span className="text-muted">SMALL-BATCH</span>
                  <span className="text-umber">3–4 UNITS · ₹2.5K–₹4K</span>
                </p>
                <p className="flex items-center justify-between border-b border-champagne/80 pb-2">
                  <span className="text-muted">ONE-OF-ONE</span>
                  <span className="text-terracotta">1 UNIT · ₹5K–₹10K+</span>
                </p>
                <p className="flex items-center justify-between border-b border-champagne/80 pb-2">
                  <span className="text-muted">PRE-LAUNCH</span>
                  <span className="text-umber">10 SAMPLES ONLY</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-muted">PROVENANCE</span>
                  <span className="text-umber">MADE IN INDIA</span>
                </p>
              </div>
            </div>
          </div>

          {/* Sculptural Quiet Serif Colophon Wordmark */}
          <div className="flex flex-col items-start justify-between gap-4 border-t border-champagne pt-10 sm:flex-row sm:items-end">
            <h2 className="font-editorial text-[16vw] leading-[0.82] tracking-[-0.03em] text-umber sm:text-[11vw] lg:text-[8.5rem]">
              KNITX<span className="italic text-terracotta">.</span>
            </h2>

            <div className="pb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted sm:text-right">
              <p className="text-umber">KNITX INDIA · EDITION 05</p>
              <p className="mt-1">
                BY INVITATION · HAND-NUMBERED · ZERO RESTOCKS
              </p>
            </div>
          </div>
        </div>
      </footer>

      <V5GarmentDrawer
        product={inspectedProduct}
        onClose={() => setInspectedProduct(null)}
      />
    </div>
  );
}
