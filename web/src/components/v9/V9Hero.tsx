"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import type { DropCampaign } from "@/lib/types";

interface V9HeroProps {
  drop: DropCampaign;
}

interface CountdownParts {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

const FALLBACK_OFFSET_MS =
  (4 * 86400 + 11 * 3600 + 23 * 60 + 9) * 1000;

function formatCountdownFromMs(diffMs: number): CountdownParts {
  const totalSec = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    days: pad(days),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
  };
}

export default function V9Hero({ drop }: V9HeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState<CountdownParts | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const parsedTarget = new Date(drop.launchDate).getTime();
    const resolvedTarget =
      Number.isFinite(parsedTarget) && parsedTarget > Date.now()
        ? parsedTarget
        : Date.now() + FALLBACK_OFFSET_MS;

    const tick = () => {
      setCountdown(formatCountdownFromMs(resolvedTarget - Date.now()));
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [mounted, drop.launchDate]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 95,
    damping: 26,
    mass: 0.55,
  });

  // V1 Kinetic Scroll-Split Anton Headline
  const line1X = useTransform(smoothProgress, [0, 0.85], [0, -135]);
  const line2X = useTransform(smoothProgress, [0, 0.85], [0, 135]);
  const line3Scale = useTransform(smoothProgress, [0, 0.7], [1, 0.94]);

  // V5 Scroll-Expanding Architectural Gallery Frame (arch -> panoramic rounded-2xl)
  const frameScale = useTransform(smoothProgress, [0, 0.5], [0.9, 1]);
  const frameTopRadius = useTransform(smoothProgress, [0, 0.5], [160, 16]);
  const innerImageScale = useTransform(smoothProgress, [0, 0.75], [1.07, 1]);
  const innerImageY = useTransform(smoothProgress, [0, 0.85], ["-2%", "3%"]);

  const dropNumberLabel = drop?.dropNumber
    ? `DROP ${drop.dropNumber}`
    : "DROP 01";

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const countdownDisplay =
    mounted && countdown
      ? `${countdown.days}D : ${countdown.hours}H : ${countdown.minutes}M : ${countdown.seconds}S`
      : "--D : --H : --M : --S";

  return (
    <section
      id="v9-hero"
      ref={sectionRef}
      className="relative overflow-x-clip bg-white pt-24 pb-24"
    >
      {/* Top Whisper Label + Monumental V1 Kinetic Scroll-Split Anton Headline */}
      <div className="mx-auto max-w-[1380px] px-5 text-center sm:px-10">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.26em] text-[#736E66] uppercase sm:text-[11px]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#D9381E]" />
          <span>{dropNumberLabel} · MADE IN INDIA · WAITLIST ONLY</span>
        </motion.p>

        <h1
          aria-label="You can't buy until we call your number."
          className="mt-5 text-center font-poster text-[13vw] leading-[0.86] tracking-[-0.01em] uppercase select-none sm:mt-6 sm:text-[10vw] lg:text-[8.2rem]"
        >
          <motion.span
            style={{ x: line1X }}
            initial={{ opacity: 0, x: -36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="block text-[#121110]"
          >
            YOU CAN&apos;T BUY
          </motion.span>

          <motion.span
            style={{ x: line2X }}
            initial={{ opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="block text-[#D9381E]"
          >
            UNTIL WE CALL
          </motion.span>

          <motion.span
            style={{ scale: line3Scale }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.16,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-2.5 inline-block rounded-2xl bg-[#121110] px-6 py-2 text-white sm:mt-3 sm:px-9 sm:py-2.5"
          >
            YOUR NUMBER.
          </motion.span>
        </h1>
      </div>

      {/* V5 Scroll-Expanding Architectural Gallery Frame */}
      <div className="mx-auto mt-6 max-w-[1260px] px-4 sm:mt-8 sm:px-8">
        <motion.div
          style={{
            scale: frameScale,
            borderTopLeftRadius: frameTopRadius,
            borderTopRightRadius: frameTopRadius,
          }}
          className="relative aspect-[4/5] w-full overflow-hidden rounded-b-2xl border border-champagne bg-travertine shadow-[0_32px_90px_-48px_rgba(18,17,16,0.28)] sm:aspect-[16/9]"
        >
          <motion.img
            src="/images/hero-editorial-light.jpg"
            alt="KNITX Drop 01 editorial silhouette in a sunlit museum gallery"
            style={{
              scale: innerImageScale,
              y: innerImageY,
            }}
            className="h-full w-full object-cover object-center will-change-transform"
          />

          {/* Clean Legibility Scrim — Bottom Strip Only */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#121110]/78 via-[#121110]/30 to-transparent sm:h-44" />

          {/* Minimal Bottom Overlay Strip (Zero Clutter) */}
          <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-end sm:p-8 lg:px-10 lg:py-8">
            <div className="space-y-1.5 text-left text-white">
              <p className="font-mono text-xs tracking-[0.2em] text-white/95 uppercase tabular-nums sm:text-sm">
                {countdownDisplay}
              </p>
              <p className="font-sans text-xs tracking-[0.04em] text-white/85 sm:text-sm">
                3–4 small-batch pieces · Two 1-of-1s · Zero deadstock
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => scrollToSection("v9-envelope")}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#D9381E] px-6 py-3 font-sans text-[11px] font-medium tracking-[0.18em] text-white uppercase transition-all duration-300 hover:bg-[#be2f18] focus:outline-none sm:px-7 sm:py-3.5"
              >
                <span>REQUEST INVITATION →</span>
              </button>

              <button
                type="button"
                suppressHydrationWarning
                onClick={() => scrollToSection("v9-gallery")}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-6 py-3 font-sans text-[11px] font-medium tracking-[0.18em] text-[#121110] uppercase transition-all duration-300 hover:bg-travertine focus:outline-none sm:px-7 sm:py-3.5"
              >
                <span>VIEW COLLECTION ↓</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
