"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Check,
  Copy,
  KeyRound,
  Mail,
  Scissors,
  Sparkles,
  Stamp,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import type { DropCampaign } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface V4StampWaitlistProps {
  drop: DropCampaign;
}

export default function V4StampWaitlist({ drop }: V4StampWaitlistProps) {
  const { user } = useAuth();
  const {
    waitlistPass,
    isVaultUnlocked,
    joinWaitlist,
    unlockVaultDemo,
    unlockVaultWithCode,
  } = useVault();

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [codeMessage, setCodeMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [stampKey, setStampKey] = useState(0);
  const [isRipping, setIsRipping] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    setName((prev) => (prev.trim() ? prev : user.displayName || ""));
    setEmail((prev) => (prev.trim() ? prev : user.email || ""));
  }, [mounted, user]);

  const activePass = mounted ? waitlistPass : null;
  const vaultOpen = mounted ? isVaultUnlocked : false;

  const liveQueueCount = useMemo(() => {
    if (activePass?.totalInQueue && activePass.totalInQueue > drop.waitlistCount) {
      return activePass.totalInQueue;
    }
    return drop.waitlistCount;
  }, [activePass, drop.waitlistCount]);

  const fillPercent = useMemo(() => {
    if (drop.totalSlots <= 0) return 0;
    return Math.min(100, Math.round((liveQueueCount / drop.totalSlots) * 100));
  }, [liveQueueCount, drop.totalSlots]);

  const remainingSlots = Math.max(0, drop.totalSlots - liveQueueCount);

  const handleJoinSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanEmail || !cleanEmail.includes("@")) {
      setFormError("Write your name and a valid email on the postcard lines.");
      return;
    }

    setSubmitting(true);
    try {
      await joinWaitlist(cleanName, cleanEmail);
      setStampKey((k) => k + 1);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Postcard desk busy. Try again in a moment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCodeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = inviteCode.trim();
    if (!trimmed) {
      setCodeMessage({
        type: "err",
        text: "Enter your printed invite code (preview: KNITX-001).",
      });
      return;
    }

    const ok = unlockVaultWithCode(trimmed);
    if (ok) {
      setCodeMessage({
        type: "ok",
        text: "Code accepted. All 5 scratch-off archive cards are unsealed.",
      });
      setStampKey((k) => k + 1);
    } else {
      setCodeMessage({
        type: "err",
        text: "Invalid code. Use your pass code or preview code KNITX-001.",
      });
    }
  };

  const handleCopyCode = async () => {
    if (!activePass?.accessCode || typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(activePass.accessCode);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // Clipboard blocked in restricted browsers
    }
  };

  const handleTearStrip = () => {
    if (isRipping || vaultOpen) return;
    setIsRipping(true);
    window.setTimeout(() => {
      unlockVaultDemo();
      setStampKey((k) => k + 1);
      setIsRipping(false);
    }, 420);
  };

  return (
    <section
      id="stamp-card"
      className="relative overflow-hidden border-b-2 border-ink bg-newsprint py-20 text-ink"
    >
      <div className="mx-auto max-w-[1320px] px-4 sm:px-8">
        {/* Zine Folio Strip */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2.5">
            <span className="bg-riso px-2 py-0.5 text-white">PAGE 03</span>
            <span>POSTCARD WAITLIST · AIR MAIL DESK</span>
          </div>
          <span className="text-muted">
            DROP {drop.dropNumber} · PAN-INDIA RELEASE · 0% DEADSTOCK
          </span>
        </div>

        {/* Physical Vintage Postcard Frame */}
        <div className="relative border-2 border-ink bg-white p-6 stamp-shadow sm:p-10">
          {/* Postcard Header Rail */}
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b-2 border-ink pb-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center border-2 border-ink bg-ochre font-poster text-sm text-ink">
                KX
              </span>
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.26em] text-ink">
                  POST CARD · CARTE POSTALE
                </p>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted">
                  KNITX PRESS INDIA · SMALL-BATCH VAULT ADMISSION
                </p>
              </div>
            </div>

            {/* Circular Postmark Graphic */}
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex flex-col gap-1">
                <span className="block h-[2px] w-14 bg-ink/35" />
                <span className="block h-[2px] w-14 bg-ink/35" />
                <span className="block h-[2px] w-14 bg-ink/35" />
              </div>
              <div className="flex h-14 w-14 -rotate-6 flex-col items-center justify-center rounded-full border-2 border-dashed border-ink/70 text-center font-mono text-[7.5px] font-bold uppercase leading-tight text-ink/80">
                <span>INDIA</span>
                <span className="text-riso">DROP {drop.dropNumber}</span>
                <span>VERIFIED</span>
              </div>
            </div>
          </div>

          {/* 2-Column Vintage Postcard Split */}
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-0">
            {/* LEFT HALF: Headline + Queue Meter + Invite Code */}
            <div className="flex flex-col justify-between gap-7 md:col-span-6 md:border-r-2 md:border-ink md:pr-9">
              <div>
                <div className="inline-flex items-center gap-2 border border-ink bg-manila px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em]">
                  <Stamp className="h-3.5 w-3.5 text-riso" />
                  <span>WAITLIST NUMBER RELEASE</span>
                </div>

                <h2 className="mt-4 font-poster text-5xl uppercase leading-[0.92] tracking-[0.01em] text-ink sm:text-6xl">
                  GET STAMPED{" "}
                  <span className="inline-block bg-ochre px-2 text-ink">
                    INTO LINE.
                  </span>
                </h2>

                <p className="mt-4 max-w-md text-sm leading-relaxed text-muted sm:text-[15px]">
                  Every drop opens in numbered waves so real collectors get
                  first dibs before bots. Put your name on the postcard to lock
                  your queue number and receive your vault key.
                </p>
              </div>

              {/* Live Queue Fill Meter */}
              <div className="border-2 border-ink bg-newsprint p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink">
                    LIVE QUEUE METER
                  </span>
                  <span className="font-mono text-xs font-bold text-riso">
                    {fillPercent}% CLAIMED
                  </span>
                </div>

                <div className="mt-2.5 h-4 w-full overflow-hidden border-2 border-ink bg-manila p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${fillPercent}%` }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.75, ease: "easeOut" }}
                    className="h-full bg-riso"
                  />
                </div>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em]">
                  <span className="font-bold text-ink">
                    {liveQueueCount.toLocaleString("en-IN")} /{" "}
                    {drop.totalSlots.toLocaleString("en-IN")} STAMPED
                  </span>
                  <span className="text-muted">
                    {remainingSlots.toLocaleString("en-IN")} SLOTS LEFT IN WAVE
                  </span>
                </div>
              </div>

              {/* Invite Code Box */}
              <form
                onSubmit={handleCodeSubmit}
                className="border-t-2 border-dashed border-ink/40 pt-5"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="v4-invite-code"
                    className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-riso" />
                    HAVE AN INVITE CODE?
                  </label>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => {
                      setInviteCode("KNITX-001");
                      setCodeMessage(null);
                    }}
                    className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-riso underline decoration-2 underline-offset-2 hover:text-ink"
                  >
                    USE PREVIEW: KNITX-001
                  </button>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="v4-invite-code"
                    type="text"
                    suppressHydrationWarning
                    value={inviteCode}
                    onChange={(e) => {
                      setInviteCode(e.target.value.toUpperCase());
                      if (codeMessage) setCodeMessage(null);
                    }}
                    placeholder="KNITX-001"
                    className="flex-1 border-2 border-ink bg-newsprint px-3.5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-ink placeholder:text-muted/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-riso"
                  />
                  <button
                    type="submit"
                    suppressHydrationWarning
                    className="border-2 border-ink bg-manila px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-ochre active:translate-y-[1px]"
                  >
                    UNSEAL KEY
                  </button>
                </div>

                {codeMessage && (
                  <p
                    className={cn(
                      "mt-2 font-mono text-[10.5px] font-semibold",
                      codeMessage.type === "ok" ? "text-ink" : "text-riso"
                    )}
                  >
                    {codeMessage.type === "ok" ? "✓ " : "✕ "}
                    {codeMessage.text}
                  </p>
                )}
              </form>
            </div>

            {/* RIGHT HALF: Postage Stamp + Address Lines + Slamming Rubber Ink Stamp */}
            <div className="relative flex flex-col justify-between md:col-span-6 md:pl-9">
              {/* Top Row: TO Desk + Square Postage Stamp */}
              <div className="flex items-start justify-between gap-4">
                <div className="pt-1">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-riso">
                    TO: THE VAULT DESK
                  </p>
                  <p className="mt-1 font-editorial text-2xl leading-tight text-ink sm:text-[1.7rem]">
                    KNITX Drop {drop.dropNumber} Queue
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                    PAN-INDIA ARCHIVE · SAMPLE-FIRST
                  </p>
                </div>

                {/* Square Perforated Postage Stamp Box */}
                <div className="shrink-0 border-2 border-dashed border-ink bg-newsprint p-1.5">
                  <div className="flex h-20 w-20 flex-col items-center justify-between border border-ink bg-manila p-1.5 text-center sm:h-24 sm:w-24">
                    <span className="font-mono text-[7.5px] font-bold uppercase tracking-[0.14em] text-ink">
                      KNITX AIR MAIL
                    </span>
                    <span className="font-poster text-2xl leading-none text-riso sm:text-3xl">
                      ₹00
                    </span>
                    <span className="border-t border-ink/40 pt-0.5 font-mono text-[7px] font-bold uppercase tracking-[0.16em] text-ink">
                      POSTAGE PAID
                    </span>
                  </div>
                </div>
              </div>

              {/* Postcard Address Form */}
              <form onSubmit={handleJoinSubmit} className="mt-7 space-y-5">
                <div>
                  <label
                    htmlFor="v4-postcard-name"
                    className="block font-mono text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted"
                  >
                    FROM · COLLECTOR NAME
                  </label>
                  <input
                    id="v4-postcard-name"
                    type="text"
                    suppressHydrationWarning
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="Write your full name..."
                    className="mt-1 w-full border-b-2 border-ink bg-transparent px-1 py-2 font-editorial text-2xl text-ink placeholder:text-muted/45 focus:border-riso focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="v4-postcard-email"
                    className="block font-mono text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted"
                  >
                    RETURN ADDRESS · EMAIL
                  </label>
                  <input
                    id="v4-postcard-email"
                    type="email"
                    suppressHydrationWarning
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="collector@domain.in"
                    className="mt-1 w-full border-b-2 border-ink bg-transparent px-1 py-2 font-mono text-sm font-medium text-ink placeholder:text-muted/45 focus:border-riso focus:outline-none"
                  />
                </div>

                {formError && (
                  <p className="border border-riso bg-riso/10 px-3 py-2 font-mono text-[11px] font-semibold text-riso">
                    {formError}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="submit"
                    suppressHydrationWarning
                    disabled={submitting}
                    className="inline-flex items-center gap-2 border-2 border-ink bg-ink px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-white stamp-shadow-sm transition-all hover:bg-riso active:translate-x-[1px] active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Mail className="h-4 w-4" />
                    {submitting
                      ? "STAMPING POSTCARD..."
                      : activePass
                        ? "RE-STAMP MY POSTCARD"
                        : "STAMP MY POSTCARD"}
                  </button>

                  {activePass && (
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1.5 border-2 border-ink bg-newsprint px-3.5 py-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ochre"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-riso" />
                          COPIED {activePass.accessCode}
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          KEY: {activePass.accessCode}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>

              {/* GIANT SLAMMING MAGENTA RUBBER INK STAMP */}
              <AnimatePresence mode="wait">
                {activePass && (
                  <motion.div
                    key={`stamp-${activePass.position}-${vaultOpen ? "open" : "wait"}-${stampKey}`}
                    initial={{ scale: 2.2, rotate: -18, opacity: 0 }}
                    animate={{ scale: 1, rotate: -8, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 18,
                      mass: 0.9,
                    }}
                    className="pointer-events-none mt-6 self-end sm:absolute sm:bottom-16 sm:right-2 sm:mt-0"
                  >
                    <div className="border-[4px] border-riso bg-white/85 px-4 py-2.5 text-center shadow-[0_0_0_2px_rgba(230,0,122,0.18)] backdrop-blur-[1px]">
                      <div className="border border-dashed border-riso px-3 py-1.5">
                        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-riso">
                          {vaultOpen
                            ? "NUMBER CALLED · VAULT OPEN"
                            : "OFFICIAL KNITX INK STAMP"}
                        </p>
                        <p className="mt-0.5 font-poster text-3xl uppercase leading-none tracking-[0.04em] text-riso sm:text-4xl">
                          {vaultOpen ? "CALLED" : "QUEUED"} · #
                          {activePass.position}
                        </p>
                        <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-riso/90">
                          {activePass.name} · {activePass.accessCode}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* BOTTOM PERFORATED TEAR-OFF STRIP */}
          <div className="relative mt-10 border-t-2 border-dashed border-ink pt-6">
            {/* Scissor Cut Markers */}
            <span
              aria-hidden="true"
              className="absolute -left-2 -top-3.5 bg-white px-1 font-mono text-sm font-bold text-ink"
            >
              ✂
            </span>
            <span
              aria-hidden="true"
              className="absolute -right-2 -top-3.5 bg-white px-1 font-mono text-sm font-bold text-ink"
            >
              ✂
            </span>

            <AnimatePresence mode="wait">
              {!vaultOpen ? (
                <motion.div
                  key="tear-strip-ready"
                  initial={{ y: 0, rotate: 0, opacity: 1 }}
                  animate={
                    isRipping
                      ? { y: 40, rotate: 4, opacity: 0 }
                      : { y: 0, rotate: 0, opacity: 1 }
                  }
                  exit={{ y: 40, rotate: 4, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeIn" }}
                  className="flex flex-col items-start justify-between gap-4 border-2 border-ink bg-ochre/35 p-4 sm:flex-row sm:items-center sm:p-5"
                >
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink">
                      DETACHABLE DEMO STUB · INSTANT VAULT PREVIEW
                    </p>
                    <p className="mt-1 text-sm text-ink/85">
                      Want to test the drop right now? Rip off the stub to
                      simulate your waitlist number being called and unseal all
                      5 scratch-off cards above.
                    </p>
                  </div>

                  <button
                    type="button"
                    suppressHydrationWarning
                    disabled={isRipping}
                    onClick={handleTearStrip}
                    className="inline-flex shrink-0 items-center gap-2 border-2 border-ink bg-riso px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-white stamp-shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
                  >
                    <Scissors className="h-4 w-4" />
                    <span>
                      {isRipping
                        ? "RIPPING PERFORATION..."
                        : "✂ TEAR STRIP: SIMULATE NUMBER CALLED"}
                    </span>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="tear-strip-torn"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-start justify-between gap-4 border-2 border-riso bg-newsprint p-4 sm:flex-row sm:items-center sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center border-2 border-ink bg-riso text-white">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-riso">
                        STRIP DETACHED · NUMBER CALLED · ARCHIVE UNSEALED
                      </p>
                      <p className="mt-0.5 text-sm text-ink">
                        All 5 Drop {drop.dropNumber} scratch-off sheets above
                        are now unlocked and ready to inspect or claim.
                      </p>
                    </div>
                  </div>

                  <a
                    href="#scratch"
                    className="inline-flex shrink-0 items-center gap-1.5 border-2 border-ink bg-ochre px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-ink stamp-shadow-sm transition-transform hover:-translate-y-0.5"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                    BACK TO SCRATCH BOARD
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
