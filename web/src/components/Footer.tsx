"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  if (
    pathname.startsWith("/v2") ||
    pathname.startsWith("/v3") ||
    pathname.startsWith("/v4") ||
    pathname.startsWith("/v5") ||
    pathname.startsWith("/v6") ||
    pathname.startsWith("/v7")
  ) {
    return null;
  }
  return (
    <footer className="border-t-2 border-ink bg-surface text-ink">
      {/* Kinetic Closing Tape */}
      <div className="overflow-hidden border-b-2 border-ink bg-ink py-3 text-paper">
        <div className="animate-tape-left flex items-center gap-8 font-mono text-xs font-bold uppercase tracking-[0.25em]">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="flex shrink-0 items-center gap-8">
              <span>KNITX® INDIA</span>
              <span className="text-orange">✦</span>
              <span>3–4 UNITS SMALL BATCH</span>
              <span className="text-orange">✦</span>
              <span>1-OF-1 COLLECTOR ARCHIVE</span>
              <span className="text-orange">✦</span>
              <span>SAMPLE-FIRST CUT &amp; SEW</span>
              <span className="text-orange">✦</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-8">
        <div className="grid grid-cols-2 gap-8 pb-12 md:grid-cols-4">
          <div>
            <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-widest text-orange">
              01 // DROP
            </p>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link href="/" className="hover:text-orange hover:underline">
                  Drop 01 Teaser
                </Link>
              </li>
              <li>
                <Link href="/vault" className="hover:text-orange hover:underline">
                  Private Vault
                </Link>
              </li>
              <li>
                <Link href="/#waitlist" className="hover:text-orange hover:underline">
                  Join The Queue
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-widest text-orange">
              02 // COMMUNITY
            </p>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link href="/vote" className="hover:text-orange hover:underline">
                  Vote Drop 02
                </Link>
              </li>
              <li>
                <Link href="/submit" className="hover:text-orange hover:underline">
                  Submit a Design
                </Link>
              </li>
              <li>
                <Link href="/atelier" className="hover:text-orange hover:underline">
                  How Sample-First Works
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-widest text-orange">
              03 // NUMBERS
            </p>
            <ul className="space-y-2 font-mono text-xs text-muted">
              <li>SMALL-BATCH: 3–4 UNITS · ₹2.5K–₹4K</li>
              <li>ONE-OF-ONE: 1 UNIT · ₹5K–₹10K+</li>
              <li>DEADSTOCK: 0.0%</li>
            </ul>
          </div>

          <div>
            <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-widest text-orange">
              04 // SOCIAL
            </p>
            <div className="flex flex-col gap-2.5 text-sm font-bold">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-orange"
              >
                INSTAGRAM <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <Link href="/submit" className="inline-flex items-center gap-1 hover:text-orange">
                CREATOR PROGRAM <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Monumental Edge-to-Edge Poster Wordmark */}
        <div className="border-t-2 border-ink pt-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <h2 className="font-poster text-[20vw] leading-[0.82] tracking-tight text-ink sm:text-[14vw] lg:text-[12rem]">
              KNITX<span className="text-orange">.</span>
            </h2>
            <div className="pb-2 font-mono text-[11px] uppercase tracking-widest text-muted sm:text-right">
              <p className="font-bold text-ink">MADE IN INDIA · NO RESTOCKS</p>
              <p className="mt-1">WAITLIST ONLY · COMMUNITY VOTED · ZERO DEADSTOCK</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
