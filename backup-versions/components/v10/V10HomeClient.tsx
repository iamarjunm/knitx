"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useVault } from "@/context/VaultContext";
import type { DropCampaign, Product } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";
import {
  V10_MEDIA,
  buildReleaseSchedule,
  cleanV10Text,
  formatEditionLabel,
  getV10ProductImage,
} from "@/components/v10/v10-media";

interface V10HomeClientProps {
  drop: DropCampaign;
  products: Product[];
  candidateCount: number;
}

type ReleaseFilter = "all" | "revealed" | "veiled";

interface CountdownState {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

function computeCountdown(targetIso: string): CountdownState {
  const targetMs = new Date(targetIso).getTime();
  const diff = Number.isFinite(targetMs) ? Math.max(0, targetMs - Date.now()) : 0;
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    days: pad(days),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
  };
}

function formatEditorialTitle(raw: string): string {
  return raw
    .toLowerCase()
    .split(" ")
    .map((word) => {
      if (!word) return "";
      if (word.includes("/") || /^\d/.test(word)) return word.toUpperCase();
      if (word.endsWith("gsm")) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export default function V10HomeClient({
  drop,
  products,
  candidateCount,
}: V10HomeClientProps) {
  const router = useRouter();
  const { isVaultUnlocked, waitlistPass, joinWaitlist, unlockVaultWithCode } =
    useVault();

  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState<CountdownState | null>(null);
  const [filter, setFilter] = useState<ReleaseFilter>("all");
  const [activeProductId, setActiveProductId] = useState<string>(
    products[0]?._id ?? ""
  );

  // Waitlist & Invitation Code Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  const [codeDrawerOpen, setCodeDrawerOpen] = useState(false);
  const [invitationCode, setInvitationCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

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

  const showUnlocked = mounted && isVaultUnlocked;
  const showPass = mounted ? waitlistPass : null;
  const editionLabel = formatEditionLabel(drop.dropNumber);
  const editionTitle = cleanV10Text(drop.title);

  const revealedCount = useMemo(
    () => products.filter((p) => !p.isMystery || showUnlocked).length,
    [products, showUnlocked]
  );

  const veiledCount = useMemo(
    () => products.filter((p) => p.isMystery && !showUnlocked).length,
    [products, showUnlocked]
  );

  const filteredProducts = useMemo(() => {
    if (filter === "revealed") {
      return products.filter((p) => !p.isMystery || showUnlocked);
    }
    if (filter === "veiled") {
      return products.filter((p) => p.isMystery && !showUnlocked);
    }
    return products;
  }, [filter, products, showUnlocked]);

  const activeEntry = useMemo(() => {
    const candidate =
      filteredProducts.find((p) => p._id === activeProductId) ??
      filteredProducts[0] ??
      products[0];
    if (!candidate) return null;
    const originalIndex = products.findIndex((p) => p._id === candidate._id);
    return {
      product: candidate,
      index: originalIndex >= 0 ? originalIndex : 0,
    };
  }, [activeProductId, filteredProducts, products]);

  const releaseSchedule = useMemo(
    () => buildReleaseSchedule(drop.dropNumber, editionTitle, candidateCount),
    [drop.dropNumber, editionTitle, candidateCount]
  );

  async function handleWaitlistSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWaitlistError(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setWaitlistError("Please enter your full name.");
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setWaitlistError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await joinWaitlist(trimmedName, trimmedEmail);
      setFullName("");
      setEmail("");
    } catch (err) {
      const message =
        err instanceof Error
          ? cleanV10Text(err.message)
          : "Unable to complete registration. Please try again.";
      setWaitlistError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCodeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCodeError(null);

    if (!invitationCode.trim()) {
      setCodeError("Enter your invitation key to proceed.");
      return;
    }

    const accepted = unlockVaultWithCode(invitationCode);
    if (!accepted) {
      setCodeError("Invitation key not recognized. Please verify and try again.");
      return;
    }

    setInvitationCode("");
    router.push("/v10/release");
  }

  const activeProduct = activeEntry?.product ?? null;
  const activeIndex = activeEntry?.index ?? 0;
  const activeNumber = String(activeIndex + 1).padStart(2, "0");
  const activeIsSealed = Boolean(activeProduct?.isMystery && !showUnlocked);
  const activeImageSrc = activeProduct
    ? getV10ProductImage(activeProduct, activeIndex, showUnlocked)
    : V10_MEDIA.heroCampaign;

  return (
    <div className="bg-[#FAF9F6] text-[#111110]">
      {/* ACT 1: FULL-VIEWPORT ASYMMETRIC EDITORIAL CAMPAIGN SPREAD */}
      <section className="border-b border-[#111110]/10 bg-[#FAF9F6]">
        <div className="grid min-h-[calc(100svh-4rem)] grid-cols-1 lg:grid-cols-12">
          {/* Left Editorial Column (5 cols) */}
          <div className="flex flex-col justify-between px-5 py-10 sm:px-10 lg:col-span-5 lg:border-r lg:border-[#111110]/10 lg:px-12 lg:py-12 xl:px-16">
            {/* Whisper-Quiet Top Eyebrow & Live Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#111110]/10 pb-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#6E6A63]">
                {editionLabel} · {editionTitle}
              </p>
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#111110]">
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-1.5 w-1.5",
                    showUnlocked ? "bg-[#8C1D18]" : "bg-[#111110]"
                  )}
                />
                <span>{showUnlocked ? "PRIVATE ACCESS OPEN" : "WAITLIST OPEN"}</span>
              </div>
            </div>

            {/* Monumental Editorial Statement */}
            <div className="my-10 lg:my-auto lg:py-8">
              <h1 className="font-editorial text-5xl leading-[0.94] tracking-[-0.02em] text-[#111110] sm:text-6xl xl:text-[76px]">
                Numbered garments,
                <br />
                <span className="italic">cut only when claimed.</span>
              </h1>

              <p className="mt-7 max-w-[440px] font-sans text-[15px] leading-[1.68] text-[#6E6A63]">
                Each release comprises ten designs—small batches of three to four pieces
                alongside singular one-of-one collector works. Admitted waitlist members
                unlock the complete edition.
              </p>
            </div>

            {/* Countdown Strip & Architectural CTAs */}
            <div>
              <div className="mb-7 border-y border-[#111110]/10 py-4">
                <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[#6E6A63]">
                  {showUnlocked
                    ? "PRIVATE EDITION ROOM ACTIVE"
                    : "NEXT ADMISSION WINDOW"}
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "DAYS", value: mounted && countdown ? countdown.days : "--" },
                    { label: "HRS", value: mounted && countdown ? countdown.hours : "--" },
                    { label: "MIN", value: mounted && countdown ? countdown.minutes : "--" },
                    { label: "SEC", value: mounted && countdown ? countdown.seconds : "--" },
                  ].map((unit) => (
                    <div key={unit.label} className="flex flex-col">
                      <span className="font-mono text-xl leading-none tracking-tight text-[#111110] tabular-nums sm:text-2xl">
                        {unit.value}
                      </span>
                      <span className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-[#6E6A63]">
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {showUnlocked ? (
                  <Link
                    href="/v10/release"
                    className="inline-flex items-center justify-center bg-[#111110] px-7 py-4 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#FAF9F6] transition-colors duration-300 hover:bg-[#8C1D18]"
                  >
                    ENTER CURRENT RELEASE
                  </Link>
                ) : (
                  <a
                    href="#waitlist-desk"
                    className="inline-flex items-center justify-center bg-[#111110] px-7 py-4 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#FAF9F6] transition-colors duration-300 hover:bg-[#8C1D18]"
                  >
                    REQUEST ACCESS
                  </a>
                )}

                <Link
                  href="/v10/release"
                  className="inline-flex items-center justify-center border border-[#111110]/20 bg-transparent px-7 py-4 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#111110] transition-colors duration-300 hover:border-[#111110]"
                >
                  VIEW PRIVATE RELEASE
                </Link>
              </div>
            </div>
          </div>

          {/* Right Full-Bleed Architectural Photograph Column (7 cols) */}
          <div className="flex flex-col bg-[#F2EFE9] lg:col-span-7">
            <div className="relative min-h-[460px] flex-1 overflow-hidden bg-[#F2EFE9] sm:min-h-[580px] lg:min-h-0">
              <motion.img
                src={V10_MEDIA.heroCampaign}
                alt={`${editionLabel} — ${editionTitle} campaign lookbook`}
                initial={{ opacity: 0, scale: 1.035 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="h-full w-full object-cover object-center"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#111110]/10 bg-[#FAF9F6] px-6 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[#6E6A63]">
              <span className="text-[#111110]">{editionLabel}</span>
              <span>10 SILHOUETTES · 1–4 UNITS EACH</span>
            </div>
          </div>
        </div>
      </section>

      {/* ACT 2: INTERACTIVE RUNWAY INDEX & STICKY LOOKBOOK PLATE */}
      <section className="border-b border-[#111110]/10 bg-[#FFFFFF]">
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          {/* Header & Minimal Filter Strip */}
          <div className="flex flex-col gap-6 pb-12 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#6E6A63]">
                RUNWAY INDEX · {editionLabel}
              </p>
              <h2 className="mt-3 font-editorial text-4xl leading-[1.02] tracking-[-0.015em] text-[#111110] sm:text-5xl">
                The Current Release
              </h2>
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-9">
              <div
                role="tablist"
                aria-label="Filter release silhouettes"
                className="flex flex-wrap items-center gap-6"
              >
                {[
                  { id: "all" as const, label: `ALL (${products.length})` },
                  { id: "revealed" as const, label: `REVEALED (${revealedCount})` },
                  {
                    id: "veiled" as const,
                    label: `UNVEILED ON ENTRY (${veiledCount})`,
                  },
                ].map((tab) => {
                  const selected = filter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      suppressHydrationWarning
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setFilter(tab.id)}
                      className={cn(
                        "cursor-pointer pb-1 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors",
                        selected
                          ? "border-b border-[#111110] text-[#111110]"
                          : "border-b border-transparent text-[#6E6A63] hover:text-[#111110]"
                      )}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <Link
                href="/v10/release"
                className="inline-flex items-center gap-2 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#111110] transition-colors hover:text-[#8C1D18]"
              >
                <span>ENTER RELEASE ROOM</span>
                <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
              </Link>
            </div>
          </div>

          {/* 12-Column Editorial Split */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Left: Sticky Museum Lookbook Plate (Desktop) */}
            <div className="hidden lg:col-span-5 lg:block lg:self-start lg:sticky lg:top-24">
              {activeProduct ? (
                <div>
                  <div className="relative aspect-[3/4] overflow-hidden border border-[#111110]/10 bg-[#F2EFE9]">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={`${activeProduct._id}-${showUnlocked ? "open" : "sealed"}`}
                        src={activeImageSrc}
                        alt={
                          activeIsSealed
                            ? `Unveiled Silhouette ${activeNumber}`
                            : cleanV10Text(activeProduct.title)
                        }
                        initial={{ opacity: 0, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full w-full object-cover object-center"
                      />
                    </AnimatePresence>
                  </div>

                  {/* Clean Museum Caption Plate Underneath */}
                  <div className="border-x border-b border-[#111110]/10 bg-[#FAF9F6] p-6">
                    <div className="flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.2em]">
                      <span className="text-[#6E6A63]">
                        {activeNumber} · {activeProduct.serialCode}
                      </span>
                      <span
                        className={
                          activeProduct.tier === "one-of-one"
                            ? "text-[#8C1D18]"
                            : "text-[#111110]"
                        }
                      >
                        {activeProduct.tier === "one-of-one"
                          ? "ONE OF ONE"
                          : `EDITION OF ${activeProduct.totalUnits}`}
                      </span>
                    </div>

                    <h3 className="mt-2.5 font-editorial text-[28px] leading-[1.1] text-[#111110]">
                      {activeIsSealed ? (
                        <span className="italic text-[#6E6A63]">
                          Unveiled Silhouette {activeNumber}
                        </span>
                      ) : (
                        formatEditorialTitle(cleanV10Text(activeProduct.title))
                      )}
                    </h3>

                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6E6A63]">
                      {activeProduct.gsmWeight} ·{" "}
                      {activeIsSealed
                        ? "PRIVATE ATELIER SPECIFICATION"
                        : cleanV10Text(activeProduct.fabric)}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-[#111110]/10 pt-4">
                      {activeIsSealed ? (
                        <p className="font-sans text-[13px] italic text-[#6E6A63]">
                          Unveiled privately when your waitlist number is called.
                        </p>
                      ) : (
                        <>
                          <span className="font-mono text-[12px] tracking-[0.06em] text-[#111110] tabular-nums">
                            {formatInr(activeProduct.priceInr)}
                          </span>
                          <Link
                            href="/v10/release"
                            className="inline-flex items-center gap-1.5 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-[#111110] transition-colors hover:text-[#8C1D18]"
                          >
                            <span>Inspect in Release</span>
                            <ArrowRight className="h-3 w-3 stroke-[1.5]" />
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Right: Crisp Hairline Runway Index Table */}
            <div className="lg:col-span-7">
              {filteredProducts.length === 0 ? (
                <div className="border-y border-[#111110]/10 py-16 text-center">
                  <p className="font-editorial text-2xl italic text-[#6E6A63]">
                    All ten silhouettes are now unveiled in your private release.
                  </p>
                  <Link
                    href="/v10/release"
                    className="mt-6 inline-flex items-center gap-2 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#111110] underline underline-offset-4 hover:text-[#8C1D18]"
                  >
                    <span>OPEN RELEASE ROOM</span>
                    <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[#111110]/10 border-y border-[#111110]/10">
                  {filteredProducts.map((product) => {
                    const origIndex = products.findIndex((p) => p._id === product._id);
                    const displayIdx = origIndex >= 0 ? origIndex : 0;
                    const numStr = String(displayIdx + 1).padStart(2, "0");
                    const isSealed = product.isMystery && !showUnlocked;
                    const isSelected = activeProduct?._id === product._id;
                    const rowImg = getV10ProductImage(
                      product,
                      displayIdx,
                      showUnlocked
                    );

                    return (
                      <div key={product._id}>
                        <button
                          suppressHydrationWarning
                          type="button"
                          onMouseEnter={() => setActiveProductId(product._id)}
                          onFocus={() => setActiveProductId(product._id)}
                          onClick={() => setActiveProductId(product._id)}
                          className={cn(
                            "group flex w-full cursor-pointer items-center justify-between gap-4 px-3 py-5 text-left transition-colors duration-200 sm:px-5 sm:py-6",
                            isSelected ? "bg-[#FAF9F6]" : "bg-transparent hover:bg-[#FAF9F6]/60"
                          )}
                        >
                          <div className="flex min-w-0 items-baseline gap-4 sm:gap-6">
                            <span
                              className={cn(
                                "w-6 shrink-0 font-mono text-[11px] tracking-[0.14em] tabular-nums transition-colors",
                                isSelected ? "text-[#111110]" : "text-[#6E6A63]"
                              )}
                            >
                              {numStr}
                            </span>

                            <span
                              className={cn(
                                "truncate font-editorial text-2xl leading-[1.12] transition-colors sm:text-[28px]",
                                isSealed
                                  ? "italic text-[#6E6A63]"
                                  : isSelected
                                    ? "text-[#111110]"
                                    : "text-[#111110]/85 group-hover:text-[#111110]"
                              )}
                            >
                              {isSealed
                                ? `Unveiled Silhouette ${numStr}`
                                : formatEditorialTitle(cleanV10Text(product.title))}
                            </span>
                          </div>

                          <div className="flex shrink-0 items-center gap-4 sm:gap-7">
                            <span
                              className={cn(
                                "font-mono text-[10px] uppercase tracking-[0.18em]",
                                product.tier === "one-of-one"
                                  ? "text-[#8C1D18]"
                                  : "text-[#6E6A63]"
                              )}
                            >
                              {product.tier === "one-of-one"
                                ? "One of One"
                                : `${product.totalUnits} Units`}
                            </span>

                            <span className="hidden w-16 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-[#6E6A63] sm:inline">
                              {product.gsmWeight}
                            </span>

                            <span className="w-20 text-right font-mono text-[11px] tracking-[0.06em] text-[#111110] tabular-nums">
                              {isSealed ? "Private" : formatInr(product.priceInr)}
                            </span>
                          </div>
                        </button>

                        {/* Mobile Inline Preview Plate */}
                        {isSelected ? (
                          <div className="border-t border-[#111110]/10 bg-[#FAF9F6] p-4 lg:hidden">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-end">
                              <div className="aspect-[3/4] overflow-hidden border border-[#111110]/10 bg-[#F2EFE9] sm:col-span-5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={rowImg}
                                  alt={
                                    isSealed
                                      ? `Unveiled Silhouette ${numStr}`
                                      : cleanV10Text(product.title)
                                  }
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="flex flex-col justify-between sm:col-span-7">
                                <div>
                                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6E6A63]">
                                    {product.serialCode} · {product.gsmWeight}
                                  </p>
                                  <p className="mt-2 text-[13px] leading-[1.6] text-[#6E6A63]">
                                    {isSealed
                                      ? "Unveiled privately when your waitlist number is called."
                                      : cleanV10Text(product.fabric)}
                                  </p>
                                </div>
                                {!isSealed ? (
                                  <Link
                                    href="/v10/release"
                                    className="mt-4 inline-flex items-center gap-1.5 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-[#111110] underline underline-offset-4 hover:text-[#8C1D18]"
                                  >
                                    <span>Inspect in Release</span>
                                    <ArrowRight className="h-3 w-3 stroke-[1.5]" />
                                  </Link>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ACT 3: SAMPLE-FIRST ARCHITECTURAL INTERLUDE */}
      <section className="border-b border-[#111110]/10 bg-[#F2EFE9]">
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
            {/* Left: Cutting Table Photography */}
            <div className="lg:col-span-6">
              <div className="aspect-[4/3] overflow-hidden border border-[#111110]/10 bg-[#FAF9F6]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={V10_MEDIA.atelierCuttingTable}
                  alt="KNITX studio cutting table during sample-first garment construction"
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <div className="border-x border-b border-[#111110]/10 bg-[#FAF9F6] px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[#6E6A63]">
                CUTTING TABLE · SAMPLE-FIRST PRODUCTION · INDIA
              </div>
            </div>

            {/* Right: Atelier Philosophy & Hairline Metrics */}
            <div className="lg:col-span-6 lg:pl-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#6E6A63]">
                THE ATELIER
              </p>

              <h2 className="mt-4 font-editorial text-4xl leading-[1.02] tracking-[-0.015em] text-[#111110] sm:text-5xl">
                We shoot one sample.
                <br />
                <span className="italic">
                  Your piece is cut only after you claim it.
                </span>
              </h2>

              <p className="mt-6 max-w-lg font-sans text-[15px] leading-[1.7] text-[#6E6A63]">
                Rather than holding speculative warehouse inventory, KNITX produces a
                single reference sample to photograph each release. Once claimed, your
                garment is cut in heavyweight Indian cotton, hand-finished in our studio,
                and sealed with its individual serial mark.
              </p>

              <div className="mt-9 divide-y divide-[#111110]/10 border-y border-[#111110]/10">
                {[
                  {
                    metric: "0% Deadstock",
                    detail: "Every garment is cut strictly against claimed orders",
                  },
                  {
                    metric: "1–4 Units Per Silhouette",
                    detail: "Patterns are archived permanently once an edition closes",
                  },
                  {
                    metric: "310–520 GSM Fabrics",
                    detail: "Heavyweight Indian mills paired with hand-finished craft",
                  },
                ].map((row) => (
                  <div
                    key={row.metric}
                    className="flex flex-col justify-between gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-6"
                  >
                    <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-[#111110]">
                      {row.metric}
                    </span>
                    <span className="font-sans text-[13px] text-[#6E6A63]">
                      {row.detail}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href="/v10/atelier"
                className="mt-9 inline-flex items-center gap-2.5 font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-[#111110] transition-colors hover:text-[#8C1D18]"
              >
                <span>EXPLORE THE ATELIER</span>
                <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ACT 4: PRIVATE WAITLIST & INVITATION DESK */}
      <section
        id="waitlist-desk"
        className="scroll-mt-16 border-b border-[#111110]/10 bg-[#FAF9F6]"
      >
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left: Calm Private Admission Copy */}
            <div className="flex flex-col justify-between lg:col-span-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#6E6A63]">
                  PRIVATE ADMISSION
                </p>

                <h2 className="mt-4 font-editorial text-4xl leading-[1.02] tracking-[-0.015em] text-[#111110] sm:text-5xl">
                  Join the list for current &amp; future releases.
                </h2>

                <p className="mt-6 max-w-md font-sans text-[15px] leading-[1.7] text-[#6E6A63]">
                  Receive email updates on your queue position. When your number is
                  called, your invitation key opens the complete catalog.
                </p>
              </div>

              <div className="mt-10 flex items-center gap-3 border-t border-[#111110]/10 pt-6">
                <span aria-hidden="true" className="h-1.5 w-1.5 bg-[#8C1D18]" />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#111110] tabular-nums">
                  {drop.waitlistCount.toLocaleString("en-IN")} collectors registered
                </span>
              </div>
            </div>

            {/* Right: Waitlist Registration / Linen Edition Pass + Invitation Key */}
            <div className="lg:col-span-7">
              {mounted && showPass ? (
                <div className="border border-[#111110]/15 bg-[#FFFFFF] p-8 sm:p-10">
                  <div className="flex items-center justify-between gap-4 border-b border-[#111110]/10 pb-5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#6E6A63]">
                      KNITX EDITION PASS · {editionLabel}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[10px] uppercase tracking-[0.22em]",
                        showUnlocked || showPass.status === "entered"
                          ? "text-[#8C1D18]"
                          : "text-[#111110]"
                      )}
                    >
                      {showUnlocked || showPass.status === "entered"
                        ? "ADMITTED"
                        : "IN QUEUE"}
                    </span>
                  </div>

                  <div className="border-b border-[#111110]/10 py-8">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#6E6A63]">
                      QUEUE POSITION
                    </p>
                    <p className="mt-2 font-editorial text-5xl leading-none text-[#111110] tabular-nums sm:text-6xl">
                      #{String(showPass.position).padStart(4, "0")}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 py-6 sm:grid-cols-2">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6E6A63]">
                        COLLECTOR
                      </p>
                      <p className="mt-1.5 font-sans text-[15px] text-[#111110]">
                        {showPass.name}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6E6A63]">
                        REGISTERED EMAIL
                      </p>
                      <p className="mt-1.5 font-sans text-[15px] text-[#111110]">
                        {showPass.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#111110]/10 pt-6">
                    <Link
                      href="/v10/release"
                      className="inline-flex items-center gap-2.5 bg-[#111110] px-7 py-3.5 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#FAF9F6] transition-colors duration-300 hover:bg-[#8C1D18]"
                    >
                      <span>ENTER RELEASE ROOM</span>
                      <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
                    </Link>

                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6E6A63]">
                      PRIVATE REGISTRY CONFIRMED
                    </span>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleWaitlistSubmit}
                  noValidate
                  className="border border-[#111110]/10 bg-[#FFFFFF] p-8 sm:p-10"
                >
                  <div className="space-y-7">
                    <div>
                      <label
                        htmlFor="v10-waitlist-name"
                        className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[#6E6A63]"
                      >
                        FULL NAME
                      </label>
                      <input
                        id="v10-waitlist-name"
                        suppressHydrationWarning
                        type="text"
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="mt-1.5 w-full border-b border-[#111110]/25 bg-transparent py-3.5 font-sans text-[15px] text-[#111110] placeholder:text-[#6E6A63]/55 transition-colors focus:border-[#111110] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="v10-waitlist-email"
                        className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[#6E6A63]"
                      >
                        EMAIL ADDRESS
                      </label>
                      <input
                        id="v10-waitlist-email"
                        suppressHydrationWarning
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="collector@domain.com"
                        className="mt-1.5 w-full border-b border-[#111110]/25 bg-transparent py-3.5 font-sans text-[15px] text-[#111110] placeholder:text-[#6E6A63]/55 transition-colors focus:border-[#111110] focus:outline-none"
                      />
                    </div>
                  </div>

                  {waitlistError ? (
                    <p
                      role="alert"
                      className="mt-5 font-sans text-[13px] text-[#8C1D18]"
                    >
                      {waitlistError}
                    </p>
                  ) : null}

                  <button
                    suppressHydrationWarning
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-8 w-full cursor-pointer bg-[#111110] py-4 font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-[#FAF9F6] transition-colors duration-300 hover:bg-[#8C1D18] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "REGISTERING..." : "JOIN THE WAITLIST"}
                  </button>
                </form>
              )}

              {/* Discreet Invitation Code Disclosure */}
              <div className="mt-6 border-t border-[#111110]/10 pt-5">
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => {
                    setCodeDrawerOpen((open) => !open);
                    setCodeError(null);
                  }}
                  aria-expanded={codeDrawerOpen}
                  className="cursor-pointer font-sans text-[13px] text-[#6E6A63] underline underline-offset-4 transition-colors hover:text-[#111110]"
                >
                  Have an invitation code?
                </button>

                <AnimatePresence initial={false}>
                  {codeDrawerOpen ? (
                    <motion.form
                      onSubmit={handleCodeSubmit}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pt-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                          <input
                            suppressHydrationWarning
                            type="text"
                            aria-label="Invitation code"
                            value={invitationCode}
                            onChange={(e) => setInvitationCode(e.target.value)}
                            placeholder="Enter invitation key"
                            className="flex-1 border-b border-[#111110]/25 bg-transparent py-2.5 font-mono text-[12px] uppercase tracking-[0.18em] text-[#111110] placeholder:normal-case placeholder:tracking-normal placeholder:text-[#6E6A63]/60 transition-colors focus:border-[#111110] focus:outline-none"
                          />
                          <button
                            suppressHydrationWarning
                            type="submit"
                            className="cursor-pointer border border-[#111110] bg-transparent px-7 py-2.5 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#111110] transition-colors hover:bg-[#111110] hover:text-[#FAF9F6]"
                          >
                            ENTER
                          </button>
                        </div>

                        {codeError ? (
                          <p
                            role="alert"
                            className="mt-2.5 font-sans text-[12px] text-[#8C1D18]"
                          >
                            {codeError}
                          </p>
                        ) : null}

                        <p className="mt-2.5 font-mono text-[10px] tracking-[0.12em] text-[#6E6A63]">
                          Preview access key: KNITX-001
                        </p>
                      </div>
                    </motion.form>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ACT 5: MULTI-RELEASE & COMMUNITY CO-CREATION STRIP */}
      <section className="bg-[#FFFFFF]">
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="flex flex-col gap-4 pb-12 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#6E6A63]">
                EDITION CALENDAR · CO-CREATION
              </p>
              <h2 className="mt-3 font-editorial text-4xl leading-[1.02] tracking-[-0.015em] text-[#111110] sm:text-5xl">
                The Release Cycle
              </h2>
            </div>

            <Link
              href="/v10/archive"
              className="inline-flex items-center gap-2 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#111110] transition-colors hover:text-[#8C1D18]"
            >
              <span>EDITION CALENDAR</span>
              <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
            </Link>
          </div>

          <div className="grid grid-cols-1 divide-y divide-[#111110]/10 border-y border-[#111110]/10 md:grid-cols-3 md:divide-x md:divide-y-0">
            {releaseSchedule.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between py-10 md:px-8 md:first:pl-0 md:last:pr-0"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.2em]">
                    <span className="text-[#111110]">{item.editionLabel}</span>
                    <span
                      className={
                        item.status === "active"
                          ? "text-[#8C1D18]"
                          : "text-[#6E6A63]"
                      }
                    >
                      {item.season}
                    </span>
                  </div>

                  <h3 className="mt-5 font-editorial text-3xl leading-[1.08] text-[#111110]">
                    {formatEditorialTitle(item.title)}
                  </h3>

                  <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6E6A63]">
                    {item.piecesSummary}
                  </p>

                  <p className="mt-4 font-sans text-[14px] leading-[1.68] text-[#6E6A63]">
                    {item.note}
                  </p>
                </div>

                <div className="mt-8 border-t border-[#111110]/10 pt-5">
                  <Link
                    href={item.href}
                    className="group inline-flex w-full items-center justify-between font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#111110] transition-colors hover:text-[#8C1D18]"
                  >
                    <span>{item.cta}</span>
                    <ArrowRight className="h-3.5 w-3.5 stroke-[1.5] transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
