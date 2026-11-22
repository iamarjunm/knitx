"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
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

const FALLBACK_OFFSET_MS = (4 * 86400 + 11 * 3600 + 23 * 60 + 9) * 1000;

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

function normalizeDropLabel(dropNumber?: string): string {
  const cleaned = (dropNumber || "").trim().toUpperCase();
  if (!cleaned) return "DROP 01";
  const numericMatch = cleaned.match(/(\d+)/);
  if (numericMatch) {
    const num = parseInt(numericMatch[1], 10);
    if (Number.isFinite(num)) {
      return `DROP ${String(num).padStart(2, "0")}`;
    }
  }
  return cleaned.startsWith("DROP") ? cleaned : `DROP ${cleaned}`;
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

  // Kinetic Scroll-Split Monumental Headline
  const line1X = useTransform(smoothProgress, [0, 0.85], [0, -140]);
  const line2X = useTransform(smoothProgress, [0, 0.85], [0, 140]);
  const line3Scale = useTransform(smoothProgress, [0, 0.7], [1, 0.94]);

  // Expanding Architectural Arch Portal (0.90 -> 1, rounded-t-[170px] -> rounded-2xl)
  const frameScale = useTransform(smoothProgress, [0, 0.5], [0.9, 1]);
  const frameTopRadius = useTransform(smoothProgress, [0, 0.5], [170, 16]);
  const innerImageScale = useTransform(smoothProgress, [0, 0.75], [1.07, 1]);
  const innerImageY = useTransform(smoothProgress, [0, 0.85], ["-2%", "3%"]);

  const dropLabel = normalizeDropLabel(drop?.dropNumber);

  const countdownDisplay =
    mounted && countdown
      ? `${countdown.days}D : ${countdown.hours}H : ${countdown.minutes}M : ${countdown.seconds}S`
      : "--D : --H : --M : --S";

  const scrollToWaitlist = () => {
    const el = document.getElementById("waitlist");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative overflow-x-clip bg-[#F7F5F0] pt-10 pb-20 sm:pt-14 sm:pb-28"
    >
      {/* Top Whisper Line + Monumental 3-Line Kinetic Headline */}
      <div className="mx-auto max-w-[1400px] px-4 text-center sm:px-8">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center justify-center gap-2.5 font-mono text-[10px] tracking-[0.26em] text-[#6A655D] uppercase sm:text-[11px]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#8E1C1C]" />
          <span>{dropLabel} · EDITION OF TEN · MADE IN INDIA</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#9A7B4F]" />
        </motion.p>

        <h1
          aria-label="You can't buy until we call your number."
          className="mt-5 text-center font-poster text-[13vw] leading-[0.86] tracking-[-0.01em] uppercase select-none sm:mt-6 sm:text-[10vw] lg:text-[8.4rem]"
        >
          <motion.span
            style={{ x: line1X }}
            initial={{ opacity: 0, x: -34 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
            className="block text-[#111110]"
          >
            YOU CAN&apos;T BUY
          </motion.span>

          <motion.span
            style={{ x: line2X }}
            initial={{ opacity: 0, x: 34 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.72,
              delay: 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="block text-[#8E1C1C]"
          >
            UNTIL WE CALL
          </motion.span>

          <motion.span
            style={{ scale: line3Scale }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.72,
              delay: 0.16,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-2.5 inline-block rounded-2xl bg-[#111110] px-6 py-2 text-[#F7F5F0] shadow-[0_18px_40px_-24px_rgba(17,17,16,0.45)] sm:mt-3.5 sm:px-10 sm:py-2.5"
          >
            YOUR NUMBER.
          </motion.span>
        </h1>
      </div>

      {/* Scroll-Expanding Architectural Arch Portal */}
      <div className="mx-auto mt-8 max-w-[1320px] px-4 sm:mt-10 sm:px-8">
        <motion.div
          style={{
            scale: frameScale,
            borderTopLeftRadius: frameTopRadius,
            borderTopRightRadius: frameTopRadius,
          }}
          className="relative aspect-[4/5] w-full overflow-hidden rounded-b-2xl border border-[#DDD7CB] bg-[#ECE8DF] shadow-[0_36px_96px_-48px_rgba(17,17,16,0.3)] sm:aspect-[16/9]"
        >
          <motion.img
            src="/images/hero-editorial-light.jpg"
            alt="KNITX Drop 01 sculptural silhouette presented inside a warm limestone gallery"
            style={{
              scale: innerImageScale,
              y: innerImageY,
            }}
            className="h-full w-full object-cover object-center will-change-transform"
          />

          {/* Subtle Warm Architectural Vignette */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#111110]/40 via-[#111110]/10 to-transparent" />

          {/* Clean Frosted Limestone Bottom Overlay */}
          <div className="absolute inset-x-3 bottom-3 z-10 sm:inset-x-6 sm:bottom-6 lg:inset-x-8 lg:bottom-8">
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#DDD7CB]/90 bg-[#F7F5F0]/90 px-4 py-4 shadow-[0_20px_50px_-25px_rgba(17,17,16,0.28)] backdrop-blur-xl sm:flex-row sm:items-center sm:px-7 sm:py-5">
              {/* Countdown & Concise Edition Spec */}
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8E1C1C]" />
                  <p className="font-mono text-xs font-semibold tracking-[0.2em] text-[#111110] uppercase tabular-nums sm:text-sm">
                    {countdownDisplay}
                  </p>
                </div>
                <p className="font-sans text-xs tracking-[0.02em] text-[#6A655D] sm:text-sm">
                  3–4 small-batch units · Two 1-of-1s · Cut only after you order
                </p>
              </div>

              {/* Dual Flagship Actions */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={scrollToWaitlist}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#8E1C1C] px-5 py-3 font-sans text-[11px] font-medium tracking-[0.16em] text-white uppercase transition-colors duration-200 hover:bg-[#721515] sm:px-6 sm:py-3.5"
                >
                  <span>CLAIM YOUR SPOT</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                <Link
                  href="/v9/vault"
                  className="inline-flex items-center gap-2 rounded-full border border-[#111110]/20 bg-[#F7F5F0] px-5 py-3 font-sans text-[11px] font-medium tracking-[0.16em] text-[#111110] uppercase transition-colors duration-200 hover:border-[#111110] hover:bg-[#FFFFFF] sm:px-6 sm:py-3.5"
                >
                  <span>ENTER THE VAULT</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
