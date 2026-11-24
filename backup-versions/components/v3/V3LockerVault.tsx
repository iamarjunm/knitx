"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Check,
  Clock,
  Eye,
  Lock,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Unlock,
  X,
} from "lucide-react";
import { useVault } from "@/context/VaultContext";
import type { Product } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";

export interface V3LockerVaultProps {
  products: Product[];
  onInspectProduct: (product: Product) => void;
}

export interface V3LockerClaimModalProps {
  product: Product | null;
  onClose: () => void;
}

type LockerFilter = "all" | "open" | "sealed" | "one-of-one";

interface IndexedLocker {
  product: Product;
  lockerCode: string;
  mysteryOrder: number;
}

const DIAL_TICKS = Array.from({ length: 12 }, (_, i) => i * 30);

function formatLockerCode(index: number): string {
  return `L-${String(index + 1).padStart(2, "0")}`;
}

interface LockerBayCardProps {
  item: IndexedLocker;
  vaultOpen: boolean;
  onInspectProduct: (product: Product) => void;
}

function LockerBayCard({
  item,
  vaultOpen,
  onInspectProduct,
}: LockerBayCardProps) {
  const { product, lockerCode, mysteryOrder } = item;
  const isSteelLocker = product.isMystery;
  const isUnsealedNow = isSteelLocker && vaultOpen;
  const isAccessible = !isSteelLocker || vaultOpen;

  const [isHovered, setIsHovered] = useState(false);
  const [isPeeking, setIsPeeking] = useState(false);

  const handleCardAction = () => {
    if (isAccessible) {
      onInspectProduct(product);
      return;
    }
    const passbook = document.getElementById("passbook");
    if (passbook) {
      passbook.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const unitsLabel =
    product.tier === "one-of-one"
      ? "1 OF 1"
      : `${product.remainingUnits}/${product.totalUnits} LEFT`;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPeeking(false);
      }}
      className="group relative flex flex-col rounded-2xl border border-hunter/18 bg-chrome/65 p-2 shadow-[0_12px_30px_rgba(20,54,40,0.06)] transition-shadow hover:shadow-[0_18px_40px_rgba(20,54,40,0.12)]"
    >
      {/* Brushed Chrome Top Bay Header */}
      <div className="mb-2 flex items-center justify-between px-1.5 pt-0.5">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              isUnsealedNow
                ? "bg-chartreuse ring-1 ring-hunter/50"
                : !isSteelLocker
                  ? "bg-hunter"
                  : "bg-espresso/25"
            )}
          />
          <span className="font-mono text-[11px] font-bold tracking-[0.18em] text-hunter">
            {lockerCode}
          </span>
        </div>

        <span
          className={cn(
            "rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.14em] uppercase",
            isUnsealedNow
              ? "bg-hunter text-chartreuse"
              : !isSteelLocker
                ? product.tier === "one-of-one"
                  ? "bg-hunter text-chartreuse"
                  : "border border-hunter/20 bg-white text-hunter"
                : "border border-hunter/15 bg-alabaster text-espresso/65"
          )}
        >
          {isUnsealedNow
            ? "UNSEALED ✓"
            : !isSteelLocker
              ? unitsLabel
              : "SEALED"}
        </span>
      </div>

      {/* 3D Perspective Locker Chamber */}
      <div
        className="relative aspect-[3/4] w-full rounded-xl bg-alabaster"
        style={{ perspective: "1000px" }}
      >
        {/* Interior Illuminated Chamber (Always contains the real garment) */}
        <button
          type="button"
          suppressHydrationWarning
          onClick={handleCardAction}
          aria-label={
            isAccessible
              ? `Inspect ${product.title} in locker ${lockerCode}`
              : `Locker ${lockerCode} is sealed. Open Passbook to unlock.`
          }
          className="relative block h-full w-full cursor-pointer overflow-hidden rounded-xl border border-hunter/15 bg-white text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-hunter"
        >
          {/* Interior Chamber Garment Display */}
          <Image
            src={product.imageUrl}
            alt={isAccessible ? product.title : `Sealed garment in ${lockerCode}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 20vw"
            className={cn(
              "object-cover transition-transform duration-500",
              isAccessible
                ? "scale-100 group-hover:scale-105"
                : "scale-105 opacity-20 blur-md"
            )}
          />

          {/* Soft museum interior rim vignette */}
          <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_24px_rgba(20,54,40,0.12)]" />

          {/* Glowing chartreuse UNSEALED ✓ badge inside newly opened steel vault */}
          {isUnsealedNow ? (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.25 + mysteryOrder * 0.1, duration: 0.35 }}
              className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 rounded-md bg-hunter px-2 py-1 font-mono text-[9px] font-bold tracking-[0.14em] text-chartreuse shadow-[0_4px_14px_rgba(20,54,40,0.35)]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-chartreuse" />
              <span>UNSEALED ✓</span>
            </motion.div>
          ) : null}

          {/* Interior bottom quick tag when accessible */}
          {isAccessible ? (
            <div className="absolute inset-x-2 bottom-2 z-10 flex items-center justify-between rounded-lg border border-hunter/15 bg-alabaster/92 px-2.5 py-1.5 backdrop-blur-md">
              <span className="font-mono text-[10px] font-bold text-hunter">
                {formatInr(product.priceInr)}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold tracking-[0.12em] text-hunter uppercase">
                <span>CLAIM</span>
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          ) : null}
        </button>

        {/* DOOR LAYER A: Open Glass Display Door (for the 5 revealed pieces) */}
        {!isSteelLocker ? (
          <motion.div
            animate={{
              rotateY: isHovered ? -14 : 0,
            }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            style={{
              transformOrigin: "left center",
              transformStyle: "preserve-3d",
            }}
            className="pointer-events-none absolute inset-0 z-20 rounded-xl border border-hunter/22 bg-gradient-to-tr from-white/5 via-white/18 to-white/32 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
          >
            {/* Left Machined Hinges */}
            <span className="absolute top-6 -left-[3px] h-5 w-1.5 rounded-r-xs bg-hunter/75" />
            <span className="absolute bottom-6 -left-[3px] h-5 w-1.5 rounded-r-xs bg-hunter/75" />

            {/* Right Minimal Brass/Hunter Pull Handle */}
            <span className="absolute top-1/2 right-2 h-9 w-1 -translate-y-1/2 rounded-full bg-hunter/55 transition-colors group-hover:bg-hunter" />

            {/* Subtle etched glass serial corner mark */}
            <span className="absolute top-2.5 left-2.5 rounded-xs border border-hunter/15 bg-alabaster/80 px-1.5 py-0.5 font-mono text-[8px] font-semibold tracking-[0.16em] text-hunter/80 uppercase backdrop-blur-xs">
              GLASS · {product.serialCode}
            </span>
          </motion.div>
        ) : (
          /* DOOR LAYER B: Sealed Brushed-Aluminum Steel Vault Door (Swings open in 3D when vault unlocks!) */
          <motion.div
            initial={false}
            animate={{
              rotateY: vaultOpen ? (isHovered ? -108 : -102) : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 92,
              damping: 16,
              mass: 1.05,
              delay: vaultOpen ? mysteryOrder * 0.11 : 0,
            }}
            style={{
              transformOrigin: "left center",
              transformStyle: "preserve-3d",
            }}
            className={cn(
              "absolute inset-0 z-20 rounded-xl border border-hunter/25 bg-gradient-to-br from-[#ECEBE6] via-[#E2E0D9] to-[#D4D2C9] shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_24px_rgba(20,54,40,0.12)]",
              vaultOpen ? "pointer-events-none" : "pointer-events-auto"
            )}
          >
            {/* Front Steel Face */}
            <div
              onClick={handleCardAction}
              role="presentation"
              style={{ backfaceVisibility: "hidden" }}
              className="relative flex h-full w-full cursor-pointer flex-col justify-between overflow-hidden rounded-xl p-3"
            >
              {/* Subtle Brushed-Metal Horizontal Sheen Lines */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-25"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, rgba(20,54,40,0.06) 0px, rgba(20,54,40,0.06) 1px, transparent 1px, transparent 4px)",
                }}
              />

              {/* Machined Corner Rivets */}
              <span className="pointer-events-none absolute top-2 left-2 h-1.5 w-1.5 rounded-full bg-hunter/35 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]" />
              <span className="pointer-events-none absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-hunter/35 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]" />
              <span className="pointer-events-none absolute bottom-2 left-2 h-1.5 w-1.5 rounded-full bg-hunter/35 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]" />
              <span className="pointer-events-none absolute right-2 bottom-2 h-1.5 w-1.5 rounded-full bg-hunter/35 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]" />

              {/* Left Heavy Steel Vault Hinges */}
              <span className="pointer-events-none absolute top-7 -left-[3px] h-7 w-1.5 rounded-r-xs bg-hunter" />
              <span className="pointer-events-none absolute bottom-7 -left-[3px] h-7 w-1.5 rounded-r-xs bg-hunter" />

              {/* Top Engraved Nameplate */}
              <div className="relative z-10 flex items-center justify-between border-b border-hunter/15 pb-2">
                <div>
                  <p className="font-mono text-[8px] font-bold tracking-[0.2em] text-hunter/65 uppercase">
                    STEEL VAULT
                  </p>
                  <p className="font-syne text-base leading-none font-extrabold tracking-tight text-hunter">
                    {lockerCode}
                  </p>
                </div>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-hunter/25 bg-alabaster/80 text-hunter">
                  <Lock className="h-3 w-3" />
                </span>
              </div>

              {/* Centerpiece: Rotary Combination Dial + Circular Keyhole Peek Aperture */}
              <div className="relative z-10 my-auto flex flex-col items-center justify-center py-2">
                <div className="relative flex h-28 w-28 items-center justify-center">
                  {/* Outer Engraved Combination Ring */}
                  <motion.div
                    animate={{
                      rotate: isPeeking ? 90 : isHovered ? 52 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 180, damping: 20 }}
                    className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-hunter/35 bg-gradient-to-b from-[#F3F2EC] to-[#D9D7CE] shadow-[0_6px_16px_rgba(20,54,40,0.14),inset_0_1px_2px_rgba(255,255,255,0.9)]"
                  >
                    {/* Radial engraved dial markings */}
                    {DIAL_TICKS.map((deg) => (
                      <span
                        key={deg}
                        style={{
                          transform: `rotate(${deg}deg) translateY(-39px)`,
                        }}
                        className={cn(
                          "absolute h-2 w-0.5 rounded-full",
                          deg % 90 === 0 ? "bg-hunter" : "bg-hunter/35"
                        )}
                      />
                    ))}

                    {/* Brass / Hunter Center Rotary Knob */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#B39A5B] bg-hunter shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-chartreuse" />
                    </div>
                  </motion.div>

                  {/* Circular Keyhole Peek Aperture Overlay */}
                  <AnimatePresence>
                    {isPeeking ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.65 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0 z-20 overflow-hidden rounded-full border-2 border-hunter bg-espresso shadow-[0_0_0_4px_rgba(244,243,238,0.85),0_12px_28px_rgba(20,54,40,0.3)]"
                      >
                        <Image
                          src="/images/look-mystery-veil.jpg"
                          alt={`Keyhole peek inside ${lockerCode}`}
                          fill
                          sizes="120px"
                          className="scale-110 object-cover transition-transform duration-700"
                        />
                        <div
                          className="pointer-events-none absolute inset-0"
                          style={{
                            background:
                              "radial-gradient(circle, transparent 34%, rgba(20, 54, 40, 0.72) 100%)",
                          }}
                        />
                        <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center font-mono text-[8px] font-bold tracking-[0.16em] text-chartreuse uppercase">
                          VEILED PIECE
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                {/* Keyhole Peek Toggle / Hover Button */}
                <button
                  type="button"
                  suppressHydrationWarning
                  onMouseEnter={() => setIsPeeking(true)}
                  onMouseLeave={() => setIsPeeking(false)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPeeking((prev) => !prev);
                  }}
                  className={cn(
                    "mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.16em] uppercase transition-all",
                    isPeeking
                      ? "border-hunter bg-hunter text-chartreuse"
                      : "border-hunter/25 bg-alabaster/90 text-hunter hover:border-hunter hover:bg-white"
                  )}
                >
                  <Eye className="h-3 w-3" />
                  <span>{isPeeking ? "PEEKING..." : "KEYHOLE PEEK"}</span>
                </button>
              </div>

              {/* Bottom Door Stamp */}
              <div className="relative z-10 flex items-center justify-between border-t border-hunter/15 pt-2 font-mono text-[9px] tracking-[0.14em] text-hunter/75 uppercase">
                <span>
                  {product.tier === "one-of-one" ? "1-OF-1 SEALED" : "SMALL-BATCH"}
                </span>
                <span className="font-bold text-hunter">PASSBOOK →</span>
              </div>
            </div>

            {/* Inner Backface of Swung-Open Steel Door */}
            <div
              aria-hidden="true"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
              className="absolute inset-0 rounded-xl border border-hunter/30 bg-hunter/95 p-3"
            >
              <div className="flex h-full w-full items-center justify-center rounded-lg border border-chartreuse/20">
                <span className="font-mono text-[9px] font-bold tracking-[0.2em] text-chartreuse/75 uppercase">
                  {lockerCode} OPEN
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Locker Footer Metadata */}
      <div className="mt-2.5 flex items-start justify-between gap-2 px-1 pb-1">
        <div className="min-w-0">
          <p className="truncate font-syne text-xs font-bold tracking-[-0.01em] text-espresso">
            {isAccessible ? product.title : `Vault Locker ${lockerCode}`}
          </p>
          <p className="mt-0.5 truncate font-mono text-[10px] text-espresso/60">
            {isAccessible
              ? `${product.gsmWeight} · ${product.productionDays}d make`
              : "Unlock Passbook to swing door"}
          </p>
        </div>

        <p className="shrink-0 font-mono text-[11px] font-bold text-hunter">
          {isAccessible ? formatInr(product.priceInr) : "₹—,———"}
        </p>
      </div>
    </div>
  );
}

export default function V3LockerVault({
  products,
  onInspectProduct,
}: V3LockerVaultProps) {
  const { isVaultUnlocked } = useVault();

  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<LockerFilter>("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  const vaultOpen = mounted && isVaultUnlocked;

  const indexedLockers = useMemo<IndexedLocker[]>(() => {
    let mysteryCounter = 0;
    return products.slice(0, 10).map((product, idx) => {
      const order = product.isMystery ? mysteryCounter++ : 0;
      return {
        product,
        lockerCode: formatLockerCode(idx),
        mysteryOrder: order,
      };
    });
  }, [products]);

  const counts = useMemo(() => {
    const openCount = indexedLockers.filter(
      (item) => !item.product.isMystery || vaultOpen
    ).length;
    const sealedCount = indexedLockers.filter(
      (item) => item.product.isMystery && !vaultOpen
    ).length;
    const oneOfOneCount = indexedLockers.filter(
      (item) => item.product.tier === "one-of-one"
    ).length;
    return {
      all: indexedLockers.length,
      open: openCount,
      sealed: sealedCount,
      oneOfOne: oneOfOneCount,
    };
  }, [indexedLockers, vaultOpen]);

  const visibleLockers = useMemo(() => {
    return indexedLockers.filter((item) => {
      if (filter === "all") return true;
      if (filter === "open") return !item.product.isMystery || vaultOpen;
      if (filter === "sealed") return item.product.isMystery && !vaultOpen;
      if (filter === "one-of-one") return item.product.tier === "one-of-one";
      return true;
    });
  }, [indexedLockers, filter, vaultOpen]);

  const filterTabs: { id: LockerFilter; label: string; count: number }[] = [
    { id: "all", label: "ALL 10", count: counts.all },
    { id: "open", label: "OPEN", count: counts.open },
    { id: "sealed", label: "SEALED", count: counts.sealed },
    { id: "one-of-one", label: "1-OF-1", count: counts.oneOfOne },
  ];

  return (
    <section
      id="lockers"
      className="relative border-t border-hunter/12 bg-alabaster py-24 text-espresso"
    >
      <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
        {/* Section Header */}
        <div className="mb-10 flex flex-col justify-between gap-6 border-b border-hunter/15 pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-sm border border-hunter/20 bg-white px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.18em] text-hunter uppercase">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  vaultOpen
                    ? "bg-chartreuse ring-1 ring-hunter/40"
                    : "bg-hunter"
                )}
              />
              <span>
                {vaultOpen
                  ? "ALL 10 LOCKERS UNSEALED · VAULT LIVE"
                  : "SAFETY-DEPOSIT ARCHIVE WALL · INDIA"}
              </span>
            </div>

            <h2 className="font-syne text-4xl leading-[0.95] font-extrabold tracking-[-0.04em] text-hunter sm:text-5xl lg:text-6xl">
              THE 10 LOCKERS.
            </h2>
            <p className="mt-2 font-editorial text-2xl text-espresso/85 italic sm:text-3xl">
              Five glass display boxes. Five sealed steel vaults.
            </p>
          </div>

          {/* Filter Tabs + Live Status */}
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-hunter/15 bg-white p-1 shadow-[0_4px_16px_rgba(20,54,40,0.05)]">
              {filterTabs.map((tab) => {
                const active = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setFilter(tab.id)}
                    className={cn(
                      "relative inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 font-mono text-[10px] font-bold tracking-[0.14em] uppercase transition-colors",
                      active
                        ? "text-chartreuse"
                        : "text-espresso/70 hover:text-hunter"
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="v3-locker-filter-pill"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 32,
                        }}
                        className="absolute inset-0 rounded-lg bg-hunter"
                      />
                    ) : null}
                    <span className="relative z-10">{tab.label}</span>
                    <span
                      className={cn(
                        "relative z-10 rounded-xs px-1 py-0.5 text-[9px] leading-none",
                        active
                          ? "bg-chartreuse/20 text-chartreuse"
                          : "bg-chrome text-espresso/70"
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="font-mono text-[10px] tracking-[0.16em] text-espresso/60 uppercase">
              {vaultOpen
                ? "STEEL DOORS SWUNG OPEN · CLICK ANY BAY TO CLAIM"
                : "HOVER GLASS TO OPEN · PEEK SEALED KEYHOLES · UNLOCK IN PASSBOOK"}
            </p>
          </div>
        </div>

        {/* 10-Locker Architectural Grid */}
        {visibleLockers.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {visibleLockers.map((item) => (
              <LockerBayCard
                key={item.product._id}
                item={item}
                vaultOpen={vaultOpen}
                onInspectProduct={onInspectProduct}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-hunter/15 bg-white px-6 py-16 text-center">
            <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-hunter text-chartreuse">
              <Unlock className="h-5 w-5" />
            </span>
            <h3 className="font-syne text-xl font-extrabold text-hunter">
              ALL FIVE STEEL VAULTS ARE UNSEALED.
            </h3>
            <p className="mt-1.5 max-w-md text-sm text-espresso/70">
              Every mystery locker in Drop 01 has swung open. Switch back to view
              all ten unlocked archival pieces.
            </p>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setFilter("all")}
              className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-hunter px-4 py-2.5 font-mono text-[10px] font-bold tracking-[0.16em] text-chartreuse uppercase"
            >
              <span>VIEW ALL 10 LOCKERS</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export function V3LockerClaimModal({
  product,
  onClose,
}: V3LockerClaimModalProps) {
  const { addToCart, setCartOpen } = useVault();

  const [selectedSize, setSelectedSize] = useState<string>("L");
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    setSelectedSize(product.sizes[0] ?? "L");
    setFeedback(null);
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [product, onClose]);

  const handleClaim = () => {
    if (!product) return;
    const result = addToCart(product, selectedSize);
    if (!result.ok) {
      setFeedback(result.message ?? "Unable to claim this archive piece.");
      return;
    }
    setCartOpen(true);
    onClose();
  };

  return (
    <AnimatePresence>
      {product ? (
        <motion.div
          key="v3-claim-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-hunter/45 p-3 backdrop-blur-sm sm:p-6"
        >
          <motion.div
            key={product._id}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Claim ${product.title}`}
            className="relative grid max-h-[92vh] w-full max-w-4xl grid-cols-1 overflow-y-auto rounded-2xl border border-hunter/25 bg-alabaster shadow-[0_30px_90px_rgba(20,54,40,0.28)] md:grid-cols-12"
          >
            {/* Close Hardware Button */}
            <button
              type="button"
              suppressHydrationWarning
              onClick={onClose}
              aria-label="Close studio claim drawer"
              className="absolute top-3.5 right-3.5 z-20 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-hunter/20 bg-white text-hunter shadow-xs transition-colors hover:border-hunter hover:bg-hunter hover:text-chartreuse"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Left Column: 3:4 Garment Chamber View */}
            <div className="bg-chrome/55 p-4 sm:p-5 md:col-span-5">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-hunter/20 bg-white">
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 420px"
                  className="object-cover"
                />

                <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-sm bg-hunter px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.16em] text-chartreuse uppercase">
                    {product.tier === "one-of-one" ? "1 OF 1 ARCHIVE" : "SMALL-BATCH"}
                  </span>
                  <span className="rounded-sm border border-hunter/15 bg-alabaster/92 px-2 py-0.5 font-mono text-[9px] font-semibold tracking-[0.14em] text-hunter uppercase">
                    {product.serialCode}
                  </span>
                </div>

                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-lg border border-hunter/15 bg-alabaster/92 px-3 py-2 font-mono text-[10px] text-hunter backdrop-blur-md">
                  <span className="font-semibold uppercase">AVAILABILITY</span>
                  <span className="font-bold">
                    {product.remainingUnits} / {product.totalUnits} LEFT
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Studio Specifications & Claim Control */}
            <div className="flex flex-col justify-between p-5 sm:p-7 md:col-span-7">
              <div>
                <div className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.18em] text-hunter/75 uppercase">
                  <Sparkles className="h-3.5 w-3.5 text-hunter" />
                  <span>KNITX® STUDIO VAULT SHEET</span>
                  {product.creatorCredit ? (
                    <>
                      <span>·</span>
                      <span>{product.creatorCredit}</span>
                    </>
                  ) : null}
                </div>

                <h3 className="mt-2 pr-10 font-syne text-2xl leading-tight font-extrabold tracking-[-0.03em] text-hunter sm:text-3xl">
                  {product.title}
                </h3>

                <div className="mt-2 flex items-baseline gap-3">
                  <span className="font-mono text-2xl font-bold text-espresso">
                    {formatInr(product.priceInr)}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.16em] text-espresso/60 uppercase">
                    INCL. PAN-INDIA INSURED COURIER
                  </span>
                </div>

                <p className="mt-3.5 text-sm leading-relaxed text-espresso/80">
                  {product.description}
                </p>

                {/* Edition Specs Matrix */}
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-hunter/15 bg-white p-3">
                    <p className="font-mono text-[9px] font-semibold tracking-[0.16em] text-hunter/65 uppercase">
                      FABRIC WEIGHT
                    </p>
                    <p className="mt-1 font-mono text-xs font-bold text-espresso">
                      {product.gsmWeight}
                    </p>
                  </div>

                  <div className="rounded-xl border border-hunter/15 bg-white p-3">
                    <p className="font-mono text-[9px] font-semibold tracking-[0.16em] text-hunter/65 uppercase">
                      SAMPLE-FIRST BUILD
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-xs font-bold text-hunter">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Cut &amp; sewn in {product.productionDays} days</span>
                    </p>
                  </div>

                  <div className="col-span-2 rounded-xl border border-hunter/15 bg-white p-3">
                    <p className="font-mono text-[9px] font-semibold tracking-[0.16em] text-hunter/65 uppercase">
                      MILL SPECIFICATION
                    </p>
                    <p className="mt-1 text-xs font-medium text-espresso">
                      {product.fabric}
                    </p>
                  </div>
                </div>

                {/* Craftsmanship Notes */}
                {product.craftsmanship.length > 0 ? (
                  <div className="mt-4">
                    <p className="mb-2 font-mono text-[9px] font-semibold tracking-[0.18em] text-hunter/70 uppercase">
                      CONSTRUCTION DETAILS
                    </p>
                    <ul className="space-y-1.5">
                      {product.craftsmanship.map((detail) => (
                        <li
                          key={detail}
                          className="flex items-start gap-2 text-xs text-espresso/80"
                        >
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-hunter" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {/* Size Selector Pills */}
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between font-mono text-[10px] tracking-[0.16em] text-hunter uppercase">
                    <span className="font-bold">SELECT SIZE</span>
                    <span className="text-espresso/60">CUT TO YOUR CLAIM</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
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
                            "inline-flex min-w-12 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3.5 py-2 font-mono text-xs font-bold tracking-[0.12em] uppercase transition-all",
                            active
                              ? "border-hunter bg-hunter text-chartreuse shadow-xs"
                              : "border-hunter/20 bg-white text-espresso hover:border-hunter"
                          )}
                        >
                          {active ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-chartreuse" />
                          ) : null}
                          <span>{size}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {feedback ? (
                  <p className="mt-3 rounded-lg border border-hunter/25 bg-white px-3 py-2 font-mono text-[11px] font-semibold text-hunter">
                    {feedback}
                  </p>
                ) : null}
              </div>

              {/* Claim Action Footer */}
              <div className="mt-6 border-t border-hunter/15 pt-4">
                <button
                  type="button"
                  suppressHydrationWarning
                  disabled={product.remainingUnits <= 0}
                  onClick={handleClaim}
                  className={cn(
                    "inline-flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 font-mono text-xs font-bold tracking-[0.16em] uppercase transition-all",
                    product.remainingUnits > 0
                      ? "bg-hunter text-chartreuse shadow-[0_12px_28px_rgba(20,54,40,0.22)] hover:bg-hunter/94 active:scale-[0.99]"
                      : "cursor-not-allowed bg-chrome text-espresso/50"
                  )}
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>
                    {product.remainingUnits > 0
                      ? `CLAIM INTO BAG — ${formatInr(product.priceInr)}`
                      : "ARCHIVE PIECE SOLD OUT"}
                  </span>
                </button>

                <div className="mt-2.5 flex items-center justify-center gap-1.5 font-mono text-[9px] tracking-[0.16em] text-espresso/60 uppercase">
                  <ShieldCheck className="h-3.5 w-3.5 text-hunter" />
                  <span>
                    SAMPLE-FIRST ARCHIVE · ZERO DEADSTOCK · PAN-INDIA DISPATCH
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
