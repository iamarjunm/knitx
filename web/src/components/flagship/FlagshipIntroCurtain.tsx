"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStorefrontConfig } from "@/context/StorefrontConfigContext";
import { FLAGSHIP_MEDIA } from "@/lib/flagship-media";

const INTRO_SESSION_KEY = "knitx_flagship_intro_seen_v1";

export default function FlagshipIntroCurtain({
  editionLabel,
}: {
  editionLabel: string;
}) {
  const { config } = useStorefrontConfig();

  const [phase, setPhase] = useState<"idle" | "playing" | "splitting" | "done">(
    "idle"
  );
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const alreadySeen = window.sessionStorage.getItem(INTRO_SESSION_KEY) === "1";

    if (reducedMotion || alreadySeen) {
      setPhase("done");
      return;
    }

    window.sessionStorage.setItem(INTRO_SESSION_KEY, "1");
    setPhase("playing");

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    // Rapid precision counter 00 -> 100 over 1.05s
    const startMs = performance.now();
    const durationMs = 1050;
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - startMs;
      const progress = Math.min(1, elapsed / durationMs);
      // Expo-out curve for crisp atelier deceleration
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCounter(Math.round(eased * 100));
      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick);
      }
    };
    rafId = window.requestAnimationFrame(tick);

    const splitTimer = window.setTimeout(() => {
      setPhase("splitting");
      document.documentElement.style.overflow = previousOverflow;
    }, 1520);

    const doneTimer = window.setTimeout(() => {
      setPhase("done");
    }, 2420);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(splitTimer);
      window.clearTimeout(doneTimer);
      document.documentElement.style.overflow = previousOverflow;
    };
  }, []);

  const handleSkip = () => {
    if (typeof document !== "undefined") {
      document.documentElement.style.overflow = "";
    }
    setPhase("done");
  };

  const brandName = (config.brandName || "KNITX").trim().toUpperCase();
  const accentColor = config.accentColor || "#E11D2E";
  const letters = brandName.split("");
  const isVisible = phase === "playing" || phase === "splitting";
  const isSplitting = phase === "splitting";

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          key="knitx-runway-intro"
          aria-hidden="true"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-auto fixed inset-0 z-[70] overflow-hidden select-none"
        >
          {/* TOP ARCHITECTURAL SHUTTER */}
          <motion.div
            initial={{ y: "0%" }}
            animate={{ y: isSplitting ? "-100%" : "0%" }}
            transition={{
              duration: 0.88,
              ease: [0.76, 0, 0.24, 1],
            }}
            className="absolute inset-x-0 top-0 h-1/2 overflow-hidden bg-[#050506]"
          >
            {/* Subtle Architectural Vertical Hairlines */}
            <div className="pointer-events-none absolute inset-0 mx-auto grid max-w-[1600px] grid-cols-4 border-x border-white/[0.06]">
              <div className="border-r border-white/[0.05]" />
              <div className="border-r border-white/[0.05]" />
              <div className="border-r border-white/[0.05]" />
              <div />
            </div>

            {/* Top Telemetry Bar */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: isSplitting ? 0 : 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 mx-auto flex max-w-[1600px] items-center justify-between px-5 pt-6 font-mono text-[10px] uppercase tracking-[0.24em] text-white/60 sm:px-8 sm:pt-8"
            >
              <div className="flex items-center gap-2.5">
                <span
                  style={{ backgroundColor: accentColor }}
                  className="h-1.5 w-1.5"
                />
                <span className="text-white/90">
                  {brandName} · INDIA ATELIER
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="hidden sm:inline">{editionLabel}</span>
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={handleSkip}
                  className="cursor-pointer border border-white/20 px-2.5 py-1 text-[9px] font-semibold tracking-[0.22em] text-white/75 transition-colors hover:border-white hover:text-white"
                >
                  SKIP
                </button>
              </div>
            </motion.div>
          </motion.div>

          {/* BOTTOM ARCHITECTURAL SHUTTER */}
          <motion.div
            initial={{ y: "0%" }}
            animate={{ y: isSplitting ? "100%" : "0%" }}
            transition={{
              duration: 0.88,
              ease: [0.76, 0, 0.24, 1],
            }}
            className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden bg-[#050506]"
          >
            {/* Subtle Architectural Vertical Hairlines */}
            <div className="pointer-events-none absolute inset-0 mx-auto grid max-w-[1600px] grid-cols-4 border-x border-white/[0.06]">
              <div className="border-r border-white/[0.05]" />
              <div className="border-r border-white/[0.05]" />
              <div className="border-r border-white/[0.05]" />
              <div />
            </div>

            {/* Bottom Precision Counter & Loom Manifesto */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: isSplitting ? 0 : 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 bottom-0 z-10 mx-auto flex max-w-[1600px] items-end justify-between px-5 pb-6 sm:px-8 sm:pb-8"
            >
              <div className="space-y-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white/55">
                <p className="text-white/85">CUT TO ORDER · ZERO DEADSTOCK</p>
                <p className="hidden sm:block">
                  ACCOUNT-BASED ACCESS · LIMITED EDITIONS
                </p>
              </div>

              <div className="text-right font-mono tabular-nums">
                <span className="text-[10px] uppercase tracking-[0.22em] text-white/50">
                  LOADING ARCHIVE
                </span>
                <p className="font-poster text-4xl leading-none tracking-[0.04em] text-white sm:text-5xl">
                  {String(counter).padStart(3, "0")}
                  <span
                    style={{ color: accentColor }}
                    className="ml-0.5 text-2xl sm:text-3xl"
                  >
                    %
                  </span>
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* CENTER APERTURE FLASH PREVIEW SLIT (CINEMATIC PHOTO FLASH) */}
          <motion.div
            initial={{ clipPath: "inset(50% 18% 50% 18%)", opacity: 0 }}
            animate={
              isSplitting
                ? { clipPath: "inset(0% 0% 0% 0%)", opacity: 0 }
                : { clipPath: "inset(38% 12% 38% 12%)", opacity: 0.38 }
            }
            transition={{
              duration: isSplitting ? 0.65 : 0.9,
              delay: isSplitting ? 0 : 0.48,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="pointer-events-none absolute inset-0 z-10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={FLAGSHIP_MEDIA.heroCampaign}
              alt=""
              className="h-full w-full scale-105 object-cover object-center grayscale contrast-125"
            />
          </motion.div>

          {/* RAZOR LASER HORIZONTAL PROGRESS SEAM */}
          <motion.div
            initial={{ scaleX: 0, opacity: 1 }}
            animate={
              isSplitting
                ? { scaleX: 1, opacity: 0 }
                : { scaleX: 1, opacity: 1 }
            }
            transition={{
              scaleX: { duration: 1.05, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.25 },
            }}
            style={{ backgroundColor: accentColor }}
            className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-[1.5px] origin-left -translate-y-1/2"
          />

          {/* MONUMENTAL KINETIC CENTER WORDMARK */}
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-6">
            <motion.div
              initial={{ letterSpacing: "0.42em", scale: 0.94, opacity: 1 }}
              animate={
                isSplitting
                  ? { letterSpacing: "0.06em", scale: 1.18, opacity: 0 }
                  : { letterSpacing: "0.14em", scale: 1, opacity: 1 }
              }
              transition={{
                duration: isSplitting ? 0.55 : 0.95,
                delay: isSplitting ? 0 : 0.22,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-center overflow-hidden py-2"
            >
              {letters.map((char, idx) => (
                <motion.span
                  key={`${char}-${idx}`}
                  initial={{ y: "120%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  transition={{
                    duration: 0.62,
                    delay: 0.14 + idx * 0.055,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="inline-block font-syne text-[16vw] leading-none font-extrabold text-white uppercase sm:text-[11vw] lg:text-[9.5rem]"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
