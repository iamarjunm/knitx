"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import type { DropCampaign } from "@/lib/types";

export interface V8HeroProps {
  drop: DropCampaign;
}

interface CountdownParts {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Join the queue",
    body: "Claim a numbered line spot. No open storefront, no bots.",
  },
  {
    step: "02",
    title: "Your number unlocks all 10",
    body: "When called, all 5 sealed mystery bags unzip for your private session.",
  },
  {
    step: "03",
    title: "Cut & sewn after your order",
    body: "Made to order across India in heavy 420–480 GSM fabrics. Zero deadstock.",
  },
];

function computeCountdown(targetIso: string): CountdownParts {
  const targetMs = new Date(targetIso).getTime();
  const safeTarget = Number.isFinite(targetMs)
    ? targetMs
    : Date.now() + 4 * 86400 * 1000;
  const diff = Math.max(0, safeTarget - Date.now());
  const totalSec = Math.floor(diff / 1000);

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

export default function V8Hero({ drop }: V8HeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState<CountdownParts | null>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 135,
    damping: 26,
    mass: 0.4,
  });

  const line1X = useTransform(smoothProgress, [0, 1], [0, -120]);
  const line2X = useTransform(smoothProgress, [0, 1], [0, 120]);
  const line3Scale = useTransform(smoothProgress, [0, 0.7], [1, 0.96]);
  const frameScale = useTransform(smoothProgress, [0, 0.55], [0.94, 1.02]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setCountdown(computeCountdown(drop.launchDate));
    const timer = window.setInterval(() => {
      setCountdown(computeCountdown(drop.launchDate));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mounted, drop.launchDate]);

  const formattedCountdown =
    mounted && countdown
      ? `${countdown.days}D : ${countdown.hours}H : ${countdown.minutes}M : ${countdown.seconds}S`
      : "--D : --H : --M : --S";

  return (
    <section
      id="v8-hero"
      ref={heroRef}
      className="relative overflow-x-clip bg-porcelain pt-24 pb-20 sm:pt-28 sm:pb-24"
    >
      <div className="mx-auto max-w-[1320px] px-4 sm:px-8">
        {/* Quiet Top Eyebrow Pill */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mb-7 flex justify-center sm:mb-9"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-1.5 font-mono text-[10px] font-semibold tracking-[0.18em] text-[#64625D] uppercase shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange" />
            </span>
            <span>
              {drop.dropNumber || "DROP 01"} · WAITLIST ONLY · NO OPEN STORE
            </span>
          </div>
        </motion.div>

        {/* Monumental V1 Scroll-Split Anton Poster Headline */}
        <div className="relative z-20 flex flex-col items-center text-center select-none">
          <h1
            aria-label="You can't buy until we call your number."
            className="w-full font-poster text-[13vw] leading-[0.86] tracking-[-0.01em] uppercase sm:text-[10vw] lg:text-[8.2rem]"
          >
            <motion.span
              style={{ x: line1X }}
              initial={{ opacity: 0, x: -36 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="block text-ink"
            >
              YOU CAN&apos;T BUY
            </motion.span>

            <motion.span
              style={{ x: line2X }}
              initial={{ opacity: 0, x: 36 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="block text-orange"
            >
              UNTIL WE CALL
            </motion.span>

            <motion.span
              style={{ scale: line3Scale }}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.55,
                delay: 0.16,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-2.5 inline-block rounded-2xl bg-ink px-6 py-2 text-porcelain shadow-[0_14px_34px_rgba(10,10,10,0.14)] sm:mt-3 sm:px-9 sm:py-2.5"
            >
              YOUR NUMBER.
            </motion.span>
          </h1>
        </div>

        {/* Scroll-Expanding Studio Lookbook Frame */}
        <div className="relative z-10 mx-auto -mt-4 max-w-[1220px] sm:-mt-6">
          <motion.div
            style={{ scale: frameScale }}
            className="relative overflow-hidden rounded-3xl border border-ink/10 bg-linen shadow-[0_24px_70px_rgba(0,0,0,0.10)]"
          >
            <div className="relative aspect-[4/5] w-full sm:aspect-[16/9]">
              <Image
                src="/images/hero-editorial-light.jpg"
                alt="KNITX Drop 01 Studio Editorial"
                fill
                priority
                sizes="(max-width: 768px) 96vw, 1220px"
                className="object-cover object-center"
              />

              {/* Subtle bottom gradient for crisp legibility */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-ink/45 via-ink/10 to-transparent" />

              {/* Top Frosted Corner Pills */}
              <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2 sm:inset-x-5 sm:top-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/86 px-3.5 py-1.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-ink uppercase shadow-xs backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange" />
                  <span>10 PIECES ONLY</span>
                </div>

                <div className="inline-flex items-center rounded-full border border-white/50 bg-white/86 px-3.5 py-1.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-ink uppercase tabular-nums shadow-xs backdrop-blur-md sm:text-[11px]">
                  {formattedCountdown}
                </div>
              </div>

              {/* Bottom Frosted Bar: 1-liner + 2 sleek CTA pills */}
              <div className="absolute inset-x-3 bottom-3 flex flex-col gap-3 rounded-2xl border border-white/50 bg-white/88 px-4 py-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.1)] backdrop-blur-xl sm:inset-x-5 sm:bottom-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                <p className="text-xs font-medium tracking-[-0.01em] text-ink sm:text-sm">
                  3–4 units per design · Two 1-of-1s · Cut only after you order
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href="#v8-waitlist"
                    className="inline-flex items-center gap-1.5 rounded-full bg-orange px-5 py-2.5 font-mono text-[11px] font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:bg-ink"
                  >
                    <span>CLAIM YOUR SPOT</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>

                  <a
                    href="#v8-rack"
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-white/95 px-5 py-2.5 font-mono text-[11px] font-semibold tracking-[0.14em] text-ink uppercase transition-colors hover:border-ink/30 hover:bg-linen"
                  >
                    <span>WALK THE RACK</span>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Clean 3-Column "HOW IT WORKS" Hairline Strip */}
        <div className="mx-auto mt-12 max-w-[1220px] border-y border-ink/10 sm:mt-14">
          <div className="grid grid-cols-1 divide-y divide-ink/10 md:grid-cols-3 md:divide-x md:divide-y-0">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-4 py-5 md:px-6 md:py-6 md:first:pl-1 md:last:pr-1"
              >
                <span className="font-mono text-xs font-bold tracking-[0.16em] text-orange">
                  {item.step}
                </span>
                <div>
                  <h2 className="font-poster text-xl leading-none tracking-wide text-ink uppercase">
                    {item.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#64625D]">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
