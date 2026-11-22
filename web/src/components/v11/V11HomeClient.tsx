"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, X } from "lucide-react";
import { useVault } from "@/context/VaultContext";
import type { DropCampaign, Product } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";
import {
  V10_MEDIA,
  cleanV10Text,
  formatEditionLabel,
  getV10ProductImage,
} from "@/components/v10/v10-media";

interface V11HomeClientProps {
  drop: DropCampaign;
  products: Product[];
  candidateCount: number;
}

type LookbookFilter = "all" | "revealed" | "veiled";

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

export default function V11HomeClient({
  drop,
  products,
  candidateCount,
}: V11HomeClientProps) {
  const router = useRouter();
  const {
    isVaultUnlocked,
    waitlistPass,
    joinWaitlist,
    unlockVaultWithCode,
    addToCart,
  } = useVault();

  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState<CountdownState | null>(null);
  const [filter, setFilter] = useState<LookbookFilter>("all");

  // Quick-Inspect Garment Drawer
  const [inspectProduct, setInspectProduct] = useState<Product | null>(null);
  const [inspectIndex, setInspectIndex] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [bagFeedback, setBagFeedback] = useState<string>("");

  // Waitlist & Invitation Code State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  const [codeOpen, setCodeOpen] = useState(false);
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

  useEffect(() => {
    if (!inspectProduct) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setInspectProduct(null);
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [inspectProduct]);

  const showUnlocked = mounted && isVaultUnlocked;
  const showPass = mounted ? waitlistPass : null;
  const editionLabel = formatEditionLabel(drop.dropNumber);
  const editionTitle = cleanV10Text(drop.title);

  const flagshipPieces = useMemo(() => {
    const publicPieces = products
      .map((product, index) => ({ product, index }))
      .filter(({ product }) => !product.isMystery);
    if (publicPieces.length >= 2) {
      return publicPieces.slice(0, 2);
    }
    return products.slice(0, 2).map((product, index) => ({ product, index }));
  }, [products]);

  const revealedCount = useMemo(
    () => products.filter((p) => !p.isMystery || showUnlocked).length,
    [products, showUnlocked]
  );

  const veiledCount = useMemo(
    () => products.filter((p) => p.isMystery && !showUnlocked).length,
    [products, showUnlocked]
  );

  const filteredLookbook = useMemo(() => {
    const indexed = products.map((product, index) => ({ product, index }));
    if (filter === "revealed") {
      return indexed.filter(({ product }) => !product.isMystery || showUnlocked);
    }
    if (filter === "veiled") {
      return indexed.filter(({ product }) => product.isMystery && !showUnlocked);
    }
    return indexed;
  }, [filter, products, showUnlocked]);

  function openQuickInspect(product: Product, index: number) {
    const isSealed = product.isMystery && !showUnlocked;
    if (isSealed) {
      router.push("/v11/release");
      return;
    }
    setInspectProduct(product);
    setInspectIndex(index);
    setSelectedSize(product.sizes[0] ?? "ONE SIZE");
    setBagFeedback("");
  }

  function handleQuickAddToBag() {
    if (!inspectProduct) return;
    if (!showUnlocked) {
      setInspectProduct(null);
      router.push("/v11/release");
      return;
    }
    const chosenSize = selectedSize || inspectProduct.sizes[0] || "ONE SIZE";
    const result = addToCart(inspectProduct, chosenSize);
    if (!result.ok) {
      setBagFeedback(
        cleanV10Text(result.message || "Unable to add this garment right now.")
      );
      return;
    }
    setBagFeedback("");
    setInspectProduct(null);
  }

  async function handleWaitlistSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWaitlistError(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setWaitlistError("Enter your name to join the waitlist.");
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setWaitlistError("Enter a valid email address.");
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
          : "Unable to register right now. Please try again.";
      setWaitlistError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCodeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCodeError(null);
    const trimmed = invitationCode.trim();
    if (!trimmed) {
      setCodeError("Enter your invitation code.");
      return;
    }
    const accepted = unlockVaultWithCode(trimmed);
    if (!accepted) {
      setCodeError("Code not recognized. Verify your invitation or try KNITX-001.");
      return;
    }
    setInvitationCode("");
    router.push("/v11/release");
  }

  return (
    <div className="bg-[#070709] text-[#F4F2ED]">
      {/* ACT 1: FULL-BLEED 100SVH CINEMATIC CAMPAIGN HERO */}
      <section className="relative h-[100svh] min-h-[680px] w-full overflow-hidden bg-[#070709]">
        <motion.img
          src={V10_MEDIA.heroCampaign}
          alt={`${editionLabel} — ${editionTitle} campaign`}
          initial={{ scale: 1.07, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Cinematic Obsidian Top/Bottom Vignette */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-[#070709]/70 via-[#070709]/15 to-[#070709]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#070709] via-transparent to-transparent"
        />

        {/* Bottom-Anchored Editorial Overlay */}
        <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-end px-6 pb-12 sm:px-12 sm:pb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Eyebrow Stamp */}
            <div className="inline-flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#F4F2ED]/80 sm:text-[11px]">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-[#C81E1E] shadow-[0_0_8px_rgba(200,30,30,0.85)]"
              />
              <span>
                {editionLabel} · {products.length} NUMBERED PIECES ·{" "}
                {showUnlocked ? "PRIVATE ACCESS OPEN" : "WAITLIST ONLY"}
              </span>
            </div>

            {/* Monumental Campaign Headline */}
            <h1 className="mt-4 max-w-5xl font-syne text-5xl font-extrabold uppercase leading-[0.88] tracking-[-0.03em] text-[#F4F2ED] sm:text-7xl lg:text-[92px]">
              {editionTitle}
            </h1>

            {/* Bottom Action Row + Tabular Countdown */}
            <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
              <div className="flex flex-wrap items-center gap-3">
                {showUnlocked ? (
                  <Link
                    href="/v11/release"
                    className="inline-flex items-center justify-center bg-[#F4F2ED] px-8 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#070709] transition-colors duration-300 hover:bg-[#C81E1E] hover:text-white"
                  >
                    SHOP RELEASE
                  </Link>
                ) : (
                  <a
                    href="#v11-access"
                    className="inline-flex items-center justify-center bg-[#F4F2ED] px-8 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#070709] transition-colors duration-300 hover:bg-[#C81E1E] hover:text-white"
                  >
                    JOIN WAITLIST
                  </a>
                )}

                <Link
                  href="/v11/release"
                  className="inline-flex items-center justify-center border border-white/30 bg-white/5 px-8 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F4F2ED] backdrop-blur-md transition-colors duration-300 hover:bg-white hover:text-[#070709]"
                >
                  ENTER RELEASE
                </Link>
              </div>

              {/* Minimalist Tabular Countdown */}
              <div className="border-l border-white/20 pl-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#8E8C87]">
                  {showUnlocked ? "EDITION ROOM ACTIVE" : "NEXT ADMISSION"}
                </p>
                <div className="mt-1.5 flex items-baseline gap-2 font-mono text-lg tracking-[0.14em] text-[#F4F2ED] tabular-nums sm:text-2xl">
                  <span>{mounted && countdown ? countdown.days : "--"}</span>
                  <span className="text-white/30">:</span>
                  <span>{mounted && countdown ? countdown.hours : "--"}</span>
                  <span className="text-white/30">:</span>
                  <span>{mounted && countdown ? countdown.minutes : "--"}</span>
                  <span className="text-white/30">:</span>
                  <span className="text-[#C81E1E]">
                    {mounted && countdown ? countdown.seconds : "--"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ACT 2: MASSIVE 2-COLUMN FULL-BLEED FLAGSHIP SHOWROOM */}
      <section
        aria-label="Flagship silhouettes"
        className="border-t border-white/10 bg-[#070709]"
      >
        <div className="grid grid-cols-1 gap-[2px] bg-[#070709] md:grid-cols-2">
          {flagshipPieces.map(({ product, index }) => {
            const isOneOfOne = product.tier === "one-of-one";
            const imgSrc = getV10ProductImage(product, index, showUnlocked);
            return (
              <button
                key={product._id}
                suppressHydrationWarning
                type="button"
                onClick={() => openQuickInspect(product, index)}
                className="group relative flex min-h-[72vh] w-full cursor-pointer flex-col justify-end overflow-hidden bg-[#0B0B0D] text-left sm:min-h-[85vh]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgSrc}
                  alt={cleanV10Text(product.title)}
                  className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />

                {/* Subtle Bottom Dark Gradient */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#070709]/92 via-[#070709]/20 to-transparent transition-opacity duration-500 group-hover:opacity-95"
                />

                {/* Top Corner Edition Stamp */}
                <div className="absolute top-6 left-6 right-6 z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.24em]">
                  <span className="text-[#F4F2ED]/80">{product.serialCode}</span>
                  <span className="inline-flex items-center gap-2 text-[#F4F2ED]">
                    {isOneOfOne ? (
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-[#C81E1E]"
                      />
                    ) : null}
                    <span>
                      {isOneOfOne ? "ONE OF ONE" : `${product.totalUnits} UNITS`}
                    </span>
                  </span>
                </div>

                {/* Bottom Showroom Caption */}
                <div className="relative z-10 p-6 sm:p-10 lg:p-12">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8E8C87]">
                    {product.gsmWeight} · {cleanV10Text(product.fabric)}
                  </p>
                  <h2 className="mt-2 font-syne text-2xl font-bold uppercase leading-[0.98] tracking-[-0.02em] text-[#F4F2ED] sm:text-4xl">
                    {cleanV10Text(product.title)}
                  </h2>

                  <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-4">
                    <span className="font-mono text-sm tracking-[0.08em] text-[#F4F2ED] tabular-nums">
                      {formatInr(product.priceInr)}
                    </span>
                    <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/75 transition-colors group-hover:text-white">
                      <span>{showUnlocked ? "INSPECT & RESERVE" : "INSPECT PIECE"}</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ACT 3: FULL-BLEED 4-COLUMN LOOKBOOK REEL */}
      <section aria-label="Current release lookbook" className="bg-[#070709]">
        {/* Dark Editorial Header Strip */}
        <div className="border-y border-white/10 bg-[#0A0A0D]">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-6 py-8 sm:px-12 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#8E8C87]">
                THE COLLECTION · {revealedCount} REVEALED · {veiledCount} VEILED
              </p>
              <h2 className="mt-1.5 font-syne text-2xl font-extrabold uppercase tracking-[-0.02em] text-[#F4F2ED] sm:text-3xl">
                {editionLabel} LOOKBOOK
              </h2>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-6">
              <div
                role="tablist"
                aria-label="Filter collection preview"
                className="flex items-center gap-6"
              >
                {[
                  { id: "all" as const, label: `ALL ${products.length}` },
                  { id: "revealed" as const, label: "REVEALED" },
                  { id: "veiled" as const, label: "VEILED" },
                ].map((tab) => {
                  const active = filter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      suppressHydrationWarning
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setFilter(tab.id)}
                      className={cn(
                        "cursor-pointer pb-1 font-mono text-[10px] uppercase tracking-[0.22em] transition-colors",
                        active
                          ? "border-b border-[#F4F2ED] text-[#F4F2ED]"
                          : "border-b border-transparent text-[#8E8C87] hover:text-white"
                      )}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <Link
                href="/v11/release"
                className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#F4F2ED] transition-colors hover:text-[#C81E1E]"
              >
                <span>FULL CATALOG</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Edge-to-Edge 4-Column Studio Grid */}
        {filteredLookbook.length === 0 ? (
          <div className="border-b border-white/10 py-20 text-center">
            <p className="font-syne text-xl uppercase tracking-[0.04em] text-[#8E8C87]">
              ALL {products.length} SILHOUETTES ARE NOW UNVEILED
            </p>
            <Link
              href="/v11/release"
              className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#F4F2ED] underline underline-offset-4 hover:text-[#C81E1E]"
            >
              <span>OPEN PRIVATE RELEASE</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-[2px] bg-white/10 lg:grid-cols-4">
            {filteredLookbook.map(({ product, index }) => {
              const numStr = String(index + 1).padStart(2, "0");
              const isSealed = product.isMystery && !showUnlocked;
              const isOneOfOne = product.tier === "one-of-one";
              const imgSrc = getV10ProductImage(product, index, showUnlocked);

              return (
                <button
                  key={product._id}
                  suppressHydrationWarning
                  type="button"
                  onClick={() => openQuickInspect(product, index)}
                  className="group relative flex w-full cursor-pointer flex-col bg-[#0B0B0D] text-left focus:outline-none"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#0B0B0D]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgSrc}
                      alt={
                        isSealed
                          ? `Veiled Silhouette ${numStr}`
                          : cleanV10Text(product.title)
                      }
                      className={cn(
                        "h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]",
                        isSealed && "opacity-75"
                      )}
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0B0B0D] to-transparent"
                    />

                    {/* Subtle Corner Index Stamp */}
                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em]">
                      <span className="text-[#F4F2ED]/70 tabular-nums">
                        {numStr}
                      </span>
                      {isOneOfOne ? (
                        <span className="inline-flex items-center gap-1.5 text-[#F4F2ED]">
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 rounded-full bg-[#C81E1E]"
                          />
                          <span>01/01</span>
                        </span>
                      ) : isSealed ? (
                        <span className="text-[#8E8C87]">VEILED</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Whisper-Clean Studio Caption Bar */}
                  <div className="flex flex-1 flex-col justify-between bg-[#0B0B0D] px-4 py-4 sm:px-5">
                    <h3
                      className={cn(
                        "truncate font-syne text-[13px] font-bold uppercase tracking-[0.02em] sm:text-[15px]",
                        isSealed ? "text-[#8E8C87]" : "text-[#F4F2ED]"
                      )}
                    >
                      {isSealed
                        ? `VEILED SILHOUETTE ${numStr}`
                        : cleanV10Text(product.title)}
                    </h3>

                    <div className="mt-2 flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.16em]">
                      <span className="text-[#8E8C87]">
                        {isOneOfOne
                          ? "ONE OF ONE"
                          : `${product.totalUnits} UNITS`}
                      </span>
                      <span className="text-[#F4F2ED] tabular-nums">
                        {isSealed ? "PRIVATE" : formatInr(product.priceInr)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ACT 4: FULL-WIDTH 75VH CINEMA ATELIER BANNER */}
      <section
        aria-label="Sample-first atelier"
        className="relative flex min-h-[75vh] w-full items-end overflow-hidden border-t border-white/10 bg-[#070709]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={V10_MEDIA.atelierCuttingTable}
          alt="KNITX studio cutting table — sample-first garment atelier"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Dramatic Studio Vignette */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#070709]/92 via-[#070709]/65 to-[#070709]/30"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#070709] via-transparent to-[#070709]/40"
        />

        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 py-16 sm:px-12 sm:py-24">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8E8C87]">
            ATELIER · 01/01 CUTTING ROOM · INDIA
          </p>

          <h2 className="mt-4 max-w-4xl font-syne text-4xl font-extrabold uppercase leading-[0.92] tracking-[-0.03em] text-[#F4F2ED] sm:text-6xl lg:text-7xl">
            ONE SAMPLE SHOT.
            <br />
            CUT ONLY WHEN CLAIMED.
          </h2>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/15 pt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-[#F4F2ED]/85">
            <span>0% DEADSTOCK</span>
            <span aria-hidden="true" className="text-white/25">
              ·
            </span>
            <span>1–4 UNITS</span>
            <span aria-hidden="true" className="text-white/25">
              ·
            </span>
            <span>480 GSM</span>
          </div>

          <div className="mt-8">
            <Link
              href="/v11/atelier"
              className="inline-flex items-center gap-3 border border-white/30 bg-white/5 px-8 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F4F2ED] backdrop-blur-md transition-colors duration-300 hover:bg-[#F4F2ED] hover:text-[#070709]"
            >
              <span>THE ATELIER</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ACT 5: SLEEK PRIVATE ACCESS / WAITLIST BAR */}
      <section
        id="v11-access"
        aria-label="Private access waitlist"
        className="scroll-mt-16 border-y border-white/10 bg-[#0C0C0F] py-20 sm:py-28"
      >
        <div className="mx-auto max-w-[1160px] px-6 sm:px-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.26em] text-[#8E8C87]">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-[#C81E1E]"
                />
                <span>PRIVATE ADMISSION · {editionLabel}</span>
              </div>
              <h2 className="mt-3 font-syne text-3xl font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-[#F4F2ED] sm:text-5xl">
                {mounted && showPass ? "YOUR EDITION PASS" : "REQUEST ACCESS"}
              </h2>
            </div>

            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8E8C87] tabular-nums">
              {drop.waitlistCount.toLocaleString("en-IN")} IN QUEUE
            </p>
          </div>

          {mounted && showPass ? (
            /* Brushed-Obsidian Metal Edition Pass */
            <div className="relative mt-10 overflow-hidden border border-white/15 bg-gradient-to-br from-[#18181E] via-[#101014] to-[#0A0A0D] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:p-10">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent"
              />

              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5 font-mono text-[10px] uppercase tracking-[0.24em]">
                <span className="text-[#8E8C87]">
                  KNITX METAL PASS · {editionLabel}
                </span>
                <span className="inline-flex items-center gap-2 text-[#F4F2ED]">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      showUnlocked || showPass.status === "entered"
                        ? "bg-[#C81E1E]"
                        : "bg-[#F4F2ED]"
                    )}
                  />
                  <span>
                    {showUnlocked || showPass.status === "entered"
                      ? "ADMITTED"
                      : "IN QUEUE"}
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-1 gap-8 py-8 md:grid-cols-12 md:items-end">
                <div className="md:col-span-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8E8C87]">
                    QUEUE POSITION
                  </p>
                  <p className="mt-2 font-syne text-5xl font-extrabold leading-none tracking-[-0.03em] text-[#F4F2ED] tabular-nums sm:text-6xl">
                    POSITION #{String(showPass.position).padStart(4, "0")}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:col-span-6">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8E8C87]">
                      MEMBER
                    </p>
                    <p className="mt-1 font-sans text-sm uppercase tracking-[0.06em] text-[#F4F2ED]">
                      {showPass.name}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8E8C87]">
                      EMAIL
                    </p>
                    <p className="mt-1 truncate font-mono text-xs text-[#F4F2ED]/80">
                      {showPass.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
                <Link
                  href="/v11/release"
                  className="inline-flex items-center gap-3 bg-[#F4F2ED] px-8 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#070709] transition-colors duration-300 hover:bg-[#C81E1E] hover:text-white"
                >
                  <span>ENTER RELEASE ROOM</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8E8C87]">
                  PRIORITY NOTIFICATION ACTIVE
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-10">
              {/* Single-Row Editorial Waitlist Bar */}
              <form
                onSubmit={handleWaitlistSubmit}
                noValidate
                className="grid grid-cols-1 gap-3 md:grid-cols-12"
              >
                <input
                  suppressHydrationWarning
                  type="text"
                  aria-label="Full name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (waitlistError) setWaitlistError(null);
                  }}
                  placeholder="YOUR NAME"
                  autoComplete="name"
                  className="border border-white/15 bg-[#070709] px-5 py-4 font-mono text-xs uppercase tracking-[0.18em] text-[#F4F2ED] placeholder:text-[#8E8C87]/70 focus:border-[#F4F2ED] focus:outline-none md:col-span-4"
                />

                <input
                  suppressHydrationWarning
                  type="email"
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (waitlistError) setWaitlistError(null);
                  }}
                  placeholder="EMAIL ADDRESS"
                  autoComplete="email"
                  className="border border-white/15 bg-[#070709] px-5 py-4 font-mono text-xs tracking-[0.14em] text-[#F4F2ED] placeholder:uppercase placeholder:tracking-[0.18em] placeholder:text-[#8E8C87]/70 focus:border-[#F4F2ED] focus:outline-none md:col-span-5"
                />

                <button
                  suppressHydrationWarning
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer bg-[#F4F2ED] px-6 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#070709] transition-colors duration-300 hover:bg-[#C81E1E] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 md:col-span-3"
                >
                  {isSubmitting ? "REGISTERING..." : "REQUEST ACCESS"}
                </button>
              </form>

              {waitlistError ? (
                <p className="mt-3 font-mono text-[11px] tracking-[0.06em] text-[#C81E1E]">
                  {waitlistError}
                </p>
              ) : null}

              {/* Discreet Invitation Code Toggle */}
              <div className="mt-6 border-t border-white/10 pt-5">
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setCodeOpen((open) => !open)}
                  className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.22em] text-[#8E8C87] underline underline-offset-4 transition-colors hover:text-[#F4F2ED]"
                >
                  {codeOpen
                    ? "HIDE INVITATION CODE"
                    : "HAVE AN INVITATION CODE?"}
                </button>

                <AnimatePresence>
                  {codeOpen ? (
                    <motion.form
                      key="v11-inline-code-form"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      onSubmit={handleCodeSubmit}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <input
                          suppressHydrationWarning
                          type="text"
                          aria-label="Invitation code"
                          value={invitationCode}
                          onChange={(e) => {
                            setInvitationCode(e.target.value);
                            if (codeError) setCodeError(null);
                          }}
                          placeholder="ENTER CODE (E.G. KNITX-001)"
                          autoComplete="off"
                          spellCheck={false}
                          className="w-full border border-white/15 bg-[#070709] px-5 py-3.5 font-mono text-xs uppercase tracking-[0.24em] text-[#F4F2ED] placeholder:text-[#8E8C87]/70 focus:border-[#F4F2ED] focus:outline-none sm:max-w-xs"
                        />
                        <button
                          suppressHydrationWarning
                          type="submit"
                          className="cursor-pointer border border-white/30 bg-white/5 px-6 py-3.5 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F4F2ED] transition-colors hover:bg-[#F4F2ED] hover:text-[#070709]"
                        >
                          ENTER RELEASE
                        </button>
                        <button
                          suppressHydrationWarning
                          type="button"
                          onClick={() => {
                            setInvitationCode("KNITX-001");
                            setCodeError(null);
                          }}
                          className="cursor-pointer text-left font-mono text-[10px] uppercase tracking-[0.2em] text-[#8E8C87] underline underline-offset-4 hover:text-[#F4F2ED]"
                        >
                          PREVIEW: KNITX-001
                        </button>
                      </div>
                      {codeError ? (
                        <p className="mt-2.5 font-mono text-[11px] text-[#C81E1E]">
                          {codeError}
                        </p>
                      ) : null}
                    </motion.form>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ACT 6: FULL-BLEED 50/50 COMMUNITY SPLIT + RELEASES ARCHIVE BAR */}
      <section aria-label="Community ballot and creator program">
        <div className="grid grid-cols-1 gap-[2px] bg-[#070709] md:grid-cols-2">
          {/* Left Panel: Community Ballot */}
          <Link
            href="/v11/vote"
            className="group relative flex min-h-[56vh] items-center justify-center overflow-hidden bg-[#0B0B0D] p-8 text-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={V10_MEDIA.knit1of1}
              alt="Community ballot — vote on upcoming KNITX silhouettes"
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[#070709]/60 transition-colors duration-500 group-hover:bg-[#070709]/48"
            />
            <div className="relative z-10 max-w-md">
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#F4F2ED]/80">
                {candidateCount} CONCEPTS OPEN
              </p>
              <h2 className="mt-3 font-syne text-3xl font-extrabold uppercase leading-[0.94] tracking-[-0.02em] text-[#F4F2ED] sm:text-5xl">
                COMMUNITY BALLOT
              </h2>
              <span className="mt-6 inline-flex items-center gap-2 border-b border-white/40 pb-1 font-mono text-[10px] uppercase tracking-[0.24em] text-[#F4F2ED] transition-colors group-hover:border-[#C81E1E] group-hover:text-[#F4F2ED]">
                <span>CAST YOUR VOTE</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </Link>

          {/* Right Panel: Submit A Design */}
          <Link
            href="/v11/submit"
            className="group relative flex min-h-[56vh] items-center justify-center overflow-hidden bg-[#0B0B0D] p-8 text-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={V10_MEDIA.chainStitchTee}
              alt="Creator program — submit a design to KNITX"
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[#070709]/60 transition-colors duration-500 group-hover:bg-[#070709]/48"
            />
            <div className="relative z-10 max-w-md">
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#F4F2ED]/80">
                CREATOR PROGRAM
              </p>
              <h2 className="mt-3 font-syne text-3xl font-extrabold uppercase leading-[0.94] tracking-[-0.02em] text-[#F4F2ED] sm:text-5xl">
                SUBMIT A DESIGN
              </h2>
              <span className="mt-6 inline-flex items-center gap-2 border-b border-white/40 pb-1 font-mono text-[10px] uppercase tracking-[0.24em] text-[#F4F2ED] transition-colors group-hover:border-[#C81E1E] group-hover:text-[#F4F2ED]">
                <span>OPEN CREATOR BRIEF</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </div>

        {/* Sleek Multi-Release Archive Bar */}
        <Link
          href="/v11/releases"
          className="group block border-t border-white/10 bg-[#0A0A0D] transition-colors duration-300 hover:bg-[#111116]"
        >
          <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-12">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#8E8C87]">
                MULTI-RELEASE ARCHIVE
              </span>
              <span className="font-syne text-lg font-bold uppercase tracking-[0.02em] text-[#F4F2ED] sm:text-xl">
                EXPLORE CURRENT &amp; UPCOMING EDITIONS
              </span>
            </div>
            <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#F4F2ED] transition-colors group-hover:text-[#C81E1E]">
              <span>VIEW RELEASES</span>
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </Link>
      </section>

      {/* OBSIDIAN QUICK-INSPECT GARMENT DRAWER */}
      <AnimatePresence>
        {inspectProduct ? (
          <>
            <motion.div
              key="v11-home-inspect-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setInspectProduct(null)}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
            />

            <motion.aside
              key="v11-home-inspect-panel"
              role="dialog"
              aria-modal="true"
              aria-label={cleanV10Text(inspectProduct.title)}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col overflow-y-auto border-l border-white/10 bg-[#0B0B0D] text-[#F4F2ED]"
            >
              {/* Top Sticky Bar */}
              <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#0B0B0D]/95 px-6 backdrop-blur-md">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8E8C87]">
                  {inspectProduct.serialCode} ·{" "}
                  {inspectProduct.tier === "one-of-one"
                    ? "ONE OF ONE"
                    : `EDITION OF ${String(inspectProduct.totalUnits).padStart(2, "0")}`}
                </span>
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setInspectProduct(null)}
                  aria-label="Close garment preview"
                  className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8E8C87] transition-colors hover:text-white"
                >
                  <span>CLOSE</span>
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Studio Photograph */}
              <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-[#070709]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getV10ProductImage(
                    inspectProduct,
                    inspectIndex,
                    showUnlocked
                  )}
                  alt={cleanV10Text(inspectProduct.title)}
                  className="h-full w-full object-cover object-center"
                />
              </div>

              {/* Details & Action */}
              <div className="flex-1 space-y-7 p-6 sm:p-8">
                <div>
                  <div className="flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.2em]">
                    <span className="inline-flex items-center gap-2 text-[#F4F2ED]">
                      {inspectProduct.tier === "one-of-one" ? (
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 rounded-full bg-[#C81E1E]"
                        />
                      ) : null}
                      <span>
                        {inspectProduct.tier === "one-of-one"
                          ? "ONE OF ONE COLLECTOR PIECE"
                          : `SMALL BATCH · ${inspectProduct.totalUnits} UNITS`}
                      </span>
                    </span>
                    <span className="text-[#8E8C87]">{editionLabel}</span>
                  </div>

                  <h3 className="mt-2.5 font-syne text-3xl font-extrabold uppercase leading-[0.98] tracking-[-0.02em] text-[#F4F2ED]">
                    {cleanV10Text(inspectProduct.title)}
                  </h3>

                  <div className="mt-4 flex items-baseline justify-between border-b border-white/10 pb-5 font-mono">
                    <span className="text-base text-[#F4F2ED] tabular-nums">
                      {formatInr(inspectProduct.priceInr)}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#8E8C87]">
                      {inspectProduct.gsmWeight} · {inspectProduct.productionDays}{" "}
                      DAYS CUT-TO-ORDER
                    </span>
                  </div>

                  <p className="mt-5 font-sans text-sm leading-relaxed text-[#8E8C87]">
                    {cleanV10Text(inspectProduct.description)}
                  </p>
                </div>

                {/* Fabric & Craftsmanship */}
                <div className="border-y border-white/10 py-4 font-mono text-[11px]">
                  <div className="flex justify-between gap-4 py-1.5">
                    <span className="uppercase tracking-[0.18em] text-[#8E8C87]">
                      FABRIC
                    </span>
                    <span className="text-right font-sans text-xs text-[#F4F2ED]">
                      {cleanV10Text(inspectProduct.fabric)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 py-1.5">
                    <span className="uppercase tracking-[0.18em] text-[#8E8C87]">
                      AVAILABILITY
                    </span>
                    <span className="text-right uppercase tracking-[0.14em] text-[#F4F2ED]">
                      {inspectProduct.remainingUnits <= 0
                        ? "SOLD OUT"
                        : `${inspectProduct.remainingUnits} OF ${inspectProduct.totalUnits} LEFT`}
                    </span>
                  </div>
                </div>

                {/* Size Selector when Unlocked */}
                {showUnlocked ? (
                  <div>
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8E8C87]">
                      SELECT SIZE
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {inspectProduct.sizes.map((size) => {
                        const active = selectedSize === size;
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
                              active
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
                ) : null}

                {bagFeedback ? (
                  <p className="font-mono text-xs text-[#C81E1E]">
                    {bagFeedback}
                  </p>
                ) : null}

                <div className="space-y-3 pt-1">
                  <button
                    suppressHydrationWarning
                    type="button"
                    disabled={showUnlocked && inspectProduct.remainingUnits <= 0}
                    onClick={handleQuickAddToBag}
                    className="w-full cursor-pointer bg-[#F4F2ED] px-6 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#070709] transition-colors duration-300 hover:bg-[#C81E1E] hover:text-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[#8E8C87]"
                  >
                    {showUnlocked
                      ? inspectProduct.remainingUnits > 0
                        ? `ADD TO BAG — ${formatInr(inspectProduct.priceInr)}`
                        : "EDITION CLAIMED — SOLD OUT"
                      : "ENTER PRIVATE RELEASE TO RESERVE"}
                  </button>

                  {!showUnlocked ? (
                    <a
                      href="#v11-access"
                      onClick={() => setInspectProduct(null)}
                      className="block w-full border border-white/20 py-3.5 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-[#F4F2ED]/80 transition-colors hover:border-white hover:text-white"
                    >
                      JOIN WAITLIST FOR ADMISSION
                    </a>
                  ) : null}
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
