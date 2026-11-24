"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check, Lock, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import {
  V10_MEDIA,
  cleanV10Text,
  formatEditionLabel,
  getV10ProductImage,
} from "@/components/v10/v10-media";
import type { DropCampaign, Product } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";

type LookbookFilter = "all" | "revealed" | "veiled" | "one-of-one";

interface CountdownParts {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

function computeCountdown(targetIso: string): CountdownParts {
  const parsed = Date.parse(targetIso);
  const now = Date.now();
  // Keep a live ticking window even if the sample campaign date has elapsed
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

export default function V12HomeClient({
  drop,
  products,
  candidateCount,
}: {
  drop: DropCampaign;
  products: Product[];
  candidateCount: number;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    waitlistPass,
    isVaultUnlocked,
    joinWaitlist,
    unlockVaultWithCode,
    addToCart,
  } = useVault();

  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState<CountdownParts | null>(null);
  const [activeFilter, setActiveFilter] = useState<LookbookFilter>("all");

  // Quick-shop slide-over state
  const [selectedProduct, setSelectedProduct] = useState<{
    product: Product;
    index: number;
  } | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [bagNotice, setBagNotice] = useState<string | null>(null);

  // Waitlist & invitation access code state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [showCodeBar, setShowCodeBar] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [accessCodeError, setAccessCodeError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setCountdown(computeCountdown(drop.launchDate));
    const timer = window.setInterval(() => {
      setCountdown(computeCountdown(drop.launchDate));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mounted, drop.launchDate]);

  useEffect(() => {
    if (mounted && user) {
      setFullName((prev) => prev || user.displayName || "");
      setEmail((prev) => prev || user.email || "");
    }
  }, [mounted, user]);

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
  const editionLabel = formatEditionLabel(drop.dropNumber);
  const cleanTitle = cleanV10Text(drop.title);

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

  const openQuickShop = (product: Product, index: number) => {
    const isVeiled = product.isMystery && !showUnlocked;
    if (isVeiled) {
      router.push("/v12/release");
      return;
    }
    setSelectedProduct({ product, index });
    setSelectedSize(product.sizes[0] || "OS");
    setBagNotice(null);
  };

  const handleQuickAddToBag = () => {
    if (!selectedProduct) return;
    const sizeToUse = selectedSize || selectedProduct.product.sizes[0] || "OS";
    const result = addToCart(selectedProduct.product, sizeToUse);
    if (!result.ok) {
      setBagNotice(
        cleanV10Text(result.message || "Unable to reserve this garment.")
      );
      return;
    }
    setBagNotice(null);
    setSelectedProduct(null);
  };

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
      setWaitlistError(cleanV10Text(msg));
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  const handleAccessCodeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccessCodeError(null);
    const ok = unlockVaultWithCode(accessCodeInput);
    if (!ok) {
      setAccessCodeError("Invalid access code. Check your invitation or use preview.");
      return;
    }
    router.push("/v12/release");
  };

  const handlePreviewCodeClick = () => {
    setAccessCodeInput("KNITX-001");
    setAccessCodeError(null);
    const ok = unlockVaultWithCode("KNITX-001");
    if (ok) {
      router.push("/v12/release");
    }
  };

  return (
    <div className="bg-white text-black">
      {/* ===================================================================== */}
      {/* ACT 1: FULL-VIEWPORT 100SVH EDGE-TO-EDGE CAMPAIGN HERO                */}
      {/* ===================================================================== */}
      <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-black">
        <img
          src={V10_MEDIA.heroCampaign}
          alt={cleanTitle}
          className="h-full w-full object-cover object-center"
        />

        {/* Cinematic Gradient Overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/35"
        />

        {/* Bottom Flagship Overlay */}
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-8 px-4 pb-10 sm:px-8 sm:pb-14 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-white/90">
                <span aria-hidden="true" className="h-2 w-2 bg-[#E11D2E]" />
                <span>
                  {editionLabel} · LIMITED TO 1–4 UNITS PER DESIGN
                </span>
              </div>

              <h1 className="mt-3 font-poster text-6xl leading-[0.86] tracking-[0.01em] text-white uppercase sm:text-8xl lg:text-[112px]">
                {cleanTitle}
              </h1>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                {showUnlocked ? (
                  <Link
                    href="/v12/release"
                    className="inline-flex items-center gap-2.5 bg-white px-7 py-3.5 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-[#E11D2E] hover:text-white"
                  >
                    <span>SHOP RELEASE</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <a
                    href="#v12-waitlist"
                    className="inline-flex items-center gap-2.5 bg-white px-7 py-3.5 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-[#E11D2E] hover:text-white"
                  >
                    <span>JOIN WAITLIST</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}

                <Link
                  href="/v12/release"
                  className="inline-flex items-center gap-2 border border-white/80 bg-black/20 px-7 py-3.5 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-black"
                >
                  <span>ENTER RELEASE</span>
                </Link>
              </div>
            </div>

            {/* Minimalist Right-Aligned Live Countdown */}
            <div className="flex flex-col items-start lg:items-end">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-white/70">
                NEXT RELEASE WINDOW
              </span>
              <div
                aria-label="Countdown to next release window"
                className="mt-2 font-mono text-2xl font-semibold tracking-[0.12em] text-white tabular-nums sm:text-3xl"
              >
                {countdown
                  ? `${countdown.days} : ${countdown.hours} : ${countdown.minutes} : ${countdown.seconds}`
                  : "-- : -- : -- : --"}
              </div>
              <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.24em] text-white/55">
                DD · HH · MM · SS
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* ACT 2: PURE WHITE 4-COLUMN SHOPPABLE LOOKBOOK GRID                    */}
      {/* ===================================================================== */}
      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
          {/* Clean Top Bar */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-5">
            <div className="flex items-baseline gap-3">
              <h2 className="font-syne text-xl font-extrabold uppercase tracking-[-0.01em] text-black sm:text-2xl">
                CURRENT RELEASE
              </h2>
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-neutral-500">
                ({products.length} PIECES)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {(
                [
                  { id: "all", label: "ALL" },
                  { id: "revealed", label: "REVEALED" },
                  { id: "veiled", label: "UNVEILED ON ENTRY" },
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
                      "cursor-pointer px-3.5 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.16em] transition-colors",
                      isSelected
                        ? "bg-black text-white"
                        : "bg-[#F4F4F5] text-neutral-600 hover:bg-neutral-200 hover:text-black"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}

              <Link
                href="/v12/release"
                className="ml-1 inline-flex items-center gap-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:text-[#E11D2E]"
              >
                <span>VIEW ALL</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Edge-to-Edge 4-Column SSENSE-Style Lookbook Grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 sm:gap-y-12 lg:grid-cols-4">
            {filteredProducts.map(({ product, index }) => {
              const isVeiled = product.isMystery && !showUnlocked;
              const imgSrc = getV10ProductImage(product, index, showUnlocked);
              const displayName = isVeiled
                ? `VEILED SILHOUETTE ${String(index + 1).padStart(2, "0")}`
                : cleanV10Text(product.title);

              return (
                <article key={product._id} className="group flex flex-col">
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => openQuickShop(product, index)}
                    className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden bg-[#F4F4F5] text-left focus:outline-none"
                  >
                    <img
                      src={imgSrc}
                      alt={displayName}
                      className={cn(
                        "h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]",
                        isVeiled ? "brightness-90 contrast-105" : ""
                      )}
                    />

                    {/* Minimal Corner Indicator */}
                    {product.tier === "one-of-one" && !isVeiled ? (
                      <span className="absolute top-3 left-3 bg-[#E11D2E] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white">
                        1 OF 1
                      </span>
                    ) : isVeiled ? (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-black/85 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-white">
                        <Lock className="h-2.5 w-2.5" />
                        <span>VEILED</span>
                      </span>
                    ) : null}

                    {/* Desktop Bottom Hover Strip */}
                    <div className="absolute inset-x-0 bottom-0 hidden translate-y-full bg-black/90 px-3 py-2.5 text-center font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-white transition-transform duration-200 group-hover:translate-y-0 sm:block">
                      {isVeiled ? "PRIVATE ACCESS REQUIRED" : "QUICK VIEW"}
                    </div>
                  </button>

                  {/* Ultra-Clean 2-Line SSENSE Metadata */}
                  <div className="mt-3 space-y-1">
                    <h3 className="truncate font-sans text-xs font-semibold uppercase tracking-[0.04em] text-black">
                      {displayName}
                    </h3>
                    <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-neutral-500">
                      <span>
                        {isVeiled ? "PRIVATE" : formatInr(product.priceInr)}
                      </span>
                      {product.tier === "one-of-one" ? (
                        <span className="font-semibold text-[#E11D2E]">
                          1 OF 1
                        </span>
                      ) : (
                        <span>{product.totalUnits} UNITS</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* ACT 3: FULL-BLEED 50/50 EDITORIAL CAMPAIGN DIPTYCH                    */}
      {/* ===================================================================== */}
      <section className="grid grid-cols-1 gap-[2px] bg-white md:grid-cols-2">
        {/* Left: ONE OF ONE */}
        <Link
          href="/v12/release"
          className="group relative flex min-h-[68vh] w-full items-end overflow-hidden bg-black"
        >
          <img
            src={V10_MEDIA.bomber1of1}
            alt="KNITX One of One Archival Garment"
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"
          />
          <div className="relative z-10 w-full p-6 sm:p-10 lg:p-12">
            <span className="inline-block bg-[#E11D2E] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white">
              ARCHIVAL TIER
            </span>
            <h2 className="mt-3 font-poster text-5xl leading-[0.88] tracking-[0.01em] text-white uppercase sm:text-6xl lg:text-7xl">
              ONE OF ONE
            </h2>
            <p className="mt-2.5 max-w-sm text-sm text-white/80">
              Only one exists worldwide. Never remade.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-white underline underline-offset-4 transition-colors group-hover:text-[#E11D2E]">
              <span>EXPLORE 1-OF-1S</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>

        {/* Right: SMALL BATCH */}
        <Link
          href="/v12/release"
          className="group relative flex min-h-[68vh] w-full items-end overflow-hidden bg-black"
        >
          <img
            src={V10_MEDIA.chainStitchTee}
            alt="KNITX Small Batch Numbered Garment"
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"
          />
          <div className="relative z-10 w-full p-6 sm:p-10 lg:p-12">
            <span className="inline-block border border-white/50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
              NUMBERED EDITION
            </span>
            <h2 className="mt-3 font-poster text-5xl leading-[0.88] tracking-[0.01em] text-white uppercase sm:text-6xl lg:text-7xl">
              SMALL BATCH
            </h2>
            <p className="mt-2.5 max-w-sm text-sm text-white/80">
              3–4 units per design. Heavyweight Indian cotton.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-white underline underline-offset-4 transition-colors group-hover:text-[#E11D2E]">
              <span>EXPLORE SMALL BATCH</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>
      </section>

      {/* ===================================================================== */}
      {/* ACT 4: BOLD ARCHITECTURAL ATELIER FEATURE                             */}
      {/* ===================================================================== */}
      <section className="bg-[#F4F4F5] py-16 sm:py-24">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                THE KNITX ATELIER STANDARD
              </span>
              <h2 className="mt-3 max-w-4xl font-syne text-3xl leading-[0.98] font-extrabold tracking-[-0.02em] text-black uppercase sm:text-5xl lg:text-6xl">
                ONE SAMPLE SHOT. CUT ONLY WHEN CLAIMED.
              </h2>
            </div>

            <Link
              href="/v12/atelier"
              className="inline-flex shrink-0 items-center gap-2 border border-black px-6 py-3.5 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-black hover:text-white"
            >
              <span>INSIDE THE ATELIER</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Crisp 21:9 Atelier Photograph */}
          <div className="mt-8 aspect-[16/9] w-full overflow-hidden bg-black sm:mt-12 sm:aspect-[21/9]">
            <img
              src={V10_MEDIA.atelierCuttingTable}
              alt="KNITX Atelier 01/01 Cutting Table"
              className="h-full w-full object-cover object-center"
            />
          </div>

          {/* 3 Razor-Clean Metric Columns */}
          <div className="mt-8 grid grid-cols-1 gap-8 border-t border-black/15 pt-8 sm:mt-10 sm:grid-cols-3">
            <div>
              <p className="font-poster text-4xl tracking-[0.02em] text-black uppercase sm:text-5xl">
                0% DEADSTOCK
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                Zero overproduction. Every garment is cut after it is claimed.
              </p>
            </div>
            <div>
              <p className="font-poster text-4xl tracking-[0.02em] text-black uppercase sm:text-5xl">
                1–4 UNITS / DESIGN
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                Individually numbered labels. Patterns retire permanently on sellout.
              </p>
            </div>
            <div>
              <p className="font-poster text-4xl tracking-[0.02em] text-black uppercase sm:text-5xl">
                310–520 GSM
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                Heavyweight Indian cotton jersey, double-weave twill, and hand-finished knits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* ACT 5: ULTRA-CLEAN WAITLIST & INVITATION BAR                          */}
      {/* ===================================================================== */}
      <section
        id="v12-waitlist"
        className="scroll-mt-20 border-t border-black/10 bg-white py-16 sm:py-24"
      >
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            {/* Left Copy */}
            <div className="lg:col-span-5">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#E11D2E]">
                {editionLabel} · PRIVATE ACCESS QUEUE
              </span>
              <h2 className="mt-2 font-syne text-3xl font-extrabold uppercase tracking-[-0.02em] text-black sm:text-4xl">
                JOIN THE WAITLIST.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-600">
                Get notified when your number is called to unlock current &amp;
                future releases.
              </p>
            </div>

            {/* Right Interactive Waitlist or Serial Queue Ticket */}
            <div className="lg:col-span-7">
              {mounted && showPass ? (
                <div className="flex flex-col justify-between gap-6 bg-black p-6 text-white sm:flex-row sm:items-center sm:p-8">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/65">
                      <Check className="h-3.5 w-3.5 text-[#E11D2E]" />
                      <span>WAITLIST PASS CONFIRMED</span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-4">
                      <span className="font-poster text-4xl tracking-[0.04em] text-white sm:text-5xl">
                        #{String(showPass.position).padStart(4, "0")}
                      </span>
                      <span className="font-sans text-sm font-semibold uppercase tracking-[0.08em] text-white/85">
                        {showPass.name}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/60">
                      ACCESS CODE: {showPass.accessCode}
                    </p>
                  </div>

                  <Link
                    href="/v12/release"
                    className="inline-flex shrink-0 items-center justify-center gap-2 bg-white px-7 py-4 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-[#E11D2E] hover:text-white"
                  >
                    <span>ENTER RELEASE</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
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
                    className="h-12 flex-1 border border-black/25 bg-white px-4 font-sans text-xs font-medium tracking-[0.08em] text-black placeholder:text-neutral-400 focus:border-black focus:outline-none"
                  />
                  <input
                    suppressHydrationWarning
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="EMAIL ADDRESS"
                    aria-label="Email address"
                    className="h-12 flex-1 border border-black/25 bg-white px-4 font-sans text-xs font-medium tracking-[0.08em] text-black placeholder:text-neutral-400 focus:border-black focus:outline-none"
                  />
                  <button
                    suppressHydrationWarning
                    type="submit"
                    disabled={waitlistSubmitting}
                    className="h-12 shrink-0 cursor-pointer bg-black px-8 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#E11D2E] disabled:opacity-60"
                  >
                    {waitlistSubmitting ? "JOINING..." : "JOIN"}
                  </button>
                </form>
              )}

              {waitlistError ? (
                <p className="mt-2.5 font-mono text-[11px] text-[#E11D2E]">
                  {waitlistError}
                </p>
              ) : null}

              {/* Discreet Access Code Toggle */}
              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => setShowCodeBar((prev) => !prev)}
                    className="cursor-pointer font-sans text-xs font-semibold uppercase tracking-[0.14em] text-neutral-600 underline underline-offset-4 transition-colors hover:text-black"
                  >
                    Have an access code?
                  </button>
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={handlePreviewCodeClick}
                    className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-400 transition-colors hover:text-[#E11D2E]"
                  >
                    Preview: KNITX-001
                  </button>
                </div>

                <AnimatePresence>
                  {showCodeBar ? (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleAccessCodeSubmit}
                      className="mt-3 overflow-hidden"
                    >
                      <div className="flex flex-col gap-2.5 sm:flex-row">
                        <input
                          suppressHydrationWarning
                          type="text"
                          value={accessCodeInput}
                          onChange={(e) => setAccessCodeInput(e.target.value)}
                          placeholder="ENTER INVITATION CODE"
                          aria-label="Enter invitation code"
                          className="h-11 flex-1 border border-black bg-white px-4 font-mono text-xs uppercase tracking-[0.16em] text-black placeholder:text-neutral-400 focus:outline-none"
                        />
                        <button
                          suppressHydrationWarning
                          type="submit"
                          className="h-11 shrink-0 cursor-pointer bg-black px-6 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#E11D2E]"
                        >
                          ENTER RELEASE
                        </button>
                      </div>
                      {accessCodeError ? (
                        <p className="mt-2 font-mono text-[11px] text-[#E11D2E]">
                          {accessCodeError}
                        </p>
                      ) : null}
                    </motion.form>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* ACT 6: FULL-BLEED 50/50 COMMUNITY CO-CREATION BANNER + ARCHIVE STRIP  */}
      {/* ===================================================================== */}
      <section className="bg-white">
        <div className="grid grid-cols-1 gap-[2px] bg-white md:grid-cols-2">
          {/* Vote Next Release */}
          <Link
            href="/v12/vote"
            className="group relative flex min-h-[48vh] w-full items-end overflow-hidden bg-black"
          >
            <img
              src={V10_MEDIA.knit1of1}
              alt="Vote on upcoming KNITX release silhouettes"
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/15"
            />
            <div className="relative z-10 w-full p-6 sm:p-10">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
                COMMUNITY BALLOT · {candidateCount} SHORTLISTED CONCEPTS
              </span>
              <h2 className="mt-2 font-poster text-4xl leading-[0.9] text-white uppercase sm:text-5xl">
                VOTE NEXT RELEASE
              </h2>
              <span className="mt-4 inline-flex items-center gap-2 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-white underline underline-offset-4 transition-colors group-hover:text-[#E11D2E]">
                <span>CAST YOUR VOTE</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>

          {/* Submit Your Design */}
          <Link
            href="/v12/submit"
            className="group relative flex min-h-[48vh] w-full items-end overflow-hidden bg-black"
          >
            <img
              src={V10_MEDIA.mysterySilhouette}
              alt="Submit an original silhouette to KNITX"
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/15"
            />
            <div className="relative z-10 w-full p-6 sm:p-10">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
                OPEN CREATOR BRIEF · CREDITED BY NAME
              </span>
              <h2 className="mt-2 font-poster text-4xl leading-[0.9] text-white uppercase sm:text-5xl">
                SUBMIT YOUR DESIGN
              </h2>
              <span className="mt-4 inline-flex items-center gap-2 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-white underline underline-offset-4 transition-colors group-hover:text-[#E11D2E]">
                <span>OPEN SUBMISSION</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        </div>

        {/* Multi-Release Archive Strip */}
        <Link
          href="/v12/releases"
          className="group flex items-center justify-between bg-black px-4 py-6 text-white transition-colors hover:bg-[#111111] sm:px-8"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="h-2 w-2 bg-[#E11D2E]" />
            <span className="font-syne text-sm font-extrabold uppercase tracking-[0.14em] sm:text-base">
              {editionLabel} &amp; MULTI-RELEASE ARCHIVE
            </span>
          </div>
          <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/80 transition-colors group-hover:text-white">
            <span>VIEW ALL RELEASES</span>
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </section>

      {/* ===================================================================== */}
      {/* PURE-WHITE SLIDE-OVER QUICK-SHOP DRAWER                               */}
      {/* ===================================================================== */}
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
              aria-label={cleanV10Text(selectedProduct.product.title)}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white text-black"
            >
              {/* Drawer Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white/95 px-6 py-4 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    {selectedProduct.product.serialCode}
                  </span>
                  {selectedProduct.product.tier === "one-of-one" ? (
                    <span className="bg-[#E11D2E] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white">
                      1 OF 1
                    </span>
                  ) : null}
                </div>
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  aria-label="Close quick view"
                  className="cursor-pointer p-1 text-black transition-colors hover:text-[#E11D2E]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Studio Image */}
              <div className="aspect-[4/5] w-full shrink-0 overflow-hidden bg-[#F4F4F5]">
                <img
                  src={getV10ProductImage(
                    selectedProduct.product,
                    selectedProduct.index,
                    showUnlocked
                  )}
                  alt={cleanV10Text(selectedProduct.product.title)}
                  className="h-full w-full object-cover object-center"
                />
              </div>

              {/* Product Details & Purchase Controls */}
              <div className="flex flex-1 flex-col gap-6 p-6">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-syne text-xl font-extrabold uppercase tracking-[-0.01em] text-black">
                      {cleanV10Text(selectedProduct.product.title)}
                    </h3>
                    <span className="shrink-0 font-mono text-base font-semibold text-black">
                      {formatInr(selectedProduct.product.priceInr)}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                    {cleanV10Text(selectedProduct.product.description)}
                  </p>
                </div>

                {/* Spec Grid */}
                <div className="grid grid-cols-3 gap-3 border-y border-black/10 py-4 font-mono text-[10px] uppercase tracking-[0.14em]">
                  <div>
                    <span className="block text-neutral-400">WEIGHT</span>
                    <span className="mt-1 block font-semibold text-black">
                      {selectedProduct.product.gsmWeight}
                    </span>
                  </div>
                  <div>
                    <span className="block text-neutral-400">EDITION</span>
                    <span className="mt-1 block font-semibold text-black">
                      {selectedProduct.product.remainingUnits} OF{" "}
                      {selectedProduct.product.totalUnits} LEFT
                    </span>
                  </div>
                  <div>
                    <span className="block text-neutral-400">DISPATCH</span>
                    <span className="mt-1 block font-semibold text-black">
                      {selectedProduct.product.productionDays} DAYS
                    </span>
                  </div>
                </div>

                <div className="text-xs text-neutral-600">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    FABRICATION
                  </span>
                  <p className="mt-1 font-medium text-black">
                    {cleanV10Text(selectedProduct.product.fabric)}
                  </p>
                  {selectedProduct.product.craftsmanship.length > 0 ? (
                    <ul className="mt-2.5 flex flex-wrap gap-1.5">
                      {selectedProduct.product.craftsmanship.map((detail) => (
                        <li
                          key={detail}
                          className="bg-[#F4F4F5] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-neutral-700"
                        >
                          {cleanV10Text(detail)}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                {/* Size Selector */}
                <div>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
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
                  <p className="font-mono text-xs text-[#E11D2E]">{bagNotice}</p>
                ) : null}

                {/* CTA: Add to Bag if unlocked, else Enter Access Code */}
                <div className="mt-auto pt-2">
                  {showUnlocked ? (
                    <button
                      suppressHydrationWarning
                      type="button"
                      onClick={handleQuickAddToBag}
                      disabled={selectedProduct.product.remainingUnits <= 0}
                      className="w-full cursor-pointer bg-black py-4 font-sans text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#E11D2E] disabled:cursor-not-allowed disabled:bg-neutral-300"
                    >
                      {selectedProduct.product.remainingUnits <= 0
                        ? "SOLD OUT"
                        : `ADD TO BAG — ${formatInr(selectedProduct.product.priceInr)}`}
                    </button>
                  ) : (
                    <Link
                      href="/v12/release"
                      onClick={() => setSelectedProduct(null)}
                      className="flex w-full items-center justify-center gap-2 bg-black py-4 font-sans text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#E11D2E]"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>ENTER ACCESS CODE TO PURCHASE</span>
                    </Link>
                  )}
                </div>
              </div>
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
