"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Copy,
  KeyRound,
  MailCheck,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import type {
  CreatorSubmissionItem,
  DropCampaign,
  VoteCandidate,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export interface V9VaultAndFolioProps {
  drop: DropCampaign;
  initialCandidates: VoteCandidate[];
  initialSubmissions: CreatorSubmissionItem[];
}

type StudioTab = "vote" | "submit" | "craft";
type TokenAllocationMap = Record<string, number>;

const TOTAL_TOKENS = 5;
const TOKEN_STORAGE_KEY = "knitx_v9_curator_tokens_v1";

interface StudioTabItem {
  id: StudioTab;
  index: string;
  label: string;
}

const STUDIO_TABS: readonly StudioTabItem[] = [
  { id: "vote", index: "01", label: "VOTE DROP 02" },
  { id: "submit", index: "02", label: "SUBMIT A DESIGN" },
  { id: "craft", index: "03", label: "SAMPLE-FIRST" },
] as const;

interface SilhouettePreset {
  id: string;
  label: string;
  categoryValue: string;
  editionStamp: string;
  imageUrl: string;
  shortTag: string;
}

const SILHOUETTE_PRESETS: readonly SilhouettePreset[] = [
  {
    id: "hoodie",
    label: "Heavyweight Hoodie",
    categoryValue: "Small-Batch · Heavyweight Hoodie",
    editionStamp: "EDITION 01/04",
    imageUrl: "/images/look-batch-hoodie.jpg",
    shortTag: "Small-Batch",
  },
  {
    id: "tee",
    label: "Boxy Graphic Tee",
    categoryValue: "Small-Batch · Boxy Graphic Tee",
    editionStamp: "EDITION 01/04",
    imageUrl: "/images/look-batch-tee.jpg",
    shortTag: "Small-Batch",
  },
  {
    id: "jacket",
    label: "1-of-1 Archive Jacket",
    categoryValue: "One-of-One · Archive Jacket",
    editionStamp: "EDITION 01/01",
    imageUrl: "/images/look-1of1-jacket.jpg",
    shortTag: "1-of-1",
  },
  {
    id: "knit",
    label: "Distressed Knit",
    categoryValue: "One-of-One · Distressed Knit",
    editionStamp: "EDITION 01/01",
    imageUrl: "/images/look-1of1-knit.jpg",
    shortTag: "1-of-1",
  },
] as const;

interface CraftChapter {
  index: string;
  title: string;
  lead: string;
  body: string;
  specLabel: string;
  specValue: string;
  plateCode: string;
  plateCaption: string;
  imageUrl: string;
}

const CRAFT_CHAPTERS: readonly CraftChapter[] = [
  {
    index: "01",
    title: "Half Revealed",
    lead: "Five pieces open to the room. Five veiled behind ivory silk.",
    body: "Every KNITX drop releases ten numbered silhouettes in total. Half are exhibited openly for textile inspection, while five collector editions remain curtained until your personal invitation number is called.",
    specLabel: "GALLERY RATIO",
    specValue: "5 OPEN · 5 CURTAINED",
    plateCode: "PLATE 01",
    plateCaption: "DAYLIGHT ATELIER STUDIO · INDIA",
    imageUrl: "/images/atelier-daylight.jpg",
  },
  {
    index: "02",
    title: "Community Voted",
    lead: "Five curator tokens per guest decide the next drop.",
    body: "Independent designers across India pitch raw silhouettes into the open archive. Collectors distribute five tokens across six finalists—and only the top four concepts advance to physical studio sampling.",
    specLabel: "CURATION RULE",
    specValue: "TOP 4 CONCEPTS GET MADE",
    plateCode: "PLATE 02",
    plateCaption: "HEAVYWEIGHT LOOPBACK STUDY · 480 GSM",
    imageUrl: "/images/look-batch-hoodie.jpg",
  },
  {
    index: "03",
    title: "One Sample for Shoots",
    lead: "Exactly one physical prototype per piece before doors open.",
    body: "We never sit on warehouse racks or speculative runs. Each selected silhouette is milled once in heavyweight Indian cotton, photographed under honest daylight, and inspected seam-by-seam before admission opens.",
    specLabel: "PRE-LAUNCH RUN",
    specValue: "10 MASTER SAMPLES TOTAL",
    plateCode: "PLATE 03",
    plateCaption: "ARCHIVE OUTERWEAR PROTOTYPE · 01/01",
    imageUrl: "/images/look-1of1-jacket.jpg",
  },
  {
    index: "04",
    title: "Cut After Your Order — 0% Deadstock",
    lead: "Shears touch fabric only after your numbered piece is claimed.",
    body: "Once your edition is reserved, your hand-numbered garment is cut, finished with puff embroidery or raw surface craft, sewn with its cotton credit plate, and dispatched insured pan-India in 10 to 14 days.",
    specLabel: "WASTE LEDGER",
    specValue: "0.0% DEADSTOCK · CUT ON CLAIM",
    plateCode: "PLATE 04",
    plateCaption: "OPEN-GAUGE ARCHIVE KNIT · MADE IN INDIA",
    imageUrl: "/images/look-1of1-knit.jpg",
  },
] as const;

export default function V9VaultAndFolio({
  drop,
  initialCandidates,
  initialSubmissions,
}: V9VaultAndFolioProps) {
  const { user } = useAuth();
  const {
    waitlistPass,
    isVaultUnlocked,
    joinWaitlist,
    unlockVaultDemo,
    unlockVaultWithCode,
  } = useVault();

  const [mounted, setMounted] = useState<boolean>(false);

  // =========================================================================
  // PART 1 STATE — WAX-SEALED COTTON INVITATION ENVELOPE WAITLIST
  // =========================================================================
  const [guestName, setGuestName] = useState<string>("");
  const [guestEmail, setGuestEmail] = useState<string>("");
  const [joiningWaitlist, setJoiningWaitlist] = useState<boolean>(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  const [inviteCode, setInviteCode] = useState<string>("");
  const [codeFeedback, setCodeFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // =========================================================================
  // PART 2 STATE — CLEAN 3-TAB STUDIO (VOTE | SUBMIT | CRAFT)
  // =========================================================================
  const [activeTab, setActiveTab] = useState<StudioTab>("vote");

  // Tab 1: 5-Token Curator Allocator
  const [candidates, setCandidates] =
    useState<VoteCandidate[]>(initialCandidates);
  const [allocations, setAllocations] = useState<TokenAllocationMap>({});
  const [votingCandidateId, setVotingCandidateId] = useState<string | null>(
    null
  );
  const [voteNotice, setVoteNotice] = useState<string | null>(null);

  // Tab 2: Submit a Design + Embossed Cotton Credit Plate
  const [submissions, setSubmissions] =
    useState<CreatorSubmissionItem[]>(initialSubmissions);
  const [pieceTitle, setPieceTitle] = useState<string>("");
  const [designerName, setDesignerName] = useState<string>("");
  const [designerHandle, setDesignerHandle] = useState<string>("");
  const [designerEmail, setDesignerEmail] = useState<string>("");
  const [selectedSilhouetteId, setSelectedSilhouetteId] =
    useState<string>("hoodie");
  const [craftNotes, setCraftNotes] = useState<string>("");
  const [submittingDesign, setSubmittingDesign] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Tab 3: Sample-First Craft Accordion
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);

  // Hydrate client-only state safely behind `mounted`
  useEffect(() => {
    setMounted(true);

    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as TokenAllocationMap;
      if (parsed && typeof parsed === "object") {
        const sanitized: TokenAllocationMap = {};
        let running = 0;
        for (const [id, count] of Object.entries(parsed)) {
          const safeCount = Math.max(0, Math.floor(Number(count) || 0));
          const allowed = Math.min(safeCount, TOTAL_TOKENS - running);
          if (allowed > 0) {
            sanitized[id] = allowed;
            running += allowed;
          }
        }
        setAllocations(sanitized);
        if (running > 0) {
          setCandidates((prev) =>
            prev.map((item) => ({
              ...item,
              votesCount: item.votesCount + (sanitized[item._id] || 0),
            }))
          );
        }
      }
    } catch {
      // Ignore malformed storage
    }
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    setGuestName((prev) => prev || user.displayName || "");
    setGuestEmail((prev) => prev || user.email || "");
    setDesignerName((prev) => prev || user.displayName || "");
    setDesignerEmail((prev) => prev || user.email || "");
  }, [mounted, user]);

  // Guarded Vault / Auth derivations
  const activePass = mounted ? waitlistPass : null;
  const vaultOpen = mounted && isVaultUnlocked;
  const isEnvelopeOpen = Boolean(activePass);

  const reservedCount = activePass
    ? Math.max(
        drop.waitlistCount + 1,
        activePass.totalInQueue || drop.waitlistCount + 1
      )
    : drop.waitlistCount;
  const totalSlots = Math.max(drop.totalSlots, reservedCount);
  const fillPercent = Math.min(
    100,
    Math.round((reservedCount / totalSlots) * 100)
  );

  // Vote derivations
  const spentTokens = useMemo(() => {
    if (!mounted) return 0;
    return Object.values(allocations).reduce((sum, n) => sum + n, 0);
  }, [allocations, mounted]);

  const tokensRemaining = Math.max(0, TOTAL_TOKENS - spentTokens);

  const totalCommunityVotes = useMemo(
    () => candidates.reduce((sum, c) => sum + c.votesCount, 0),
    [candidates]
  );

  const topFourIds = useMemo(() => {
    const ranked = [...candidates].sort((a, b) => b.votesCount - a.votesCount);
    return new Set(ranked.slice(0, 4).map((c) => c._id));
  }, [candidates]);

  // Commission derivations
  const activeSilhouette = useMemo(
    () =>
      SILHOUETTE_PRESETS.find((s) => s.id === selectedSilhouetteId) ??
      SILHOUETTE_PRESETS[0],
    [selectedSilhouetteId]
  );

  const normalizedHandle = useMemo(() => {
    const cleaned = designerHandle.trim().replace(/^@+/, "");
    if (cleaned) return `@${cleaned.toUpperCase()}`;
    const fromName = designerName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, ".");
    return fromName ? `@${fromName}` : "@HANDLE";
  }, [designerHandle, designerName]);

  const activeChapter = CRAFT_CHAPTERS[activeChapterIdx] ?? CRAFT_CHAPTERS[0];

  // =========================================================================
  // HANDLERS
  // =========================================================================
  async function handleRequestInvitation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setWaitlistError(null);

    const trimmedName = guestName.trim();
    const trimmedEmail = guestEmail.trim().toLowerCase();

    if (!trimmedName) {
      setWaitlistError("Enter your name to engrave your invitation card.");
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setWaitlistError("Enter a valid email address for admission alerts.");
      return;
    }

    setJoiningWaitlist(true);
    try {
      await joinWaitlist(trimmedName, trimmedEmail);
    } catch (err) {
      setWaitlistError(
        err instanceof Error
          ? err.message
          : "Unable to issue your invitation right now."
      );
    } finally {
      setJoiningWaitlist(false);
    }
  }

  function handleCodeUnlock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCodeFeedback(null);

    const ok = unlockVaultWithCode(inviteCode);
    if (ok) {
      setCodeFeedback({
        type: "success",
        text: "Seal broken · All 5 silk curtains are now parted in the gallery.",
      });
      setInviteCode("");
    } else {
      setCodeFeedback({
        type: "error",
        text: "Code not recognized. Try KNITX-001 for private preview access.",
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
      // Clipboard restricted
    }
  }

  async function handleAllocateToken(candidate: VoteCandidate) {
    if (!mounted || tokensRemaining <= 0 || votingCandidateId) return;

    setVotingCandidateId(candidate._id);
    setVoteNotice(null);

    const nextAllocations: TokenAllocationMap = {
      ...allocations,
      [candidate._id]: (allocations[candidate._id] || 0) + 1,
    };

    setAllocations(nextAllocations);
    setCandidates((prev) =>
      prev.map((item) =>
        item._id === candidate._id
          ? { ...item, votesCount: item.votesCount + 1 }
          : item
      )
    );

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(
          TOKEN_STORAGE_KEY,
          JSON.stringify(nextAllocations)
        );
      } catch {
        // Ignore storage errors
      }
    }

    try {
      await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: candidate._id,
          uid: (mounted && user?.uid) || "v9_gallery_curator",
        }),
      });
      setVoteNotice(
        `1 token placed on “${candidate.title}” · ${Math.max(
          0,
          tokensRemaining - 1
        )} remaining.`
      );
    } catch {
      setVoteNotice(`Token recorded on “${candidate.title}”.`);
    } finally {
      setVotingCandidateId(null);
    }
  }

  function handleResetTokens() {
    if (!mounted || spentTokens === 0) return;

    setCandidates((prev) =>
      prev.map((item) => ({
        ...item,
        votesCount: Math.max(
          0,
          item.votesCount - (allocations[item._id] || 0)
        ),
      }))
    );
    setAllocations({});
    setVoteNotice("All 5 tokens returned to your tray.");

    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
    }
  }

  async function handleCommissionSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!pieceTitle.trim() || !designerName.trim() || !craftNotes.trim()) {
      setSubmitError(
        "Complete Piece Title, Designer Name, and Craft Notes to submit."
      );
      return;
    }

    setSubmittingDesign(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pieceTitle.trim(),
          creatorName: designerName.trim(),
          creatorHandle:
            designerHandle.trim() || normalizedHandle.toLowerCase(),
          email: designerEmail.trim(),
          category: activeSilhouette.categoryValue,
          craftsmanshipNotes: craftNotes.trim(),
          imageUrl: activeSilhouette.imageUrl,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        submission?: CreatorSubmissionItem;
        error?: string;
      };

      if (!res.ok || !data.ok || !data.submission) {
        throw new Error(data.error || "Unable to submit design right now.");
      }

      setSubmissions((prev) => [data.submission!, ...prev]);
      setSubmitSuccess(
        `“${data.submission.title}” logged under ${data.submission.creatorHandle} for Drop 02 review.`
      );
      setPieceTitle("");
      setCraftNotes("");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Unable to submit design."
      );
    } finally {
      setSubmittingDesign(false);
    }
  }

  return (
    <>
      {/* ====================================================================
          PART 1 — WAX-SEALED COTTON INVITATION ENVELOPE WAITLIST
          ==================================================================== */}
      <section
        id="v9-envelope"
        className="relative overflow-hidden border-t border-champagne bg-white py-28"
      >
        <div className="mx-auto max-w-[1380px] px-5 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-16">
            {/* Left Column — Anton Poster Heading, Live Queue Ledger & Code Entry */}
            <div className="lg:col-span-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#736E66]">
                PRIVATE ADMISSION · DROP {drop.dropNumber}
              </p>

              <h2 className="mt-4 font-poster text-5xl uppercase leading-[0.94] tracking-[0.01em] text-[#121110] sm:text-7xl">
                PRIVATE ADMISSION<span className="text-[#D9381E]">.</span>
              </h2>

              <p className="mt-5 max-w-md font-sans text-[15px] leading-relaxed text-[#736E66]">
                Claim your spot in line. When your number is called, all 5 silk
                curtains part open.
              </p>

              {/* Live Queue Ledger */}
              <div className="mt-9 border-y border-champagne py-6">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#121110]">
                    <span className="font-semibold">
                      {reservedCount.toLocaleString("en-IN")}
                    </span>{" "}
                    of {totalSlots.toLocaleString("en-IN")} spots claimed
                  </p>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D9381E]">
                    {fillPercent}% FULL
                  </span>
                </div>

                <div className="mt-3.5 h-[2px] w-full overflow-hidden bg-champagne">
                  <motion.div
                    className="h-full bg-[#D9381E]"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${fillPercent}%` }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>

                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#736E66]">
                  <span>SEQUENTIAL ENTRY · PAN-INDIA</span>
                  <span>0% DEADSTOCK EDITION</span>
                </div>
              </div>

              {/* Discreet Invite Code Input */}
              <div className="mt-8">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="v9-invite-code"
                    className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#736E66]"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-[#D9381E]" />
                    <span>Already hold an invite code?</span>
                  </label>

                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => {
                      setInviteCode("KNITX-001");
                      setCodeFeedback(null);
                    }}
                    className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#D9381E] underline decoration-[#D9381E]/40 underline-offset-4 transition-colors hover:text-[#121110]"
                  >
                    Use KNITX-001
                  </button>
                </div>

                <form
                  onSubmit={handleCodeUnlock}
                  className="mt-3 flex items-stretch gap-2.5"
                >
                  <input
                    id="v9-invite-code"
                    type="text"
                    suppressHydrationWarning
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter code (KNITX-001)"
                    aria-label="Private invitation access code"
                    className="flex-1 rounded-lg border border-champagne bg-travertine/60 px-3.5 py-2.5 font-mono text-xs uppercase tracking-[0.16em] text-[#121110] placeholder:normal-case placeholder:tracking-normal placeholder:text-[#736E66]/70 focus:border-[#121110] focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    suppressHydrationWarning
                    className="inline-flex items-center gap-2 rounded-lg bg-[#121110] px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#D9381E]"
                  >
                    <span>Unlock</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </form>

                <AnimatePresence mode="wait">
                  {codeFeedback && (
                    <motion.p
                      key={codeFeedback.text}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className={cn(
                        "mt-2.5 font-mono text-[10.5px] tracking-[0.04em]",
                        codeFeedback.type === "success"
                          ? "text-[#121110]"
                          : "text-[#D9381E]"
                      )}
                    >
                      {codeFeedback.text}
                    </motion.p>
                  )}
                </AnimatePresence>

                {vaultOpen && !codeFeedback && (
                  <p className="mt-3 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#D9381E]">
                    <Check className="h-3.5 w-3.5" />
                    <span>
                      Gallery admission active · All 5 silk curtains parted
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Right Column — Tactile Cream Cotton Envelope with #D9381E Wax Seal */}
            <div className="lg:col-span-7">
              <div className="relative mx-auto max-w-[600px] pt-6 sm:pt-10">
                {/* Engraved White Letterpress Invitation Card sliding up out of envelope */}
                <AnimatePresence>
                  {isEnvelopeOpen && activePass && (
                    <motion.div
                      key="v9-letterpress-card"
                      initial={{ y: 88, opacity: 0, scale: 0.97 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 120,
                        damping: 20,
                        delay: 0.12,
                      }}
                      className="relative z-20 mx-3 -mb-14 rounded-2xl border border-champagne bg-white p-5 shadow-[0_24px_60px_rgba(18,17,16,0.10)] sm:mx-6 sm:p-7"
                    >
                      <div className="rounded-xl border border-champagne/90 px-5 py-6 sm:px-7 sm:py-7">
                        {/* Top Header Rail */}
                        <div className="flex items-start justify-between gap-4 border-b border-champagne pb-4">
                          <div>
                            <p className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-[#736E66]">
                              KNITX GALLERY · DROP {drop.dropNumber}
                            </p>
                            <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#736E66]/80">
                              ENGRAVED INVITATION CARD
                            </p>
                          </div>

                          <span className="inline-flex items-center gap-1.5 rounded-full border border-champagne bg-travertine/70 px-3 py-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#121110]">
                            <MailCheck className="h-3.5 w-3.5 text-[#D9381E]" />
                            <span>
                              {vaultOpen ? "Admitted" : "Email Alert Active"}
                            </span>
                          </span>
                        </div>

                        {/* Giant Anton Queue Number & Holder */}
                        <div className="py-7 text-center">
                          <p className="font-mono text-[9.5px] uppercase tracking-[0.26em] text-[#736E66]">
                            QUEUE POSITION
                          </p>
                          <p className="mt-2 font-poster text-6xl leading-none tracking-[0.02em] text-[#D9381E] sm:text-7xl">
                            #{activePass.position.toLocaleString("en-IN")}
                          </p>
                          <h3 className="mt-3 font-sans text-2xl font-semibold tracking-tight text-[#121110]">
                            {activePass.name}
                          </h3>
                          <p className="mt-1 font-mono text-[11px] tracking-[0.04em] text-[#736E66]">
                            {activePass.email}
                          </p>
                        </div>

                        {/* Personal Code Bar */}
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-champagne bg-travertine/65 px-4 py-3">
                          <div>
                            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#736E66]">
                              PERSONAL INVITE CODE
                            </p>
                            <p className="mt-0.5 font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[#121110]">
                              {activePass.accessCode}
                            </p>
                          </div>

                          <button
                            type="button"
                            suppressHydrationWarning
                            onClick={() => handleCopyCode(activePass.accessCode)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-champagne bg-white px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#121110] transition-colors hover:border-[#D9381E] hover:text-[#D9381E]"
                            aria-label="Copy personal invite code"
                          >
                            {copiedCode ? (
                              <>
                                <Check className="h-3 w-3 text-[#D9381E]" />
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

                        {/* Break Seal / View Gallery CTA */}
                        <div className="mt-5">
                          {!vaultOpen ? (
                            <button
                              type="button"
                              suppressHydrationWarning
                              onClick={unlockVaultDemo}
                              className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#D9381E] px-5 py-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#121110]"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>BREAK SEAL &amp; PART ALL CURTAINS</span>
                              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                            </button>
                          ) : (
                            <a
                              href="#v9-gallery"
                              className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#121110] px-5 py-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#D9381E]"
                            >
                              <span>ALL CURTAINS PARTED · ENTER GALLERY</span>
                              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tactile Cream Cotton Envelope Vessel */}
                <div
                  className={cn(
                    "relative overflow-hidden rounded-2xl border border-champagne bg-travertine shadow-[0_24px_60px_rgba(18,17,16,0.07)] transition-all duration-500",
                    isEnvelopeOpen ? "pt-16" : "pt-0"
                  )}
                  style={{ perspective: "1200px" }}
                >
                  {/* Subtle inner cotton hairline */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-3 rounded-xl border border-champagne/70"
                  />

                  {/* Hinged Triangular Cotton Flap + #D9381E Wax Seal */}
                  <motion.div
                    initial={false}
                    animate={{
                      rotateX: isEnvelopeOpen ? 168 : 0,
                      opacity: isEnvelopeOpen ? 0.35 : 1,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 115,
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
                      className="h-full w-full drop-shadow-[0_6px_14px_rgba(18,17,16,0.05)]"
                    >
                      <polygon
                        points="0,0 600,0 300,122"
                        fill="#ECE6DE"
                        stroke="#E5DFD7"
                        strokeWidth="1.5"
                      />
                      <line
                        x1="18"
                        y1="3"
                        x2="300"
                        y2="112"
                        stroke="#DDD5CA"
                        strokeWidth="0.9"
                        strokeDasharray="3 4"
                      />
                      <line
                        x1="582"
                        y1="3"
                        x2="300"
                        y2="112"
                        stroke="#DDD5CA"
                        strokeWidth="0.9"
                        strokeDasharray="3 4"
                      />
                    </svg>

                    {/* Circular #D9381E Terracotta Vermilion Wax Seal (KX) */}
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isEnvelopeOpen ? 0.72 : 1,
                        opacity: isEnvelopeOpen ? 0 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                      className="absolute bottom-0 left-1/2 flex h-14 w-14 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-[#D9381E] shadow-[0_8px_22px_rgba(217,56,30,0.34),inset_0_2px_4px_rgba(255,255,255,0.28),inset_0_-3px_6px_rgba(18,17,16,0.30)] ring-4 ring-[#D9381E]/20"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40">
                        <span className="font-poster text-lg tracking-[0.06em] text-white">
                          KX
                        </span>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Envelope Pocket Body */}
                  <div className="relative z-10 px-6 pb-9 pt-12 sm:px-10 sm:pb-10">
                    {!isEnvelopeOpen ? (
                      <div>
                        <div className="mb-7 text-center">
                          <p className="font-mono text-[9.5px] uppercase tracking-[0.26em] text-[#736E66]">
                            SEALED COTTON INVITATION · DROP {drop.dropNumber}
                          </p>
                          <p className="mt-2 font-poster text-2xl uppercase tracking-[0.02em] text-[#121110] sm:text-3xl">
                            CLAIM YOUR NUMBERED PASS
                          </p>
                        </div>

                        <form
                          onSubmit={handleRequestInvitation}
                          className="space-y-4"
                        >
                          <div>
                            <label
                              htmlFor="v9-waitlist-name"
                              className="block font-mono text-[9.5px] uppercase tracking-[0.22em] text-[#736E66]"
                            >
                              Full Name
                            </label>
                            <input
                              id="v9-waitlist-name"
                              type="text"
                              suppressHydrationWarning
                              required
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                              placeholder="e.g. Rhea Kulkarni"
                              className="mt-1.5 w-full rounded-xl border border-champagne bg-white px-4 py-3 font-sans text-sm text-[#121110] placeholder:text-[#736E66]/60 focus:border-[#121110] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="v9-waitlist-email"
                              className="block font-mono text-[9.5px] uppercase tracking-[0.22em] text-[#736E66]"
                            >
                              Email Address
                            </label>
                            <input
                              id="v9-waitlist-email"
                              type="email"
                              suppressHydrationWarning
                              required
                              value={guestEmail}
                              onChange={(e) => setGuestEmail(e.target.value)}
                              placeholder="collector@domain.in"
                              className="mt-1.5 w-full rounded-xl border border-champagne bg-white px-4 py-3 font-sans text-sm text-[#121110] placeholder:text-[#736E66]/60 focus:border-[#121110] focus:outline-none"
                            />
                          </div>

                          {waitlistError && (
                            <p className="font-mono text-[11px] text-[#D9381E]">
                              {waitlistError}
                            </p>
                          )}

                          <button
                            type="submit"
                            suppressHydrationWarning
                            disabled={joiningWaitlist}
                            className="group mt-2 flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#121110] px-6 py-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#D9381E] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <span>
                              {joiningWaitlist
                                ? "ENGRAVING INVITATION..."
                                : "REQUEST INVITATION"}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                          </button>
                        </form>

                        <p className="mt-5 text-center font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#736E66]">
                          ONE NUMBERED INVITATION PER COLLECTOR · PAN-INDIA
                        </p>
                      </div>
                    ) : (
                      /* Lower Cotton Envelope Pocket Lip below raised Letterpress Card */
                      <div className="flex flex-col items-center justify-between gap-3 border-t border-champagne/80 pt-5 text-center sm:flex-row sm:text-left">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D9381E]/35 bg-[#D9381E]/10 font-poster text-sm text-[#D9381E]">
                            KX
                          </div>
                          <div>
                            <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-[#121110]">
                              ENVELOPE UNSEALED · INVITATION ISSUED
                            </p>
                            <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#736E66]">
                              Cotton Folio · Drop {drop.dropNumber}
                            </p>
                          </div>
                        </div>

                        <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-[#736E66]">
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

      {/* ====================================================================
          PART 2 — CLEAN 3-TAB COMMUNITY & SAMPLE-FIRST STUDIO
          ==================================================================== */}
      <section
        id="v9-folio"
        className="relative border-t border-champagne bg-travertine/55 py-28"
      >
        <div className="mx-auto max-w-[1380px] px-5 sm:px-10 lg:px-14">
          {/* Header + Crisp 3-Tab Underline Bar */}
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#736E66]">
                OPEN ARCHIVE STUDIO · DROP 02 &amp; PROVENANCE
              </p>
              <h2 className="mt-4 font-poster text-5xl uppercase leading-[0.94] tracking-[0.01em] text-[#121110] sm:text-6xl">
                THE COMMUNITY &amp; CRAFT<span className="text-[#D9381E]">.</span>
              </h2>
            </div>

            <p className="max-w-md font-sans text-sm leading-relaxed text-[#736E66]">
              One room at a time. Vote on the next 4 silhouettes, submit your
              own design for a credit plate, or read our zero-deadstock process.
            </p>
          </div>

          {/* Crisp layoutId Underline 3-Tab Navigation */}
          <div
            role="tablist"
            aria-label="Community and Craft Studio"
            className="mt-10 flex flex-wrap items-center gap-6 border-b border-champagne sm:gap-12"
          >
            {STUDIO_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  suppressHydrationWarning
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative inline-flex items-baseline gap-2.5 pb-4 font-mono text-xs uppercase tracking-[0.22em] transition-colors",
                    isActive
                      ? "font-semibold text-[#121110]"
                      : "text-[#736E66] hover:text-[#121110]"
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px]",
                      isActive ? "text-[#D9381E]" : "text-[#736E66]/70"
                    )}
                  >
                    {tab.index}
                  </span>
                  <span>{tab.label}</span>

                  {isActive && (
                    <motion.span
                      layoutId="v9-studio-tab-underline"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                      }}
                      className="absolute inset-x-0 -bottom-px h-[2.5px] bg-[#D9381E]"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel — Strictly ONE view rendered at a time */}
          <div className="mt-12">
            <AnimatePresence mode="wait">
              {/* ============================================================
                  TAB 1 — VOTE DROP 02 (5-TOKEN CURATOR ALLOCATOR)
                  ============================================================ */}
              {activeTab === "vote" && (
                <motion.div
                  key="v9-tab-vote"
                  role="tabpanel"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Clean 5-Token Curator Tray */}
                  <div className="rounded-2xl border border-champagne bg-white px-5 py-4 shadow-[0_14px_34px_rgba(18,17,16,0.05)] sm:px-7">
                    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                      <div>
                        <p className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-[#736E66]">
                          5-TOKEN CURATOR BALLOT · TOP 4 GET MADE
                        </p>
                        <p className="mt-1 font-sans text-sm font-medium text-[#121110]">
                          {tokensRemaining} of {TOTAL_TOKENS} tokens ready to
                          allocate ·{" "}
                          <span className="font-mono text-xs text-[#736E66]">
                            {totalCommunityVotes.toLocaleString("en-IN")} total
                            votes
                          </span>
                        </p>
                      </div>

                      {/* 5 Terracotta Tokens */}
                      <div
                        className="flex items-center gap-2.5"
                        aria-label={`${tokensRemaining} of ${TOTAL_TOKENS} tokens remaining`}
                      >
                        {Array.from({ length: TOTAL_TOKENS }).map((_, idx) => {
                          const available = idx < tokensRemaining;
                          return (
                            <motion.span
                              key={idx}
                              initial={false}
                              animate={{
                                scale: available ? 1 : 0.86,
                                opacity: available ? 1 : 0.35,
                              }}
                              transition={{
                                type: "spring",
                                stiffness: 280,
                                damping: 22,
                              }}
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-full border font-poster text-xs tracking-[0.04em] transition-colors",
                                available
                                  ? "border-[#D9381E] bg-[#D9381E] text-white shadow-[0_4px_12px_rgba(217,56,30,0.28)]"
                                  : "border-champagne bg-travertine text-[#736E66]"
                              )}
                            >
                              KX
                            </motion.span>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        suppressHydrationWarning
                        disabled={!mounted || spentTokens === 0}
                        onClick={handleResetTokens}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-champagne bg-travertine/65 px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#121110] transition-colors hover:border-[#121110] hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Reset</span>
                      </button>
                    </div>

                    {voteNotice && (
                      <p className="mt-3 border-t border-champagne/80 pt-2.5 font-mono text-[10.5px] tracking-[0.04em] text-[#D9381E]">
                        {voteNotice}
                      </p>
                    )}
                  </div>

                  {/* 6 Drop 02 Concepts — Serene 3-Column Museum Grid */}
                  <div className="mt-8 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
                    {candidates.map((candidate) => {
                      const placedCount = mounted
                        ? allocations[candidate._id] || 0
                        : 0;
                      const isTopFour = topFourIds.has(candidate._id);
                      const sharePercent =
                        totalCommunityVotes > 0
                          ? Math.round(
                              (candidate.votesCount / totalCommunityVotes) * 100
                            )
                          : 0;
                      const isBusy = votingCandidateId === candidate._id;

                      return (
                        <article
                          key={candidate._id}
                          className="group flex flex-col overflow-hidden rounded-2xl border border-champagne bg-white transition-shadow duration-500 hover:shadow-[0_20px_50px_rgba(18,17,16,0.07)]"
                        >
                          {/* Portrait Study Frame */}
                          <div className="relative aspect-[3/4] w-full overflow-hidden bg-travertine">
                            <Image
                              src={candidate.imageUrl}
                              alt={candidate.title}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                            />

                            {/* Top Code & Top-4 Highlight */}
                            <div className="pointer-events-none absolute inset-x-3.5 top-3.5 flex items-start justify-between gap-2">
                              <span className="rounded-md border border-champagne bg-white/95 px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#121110] backdrop-blur-sm">
                                {candidate.code}
                              </span>

                              {isTopFour && (
                                <span className="rounded-md bg-[#D9381E] px-2.5 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-white shadow-sm">
                                  TOP 4 GET MADE
                                </span>
                              )}
                            </div>

                            {/* Placed Token Pill */}
                            {placedCount > 0 && (
                              <div className="pointer-events-none absolute bottom-3.5 left-3.5 inline-flex items-center gap-2 rounded-full border border-[#D9381E]/30 bg-white/95 px-3 py-1 backdrop-blur-sm">
                                <span className="flex items-center gap-1">
                                  {Array.from({ length: placedCount }).map(
                                    (_, i) => (
                                      <span
                                        key={i}
                                        className="h-2 w-2 rounded-full bg-[#D9381E]"
                                      />
                                    )
                                  )}
                                </span>
                                <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-[#D9381E]">
                                  {placedCount}{" "}
                                  {placedCount === 1 ? "Token" : "Tokens"}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Card Body */}
                          <div className="flex flex-1 flex-col p-6">
                            <div className="flex items-center justify-between gap-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-[#736E66]">
                              <span>{candidate.creatorHandle}</span>
                              <span>
                                {candidate.tierSuggestion === "one-of-one"
                                  ? "1-of-1 Archive"
                                  : "Small-Batch 3–4"}
                              </span>
                            </div>

                            <h3 className="mt-2 font-poster text-2xl uppercase leading-[1.04] tracking-[0.01em] text-[#121110]">
                              {candidate.title}
                            </h3>

                            <p className="mt-2 line-clamp-2 font-sans text-xs leading-relaxed text-[#736E66]">
                              {candidate.description}
                            </p>

                            {/* Vote-Share Hairline & Allocate CTA */}
                            <div className="mt-auto pt-6">
                              <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.16em]">
                                <span className="font-semibold text-[#121110]">
                                  {candidate.votesCount.toLocaleString("en-IN")}{" "}
                                  Votes
                                </span>
                                <span className="text-[#736E66]">
                                  {sharePercent}% Share
                                </span>
                              </div>

                              <div className="mt-2 h-[2px] w-full overflow-hidden bg-champagne">
                                <motion.div
                                  className={cn(
                                    "h-full",
                                    isTopFour ? "bg-[#D9381E]" : "bg-[#121110]/45"
                                  )}
                                  initial={false}
                                  animate={{
                                    width: `${Math.max(sharePercent, 3)}%`,
                                  }}
                                  transition={{
                                    duration: 0.55,
                                    ease: [0.22, 1, 0.36, 1],
                                  }}
                                />
                              </div>

                              <button
                                type="button"
                                suppressHydrationWarning
                                disabled={tokensRemaining <= 0 || isBusy}
                                onClick={() => handleAllocateToken(candidate)}
                                className={cn(
                                  "mt-5 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-mono text-[10.5px] uppercase tracking-[0.2em] transition-colors",
                                  tokensRemaining > 0
                                    ? placedCount > 0
                                      ? "border-[#D9381E] bg-[#D9381E] text-white hover:border-[#121110] hover:bg-[#121110]"
                                      : "border-[#121110] bg-white text-[#121110] hover:border-[#D9381E] hover:bg-[#D9381E] hover:text-white"
                                    : "cursor-not-allowed border-champagne bg-travertine/70 text-[#736E66]"
                                )}
                              >
                                {tokensRemaining > 0 ? (
                                  <>
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>
                                      {isBusy
                                        ? "RECORDING..."
                                        : placedCount > 0
                                          ? `ALLOCATE TOKEN (${placedCount})`
                                          : "ALLOCATE TOKEN"}
                                    </span>
                                  </>
                                ) : placedCount > 0 ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-[#D9381E]" />
                                    <span>
                                      {placedCount}{" "}
                                      {placedCount === 1 ? "TOKEN" : "TOKENS"}{" "}
                                      PLACED
                                    </span>
                                  </>
                                ) : (
                                  <span>ALL 5 TOKENS ALLOCATED</span>
                                )}
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ============================================================
                  TAB 2 — SUBMIT A DESIGN + EMBOSSED COTTON CREDIT PLATE
                  ============================================================ */}
              {activeTab === "submit" && (
                <motion.div
                  key="v9-tab-submit"
                  role="tabpanel"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12"
                >
                  {/* Left Column — Clean Creator Commission Form */}
                  <form
                    onSubmit={handleCommissionSubmit}
                    className="space-y-5 rounded-2xl border border-champagne bg-white p-6 shadow-[0_14px_38px_rgba(18,17,16,0.04)] sm:p-8 lg:col-span-7"
                  >
                    <div className="border-b border-champagne pb-4">
                      <p className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-[#736E66]">
                        CREATOR COMMISSION · DROP 02 &amp; 03
                      </p>
                      <h3 className="mt-1.5 font-poster text-3xl uppercase tracking-[0.01em] text-[#121110]">
                        PITCH YOUR SILHOUETTE
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="v9-piece-title"
                          className="block font-mono text-[9.5px] uppercase tracking-[0.22em] text-[#736E66]"
                        >
                          Piece Title
                        </label>
                        <input
                          id="v9-piece-title"
                          type="text"
                          suppressHydrationWarning
                          required
                          value={pieceTitle}
                          onChange={(e) => setPieceTitle(e.target.value)}
                          placeholder="e.g. Sun-Bleached Indigo Sashiko Hoodie"
                          className="mt-1.5 w-full rounded-xl border border-champagne bg-travertine/40 px-4 py-3 font-sans text-sm text-[#121110] placeholder:text-[#736E66]/60 focus:border-[#121110] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="v9-designer-name"
                          className="block font-mono text-[9.5px] uppercase tracking-[0.22em] text-[#736E66]"
                        >
                          Designer Name
                        </label>
                        <input
                          id="v9-designer-name"
                          type="text"
                          suppressHydrationWarning
                          required
                          value={designerName}
                          onChange={(e) => setDesignerName(e.target.value)}
                          placeholder="e.g. Devika Nair"
                          className="mt-1.5 w-full rounded-xl border border-champagne bg-travertine/40 px-4 py-3 font-sans text-sm text-[#121110] placeholder:text-[#736E66]/60 focus:border-[#121110] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="v9-designer-handle"
                          className="block font-mono text-[9.5px] uppercase tracking-[0.22em] text-[#736E66]"
                        >
                          Handle
                        </label>
                        <input
                          id="v9-designer-handle"
                          type="text"
                          suppressHydrationWarning
                          value={designerHandle}
                          onChange={(e) => setDesignerHandle(e.target.value)}
                          placeholder="@devika.atelier"
                          className="mt-1.5 w-full rounded-xl border border-champagne bg-travertine/40 px-4 py-3 font-mono text-xs text-[#121110] placeholder:text-[#736E66]/60 focus:border-[#121110] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label
                          htmlFor="v9-designer-email"
                          className="block font-mono text-[9.5px] uppercase tracking-[0.22em] text-[#736E66]"
                        >
                          Studio Email
                        </label>
                        <input
                          id="v9-designer-email"
                          type="email"
                          suppressHydrationWarning
                          value={designerEmail}
                          onChange={(e) => setDesignerEmail(e.target.value)}
                          placeholder="studio@domain.in"
                          className="mt-1.5 w-full rounded-xl border border-champagne bg-travertine/40 px-4 py-3 font-sans text-sm text-[#121110] placeholder:text-[#736E66]/60 focus:border-[#121110] focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Silhouette Selector */}
                    <div>
                      <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-[#736E66]">
                        Base Silhouette
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        {SILHOUETTE_PRESETS.map((preset) => {
                          const active = preset.id === selectedSilhouetteId;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              suppressHydrationWarning
                              onClick={() => setSelectedSilhouetteId(preset.id)}
                              className={cn(
                                "rounded-xl border px-3 py-2.5 text-left transition-all",
                                active
                                  ? "border-[#D9381E] bg-[#D9381E]/5 text-[#121110]"
                                  : "border-champagne bg-white text-[#736E66] hover:border-[#121110]/40 hover:text-[#121110]"
                              )}
                            >
                              <span className="block font-mono text-[8.5px] uppercase tracking-[0.18em] text-[#D9381E]">
                                {preset.shortTag}
                              </span>
                              <span className="mt-1 block font-sans text-xs font-medium text-[#121110]">
                                {preset.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Craftsmanship Notes */}
                    <div>
                      <label
                        htmlFor="v9-craft-notes"
                        className="block font-mono text-[9.5px] uppercase tracking-[0.22em] text-[#736E66]"
                      >
                        Fabric &amp; Craft Notes
                      </label>
                      <textarea
                        id="v9-craft-notes"
                        suppressHydrationWarning
                        required
                        rows={4}
                        value={craftNotes}
                        onChange={(e) => setCraftNotes(e.target.value)}
                        placeholder="Specify cotton GSM, wash recipe, puff embroidery, patchwork, or hand-finished detailing..."
                        className="mt-1.5 w-full resize-none rounded-xl border border-champagne bg-travertine/40 px-4 py-3 font-sans text-sm leading-relaxed text-[#121110] placeholder:text-[#736E66]/60 focus:border-[#121110] focus:bg-white focus:outline-none"
                      />
                    </div>

                    {submitError && (
                      <p className="font-mono text-[11px] text-[#D9381E]">
                        {submitError}
                      </p>
                    )}

                    {submitSuccess && (
                      <div className="flex items-center gap-2.5 rounded-xl border border-[#D9381E]/35 bg-travertine/65 px-4 py-3 font-mono text-[10.5px] text-[#121110]">
                        <Check className="h-4 w-4 shrink-0 text-[#D9381E]" />
                        <span>{submitSuccess}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      suppressHydrationWarning
                      disabled={submittingDesign}
                      className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#121110] px-6 py-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#D9381E] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span>
                        {submittingDesign
                          ? "FILING COMMISSION..."
                          : "SUBMIT DESIGN FOR DROP 02"}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </form>

                  {/* Right Column — Live Embossed Cotton Credit Plate + Compact Ledger */}
                  <div className="space-y-6 lg:sticky lg:top-24 lg:col-span-5">
                    <div className="rounded-2xl border border-champagne bg-white p-6 shadow-[0_20px_50px_rgba(18,17,16,0.06)] sm:p-8">
                      <div className="flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.22em] text-[#736E66]">
                        <span>LIVE GARMENT LABEL</span>
                        <span className="text-[#D9381E]">EMBOSSED COTTON</span>
                      </div>

                      {/* Stitched Cotton Credit Plate */}
                      <div className="relative mt-5 rounded-xl border border-champagne bg-travertine/60 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                        {/* Four Corner Tack Stitches */}
                        <span
                          aria-hidden="true"
                          className="absolute left-3 top-3 h-2.5 w-2.5 border-l-2 border-t-2 border-[#D9381E]/60"
                        />
                        <span
                          aria-hidden="true"
                          className="absolute right-3 top-3 h-2.5 w-2.5 border-r-2 border-t-2 border-[#D9381E]/60"
                        />
                        <span
                          aria-hidden="true"
                          className="absolute bottom-3 left-3 h-2.5 w-2.5 border-b-2 border-l-2 border-[#D9381E]/60"
                        />
                        <span
                          aria-hidden="true"
                          className="absolute bottom-3 right-3 h-2.5 w-2.5 border-b-2 border-r-2 border-[#D9381E]/60"
                        />

                        <p className="text-center font-mono text-[9.5px] font-medium uppercase tracking-[0.18em] text-[#121110]">
                          KNITX® ×{" "}
                          <span className="text-[#D9381E]">
                            {normalizedHandle}
                          </span>{" "}
                          · {activeSilhouette.editionStamp} · MADE IN INDIA
                        </p>

                        <div className="my-5 h-px w-full bg-champagne" />

                        <div className="flex items-start gap-4">
                          <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg border border-champagne bg-white">
                            <Image
                              src={activeSilhouette.imageUrl}
                              alt={pieceTitle.trim() || activeSilhouette.label}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#736E66]">
                              {activeSilhouette.label}
                            </p>
                            <h4 className="mt-1 truncate font-poster text-2xl uppercase leading-tight text-[#121110]">
                              {pieceTitle.trim() || "UNTITLED ARCHIVE STUDY"}
                            </h4>
                            <p className="mt-1 font-sans text-xs text-[#736E66]">
                              By {designerName.trim() || "Independent Designer"}
                            </p>
                          </div>
                        </div>

                        <p className="mt-5 line-clamp-3 border-t border-champagne/80 pt-4 font-sans text-xs leading-relaxed text-[#736E66]">
                          {craftNotes.trim() ||
                            "Your cotton weight, wash recipe, and hand-finishing notes appear woven into the interior collector plate."}
                        </p>
                      </div>

                      <p className="mt-4 font-sans text-xs leading-relaxed text-[#736E66]">
                        Approved designs advance to the Drop 02 community token
                        ballot with full creator credit sewn inside every
                        garment.
                      </p>
                    </div>

                    {/* Recent Logged Submissions (Compact 3-Row Rail) */}
                    {submissions.length > 0 && (
                      <div className="rounded-2xl border border-champagne bg-white p-5">
                        <div className="flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.22em] text-[#736E66]">
                          <span>RECENTLY LOGGED</span>
                          <span>{submissions.length} TOTAL</span>
                        </div>
                        <ul className="mt-3 divide-y divide-champagne/80">
                          {submissions.slice(0, 3).map((item) => (
                            <li
                              key={item._id}
                              className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-0"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-sans text-sm font-medium text-[#121110]">
                                  {item.title}
                                </p>
                                <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-[#736E66]">
                                  {item.creatorHandle} · {item.category}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full border border-champagne bg-travertine/70 px-2.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.14em] text-[#121110]">
                                {item.status === "selected"
                                  ? "Selected"
                                  : item.status === "approved_for_vote"
                                    ? "Ballot"
                                    : "In Review"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ============================================================
                  TAB 3 — SAMPLE-FIRST CRAFT ACCORDION + STUDIO PHOTOGRAPHY
                  ============================================================ */}
              {activeTab === "craft" && (
                <motion.div
                  key="v9-tab-craft"
                  role="tabpanel"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16"
                >
                  {/* Left Column — 4 Hairline Craft Chapters */}
                  <div className="lg:col-span-6">
                    <div className="border-b border-champagne">
                      {CRAFT_CHAPTERS.map((chapter, idx) => {
                        const isOpen = idx === activeChapterIdx;
                        return (
                          <div
                            key={chapter.index}
                            className="border-t border-champagne"
                          >
                            <button
                              type="button"
                              suppressHydrationWarning
                              onClick={() => setActiveChapterIdx(idx)}
                              aria-expanded={isOpen}
                              className="group flex w-full items-center justify-between gap-4 py-6 text-left transition-colors"
                            >
                              <div className="flex items-baseline gap-4">
                                <span
                                  className={cn(
                                    "font-mono text-xs uppercase tracking-[0.2em] transition-colors",
                                    isOpen
                                      ? "font-semibold text-[#D9381E]"
                                      : "text-[#736E66]"
                                  )}
                                >
                                  {chapter.index}
                                </span>
                                <span
                                  className={cn(
                                    "font-poster text-2xl uppercase tracking-[0.01em] transition-colors sm:text-3xl",
                                    isOpen
                                      ? "text-[#121110]"
                                      : "text-[#121110]/65 group-hover:text-[#121110]"
                                  )}
                                >
                                  {chapter.title}
                                </span>
                              </div>

                              <span
                                className={cn(
                                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                                  isOpen
                                    ? "border-[#D9381E] bg-[#D9381E] text-white"
                                    : "border-champagne bg-white text-[#736E66] group-hover:border-[#121110] group-hover:text-[#121110]"
                                )}
                              >
                                {isOpen ? (
                                  <Minus className="h-3.5 w-3.5" />
                                ) : (
                                  <Plus className="h-3.5 w-3.5" />
                                )}
                              </span>
                            </button>

                            <AnimatePresence initial={false}>
                              {isOpen && (
                                <motion.div
                                  key={`v9-craft-${chapter.index}`}
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{
                                    duration: 0.32,
                                    ease: [0.22, 1, 0.36, 1],
                                  }}
                                  className="overflow-hidden"
                                >
                                  <div className="pb-7 pl-9 pr-4">
                                    <p className="font-sans text-base font-medium text-[#121110]">
                                      {chapter.lead}
                                    </p>
                                    <p className="mt-2.5 font-sans text-sm leading-relaxed text-[#736E66]">
                                      {chapter.body}
                                    </p>
                                    <div className="mt-5 inline-flex flex-wrap items-center gap-2.5 rounded-lg border border-champagne bg-white px-3.5 py-2 font-mono text-[9.5px] uppercase tracking-[0.2em]">
                                      <span className="text-[#736E66]">
                                        {chapter.specLabel}
                                      </span>
                                      <span className="text-champagne">·</span>
                                      <span className="font-semibold text-[#D9381E]">
                                        {chapter.specValue}
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column — Crossfading Daylight Studio Photography */}
                  <div className="lg:sticky lg:top-24 lg:col-span-6">
                    <div className="rounded-2xl border border-champagne bg-white p-3.5 shadow-[0_20px_50px_rgba(18,17,16,0.06)] sm:p-5">
                      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-travertine">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeChapter.imageUrl}
                            initial={{ opacity: 0, scale: 1.03 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.99 }}
                            transition={{
                              duration: 0.48,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="absolute inset-0"
                          >
                            <Image
                              src={activeChapter.imageUrl}
                              alt={activeChapter.title}
                              fill
                              sizes="(max-width: 1024px) 100vw, 50vw"
                              className="object-cover"
                            />
                          </motion.div>
                        </AnimatePresence>

                        <div className="pointer-events-none absolute left-4 top-4 rounded-md border border-champagne bg-white/95 px-3 py-1 font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#121110] backdrop-blur-sm">
                          {activeChapter.plateCode} · {activeChapter.index}/04
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 px-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-[#736E66]">
                        <span>{activeChapter.plateCaption}</span>
                        <span className="font-medium text-[#121110]">
                          {activeChapter.specValue}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </>
  );
}
