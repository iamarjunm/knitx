"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Lock, Unlock, X } from "lucide-react";
import { useVault } from "@/context/VaultContext";
import { useStorefrontConfig } from "@/context/StorefrontConfigContext";
import {
  cleanFlagshipText,
  formatDropEditionLabel,
  getFlagshipProductImage,
} from "@/lib/flagship-media";
import type { DropCampaign, Product } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";

type CatalogFilter = "all" | "one-of-one" | "small-batch" | "unveiled";

export default function FlagshipDropsClient({
  drop,
  products,
}: {
  drop: DropCampaign;
  products: Product[];
}) {
  const { config } = useStorefrontConfig();
  const {
    isVaultUnlocked,
    waitlistPass,
    unlockVaultWithCode,
    lockVaultPreview,
    addToCart,
  } = useVault();

  const [mounted, setMounted] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<CatalogFilter>("all");
  const [selectedProduct, setSelectedProduct] = useState<{
    product: Product;
    index: number;
  } | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [bagNotice, setBagNotice] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedProduct(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [selectedProduct]);

  const showUnlocked = mounted && isVaultUnlocked;
  const showPass = mounted ? waitlistPass : null;
  const accentColor = config.accentColor || "#E11D2E";
  const masterCode = (config.masterAccessCode || "KNITX-001").trim();
  const gridColsClass =
    config.gridColumns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";
  const showAnnouncement =
    mounted &&
    config.announcementEnabled &&
    config.announcementText.trim().length > 0;

  const editionLabel = formatDropEditionLabel(
    config.activeDropNumber || drop.dropNumber
  );
  const cleanTitle = cleanFlagshipText(config.activeDropTitle || drop.title);

  const revealedPreview = useMemo(
    () =>
      products
        .map((product, index) => ({ product, index }))
        .filter(({ product }) => !product.isMystery)
        .slice(0, 5),
    [products]
  );

  const counts = useMemo(() => {
    const oneOfOne = products.filter((p) => p.tier === "one-of-one").length;
    const smallBatch = products.filter((p) => p.tier === "small-batch").length;
    const unveiled = products.filter((p) => p.isMystery).length;
    return {
      all: products.length,
      oneOfOne,
      smallBatch,
      unveiled,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .map((product, index) => ({ product, index }))
      .filter(({ product }) => {
        if (activeFilter === "one-of-one") return product.tier === "one-of-one";
        if (activeFilter === "small-batch") return product.tier === "small-batch";
        if (activeFilter === "unveiled") return product.isMystery;
        return true;
      });
  }, [products, activeFilter]);

  const handleUnlockSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCodeError(null);
    const ok = unlockVaultWithCode(codeInput);
    if (!ok) {
      setCodeError(
        "Access code not recognized. Please verify your invitation code."
      );
    }
  };

  const handleQuickUnlockCode = (code: string) => {
    setCodeInput(code);
    setCodeError(null);
    unlockVaultWithCode(code);
  };

  const openDetailDrawer = (product: Product, index: number) => {
    setSelectedProduct({ product, index });
    setSelectedSize(product.sizes[0] || "OS");
    setBagNotice(null);
  };

  const handleAddToBag = () => {
    if (!selectedProduct) return;
    const sizeToUse = selectedSize || selectedProduct.product.sizes[0] || "OS";
    const result = addToCart(selectedProduct.product, sizeToUse);
    if (!result.ok) {
      setBagNotice(
        cleanFlagshipText(result.message || "Unable to reserve this garment.")
      );
      return;
    }
    setBagNotice(null);
    setSelectedProduct(null);
  };

  // =========================================================================
  // LOCKED STATE: ULTRA-CLEAN PRIVATE DROP ACCESS GATE
  // =========================================================================
  if (!showUnlocked) {
    return (
      <section className="flex min-h-[calc(100svh-3.75rem)] flex-col justify-center bg-white px-4 py-14 text-black sm:px-8">
        <div className="mx-auto w-full max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#666666]">
            <span
              aria-hidden="true"
              style={{ backgroundColor: accentColor }}
              className="h-2 w-2 shrink-0"
            />
            <span>{editionLabel} · INVITATION ONLY</span>
          </div>

          <h1 className="mt-4 font-poster text-5xl leading-[0.9] tracking-[0.01em] text-black uppercase sm:text-7xl">
            {editionLabel} — PRIVATE ACCESS
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#666666]">
            Enter your personal drop code to unveil all {products.length}{" "}
            numbered silhouettes and reserve your size before the edition
            closes.
          </p>

          {/* 5 Live Revealed Preview Thumbnails */}
          {revealedPreview.length > 0 ? (
            <div className="mx-auto my-9 grid max-w-2xl grid-cols-5 gap-2 sm:gap-3">
              {revealedPreview.map(({ product, index }) => (
                <div key={product._id} className="space-y-1.5 text-left">
                  <div className="aspect-[3/4] w-full overflow-hidden bg-[#F4F4F5]">
                    <img
                      src={getFlagshipProductImage(product, index, false)}
                      alt={cleanFlagshipText(product.title)}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <p className="truncate font-mono text-[9px] uppercase tracking-[0.12em] text-[#666666]">
                    {product.serialCode}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {/* Crisp Bordered Black Access Gate Form */}
          <form
            onSubmit={handleUnlockSubmit}
            className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row"
          >
            <input
              suppressHydrationWarning
              type="text"
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value);
                if (codeError) setCodeError(null);
              }}
              placeholder="ENTER ACCESS CODE"
              aria-label="Enter access code"
              className="h-13 flex-1 border border-black bg-white px-4 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-black placeholder:text-neutral-400 focus:outline-none"
            />
            <button
              suppressHydrationWarning
              type="submit"
              className="h-13 shrink-0 cursor-pointer bg-black px-8 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-85"
            >
              ENTER DROP
            </button>
          </form>

          {codeError ? (
            <p
              style={{ color: accentColor }}
              className="mt-3 font-mono text-xs"
            >
              {codeError}
            </p>
          ) : null}

          {/* Helper Links & Preview Access */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[#666666]">
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => handleQuickUnlockCode(masterCode)}
              className="cursor-pointer text-black underline underline-offset-4 transition-opacity hover:opacity-65"
            >
              PREVIEW CODE: {masterCode}
            </button>

            {showPass?.accessCode ? (
              <>
                <span aria-hidden="true" className="text-neutral-300">
                  ·
                </span>
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => handleQuickUnlockCode(showPass.accessCode)}
                  style={{ color: accentColor }}
                  className="cursor-pointer underline underline-offset-4"
                >
                  USE PASS: {showPass.accessCode}
                </button>
              </>
            ) : null}

            <span aria-hidden="true" className="text-neutral-300">
              ·
            </span>

            <Link
              href="/#waitlist"
              className="inline-flex items-center gap-1 transition-colors hover:text-black"
            >
              <span>JOIN WAITLIST</span>
              <ArrowRight className="h-3 w-3" />
            </Link>

            {config.coreEnabled ? (
              <>
                <span aria-hidden="true" className="text-neutral-300">
                  ·
                </span>
                <Link
                  href="/core"
                  className="inline-flex items-center gap-1 transition-colors hover:text-black"
                >
                  <span>CORE WARDROBE</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  // =========================================================================
  // UNLOCKED STATE: PURE-WHITE SSENSE / BLUORNG FLAGSHIP DROP CATALOG
  // =========================================================================
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Crisp Drop Catalog Header */}
      <section className="border-b border-black/10 bg-white px-4 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#666666]">
              <Unlock style={{ color: accentColor }} className="h-3 w-3" />
              <span>{editionLabel} · PRIVATE ACCESS ACTIVE</span>
            </div>
            <h1 className="mt-2 font-poster text-4xl leading-[0.92] tracking-[0.01em] text-black uppercase sm:text-6xl">
              {cleanTitle}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/archive"
              className="inline-flex items-center gap-2 border border-black/20 px-5 py-2.5 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:border-black"
            >
              <span>ARCHIVE</span>
            </Link>
            {config.coreEnabled ? (
              <Link
                href="/core"
                className="inline-flex items-center gap-2 border border-black/20 px-5 py-2.5 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:border-black"
              >
                <span>CORE WARDROBE</span>
              </Link>
            ) : null}
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => lockVaultPreview()}
              className="inline-flex cursor-pointer items-center gap-2 border border-black bg-black px-5 py-2.5 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-85"
            >
              <Lock className="h-3 w-3" />
              <span>LOCK ACCESS</span>
            </button>
          </div>
        </div>
      </section>

      {/* Sticky Pure-White Filter Bar */}
      <div
        className={cn(
          "sticky z-30 border-b border-black/10 bg-white/95 backdrop-blur-md",
          showAnnouncement ? "top-[92px]" : "top-[60px]"
        )}
      >
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: "all", label: `ALL (${counts.all})` },
                { id: "one-of-one", label: `ONE OF ONE (${counts.oneOfOne})` },
                {
                  id: "small-batch",
                  label: `SMALL BATCH (${counts.smallBatch})`,
                },
                { id: "unveiled", label: `UNVEILED (${counts.unveiled})` },
              ] as const
            ).map((filter) => {
              const active = activeFilter === filter.id;
              return (
                <button
                  suppressHydrationWarning
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    "cursor-pointer px-3.5 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.16em] transition-colors",
                    active
                      ? "bg-black text-white"
                      : "bg-[#F4F4F5] text-[#666666] hover:bg-neutral-200 hover:text-black"
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-[#666666] sm:inline">
            {filteredProducts.length} PIECES SHOWN · ZERO RESTOCKS
          </span>
        </div>
      </div>

      {/* Edge-to-Edge Shoppable Grid (3 or 4 columns per Admin Config) */}
      <section className="mx-auto max-w-[1600px] px-4 py-10 sm:px-8 sm:py-14">
        <div
          className={cn(
            "grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 sm:gap-y-12",
            gridColsClass
          )}
        >
          {filteredProducts.map(({ product, index }) => {
            const imgSrc = getFlagshipProductImage(product, index, true);
            const title = cleanFlagshipText(product.title);

            return (
              <article key={product._id} className="group flex flex-col">
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => openDetailDrawer(product, index)}
                  className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden bg-[#F4F4F5] text-left focus:outline-none"
                >
                  <img
                    src={imgSrc}
                    alt={title}
                    className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />

                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {product.tier === "one-of-one" ? (
                      <span
                        style={{ backgroundColor: accentColor }}
                        className="px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white"
                      >
                        1 OF 1
                      </span>
                    ) : null}
                    {product.isMystery ? (
                      <span className="bg-black px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-white">
                        UNVEILED
                      </span>
                    ) : null}
                  </div>

                  {/* Desktop Hover Quick-Shop Bar */}
                  <div className="absolute inset-x-0 bottom-0 hidden translate-y-full bg-black/90 px-3 py-2.5 text-center font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-white transition-transform duration-200 group-hover:translate-y-0 sm:block">
                    SELECT SIZE · QUICK SHOP
                  </div>
                </button>

                <div className="mt-3 space-y-1">
                  <h2 className="truncate font-sans text-xs font-semibold uppercase tracking-[0.04em] text-black">
                    {title}
                  </h2>
                  <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-[#666666]">
                    <span className="font-medium text-black">
                      {formatInr(product.priceInr)}
                    </span>
                    {product.tier === "one-of-one" ? (
                      <span
                        style={{ color: accentColor }}
                        className="font-semibold"
                      >
                        {product.remainingUnits > 0 ? "1 OF 1" : "CLAIMED"}
                      </span>
                    ) : (
                      <span>
                        {product.remainingUnits}/{product.totalUnits} LEFT
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Full-Height Pure-White Product Detail Slide-Over */}
      <AnimatePresence>
        {selectedProduct ? (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            />

            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={cleanFlagshipText(selectedProduct.product.title)}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white text-black"
            >
              {/* Slide-Over Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white/95 px-6 py-4 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#666666]">
                    {selectedProduct.product.serialCode}
                  </span>
                  {selectedProduct.product.tier === "one-of-one" ? (
                    <span
                      style={{ backgroundColor: accentColor }}
                      className="px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white"
                    >
                      1 OF 1
                    </span>
                  ) : (
                    <span className="bg-[#F4F4F5] px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-700">
                      SMALL BATCH
                    </span>
                  )}
                </div>

                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  aria-label="Close product details"
                  className="cursor-pointer p-1 text-black transition-opacity hover:opacity-60"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Studio Image */}
              <div className="aspect-[4/5] w-full shrink-0 overflow-hidden bg-[#F4F4F5]">
                <img
                  src={getFlagshipProductImage(
                    selectedProduct.product,
                    selectedProduct.index,
                    true
                  )}
                  alt={cleanFlagshipText(selectedProduct.product.title)}
                  className="h-full w-full object-cover object-center"
                />
              </div>

              {/* Details & Size Selector */}
              <div className="flex flex-1 flex-col gap-6 p-6">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="font-syne text-xl font-extrabold uppercase tracking-[-0.01em] text-black">
                      {cleanFlagshipText(selectedProduct.product.title)}
                    </h2>
                    <span className="shrink-0 font-mono text-base font-semibold text-black">
                      {formatInr(selectedProduct.product.priceInr)}
                    </span>
                  </div>

                  {selectedProduct.product.creatorCredit ? (
                    <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#666666]">
                      DESIGN CREDIT ·{" "}
                      {cleanFlagshipText(selectedProduct.product.creatorCredit)}
                    </p>
                  ) : null}

                  <p className="mt-3 text-sm leading-relaxed text-[#666666]">
                    {cleanFlagshipText(selectedProduct.product.description)}
                  </p>
                </div>

                {/* Spec Strip */}
                <div className="grid grid-cols-3 gap-3 border-y border-black/10 py-4 font-mono text-[10px] uppercase tracking-[0.14em]">
                  <div>
                    <span className="block text-[#666666]">WEIGHT</span>
                    <span className="mt-1 block font-semibold text-black">
                      {selectedProduct.product.gsmWeight}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[#666666]">AVAILABILITY</span>
                    <span className="mt-1 block font-semibold text-black">
                      {selectedProduct.product.remainingUnits} OF{" "}
                      {selectedProduct.product.totalUnits} LEFT
                    </span>
                  </div>
                  <div>
                    <span className="block text-[#666666]">LEAD TIME</span>
                    <span className="mt-1 block font-semibold text-black">
                      {selectedProduct.product.productionDays} DAYS
                    </span>
                  </div>
                </div>

                {/* Fabrication & Craftsmanship */}
                <div>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666]">
                    FABRIC &amp; FINISH
                  </span>
                  <p className="mt-1 text-xs font-semibold text-black">
                    {cleanFlagshipText(selectedProduct.product.fabric)}
                  </p>
                  {selectedProduct.product.craftsmanship.length > 0 ? (
                    <ul className="mt-2.5 flex flex-wrap gap-1.5">
                      {selectedProduct.product.craftsmanship.map((item) => (
                        <li
                          key={item}
                          className="bg-[#F4F4F5] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-neutral-700"
                        >
                          {cleanFlagshipText(item)}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                {/* Size Boxes */}
                <div>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666]">
                    SELECT SIZE
                  </span>
                  <div className="mt-2.5 grid grid-cols-4 gap-2">
                    {selectedProduct.product.sizes.map((size) => {
                      const active = selectedSize === size;
                      return (
                        <button
                          suppressHydrationWarning
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={cn(
                            "h-11 cursor-pointer border font-mono text-xs font-semibold uppercase transition-colors",
                            active
                              ? "border-black bg-black text-white"
                              : "border-black/20 bg-white text-black hover:border-black"
                          )}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {bagNotice ? (
                  <p
                    style={{ color: accentColor }}
                    className="font-mono text-xs"
                  >
                    {bagNotice}
                  </p>
                ) : null}

                {/* Add to Bag Button */}
                <div className="mt-auto pt-2">
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={handleAddToBag}
                    disabled={selectedProduct.product.remainingUnits <= 0}
                    className="w-full cursor-pointer bg-black py-4 font-sans text-xs font-bold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:bg-neutral-300"
                  >
                    {selectedProduct.product.remainingUnits <= 0
                      ? "SOLD OUT"
                      : `ADD TO BAG — ${formatInr(selectedProduct.product.priceInr)}`}
                  </button>
                </div>
              </div>
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
