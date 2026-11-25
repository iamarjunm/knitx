"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  ArrowUp,
  Check,
  Clock,
  Layers,
  Loader2,
  Lock,
  LogIn,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStorefrontConfig } from "@/context/StorefrontConfigContext";
import { useVault } from "@/context/VaultContext";
import {
  CORE_COLLECTION_GARMENTS,
  computeCoreLaunchDate,
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
  const { user, setAuthModalOpen } = useAuth();
  const { waitlistPass, isVaultUnlocked, joinWaitlist } = useVault();

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

  // Community Waitlist & Account Access Gate State
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [waitlistSuccessNote, setWaitlistSuccessNote] = useState<string | null>(
    null
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const accentColor = mounted ? config.accentColor || "#E11D2E" : "#E11D2E";
  const coreTitle = mounted ? config.coreTitle || "KNITX CORE" : "KNITX CORE";
  const coreSubtitle = mounted
    ? config.coreSubtitle ||
      "Minimalist everyday essentials in curated mineral colorways, finished with subtle signature KNITX branding (tonal embroidery & woven labels). Opens 2 weeks after Drop 1 exclusively for Drop 1 & community waitlist members."
    : "Minimalist everyday essentials in curated mineral colorways, finished with subtle signature KNITX branding (tonal embroidery & woven labels). Opens 2 weeks after Drop 1 exclusively for Drop 1 & community waitlist members.";
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

  // Access computation (account & waitlist based, mounted-guarded)
  const effectiveAccessMode = mounted ? config.coreAccessMode : "community";
  const safeWaitlistPass = mounted ? waitlistPass : null;
  const safeUser = mounted ? user : null;
  const safeDropAdmitted = mounted && isVaultUnlocked;

  const hasCoreAccess = useMemo(() => {
    if (!mounted) return false;
    if (effectiveAccessMode === "open") return true;
    if (effectiveAccessMode === "locked") return safeDropAdmitted;
    return safeDropAdmitted || Boolean(safeWaitlistPass) || Boolean(safeUser);
  }, [
    mounted,
    effectiveAccessMode,
    safeDropAdmitted,
    safeWaitlistPass,
    safeUser,
  ]);

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

  const scrollToElement = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
          `Pass #${String(pass.position).padStart(4, "0")} issued. KNITX CORE unlocks automatically once your account is admitted.`
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
    if (safeDropAdmitted) return "DROP 01 ADMISSION VERIFIED";
    if (safeUser) return "MEMBER ACCOUNT ACTIVE";
    return "COMMUNITY ACCESS";
  }, [
    mounted,
    effectiveAccessMode,
    safeWaitlistPass,
    safeDropAdmitted,
    safeUser,
  ]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#000000]">
      {/* ================================================================= */}
      {/* SECTION 1 — BRIGHT GALLERY CAMPAIGN HERO                          */}
      {/* ================================================================= */}
      <section className="border-b border-zinc-200 bg-[#FFFFFF] pt-20 pb-12 sm:pt-28 sm:pb-24">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          {/* Top Architectural Schedule Strip */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-y border-zinc-200 py-2.5 font-mono text-[9px] tracking-[0.14em] text-[#666666] uppercase sm:mb-10 sm:gap-3 sm:py-3 sm:text-[11px] sm:tracking-[0.18em]">
            <div className="flex items-center gap-2 text-[#000000] sm:gap-2.5">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
              <span className="font-semibold">
                {mounted ? config.brandName : "KNITX"} CORE
              </span>
              <span className="text-zinc-300">·</span>
              <span className="text-[#666666]">ESSENTIAL WARDROBE</span>
            </div>

            <div className="flex items-center gap-1.5 text-[#000000] sm:gap-2">
              <Clock className="h-3 w-3 shrink-0 text-[#666666] sm:h-3.5 sm:w-3.5" />
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
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Left Editorial Column */}
            <div className="flex flex-col justify-between lg:col-span-5">
              <div>
                <p className="font-mono text-[9px] font-medium tracking-[0.18em] text-[#666666] uppercase sm:text-[11px] sm:tracking-[0.22em]">
                  320–480 GSM MINERAL-DYED ESSENTIALS · SUBTLE SIGNATURE KNITX BRANDING
                </p>

                <h1 className="mt-3 font-syne text-4xl leading-[0.94] font-extrabold tracking-[-0.04em] text-[#000000] uppercase sm:mt-4 sm:text-7xl">
                  {coreTitle}
                </h1>

                <p className="mt-2 font-poster text-xl tracking-[0.04em] text-[#666666] uppercase sm:text-3xl">
                  COMMON SILHOUETTES · ELEVATED WEIGHT
                </p>

                <p className="mt-4 max-w-md text-sm leading-relaxed text-[#666666] sm:mt-6 sm:text-[15px]">
                  {coreSubtitle}
                </p>

                {/* Launch Schedule & Live Countdown Card */}
                <div className="mt-6 border border-zinc-200 bg-[#F4F4F5] p-4 sm:mt-8 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/90 pb-3 sm:pb-3.5">
                    <span className="font-mono text-[9px] font-semibold tracking-[0.16em] text-[#000000] uppercase sm:text-[10px] sm:tracking-[0.18em]">
                      CORE RELEASE COUNTDOWN
                    </span>
                    <span
                      className="px-2 py-0.5 font-mono text-[9px] font-semibold tracking-[0.12em] text-white uppercase sm:text-[10px] sm:tracking-[0.14em]"
                      style={{ backgroundColor: accentColor }}
                    >
                      +{offsetDays}D POST-DROP 01
                    </span>
                  </div>

                  {/* Mounted-Guarded DD : HH : MM : SS Grid */}
                  <div className="mt-3.5 grid grid-cols-4 gap-1.5 text-center sm:mt-4 sm:gap-2.5">
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
                        className="border border-zinc-200 bg-[#FFFFFF] py-2.5 sm:py-3"
                      >
                        <p className="font-poster text-2xl leading-none tracking-[0.04em] text-[#000000] tabular-nums sm:text-4xl">
                          {unit.val}
                        </p>
                        <p className="mt-1 font-mono text-[8px] tracking-[0.16em] text-[#666666] uppercase sm:mt-1.5 sm:text-[9px] sm:tracking-[0.2em]">
                          {unit.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Release Cadence Footnote */}
                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-1.5 font-mono text-[9px] tracking-[0.12em] text-[#666666] uppercase sm:mt-4 sm:gap-2 sm:text-[10px] sm:tracking-[0.14em]">
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
              <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => scrollToElement("core-studio")}
                  className="inline-flex min-h-[46px] flex-1 cursor-pointer items-center justify-center gap-2.5 bg-[#000000] px-5 py-3.5 font-mono text-[11px] font-semibold tracking-[0.16em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85 sm:px-6 sm:py-4"
                >
                  <span>EXPLORE {CORE_COLLECTION_GARMENTS.length} SILHOUETTES</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </button>

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => scrollToElement("core-access")}
                  className="inline-flex min-h-[46px] flex-1 cursor-pointer items-center justify-center gap-2 border border-zinc-300 bg-[#FFFFFF] px-5 py-3.5 font-mono text-[11px] font-semibold tracking-[0.16em] text-[#000000] uppercase transition-colors hover:border-[#000000] sm:px-6 sm:py-4"
                >
                  {mounted && hasCoreAccess ? (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>ACCESS VERIFIED</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5 shrink-0" />
                      <span>COMMUNITY ACCESS</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Editorial Studio Photography Triptych */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:gap-4 lg:col-span-7">
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
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/55 via-black/15 to-transparent px-3.5 pt-8 pb-3 font-mono text-[9px] tracking-[0.14em] text-white uppercase sm:px-4 sm:pt-10 sm:pb-3.5 sm:text-[10px] sm:tracking-[0.16em]">
                  <span className="shrink-0">01 · CORE UNIFORM</span>
                  <span className="truncate">CHALK BONE &amp; DEEP ESPRESSO</span>
                </div>
              </div>

              {/* Right Stacked Detail Plates */}
              <div className="grid grid-cols-2 gap-3 sm:col-span-5 sm:grid-cols-1 sm:gap-4">
                <div className="group relative aspect-[4/5] overflow-hidden bg-[#F4F4F5] sm:aspect-auto sm:min-h-[262px]">
                  <Image
                    src={FLAGSHIP_MEDIA.coreHoodieSlate}
                    alt="KNITX CORE 460 GSM boxy hoodie in Mineral Slate"
                    fill
                    sizes="(max-width: 640px) 50vw, 24vw"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="pointer-events-none absolute top-2.5 left-2.5 bg-[#FFFFFF]/92 px-2 py-0.5 font-mono text-[8px] font-semibold tracking-[0.12em] text-[#000000] uppercase backdrop-blur-xs sm:top-3 sm:left-3 sm:px-2.5 sm:py-1 sm:text-[9px] sm:tracking-[0.16em]">
                    460 GSM · SLATE
                  </div>
                </div>

                <div className="group relative aspect-[4/5] overflow-hidden bg-[#F4F4F5] sm:aspect-auto sm:min-h-[262px]">
                  <Image
                    src={FLAGSHIP_MEDIA.coreColorwaysStack}
                    alt="Folded stack of KNITX CORE minimalist heavyweight cotton essentials across six mineral tones"
                    fill
                    sizes="(max-width: 640px) 50vw, 24vw"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="pointer-events-none absolute top-2.5 left-2.5 bg-[#FFFFFF]/92 px-2 py-0.5 font-mono text-[8px] font-semibold tracking-[0.12em] text-[#000000] uppercase backdrop-blur-xs sm:top-3 sm:left-3 sm:px-2.5 sm:py-1 sm:text-[9px] sm:tracking-[0.16em]">
                    6 MINERAL TONES
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
        className="scroll-mt-24 border-b border-zinc-200 bg-[#FFFFFF] py-8 sm:py-12"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          {mounted && hasCoreAccess ? (
            /* ACTIVE COMMUNITY ACCESS STRIP */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col justify-between gap-5 bg-[#000000] px-5 py-5 text-[#FFFFFF] sm:gap-6 sm:px-8 sm:py-7 lg:flex-row lg:items-center"
            >
              <div className="flex items-start gap-3.5 sm:gap-4">
                <div
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  <Check className="h-4 w-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold tracking-[0.18em] text-[#FFFFFF] uppercase sm:tracking-[0.2em]">
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
                  <div className="border border-white/20 bg-white/5 px-3.5 py-2 font-mono text-[10px] tracking-[0.14em] text-zinc-200 uppercase sm:px-4 sm:tracking-[0.16em]">
                    MEMBER · {safeWaitlistPass.name}
                  </div>
                )}
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => scrollToElement("core-studio")}
                  className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 bg-[#FFFFFF] px-5 py-2.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#000000] uppercase transition-colors hover:bg-[#F4F4F5]"
                >
                  <span>SHOP CORE STUDIO</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ) : (
            /* COMMUNITY WAITLIST & DROP 1 MEMBER GATE */
            <div className="border border-zinc-200 bg-[#F4F4F5] p-4 sm:p-8 lg:p-10">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-10">
                {/* Left Eligibility Explanation */}
                <div className="lg:col-span-5">
                  <div className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.18em] text-[#000000] uppercase sm:tracking-[0.2em]">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span>COMMUNITY &amp; DROP 01 PRIORITY GATE</span>
                  </div>

                  <h2 className="mt-3 font-syne text-xl leading-tight font-extrabold tracking-[-0.02em] text-[#000000] uppercase sm:text-3xl">
                    Drop 1 members &amp; community waitlist members receive
                    priority access to KNITX CORE.
                  </h2>

                  <p className="mt-3 text-sm leading-relaxed text-[#666666] sm:mt-3.5">
                    Already admitted for Drop 1 or holding a KNITX account? Sign
                    in to unlock KNITX CORE automatically with zero access code.
                    New here? Join the community waitlist below for instant
                    access to all heavyweight tonal silhouettes.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
                    <span className="border border-zinc-300 bg-[#FFFFFF] px-2.5 py-1.5 font-mono text-[9px] tracking-[0.12em] text-[#000000] uppercase sm:px-3 sm:text-[10px] sm:tracking-[0.14em]">
                      01 · DROP 01 PASS HOLDERS
                    </span>
                    <span className="border border-zinc-300 bg-[#FFFFFF] px-2.5 py-1.5 font-mono text-[9px] tracking-[0.12em] text-[#000000] uppercase sm:px-3 sm:text-[10px] sm:tracking-[0.14em]">
                      02 · COMMUNITY WAITLIST MEMBERS
                    </span>
                  </div>
                </div>

                {/* Right Inline Waitlist Join + Account Sign-In */}
                <div className="space-y-4 sm:space-y-5 lg:col-span-7">
                  {/* Community Waitlist Form */}
                  <form
                    onSubmit={handleJoinCommunityWaitlist}
                    className="border border-zinc-200 bg-[#FFFFFF] p-4 sm:p-6"
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
                          className="w-full border border-zinc-300 bg-[#FFFFFF] px-3.5 py-3 text-base text-[#000000] placeholder:text-zinc-400 focus:border-[#000000] focus:outline-none sm:text-sm"
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
                          className="w-full border border-zinc-300 bg-[#FFFFFF] px-3.5 py-3 text-base text-[#000000] placeholder:text-zinc-400 focus:border-[#000000] focus:outline-none sm:text-sm"
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
                      className="mt-4 flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-2 bg-[#000000] px-6 py-3.5 font-mono text-[11px] font-semibold tracking-[0.18em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85 disabled:opacity-50"
                    >
                      {waitlistSubmitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>ISSUING COMMUNITY PASS…</span>
                        </>
                      ) : (
                        <>
                          <span>JOIN COMMUNITY WAITLIST</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Existing Account Sign-In Strip */}
                  <div className="flex flex-col gap-3 border border-zinc-200 bg-[#FFFFFF] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="flex items-center gap-2.5">
                      <LogIn className="h-3.5 w-3.5 shrink-0 text-[#666666]" />
                      <span className="font-mono text-[10px] tracking-[0.14em] text-[#666666] uppercase">
                        Already admitted to Drop 1 or have a KNITX account? No
                        code required.
                      </span>
                    </div>

                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setAuthModalOpen(true)}
                      className="inline-flex min-h-[42px] shrink-0 cursor-pointer items-center justify-center gap-2 border border-[#000000] bg-[#FFFFFF] px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#000000] uppercase transition-colors hover:bg-[#000000] hover:text-[#FFFFFF]"
                    >
                      <span>SIGN IN WITH EXISTING ACCOUNT</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                    </button>
                  </div>
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
        className="scroll-mt-20 bg-[#FFFFFF] py-10 sm:py-20"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          {/* Studio Section Header */}
          <div className="flex flex-col justify-between gap-3 pb-6 sm:gap-4 sm:pb-8 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-[#666666] uppercase">
                TONAL COLORWAY STUDIO · GARMENT-DYED COTTON
              </p>
              <h2 className="mt-1.5 font-syne text-2xl font-extrabold tracking-[-0.03em] text-[#000000] uppercase sm:mt-2 sm:text-4xl">
                ESSENTIAL SILHOUETTES
              </h2>
            </div>
            <p className="font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase sm:text-[11px]">
              SHOWING{" "}
              <span className="font-semibold text-[#000000]">
                {filteredGarments.length}
              </span>{" "}
              OF {CORE_COLLECTION_GARMENTS.length} PIECES · {activeToneLabel}
            </p>
          </div>

          {/* Interactive Palette Swatch Bar & Category Filter Strip */}
          <div className="mb-8 space-y-4 border-y border-zinc-200 py-4 sm:mb-12 sm:space-y-5 sm:py-5">
            {/* Row 1: Mineral Colorway Palette Filter (Edge-to-Edge Swipeable on Mobile) */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.18em] text-[#666666] uppercase">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#000000]" />
                <span>PALETTE FILTER</span>
                <span className="text-zinc-300">·</span>
                <span className="text-[#000000]">{activeToneLabel}</span>
              </div>

              <div className="-mx-4 flex flex-nowrap items-center gap-2 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0 lg:flex-wrap lg:overflow-visible">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => handleSelectGlobalTone("all")}
                  className={cn(
                    "inline-flex min-h-[38px] shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full border px-4 py-1.5 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase transition-colors",
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
                        "inline-flex min-h-[38px] shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-1.5 font-mono text-[10px] tracking-[0.12em] uppercase transition-all",
                        isActive
                          ? "border-[#000000] bg-[#F4F4F5] font-semibold text-[#000000]"
                          : "border-zinc-200 bg-[#FFFFFF] text-[#666666] hover:border-zinc-400 hover:text-[#000000]"
                      )}
                    >
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full"
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

            {/* Row 2: Category Tabs (Edge-to-Edge Swipeable on Mobile) */}
            <div className="-mx-4 flex flex-nowrap items-center gap-1.5 overflow-x-auto border-t border-zinc-100 px-4 pt-4 no-scrollbar sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              {CATEGORY_TABS.map((tab) => {
                const isSelected = activeCategory === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setActiveCategory(tab.value)}
                    className={cn(
                      "inline-flex min-h-[38px] shrink-0 cursor-pointer items-center whitespace-nowrap px-3.5 py-2 font-mono text-[10px] font-semibold tracking-[0.16em] uppercase transition-colors sm:text-[11px]",
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
                className="mt-5 min-h-[42px] cursor-pointer bg-[#000000] px-6 py-3 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#FFFFFF] uppercase"
              >
                RESET STUDIO FILTERS
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-14 lg:grid-cols-3">
              {filteredGarments.map((garment) => {
                const activeSwatch = getActiveSwatchForGarment(
                  garment,
                  selectedSwatches
                );

                const productHref = `/core/${garment._id}?color=${activeSwatch.id}`;

                return (
                  <article
                    key={garment._id}
                    className="group flex flex-col"
                  >
                    {/* Tall Gallery Image Frame */}
                    <Link
                      href={productHref}
                      aria-label={`View ${garment.title} in ${activeSwatch.name}`}
                      className="relative block aspect-[3/4] w-full overflow-hidden bg-[#F4F4F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#000000]"
                    >
                      <Image
                        src={activeSwatch.imageUrl}
                        alt={`${garment.title} — ${activeSwatch.name}`}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                      />

                      {/* Subtle Top Spec Badges */}
                      <div className="pointer-events-none absolute top-2 left-2 hidden bg-[#FFFFFF]/92 px-2 py-0.5 font-mono text-[9px] font-medium tracking-[0.12em] text-[#000000] uppercase backdrop-blur-xs sm:top-3.5 sm:left-3.5 sm:block sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-[0.14em]">
                        {garment.serialCode}
                      </div>

                      <div className="pointer-events-none absolute top-2 right-2 bg-[#FFFFFF]/92 px-1.5 py-0.5 font-mono text-[8px] font-semibold tracking-[0.1em] text-[#000000] uppercase backdrop-blur-xs sm:top-3.5 sm:right-3.5 sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-[0.12em]">
                        {garment.gsmWeight}
                      </div>

                      {/* Subtle Hover Product Page Bar (Desktop) */}
                      <div className="pointer-events-none absolute inset-x-3.5 bottom-3.5 hidden translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:block">
                        <div className="flex items-center justify-between bg-[#FFFFFF]/96 px-4 py-3 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#000000] uppercase shadow-sm backdrop-blur-xs">
                          <span>
                            {mounted && hasCoreAccess
                              ? "VIEW PRODUCT · SELECT SIZE"
                              : "VIEW SILHOUETTE"}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </Link>

                    {/* Below-Image Tactile Swatch Row & Details */}
                    <div className="mt-2.5 flex flex-1 flex-col justify-between sm:mt-4">
                      {/* Interactive Color Swatch Circles */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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
                                  "h-3.5 w-3.5 cursor-pointer rounded-full transition-transform hover:scale-110 sm:h-4 sm:w-4",
                                  isSelected
                                    ? "ring-1 ring-[#000000] ring-offset-1 ring-offset-[#FFFFFF] sm:ring-offset-2"
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

                        <span className="hidden shrink-0 font-mono text-[10px] tracking-[0.14em] text-[#666666] uppercase sm:inline">
                          {garment.swatches.length} TONES
                        </span>
                      </div>

                      {/* Title & Price */}
                      <Link
                        href={productHref}
                        className="mt-2 block w-full text-left sm:mt-3"
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                          <h3 className="line-clamp-2 font-syne text-xs leading-snug font-bold tracking-[-0.01em] text-[#000000] uppercase group-hover:underline group-hover:underline-offset-4 sm:text-[15px]">
                            {garment.title}
                          </h3>
                          <span className="shrink-0 font-mono text-xs font-semibold text-[#000000] tabular-nums sm:text-sm">
                            {formatInr(garment.priceInr)}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between gap-2 font-mono text-[9px] tracking-[0.12em] text-[#666666] uppercase sm:mt-1.5 sm:text-[10px] sm:tracking-[0.14em]">
                          <span className="truncate">{activeSwatch.name}</span>
                          <span className="hidden shrink-0 sm:inline">
                            {garment.gsmWeight} · {garment.category}
                          </span>
                        </div>
                      </Link>
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
      <section className="border-t border-zinc-200 bg-[#FFFFFF] py-12 sm:py-24">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:mb-10 sm:flex-row sm:items-end">
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
              statements layered over minimalist mineral staples finished with
              subtle signature KNITX branding.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
            {/* KNITX DROPS Card */}
            <div className="flex flex-col justify-between border border-zinc-200 bg-[#FFFFFF] p-5 sm:p-8">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#666666] uppercase sm:tracking-[0.18em]">
                    01 · COLLECTOR ARCHIVE
                  </span>
                  <span
                    className="px-2 py-0.5 font-mono text-[9px] font-semibold tracking-[0.12em] text-white uppercase sm:px-2.5 sm:text-[10px] sm:tracking-[0.14em]"
                    style={{ backgroundColor: accentColor }}
                  >
                    CURATED LIMITED RUNS
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-center sm:gap-5">
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
                    <h3 className="font-syne text-xl font-extrabold tracking-[-0.02em] text-[#000000] uppercase sm:text-2xl">
                      KNITX DROPS
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#666666]">
                      Bespoke art direction, hand-finished embroidery, and
                      collector works issued in curated small-batch &amp;
                      one-of-one quantities with zero restocks.
                    </p>
                    <ul className="mt-4 space-y-1.5 font-mono text-[10px] tracking-[0.14em] text-[#000000] uppercase">
                      <li className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 shrink-0 text-[#666666]" />
                        <span>CURATED SMALL-BATCH &amp; ONE-OF-ONE QUANTITIES</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 shrink-0 text-[#666666]" />
                        <span>SELECT PUBLIC PREVIEW · ACCOUNT-UNLOCKED PIECES</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-zinc-200 pt-4 sm:mt-7 sm:pt-5">
                <Link
                  href="/drops"
                  className="inline-flex min-h-[38px] items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.16em] text-[#000000] uppercase transition-opacity hover:opacity-70"
                >
                  <span>ENTER CURRENT DROP</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* KNITX CORE Card */}
            <div className="flex flex-col justify-between border border-zinc-200 bg-[#F4F4F5] p-5 sm:p-8">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#666666] uppercase sm:tracking-[0.18em]">
                    02 · ESSENTIAL WARDROBE
                  </span>
                  <span className="bg-[#000000] px-2 py-0.5 font-mono text-[9px] font-semibold tracking-[0.12em] text-[#FFFFFF] uppercase sm:px-2.5 sm:text-[10px] sm:tracking-[0.14em]">
                    320–480 GSM ESSENTIALS
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-center sm:gap-5">
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
                    <h3 className="font-syne text-xl font-extrabold tracking-[-0.02em] text-[#000000] uppercase sm:text-2xl">
                      KNITX CORE
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#666666]">
                      Minimalist everyday essentials in curated mineral
                      colorways, finished with subtle signature KNITX branding
                      (tonal embroidery &amp; woven labels). Released{" "}
                      {offsetDays} days after Drop 1 exclusively for our
                      community.
                    </p>
                    <ul className="mt-4 space-y-1.5 font-mono text-[10px] tracking-[0.14em] text-[#000000] uppercase">
                      <li className="flex items-center gap-2">
                        <Layers className="h-3 w-3 shrink-0 text-[#666666]" />
                        <span>
                          {CORE_COLLECTION_GARMENTS.length} SILHOUETTES ·{" "}
                          {MINERAL_PALETTE.length} MINERAL COLORWAYS
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Layers className="h-3 w-3 shrink-0 text-[#666666]" />
                        <span>DROP 01 &amp; COMMUNITY WAITLIST ACCESS</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-zinc-200 pt-4 sm:mt-7 sm:pt-5">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => scrollToElement("core-studio")}
                  className="inline-flex min-h-[38px] cursor-pointer items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.16em] text-[#000000] uppercase transition-opacity hover:opacity-70"
                >
                  <span>RETURN TO CORE STUDIO</span>
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
