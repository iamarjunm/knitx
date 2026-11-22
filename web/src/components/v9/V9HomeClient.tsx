"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  KeyRound,
  Lock,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import type { DropCampaign, Product } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";
import V9Hero from "./V9Hero";
import { V9GarmentDrawer } from "./V9VaultPageClient";

interface V9HomeClientProps {
  drop: DropCampaign;
  products: Product[];
}

const CLARITY_STEPS = [
  {
    number: "01",
    title: "Join the Queue",
    body: "Claim a numbered position on the Drop 01 ledger. Private invitations release in strict numerical order.",
  },
  {
    number: "02",
    title: "Unlock All 10 Pieces",
    body: "When your number is called, your personal access key unseals every silhouette — including 5 classified vault works.",
  },
  {
    number: "03",
    title: "Cut & Sewn to Order — Zero Deadstock",
    body: "Only one studio sample exists for documentation. Your garment is cut after you order and the pattern is retired forever.",
  },
] as const;

const EDITORIAL_DOORWAYS = [
  {
    tag: "01 · VOTE DROP 02",
    href: "/v9/vote",
    title: "CURATE THE NEXT EDITION",
    description:
      "Allocate 5 curator tokens to decide what we produce next.",
    cta: "OPEN VOTING LEDGER",
  },
  {
    tag: "02 · SUBMIT A DESIGN",
    href: "/v9/submit",
    title: "PROPOSE A SILHOUETTE",
    description:
      "Win the community vote and we cut, credit & promote your piece.",
    cta: "SUBMIT YOUR CONCEPT",
  },
  {
    tag: "03 · SAMPLE-FIRST CRAFT",
    href: "/v9/craft",
    title: "THE ZERO-DEADSTOCK ATELIER",
    description:
      "One studio sample for shoots. Zero warehouse deadstock.",
    cta: "READ THE ATELIER NOTES",
  },
] as const;

export default function V9HomeClient({ drop, products }: V9HomeClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    waitlistPass,
    isVaultUnlocked,
    joinWaitlist,
    unlockVaultDemo,
    unlockVaultWithCode,
  } = useVault();

  const [mounted, setMounted] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [curtainParted, setCurtainParted] = useState(false);

  // Waitlist Envelope State
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [joining, setJoining] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  // Quiet Passcode Input State
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    setNameInput((prev) => prev || user.displayName || "");
    setEmailInput((prev) => prev || user.email || "");
  }, [mounted, user]);

  // Curate ONLY 4 Spotlight items: 1 One-of-One + 2 Small-Batch + 1 Interactive Mystery Curtain
  const { featuredOneOfOne, featuredSmallBatch, mysteryCount, mysteryBackdrop } =
    useMemo(() => {
      const kaliBomber = products.find(
        (p) =>
          p.tier === "one-of-one" &&
          p.title.toUpperCase().includes("KALI ARCHIVE BOMBER")
      );
      const fallbackOneOfOne =
        kaliBomber ||
        products.find((p) => p.tier === "one-of-one" && !p.isMystery) ||
        products.find((p) => p.tier === "one-of-one") ||
        products[0] ||
        null;

      const revealedSmallBatch = products
        .filter(
          (p) =>
            p.tier === "small-batch" &&
            !p.isMystery &&
            p._id !== fallbackOneOfOne?._id
        )
        .slice(0, 2);

      const fallbackSmallBatch =
        revealedSmallBatch.length >= 2
          ? revealedSmallBatch
          : products
              .filter((p) => p._id !== fallbackOneOfOne?._id && !p.isMystery)
              .slice(0, 2);

      const sealedList = products.filter((p) => p.isMystery);
      const sealedCount = sealedList.length > 0 ? sealedList.length : 5;
      const backdropImg =
        sealedList[0]?.silhouetteUrl ||
        sealedList[0]?.imageUrl ||
        "/images/look-mystery-veil.jpg";

      return {
        featuredOneOfOne: fallbackOneOfOne,
        featuredSmallBatch: fallbackSmallBatch,
        mysteryCount: sealedCount,
        mysteryBackdrop: backdropImg,
      };
    }, [products]);

  const activePass = mounted ? waitlistPass : null;
  const vaultOpen = mounted && isVaultUnlocked;
  const envelopeOpened = Boolean(activePass);

  const handleWaitlistSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setWaitlistError(null);

    const cleanName = nameInput.trim();
    const cleanEmail = emailInput.trim();

    if (!cleanName) {
      setWaitlistError("Please enter your full name for the Drop 01 ledger.");
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setWaitlistError("Please enter a valid email address for dispatch.");
      return;
    }

    setJoining(true);
    try {
      await joinWaitlist(cleanName, cleanEmail);
    } catch (err) {
      setWaitlistError(
        err instanceof Error
          ? err.message
          : "Unable to register right now. Please try again."
      );
    } finally {
      setJoining(false);
    }
  };

  const handleSimulateNumberCalled = () => {
    unlockVaultDemo();
    router.push("/v9/vault");
  };

  const handlePasscodeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCodeError(null);
    const ok = unlockVaultWithCode(codeInput);
    if (!ok) {
      setCodeError("Unrecognized key. Try your ledger pass or KNITX-001.");
      return;
    }
    router.push("/v9/vault");
  };

  return (
    <main className="w-full bg-[#F7F5F0] text-[#111110]">
      {/* SECTION 1: Monumental Kinetic Scroll-Split Hero + Expanding Arch Portal */}
      <V9Hero drop={drop} />

      {/* SECTION 2: 3-Step Instant Clarity Strip */}
      <section className="w-full border-y border-[#DDD7CB] bg-[#F7F5F0]">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-8 sm:py-20">
          <div className="grid grid-cols-1 divide-y divide-[#DDD7CB] md:grid-cols-3 md:divide-x md:divide-y-0">
            {CLARITY_STEPS.map((step) => (
              <div
                key={step.number}
                className="flex flex-col gap-3 py-8 first:pt-0 last:pb-0 md:px-8 md:py-2 md:first:pl-0 md:last:pr-0"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold tracking-[0.22em] text-[#8E1C1C]">
                    {step.number}
                  </span>
                  <span className="h-px flex-1 bg-[#DDD7CB]" />
                </div>
                <h2 className="font-poster text-2xl tracking-[0.02em] text-[#111110] uppercase sm:text-3xl">
                  {step.title}
                </h2>
                <p className="font-sans text-sm leading-relaxed text-[#6A655D]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: Curated Drop 01 Spotlight (EXACTLY 4 Curated Cards) */}
      <section className="w-full bg-[#F7F5F0] py-20 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
          {/* Editorial Section Header */}
          <div className="flex flex-col justify-between gap-6 border-b border-[#DDD7CB] pb-8 md:flex-row md:items-end">
            <div>
              <p className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.26em] text-[#8E1C1C] uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8E1C1C]" />
                <span>DROP 01 · CURATED SPOTLIGHT</span>
              </p>
              <h2 className="mt-3 font-poster text-4xl leading-[0.92] tracking-[0.01em] text-[#111110] uppercase sm:text-6xl">
                FOUR GLIMPSES FROM THE TEN.
              </h2>
            </div>
            <p className="max-w-sm font-sans text-sm leading-relaxed text-[#6A655D]">
              Inspect three revealed pieces directly, or part the silk gauze to
              preview the sealed archive awaiting inside the vault.
            </p>
          </div>

          {/* 4-Card Curated Architectural Grid */}
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Featured 1-of-1 Collector Piece */}
            {featuredOneOfOne && (
              <motion.article
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#DDD7CB] bg-[#FFFFFF] shadow-[0_14px_38px_-28px_rgba(17,17,16,0.22)] transition-colors duration-300 hover:border-[#9A7B4F]"
              >
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setSelectedProduct(featuredOneOfOne)}
                  className="flex h-full cursor-pointer flex-col text-left focus:outline-none"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#ECE8DF]">
                    <img
                      src={featuredOneOfOne.imageUrl}
                      alt={featuredOneOfOne.title}
                      className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 rounded-full border border-[#9A7B4F]/45 bg-[#111110]/90 px-3 py-1 backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#9A7B4F]" />
                      <span className="font-mono text-[9px] font-medium tracking-[0.18em] text-[#F7F5F0] uppercase">
                        1-OF-1 COLLECTOR
                      </span>
                    </div>
                    <div className="absolute right-3.5 bottom-3.5 rounded-full bg-[#FFFFFF]/92 px-3 py-1 font-mono text-[10px] tracking-[0.14em] text-[#111110] uppercase backdrop-blur-md">
                      {featuredOneOfOne.gsmWeight}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.2em] text-[#9A7B4F] uppercase">
                        {featuredOneOfOne.serialCode} · SINGLE EDITION
                      </p>
                      <h3 className="mt-1.5 font-poster text-2xl leading-[1.02] tracking-[0.01em] text-[#111110] uppercase transition-colors group-hover:text-[#8E1C1C]">
                        {featuredOneOfOne.title}
                      </h3>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-[#DDD7CB]/80 pt-3.5">
                      <span className="font-mono text-sm font-semibold text-[#111110]">
                        {formatInr(featuredOneOfOne.priceInr)}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.16em] text-[#6A655D] uppercase transition-colors group-hover:text-[#8E1C1C]">
                        <span>INSPECT</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </button>
              </motion.article>
            )}

            {/* Cards 2 & 3: Two Featured Small-Batch Pieces */}
            {featuredSmallBatch.map((product) => (
              <motion.article
                key={product._id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#DDD7CB] bg-[#FFFFFF] shadow-[0_14px_38px_-28px_rgba(17,17,16,0.22)] transition-colors duration-300 hover:border-[#111110]/40"
              >
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setSelectedProduct(product)}
                  className="flex h-full cursor-pointer flex-col text-left focus:outline-none"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#ECE8DF]">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute top-3.5 left-3.5 rounded-full border border-[#DDD7CB] bg-[#F7F5F0]/92 px-3 py-1 backdrop-blur-md">
                      <span className="font-mono text-[9px] font-medium tracking-[0.18em] text-[#111110] uppercase">
                        SMALL-BATCH · {product.remainingUnits}/
                        {product.totalUnits} LEFT
                      </span>
                    </div>
                    <div className="absolute right-3.5 bottom-3.5 rounded-full bg-[#FFFFFF]/92 px-3 py-1 font-mono text-[10px] tracking-[0.14em] text-[#111110] uppercase backdrop-blur-md">
                      {product.gsmWeight}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.2em] text-[#6A655D] uppercase">
                        {product.serialCode} · {product.totalUnits} UNITS TOTAL
                      </p>
                      <h3 className="mt-1.5 font-poster text-2xl leading-[1.02] tracking-[0.01em] text-[#111110] uppercase transition-colors group-hover:text-[#8E1C1C]">
                        {product.title}
                      </h3>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-[#DDD7CB]/80 pt-3.5">
                      <span className="font-mono text-sm font-semibold text-[#111110]">
                        {formatInr(product.priceInr)}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.16em] text-[#6A655D] uppercase transition-colors group-hover:text-[#8E1C1C]">
                        <span>INSPECT</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </button>
              </motion.article>
            ))}

            {/* Card 4: Interactive Parting Silk-Gauze Curtain Mystery Preview */}
            <motion.article
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={() => setCurtainParted(true)}
              onMouseLeave={() => setCurtainParted(false)}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#DDD7CB] bg-[#FFFFFF] shadow-[0_14px_38px_-28px_rgba(17,17,16,0.22)] transition-colors duration-300 hover:border-[#8E1C1C]"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#ECE8DF]">
                {/* Underlying Sealed Silhouette Preview */}
                <img
                  src={mysteryBackdrop}
                  alt="Sealed Drop 01 archive silhouettes behind silk gauze"
                  className={cn(
                    "h-full w-full object-cover object-center transition-all duration-700 ease-out",
                    curtainParted
                      ? "scale-105 brightness-95"
                      : "scale-100 blur-[3px] brightness-90"
                  )}
                />

                {/* Left Silk-Gauze Curtain Panel */}
                <motion.div
                  aria-hidden="true"
                  animate={{ x: curtainParted ? "-44%" : "0%" }}
                  transition={{
                    type: "spring",
                    stiffness: 170,
                    damping: 24,
                  }}
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/2 border-r border-[#DDD7CB]/90 bg-[#F7F5F0]/82 backdrop-blur-md"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(90deg, rgba(17,17,16,0.03) 0px, rgba(17,17,16,0.03) 1px, transparent 1px, transparent 10px)",
                  }}
                />

                {/* Right Silk-Gauze Curtain Panel */}
                <motion.div
                  aria-hidden="true"
                  animate={{ x: curtainParted ? "44%" : "0%" }}
                  transition={{
                    type: "spring",
                    stiffness: 170,
                    damping: 24,
                  }}
                  className="pointer-events-none absolute inset-y-0 right-0 w-1/2 border-l border-[#DDD7CB]/90 bg-[#F7F5F0]/82 backdrop-blur-md"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(90deg, rgba(17,17,16,0.03) 0px, rgba(17,17,16,0.03) 1px, transparent 1px, transparent 10px)",
                  }}
                />

                {/* Center Seal & Interactive Toggle for Touch Devices */}
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setCurtainParted((prev) => !prev)}
                    aria-label="Part silk gauze curtain preview"
                    className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-[#9A7B4F] bg-[#8E1C1C] text-[#F7F5F0] shadow-[0_12px_28px_-10px_rgba(142,28,28,0.65)] transition-transform duration-300 group-hover:scale-105"
                  >
                    <Lock className="h-4 w-4 stroke-[2]" />
                  </button>

                  <span className="mt-4 rounded-full border border-[#DDD7CB] bg-[#F7F5F0]/92 px-3 py-1 font-mono text-[9px] font-medium tracking-[0.2em] text-[#111110] uppercase backdrop-blur-md">
                    {curtainParted ? "CURTAIN PARTED" : "HOVER TO PART GAUZE"}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-[#8E1C1C] uppercase">
                    CLASSIFIED ARCHIVE · VAULT ONLY
                  </p>
                  <h3 className="mt-1.5 font-poster text-2xl leading-[1.02] tracking-[0.01em] text-[#111110] uppercase">
                    {mysteryCount} MORE SEALED INSIDE THE VAULT
                  </h3>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#DDD7CB]/80 pt-3.5">
                  <span className="font-mono text-[11px] tracking-[0.14em] text-[#6A655D] uppercase">
                    {vaultOpen ? "UNLOCKED" : "KEY REQUIRED"}
                  </span>
                  <Link
                    href="/v9/vault"
                    className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#8E1C1C] uppercase transition-opacity hover:opacity-75"
                  >
                    <span>OPEN VAULT</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </motion.article>
          </div>

          {/* Primary Spotlight Vault CTA */}
          <div className="mt-12 flex justify-center">
            <Link
              href="/v9/vault"
              className="group inline-flex items-center gap-3 rounded-full bg-[#111110] px-8 py-4 font-sans text-xs font-medium tracking-[0.18em] text-[#F7F5F0] uppercase shadow-[0_20px_44px_-24px_rgba(17,17,16,0.45)] transition-colors duration-200 hover:bg-[#8E1C1C]"
            >
              <span>VIEW ALL 10 PIECES IN THE VAULT</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 4: Tactile Wax-Sealed Cotton Envelope Waitlist (#waitlist) */}
      <section
        id="waitlist"
        className="w-full scroll-mt-24 border-y border-[#DDD7CB] bg-[#ECE8DF] py-20 sm:py-28"
      >
        <div className="mx-auto max-w-[1040px] px-4 sm:px-8">
          {/* Editorial Heading */}
          <div className="text-center">
            <p className="inline-flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.26em] text-[#8E1C1C] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9A7B4F]" />
              <span>PRIVATE DISPATCH · DROP 01 LEDGER</span>
            </p>
            <h2 className="mt-3 font-poster text-4xl leading-[0.92] tracking-[0.01em] text-[#111110] uppercase sm:text-6xl">
              THE WAX-SEALED INVITATION.
            </h2>
            <p className="mx-auto mt-3 max-w-lg font-sans text-sm leading-relaxed text-[#6A655D]">
              Register your name on the cotton dispatch card below. When your
              queue number is called, your personal access key unseals the
              entire vault.
            </p>
          </div>

          {/* Hinged Cotton Linen Envelope */}
          <div className="relative mx-auto mt-12 max-w-[680px]">
            <div className="relative overflow-hidden rounded-[24px] border border-[#DDD7CB] bg-[#FBF9F5] shadow-[0_32px_80px_-42px_rgba(17,17,16,0.28)]">
              {/* Top Hinged Flap Graphic */}
              <div className="relative h-28 w-full overflow-hidden border-b border-[#DDD7CB]/80 bg-[#F3EFE6] sm:h-32">
                <motion.div
                  animate={{
                    rotateX: envelopeOpened ? 165 : 0,
                    opacity: envelopeOpened ? 0.35 : 1,
                  }}
                  transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: "top center" }}
                  className="absolute inset-0 flex items-end justify-center"
                >
                  <svg
                    viewBox="0 0 680 128"
                    preserveAspectRatio="none"
                    className="h-full w-full"
                    aria-hidden="true"
                  >
                    <polygon
                      points="0,0 680,0 340,122"
                      fill="#FFFFFF"
                      stroke="#DDD7CB"
                      strokeWidth="1.5"
                    />
                  </svg>
                </motion.div>

                {/* Embossed Oxblood Wax Seal with Antique Brass KX Monogram */}
                <motion.div
                  animate={{
                    scale: envelopeOpened ? 0.88 : 1,
                    y: envelopeOpened ? -10 : 0,
                  }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#9A7B4F] bg-[#8E1C1C] shadow-[0_12px_24px_-8px_rgba(142,28,28,0.6),inset_0_2px_6px_rgba(255,255,255,0.22)]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#9A7B4F]/60">
                      <span className="font-poster text-lg tracking-[0.08em] text-[#E6CFA8]">
                        KX
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Envelope Interior Body */}
              <div className="p-6 sm:p-10">
                <AnimatePresence mode="wait">
                  {envelopeOpened && activePass ? (
                    /* SLIDE-OUT ENGRAVED WHITE LETTERPRESS CARD */
                    <motion.div
                      key="letterpress-pass"
                      initial={{ opacity: 0, y: 28 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                      className="rounded-2xl border border-[#DDD7CB] bg-[#FFFFFF] p-6 shadow-[0_20px_50px_-30px_rgba(17,17,16,0.2)] sm:p-8"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDD7CB] pb-4">
                        <span className="font-mono text-[10px] tracking-[0.22em] text-[#6A655D] uppercase">
                          KNITX ARCHIVE PASS · INDIA
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#9A7B4F]/45 bg-[#F7F5F0] px-3 py-1 font-mono text-[9px] font-semibold tracking-[0.18em] text-[#9A7B4F] uppercase">
                          <Check className="h-3 w-3" />
                          <span>EMAIL UPDATES ACTIVE</span>
                        </span>
                      </div>

                      <div className="mt-6 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                        <div>
                          <p className="font-mono text-[10px] tracking-[0.22em] text-[#8E1C1C] uppercase">
                            RESERVED LEDGER NUMBER
                          </p>
                          <p className="mt-1 font-poster text-5xl leading-none tracking-[0.02em] text-[#111110] sm:text-6xl">
                            #{activePass.position.toLocaleString("en-IN")}
                          </p>
                          <p className="mt-2 font-sans text-xs text-[#6A655D]">
                            Issued to{" "}
                            <span className="font-medium text-[#111110]">
                              {activePass.name}
                            </span>{" "}
                            · {activePass.email}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#DDD7CB] bg-[#F7F5F0] px-4 py-3 text-left sm:text-right">
                          <p className="font-mono text-[9px] tracking-[0.2em] text-[#6A655D] uppercase">
                            PERSONAL ACCESS KEY
                          </p>
                          <p className="mt-1 font-mono text-base font-semibold tracking-[0.18em] text-[#111110]">
                            {activePass.accessCode}
                          </p>
                        </div>
                      </div>

                      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          suppressHydrationWarning
                          onClick={handleSimulateNumberCalled}
                          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#8E1C1C] px-6 py-4 font-sans text-[11px] font-medium tracking-[0.16em] text-white uppercase transition-colors duration-200 hover:bg-[#721515]"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>SIMULATE NUMBER CALLED → ENTER VAULT</span>
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    /* COTTON ENVELOPE REGISTRATION FORM */
                    <motion.form
                      key="envelope-form"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.35 }}
                      onSubmit={handleWaitlistSubmit}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="v9-waitlist-name"
                            className="block font-mono text-[10px] tracking-[0.2em] text-[#6A655D] uppercase"
                          >
                            FULL NAME
                          </label>
                          <input
                            id="v9-waitlist-name"
                            type="text"
                            suppressHydrationWarning
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            placeholder="Aarav Kapoor"
                            className="w-full rounded-xl border border-[#DDD7CB] bg-[#FFFFFF] px-4 py-3.5 font-sans text-sm text-[#111110] placeholder:text-[#6A655D]/60 focus:border-[#8E1C1C] focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="v9-waitlist-email"
                            className="block font-mono text-[10px] tracking-[0.2em] text-[#6A655D] uppercase"
                          >
                            DISPATCH EMAIL
                          </label>
                          <input
                            id="v9-waitlist-email"
                            type="email"
                            suppressHydrationWarning
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="collector@domain.in"
                            className="w-full rounded-xl border border-[#DDD7CB] bg-[#FFFFFF] px-4 py-3.5 font-sans text-sm text-[#111110] placeholder:text-[#6A655D]/60 focus:border-[#8E1C1C] focus:outline-none"
                          />
                        </div>
                      </div>

                      {waitlistError && (
                        <p className="font-mono text-[11px] text-[#8E1C1C]">
                          {waitlistError}
                        </p>
                      )}

                      <button
                        type="submit"
                        suppressHydrationWarning
                        disabled={joining}
                        className="inline-flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-[#8E1C1C] px-7 py-4 font-sans text-xs font-medium tracking-[0.18em] text-white uppercase transition-colors duration-200 hover:bg-[#721515] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span>
                          {joining
                            ? "SEALING YOUR LEDGER CARD..."
                            : "BREAK SEAL & CLAIM NUMBER"}
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </button>

                      <p className="text-center font-mono text-[10px] tracking-[0.18em] text-[#6A655D] uppercase">
                        {drop.waitlistCount.toLocaleString("en-IN")} COLLECTORS
                        IN QUEUE · NO SPAM · ONE DISPATCH WHEN CALLED
                      </p>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Quiet Master / Personal Passcode Unlock Strip */}
                <div className="mt-7 border-t border-[#DDD7CB] pt-6">
                  <form
                    onSubmit={handlePasscodeSubmit}
                    className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-2 text-[#6A655D] sm:pr-2">
                      <KeyRound className="h-3.5 w-3.5 text-[#9A7B4F]" />
                      <span className="font-mono text-[10px] tracking-[0.18em] uppercase">
                        HAVE A KEY?
                      </span>
                    </div>

                    <input
                      type="text"
                      suppressHydrationWarning
                      value={codeInput}
                      onChange={(e) => {
                        setCodeInput(e.target.value);
                        setCodeError(null);
                      }}
                      placeholder="KNITX-001"
                      aria-label="Enter vault invitation key"
                      className="flex-1 rounded-full border border-[#DDD7CB] bg-[#FFFFFF] px-4 py-2.5 font-mono text-xs tracking-[0.16em] text-[#111110] uppercase placeholder:text-[#6A655D]/55 focus:border-[#111110] focus:outline-none"
                    />

                    <button
                      type="submit"
                      suppressHydrationWarning
                      className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#111110] bg-[#111110] px-5 py-2.5 font-mono text-[10px] font-medium tracking-[0.18em] text-[#F7F5F0] uppercase transition-colors duration-200 hover:border-[#8E1C1C] hover:bg-[#8E1C1C]"
                    >
                      <span>UNLOCK</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </form>

                  {codeError && (
                    <p className="mt-2 font-mono text-[10px] text-[#8E1C1C]">
                      {codeError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: 3 Editorial Doorways */}
      <section className="w-full bg-[#F7F5F0] py-20 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
          <div className="flex flex-col justify-between gap-4 pb-10 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[10px] tracking-[0.26em] text-[#6A655D] uppercase">
                BEYOND DROP 01
              </p>
              <h2 className="mt-2 font-poster text-4xl leading-[0.92] tracking-[0.01em] text-[#111110] uppercase sm:text-5xl">
                ENTER THE HOUSE.
              </h2>
            </div>
            <p className="max-w-sm font-sans text-sm text-[#6A655D]">
              Every silhouette is shaped by collectors, independent designers,
              and our sample-first atelier discipline.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 sm:gap-8">
            {EDITORIAL_DOORWAYS.map((doorway) => (
              <Link
                key={doorway.href}
                href={doorway.href}
                className="group flex flex-col justify-between rounded-2xl border border-[#DDD7CB] bg-[#FFFFFF] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#8E1C1C] hover:shadow-[0_24px_54px_-32px_rgba(142,28,28,0.22)] sm:p-9"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-semibold tracking-[0.22em] text-[#8E1C1C] uppercase">
                      {doorway.tag}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-[#6A655D] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#8E1C1C]" />
                  </div>

                  <h3 className="mt-6 font-poster text-3xl leading-[0.98] tracking-[0.01em] text-[#111110] uppercase">
                    {doorway.title}
                  </h3>

                  <p className="mt-3 font-sans text-sm leading-relaxed text-[#6A655D]">
                    {doorway.description}
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-2 border-t border-[#DDD7CB]/80 pt-5 font-mono text-[10px] font-semibold tracking-[0.18em] text-[#111110] uppercase transition-colors group-hover:text-[#8E1C1C]">
                  <span>{doorway.cta}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Shared Garment Drawer for Instant Spotlight Inspection */}
      <V9GarmentDrawer
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </main>
  );
}
