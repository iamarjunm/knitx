"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Lock, X } from "lucide-react";
import { useVault } from "@/context/VaultContext";
import type { DropCampaign, Product } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";
import {
  V10_MEDIA,
  cleanV10Text,
  formatEditionLabel,
  getV10ProductImage,
} from "@/components/v10/v10-media";

type FilterKey = "all" | "one-of-one" | "small-batch" | "unveiled";

interface V11ReleaseClientProps {
  drop: DropCampaign;
  products: Product[];
}

export default function V11ReleaseClient({
  drop,
  products,
}: V11ReleaseClientProps) {
  const {
    waitlistPass,
    isVaultUnlocked,
    addToCart,
    unlockVaultWithCode,
    lockVaultPreview,
  } = useVault();

  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [bagFeedback, setBagFeedback] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedProduct(null);
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedProduct]);

  const editionLabel = formatEditionLabel(drop.dropNumber);
  const editionTitle = cleanV10Text(drop.title);

  const oneOfOneCount = useMemo(
    () => products.filter((p) => p.tier === "one-of-one").length,
    [products]
  );

  const smallBatchCount = useMemo(
    () => products.filter((p) => p.tier === "small-batch").length,
    [products]
  );

  const unveiledCount = useMemo(
    () => products.filter((p) => p.isMystery).length,
    [products]
  );

  const indexedProducts = useMemo(
    () => products.map((product, originalIndex) => ({ product, originalIndex })),
    [products]
  );

  const filteredProducts = useMemo(() => {
    switch (activeFilter) {
      case "one-of-one":
        return indexedProducts.filter(
          ({ product }) => product.tier === "one-of-one"
        );
      case "small-batch":
        return indexedProducts.filter(
          ({ product }) => product.tier === "small-batch"
        );
      case "unveiled":
        return indexedProducts.filter(({ product }) => product.isMystery);
      default:
        return indexedProducts;
    }
  }, [activeFilter, indexedProducts]);

  const filterTabs: Array<{ key: FilterKey; label: string }> = [
    { key: "all", label: `ALL (${products.length})` },
    { key: "one-of-one", label: `ONE OF ONE (${oneOfOneCount})` },
    { key: "small-batch", label: `SMALL BATCH (${smallBatchCount})` },
    { key: "unveiled", label: `UNVEILED (${unveiledCount})` },
  ];

  function handleUnlockSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setCodeError("Enter your personal invitation code.");
      return;
    }

    const ok = unlockVaultWithCode(trimmed);
    if (!ok) {
      setCodeError(
        "Code not recognized. Verify your admission email or try preview code KNITX-001."
      );
      return;
    }
    setCodeError("");
  }

  function openGarmentDrawer(product: Product, originalIndex: number) {
    setSelectedProduct(product);
    setSelectedIndex(originalIndex);
    setSelectedSize(product.sizes[0] ?? "ONE SIZE");
    setBagFeedback("");
  }

  function handleAddToBag() {
    if (!selectedProduct) return;
    const chosenSize = selectedSize || selectedProduct.sizes[0] || "ONE SIZE";
    const result = addToCart(selectedProduct, chosenSize);

    if (!result.ok) {
      setBagFeedback(
        cleanV10Text(result.message || "Unable to reserve this garment right now.")
      );
      return;
    }

    setBagFeedback("");
    setSelectedProduct(null);
  }

  // LOCKED STATE — DRAMATIC FULL-VIEWPORT OBSIDIAN PRIVATE ENTRANCE
  if (!mounted || !isVaultUnlocked) {
    return (
      <section className="relative flex min-h-[calc(100svh-4rem)] w-full items-center justify-center overflow-hidden bg-[#070709] px-6 py-20 text-[#F4F2ED]">
        {/* Ambient Veiled Lookbook Silhouette */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={V10_MEDIA.mysterySilhouette}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover object-center opacity-[0.22]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(7,7,9,0.45)_0%,rgba(7,7,9,0.92)_70%,#070709_100%)]"
        />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-lg text-center"
        >
          <div className="inline-flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#8E8C87]">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-[#C81E1E] shadow-[0_0_8px_rgba(200,30,30,0.85)]"
            />
            <span>PRIVATE EDITION ROOM · {editionTitle}</span>
          </div>

          <h1 className="mt-5 font-syne text-4xl font-extrabold uppercase leading-[0.92] tracking-[-0.03em] text-[#F4F2ED] sm:text-6xl">
            {editionLabel} IS LOCKED
          </h1>

          <p className="mx-auto mt-5 max-w-md font-sans text-sm leading-relaxed text-[#8E8C87]">
            Enter your personal invitation code to unveil all {products.length}{" "}
            numbered silhouettes and reserve garments.
          </p>

          {mounted && waitlistPass ? (
            <div className="mx-auto mt-7 inline-flex items-center gap-4 border border-white/15 bg-[#0E0E11]/85 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] backdrop-blur-md">
              <span className="text-[#8E8C87]">QUEUE POSITION</span>
              <span className="text-[#F4F2ED] tabular-nums">
                #{String(waitlistPass.position).padStart(4, "0")}
              </span>
            </div>
          ) : null}

          <form onSubmit={handleUnlockSubmit} className="mt-10 space-y-6">
            <div>
              <label htmlFor="v11-invitation-code" className="sr-only">
                Invitation code
              </label>
              <input
                id="v11-invitation-code"
                suppressHydrationWarning
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (codeError) setCodeError("");
                }}
                placeholder="ENTER INVITATION CODE"
                autoComplete="off"
                spellCheck={false}
                className="w-full border-0 border-b border-white/25 bg-transparent pb-3.5 pt-2 text-center font-mono text-sm uppercase tracking-[0.28em] text-[#F4F2ED] placeholder:text-[#8E8C87]/60 focus:border-[#F4F2ED] focus:outline-none transition-colors"
              />
              {codeError ? (
                <p className="mt-3 font-mono text-[11px] text-[#C81E1E]">
                  {codeError}
                </p>
              ) : null}
            </div>

            <button
              suppressHydrationWarning
              type="submit"
              className="flex w-full cursor-pointer items-center justify-center gap-3 bg-[#F4F2ED] px-6 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#070709] transition-colors duration-300 hover:bg-[#C81E1E] hover:text-white"
            >
              <span>ENTER RELEASE</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-3 border-t border-white/10 pt-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8E8C87]">
              PREVIEW CODE:{" "}
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => {
                  setCode("KNITX-001");
                  setCodeError("");
                }}
                className="cursor-pointer text-[#F4F2ED] underline underline-offset-4 transition-colors hover:text-[#C81E1E]"
              >
                KNITX-001
              </button>
            </p>

            <Link
              href="/v11#v11-access"
              className="inline-flex items-center gap-1.5 font-sans text-xs text-[#8E8C87] transition-colors hover:text-[#F4F2ED]"
            >
              <span>Not on the list yet? Join the waitlist</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </motion.div>
      </section>
    );
  }

  // UNLOCKED STATE — OBSIDIAN LUXURY E-COMMERCE SHOWROOM
  return (
    <div className="min-h-screen bg-[#070709] text-[#F4F2ED]">
      {/* Header Band */}
      <header className="border-b border-white/10 bg-[#0A0A0D]">
        <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#8E8C87]">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-[#C81E1E] shadow-[0_0_8px_rgba(200,30,30,0.85)]"
                />
                <span>{editionLabel} · PRIVATE ACCESS ACTIVE</span>
              </div>

              <h1 className="mt-4 font-syne text-4xl font-extrabold uppercase leading-[0.94] tracking-[-0.03em] text-[#F4F2ED] sm:text-6xl">
                {editionTitle}
              </h1>

              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-[#8E8C87]">
                {products.length} NUMBERED SILHOUETTES · CUT TO ORDER
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/v11/releases"
                className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.03] px-5 py-3 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#F4F2ED] transition-colors hover:border-white/50 hover:bg-white/10"
              >
                <span>ALL RELEASES</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>

              <button
                suppressHydrationWarning
                type="button"
                onClick={lockVaultPreview}
                className="inline-flex cursor-pointer items-center gap-2 border border-white/15 bg-transparent px-5 py-3 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#8E8C87] transition-colors hover:border-white/40 hover:text-[#F4F2ED]"
              >
                <Lock className="h-3 w-3" />
                <span>LOCK ACCESS</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sticky Hairline Filter Bar */}
      <nav
        aria-label="Catalog filters"
        className="sticky top-16 z-20 border-b border-white/10 bg-[#070709]/90 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 overflow-x-auto px-5 sm:px-8 lg:px-12">
          <div className="flex shrink-0 items-center gap-7 sm:gap-9">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setActiveFilter(tab.key)}
                  className={cn(
                    "relative cursor-pointer whitespace-nowrap py-4 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors",
                    isActive
                      ? "text-[#F4F2ED]"
                      : "text-[#8E8C87] hover:text-white"
                  )}
                >
                  {tab.label}
                  {isActive ? (
                    <span className="absolute inset-x-0 bottom-0 h-[1.5px] bg-[#F4F2ED]" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8E8C87] lg:inline-block">
            SELECT ANY GARMENT TO INSPECT
          </span>
        </div>
      </nav>

      {/* Dark-Studio Showroom Grid */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map(({ product, originalIndex }) => {
              const isOneOfOne = product.tier === "one-of-one";
              const isSoldOut = product.remainingUnits <= 0;
              const imgSrc = getV10ProductImage(product, originalIndex, true);

              return (
                <button
                  key={product._id}
                  suppressHydrationWarning
                  type="button"
                  onClick={() => openGarmentDrawer(product, originalIndex)}
                  className="group block w-full cursor-pointer text-left focus:outline-none"
                >
                  {/* Tall Obsidian Studio Frame */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#0B0B0D]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgSrc}
                      alt={cleanV10Text(product.title)}
                      className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#070709]/80 to-transparent"
                    />

                    {/* Top Serial & Tier Stamp */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em]">
                      <span className="text-[#F4F2ED]/80">
                        {product.serialCode}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[#F4F2ED]">
                        {isOneOfOne ? (
                          <>
                            <span
                              aria-hidden="true"
                              className="h-1.5 w-1.5 rounded-full bg-[#C81E1E]"
                            />
                            <span>01/01</span>
                          </>
                        ) : product.isMystery ? (
                          <span className="border border-white/25 bg-[#070709]/70 px-2 py-0.5 text-[9px] tracking-[0.22em] backdrop-blur-sm">
                            UNVEILED
                          </span>
                        ) : (
                          <span className="text-[#8E8C87]">
                            {String(product.totalUnits).padStart(2, "0")} UNITS
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Minimalist Showroom Info */}
                  <div className="pt-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="font-syne text-lg font-bold uppercase leading-tight tracking-[-0.01em] text-[#F4F2ED] transition-colors group-hover:text-white sm:text-xl">
                        {cleanV10Text(product.title)}
                      </h2>
                      <span className="shrink-0 font-mono text-xs text-[#F4F2ED] tabular-nums">
                        {formatInr(product.priceInr)}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2.5 font-mono text-[10px] uppercase tracking-[0.18em]">
                      <span className="text-[#8E8C87]">
                        {product.gsmWeight}
                      </span>
                      <span
                        className={
                          isSoldOut ? "text-[#C81E1E]" : "text-[#8E8C87]"
                        }
                      >
                        {isSoldOut
                          ? "SOLD OUT"
                          : `${product.remainingUnits} OF ${product.totalUnits} LEFT`}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Full-Height Obsidian Garment Drawer */}
      <AnimatePresence>
        {selectedProduct ? (
          <>
            <motion.div
              key="v11-release-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
            />

            <motion.aside
              key="v11-release-drawer-panel"
              role="dialog"
              aria-modal="true"
              aria-label={cleanV10Text(selectedProduct.title)}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col overflow-y-auto border-l border-white/10 bg-[#0B0B0D] text-[#F4F2ED]"
            >
              {/* Sticky Top Bar */}
              <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#0B0B0D]/95 px-6 backdrop-blur-md sm:px-8">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8E8C87]">
                  {selectedProduct.serialCode} ·{" "}
                  {selectedProduct.tier === "one-of-one"
                    ? "ONE OF ONE COLLECTOR PIECE"
                    : "SMALL-BATCH EDITION"}
                </span>

                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  aria-label="Close garment drawer"
                  className="inline-flex cursor-pointer items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8E8C87] transition-colors hover:text-white"
                >
                  <span>CLOSE</span>
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Tall Garment Photograph */}
              <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-[#070709]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getV10ProductImage(selectedProduct, selectedIndex, true)}
                  alt={cleanV10Text(selectedProduct.title)}
                  className="h-full w-full object-cover object-center"
                />
              </div>

              {/* Drawer Content */}
              <div className="flex-1 space-y-8 p-6 sm:p-10">
                <div>
                  <div className="flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.22em]">
                    <span className="inline-flex items-center gap-2 text-[#F4F2ED]">
                      {selectedProduct.tier === "one-of-one" ? (
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 rounded-full bg-[#C81E1E]"
                        />
                      ) : null}
                      <span>
                        {selectedProduct.tier === "one-of-one"
                          ? "ONE OF ONE"
                          : `EDITION OF ${String(selectedProduct.totalUnits).padStart(2, "0")}`}
                      </span>
                    </span>
                    <span className="text-[#8E8C87]">{editionLabel}</span>
                  </div>

                  <h2 className="mt-3 font-syne text-3xl font-extrabold uppercase leading-[0.98] tracking-[-0.02em] text-[#F4F2ED] sm:text-4xl">
                    {cleanV10Text(selectedProduct.title)}
                  </h2>

                  <div className="mt-4 flex items-baseline justify-between gap-4 border-b border-white/10 pb-6 font-mono">
                    <span className="text-lg text-[#F4F2ED] tabular-nums">
                      {formatInr(selectedProduct.priceInr)}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] uppercase tracking-[0.18em]",
                        selectedProduct.remainingUnits <= 0
                          ? "text-[#C81E1E]"
                          : "text-[#8E8C87]"
                      )}
                    >
                      {selectedProduct.remainingUnits <= 0
                        ? "SOLD OUT"
                        : `${selectedProduct.remainingUnits} OF ${selectedProduct.totalUnits} AVAILABLE`}
                    </span>
                  </div>

                  <p className="mt-6 font-sans text-sm leading-relaxed text-[#8E8C87]">
                    {cleanV10Text(selectedProduct.description)}
                  </p>
                </div>

                {/* Fabric & GSM Specs */}
                <div className="divide-y divide-white/10 border-y border-white/10">
                  <div className="grid grid-cols-12 items-baseline gap-4 py-3.5">
                    <span className="col-span-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8E8C87]">
                      FABRIC
                    </span>
                    <span className="col-span-8 font-sans text-xs text-[#F4F2ED]">
                      {cleanV10Text(selectedProduct.fabric)}
                    </span>
                  </div>

                  <div className="grid grid-cols-12 items-baseline gap-4 py-3.5">
                    <span className="col-span-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8E8C87]">
                      WEIGHT
                    </span>
                    <span className="col-span-8 font-mono text-xs text-[#F4F2ED]">
                      {selectedProduct.gsmWeight}
                    </span>
                  </div>

                  <div className="grid grid-cols-12 items-baseline gap-4 py-3.5">
                    <span className="col-span-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8E8C87]">
                      STUDIO LEAD
                    </span>
                    <span className="col-span-8 font-mono text-xs text-[#F4F2ED]">
                      {selectedProduct.productionDays} Days
                    </span>
                  </div>

                  {selectedProduct.creatorCredit ? (
                    <div className="grid grid-cols-12 items-baseline gap-4 py-3.5">
                      <span className="col-span-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8E8C87]">
                        CREATOR
                      </span>
                      <span className="col-span-8 font-mono text-xs text-[#F4F2ED]">
                        {selectedProduct.creatorCredit}
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Craftsmanship List */}
                <div>
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8E8C87]">
                    CRAFTSMANSHIP
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {selectedProduct.craftsmanship.map((detail) => (
                      <li
                        key={detail}
                        className="flex items-start gap-3 font-sans text-xs leading-relaxed text-[#F4F2ED]/85"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-1.5 h-1 w-1 shrink-0 bg-[#C81E1E]"
                        />
                        <span>{cleanV10Text(detail)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Size Selection */}
                <div className="pt-1">
                  <div className="mb-3 flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8E8C87]">
                    <span>SELECT SIZE</span>
                    <span>CUT TO ORDER</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.sizes.map((size) => {
                      const isSelected = selectedSize === size;
                      return (
                        <button
                          key={size}
                          suppressHydrationWarning
                          type="button"
                          onClick={() => {
                            setSelectedSize(size);
                            if (bagFeedback) setBagFeedback("");
                          }}
                          className={cn(
                            "h-11 min-w-[52px] cursor-pointer border px-4 font-mono text-xs uppercase tracking-[0.14em] transition-colors",
                            isSelected
                              ? "border-[#F4F2ED] bg-[#F4F2ED] text-[#070709]"
                              : "border-white/15 bg-transparent text-[#F4F2ED] hover:border-white"
                          )}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {bagFeedback ? (
                  <p className="font-mono text-xs text-[#C81E1E]">
                    {bagFeedback}
                  </p>
                ) : null}

                {/* Primary Add to Bag Action */}
                <div className="space-y-3 pt-2">
                  <button
                    suppressHydrationWarning
                    type="button"
                    disabled={selectedProduct.remainingUnits <= 0}
                    onClick={handleAddToBag}
                    className="w-full cursor-pointer bg-[#F4F2ED] px-6 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#070709] transition-colors duration-300 hover:bg-[#C81E1E] hover:text-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[#8E8C87]"
                  >
                    {selectedProduct.remainingUnits > 0
                      ? `ADD TO BAG — ${formatInr(selectedProduct.priceInr)}`
                      : "EDITION CLAIMED — SOLD OUT"}
                  </button>

                  <p className="text-center font-mono text-[10px] uppercase tracking-[0.18em] text-[#8E8C87]">
                    INDIVIDUALLY NUMBERED · ZERO RESTOCKS ONCE CLAIMED
                  </p>
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
