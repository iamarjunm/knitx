"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUp,
  Bell,
  Check,
  Copy,
  KeyRound,
  Lock,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Unlock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import type { DropCampaign } from "@/lib/types";
import { cn } from "@/lib/utils";

interface V3PassbookWaitlistProps {
  drop: DropCampaign;
}

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");

function formatCount(value: number): string {
  return NUMBER_FORMATTER.format(Math.max(0, Math.floor(value)));
}

export default function V3PassbookWaitlist({ drop }: V3PassbookWaitlistProps) {
  const { user } = useAuth();
  const {
    waitlistPass,
    isVaultUnlocked,
    joinWaitlist,
    unlockVaultDemo,
    unlockVaultWithCode,
  } = useVault();

  const [mounted, setMounted] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>("");
  const [emailInput, setEmailInput] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [codeInput, setCodeInput] = useState<string>("");
  const [codeFeedback, setCodeFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [showCoverPreview, setShowCoverPreview] = useState<boolean>(false);
  const [isTurningKey, setIsTurningKey] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-fill name/email from active session once mounted (never during SSR)
  useEffect(() => {
    if (!mounted || !user) return;
    setNameInput((prev) => (prev.trim() ? prev : user.displayName || ""));
    setEmailInput((prev) => (prev.trim() ? prev : user.email || ""));
  }, [mounted, user]);

  const activePass = mounted ? waitlistPass : null;
  const vaultOpen = mounted && isVaultUnlocked;
  const isBookOpen = Boolean(activePass) && !showCoverPreview;

  const totalSlots = Math.max(drop.totalSlots || 2500, 1);
  const baseIssued = drop.waitlistCount || 1842;
  const issuedCount = useMemo(() => {
    if (!activePass) return baseIssued;
    return Math.min(totalSlots, Math.max(baseIssued + 1, activePass.position));
  }, [activePass, baseIssued, totalSlots]);

  const fillPercent = Math.min(100, Math.round((issuedCount / totalSlots) * 1000) / 10);
  const remainingSlots = Math.max(0, totalSlots - issuedCount);

  const formattedQueueNo = activePass
    ? `NO. ${String(activePass.position).padStart(6, "0")}`
    : "NO. 001843";

  const scrollToLockers = () => {
    if (typeof document === "undefined") return;
    const el = document.getElementById("lockers");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleIssuePassbook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = nameInput.trim();
    const cleanEmail = emailInput.trim().toLowerCase();

    if (cleanName.length < 2) {
      setFormError("Please enter your full name for the archive ledger.");
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError("Please enter a valid email address to receive your passbook.");
      return;
    }

    setSubmitting(true);
    try {
      await joinWaitlist(cleanName, cleanEmail);
      setShowCoverPreview(false);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to issue your passbook right now. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCodeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleaned = codeInput.trim().toUpperCase();
    if (!cleaned) {
      setCodeFeedback({
        type: "error",
        message: "Enter an access key such as KNITX-001.",
      });
      return;
    }

    const ok = unlockVaultWithCode(cleaned);
    if (ok) {
      setCodeFeedback({
        type: "success",
        message: "Vault seal lifted. All 5 steel lockers are now unlocked.",
      });
    } else {
      setCodeFeedback({
        type: "error",
        message: "Key not recognized. Use KNITX-001 for instant archive admission.",
      });
    }
  };

  const handleKeyTurnUnlock = () => {
    if (vaultOpen || isTurningKey) return;
    setIsTurningKey(true);
    window.setTimeout(() => {
      unlockVaultDemo();
      setIsTurningKey(false);
    }, 360);
  };

  const handleCopyAccessCode = async () => {
    if (!activePass?.accessCode || typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(activePass.accessCode);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      setCopiedCode(false);
    }
  };

  return (
    <section
      id="passbook"
      className="relative overflow-hidden bg-chrome/55 border-y border-hunter/15 py-24"
    >
      {/* Subtle architectural dot matrix */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-dot-matrix opacity-45"
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
          {/* LEFT COLUMN: Editorial Queue Brief + Meter + Discreet Access Code */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-hunter/20 bg-white px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-hunter">
                <span className="h-2 w-2 rounded-full bg-hunter" />
                <span>ARCHIVE REGISTRY · INDIA · {drop.dropNumber}</span>
              </div>

              <h2 className="font-editorial text-5xl leading-[0.96] tracking-tight text-espresso sm:text-6xl">
                Issue Your{" "}
                <span className="italic text-hunter">Archive Passbook.</span>
              </h2>

              <p className="font-sans text-base leading-relaxed text-espresso/75">
                Every Drop 01 collector receives a numbered digital linen
                passbook before the steel vault unlocks. Admission rolls out in
                strict queue order across India — zero restocks, zero public
                re-runs once the locker doors close.
              </p>
            </div>

            {/* Live Passbook Allocation Meter */}
            <div className="rounded-sm border border-hunter/15 bg-white p-5 shadow-[0_8px_24px_rgba(20,54,40,0.05)]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-espresso/60">
                  QUEUE ALLOCATION
                </span>
                <span className="font-mono text-xs font-semibold tracking-wider text-hunter">
                  {formatCount(issuedCount)} / {formatCount(totalSlots)} PASSBOOKS
                  ISSUED
                </span>
              </div>

              <div className="mt-3 h-3 w-full overflow-hidden rounded-[2px] border border-hunter/20 bg-alabaster p-0.5">
                <motion.div
                  className="relative h-full rounded-[1px] bg-hunter"
                  initial={false}
                  animate={{ width: `${fillPercent}%` }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="absolute inset-y-0 right-0 w-2 bg-chartreuse" />
                </motion.div>
              </div>

              <div className="mt-2.5 flex items-center justify-between font-mono text-[11px] text-espresso/65">
                <span>{fillPercent}% CAPACITY CLAIMED</span>
                <span className="font-medium text-hunter">
                  {formatCount(remainingSlots)} SLOTS OPEN
                </span>
              </div>
            </div>

            {/* Discreet Access Code Box */}
            <div className="rounded-sm border border-hunter/15 bg-white/95 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-espresso">
                  <KeyRound className="h-3.5 w-3.5 text-hunter" />
                  <span>PRIVATE ACCESS KEY</span>
                </div>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => {
                    setCodeInput("KNITX-001");
                    setCodeFeedback(null);
                  }}
                  className="rounded-full border border-hunter/20 bg-alabaster px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-hunter transition-colors hover:bg-hunter hover:text-chartreuse"
                >
                  TRY KNITX-001
                </button>
              </div>

              <p className="mt-2 font-sans text-xs leading-relaxed text-espresso/65">
                Already hold a preview key? Enter{" "}
                <span className="font-mono font-semibold text-hunter">
                  KNITX-001
                </span>{" "}
                below to lift the vault seal and swing all 5 steel lockers open
                immediately.
              </p>

              <form
                onSubmit={handleCodeSubmit}
                className="mt-3.5 flex flex-col gap-2.5 sm:flex-row"
              >
                <input
                  type="text"
                  suppressHydrationWarning
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value.toUpperCase());
                    if (codeFeedback) setCodeFeedback(null);
                  }}
                  placeholder="KNITX-001"
                  aria-label="Private Vault Access Code"
                  className="flex-1 rounded-[2px] border border-hunter/25 bg-alabaster/70 px-3.5 py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-espresso placeholder:text-espresso/35 focus:border-hunter focus:bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  suppressHydrationWarning
                  className="inline-flex items-center justify-center gap-2 rounded-[2px] bg-hunter px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-chartreuse transition-colors hover:bg-espresso"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  <span>UNLOCK</span>
                </button>
              </form>

              <AnimatePresence mode="wait">
                {codeFeedback && (
                  <motion.div
                    key={codeFeedback.message}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className={cn(
                      "mt-3 flex items-center justify-between gap-2 rounded-[2px] border px-3 py-2 font-mono text-[11px]",
                      codeFeedback.type === "success"
                        ? "border-hunter/30 bg-hunter text-alabaster"
                        : "border-archive-red/30 bg-archive-red/5 text-archive-red"
                    )}
                  >
                    <span>{codeFeedback.message}</span>
                    {codeFeedback.type === "success" && (
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={scrollToLockers}
                        className="shrink-0 font-semibold text-chartreuse underline underline-offset-2"
                      >
                        OPEN LOCKERS ↑
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {vaultOpen && !codeFeedback && (
                <div className="mt-3 flex items-center justify-between gap-2 rounded-[2px] border border-hunter/25 bg-hunter px-3.5 py-2.5 font-mono text-[11px] text-alabaster">
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-chartreuse" />
                    <span>VAULT ADMITTED · ALL 5 LOCKERS UNSEALED</span>
                  </span>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={scrollToLockers}
                    className="shrink-0 font-semibold text-chartreuse hover:underline"
                  >
                    VIEW ↑
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: 3D-FLIPPING RACING-GREEN LINEN ARCHIVE PASSBOOK */}
          <div className="lg:col-span-7">
            <div className="mb-3 flex items-center justify-between px-1 font-mono text-[11px] uppercase tracking-[0.16em] text-hunter/75">
              <span>
                {isBookOpen
                  ? "PASSBOOK OPEN · STITCHED LEDGER"
                  : "PHYSICAL ARCHIVE EDITION · LINEN COVER"}
              </span>
              {activePass && (
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setShowCoverPreview((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-hunter/25 bg-white px-3 py-1 text-[10px] font-semibold text-hunter transition-colors hover:bg-hunter hover:text-chartreuse"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>{isBookOpen ? "INSPECT COVER" : "OPEN PASSBOOK"}</span>
                </button>
              )}
            </div>

            {/* 3D Perspective Stage */}
            <div style={{ perspective: "1400px" }} className="w-full">
              <motion.div
                initial={false}
                animate={{ rotateY: isBookOpen ? 180 : 0 }}
                transition={{
                  duration: 0.9,
                  type: "spring",
                  stiffness: 65,
                  damping: 15,
                }}
                style={{ transformStyle: "preserve-3d" }}
                className="relative grid grid-cols-1"
              >
                {/* ======================================================
                    FRONT FACE: EMBOSSED HUNTER-GREEN LINEN PASSBOOK COVER
                   ====================================================== */}
                <div
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                  className={cn(
                    "col-start-1 row-start-1 relative overflow-hidden rounded-[6px] bg-hunter p-5 text-alabaster shadow-[0_28px_60px_rgba(20,54,40,0.32)] sm:p-8",
                    isBookOpen && "pointer-events-none"
                  )}
                >
                  {/* Tactile linen cloth weave texture */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(0deg, rgba(244,243,238,0.12) 0px, rgba(244,243,238,0.12) 1px, transparent 1px, transparent 3px), repeating-linear-gradient(90deg, rgba(244,243,238,0.1) 0px, rgba(244,243,238,0.1) 1px, transparent 1px, transparent 3px)",
                    }}
                  />

                  {/* Left bookbinding spine crease */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-0 w-7 border-r border-alabaster/15 bg-gradient-to-r from-black/30 via-black/10 to-transparent"
                  />

                  {/* Recessed stitched cover frame */}
                  <div className="relative ml-3 rounded-[4px] border border-alabaster/25 p-5 sm:ml-4 sm:p-7">
                    {/* Brass corner pins */}
                    <span
                      aria-hidden="true"
                      className="absolute left-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-chartreuse/75"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-chartreuse/75"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute bottom-2.5 left-2.5 h-1.5 w-1.5 rounded-full bg-chartreuse/75"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute bottom-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-chartreuse/75"
                    />

                    {/* Embossed Passbook Header */}
                    <div className="flex items-start justify-between gap-4 border-b border-alabaster/15 pb-5">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-chartreuse">
                          KNITX® INDIA · ARCHIVE PASSBOOK · DROP 01
                        </p>
                        <h3 className="mt-2 font-editorial text-3xl leading-none tracking-tight text-alabaster sm:text-4xl">
                          Collector <span className="italic">Credentials</span>
                        </h3>
                      </div>

                      {/* Embossed Crest Seal */}
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full border border-chartreuse/60 bg-hunter/80 font-syne text-xs font-extrabold tracking-tight text-chartreuse shadow-inner">
                        <span>KX</span>
                        <span className="font-mono text-[8px] font-normal tracking-widest text-alabaster/80">
                          IND
                        </span>
                      </div>
                    </div>

                    {/* Embedded White Archival Registration Slip */}
                    <div className="mt-6 rounded-[3px] border border-alabaster/30 bg-white p-5 text-espresso shadow-[0_12px_30px_rgba(0,0,0,0.22)] sm:p-6">
                      <div className="flex items-center justify-between border-b border-hunter/15 pb-3">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-hunter">
                          REGISTRATION SLIP · FORM 01-A
                        </span>
                        <span className="rounded-full bg-alabaster px-2.5 py-0.5 font-mono text-[10px] text-espresso/70">
                          PAN-INDIA
                        </span>
                      </div>

                      <form
                        onSubmit={handleIssuePassbook}
                        className="mt-4 space-y-4"
                      >
                        <div>
                          <label
                            htmlFor="v3-passbook-name"
                            className="block font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-espresso/65"
                          >
                            FULL NAME
                          </label>
                          <input
                            id="v3-passbook-name"
                            type="text"
                            suppressHydrationWarning
                            required
                            value={nameInput}
                            onChange={(e) => {
                              setNameInput(e.target.value);
                              if (formError) setFormError(null);
                            }}
                            placeholder="Aarav Sharma"
                            className="mt-1.5 w-full rounded-[2px] border border-hunter/20 bg-alabaster/60 px-3.5 py-2.5 font-sans text-sm text-espresso placeholder:text-espresso/35 focus:border-hunter focus:bg-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="v3-passbook-email"
                            className="block font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-espresso/65"
                          >
                            EMAIL ADDRESS
                          </label>
                          <input
                            id="v3-passbook-email"
                            type="email"
                            suppressHydrationWarning
                            required
                            value={emailInput}
                            onChange={(e) => {
                              setEmailInput(e.target.value);
                              if (formError) setFormError(null);
                            }}
                            placeholder="collector@knitx.in"
                            className="mt-1.5 w-full rounded-[2px] border border-hunter/20 bg-alabaster/60 px-3.5 py-2.5 font-sans text-sm text-espresso placeholder:text-espresso/35 focus:border-hunter focus:bg-white focus:outline-none"
                          />
                        </div>

                        {formError && (
                          <p className="rounded-[2px] border border-archive-red/25 bg-archive-red/5 px-3 py-2 font-mono text-[11px] text-archive-red">
                            {formError}
                          </p>
                        )}

                        <button
                          type="submit"
                          suppressHydrationWarning
                          disabled={submitting}
                          className="group flex w-full items-center justify-between rounded-[2px] bg-hunter px-4 py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-chartreuse transition-all hover:bg-espresso disabled:opacity-60"
                        >
                          <span>
                            {submitting
                              ? "STAMPING ARCHIVE LEDGER..."
                              : "ISSUE MY PASSBOOK →"}
                          </span>
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-chartreuse text-hunter transition-transform group-hover:translate-x-0.5">
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </button>
                      </form>
                    </div>

                    {/* Embossed Footer Ledger Mark */}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-alabaster/65">
                      <span>STITCHED EDITION · SERIES 2026</span>
                      <span className="inline-flex items-center gap-1.5 text-chartreuse">
                        <Lock className="h-3 w-3" />
                        <span>FLIP OPENS UPON ISSUE</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* ======================================================
                    BACK FACE: OPENED TWO-PAGE STITCHED ARCHIVAL BOOKLET
                   ====================================================== */}
                <div
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                  className={cn(
                    "col-start-1 row-start-1 relative rounded-[6px] bg-hunter p-2.5 shadow-[0_30px_65px_rgba(20,54,40,0.28)] sm:p-3.5",
                    !isBookOpen && "pointer-events-none"
                  )}
                >
                  {/* Two-page spread surface */}
                  <div className="relative grid grid-cols-1 overflow-hidden rounded-[3px] border border-hunter/30 bg-alabaster text-espresso md:grid-cols-2">
                    {/* Center stitched book gutter (desktop) */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-1/2 z-10 hidden w-8 -translate-x-1/2 md:block"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(20,54,40,0) 0%, rgba(20,54,40,0.12) 48%, rgba(20,54,40,0.22) 50%, rgba(20,54,40,0.1) 54%, rgba(20,54,40,0) 100%)",
                      }}
                    >
                      <div className="mx-auto flex h-full w-px flex-col items-center justify-evenly py-6">
                        <span className="h-5 w-[2px] rounded-full bg-hunter/45" />
                        <span className="h-5 w-[2px] rounded-full bg-hunter/45" />
                        <span className="h-5 w-[2px] rounded-full bg-hunter/45" />
                        <span className="h-5 w-[2px] rounded-full bg-hunter/45" />
                      </div>
                    </div>

                    {/* ---------------- PAGE 1: QUEUE RECORD ---------------- */}
                    <div className="relative flex flex-col justify-between border-b border-dashed border-hunter/25 bg-white p-5 sm:p-6 md:border-b-0 md:border-r md:border-solid md:border-hunter/15 md:pr-8">
                      <div>
                        <div className="flex items-center justify-between border-b border-hunter/15 pb-3">
                          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-hunter">
                            PAGE 01 · QUEUE RECORD
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-espresso/50">
                            INDIA ARCHIVE
                          </span>
                        </div>

                        {/* Official Stamped Queue Number */}
                        <div className="mt-5 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-espresso/55">
                              OFFICIAL QUEUE STAMP
                            </p>
                            <div className="mt-1.5 inline-block -rotate-1 rounded-[2px] border-2 border-hunter bg-alabaster px-3.5 py-1.5 font-mono text-xl font-bold tracking-[0.14em] text-hunter sm:text-2xl">
                              {formattedQueueNo}
                            </div>
                          </div>
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-hunter/25 bg-hunter font-syne text-xs font-extrabold text-chartreuse">
                            KX
                          </div>
                        </div>

                        {/* Collector Details Ledger */}
                        <dl className="mt-6 space-y-3.5 border-t border-hunter/15 pt-4">
                          <div className="border-b border-hunter/10 pb-2.5">
                            <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-espresso/50">
                              PASSBOOK HOLDER
                            </dt>
                            <dd className="mt-0.5 font-editorial text-2xl leading-tight text-espresso">
                              {activePass?.name || "KNITX Collector"}
                            </dd>
                          </div>

                          <div className="border-b border-hunter/10 pb-2.5">
                            <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-espresso/50">
                              NOTIFICATION DISPATCH
                            </dt>
                            <dd className="mt-1 flex flex-wrap items-center justify-between gap-2">
                              <span className="truncate font-mono text-xs text-espresso/80">
                                {activePass?.email || "collector@knitx.in"}
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-hunter px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-chartreuse">
                                <Bell className="h-2.5 w-2.5" />
                                <span>ACTIVE — ALERTS ON</span>
                              </span>
                            </dd>
                          </div>

                          <div>
                            <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-espresso/50">
                              PERSONAL ACCESS KEY
                            </dt>
                            <dd className="mt-1.5 flex items-center justify-between gap-2 rounded-[2px] border border-hunter/20 bg-alabaster px-3 py-2">
                              <span className="font-mono text-sm font-bold tracking-[0.2em] text-hunter">
                                {activePass?.accessCode || "KX-0018"}
                              </span>
                              <button
                                type="button"
                                suppressHydrationWarning
                                onClick={handleCopyAccessCode}
                                className="inline-flex items-center gap-1 rounded-[2px] bg-white px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-hunter transition-colors hover:bg-hunter hover:text-chartreuse"
                              >
                                {copiedCode ? (
                                  <>
                                    <Check className="h-3 w-3" />
                                    <span>COPIED</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>COPY</span>
                                  </>
                                )}
                              </button>
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-hunter/15 pt-3 font-mono text-[9px] uppercase tracking-[0.2em] text-espresso/50">
                        <span>DROP 01 · PAN-INDIA</span>
                        <span>NON-TRANSFERABLE</span>
                      </div>
                    </div>

                    {/* ---------------- PAGE 2: KEY-TURN VAULT DIAL ---------------- */}
                    <div className="relative flex flex-col justify-between bg-alabaster p-5 sm:p-6 md:pl-8">
                      <div>
                        <div className="flex items-center justify-between border-b border-hunter/15 pb-3">
                          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-hunter">
                            PAGE 02 · VAULT KEY
                          </span>
                          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-hunter">
                            {vaultOpen ? "SEAL BROKEN" : "SEALED"}
                          </span>
                        </div>

                        <p className="mt-4 font-sans text-xs leading-relaxed text-espresso/75">
                          {vaultOpen
                            ? "Your archive passbook has been stamped for full vault entry. All 5 steel lockers upstairs are now unlatched."
                            : "Turn the archive key cylinder 90° to break the Drop 01 seal and unlock all 5 steel lockers immediately."}
                        </p>

                        {/* INTERACTIVE TURN VAULT KEY DIAL */}
                        <div className="relative mt-5 flex flex-col items-center justify-center py-3">
                          <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-2 border-hunter/20 bg-white shadow-[inset_0_2px_12px_rgba(20,54,40,0.1)]">
                            {/* Dial Angle Tick Labels */}
                            <span className="absolute top-2 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-espresso/45">
                              0° LOCK
                            </span>
                            <span
                              className={cn(
                                "absolute right-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] transition-colors",
                                vaultOpen ? "text-hunter" : "text-espresso/40"
                              )}
                            >
                              90°
                            </span>
                            <span className="absolute bottom-2 font-mono text-[9px] uppercase tracking-[0.14em] text-espresso/35">
                              VAULT
                            </span>

                            {/* Animated 90-degree Chartreuse/Hunter Arc */}
                            <svg
                              viewBox="0 0 160 160"
                              className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
                              aria-hidden="true"
                            >
                              <circle
                                cx="80"
                                cy="80"
                                r="68"
                                fill="none"
                                stroke="#143628"
                                strokeOpacity="0.1"
                                strokeWidth="4"
                                strokeDasharray="4 6"
                              />
                              <motion.circle
                                cx="80"
                                cy="80"
                                r="68"
                                fill="none"
                                stroke={vaultOpen ? "#143628" : "#C8F200"}
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeDasharray="427"
                                initial={false}
                                animate={{
                                  strokeDashoffset:
                                    vaultOpen || isTurningKey ? 320 : 427,
                                }}
                                transition={{
                                  type: "spring",
                                  stiffness: 110,
                                  damping: 16,
                                }}
                              />
                            </svg>

                            {/* Physical Rotating Brass/Chartreuse Key Cylinder Button */}
                            <motion.button
                              type="button"
                              suppressHydrationWarning
                              onClick={handleKeyTurnUnlock}
                              whileHover={vaultOpen ? undefined : { scale: 1.05 }}
                              whileTap={vaultOpen ? undefined : { scale: 0.96 }}
                              animate={{
                                rotate: vaultOpen || isTurningKey ? 90 : 0,
                              }}
                              transition={{
                                type: "spring",
                                stiffness: 130,
                                damping: 14,
                              }}
                              aria-label={
                                vaultOpen
                                  ? "Vault key turned and admitted"
                                  : "Turn Vault Key 90 degrees to unlock lockers"
                              }
                              className={cn(
                                "relative z-10 flex h-24 w-24 cursor-pointer items-center justify-center rounded-full border-4 shadow-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-hunter",
                                vaultOpen
                                  ? "border-chartreuse bg-hunter text-chartreuse"
                                  : "border-hunter bg-gradient-to-br from-hunter to-[#0e261c] text-chartreuse hover:border-chartreuse"
                              )}
                            >
                              {/* Machined keyhole slot + brass bow */}
                              <div className="flex flex-col items-center">
                                <span className="h-5 w-5 rounded-full border-2 border-chartreuse bg-chartreuse/20" />
                                <span className="-mt-0.5 h-6 w-2 rounded-b-sm bg-chartreuse" />
                              </div>
                            </motion.button>
                          </div>

                          {/* ADMITTED ✓ STAMP OVERLAY */}
                          <AnimatePresence>
                            {vaultOpen && (
                              <motion.div
                                initial={{ scale: 1.7, opacity: 0, rotate: -14 }}
                                animate={{ scale: 1, opacity: 1, rotate: -7 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 240,
                                  damping: 16,
                                }}
                                className="pointer-events-none mt-3 inline-flex items-center gap-2 rounded-[3px] border-2 border-hunter bg-chartreuse px-4 py-1.5 font-mono text-sm font-extrabold uppercase tracking-[0.22em] text-hunter shadow-[3px_3px_0px_#143628]"
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>ADMITTED ✓</span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Bottom Action CTA */}
                      <div className="mt-4">
                        {vaultOpen ? (
                          <button
                            type="button"
                            suppressHydrationWarning
                            onClick={scrollToLockers}
                            className="group flex w-full items-center justify-between rounded-[2px] bg-hunter px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-chartreuse transition-colors hover:bg-espresso"
                          >
                            <span>RETURN TO 5 STEEL LOCKERS</span>
                            <ArrowUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            suppressHydrationWarning
                            onClick={handleKeyTurnUnlock}
                            disabled={isTurningKey}
                            className="flex w-full items-center justify-center gap-2 rounded-[2px] border border-hunter bg-white px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-hunter transition-colors hover:bg-hunter hover:text-chartreuse disabled:opacity-60"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            <span>
                              {isTurningKey
                                ? "TURNING VAULT KEY..."
                                : "TURN VAULT KEY 90°"}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
