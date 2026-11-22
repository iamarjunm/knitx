"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Clock,
  KeyRound,
  Lock,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import type { DropCampaign, Product } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";

export interface V9VaultPageClientProps {
  drop: DropCampaign;
  products: Product[];
}

export interface V9GarmentDrawerProps {
  product: Product | null;
  onClose: () => void;
}

type VaultFilter = "all" | "one-of-one" | "small-batch" | "unveiled";

const VEIL_CROP_POSITIONS = [
  "object-[18%_20%]",
  "object-[34%_25%]",
  "object-[50%_18%]",
  "object-[66%_26%]",
  "object-[82%_20%]",
] as const;

const SILKY_EASE = [0.22, 1, 0.36, 1] as const;
const CURTAIN_EASE = [0.76, 0, 0.24, 1] as const;

export function V9GarmentDrawer({ product, onClose }: V9GarmentDrawerProps) {
  const router = useRouter();
  const { isVaultUnlocked, addToCart, setCartOpen } = useVault();

  const [mounted, setMounted] = useState(false);
  const [sizeChoice, setSizeChoice] = useState<{
    productId: string;
    size: string;
  } | null>(null);
  const [feedback, setFeedback] = useState<{
    productId: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const canReserve = mounted && isVaultUnlocked;

  const selectedSize = useMemo(() => {
    if (!product) return "";
    if (sizeChoice && sizeChoice.productId === product._id) {
      return sizeChoice.size;
    }
    return product.sizes[0] || "ONE SIZE";
  }, [product, sizeChoice]);

  const activeFeedback =
    product && feedback && feedback.productId === product._id
      ? feedback.message
      : null;

  useEffect(() => {
    if (!product) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [product, onClose]);

  const handleReserve = () => {
    if (!product || !canReserve) return;
    if (product.remainingUnits <= 0) {
      setFeedback({
        productId: product._id,
        message: "This numbered archive piece has been fully claimed.",
      });
      return;
    }

    const chosenSize = selectedSize || product.sizes[0] || "ONE SIZE";
    const result = addToCart(product, chosenSize);

    if (!result.ok) {
      setFeedback({
        productId: product._id,
        message: result.message || "Unable to reserve this garment right now.",
      });
      return;
    }

    setFeedback(null);
    setCartOpen(true);
    onClose();
  };

  const handleJoinWaitlistToReserve = () => {
    onClose();
    if (typeof window !== "undefined") {
      const waitlistSection = document.getElementById("waitlist");
      if (waitlistSection) {
        window.setTimeout(() => {
          waitlistSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 90);
        return;
      }
    }
    router.push("/v9#waitlist");
  };

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          key="v9-garment-drawer-shell"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: SILKY_EASE }}
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="v9-garment-drawer-title"
        >
          {/* Warm Obsidian Backdrop */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-[#111110]/45 backdrop-blur-[3px]"
          />

          {/* Silky Right-Hand Slide-Over Panel */}
          <motion.aside
            key={product._id}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.42, ease: SILKY_EASE }}
            className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-[#DDD7CB] bg-[#FFFFFF] text-[#111110] shadow-[-24px_0_80px_rgba(17,17,15,0.14)]"
          >
            {/* Top Drawer Header */}
            <div className="flex items-center justify-between border-b border-[#DDD7CB] bg-[#FFFFFF]/95 px-6 py-4 backdrop-blur-sm sm:px-8">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[11px] font-medium tracking-[0.2em] text-[#9A7B4F] uppercase">
                  {product.serialCode}
                </span>
                <span className="text-[#DDD7CB]">·</span>
                <span className="font-mono text-[10px] tracking-[0.18em] text-[#6A655D] uppercase">
                  {product.tier === "one-of-one"
                    ? "01 / 01 SINGULAR EDITION"
                    : `EDITION OF ${product.totalUnits}`}
                </span>
              </div>

              <button
                type="button"
                suppressHydrationWarning
                onClick={onClose}
                aria-label="Close garment dossier"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#DDD7CB] text-[#111110] transition-colors duration-200 hover:border-[#111110] hover:bg-[#F7F5F0] focus:outline-none"
              >
                <X className="h-4 w-4 stroke-[1.75]" />
              </button>
            </div>

            {/* Scrollable Garment Dossier */}
            <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
              {/* Tall 3:4 Portrait Photograph */}
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-[#DDD7CB] bg-[#ECE8DF]">
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 448px"
                  className="object-cover"
                  priority
                />
              </div>

              {/* Serial, GSM & Unveiled Metadata */}
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <span className="rounded-full border border-[#DDD7CB] bg-[#F7F5F0] px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-[#111110] uppercase">
                  {product.serialCode}
                </span>
                <span className="rounded-full bg-[#ECE8DF] px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-[#111110] uppercase">
                  {product.gsmWeight}
                </span>
                {product.isMystery && (
                  <span className="font-mono text-[10px] font-medium tracking-[0.2em] text-[#8E1C1C] uppercase">
                    · UNVEILED
                  </span>
                )}
              </div>

              {/* Title & Pricing */}
              <h2
                id="v9-garment-drawer-title"
                className="mt-4 font-poster text-3xl leading-[1.02] tracking-wide text-[#111110] uppercase sm:text-4xl"
              >
                {product.title}
              </h2>

              <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3 border-b border-[#DDD7CB] pb-5">
                <p className="font-mono text-2xl font-medium tracking-tight text-[#111110]">
                  {formatInr(product.priceInr)}
                </p>
                <p className="font-mono text-[11px] tracking-[0.16em] text-[#6A655D] uppercase">
                  {product.remainingUnits > 0
                    ? `${product.remainingUnits} OF ${product.totalUnits} REMAINING`
                    : "SOLD OUT · ARCHIVED"}
                </p>
              </div>

              {/* Editorial Summary */}
              <p className="mt-5 font-sans text-sm leading-relaxed text-[#6A655D]">
                {product.description}
              </p>

              {product.creatorCredit && (
                <p className="mt-3 font-mono text-[11px] tracking-[0.16em] text-[#9A7B4F] uppercase">
                  ARCHIVE CREDIT · {product.creatorCredit}
                </p>
              )}

              {/* Fabric & Craftsmanship Details */}
              <div className="mt-6 rounded-xl border border-[#DDD7CB] bg-[#F7F5F0] p-5">
                <p className="font-mono text-[10px] tracking-[0.22em] text-[#9A7B4F] uppercase">
                  FABRIC &amp; CRAFTSMANSHIP
                </p>
                <p className="mt-2 font-sans text-sm font-medium text-[#111110]">
                  {product.fabric}
                </p>
                <ul className="mt-3.5 space-y-2">
                  {product.craftsmanship.map((detail) => (
                    <li
                      key={detail}
                      className="flex items-start gap-2.5 font-sans text-xs leading-relaxed text-[#6A655D]"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[#9A7B4F]" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sample-First Production Note */}
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#DDD7CB] bg-[#FFFFFF] p-4">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#9A7B4F]" />
                <div>
                  <p className="font-mono text-[11px] font-medium tracking-[0.12em] text-[#111110] uppercase">
                    Cut &amp; sewn to order in {product.productionDays} days ·
                    Pan-India insured dispatch
                  </p>
                  <p className="mt-1 font-sans text-xs text-[#6A655D]">
                    Sample-first production across India. Zero deadstock; each
                    piece is individually numbered upon completion.
                  </p>
                </div>
              </div>

              {/* Crisp Size Selector Pills (Unlocked Vault Members Only) */}
              {canReserve && (
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] tracking-[0.22em] text-[#6A655D] uppercase">
                      SELECT SIZE
                    </span>
                    <span className="font-mono text-[11px] font-medium tracking-[0.14em] text-[#111110] uppercase">
                      {selectedSize}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.sizes.map((size) => {
                      const isSelected = selectedSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          suppressHydrationWarning
                          onClick={() => {
                            setSizeChoice({ productId: product._id, size });
                            setFeedback(null);
                          }}
                          className={cn(
                            "cursor-pointer rounded-full border px-4 py-2 font-mono text-xs tracking-[0.14em] uppercase transition-all duration-200 focus:outline-none",
                            isSelected
                              ? "border-[#111110] bg-[#111110] text-[#FFFFFF]"
                              : "border-[#DDD7CB] bg-[#FFFFFF] text-[#111110] hover:border-[#111110]"
                          )}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {canReserve && activeFeedback && (
                <p className="mt-4 rounded-lg border border-[#8E1C1C]/30 bg-[#8E1C1C]/5 px-3.5 py-2.5 font-sans text-xs text-[#8E1C1C]">
                  {activeFeedback}
                </p>
              )}
            </div>

            {/* Sticky Reservation / Waitlist-Gated CTA Footer */}
            <div className="border-t border-[#DDD7CB] bg-[#FFFFFF] px-6 py-5 sm:px-8">
              {canReserve ? (
                <>
                  <button
                    type="button"
                    suppressHydrationWarning
                    disabled={product.remainingUnits <= 0}
                    onClick={handleReserve}
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full px-6 py-4 font-sans text-xs font-semibold tracking-[0.2em] uppercase transition-colors duration-300 focus:outline-none",
                      product.remainingUnits <= 0
                        ? "cursor-not-allowed bg-[#ECE8DF] text-[#6A655D]"
                        : product.tier === "one-of-one"
                          ? "bg-[#8E1C1C] text-[#FFFFFF] hover:bg-[#731515]"
                          : "bg-[#111110] text-[#FFFFFF] hover:bg-[#8E1C1C]"
                    )}
                  >
                    <span>
                      {product.remainingUnits <= 0
                        ? "SOLD OUT · PERMANENTLY ARCHIVED"
                        : `RESERVE PIECE — ${formatInr(product.priceInr)}`}
                    </span>
                    {product.remainingUnits > 0 && (
                      <ArrowRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <p className="mt-2.5 text-center font-mono text-[10px] tracking-[0.16em] text-[#6A655D] uppercase">
                    10-MINUTE VAULT HOLD · INSURED PAN-INDIA DELIVERY
                  </p>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={handleJoinWaitlistToReserve}
                    className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-[#8E1C1C] px-6 py-4 font-sans text-xs font-semibold tracking-[0.2em] text-[#FFFFFF] uppercase shadow-[0_12px_28px_-14px_rgba(142,28,28,0.55)] transition-colors duration-300 hover:bg-[#731515] focus:outline-none"
                  >
                    <Lock className="h-3.5 w-3.5 stroke-[2]" />
                    <span>JOIN WAITLIST TO RESERVE →</span>
                  </button>
                  <p className="mt-3 text-center font-sans text-[11px] leading-relaxed text-[#6A655D]">
                    Exclusive to admitted Drop 01 waitlist members — or enter
                    key{" "}
                    <Link
                      href="/v9/vault"
                      onClick={onClose}
                      className="font-mono font-medium tracking-[0.1em] text-[#111110] underline decoration-[#9A7B4F]/60 underline-offset-4 transition-colors hover:text-[#8E1C1C]"
                    >
                      KNITX-001
                    </Link>{" "}
                    in the Vault.
                  </p>
                </>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function V9VaultPageClient({
  drop,
  products,
}: V9VaultPageClientProps) {
  const { user } = useAuth();
  const {
    isVaultUnlocked,
    waitlistPass,
    joinWaitlist,
    unlockVaultDemo,
    unlockVaultWithCode,
    lockVaultPreview,
  } = useVault();

  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<VaultFilter>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Waitlist form state (null means fall back cleanly to activeUser if present)
  const [nameInput, setNameInput] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState<string | null>(null);
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  // Access code state
  const [accessCode, setAccessCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  // Silky 0.85s horizontal ivory & obsidian double-curtain state
  const [curtainVisible, setCurtainVisible] = useState(false);
  const [curtainParting, setCurtainParting] = useState(false);
  const curtainTimersRef = useRef<number[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      curtainTimersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const vaultOpen = mounted && isVaultUnlocked;
  const activePass = mounted ? waitlistPass : null;
  const activeUser = mounted ? user : null;

  const resolvedName =
    nameInput !== null ? nameInput : activeUser?.displayName || "";
  const resolvedEmail =
    emailInput !== null ? emailInput : activeUser?.email || "";

  const triggerCurtainReveal = useCallback((unlockFn: () => void) => {
    curtainTimersRef.current.forEach((id) => window.clearTimeout(id));
    curtainTimersRef.current = [];

    setCurtainParting(false);
    setCurtainVisible(true);

    const t1 = window.setTimeout(() => {
      unlockFn();
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
      setCurtainParting(true);
    }, 180);

    const t2 = window.setTimeout(() => {
      setCurtainVisible(false);
      setCurtainParting(false);
    }, 1060);

    curtainTimersRef.current = [t1, t2];
  }, []);

  const handleJoinWaitlist = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = resolvedName.trim();
    const cleanEmail = resolvedEmail.trim();

    if (!cleanName || !cleanEmail || !cleanEmail.includes("@")) {
      setWaitlistError("Please enter your full name and a valid email address.");
      return;
    }

    setWaitlistError(null);
    setWaitlistSubmitting(true);
    try {
      await joinWaitlist(cleanName, cleanEmail);
    } catch (err) {
      setWaitlistError(
        err instanceof Error
          ? err.message
          : "Unable to register your queue number right now."
      );
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  const handleUnlockWithCode = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = accessCode.trim().toUpperCase();
    if (!normalized) {
      setCodeError("Enter your invitation key to open the vault.");
      return;
    }

    const passCode = activePass?.accessCode?.trim().toUpperCase();
    const isValid =
      normalized === "KNITX-001" ||
      (Boolean(passCode) && normalized === passCode);

    if (!isValid) {
      setCodeError("Unrecognized invitation key. Try KNITX-001.");
      return;
    }

    setCodeError(null);
    triggerCurtainReveal(() => {
      unlockVaultWithCode(normalized);
    });
  };

  const handleSimulateNumberCalled = () => {
    setCodeError(null);
    triggerCurtainReveal(() => {
      unlockVaultDemo();
    });
  };

  // Collection groupings & live inventory stats
  const oneOfOneProducts = useMemo(
    () => products.filter((item) => item.tier === "one-of-one"),
    [products]
  );

  const smallBatchProducts = useMemo(
    () => products.filter((item) => item.tier === "small-batch"),
    [products]
  );

  const mysteryProducts = useMemo(
    () => products.filter((item) => item.isMystery),
    [products]
  );

  const inventoryStats = useMemo(() => {
    const total = products.reduce((sum, item) => sum + item.totalUnits, 0);
    const remaining = products.reduce(
      (sum, item) => sum + Math.max(0, item.remainingUnits),
      0
    );
    return { total, remaining };
  }, [products]);

  const visibleOneOfOnes = useMemo(() => {
    if (activeFilter === "all" || activeFilter === "one-of-one") {
      return oneOfOneProducts;
    }
    if (activeFilter === "unveiled") {
      return oneOfOneProducts.filter((item) => item.isMystery);
    }
    return [];
  }, [activeFilter, oneOfOneProducts]);

  const visibleSmallBatches = useMemo(() => {
    if (activeFilter === "all" || activeFilter === "small-batch") {
      return smallBatchProducts;
    }
    if (activeFilter === "unveiled") {
      return smallBatchProducts.filter((item) => item.isMystery);
    }
    return [];
  }, [activeFilter, smallBatchProducts]);

  const filterTabs: { id: VaultFilter; label: string }[] = useMemo(
    () => [
      { id: "all", label: `ALL ${products.length}` },
      { id: "one-of-one", label: `ONE-OF-ONE (${oneOfOneProducts.length})` },
      {
        id: "small-batch",
        label: `SMALL-BATCH (${smallBatchProducts.length})`,
      },
      { id: "unveiled", label: `NEWLY UNVEILED (${mysteryProducts.length})` },
    ],
    [
      products.length,
      oneOfOneProducts.length,
      smallBatchProducts.length,
      mysteryProducts.length,
    ]
  );

  const veilPanels = useMemo(() => {
    const base = mysteryProducts.slice(0, 5);
    return Array.from({ length: 5 }, (_, idx) => {
      const item = base[idx];
      return {
        key: item?._id || `sealed-panel-${idx + 1}`,
        serial: item?.serialCode || `KX-V0${idx + 1}`,
        tierLabel:
          item?.tier === "one-of-one" ? "01 / 01 SEALED" : "SMALL-BATCH SEALED",
        imageUrl: item?.silhouetteUrl || "/images/look-mystery-veil.jpg",
        cropClass: VEIL_CROP_POSITIONS[idx],
      };
    });
  }, [mysteryProducts]);

  const handleCloseDrawer = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  const handleLockPreview = useCallback(() => {
    setSelectedProduct(null);
    setActiveFilter("all");
    lockVaultPreview();
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [lockVaultPreview]);

  const dropLabel = drop.dropNumber.replace("DROP 001", "DROP 01") || "DROP 01";

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#111110]">
      {/* Silky 0.85s Horizontal Ivory & Obsidian Double-Curtain Parting Overlay */}
      <AnimatePresence>
        {curtainVisible && (
          <motion.div
            key="v9-vault-double-curtain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="pointer-events-none fixed inset-0 z-50 flex overflow-hidden"
            aria-hidden="true"
          >
            {/* Left Ivory & Obsidian Curtain Panel */}
            <motion.div
              initial={{ x: "0%" }}
              animate={{ x: curtainParting ? "-102%" : "0%" }}
              transition={{ duration: 0.85, ease: CURTAIN_EASE }}
              className="relative h-full w-1/2 bg-[#FFFFFF]"
            >
              <div className="absolute inset-y-0 right-0 w-10 bg-[#111110] sm:w-16" />
              <div className="absolute inset-y-0 right-0 w-[1.5px] bg-[#9A7B4F]" />
            </motion.div>

            {/* Right Ivory & Obsidian Curtain Panel */}
            <motion.div
              initial={{ x: "0%" }}
              animate={{ x: curtainParting ? "102%" : "0%" }}
              transition={{ duration: 0.85, ease: CURTAIN_EASE }}
              className="relative h-full w-1/2 bg-[#FFFFFF]"
            >
              <div className="absolute inset-y-0 left-0 w-10 bg-[#111110] sm:w-16" />
              <div className="absolute inset-y-0 left-0 w-[1.5px] bg-[#9A7B4F]" />
            </motion.div>

            {/* Centered Brass & Obsidian Admission Seal */}
            <motion.div
              initial={{ opacity: 1, scale: 1 }}
              animate={{
                opacity: curtainParting ? 0 : 1,
                scale: curtainParting ? 0.96 : 1,
              }}
              transition={{ duration: 0.25, ease: SILKY_EASE }}
              className="pointer-events-none fixed inset-0 flex items-center justify-center px-6"
            >
              <div className="rounded-full border border-[#9A7B4F]/60 bg-[#111110] px-7 py-3 text-center shadow-[0_20px_50px_rgba(17,17,15,0.28)]">
                <p className="font-mono text-[11px] tracking-[0.26em] text-[#F7F5F0] uppercase">
                  KNITX · {dropLabel} · VAULT ADMISSION GRANTED
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!vaultOpen ? (
        /* ================================================================== */
        /* LOCKED STATE: PRIVATE VAULT AIRLOCK                                */
        /* ================================================================== */
        <section className="mx-auto max-w-[1380px] px-5 pt-14 pb-24 sm:px-10 sm:pt-20 lg:px-14">
          {/* Serene Monumental Airlock Header */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: SILKY_EASE }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#DDD7CB] bg-[#FFFFFF] px-4 py-1.5">
              <Lock className="h-3 w-3 text-[#9A7B4F]" />
              <span className="font-mono text-[10px] tracking-[0.24em] text-[#6A655D] uppercase">
                PRIVATE SHOWROOM · INDIA
              </span>
            </div>

            <h1 className="mt-6 font-poster text-5xl leading-[0.94] tracking-tight text-[#111110] uppercase sm:text-7xl lg:text-[84px]">
              THE VAULT IS SEALED.
            </h1>

            <p className="mt-5 font-mono text-[11px] tracking-[0.22em] text-[#6A655D] uppercase sm:text-xs">
              DROP 01 · {products.length} PIECES · ADMISSION BY QUEUE NUMBER
              ONLY
            </p>
          </motion.div>

          {/* 5-Panel Horizontal Preview of Parting Silk-Gauze Mystery Silhouettes */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.08, ease: SILKY_EASE }}
            className="mx-auto mt-12 max-w-5xl"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="font-mono text-[10px] tracking-[0.22em] text-[#9A7B4F] uppercase">
                SILK-GAUZE ARCHIVE VEIL · 05 UNSEEN SILHOUETTES
              </span>
              <span className="hidden font-mono text-[10px] tracking-[0.2em] text-[#6A655D] uppercase sm:inline">
                REVEALED UPON ADMISSION
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-4">
              {veilPanels.map((panel, index) => (
                <div
                  key={panel.key}
                  className={cn(
                    "group relative aspect-[3/5] overflow-hidden rounded-xl border border-[#DDD7CB] bg-[#ECE8DF] sm:aspect-[2/3]",
                    index % 2 === 1 ? "sm:translate-y-2.5" : ""
                  )}
                >
                  <Image
                    src={panel.imageUrl}
                    alt={`Sealed silhouette ${panel.serial}`}
                    fill
                    sizes="(max-width: 640px) 20vw, 190px"
                    className={cn(
                      "object-cover opacity-85 saturate-[0.75] transition-transform duration-700 ease-out group-hover:scale-[1.04]",
                      panel.cropClass
                    )}
                  />
                  {/* Translucent Silk-Gauze Veil */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#F7F5F0]/35 via-[#F7F5F0]/10 to-[#111110]/55" />
                  <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3">
                    <p className="font-mono text-[9px] tracking-[0.18em] text-[#F7F5F0] uppercase sm:text-[10px]">
                      {panel.serial}
                    </p>
                    <p className="mt-0.5 hidden font-mono text-[8px] tracking-[0.16em] text-[#F7F5F0]/75 uppercase sm:block">
                      {panel.tierLabel}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Centered Admission Desk Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.16, ease: SILKY_EASE }}
            className="mx-auto mt-14 max-w-xl rounded-2xl border border-[#DDD7CB] bg-[#FFFFFF] p-8 shadow-[0_20px_60px_rgba(17,17,15,0.06)] sm:mt-16 sm:p-10"
          >
            <div className="flex items-center justify-between border-b border-[#DDD7CB] pb-4">
              <span className="font-mono text-[10px] font-medium tracking-[0.24em] text-[#9A7B4F] uppercase">
                ADMISSION DESK · {dropLabel}
              </span>
              <span className="font-mono text-[10px] tracking-[0.18em] text-[#6A655D] uppercase">
                {drop.waitlistCount.toLocaleString("en-IN")} IN QUEUE
              </span>
            </div>

            {/* Waitlist Status OR Inline Queue Registration */}
            <div className="mt-6">
              {activePass ? (
                <div className="rounded-xl border border-[#DDD7CB] bg-[#F7F5F0] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.2em] text-[#9A7B4F] uppercase">
                        YOUR QUEUE SPOT
                      </p>
                      <p className="mt-1 font-poster text-4xl leading-none tracking-wide text-[#111110] sm:text-5xl">
                        #{activePass.position.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DDD7CB] bg-[#FFFFFF] px-3 py-1 font-mono text-[10px] tracking-[0.16em] text-[#111110] uppercase">
                      <Check className="h-3 w-3 text-[#9A7B4F]" />
                      REGISTERED
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#DDD7CB] pt-3.5">
                    <span className="font-sans text-xs text-[#6A655D]">
                      {activePass.name} · {activePass.email}
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.16em] text-[#6A655D] uppercase">
                      KEY · {activePass.accessCode}
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleJoinWaitlist} className="space-y-3.5">
                  <div>
                    <p className="font-sans text-sm font-medium text-[#111110]">
                      Request a Drop 01 Queue Number
                    </p>
                    <p className="mt-1 font-sans text-xs text-[#6A655D]">
                      Admission opens sequentially across India. Zero open store.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      suppressHydrationWarning
                      value={resolvedName}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Full name"
                      aria-label="Full name"
                      className="w-full rounded-xl border border-[#DDD7CB] bg-[#F7F5F0]/70 px-4 py-3 font-sans text-sm text-[#111110] placeholder:text-[#6A655D]/70 transition-colors focus:border-[#111110] focus:bg-[#FFFFFF] focus:outline-none"
                    />
                    <input
                      type="email"
                      suppressHydrationWarning
                      value={resolvedEmail}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Email address"
                      aria-label="Email address"
                      className="w-full rounded-xl border border-[#DDD7CB] bg-[#F7F5F0]/70 px-4 py-3 font-sans text-sm text-[#111110] placeholder:text-[#6A655D]/70 transition-colors focus:border-[#111110] focus:bg-[#FFFFFF] focus:outline-none"
                    />
                  </div>

                  {waitlistError && (
                    <p className="font-sans text-xs text-[#8E1C1C]">
                      {waitlistError}
                    </p>
                  )}

                  <button
                    type="submit"
                    suppressHydrationWarning
                    disabled={waitlistSubmitting}
                    className="w-full rounded-full border border-[#111110] bg-[#111110] px-5 py-3 font-sans text-[11px] font-semibold tracking-[0.2em] text-[#FFFFFF] uppercase transition-colors duration-300 hover:bg-[#292826] disabled:opacity-60 focus:outline-none"
                  >
                    {waitlistSubmitting
                      ? "ASSIGNING QUEUE SPOT..."
                      : "CLAIM WAITLIST NUMBER"}
                  </button>
                </form>
              )}
            </div>

            {/* Access Code Entry */}
            <div className="mt-7 border-t border-[#DDD7CB] pt-6">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="v9-vault-access-code"
                  className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.22em] text-[#6A655D] uppercase"
                >
                  <KeyRound className="h-3 w-3 text-[#9A7B4F]" />
                  <span>PRIVATE INVITATION CODE</span>
                </label>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => {
                    setAccessCode("KNITX-001");
                    setCodeError(null);
                  }}
                  className="font-mono text-[10px] tracking-[0.16em] text-[#9A7B4F] uppercase underline decoration-[#9A7B4F]/40 underline-offset-4 transition-colors hover:text-[#111110] focus:outline-none"
                >
                  Try KNITX-001
                </button>
              </div>

              <form
                onSubmit={handleUnlockWithCode}
                className="mt-3 flex flex-col gap-2.5 sm:flex-row"
              >
                <input
                  id="v9-vault-access-code"
                  type="text"
                  suppressHydrationWarning
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value);
                    if (codeError) setCodeError(null);
                  }}
                  placeholder="Enter code (e.g. KNITX-001)"
                  className="flex-1 rounded-xl border border-[#DDD7CB] bg-[#F7F5F0]/70 px-4 py-3 font-mono text-xs tracking-[0.16em] text-[#111110] uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-[#6A655D]/70 transition-colors focus:border-[#111110] focus:bg-[#FFFFFF] focus:outline-none"
                />
                <button
                  type="submit"
                  suppressHydrationWarning
                  className="rounded-xl border border-[#DDD7CB] bg-[#ECE8DF] px-6 py-3 font-sans text-[11px] font-semibold tracking-[0.2em] text-[#111110] uppercase transition-colors duration-200 hover:border-[#111110] hover:bg-[#111110] hover:text-[#FFFFFF] focus:outline-none"
                >
                  UNLOCK
                </button>
              </form>

              {codeError && (
                <p className="mt-2 font-sans text-xs text-[#8E1C1C]">
                  {codeError}
                </p>
              )}
            </div>

            {/* Prominent Deep-Oxblood Instant Preview CTA */}
            <div className="mt-7 border-t border-[#DDD7CB] pt-6">
              <button
                type="button"
                suppressHydrationWarning
                onClick={handleSimulateNumberCalled}
                className="group flex w-full items-center justify-center gap-2.5 rounded-full bg-[#8E1C1C] px-6 py-4 font-sans text-xs font-semibold tracking-[0.2em] text-[#FFFFFF] uppercase shadow-[0_12px_30px_rgba(142,28,28,0.22)] transition-all duration-300 hover:bg-[#731515] focus:outline-none"
              >
                <span>SIMULATE NUMBER CALLED → OPEN VAULT</span>
              </button>

              <p className="mt-3 text-center font-mono text-[10px] tracking-[0.16em] text-[#6A655D] uppercase">
                UNSEALS ALL {products.length} PIECES · TWO 1-OF-1S · EIGHT
                SMALL-BATCH EDITIONS
              </p>
            </div>
          </motion.div>
        </section>
      ) : (
        /* ================================================================== */
        /* UNLOCKED STATE: PRIVATE MUSEUM SHOWROOM                            */
        /* ================================================================== */
        <div className="pb-28">
          {/* Crisp Top Gallery Bar — sits cleanly below 96px sticky V9Navbar */}
          <div className="sticky top-[96px] z-30 border-b border-[#DDD7CB] bg-[#FFFFFF]/95 backdrop-blur-md">
            <div className="mx-auto flex max-w-[1380px] flex-col gap-3.5 px-5 py-3.5 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-14">
              {/* Left: Live Vault Status + Remaining Inventory + Mobile Lock Preview */}
              <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 lg:justify-start">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <div className="inline-flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8E1C1C]/60" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#8E1C1C]" />
                    </span>
                    <span className="font-mono text-[11px] font-semibold tracking-[0.2em] text-[#8E1C1C] uppercase">
                      VAULT OPEN · {dropLabel}
                    </span>
                  </div>

                  <span className="hidden h-3.5 w-px bg-[#DDD7CB] sm:inline-block" />

                  <span className="font-mono text-[11px] tracking-[0.18em] text-[#6A655D] uppercase">
                    {inventoryStats.remaining} OF {inventoryStats.total} PIECES
                    REMAINING
                  </span>
                </div>

                {/* Discreet Lock Preview (Mobile / Tablet Top-Right) */}
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={handleLockPreview}
                  title="Re-lock vault to preview the airlock and curtain reveal"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#DDD7CB] bg-[#F7F5F0]/80 px-3 py-1 font-mono text-[10px] tracking-[0.16em] text-[#6A655D] uppercase transition-colors duration-200 hover:border-[#111110] hover:text-[#111110] focus:outline-none lg:hidden"
                >
                  <Lock className="h-2.5 w-2.5" />
                  <span>Lock Preview</span>
                </button>
              </div>

              {/* Right: Smooth layoutId Underline Filter Tabs + Desktop Lock Preview */}
              <div className="flex items-center justify-between gap-5 lg:justify-end">
                <nav
                  aria-label="Showroom filter tabs"
                  className="-mb-3.5 flex items-center gap-6 overflow-x-auto pb-0 lg:mb-0"
                >
                  {filterTabs.map((tab) => {
                    const isActive = activeFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setActiveFilter(tab.id)}
                        className={cn(
                          "relative shrink-0 cursor-pointer pb-3.5 font-mono text-[11px] tracking-[0.18em] uppercase transition-colors duration-200 focus:outline-none lg:py-1.5",
                          isActive
                            ? "font-medium text-[#111110]"
                            : "text-[#6A655D] hover:text-[#111110]"
                        )}
                      >
                        <span>{tab.label}</span>
                        {isActive && (
                          <motion.span
                            layoutId="v9-vault-filter-underline"
                            transition={{ duration: 0.32, ease: SILKY_EASE }}
                            className="absolute inset-x-0 bottom-0 h-[2px] bg-[#8E1C1C] lg:-bottom-3.5"
                          />
                        )}
                      </button>
                    );
                  })}
                </nav>

                {/* Discreet Understated Lock Preview (Desktop Right Corner) */}
                <span className="hidden h-4 w-px bg-[#DDD7CB] lg:inline-block" />
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={handleLockPreview}
                  title="Re-lock vault to preview the airlock and curtain reveal"
                  className="hidden shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#DDD7CB] bg-[#F7F5F0]/70 px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-[#6A655D] uppercase transition-colors duration-200 hover:border-[#111110] hover:bg-[#FFFFFF] hover:text-[#111110] focus:outline-none lg:inline-flex"
                >
                  <Lock className="h-2.5 w-2.5" />
                  <span>Lock Preview</span>
                </button>
              </div>
            </div>
          </div>

          {/* Showroom Editorial Welcome Strip */}
          <div className="mx-auto max-w-[1380px] px-5 pt-12 sm:px-10 sm:pt-16 lg:px-14">
            <div className="flex flex-col justify-between gap-6 border-b border-[#DDD7CB] pb-10 md:flex-row md:items-end">
              <div>
                <p className="font-mono text-[10px] tracking-[0.24em] text-[#9A7B4F] uppercase">
                  PRIVATE ARCHIVE SHOWROOM · {drop.title} · INDIA
                </p>
                <h1 className="mt-3 font-poster text-4xl leading-[0.96] tracking-wide text-[#111110] uppercase sm:text-6xl">
                  DROP 01 COLLECTION
                </h1>
              </div>

              <div className="flex flex-col items-start gap-1.5 md:items-end">
                {activePass && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#DDD7CB] bg-[#FFFFFF] px-3.5 py-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#9A7B4F]" />
                    <span className="font-mono text-[10px] tracking-[0.18em] text-[#111110] uppercase">
                      QUEUE #{activePass.position.toLocaleString("en-IN")}{" "}
                      ADMITTED
                    </span>
                  </div>
                )}
                <p className="font-sans text-xs text-[#6A655D]">
                  Cut &amp; sewn to order in India · Strictly numbered · Zero
                  restocks
                </p>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* HALL I — ONE-OF-ONE COLLECTOR'S ARCHIVE                          */}
          {/* ================================================================ */}
          {visibleOneOfOnes.length > 0 && (
            <section
              aria-labelledby="v9-hall-one-heading"
              className="mx-auto max-w-[1380px] px-5 pt-14 sm:px-10 sm:pt-16 lg:px-14"
            >
              <div className="mb-9 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="font-mono text-[11px] tracking-[0.24em] text-[#9A7B4F] uppercase">
                    HALL I
                  </p>
                  <h2
                    id="v9-hall-one-heading"
                    className="mt-1.5 font-poster text-3xl leading-none tracking-wide text-[#111110] uppercase sm:text-5xl"
                  >
                    ONE-OF-ONE COLLECTOR&apos;S ARCHIVE
                  </h2>
                </div>
                <p className="max-w-sm font-sans text-xs leading-relaxed text-[#6A655D] sm:text-right">
                  Singular museum-grade garments. Hand-finished once, sealed
                  with engraved steel provenance, and permanently retired.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
                {visibleOneOfOnes.map((piece, idx) => (
                  <motion.article
                    key={piece._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.55,
                      delay: idx * 0.08,
                      ease: SILKY_EASE,
                    }}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-[#DDD7CB] bg-[#FFFFFF] shadow-[0_14px_45px_rgba(17,17,15,0.04)] transition-colors duration-500 hover:border-[#9A7B4F]/70"
                  >
                    {/* Tall Museum Plinth Portrait */}
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setSelectedProduct(piece)}
                      className="relative aspect-[4/5] w-full overflow-hidden bg-[#ECE8DF] text-left focus:outline-none"
                    >
                      <Image
                        src={piece.imageUrl}
                        alt={piece.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                    </button>

                    {/* Plinth Plaque Details */}
                    <div className="flex flex-1 flex-col justify-between p-7 sm:p-9">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-[10px] font-medium tracking-[0.22em] text-[#9A7B4F] uppercase">
                            01 / 01 · SINGULAR EDITION
                          </span>
                          <div className="flex items-center gap-2.5">
                            {piece.isMystery && (
                              <span className="font-mono text-[10px] font-medium tracking-[0.2em] text-[#8E1C1C] uppercase">
                                UNVEILED
                              </span>
                            )}
                            <span className="font-mono text-[10px] tracking-[0.18em] text-[#6A655D] uppercase">
                              {piece.serialCode}
                            </span>
                          </div>
                        </div>

                        <h3 className="mt-3 font-poster text-3xl leading-[1.02] tracking-wide text-[#111110] uppercase sm:text-4xl">
                          {piece.title}
                        </h3>

                        <p className="mt-3 font-sans text-sm leading-relaxed text-[#6A655D]">
                          {piece.description}
                        </p>

                        <p className="mt-4 font-mono text-[11px] tracking-[0.12em] text-[#6A655D]">
                          {piece.gsmWeight} · {piece.fabric}
                        </p>
                      </div>

                      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-[#DDD7CB] pt-6">
                        <div>
                          <p className="font-mono text-xl font-medium text-[#111110] sm:text-2xl">
                            {formatInr(piece.priceInr)}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] tracking-[0.18em] text-[#6A655D] uppercase">
                            {piece.remainingUnits > 0
                              ? "1 OF 1 AVAILABLE"
                              : "CLAIMED · ARCHIVED"}
                          </p>
                        </div>

                        <button
                          type="button"
                          suppressHydrationWarning
                          onClick={() => setSelectedProduct(piece)}
                          className="inline-flex items-center gap-2 rounded-full bg-[#111110] px-6 py-3 font-sans text-[11px] font-semibold tracking-[0.18em] text-[#FFFFFF] uppercase transition-colors duration-300 hover:bg-[#8E1C1C] focus:outline-none"
                        >
                          <span>INSPECT &amp; RESERVE</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </section>
          )}

          {/* ================================================================ */}
          {/* HALL II — SMALL-BATCH EDITIONS                                   */}
          {/* ================================================================ */}
          {visibleSmallBatches.length > 0 && (
            <section
              aria-labelledby="v9-hall-two-heading"
              className={cn(
                "mx-auto max-w-[1380px] px-5 sm:px-10 lg:px-14",
                visibleOneOfOnes.length > 0
                  ? "pt-20 sm:pt-24"
                  : "pt-14 sm:pt-16"
              )}
            >
              <div
                className={cn(
                  "mb-9 flex flex-col justify-between gap-3 sm:flex-row sm:items-end",
                  visibleOneOfOnes.length > 0
                    ? "border-t border-[#DDD7CB] pt-14"
                    : ""
                )}
              >
                <div>
                  <p className="font-mono text-[11px] tracking-[0.24em] text-[#9A7B4F] uppercase">
                    HALL II
                  </p>
                  <h2
                    id="v9-hall-two-heading"
                    className="mt-1.5 font-poster text-3xl leading-none tracking-wide text-[#111110] uppercase sm:text-5xl"
                  >
                    SMALL-BATCH EDITIONS
                  </h2>
                </div>
                <p className="max-w-sm font-sans text-xs leading-relaxed text-[#6A655D] sm:text-right">
                  Strictly 3 to 4 numbered garments per silhouette. Heavyweight
                  Indian cotton cut and finished in micro-batches.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-x-6 gap-y-11 sm:grid-cols-2 lg:grid-cols-4">
                {visibleSmallBatches.map((piece, idx) => (
                  <motion.article
                    key={piece._id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.48,
                      delay: Math.min(idx * 0.05, 0.3),
                      ease: SILKY_EASE,
                    }}
                    className="group"
                  >
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setSelectedProduct(piece)}
                      className="block w-full text-left focus:outline-none"
                    >
                      {/* Clean 3:4 Gallery Frame — Zero Sticker Clutter */}
                      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-[#DDD7CB] bg-[#ECE8DF]">
                        <Image
                          src={piece.imageUrl}
                          alt={piece.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                        />
                      </div>

                      {/* Minimal Editorial Footer */}
                      <div className="px-0.5 pt-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] tracking-[0.18em] text-[#6A655D] uppercase">
                            {piece.serialCode}
                          </span>
                          {piece.isMystery && (
                            <span className="font-mono text-[10px] font-medium tracking-[0.18em] text-[#8E1C1C] uppercase">
                              UNVEILED
                            </span>
                          )}
                        </div>

                        <h3 className="mt-1.5 font-poster text-xl leading-[1.08] tracking-wide text-[#111110] uppercase transition-colors duration-200 group-hover:text-[#8E1C1C]">
                          {piece.title}
                        </h3>

                        <div className="mt-2.5 flex items-center justify-between border-t border-[#DDD7CB]/80 pt-2.5">
                          <span className="font-mono text-sm font-medium text-[#111110]">
                            {formatInr(piece.priceInr)}
                          </span>
                          <span className="font-mono text-[11px] tracking-[0.1em] text-[#6A655D]">
                            {piece.remainingUnits}/{piece.totalUnits} left
                          </span>
                        </div>
                      </div>
                    </button>
                  </motion.article>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Slide-Over Garment Inspection & Reservation Drawer */}
      <V9GarmentDrawer
        product={selectedProduct}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
