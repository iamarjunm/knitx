"use client";

import React, { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowDownRight } from "lucide-react";
import type { DropCampaign } from "@/lib/types";

interface V5ApertureHeroProps {
  drop: DropCampaign;
}

export default function V5ApertureHero({ drop }: V5ApertureHeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 78,
    damping: 26,
    mass: 0.65,
  });

  // Scroll-choreographed archway expansion: tall museum arch -> wide panoramic gallery plate
  const archScale = useTransform(smoothProgress, [0, 0.58], [0.86, 1]);
  const archTopRadius = useTransform(smoothProgress, [0, 0.58], [240, 12]);
  const archBottomRadius = useTransform(smoothProgress, [0, 0.58], [16, 12]);
  const innerImageScale = useTransform(smoothProgress, [0, 0.7], [1.08, 1]);
  const innerImageY = useTransform(smoothProgress, [0, 0.8], ["-3%", "4%"]);
  const captionOpacity = useTransform(smoothProgress, [0, 0.25], [1, 0.85]);

  const dropLabel = drop?.dropNumber
    ? `DROP ${drop.dropNumber}`
    : "DROP 01";

  const scrollToTarget = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      id="aperture"
      ref={sectionRef}
      className="relative overflow-x-clip bg-plaster pt-28 pb-24 sm:pt-36 sm:pb-28"
    >
      {/* Top Serene Editorial Composition */}
      <div className="mx-auto max-w-[1160px] px-6 text-center sm:px-10">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="font-sans text-[11px] font-medium tracking-[0.28em] text-terracotta uppercase"
        >
          {dropLabel} · EDITION OF TEN · INDIA
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.95,
            delay: 0.08,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mt-7 font-editorial text-6xl leading-[0.9] tracking-[-0.02em] text-umber sm:text-8xl lg:text-[7.5rem]"
        >
          Cut in <span className="italic text-umber">threes.</span>
          <br />
          Held behind <span className="italic text-terracotta">silk.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.9,
            delay: 0.18,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mx-auto mt-7 max-w-2xl font-sans text-sm leading-relaxed tracking-[0.02em] text-muted sm:text-[15px]"
        >
          Small-batch pieces (3–4 units) · Two one-of-one collector&apos;s
          editions · Zero deadstock.
        </motion.p>
      </div>

      {/* Scroll-Choreographed Architectural Archway Portal */}
      <div className="mx-auto mt-14 max-w-[1380px] px-4 sm:mt-16 sm:px-8 lg:px-12">
        <div className="relative">
          <motion.div
            style={{
              scale: archScale,
              borderTopLeftRadius: archTopRadius,
              borderTopRightRadius: archTopRadius,
              borderBottomLeftRadius: archBottomRadius,
              borderBottomRightRadius: archBottomRadius,
            }}
            className="relative mx-auto aspect-[4/5] w-full overflow-hidden border border-champagne bg-travertine shadow-[0_32px_90px_-48px_rgba(28,25,23,0.32)] sm:aspect-[16/11] lg:aspect-[16/9]"
          >
            <motion.img
              src="/images/hero-editorial-light.jpg"
              alt="KNITX Drop 01 sculptural silhouette presented inside a sunlit plaster gallery"
              style={{
                scale: innerImageScale,
                y: innerImageY,
              }}
              className="h-full w-full object-cover object-center will-change-transform"
            />

            {/* Soft museum lighting veil at bottom for serene legibility */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-umber/45 via-umber/12 to-transparent" />

            {/* Subtle top architectural hairline highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-plaster/20 to-transparent" />

            {/* Gallery Plate Plaque (bottom left / right) */}
            <motion.div
              style={{ opacity: captionOpacity }}
              className="pointer-events-none absolute inset-x-0 bottom-5 hidden items-end justify-between px-8 text-plaster/90 sm:flex"
            >
              <div>
                <p className="font-mono text-[10px] tracking-[0.24em] uppercase opacity-80">
                  Plate 01 · Exhibition Aperture
                </p>
                <p className="mt-1 font-editorial text-xl italic tracking-wide">
                  {drop?.title || "Quiet Silhouettes in Heavyweight Knit"}
                </p>
              </div>
              <p className="font-mono text-[10px] tracking-[0.24em] uppercase opacity-80">
                Private Salon · India
              </p>
            </motion.div>
          </motion.div>

          {/* Serene Floating Bottom Pill CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.9,
              delay: 0.28,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative z-10 -mt-7 flex flex-wrap items-center justify-center gap-3 px-4 sm:-mt-8 sm:gap-4"
          >
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => scrollToTarget("envelope")}
              className="group inline-flex items-center gap-3 rounded-full bg-umber px-7 py-3.5 font-sans text-[11px] font-medium tracking-[0.22em] text-plaster uppercase shadow-[0_14px_34px_-14px_rgba(28,25,23,0.45)] transition-all duration-300 hover:bg-terracotta focus:outline-none sm:px-9 sm:py-4"
            >
              <span>Request an Invitation</span>
              <ArrowDownRight className="h-3.5 w-3.5 stroke-[1.6] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
            </button>

            <button
              type="button"
              suppressHydrationWarning
              onClick={() => scrollToTarget("curtain-gallery")}
              className="inline-flex items-center gap-2.5 rounded-full border border-champagne bg-plaster/95 px-7 py-3.5 font-sans text-[11px] font-medium tracking-[0.22em] text-umber uppercase backdrop-blur-md transition-all duration-300 hover:border-umber hover:bg-travertine focus:outline-none sm:px-9 sm:py-4"
            >
              <span>Walk the Collection</span>
            </button>
          </motion.div>
        </div>

        {/* Whisper Architectural Colophon Strip */}
        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 divide-y divide-champagne border-t border-b border-champagne sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-6 py-5 text-center">
            <p className="font-mono text-[10px] tracking-[0.24em] text-muted uppercase">
              Room I · Allocation
            </p>
            <p className="mt-1.5 font-editorial text-2xl text-umber">
              Eight Small-Batch Works
            </p>
          </div>
          <div className="px-6 py-5 text-center">
            <p className="font-mono text-[10px] tracking-[0.24em] text-terracotta uppercase">
              Room II · Singular Archive
            </p>
            <p className="mt-1.5 font-editorial text-2xl italic text-umber">
              Two One-of-One Editions
            </p>
          </div>
          <div className="px-6 py-5 text-center">
            <p className="font-mono text-[10px] tracking-[0.24em] text-muted uppercase">
              Atelier Ethos
            </p>
            <p className="mt-1.5 font-editorial text-2xl text-umber">
              Cut Only Upon Reservation
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
