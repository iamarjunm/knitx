"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const DIRECTORY_LINKS = [
  { label: "Drop 01 Flagship", href: "/v9", code: "01" },
  { label: "The Vault (All 10 Pieces)", href: "/v9/vault", code: "02" },
  { label: "Vote Drop 02", href: "/v9/vote", code: "03" },
  { label: "Submit a Design", href: "/v9/submit", code: "04" },
  { label: "Sample-First Craft", href: "/v9/craft", code: "05" },
] as const;

const EDITION_STANDARDS = [
  {
    label: "Small-Batch 3–4",
    detail: "₹2,500–₹4,000",
    accent: false,
  },
  {
    label: "One-of-One 1/1",
    detail: "₹5,000–₹10,000+",
    accent: true,
  },
  {
    label: "0% Deadstock",
    detail: "Cut & Sewn After Order",
    accent: false,
  },
  {
    label: "Pattern Retirement",
    detail: "Permanent Archive Seal",
    accent: false,
  },
] as const;

export default function V9Footer() {
  return (
    <footer className="w-full border-t border-[#DDD7CB] bg-[#ECE8DF] pt-16 pb-24 text-[#111110]">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        {/* 4-Column Flagship Directory */}
        <div className="grid grid-cols-1 gap-10 border-b border-[#DDD7CB] pb-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Column 1: House Manifesto */}
          <div className="space-y-4">
            <p className="font-mono text-[10px] tracking-[0.24em] text-[#8E1C1C] uppercase">
              THE HOUSE · INDIA
            </p>
            <p className="max-w-xs font-sans text-sm leading-relaxed text-[#6A655D]">
              Architectural streetwear issued in numbered drops of ten
              silhouettes. One studio sample for documentation. Zero warehouse
              surplus. Dispatched pan-India.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#DDD7CB] bg-[#F7F5F0] px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-[#111110] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9A7B4F]" />
              <span>DROP 01 · EDITION OF TEN</span>
            </div>
          </div>

          {/* Column 2: Flagship Routes */}
          <div>
            <p className="font-mono text-[10px] tracking-[0.24em] text-[#6A655D] uppercase">
              FLAGSHIP DIRECTORY
            </p>
            <ul className="mt-4 space-y-3">
              {DIRECTORY_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group inline-flex items-center gap-3 font-sans text-sm font-medium text-[#111110] transition-colors duration-200 hover:text-[#8E1C1C]"
                  >
                    <span className="font-mono text-[10px] tracking-[0.16em] text-[#6A655D] transition-colors group-hover:text-[#8E1C1C]">
                      {item.code}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Edition Standards */}
          <div>
            <p className="font-mono text-[10px] tracking-[0.24em] text-[#6A655D] uppercase">
              EDITION STANDARDS
            </p>
            <ul className="mt-4 space-y-3">
              {EDITION_STANDARDS.map((spec) => (
                <li
                  key={spec.label}
                  className="flex flex-col border-b border-[#DDD7CB]/70 pb-2.5 last:border-b-0 last:pb-0"
                >
                  <span className="flex items-center gap-2 font-sans text-sm font-medium text-[#111110]">
                    <span>{spec.label}</span>
                    {spec.accent && (
                      <span className="rounded-sm bg-[#9A7B4F]/15 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.14em] text-[#9A7B4F] uppercase">
                        COLLECTOR
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.12em] text-[#6A655D]">
                    {spec.detail}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Private Access & Dispatch */}
          <div className="space-y-4">
            <p className="font-mono text-[10px] tracking-[0.24em] text-[#6A655D] uppercase">
              PRIVATE ADMISSION
            </p>
            <p className="font-sans text-sm leading-relaxed text-[#6A655D]">
              Access is released sequentially to waitlisted collectors. Reserve
              a ledger spot or unlock the vault with your invitation key.
            </p>
            <div className="flex flex-col gap-2.5 pt-1">
              <Link
                href="/v9#waitlist"
                className="group inline-flex items-center justify-between rounded-xl border border-[#DDD7CB] bg-[#F7F5F0] px-4 py-3 font-mono text-[11px] font-medium tracking-[0.16em] text-[#111110] uppercase transition-colors duration-200 hover:border-[#8E1C1C] hover:text-[#8E1C1C]"
              >
                <span>CLAIM QUEUE NUMBER</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                href="/v9/vault"
                className="group inline-flex items-center justify-between rounded-xl bg-[#111110] px-4 py-3 font-mono text-[11px] font-medium tracking-[0.16em] text-[#F7F5F0] uppercase transition-colors duration-200 hover:bg-[#8E1C1C]"
              >
                <span>ENTER THE VAULT</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Oversized Monumental Wordmark + Quiet Legal Strip */}
        <div className="pt-12 sm:pt-14">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <Link
              href="/v9"
              aria-label="Back to KNITX Flagship Home"
              className="inline-flex items-baseline select-none focus:outline-none"
            >
              <span className="font-poster text-[22vw] leading-[0.82] tracking-[0.02em] text-[#111110] uppercase sm:text-[15vw] lg:text-[11.5rem]">
                KNITX
              </span>
              <span className="font-poster text-[22vw] leading-[0.82] text-[#8E1C1C] sm:text-[15vw] lg:text-[11.5rem]">
                .
              </span>
            </Link>

            <div className="flex flex-col items-start gap-2 pb-1 lg:items-end">
              <p className="font-mono text-[10px] tracking-[0.22em] text-[#6A655D] uppercase">
                MADE IN INDIA · SMALL-BATCH LUXURY STREETWEAR
              </p>
              <p className="font-mono text-[10px] tracking-[0.18em] text-[#6A655D]/80 uppercase">
                © 2026 KNITX ARCHIVE · ALL RIGHTS RESERVED
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
