"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type PanInfo,
} from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Eye,
  MoveHorizontal,
  Sparkles,
} from "lucide-react";
import type { DropCampaign, Product } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";

export interface V2HeroDeckProps {
  drop: DropCampaign;
  products: Product[];
  onOpenProduct: (p: Product) => void;
}

const STACK_TRANSFORMS = [
  { rotate: 0, x: 0, y: 0, scale: 1 },
  { rotate: -4, x: -12, y: 8, scale: 0.965 },
  { rotate: 2.2, x: 14, y: 15, scale: 0.93 },
  { rotate: -1.5, x: -7, y: 22, scale: 0.895 },
  { rotate: 3.1, x: 9, y: 28, scale: 0.86 },
];

interface DraggableTopPrintProps {
  product: Product;
  exitDirection: 1 | -1;
  onDismiss: (direction: 1 | -1) => void;
  onInspect: (product: Product) => void;
}

function DraggableTopPrint({
  product,
  exitDirection,
  onDismiss,
  onInspect,
}: DraggableTopPrintProps) {
  const dragX = useMotionValue(0);
  const rotate = useTransform(dragX, [-220, 0, 220], [-14, 0, 14]);
  const rightCueOpacity = useTransform(dragX, [24, 100], [0, 1]);
  const leftCueOpacity = useTransform(dragX, [-100, -24], [1, 0]);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.x > 95 || info.velocity.x > 460) {
      onDismiss(1);
    } else if (info.offset.x < -95 || info.velocity.x < -460) {
      onDismiss(-1);
    }
  };

  const isOneOfOne = product.tier === "one-of-one";

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.85}
      dragSnapToOrigin
      onDragEnd={handleDragEnd}
      style={{ x: dragX, rotate }}
      initial={{ scale: 0.95, opacity: 0.85, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{
        x: exitDirection * 420,
        rotate: exitDirection * 18,
        opacity: 0,
        transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
      }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      whileTap={{ scale: 1.015 }}
      className="absolute inset-0 z-30 cursor-grab touch-pan-y select-none active:cursor-grabbing"
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[26px] border border-ink/10 bg-white p-3.5 shadow-[0_24px_60px_rgba(0,0,0,0.09)] sm:p-4">
        {/* Top Exhibition Strip */}
        <div className="mb-2.5 flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#64625D] uppercase">
              {product.serialCode}
            </span>
            <span className="h-1 w-1 rounded-full bg-ink/25" />
            <span className="font-mono text-[10px] tracking-[0.14em] text-[#64625D] uppercase">
              {product.gsmWeight}
            </span>
          </div>

          {isOneOfOne ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-archive-red px-2.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.16em] text-white uppercase shadow-[0_4px_12px_rgba(225,29,46,0.28)]">
              1 OF 1 SEAL
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-klein/20 bg-klein/6 px-2.5 py-0.5 font-mono text-[9px] font-semibold tracking-[0.15em] text-klein uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-klein" />
              {product.remainingUnits}/{product.totalUnits} LEFT
            </span>
          )}
        </div>

        {/* Studio Print Photograph */}
        <div className="relative flex-1 overflow-hidden rounded-[18px] bg-linen">
          <Image
            src={product.imageUrl || "/images/hero-editorial-light.jpg"}
            alt={product.title}
            fill
            priority
            draggable={false}
            sizes="(max-width: 1024px) 90vw, 440px"
            className="pointer-events-none object-cover object-center"
          />

          {/* Subtle Gallery Vignette for crisp badge contrast */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />

          {/* Directional Drag Cues */}
          <motion.div
            style={{ opacity: rightCueOpacity }}
            className="pointer-events-none absolute top-4 left-4 rounded-full border border-white/50 bg-klein/90 px-3 py-1 font-mono text-[10px] font-bold tracking-[0.18em] text-white uppercase backdrop-blur-md"
          >
            FLIP NEXT →
          </motion.div>

          <motion.div
            style={{ opacity: leftCueOpacity }}
            className="pointer-events-none absolute top-4 right-4 rounded-full border border-white/50 bg-ink/85 px-3 py-1 font-mono text-[10px] font-bold tracking-[0.18em] text-white uppercase backdrop-blur-md"
          >
            ← NEXT PRINT
          </motion.div>

          {/* Bottom-left Quick Inspect chip */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onInspect(product);
            }}
            className="absolute right-3 bottom-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/40 bg-white/88 px-3 py-1.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-ink uppercase shadow-sm backdrop-blur-md transition-colors hover:bg-klein hover:text-white"
          >
            <Eye className="h-3 w-3" />
            INSPECT
          </button>
        </div>

        {/* Matte Polaroid Caption Footer */}
        <div className="mt-3 flex items-baseline justify-between gap-3 px-0.5">
          <div className="min-w-0">
            <h3 className="truncate font-syne text-base font-bold tracking-tight text-ink">
              {product.title}
            </h3>
            <p className="truncate font-editorial text-sm italic text-[#64625D]">
              {product.fabric}
            </p>
          </div>
          <span className="shrink-0 font-mono text-sm font-semibold text-ink">
            {formatInr(product.priceInr)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function V2HeroDeck({
  drop,
  products,
  onOpenProduct,
}: V2HeroDeckProps) {
  const revealedProducts = useMemo(() => {
    const openOnes = products.filter((p) => !p.isMystery);
    if (openOnes.length >= 2) return openOnes.slice(0, 5);
    return products.slice(0, 5);
  }, [products]);

  const [deckIds, setDeckIds] = useState<string[]>(() =>
    revealedProducts.map((p) => p._id)
  );
  const [exitDirection, setExitDirection] = useState<1 | -1>(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setDeckIds(revealedProducts.map((p) => p._id));
  }, [revealedProducts]);

  const orderedDeck = useMemo(() => {
    const byId = new Map(revealedProducts.map((p) => [p._id, p]));
    const resolved = deckIds
      .map((id) => byId.get(id))
      .filter((item): item is Product => Boolean(item));
    return resolved.length > 0 ? resolved : revealedProducts;
  }, [deckIds, revealedProducts]);

  const activeProduct = orderedDeck[0] ?? revealedProducts[0];
  const activeOriginalIndex = useMemo(() => {
    if (!activeProduct) return 0;
    const idx = revealedProducts.findIndex((p) => p._id === activeProduct._id);
    return idx >= 0 ? idx : 0;
  }, [activeProduct, revealedProducts]);

  const cycleDeck = useCallback((direction: 1 | -1) => {
    setExitDirection(direction);
    setDeckIds((prev) => {
      if (prev.length <= 1) return prev;
      const [first, ...rest] = prev;
      return [...rest, first];
    });
  }, []);

  // Mouse parallax for monumental KNITX wordmark & swinging woven neck tag
  const mouseNormX = useMotionValue(0);
  const mouseNormY = useMotionValue(0);
  const tagAngle = useMotionValue(0);
  const tagImpulseRef = useRef(0);
  const latestNormXRef = useRef(0);

  const smoothBgX = useSpring(
    useTransform(mouseNormX, [-1, 1], [-28, 28]),
    { stiffness: 55, damping: 22 }
  );
  const smoothBgY = useSpring(
    useTransform(mouseNormY, [-1, 1], [-14, 14]),
    { stiffness: 55, damping: 22 }
  );

  const smoothTagRotate = useSpring(tagAngle, {
    stiffness: 85,
    damping: 8,
    mass: 0.95,
  });

  const handleStageMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      latestNormXRef.current = nx;
      mouseNormX.set(nx);
      mouseNormY.set(ny);
      tagAngle.set(nx * -7.5 + tagImpulseRef.current);
    },
    [mouseNormX, mouseNormY, tagAngle]
  );

  const handleStageMouseLeave = useCallback(() => {
    latestNormXRef.current = 0;
    tagImpulseRef.current = 0;
    mouseNormX.set(0);
    mouseNormY.set(0);
    tagAngle.set(0);
  }, [mouseNormX, mouseNormY, tagAngle]);

  const triggerTagSwing = useCallback(() => {
    tagImpulseRef.current = 11;
    tagAngle.set(latestNormXRef.current * -7.5 + 11);
    window.setTimeout(() => {
      tagImpulseRef.current = -6;
      tagAngle.set(latestNormXRef.current * -7.5 - 6);
    }, 180);
    window.setTimeout(() => {
      tagImpulseRef.current = 0;
      tagAngle.set(latestNormXRef.current * -7.5);
    }, 420);
  }, [tagAngle]);

  const totalPrints = Math.max(revealedProducts.length, 1);
  const currentPrintLabel = String(activeOriginalIndex + 1).padStart(2, "0");
  const totalPrintsLabel = String(totalPrints).padStart(2, "0");

  return (
    <section
      id="deck"
      onMouseMove={handleStageMouseMove}
      onMouseLeave={handleStageMouseLeave}
      className="relative min-h-screen overflow-hidden bg-porcelain pt-28 pb-20 sm:pt-32 sm:pb-24"
    >
      {/* Soft Sunlit Exhibition Daylight Wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 76% 24%, rgba(0, 43, 255, 0.045) 0%, transparent 45%), radial-gradient(circle at 18% 72%, rgba(241, 239, 234, 0.9) 0%, transparent 55%)",
        }}
      />

      {/* GIANT BACKGROUND SCULPTURAL TYPOGRAPHY WITH SUBTLE PARALLAX */}
      <motion.div
        aria-hidden="true"
        style={{ x: smoothBgX, y: smoothBgY }}
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center select-none"
      >
        <span className="font-syne text-[24vw] leading-[0.82] font-extrabold tracking-[-0.045em] text-ink/[0.045] whitespace-nowrap">
          KNITX
        </span>
      </motion.div>

      {/* SWINGING PHYSICAL WOVEN NECK TAG ON COTTON THREAD */}
      <div className="pointer-events-none absolute top-0 right-6 z-20 hidden sm:right-12 md:block lg:right-16">
        <motion.div
          style={{ rotate: smoothTagRotate, transformOrigin: "top center" }}
          onMouseEnter={triggerTagSwing}
          className="pointer-events-auto flex flex-col items-center cursor-pointer"
        >
          {/* Cotton suspension thread */}
          <div className="h-24 w-px bg-gradient-to-b from-ink/10 via-ink/35 to-ink/50 lg:h-28" />

          {/* Woven Twill Garment Label */}
          <div className="relative w-44 rounded-[14px] border border-ink/14 bg-white p-2.5 shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
            {/* Brass / Porcelain Stitched Eyelet */}
            <div className="mx-auto -mt-4 mb-2 flex h-4 w-4 items-center justify-center rounded-full border border-ink/25 bg-porcelain shadow-inner">
              <span className="h-1.5 w-1.5 rounded-full bg-ink/45" />
            </div>

            {/* Inner Stitched Woven Border */}
            <div className="rounded-[9px] border border-dashed border-ink/15 bg-porcelain/70 px-2.5 py-2.5 text-center">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-syne text-[10px] font-extrabold tracking-tight text-ink">
                  KNITX®
                </span>
                <span className="h-1.5 w-5 rounded-full bg-klein" />
              </div>

              <p className="font-mono text-[8.5px] leading-relaxed font-semibold tracking-[0.14em] text-ink uppercase">
                EDITION 01/04
              </p>
              <p className="font-mono text-[8px] leading-relaxed tracking-[0.14em] text-[#64625D] uppercase">
                450 GSM · ZERO DEADSTOCK
              </p>

              <div className="mt-2 flex items-center justify-center gap-0.5 opacity-45">
                <span className="h-2.5 w-[2px] bg-ink" />
                <span className="h-2.5 w-[1px] bg-ink" />
                <span className="h-2.5 w-[3px] bg-ink" />
                <span className="h-2.5 w-[1px] bg-ink" />
                <span className="h-2.5 w-[2px] bg-ink" />
                <span className="h-2.5 w-[1px] bg-ink" />
                <span className="h-2.5 w-[3px] bg-ink" />
                <span className="h-2.5 w-[1px] bg-ink" />
                <span className="h-2.5 w-[2px] bg-ink" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* MAIN EXHIBITION STAGE */}
      <div className="relative z-10 mx-auto max-w-[1380px] px-5 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-10">
          {/* LEFT COL: AVANT-GARDE EDITORIAL TYPOGRAPHY */}
          <div className="lg:col-span-6">
            {/* Micro-pill */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mb-7 inline-flex items-center gap-2 rounded-full border border-ink/12 bg-white/90 px-3.5 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] backdrop-blur-md"
            >
              <span className="h-2 w-2 rounded-full bg-klein" />
              <span className="font-mono text-[10px] font-semibold tracking-[0.2em] text-ink uppercase">
                DROP {drop.dropNumber || "01"} · WAITLIST ONLY · NO OPEN STORE
              </span>
            </motion.div>

            {/* Headline mixing Syne & Italic Instrument Serif */}
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.65,
                delay: 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-[2.85rem] leading-[0.98] tracking-[-0.03em] text-ink sm:text-[3.9rem] xl:text-[4.65rem]"
            >
              <span className="block">
                <span className="font-syne font-extrabold">Rare by </span>
                <span className="font-editorial font-normal italic text-ink">
                  design.
                </span>
              </span>
              <span className="mt-1 block">
                <span className="font-syne font-extrabold">Built only </span>
                <span className="font-editorial font-normal italic text-klein">
                  when claimed.
                </span>
              </span>
            </motion.h1>

            {/* Concise Gallery Manifesto Note */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.16,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-6 max-w-lg text-[15px] leading-relaxed text-[#64625D] sm:text-base"
            >
              Five garments hang open in daylight. Five stay zipped inside
              sealed archive bags until your waitlist key clears. Numbered
              Indian studio editions — cut and sewn strictly after claim.
            </motion.p>

            {/* 3-Stat Horizontal Hairline Ledger */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.22,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-8 grid max-w-lg grid-cols-3 divide-x divide-ink/10 border-y border-ink/10 py-4"
            >
              <div className="pr-3">
                <p className="font-syne text-sm font-extrabold tracking-tight text-ink sm:text-base">
                  10 PIECES
                </p>
                <p className="mt-0.5 font-mono text-[9.5px] tracking-[0.16em] text-[#64625D] uppercase">
                  DROP 01 ROOM
                </p>
              </div>
              <div className="px-3 sm:px-4">
                <p className="font-syne text-sm font-extrabold tracking-tight text-ink sm:text-base">
                  3–4 SMALL-BATCH
                </p>
                <p className="mt-0.5 font-mono text-[9.5px] tracking-[0.16em] text-[#64625D] uppercase">
                  NUMBERED RUNS
                </p>
              </div>
              <div className="pl-3 sm:pl-4">
                <p className="font-syne text-sm font-extrabold tracking-tight text-archive-red sm:text-base">
                  2 ONE-OF-ONES
                </p>
                <p className="mt-0.5 font-mono text-[9.5px] tracking-[0.16em] text-[#64625D] uppercase">
                  ARCHIVE SEALS
                </p>
              </div>
            </motion.div>

            {/* 2 Fluid Pill CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.28,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <motion.a
                href="#vault-gate"
                whileHover={{ y: -2, scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="inline-flex items-center gap-2.5 rounded-full bg-klein px-6 py-3.5 font-mono text-[11px] font-semibold tracking-[0.16em] text-white uppercase shadow-[0_12px_30px_rgba(0,43,255,0.28)] transition-colors hover:bg-ink"
              >
                <span>CLAIM WAITLIST KEY</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </motion.a>

              <motion.a
                href="#rack"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.985 }}
                className="inline-flex items-center gap-2.5 rounded-full border border-ink/15 bg-white px-6 py-3.5 font-mono text-[11px] font-semibold tracking-[0.16em] text-ink uppercase shadow-[0_6px_20px_rgba(0,0,0,0.04)] transition-colors hover:border-ink/35 hover:bg-linen"
              >
                <span>SLIDE GARMENT RACK</span>
                <ArrowDown className="h-3.5 w-3.5" />
              </motion.a>
            </motion.div>

            {/* Exhibition Floor Provenance Footnote */}
            <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[10px] tracking-[0.18em] text-[#64625D] uppercase">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-klein" />
                {mounted
                  ? `${drop.waitlistCount.toLocaleString("en-IN")} IN WAITLIST QUEUE`
                  : `${drop.waitlistCount} IN WAITLIST QUEUE`}
              </span>
              <span className="text-ink/25">·</span>
              <span>PAN-INDIA STUDIO DISPATCH</span>
            </div>
          </div>

          {/* RIGHT COL: INTERACTIVE DRAGGABLE POLAROID / LOOKBOOK STACK */}
          <div className="flex flex-col items-center lg:col-span-6 lg:items-end">
            <div className="w-full max-w-[430px]">
              {/* Animated Drag Hint Header */}
              <div className="mb-4 flex items-center justify-between px-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/85 px-3 py-1 shadow-xs backdrop-blur-sm">
                  <motion.span
                    animate={{ x: [-2, 2, -2] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.9,
                      ease: "easeInOut",
                    }}
                    className="inline-flex text-klein"
                  >
                    <MoveHorizontal className="h-3.5 w-3.5" />
                  </motion.span>
                  <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#64625D] uppercase">
                    DRAG PRINT TO FLIP · {currentPrintLabel} / {totalPrintsLabel}
                  </span>
                </div>

                <span className="font-mono text-[10px] tracking-[0.16em] text-[#64625D] uppercase">
                  STUDIO PRINTS
                </span>
              </div>

              {/* Physical Stacked Studio Print Deck */}
              <div className="relative mx-auto h-[490px] w-full sm:h-[530px]">
                {/* Background stacked prints (indices 1..4) */}
                {orderedDeck
                  .slice(1, 5)
                  .reverse()
                  .map((product, revIdx, arr) => {
                    const depth = arr.length - revIdx;
                    const pose =
                      STACK_TRANSFORMS[
                        Math.min(depth, STACK_TRANSFORMS.length - 1)
                      ];

                    return (
                      <motion.div
                        key={product._id}
                        layout
                        animate={{
                          rotate: pose.rotate,
                          x: pose.x,
                          y: pose.y,
                          scale: pose.scale,
                          opacity: Math.max(0.55, 1 - depth * 0.12),
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 260,
                          damping: 26,
                        }}
                        style={{ zIndex: 20 - depth }}
                        className="pointer-events-none absolute inset-0"
                      >
                        <div className="flex h-full w-full flex-col overflow-hidden rounded-[26px] border border-ink/10 bg-white p-3.5 shadow-[0_18px_45px_rgba(0,0,0,0.06)] sm:p-4">
                          <div className="mb-2.5 flex items-center justify-between px-0.5 opacity-60">
                            <span className="font-mono text-[10px] tracking-[0.18em] text-[#64625D] uppercase">
                              {product.serialCode}
                            </span>
                            <span className="font-mono text-[10px] tracking-[0.14em] text-[#64625D] uppercase">
                              {product.gsmWeight}
                            </span>
                          </div>
                          <div className="relative flex-1 overflow-hidden rounded-[18px] bg-linen">
                            <Image
                              src={
                                product.imageUrl ||
                                "/images/hero-editorial-light.jpg"
                              }
                              alt={product.title}
                              fill
                              sizes="(max-width: 1024px) 90vw, 440px"
                              className="object-cover object-center"
                            />
                          </div>
                          <div className="mt-3 flex items-baseline justify-between px-0.5 opacity-60">
                            <span className="truncate font-syne text-base font-bold text-ink">
                              {product.title}
                            </span>
                            <span className="font-mono text-sm font-semibold text-ink">
                              {formatInr(product.priceInr)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                {/* Active Draggable Top Print */}
                <AnimatePresence mode="popLayout" initial={false}>
                  {activeProduct ? (
                    <DraggableTopPrint
                      key={activeProduct._id}
                      product={activeProduct}
                      exitDirection={exitDirection}
                      onDismiss={cycleDeck}
                      onInspect={onOpenProduct}
                    />
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Deck Live Readout + Action Controls */}
              {activeProduct ? (
                <div className="mt-8 flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white/85 px-4 py-3 shadow-[0_10px_28px_rgba(0,0,0,0.04)] backdrop-blur-md">
                  <div className="min-w-0">
                    <p className="font-mono text-[9.5px] tracking-[0.18em] text-[#64625D] uppercase">
                      NOW VIEWING · {activeProduct.serialCode}
                    </p>
                    <p className="mt-0.5 truncate font-syne text-sm font-bold text-ink">
                      {activeProduct.title}{" "}
                      <span className="font-mono font-medium text-klein">
                        {formatInr(activeProduct.priceInr)}
                      </span>
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenProduct(activeProduct)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-ink/14 bg-porcelain px-3.5 py-2 font-mono text-[10px] font-semibold tracking-[0.14em] text-ink uppercase transition-colors hover:border-ink/35 hover:bg-linen"
                    >
                      INSPECT
                    </button>

                    <button
                      type="button"
                      onClick={() => cycleDeck(1)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 font-mono text-[10px] font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:bg-klein"
                    >
                      <span>NEXT PRINT</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Minimal Print Progress Pips */}
              <div className="mt-3 flex items-center justify-center gap-1.5">
                {revealedProducts.map((item, idx) => {
                  const isCurrent = activeProduct?._id === item._id;
                  return (
                    <span
                      key={item._id}
                      aria-label={`Print ${idx + 1}`}
                      className={cn(
                        "h-1 rounded-full transition-all duration-300",
                        isCurrent ? "w-6 bg-klein" : "w-1.5 bg-ink/18"
                      )}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
