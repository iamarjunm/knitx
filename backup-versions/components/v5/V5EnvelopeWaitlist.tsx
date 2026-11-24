"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Copy,
  KeyRound,
  MailCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import type { DropCampaign } from "@/lib/types";
import { cn } from "@/lib/utils";

interface V5EnvelopeWaitlistProps {
  drop: DropCampaign;
}

export default function V5EnvelopeWaitlist({ drop }: V5EnvelopeWaitlistProps) {
  const { user } = useAuth();
  const {
    waitlistPass,
    isVaultUnlocked,
    joinWaitlist,
    unlockVaultDemo,
    unlockVaultWithCode,
  } = useVault();

  const [mounted, setMounted] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [inviteCode, setInviteCode] = useState<string>("");
  const [codeMessage, setCodeMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    setName((prev) => prev || user.displayName || "");
    setEmail((prev) => prev || user.email || "");
  }, [mounted, user]);

  const activePass = mounted ? waitlistPass : null;
  const vaultOpen = mounted && isVaultUnlocked;

  const reservedCount = activePass
    ? Math.max(drop.waitlistCount + 1, activePass.totalInQueue || drop.waitlistCount + 1)
    : drop.waitlistCount;
  const totalSlots = Math.max(drop.totalSlots, reservedCount);
  const fillPercent = Math.min(100, Math.round((reservedCount / totalSlots) * 100));

  async function handleRequestInvitation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setFormError("Please enter your full name for the engraved invitation.");
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setFormError("Please enter a valid email address for private dispatch alerts.");
      return;
    }

    setSubmitting(true);
    try {
      await joinWaitlist(trimmedName, trimmedEmail);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to issue your invitation at this moment."
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
        type: "success",
        text: "Seal broken · All 5 silk curtains are now parted in the gallery.",
      });
      setInviteCode("");
    } else {
      setCodeMessage({
        type: "error",
        text: "Code not recognized. Enter KNITX-001 for private preview access.",
      });
    }
  }

  async function handleCopyCode(code: string) {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // Clipboard unavailable in restricted context
    }
  }

  const isEnvelopeOpen = Boolean(activePass);

  return (
    <section
      id="envelope"
      className="relative overflow-hidden border-t border-champagne bg-plaster py-28"
    >
      <div className="mx-auto max-w-[1340px] px-6 sm:px-10 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-16">
          {/* Left Column — Editorial Admission Ledger & Discreet Code Entry */}
          <div className="lg:col-span-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-muted">
              PRIVATE ADMISSION · DROP {drop.dropNumber}
            </p>

            <h2 className="mt-4 font-editorial text-5xl leading-[0.98] tracking-[-0.015em] text-umber sm:text-6xl lg:text-[4.25rem]">
              Private{" "}
              <span className="italic text-terracotta">Admission.</span>
            </h2>

            <p className="mt-6 max-w-md font-sans text-sm leading-relaxed text-muted sm:text-[15px]">
              There is no open storefront. Guests are admitted sequentially by
              engraved invitation number to inspect and claim from ten studio
              samples before cutting begins across India.
            </p>

            {/* Live Queue Ledger */}
            <div className="mt-9 border-y border-champagne py-6">
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-umber">
                  <span className="font-semibold">
                    {reservedCount.toLocaleString("en-IN")}
                  </span>{" "}
                  of {totalSlots.toLocaleString("en-IN")} invitations reserved
                </p>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-terracotta">
                  {fillPercent}% FULL
                </span>
              </div>

              <div className="mt-3.5 h-[2px] w-full overflow-hidden bg-champagne">
                <motion.div
                  className="h-full bg-terracotta"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${fillPercent}%` }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>

              <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                <span>SEQUENTIAL ENTRY · PAN-INDIA</span>
                <span>0% DEADSTOCK EDITION</span>
              </div>
            </div>

            {/* Discreet Invite Code Entry */}
            <div className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="v5-invite-code"
                  className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted"
                >
                  <KeyRound className="h-3.5 w-3.5 text-terracotta" />
                  <span>Hold an invitation code?</span>
                </label>

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => {
                    setInviteCode("KNITX-001");
                    setCodeMessage(null);
                  }}
                  className="font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta underline decoration-terracotta/40 underline-offset-4 transition-colors hover:text-umber"
                >
                  Use KNITX-001
                </button>
              </div>

              <form
                onSubmit={handleCodeUnlock}
                className="mt-3 flex items-stretch gap-2.5"
              >
                <input
                  id="v5-invite-code"
                  type="text"
                  suppressHydrationWarning
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter code (e.g. KNITX-001)"
                  aria-label="Private invitation access code"
                  className="flex-1 rounded-sm border border-champagne bg-travertine/55 px-3.5 py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-umber placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/65 focus:border-umber focus:bg-plaster focus:outline-none"
                />
                <button
                  type="submit"
                  suppressHydrationWarning
                  className="inline-flex items-center gap-2 rounded-sm border border-umber bg-umber px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-plaster transition-colors hover:border-terracotta hover:bg-terracotta"
                >
                  <span>Part Curtains</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>

              <AnimatePresence mode="wait">
                {codeMessage && (
                  <motion.p
                    key={codeMessage.text}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className={cn(
                      "mt-2.5 font-mono text-[10.5px] tracking-[0.06em]",
                      codeMessage.type === "success"
                        ? "text-umber"
                        : "text-terracotta"
                    )}
                  >
                    {codeMessage.text}
                  </motion.p>
                )}
              </AnimatePresence>

              {vaultOpen && !codeMessage && (
                <p className="mt-3 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-terracotta">
                  <Check className="h-3.5 w-3.5" />
                  <span>Gallery access active · All 5 silk curtains parted</span>
                </p>
              )}
            </div>
          </div>

          {/* Right Column — Tactile Cotton Wax-Sealed Invitation Envelope */}
          <div className="lg:col-span-7">
            <div className="relative mx-auto max-w-[600px] pt-8 sm:pt-12">
              {/* Engraved Pure-White Letterpress Invitation Card sliding up out of envelope */}
              <AnimatePresence>
                {isEnvelopeOpen && activePass && (
                  <motion.div
                    key="v5-letterpress-card"
                    initial={{ y: 96, opacity: 0, scale: 0.97 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 60, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 115,
                      damping: 19,
                      delay: 0.14,
                    }}
                    className="relative z-20 mx-3 -mb-14 rounded-sm border border-champagne bg-plaster p-5 shadow-[0_22px_50px_rgba(28,25,23,0.10)] sm:mx-6 sm:p-7"
                  >
                    {/* Inner engraved hairline plate */}
                    <div className="border border-champagne/85 px-5 py-6 sm:px-7 sm:py-7">
                      <div className="flex items-start justify-between gap-4 border-b border-champagne pb-4">
                        <div>
                          <p className="font-mono text-[9.5px] uppercase tracking-[0.26em] text-muted">
                            KNITX GALLERY · DROP {drop.dropNumber}
                          </p>
                          <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted/80">
                            LETTERPRESS ADMISSION CARD
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="block font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
                            ENGRAVED FOLIO
                          </span>
                          <span className="font-editorial text-2xl italic leading-none text-terracotta sm:text-3xl">
                            No. {activePass.position.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* Holder Details */}
                      <div className="py-6 text-center">
                        <p className="font-mono text-[9.5px] uppercase tracking-[0.28em] text-muted">
                          ADMIT ONE COLLECTOR
                        </p>
                        <h3 className="mt-2 font-editorial text-3xl text-umber sm:text-4xl">
                          {activePass.name}
                        </h3>
                        <p className="mt-1.5 font-mono text-[11px] tracking-[0.06em] text-muted">
                          {activePass.email}
                        </p>
                      </div>

                      {/* Personal Code & Alert Ledger */}
                      <div className="grid grid-cols-1 gap-3 border-t border-champagne pt-4 sm:grid-cols-2">
                        <div className="flex items-center justify-between rounded-sm bg-travertine/65 px-3.5 py-2.5">
                          <div>
                            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
                              PERSONAL CODE
                            </p>
                            <p className="mt-0.5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-umber">
                              {activePass.accessCode}
                            </p>
                          </div>
                          <button
                            type="button"
                            suppressHydrationWarning
                            onClick={() => handleCopyCode(activePass.accessCode)}
                            className="inline-flex items-center gap-1 rounded-sm border border-champagne bg-plaster px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-umber transition-colors hover:border-terracotta hover:text-terracotta"
                            aria-label="Copy personal invitation code"
                          >
                            {copiedCode ? (
                              <>
                                <Check className="h-3 w-3 text-terracotta" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-2.5 rounded-sm bg-travertine/65 px-3.5 py-2.5">
                          <MailCheck className="h-4 w-4 shrink-0 text-terracotta" />
                          <div>
                            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
                              EMAIL ALERT STATUS
                            </p>
                            <p className="mt-0.5 font-mono text-[11px] font-medium text-umber">
                              {vaultOpen
                                ? "Curtains Parted · Admitted"
                                : "Confirmed · Queue Active"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Understated Preview CTA */}
                      <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-champagne pt-4 sm:flex-row">
                        {!vaultOpen ? (
                          <button
                            type="button"
                            suppressHydrationWarning
                            onClick={unlockVaultDemo}
                            className="group inline-flex w-full items-center justify-center gap-2.5 rounded-sm border border-terracotta/50 bg-terracotta/5 px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-terracotta transition-all hover:border-terracotta hover:bg-terracotta hover:text-plaster sm:w-auto"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Preview: Break Seal &amp; Part All Curtains</span>
                          </button>
                        ) : (
                          <a
                            href="#curtain-gallery"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-umber bg-umber px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-plaster transition-colors hover:border-terracotta hover:bg-terracotta sm:w-auto"
                          >
                            <span>All Curtains Parted · View Exhibition</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </a>
                        )}

                        <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted">
                          KNITX · INDIA
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Outer Cotton Paper Envelope Vessel */}
              <div
                className={cn(
                  "relative rounded-sm border border-champagne bg-travertine shadow-[0_24px_60px_rgba(28,25,23,0.08)] transition-all duration-500",
                  isEnvelopeOpen ? "pt-16" : "pt-0"
                )}
                style={{ perspective: "1200px" }}
              >
                {/* Inner Paper Lining Shadow */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-2.5 rounded-[1px] border border-champagne/60"
                />

                {/* Hinged Triangular Cotton Envelope Flap */}
                <motion.div
                  initial={false}
                  animate={{
                    rotateX: isEnvelopeOpen ? 168 : 0,
                    opacity: isEnvelopeOpen ? 0.45 : 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 110,
                    damping: 20,
                  }}
                  style={{
                    transformOrigin: "top center",
                    transformStyle: "preserve-3d",
                  }}
                  className="pointer-events-none relative z-10 h-28 w-full overflow-visible sm:h-32"
                >
                  <svg
                    viewBox="0 0 600 130"
                    preserveAspectRatio="none"
                    className="h-full w-full drop-shadow-[0_6px_12px_rgba(28,25,23,0.05)]"
                  >
                    <polygon
                      points="0,0 600,0 300,122"
                      fill="#EFEAE2"
                      stroke="#E5DFD7"
                      strokeWidth="1.5"
                    />
                    <line
                      x1="14"
                      y1="2"
                      x2="300"
                      y2="112"
                      stroke="#E5DFD7"
                      strokeWidth="0.75"
                      strokeDasharray="3 4"
                    />
                    <line
                      x1="586"
                      y1="2"
                      x2="300"
                      y2="112"
                      stroke="#E5DFD7"
                      strokeWidth="0.75"
                      strokeDasharray="3 4"
                    />
                  </svg>

                  {/* Circular Terracotta Wax Seal (KX) at Flap Apex */}
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isEnvelopeOpen ? 0.72 : 1,
                      opacity: isEnvelopeOpen ? 0 : 1,
                    }}
                    transition={{ duration: 0.35 }}
                    className="absolute bottom-0 left-1/2 flex h-14 w-14 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-terracotta shadow-[0_8px_20px_rgba(168,75,47,0.34),inset_0_2px_4px_rgba(255,255,255,0.28),inset_0_-3px_6px_rgba(28,25,23,0.35)] ring-4 ring-terracotta/20"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-plaster/35">
                      <span className="font-editorial text-lg tracking-[0.06em] text-plaster">
                        KX
                      </span>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Envelope Pocket Body */}
                <div className="relative z-10 px-6 pb-8 pt-10 sm:px-10 sm:pb-10">
                  {!isEnvelopeOpen ? (
                    <div>
                      <div className="mb-7 text-center">
                        <p className="font-mono text-[9.5px] uppercase tracking-[0.26em] text-muted">
                          SEALED COTTON INVITATION · DROP {drop.dropNumber}
                        </p>
                        <p className="mt-1.5 font-editorial text-2xl italic text-umber sm:text-[1.7rem]">
                          Request your numbered gallery folio
                        </p>
                      </div>

                      <form
                        onSubmit={handleRequestInvitation}
                        className="space-y-5"
                      >
                        <div>
                          <label
                            htmlFor="v5-waitlist-name"
                            className="block font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted"
                          >
                            Full Name
                          </label>
                          <input
                            id="v5-waitlist-name"
                            type="text"
                            suppressHydrationWarning
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Meera Deshmukh"
                            className="mt-2 w-full rounded-sm border border-champagne bg-plaster/90 px-4 py-3 font-sans text-sm text-umber placeholder:text-muted/55 transition-colors focus:border-umber focus:bg-plaster focus:outline-none"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="v5-waitlist-email"
                            className="block font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted"
                          >
                            Email Address
                          </label>
                          <input
                            id="v5-waitlist-email"
                            type="email"
                            suppressHydrationWarning
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="collector@domain.in"
                            className="mt-2 w-full rounded-sm border border-champagne bg-plaster/90 px-4 py-3 font-sans text-sm text-umber placeholder:text-muted/55 transition-colors focus:border-umber focus:bg-plaster focus:outline-none"
                          />
                        </div>

                        {formError && (
                          <p className="font-mono text-[11px] text-terracotta">
                            {formError}
                          </p>
                        )}

                        <button
                          type="submit"
                          suppressHydrationWarning
                          disabled={submitting}
                          className="group flex w-full items-center justify-center gap-2.5 rounded-sm bg-umber px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.22em] text-plaster transition-all hover:bg-terracotta disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span>
                            {submitting
                              ? "Engraving Invitation..."
                              : "Request Private Invitation"}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </form>

                      <p className="mt-5 text-center font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted/85">
                        STRICTLY BY INVITATION · ONE NUMBERED CARD PER COLLECTOR
                      </p>
                    </div>
                  ) : (
                    /* Lower Cotton Envelope Pocket Lip shown beneath the raised Letterpress Card */
                    <div className="flex flex-col items-center justify-between gap-3 border-t border-champagne/80 pt-5 text-center sm:flex-row sm:text-left">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-terracotta/40 bg-terracotta/10 font-editorial text-xs text-terracotta">
                          KX
                        </div>
                        <div>
                          <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-umber">
                            WAX SEAL UNBROKEN · ENVELOPE OPENED
                          </p>
                          <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted">
                            Cotton Folio · Edition Drop {drop.dropNumber}
                          </p>
                        </div>
                      </div>

                      <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted">
                        MADE IN INDIA
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
