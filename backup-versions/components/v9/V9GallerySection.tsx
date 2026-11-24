"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, Lock, Sparkles, X } from "lucide-react";
import { useVault } from "@/context/VaultContext";
import type { Product, ProductTier } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";

type GalleryFilter = "all" | "revealed" | "veiled";

interface V9GallerySectionProps {
  products: Product[];
  onInspectProduct: (p: Product) => void;
}

interface V9GarmentDrawerProps {
  product: Product | null;
  onClose: () => void;
}

const LEGACY_TO_LIGHT_IMAGE: Record<string, string> = {
  "/images/piece-1of1-kali.png": "/images/look-1of1-jacket.jpg",
  "/images/piece-1of1-monolith.png": "/images/look-1of1-knit.jpg",
  "/images/piece-batch-puff.png": "/images/look-batch-hoodie.jpg",
  "/images/piece-batch-embroidery.png": "/images/look-batch-tee.jpg",
  "/images/piece-mystery-silhouette.png": "/images/look-mystery-veil.jpg",
};

const LIGHT_FALLBACK_CYCLE = [
  "/images/look-1of1-jacket.jpg",
  "/images/look-1of1-knit.jpg",
  "/images/look-batch-hoodie.jpg",
  "/images/look-batch-tee.jpg",
];

function resolveGalleryImage(
  url: string | undefined,
  tier: ProductTier,
  index: number
): string {
  if (!url) {
    return tier === "one-of-one"
      ? LIGHT_FALLBACK_CYCLE[index % 2]
      : LIGHT_FALLBACK_CYCLE[2 + (index % 2)];
  }
  return LEGACY_TO_LIGHT_IMAGE[url] ?? url;
}

const SILK_SPRING = {
  type: "spring" as const,
  stiffness: 72,
  damping: 22,
  mass: 1.02,
};

const PLEAT_GRADIENT_LEFT =
  "linear-gradient(90deg, rgba(243,239,234,0.97) 0%, rgba(255,255,255,0.92) 20%, rgba(235,229,221,0.88) 42%, rgba(255,255,255,0.95) 64%, rgba(243,239,234,0.9) 84%, rgba(255,255,255,0.97) 100%)";

const PLEAT_GRADIENT_RIGHT =
  "linear-gradient(270deg, rgba(243,239,234,0.97) 0%, rgba(255,255,255,0.92) 20%, rgba(235,229,221,0.88) 42%, rgba(255,255,255,0.95) 64%, rgba(243,239,234,0.9) 84%, rgba(255,255,255,0.97) 100%)";

interface SilkCurtainFrameProps {
  product: Product;
  imageSrc: string;
  isLocked: boolean;
  wasUnveiled: boolean;
  aspectClass: string;
  roundedClass?: string;
  onAction: () => void;
}

function SilkCurtainFrame({
  product,
  imageSrc,
  isLocked,
  wasUnveiled,
  aspectClass,
  roundedClass,
  onAction,
}: SilkCurtainFrameProps) {
  const [hovered, setHovered] = useState(false);
  const [partBias, setPartBias] = useState(0);

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isLocked) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const normalizedX = (event.clientX - rect.left) / rect.width;
    const distanceFromCenter = Math.abs(normalizedX - 0.5) * 2;
    setPartBias(Math.round((1 - distanceFromCenter) * 5));
  };

  // Unlocked -> curtains glide 100% open (-106% / +106%)
  // Locked + hover -> silk panels gracefully part to reveal silhouette glimpse
  // Locked + idle -> closed ivory pleated silk-gauze veil
  const leftTargetX = !isLocked
    ? "-106%"
    : hovered
      ? `-${23 + partBias}%`
      : "0%";

  const rightTargetX = !isLocked
    ? "106%"
    : hovered
      ? `${23 + partBias}%`
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
          ? `${product.serialCode} behind silk veil — join waitlist to unlock`
          : `Inspect ${product.title}`
      }
      className={cn(
        "group relative w-full cursor-pointer overflow-hidden bg-travertine outline-none focus-visible:ring-2 focus-visible:ring-[#D9381E]",
        aspectClass,
        roundedClass
      )}
    >
      {/* Exhibition Image */}
      <img
        src={isLocked ? "/images/look-mystery-veil.jpg" : imageSrc}
        alt={
          isLocked
            ? `Veiled silhouette for ${product.serialCode}`
            : product.title
        }
        loading="lazy"
        className={cn(
          "h-full w-full object-cover object-center transition-transform duration-700 ease-out",
          isLocked
            ? "scale-105 opacity-95 group-hover:scale-100"
            : "group-hover:scale-[1.04]"
        )}
      />

      {/* Interactive Parting Ivory Silk-Gauze Curtains */}
      {product.isMystery && (
        <>
          <motion.div
            initial={false}
            animate={{ x: leftTargetX }}
            transition={SILK_SPRING}
            style={{ backgroundImage: PLEAT_GRADIENT_LEFT }}
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/2 border-r border-champagne/90 backdrop-blur-md"
          >
            <div className="absolute inset-0 bg-white/30" />
            <div className="absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-[#121110]/[0.05] to-transparent" />
          </motion.div>

          <motion.div
            initial={false}
            animate={{ x: rightTargetX }}
            transition={SILK_SPRING}
            style={{ backgroundImage: PLEAT_GRADIENT_RIGHT }}
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-1/2 border-l border-champagne/90 backdrop-blur-md"
          >
            <div className="absolute inset-0 bg-white/30" />
            <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-[#121110]/[0.05] to-transparent" />
          </motion.div>

          {/* Refined Embossed Terracotta Vermilion Seal while Locked */}
          <AnimatePresence>
            {isLocked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{
                  opacity: 1,
                  scale: hovered ? 0.95 : 1,
                }}
                exit={{ opacity: 0, scale: 0.88 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-5 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D9381E] text-white shadow-[0_14px_30px_-10px_rgba(217,56,30,0.55)] ring-4 ring-white/85">
                  <Lock className="h-4 w-4 stroke-[1.75]" />
                </div>
                <span className="mt-3.5 rounded-full border border-champagne bg-white/95 px-3.5 py-1.5 font-mono text-[9px] font-medium tracking-[0.18em] text-[#121110] uppercase backdrop-blur-md">
                  WAITLIST ONLY — CLEAR THE LINE
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quiet Unveiled Marker once Vault Opens */}
          <AnimatePresence>
            {wasUnveiled && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, delay: 0.15 }}
                className="pointer-events-none absolute top-3.5 left-3.5 z-10 inline-flex items-center gap-1.5 rounded-full border border-champagne bg-white/92 px-3 py-1 backdrop-blur-md"
              >
                <Sparkles className="h-3 w-3 text-[#D9381E] stroke-[1.75]" />
                <span className="font-mono text-[9px] font-medium tracking-[0.18em] text-[#D9381E] uppercase">
                  UNVEILED
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Subtle Inspection Cue on Hover for Unlocked Works */}
      {!isLocked && (
        <div className="pointer-events-none absolute right-3.5 bottom-3.5 z-10 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full border border-champagne bg-white/92 text-[#121110] opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4 stroke-[1.6]" />
        </div>
      )}
    </div>
  );
}

export default function V9GallerySection({
  products,
  onInspectProduct,
}: V9GallerySectionProps) {
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
    const el = document.getElementById("v9-envelope");
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

  const filterTabs: { id: GalleryFilter; label: string }[] = [
    { id: "all", label: `ALL ${products.length}` },
    { id: "revealed", label: "REVEALED" },
    { id: "veiled", label: "BEHIND THE VEIL" },
  ];

  return (
    <section
      id="v9-gallery"
      className="border-t border-champagne bg-travertine/55 py-28"
    >
      <div className="mx-auto max-w-[1380px] px-5 sm:px-10 lg:px-14">
        {/* ============================================================ */}
        {/* HALL I — ONE-OF-ONE ARCHIVE                                  */}
        {/* ============================================================ */}
        <div className="flex flex-col justify-between gap-4 border-b border-champagne pb-8 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-[10px] tracking-[0.24em] text-[#D9381E] uppercase">
              HALL I · COLLECTOR ARCHIVE
            </p>
            <h2 className="mt-2 font-poster text-5xl leading-[0.92] tracking-tight text-[#121110] uppercase sm:text-6xl">
              ONE-OF-ONE.
            </h2>
          </div>
          <p className="font-sans text-sm text-[#736E66]">
            Only 1 piece in the world · ₹5,000–₹10,000+
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
          {oneOfOnePieces.map((piece, idx) => {
            const isLocked = piece.isMystery && !unlocked;
            const wasUnveiled = piece.isMystery && unlocked;
            const resolvedSrc = resolveGalleryImage(
              piece.imageUrl,
              piece.tier,
              idx
            );

            return (
              <motion.article
                key={piece._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.7,
                  delay: idx * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="overflow-hidden rounded-2xl border border-champagne bg-white transition-shadow duration-500 hover:shadow-[0_28px_70px_-40px_rgba(18,17,16,0.2)]"
              >
                <div className="p-4 pb-0 sm:p-6 sm:pb-0">
                  <SilkCurtainFrame
                    product={piece}
                    imageSrc={resolvedSrc}
                    isLocked={isLocked}
                    wasUnveiled={wasUnveiled}
                    aspectClass="aspect-[4/5]"
                    roundedClass="rounded-xl"
                    onAction={() => handlePieceSelect(piece)}
                  />
                </div>

                <div className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-end sm:p-8">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] uppercase">
                      <span className="font-medium text-[#D9381E]">01/01</span>
                      <span className="text-champagne">·</span>
                      <span className="text-[#736E66]">{piece.serialCode}</span>
                    </div>
                    <h3 className="mt-2 truncate font-poster text-3xl leading-none tracking-tight text-[#121110] uppercase sm:text-4xl">
                      {isLocked ? "VEILED ARCHIVE EDITION" : piece.title}
                    </h3>
                    <p className="mt-2 font-sans text-xs text-[#736E66]">
                      {isLocked
                        ? "Waitlist invitation required to unveil"
                        : `${piece.gsmWeight} · ${piece.fabric}`}
                    </p>
                  </div>

                  <div className="flex items-baseline justify-between gap-4 sm:flex-col sm:items-end sm:gap-1.5">
                    <span className="font-poster text-2xl leading-none tracking-tight text-[#121110] sm:text-3xl">
                      {formatInr(piece.priceInr)}
                    </span>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => handlePieceSelect(piece)}
                      className="cursor-pointer font-sans text-[11px] font-medium tracking-[0.16em] text-[#D9381E] uppercase transition-opacity hover:opacity-75 focus:outline-none"
                    >
                      {isLocked ? "Unlock Access →" : "Inspect Piece →"}
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
        <div className="mt-28 flex flex-col justify-between gap-6 border-b border-champagne pb-7 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-[10px] tracking-[0.24em] text-[#736E66] uppercase">
              HALL II · LIMITED RUN
            </p>
            <h2 className="mt-2 font-poster text-5xl leading-[0.92] tracking-tight text-[#121110] uppercase sm:text-6xl">
              SMALL-BATCH.
            </h2>
            <p className="mt-2 font-sans text-sm text-[#736E66]">
              3–4 units per design · ₹2,500–₹4,000
            </p>
          </div>

          {/* Clean Underline Filter */}
          <div
            role="tablist"
            aria-label="Filter collection editions"
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
                    "relative cursor-pointer pb-2.5 font-sans text-xs font-medium tracking-[0.16em] uppercase transition-colors duration-300 focus:outline-none",
                    active
                      ? "text-[#121110]"
                      : "text-[#736E66] hover:text-[#121110]"
                  )}
                >
                  <span>{tab.label}</span>
                  {active && (
                    <motion.span
                      layoutId="v9-gallery-underline"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                      }}
                      className="absolute inset-x-0 bottom-0 h-[2px] bg-[#D9381E]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Breathable Museum Grid */}
        <div className="mt-12 grid grid-cols-1 gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {filteredSmallBatch.map((piece, idx) => {
            const isLocked = piece.isMystery && !unlocked;
            const wasUnveiled = piece.isMystery && unlocked;
            const resolvedSrc = resolveGalleryImage(
              piece.imageUrl,
              piece.tier,
              idx
            );

            return (
              <motion.article
                key={piece._id}
                layout
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.65,
                  delay: (idx % 4) * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex flex-col"
              >
                <div className="overflow-hidden rounded-2xl border border-champagne bg-white p-2.5 transition-shadow duration-500 hover:shadow-[0_22px_54px_-34px_rgba(18,17,16,0.18)]">
                  <SilkCurtainFrame
                    product={piece}
                    imageSrc={resolvedSrc}
                    isLocked={isLocked}
                    wasUnveiled={wasUnveiled}
                    aspectClass="aspect-[3/4]"
                    roundedClass="rounded-xl"
                    onAction={() => handlePieceSelect(piece)}
                  />
                </div>

                {/* Clean Label Underneath — Zero Sticker Spam */}
                <div className="mt-4 flex items-start justify-between gap-3 px-1">
                  <div className="min-w-0">
                    <h3 className="truncate font-poster text-2xl leading-tight tracking-tight text-[#121110] uppercase">
                      {isLocked ? "BEHIND THE VEIL" : piece.title}
                    </h3>
                    <p
                      className={cn(
                        "mt-1 font-mono text-[11px] tracking-[0.12em] uppercase",
                        isLocked ? "text-[#D9381E]" : "text-[#736E66]"
                      )}
                    >
                      {isLocked
                        ? "Waitlist Only"
                        : `${piece.remainingUnits}/${piece.totalUnits} left`}
                    </p>
                  </div>

                  <p className="shrink-0 font-poster text-xl leading-tight tracking-tight text-[#121110]">
                    {formatInr(piece.priceInr)}
                  </p>
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
 * V9GarmentDrawer — Serene Museum Right-Hand Slide-Over
 * ========================================================================== */
export function V9GarmentDrawer({ product, onClose }: V9GarmentDrawerProps) {
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
      text: `Reserved size ${chosenSize} in your bag.`,
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
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#121110]/30 backdrop-blur-xs"
          />

          {/* Right-Hand Museum Slide-Over */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-champagne bg-white shadow-[-24px_0_80px_-32px_rgba(18,17,16,0.2)]"
          >
            {/* Header Bar */}
            <div className="flex items-center justify-between border-b border-champagne px-6 py-5 sm:px-8">
              <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.2em] uppercase">
                <span className="text-[#D9381E]">{product.serialCode}</span>
                <span className="text-champagne">·</span>
                <span className="text-[#736E66]">
                  {product.tier === "one-of-one"
                    ? "01/01 One-of-One"
                    : `${product.remainingUnits}/${product.totalUnits} Left`}
                </span>
              </div>

              <button
                type="button"
                suppressHydrationWarning
                onClick={onClose}
                aria-label="Close garment details"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-champagne text-[#121110] transition-colors duration-300 hover:border-[#121110] hover:bg-travertine focus:outline-none"
              >
                <X className="h-4 w-4 stroke-[1.6]" />
              </button>
            </div>

            {/* Scrollable Editorial Body */}
            <div className="flex-1 overflow-y-auto px-6 py-7 sm:px-8">
              {/* 3:4 Portrait Frame */}
              <div className="overflow-hidden rounded-xl border border-champagne bg-travertine">
                <img
                  src={resolveGalleryImage(product.imageUrl, product.tier, 0)}
                  alt={product.title}
                  className="aspect-[3/4] w-full object-cover object-center"
                />
              </div>

              {/* Poster Title + Price */}
              <div className="mt-7 flex items-baseline justify-between gap-4 border-b border-champagne pb-5">
                <div>
                  <h2 className="font-poster text-4xl leading-[0.95] tracking-tight text-[#121110] uppercase">
                    {product.title}
                  </h2>
                  {product.creatorCredit && (
                    <p className="mt-1.5 font-mono text-[10px] tracking-[0.18em] text-[#736E66] uppercase">
                      Designed with {product.creatorCredit}
                    </p>
                  )}
                </div>
                <p className="shrink-0 font-poster text-3xl leading-none text-[#121110]">
                  {formatInr(product.priceInr)}
                </p>
              </div>

              {/* Fabric Story */}
              <p className="mt-5 font-sans text-sm leading-relaxed text-[#736E66]">
                {product.description}
              </p>

              {/* GSM & Fabric Specs */}
              <div className="mt-6 grid grid-cols-2 gap-5 border-y border-champagne py-4">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.18em] text-[#736E66] uppercase">
                    Weight
                  </p>
                  <p className="mt-1 font-sans text-sm font-medium text-[#121110]">
                    {product.gsmWeight}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] tracking-[0.18em] text-[#736E66] uppercase">
                    Fabric
                  </p>
                  <p className="mt-1 font-sans text-sm font-medium text-[#121110]">
                    {product.fabric}
                  </p>
                </div>
              </div>

              {/* Craftsmanship Notes */}
              {product.craftsmanship.length > 0 && (
                <ul className="mt-5 space-y-2">
                  {product.craftsmanship.map((note) => (
                    <li
                      key={note}
                      className="flex items-start gap-2.5 font-sans text-xs leading-relaxed text-[#121110]"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D9381E]" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Cut-to-Order Lead Time Note */}
              <div className="mt-6 rounded-xl border border-champagne bg-travertine/70 px-4 py-3.5">
                <p className="font-mono text-[10px] font-medium tracking-[0.2em] text-[#D9381E] uppercase">
                  Cut to order in {product.productionDays} days
                </p>
                <p className="mt-1 font-sans text-xs leading-relaxed text-[#736E66]">
                  Individually numbered and dispatched Pan-India once your
                  allocation is confirmed. Zero deadstock.
                </p>
              </div>

              {/* Size Selector */}
              <div className="mt-7">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#736E66] uppercase">
                    Select Size
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.18em] text-[#D9381E] uppercase">
                    {product.remainingUnits > 0
                      ? `${product.remainingUnits} of ${product.totalUnits} available`
                      : "Sold Out"}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2.5">
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
                          "min-w-[56px] cursor-pointer rounded-lg border px-4 py-2.5 font-sans text-xs font-medium tracking-[0.14em] uppercase transition-all duration-200 focus:outline-none",
                          active
                            ? "border-[#121110] bg-[#121110] text-white"
                            : "border-champagne bg-white text-[#121110] hover:border-[#121110]"
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
                    "mt-5 flex items-center gap-2 rounded-lg border px-4 py-3 font-sans text-xs",
                    feedback.type === "error"
                      ? "border-[#D9381E]/40 bg-[#D9381E]/5 text-[#D9381E]"
                      : "border-champagne bg-travertine text-[#121110]"
                  )}
                >
                  {feedback.type === "success" && (
                    <Check className="h-3.5 w-3.5 text-[#D9381E]" />
                  )}
                  <span>{feedback.text}</span>
                </div>
              )}
            </div>

            {/* Sticky Footer Reserve CTA */}
            <div className="border-t border-champagne bg-white px-6 py-5 sm:px-8">
              <button
                type="button"
                suppressHydrationWarning
                disabled={product.remainingUnits <= 0}
                onClick={handleReserve}
                className={cn(
                  "w-full rounded-full py-4 font-sans text-xs font-medium tracking-[0.2em] uppercase transition-colors duration-300 focus:outline-none",
                  product.remainingUnits <= 0
                    ? "cursor-not-allowed bg-champagne text-[#736E66]"
                    : "cursor-pointer bg-[#121110] text-white hover:bg-[#D9381E]"
                )}
              >
                {product.remainingUnits <= 0
                  ? "EDITION CLAIMED"
                  : `RESERVE PIECE — ${formatInr(product.priceInr)}`}
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
