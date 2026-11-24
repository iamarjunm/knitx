"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  ArrowUp,
  Check,
  Clock,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStorefrontConfig } from "@/context/StorefrontConfigContext";
import { useVault } from "@/context/VaultContext";
import {
  CORE_COLLECTION_GARMENTS,
  computeCoreLaunchDate,
  coreGarmentToProduct,
  type CoreGarment,
  type CoreSwatch,
} from "@/lib/core-catalog";
import { FLAGSHIP_MEDIA, formatDropEditionLabel } from "@/lib/flagship-media";
import type { DropCampaign } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";

interface FlagshipCoreClientProps {
  drop: DropCampaign;
}

interface CountdownParts {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  isLive: boolean;
}

type CategoryFilter =
  | "ALL"
  | "Hoodie"
  | "Tee"
  | "Zip"
  | "Crewneck"
  | "Trouser"
  | "Long Sleeve";

interface MineralToneOption {
  id: string;
  name: string;
  hex: string;
  borderHex?: string;
}

const MINERAL_PALETTE: MineralToneOption[] = [
  { id: "chalk-bone", name: "Chalk Bone", hex: "#F2EFE9", borderHex: "#D4D0C8" },
  { id: "warm-sand", name: "Warm Sand", hex: "#C8BFA8" },
  { id: "mineral-slate", name: "Mineral Slate", hex: "#6E7378" },
  { id: "deep-espresso", name: "Deep Espresso", hex: "#332924" },
  { id: "washed-obsidian", name: "Washed Obsidian", hex: "#161618" },
  { id: "sage-stone", name: "Sage Stone", hex: "#6D7469" },
];

const CATEGORY_TABS: Array<{ value: CategoryFilter; label: string }> = [
  { value: "ALL", label: "ALL" },
  { value: "Hoodie", label: "HOODIE" },
  { value: "Tee", label: "TEE" },
  { value: "Zip", label: "ZIP" },
  { value: "Crewneck", label: "CREWNECK" },
  { value: "Trouser", label: "TROUSER" },
  { value: "Long Sleeve", label: "LONG SLEEVE" },
];

function computeCountdown(targetIso: string): CountdownParts {
  const targetMs = Date.parse(targetIso);
  const diff = Number.isFinite(targetMs) ? Math.max(0, targetMs - Date.now()) : 0;
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
    isLive: diff <= 0,
  };
}

function formatUtcReleaseDate(iso: string): string {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return "SCHEDULED RELEASE";
  const d = new Date(parsed);
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = months[d.getUTCMonth()] ?? "DEC";
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

function getActiveSwatchForGarment(
  garment: CoreGarment,
  swatchMap: Record<string, string>
): CoreSwatch {
  const targetId = swatchMap[garment._id] || garment.defaultSwatchId;
  return (
    garment.swatches.find((s) => s.id === targetId) ||
    garment.swatches[0]
  );
}

export default function FlagshipCoreClient({ drop }: FlagshipCoreClientProps) {
  const { config } = useStorefrontConfig();
  const { user } = useAuth();
  const {
    waitlistPass,
    isVaultUnlocked,
    addToCart,
    joinWaitlist,
    unlockVaultWithCode,
  } = useVault();

  // Client hydration guard
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState<CountdownParts | null>(null);

  // Filter & Swatch Studio State
  const [activeToneFilter, setActiveToneFilter] = useState<string>("all");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("ALL");
  const [selectedSwatches, setSelectedSwatches] = useState<
    Record<string, string>
  >(() => {
    const initial: Record<string, string> = {};
    for (const garment of CORE_COLLECTION_GARMENTS) {
      initial[garment._id] = garment.defaultSwatchId;
    }
    return initial;
  });

  // Quick-Shop Slide-Over State
  const [quickShopGarmentId, setQuickShopGarmentId] = useState<string | null>(
    null
  );
  const [selectedSize, setSelectedSize] = useState<string>("L");
  const [bagError, setBagError] = useState<string | null>(null);

  // Community Waitlist & Drop 1 Code Gate State
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [waitlistSuccessNote, setWaitlistSuccessNote] = useState<string | null>(
    null
  );

  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const accentColor = mounted ? config.accentColor || "#E11D2E" : "#E11D2E";
  const coreTitle = mounted ? config.coreTitle || "KNITX CORE" : "KNITX CORE";
  const coreSubtitle = mounted
    ? config.coreSubtitle ||
      "Heavyweight unbranded wardrobe essentials in curated mineral colorways. Opens 2 weeks after Drop 1 exclusively for Drop 1 & community waitlist members."
    : "Heavyweight unbranded wardrobe essentials in curated mineral colorways. Opens 2 weeks after Drop 1 exclusively for Drop 1 & community waitlist members.";
  const offsetDays = mounted ? config.coreLaunchOffsetDays : 14;
  const effectiveDropLaunchIso =
    (mounted && config.dropLaunchDate) || drop.launchDate;
  const effectiveCoreOverride = mounted ? config.coreLaunchDateOverride : "";
  const editionLabel = formatDropEditionLabel(
    (mounted && config.activeDropNumber) || drop.dropNumber
  );

  const coreLaunchIso = useMemo(
    () =>
      computeCoreLaunchDate(
        effectiveDropLaunchIso,
        offsetDays,
        effectiveCoreOverride
      ),
    [effectiveDropLaunchIso, offsetDays, effectiveCoreOverride]
  );

  const formattedCoreLaunchDate = useMemo(
    () => formatUtcReleaseDate(coreLaunchIso),
    [coreLaunchIso]
  );

  // Live countdown ticker (mounted-guarded)
  useEffect(() => {
    if (!mounted) return;
    setCountdown(computeCountdown(coreLaunchIso));
    const interval = window.setInterval(() => {
      setCountdown(computeCountdown(coreLaunchIso));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [mounted, coreLaunchIso]);

  // Pre-fill member form from signed-in account when available
  useEffect(() => {
    if (mounted && user) {
      setMemberName((prev) => prev || user.displayName || "");
      setMemberEmail((prev) => prev || user.email || "");
    }
  }, [mounted, user]);

  // Access computation (exact user spec, mounted-guarded)
  const effectiveAccessMode = mounted ? config.coreAccessMode : "community";
  const safeWaitlistPass = mounted ? waitlistPass : null;
  const safeUser = mounted ? user : null;
  const safeCodeUnlocked = mounted && isVaultUnlocked;

  const hasCoreAccess = useMemo(() => {
    if (!mounted) return false;
    if (effectiveAccessMode === "open") return true;
    if (effectiveAccessMode === "locked") return safeCodeUnlocked;
    return safeCodeUnlocked || Boolean(safeWaitlistPass) || Boolean(safeUser);
  }, [
    mounted,
    effectiveAccessMode,
    safeCodeUnlocked,
    safeWaitlistPass,
    safeUser,
  ]);

  // Escape key & scroll lock for Quick-Shop Slide-Over
  useEffect(() => {
    if (!quickShopGarmentId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setQuickShopGarmentId(null);
        setBagError(null);
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [quickShopGarmentId]);

  // Filtered garments based on mineral palette & category tabs
  const filteredGarments = useMemo(() => {
    return CORE_COLLECTION_GARMENTS.filter((garment) => {
      const matchesCategory =
        activeCategory === "ALL" || garment.category === activeCategory;
      const matchesTone =
        activeToneFilter === "all" ||
        garment.swatches.some((s) => s.id === activeToneFilter);
      return matchesCategory && matchesTone;
    });
  }, [activeCategory, activeToneFilter]);

  const activeQuickShopGarment = useMemo(
    () =>
      CORE_COLLECTION_GARMENTS.find((g) => g._id === quickShopGarmentId) ||
      null,
    [quickShopGarmentId]
  );

  const activeQuickShopSwatch = useMemo(() => {
    if (!activeQuickShopGarment) return null;
    return getActiveSwatchForGarment(activeQuickShopGarment, selectedSwatches);
  }, [activeQuickShopGarment, selectedSwatches]);

  const handleSelectGlobalTone = (toneId: string) => {
    setActiveToneFilter(toneId);
    if (toneId !== "all") {
      setSelectedSwatches((prev) => {
        const next = { ...prev };
        for (const garment of CORE_COLLECTION_GARMENTS) {
          if (garment.swatches.some((s) => s.id === toneId)) {
            next[garment._id] = toneId;
          }
        }
        return next;
      });
    }
  };

  const handleCardSwatchClick = (
    e: React.MouseEvent,
    garmentId: string,
    swatchId: string
  ) => {
    e.stopPropagation();
    setSelectedSwatches((prev) => ({
      ...prev,
      [garmentId]: swatchId,
    }));
  };

  const handleOpenQuickShop = (garment: CoreGarment) => {
    setQuickShopGarmentId(garment._id);
    setSelectedSize(garment.sizes.includes("L") ? "L" : garment.sizes[0] || "M");
    setBagError(null);
  };

  const handleCloseQuickShop = () => {
    setQuickShopGarmentId(null);
    setBagError(null);
  };

  const scrollToElement = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleQuickShopAddToBag = () => {
    if (!activeQuickShopGarment || !activeQuickShopSwatch) return;
    setBagError(null);
    const product = coreGarmentToProduct(
      activeQuickShopGarment,
      activeQuickShopSwatch
    );
    const res = addToCart(product, selectedSize);
    if (!res.ok) {
      setBagError(res.message || "Unable to add piece to bag right now.");
      return;
    }
    setQuickShopGarmentId(null);
  };

  const handleJoinCommunityWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistError(null);
    setWaitlistSuccessNote(null);

    if (!memberName.trim() || !memberEmail.trim()) {
      setWaitlistError("Enter your full name and email to unlock community access.");
      return;
    }

    setWaitlistSubmitting(true);
    try {
      const pass = await joinWaitlist(memberName.trim(), memberEmail.trim());
      if (effectiveAccessMode === "locked") {
        setWaitlistSuccessNote(
          `Pass #${String(pass.position).padStart(4, "0")} issued. Enter your Drop 1 or Core code below to activate private shopping.`
        );
      } else {
        setWaitlistSuccessNote(
          `Welcome to the KNITX community — pass #${String(pass.position).padStart(4, "0")} activated.`
        );
      }
    } catch (err) {
      setWaitlistError(
        err instanceof Error
          ? err.message
          : "Unable to register your community pass. Please try again."
      );
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  const handleVerifyAccessCode = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);
    setCodeSuccess(false);

    const ok = unlockVaultWithCode(codeInput);
    if (!ok) {
      setCodeError(
        `Invalid code. Enter your Drop 1 invitation or Core code (${config.coreAccessCode || "KNITX-CORE"}).`
      );
      return;
    }
    setCodeSuccess(true);
    setCodeInput("");
  };

  const activeToneLabel =
    activeToneFilter === "all"
      ? "ALL TONES"
      : MINERAL_PALETTE.find((t) => t.id === activeToneFilter)?.name.toUpperCase() ||
        "ALL TONES";

  const accessMethodLabel = useMemo(() => {
    if (!mounted) return "COMMUNITY MEMBER";
    if (effectiveAccessMode === "open") return "OPEN COMMUNITY RELEASE";
    if (safeWaitlistPass) {
      return `PASS #${String(safeWaitlistPass.position).padStart(4, "0")}`;
    }
    if (safeCodeUnlocked) return "DROP 01 ACCESS VERIFIED";
    if (safeUser) return "MEMBER ACCOUNT ACTIVE";
    return "COMMUNITY ACCESS";
  }, [
    mounted,
    effectiveAccessMode,
    safeWaitlistPass,
    safeCodeUnlocked,
    safeUser,
  ]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#000000]">
      {/* ================================================================= */}
      {/* SECTION 1 — BRIGHT GALLERY CAMPAIGN HERO                          */}
      {/* ================================================================= */}
      <section className="border-b border-zinc-200 bg-[#FFFFFF] pt-24 pb-16 sm:pt-28 sm:pb-24">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          {/* Top Architectural Schedule Strip */}
          <div className="mb-10 flex flex-wrap items-center justify-between gap-3 border-y border-zinc-200 py-3 font-mono text-[10px] tracking-[0.18em] text-[#666666] uppercase sm:text-[11px]">
            <div className="flex items-center gap-2.5 text-[#000000]">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
              <span className="font-semibold">
                {mounted ? config.brandName : "KNITX"} CORE
              </span>
              <span className="text-zinc-300">·</span>
              <span className="text-[#666666]">ESSENTIAL WARDROBE</span>
            </div>

            <div className="flex items-center gap-2 text-[#000000]">
              <Clock className="h-3.5 w-3.5 text-[#666666]" />
              <span className="font-semibold">
                {effectiveCoreOverride
                  ? `SCHEDULED · ${formattedCoreLaunchDate}`
                  : `OPENS ${offsetDays} DAYS POST-${editionLabel}`}
              </span>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <span>RELEASE WINDOW</span>
              <span className="text-zinc-300">·</span>
              <span className="font-semibold text-[#000000]">
                {formattedCoreLaunchDate}
              </span>
            </div>
          </div>

          {/* Editorial Split Hero */}
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Editorial Column */}
            <div className="flex flex-col justify-between lg:col-span-5">
              <div>
                <p className="font-mono text-[10px] font-medium tracking-[0.22em] text-[#666666] uppercase sm:text-[11px]">
                  320–480 GSM MINERAL-DYED BLANKS · ZERO EXTERIOR LOGOS
                </p>

                <h1 className="mt-4 font-syne text-5xl leading-[0.94] font-extrabold tracking-[-0.04em] text-[#000000] uppercase sm:text-6xl xl:text-[4.5rem]">
                  {coreTitle}
                </h1>

                <p className="mt-2 font-poster text-2xl tracking-[0.04em] text-[#666666] uppercase sm:text-3xl">
                  COMMON SILHOUETTES · ELEVATED WEIGHT
                </p>

                <p className="mt-6 max-w-md text-sm leading-relaxed text-[#666666] sm:text-[15px]">
                  {coreSubtitle}
                </p>

                {/* Launch Schedule & Live Countdown Card */}
                <div className="mt-8 border border-zinc-200 bg-[#F4F4F5] p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3 border-b border-zinc-200/90 pb-3.5">
                    <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#000000] uppercase">
                      CORE RELEASE COUNTDOWN
                    </span>
                    <span
                      className="px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-white uppercase"
                      style={{ backgroundColor: accentColor }}
                    >
                      +{offsetDays}D POST-DROP 01
                    </span>
                  </div>

                  {/* Mounted-Guarded DD : HH : MM : SS Grid */}
                  <div className="mt-4 grid grid-cols-4 gap-2.5 text-center">
                    {[
                      {
                        label: "DAYS",
                        val: mounted && countdown ? countdown.days : "--",
                      },
                      {
                        label: "HRS",
                        val: mounted && countdown ? countdown.hours : "--",
                      },
                      {
                        label: "MIN",
                        val: mounted && countdown ? countdown.minutes : "--",
                      },
                      {
                        label: "SEC",
                        val: mounted && countdown ? countdown.seconds : "--",
                      },
                    ].map((unit) => (
                      <div
                        key={unit.label}
                        className="border border-zinc-200 bg-[#FFFFFF] py-3"
                      >
                        <p className="font-poster text-3xl leading-none tracking-[0.04em] text-[#000000] tabular-nums sm:text-4xl">
                          {unit.val}
                        </p>
                        <p className="mt-1.5 font-mono text-[9px] tracking-[0.2em] text-[#666666] uppercase">
                          {unit.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Release Cadence Footnote */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] tracking-[0.14em] text-[#666666] uppercase">
                    <span>
                      {mounted && countdown?.isLive
                        ? "CORE ALLOCATION WINDOW IS LIVE"
                        : `TARGET DATE · ${formattedCoreLaunchDate}`}
                    </span>
                    <span className="text-[#000000]">
                      DROP 01 + COMMUNITY WAITLIST
                    </span>
                  </div>
                </div>
              </div>

              {/* Hero CTAs */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => scrollToElement("core-studio")}
                  className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2.5 bg-[#000000] px-6 py-4 font-mono text-[11px] font-semibold tracking-[0.16em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85"
                >
                  <span>EXPLORE 6 SILHOUETTES</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => scrollToElement("core-access")}
                  className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 border border-zinc-300 bg-[#FFFFFF] px-6 py-4 font-mono text-[11px] font-semibold tracking-[0.16em] text-[#000000] uppercase transition-colors hover:border-[#000000]"
                >
                  {mounted && hasCoreAccess ? (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>ACCESS VERIFIED</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      <span>COMMUNITY ACCESS</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Editorial Studio Photography Triptych */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 lg:col-span-7">
              {/* Primary Campaign Duo */}
              <div className="group relative aspect-[4/5] overflow-hidden bg-[#F4F4F5] sm:col-span-7 sm:aspect-auto sm:min-h-[540px]">
                <Image
                  src={FLAGSHIP_MEDIA.coreCampaignDuo}
                  alt="KNITX CORE heavyweight mineral-dyed essential silhouettes worn in studio daylight"
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 40vw"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/55 via-black/15 to-transparent px-4 pt-10 pb-3.5 font-mono text-[10px] tracking-[0.16em] text-white uppercase">
                  <span>01 · CORE UNIFORM</span>
                  <span>CHALK BONE &amp; DEEP ESPRESSO</span>
                </div>
              </div>

              {/* Right Stacked Detail Plates */}
              <div className="grid grid-cols-2 gap-4 sm:col-span-5 sm:grid-cols-1">
                <div className="group relative aspect-[3/4] overflow-hidden bg-[#F4F4F5] sm:aspect-auto sm:min-h-[262px]">
                  <Image
                    src={FLAGSHIP_MEDIA.coreHoodieSlate}
                    alt="KNITX CORE 460 GSM boxy hoodie in Mineral Slate"
                    fill
                    sizes="(max-width: 640px) 50vw, 24vw"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="pointer-events-none absolute top-3 left-3 bg-[#FFFFFF]/92 px-2.5 py-1 font-mono text-[9px] font-semibold tracking-[0.16em] text-[#000000] uppercase backdrop-blur-xs">
                    460 GSM · MINERAL SLATE
                  </div>
                </div>

                <div className="group relative aspect-[3/4] overflow-hidden bg-[#F4F4F5] sm:aspect-auto sm:min-h-[262px]">
                  <Image
                    src={FLAGSHIP_MEDIA.coreColorwaysStack}
                    alt="Folded stack of KNITX CORE heavyweight cotton blanks across six mineral tones"
                    fill
                    sizes="(max-width: 640px) 50vw, 24vw"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="pointer-events-none absolute top-3 left-3 bg-[#FFFFFF]/92 px-2.5 py-1 font-mono text-[9px] font-semibold tracking-[0.16em] text-[#000000] uppercase backdrop-blur-xs">
                    6 CURATED MINERAL TONES
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 2 — COMMUNITY ACCESS STATUS BANNER / PRIORITY GATE        */}
      {/* ================================================================= */}
      <section
        id="core-access"
        className="scroll-mt-24 border-b border-zinc-200 bg-[#FFFFFF] py-10 sm:py-12"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          {mounted && hasCoreAccess ? (
            /* ACTIVE COMMUNITY ACCESS STRIP */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col justify-between gap-6 bg-[#000000] px-6 py-6 text-[#FFFFFF] sm:px-8 sm:py-7 lg:flex-row lg:items-center"
            >
              <div className="flex items-start gap-4">
                <div
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  <Check className="h-4 w-4 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-[11px] font-semibold tracking-[0.2em] text-[#FFFFFF] uppercase">
                      COMMUNITY ACCESS ACTIVE
                    </span>
                    <span className="bg-[#F4F4F5] px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-[#000000] uppercase">
                      {accessMethodLabel}
                    </span>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-300">
                    Unlocked via your Drop 1 admission / KNITX community
                    membership. Reserve heavyweight essentials across all tonal
                    colorways.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-white/15 pt-4 lg:border-t-0 lg:pt-0">
                {safeWaitlistPass && (
                  <div className="border border-white/20 bg-white/5 px-4 py-2 font-mono text-[10px] tracking-[0.16em] text-zinc-200 uppercase">
                    MEMBER · {safeWaitlistPass.name}
                  </div>
                )}
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => scrollToElement("core-studio")}
                  className="inline-flex cursor-pointer items-center gap-2 bg-[#FFFFFF] px-5 py-2.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#000000] uppercase transition-colors hover:bg-[#F4F4F5]"
                >
                  <span>SHOP CORE STUDIO</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ) : (
            /* COMMUNITY WAITLIST & DROP 1 MEMBER GATE */
            <div className="border border-zinc-200 bg-[#F4F4F5] p-6 sm:p-8 lg:p-10">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
                {/* Left Eligibility Explanation */}
                <div className="lg:col-span-5">
                  <div className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.2em] text-[#000000] uppercase">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span>COMMUNITY &amp; DROP 01 PRIORITY GATE</span>
                  </div>

                  <h2 className="mt-3 font-syne text-2xl leading-tight font-extrabold tracking-[-0.02em] text-[#000000] uppercase sm:text-3xl">
                    Drop 1 members &amp; community waitlist members receive
                    priority access to KNITX CORE.
                  </h2>

                  <p className="mt-3.5 text-sm leading-relaxed text-[#666666]">
                    Already admitted for Drop 1? Your community pass carries
                    straight into KNITX CORE. New here? Join the community
                    waitlist below to unlock instant access to all six
                    heavyweight tonal silhouettes.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="border border-zinc-300 bg-[#FFFFFF] px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] text-[#000000] uppercase">
                      01 · DROP 01 PASS HOLDERS
                    </span>
                    <span className="border border-zinc-300 bg-[#FFFFFF] px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] text-[#000000] uppercase">
                      02 · COMMUNITY WAITLIST MEMBERS
                    </span>
                  </div>
                </div>

                {/* Right Inline Waitlist Join + Access Code Unlock */}
                <div className="space-y-5 lg:col-span-7">
                  {/* Community Waitlist Form */}
                  <form
                    onSubmit={handleJoinCommunityWaitlist}
                    className="border border-zinc-200 bg-[#FFFFFF] p-5 sm:p-6"
                  >
                    <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#000000] uppercase">
                      JOIN THE KNITX COMMUNITY WAITLIST
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="core-member-name"
                          className="mb-1.5 block font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase"
                        >
                          FULL NAME
                        </label>
                        <input
                          id="core-member-name"
                          type="text"
                          suppressHydrationWarning
                          value={memberName}
                          onChange={(e) => setMemberName(e.target.value)}
                          placeholder="Aarav Mehta"
                          required
                          className="w-full border border-zinc-300 bg-[#FFFFFF] px-3.5 py-3 text-sm text-[#000000] placeholder:text-zinc-400 focus:border-[#000000] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="core-member-email"
                          className="mb-1.5 block font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase"
                        >
                          EMAIL
                        </label>
                        <input
                          id="core-member-email"
                          type="email"
                          suppressHydrationWarning
                          value={memberEmail}
                          onChange={(e) => setMemberEmail(e.target.value)}
                          placeholder="you@domain.com"
                          required
                          className="w-full border border-zinc-300 bg-[#FFFFFF] px-3.5 py-3 text-sm text-[#000000] placeholder:text-zinc-400 focus:border-[#000000] focus:outline-none"
                        />
                      </div>
                    </div>

                    {waitlistError && (
                      <div className="mt-3 flex items-center gap-2 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{waitlistError}</span>
                      </div>
                    )}

                    {waitlistSuccessNote && (
                      <div className="mt-3 flex items-center gap-2 border border-zinc-200 bg-[#F4F4F5] px-3 py-2 font-mono text-[11px] text-[#000000]">
                        <Check className="h-3.5 w-3.5 shrink-0" />
                        <span>{waitlistSuccessNote}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      suppressHydrationWarning
                      disabled={waitlistSubmitting}
                      className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 bg-[#000000] px-6 py-3.5 font-mono text-[11px] font-semibold tracking-[0.18em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85 disabled:opacity-50"
                    >
                      {waitlistSubmitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>ISSUING COMMUNITY PASS…</span>
                        </>
                      ) : (
                        <>
                          <span>JOIN COMMUNITY FOR ACCESS</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Discreet Inline Drop 1 / Core Code Unlock */}
                  <form
                    onSubmit={handleVerifyAccessCode}
                    className="flex flex-col gap-3 border border-zinc-200 bg-[#FFFFFF] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <KeyRound className="h-3.5 w-3.5 shrink-0 text-[#666666]" />
                      <span className="font-mono text-[10px] tracking-[0.14em] text-[#666666] uppercase">
                        Have a Drop 1 or Core code?
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col gap-2 sm:max-w-md sm:flex-row">
                      <input
                        type="text"
                        suppressHydrationWarning
                        value={codeInput}
                        onChange={(e) => {
                          setCodeInput(e.target.value);
                          setCodeError(null);
                        }}
                        placeholder="KNITX-001 or KNITX-CORE"
                        aria-label="Drop 1 or Core access code"
                        className="flex-1 border border-zinc-300 bg-[#F4F4F5]/60 px-3 py-2 font-mono text-[11px] tracking-[0.12em] text-[#000000] uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-400 focus:border-[#000000] focus:bg-[#FFFFFF] focus:outline-none"
                      />
                      <button
                        type="submit"
                        suppressHydrationWarning
                        className="cursor-pointer border border-[#000000] bg-[#FFFFFF] px-4 py-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#000000] uppercase transition-colors hover:bg-[#000000] hover:text-[#FFFFFF]"
                      >
                        UNLOCK
                      </button>
                    </div>
                  </form>

                  {codeError && (
                    <p className="font-mono text-[11px] text-red-600">
                      {codeError}
                    </p>
                  )}
                  {codeSuccess && (
                    <p className="font-mono text-[11px] text-[#000000]">
                      Access code verified — KNITX CORE unlocked.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 3 — INTERACTIVE TONAL COLORWAY STUDIO & LOOKBOOK GRID     */}
      {/* ================================================================= */}
      <section
        id="core-studio"
        className="scroll-mt-20 bg-[#FFFFFF] py-14 sm:py-20"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          {/* Studio Section Header */}
          <div className="flex flex-col justify-between gap-4 pb-8 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-[#666666] uppercase">
                TONAL COLORWAY STUDIO · GARMENT-DYED COTTON
              </p>
              <h2 className="mt-2 font-syne text-3xl font-extrabold tracking-[-0.03em] text-[#000000] uppercase sm:text-4xl">
                ESSENTIAL SILHOUETTES
              </h2>
            </div>
            <p className="font-mono text-[11px] tracking-[0.16em] text-[#666666] uppercase">
              SHOWING{" "}
              <span className="font-semibold text-[#000000]">
                {filteredGarments.length}
              </span>{" "}
              OF {CORE_COLLECTION_GARMENTS.length} PIECES · {activeToneLabel}
            </p>
          </div>

          {/* Interactive Palette Swatch Bar & Category Filter Strip */}
          <div className="mb-12 space-y-5 border-y border-zinc-200 py-5">
            {/* Row 1: Mineral Colorway Palette Filter */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.18em] text-[#666666] uppercase">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#000000]" />
                <span>PALETTE FILTER</span>
                <span className="text-zinc-300">·</span>
                <span className="text-[#000000]">{activeToneLabel}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => handleSelectGlobalTone("all")}
                  className={cn(
                    "cursor-pointer rounded-full border px-3.5 py-1.5 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase transition-colors",
                    activeToneFilter === "all"
                      ? "border-[#000000] bg-[#000000] text-[#FFFFFF]"
                      : "border-zinc-200 bg-[#FFFFFF] text-[#666666] hover:border-[#000000] hover:text-[#000000]"
                  )}
                >
                  ALL TONES
                </button>

                {MINERAL_PALETTE.map((tone) => {
                  const isActive = activeToneFilter === tone.id;
                  return (
                    <button
                      key={tone.id}
                      type="button"
                      suppressHydrationWarning
                      onClick={() => handleSelectGlobalTone(tone.id)}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] uppercase transition-all",
                        isActive
                          ? "border-[#000000] bg-[#F4F4F5] font-semibold text-[#000000]"
                          : "border-zinc-200 bg-[#FFFFFF] text-[#666666] hover:border-zinc-400 hover:text-[#000000]"
                      )}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full"
                        style={{
                          backgroundColor: tone.hex,
                          boxShadow: tone.borderHex
                            ? `inset 0 0 0 1px ${tone.borderHex}`
                            : "inset 0 0 0 1px rgba(0,0,0,0.08)",
                        }}
                      />
                      <span>{tone.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Category Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-100 pt-4">
              {CATEGORY_TABS.map((tab) => {
                const isSelected = activeCategory === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setActiveCategory(tab.value)}
                    className={cn(
                      "cursor-pointer px-3.5 py-2 font-mono text-[10px] font-semibold tracking-[0.16em] uppercase transition-colors sm:text-[11px]",
                      isSelected
                        ? "bg-[#000000] text-[#FFFFFF]"
                        : "bg-transparent text-[#666666] hover:bg-[#F4F4F5] hover:text-[#000000]"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Grid */}
          {filteredGarments.length === 0 ? (
            <div className="border border-zinc-200 bg-[#F4F4F5] px-6 py-16 text-center">
              <p className="font-mono text-[11px] tracking-[0.18em] text-[#666666] uppercase">
                NO SILHOUETTES MATCH THIS FILTER COMBINATION
              </p>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => {
                  setActiveCategory("ALL");
                  setActiveToneFilter("all");
                }}
                className="mt-5 cursor-pointer bg-[#000000] px-6 py-3 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#FFFFFF] uppercase"
              >
                RESET STUDIO FILTERS
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGarments.map((garment) => {
                const activeSwatch = getActiveSwatchForGarment(
                  garment,
                  selectedSwatches
                );

                return (
                  <article
                    key={garment._id}
                    className="group flex flex-col"
                  >
                    {/* Tall Gallery Image Frame */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenQuickShop(garment)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleOpenQuickShop(garment);
                        }
                      }}
                      aria-label={`Open quick shop for ${garment.title} in ${activeSwatch.name}`}
                      className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden bg-[#F4F4F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#000000]"
                    >
                      <Image
                        src={activeSwatch.imageUrl}
                        alt={`${garment.title} — ${activeSwatch.name}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                      />

                      {/* Subtle Top Spec Badges */}
                      <div className="pointer-events-none absolute top-3.5 left-3.5 bg-[#FFFFFF]/92 px-2.5 py-1 font-mono text-[10px] font-medium tracking-[0.14em] text-[#000000] uppercase backdrop-blur-xs">
                        {garment.serialCode}
                      </div>

                      <div className="pointer-events-none absolute top-3.5 right-3.5 bg-[#FFFFFF]/92 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-[#000000] uppercase backdrop-blur-xs">
                        {garment.gsmWeight}
                      </div>

                      {/* Subtle Hover Quick-Shop Bar */}
                      <div className="pointer-events-none absolute inset-x-3.5 bottom-3.5 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <div className="flex items-center justify-between bg-[#FFFFFF]/96 px-4 py-3 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#000000] uppercase shadow-sm backdrop-blur-xs">
                          <span>
                            {mounted && hasCoreAccess
                              ? "QUICK SHOP · SELECT SIZE"
                              : "INSPECT SILHOUETTE"}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>

                    {/* Below-Image Tactile Swatch Row & Details */}
                    <div className="mt-4 flex flex-1 flex-col justify-between">
                      {/* Interactive Color Swatch Circles */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {garment.swatches.map((swatch) => {
                            const isSelected = swatch.id === activeSwatch.id;
                            return (
                              <button
                                key={swatch.id}
                                type="button"
                                suppressHydrationWarning
                                onClick={(e) =>
                                  handleCardSwatchClick(
                                    e,
                                    garment._id,
                                    swatch.id
                                  )
                                }
                                title={swatch.name}
                                aria-label={`Select ${swatch.name} colorway for ${garment.title}`}
                                aria-pressed={isSelected}
                                className={cn(
                                  "h-4 w-4 cursor-pointer rounded-full transition-transform hover:scale-110",
                                  isSelected
                                    ? "ring-1 ring-[#000000] ring-offset-2 ring-offset-[#FFFFFF]"
                                    : "opacity-85 hover:opacity-100"
                                )}
                                style={{
                                  backgroundColor: swatch.hex,
                                  boxShadow: swatch.borderHex
                                    ? `inset 0 0 0 1px ${swatch.borderHex}`
                                    : "inset 0 0 0 1px rgba(0,0,0,0.1)",
                                }}
                              />
                            );
                          })}
                        </div>

                        <span className="font-mono text-[10px] tracking-[0.14em] text-[#666666] uppercase">
                          {garment.swatches.length} TONES
                        </span>
                      </div>

                      {/* Title & Price */}
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={() => handleOpenQuickShop(garment)}
                        className="mt-3 block w-full cursor-pointer text-left"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="line-clamp-2 font-syne text-[15px] leading-snug font-bold tracking-[-0.01em] text-[#000000] uppercase group-hover:underline group-hover:underline-offset-4">
                            {garment.title}
                          </h3>
                          <span className="shrink-0 font-mono text-sm font-semibold text-[#000000]">
                            {formatInr(garment.priceInr)}
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-center justify-between gap-2 font-mono text-[10px] tracking-[0.14em] text-[#666666] uppercase">
                          <span>{activeSwatch.name}</span>
                          <span>
                            {garment.gsmWeight} · {garment.category}
                          </span>
                        </div>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 4 — PURE-WHITE EDITORIAL COMPARISON STRIP                 */}
      {/* ================================================================= */}
      <section className="border-t border-zinc-200 bg-[#FFFFFF] py-16 sm:py-24">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="mb-10 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[10px] tracking-[0.22em] text-[#666666] uppercase">
                HOUSE ARCHITECTURE · TWO DISTINCT LINES
              </p>
              <h2 className="mt-2 font-syne text-2xl font-extrabold tracking-[-0.03em] text-[#000000] uppercase sm:text-3xl">
                KNITX DROPS VS. KNITX CORE
              </h2>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-[#666666] sm:text-right">
              Designed to live in the same wardrobe — numbered collector
              statements layered over heavyweight unbranded mineral staples.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* KNITX DROPS Card */}
            <div className="flex flex-col justify-between border border-zinc-200 bg-[#FFFFFF] p-6 sm:p-8">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#666666] uppercase">
                    01 · COLLECTOR ARCHIVE
                  </span>
                  <span
                    className="px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-white uppercase"
                    style={{ backgroundColor: accentColor }}
                  >
                    1–4 UNITS MAX
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-12 sm:items-center">
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#F4F4F5] sm:col-span-4">
                    <Image
                      src={FLAGSHIP_MEDIA.dropBomberStudio}
                      alt="KNITX Drops numbered collector garment"
                      fill
                      sizes="(max-width: 640px) 100vw, 200px"
                      className="object-cover"
                    />
                  </div>
                  <div className="sm:col-span-8">
                    <h3 className="font-syne text-2xl font-extrabold tracking-[-0.02em] text-[#000000] uppercase">
                      KNITX DROPS
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#666666]">
                      Bespoke art direction, hand-finished embroidery, and
                      one-of-one collector works strictly capped at 1–4 numbered
                      units with zero restocks.
                    </p>
                    <ul className="mt-4 space-y-1.5 font-mono text-[10px] tracking-[0.14em] text-[#000000] uppercase">
                      <li className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-[#666666]" />
                        <span>1-OF-1 &amp; SMALL-BATCH COLLECTOR EDITIONS</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-[#666666]" />
                        <span>50% REVEALED · 50% WAITLIST-VEILED</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-7 border-t border-zinc-200 pt-5">
                <Link
                  href="/drops"
                  className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.16em] text-[#000000] uppercase transition-opacity hover:opacity-70"
                >
                  <span>ENTER CURRENT DROP</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* KNITX CORE Card */}
            <div className="flex flex-col justify-between border border-zinc-200 bg-[#F4F4F5] p-6 sm:p-8">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#666666] uppercase">
                    02 · ESSENTIAL WARDROBE
                  </span>
                  <span className="bg-[#000000] px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-[#FFFFFF] uppercase">
                    320–480 GSM BLANKS
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-12 sm:items-center">
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#FFFFFF] sm:col-span-4">
                    <Image
                      src={FLAGSHIP_MEDIA.coreColorwaysStack}
                      alt="KNITX CORE mineral-dyed heavyweight cotton stack"
                      fill
                      sizes="(max-width: 640px) 100vw, 200px"
                      className="object-cover"
                    />
                  </div>
                  <div className="sm:col-span-8">
                    <h3 className="font-syne text-2xl font-extrabold tracking-[-0.02em] text-[#000000] uppercase">
                      KNITX CORE
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#666666]">
                      Unbranded architectural staples milled in heavyweight
                      Indian cotton across six mineral tones. Released{" "}
                      {offsetDays} days after Drop 1 exclusively for our
                      community.
                    </p>
                    <ul className="mt-4 space-y-1.5 font-mono text-[10px] tracking-[0.14em] text-[#000000] uppercase">
                      <li className="flex items-center gap-2">
                        <Layers className="h-3 w-3 text-[#666666]" />
                        <span>6 SILHOUETTES · 6 MINERAL COLORWAYS</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Layers className="h-3 w-3 text-[#666666]" />
                        <span>DROP 01 &amp; COMMUNITY WAITLIST ACCESS</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-7 border-t border-zinc-200 pt-5">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => scrollToElement("core-studio")}
                  className="inline-flex cursor-pointer items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.16em] text-[#000000] uppercase transition-opacity hover:opacity-70"
                >
                  <span>RETURN TO CORE STUDIO</span>
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* FULL-HEIGHT PURE-WHITE CORE QUICK-SHOP SLIDE-OVER                 */}
      {/* ================================================================= */}
      <AnimatePresence>
        {activeQuickShopGarment && activeQuickShopSwatch && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${activeQuickShopGarment.title} quick shop`}
            className="fixed inset-0 z-50 flex justify-end"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={handleCloseQuickShop}
              className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            />

            {/* Pure-White Drawer Panel */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-zinc-200 bg-[#FFFFFF] text-[#000000] shadow-[-24px_0_72px_rgba(0,0,0,0.14)]"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 sm:px-7">
                <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.18em] text-[#666666] uppercase">
                  <span className="font-semibold text-[#000000]">
                    {activeQuickShopGarment.serialCode}
                  </span>
                  <span className="text-zinc-300">·</span>
                  <span>KNITX CORE</span>
                  <span className="text-zinc-300">·</span>
                  <span>{activeQuickShopGarment.gsmWeight}</span>
                </div>

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={handleCloseQuickShop}
                  aria-label="Close quick shop"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-[#FFFFFF] text-[#666666] transition-colors hover:border-[#000000] hover:text-[#000000]"
                >
                  <X className="h-4 w-4 stroke-[1.75]" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-7">
                {/* Studio Photo Frame */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F4F4F5]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeQuickShopSwatch.id}
                      initial={{ opacity: 0.4 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0.4 }}
                      transition={{ duration: 0.2 }}
                      className="relative h-full w-full"
                    >
                      <Image
                        src={activeQuickShopSwatch.imageUrl}
                        alt={`${activeQuickShopGarment.title} in ${activeQuickShopSwatch.name}`}
                        fill
                        sizes="(max-width: 640px) 100vw, 520px"
                        className="object-cover object-center"
                      />
                    </motion.div>
                  </AnimatePresence>

                  <div className="pointer-events-none absolute bottom-3.5 left-3.5 bg-[#FFFFFF]/92 px-3 py-1.5 font-mono text-[10px] font-semibold tracking-[0.15em] text-[#000000] uppercase backdrop-blur-xs">
                    {activeQuickShopSwatch.name}
                  </div>
                </div>

                {/* Title & Price */}
                <div className="mt-6 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-syne text-2xl leading-tight font-extrabold tracking-[-0.02em] text-[#000000] uppercase">
                      {activeQuickShopGarment.title}
                    </h2>
                    <p className="mt-1 font-mono text-[11px] tracking-[0.12em] text-[#666666] uppercase">
                      {activeQuickShopGarment.fit}
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-lg font-semibold text-[#000000]">
                    {formatInr(activeQuickShopGarment.priceInr)}
                  </p>
                </div>

                {/* Interactive Swatch Picker */}
                <div className="mt-6 border-t border-zinc-200 pt-5">
                  <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.16em] uppercase">
                    <span className="text-[#666666]">MINERAL COLORWAY</span>
                    <span className="font-semibold text-[#000000]">
                      {activeQuickShopSwatch.name}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {activeQuickShopGarment.swatches.map((swatch) => {
                      const isSelected = swatch.id === activeQuickShopSwatch.id;
                      return (
                        <button
                          key={swatch.id}
                          type="button"
                          suppressHydrationWarning
                          onClick={() =>
                            setSelectedSwatches((prev) => ({
                              ...prev,
                              [activeQuickShopGarment._id]: swatch.id,
                            }))
                          }
                          aria-label={`Choose ${swatch.name}`}
                          aria-pressed={isSelected}
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] uppercase transition-all",
                            isSelected
                              ? "border-[#000000] bg-[#F4F4F5] font-semibold text-[#000000]"
                              : "border-zinc-200 bg-[#FFFFFF] text-[#666666] hover:border-zinc-400"
                          )}
                        >
                          <span
                            className="h-3.5 w-3.5 rounded-full"
                            style={{
                              backgroundColor: swatch.hex,
                              boxShadow: swatch.borderHex
                                ? `inset 0 0 0 1px ${swatch.borderHex}`
                                : "inset 0 0 0 1px rgba(0,0,0,0.1)",
                            }}
                          />
                          <span>{swatch.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size Selector */}
                <div className="mt-6 border-t border-zinc-200 pt-5">
                  <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.16em] uppercase">
                    <span className="text-[#666666]">SELECT SIZE</span>
                    <span className="text-[#666666]">
                      DISPATCHES IN {activeQuickShopGarment.productionDays} DAYS
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-2.5">
                    {activeQuickShopGarment.sizes.map((size) => {
                      const isSelected = selectedSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          suppressHydrationWarning
                          onClick={() => setSelectedSize(size)}
                          className={cn(
                            "cursor-pointer border py-3 font-mono text-xs font-semibold tracking-[0.14em] uppercase transition-colors",
                            isSelected
                              ? "border-[#000000] bg-[#000000] text-[#FFFFFF]"
                              : "border-zinc-200 bg-[#FFFFFF] text-[#000000] hover:border-[#000000]"
                          )}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <p className="mt-6 text-sm leading-relaxed text-[#666666]">
                  {activeQuickShopGarment.description}
                </p>

                {/* Fit & GSM Breakdown Grid */}
                <div className="mt-6 grid grid-cols-2 gap-px border border-zinc-200 bg-zinc-200">
                  <div className="bg-[#FFFFFF] p-3.5">
                    <p className="font-mono text-[9px] tracking-[0.18em] text-[#666666] uppercase">
                      FABRIC WEIGHT
                    </p>
                    <p className="mt-1 font-mono text-xs font-semibold text-[#000000]">
                      {activeQuickShopGarment.gsmWeight}
                    </p>
                  </div>
                  <div className="bg-[#FFFFFF] p-3.5">
                    <p className="font-mono text-[9px] tracking-[0.18em] text-[#666666] uppercase">
                      CATEGORY
                    </p>
                    <p className="mt-1 font-mono text-xs font-semibold text-[#000000] uppercase">
                      {activeQuickShopGarment.category}
                    </p>
                  </div>
                  <div className="col-span-2 bg-[#FFFFFF] p-3.5">
                    <p className="font-mono text-[9px] tracking-[0.18em] text-[#666666] uppercase">
                      MILL COMPOSITION
                    </p>
                    <p className="mt-1 text-xs text-[#000000]">
                      {activeQuickShopGarment.fabric}
                    </p>
                  </div>
                </div>

                {/* Craftsmanship Details */}
                <div className="mt-6 border-t border-zinc-200 pt-5">
                  <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#000000] uppercase">
                    CRAFTSMANSHIP &amp; CONSTRUCTION
                  </p>
                  <ul className="mt-3 space-y-2">
                    {activeQuickShopGarment.craftsmanship.map((detail) => (
                      <li
                        key={detail}
                        className="flex items-start gap-2.5 text-xs leading-relaxed text-[#666666]"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#000000]" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {bagError && (
                  <div className="mt-5 flex items-center gap-2 border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{bagError}</span>
                  </div>
                )}
              </div>

              {/* Sticky Footer Action Bar */}
              <div className="border-t border-zinc-200 bg-[#FFFFFF] px-6 py-5 sm:px-7">
                {mounted && hasCoreAccess ? (
                  <>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={handleQuickShopAddToBag}
                      className="flex w-full cursor-pointer items-center justify-center gap-2.5 bg-[#000000] py-4 font-mono text-xs font-semibold tracking-[0.18em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85"
                    >
                      <span>
                        ADD TO BAG — {formatInr(activeQuickShopGarment.priceInr)}
                      </span>
                    </button>
                    <p className="mt-2.5 text-center font-mono text-[10px] tracking-[0.12em] text-[#666666] uppercase">
                      {activeQuickShopSwatch.name} · SIZE {selectedSize} ·
                      COMPLIMENTARY INSURED INDIA DISPATCH
                    </p>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => {
                        handleCloseQuickShop();
                        window.setTimeout(
                          () => scrollToElement("core-access"),
                          120
                        );
                      }}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 bg-[#000000] py-4 font-mono text-xs font-semibold tracking-[0.18em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>JOIN COMMUNITY WAITLIST TO SHOP</span>
                    </button>
                    <p className="mt-2.5 text-center font-mono text-[10px] tracking-[0.12em] text-[#666666] uppercase">
                      DROP 01 MEMBERS &amp; WAITLIST REGISTRANTS UNLOCK INSTANTLY
                    </p>
                  </>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
