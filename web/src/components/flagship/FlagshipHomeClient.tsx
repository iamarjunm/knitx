"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import { useStorefrontConfig } from "@/context/StorefrontConfigContext";
import { computeCoreLaunchDate } from "@/lib/core-catalog";
import FlagshipIntroCurtain from "@/components/flagship/FlagshipIntroCurtain";
import {
  FLAGSHIP_MEDIA,
  cleanFlagshipText,
  formatDropEditionLabel,
  getFlagshipProductImage,
} from "@/lib/flagship-media";
import type { DropCampaign, Product } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";

type LookbookFilter = "all" | "revealed" | "veiled" | "one-of-one";

interface CountdownParts {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

const CORE_PALETTE_SWATCHES = [
  { id: "chalk-bone", name: "Chalk Bone", hex: "#F2EFE9", border: "#D4D0C8" },
  { id: "warm-sand", name: "Warm Sand", hex: "#C8BFA8", border: "#B7AE97" },
  { id: "mineral-slate", name: "Mineral Slate", hex: "#6E7378", border: "#6E7378" },
  { id: "deep-espresso", name: "Deep Espresso", hex: "#332924", border: "#332924" },
  { id: "washed-obsidian", name: "Washed Obsidian", hex: "#161618", border: "#161618" },
  { id: "sage-stone", name: "Sage Stone", hex: "#6D7469", border: "#6D7469" },
] as const;

const HARDCODED_COUNT_PATTERN =
  /\b(10\s*pieces|10\s*silhouettes|1[–-]4\s*units|3[–-]4\s*units|five\s*revealed|five\s*sealed|5\s*revealed|5\s*veiled)\b/i;

const UNBRANDED_CORE_PATTERN =
  /\b(unbranded|zero-logo|zero branding|blanks?)\b/i;

const CORE_DEFAULT_DESCRIPTION =
  "Heavyweight minimalist essentials in curated mineral colorways with subtle signature KNITX branding.";

function computeCountdown(targetIso: string): CountdownParts {
  const parsed = Date.parse(targetIso);
  const now = Date.now();
  const targetMs =
    Number.isFinite(parsed) && parsed > now
      ? parsed
      : now + 72 * 60 * 60 * 1000;
  const diffSec = Math.max(0, Math.floor((targetMs - now) / 1000));

  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    days: pad(days),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
  };
}

function formatReadableDate(iso: string): string {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(parsed))
    .toUpperCase();
}

export default function FlagshipHomeClient({
  drop,
  products,
  candidateCount,
}: {
  drop: DropCampaign;
  products: Product[];
  candidateCount: number;
}) {
  const { user, setAuthModalOpen } = useAuth();
  const { config } = useStorefrontConfig();
  const { waitlistPass, isVaultUnlocked, joinWaitlist } = useVault();

  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState<CountdownParts | null>(null);
  const [activeFilter, setActiveFilter] = useState<LookbookFilter>("all");
  const [activeCoreTone, setActiveCoreTone] = useState<
    (typeof CORE_PALETTE_SWATCHES)[number]
  >(CORE_PALETTE_SWATCHES[2]);

  // Waitlist state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  const effectiveLaunchDate = config.dropLaunchDate || drop.launchDate;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setCountdown(computeCountdown(effectiveLaunchDate));
    const timer = window.setInterval(() => {
      setCountdown(computeCountdown(effectiveLaunchDate));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mounted, effectiveLaunchDate]);

  useEffect(() => {
    if (mounted && user) {
      setFullName((prev) => prev || user.displayName || "");
      setEmail((prev) => prev || user.email || "");
    }
  }, [mounted, user]);

  const showUnlocked = mounted && isVaultUnlocked;
  const isDropLive =
    (mounted && config.dropPhase === "live") || drop.phase === "live";
  const canOpenDropProducts = showUnlocked || isDropLive;
  const showUser = mounted ? user : null;
  const showPass = mounted ? waitlistPass : null;
  const accentColor = config.accentColor || "#E11D2E";
  const gridColsClass =
    config.gridColumns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";

  const editionLabel = formatDropEditionLabel(
    config.activeDropNumber || drop.dropNumber
  );
  const heroTitle =
    config.heroTitleOverride?.trim() ||
    cleanFlagshipText(config.activeDropTitle || drop.title);

  const heroEyebrow =
    config.heroEyebrow?.trim() &&
    !HARDCODED_COUNT_PATTERN.test(config.heroEyebrow)
      ? config.heroEyebrow.trim()
      : `${products.length} PIECES · CURATED LIMITED-EDITION RUNS`;

  const heroSubtitle =
    config.heroSubtitle?.trim() &&
    !HARDCODED_COUNT_PATTERN.test(config.heroSubtitle)
      ? config.heroSubtitle.trim()
      : "Curated limited-edition runs cut to order with zero restocks.";

  const coreSubtitleText =
    config.coreSubtitle?.trim() &&
    !UNBRANDED_CORE_PATTERN.test(config.coreSubtitle)
      ? config.coreSubtitle.trim()
      : CORE_DEFAULT_DESCRIPTION;

  const coreLaunchLabel = useMemo(() => {
    if (!mounted) return "";
    const iso = computeCoreLaunchDate(
      effectiveLaunchDate,
      config.coreLaunchOffsetDays,
      config.coreLaunchDateOverride
    );
    return formatReadableDate(iso);
  }, [
    mounted,
    effectiveLaunchDate,
    config.coreLaunchOffsetDays,
    config.coreLaunchDateOverride,
  ]);

  const { revealedCount, veiledCount } = useMemo(() => {
    const revealed = products.filter((p) => !p.isMystery).length;
    return {
      revealedCount: revealed,
      veiledCount: Math.max(0, products.length - revealed),
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .map((product, index) => ({ product, index }))
      .filter(({ product }) => {
        if (activeFilter === "revealed") return !product.isMystery;
        if (activeFilter === "veiled") return product.isMystery;
        if (activeFilter === "one-of-one") return product.tier === "one-of-one";
        return true;
      });
  }, [products, activeFilter]);

  const handleWaitlistSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setWaitlistError(null);

    if (!fullName.trim() || !email.trim()) {
      setWaitlistError("Enter both your name and email address.");
      return;
    }

    setWaitlistSubmitting(true);
    try {
      await joinWaitlist(fullName, email);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not register right now.";
      setWaitlistError(cleanFlagshipText(msg));
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  const showCoCreation = config.showVoteSection || config.showSubmitSection;
  const coCreationCols =
    config.showVoteSection && config.showSubmitSection
      ? "md:grid-cols-2"
      : "md:grid-cols-1";

  const handleLockedProductClick = () => {
    const waitlistEl = document.getElementById("waitlist");
    if (waitlistEl) {
      waitlistEl.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setAuthModalOpen(true);
  };

  return (
    <div className="bg-white text-black">
      {/* Couture Runway Double-Shutter Opening Animation (plays once per session) */}
      <FlagshipIntroCurtain editionLabel={editionLabel} />

      {/* ===================================================================== */}
      {/* ACT 1: FULL-VIEWPORT 100SVH EDGE-TO-EDGE CAMPAIGN HERO                */}
      {/* ===================================================================== */}
      <section className="relative flex min-h-[100svh] w-full flex-col justify-end overflow-hidden bg-black pt-28 pb-9 sm:pt-32 sm:pb-14 lg:h-[100svh] lg:min-h-[680px]">
        <img
          src={FLAGSHIP_MEDIA.heroCampaign}
          alt={heroTitle}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Seamless Top & Bottom Cinematic Gradient Vignettes (Navbar melts into Hero) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/65 via-black/25 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"
        />

        {/* Bottom Flagship Overlay */}
        <div className="relative z-10 w-full">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 sm:gap-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <div className="inline-flex items-start gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-white/95 sm:items-center sm:gap-2.5 sm:text-[11px] sm:tracking-[0.2em]">
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: accentColor }}
                  className="mt-1 h-2 w-2 shrink-0 sm:mt-0"
                />
                <span>
                  {editionLabel} · {heroEyebrow}
                </span>
              </div>

              <h1 className="mt-3 font-poster text-[52px] leading-[0.88] tracking-[0.01em] text-white uppercase break-words sm:text-8xl sm:leading-[0.86] lg:text-[112px]">
                {heroTitle}
              </h1>

              {heroSubtitle ? (
                <p className="mt-3.5 max-w-xl text-sm leading-relaxed text-white/85 sm:mt-4 sm:text-base">
                  {heroSubtitle}
                </p>
              ) : null}

              <div className="mt-6 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                {canOpenDropProducts ? (
                  <Link
                    href="/drops"
                    className="inline-flex min-h-[46px] w-full items-center justify-center gap-2.5 bg-white px-6 py-3.5 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-black hover:text-white sm:w-auto sm:px-7"
                  >
                    <span>ENTER DROP</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <a
                    href="#waitlist"
                    className="inline-flex min-h-[46px] w-full items-center justify-center gap-2.5 bg-white px-6 py-3.5 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-black hover:text-white sm:w-auto sm:px-7"
                  >
                    <span>{config.heroCtaPrimary || "JOIN WAITLIST"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}

                <Link
                  href="/drops"
                  className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 border border-white/85 bg-black/25 px-6 py-3.5 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-black sm:w-auto sm:px-7"
                >
                  <span>{config.heroCtaSecondary || "EXPLORE DROPS"}</span>
                </Link>
              </div>
            </div>

            {/* Minimalist Right-Aligned Tabular Countdown */}
            <div className="flex flex-col items-start lg:items-end">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-white/75">
                NEXT DROP WINDOW
              </span>
              <div
                aria-label="Countdown to next drop window"
                className="mt-1.5 font-mono text-xl font-semibold tracking-[0.1em] text-white tabular-nums sm:mt-2 sm:text-3xl sm:tracking-[0.12em]"
              >
                {countdown
                  ? `${countdown.days} : ${countdown.hours} : ${countdown.minutes} : ${countdown.seconds}`
                  : "-- : -- : -- : --"}
              </div>
              <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.24em] text-white/60">
                DD · HH · MM · SS
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* ACT 2: PURE-WHITE SSENSE / BLUORNG CURRENT DROP LOOKBOOK GRID         */}
      {/* ===================================================================== */}
      <section className="bg-white py-12 sm:py-20">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
          {/* Clean Top Bar */}
          <div className="mb-6 flex flex-col gap-4 border-b border-black/10 pb-4 sm:mb-8 sm:pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-syne text-xl font-extrabold uppercase tracking-[-0.01em] text-black sm:text-2xl">
                  CURRENT DROP
                </h2>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#666666] sm:text-xs">
                  {!showUnlocked && veiledCount > 0
                    ? `(${products.length} PIECES · ${revealedCount} PREVIEWED · ${veiledCount} VEILED)`
                    : `(${products.length} PIECES)`}
                </span>
              </div>

              <Link
                href="/drops"
                className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-opacity hover:opacity-65 lg:hidden"
              >
                <span>VIEW ALL</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="no-scrollbar -mx-4 flex flex-nowrap items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:gap-2.5 sm:px-0">
              {(
                [
                  { id: "all", label: "ALL" },
                  { id: "revealed", label: "PREVIEWED" },
                  { id: "veiled", label: "VEILED" },
                  { id: "one-of-one", label: "1 OF 1" },
                ] as const
              ).map((tab) => {
                const isSelected = activeFilter === tab.id;
                return (
                  <button
                    suppressHydrationWarning
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id)}
                    className={cn(
                      "min-h-[36px] shrink-0 cursor-pointer whitespace-nowrap px-3.5 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.16em] transition-colors",
                      isSelected
                        ? "bg-black text-white"
                        : "bg-[#F4F4F5] text-[#666666] hover:bg-neutral-200 hover:text-black"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}

              <Link
                href="/drops"
                className="ml-1 hidden shrink-0 items-center gap-1.5 whitespace-nowrap font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-opacity hover:opacity-65 lg:inline-flex"
              >
                <span>VIEW ALL</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Edge-to-Edge Studio Lookbook Grid (3 or 4 columns per Admin Config) */}
          <div
            className={cn(
              "grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-12",
              gridColsClass
            )}
          >
            {filteredProducts.map(({ product, index }) => {
              const isVeiled = product.isMystery && !canOpenDropProducts;
              const imgSrc = getFlagshipProductImage(
                product,
                index,
                canOpenDropProducts
              );
              const displayName = isVeiled
                ? `VEILED SILHOUETTE ${String(index + 1).padStart(2, "0")}`
                : cleanFlagshipText(product.title);

              const cardVisual = (
                <>
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F4F4F5]">
                    <img
                      src={imgSrc}
                      alt={displayName}
                      className={cn(
                        "h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]",
                        isVeiled ? "brightness-90 contrast-105" : ""
                      )}
                    />

                    {/* Minimal Corner Marker */}
                    {product.tier === "one-of-one" && !isVeiled ? (
                      <span
                        style={{ backgroundColor: accentColor }}
                        className="absolute top-2 left-2 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white sm:top-3 sm:left-3 sm:px-2 sm:tracking-[0.16em]"
                      >
                        1 OF 1
                      </span>
                    ) : isVeiled ? (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-black/85 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-white sm:top-3 sm:left-3 sm:px-2 sm:tracking-[0.16em]">
                        <Lock className="h-2.5 w-2.5" />
                        <span>VEILED</span>
                      </span>
                    ) : null}

                    {/* Preview-Only Lock Badge when Drop Access is Required */}
                    {!canOpenDropProducts && !isVeiled ? (
                      <span className="absolute top-2 right-2 inline-flex items-center gap-1 bg-white/92 px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-black backdrop-blur-xs sm:top-3 sm:right-3 sm:px-2 sm:text-[9px] sm:tracking-[0.14em]">
                        <Lock className="h-2.5 w-2.5" />
                        <span>PREVIEW</span>
                      </span>
                    ) : null}

                    {/* Desktop Bottom Hover Strip */}
                    <div className="absolute inset-x-0 bottom-0 hidden translate-y-full bg-black/90 px-3 py-2.5 text-center font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-white transition-transform duration-200 group-hover:translate-y-0 sm:block">
                      {canOpenDropProducts
                        ? "VIEW PRODUCT"
                        : isVeiled
                          ? "PRIVATE ACCESS REQUIRED"
                          : "DROP ACCESS REQUIRED · JOIN WAITLIST"}
                    </div>
                  </div>

                  {/* Ultra-Clean 2-Line Caption */}
                  <div className="mt-2.5 space-y-1 sm:mt-3">
                    <h3 className="truncate font-sans text-[11px] font-semibold uppercase tracking-[0.03em] text-black sm:text-xs sm:tracking-[0.04em]">
                      {displayName}
                    </h3>
                    <div className="flex items-center justify-between gap-1.5 font-mono text-[10px] text-[#666666] sm:gap-2 sm:text-[11px]">
                      <span className="shrink-0 font-medium text-black tabular-nums">
                        {isVeiled ? "PRIVATE" : formatInr(product.priceInr)}
                      </span>
                      {product.tier === "one-of-one" ? (
                        <span
                          style={{ color: accentColor }}
                          className="shrink-0 whitespace-nowrap font-semibold"
                        >
                          1 OF 1
                        </span>
                      ) : (
                        <span className="shrink-0 whitespace-nowrap">
                          {product.totalUnits} UNITS
                        </span>
                      )}
                    </div>
                  </div>
                </>
              );

              return (
                <article key={product._id} className="group flex flex-col">
                  {canOpenDropProducts ? (
                    <Link
                      href={`/product/${product.slug}`}
                      className="flex flex-col text-left focus:outline-none"
                    >
                      {cardVisual}
                    </Link>
                  ) : (
                    <button
                      suppressHydrationWarning
                      type="button"
                      onClick={handleLockedProductClick}
                      aria-label={`${displayName} — drop access required`}
                      className="flex w-full cursor-pointer flex-col text-left focus:outline-none"
                    >
                      {cardVisual}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* ACT 3: KNITX CORE — ESSENTIAL WARDROBE EDITORIAL FEATURE              */}
      {/* ===================================================================== */}
      {config.coreEnabled ? (
        <section className="border-y border-black/10 bg-[#F4F4F5] py-12 sm:py-24">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
            <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
              {/* Left (5 cols): Editorial Copy, Interactive Mineral Swatches & CTA */}
              <div className="flex flex-col lg:col-span-5">
                <div className="inline-flex items-start gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#666666] sm:items-center sm:tracking-[0.2em]">
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: accentColor }}
                    className="mt-1 h-1.5 w-1.5 shrink-0 sm:mt-0"
                  />
                  <span>
                    RELEASING {config.coreLaunchOffsetDays} DAYS AFTER DROP 01 ·
                    COMMUNITY ACCESS
                  </span>
                </div>

                <h2 className="mt-3.5 font-syne text-3xl leading-[0.95] font-extrabold uppercase tracking-[-0.025em] text-black break-words sm:mt-4 sm:text-5xl sm:leading-[0.94]">
                  {config.coreTitle}
                </h2>

                <p className="mt-3.5 text-sm leading-relaxed text-[#666666] sm:mt-4 sm:text-[15px]">
                  {coreSubtitleText}
                </p>

                {/* Interactive Mineral Colorway Swatch Selector */}
                <div className="mt-6 border-y border-black/10 py-4 sm:mt-7 sm:py-5">
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em]">
                    <span className="text-[#666666]">MINERAL PALETTE</span>
                    <span className="font-semibold text-black">
                      {activeCoreTone.name.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-3.5 flex flex-wrap items-center gap-2.5 sm:gap-3">
                    {CORE_PALETTE_SWATCHES.map((tone) => {
                      const isSelected = activeCoreTone.id === tone.id;
                      return (
                        <button
                          suppressHydrationWarning
                          key={tone.id}
                          type="button"
                          onMouseEnter={() => setActiveCoreTone(tone)}
                          onClick={() => setActiveCoreTone(tone)}
                          aria-label={`Select ${tone.name} tone`}
                          title={tone.name}
                          className={cn(
                            "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border transition-transform duration-200 hover:scale-105 sm:h-9 sm:w-9",
                            isSelected
                              ? "border-black ring-2 ring-black/15"
                              : "border-transparent"
                          )}
                        >
                          <span
                            style={{
                              backgroundColor: tone.hex,
                              borderColor: tone.border,
                            }}
                            className="h-6 w-6 rounded-full border"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Community Access Badge */}
                <div className="mt-5 border border-black/10 bg-white px-4 py-3.5 sm:mt-6">
                  <div className="flex items-start gap-2.5">
                    <span
                      aria-hidden="true"
                      style={{ backgroundColor: accentColor }}
                      className="mt-1.5 h-2 w-2 shrink-0"
                    />
                    <div className="space-y-1">
                      <p className="font-sans text-xs font-semibold text-black">
                        Included automatically once your account receives drop
                        access
                      </p>
                      <p className="font-mono text-[10px] leading-relaxed uppercase tracking-[0.14em] text-[#666666] sm:tracking-[0.16em]">
                        SUBTLE SIGNATURE KNITX BRANDING · 320–480 GSM
                        {coreLaunchLabel ? ` · OPENS ${coreLaunchLabel}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-7">
                  <Link
                    href="/core"
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2.5 bg-black px-7 py-4 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-85 sm:w-auto"
                  >
                    <span>EXPLORE CORE WARDROBE</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Right (7 cols): Asymmetric Studio Editorial Photo Spread */}
              <div className="grid grid-cols-12 gap-2.5 sm:gap-4 lg:col-span-7">
                <Link
                  href="/core"
                  className="group relative col-span-7 overflow-hidden bg-white"
                >
                  <div className="aspect-[4/5] w-full overflow-hidden">
                    <img
                      src={FLAGSHIP_MEDIA.coreCampaignDuo}
                      alt="KNITX Core Essential Wardrobe editorial duo"
                      className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="absolute bottom-2 left-2 bg-white/95 px-2 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-black backdrop-blur-sm sm:bottom-3 sm:left-3 sm:px-2.5 sm:py-1 sm:text-[9px] sm:tracking-[0.18em]">
                    CORE 01 · CAMPAIGN
                  </div>
                </Link>

                <div className="col-span-5 flex flex-col gap-2.5 sm:gap-4">
                  <Link
                    href="/core"
                    className="group relative flex-1 overflow-hidden bg-white"
                  >
                    <div className="aspect-[4/4] h-full w-full overflow-hidden">
                      <img
                        src={FLAGSHIP_MEDIA.coreColorwaysStack}
                        alt="KNITX Core heavyweight mineral colorways stack"
                        className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-white/95 px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-black sm:bottom-2.5 sm:left-2.5 sm:px-2 sm:text-[9px] sm:tracking-[0.16em]">
                      {CORE_PALETTE_SWATCHES.length} TONES
                    </div>
                  </Link>

                  <Link
                    href="/core"
                    className="group relative flex-1 overflow-hidden bg-white"
                  >
                    <div className="aspect-[4/3] h-full w-full overflow-hidden">
                      <img
                        src={FLAGSHIP_MEDIA.coreHoodieSlate}
                        alt="KNITX Core 460GSM boxy hoodie in Mineral Slate"
                        className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/85 px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-white sm:bottom-2.5 sm:left-2.5 sm:px-2 sm:text-[9px] sm:tracking-[0.16em]">
                      460 GSM
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ===================================================================== */}
      {/* ACT 4: FULL-BLEED 50/50 EDITORIAL CAMPAIGN DIPTYCH                    */}
      {/* ===================================================================== */}
      <section className="grid grid-cols-1 gap-[2px] bg-white md:grid-cols-2">
        {/* Left: ONE OF ONE */}
        <Link
          href="/drops"
          className="group relative flex min-h-[48svh] w-full items-end overflow-hidden bg-black sm:min-h-[68vh]"
        >
          <img
            src={FLAGSHIP_MEDIA.dropBomberStudio}
            alt="KNITX One of One Archival Bomber"
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"
          />
          <div className="relative z-10 w-full p-5 sm:p-10 lg:p-12">
            <span
              style={{ backgroundColor: accentColor }}
              className="inline-block px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white"
            >
              COLLECTOR TIER
            </span>
            <h2 className="mt-3 font-poster text-4xl leading-[0.88] tracking-[0.01em] text-white uppercase break-words sm:text-6xl lg:text-7xl">
              ONE OF ONE
            </h2>
            <p className="mt-2.5 max-w-sm text-sm text-white/80">
              Only one exists worldwide. Individually cut and never remade.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-white underline underline-offset-4 transition-opacity group-hover:opacity-75 sm:mt-5">
              <span>EXPLORE 1-OF-1S</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>

        {/* Right: SMALL BATCH */}
        <Link
          href="/drops"
          className="group relative flex min-h-[48svh] w-full items-end overflow-hidden bg-black sm:min-h-[68vh]"
        >
          <img
            src={FLAGSHIP_MEDIA.chainStitchTee}
            alt="KNITX Small Batch Numbered Garment"
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"
          />
          <div className="relative z-10 w-full p-5 sm:p-10 lg:p-12">
            <span className="inline-block border border-white/55 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
              NUMBERED EDITION
            </span>
            <h2 className="mt-3 font-poster text-4xl leading-[0.88] tracking-[0.01em] text-white uppercase break-words sm:text-6xl lg:text-7xl">
              SMALL BATCH
            </h2>
            <p className="mt-2.5 max-w-sm text-sm text-white/80">
              Curated limited-batch quantities. Heavyweight Indian cotton.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-white underline underline-offset-4 transition-opacity group-hover:opacity-75 sm:mt-5">
              <span>EXPLORE SMALL BATCH</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>
      </section>

      {/* ===================================================================== */}
      {/* ACT 5: ARCHITECTURAL ATELIER BAND                                     */}
      {/* ===================================================================== */}
      {config.showAtelierSection ? (
        <section className="bg-white py-12 sm:py-24">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
            <div className="flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#666666]">
                  THE KNITX ATELIER STANDARD
                </span>
                <h2 className="mt-3 max-w-4xl font-syne text-3xl leading-[0.98] font-extrabold tracking-[-0.02em] text-black uppercase break-words sm:text-5xl lg:text-6xl">
                  ONE SAMPLE SHOT. CUT ONLY WHEN CLAIMED.
                </h2>
              </div>

              <Link
                href="/atelier"
                className="inline-flex min-h-[46px] w-full shrink-0 items-center justify-center gap-2 border border-black px-6 py-3.5 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-black hover:text-white sm:w-auto"
              >
                <span>INSIDE THE ATELIER</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Sunlit Wide 21:9 Atelier Photograph (16:10 on Mobile) */}
            <div className="mt-7 aspect-[16/10] w-full overflow-hidden bg-[#F4F4F5] sm:mt-12 sm:aspect-[21/9]">
              <img
                src={FLAGSHIP_MEDIA.atelierSunlit}
                alt="KNITX Sunlit Pattern Cutting Atelier"
                className="h-full w-full object-cover object-center"
              />
            </div>

            {/* 3 Razor-Clean Metric Columns */}
            <div className="mt-7 grid grid-cols-1 gap-6 border-t border-black/15 pt-7 sm:mt-10 sm:grid-cols-3 sm:gap-8 sm:pt-8">
              <div>
                <p className="font-poster text-4xl tracking-[0.02em] text-black uppercase sm:text-5xl">
                  0% DEADSTOCK
                </p>
                <p className="mt-2 text-sm text-[#666666]">
                  Zero overproduction. Every garment is cut after it is claimed.
                </p>
              </div>
              <div>
                <p className="font-poster text-4xl tracking-[0.02em] text-black uppercase sm:text-5xl">
                  LIMITED BATCHES
                </p>
                <p className="mt-2 text-sm text-[#666666]">
                  Curated quantities per drop. Patterns retire permanently on
                  sellout.
                </p>
              </div>
              <div>
                <p className="font-poster text-4xl tracking-[0.02em] text-black uppercase sm:text-5xl">
                  310–520 GSM
                </p>
                <p className="mt-2 text-sm text-[#666666]">
                  Heavyweight Indian cotton jersey, double-weave twill, and
                  hand-finished knits.
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ===================================================================== */}
      {/* ACT 6: ULTRA-CLEAN HORIZONTAL COMMUNITY WAITLIST & ACCOUNT DESK       */}
      {/* ===================================================================== */}
      <section
        id="waitlist"
        className="scroll-mt-24 border-y border-black/10 bg-[#F4F4F5] py-12 sm:py-24"
      >
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
          <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-12 lg:items-center">
            {/* Left Copy */}
            <div className="lg:col-span-5">
              <span
                style={{ color: accentColor }}
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em]"
              >
                {editionLabel} · COMMUNITY WAITLIST &amp; ACCOUNT ACCESS
              </span>
              <h2 className="mt-2 font-syne text-3xl font-extrabold uppercase tracking-[-0.02em] text-black break-words sm:text-4xl">
                JOIN THE WAITLIST.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[#666666]">
                One waitlist for everything — account-based access for limited
                drops plus automatic entry to KNITX CORE with zero access codes.
              </p>
            </div>

            {/* Right Interactive Waitlist Form or Serial Queue Pass */}
            <div className="lg:col-span-7">
              {mounted && showPass ? (
                <div className="flex flex-col justify-between gap-6 bg-black p-5 text-white sm:flex-row sm:items-center sm:p-8">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
                      <Check
                        style={{ color: accentColor }}
                        className="h-3.5 w-3.5 shrink-0"
                      />
                      <span>SERIAL QUEUE PASS CONFIRMED</span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
                      <span className="font-poster text-4xl tracking-[0.04em] text-white sm:text-5xl">
                        #{String(showPass.position).padStart(4, "0")}
                      </span>
                      <span className="font-sans text-sm font-semibold uppercase tracking-[0.08em] text-white/90">
                        {showPass.name}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] leading-relaxed uppercase tracking-[0.14em] text-white/60 sm:text-[11px] sm:tracking-[0.16em]">
                      ACCOUNT-LINKED ACCESS · UNLOCKS AUTOMATICALLY WHEN GRANTED
                    </p>
                  </div>

                  <div className="flex w-full shrink-0 flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                    <Link
                      href="/drops"
                      className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 bg-white px-5 py-3.5 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-opacity hover:opacity-85 sm:w-auto"
                    >
                      <span>ENTER DROPS</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    {config.coreEnabled ? (
                      <Link
                        href="/core"
                        className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 border border-white/40 px-5 py-3.5 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:border-white hover:bg-white hover:text-black sm:w-auto"
                      >
                        <span>ENTER CORE</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleWaitlistSubmit}
                  className="flex flex-col gap-3 sm:flex-row"
                >
                  <input
                    suppressHydrationWarning
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="FULL NAME"
                    aria-label="Full name"
                    className="h-12 flex-1 border border-black/25 bg-white px-4 font-sans text-base font-medium tracking-[0.04em] text-black placeholder:text-xs placeholder:tracking-[0.08em] placeholder:text-neutral-400 focus:border-black focus:outline-none sm:text-sm sm:tracking-[0.06em]"
                  />
                  <input
                    suppressHydrationWarning
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="EMAIL ADDRESS"
                    aria-label="Email address"
                    className="h-12 flex-1 border border-black/25 bg-white px-4 font-sans text-base font-medium tracking-[0.04em] text-black placeholder:text-xs placeholder:tracking-[0.08em] placeholder:text-neutral-400 focus:border-black focus:outline-none sm:text-sm sm:tracking-[0.06em]"
                  />
                  <button
                    suppressHydrationWarning
                    type="submit"
                    disabled={waitlistSubmitting}
                    className="h-12 w-full shrink-0 cursor-pointer bg-black px-8 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-85 disabled:opacity-60 sm:w-auto"
                  >
                    {waitlistSubmitting ? "JOINING..." : "JOIN"}
                  </button>
                </form>
              )}

              {waitlistError ? (
                <p
                  style={{ color: accentColor }}
                  className="mt-2.5 font-mono text-[11px]"
                >
                  {waitlistError}
                </p>
              ) : null}

              {/* Clean Account-Based Access Check */}
              <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#666666]">
                {showUser ? (
                  <>
                    <span className="break-all">
                      Signed in as{" "}
                      <strong className="font-semibold text-black">
                        {showUser.email}
                      </strong>
                      .
                    </span>
                    <Link
                      href="/drops"
                      className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-black underline underline-offset-4 transition-opacity hover:opacity-70"
                    >
                      {showUnlocked
                        ? "Enter unlocked drop →"
                        : "Check account access →"}
                    </Link>
                  </>
                ) : (
                  <>
                    <span>Already granted access?</span>
                    <button
                      suppressHydrationWarning
                      type="button"
                      onClick={() => setAuthModalOpen(true)}
                      className="cursor-pointer font-sans text-xs font-semibold uppercase tracking-[0.14em] text-black underline underline-offset-4 transition-opacity hover:opacity-70"
                    >
                      Sign in to your account
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* ACT 7: FULL-BLEED 50/50 COMMUNITY CO-CREATION + EDITIONS ARCHIVE BAR  */}
      {/* ===================================================================== */}
      <section className="bg-white">
        {showCoCreation ? (
          <div className={cn("grid grid-cols-1 gap-[2px] bg-white", coCreationCols)}>
            {config.showVoteSection ? (
              <Link
                href="/vote"
                className="group relative flex min-h-[44svh] w-full items-end overflow-hidden bg-black sm:min-h-[52vh]"
              >
                <img
                  src={FLAGSHIP_MEDIA.knit1of1}
                  alt="Vote on upcoming KNITX drop silhouettes"
                  className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/15"
                />
                <div className="relative z-10 w-full p-5 sm:p-10">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75 sm:tracking-[0.2em]">
                    COMMUNITY BALLOT · {candidateCount} SHORTLISTED CONCEPTS
                  </span>
                  <h2 className="mt-2 font-poster text-4xl leading-[0.9] text-white uppercase break-words sm:text-5xl">
                    VOTE NEXT DROP
                  </h2>
                  <span className="mt-4 inline-flex items-center gap-2 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-white underline underline-offset-4 transition-opacity group-hover:opacity-75">
                    <span>CAST YOUR VOTE</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ) : null}

            {config.showSubmitSection ? (
              <Link
                href="/submit"
                className="group relative flex min-h-[44svh] w-full items-end overflow-hidden bg-black sm:min-h-[52vh]"
              >
                <img
                  src={FLAGSHIP_MEDIA.mysterySilhouette}
                  alt="Submit an original silhouette to KNITX"
                  className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/15"
                />
                <div className="relative z-10 w-full p-5 sm:p-10">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75 sm:tracking-[0.2em]">
                    OPEN CREATOR BRIEF · CREDITED BY NAME
                  </span>
                  <h2 className="mt-2 font-poster text-4xl leading-[0.9] text-white uppercase break-words sm:text-5xl">
                    SUBMIT YOUR DESIGN
                  </h2>
                  <span className="mt-4 inline-flex items-center gap-2 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-white underline underline-offset-4 transition-opacity group-hover:opacity-75">
                    <span>OPEN SUBMISSION</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ) : null}
          </div>
        ) : null}

        {/* Jet-Black Editions Archive Bar */}
        <Link
          href="/archive"
          className="group flex items-center justify-between gap-3 bg-black px-4 py-5 text-white transition-colors hover:bg-[#111111] sm:px-8 sm:py-6"
        >
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <span
              aria-hidden="true"
              style={{ backgroundColor: accentColor }}
              className="h-2 w-2 shrink-0"
            />
            <span className="truncate font-syne text-xs font-extrabold uppercase tracking-[0.12em] sm:text-base sm:tracking-[0.14em]">
              {editionLabel} &amp; EDITIONS ARCHIVE
            </span>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.16em] text-white/80 transition-colors group-hover:text-white sm:gap-2 sm:text-[11px] sm:tracking-[0.18em]">
            <span>VIEW ARCHIVE</span>
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </section>
    </div>
  );
}
