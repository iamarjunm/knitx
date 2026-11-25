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
  FLAGSHIP_MEDIA,
  cleanFlagshipText,
  formatDropEditionLabel,
  getFlagshipProductImage,
} from "@/lib/flagship-media";
import type { DropCampaign, Product } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";

interface RelatedDropItem {
  product: Product;
  index: number;
}

interface FlagshipProductClientProps {
  product: Product;
  productIndex: number;
  drop: DropCampaign;
  relatedProducts: RelatedDropItem[];
}

interface GalleryPlate {
  id: string;
  src: string;
  alt: string;
  caption: string;
}

type SpecSectionId = "details" | "fabric" | "dispatch";

const BOXY_SIZE_CHART = [
  { size: "S", chest: '44"', length: '26.5"', shoulder: '21.0"', sleeve: '23.0"' },
  { size: "M", chest: '46"', length: '27.5"', shoulder: '22.0"', sleeve: '23.5"' },
  { size: "L", chest: '48"', length: '28.5"', shoulder: '23.0"', sleeve: '24.0"' },
  { size: "XL", chest: '51"', length: '29.5"', shoulder: '24.0"', sleeve: '24.5"' },
] as const;

const TROUSER_SIZE_CHART = [
  { size: "28", waist: '29"', hip: '42"', rise: '13.0"', inseam: '30.5"' },
  { size: "30", waist: '31"', hip: '44"', rise: '13.5"', inseam: '31.0"' },
  { size: "32", waist: '33"', hip: '46"', rise: '14.0"', inseam: '31.5"' },
  { size: "34", waist: '35"', hip: '48"', rise: '14.5"', inseam: '32.0"' },
] as const;

export default function FlagshipProductClient({
  product,
  productIndex,
  drop,
  relatedProducts,
}: FlagshipProductClientProps) {
  const { config } = useStorefrontConfig();
  const { user, setAuthModalOpen } = useAuth();
  const { isVaultUnlocked, waitlistPass, addToCart, unlockVaultDemo } =
    useVault();

  const [mounted, setMounted] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes.includes("L") ? "L" : product.sizes[0] || "ONE SIZE"
  );
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [openSpec, setOpenSpec] = useState<SpecSectionId | null>("details");
  const [activeMobileSlide, setActiveMobileSlide] = useState(0);
  const [bagNotice, setBagNotice] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSelectedSize(
      product.sizes.includes("L") ? "L" : product.sizes[0] || "ONE SIZE"
    );
    setActiveMobileSlide(0);
    setBagNotice(null);
    setJustAdded(false);
  }, [product._id, product.sizes]);

  const showUnlocked = mounted && isVaultUnlocked;
  const safeUser = mounted ? user : null;
  const safeWaitlistPass = mounted ? waitlistPass : null;
  const accentColor = mounted ? config.accentColor || "#E11D2E" : "#E11D2E";
  const editionLabel = formatDropEditionLabel(
    (mounted && config.activeDropNumber) || drop.dropNumber
  );

  const isVeiled = product.isMystery && !showUnlocked;
  const displayTitle = isVeiled
    ? "VEILED SILHOUETTE"
    : cleanFlagshipText(product.title);
  const cleanDescription = cleanFlagshipText(product.description);
  const cleanCraftsmanship = useMemo(
    () => product.craftsmanship.map((item) => cleanFlagshipText(item)),
    [product.craftsmanship]
  );

  const isTrouserSizing = useMemo(
    () => product.sizes.some((s) => /^(28|30|32|34|36)$/.test(s.trim())),
    [product.sizes]
  );

  const primaryImageSrc = getFlagshipProductImage(
    product,
    productIndex,
    showUnlocked
  );

  const galleryPlates = useMemo<GalleryPlate[]>(() => {
    if (isVeiled) {
      return [
        {
          id: "veiled-primary",
          src: FLAGSHIP_MEDIA.mysterySilhouette,
          alt: `${product.serialCode} veiled silhouette preview`,
          caption: `${product.serialCode} · UNVEILS UPON ACCOUNT ADMISSION`,
        },
        {
          id: "veiled-atelier",
          src: FLAGSHIP_MEDIA.atelierSunlit,
          alt: "KNITX sunlit pattern cutting atelier table",
          caption: "SAMPLE-FIRST ATELIER · CUT ONLY WHEN CLAIMED",
        },
      ];
    }

    const plates: GalleryPlate[] = [
      {
        id: "primary-studio",
        src: primaryImageSrc,
        alt: `${displayTitle} front studio look`,
        caption: `01 · ${product.serialCode} STUDIO PLATE`,
      },
    ];

    const secondaryEditorial =
      primaryImageSrc !== FLAGSHIP_MEDIA.dropBomberStudio
        ? {
            id: "editorial-look",
            src: FLAGSHIP_MEDIA.dropBomberStudio,
            alt: `${displayTitle} editorial studio silhouette`,
            caption: `02 · ${editionLabel} CAMPAIGN STUDY`,
          }
        : {
            id: "editorial-look-alt",
            src: FLAGSHIP_MEDIA.bomber1of1,
            alt: `${displayTitle} detail craftsmanship view`,
            caption: `02 · ${editionLabel} TEXTILE STUDY`,
          };

    plates.push(secondaryEditorial);
    plates.push({
      id: "atelier-plate",
      src: FLAGSHIP_MEDIA.atelierSunlit,
      alt: "KNITX sunlit atelier garment finishing",
      caption: `03 · CUT TO ORDER IN ${product.productionDays} BUSINESS DAYS`,
    });

    return plates;
  }, [
    isVeiled,
    primaryImageSrc,
    displayTitle,
    product.serialCode,
    product.productionDays,
    editionLabel,
  ]);

  const currentMobilePlate =
    galleryPlates[activeMobileSlide] || galleryPlates[0];

  const isSoldOut = product.remainingUnits <= 0;

  const handleAddToBag = () => {
    if (!showUnlocked || isSoldOut) return;
    setBagNotice(null);
    const sizeToUse = selectedSize || product.sizes[0] || "ONE SIZE";
    const result = addToCart(product, sizeToUse);
    if (!result.ok) {
      setBagNotice(
        cleanFlagshipText(
          result.message || "Unable to reserve this garment right now."
        )
      );
      return;
    }
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2200);
  };

  const toggleSpec = (id: SpecSectionId) => {
    setOpenSpec((prev) => (prev === id ? null : id));
  };

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
              href="/drops"
              className="shrink-0 transition-colors hover:text-[#000000]"
            >
              DROPS
            </Link>
            <span aria-hidden="true" className="text-black/25">
              /
            </span>
            <span className="truncate font-semibold text-[#000000]">
              {displayTitle}
            </span>
          </nav>

          <span className="hidden shrink-0 font-mono text-[10px] tracking-[0.18em] text-[#666666] uppercase sm:inline-block">
            {editionLabel} · {product.serialCode}
          </span>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 12-COLUMN SPLIT ARCHITECTURAL PDP                                 */}
      {/* ================================================================= */}
      <section className="mx-auto max-w-[1600px] px-4 pt-6 pb-20 sm:px-8 sm:pt-10 sm:pb-28">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          {/* LEFT (7 COLS): MUSEUM-GRADE FULL-BLEED PHOTOGRAPHY GALLERY */}
          <div className="lg:col-span-7">
            {/* Mobile Gallery: Primary Tall Frame + Thumbnail Strip */}
            <div className="lg:hidden">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F4F4F5]">
                <Image
                  src={currentMobilePlate.src}
                  alt={currentMobilePlate.alt}
                  fill
                  priority
                  sizes="100vw"
                  className={cn(
                    "object-cover object-center transition-all duration-500",
                    isVeiled ? "brightness-90 contrast-105" : ""
                  )}
                />
                {product.tier === "one-of-one" && !isVeiled ? (
                  <span
                    style={{ backgroundColor: accentColor }}
                    className="absolute top-3.5 left-3.5 px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.18em] text-white uppercase"
                  >
                    ONE OF ONE
                  </span>
                ) : isVeiled ? (
                  <span className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 bg-black/85 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.18em] text-white uppercase">
                    <Lock className="h-3 w-3" />
                    <span>PRIVATE ACCESS</span>
                  </span>
                ) : null}

                <div className="pointer-events-none absolute right-3.5 bottom-3.5 bg-white/92 px-2.5 py-1 font-mono text-[9px] font-semibold tracking-[0.16em] text-black uppercase backdrop-blur-xs">
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
                        aria-label={`View gallery photo ${idx + 1}`}
                        className={cn(
                          "relative aspect-[3/4] cursor-pointer overflow-hidden bg-[#F4F4F5] border transition-colors",
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

            {/* Desktop Gallery: Vertical SSENSE / Acne Studios Editorial Stack */}
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
                    className={cn(
                      "object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]",
                      isVeiled && idx === 0 ? "brightness-90 contrast-105" : ""
                    )}
                  />
                  {idx === 0 && product.tier === "one-of-one" && !isVeiled ? (
                    <span
                      style={{ backgroundColor: accentColor }}
                      className="absolute top-4 left-4 px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.18em] text-white uppercase"
                    >
                      ONE OF ONE · ARCHIVE EDITION
                    </span>
                  ) : idx === 0 && isVeiled ? (
                    <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-black/85 px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.18em] text-white uppercase">
                      <Lock className="h-3 w-3" />
                      <span>UNVEILED ON ACCOUNT ADMISSION</span>
                    </span>
                  ) : null}

                  <figcaption className="pointer-events-none absolute bottom-4 left-4 bg-white/92 px-3 py-1 font-mono text-[9px] font-semibold tracking-[0.18em] text-[#000000] uppercase backdrop-blur-xs">
                    {plate.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          {/* RIGHT (5 COLS): STICKY ARCHITECTURAL BUY BOX & SPECS */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
            {/* Serial Code, Tier & Live Inventory Meta */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-4 font-mono text-[10px] tracking-[0.18em] uppercase">
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-[#000000]">
                  {product.serialCode}
                </span>
                <span aria-hidden="true" className="text-black/25">
                  ·
                </span>
                {product.tier === "one-of-one" ? (
                  <span
                    style={{ color: accentColor }}
                    className="font-bold"
                  >
                    ONE OF ONE
                  </span>
                ) : (
                  <span className="text-[#666666]">
                    SMALL BATCH · {product.totalUnits} UNITS
                  </span>
                )}
              </div>

              <span
                className={cn(
                  "font-semibold",
                  isSoldOut ? "text-[#666666]" : "text-[#000000]"
                )}
              >
                {isSoldOut
                  ? "EDITION SOLD OUT"
                  : `${product.remainingUnits} of ${product.totalUnits} available`}
              </span>
            </div>

            {/* Monumental Title */}
            <h1 className="mt-5 font-syne text-3xl leading-[1.02] font-extrabold tracking-[-0.02em] text-[#000000] uppercase sm:text-4xl">
              {displayTitle}
            </h1>

            {/* Price & Tax Note */}
            <div className="mt-4 flex flex-col gap-1 border-b border-black/10 pb-6">
              <p className="font-mono text-xl font-semibold tracking-[0.04em] text-[#000000] tabular-nums sm:text-2xl">
                {isVeiled ? "PRIVATE ALLOCATION" : formatInr(product.priceInr)}
              </p>
              <p className="font-mono text-[10px] tracking-[0.14em] text-[#666666] uppercase">
                Incl. of all taxes · Complimentary Insured Pan-India Dispatch
              </p>
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
                {product.sizes.map((size) => {
                  const isSelected = selectedSize === size;
                  const isSingleWide = product.sizes.length === 1;
                  return (
                    <button
                      key={size}
                      type="button"
                      suppressHydrationWarning
                      disabled={isSoldOut}
                      onClick={() => {
                        setSelectedSize(size);
                        setBagNotice(null);
                      }}
                      className={cn(
                        "cursor-pointer border px-3 py-3 font-mono text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                        isSingleWide ? "col-span-4 text-left" : "text-center",
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

              {/* Expandable Size & Fit Guide Accordion */}
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
                      <div className="flex items-center justify-between gap-2 pb-3">
                        <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#000000] uppercase">
                          OVERSIZED BOXY STREETWEAR MEASUREMENTS (INCHES)
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        {isTrouserSizing ? (
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
                              {TROUSER_SIZE_CHART.map((row) => (
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
                              {BOXY_SIZE_CHART.map((row) => (
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
                        Cut on our signature Indian boxy streetwear block with a
                        dropped shoulder and structured drape. Take your true
                        size for the intended oversized proportion, or size down
                        once for a closer shoulder line.
                      </p>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* ============================================================= */}
            {/* ACCOUNT-BASED PURCHASE ACTION (ZERO ACCESS CODE INPUT)        */}
            {/* ============================================================= */}
            <div className="pb-6">
              {bagNotice ? (
                <div className="mb-3 flex items-center gap-2 border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{bagNotice}</span>
                </div>
              ) : null}

              {showUnlocked ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    suppressHydrationWarning
                    disabled={isSoldOut}
                    onClick={handleAddToBag}
                    className="flex w-full cursor-pointer items-center justify-center gap-2.5 bg-[#000000] px-6 py-4 font-mono text-[11px] font-bold tracking-[0.18em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isSoldOut ? (
                      <span>EDITION SOLD OUT</span>
                    ) : justAdded ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>ADDED TO BAG</span>
                      </>
                    ) : (
                      <span>ADD TO BAG — {formatInr(product.priceInr)}</span>
                    )}
                  </button>

                  <div className="flex items-center justify-between gap-2 font-mono text-[10px] tracking-[0.14em] text-[#666666] uppercase">
                    <span className="inline-flex items-center gap-1.5 text-[#000000]">
                      <ShieldCheck
                        className="h-3.5 w-3.5"
                        style={{ color: accentColor }}
                      />
                      <span>ACCOUNT ACCESS VERIFIED</span>
                    </span>
                    <span>SHIPS IN {product.productionDays} BUSINESS DAYS</span>
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
                    <span>ACCOUNT-BASED DROP ACCESS</span>
                  </div>

                  {!safeUser ? (
                    <div className="mt-3 space-y-3.5">
                      <p className="text-xs leading-relaxed text-[#666666]">
                        Access to limited-batch pieces is granted directly to
                        admitted collector accounts — no access code required.
                      </p>

                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setAuthModalOpen(true)}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 bg-[#000000] px-5 py-3.5 font-mono text-[11px] font-bold tracking-[0.16em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85"
                      >
                        <span>SIGN IN TO CHECK ACCOUNT ACCESS</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <Link
                          href="/#waitlist"
                          className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#000000] uppercase underline underline-offset-4 transition-opacity hover:opacity-65"
                        >
                          <span>JOIN THE WAITLIST</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>

                        <button
                          type="button"
                          suppressHydrationWarning
                          onClick={unlockVaultDemo}
                          className="cursor-pointer font-mono text-[10px] tracking-[0.12em] text-[#666666] underline decoration-black/25 underline-offset-4 transition-colors hover:text-[#000000]"
                        >
                          Preview Unlocked Mode
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3.5">
                      <div className="border border-black/10 bg-[#FFFFFF] px-3.5 py-3">
                        <p className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#000000] uppercase">
                          {safeWaitlistPass
                            ? `WAITLIST QUEUE #${String(safeWaitlistPass.position).padStart(4, "0")}`
                            : `SIGNED IN · ${safeUser.email}`}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-[#666666]">
                          {safeWaitlistPass
                            ? `Account in waitlist queue #${String(safeWaitlistPass.position).padStart(4, "0")} — unlocks automatically when granted access, no code required.`
                            : "Register on the drop waitlist below — your account unlocks automatically when granted access, no code required."}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link
                          href="/#waitlist"
                          className="inline-flex items-center gap-2 bg-[#000000] px-4 py-2.5 font-mono text-[10px] font-bold tracking-[0.16em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85"
                        >
                          <span>JOIN THE WAITLIST</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>

                        <button
                          type="button"
                          suppressHydrationWarning
                          onClick={unlockVaultDemo}
                          className="cursor-pointer font-mono text-[10px] tracking-[0.12em] text-[#666666] underline decoration-black/25 underline-offset-4 transition-colors hover:text-[#000000]"
                        >
                          Preview Unlocked Mode
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ============================================================= */}
            {/* EXPANDABLE ARCHITECTURAL SPECIFICATION ACCORDIONS             */}
            {/* ============================================================= */}
            <div className="divide-y divide-black/10 border-y border-black/10">
              {/* Accordion 1: DETAILS & CRAFTSMANSHIP */}
              <div>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => toggleSpec("details")}
                  aria-expanded={openSpec === "details"}
                  className="flex w-full cursor-pointer items-center justify-between py-4 text-left font-mono text-[11px] font-semibold tracking-[0.18em] text-[#000000] uppercase transition-opacity hover:opacity-70"
                >
                  <span>DETAILS &amp; CRAFTSMANSHIP</span>
                  {openSpec === "details" ? (
                    <Minus className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {openSpec === "details" ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 pb-5 text-[13px] leading-relaxed text-[#666666]">
                        <p>
                          {isVeiled
                            ? "Full visual reveal and edition specifications unlock automatically once your account receives drop admission."
                            : cleanDescription}
                        </p>

                        <ul className="space-y-2">
                          {cleanCraftsmanship.map((point) => (
                            <li
                              key={point}
                              className="flex items-start gap-2.5 text-[#000000]"
                            >
                              <span
                                aria-hidden="true"
                                style={{ backgroundColor: accentColor }}
                                className="mt-2 h-1.5 w-1.5 shrink-0"
                              />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Accordion 2: FABRIC & WEIGHT */}
              <div>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => toggleSpec("fabric")}
                  aria-expanded={openSpec === "fabric"}
                  className="flex w-full cursor-pointer items-center justify-between py-4 text-left font-mono text-[11px] font-semibold tracking-[0.18em] text-[#000000] uppercase transition-opacity hover:opacity-70"
                >
                  <span>FABRIC &amp; WEIGHT</span>
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
                            COMPOSITION
                          </dt>
                          <dd className="text-right font-medium text-[#000000]">
                            {cleanFlagshipText(product.fabric)}
                          </dd>
                        </div>

                        <div className="flex items-baseline justify-between gap-4 border-b border-black/5 pb-2.5">
                          <dt className="font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase">
                            FABRIC WEIGHT
                          </dt>
                          <dd className="font-mono text-xs font-semibold text-[#000000]">
                            {product.gsmWeight}
                          </dd>
                        </div>

                        <div className="flex items-baseline justify-between gap-4">
                          <dt className="font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase">
                            DESIGN CREDIT
                          </dt>
                          <dd className="font-mono text-xs font-medium text-[#000000]">
                            {product.creatorCredit
                              ? cleanFlagshipText(product.creatorCredit)
                              : "KNITX ATELIER"}
                          </dd>
                        </div>
                      </dl>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Accordion 3: SAMPLE-FIRST CUT TO ORDER */}
              <div>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => toggleSpec("dispatch")}
                  aria-expanded={openSpec === "dispatch"}
                  className="flex w-full cursor-pointer items-center justify-between py-4 text-left font-mono text-[11px] font-semibold tracking-[0.18em] text-[#000000] uppercase transition-opacity hover:opacity-70"
                >
                  <span>SAMPLE-FIRST CUT TO ORDER</span>
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
                          Cut &amp; sewn to order in {product.productionDays}{" "}
                          business days · Zero deadstock · Permanent pattern
                          retirement.
                        </p>
                        <p>
                          KNITX produces a single studio sample for photography
                          and begins cutting your numbered garment only after
                          your order is confirmed. Shipped via complimentary
                          insured pan-India courier in an archival dust bag.
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
      {/* BELOW THE FOLD — MORE FROM THIS DROP                              */}
      {/* ================================================================= */}
      {relatedProducts.length > 0 ? (
        <section className="border-t border-black/10 bg-[#FFFFFF] py-16 sm:py-24">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
            <div className="mb-8 flex items-end justify-between gap-4 border-b border-black/10 pb-5">
              <div>
                <p className="font-mono text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase">
                  {editionLabel} · CURATED LOOKBOOK
                </p>
                <h2 className="mt-2 font-syne text-2xl font-extrabold tracking-[-0.02em] text-[#000000] uppercase sm:text-3xl">
                  MORE FROM THIS DROP
                </h2>
              </div>

              <Link
                href="/drops"
                className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.18em] text-[#000000] uppercase transition-opacity hover:opacity-65"
              >
                <span>VIEW FULL DROP</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
              {relatedProducts.map(({ product: item, index: itemIndex }) => {
                const itemVeiled = item.isMystery && !showUnlocked;
                const itemImg = getFlagshipProductImage(
                  item,
                  itemIndex,
                  showUnlocked
                );
                const itemName = itemVeiled
                  ? `VEILED SILHOUETTE ${String(itemIndex + 1).padStart(2, "0")}`
                  : cleanFlagshipText(item.title);

                return (
                  <Link
                    key={item._id}
                    href={`/product/${item.slug}`}
                    className="group flex flex-col"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F4F4F5]">
                      <Image
                        src={itemImg}
                        alt={itemName}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className={cn(
                          "object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]",
                          itemVeiled ? "brightness-90 contrast-105" : ""
                        )}
                      />

                      {item.tier === "one-of-one" && !itemVeiled ? (
                        <span
                          style={{ backgroundColor: accentColor }}
                          className="absolute top-3 left-3 px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.16em] text-white uppercase"
                        >
                          1 OF 1
                        </span>
                      ) : itemVeiled ? (
                        <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-black/85 px-2 py-0.5 font-mono text-[9px] font-semibold tracking-[0.16em] text-white uppercase">
                          <Lock className="h-2.5 w-2.5" />
                          <span>VEILED</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 space-y-1">
                      <h3 className="truncate font-sans text-xs font-semibold tracking-[0.04em] text-[#000000] uppercase transition-opacity group-hover:opacity-65">
                        {itemName}
                      </h3>
                      <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-[#666666] tabular-nums">
                        <span className="text-[#000000]">
                          {itemVeiled ? "PRIVATE" : formatInr(item.priceInr)}
                        </span>
                        {item.tier === "one-of-one" ? (
                          <span
                            style={{ color: accentColor }}
                            className="font-semibold"
                          >
                            1 OF 1
                          </span>
                        ) : (
                          <span>{item.totalUnits} UNITS</span>
                        )}
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
              {isVeiled ? "PRIVATE" : formatInr(product.priceInr)}
            </p>
            <p className="truncate font-mono text-[10px] tracking-[0.12em] text-[#666666] uppercase">
              SIZE {selectedSize} · {product.gsmWeight}
            </p>
          </div>

          {showUnlocked ? (
            <button
              type="button"
              suppressHydrationWarning
              disabled={isSoldOut}
              onClick={handleAddToBag}
              className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center justify-center gap-2 bg-[#000000] px-5 py-2.5 font-mono text-[11px] font-bold tracking-[0.16em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isSoldOut ? (
                <span>SOLD OUT</span>
              ) : justAdded ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>ADDED</span>
                </>
              ) : (
                <span>ADD TO BAG</span>
              )}
            </button>
          ) : !safeUser ? (
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center justify-center gap-2 bg-[#000000] px-5 py-2.5 font-mono text-[11px] font-bold tracking-[0.16em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85"
            >
              <span>CHECK ACCESS</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Link
              href="/#waitlist"
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 bg-[#000000] px-5 py-2.5 font-mono text-[11px] font-bold tracking-[0.16em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85"
            >
              <span>WAITLIST</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
