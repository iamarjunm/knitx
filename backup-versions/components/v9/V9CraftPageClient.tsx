"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, Scissors, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropStage {
  index: string;
  tag: string;
  title: string;
  summary: string;
  metric: string;
  imageUrl: string;
  imageAlt: string;
}

const DROP_STAGES: readonly DropStage[] = [
  {
    index: "01",
    tag: "WAITLIST ACCESS · VEILED RELEASE",
    title: "Mystery Teaser & Silhouettes",
    summary:
      "Every release begins behind monochrome teasers and fabric weight disclosures. Collectors inspect proportions, GSM density, and strict unit ceilings before the waitlist locks.",
    metric: "NO OPEN STORE · WAITLIST ONLY",
    imageUrl: "/images/look-mystery-veil.jpg",
    imageAlt: "Veiled mystery silhouette preview for KNITX Drop",
  },
  {
    index: "02",
    tag: "CREATOR CO-DESIGN · PAN-INDIA",
    title: "Community Design Ballot",
    summary:
      "Independent creators across India submit artwork and garment notes. Waitlist members vote directly on which pieces graduate into numbered small-batch runs or 1-of-1 commissions.",
    metric: "CREATOR NAME WOVEN ON NECK LABEL",
    imageUrl: "/images/look-batch-tee.jpg",
    imageAlt: "Community voted heavyweight tee garment study",
  },
  {
    index: "03",
    tag: "SINGLE MASTER PROTOTYPE",
    title: "Sample-First Prototyping",
    summary:
      "We cut and sew exactly one physical master sample per silhouette for editorial photography, puff-print curing, drape verification, and campaign reels—never speculative warehouse bulk.",
    metric: "1 SAMPLE CUT · 0% WAREHOUSE SURPLUS",
    imageUrl: "/images/atelier-daylight.jpg",
    imageAlt: "Daylight studio floor for KNITX sample-first prototyping",
  },
  {
    index: "04",
    tag: "MADE-TO-ORDER CUTTING",
    title: "Made-to-Order Vault Cut",
    summary:
      "Once the vault opens to called waitlist numbers, garments are cut strictly against confirmed claims: 3–4 numbered units per small-batch design and two 1-of-1 collector works.",
    metric: "3–4 UNITS + 1-OF-1S · SHIPPED PAN-INDIA",
    imageUrl: "/images/look-1of1-jacket.jpg",
    imageAlt: "Numbered 1-of-1 workwear jacket tailored after order confirmation",
  },
] as const;

const COMPARISON_LEDGER = [
  {
    metric: "Upfront Bulk Risk",
    traditional: "500–2,000 units manufactured blind before launch",
    knitx: "1 physical sample only; zero upfront bulk inventory",
  },
  {
    metric: "Batch Cap per Design",
    traditional: "Mass restocks & endless seasonal re-issues",
    knitx: "3–4 units + 1-of-1s (permanently retired after drop)",
  },
  {
    metric: "Unsold Deadstock",
    traditional: "25%–40% leftover stock discounted or liquidated",
    knitx: "0% deadstock — cut only after customer orders arrive",
  },
  {
    metric: "Fabric Density",
    traditional: "180–260 GSM commercial lightweight jersey",
    knitx: "420–540 GSM heavyweight architectural knits",
  },
  {
    metric: "Design Authorship",
    traditional: "Closed corporate trend forecasts",
    knitx: "Community-voted with creator name woven on neck label",
  },
  {
    metric: "Retail Model",
    traditional: "Always-open catalog & constant markdown sales",
    knitx: "Timed waitlist-gated vault drops across India",
  },
] as const;

const MATERIAL_SPECS = [
  {
    code: "SPEC 01",
    weight: "540 GSM",
    name: "Diagonal Heavy Fleece",
    detail:
      "Three-end diagonal knit fleece with structured drop-shoulder drape, double-needle felled seams, and dense 2×2 ribbed cuffs.",
    origin: "SMALL-BATCH HOODIES",
  },
  {
    code: "SPEC 02",
    weight: "450 GSM",
    name: "Combed Cotton Loopback",
    detail:
      "Unbrushed breathable loopback engineered for year-round Indian weather—substantial silhouette without trapped heat.",
    origin: "SIGNATURE PULLOVERS",
  },
  {
    code: "SPEC 03",
    weight: "420 GSM",
    name: "Dry-Hand Boxy Jersey",
    detail:
      "Compact open-end cotton spun thick so wide boxy tees hold clean architectural lines and absorb high-build puff prints cleanly.",
    origin: "HEAVY BOXY TEES",
  },
  {
    code: "SPEC 04",
    weight: "14 OZ",
    name: "Sanforized Duck & Twill",
    detail:
      "Pre-shrunk heavyweight utility weave reserved for 1-of-1 jackets with chain-stitch embroidery and burnished brass closures.",
    origin: "1-OF-1 COMMISSIONS",
  },
] as const;

export default function V9CraftPageClient() {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const activeStage = DROP_STAGES[activeStageIndex] || DROP_STAGES[0];

  return (
    <div className="min-h-screen bg-[#F7F5F0] pt-28 pb-24 text-[#111110]">
      <div className="mx-auto max-w-[1380px] px-5 sm:px-10 lg:px-14">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="pb-12"
        >
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#8E1C1C]" />
            <span className="font-mono text-[11px] font-medium tracking-[0.24em] text-[#9A7B4F] uppercase">
              SAMPLE-FIRST OPERATIONS
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <h1 className="font-poster text-5xl leading-[0.92] tracking-tight text-[#111110] uppercase sm:text-7xl lg:text-[6rem]">
                ZERO DEADSTOCK.
              </h1>
            </div>
            <div className="lg:col-span-5 lg:pb-2">
              <p className="font-sans text-base leading-relaxed text-[#6A655D] sm:text-lg">
                We only produce one physical sample for photoshoots and reels.
                Actual garments are cut only after customer orders arrive.
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 border-y border-[#DDD7CB] py-5 sm:grid-cols-3">
            <div className="flex items-baseline justify-between sm:justify-start sm:gap-3">
              <span className="font-poster text-2xl text-[#111110]">01</span>
              <span className="font-mono text-[11px] tracking-[0.18em] text-[#6A655D] uppercase">
                Physical Sample Per Design
              </span>
            </div>
            <div className="flex items-baseline justify-between border-t border-[#DDD7CB] pt-3 sm:justify-start sm:gap-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
              <span className="font-poster text-2xl text-[#8E1C1C]">0%</span>
              <span className="font-mono text-[11px] tracking-[0.18em] text-[#6A655D] uppercase">
                Unsold Warehouse Deadstock
              </span>
            </div>
            <div className="flex items-baseline justify-between border-t border-[#DDD7CB] pt-3 sm:justify-start sm:gap-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
              <span className="font-poster text-2xl text-[#9A7B4F]">
                420–540
              </span>
              <span className="font-mono text-[11px] tracking-[0.18em] text-[#6A655D] uppercase">
                GSM Heavyweight Fabrics · INDIA
              </span>
            </div>
          </div>
        </motion.section>

        {/* Full-Width Framed Studio Photograph */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          aria-label="KNITX Daylight Atelier"
          className="relative max-h-[520px] overflow-hidden rounded-2xl border border-[#DDD7CB] bg-[#ECE8DF]"
        >
          <img
            src="/images/atelier-daylight.jpg"
            alt="KNITX daylight garment studio cutting a single physical sample"
            className="h-[320px] w-full object-cover sm:h-[440px] lg:h-[520px]"
          />
          <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#DDD7CB] bg-white/92 px-4 py-3 backdrop-blur-md sm:inset-x-6 sm:bottom-6 sm:px-5">
            <div className="flex items-center gap-2.5">
              <Scissors className="h-3.5 w-3.5 text-[#8E1C1C]" />
              <span className="font-mono text-[10px] font-medium tracking-[0.2em] text-[#111110] uppercase">
                KNITX ATELIER · INDIA · SAMPLE-FIRST CUTTING TABLE
              </span>
            </div>
            <span className="font-mono text-[10px] tracking-[0.18em] text-[#9A7B4F] uppercase">
              CUT ONLY AFTER CLAIM
            </span>
          </div>
        </motion.section>

        {/* Interactive 4-Stage Drop Architecture */}
        <section
          aria-label="4-Stage Drop Architecture"
          className="mt-24 border-t border-[#DDD7CB] pt-16"
        >
          <div className="max-w-2xl">
            <span className="font-mono text-[11px] font-medium tracking-[0.22em] text-[#9A7B4F] uppercase">
              DROP ARCHITECTURE · 01 TO 04
            </span>
            <h2 className="mt-2 font-poster text-4xl tracking-tight text-[#111110] uppercase sm:text-5xl">
              HOW A DROP IS BUILT.
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
            {/* Left: Architectural Accordion */}
            <div className="divide-y divide-[#DDD7CB] overflow-hidden rounded-2xl border border-[#DDD7CB] bg-white lg:col-span-6">
              {DROP_STAGES.map((stage, idx) => {
                const isOpen = idx === activeStageIndex;
                return (
                  <div
                    key={stage.index}
                    className={cn(
                      "relative transition-colors duration-300",
                      isOpen ? "bg-[#F7F5F0]/70" : "bg-white hover:bg-[#F7F5F0]/40"
                    )}
                  >
                    {isOpen && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 w-[3px] bg-[#8E1C1C]"
                      />
                    )}
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setActiveStageIndex(idx)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 px-6 py-6 text-left focus:outline-none sm:px-7"
                    >
                      <div className="flex items-baseline gap-4">
                        <span
                          className={cn(
                            "font-mono text-xs font-semibold tracking-[0.2em] transition-colors",
                            isOpen ? "text-[#8E1C1C]" : "text-[#9A7B4F]"
                          )}
                        >
                          {stage.index}
                        </span>
                        <div>
                          <p className="font-mono text-[10px] tracking-[0.18em] text-[#6A655D] uppercase">
                            {stage.tag}
                          </p>
                          <h3 className="mt-1 font-poster text-2xl tracking-wide text-[#111110] uppercase sm:text-[1.7rem]">
                            {stage.title}
                          </h3>
                        </div>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-[#6A655D] transition-transform duration-300",
                          isOpen && "rotate-180 text-[#8E1C1C]"
                        )}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            duration: 0.3,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 pl-14 sm:px-7 sm:pl-16">
                            <p className="font-sans text-sm leading-relaxed text-[#6A655D]">
                              {stage.summary}
                            </p>
                            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#DDD7CB] bg-white px-3.5 py-1.5 font-mono text-[10px] font-medium tracking-[0.16em] text-[#111110] uppercase">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#8E1C1C]" />
                              <span>{stage.metric}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Right: Silky Crossfading Photography */}
            <div className="lg:sticky lg:top-28 lg:col-span-6">
              <div className="rounded-2xl border border-[#DDD7CB] bg-white p-3.5 shadow-[0_24px_60px_-36px_rgba(17,17,16,0.12)]">
                <div className="relative aspect-[4/4] w-full overflow-hidden rounded-xl bg-[#ECE8DF]">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeStage.imageUrl}
                      src={activeStage.imageUrl}
                      alt={activeStage.imageAlt}
                      initial={{ opacity: 0, scale: 1.03 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.99 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full w-full object-cover"
                    />
                  </AnimatePresence>

                  <div className="absolute top-4 left-4 rounded-full border border-[#DDD7CB] bg-white/95 px-3.5 py-1 font-mono text-[10px] font-semibold tracking-[0.2em] text-[#8E1C1C] uppercase backdrop-blur-sm">
                    STAGE {activeStage.index}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-4 pb-1">
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.18em] text-[#9A7B4F] uppercase">
                      {activeStage.tag}
                    </p>
                    <p className="mt-0.5 font-poster text-xl tracking-wide text-[#111110] uppercase">
                      {activeStage.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {DROP_STAGES.map((stage, idx) => (
                      <button
                        key={stage.index}
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setActiveStageIndex(idx)}
                        aria-label={`View stage ${stage.index}: ${stage.title}`}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          idx === activeStageIndex
                            ? "w-7 bg-[#8E1C1C]"
                            : "w-2.5 bg-[#DDD7CB] hover:bg-[#9A7B4F]"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Traditional Brand vs. KNITX Comparison Ledger */}
        <section
          aria-label="Traditional Brand versus KNITX Comparison Ledger"
          className="mt-24 border-t border-[#DDD7CB] pt-16"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="font-mono text-[11px] font-medium tracking-[0.22em] text-[#9A7B4F] uppercase">
                OPERATIONAL LEDGER
              </span>
              <h2 className="mt-2 font-poster text-4xl tracking-tight text-[#111110] uppercase sm:text-5xl">
                TRADITIONAL BRAND VS. KNITX.
              </h2>
            </div>
            <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-[#6A655D] uppercase">
              <ShieldCheck className="h-3.5 w-3.5 text-[#8E1C1C]" />
              <span>VERIFIED MADE-TO-ORDER MODEL</span>
            </span>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-[#DDD7CB] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#DDD7CB] bg-[#ECE8DF]/75">
                    <th className="w-[26%] px-6 py-4 font-mono text-[10px] font-semibold tracking-[0.22em] text-[#6A655D] uppercase">
                      Standard
                    </th>
                    <th className="w-[37%] border-l border-[#DDD7CB] px-6 py-4 font-mono text-[10px] font-semibold tracking-[0.22em] text-[#6A655D] uppercase">
                      Traditional Brand
                    </th>
                    <th className="w-[37%] border-l border-[#DDD7CB] bg-[#8E1C1C]/[0.04] px-6 py-4 font-mono text-[10px] font-semibold tracking-[0.22em] text-[#8E1C1C] uppercase">
                      KNITX Sample-First
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDD7CB]">
                  {COMPARISON_LEDGER.map((row) => (
                    <tr
                      key={row.metric}
                      className="transition-colors hover:bg-[#F7F5F0]/60"
                    >
                      <td className="px-6 py-5 font-sans text-sm font-semibold text-[#111110]">
                        {row.metric}
                      </td>
                      <td className="border-l border-[#DDD7CB] px-6 py-5 font-sans text-sm text-[#6A655D]">
                        {row.traditional}
                      </td>
                      <td className="border-l border-[#DDD7CB] bg-[#F7F5F0]/55 px-6 py-5 font-sans text-sm font-medium text-[#111110]">
                        <span className="inline-flex items-start gap-2.5">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8E1C1C]" />
                          <span>{row.knitx}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 4 Heavyweight Material Spec Cards */}
        <section
          aria-label="Heavyweight Material Specifications"
          className="mt-24 border-t border-[#DDD7CB] pt-16"
        >
          <div className="max-w-2xl">
            <span className="font-mono text-[11px] font-medium tracking-[0.22em] text-[#9A7B4F] uppercase">
              TEXTILE SPECIFICATIONS · 420–540 GSM
            </span>
            <h2 className="mt-2 font-poster text-4xl tracking-tight text-[#111110] uppercase sm:text-5xl">
              HEAVYWEIGHT MATERIAL ARCHIVE.
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {MATERIAL_SPECS.map((spec) => (
              <article
                key={spec.code}
                className="flex flex-col justify-between rounded-2xl border border-[#DDD7CB] bg-white p-6 transition-colors duration-300 hover:border-[#9A7B4F]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-semibold tracking-[0.2em] text-[#9A7B4F] uppercase">
                      {spec.code}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#8E1C1C]" />
                  </div>

                  <p className="mt-5 font-poster text-4xl leading-none tracking-tight text-[#111110] uppercase">
                    {spec.weight}
                  </p>
                  <h3 className="mt-2.5 font-sans text-sm font-semibold tracking-[0.04em] text-[#111110] uppercase">
                    {spec.name}
                  </h3>
                  <p className="mt-3 font-sans text-xs leading-relaxed text-[#6A655D]">
                    {spec.detail}
                  </p>
                </div>

                <div className="mt-6 border-t border-[#DDD7CB] pt-3.5">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-[#6A655D] uppercase">
                    {spec.origin}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Bottom CTAs */}
        <section
          aria-label="Waitlist and Vault Access"
          className="mt-20 rounded-2xl border border-[#DDD7CB] bg-[#ECE8DF] p-8 sm:p-12"
        >
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <span className="font-mono text-[10px] font-medium tracking-[0.22em] text-[#9A7B4F] uppercase">
                DROP 01 · PAN-INDIA VAULT
              </span>
              <h2 className="mt-2 font-poster text-4xl leading-[0.96] tracking-tight text-[#111110] uppercase sm:text-5xl">
                CUT ONLY WHEN YOUR NUMBER IS CALLED.
              </h2>
              <p className="mt-3 font-sans text-sm leading-relaxed text-[#6A655D]">
                Reserve your queue number for Drop 01 or step inside the active
                collection vault to inspect remaining numbered slots.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3.5">
              <Link
                href="/v9#waitlist"
                className="inline-flex items-center gap-2.5 rounded-xl bg-[#8E1C1C] px-6 py-4 font-mono text-xs font-semibold tracking-[0.2em] text-white uppercase transition-colors hover:bg-[#731515]"
              >
                <span>Join Drop 01 Waitlist</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/v9/vault"
                className="inline-flex items-center gap-2.5 rounded-xl border border-[#111110] bg-white px-6 py-4 font-mono text-xs font-semibold tracking-[0.2em] text-[#111110] uppercase transition-colors hover:bg-[#111110] hover:text-white"
              >
                <span>Enter The Vault</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
