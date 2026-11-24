"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Layers,
  Recycle,
  Scale,
  Scissors,
  Sparkles,
} from "lucide-react";
import { cn, formatInr } from "@/lib/utils";

const DESIGN_COUNT = 10;
const TRADITIONAL_UNIT_COST_INR = 850;
const DEADSTOCK_RATE = 0.35;
const BATCH_PRESETS = [100, 500, 1000, 2000] as const;

export default function V3SampleCalculator() {
  const [mounted, setMounted] = useState(false);
  const [unitsPerDesign, setUnitsPerDesign] = useState<number>(500);

  useEffect(() => {
    setMounted(true);
  }, []);

  const metrics = useMemo(() => {
    const totalTradUnits = DESIGN_COUNT * unitsPerDesign;
    const upfrontRiskInr = totalTradUnits * TRADITIONAL_UNIT_COST_INR;
    const upfrontLakhs = upfrontRiskInr / 100000;
    const deadstockUnits = Math.round(totalTradUnits * DEADSTOCK_RATE);
    const deadstockLossInr = deadstockUnits * TRADITIONAL_UNIT_COST_INR;
    const deadstockLakhs = deadstockLossInr / 100000;
    const sliderPercent = ((unitsPerDesign - 100) / (2000 - 100)) * 100;

    return {
      totalTradUnits,
      upfrontRiskInr,
      upfrontLakhs,
      deadstockUnits,
      deadstockLossInr,
      deadstockLakhs,
      sliderPercent,
    };
  }, [unitsPerDesign]);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-IN").format(value);

  return (
    <section
      id="calculator"
      className="relative overflow-hidden border-t border-hunter/15 bg-alabaster py-24 text-espresso"
    >
      <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
        {/* Header Row */}
        <div className="mb-12 flex flex-col justify-between gap-6 border-b border-hunter/15 pb-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-hunter/20 bg-white px-3.5 py-1.5">
              <span className="h-2 w-2 rounded-full bg-hunter" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-hunter">
                MOD-06 · SAMPLE-FIRST ECONOMICS · ZERO DEADSTOCK
              </span>
            </div>

            <h2 className="mt-5 font-editorial text-5xl leading-[0.95] tracking-[-0.02em] text-espresso sm:text-6xl lg:text-[4.25rem]">
              Why we never{" "}
              <span className="italic text-hunter">overproduce.</span>
            </h2>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-espresso/75 sm:text-lg">
              Traditional labels cut thousands of speculative units before
              launch—locking lakhs into unsold racks and compromising fabric
              weight. Slide the batch size to compare our sample-first ledger.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-hunter/15 bg-white px-4 py-3">
            <Scale className="h-5 w-5 text-hunter" />
            <div className="font-mono text-[10px] uppercase tracking-[0.18em]">
              <p className="text-espresso/55">DROP BENCHMARK</p>
              <p className="font-bold text-hunter">
                10 DESIGNS · MADE IN INDIA
              </p>
            </div>
          </div>
        </div>

        {/* Main 12-Col Split: Interactive Comparison Deck (7) + Studio Atelier Plate (5) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
          {/* LEFT 7 COLUMNS: SLIDER + SIDE-BY-SIDE COMPARISON */}
          <div className="flex flex-col gap-5 lg:col-span-7">
            {/* Interactive Batch Size Control Card */}
            <div className="rounded-2xl border border-hunter/20 bg-white p-5 sm:p-6 shadow-[0_14px_34px_-22px_rgba(20,54,40,0.2)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label
                  htmlFor="v3-batch-slider"
                  className="font-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-espresso"
                >
                  DROP SIZE: 10 DESIGNS ×{" "}
                  <span className="rounded bg-chartreuse px-2 py-0.5 text-espresso">
                    {formatNumber(unitsPerDesign)} UNITS
                  </span>{" "}
                  TRADITIONAL BATCH
                </label>

                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-hunter">
                  {formatNumber(metrics.totalTradUnits)} TOTAL GARMENTS PRE-CUT
                </span>
              </div>

              {/* Tactile Range Slider */}
              <div className="relative mt-6 py-2">
                <div className="h-3 w-full overflow-hidden rounded-full border border-hunter/20 bg-chrome">
                  <div
                    className="h-full rounded-full bg-hunter transition-all duration-150"
                    style={{ width: `${metrics.sliderPercent}%` }}
                  />
                </div>
                <input
                  id="v3-batch-slider"
                  type="range"
                  min={100}
                  max={2000}
                  step={50}
                  value={unitsPerDesign}
                  suppressHydrationWarning
                  aria-label="Traditional brand units per design"
                  onChange={(e) => setUnitsPerDesign(Number(e.target.value))}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 h-6 w-4 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-hunter bg-chartreuse shadow-[0_3px_8px_rgba(20,54,40,0.28)] transition-all duration-150"
                  style={{ left: `${metrics.sliderPercent}%` }}
                />
              </div>

              {/* Preset Hardware Buttons */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-espresso/55">
                  QUICK PRESETS
                </span>
                <div className="flex flex-wrap gap-2">
                  {BATCH_PRESETS.map((preset) => {
                    const active = unitsPerDesign === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setUnitsPerDesign(preset)}
                        className={cn(
                          "rounded-lg border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] transition-all",
                          active
                            ? "border-hunter bg-hunter text-chartreuse"
                            : "border-hunter/15 bg-alabaster text-espresso/75 hover:border-hunter/40 hover:text-espresso"
                        )}
                      >
                        {formatNumber(preset)} / DESIGN
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live Side-by-Side Comparison Cards */}
            <div className="grid flex-1 grid-cols-1 gap-5 md:grid-cols-2">
              {/* CARD A: TRADITIONAL BRAND */}
              <div className="flex flex-col justify-between rounded-2xl border border-hunter/15 bg-chrome/60 p-5 sm:p-6">
                <div>
                  <div className="flex items-center justify-between border-b border-espresso/10 pb-3.5">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-espresso/75">
                      TRADITIONAL BRAND
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-archive-red/25 bg-white px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-archive-red">
                      <AlertTriangle className="h-3 w-3" />
                      BULK RISK
                    </span>
                  </div>

                  {/* Upfront Inventory Risk */}
                  <div className="mt-5">
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-espresso/60">
                      UPFRONT INVENTORY RISK
                    </p>
                    <motion.p
                      key={metrics.upfrontRiskInr}
                      initial={mounted ? { opacity: 0.5, y: 4 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-1 font-syne text-3xl font-extrabold tracking-[-0.03em] text-espresso sm:text-[2.1rem]"
                    >
                      ₹{metrics.upfrontLakhs.toFixed(1)} Lakhs
                    </motion.p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-espresso/60">
                      LOCKED UPFRONT · {formatInr(metrics.upfrontRiskInr)}
                    </p>
                  </div>

                  {/* Estimated Unsold Deadstock */}
                  <div className="mt-5 rounded-xl border border-archive-red/20 bg-white/85 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-espresso/65">
                        UNSOLD DEADSTOCK (35%)
                      </span>
                      <span className="font-mono text-xs font-bold text-archive-red">
                        {formatNumber(metrics.deadstockUnits)} PCS
                      </span>
                    </div>

                    <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-chrome">
                      <div className="h-full w-[35%] rounded-full bg-archive-red" />
                    </div>

                    <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-archive-red">
                      35% WASTED / DUMPED · ₹{metrics.deadstockLakhs.toFixed(1)}{" "}
                      LAKHS BURNED
                    </p>
                  </div>
                </div>

                {/* Low Per-Piece Fabric Budget */}
                <div className="mt-5 border-t border-espresso/10 pt-4">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-espresso/55">
                    PER-PIECE FABRIC BUDGET
                  </p>
                  <p className="mt-1 text-sm font-semibold text-espresso/80">
                    Squeezed into thin 220–260 GSM blanks to cushion markdowns
                    &amp; warehouse deadstock.
                  </p>
                </div>
              </div>

              {/* CARD B: KNITX SAMPLE-FIRST (HUNTER GREEN + CHARTREUSE) */}
              <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-hunter bg-hunter p-5 text-alabaster shadow-[0_20px_48px_-24px_rgba(20,54,40,0.65)] sm:p-6">
                <div>
                  <div className="flex items-center justify-between border-b border-alabaster/15 pb-3.5">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-chartreuse">
                      KNITX SAMPLE-FIRST
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-chartreuse px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-espresso">
                      <CheckCircle2 className="h-3 w-3" />
                      VERIFIED
                    </span>
                  </div>

                  {/* Pre-Launch Run */}
                  <div className="mt-5">
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-alabaster/65">
                      PRE-LAUNCH PRODUCTION
                    </p>
                    <p className="mt-1 font-syne text-3xl font-extrabold tracking-[-0.03em] text-chartreuse sm:text-[2.1rem]">
                      10 SAMPLES ONLY
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-alabaster/80">
                      1 PER DESIGN FOR SHOOTS &amp; REELS
                    </p>
                  </div>

                  {/* Post-Order Precision & 0% Deadstock */}
                  <div className="mt-5 space-y-2.5 rounded-xl border border-alabaster/15 bg-white/5 p-3.5">
                    <div className="flex items-start gap-2.5">
                      <Scissors className="mt-0.5 h-4 w-4 shrink-0 text-chartreuse" />
                      <p className="text-xs leading-relaxed text-alabaster/90">
                        <strong className="font-semibold text-white">
                          3–4 UNITS
                        </strong>{" "}
                        small-batch +{" "}
                        <strong className="font-semibold text-white">
                          1-OF-1
                        </strong>{" "}
                        cut strictly AFTER customer orders come in.
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-alabaster/10 pt-2.5">
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-alabaster/70">
                        UNSOLD DEADSTOCK
                      </span>
                      <span className="rounded bg-chartreuse px-2 py-0.5 font-mono text-xs font-extrabold tracking-[0.12em] text-espresso">
                        0% DEADSTOCK
                      </span>
                    </div>
                  </div>
                </div>

                {/* 100% Budget Allocation */}
                <div className="mt-5 border-t border-alabaster/15 pt-4">
                  <div className="flex items-center gap-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-chartreuse">
                    <Sparkles className="h-3.5 w-3.5" />
                    CRAFT ALLOCATION
                  </div>
                  <p className="mt-1.5 font-mono text-xs font-bold uppercase leading-relaxed tracking-[0.08em] text-white">
                    100% OF BUDGET IN 450+ GSM FABRIC &amp; HANDCRAFT
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Impact Telemetry Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hunter/20 bg-white px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Recycle className="h-4 w-4 text-hunter" />
                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-espresso">
                  SAVED FROM LANDFILL PER DROP:{" "}
                  <span className="rounded bg-chartreuse px-1.5 py-0.5 font-bold text-espresso">
                    {formatNumber(metrics.deadstockUnits)} GARMENTS
                  </span>
                </span>
              </div>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-hunter">
                CUT ON DEMAND · ZERO DISCOUNT BINS
              </span>
            </div>
          </div>

          {/* RIGHT 5 COLUMNS: FRAMED DAYLIGHT ATELIER PLATE */}
          <div className="flex flex-col justify-between rounded-2xl border border-hunter/20 bg-white p-3.5 sm:p-4 lg:col-span-5">
            <div className="relative aspect-[4/4.4] w-full flex-1 overflow-hidden rounded-xl border border-hunter/15 bg-chrome">
              <Image
                src="/images/atelier-daylight.jpg"
                alt="KNITX daylight pattern cutting and sample-first studio"
                fill
                sizes="(max-width: 1024px) 100vw, 480px"
                className="object-cover"
              />

              {/* Top Crisp Studio Stamp */}
              <div className="absolute left-3.5 top-3.5 flex items-center gap-2 rounded-full border border-hunter/20 bg-alabaster/95 px-3 py-1.5 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-chartreuse ring-2 ring-hunter/30" />
                <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-hunter">
                  SAMPLE STUDIO · INDIA
                </span>
              </div>

              {/* Bottom Glass Spec Overlay */}
              <div className="absolute inset-x-3.5 bottom-3.5 rounded-xl border border-alabaster/30 bg-hunter/92 p-3.5 text-alabaster backdrop-blur-md">
                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-chartreuse">
                  <span>ATELIER PROTOCOL</span>
                  <span>0.0% OVERRUN</span>
                </div>
                <p className="mt-1.5 font-editorial text-xl leading-snug text-white">
                  &ldquo;Ten samples cut for daylight lenses. Every numbered
                  unit cut only for its owner.&rdquo;
                </p>
              </div>
            </div>

            {/* 3-Step Micro Workflow Footer */}
            <div className="mt-3.5 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-hunter/15 bg-alabaster/80 p-2.5">
                <span className="font-mono text-[9px] font-bold text-hunter">
                  01
                </span>
                <p className="mt-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-espresso">
                  10 SAMPLES
                </p>
              </div>
              <div className="rounded-xl border border-hunter/15 bg-alabaster/80 p-2.5">
                <span className="font-mono text-[9px] font-bold text-hunter">
                  02
                </span>
                <p className="mt-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-espresso">
                  VAULT CLAIMS
                </p>
              </div>
              <div className="rounded-xl border border-hunter/25 bg-hunter p-2.5 text-alabaster">
                <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold text-chartreuse">
                  <Layers className="h-2.5 w-2.5" /> 03
                </span>
                <p className="mt-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-white">
                  EXACT CUTS
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
