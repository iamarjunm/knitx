"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, Lock, Sparkles, X } from "lucide-react";
import { useVault } from "@/context/VaultContext";
import type { Product } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";

type GalleryFilter = "all" | "revealed" | "veiled";

interface V5CurtainGalleryProps {
  products: Product[];
  onInspectProduct: (product: Product) => void;
}

interface V5GarmentDrawerProps {
  product: Product | null;
  onClose: () => void;
}

const SILK_SPRING = {
  type: "spring" as const,
  stiffness: 70,
  damping: 22,
  mass: 1.05,
};

const PLEAT_GRADIENT_LEFT =
  "linear-gradient(90deg, rgba(243,239,234,0.96) 0%, rgba(255,255,255,0.92) 18%, rgba(235,229,221,0.88) 38%, rgba(255,255,255,0.94) 60%, rgba(241,236,229,0.9) 82%, rgba(255,255,255,0.97) 100%)";

const PLEAT_GRADIENT_RIGHT =
  "linear-gradient(270deg, rgba(243,239,234,0.96) 0%, rgba(255,255,255,0.92) 18%, rgba(235,229,221,0.88) 38%, rgba(255,255,255,0.94) 60%, rgba(241,236,229,0.9) 82%, rgba(255,255,255,0.97) 100%)";

interface SilkCurtainFrameProps {
  product: Product;
  isLocked: boolean;
  wasUnveiled: boolean;
  aspectClass: string;
  onAction: () => void;
}

function SilkCurtainFrame({
  product,
  isLocked,
  wasUnveiled,
  aspectClass,
  onAction,
}: SilkCurtainFrameProps) {
  const [hovered, setHovered] = useState(false);
  const [partBias, setPartBias] = useState(0);

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isLocked) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const normalizedX = (event.clientX - rect.left) / rect.width; // 0..1
    // Gentle distance from center shifts curtain aperture slightly for organic silk feel
    const distanceFromCenter = Math.abs(normalizedX - 0.5) * 2; // 0..1
    setPartBias(Math.round((1 - distanceFromCenter) * 4));
  };

  // Curtain choreography:
  // Unlocked -> glides 100% open (-105% / +105%)
  // Locked + hover -> parts gracefully (-22% / +22%, subtly breathing with pointer)
  // Locked + idle -> softly closed (0% / 0%)
  const leftTargetX = !isLocked
    ? "-105%"
    : hovered
      ? `-${22 + partBias}%`
      : "0%";

  const rightTargetX = !isLocked
    ? "105%"
    : hovered
      ? `${22 + partBias}%`
      : "0%";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPartBias(0);
      }}
      onMouseMove={handlePointerMove}
      onClick={onAction}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAction();
        }
      }}
      aria-label={
        isLocked
          ? `${product.serialCode} behind silk veil — request invitation`
          : `Inspect ${product.title}`
      }
      className={cn(
        "group relative w-full cursor-pointer overflow-hidden bg-plaster outline-none focus-visible:ring-1 focus-visible:ring-terracotta",
        aspectClass
      )}
    >
      {/* Underlying Exhibition Image */}
      <img
        src={isLocked ? "/images/look-mystery-veil.jpg" : product.imageUrl}
        alt={
          isLocked
            ? `Veiled silhouette for ${product.serialCode}`
            : product.title
        }
        loading="lazy"
        className={cn(
          "h-full w-full object-cover object-center transition-transform duration-1000 ease-out",
          isLocked
            ? "scale-105 opacity-95 group-hover:scale-100"
            : "group-hover:scale-[1.035]"
        )}
      />

      {/* Interactive Parting Silk-Gauze Curtains (rendered for mystery pieces so they glide 100% open upon unlock) */}
      {product.isMystery && (
        <>
          {/* Left Silk-Gauze Panel */}
          <motion.div
            initial={false}
            animate={{ x: leftTargetX }}
            transition={SILK_SPRING}
            style={{ backgroundImage: PLEAT_GRADIENT_LEFT }}
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/2 border-r border-champagne/90 backdrop-blur-md"
          >
            <div className="absolute inset-0 bg-plaster/35" />
            <div className="absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-umber/[0.05] to-transparent" />
          </motion.div>

          {/* Right Silk-Gauze Panel */}
          <motion.div
            initial={false}
            animate={{ x: rightTargetX }}
            transition={SILK_SPRING}
            style={{ backgroundImage: PLEAT_GRADIENT_RIGHT }}
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-1/2 border-l border-champagne/90 backdrop-blur-md"
          >
            <div className="absolute inset-0 bg-plaster/35" />
            <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-umber/[0.05] to-transparent" />
          </motion.div>

          {/* Centered Embossed Terracotta Wax Seal when Locked */}
          <AnimatePresence>
            {isLocked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{
                  opacity: 1,
                  scale: hovered ? 0.96 : 1,
                }}
                exit={{ opacity: 0, scale: 0.88 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-terracotta/30 bg-terracotta text-plaster shadow-[0_14px_32px_-12px_rgba(168,75,47,0.62)] ring-4 ring-plaster/75">
                  <Lock className="h-4 w-4 stroke-[1.5]" />
                </div>
                <span className="mt-4 rounded-full border border-champagne bg-plaster/92 px-4 py-1.5 font-sans text-[10px] font-medium tracking-[0.22em] text-terracotta uppercase backdrop-blur-md">
                  Private Invitation Required
                </span>
                <span className="mt-2 font-editorial text-sm italic text-umber/75 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  Hover to glimpse · Click to request key
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Embossed Unveiled Caption when Vault is Open */}
          <AnimatePresence>
            {wasUnveiled && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.65, delay: 0.15 }}
                className="pointer-events-none absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-champagne/90 bg-plaster/92 px-3.5 py-1 backdrop-blur-md"
              >
                <Sparkles className="h-3 w-3 text-terracotta stroke-[1.6]" />
                <span className="font-sans text-[10px] font-medium tracking-[0.22em] text-terracotta uppercase">
                  Unveiled
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Subtle Inspection Cue on Unlocked Works */}
      {!isLocked && (
        <div className="pointer-events-none absolute right-4 bottom-4 z-10 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full border border-champagne bg-plaster/92 text-umber opacity-0 backdrop-blur-md transition-all duration-400 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4 stroke-[1.5]" />
        </div>
      )}
    </div>
  );
}

export default function V5CurtainGallery({
  products,
  onInspectProduct,
}: V5CurtainGalleryProps) {
  const { isVaultUnlocked } = useVault();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<GalleryFilter>("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  const unlocked = mounted && isVaultUnlocked;

  const oneOfOnePieces = useMemo(
    () => products.filter((p) => p.tier === "one-of-one"),
    [products]
  );

  const smallBatchPieces = useMemo(
    () => products.filter((p) => p.tier === "small-batch"),
    [products]
  );

  const filteredSmallBatch = useMemo(() => {
    if (filter === "all") return smallBatchPieces;
    if (filter === "revealed") {
      return smallBatchPieces.filter((p) => !p.isMystery || unlocked);
    }
    return smallBatchPieces.filter((p) => p.isMystery);
  }, [filter, smallBatchPieces, unlocked]);

  const scrollToEnvelope = () => {
    const el = document.getElementById("envelope");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePieceSelect = (product: Product) => {
    const isLocked = product.isMystery && !unlocked;
    if (isLocked) {
      scrollToEnvelope();
      return;
    }
    onInspectProduct(product);
  };

  const filterTabs: { id: GalleryFilter; label: string; count: number }[] = [
    { id: "all", label: "All Ten", count: products.length },
    {
      id: "revealed",
      label: "Revealed",
      count: products.filter((p) => !p.isMystery || unlocked).length,
    },
    {
      id: "veiled",
      label: "Behind the Veil",
      count: products.filter((p) => p.isMystery).length,
    },
  ];

  return (
    <section
      id="curtain-gallery"
      className="border-t border-champagne bg-travertine/55 py-28 sm:py-36"
    >
      <div className="mx-auto max-w-[1380px] px-6 sm:px-10 lg:px-14">
        {/* ============================================================ */}
        {/* HALL I — ONE-OF-ONE COLLECTOR'S ARCHIVE                      */}
        {/* ============================================================ */}
        <div className="flex flex-col justify-between gap-6 border-b border-champagne pb-10 md:flex-row md:items-end">
          <div>
            <p className="font-sans text-[11px] font-medium tracking-[0.26em] text-terracotta uppercase">
              Hall I · Collector&apos;s Archive
            </p>
            <h2 className="mt-3 font-editorial text-5xl leading-[0.95] text-umber sm:text-6xl lg:text-7xl">
              One-of-One <span className="italic">Plinths</span>
            </h2>
          </div>
          <p className="max-w-md font-sans text-sm leading-relaxed text-muted">
            Two singular silhouettes crafted once and never repeated. Numbered
            by hand, accompanied by archival provenance, and released strictly
            to one custodian in India.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          {oneOfOnePieces.map((piece, idx) => {
            const isLocked = piece.isMystery && !unlocked;
            const wasUnveiled = piece.isMystery && unlocked;

            return (
              <motion.article
                key={piece._id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.85,
                  delay: idx * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex flex-col bg-plaster p-5 transition-shadow duration-500 hover:shadow-[0_28px_70px_-42px_rgba(28,25,23,0.25)] sm:p-7"
              >
                {/* Plinth Header */}
                <div className="mb-5 flex items-center justify-between border-b border-champagne pb-3.5">
                  <span className="font-sans text-[10px] font-medium tracking-[0.24em] text-terracotta uppercase">
                    01 / 01 · Singular Edition
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
                    {piece.serialCode}
                  </span>
                </div>

                {/* Tall Architectural Plinth Frame */}
                <SilkCurtainFrame
                  product={piece}
                  isLocked={isLocked}
                  wasUnveiled={wasUnveiled}
                  aspectClass="aspect-[4/5]"
                  onAction={() => handlePieceSelect(piece)}
                />

                {/* Museum Wall Plaque */}
                <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <h3 className="font-editorial text-3xl leading-tight text-umber sm:text-4xl">
                      {isLocked ? "Veiled Archive Edition" : piece.title}
                    </h3>
                    <p className="mt-1.5 font-sans text-xs tracking-[0.06em] text-muted">
                      {isLocked
                        ? "Reserved behind silk until invitation is verified"
                        : `${piece.fabric} · ${piece.gsmWeight}`}
                    </p>
                  </div>

                  <div className="flex items-baseline justify-between gap-5 sm:flex-col sm:items-end sm:gap-1">
                    <span className="font-editorial text-2xl text-umber sm:text-3xl">
                      {formatInr(piece.priceInr)}
                    </span>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => handlePieceSelect(piece)}
                      className="font-sans text-[10px] font-medium tracking-[0.22em] text-terracotta uppercase transition-opacity hover:opacity-75"
                    >
                      {isLocked ? "Request Access" : "Inspect Monograph"}
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* HALL II — SMALL-BATCH EDITIONS + PARTING SILK CURTAINS       */}
        {/* ============================================================ */}
        <div className="mt-32 flex flex-col justify-between gap-8 border-b border-champagne pb-8 lg:flex-row lg:items-end">
          <div>
            <p className="font-sans text-[11px] font-medium tracking-[0.26em] text-muted uppercase">
              Hall II · Small-Batch Editions (3–4 Units)
            </p>
            <h2 className="mt-3 font-editorial text-5xl leading-[0.95] text-umber sm:text-6xl">
              The Draped <span className="italic">Gallery</span>
            </h2>
          </div>

          {/* Minimalist Underline Filter */}
          <div
            role="tablist"
            aria-label="Filter collection works"
            className="flex flex-wrap items-center gap-7 sm:gap-9"
          >
            {filterTabs.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  suppressHydrationWarning
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    "relative pb-2.5 font-sans text-[11px] font-medium tracking-[0.22em] uppercase transition-colors duration-300 focus:outline-none",
                    active ? "text-umber" : "text-muted hover:text-umber"
                  )}
                >
                  <span>{tab.label}</span>
                  <span className="ml-2 font-mono text-[10px] text-muted/80">
                    {String(tab.count).padStart(2, "0")}
                  </span>
                  {active && (
                    <motion.span
                      layoutId="v5-gallery-filter-underline"
                      transition={{
                        type: "spring",
                        stiffness: 360,
                        damping: 32,
                      }}
                      className="absolute inset-x-0 bottom-0 h-px bg-terracotta"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Vault Status Whisper Note */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <p className="font-sans tracking-[0.02em]">
            {unlocked
              ? "Your private key has parted every silk veil across Drop 01."
              : "Five works remain draped behind ivory silk gauze. Hover to glimpse the silhouette, or unlock your invitation below."}
          </p>
          {!unlocked && (
            <button
              type="button"
              suppressHydrationWarning
              onClick={scrollToEnvelope}
              className="border-b border-terracotta pb-0.5 font-sans text-[10px] font-medium tracking-[0.22em] text-terracotta uppercase transition-opacity hover:opacity-75"
            >
              Open Invitation Desk
            </button>
          )}
        </div>

        {/* Asymmetrical Museum Masonry Grid */}
        <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-16 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-12 lg:gap-y-24">
          {filteredSmallBatch.map((piece, index) => {
            const isLocked = piece.isMystery && !unlocked;
            const wasUnveiled = piece.isMystery && unlocked;

            // Sculptural asymmetrical gallery cadence on desktop
            const staggerClass =
              index % 3 === 1
                ? "lg:mt-14"
                : index % 3 === 2
                  ? "lg:mt-6"
                  : "";

            const aspectClass =
              index % 2 === 0 ? "aspect-[3/4]" : "aspect-[4/5]";

            return (
              <motion.article
                key={piece._id}
                layout
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.8,
                  delay: (index % 3) * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={cn("flex flex-col", staggerClass)}
              >
                <div className="border border-champagne/90 bg-plaster p-3.5 transition-shadow duration-500 hover:shadow-[0_24px_60px_-40px_rgba(28,25,23,0.22)] sm:p-4">
                  <SilkCurtainFrame
                    product={piece}
                    isLocked={isLocked}
                    wasUnveiled={wasUnveiled}
                    aspectClass={aspectClass}
                    onAction={() => handlePieceSelect(piece)}
                  />
                </div>

                {/* Minimalist Wall Label */}
                <div className="mt-5 flex items-start justify-between gap-4 border-t border-champagne pt-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
                        {piece.serialCode}
                      </span>
                      <span className="text-champagne">·</span>
                      <span
                        className={cn(
                          "font-sans text-[10px] tracking-[0.2em] uppercase",
                          isLocked ? "text-terracotta" : "text-muted"
                        )}
                      >
                        {isLocked
                          ? "Behind the Veil"
                          : `${piece.remainingUnits} of ${piece.totalUnits} left`}
                      </span>
                    </div>

                    <h3 className="mt-1.5 truncate font-editorial text-2xl leading-snug text-umber sm:text-[1.75rem]">
                      {isLocked ? "Unrevealed Silhouette" : piece.title}
                    </h3>

                    <p className="mt-1 font-sans text-xs text-muted">
                      {isLocked
                        ? "Private salon viewing · Drop 01"
                        : `${piece.gsmWeight} · ${piece.fabric}`}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-editorial text-2xl text-umber">
                      {formatInr(piece.priceInr)}
                    </p>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => handlePieceSelect(piece)}
                      className="mt-1 font-sans text-[10px] font-medium tracking-[0.2em] text-umber uppercase underline decoration-champagne underline-offset-4 transition-colors hover:text-terracotta hover:decoration-terracotta"
                    >
                      {isLocked ? "Unlock" : "View"}
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * V5GarmentDrawer — Ultra-Serene Right-Hand Museum Slide-Over
 * ========================================================================== */
export function V5GarmentDrawer({ product, onClose }: V5GarmentDrawerProps) {
  const { addToCart, setCartOpen } = useVault();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0] || "M");
      setFeedback(null);
    }
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [product, onClose]);

  const handleReserve = () => {
    if (!product) return;
    const chosenSize = selectedSize || product.sizes[0] || "M";
    const result = addToCart(product, chosenSize);

    if (!result.ok) {
      setFeedback({
        type: "error",
        text: result.message || "Unable to reserve this edition.",
      });
      return;
    }

    setFeedback({
      type: "success",
      text: `Reserved size ${chosenSize} in your private bag.`,
    });
    setCartOpen(true);
    onClose();
  };

  return (
    <AnimatePresence>
      {product && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label={product.title}
        >
          {/* Quiet Frosted Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={onClose}
            className="fixed inset-0 bg-umber/28 backdrop-blur-xs"
          />

          {/* Right-Hand Museum Monograph Slide-Over */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-champagne bg-plaster shadow-[-24px_0_80px_-32px_rgba(28,25,23,0.22)]"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-champagne px-7 py-5 sm:px-9">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] tracking-[0.22em] text-terracotta uppercase">
                  {product.serialCode}
                </span>
                <span className="text-champagne">·</span>
                <span className="font-sans text-[10px] tracking-[0.22em] text-muted uppercase">
                  {product.tier === "one-of-one"
                    ? "01 / 01 Singular Edition"
                    : `Batch of ${product.totalUnits}`}
                </span>
              </div>

              <button
                type="button"
                suppressHydrationWarning
                onClick={onClose}
                aria-label="Close monograph"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-champagne text-umber transition-colors duration-300 hover:border-umber hover:bg-travertine focus:outline-none"
              >
                <X className="h-4 w-4 stroke-[1.5]" />
              </button>
            </div>

            {/* Scrollable Editorial Body */}
            <div className="flex-1 overflow-y-auto px-7 py-8 sm:px-9">
              {/* Tall Portrait Exhibition Frame */}
              <div className="overflow-hidden border border-champagne bg-travertine">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="aspect-[3/4] w-full object-cover object-center"
                />
              </div>

              {/* Title & Price */}
              <div className="mt-8 flex items-baseline justify-between gap-4 border-b border-champagne pb-6">
                <div>
                  <h2 className="font-editorial text-4xl leading-tight text-umber sm:text-[2.75rem]">
                    {product.title}
                  </h2>
                  {product.creatorCredit && (
                    <p className="mt-1.5 font-sans text-xs tracking-[0.14em] text-muted uppercase">
                      Atelier Study · {product.creatorCredit}
                    </p>
                  )}
                </div>
                <p className="shrink-0 font-editorial text-3xl text-umber">
                  {formatInr(product.priceInr)}
                </p>
              </div>

              {/* Delicate Craft Story */}
              <p className="mt-6 font-sans text-sm leading-7 text-muted">
                {product.description}
              </p>

              {/* Material Specifications */}
              <div className="mt-7 grid grid-cols-2 gap-6 border-t border-b border-champagne py-5">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
                    Textile
                  </p>
                  <p className="mt-1 font-sans text-sm text-umber">
                    {product.fabric}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
                    Density
                  </p>
                  <p className="mt-1 font-sans text-sm text-umber">
                    {product.gsmWeight}
                  </p>
                </div>
              </div>

              {/* Craftsmanship Notes */}
              {product.craftsmanship.length > 0 && (
                <div className="mt-7">
                  <p className="font-sans text-[10px] font-medium tracking-[0.24em] text-muted uppercase">
                    Atelier Notes
                  </p>
                  <ul className="mt-3.5 space-y-2.5">
                    {product.craftsmanship.map((note) => (
                      <li
                        key={note}
                        className="flex items-start gap-3 font-sans text-xs leading-relaxed text-umber"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-terracotta" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sample-First Production Note */}
              <div className="mt-8 border border-champagne bg-travertine/70 px-5 py-4">
                <p className="font-sans text-[10px] font-medium tracking-[0.22em] text-terracotta uppercase">
                  Sample-First Allocation · Pan-India Dispatch
                </p>
                <p className="mt-1.5 font-sans text-xs leading-relaxed text-muted">
                  Cut to order in {product.productionDays} days once reserved.
                  Zero deadstock, individually numbered inside the neck facing.
                </p>
              </div>

              {/* Tactile Size Selection */}
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[10px] font-medium tracking-[0.24em] text-muted uppercase">
                    Select Size
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.18em] text-terracotta uppercase">
                    {product.remainingUnits > 0
                      ? `${product.remainingUnits} of ${product.totalUnits} available`
                      : "Archive Claimed"}
                  </span>
                </div>

                <div className="mt-3.5 flex flex-wrap gap-2.5">
                  {product.sizes.map((size) => {
                    const active = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        suppressHydrationWarning
                        onClick={() => {
                          setSelectedSize(size);
                          setFeedback(null);
                        }}
                        className={cn(
                          "min-w-[54px] border px-4 py-2.5 font-sans text-xs font-medium tracking-[0.16em] uppercase transition-all duration-300 focus:outline-none",
                          active
                            ? "border-umber bg-umber text-plaster"
                            : "border-champagne bg-plaster text-umber hover:border-umber"
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {feedback && (
                <div
                  className={cn(
                    "mt-5 flex items-center gap-2 border px-4 py-3 font-sans text-xs",
                    feedback.type === "error"
                      ? "border-terracotta/40 bg-terracotta/5 text-terracotta"
                      : "border-champagne bg-travertine text-umber"
                  )}
                >
                  {feedback.type === "success" && (
                    <Check className="h-3.5 w-3.5 text-terracotta" />
                  )}
                  <span>{feedback.text}</span>
                </div>
              )}
            </div>

            {/* Sticky Footer Reservation CTA */}
            <div className="border-t border-champagne bg-plaster px-7 py-5 sm:px-9">
              <button
                type="button"
                suppressHydrationWarning
                disabled={product.remainingUnits <= 0}
                onClick={handleReserve}
                className={cn(
                  "w-full py-4 font-sans text-[11px] font-medium tracking-[0.24em] uppercase transition-colors duration-300 focus:outline-none",
                  product.remainingUnits <= 0
                    ? "cursor-not-allowed bg-champagne text-muted"
                    : "bg-umber text-plaster hover:bg-terracotta"
                )}
              >
                {product.remainingUnits <= 0
                  ? "Edition Claimed"
                  : `Reserve Piece — ${formatInr(product.priceInr)}`}
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
