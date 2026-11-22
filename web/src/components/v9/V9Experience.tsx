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
import V9Navbar from "./V9Navbar";
import V9Hero from "./V9Hero";
import V9GallerySection, { V9GarmentDrawer } from "./V9GallerySection";
import V9VaultAndFolio from "./V9VaultAndFolio";

export interface V9ExperienceProps {
  drop: DropCampaign;
  products: Product[];
  candidates: VoteCandidate[];
  submissions: CreatorSubmissionItem[];
}

export default function V9Experience({
  drop,
  products,
  candidates,
  submissions,
}: V9ExperienceProps) {
  const [inspectedProduct, setInspectedProduct] = useState<Product | null>(
    null
  );

  return (
    <div className="min-h-screen bg-plaster text-[#121110] selection:bg-[#D9381E] selection:text-white">
      <V9Navbar />

      <V9Hero drop={drop} />

      <V9GallerySection
        products={products}
        onInspectProduct={setInspectedProduct}
      />

      <V9VaultAndFolio
        drop={drop}
        initialCandidates={candidates}
        initialSubmissions={submissions}
      />

      {/* Refined Serene V9 Museum Footer */}
      <footer className="border-t border-champagne bg-white pb-24 pt-20 text-[#121110]">
        <div className="mx-auto max-w-[1380px] px-5 sm:px-10 lg:px-14">
          {/* Top Provenance Rail */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-champagne pb-6 font-mono text-[10px] uppercase tracking-[0.24em] text-[#736E66]">
            <span className="inline-flex items-center gap-2.5 text-[#121110]">
              <span className="h-2 w-2 rounded-full bg-[#D9381E]" />
              <span>KNITX GALLERY · DROP {drop.dropNumber}</span>
            </span>
            <span>SAMPLE-FIRST · COMMUNITY CURATED · MADE IN INDIA</span>
          </div>

          {/* Uncluttered 4-Column Museum Index */}
          <div className="grid grid-cols-1 gap-12 py-14 sm:grid-cols-2 lg:grid-cols-12">
            {/* Brand Manifesto */}
            <div className="lg:col-span-5">
              <p className="max-w-md font-poster text-3xl uppercase leading-[1.02] tracking-[0.01em] text-[#121110] sm:text-4xl">
                CUT STRICTLY AFTER CLAIM{" "}
                <span className="text-[#D9381E]">· NEVER RESTOCKED.</span>
              </p>
              <p className="mt-4 max-w-sm font-sans text-sm leading-relaxed text-[#736E66]">
                Co-created with independent Indian designers, curated by
                community token ballots, and milled in heavyweight cotton with
                zero unsold inventory.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 font-mono text-[9.5px] uppercase tracking-[0.18em]">
                <span className="rounded-md border border-champagne bg-travertine px-3 py-1 font-medium text-[#D9381E]">
                  0.0% DEADSTOCK
                </span>
                <span className="rounded-md border border-champagne bg-travertine px-3 py-1 text-[#736E66]">
                  PAN-INDIA INSURED DISPATCH
                </span>
              </div>
            </div>

            {/* Gallery Rooms */}
            <div className="lg:col-span-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#736E66]">
                GALLERY
              </p>
              <ul className="mt-4 space-y-2.5 font-sans text-sm text-[#121110]/85">
                <li>
                  <a
                    href="#v9-hero"
                    className="transition-colors hover:text-[#D9381E]"
                  >
                    01 · Drop {drop.dropNumber}
                  </a>
                </li>
                <li>
                  <a
                    href="#v9-gallery"
                    className="transition-colors hover:text-[#D9381E]"
                  >
                    02 · Collection Floor
                  </a>
                </li>
                <li>
                  <a
                    href="#v9-envelope"
                    className="transition-colors hover:text-[#D9381E]"
                  >
                    03 · Private Admission
                  </a>
                </li>
                <li>
                  <a
                    href="#v9-folio"
                    className="transition-colors hover:text-[#D9381E]"
                  >
                    04 · Community &amp; Craft
                  </a>
                </li>
              </ul>
            </div>

            {/* Direct Spaces */}
            <div className="lg:col-span-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#736E66]">
                ARCHIVE SPACES
              </p>
              <ul className="mt-4 space-y-2.5 font-sans text-sm text-[#121110]/85">
                <li>
                  <Link
                    href="/vault"
                    className="inline-flex items-center gap-1 transition-colors hover:text-[#D9381E]"
                  >
                    <span>Private Vault</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/vote"
                    className="inline-flex items-center gap-1 transition-colors hover:text-[#D9381E]"
                  >
                    <span>Drop 02 Ballot</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/submit"
                    className="inline-flex items-center gap-1 transition-colors hover:text-[#D9381E]"
                  >
                    <span>Submit a Design</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/atelier"
                    className="inline-flex items-center gap-1 transition-colors hover:text-[#D9381E]"
                  >
                    <span>Sample-First Atelier</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Edition Standards */}
            <div className="lg:col-span-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#736E66]">
                EDITION STANDARDS
              </p>
              <div className="mt-4 space-y-2.5 rounded-xl border border-champagne bg-travertine/55 p-4 font-mono text-[10px] uppercase tracking-[0.14em]">
                <p className="flex items-center justify-between border-b border-champagne/80 pb-2">
                  <span className="text-[#736E66]">SMALL-BATCH</span>
                  <span className="text-[#121110]">3–4 UNITS · ₹2.5K–₹4K</span>
                </p>
                <p className="flex items-center justify-between border-b border-champagne/80 pb-2">
                  <span className="text-[#736E66]">ONE-OF-ONE</span>
                  <span className="font-semibold text-[#D9381E]">
                    1 UNIT · ₹5K–₹10K+
                  </span>
                </p>
                <p className="flex items-center justify-between border-b border-champagne/80 pb-2">
                  <span className="text-[#736E66]">PRE-LAUNCH</span>
                  <span className="text-[#121110]">10 SAMPLES ONLY</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-[#736E66]">PROVENANCE</span>
                  <span className="text-[#121110]">MADE IN INDIA</span>
                </p>
              </div>
            </div>
          </div>

          {/* Monumental Anton Poster Wordmark */}
          <div className="flex flex-col items-start justify-between gap-4 border-t border-champagne pt-10 sm:flex-row sm:items-end">
            <h2 className="font-poster text-[18vw] uppercase leading-[0.82] tracking-[0.01em] text-[#121110] sm:text-[12vw] lg:text-[9.5rem]">
              KNITX<span className="text-[#D9381E]">.</span>
            </h2>

            <div className="pb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[#736E66] sm:text-right">
              <p className="font-medium text-[#121110]">
                KNITX INDIA · EDITION 09
              </p>
              <p className="mt-1">
                BY INVITATION · HAND-NUMBERED · ZERO RESTOCKS
              </p>
            </div>
          </div>
        </div>
      </footer>

      <V9GarmentDrawer
        product={inspectedProduct}
        onClose={() => setInspectedProduct(null)}
      />
    </div>
  );
}
