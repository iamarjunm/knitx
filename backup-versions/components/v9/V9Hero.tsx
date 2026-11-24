"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { useVault } from "@/context/VaultContext";
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
const FALLBACK_QUEUE_COUNT = 1842;

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

function formatQueueCount(count: number): string {
  const safe = Number.isFinite(count) && count > 0 ? Math.floor(count) : FALLBACK_QUEUE_COUNT;
  return String(safe).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
  const { waitlistPass } = useVault();

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

  const baseQueueCount =
    Number.isFinite(drop?.waitlistCount) && drop.waitlistCount > 0
      ? drop.waitlistCount
      : FALLBACK_QUEUE_COUNT;

  const liveQueueCount =
    mounted && waitlistPass?.totalInQueue
      ? Math.max(baseQueueCount, waitlistPass.totalInQueue)
      : baseQueueCount;

  const countdownDisplay =
    mounted && countdown
      ? `${countdown.days} : ${countdown.hours} : ${countdown.minutes} : ${countdown.seconds}`
      : "-- : -- : -- : --";

  const scrollToWaitlist = () => {
    const el = document.getElementById("waitlist");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative overflow-x-clip bg-[#F7F5F0] pt-7 pb-16 sm:pt-10 sm:pb-24"
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
          className="mt-3.5 text-center font-poster text-[12vw] leading-[0.86] tracking-[-0.01em] uppercase select-none sm:mt-4 sm:text-[8.5vw] lg:text-[6.8rem]"
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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.72,
              delay: 0.16,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-2 inline-block rounded-2xl bg-[#111110] px-5 py-1.5 text-[#F7F5F0] shadow-[0_18px_40px_-24px_rgba(17,17,16,0.45)] sm:mt-2.5 sm:px-9 sm:py-2"
          >
            YOUR NUMBER.
          </motion.span>
        </h1>
      </div>

      {/* Scroll-Expanding Architectural Arch Portal */}
      <div className="mx-auto mt-6 max-w-[1320px] px-4 sm:mt-7 sm:px-8">
        <motion.div
          style={{
            scale: frameScale,
            borderTopLeftRadius: frameTopRadius,
            borderTopRightRadius: frameTopRadius,
          }}
          className="relative aspect-[4/5] w-full overflow-hidden rounded-b-2xl border border-[#DDD7CB] bg-[#ECE8DF] shadow-[0_36px_96px_-48px_rgba(17,17,16,0.3)] sm:aspect-[16/9] lg:max-h-[540px]"
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
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#111110]/45 via-[#111110]/12 to-transparent" />

          {/* Upgraded Frosted Limestone Bottom Bar */}
          <div className="absolute inset-x-3 bottom-3 z-10 sm:inset-x-6 sm:bottom-5 lg:inset-x-8 lg:bottom-6">
            <div className="relative overflow-hidden rounded-2xl border border-[#DDD7CB]/90 bg-[#F7F5F0]/92 px-4 py-3.5 shadow-[0_20px_50px_-25px_rgba(17,17,16,0.28)] backdrop-blur-xl sm:px-6 sm:py-4">
              {/* Antique-Brass Top Hairline Accent */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#9A7B4F]/45 to-transparent"
              />

              <div className="flex flex-col justify-between gap-3.5 lg:flex-row lg:items-center lg:gap-5">
                {/* Live Countdown + Antique-Brass Hairline Divider + Live Queue Count */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                  {/* Mounted-Safe Live Countdown (DD : HH : MM : SS) */}
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-[#8E1C1C]"
                      />
                      <p className="font-mono text-sm font-semibold tracking-[0.18em] text-[#111110] uppercase tabular-nums sm:text-base">
                        {countdownDisplay}
                      </p>
                    </div>
                    <p className="mt-0.5 pl-3.5 font-mono text-[9px] tracking-[0.24em] text-[#6A655D] uppercase">
                      DD : HH : MM : SS · NEXT RELEASE
                    </p>
                  </div>

                  {/* Antique-Brass Hairline Divider */}
                  <div
                    aria-hidden="true"
                    className="h-px w-full bg-[#9A7B4F]/35 sm:h-9 sm:w-px"
                  />

                  {/* Live Queue Count */}
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-[#9A7B4F]"
                      />
                      <p className="font-mono text-xs font-semibold tracking-[0.18em] text-[#111110] uppercase tabular-nums sm:text-[13px]">
                        {formatQueueCount(liveQueueCount)} IN QUEUE
                      </p>
                    </div>
                    <p className="mt-0.5 pl-3.5 font-sans text-[11px] tracking-[0.02em] text-[#6A655D] sm:text-xs">
                      3–4 small-batch units · Two 1-of-1s
                    </p>
                  </div>
                </div>

                {/* Dual Flagship Actions */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={scrollToWaitlist}
                    className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#8E1C1C] px-5 py-2.5 font-sans text-[11px] font-medium tracking-[0.16em] text-white uppercase shadow-[0_12px_24px_-12px_rgba(142,28,28,0.65)] transition-all duration-200 hover:bg-[#721515] sm:px-6 sm:py-3"
                  >
                    <span>CLAIM YOUR SPOT</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>

                  <Link
                    href="/v9/vault"
                    className="group inline-flex items-center gap-2 rounded-full border border-[#111110]/20 bg-[#F7F5F0] px-5 py-2.5 font-sans text-[11px] font-medium tracking-[0.16em] text-[#111110] uppercase transition-all duration-200 hover:border-[#111110] hover:bg-[#FFFFFF] sm:px-6 sm:py-3"
                  >
                    <span>ENTER THE VAULT</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Discreet Centered Bottom Scroll Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mt-6 flex justify-center sm:mt-7"
        >
          <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-[#6A655D] uppercase">
            <span>Scroll to explore</span>
            <motion.span
              aria-hidden="true"
              animate={{ y: [0, 3, 0] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="inline-flex items-center text-[#9A7B4F]"
            >
              <ArrowDown className="h-3 w-3 stroke-[1.75]" />
            </motion.span>
          </span>
        </motion.div>
      </div>
    </section>
  );
}
