"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUp,
  Bell,
  Check,
  Copy,
  KeyRound,
  Lock,
  ShieldCheck,
  Unlock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import type { DropCampaign } from "@/lib/types";
import { cn } from "@/lib/utils";

interface V2SplitFlapVaultProps {
  drop: DropCampaign;
}

interface FlapModule {
  label: string;
  value: string;
  accent?: "klein" | "red" | "neutral";
}

function SplitFlapTile({
  char,
  delay,
  accent = "neutral",
}: {
  char: string;
  delay: number;
  accent?: "klein" | "red" | "neutral";
}) {
  return (
    <div
      className={cn(
        "relative flex h-11 w-8 items-center justify-center overflow-hidden rounded-lg border border-ink/12 bg-porcelain shadow-[0_2px_6px_rgba(14,14,14,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] sm:h-13 sm:w-9",
        char === "-" && "w-6 sm:w-7"
      )}
      style={{ perspective: 420 }}
    >
      {/* Subtle upper flap recess tint */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/90 to-linen/30" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-linen/60 to-transparent" />

      {/* Mechanical flipping glyph */}
      <motion.span
        key={char}
        initial={{ rotateX: -72, opacity: 0.25 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{
          duration: 0.45,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={cn(
          "relative z-10 font-mono text-lg font-bold tracking-tight tabular-nums sm:text-xl",
          accent === "klein" && "text-klein",
          accent === "red" && "text-archive-red",
          accent === "neutral" && "text-ink"
        )}
      >
        {char}
      </motion.span>

      {/* Center mechanical split hinge */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-px -translate-y-1/2 bg-ink/15" />
      <span className="pointer-events-none absolute left-0 top-1/2 z-20 h-1.5 w-0.5 -translate-y-1/2 rounded-r bg-ink/25" />
      <span className="pointer-events-none absolute right-0 top-1/2 z-20 h-1.5 w-0.5 -translate-y-1/2 rounded-l bg-ink/25" />
    </div>
  );
}

export default function V2SplitFlapVault({ drop }: V2SplitFlapVaultProps) {
  const { user } = useAuth();
  const { waitlistPass, isVaultUnlocked, joinWaitlist, unlockVaultDemo, unlockVaultWithCode } =
    useVault();

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [inviteCode, setInviteCode] = useState("");
  const [codeMessage, setCodeMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Tactile drag-to-unlock slider state
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [maxTravel, setMaxTravel] = useState(220);
  const KNOB_SIZE = 52;
  const TRACK_PADDING = 6;
  const dragX = useMotionValue(0);

  const fillWidth = useTransform(
    dragX,
    [0, Math.max(maxTravel, 1)],
    [KNOB_SIZE + TRACK_PADDING, Math.max(maxTravel, 1) + KNOB_SIZE + TRACK_PADDING]
  );
  const labelOpacity = useTransform(
    dragX,
    [0, Math.max(maxTravel * 0.45, 1)],
    [1, 0]
  );
  const knobRotate = useTransform(dragX, [0, Math.max(maxTravel, 1)], [0, 360]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    setName((prev) => prev || user.displayName || "");
    setEmail((prev) => prev || user.email || "");
  }, [mounted, user]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const measure = () => {
      const width = el.getBoundingClientRect().width;
      const travel = Math.max(120, Math.floor(width - KNOB_SIZE - TRACK_PADDING * 2));
      setMaxTravel(travel);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted]);

  const unlockedView = mounted && isVaultUnlocked;
  const activePass = mounted ? waitlistPass : null;

  useEffect(() => {
    if (!mounted) return;
    if (unlockedView) {
      animate(dragX, maxTravel, {
        type: "spring",
        stiffness: 320,
        damping: 28,
      });
    } else {
      animate(dragX, 0, {
        type: "spring",
        stiffness: 340,
        damping: 30,
      });
    }
  }, [unlockedView, maxTravel, mounted, dragX]);

  const queueDisplay = useMemo(() => {
    const num = activePass?.position ?? drop.waitlistCount;
    return String(num).padStart(4, "0");
  }, [activePass, drop.waitlistCount]);

  const flapModules: FlapModule[] = useMemo(
    () => [
      { label: "DROP", value: "01", accent: "neutral" },
      {
        label: activePass ? "YOUR QUEUE" : "QUEUE",
        value: queueDisplay,
        accent: "klein",
      },
      { label: "BATCH", value: "03-04", accent: "neutral" },
      { label: "1-OF-1", value: "02", accent: "red" },
      { label: "DEADSTOCK", value: "00%", accent: "klein" },
    ],
    [activePass, queueDisplay]
  );

  async function handleJoinWaitlist(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const cleanEmail = email.trim();
    const cleanName = name.trim();
    if (!cleanName) {
      setFormError("Please enter your name for the keycard.");
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      await joinWaitlist(cleanName, cleanEmail);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not issue keycard right now."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleCodeUnlock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCodeMessage(null);
    const ok = unlockVaultWithCode(inviteCode);
    if (ok) {
      setCodeMessage({
        type: "ok",
        text: "Invite code accepted. All 5 sealed pieces are now open.",
      });
      setInviteCode("");
    } else {
      setCodeMessage({
        type: "err",
        text: "Unrecognized code. Try preview key KNITX-001 or your personal pass code.",
      });
    }
  }

  function handleSliderDragEnd() {
    if (unlockedView) return;
    const current = dragX.get();
    if (current >= maxTravel * 0.75) {
      animate(dragX, maxTravel, {
        type: "spring",
        stiffness: 340,
        damping: 26,
      });
      unlockVaultDemo();
    } else {
      animate(dragX, 0, {
        type: "spring",
        stiffness: 420,
        damping: 30,
      });
    }
  }

  function handleKeyboardSimulate() {
    animate(dragX, maxTravel, {
      type: "spring",
      stiffness: 340,
      damping: 26,
    });
    unlockVaultDemo();
  }

  function handleCopyCode(code: string) {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 1800);
  }

  return (
    <section
      id="vault-gate"
      className="relative border-y border-ink/10 bg-linen py-24 text-ink"
    >
      <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
        {/* Section Heading */}
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2.5 rounded-full border border-ink/10 bg-white/80 px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-klein" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
                ROOM 03 · ADMISSION &amp; ACCESS GATE
              </span>
            </div>
            <h2 className="font-syne text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-[3.4rem] lg:leading-[1.02]">
              Waitlist{" "}
              <span className="font-editorial font-normal italic text-klein">
                departure.
              </span>
            </h2>
          </div>

          <p className="max-w-md text-sm leading-relaxed text-muted sm:text-[15px]">
            No public storefront. Collect a sequential queue pass for Drop 01 —
            when your number is called, your keycard unseals every hidden zipper
            bag in the archive room.
          </p>
        </div>

        {/* Mechanical Split-Flap Departure Board */}
        <div className="mb-10 rounded-[28px] border border-ink/10 bg-white/90 p-5 shadow-[0_24px_60px_-30px_rgba(14,14,14,0.12)] sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-ink/8 pb-4">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  unlockedView ? "bg-klein animate-pulse" : "bg-archive-red"
                )}
              />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ink">
                {unlockedView
                  ? "BOARD STATUS · ADMISSION ACTIVE"
                  : "BOARD STATUS · SEQUENTIAL QUEUE OPEN"}
              </span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              PAN-INDIA EDITION · {drop.title}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {flapModules.map((mod, modIdx) => (
              <div
                key={mod.label}
                className="flex flex-col gap-2.5 rounded-2xl border border-ink/8 bg-linen/55 p-3.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                    {mod.label}
                  </span>
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      mod.accent === "klein" && "bg-klein",
                      mod.accent === "red" && "bg-archive-red",
                      mod.accent === "neutral" && "bg-ink/25"
                    )}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {mod.value.split("").map((ch, charIdx) => (
                    <SplitFlapTile
                      key={`${mod.label}-${charIdx}`}
                      char={ch}
                      accent={mod.accent}
                      delay={0.04 * (modIdx * 2 + charIdx)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 12-Col Interactive Split: Keycard Registration + Physical Slide-to-Unlock */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
          {/* LEFT (7 COLS): Waitlist Form OR Embossed Klein-Blue Collector Keycard */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {!activePass ? (
                <motion.div
                  key="waitlist-form-card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-3xl border border-ink/10 bg-white p-7 shadow-[0_24px_60px_-32px_rgba(14,14,14,0.12)] sm:p-9"
                >
                  <div className="mb-7 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-klein">
                        STEP 01 · COLLECTOR REGISTRATION
                      </p>
                      <h3 className="mt-1.5 font-syne text-2xl font-bold tracking-tight text-ink sm:text-[1.7rem]">
                        Reserve your{" "}
                        <span className="font-editorial font-normal italic">
                          queue number.
                        </span>
                      </h3>
                    </div>
                    <span className="hidden rounded-full border border-ink/10 bg-porcelain px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted sm:inline-flex">
                      #{drop.waitlistCount + 1} NEXT
                    </span>
                  </div>

                  <form onSubmit={handleJoinWaitlist} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="v2-waitlist-name"
                          className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
                        >
                          Full Name
                        </label>
                        <input
                          id="v2-waitlist-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Aarav Sen"
                          className="w-full rounded-2xl border border-ink/12 bg-porcelain px-4 py-3 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-klein focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="v2-waitlist-email"
                          className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
                        >
                          Email Address
                        </label>
                        <input
                          id="v2-waitlist-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@domain.in"
                          className="w-full rounded-2xl border border-ink/12 bg-porcelain px-4 py-3 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-klein focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {formError && (
                      <p className="rounded-xl border border-archive-red/20 bg-archive-red/5 px-3.5 py-2 text-xs text-archive-red">
                        {formError}
                      </p>
                    )}

                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-klein px-7 py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_14px_30px_-10px_rgba(0,43,255,0.45)] transition-all hover:-translate-y-0.5 hover:bg-klein/95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      >
                        <span>
                          {submitting
                            ? "ISSUING KEYCARD..."
                            : "ISSUE COLLECTOR KEYCARD"}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </form>

                  {/* Discreet Invite Code Input */}
                  <div className="mt-8 border-t border-ink/8 pt-6">
                    <form
                      onSubmit={handleCodeUnlock}
                      className="flex flex-col gap-3 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-center gap-2 text-muted">
                        <KeyRound className="h-3.5 w-3.5 text-ink/50" />
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
                          Have an invite code?
                        </span>
                      </div>
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="text"
                          value={inviteCode}
                          onChange={(e) => setInviteCode(e.target.value)}
                          placeholder="KNITX-001"
                          aria-label="Invite code"
                          className="w-full rounded-full border border-ink/12 bg-porcelain px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-ink placeholder:text-muted/50 focus:border-klein focus:bg-white focus:outline-none sm:max-w-[180px]"
                        />
                        <button
                          type="submit"
                          className="rounded-full border border-ink/15 bg-white px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink transition-colors hover:border-klein hover:text-klein"
                        >
                          VERIFY
                        </button>
                      </div>
                    </form>
                    {codeMessage && (
                      <p
                        className={cn(
                          "mt-2.5 font-mono text-[11px]",
                          codeMessage.type === "ok"
                            ? "text-klein"
                            : "text-archive-red"
                        )}
                      >
                        {codeMessage.text}
                      </p>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="collector-keycard"
                  initial={{ opacity: 0, scale: 0.96, y: 14 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  className="relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] border border-klein/20 bg-gradient-to-br from-white via-[#F6F8FF] to-[#EBF0FF] p-7 shadow-[0_32px_70px_-30px_rgba(0,43,255,0.28)] sm:p-9"
                >
                  {/* Frosted acrylic light refraction sweep */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-klein/12 blur-3xl"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-24 left-12 h-56 w-56 rounded-full bg-white/80 blur-2xl"
                  />

                  {/* Top Embossed Keycard Header */}
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-klein/12 pb-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-klein text-white shadow-[0_10px_24px_-8px_rgba(0,43,255,0.55)]">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-syne text-sm font-bold tracking-tight text-ink">
                          KNITX® COLLECTOR KEYCARD
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                          DROP 01 · PAN-INDIA ARCHIVE PASS
                        </p>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]",
                        unlockedView
                          ? "bg-klein text-white"
                          : "border border-klein/25 bg-white/80 text-klein"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          unlockedView ? "bg-white animate-pulse" : "bg-klein"
                        )}
                      />
                      {unlockedView ? "ADMITTED · VAULT OPEN" : "QUEUED · REGISTERED"}
                    </span>
                  </div>

                  {/* Center Embossed Queue Number + Brushed Chip */}
                  <div className="relative z-10 my-7 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted">
                        SEQUENTIAL QUEUE POSITION
                      </p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-syne text-5xl font-extrabold tracking-tight text-klein tabular-nums sm:text-6xl">
                          #{activePass.position}
                        </span>
                        <span className="font-mono text-xs text-muted">
                          of {activePass.totalInQueue}
                        </span>
                      </div>
                    </div>

                    {/* Machined Acrylic Smart Chip */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-14 flex-col justify-between rounded-xl border border-klein/20 bg-white/85 p-2 shadow-inner">
                        <div className="grid grid-cols-3 gap-1">
                          <span className="h-1.5 rounded-xs bg-klein/20" />
                          <span className="h-1.5 rounded-xs bg-klein/35" />
                          <span className="h-1.5 rounded-xs bg-klein/20" />
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <span className="h-1.5 rounded-xs bg-klein/35" />
                          <span className="h-1.5 rounded-xs bg-klein/15" />
                          <span className="h-1.5 rounded-xs bg-klein/35" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Keycard Metadata Strip */}
                  <div className="relative z-10 grid grid-cols-1 gap-4 rounded-2xl border border-klein/12 bg-white/75 p-4 backdrop-blur-md sm:grid-cols-3">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
                        HOLDER
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-ink">
                        {activePass.name}
                      </p>
                    </div>

                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
                        PERSONAL KEY
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(activePass.accessCode)}
                        className="mt-1 inline-flex items-center gap-1.5 font-mono text-sm font-bold tracking-wider text-klein transition-opacity hover:opacity-75"
                      >
                        <span>{activePass.accessCode}</span>
                        {copiedCode ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3 w-3 opacity-60" />
                        )}
                      </button>
                    </div>

                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
                        DISPATCH ALERT
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 truncate font-mono text-[11px] font-medium text-ink">
                        <Bell className="h-3 w-3 shrink-0 text-klein" />
                        <span className="truncate">{activePass.email}</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT (5 COLS): Physical drag="x" Slide-to-Unlock Vault Bar */}
          <div className="lg:col-span-5">
            <div className="flex h-full flex-col justify-between rounded-3xl border border-ink/10 bg-white p-7 shadow-[0_24px_60px_-32px_rgba(14,14,14,0.12)] sm:p-8">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
                    TACTILE SIMULATOR
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-porcelain px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink">
                    {unlockedView ? (
                      <>
                        <Unlock className="h-3 w-3 text-klein" />
                        UNSEALED
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3 text-muted" />
                        SEALED
                      </>
                    )}
                  </span>
                </div>

                <h3 className="font-syne text-2xl font-bold tracking-tight text-ink">
                  Preview{" "}
                  <span className="font-editorial font-normal italic text-klein">
                    number called.
                  </span>
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">
                  Drag the machined bolt across the rail to experience your
                  admission alert — unsealing all 5 frosted zipper bags on the
                  garment rack instantaneously.
                </p>
              </div>

              {/* Physical Slide-to-Unlock Track */}
              <div className="mt-8">
                <div
                  ref={trackRef}
                  className="relative flex h-16 items-center overflow-hidden rounded-full border border-ink/12 bg-porcelain p-1.5 shadow-[inset_0_2px_8px_rgba(14,14,14,0.06)] select-none"
                >
                  {/* Dynamic Klein-blue progress rail */}
                  <motion.div
                    style={{ width: fillWidth }}
                    className="pointer-events-none absolute inset-y-1.5 left-1.5 rounded-full bg-klein/14"
                  />

                  {/* Center instructional label */}
                  <motion.div
                    style={{ opacity: unlockedView ? 0 : labelOpacity }}
                    className="pointer-events-none absolute inset-0 flex items-center justify-center pl-12 pr-5"
                  >
                    <span className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted sm:text-[11px]">
                      SLIDE TO SIMULATE NUMBER CALLED →
                    </span>
                  </motion.div>

                  {/* Unlocked state text inside track */}
                  {unlockedView && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="pointer-events-none absolute inset-0 flex items-center justify-center pl-5 pr-14"
                    >
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-klein">
                        BOLT RELEASED · VAULT OPEN
                      </span>
                    </motion.div>
                  )}

                  {/* Draggable Circular Klein-Blue Knob */}
                  <motion.div
                    drag={unlockedView ? false : "x"}
                    dragConstraints={{ left: 0, right: maxTravel }}
                    dragElastic={0.04}
                    dragMomentum={false}
                    style={{ x: dragX }}
                    onDragEnd={handleSliderDragEnd}
                    whileTap={unlockedView ? undefined : { scale: 0.96 }}
                    className={cn(
                      "relative z-10 flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-klein text-white shadow-[0_10px_24px_-6px_rgba(0,43,255,0.55)]",
                      unlockedView
                        ? "cursor-default"
                        : "cursor-grab active:cursor-grabbing"
                    )}
                    aria-label="Drag right to simulate vault unlock"
                  >
                    {unlockedView ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <motion.span
                        style={{ rotate: knobRotate }}
                        className="flex items-center justify-center"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </motion.span>
                    )}
                  </motion.div>
                </div>

                {/* Accessible keyboard / tap fallback OR Spring Celebration Banner */}
                <AnimatePresence mode="wait">
                  {!unlockedView ? (
                    <motion.div
                      key="slider-fallback"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 flex items-center justify-between gap-3"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                        DRAG PAST 75% TO UNSEAL
                      </span>
                      <button
                        type="button"
                        onClick={handleKeyboardSimulate}
                        className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-klein underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-klein"
                      >
                        Or tap to unlock →
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="unlocked-celebration"
                      initial={{ opacity: 0, y: 12, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 340,
                        damping: 24,
                      }}
                      className="mt-5 rounded-2xl border border-klein/20 bg-klein/[0.06] p-4"
                    >
                      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-klein">
                        VAULT UNLOCKED — ALL 5 ZIPPER BAGS OPEN ABOVE ↑
                      </p>
                      <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                        <a
                          href="#rack"
                          className="inline-flex items-center gap-1.5 rounded-full bg-klein px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition-transform hover:-translate-y-0.5"
                        >
                          <ArrowUp className="h-3 w-3" />
                          INSPECT GARMENT RACK
                        </a>
                        <Link
                          href="/vault"
                          className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:border-klein hover:text-klein"
                        >
                          OPEN FULL VAULT
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
