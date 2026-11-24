"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Film,
  Pause,
  Play,
  Sparkles,
} from "lucide-react";
import type { DropCampaign, Product } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";

export interface V3FilmHeroProps {
  drop: DropCampaign;
  products: Product[];
  onInspectProduct: (product: Product) => void;
}

const SPROCKET_SLOTS = Array.from({ length: 16 }, (_, i) => i);
const RULER_TICKS = Array.from({ length: 41 }, (_, i) => i);

const DROP_STATS = [
  "10 LOCKERS",
  "3–4 SMALL-BATCH",
  "2 ONE-OF-ONES",
  "0% DEADSTOCK",
];

function padFrame(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export default function V3FilmHero({
  drop,
  products,
  onInspectProduct,
}: V3FilmHeroProps) {
  const revealedPieces = useMemo(() => {
    const open = products.filter((p) => !p.isMystery);
    return (open.length > 0 ? open : products).slice(0, 5);
  }, [products]);

  const totalFrames = revealedPieces.length;
  const maxIndex = Math.max(0, totalFrames - 1);

  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showCampaignPlate, setShowCampaignPlate] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringFilm, setIsHoveringFilm] = useState(false);

  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mounted-safe Auto-Play flatbed cinema advance
  useEffect(() => {
    if (!mounted || !isPlaying || isDragging || isHoveringFilm || totalFrames <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setShowCampaignPlate(false);
      setActiveIndex((prev) => (prev + 1) % totalFrames);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [mounted, isPlaying, isDragging, isHoveringFilm, totalFrames]);

  const scrubFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || totalFrames <= 1) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.min(
        1,
        Math.max(0, (clientX - rect.left) / Math.max(1, rect.width))
      );
      const nextIdx = Math.round(ratio * maxIndex);
      setShowCampaignPlate(false);
      setActiveIndex(nextIdx);
    },
    [maxIndex, totalFrames]
  );

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    scrubFromClientX(e.clientX);
  };

  const handleTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    scrubFromClientX(e.clientX);
  };

  const handleTrackPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };

  const selectFrame = (idx: number) => {
    setShowCampaignPlate(false);
    setActiveIndex(Math.min(maxIndex, Math.max(0, idx)));
  };

  const stepFrame = (delta: number) => {
    if (totalFrames === 0) return;
    setShowCampaignPlate(false);
    setActiveIndex((prev) => (prev + delta + totalFrames) % totalFrames);
  };

  const activeProduct = revealedPieces[activeIndex] ?? revealedPieces[0] ?? null;
  const playheadPercent =
    totalFrames > 1 ? (activeIndex / (totalFrames - 1)) * 100 : 0;

  return (
    <section
      id="film"
      className="relative min-h-screen bg-alabaster bg-dot-matrix pt-20 pb-16 text-espresso"
    >
      <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
        {/* Top Magazine Masthead */}
        <div className="mb-8 border-b border-hunter/15 pb-7">
          {/* Issue micro-header */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] tracking-[0.2em] text-hunter/75 uppercase">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-sm bg-hunter px-2 py-0.5 font-semibold text-chartreuse">
                <span className="h-1.5 w-1.5 rounded-full bg-chartreuse" />
                ISSUE {drop.dropNumber}
              </span>
              <span>VAULT OS · PAN-INDIA</span>
              <span className="hidden text-hunter/40 sm:inline">·</span>
              <span className="hidden sm:inline">35MM LOOKBOOK SCRUBBER</span>
            </div>

            <div className="flex items-center gap-2 rounded-sm border border-hunter/15 bg-white/85 px-2.5 py-1 text-hunter">
              <Film className="h-3 w-3" />
              <span>
                {mounted
                  ? `${drop.waitlistCount.toLocaleString("en-IN")} IN WAITLIST`
                  : "WAITLIST OPEN"}
              </span>
            </div>
          </div>

          {/* Oversized Masthead + Italic Editorial Tagline */}
          <div className="grid grid-cols-1 items-end gap-5 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <h1 className="font-syne text-[64px] leading-[0.86] font-extrabold tracking-[-0.05em] text-hunter sm:text-[88px] lg:text-[108px]">
                KNITX
                <span className="align-top font-mono text-xl font-bold text-hunter/50 sm:text-2xl">
                  ®
                </span>
              </h1>
            </div>

            <div className="flex flex-col justify-end gap-3 lg:col-span-6 lg:items-end lg:text-right">
              <p className="font-editorial text-3xl leading-[1.06] text-espresso italic sm:text-4xl lg:text-[46px]">
                Waitlist only. Made after you claim.
              </p>
              <p className="max-w-lg text-sm leading-relaxed text-espresso/70">
                {drop.subtitle} {"—"} scrubbed frame-by-frame in 35mm before the
                five sealed steel lockers swing open across India.
              </p>
            </div>
          </div>

          {/* Live Drop Stats Ribbon */}
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-hunter/15 bg-white/85 px-4 py-2.5 shadow-[0_2px_10px_rgba(20,54,40,0.03)]">
            {DROP_STATS.map((stat, idx) => (
              <React.Fragment key={stat}>
                <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-hunter uppercase sm:text-[11px]">
                  {stat}
                </span>
                {idx < DROP_STATS.length - 1 ? (
                  <span className="font-mono text-xs text-hunter/30">·</span>
                ) : null}
              </React.Fragment>
            ))}
            <span className="ml-auto hidden font-mono text-[10px] tracking-[0.16em] text-espresso/55 uppercase md:inline">
              DROP {drop.dropNumber} · SAMPLE-FIRST ARCHIVE
            </span>
          </div>
        </div>

        {/* Centerpiece: Framed 35mm Editorial Lookbook Viewport */}
        <div
          onMouseEnter={() => setIsHoveringFilm(true)}
          onMouseLeave={() => setIsHoveringFilm(false)}
          className="overflow-hidden rounded-2xl border border-hunter/15 bg-white p-3 shadow-[0_20px_60px_rgba(20,54,40,0.08)] sm:p-4"
        >
          {/* Top 35mm Film Perforation Sprocket Rail */}
          <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-hunter/12 bg-alabaster px-3 py-2">
            <span className="hidden font-mono text-[9px] font-semibold tracking-[0.22em] text-hunter/70 uppercase sm:inline">
              KX-35MM · ISSUE {drop.dropNumber} · 400D
            </span>
            <div className="flex flex-1 items-center justify-between gap-1.5 sm:max-w-2xl">
              {SPROCKET_SLOTS.map((slot) => (
                <span
                  key={`top-sp-${slot}`}
                  className={cn(
                    "h-2.5 w-3.5 rounded-[3px] border border-hunter/15 bg-white shadow-[inset_0_1px_2px_rgba(20,54,40,0.08)] transition-colors",
                    slot % 3 === activeIndex % 3 && "border-hunter/35 bg-chrome/60"
                  )}
                />
              ))}
            </div>
            <span className="font-mono text-[9px] font-semibold tracking-[0.2em] text-hunter uppercase">
              {showCampaignPlate
                ? "COVER PLATE"
                : `FRM ${padFrame(activeIndex)} / ${padFrame(Math.max(0, totalFrames - 1))}`}
            </span>
          </div>

          {/* 35mm Projection Gate + Campaign Cover Companion */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            {/* Primary 35mm Active Frame Viewport */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-hunter/15 bg-alabaster sm:aspect-[16/11] lg:col-span-8 lg:aspect-[16/10.5]">
              <AnimatePresence mode="wait">
                {showCampaignPlate ? (
                  <motion.div
                    key="campaign-cover-plate"
                    initial={{ opacity: 0, scale: 1.045 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                    className="relative h-full w-full"
                  >
                    <Image
                      src="/images/hero-editorial-light.jpg"
                      alt="KNITX Issue 01 Editorial Campaign Frame"
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      className="object-cover object-center"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-hunter/55 via-transparent to-hunter/10" />
                  </motion.div>
                ) : activeProduct ? (
                  <motion.div
                    key={activeProduct._id}
                    initial={{ opacity: 0, scale: 1.045 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.975 }}
                    transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                    className="relative h-full w-full"
                  >
                    <Image
                      src={activeProduct.imageUrl}
                      alt={activeProduct.title}
                      fill
                      priority={activeIndex === 0}
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      className="object-cover object-center"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-espresso/50 via-transparent to-espresso/10" />
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* Corner Registration Crosshairs */}
              <div className="pointer-events-none absolute inset-3 rounded-lg border border-white/25" />

              {/* Top-left floating frame indicator */}
              <div className="absolute top-3.5 left-3.5 z-10 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-hunter/20 bg-alabaster/92 px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.16em] text-hunter uppercase shadow-xs backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-chartreuse ring-1 ring-hunter/40" />
                  {showCampaignPlate
                    ? "CAMPAIGN PLATE · 00"
                    : `FRAME ${padFrame(activeIndex)} / ${padFrame(Math.max(0, totalFrames - 1))}`}
                </span>

                {!showCampaignPlate && activeProduct ? (
                  <span
                    className={cn(
                      "rounded-md px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.16em] uppercase shadow-xs",
                      activeProduct.tier === "one-of-one"
                        ? "bg-hunter text-chartreuse"
                        : "border border-hunter/20 bg-white/92 text-hunter backdrop-blur-md"
                    )}
                  >
                    {activeProduct.tier === "one-of-one"
                      ? "1 OF 1 ARCHIVE"
                      : `${activeProduct.remainingUnits}/${activeProduct.totalUnits} SMALL-BATCH`}
                  </span>
                ) : null}
              </div>

              {/* Top-right floating technical spec */}
              {!showCampaignPlate && activeProduct ? (
                <div className="absolute top-3.5 right-3.5 z-10 hidden items-center gap-2 rounded-md border border-hunter/15 bg-alabaster/92 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.14em] text-hunter uppercase backdrop-blur-md sm:inline-flex">
                  <span>{activeProduct.serialCode}</span>
                  <span className="text-hunter/35">·</span>
                  <span>{activeProduct.gsmWeight}</span>
                </div>
              ) : null}

              {/* Bottom Floating Piece Metadata & Inspect CTA */}
              <div className="absolute inset-x-3.5 bottom-3.5 z-10 flex flex-col gap-3 rounded-xl border border-hunter/15 bg-alabaster/94 p-3.5 shadow-[0_12px_32px_rgba(20,54,40,0.18)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
                {showCampaignPlate ? (
                  <>
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-hunter/70 uppercase">
                        ISSUE {drop.dropNumber} CAMPAIGN STILL · INDIA
                      </p>
                      <h2 className="truncate font-editorial text-2xl text-espresso italic sm:text-[26px]">
                        {drop.title}
                      </h2>
                    </div>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setShowCampaignPlate(false)}
                      className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-hunter px-4 py-2.5 font-mono text-[10px] font-bold tracking-[0.16em] text-chartreuse uppercase transition-transform hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <span>RETURN TO FRAME {padFrame(activeIndex)}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : activeProduct ? (
                  <>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-hunter/75 uppercase">
                        <span>{activeProduct.gsmWeight}</span>
                        <span>·</span>
                        <span className="truncate">{activeProduct.fabric}</span>
                      </div>
                      <h2 className="mt-0.5 truncate font-syne text-lg font-extrabold tracking-[-0.02em] text-espresso sm:text-xl">
                        {activeProduct.title}
                      </h2>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="font-mono text-[9px] tracking-[0.16em] text-espresso/55 uppercase">
                          VAULT PRICE
                        </p>
                        <p className="font-mono text-base font-bold text-hunter">
                          {formatInr(activeProduct.priceInr)}
                        </p>
                      </div>

                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={() => onInspectProduct(activeProduct)}
                        className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-hunter px-4 py-2.5 font-mono text-[10px] font-bold tracking-[0.16em] text-chartreuse uppercase shadow-xs transition-all hover:bg-hunter/92 active:scale-[0.98]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>INSPECT PIECE</span>
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {/* Companion Magazine Cover Plate (/images/hero-editorial-light.jpg) */}
            <div className="flex flex-col justify-between rounded-xl border border-hunter/15 bg-alabaster/75 p-3 lg:col-span-4">
              <div>
                <div className="mb-2.5 flex items-center justify-between font-mono text-[10px] font-semibold tracking-[0.18em] text-hunter uppercase">
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    EDITORIAL COVER PLATE
                  </span>
                  <span className="text-espresso/55">35MM</span>
                </div>

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setShowCampaignPlate((prev) => !prev)}
                  className={cn(
                    "group relative block aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-lg border text-left transition-all lg:aspect-[4/4.35]",
                    showCampaignPlate
                      ? "border-hunter ring-2 ring-hunter"
                      : "border-hunter/15 hover:border-hunter/50"
                  )}
                >
                  <Image
                    src="/images/hero-editorial-light.jpg"
                    alt="KNITX Issue 01 Editorial Cover"
                    fill
                    sizes="(max-width: 1024px) 100vw, 32vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-hunter/65 via-transparent to-transparent" />
                  <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 text-alabaster">
                    <div>
                      <p className="font-mono text-[9px] tracking-[0.18em] text-chartreuse uppercase">
                        ISSUE {drop.dropNumber} STILL
                      </p>
                      <p className="font-editorial text-lg leading-tight italic">
                        {drop.title}
                      </p>
                    </div>
                    <span className="rounded-sm bg-alabaster/90 px-2 py-1 font-mono text-[9px] font-bold tracking-[0.14em] text-hunter uppercase">
                      {showCampaignPlate ? "ACTIVE" : "EXPAND"}
                    </span>
                  </div>
                </button>
              </div>

              <div className="mt-3 rounded-lg border border-hunter/12 bg-white p-3">
                <p className="font-mono text-[9px] font-semibold tracking-[0.18em] text-hunter/70 uppercase">
                  CURATORIAL NOTE · INDIA
                </p>
                <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-espresso/75">
                  {drop.manifesto}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-hunter/10 pt-2.5 font-mono text-[10px] text-hunter">
                  <span>REVEALED FRAMES</span>
                  <span className="font-bold">05 GLASS · 05 SEALED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom 35mm Film Perforation Sprocket Rail */}
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-hunter/12 bg-alabaster px-3 py-2">
            <span className="font-mono text-[9px] font-semibold tracking-[0.2em] text-espresso/60 uppercase">
              TC 00:0{activeIndex + 1}:0{totalFrames}:24
            </span>
            <div className="flex flex-1 items-center justify-between gap-1.5 sm:max-w-2xl">
              {SPROCKET_SLOTS.map((slot) => (
                <span
                  key={`bot-sp-${slot}`}
                  className="h-2.5 w-3.5 rounded-[3px] border border-hunter/15 bg-white shadow-[inset_0_1px_2px_rgba(20,54,40,0.08)]"
                />
              ))}
            </div>
            <span className="hidden font-mono text-[9px] font-semibold tracking-[0.2em] text-hunter/75 uppercase sm:inline">
              SAFE ARCHIVE · 24 FPS
            </span>
          </div>

          {/* INTERACTIVE TIMELINE SCRUBBER DECK */}
          <div className="mt-4 rounded-xl border border-hunter/15 bg-alabaster/90 p-3.5 sm:p-4">
            {/* Scrubber Transport Controls */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setIsPlaying((prev) => !prev)}
                  aria-label={isPlaying ? "Pause film reel" : "Auto-play film reel"}
                  className={cn(
                    "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-3 font-mono text-[10px] font-bold tracking-[0.16em] uppercase transition-colors",
                    isPlaying
                      ? "border-hunter bg-hunter text-chartreuse"
                      : "border-hunter/25 bg-white text-hunter hover:border-hunter"
                  )}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-3 w-3" />
                      <span>AUTO-PLAY ON</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3" />
                      <span>PLAY REEL</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => stepFrame(-1)}
                  aria-label="Previous frame"
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-hunter/20 bg-white text-hunter transition-colors hover:border-hunter hover:bg-hunter hover:text-chartreuse"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => stepFrame(1)}
                  aria-label="Next frame"
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-hunter/20 bg-white text-hunter transition-colors hover:border-hunter hover:bg-hunter hover:text-chartreuse"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-espresso/65 uppercase">
                <span className="hidden sm:inline">
                  DRAG PLAYHEAD OR HOVER FRAMES
                </span>
                <span className="rounded-sm border border-hunter/15 bg-white px-2 py-0.5 font-bold text-hunter">
                  {padFrame(activeIndex)} / {padFrame(Math.max(0, totalFrames - 1))}
                </span>
              </div>
            </div>

            {/* Draggable Hunter-Green Playhead Rail */}
            <div className="relative mb-4 select-none">
              <div
                ref={trackRef}
                onPointerDown={handleTrackPointerDown}
                onPointerMove={handleTrackPointerMove}
                onPointerUp={handleTrackPointerUp}
                onPointerCancel={handleTrackPointerUp}
                className="relative flex h-11 cursor-ew-resize items-center rounded-lg border border-hunter/20 bg-white px-3 shadow-[inset_0_1px_3px_rgba(20,54,40,0.06)] touch-none"
              >
                {/* Engraved flatbed ruler ticks */}
                <div className="pointer-events-none flex w-full items-end justify-between">
                  {RULER_TICKS.map((tick) => {
                    const isMajor = tick % 10 === 0;
                    const isMid = tick % 5 === 0 && !isMajor;
                    return (
                      <span
                        key={tick}
                        className={cn(
                          "w-px rounded-full transition-colors",
                          isMajor
                            ? "h-5 bg-hunter/45"
                            : isMid
                              ? "h-3.5 bg-hunter/25"
                              : "h-2 bg-hunter/15"
                        )}
                      />
                    );
                  })}
                </div>

                {/* Progress bar fill */}
                <div
                  className="pointer-events-none absolute top-1/2 left-3 h-1 -translate-y-1/2 rounded-full bg-hunter/20"
                  style={{ width: `calc((100% - 24px) * ${playheadPercent / 100})` }}
                />

                {/* Hunter-Green Playhead Needle & Thumb */}
                <motion.div
                  animate={{ left: `calc(12px + (100% - 24px) * ${playheadPercent / 100})` }}
                  transition={
                    isDragging
                      ? { duration: 0.04 }
                      : { type: "spring", stiffness: 360, damping: 30 }
                  }
                  className="pointer-events-none absolute top-1 bottom-1 z-10 -translate-x-1/2"
                >
                  <div className="flex h-full flex-col items-center justify-between">
                    <div className="flex h-6 items-center gap-1 rounded-sm bg-hunter px-2 font-mono text-[9px] font-bold tracking-[0.12em] text-chartreuse shadow-[0_4px_12px_rgba(20,54,40,0.28)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-chartreuse" />
                      <span>{padFrame(activeIndex)}</span>
                    </div>
                    <span className="h-2.5 w-0.5 bg-hunter" />
                  </div>
                </motion.div>

                {/* Keyboard-accessible range input synced to playhead */}
                <input
                  type="range"
                  suppressHydrationWarning
                  min={0}
                  max={maxIndex}
                  step={1}
                  value={activeIndex}
                  onChange={(e) => selectFrame(Number(e.target.value))}
                  aria-label="Scrub 35mm Drop 01 lookbook timeline"
                  className="sr-only"
                />
              </div>
            </div>

            {/* 5 Numbered Filmstrip Thumbnails (01 -> 05) */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              {revealedPieces.map((piece, idx) => {
                const isSelected = !showCampaignPlate && idx === activeIndex;
                return (
                  <button
                    key={piece._id}
                    type="button"
                    suppressHydrationWarning
                    onMouseEnter={() => selectFrame(idx)}
                    onFocus={() => selectFrame(idx)}
                    onClick={() => selectFrame(idx)}
                    className={cn(
                      "group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border bg-white p-1.5 text-left transition-all",
                      isSelected
                        ? "border-hunter shadow-[0_6px_18px_rgba(20,54,40,0.14)] ring-1 ring-hunter"
                        : "border-hunter/15 hover:border-hunter/45"
                    )}
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-alabaster">
                      <Image
                        src={piece.imageUrl}
                        alt={piece.title}
                        fill
                        sizes="(max-width: 640px) 50vw, 20vw"
                        className={cn(
                          "object-cover transition-transform duration-300",
                          isSelected ? "scale-105" : "group-hover:scale-105"
                        )}
                      />
                      <div className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-xs bg-hunter/90 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.12em] text-alabaster">
                        {isSelected ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-chartreuse" />
                        ) : null}
                        <span>{padFrame(idx)}</span>
                      </div>
                    </div>

                    <div className="mt-1.5 px-0.5">
                      <p className="truncate font-sans text-[11px] font-semibold text-espresso">
                        {piece.title}
                      </p>
                      <div className="mt-0.5 flex items-center justify-between font-mono text-[9px] text-hunter/75">
                        <span>{formatInr(piece.priceInr)}</span>
                        <span className="uppercase">
                          {piece.tier === "one-of-one" ? "1/1" : `${piece.remainingUnits}L`}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Quick CTAs */}
        <div className="mt-8 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#passbook"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-hunter px-6 py-3.5 font-mono text-xs font-bold tracking-[0.16em] text-chartreuse uppercase shadow-[0_12px_28px_rgba(20,54,40,0.2)] transition-all hover:-translate-y-0.5 hover:bg-hunter/95"
            >
              <span>OPEN MY PASSBOOK</span>
              <ArrowRight className="h-4 w-4" />
            </a>

            <a
              href="#lockers"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-hunter/25 bg-white px-6 py-3.5 font-mono text-xs font-bold tracking-[0.16em] text-hunter uppercase transition-all hover:-translate-y-0.5 hover:border-hunter hover:bg-alabaster"
            >
              <span>WALK THE 10 LOCKERS</span>
              <ArrowDown className="h-4 w-4" />
            </a>
          </div>

          <p className="font-mono text-[10px] tracking-[0.18em] text-espresso/60 uppercase">
            FIVE GLASS BOXES · FIVE SEALED STEEL VAULTS · INDIA
          </p>
        </div>
      </div>
    </section>
  );
}
