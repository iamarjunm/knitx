"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Clock,
  Lock,
  Scissors,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Unlock,
  X,
} from "lucide-react";
import { useVault } from "@/context/VaultContext";
import type { Product } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";

export interface V2GarmentRackProps {
  products: Product[];
  onInspectProduct: (p: Product) => void;
}

export interface V2GarmentInspectorModalProps {
  product: Product | null;
  onClose: () => void;
}

type RackFilter = "all" | "open" | "zipped" | "one-of-one";

/** Architectural Machined Chrome Hanger Clip suspending each card from the studio rail */
function ChromeHangerClip({ sealed = false }: { sealed?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="relative z-20 mx-auto -mb-2.5 flex flex-col items-center select-none"
    >
      {/* Rail hook collar */}
      <div className="h-3.5 w-6 rounded-t-full border border-b-0 border-ink/25 bg-gradient-to-b from-[#F4F3F0] via-[#D8D5CE] to-[#B6B2A9] shadow-xs" />
      {/* Vertical machined neck */}
      <div className="h-3 w-2 bg-gradient-to-r from-[#AEAAA1] via-[#F2F1EE] to-[#9B978E]" />
      {/* Pinch clamp jaw */}
      <div
        className={cn(
          "flex h-4 w-12 items-center justify-center rounded-[5px] border bg-gradient-to-b from-[#F8F7F4] via-[#DCD9D2] to-[#B7B3AA] shadow-[0_3px_8px_rgba(0,0,0,0.12)]",
          sealed ? "border-ink/25" : "border-ink/20"
        )}
      >
        <span className="h-1 w-5 rounded-full bg-ink/20" />
      </div>
    </div>
  );
}

/** Open Garment Card suspended from the showroom rail with swinging hanging price tag */
function OpenGarmentCard({
  product,
  wasUnzipped,
  onInspect,
}: {
  product: Product;
  wasUnzipped: boolean;
  onInspect: (p: Product) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isOneOfOne = product.tier === "one-of-one";

  return (
    <div className="flex flex-col items-center">
      <ChromeHangerClip />

      <motion.article
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={{
          rotate: [-0.8, 0.8, 0],
          transition: { duration: 0.72, ease: "easeInOut" },
        }}
        style={{ transformOrigin: "top center" }}
        className="group relative flex w-full flex-col overflow-visible rounded-2xl border border-ink/10 bg-white p-3 shadow-[0_14px_38px_rgba(0,0,0,0.06)] transition-shadow duration-300 hover:shadow-[0_24px_54px_rgba(0,0,0,0.1)]"
      >
        {/* Tiny Swinging Hanging Price Tag attached to top-right grommet */}
        <motion.div
          animate={
            hovered
              ? { rotate: [0, -11, 7, -3, 0] }
              : { rotate: -3 }
          }
          transition={{ duration: 0.85, ease: "easeInOut" }}
          style={{ transformOrigin: "top center" }}
          className="pointer-events-none absolute -top-1 right-4 z-30 flex flex-col items-center"
        >
          {/* Thin cord */}
          <span className="h-5 w-px bg-ink/35" />
          {/* Paper hangtag */}
          <div className="flex flex-col items-center rounded-md border border-ink/14 bg-porcelain px-2 py-1.5 shadow-[0_6px_14px_rgba(0,0,0,0.09)]">
            <span className="mb-1 h-1.5 w-1.5 rounded-full border border-ink/35 bg-white" />
            <span className="font-mono text-[10px] font-bold tracking-tight text-ink">
              {formatInr(product.priceInr)}
            </span>
          </div>
        </motion.div>

        {/* Garment Visual Frame */}
        <div
          onClick={() => onInspect(product)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onInspect(product);
            }
          }}
          className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-xl bg-linen"
        >
          <Image
            src={product.imageUrl || "/images/look-batch-hoodie.jpg"}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />

          {/* Top-left Status & Seal Badges */}
          <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
            {isOneOfOne ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-archive-red px-2.5 py-1 font-mono text-[9.5px] font-bold tracking-[0.16em] text-white uppercase shadow-[0_6px_16px_rgba(225,29,46,0.34)]">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                1 OF 1
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white/92 px-2.5 py-1 font-mono text-[9.5px] font-semibold tracking-[0.14em] text-ink uppercase shadow-xs backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-klein" />
                {product.remainingUnits}/{product.totalUnits} LEFT
              </span>
            )}

            {wasUnzipped ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-klein px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.16em] text-white uppercase shadow-[0_6px_16px_rgba(0,43,255,0.3)]">
                <Check className="h-2.5 w-2.5" />
                UNZIPPED ✓
              </span>
            ) : null}
          </div>

          {/* Bottom-left Serial Chip */}
          <div className="absolute bottom-3 left-3 rounded-full border border-white/40 bg-white/86 px-2.5 py-1 font-mono text-[9.5px] font-semibold tracking-[0.16em] text-ink uppercase backdrop-blur-md">
            {product.serialCode}
          </div>
        </div>

        {/* Gallery Placard Info */}
        <div className="mt-3.5 flex flex-1 flex-col justify-between px-1 pb-1">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] tracking-[0.14em] text-[#64625D] uppercase">
                {product.gsmWeight}
              </span>
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#64625D] uppercase">
                {product.productionDays}D MAKE
              </span>
            </div>

            <h3 className="mt-1 font-syne text-base font-bold tracking-tight text-ink transition-colors group-hover:text-klein">
              {product.title}
            </h3>

            <p className="mt-0.5 line-clamp-1 font-editorial text-sm italic text-[#64625D]">
              {product.fabric}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-ink/8 pt-3">
            <span className="font-mono text-xs font-semibold text-ink">
              {formatInr(product.priceInr)}
            </span>

            <button
              type="button"
              onClick={() => onInspect(product)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-ink/12 bg-porcelain px-3 py-1.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-ink uppercase transition-all hover:border-klein hover:bg-klein hover:text-white"
            >
              <span>INSPECT PIECE</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </motion.article>
    </div>
  );
}

/** Sealed Mystery Ripstop Garment Bag with REAL Draggable Metal Zipper Track */
function LockedZipperBagCard({ product }: { product: Product }) {
  const zipY = useMotionValue(0);
  const [pinAlert, setPinAlert] = useState(false);
  const [isDraggingZip, setIsDraggingZip] = useState(false);
  const alertTimerRef = useRef<number | null>(null);

  const isOneOfOne = product.tier === "one-of-one";

  // Realistic V-parting translucent ripstop garment-bag flaps tied to zipper position
  const leftFlapClip = useTransform(zipY, (y) => {
    const p = Math.max(0, Math.min(1, y / 130));
    const openHalf = p * 38;
    const splitDepth = 5 + p * 52;
    return `polygon(0% 0%, ${50 - openHalf}% 0%, 50% ${splitDepth}%, 50% 100%, 0% 100%)`;
  });

  const rightFlapClip = useTransform(zipY, (y) => {
    const p = Math.max(0, Math.min(1, y / 130));
    const openHalf = p * 38;
    const splitDepth = 5 + p * 52;
    return `polygon(${50 + openHalf}% 0%, 100% 0%, 100% 100%, 50% 100%, 50% ${splitDepth}%)`;
  });

  // Silhouette peeks sharper as the bag parts
  const peekScale = useTransform(zipY, [0, 130], [1.05, 1]);
  const peekOpacity = useTransform(zipY, [0, 130], [0.58, 0.96]);
  const trackTop = useTransform(zipY, (y) => `${Math.max(12, y + 26)}px`);
  const pullHintOpacity = useTransform(zipY, [0, 35], [1, 0]);

  const showSecurityPinAlert = useCallback(() => {
    setPinAlert(true);
    if (alertTimerRef.current !== null) {
      window.clearTimeout(alertTimerRef.current);
    }
    alertTimerRef.current = window.setTimeout(() => {
      setPinAlert(false);
    }, 2800);
  }, []);

  useEffect(() => {
    return () => {
      if (alertTimerRef.current !== null) {
        window.clearTimeout(alertTimerRef.current);
      }
    };
  }, []);

  useMotionValueEvent(zipY, "change", (latest) => {
    if (latest >= 108 && !pinAlert) {
      showSecurityPinAlert();
    }
  });

  const handleZipDragEnd = useCallback(() => {
    setIsDraggingZip(false);
    if (zipY.get() >= 96) {
      showSecurityPinAlert();
    }
    animate(zipY, 0, {
      type: "spring",
      stiffness: 260,
      damping: 20,
    });
  }, [zipY, showSecurityPinAlert]);

  const handleTeaseTap = useCallback(() => {
    if (isDraggingZip) return;
    animate(zipY, 114, {
      duration: 0.36,
      ease: [0.22, 1, 0.36, 1],
      onComplete: () => {
        showSecurityPinAlert();
        window.setTimeout(() => {
          animate(zipY, 0, {
            type: "spring",
            stiffness: 240,
            damping: 19,
          });
        }, 280);
      },
    });
  }, [isDraggingZip, zipY, showSecurityPinAlert]);

  return (
    <div className="flex flex-col items-center">
      <ChromeHangerClip sealed />

      <article className="relative flex w-full flex-col overflow-hidden rounded-2xl border border-ink/12 bg-white p-3 shadow-[0_14px_38px_rgba(0,0,0,0.06)]">
        {/* Frosted Translucent Ripstop Garment Bag Viewport */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-ink/10 bg-[#ECEAE4] select-none">
          {/* UNDERNEATH: Shadowy Garment Silhouette & Serial Reveal */}
          <motion.div
            style={{ scale: peekScale, opacity: peekOpacity }}
            className="absolute inset-0"
          >
            <Image
              src={product.silhouetteUrl || "/images/look-mystery-veil.jpg"}
              alt={`${product.serialCode} Sealed Silhouette`}
              fill
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
              className="pointer-events-none object-cover object-center contrast-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/45" />
          </motion.div>

          {/* Hidden Under-Bag Exhibition Spec Card Revealed Inside the V-Opening */}
          <div className="pointer-events-none absolute inset-x-4 top-8 flex flex-col items-center text-center">
            <span className="rounded-full border border-white/30 bg-black/55 px-2.5 py-0.5 font-mono text-[9px] font-semibold tracking-[0.2em] text-white uppercase backdrop-blur-md">
              {product.serialCode} · ARCHIVE VAULT
            </span>
            <span className="mt-1.5 font-editorial text-lg italic text-white drop-shadow-sm">
              {isOneOfOne ? "Sealed 1-of-1 Master" : "Sealed Small-Batch"}
            </span>
          </div>

          {/* LEFT FROSTED TRANSLUCENT RIPSTOP FLAP */}
          <motion.div
            style={{
              clipPath: leftFlapClip,
              backgroundImage:
                "linear-gradient(to right, rgba(14,14,14,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(14,14,14,0.045) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
            className="pointer-events-none absolute inset-0 bg-porcelain/78 backdrop-blur-md"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/55 via-transparent to-linen/40" />
          </motion.div>

          {/* RIGHT FROSTED TRANSLUCENT RIPSTOP FLAP */}
          <motion.div
            style={{
              clipPath: rightFlapClip,
              backgroundImage:
                "linear-gradient(to right, rgba(14,14,14,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(14,14,14,0.045) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
            className="pointer-events-none absolute inset-0 bg-porcelain/78 backdrop-blur-md"
          >
            <div className="absolute inset-0 bg-gradient-to-bl from-white/55 via-transparent to-linen/40" />
          </motion.div>

          {/* Bag Top-Left Corner Stamp */}
          <div className="pointer-events-none absolute top-3 left-3 z-20 flex flex-col gap-1.5">
            {isOneOfOne ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-archive-red px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.16em] text-white uppercase shadow-[0_4px_12px_rgba(225,29,46,0.3)]">
                1 OF 1 · SEALED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-ink/12 bg-white/85 px-2.5 py-1 font-mono text-[9px] font-semibold tracking-[0.14em] text-ink uppercase backdrop-blur-md">
                <Lock className="h-2.5 w-2.5 text-[#64625D]" />
                ZIPPED BAG
              </span>
            )}
          </div>

          {/* VERTICAL CENTER METAL ZIPPER TRACK (Unopened lower teeth) */}
          <motion.div
            aria-hidden="true"
            style={{ top: trackTop }}
            className="pointer-events-none absolute bottom-0 left-1/2 z-20 w-[7px] -translate-x-1/2 border-x border-dashed border-ink/35 bg-gradient-to-r from-[#D5D2CA] via-[#F7F6F3] to-[#C8C5BC]"
          />

          {/* REAL DRAGGABLE METAL ZIPPER PULL TAB */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 130 }}
            dragElastic={0.1}
            dragMomentum={false}
            onDragStart={() => setIsDraggingZip(true)}
            onDragEnd={handleZipDragEnd}
            onClick={handleTeaseTap}
            style={{ y: zipY }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            aria-label={`Pull zipper down to peek inside ${product.serialCode}`}
            className="absolute top-3 left-1/2 z-30 flex -translate-x-1/2 cursor-grab flex-col items-center touch-none active:cursor-grabbing"
          >
            {/* Machined Zipper Slider Head */}
            <div className="flex h-6 w-5 items-center justify-center rounded-[5px] border border-ink/30 bg-gradient-to-b from-[#FFFFFF] via-[#D8D5CE] to-[#A7A39A] shadow-[0_4px_10px_rgba(0,0,0,0.18)]">
              <span className="h-2.5 w-1.5 rounded-full bg-ink/30" />
            </div>

            {/* Engraved Metal Pull Tab */}
            <div className="-mt-1 flex h-11 w-6 flex-col items-center justify-between rounded-b-full border border-ink/28 bg-gradient-to-b from-[#F4F3F0] via-[#D9D6CE] to-[#B7B3AA] py-1.5 shadow-[0_8px_18px_rgba(0,0,0,0.16)]">
              <span className="font-mono text-[7px] font-bold tracking-tighter text-ink/75">
                KX
              </span>
              <span className="h-2.5 w-2.5 rounded-full border border-ink/25 bg-white/80" />
            </div>

            {/* Subtle Animated Drag Down Prompt */}
            <motion.div
              style={{ opacity: pullHintOpacity }}
              animate={{ y: [0, 4, 0] }}
              transition={{
                repeat: Infinity,
                duration: 1.8,
                ease: "easeInOut",
              }}
              className="mt-2 rounded-full border border-ink/12 bg-white/92 px-2.5 py-0.5 font-mono text-[8.5px] font-semibold tracking-[0.16em] text-ink uppercase shadow-xs backdrop-blur-sm whitespace-nowrap"
            >
              PULL ZIP ↓
            </motion.div>
          </motion.div>

          {/* TACTILE ARCHIVE RED SECURITY PIN ALERT */}
          <AnimatePresence>
            {pinAlert ? (
              <motion.div
                initial={{ opacity: 0, y: 14, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
                className="pointer-events-none absolute inset-x-3 bottom-3 z-40 rounded-xl border border-white/25 bg-archive-red px-3 py-2.5 text-white shadow-[0_14px_30px_rgba(225,29,46,0.42)]"
              >
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <p className="font-mono text-[9.5px] leading-snug font-bold tracking-[0.14em] uppercase">
                    LOCKED · CLEAR WAITLIST TO UNZIP
                  </p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Bottom Ripstop Bag Label Seal (when alert hidden) */}
          {!pinAlert ? (
            <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex items-center justify-between rounded-xl border border-ink/10 bg-white/86 px-3 py-2 backdrop-blur-md">
              <span className="font-mono text-[9.5px] font-semibold tracking-[0.16em] text-ink uppercase">
                {product.serialCode}
              </span>
              <span className="font-mono text-[9px] tracking-[0.14em] text-[#64625D] uppercase">
                SEALED GARMENT BAG
              </span>
            </div>
          ) : null}
        </div>

        {/* Locked Bag Placard Footer */}
        <div className="mt-3.5 flex flex-1 flex-col justify-between px-1 pb-1">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] tracking-[0.14em] text-[#64625D] uppercase">
                ARCHIVE SPEC LOCKED
              </span>
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#64625D] uppercase">
                {product.totalUnits === 1
                  ? "1 UNIT ONLY"
                  : `${product.totalUnits} UNITS`}
              </span>
            </div>

            <h3 className="mt-1 font-syne text-base font-bold tracking-tight text-ink">
              Mystery Piece {product.serialCode}
            </h3>

            <p className="mt-0.5 font-editorial text-sm italic text-[#64625D]">
              Drag zipper down to peek inside
            </p>
          </div>

          <div className="mt-4 border-t border-ink/8 pt-3">
            <a
              href="#vault-gate"
              className="flex w-full items-center justify-center gap-1.5 rounded-full border border-klein/25 bg-klein/6 px-3.5 py-2 font-mono text-[10px] font-semibold tracking-[0.15em] text-klein uppercase transition-all hover:bg-klein hover:text-white"
            >
              <span>UNLOCK AT VAULT GATE</span>
              <ArrowDown className="h-3 w-3" />
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}

export default function V2GarmentRack({
  products,
  onInspectProduct,
}: V2GarmentRackProps) {
  const { isVaultUnlocked } = useVault();
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<RackFilter>("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  const showUnlocked = mounted && isVaultUnlocked;

  const counts = useMemo(() => {
    const openCount = products.filter((p) => !p.isMystery).length;
    const zippedCount = products.filter((p) => p.isMystery).length;
    const oneOfOneCount = products.filter((p) => p.tier === "one-of-one").length;
    return {
      all: products.length,
      open: openCount,
      zipped: zippedCount,
      oneOfOne: oneOfOneCount,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeFilter === "open") {
      return products.filter((p) => !p.isMystery);
    }
    if (activeFilter === "zipped") {
      return products.filter((p) => p.isMystery);
    }
    if (activeFilter === "one-of-one") {
      return products.filter((p) => p.tier === "one-of-one");
    }
    return products;
  }, [products, activeFilter]);

  const filterTabs: { id: RackFilter; label: string }[] = [
    { id: "all", label: `ALL ${counts.all}` },
    { id: "open", label: `OPEN ${counts.open}` },
    {
      id: "zipped",
      label: showUnlocked ? `UNZIPPED ${counts.zipped}` : `ZIPPED ${counts.zipped}`,
    },
    { id: "one-of-one", label: `1-OF-1 (${counts.oneOfOne})` },
  ];

  return (
    <section
      id="rack"
      className="relative overflow-hidden border-t border-ink/10 bg-linen/55 py-24 sm:py-28"
    >
      <div className="mx-auto max-w-[1380px] px-5 sm:px-8">
        {/* SECTION HEADER */}
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.22em] text-[#64625D] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-klein" />
              <span>EXHIBITION ROOM 02 · SHOWROOM RAIL</span>
            </div>

            <h2 className="text-3xl leading-[1.02] tracking-[-0.03em] text-ink sm:text-5xl">
              <span className="font-syne font-extrabold">THE 10-PIECE RACK</span>
              <span className="mt-1 block font-editorial text-[1.95rem] font-normal italic text-[#64625D] sm:text-[2.65rem]">
                {showUnlocked
                  ? "All ten unzipped. Archive vault open."
                  : "Five open. Five zipped shut."}
              </span>
            </h2>
          </div>

          {/* Filter Pills + Vault State Indicator */}
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/85 px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.16em] uppercase shadow-xs">
              {showUnlocked ? (
                <>
                  <Unlock className="h-3 w-3 text-klein" />
                  <span className="text-klein">ALL 5 BAGS UNZIPPED</span>
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 text-[#64625D]" />
                  <span className="text-[#64625D]">
                    DRAG ANY ZIPPER DOWN TO PEEK
                  </span>
                </>
              )}
            </div>

            <div
              role="tablist"
              aria-label="Filter Garment Rack"
              className="flex flex-wrap items-center gap-1 rounded-full border border-ink/10 bg-white/90 p-1 shadow-[0_6px_20px_rgba(0,0,0,0.04)]"
            >
              {filterTabs.map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveFilter(tab.id)}
                    className={cn(
                      "relative cursor-pointer rounded-full px-3.5 py-1.5 font-mono text-[10px] font-semibold tracking-[0.15em] uppercase transition-colors",
                      isActive
                        ? "text-white"
                        : "text-[#64625D] hover:text-ink"
                    )}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="v2-rack-filter-pill"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 32,
                        }}
                        className={cn(
                          "absolute inset-0 rounded-full",
                          tab.id === "one-of-one" ? "bg-archive-red" : "bg-ink"
                        )}
                      />
                    ) : null}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ARCHITECTURAL BRUSHED-ALUMINUM SHOWROOM RAIL BAR */}
        <div className="relative mt-12">
          {/* End-cap Wall Mounts + Brushed Horizontal Metal Rail */}
          <div className="relative flex items-center">
            <div className="h-5 w-3 rounded-l-md border border-ink/20 bg-gradient-to-b from-[#EFECE6] via-[#C8C4BC] to-[#9E9A91] shadow-sm" />
            <div className="relative h-3.5 flex-1 border-y border-ink/20 bg-gradient-to-b from-[#F5F4F0] via-[#D2CFC7] to-[#ABA79E] shadow-[0_6px_16px_rgba(0,0,0,0.1)]">
              {/* Specular Brushed Highlight */}
              <div className="absolute inset-x-0 top-[2px] h-px bg-white/85" />
              {/* Subtle Etched Metric Rail Markings */}
              <div className="hidden h-full items-center justify-between px-8 font-mono text-[8px] font-semibold tracking-[0.26em] text-ink/45 uppercase sm:flex">
                <span>RAIL 01</span>
                <span>STUDIO ARCHIVE SUSPENSION SYSTEM · INDIA</span>
                <span>450 GSM LOAD RATED</span>
              </div>
            </div>
            <div className="h-5 w-3 rounded-r-md border border-ink/20 bg-gradient-to-b from-[#EFECE6] via-[#C8C4BC] to-[#9E9A91] shadow-sm" />
          </div>

          {/* SUSPENDED GARMENT GRID */}
          <div className="-mt-1 grid grid-cols-1 gap-x-6 gap-y-12 pt-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const isSealedBag = product.isMystery && !showUnlocked;
              const wasUnzipped = product.isMystery && showUnlocked;

              return (
                <div key={product._id} className="relative">
                  {/* Subtle secondary horizontal rail guide for wrapped rows */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-x-3 top-1.5 h-1 rounded-full bg-gradient-to-b from-ink/10 to-transparent opacity-45"
                  />

                  {isSealedBag ? (
                    <LockedZipperBagCard product={product} />
                  ) : (
                    <OpenGarmentCard
                      product={product}
                      wasUnzipped={wasUnzipped}
                      onInspect={onInspectProduct}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Silky Spring Studio Drawer / Garment Inspector Modal */
export function V2GarmentInspectorModal({
  product,
  onClose,
}: V2GarmentInspectorModalProps) {
  const { addToCart, setCartOpen, isVaultUnlocked } = useVault();
  const [mounted, setMounted] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0] ?? "M");
      setFeedback(null);
    }
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [product, onClose]);

  const showUnlocked = mounted && isVaultUnlocked;
  const isLockedMystery = Boolean(product?.isMystery && !showUnlocked);
  const isSoldOut = Boolean(product && product.remainingUnits <= 0);
  const isOneOfOne = product?.tier === "one-of-one";

  const handleAddToBag = () => {
    if (!product || isLockedMystery || isSoldOut) return;
    const result = addToCart(product, selectedSize);
    if (!result.ok) {
      setFeedback({
        type: "error",
        text: result.message || "Unable to reserve this edition.",
      });
      return;
    }
    setFeedback({
      type: "success",
      text: "Reserved in your bag for 10 minutes.",
    });
    setCartOpen(true);
    onClose();
  };

  return (
    <AnimatePresence>
      {product ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Inspect ${product.title}`}
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
        >
          {/* Soft Frosted Daylight Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/35 backdrop-blur-md"
          />

          {/* Silky Spring Porcelain Studio Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 42, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative z-10 max-h-[92vh] w-full max-w-[960px] overflow-y-auto rounded-t-[28px] border border-ink/10 bg-white shadow-[0_32px_90px_rgba(0,0,0,0.2)] sm:rounded-[28px]"
          >
            {/* Mobile Drag Handle */}
            <div className="flex justify-center pt-3 sm:hidden">
              <span className="h-1 w-10 rounded-full bg-ink/15" />
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Garment Inspector"
              className="absolute top-4 right-4 z-20 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-ink/12 bg-white/90 text-ink shadow-xs backdrop-blur-md transition-colors hover:bg-ink hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12">
              {/* Left: Full 3:4 Garment Studio Photography */}
              <div className="relative bg-linen p-4 sm:p-6 md:col-span-5">
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-porcelain shadow-[0_14px_34px_rgba(0,0,0,0.08)]">
                  <Image
                    src={
                      isLockedMystery
                        ? product.silhouetteUrl || "/images/look-mystery-veil.jpg"
                        : product.imageUrl || "/images/look-1of1-jacket.jpg"
                    }
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 92vw, 400px"
                    className={cn(
                      "object-cover object-center",
                      isLockedMystery && "blur-xs"
                    )}
                  />

                  {/* Top-left Archive Seal */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {isOneOfOne ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-archive-red px-3 py-1 font-mono text-[9.5px] font-bold tracking-[0.16em] text-white uppercase shadow-[0_6px_16px_rgba(225,29,46,0.34)]">
                        1 OF 1 · ARCHIVE SEAL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white/92 px-3 py-1 font-mono text-[9.5px] font-semibold tracking-[0.14em] text-ink uppercase backdrop-blur-md">
                        <span className="h-1.5 w-1.5 rounded-full bg-klein" />
                        {product.remainingUnits} OF {product.totalUnits} LEFT
                      </span>
                    )}
                  </div>

                  {/* Bottom Serial Stamp */}
                  <div className="absolute bottom-3 left-3 rounded-full border border-white/40 bg-white/88 px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.16em] text-ink uppercase backdrop-blur-md">
                    {product.serialCode} · {product.gsmWeight}
                  </div>
                </div>
              </div>

              {/* Right: Architectural Specification & Claim Sheet */}
              <div className="flex flex-col justify-between p-6 sm:p-8 md:col-span-7">
                <div>
                  {/* Eyebrow */}
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.18em] text-[#64625D] uppercase">
                    <span>{product.serialCode}</span>
                    <span className="text-ink/25">·</span>
                    <span className={cn(isOneOfOne && "text-archive-red")}>
                      {isOneOfOne ? "ONE-OF-ONE EDITION" : "SMALL-BATCH EDITION"}
                    </span>
                    {product.creatorCredit ? (
                      <>
                        <span className="text-ink/25">·</span>
                        <span className="text-klein">
                          BY {product.creatorCredit}
                        </span>
                      </>
                    ) : null}
                  </div>

                  {/* Title & Price */}
                  <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-3 pr-8">
                    <h3 className="font-syne text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                      {product.title}
                    </h3>
                    <span className="font-mono text-xl font-bold text-ink">
                      {formatInr(product.priceInr)}
                    </span>
                  </div>

                  <p className="mt-1 font-editorial text-lg italic text-[#64625D]">
                    {product.fabric} · {product.gsmWeight}
                  </p>

                  <p className="mt-4 text-sm leading-relaxed text-[#64625D]">
                    {product.description}
                  </p>

                  {/* Macro Craftsmanship Chips */}
                  {product.craftsmanship.length > 0 ? (
                    <div className="mt-5">
                      <p className="mb-2 font-mono text-[9.5px] font-semibold tracking-[0.2em] text-[#64625D] uppercase">
                        MACRO CRAFTSMANSHIP
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {product.craftsmanship.map((detail) => (
                          <span
                            key={detail}
                            className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-porcelain px-3 py-1 text-xs font-medium text-ink"
                          >
                            <Sparkles className="h-3 w-3 text-klein" />
                            {detail}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Sample-First Dispatch Timeline */}
                  <div className="mt-6 rounded-2xl border border-ink/10 bg-linen/70 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-[0.18em] text-ink uppercase">
                        <Scissors className="h-3.5 w-3.5 text-klein" />
                        SAMPLE-FIRST TIMELINE
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold tracking-[0.14em] text-[#64625D] uppercase">
                        <Clock className="h-3 w-3" />
                        ZERO DEADSTOCK
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl border border-ink/8 bg-white/90 p-2.5">
                        <p className="font-mono text-[9px] font-bold tracking-[0.16em] text-klein uppercase">
                          01 · CLAIM
                        </p>
                        <p className="mt-1 text-[11px] leading-snug text-ink">
                          Edition number locked to your pass
                        </p>
                      </div>
                      <div className="rounded-xl border border-ink/8 bg-white/90 p-2.5">
                        <p className="font-mono text-[9px] font-bold tracking-[0.16em] text-ink uppercase">
                          02 · STUDIO MAKE
                        </p>
                        <p className="mt-1 text-[11px] leading-snug text-ink">
                          Cut &amp; sewn in {product.productionDays} days
                        </p>
                      </div>
                      <div className="rounded-xl border border-ink/8 bg-white/90 p-2.5">
                        <p className="font-mono text-[9px] font-bold tracking-[0.16em] text-ink uppercase">
                          03 · DISPATCH
                        </p>
                        <p className="mt-1 text-[11px] leading-snug text-ink">
                          Insured pan-India courier
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Size Pills */}
                  {!isLockedMystery ? (
                    <div className="mt-6">
                      <div className="mb-2.5 flex items-center justify-between">
                        <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#64625D] uppercase">
                          SELECT SIZE
                        </span>
                        <span className="font-mono text-[10px] tracking-[0.14em] text-[#64625D] uppercase">
                          BOX-DRAPE STUDIO FIT
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size) => {
                          const isSelected = selectedSize === size;
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => {
                                setSelectedSize(size);
                                setFeedback(null);
                              }}
                              className={cn(
                                "min-w-[52px] cursor-pointer rounded-full border px-4 py-2 font-mono text-xs font-semibold tracking-[0.1em] uppercase transition-all",
                                isSelected
                                  ? "border-klein bg-klein text-white shadow-[0_6px_16px_rgba(0,43,255,0.24)]"
                                  : "border-ink/14 bg-porcelain text-ink hover:border-ink/40 hover:bg-linen"
                              )}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* Inline Feedback */}
                  {feedback ? (
                    <p
                      className={cn(
                        "mt-4 rounded-xl px-3.5 py-2.5 font-mono text-[11px] font-medium",
                        feedback.type === "error"
                          ? "border border-archive-red/20 bg-archive-red/8 text-archive-red"
                          : "border border-klein/20 bg-klein/8 text-klein"
                      )}
                    >
                      {feedback.text}
                    </p>
                  ) : null}
                </div>

                {/* Primary CTA Footer */}
                <div className="mt-7 border-t border-ink/10 pt-5">
                  {isLockedMystery ? (
                    <a
                      href="#vault-gate"
                      onClick={onClose}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 font-mono text-xs font-semibold tracking-[0.18em] text-white uppercase transition-colors hover:bg-klein"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>UNLOCK VAULT GATE TO CLAIM</span>
                    </a>
                  ) : (
                    <motion.button
                      type="button"
                      disabled={isSoldOut}
                      whileHover={isSoldOut ? undefined : { y: -1.5 }}
                      whileTap={isSoldOut ? undefined : { scale: 0.985 }}
                      onClick={handleAddToBag}
                      className={cn(
                        "flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full px-6 py-4 font-mono text-xs font-semibold tracking-[0.18em] uppercase transition-all",
                        isSoldOut
                          ? "cursor-not-allowed bg-linen text-[#64625D]"
                          : "bg-klein text-white shadow-[0_14px_34px_rgba(0,43,255,0.3)] hover:bg-ink"
                      )}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>
                        {isSoldOut
                          ? "ARCHIVE PIECE SOLD OUT"
                          : `ADD TO BAG — ${formatInr(product.priceInr)}`}
                      </span>
                    </motion.button>
                  )}

                  <p className="mt-2.5 text-center font-mono text-[9.5px] tracking-[0.16em] text-[#64625D] uppercase">
                    INCL. ALL TAXES · NUMBERED WOVEN LABEL · PAN-INDIA SHIPPING
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
