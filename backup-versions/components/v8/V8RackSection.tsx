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
  ArrowRight,
  Check,
  Clock,
  Lock,
  Scissors,
  ShieldAlert,
  ShoppingBag,
  Unlock,
  X,
} from "lucide-react";
import { useVault } from "@/context/VaultContext";
import type { Product, ProductTier } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";

export interface V8RackSectionProps {
  products: Product[];
  onInspectProduct: (p: Product) => void;
}

export interface V8ProductSheetProps {
  product: Product | null;
  onClose: () => void;
}

type RackFilter = "all" | "open" | "zipped" | "one-of-one";

const LEGACY_TO_LIGHT_IMAGE: Record<string, string> = {
  "/images/piece-1of1-kali.png": "/images/look-1of1-jacket.jpg",
  "/images/piece-1of1-monolith.png": "/images/look-1of1-knit.jpg",
  "/images/piece-batch-puff.png": "/images/look-batch-hoodie.jpg",
  "/images/piece-batch-embroidery.png": "/images/look-batch-tee.jpg",
  "/images/piece-mystery-silhouette.png": "/images/look-mystery-veil.jpg",
};

const LIGHT_FALLBACKS = [
  "/images/look-1of1-jacket.jpg",
  "/images/look-1of1-knit.jpg",
  "/images/look-batch-hoodie.jpg",
  "/images/look-batch-tee.jpg",
];

function resolveStudioImage(
  url: string | undefined,
  tier: ProductTier,
  index: number
): string {
  if (!url) {
    return tier === "one-of-one"
      ? LIGHT_FALLBACKS[index % 2]
      : LIGHT_FALLBACKS[2 + (index % 2)];
  }
  return LEGACY_TO_LIGHT_IMAGE[url] ?? url;
}

/** Minimal machined chrome hanger clip suspending each card from the horizontal rail */
function ChromeHangerClip() {
  return (
    <div
      aria-hidden="true"
      className="relative z-20 mx-auto -mb-2 flex flex-col items-center select-none"
    >
      <div className="h-3 w-5 rounded-t-full border border-b-0 border-ink/20 bg-gradient-to-b from-[#F5F4F1] via-[#D8D5CE] to-[#B6B2A9]" />
      <div className="h-2.5 w-1.5 bg-gradient-to-r from-[#AEAAA1] via-[#F2F1EE] to-[#9E9A91]" />
      <div className="flex h-3.5 w-10 items-center justify-center rounded-[4px] border border-ink/20 bg-gradient-to-b from-[#F9F8F5] via-[#DDDAD3] to-[#B9B5AC] shadow-[0_2px_6px_rgba(0,0,0,0.09)]">
        <span className="h-0.5 w-4 rounded-full bg-ink/20" />
      </div>
    </div>
  );
}

/** Clean Open Garment Card suspended from the showroom rail */
function OpenGarmentCard({
  product,
  index,
  wasUnzipped,
  onInspect,
}: {
  product: Product;
  index: number;
  wasUnzipped: boolean;
  onInspect: (p: Product) => void;
}) {
  const isOneOfOne = product.tier === "one-of-one";
  const imageSrc = resolveStudioImage(product.imageUrl, product.tier, index);

  return (
    <div className="flex flex-col items-center">
      <ChromeHangerClip />

      <motion.article
        whileHover={{
          rotate: [-0.6, 0.6, 0],
          transition: { duration: 0.68, ease: "easeInOut" },
        }}
        style={{ transformOrigin: "top center" }}
        className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white p-3 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-shadow duration-300 hover:shadow-[0_20px_48px_rgba(0,0,0,0.08)]"
      >
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => onInspect(product)}
          className="flex w-full cursor-pointer flex-col text-left focus:outline-none"
        >
          {/* 3:4 Clean Studio Photo */}
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-linen">
            <Image
              src={imageSrc}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 24vw"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.035]"
            />

            {/* Minimal Top-Left Badge */}
            <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
              {isOneOfOne ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange px-2.5 py-1 font-mono text-[9.5px] font-bold tracking-[0.14em] text-white uppercase shadow-xs">
                  1 OF 1
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white/90 px-2.5 py-1 font-mono text-[9.5px] font-semibold tracking-[0.12em] text-ink uppercase backdrop-blur-md">
                  {product.remainingUnits}/{product.totalUnits} left
                </span>
              )}

              {wasUnzipped ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-0.5 font-mono text-[9px] font-semibold tracking-[0.14em] text-white uppercase">
                  <Check className="h-2.5 w-2.5 text-orange" />
                  UNZIPPED
                </span>
              ) : null}
            </div>

            {/* Quiet Bottom-Left Serial Code */}
            <span className="absolute bottom-3 left-3 rounded-full border border-white/50 bg-white/86 px-2.5 py-0.5 font-mono text-[9.5px] font-semibold tracking-[0.14em] text-ink uppercase backdrop-blur-md">
              {product.serialCode}
            </span>
          </div>

          {/* Minimal 2-Line Footer */}
          <div className="mt-3.5 px-1 pb-1">
            <h3 className="truncate font-poster text-[1.35rem] leading-tight tracking-wide text-ink uppercase transition-colors group-hover:text-orange">
              {product.title}
            </h3>

            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-ink">
                {formatInr(product.priceInr)}
              </span>

              <span
                className={cn(
                  "font-mono text-[10px] font-semibold tracking-[0.12em] uppercase",
                  isOneOfOne ? "text-orange" : "text-[#64625D]"
                )}
              >
                {isOneOfOne
                  ? "1 OF 1"
                  : `${product.remainingUnits}/${product.totalUnits} left`}
              </span>
            </div>
          </div>
        </button>
      </motion.article>
    </div>
  );
}

/** Sealed Mystery Ripstop Garment Bag with Real Draggable Metal Zipper Pull */
function SealedZipperBagCard({ product }: { product: Product }) {
  const zipY = useMotionValue(0);
  const [pinAlert, setPinAlert] = useState(false);
  const [isDraggingZip, setIsDraggingZip] = useState(false);
  const alertTimerRef = useRef<number | null>(null);

  const isOneOfOne = product.tier === "one-of-one";

  const leftFlapClip = useTransform(zipY, (y) => {
    const p = Math.max(0, Math.min(1, y / 128));
    const openHalf = p * 38;
    const splitDepth = 5 + p * 52;
    return `polygon(0% 0%, ${50 - openHalf}% 0%, 50% ${splitDepth}%, 50% 100%, 0% 100%)`;
  });

  const rightFlapClip = useTransform(zipY, (y) => {
    const p = Math.max(0, Math.min(1, y / 128));
    const openHalf = p * 38;
    const splitDepth = 5 + p * 52;
    return `polygon(${50 + openHalf}% 0%, 100% 0%, 100% 100%, 50% 100%, 50% ${splitDepth}%)`;
  });

  const peekScale = useTransform(zipY, [0, 128], [1.05, 1]);
  const peekOpacity = useTransform(zipY, [0, 128], [0.52, 0.94]);
  const trackTop = useTransform(zipY, (y) => `${Math.max(12, y + 26)}px`);
  const pullHintOpacity = useTransform(zipY, [0, 32], [1, 0]);

  const triggerLockPill = useCallback(() => {
    setPinAlert(true);
    if (alertTimerRef.current !== null) {
      window.clearTimeout(alertTimerRef.current);
    }
    alertTimerRef.current = window.setTimeout(() => {
      setPinAlert(false);
    }, 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (alertTimerRef.current !== null) {
        window.clearTimeout(alertTimerRef.current);
      }
    };
  }, []);

  useMotionValueEvent(zipY, "change", (latest) => {
    if (latest >= 104 && !pinAlert) {
      triggerLockPill();
    }
  });

  const handleZipDragEnd = useCallback(() => {
    setIsDraggingZip(false);
    if (zipY.get() >= 92) {
      triggerLockPill();
    }
    animate(zipY, 0, {
      type: "spring",
      stiffness: 260,
      damping: 20,
    });
  }, [zipY, triggerLockPill]);

  const handleTeaseTap = useCallback(() => {
    if (isDraggingZip) return;
    animate(zipY, 110, {
      duration: 0.34,
      ease: [0.22, 1, 0.36, 1],
      onComplete: () => {
        triggerLockPill();
        window.setTimeout(() => {
          animate(zipY, 0, {
            type: "spring",
            stiffness: 240,
            damping: 19,
          });
        }, 280);
      },
    });
  }, [isDraggingZip, zipY, triggerLockPill]);

  return (
    <div className="flex flex-col items-center">
      <ChromeHangerClip />

      <article className="relative flex w-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white p-3 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
        {/* Frosted Ripstop Garment Bag Viewport */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-ink/8 bg-linen select-none">
          {/* Silhouette Revealed Inside V-Parting */}
          <motion.div
            style={{ scale: peekScale, opacity: peekOpacity }}
            className="absolute inset-0"
          >
            <Image
              src="/images/look-mystery-veil.jpg"
              alt={`Sealed piece ${product.serialCode}`}
              fill
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 24vw"
              className="pointer-events-none object-cover object-center contrast-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/15 via-transparent to-ink/35" />
          </motion.div>

          {/* Left Frosted Ripstop Flap */}
          <motion.div
            style={{
              clipPath: leftFlapClip,
              backgroundImage:
                "linear-gradient(to right, rgba(10,10,10,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,10,10,0.04) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
            className="pointer-events-none absolute inset-0 bg-porcelain/80 backdrop-blur-md"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/55 via-transparent to-linen/40" />
          </motion.div>

          {/* Right Frosted Ripstop Flap */}
          <motion.div
            style={{
              clipPath: rightFlapClip,
              backgroundImage:
                "linear-gradient(to right, rgba(10,10,10,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,10,10,0.04) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
            className="pointer-events-none absolute inset-0 bg-porcelain/80 backdrop-blur-md"
          >
            <div className="absolute inset-0 bg-gradient-to-bl from-white/55 via-transparent to-linen/40" />
          </motion.div>

          {/* Minimal Top-Left Sealed Tag */}
          <div className="pointer-events-none absolute top-3 left-3 z-20">
            {isOneOfOne ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.14em] text-white uppercase">
                1 OF 1 · SEALED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-white/88 px-2.5 py-1 font-mono text-[9px] font-semibold tracking-[0.14em] text-ink uppercase backdrop-blur-md">
                <Lock className="h-2.5 w-2.5 text-[#64625D]" />
                ZIPPED
              </span>
            )}
          </div>

          {/* Vertical Center Metal Zipper Teeth */}
          <motion.div
            aria-hidden="true"
            style={{ top: trackTop }}
            className="pointer-events-none absolute bottom-0 left-1/2 z-20 w-[6px] -translate-x-1/2 border-x border-dashed border-ink/30 bg-gradient-to-r from-[#D5D2CA] via-[#F7F6F3] to-[#C8C5BC]"
          />

          {/* Draggable Metal Zipper Pull Tab */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 128 }}
            dragElastic={0.1}
            dragMomentum={false}
            onDragStart={() => setIsDraggingZip(true)}
            onDragEnd={handleZipDragEnd}
            onClick={handleTeaseTap}
            style={{ y: zipY }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            aria-label={`Drag zipper down to peek inside ${product.serialCode}`}
            className="absolute top-3 left-1/2 z-30 flex -translate-x-1/2 cursor-grab flex-col items-center touch-none active:cursor-grabbing"
          >
            <div className="flex h-5 w-4.5 items-center justify-center rounded-[4px] border border-ink/25 bg-gradient-to-b from-[#FFFFFF] via-[#D8D5CE] to-[#A7A39A] shadow-[0_3px_8px_rgba(0,0,0,0.16)]">
              <span className="h-2 w-1 rounded-full bg-ink/30" />
            </div>

            <div className="-mt-0.5 flex h-10 w-5.5 flex-col items-center justify-between rounded-b-full border border-ink/25 bg-gradient-to-b from-[#F4F3F0] via-[#D9D6CE] to-[#B7B3AA] py-1.5 shadow-[0_6px_14px_rgba(0,0,0,0.14)]">
              <span className="font-mono text-[6.5px] font-bold tracking-tighter text-ink/75">
                KX
              </span>
              <span className="h-2 w-2 rounded-full border border-ink/25 bg-white/80" />
            </div>

            <motion.span
              style={{ opacity: pullHintOpacity }}
              animate={{ y: [0, 3, 0] }}
              transition={{
                repeat: Infinity,
                duration: 1.8,
                ease: "easeInOut",
              }}
              className="mt-2 rounded-full border border-ink/10 bg-white/92 px-2.5 py-0.5 font-mono text-[8.5px] font-semibold tracking-[0.14em] text-ink uppercase shadow-xs whitespace-nowrap"
            >
              PULL ZIP ↓
            </motion.span>
          </motion.div>

          {/* Safety-Orange Waitlist Lock Pill on Pull */}
          <AnimatePresence>
            {pinAlert ? (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                className="pointer-events-none absolute inset-x-3 bottom-3 z-40 flex items-center gap-2 rounded-xl bg-orange px-3 py-2.5 text-white shadow-[0_12px_28px_rgba(255,69,0,0.34)]"
              >
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                <p className="font-mono text-[9px] leading-snug font-bold tracking-[0.12em] uppercase">
                  WAITLIST LOCKED · CLEAR LINE TO UNZIP
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Quiet Serial Chip when lock pill is hidden */}
          {!pinAlert ? (
            <span className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-full border border-white/50 bg-white/86 px-2.5 py-0.5 font-mono text-[9.5px] font-semibold tracking-[0.14em] text-ink uppercase backdrop-blur-md">
              {product.serialCode}
            </span>
          ) : null}
        </div>

        {/* Minimal 2-Line Footer */}
        <div className="mt-3.5 px-1 pb-1">
          <h3 className="truncate font-poster text-[1.35rem] leading-tight tracking-wide text-ink uppercase">
            SEALED PIECE {product.serialCode}
          </h3>

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-[#64625D]">
              Drag zip to peek
            </span>

            <a
              href="#v8-waitlist"
              className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-orange uppercase transition-colors hover:text-ink"
            >
              <span>Unlock</span>
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}

export default function V8RackSection({
  products,
  onInspectProduct,
}: V8RackSectionProps) {
  const { isVaultUnlocked } = useVault();
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<RackFilter>("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  const showUnlocked = mounted && isVaultUnlocked;

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
    { id: "all", label: `ALL ${products.length}` },
    { id: "open", label: "OPEN" },
    { id: "zipped", label: showUnlocked ? "UNZIPPED" : "ZIPPED" },
    { id: "one-of-one", label: "1-OF-1" },
  ];

  return (
    <section
      id="v8-rack"
      className="relative overflow-x-clip border-t border-ink/10 bg-porcelain py-24 sm:py-28"
    >
      <div className="mx-auto max-w-[1320px] px-4 sm:px-8">
        {/* Clean Editorial Header + Minimal Filter Pill */}
        <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.2em] text-[#64625D] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-orange" />
              <span>DROP 01 · GARMENT RAIL</span>
            </div>

            <h2 className="font-poster text-5xl leading-[0.9] tracking-tight text-ink uppercase sm:text-7xl">
              THE 10-PIECE RACK.
            </h2>

            <p className="mt-3 max-w-xl text-sm text-[#64625D] sm:text-base">
              {showUnlocked
                ? "Your number is live. All 10 pieces are unzipped and ready to inspect."
                : "5 revealed today. 5 zipped shut until your number is called."}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.16em] uppercase">
              {showUnlocked ? (
                <>
                  <Unlock className="h-3.5 w-3.5 text-orange" />
                  <span className="text-orange">ALL 10 UNZIPPED</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 text-[#64625D]" />
                  <span className="text-[#64625D]">
                    DRAG ANY ZIPPER TO PEEK
                  </span>
                </>
              )}
            </div>

            <div
              role="tablist"
              aria-label="Filter garment rack"
              className="flex flex-wrap items-center gap-1 rounded-full border border-ink/10 bg-white p-1 shadow-[0_6px_18px_rgba(0,0,0,0.03)]"
            >
              {filterTabs.map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    suppressHydrationWarning
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveFilter(tab.id)}
                    className={cn(
                      "relative cursor-pointer rounded-full px-3.5 py-1.5 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase transition-colors",
                      isActive ? "text-white" : "text-[#64625D] hover:text-ink"
                    )}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="v8-rack-filter-pill"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 32,
                        }}
                        className={cn(
                          "absolute inset-0 rounded-full",
                          tab.id === "one-of-one" ? "bg-orange" : "bg-ink"
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

        {/* Sleek Brushed-Aluminum Showroom Rail */}
        <div className="relative mt-12">
          <div className="relative flex items-center">
            <div className="h-4 w-2.5 rounded-l-md border border-ink/18 bg-gradient-to-b from-[#F1EFEA] via-[#CCC8C0] to-[#A4A097]" />
            <div className="relative h-3 flex-1 border-y border-ink/18 bg-gradient-to-b from-[#F6F5F2] via-[#D5D2CA] to-[#AEAAA1] shadow-[0_5px_14px_rgba(0,0,0,0.08)]">
              <div className="absolute inset-x-0 top-[2px] h-px bg-white/85" />
            </div>
            <div className="h-4 w-2.5 rounded-r-md border border-ink/18 bg-gradient-to-b from-[#F1EFEA] via-[#CCC8C0] to-[#A4A097]" />
          </div>

          {/* Suspended Garment Grid */}
          <div className="-mt-0.5 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product, index) => {
              const isSealedBag = product.isMystery && !showUnlocked;
              const wasUnzipped = product.isMystery && showUnlocked;

              return (
                <div key={product._id} className="relative">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-x-3 top-1 h-0.5 rounded-full bg-ink/8"
                  />

                  {isSealedBag ? (
                    <SealedZipperBagCard product={product} />
                  ) : (
                    <OpenGarmentCard
                      product={product}
                      index={index}
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

/** Clean Porcelain Slide-Over Product Sheet */
export function V8ProductSheet({ product, onClose }: V8ProductSheetProps) {
  const { addToCart, setCartOpen, isVaultUnlocked } = useVault();
  const [mounted, setMounted] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [feedback, setFeedback] = useState<string | null>(null);

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
      setFeedback(result.message || "Unable to reserve this piece.");
      return;
    }
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
          className="fixed inset-0 z-50 flex justify-end"
        >
          {/* Soft Frosted Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/35 backdrop-blur-sm"
          />

          {/* Clean Porcelain Slide-Over Sheet */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="relative z-10 flex h-full w-full max-w-[520px] flex-col overflow-y-auto border-l border-ink/10 bg-porcelain shadow-[0_24px_80px_rgba(0,0,0,0.2)]"
          >
            {/* Top Bar */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-ink/10 bg-porcelain/92 px-6 py-4 backdrop-blur-md">
              <div className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#64625D] uppercase">
                <span>{product.serialCode}</span>
                <span>·</span>
                <span className={isOneOfOne ? "text-orange" : "text-ink"}>
                  {isOneOfOne
                    ? "1 OF 1"
                    : `${product.remainingUnits}/${product.totalUnits} LEFT`}
                </span>
              </div>

              <button
                type="button"
                suppressHydrationWarning
                onClick={onClose}
                aria-label="Close product sheet"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-ink/10 bg-white text-ink transition-colors hover:bg-ink hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 p-6">
              {/* 3:4 Studio Photo */}
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-ink/10 bg-linen">
                <Image
                  src={
                    isLockedMystery
                      ? "/images/look-mystery-veil.jpg"
                      : resolveStudioImage(product.imageUrl, product.tier, 0)
                  }
                  alt={product.title}
                  fill
                  sizes="(max-width: 640px) 92vw, 480px"
                  className={cn(
                    "object-cover object-center",
                    isLockedMystery && "blur-xs"
                  )}
                />
              </div>

              {/* Title + Price */}
              <div className="mt-6 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-poster text-4xl leading-[0.94] tracking-wide text-ink uppercase">
                    {product.title}
                  </h3>
                  {product.creatorCredit ? (
                    <p className="mt-1.5 font-mono text-[10px] tracking-[0.14em] text-[#64625D] uppercase">
                      Design credit · {product.creatorCredit}
                    </p>
                  ) : null}
                </div>

                <span className="shrink-0 font-mono text-lg font-bold text-ink">
                  {formatInr(product.priceInr)}
                </span>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-[#64625D]">
                {product.description}
              </p>

              {/* GSM & Fabric Specs */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-ink/10 bg-white p-3.5">
                  <p className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#64625D] uppercase">
                    Weight
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {product.gsmWeight}
                  </p>
                </div>

                <div className="rounded-2xl border border-ink/10 bg-white p-3.5">
                  <p className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#64625D] uppercase">
                    Fabric
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {product.fabric}
                  </p>
                </div>
              </div>

              {/* Cut to order timing */}
              <div className="mt-3 flex items-center gap-2.5 rounded-2xl border border-ink/10 bg-linen/70 px-4 py-3 text-xs font-medium text-ink">
                <Scissors className="h-3.5 w-3.5 shrink-0 text-orange" />
                <span>Cut to order in {product.productionDays} days</span>
                <span className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] text-[#64625D] uppercase">
                  <Clock className="h-3 w-3" />
                  PAN-INDIA
                </span>
              </div>

              {/* Craftsmanship Notes */}
              {product.craftsmanship.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {product.craftsmanship.map((note) => (
                    <span
                      key={note}
                      className="rounded-full border border-ink/10 bg-white px-3 py-1 font-mono text-[10px] text-[#64625D]"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              ) : null}

              {/* Size Selector Pills */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#64625D] uppercase">
                    Select Size
                  </span>
                  <span className="font-mono text-[10px] text-[#64625D]">
                    Relaxed boxy cut
                  </span>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-2">
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
                          "min-w-12 cursor-pointer rounded-full border px-4 py-2 font-mono text-xs font-semibold uppercase transition-colors",
                          active
                            ? "border-ink bg-ink text-white"
                            : "border-ink/12 bg-white text-ink hover:border-ink/35"
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {feedback ? (
                <p className="mt-4 rounded-xl border border-orange/25 bg-orange/8 px-3.5 py-2.5 font-mono text-xs text-orange">
                  {feedback}
                </p>
              ) : null}
            </div>

            {/* Sticky Bottom CTA */}
            <div className="sticky bottom-0 border-t border-ink/10 bg-porcelain/95 p-5 backdrop-blur-md">
              <button
                type="button"
                suppressHydrationWarning
                disabled={isLockedMystery || isSoldOut}
                onClick={handleAddToBag}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-4 font-mono text-xs font-bold tracking-[0.15em] uppercase transition-colors",
                  isLockedMystery || isSoldOut
                    ? "cursor-not-allowed bg-linen text-[#64625D]"
                    : "bg-orange text-white shadow-[0_12px_28px_rgba(255,69,0,0.28)] hover:bg-ink"
                )}
              >
                <ShoppingBag className="h-4 w-4" />
                <span>
                  {isLockedMystery
                    ? "WAITLIST LOCKED"
                    : isSoldOut
                      ? "SOLD OUT"
                      : `ADD TO BAG — ${formatInr(product.priceInr)}`}
                </span>
              </button>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
