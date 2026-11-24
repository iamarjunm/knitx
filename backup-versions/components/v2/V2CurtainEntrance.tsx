"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const STORAGE_KEY = "knitx_v2_entered";
const COUNT_DURATION_MS = 1020;
const HOLD_AT_FULL_MS = 120;
const SPLIT_DURATION_S = 0.72;
const SPLIT_EASE: [number, number, number, number] = [0.76, 0, 0.24, 1];

type CurtainPhase = "idle" | "counting" | "splitting" | "done";

export default function V2CurtainEntrance() {
  const [phase, setPhase] = useState<CurtainPhase>("idle");
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    let alreadyEntered = false;
    try {
      alreadyEntered = window.sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      alreadyEntered = false;
    }

    if (alreadyEntered) {
      setPhase("done");
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const markEntered = () => {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // Ignore storage write restriction in private contexts
      }
    };

    if (prefersReducedMotion) {
      markEntered();
      setPhase("done");
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setPhase("counting");

    let rafId = 0;
    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    let finishTimer: ReturnType<typeof setTimeout> | null = null;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const linear = Math.min(elapsed / COUNT_DURATION_MS, 1);
      // Silky ease-out-cubic progression from 000 to 100
      const eased = 1 - Math.pow(1 - linear, 3);
      const nextCount = Math.min(100, Math.round(eased * 100));
      setProgress(nextCount);

      if (linear < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        setProgress(100);
        markEntered();
        holdTimer = setTimeout(() => {
          document.body.style.overflow = previousOverflow;
          setPhase("splitting");
          finishTimer = setTimeout(() => {
            setPhase("done");
          }, SPLIT_DURATION_S * 1000 + 60);
        }, HOLD_AT_FULL_MS);
      }
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      if (holdTimer !== null) clearTimeout(holdTimer);
      if (finishTimer !== null) clearTimeout(finishTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Render nothing during SSR & initial hydration pass to guarantee zero hydration mismatch
  if (phase === "idle" || phase === "done") {
    return null;
  }

  const isSplitting = phase === "splitting";
  const formattedCount = String(progress).padStart(3, "0");

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Entering KNITX Archive Room Edition 01"
      className={`fixed inset-0 z-[120] overflow-hidden select-none ${
        isSplitting ? "pointer-events-none" : "pointer-events-auto"
      }`}
    >
      {/* Top Porcelain Shutter Panel */}
      <motion.div
        initial={{ y: "0%" }}
        animate={{ y: isSplitting ? "-100%" : "0%" }}
        transition={{ duration: SPLIT_DURATION_S, ease: SPLIT_EASE }}
        className="absolute inset-x-0 top-0 flex h-1/2 flex-col justify-between border-b border-ink/10 bg-porcelain shadow-[0_14px_40px_rgba(10,10,10,0.06)] will-change-transform"
      >
        {/* Top Archival Registration Header */}
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
          <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.22em] text-muted uppercase">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-klein" />
            <span>KNITX STUDIO · ARCHIVE ENTRY</span>
          </div>
          <span className="font-mono text-[10px] tracking-[0.22em] text-muted uppercase">
            SPECIMEN SEAL · ED. 01
          </span>
        </div>

        {/* Center Oversized KNITX Wordmark Resting Above the Split Seam */}
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center px-6 pb-7 sm:pb-9">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mb-3 font-mono text-[10px] tracking-[0.28em] text-muted uppercase"
          >
            SMALL-BATCH ATELIER · ZERO DEADSTOCK
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative inline-flex items-start"
          >
            <span className="font-syne text-6xl leading-none font-extrabold tracking-[-0.06em] text-ink sm:text-8xl md:text-[7.25rem]">
              KNITX
            </span>
            <span className="ml-1 pt-1 font-mono text-xs font-semibold text-klein sm:text-sm">
              ®
            </span>
          </motion.div>
        </div>

        {/* Stitch-Count Progress Rail Embedded Directly on the Suture Edge */}
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-ink/10">
          <div
            className="h-full bg-klein transition-[width] duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </motion.div>

      {/* Bottom Porcelain Shutter Panel */}
      <motion.div
        initial={{ y: "0%" }}
        animate={{ y: isSplitting ? "100%" : "0%" }}
        transition={{ duration: SPLIT_DURATION_S, ease: SPLIT_EASE }}
        className="absolute inset-x-0 bottom-0 flex h-1/2 flex-col justify-between border-t border-ink/10 bg-porcelain shadow-[0_-14px_40px_rgba(10,10,10,0.06)] will-change-transform"
      >
        {/* Subtitle + Stitch-Count Readout Resting Below the Split Seam */}
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center px-6 pt-7 sm:pt-9">
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="font-editorial text-2xl text-ink italic sm:text-3xl md:text-4xl"
          >
            Archive Room · Edition 01
          </motion.p>

          {/* Animated Stitch-Count Progress Bar & Readout */}
          <div className="mt-6 flex w-full max-w-xs flex-col gap-2 sm:max-w-sm">
            <div className="flex items-baseline justify-between font-mono text-[11px] tracking-[0.2em] uppercase">
              <span className="text-muted">STITCH COUNT</span>
              <span className="font-semibold text-klein tabular-nums">
                {formattedCount} · 100
              </span>
            </div>

            <div className="relative h-1.5 w-full overflow-hidden bg-linen ring-1 ring-ink/10">
              <div
                className="h-full bg-klein transition-[width] duration-75 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.18em] text-muted/80 uppercase">
              <span>000 · LOOM CALIBRATION</span>
              <span>{progress === 100 ? "UNSEALING ROOM" : "100 · READY"}</span>
            </div>
          </div>
        </div>

        {/* Bottom Archival Footer Ticks */}
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 pb-6 sm:px-10 sm:pb-8">
          <span className="font-mono text-[10px] tracking-[0.22em] text-muted uppercase">
            3–4 UNITS PER DESIGN · TWO 1-OF-1S
          </span>
          <span className="font-mono text-[10px] tracking-[0.22em] text-archive-red uppercase">
            WAITLIST ACCESS ONLY
          </span>
        </div>
      </motion.div>
    </div>
  );
}
