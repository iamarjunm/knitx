"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Lock,
  Minus,
  Plus,
  Ruler,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStorefrontConfig } from "@/context/StorefrontConfigContext";
import { useVault } from "@/context/VaultContext";
import {
  computeCoreLaunchDate,
  coreGarmentToProduct,
  type CoreGarment,
  type CoreSwatch,
} from "@/lib/core-catalog";
import {
  FLAGSHIP_MEDIA,
  cleanFlagshipText,
  formatDropEditionLabel,
} from "@/lib/flagship-media";
import type { DropCampaign } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";

interface FlagshipCoreProductClientProps {
  garment: CoreGarment;
  drop: DropCampaign;
  initialColor?: string;
  relatedGarments: CoreGarment[];
}

interface CoreGalleryPlate {
  id: string;
  src: string;
  alt: string;
  caption: string;
}

type CoreSpecSectionId = "craftsmanship" | "fabric" | "dispatch";

const CORE_TOP_MEASUREMENTS = [
  { size: "S", chest: '44"', length: '26.5"', shoulder: '21.0"', sleeve: '23.0"' },
  { size: "M", chest: '46"', length: '27.5"', shoulder: '22.0"', sleeve: '23.5"' },
  { size: "L", chest: '48"', length: '28.5"', shoulder: '23.0"', sleeve: '24.0"' },
  { size: "XL", chest: '51"', length: '29.5"', shoulder: '24.0"', sleeve: '24.5"' },
] as const;

const CORE_TROUSER_MEASUREMENTS = [
  { size: "S", waist: '28–30"', hip: '42"', rise: '13.0"', inseam: '30.5"' },
  { size: "M", waist: '30–32"', hip: '44"', rise: '13.5"', inseam: '31.0"' },
  { size: "L", waist: '32–34"', hip: '46"', rise: '14.0"', inseam: '31.5"' },
  { size: "XL", waist: '34–36"', hip: '48"', rise: '14.5"', inseam: '32.0"' },
] as const;

function resolveInitialSwatchId(
  garment: CoreGarment,
  initialColor?: string
): string {
  if (initialColor) {
    const normalized = initialColor.trim().toLowerCase();
    const matched = garment.swatches.find(
      (swatch) =>
        swatch.id.toLowerCase() === normalized ||
        swatch.name.toLowerCase() === normalized
    );
    if (matched) return matched.id;
  }
  return garment.defaultSwatchId;
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

export default function FlagshipCoreProductClient({
  garment,
  drop,
  initialColor,
  relatedGarments,
}: FlagshipCoreProductClientProps) {
  const { config } = useStorefrontConfig();
  const { user, setAuthModalOpen } = useAuth();
  const { isVaultUnlocked, waitlistPass, addToCart } = useVault();

  const [mounted, setMounted] = useState(false);
  const [activeSwatchId, setActiveSwatchId] = useState<string>(() =>
    resolveInitialSwatchId(garment, initialColor)
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    garment.sizes.includes("L") ? "L" : garment.sizes[0] || "M"
  );
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [openSpec, setOpenSpec] = useState<CoreSpecSectionId | null>(
    "craftsmanship"
  );
  const [activeMobileSlide, setActiveMobileSlide] = useState(0);
  const [bagNotice, setBagNotice] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setActiveSwatchId(resolveInitialSwatchId(garment, initialColor));
    setSelectedSize(
      garment.sizes.includes("L") ? "L" : garment.sizes[0] || "M"
    );
    setActiveMobileSlide(0);
    setBagNotice(null);
    setJustAdded(false);
  }, [garment, initialColor]);

  const accentColor = mounted ? config.accentColor || "#E11D2E" : "#E11D2E";
  const effectiveAccessMode = mounted ? config.coreAccessMode : "community";
  const safeUser = mounted ? user : null;
  const safeWaitlistPass = mounted ? waitlistPass : null;
  const safeDropAdmitted = mounted && isVaultUnlocked;

  const editionLabel = formatDropEditionLabel(
    (mounted && config.activeDropNumber) || drop.dropNumber
  );
  const offsetDays = mounted ? config.coreLaunchOffsetDays : 14;
  const effectiveDropLaunchIso =
    (mounted && config.dropLaunchDate) || drop.launchDate;
  const effectiveCoreOverride = mounted ? config.coreLaunchDateOverride : "";

  const coreLaunchLabel = useMemo(() => {
    const iso = computeCoreLaunchDate(
      effectiveDropLaunchIso,
      offsetDays,
      effectiveCoreOverride
    );
    return formatUtcReleaseDate(iso);
  }, [effectiveDropLaunchIso, offsetDays, effectiveCoreOverride]);

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

  const activeSwatch: CoreSwatch = useMemo(
    () =>
      garment.swatches.find((swatch) => swatch.id === activeSwatchId) ||
      garment.swatches[0],
    [garment.swatches, activeSwatchId]
  );

  const galleryPlates = useMemo<CoreGalleryPlate[]>(() => {
    const plates: CoreGalleryPlate[] = [
      {
        id: `active-${activeSwatch.id}`,
        src: activeSwatch.imageUrl,
        alt: `${garment.title} in ${activeSwatch.name}`,
        caption: `01 · ${activeSwatch.name.toUpperCase()} · ${garment.gsmWeight}`,
      },
    ];

    const secondaryCandidates: CoreGalleryPlate[] = [
      {
        id: "core-stack",
        src: FLAGSHIP_MEDIA.coreColorwaysStack,
        alt: "KNITX CORE mineral-dyed heavyweight cotton palette stack",
        caption: "02 · CURATED MINERAL DYE PALETTE",
      },
      {
        id: "core-duo",
        src: FLAGSHIP_MEDIA.coreCampaignDuo,
        alt: "KNITX CORE campaign editorial silhouette study",
        caption: "03 · CORE CAMPAIGN PROPORTION STUDY",
      },
      {
        id: "core-hoodie-detail",
        src: FLAGSHIP_MEDIA.coreHoodieSlate,
        alt: "KNITX CORE heavyweight knit structure in daylight",
        caption: "04 · HEAVYWEIGHT KNIT ARCHITECTURE",
      },
    ];

    const usedUrls = new Set<string>([activeSwatch.imageUrl]);
    for (const candidate of secondaryCandidates) {
      if (plates.length >= 3) break;
      if (!usedUrls.has(candidate.src)) {
        usedUrls.add(candidate.src);
        plates.push(candidate);
      }
    }

    return plates;
  }, [activeSwatch.id, activeSwatch.imageUrl, activeSwatch.name, garment.title, garment.gsmWeight]);

  const currentMobilePlate =
    galleryPlates[activeMobileSlide] || galleryPlates[0];

  const handleSelectSwatch = (swatchId: string) => {
    setActiveSwatchId(swatchId);
    setActiveMobileSlide(0);
    setBagNotice(null);
  };

  const handleAddToBag = () => {
    if (!hasCoreAccess || !garment.inStock) return;
    setBagNotice(null);
    const productPayload = coreGarmentToProduct(garment, activeSwatch);
    const result = addToCart(productPayload, selectedSize);
    if (!result.ok) {
      setBagNotice(
        cleanFlagshipText(
          result.message || "Unable to add this piece to your bag right now."
        )
      );
      return;
    }
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2200);
  };

  const toggleSpec = (id: CoreSpecSectionId) => {
    setOpenSpec((prev) => (prev === id ? null : id));
  };

  const accessBadgeLabel = useMemo(() => {
    if (!mounted) return "COMMUNITY ACCESS";
    if (effectiveAccessMode === "open") return "OPEN CORE RELEASE";
    if (safeWaitlistPass) {
      return `COMMUNITY PASS #${String(safeWaitlistPass.position).padStart(4, "0")}`;
    }
    if (safeDropAdmitted) return "DROP 01 ADMISSION ACTIVE";
    if (safeUser) return "MEMBER ACCOUNT ACTIVE";
    return "COMMUNITY ACCESS";
  }, [
    mounted,
    effectiveAccessMode,
    safeWaitlistPass,
    safeDropAdmitted,
    safeUser,
  ]);

  const isTrouser = garment.category === "Trouser";

  // =========================================================================
  // HARD CORE PRODUCT LOCK: BLOCK CORE PDP UNTIL COMMUNITY ACCESS OR OPEN
  // =========================================================================
  if (!hasCoreAccess) {
    return (
      <section className="flex min-h-[calc(100svh-3.75rem)] flex-col justify-center bg-[#FFFFFF] px-4 py-12 text-[#000000] sm:px-8 sm:py-20">
        <div className="mx-auto w-full max-w-2xl text-center">
          <div className="inline-flex items-center justify-center gap-2 font-mono text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase">
            <span
              aria-hidden="true"
              style={{ backgroundColor: accentColor }}
              className="h-2 w-2 shrink-0"
            />
            <span>KNITX CORE · COMMUNITY ACCESS REQUIRED</span>
          </div>

          <h1 className="mt-4 font-poster text-4xl leading-[0.9] tracking-[0.01em] text-[#000000] uppercase sm:text-6xl">
            CORE PRODUCT PAGE LOCKED
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#666666]">
            Explore all KNITX CORE silhouettes and mineral colorways on the Core
            studio grid. Individual product pages open exclusively to Drop 1
            admitted accounts and community waitlist members — no access code
            required.
          </p>

          <div className="mx-auto mt-5 inline-flex items-center gap-2 border border-black/15 bg-[#F4F4F5] px-3.5 py-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#000000] uppercase">
            <Lock className="h-3 w-3" />
            <span>
              OPENS {offsetDays} DAYS POST-{editionLabel} · {coreLaunchLabel}
            </span>
          </div>

          <div className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row">
            {!safeUser ? (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex min-h-[48px] flex-1 cursor-pointer items-center justify-center gap-2 bg-[#000000] px-6 py-3.5 font-mono text-[11px] font-bold tracking-[0.16em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85"
              >
                <span>SIGN IN WITH ACCOUNT</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : null}

            <Link
              href="/core#core-access"
              className={cn(
                "inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 border border-[#000000] px-6 py-3.5 font-mono text-[11px] font-bold tracking-[0.16em] uppercase transition-colors",
                safeUser
                  ? "bg-[#000000] text-[#FFFFFF] hover:opacity-85"
                  : "bg-[#FFFFFF] text-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF]"
              )}
            >
              <span>JOIN COMMUNITY WAITLIST</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase">
            <Link
              href="/core"
              className="transition-colors hover:text-[#000000]"
            >
              BACK TO CORE STUDIO
            </Link>
            {safeUser ? (
              <>
                <span aria-hidden="true" className="text-black/20">
                  ·
                </span>
                <Link
                  href="/profile"
                  className="transition-colors hover:text-[#000000]"
                >
                  VIEW MY PROFILE
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-[#FFFFFF] pb-24 text-[#000000] lg:pb-0">
      {/* ================================================================= */}
      {/* ARCHITECTURAL BREADCRUMB STRIP                                    */}
      {/* ================================================================= */}
      <div className="border-b border-black/10 bg-[#FFFFFF]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3.5 sm:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-[#666666] uppercase"
          >
            <Link
              href="/"
              className="shrink-0 transition-colors hover:text-[#000000]"
            >
              HOME
            </Link>
            <span aria-hidden="true" className="text-black/25">
              /
            </span>
            <Link
              href="/core"
              className="shrink-0 transition-colors hover:text-[#000000]"
            >
              CORE
            </Link>
            <span aria-hidden="true" className="text-black/25">
              /
            </span>
            <span className="truncate font-semibold text-[#000000]">
              {garment.title}
            </span>
          </nav>

          <span className="hidden shrink-0 font-mono text-[10px] tracking-[0.18em] text-[#666666] uppercase sm:inline-block">
            {garment.serialCode} · {garment.gsmWeight}
          </span>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 12-COLUMN SPLIT ARCHITECTURAL CORE PDP                            */}
      {/* ================================================================= */}
      <section className="mx-auto max-w-[1600px] px-4 pt-6 pb-20 sm:px-8 sm:pt-10 sm:pb-28">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          {/* LEFT (7 COLS): BRIGHT GALLERY STUDIO PHOTOGRAPHY STACK */}
          <div className="lg:col-span-7">
            {/* Mobile Gallery: Primary Frame + Thumbnail Strip */}
            <div className="lg:hidden">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F4F4F5]">
                <Image
                  src={currentMobilePlate.src}
                  alt={currentMobilePlate.alt}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover object-center transition-all duration-500"
                />
                <div className="pointer-events-none absolute top-3.5 left-3.5 bg-white/92 px-2.5 py-1 font-mono text-[9px] font-semibold tracking-[0.18em] text-[#000000] uppercase backdrop-blur-xs">
                  {garment.gsmWeight} · {activeSwatch.name}
                </div>
                <div className="pointer-events-none absolute right-3.5 bottom-3.5 bg-white/92 px-2.5 py-1 font-mono text-[9px] font-semibold tracking-[0.16em] text-[#000000] uppercase backdrop-blur-xs">
                  {currentMobilePlate.caption}
                </div>
              </div>

              {galleryPlates.length > 1 ? (
                <div className="mt-3 grid grid-cols-3 gap-2.5">
                  {galleryPlates.map((plate, idx) => {
                    const isActive = idx === activeMobileSlide;
                    return (
                      <button
                        key={plate.id}
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setActiveMobileSlide(idx)}
                        aria-label={`View Core studio photo ${idx + 1}`}
                        className={cn(
                          "relative aspect-[3/4] cursor-pointer overflow-hidden border bg-[#F4F4F5] transition-colors",
                          isActive
                            ? "border-[#000000]"
                            : "border-transparent opacity-70 hover:opacity-100"
                        )}
                      >
                        <Image
                          src={plate.src}
                          alt={plate.alt}
                          fill
                          sizes="33vw"
                          className="object-cover object-center"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {/* Desktop Gallery: Clean Vertical Editorial Stack */}
            <div className="hidden lg:flex lg:flex-col lg:gap-4">
              {galleryPlates.map((plate, idx) => (
                <figure
                  key={plate.id}
                  className="group relative aspect-[3/4] w-full overflow-hidden bg-[#F4F4F5]"
                >
                  <Image
                    src={plate.src}
                    alt={plate.alt}
                    fill
                    priority={idx === 0}
                    sizes="(max-width: 1280px) 58vw, 900px"
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  />

                  {idx === 0 ? (
                    <div className="pointer-events-none absolute top-4 left-4 inline-flex items-center gap-2 bg-white/92 px-3 py-1 font-mono text-[9px] font-semibold tracking-[0.18em] text-[#000000] uppercase backdrop-blur-xs">
                      <span
                        aria-hidden="true"
                        style={{
                          backgroundColor: activeSwatch.hex,
                          borderColor: activeSwatch.borderHex || activeSwatch.hex,
                        }}
                        className="h-2.5 w-2.5 rounded-full border"
                      />
                      <span>
                        {activeSwatch.name} · {garment.gsmWeight}
                      </span>
                    </div>
                  ) : null}

                  <figcaption className="pointer-events-none absolute bottom-4 left-4 bg-white/92 px-3 py-1 font-mono text-[9px] font-semibold tracking-[0.18em] text-[#000000] uppercase backdrop-blur-xs">
                    {plate.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          {/* RIGHT (5 COLS): STICKY CORE BUY BOX & COLORWAY STUDIO */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
            {/* Eyebrow Meta */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-4 font-mono text-[10px] tracking-[0.18em] uppercase">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: accentColor }}
                  className="h-1.5 w-1.5 shrink-0"
                />
                <span className="font-semibold text-[#000000]">
                  KNITX CORE · {garment.serialCode} · {garment.gsmWeight}
                </span>
              </div>

              <span className="text-[#666666]">{garment.category}</span>
            </div>

            {/* Monumental Title */}
            <h1 className="mt-5 font-syne text-3xl leading-[1.02] font-extrabold tracking-[-0.02em] text-[#000000] uppercase sm:text-4xl">
              {garment.title}
            </h1>

            {/* Price & Subtle Signature KNITX Branding Note */}
            <div className="mt-4 space-y-2 border-b border-black/10 pb-6">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-mono text-xl font-semibold tracking-[0.04em] text-[#000000] tabular-nums sm:text-2xl">
                  {formatInr(garment.priceInr)}
                </p>
                <span className="font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase">
                  INCL. OF ALL TAXES
                </span>
              </div>

              <p className="text-xs leading-relaxed text-[#666666] italic">
                Finished with tonal KNITX embroidery &amp; signature woven neck
                and hem labels.
              </p>
            </div>

            {/* Interactive Mineral Colorway Selector */}
            <div className="border-b border-black/10 py-6">
              <div className="flex items-center justify-between gap-3 font-mono text-[10px] tracking-[0.18em] uppercase">
                <span className="text-[#666666]">MINERAL COLORWAY</span>
                <span className="font-semibold text-[#000000]">
                  {activeSwatch.name}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {garment.swatches.map((swatch) => {
                  const isSelected = swatch.id === activeSwatch.id;
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      suppressHydrationWarning
                      onClick={() => handleSelectSwatch(swatch.id)}
                      aria-label={`Select ${swatch.name} colorway`}
                      aria-pressed={isSelected}
                      title={swatch.name}
                      className={cn(
                        "flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border transition-all duration-200 hover:scale-105",
                        isSelected
                          ? "border-[#000000] ring-2 ring-black/15"
                          : "border-black/10 hover:border-black/40"
                      )}
                    >
                      <span
                        style={{
                          backgroundColor: swatch.hex,
                          borderColor: swatch.borderHex || swatch.hex,
                        }}
                        className="h-7 w-7 rounded-full border"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selector + Expandable Size & Fit Guide */}
            <div className="py-6">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#000000] uppercase">
                  SIZE{" "}
                  <span className="ml-1.5 font-normal text-[#666666]">
                    {selectedSize}
                  </span>
                </span>

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setSizeGuideOpen((prev) => !prev)}
                  aria-expanded={sizeGuideOpen}
                  className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#666666] uppercase underline underline-offset-4 transition-colors hover:text-[#000000]"
                >
                  <Ruler className="h-3 w-3" />
                  <span>SIZE &amp; FIT GUIDE</span>
                </button>
              </div>

              <div className="mt-3.5 grid grid-cols-4 gap-2">
                {garment.sizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      suppressHydrationWarning
                      onClick={() => {
                        setSelectedSize(size);
                        setBagNotice(null);
                      }}
                      className={cn(
                        "cursor-pointer border px-3 py-3 text-center font-mono text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors",
                        isSelected
                          ? "border-[#000000] bg-[#000000] text-[#FFFFFF]"
                          : "border-black/15 bg-[#FFFFFF] text-[#000000] hover:border-[#000000]"
                      )}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>

              <p className="mt-2.5 font-mono text-[10px] tracking-[0.14em] text-[#666666] uppercase">
                FIT · {garment.fit}
              </p>

              {/* Expandable Fit & Measurement Table */}
              <AnimatePresence initial={false}>
                {sizeGuideOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 border border-black/10 bg-[#F4F4F5] p-4">
                      <p className="pb-3 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#000000] uppercase">
                        CORE SILHOUETTE MEASUREMENTS (INCHES)
                      </p>

                      <div className="overflow-x-auto">
                        {isTrouser ? (
                          <table className="w-full min-w-[300px] border-collapse text-left font-mono text-[10px] tabular-nums">
                            <thead>
                              <tr className="border-b border-black/15 text-[#666666] uppercase">
                                <th className="py-1.5 pr-2 font-semibold">SIZE</th>
                                <th className="py-1.5 px-2 font-semibold">WAIST</th>
                                <th className="py-1.5 px-2 font-semibold">HIP</th>
                                <th className="py-1.5 px-2 font-semibold">RISE</th>
                                <th className="py-1.5 pl-2 font-semibold">INSEAM</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/10 text-[#000000]">
                              {CORE_TROUSER_MEASUREMENTS.map((row) => (
                                <tr key={row.size}>
                                  <td className="py-1.5 pr-2 font-bold">
                                    {row.size}
                                  </td>
                                  <td className="py-1.5 px-2">{row.waist}</td>
                                  <td className="py-1.5 px-2">{row.hip}</td>
                                  <td className="py-1.5 px-2">{row.rise}</td>
                                  <td className="py-1.5 pl-2">{row.inseam}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <table className="w-full min-w-[300px] border-collapse text-left font-mono text-[10px] tabular-nums">
                            <thead>
                              <tr className="border-b border-black/15 text-[#666666] uppercase">
                                <th className="py-1.5 pr-2 font-semibold">SIZE</th>
                                <th className="py-1.5 px-2 font-semibold">CHEST</th>
                                <th className="py-1.5 px-2 font-semibold">LENGTH</th>
                                <th className="py-1.5 px-2 font-semibold">SHOULDER</th>
                                <th className="py-1.5 pl-2 font-semibold">SLEEVE</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/10 text-[#000000]">
                              {CORE_TOP_MEASUREMENTS.map((row) => (
                                <tr key={row.size}>
                                  <td className="py-1.5 pr-2 font-bold">
                                    {row.size}
                                  </td>
                                  <td className="py-1.5 px-2">{row.chest}</td>
                                  <td className="py-1.5 px-2">{row.length}</td>
                                  <td className="py-1.5 px-2">{row.shoulder}</td>
                                  <td className="py-1.5 pl-2">{row.sleeve}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>

                      <p className="mt-3 text-[11px] leading-relaxed text-[#666666]">
                        {garment.fit}. Pre-shrunk enzyme-washed heavyweight
                        Indian cotton — true to our boxy architectural fit.
                      </p>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* ============================================================= */}
            {/* ACCOUNT / COMMUNITY ACCESS BUY BOX (NO ACCESS CODE INPUT)     */}
            {/* ============================================================= */}
            <div className="pb-6">
              {bagNotice ? (
                <div className="mb-3 flex items-center gap-2 border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{bagNotice}</span>
                </div>
              ) : null}

              {hasCoreAccess ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    suppressHydrationWarning
                    disabled={!garment.inStock}
                    onClick={handleAddToBag}
                    className="flex w-full cursor-pointer items-center justify-center gap-2.5 bg-[#000000] px-6 py-4 font-mono text-[11px] font-bold tracking-[0.18em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {!garment.inStock ? (
                      <span>CURRENTLY ALLOCATED</span>
                    ) : justAdded ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>ADDED TO BAG</span>
                      </>
                    ) : (
                      <span>ADD TO BAG — {formatInr(garment.priceInr)}</span>
                    )}
                  </button>

                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] tracking-[0.14em] text-[#666666] uppercase">
                    <span className="inline-flex items-center gap-1.5 text-[#000000]">
                      <ShieldCheck
                        className="h-3.5 w-3.5"
                        style={{ color: accentColor }}
                      />
                      <span>{accessBadgeLabel}</span>
                    </span>
                    <span>CUT TO ORDER · {garment.productionDays} DAYS</span>
                  </div>
                </div>
              ) : (
                <div className="border border-black/15 bg-[#F4F4F5] p-5">
                  <div className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.18em] text-[#000000] uppercase">
                    <span
                      aria-hidden="true"
                      style={{ backgroundColor: accentColor }}
                      className="h-2 w-2 shrink-0"
                    />
                    <span>INSTANT COMMUNITY ACCESS</span>
                  </div>

                  <p className="mt-2.5 text-xs leading-relaxed text-[#666666]">
                    Drop 1 admitted accounts &amp; community waitlist members
                    unlock Core automatically, no code required.
                  </p>

                  <div className="mt-4 space-y-2.5">
                    {!safeUser ? (
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setAuthModalOpen(true)}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 bg-[#000000] px-5 py-3.5 font-mono text-[11px] font-bold tracking-[0.16em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85"
                      >
                        <span>SIGN IN WITH EXISTING ACCOUNT</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <div className="border border-black/10 bg-[#FFFFFF] px-3.5 py-2.5 font-mono text-[10px] tracking-[0.14em] text-[#000000] uppercase">
                        SIGNED IN AS {safeUser.email} · AWAITING DROP ADMISSION
                      </div>
                    )}

                    <Link
                      href="/core#core-access"
                      className="flex w-full items-center justify-center gap-2 border border-[#000000] bg-[#FFFFFF] px-5 py-3 font-mono text-[10px] font-bold tracking-[0.16em] text-[#000000] uppercase transition-colors hover:bg-[#000000] hover:text-[#FFFFFF]"
                    >
                      <span>JOIN COMMUNITY WAITLIST</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* ============================================================= */}
            {/* EXPANDABLE CORE SPECIFICATION ACCORDIONS                      */}
            {/* ============================================================= */}
            <div className="divide-y divide-black/10 border-y border-black/10">
              {/* Accordion 1: CRAFTSMANSHIP & KNITX BRANDING */}
              <div>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => toggleSpec("craftsmanship")}
                  aria-expanded={openSpec === "craftsmanship"}
                  className="flex w-full cursor-pointer items-center justify-between py-4 text-left font-mono text-[11px] font-semibold tracking-[0.18em] text-[#000000] uppercase transition-opacity hover:opacity-70"
                >
                  <span>CRAFTSMANSHIP &amp; KNITX BRANDING</span>
                  {openSpec === "craftsmanship" ? (
                    <Minus className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {openSpec === "craftsmanship" ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 pb-5 text-[13px] leading-relaxed text-[#666666]">
                        <p>{cleanFlagshipText(garment.description)}</p>

                        <ul className="space-y-2">
                          {garment.craftsmanship.map((item) => (
                            <li
                              key={item}
                              className="flex items-start gap-2.5 text-[#000000]"
                            >
                              <span
                                aria-hidden="true"
                                style={{ backgroundColor: accentColor }}
                                className="mt-2 h-1.5 w-1.5 shrink-0"
                              />
                              <span>{cleanFlagshipText(item)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Accordion 2: FABRIC & GSM */}
              <div>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => toggleSpec("fabric")}
                  aria-expanded={openSpec === "fabric"}
                  className="flex w-full cursor-pointer items-center justify-between py-4 text-left font-mono text-[11px] font-semibold tracking-[0.18em] text-[#000000] uppercase transition-opacity hover:opacity-70"
                >
                  <span>FABRIC &amp; GSM</span>
                  {openSpec === "fabric" ? (
                    <Minus className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {openSpec === "fabric" ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <dl className="space-y-3 pb-5 text-[13px]">
                        <div className="flex items-baseline justify-between gap-4 border-b border-black/5 pb-2.5">
                          <dt className="font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase">
                            TEXTILE
                          </dt>
                          <dd className="text-right font-medium text-[#000000]">
                            {garment.fabric}
                          </dd>
                        </div>

                        <div className="flex items-baseline justify-between gap-4 border-b border-black/5 pb-2.5">
                          <dt className="font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase">
                            WEIGHT
                          </dt>
                          <dd className="font-mono text-xs font-semibold text-[#000000]">
                            {garment.gsmWeight}
                          </dd>
                        </div>

                        <div className="flex items-baseline justify-between gap-4 border-b border-black/5 pb-2.5">
                          <dt className="font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase">
                            ACTIVE TONE
                          </dt>
                          <dd className="font-mono text-xs font-medium text-[#000000]">
                            {activeSwatch.name}
                          </dd>
                        </div>

                        <div className="flex items-baseline justify-between gap-4">
                          <dt className="font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase">
                            SILHOUETTE
                          </dt>
                          <dd className="text-right font-medium text-[#000000]">
                            {garment.fit}
                          </dd>
                        </div>
                      </dl>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Accordion 3: CUT-TO-ORDER DISPATCH */}
              <div>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => toggleSpec("dispatch")}
                  aria-expanded={openSpec === "dispatch"}
                  className="flex w-full cursor-pointer items-center justify-between py-4 text-left font-mono text-[11px] font-semibold tracking-[0.18em] text-[#000000] uppercase transition-opacity hover:opacity-70"
                >
                  <span>CUT-TO-ORDER DISPATCH</span>
                  {openSpec === "dispatch" ? (
                    <Minus className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {openSpec === "dispatch" ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 pb-5 text-[13px] leading-relaxed text-[#666666]">
                        <p className="text-[#000000]">
                          Cut &amp; finished to order in {garment.productionDays}{" "}
                          business days · Complimentary insured pan-India
                          dispatch.
                        </p>
                        <p>
                          KNITX CORE releases {offsetDays} days after{" "}
                          {editionLabel} ({coreLaunchLabel}) for admitted Drop 1
                          &amp; community waitlist accounts, produced in small
                          mineral dye lots with zero overproduction.
                        </p>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* BELOW THE FOLD — COMPLETE THE CORE WARDROBE                       */}
      {/* ================================================================= */}
      {relatedGarments.length > 0 ? (
        <section className="border-t border-black/10 bg-[#FFFFFF] py-16 sm:py-24">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
            <div className="mb-8 flex items-end justify-between gap-4 border-b border-black/10 pb-5">
              <div>
                <p className="font-mono text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase">
                  KNITX CORE · HEAVYWEIGHT WARDROBE
                </p>
                <h2 className="mt-2 font-syne text-2xl font-extrabold tracking-[-0.02em] text-[#000000] uppercase sm:text-3xl">
                  COMPLETE THE CORE WARDROBE
                </h2>
              </div>

              <Link
                href="/core"
                className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.18em] text-[#000000] uppercase transition-opacity hover:opacity-65"
              >
                <span>ALL CORE SILHOUETTES</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
              {relatedGarments.map((other) => {
                const defaultSwatch =
                  other.swatches.find((s) => s.id === other.defaultSwatchId) ||
                  other.swatches[0];

                return (
                  <Link
                    key={other._id}
                    href={`/core/${other._id}?color=${other.defaultSwatchId}`}
                    className="group flex flex-col"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F4F4F5]">
                      <Image
                        src={defaultSwatch.imageUrl}
                        alt={`${other.title} in ${defaultSwatch.name}`}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                      <span className="absolute top-3 left-3 bg-white/92 px-2 py-0.5 font-mono text-[9px] font-semibold tracking-[0.16em] text-[#000000] uppercase backdrop-blur-xs">
                        {other.gsmWeight}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        {other.swatches.map((swatch) => (
                          <span
                            key={swatch.id}
                            title={swatch.name}
                            style={{
                              backgroundColor: swatch.hex,
                              borderColor: swatch.borderHex || swatch.hex,
                            }}
                            className="h-2.5 w-2.5 rounded-full border"
                          />
                        ))}
                      </div>

                      <h3 className="truncate font-sans text-xs font-semibold tracking-[0.04em] text-[#000000] uppercase transition-opacity group-hover:opacity-65">
                        {other.title}
                      </h3>

                      <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-[#666666] tabular-nums">
                        <span className="text-[#000000]">
                          {formatInr(other.priceInr)}
                        </span>
                        <span>{other.swatches.length} TONES</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* ================================================================= */}
      {/* MOBILE STICKY BOTTOM BUY BAR                                      */}
      {/* ================================================================= */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-sm font-bold text-[#000000] tabular-nums">
              {formatInr(garment.priceInr)}
            </p>
            <p className="truncate font-mono text-[10px] tracking-[0.12em] text-[#666666] uppercase">
              {activeSwatch.name} · SIZE {selectedSize}
            </p>
          </div>

          {hasCoreAccess ? (
            <button
              type="button"
              suppressHydrationWarning
              disabled={!garment.inStock}
              onClick={handleAddToBag}
              className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center justify-center gap-2 bg-[#000000] px-5 py-2.5 font-mono text-[11px] font-bold tracking-[0.16em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {!garment.inStock ? (
                <span>ALLOCATED</span>
              ) : justAdded ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>ADDED</span>
                </>
              ) : (
                <span>ADD TO BAG</span>
              )}
            </button>
          ) : (
            <Link
              href="/core#core-access"
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 bg-[#000000] px-5 py-2.5 font-mono text-[11px] font-bold tracking-[0.16em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85"
            >
              <span>GET CORE ACCESS</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
