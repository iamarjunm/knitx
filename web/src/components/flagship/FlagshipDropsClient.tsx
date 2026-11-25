"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Unlock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
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
  const { user, setAuthModalOpen } = useAuth();
  const { config } = useStorefrontConfig();
  const {
    isVaultUnlocked,
    waitlistPass,
    unlockVaultDemo,
    lockVaultPreview,
  } = useVault();

  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<CatalogFilter>("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  const showUnlocked = mounted && isVaultUnlocked;
  const isDropLive =
    (mounted && config.dropPhase === "live") || drop.phase === "live";
  const canOpenDropProducts = showUnlocked || isDropLive;
  const showUser = mounted ? user : null;
  const showPass = mounted ? waitlistPass : null;
  const accentColor = config.accentColor || "#E11D2E";
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
        .filter(({ product }) => !product.isMystery),
    [products]
  );

  const revealedCount = revealedPreview.length;
  const veiledCount = Math.max(0, products.length - revealedCount);
  const previewThumbs = revealedPreview.slice(0, 5);
  const useMobileSwipeStrip = previewThumbs.length >= 4;
  const previewGridCols =
    previewThumbs.length <= 2
      ? "grid grid-cols-2 max-w-sm"
      : previewThumbs.length === 3
        ? "grid grid-cols-3 max-w-lg"
        : previewThumbs.length === 4
          ? "no-scrollbar -mx-4 flex flex-nowrap overflow-x-auto px-4 snap-x snap-mandatory sm:mx-auto sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 max-w-xl"
          : "no-scrollbar -mx-4 flex flex-nowrap overflow-x-auto px-4 snap-x snap-mandatory sm:mx-auto sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0 max-w-2xl";

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

  // =========================================================================
  // LOCKED STATE: ULTRA-CLEAN ACCOUNT-BASED PRIVATE DROP ACCESS GATE
  // =========================================================================
  if (!canOpenDropProducts) {
    const memberEmail = showUser?.email || showPass?.email || "";
    const isQueuedOrSignedIn = Boolean(showUser || showPass);

    return (
      <section className="flex min-h-[calc(100svh-3.75rem)] flex-col justify-center bg-white px-4 py-10 text-black sm:px-8 sm:py-14">
        <div className="mx-auto w-full max-w-3xl text-center">
          <div className="inline-flex items-center justify-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666] sm:tracking-[0.22em]">
            <span
              aria-hidden="true"
              style={{ backgroundColor: accentColor }}
              className="h-2 w-2 shrink-0"
            />
            <span>{editionLabel} · ACCOUNT-BASED PRIVATE ACCESS</span>
          </div>

          <h1 className="mt-4 font-poster text-4xl leading-[0.92] tracking-[0.01em] text-black uppercase break-words sm:text-6xl lg:text-7xl">
            {editionLabel} — PRIVATE ACCESS
          </h1>

          <p className="mx-auto mt-3.5 max-w-lg text-sm leading-relaxed text-[#666666] sm:mt-4">
            Publicly released designs are previewed below. Full product pages
            and veiled silhouettes unlock automatically once your account
            receives drop access or the drop goes live.
          </p>

          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#666666] sm:tracking-[0.18em]">
            {products.length} PIECES · {revealedCount} PREVIEWED · {veiledCount}{" "}
            VEILED
          </p>

          {/* Publicly Previewed Design Cards (Visual Preview Only — Product Pages Locked) */}
          {previewThumbs.length > 0 ? (
            <div
              className={cn(
                "mx-auto my-7 gap-2.5 sm:my-9 sm:gap-3",
                previewGridCols
              )}
            >
              {previewThumbs.map(({ product, index }) => (
                <div
                  key={product._id}
                  className={cn(
                    "space-y-1.5 text-left",
                    useMobileSwipeStrip
                      ? "w-[36%] min-w-[116px] shrink-0 snap-start sm:w-auto sm:min-w-0"
                      : ""
                  )}
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F4F4F5]">
                    <img
                      src={getFlagshipProductImage(product, index, false)}
                      alt={cleanFlagshipText(product.title)}
                      className="h-full w-full object-cover object-center"
                    />
                    <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 bg-white/92 px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-black">
                      <Lock className="h-2 w-2" />
                      <span>PREVIEW</span>
                    </span>
                  </div>
                  <p className="truncate font-sans text-[10px] font-semibold uppercase tracking-[0.04em] text-black">
                    {cleanFlagshipText(product.title)}
                  </p>
                  <div className="flex items-center justify-between gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#666666]">
                    <span>{product.serialCode}</span>
                    <span className="font-medium text-black tabular-nums">
                      {formatInr(product.priceInr)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Account-Based Private Access Gate */}
          {!isQueuedOrSignedIn ? (
            <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="min-h-[48px] flex-1 cursor-pointer bg-black px-6 py-3.5 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-85 sm:h-13 sm:px-7 sm:tracking-[0.2em]"
              >
                SIGN IN TO CHECK ACCESS
              </button>
              <Link
                href="/#waitlist"
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 border border-black bg-white px-6 py-3.5 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-black hover:text-white sm:h-13 sm:px-7 sm:tracking-[0.2em]"
              >
                <span>JOIN THE WAITLIST</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="mx-auto max-w-lg border border-black/15 bg-[#F4F4F5] p-5 text-left sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-3.5">
                <div className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-black">
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: accentColor }}
                    className="h-2 w-2 shrink-0"
                  />
                  <span>ACCOUNT QUEUED</span>
                </div>
                {showPass ? (
                  <span className="font-mono text-xs font-bold tracking-[0.14em] text-black">
                    #{String(showPass.position).padStart(4, "0")}
                  </span>
                ) : null}
              </div>

              {memberEmail ? (
                <p className="mt-3.5 break-all font-mono text-xs font-semibold text-black">
                  {memberEmail}
                </p>
              ) : null}

              <p className="mt-2 text-sm leading-relaxed text-[#666666]">
                Your account is on the waitlist. As soon as your account is
                granted access, this drop unlocks automatically—no access code
                required.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                {!showUser ? (
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="cursor-pointer font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-black underline underline-offset-4 transition-opacity hover:opacity-70"
                  >
                    SIGN IN TO SYNC ACCOUNT
                  </button>
                ) : !showPass ? (
                  <Link
                    href="/#waitlist"
                    className="inline-flex items-center gap-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-black underline underline-offset-4 transition-opacity hover:opacity-70"
                  >
                    <span>JOIN THE WAITLIST</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : null}
              </div>
            </div>
          )}

          {/* Subtle Navigation Links */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[#666666]">
            {config.coreEnabled ? (
              <Link
                href="/core"
                className="inline-flex items-center gap-1 transition-colors hover:text-black"
              >
                <span>CORE WARDROBE</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            ) : null}

            {config.coreEnabled ? (
              <span aria-hidden="true" className="text-neutral-300">
                ·
              </span>
            ) : null}

            <Link
              href="/archive"
              className="inline-flex items-center gap-1 transition-colors hover:text-black"
            >
              <span>EDITIONS ARCHIVE</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Whisper-Quiet Founder / Demo Local Preview Trigger */}
          <div className="mt-10 border-t border-black/10 pt-5">
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => unlockVaultDemo()}
              className="cursor-pointer font-mono text-[10px] tracking-[0.14em] text-neutral-400 underline-offset-4 transition-colors hover:text-black hover:underline"
            >
              Preview Unlocked Drop
            </button>
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
      <section className="border-b border-black/10 bg-white px-4 py-8 sm:px-8 sm:py-14">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-5 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#666666] sm:tracking-[0.22em]">
              <Unlock style={{ color: accentColor }} className="h-3 w-3 shrink-0" />
              <span>
                {editionLabel} ·{" "}
                {isDropLive && !showUnlocked
                  ? "DROP RELEASE LIVE"
                  : "PRIVATE ACCESS ACTIVE"}
              </span>
            </div>
            <h1 className="mt-2 font-poster text-4xl leading-[0.92] tracking-[0.01em] text-black uppercase break-words sm:text-6xl">
              {cleanTitle}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              href="/archive"
              className="inline-flex min-h-[40px] items-center gap-2 border border-black/20 px-4 py-2 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:border-black sm:px-5 sm:py-2.5"
            >
              <span>ARCHIVE</span>
            </Link>
            {config.coreEnabled ? (
              <Link
                href="/core"
                className="inline-flex min-h-[40px] items-center gap-2 border border-black/20 px-4 py-2 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:border-black sm:px-5 sm:py-2.5"
              >
                <span>CORE WARDROBE</span>
              </Link>
            ) : null}
            {showUnlocked ? (
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => lockVaultPreview()}
                className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 border border-black bg-black px-4 py-2 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-85 sm:px-5 sm:py-2.5"
              >
                <Lock className="h-3 w-3" />
                <span>LOCK ACCESS</span>
              </button>
            ) : null}
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
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 py-3 sm:px-8 sm:py-3.5">
          <div className="no-scrollbar flex w-full flex-nowrap items-center gap-2 overflow-x-auto px-4 sm:w-auto sm:px-0">
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
                    "min-h-[36px] shrink-0 cursor-pointer whitespace-nowrap px-3.5 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.16em] transition-colors",
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

          <span className="hidden shrink-0 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] text-[#666666] sm:inline">
            {filteredProducts.length} PIECES SHOWN · ZERO RESTOCKS
          </span>
        </div>
      </div>

      {/* Edge-to-Edge Shoppable Grid (3 or 4 columns per Admin Config) */}
      <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-8 sm:py-14">
        <div
          className={cn(
            "grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-12",
            gridColsClass
          )}
        >
          {filteredProducts.map(({ product, index }) => {
            const imgSrc = getFlagshipProductImage(product, index, true);
            const title = cleanFlagshipText(product.title);

            return (
              <article key={product._id} className="group flex flex-col">
                <Link
                  href={`/product/${product.slug}`}
                  className="flex flex-col text-left focus:outline-none"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F4F4F5]">
                    <img
                      src={imgSrc}
                      alt={title}
                      className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />

                    <div className="absolute top-2 left-2 flex flex-wrap gap-1 sm:top-3 sm:left-3 sm:gap-1.5">
                      {product.tier === "one-of-one" ? (
                        <span
                          style={{ backgroundColor: accentColor }}
                          className="px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white sm:px-2 sm:tracking-[0.16em]"
                        >
                          1 OF 1
                        </span>
                      ) : null}
                      {product.isMystery ? (
                        <span className="bg-black px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-white sm:px-2 sm:tracking-[0.16em]">
                          UNVEILED
                        </span>
                      ) : null}
                    </div>

                    {/* Desktop Hover Bar */}
                    <div className="absolute inset-x-0 bottom-0 hidden translate-y-full bg-black/90 px-3 py-2.5 text-center font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-white transition-transform duration-200 group-hover:translate-y-0 sm:block">
                      VIEW PRODUCT · SELECT SIZE
                    </div>
                  </div>

                  <div className="mt-2.5 space-y-1 sm:mt-3">
                    <h2 className="truncate font-sans text-[11px] font-semibold uppercase tracking-[0.03em] text-black sm:text-xs sm:tracking-[0.04em]">
                      {title}
                    </h2>
                    <div className="flex items-center justify-between gap-1.5 font-mono text-[10px] text-[#666666] sm:gap-2 sm:text-[11px]">
                      <span className="shrink-0 font-medium text-black tabular-nums">
                        {formatInr(product.priceInr)}
                      </span>
                      {product.tier === "one-of-one" ? (
                        <span
                          style={{ color: accentColor }}
                          className="shrink-0 whitespace-nowrap font-semibold"
                        >
                          {product.remainingUnits > 0 ? "1 OF 1" : "CLAIMED"}
                        </span>
                      ) : (
                        <span className="shrink-0 whitespace-nowrap">
                          {product.remainingUnits}/{product.totalUnits} LEFT
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
