"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUp,
  Bell,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Lock,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Tag,
  Unlock,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import type {
  CreatorSubmissionItem,
  DropCampaign,
  VoteCandidate,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export interface V8CommunityVaultProps {
  drop: DropCampaign;
  initialCandidates: VoteCandidate[];
  initialSubmissions: CreatorSubmissionItem[];
}

type CommunityTab = "vote" | "submit";

const VOTED_STORAGE_KEY = "knitx_v8_voted_ids";
const SWIPE_THRESHOLD = 110;
const KNOB_SIZE = 52;
const TRACK_PADDING = 6;

const CATEGORIES = [
  "Small-Batch Hoodie",
  "Small-Batch Tee",
  "1-of-1 Outerwear",
  "1-of-1 Knitwear",
  "Utility Trouser",
] as const;

const CRAFT_SPECS = [
  "450 GSM Loopback",
  "High-Density Puff",
  "Ari Chain-Stitch",
  "Hand-Distressed",
  "Raw Khadi Panel",
  "Engraved Steel Plate",
] as const;

const VISUAL_PRESETS = [
  {
    id: "hoodie",
    label: "Boxy Hoodie",
    src: "/images/look-batch-hoodie.jpg",
  },
  {
    id: "tee",
    label: "Heavy Tee",
    src: "/images/look-batch-tee.jpg",
  },
  {
    id: "jacket",
    label: "1-of-1 Bomber",
    src: "/images/look-1of1-jacket.jpg",
  },
  {
    id: "knit",
    label: "Raw Knitwear",
    src: "/images/look-1of1-knit.jpg",
  },
] as const;

interface SwipeDeckCardProps {
  candidate: VoteCandidate;
  stackIndex: number;
  alreadyVoted: boolean;
  exitDirRef: React.RefObject<"left" | "right">;
  onCommitSwipe: (direction: "left" | "right") => void;
}

const swipeExitVariants = {
  exit: (dirRef: React.RefObject<"left" | "right">) => ({
    x: dirRef.current === "right" ? 460 : -460,
    rotate: dirRef.current === "right" ? 16 : -16,
    opacity: 0,
    transition: { duration: 0.34, ease: [0.32, 0.72, 0, 1] as const },
  }),
};

function SwipeDeckCard({
  candidate,
  stackIndex,
  alreadyVoted,
  exitDirRef,
  onCommitSwipe,
}: SwipeDeckCardProps) {
  const isTop = stackIndex === 0;
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-12, 12]);
  const produceOpacity = useTransform(x, [24, 115], [0, 1]);
  const produceScale = useTransform(x, [24, 115], [0.85, 1]);
  const passOpacity = useTransform(x, [-115, -24], [1, 0]);
  const passScale = useTransform(x, [-115, -24], [1, 0.85]);

  function handleDragEnd(
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) {
    if (!isTop) return;
    if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > 650) {
      onCommitSwipe("right");
    } else if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -650) {
      onCommitSwipe("left");
    }
  }

  return (
    <motion.article
      custom={exitDirRef}
      variants={swipeExitVariants}
      initial={{
        scale: Math.max(0.88, 1 - stackIndex * 0.045),
        y: stackIndex * 14,
        opacity: stackIndex === 0 ? 1 : Math.max(0.45, 1 - stackIndex * 0.25),
      }}
      animate={{
        scale: Math.max(0.88, 1 - stackIndex * 0.045),
        y: stackIndex * 14,
        opacity: stackIndex === 0 ? 1 : Math.max(0.45, 1 - stackIndex * 0.25),
        transition: { type: "spring", stiffness: 320, damping: 28 },
      }}
      exit="exit"
      style={isTop ? { x, rotate, zIndex: 30 } : { zIndex: 30 - stackIndex }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.85}
      onDragEnd={handleDragEnd}
      whileTap={isTop ? { cursor: "grabbing" } : undefined}
      className={cn(
        "absolute inset-0 flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-[0_24px_60px_-28px_rgba(10,10,10,0.18)] select-none",
        isTop ? "cursor-grab touch-pan-y" : "pointer-events-none"
      )}
    >
      {/* Garment Photograph */}
      <div className="relative h-[56%] w-full overflow-hidden bg-linen sm:h-[58%]">
        <Image
          src={candidate.imageUrl}
          alt={candidate.title}
          fill
          sizes="(max-width: 1024px) 100vw, 540px"
          className="pointer-events-none object-cover object-center"
          priority={isTop}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/35 to-transparent" />

        {/* Serial + Tier badges */}
        <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
          <span className="rounded-full border border-white/25 bg-white/90 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink backdrop-blur-md">
            {candidate.code}
          </span>
          <span
            className={cn(
              "rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md",
              candidate.tierSuggestion === "one-of-one"
                ? "bg-orange"
                : "bg-ink/90"
            )}
          >
            {candidate.tierSuggestion === "one-of-one"
              ? "1-OF-1 ARCHIVE"
              : "SMALL-BATCH 03–04"}
          </span>
        </div>

        {/* Live Drag Stamp: PRODUCE ✓ (Right) */}
        {isTop && (
          <motion.div
            style={{ opacity: produceOpacity, scale: produceScale }}
            className="pointer-events-none absolute left-5 top-16 -rotate-6 rounded-2xl border-2 border-orange bg-white/95 px-4 py-2 shadow-xl backdrop-blur-sm"
          >
            <span className="font-poster text-xl tracking-wide text-orange">
              PRODUCE ✓
            </span>
          </motion.div>
        )}

        {/* Live Drag Stamp: PASS ✕ (Left) */}
        {isTop && (
          <motion.div
            style={{ opacity: passOpacity, scale: passScale }}
            className="pointer-events-none absolute right-5 top-16 rotate-6 rounded-2xl border-2 border-ink bg-white/95 px-4 py-2 shadow-xl backdrop-blur-sm"
          >
            <span className="font-poster text-xl tracking-wide text-ink">
              PASS ✕
            </span>
          </motion.div>
        )}

        {alreadyVoted && (
          <div className="absolute bottom-3.5 left-4 rounded-full bg-orange px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-sm">
            VOTE RECORDED ✓
          </div>
        )}
      </div>

      {/* Bottom Spec Sheet */}
      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              {candidate.creatorName.toUpperCase()} · {candidate.creatorHandle}
            </span>
            <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums text-orange">
              {candidate.votesCount.toLocaleString("en-IN")} VOTES
            </span>
          </div>

          <h3 className="mt-1.5 font-poster text-2xl tracking-tight text-ink sm:text-[1.7rem] leading-tight">
            {candidate.title}
          </h3>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted sm:text-[13px]">
            {candidate.description}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-ink/10 pt-3">
          {candidate.craftsmanship.slice(0, 3).map((spec) => (
            <span
              key={spec}
              className="rounded-full border border-ink/10 bg-porcelain px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink/80"
            >
              {spec}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

function formatSubmissionStatus(status: CreatorSubmissionItem["status"]): {
  label: string;
  tone: "orange" | "ink" | "neutral";
} {
  if (status === "selected") {
    return { label: "SELECTED FOR CUT", tone: "orange" };
  }
  if (status === "approved_for_vote") {
    return { label: "IN DROP 02 VOTE", tone: "ink" };
  }
  return { label: "ATELIER REVIEW", tone: "neutral" };
}

export default function V8CommunityVault({
  drop,
  initialCandidates,
  initialSubmissions,
}: V8CommunityVaultProps) {
  const { user } = useAuth();
  const {
    waitlistPass,
    isVaultUnlocked,
    joinWaitlist,
    unlockVaultDemo,
    unlockVaultWithCode,
  } = useVault();

  const [mounted, setMounted] = useState(false);

  // =========================================================================
  // PART 1 STATE: WAITLIST KEYCARD & SLIDE-TO-UNLOCK
  // =========================================================================
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submittingPass, setSubmittingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  const [inviteCode, setInviteCode] = useState("");
  const [codeMessage, setCodeMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const [maxTravel, setMaxTravel] = useState(220);
  const dragX = useMotionValue(0);

  const fillWidth = useTransform(
    dragX,
    [0, Math.max(maxTravel, 1)],
    [
      KNOB_SIZE + TRACK_PADDING,
      Math.max(maxTravel, 1) + KNOB_SIZE + TRACK_PADDING,
    ]
  );
  const labelOpacity = useTransform(
    dragX,
    [0, Math.max(maxTravel * 0.45, 1)],
    [1, 0]
  );
  const knobRotate = useTransform(
    dragX,
    [0, Math.max(maxTravel, 1)],
    [0, 360]
  );

  // =========================================================================
  // PART 2 STATE: 2-TAB COMMUNITY STUDIO
  // =========================================================================
  const [activeTab, setActiveTab] = useState<CommunityTab>("vote");

  // Tab 1: Swipe-to-Vote
  const [candidates, setCandidates] =
    useState<VoteCandidate[]>(initialCandidates);
  const [deckIds, setDeckIds] = useState<string[]>(() =>
    initialCandidates.map((c) => c._id)
  );
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [passedCount, setPassedCount] = useState(0);
  const exitDirRef = useRef<"left" | "right">("right");
  const [lastActionBanner, setLastActionBanner] = useState<string | null>(null);

  // Tab 2: Woven Neck Tag Creator Lab
  const [submissions, setSubmissions] =
    useState<CreatorSubmissionItem[]>(initialSubmissions);
  const [designTitle, setDesignTitle] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [creatorHandle, setCreatorHandle] = useState("");
  const [creatorEmail, setCreatorEmail] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([
    "450 GSM Loopback",
    "High-Density Puff",
  ]);
  const [notes, setNotes] = useState("");
  const [presetSrc, setPresetSrc] = useState<string>(VISUAL_PRESETS[0].src);
  const [submittingDesign, setSubmittingDesign] = useState(false);
  const [designError, setDesignError] = useState<string | null>(null);
  const [submittedReceipt, setSubmittedReceipt] = useState<{
    title: string;
    handle: string;
  } | null>(null);

  // =========================================================================
  // HYDRATION & EFFECTS
  // =========================================================================
  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(VOTED_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          setVotedIds(parsed.filter((v): v is string => typeof v === "string"));
        }
      }
    } catch {
      // Ignore storage read issues
    }
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    setName((prev) => prev || user.displayName || "");
    setEmail((prev) => prev || user.email || "");
    setCreatorName((prev) => prev || user.displayName || "");
    setCreatorEmail((prev) => prev || user.email || "");
  }, [mounted, user]);

  const unlockedView = mounted && isVaultUnlocked;
  const activePass = mounted ? waitlistPass : null;
  const activeVotedIds = mounted ? votedIds : [];

  // Measure physical slider track whenever mounted or keycard mounts
  useEffect(() => {
    if (!mounted) return;
    const el = trackRef.current;
    if (!el) return;

    const measure = () => {
      const width = el.getBoundingClientRect().width;
      const travel = Math.max(
        120,
        Math.floor(width - KNOB_SIZE - TRACK_PADDING * 2)
      );
      setMaxTravel(travel);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted, activePass]);

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

  // Queue telemetry
  const currentQueueCount = useMemo(() => {
    const base = Math.max(drop.waitlistCount || 1842, 0);
    if (activePass && activePass.position > base) {
      return activePass.position;
    }
    return base;
  }, [activePass, drop.waitlistCount]);

  const totalQueueSlots = Math.max(drop.totalSlots || 2500, currentQueueCount);
  const queueProgressPct = Math.min(
    100,
    Math.round((currentQueueCount / totalQueueSlots) * 100)
  );

  // =========================================================================
  // PART 1 HANDLERS
  // =========================================================================
  async function handleJoinWaitlist(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPassError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setPassError("Please enter your name for the keycard.");
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setPassError("Please enter a valid email address.");
      return;
    }

    setSubmittingPass(true);
    try {
      await joinWaitlist(cleanName, cleanEmail);
    } catch (err) {
      setPassError(
        err instanceof Error ? err.message : "Could not issue keycard right now."
      );
    } finally {
      setSubmittingPass(false);
    }
  }

  function handleCodeUnlock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCodeMessage(null);
    const ok = unlockVaultWithCode(inviteCode);
    if (ok) {
      setCodeMessage({
        type: "ok",
        text: "Access code verified. All 5 zipped bags are now unlocked above.",
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
    if (current >= maxTravel * 0.72) {
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

  function handleAccessibleUnlock() {
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

  // =========================================================================
  // PART 2 HANDLERS: SWIPE VOTE
  // =========================================================================
  const persistVotedIds = useCallback((next: string[]) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(VOTED_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage write issues
    }
  }, []);

  const candidateById = useMemo(() => {
    const map = new Map<string, VoteCandidate>();
    for (const c of candidates) {
      map.set(c._id, c);
    }
    return map;
  }, [candidates]);

  const visibleDeck = useMemo(
    () =>
      deckIds
        .slice(0, 3)
        .map((id) => candidateById.get(id))
        .filter((item): item is VoteCandidate => Boolean(item)),
    [deckIds, candidateById]
  );

  const sortedLeaderboard = useMemo(
    () => [...candidates].sort((a, b) => b.votesCount - a.votesCount),
    [candidates]
  );

  const totalVotes = useMemo(
    () => candidates.reduce((sum, item) => sum + item.votesCount, 0),
    [candidates]
  );

  const maxVotes = useMemo(
    () => Math.max(1, ...candidates.map((item) => item.votesCount)),
    [candidates]
  );

  const commitSwipe = useCallback(
    (direction: "left" | "right") => {
      const currentId = deckIds[0];
      if (!currentId) return;

      const currentCard = candidateById.get(currentId);
      exitDirRef.current = direction;
      setDeckIds((prev) => prev.slice(1));

      if (direction === "right") {
        const alreadyVoted = votedIds.includes(currentId);
        if (!alreadyVoted) {
          setCandidates((prev) =>
            prev.map((item) =>
              item._id === currentId
                ? { ...item, votesCount: item.votesCount + 1, hasVoted: true }
                : item
            )
          );
          const nextVoted = [...votedIds, currentId];
          setVotedIds(nextVoted);
          persistVotedIds(nextVoted);

          fetch("/api/vote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              candidateId: currentId,
              uid: mounted ? user?.uid : undefined,
            }),
          }).catch(() => {});
        }
        if (currentCard) {
          setLastActionBanner(`Voted to produce ${currentCard.title}`);
        }
      } else {
        setPassedCount((prev) => prev + 1);
        if (currentCard) {
          setLastActionBanner(`Passed on ${currentCard.title}`);
        }
      }
    },
    [candidateById, deckIds, mounted, persistVotedIds, user?.uid, votedIds]
  );

  function handleResetStack() {
    setDeckIds(candidates.map((c) => c._id));
    setPassedCount(0);
    setLastActionBanner("Stack reset · swipe to refine Drop 02.");
  }

  const reviewedCount = candidates.length - deckIds.length;

  // =========================================================================
  // PART 2 HANDLERS: WOVEN NECK TAG CREATOR LAB
  // =========================================================================
  const normalizedHandle = useMemo(() => {
    const trimmed = creatorHandle.trim();
    if (!trimmed) return "@HANDLE";
    const cleaned = trimmed.replace(/\s+/g, "");
    return cleaned.startsWith("@")
      ? cleaned.toUpperCase()
      : `@${cleaned.toUpperCase()}`;
  }, [creatorHandle]);

  const displayTitle = useMemo(() => {
    const t = designTitle.trim();
    return t ? t.toUpperCase() : "STEPWELL RAW SHELL";
  }, [designTitle]);

  const isOneOfOneCategory = category.toLowerCase().includes("1-of-1");

  function toggleCraftSpec(spec: string) {
    setSelectedSpecs((prev) =>
      prev.includes(spec)
        ? prev.filter((item) => item !== spec)
        : [...prev, spec]
    );
  }

  async function handleSubmitDesign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDesignError(null);
    setSubmittedReceipt(null);

    const cleanTitle = designTitle.trim();
    const cleanName = creatorName.trim();
    const combinedNotes = [
      selectedSpecs.length > 0 ? `Specs: ${selectedSpecs.join(", ")}.` : "",
      notes.trim(),
    ]
      .filter(Boolean)
      .join(" ");

    if (!cleanTitle) {
      setDesignError("Enter a piece title to weave onto your neck label.");
      return;
    }
    if (!cleanName) {
      setDesignError("Enter your name so we can credit your design.");
      return;
    }
    if (!combinedNotes) {
      setDesignError("Select at least one craft spec or add construction notes.");
      return;
    }

    setSubmittingDesign(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          creatorName: cleanName,
          creatorHandle: creatorHandle.trim() || cleanName,
          email: creatorEmail.trim(),
          category,
          craftsmanshipNotes: combinedNotes,
          imageUrl: presetSrc,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        submission?: CreatorSubmissionItem;
      };

      const created = data.submission;
      if (!res.ok || !data.ok || !created) {
        throw new Error(data.error || "Unable to submit design right now.");
      }

      setSubmissions((prev) => [created, ...prev]);
      setSubmittedReceipt({
        title: created.title,
        handle: created.creatorHandle,
      });
      setDesignTitle("");
      setNotes("");
    } catch (err) {
      setDesignError(
        err instanceof Error ? err.message : "Could not submit your concept."
      );
    } finally {
      setSubmittingDesign(false);
    }
  }

  return (
    <>
      {/* =================================================================== */}
      {/* PART 1: CLEAN COLLECTOR KEYCARD & SLIDE-TO-UNLOCK WAITLIST          */}
      {/* =================================================================== */}
      <section
        id="v8-waitlist"
        className="relative border-y border-ink/10 bg-linen py-24 text-ink"
      >
        <div className="mx-auto max-w-[1320px] px-4 sm:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* LEFT COL: Poster Headline + Live Queue Bar + Quiet Access Code */}
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/85 px-3.5 py-1.5">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    unlockedView ? "bg-orange animate-pulse" : "bg-orange"
                  )}
                />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                  {unlockedView
                    ? "VAULT ADMISSION · UNLOCKED"
                    : "DROP 01 WAITLIST · SEQUENTIAL QUEUE"}
                </span>
              </div>

              <h2 className="mt-5 font-poster text-5xl leading-[0.94] tracking-tight text-ink sm:text-7xl">
                GET IN LINE<span className="text-orange">.</span>
              </h2>

              <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
                Sign up for your spot. When your number is called, all 5 zipped
                bags unlock.
              </p>

              {/* Live Queue Progress Bar */}
              <div className="mt-8 rounded-2xl border border-ink/10 bg-white/85 p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                    LIVE QUEUE CAPACITY
                  </span>
                  <span className="font-mono text-xs font-bold tabular-nums text-ink">
                    {currentQueueCount.toLocaleString("en-IN")} /{" "}
                    {totalQueueSlots.toLocaleString("en-IN")} queued
                  </span>
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-linen">
                  <motion.div
                    initial={false}
                    animate={{ width: `${queueProgressPct}%` }}
                    transition={{ type: "spring", stiffness: 220, damping: 28 }}
                    className="h-full rounded-full bg-orange"
                  />
                </div>

                <div className="mt-2.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                  <span>{queueProgressPct}% CLAIMED</span>
                  <span>
                    {(totalQueueSlots - currentQueueCount).toLocaleString(
                      "en-IN"
                    )}{" "}
                    SPOTS LEFT
                  </span>
                </div>
              </div>

              {/* Quiet Access Code Box */}
              <div className="mt-6">
                <form
                  onSubmit={handleCodeUnlock}
                  className="flex flex-col gap-2.5 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-2 text-muted">
                    <KeyRound className="h-3.5 w-3.5 text-ink/60" />
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
                      Have a code?
                    </span>
                  </div>
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="KNITX-001"
                      aria-label="Vault access code"
                      suppressHydrationWarning
                      className="w-full rounded-full border border-ink/12 bg-white px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-ink placeholder:text-muted/55 transition-colors focus:border-orange focus:outline-none sm:max-w-[180px]"
                    />
                    <button
                      type="submit"
                      suppressHydrationWarning
                      className="rounded-full border border-ink/15 bg-white px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink transition-colors hover:border-orange hover:text-orange"
                    >
                      UNLOCK
                    </button>
                  </div>
                </form>

                {codeMessage && (
                  <p
                    className={cn(
                      "mt-2.5 font-mono text-[11px]",
                      codeMessage.type === "ok"
                        ? "text-orange"
                        : "text-archive-red"
                    )}
                  >
                    {codeMessage.text}
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT COL: Clean White Card — Form OR Collector Keycard + Slide Bolt */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-ink/10 bg-white p-7 shadow-[0_16px_50px_rgba(0,0,0,0.06)] sm:p-9">
                <AnimatePresence mode="wait">
                  {!activePass ? (
                    <motion.div
                      key="v8-waitlist-form"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="mb-7 flex flex-wrap items-start justify-between gap-3 border-b border-ink/10 pb-5">
                        <div>
                          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-orange">
                            COLLECTOR REGISTRATION
                          </p>
                          <h3 className="mt-1 font-poster text-3xl tracking-tight text-ink sm:text-4xl">
                            CLAIM YOUR QUEUE NUMBER
                          </h3>
                        </div>
                        <span className="rounded-full border border-ink/10 bg-porcelain px-3.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                          #{currentQueueCount + 1} NEXT
                        </span>
                      </div>

                      {unlockedView && (
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange/25 bg-orange/[0.06] px-4 py-3">
                          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-orange">
                            ACCESS CODE ACTIVE · ALL 5 BAGS OPEN ABOVE
                          </span>
                          <a
                            href="#v8-rack"
                            className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink hover:text-orange"
                          >
                            <ArrowUp className="h-3 w-3" />
                            TO THE RACK
                          </a>
                        </div>
                      )}

                      <form onSubmit={handleJoinWaitlist} className="space-y-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="v8-waitlist-name"
                              className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
                            >
                              Your Name
                            </label>
                            <input
                              id="v8-waitlist-name"
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Aarav Sen"
                              suppressHydrationWarning
                              className="w-full rounded-2xl border border-ink/12 bg-porcelain px-4 py-3.5 text-sm text-ink placeholder:text-muted/55 transition-colors focus:border-orange focus:bg-white focus:outline-none"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="v8-waitlist-email"
                              className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
                            >
                              Your Email
                            </label>
                            <input
                              id="v8-waitlist-email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@domain.in"
                              suppressHydrationWarning
                              className="w-full rounded-2xl border border-ink/12 bg-porcelain px-4 py-3.5 text-sm text-ink placeholder:text-muted/55 transition-colors focus:border-orange focus:bg-white focus:outline-none"
                            />
                          </div>
                        </div>

                        {passError && (
                          <p className="rounded-2xl border border-archive-red/20 bg-archive-red/5 px-4 py-2.5 text-xs text-archive-red">
                            {passError}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={submittingPass}
                          suppressHydrationWarning
                          className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-4 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-white transition-all hover:bg-orange disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span>
                            {submittingPass
                              ? "ISSUING COLLECTOR KEYCARD..."
                              : "ISSUE MY COLLECTOR KEYCARD →"}
                          </span>
                        </button>
                      </form>

                      <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                        NO SPAM · ONE ALERT WHEN YOUR NUMBER IS CALLED · PAN-INDIA DISPATCH
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="v8-collector-keycard"
                      initial={{ opacity: 0, scale: 0.97, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{
                        type: "spring",
                        stiffness: 280,
                        damping: 26,
                      }}
                      className="space-y-6"
                    >
                      {/* Frosted Acrylic & Orange Collector Keycard */}
                      <div className="relative overflow-hidden rounded-2xl border border-orange/25 bg-gradient-to-br from-white via-[#FFF8F4] to-[#FFEFE6] p-6 shadow-[0_24px_50px_-28px_rgba(255,69,0,0.28)] sm:p-7">
                        {/* Subtle acrylic light refraction */}
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange/15 blur-3xl"
                        />
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute -bottom-20 left-8 h-48 w-48 rounded-full bg-white/80 blur-2xl"
                        />

                        {/* Keycard Header */}
                        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-orange/15 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange text-white shadow-[0_10px_22px_-8px_rgba(255,69,0,0.6)]">
                              <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-poster text-lg tracking-wide text-ink">
                                KNITX® COLLECTOR KEYCARD
                              </p>
                              <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted">
                                DROP 01 · PAN-INDIA ARCHIVE PASS
                              </p>
                            </div>
                          </div>

                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]",
                              unlockedView
                                ? "bg-orange text-white"
                                : "border border-orange/30 bg-white/85 text-orange"
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                unlockedView
                                  ? "bg-white animate-pulse"
                                  : "bg-orange"
                              )}
                            />
                            {unlockedView ? "ADMITTED · OPEN" : "QUEUED"}
                          </span>
                        </div>

                        {/* Center Bold Anton Queue Number + Brushed Chip */}
                        <div className="relative z-10 my-6 flex flex-wrap items-end justify-between gap-4">
                          <div>
                            <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted">
                              YOUR QUEUE NUMBER
                            </p>
                            <div className="mt-1 flex items-baseline gap-2.5">
                              <span className="font-poster text-6xl leading-none tracking-tight text-ink tabular-nums sm:text-7xl">
                                <span className="text-orange">#</span>
                                {activePass.position}
                              </span>
                              <span className="font-mono text-xs text-muted">
                                of {activePass.totalInQueue.toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>

                          {/* Brushed Acrylic Chip */}
                          <div className="flex h-10 w-14 flex-col justify-between rounded-xl border border-orange/25 bg-white/85 p-2 shadow-inner">
                            <div className="grid grid-cols-3 gap-1">
                              <span className="h-1.5 rounded-xs bg-orange/25" />
                              <span className="h-1.5 rounded-xs bg-orange/45" />
                              <span className="h-1.5 rounded-xs bg-orange/25" />
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              <span className="h-1.5 rounded-xs bg-orange/45" />
                              <span className="h-1.5 rounded-xs bg-orange/20" />
                              <span className="h-1.5 rounded-xs bg-orange/45" />
                            </div>
                          </div>
                        </div>

                        {/* Metadata Strip */}
                        <div className="relative z-10 grid grid-cols-1 gap-4 rounded-2xl border border-ink/10 bg-white/80 p-4 backdrop-blur-md sm:grid-cols-3">
                          <div>
                            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
                              HOLDER
                            </p>
                            <p className="mt-1 truncate text-sm font-semibold text-ink">
                              {activePass.name}
                            </p>
                          </div>

                          <div>
                            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
                              ACCESS CODE
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyCode(activePass.accessCode)
                              }
                              suppressHydrationWarning
                              className="mt-1 inline-flex items-center gap-1.5 font-mono text-sm font-bold tracking-wider text-orange transition-opacity hover:opacity-75"
                            >
                              <span>{activePass.accessCode}</span>
                              {copiedCode ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Copy className="h-3 w-3 opacity-65" />
                              )}
                            </button>
                          </div>

                          <div>
                            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
                              EMAIL ALERT
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 truncate font-mono text-[11px] font-medium text-ink">
                              <Bell className="h-3 w-3 shrink-0 text-orange" />
                              <span className="truncate">
                                {activePass.email}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Physical drag="x" SLIDE-TO-UNLOCK VAULT BOLT */}
                      <div className="rounded-2xl border border-ink/10 bg-porcelain p-5">
                        <div className="mb-3.5 flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                            PREVIEW NUMBER CALLED
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-ink">
                            {unlockedView ? (
                              <>
                                <Unlock className="h-3 w-3 text-orange" />
                                UNZIPPED
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3 text-muted" />
                                SEALED
                              </>
                            )}
                          </span>
                        </div>

                        <div
                          ref={trackRef}
                          className="relative flex h-16 items-center overflow-hidden rounded-full border border-ink/12 bg-white p-1.5 shadow-[inset_0_2px_8px_rgba(10,10,10,0.05)] select-none"
                        >
                          {/* Orange Fill Trail */}
                          <motion.div
                            style={{ width: fillWidth }}
                            className="pointer-events-none absolute inset-y-1.5 left-1.5 rounded-full bg-orange/14"
                          />

                          {/* Instructional Label */}
                          <motion.div
                            style={{ opacity: unlockedView ? 0 : labelOpacity }}
                            className="pointer-events-none absolute inset-0 flex items-center justify-center pl-14 pr-5"
                          >
                            <span className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted sm:text-[11px]">
                              SLIDE BOLT TO UNZIP ALL 5 BAGS →
                            </span>
                          </motion.div>

                          {/* Unlocked Label */}
                          {unlockedView && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="pointer-events-none absolute inset-0 flex items-center justify-center pl-5 pr-14"
                            >
                              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-orange">
                                VAULT OPEN · ALL 5 BAGS UNZIPPED
                              </span>
                            </motion.div>
                          )}

                          {/* Draggable Orange Bolt Knob */}
                          <motion.div
                            drag={unlockedView ? false : "x"}
                            dragConstraints={{ left: 0, right: maxTravel }}
                            dragElastic={0.04}
                            dragMomentum={false}
                            style={{ x: dragX }}
                            onDragEnd={handleSliderDragEnd}
                            whileTap={unlockedView ? undefined : { scale: 0.95 }}
                            className={cn(
                              "relative z-10 flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-orange text-white shadow-[0_10px_24px_-6px_rgba(255,69,0,0.55)]",
                              unlockedView
                                ? "cursor-default"
                                : "cursor-grab active:cursor-grabbing"
                            )}
                            aria-label="Drag right to unlock all 5 bags"
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

                        {/* Tap fallback OR Unlocked Jump Links */}
                        <AnimatePresence mode="wait">
                          {!unlockedView ? (
                            <motion.div
                              key="v8-tap-fallback"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="mt-3.5 flex items-center justify-between gap-3"
                            >
                              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                                DRAG RIGHT TO SIMULATE ADMISSION
                              </span>
                              <button
                                type="button"
                                onClick={handleAccessibleUnlock}
                                suppressHydrationWarning
                                className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-orange underline-offset-4 hover:underline"
                              >
                                Or tap to unlock →
                              </button>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="v8-unlocked-actions"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-4 flex flex-wrap items-center justify-between gap-3"
                            >
                              <a
                                href="#v8-rack"
                                className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-orange"
                              >
                                <ArrowUp className="h-3 w-3" />
                                INSPECT UNZIPPED RACK
                              </a>
                              <Link
                                href="/vault"
                                className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:border-orange hover:text-orange"
                              >
                                ENTER FULL VAULT
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* PART 2: UNCLUTTERED 2-TAB COMMUNITY STUDIO                          */}
      {/* =================================================================== */}
      <section
        id="v8-community"
        className="relative bg-porcelain py-24 text-ink"
      >
        <div className="mx-auto max-w-[1320px] px-4 sm:px-8">
          {/* Header + Segmented Pill Toggle */}
          <div className="mb-14 flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3.5 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-orange" />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
                  COMMUNITY STUDIO · DROP 02 CURATION
                </span>
              </div>
              <h2 className="mt-4 font-poster text-5xl leading-[0.95] tracking-tight text-ink sm:text-6xl">
                SHAPED BY THE CULTURE<span className="text-orange">.</span>
              </h2>
            </div>

            {/* Sleek layoutId Segmented Pill Toggle */}
            <div
              role="tablist"
              aria-label="Community studio views"
              className="inline-flex w-full rounded-full border border-ink/10 bg-white p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:w-auto"
            >
              {(
                [
                  { id: "vote", label: "SWIPE TO VOTE (DROP 02)" },
                  { id: "submit", label: "SUBMIT YOUR DESIGN" },
                ] as const
              ).map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.id)}
                    suppressHydrationWarning
                    className={cn(
                      "relative flex-1 rounded-full px-5 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] transition-colors sm:flex-initial",
                      isActive ? "text-white" : "text-muted hover:text-ink"
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="v8-community-tab-pill"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 32,
                        }}
                        className="absolute inset-0 rounded-full bg-ink"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ONLY ONE Interactive View Renders at a Time */}
          <AnimatePresence mode="wait">
            {activeTab === "vote" ? (
              <motion.div
                key="v8-tab-vote"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12"
              >
                {/* LEFT (7 COLS): Draggable Swipe-to-Vote Card Stack */}
                <div className="flex flex-col items-center lg:col-span-7">
                  <div className="relative h-[490px] w-full max-w-[500px] sm:h-[540px]">
                    <AnimatePresence mode="popLayout">
                      {visibleDeck.length > 0 ? (
                        visibleDeck
                          .slice()
                          .reverse()
                          .map((candidate, revIdx, arr) => {
                            const stackIndex = arr.length - 1 - revIdx;
                            return (
                              <SwipeDeckCard
                                key={candidate._id}
                                candidate={candidate}
                                stackIndex={stackIndex}
                                alreadyVoted={activeVotedIds.includes(
                                  candidate._id
                                )}
                                exitDirRef={exitDirRef}
                                onCommitSwipe={commitSwipe}
                              />
                            );
                          })
                      ) : (
                        <motion.div
                          key="v8-stack-done"
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 26,
                          }}
                          className="flex h-full flex-col items-center justify-center rounded-3xl border border-ink/10 bg-white p-8 text-center shadow-[0_16px_50px_rgba(0,0,0,0.05)]"
                        >
                          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange/10 text-orange">
                            <Sparkles className="h-6 w-6" />
                          </div>
                          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-orange">
                            JURY COMPLETE
                          </p>
                          <h3 className="mt-2 font-poster text-3xl tracking-tight text-ink">
                            ALL {candidates.length} PIECES REVIEWED
                          </h3>
                          <p className="mt-2.5 max-w-xs text-sm leading-relaxed text-muted">
                            You greenlit{" "}
                            <span className="font-semibold text-ink">
                              {activeVotedIds.length}
                            </span>{" "}
                            and passed on{" "}
                            <span className="font-semibold text-ink">
                              {passedCount}
                            </span>
                            . Top 4 enter production for Drop 02.
                          </p>
                          <button
                            type="button"
                            onClick={handleResetStack}
                            suppressHydrationWarning
                            className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-orange"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            RESET STACK
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Clean Circular Action Controls */}
                  <div className="mt-8 flex w-full max-w-[500px] items-center justify-between px-4">
                    <button
                      type="button"
                      onClick={() => commitSwipe("left")}
                      disabled={visibleDeck.length === 0}
                      aria-label="Pass on silhouette"
                      suppressHydrationWarning
                      className="group flex h-14 w-14 items-center justify-center rounded-full border border-ink/15 bg-white text-ink shadow-sm transition-all hover:border-ink hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <X className="h-5 w-5" />
                    </button>

                    <div className="text-center">
                      <p className="font-mono text-xs font-bold tabular-nums text-ink">
                        {Math.min(reviewedCount + 1, candidates.length)
                          .toString()
                          .padStart(2, "0")}{" "}
                        · {candidates.length.toString().padStart(2, "0")}
                      </p>
                      <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted">
                        {visibleDeck.length > 0 ? "DRAG OR TAP" : "FINISHED"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => commitSwipe("right")}
                      disabled={visibleDeck.length === 0}
                      aria-label="Vote to produce silhouette"
                      suppressHydrationWarning
                      className="group flex h-14 w-14 items-center justify-center rounded-full bg-orange text-white shadow-[0_12px_28px_-8px_rgba(255,69,0,0.55)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                  </div>

                  {lastActionBanner && (
                    <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">
                      {lastActionBanner}
                    </p>
                  )}
                </div>

                {/* RIGHT (5 COLS): Crisp Minimal Live Top 4 Leaderboard */}
                <div className="lg:col-span-5">
                  <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)] sm:p-7">
                    <div className="mb-5 flex items-center justify-between border-b border-ink/10 pb-4">
                      <div>
                        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-orange">
                          LIVE STANDINGS · {totalVotes.toLocaleString("en-IN")}{" "}
                          VOTES
                        </p>
                        <h3 className="mt-1 font-poster text-2xl tracking-tight text-ink">
                          TOP 4 GET CUT
                        </h3>
                      </div>

                      {deckIds.length < candidates.length && (
                        <button
                          type="button"
                          onClick={handleResetStack}
                          suppressHydrationWarning
                          className="inline-flex items-center gap-1 rounded-full border border-ink/12 bg-porcelain px-3 py-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted transition-colors hover:border-orange hover:text-orange"
                        >
                          <RotateCcw className="h-3 w-3" />
                          RESET
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {sortedLeaderboard.map((item, idx) => {
                        const rank = idx + 1;
                        const inTopFour = rank <= 4;
                        const pct = Math.max(
                          10,
                          Math.round((item.votesCount / maxVotes) * 100)
                        );
                        const userVoted = activeVotedIds.includes(item._id);

                        return (
                          <React.Fragment key={item._id}>
                            <motion.div
                              layout
                              transition={{
                                type: "spring",
                                stiffness: 360,
                                damping: 30,
                              }}
                              className={cn(
                                "rounded-2xl border p-3.5 transition-colors",
                                inTopFour
                                  ? "border-ink/10 bg-porcelain/80"
                                  : "border-ink/8 bg-white opacity-70"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={cn(
                                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold tabular-nums",
                                    inTopFour
                                      ? "bg-orange text-white"
                                      : "bg-linen text-muted"
                                  )}
                                >
                                  {String(rank).padStart(2, "0")}
                                </span>

                                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-ink/10 bg-linen">
                                  <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    fill
                                    sizes="40px"
                                    className="object-cover"
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-sm font-semibold text-ink">
                                      {item.title}
                                    </p>
                                    <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-ink">
                                      {item.votesCount.toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 truncate font-mono text-[10px] text-muted">
                                    {item.creatorHandle}
                                    {userVoted ? " · YOUR VOTE ✓" : ""}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-ink/8">
                                <motion.div
                                  layout
                                  initial={false}
                                  animate={{ width: `${pct}%` }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 240,
                                    damping: 26,
                                  }}
                                  className={cn(
                                    "h-full rounded-full",
                                    inTopFour ? "bg-orange" : "bg-ink/25"
                                  )}
                                />
                              </div>
                            </motion.div>

                            {rank === 4 && (
                              <div className="relative flex items-center py-1.5">
                                <div className="h-px flex-1 border-t border-dashed border-orange/60" />
                                <span className="mx-3 rounded-full border border-orange/25 bg-orange/[0.06] px-3 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.2em] text-orange">
                                  TOP 4 CUT-OFF
                                </span>
                                <div className="h-px flex-1 border-t border-dashed border-orange/60" />
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="v8-tab-submit"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* 12-Col Woven Cotton Neck Tag Creator Lab */}
                <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                  {/* LEFT (7 COLS): Clean Submission Form */}
                  <div className="lg:col-span-7">
                    <form
                      onSubmit={handleSubmitDesign}
                      className="rounded-3xl border border-ink/10 bg-white p-7 shadow-[0_16px_50px_rgba(0,0,0,0.05)] sm:p-9"
                    >
                      <div className="mb-6 flex items-center justify-between border-b border-ink/10 pb-4">
                        <span className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-orange">
                          <Tag className="h-3.5 w-3.5" />
                          DROP 02 DESIGN SUBMISSION
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                          LIVE LABEL SYNC
                        </span>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <label
                            htmlFor="v8-design-title"
                            className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
                          >
                            Piece Title
                          </label>
                          <input
                            id="v8-design-title"
                            type="text"
                            value={designTitle}
                            onChange={(e) => setDesignTitle(e.target.value)}
                            placeholder="e.g. STEPWELL RAW LOOPBACK HOODIE"
                            suppressHydrationWarning
                            className="w-full rounded-2xl border border-ink/12 bg-porcelain px-4 py-3 text-sm text-ink placeholder:text-muted/55 transition-colors focus:border-orange focus:bg-white focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <div>
                            <label
                              htmlFor="v8-creator-name"
                              className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
                            >
                              Your Name
                            </label>
                            <input
                              id="v8-creator-name"
                              type="text"
                              value={creatorName}
                              onChange={(e) => setCreatorName(e.target.value)}
                              placeholder="Meera Nair"
                              suppressHydrationWarning
                              className="w-full rounded-2xl border border-ink/12 bg-porcelain px-4 py-3 text-sm text-ink placeholder:text-muted/55 transition-colors focus:border-orange focus:bg-white focus:outline-none"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="v8-creator-handle"
                              className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
                            >
                              Handle
                            </label>
                            <input
                              id="v8-creator-handle"
                              type="text"
                              value={creatorHandle}
                              onChange={(e) => setCreatorHandle(e.target.value)}
                              placeholder="@handle"
                              suppressHydrationWarning
                              className="w-full rounded-2xl border border-ink/12 bg-porcelain px-4 py-3 font-mono text-sm text-ink placeholder:text-muted/55 transition-colors focus:border-orange focus:bg-white focus:outline-none"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="v8-creator-email"
                              className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
                            >
                              Email
                            </label>
                            <input
                              id="v8-creator-email"
                              type="email"
                              value={creatorEmail}
                              onChange={(e) => setCreatorEmail(e.target.value)}
                              placeholder="studio@domain.in"
                              suppressHydrationWarning
                              className="w-full rounded-2xl border border-ink/12 bg-porcelain px-4 py-3 text-sm text-ink placeholder:text-muted/55 transition-colors focus:border-orange focus:bg-white focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Silhouette Category */}
                        <div>
                          <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                            Silhouette Category
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map((cat) => {
                              const active = category === cat;
                              return (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => setCategory(cat)}
                                  suppressHydrationWarning
                                  className={cn(
                                    "rounded-full border px-3.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors",
                                    active
                                      ? cat.includes("1-of-1")
                                        ? "border-orange bg-orange text-white"
                                        : "border-ink bg-ink text-white"
                                      : "border-ink/12 bg-porcelain text-ink/80 hover:border-ink/30"
                                  )}
                                >
                                  {cat}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Craftsmanship Toggles */}
                        <div>
                          <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                            Craftsmanship Specs
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {CRAFT_SPECS.map((spec) => {
                              const selected = selectedSpecs.includes(spec);
                              return (
                                <button
                                  key={spec}
                                  type="button"
                                  onClick={() => toggleCraftSpec(spec)}
                                  suppressHydrationWarning
                                  className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.13em] transition-colors",
                                    selected
                                      ? "border-orange/40 bg-orange/[0.08] text-orange"
                                      : "border-ink/12 bg-white text-muted hover:border-ink/25 hover:text-ink"
                                  )}
                                >
                                  {selected && <Check className="h-3 w-3" />}
                                  <span>{spec}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <label
                            htmlFor="v8-design-notes"
                            className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
                          >
                            Construction &amp; Finish Notes
                          </label>
                          <textarea
                            id="v8-design-notes"
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Describe drape, wash patina, seam lines, or graphic placement..."
                            suppressHydrationWarning
                            className="w-full resize-none rounded-2xl border border-ink/12 bg-porcelain px-4 py-3 text-sm text-ink placeholder:text-muted/55 transition-colors focus:border-orange focus:bg-white focus:outline-none"
                          />
                        </div>

                        {/* Base Reference Visual Picker */}
                        <div>
                          <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                            Base Silhouette Reference
                          </p>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {VISUAL_PRESETS.map((preset) => {
                              const active = presetSrc === preset.src;
                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => setPresetSrc(preset.src)}
                                  suppressHydrationWarning
                                  className={cn(
                                    "group relative overflow-hidden rounded-2xl border p-1.5 text-left transition-all",
                                    active
                                      ? "border-orange bg-orange/[0.05]"
                                      : "border-ink/10 bg-porcelain hover:border-ink/25"
                                  )}
                                >
                                  <div className="relative h-20 w-full overflow-hidden rounded-xl bg-linen">
                                    <Image
                                      src={preset.src}
                                      alt={preset.label}
                                      fill
                                      sizes="140px"
                                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    {active && (
                                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange text-white shadow">
                                        <Check className="h-3 w-3" />
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1.5 px-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink">
                                    {preset.label}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {designError && (
                          <p className="rounded-2xl border border-archive-red/20 bg-archive-red/5 px-4 py-2.5 text-xs text-archive-red">
                            {designError}
                          </p>
                        )}

                        {submittedReceipt && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-2.5 rounded-2xl border border-orange/25 bg-orange/[0.06] px-4 py-3 text-xs text-orange"
                          >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                            <div>
                              <p className="font-mono font-bold uppercase tracking-[0.14em]">
                                LABEL ARCHIVED · {submittedReceipt.title}
                              </p>
                              <p className="mt-0.5 text-ink/80">
                                Logged to the Drop 02 studio bench under{" "}
                                {submittedReceipt.handle}.
                              </p>
                            </div>
                          </motion.div>
                        )}

                        <button
                          type="submit"
                          disabled={submittingDesign}
                          suppressHydrationWarning
                          className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-4 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-white transition-all hover:bg-orange disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                          <span>
                            {submittingDesign
                              ? "WEAVING SUBMISSION..."
                              : "SUBMIT CONCEPT FOR DROP 02"}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* RIGHT (5 COLS): Real-Time Stitched Cotton Neck Label */}
                  <div className="lg:sticky lg:top-24 lg:col-span-5">
                    <div className="overflow-hidden rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)] sm:p-7">
                      <div className="mb-5 flex items-center justify-between">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                          WOVEN NECK TAG PREVIEW
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-porcelain px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-ink">
                          <Sparkles className="h-2.5 w-2.5 text-orange" />
                          LIVE STITCH
                        </span>
                      </div>

                      {/* Macro Garment Backing Canvas */}
                      <div
                        className="relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-2xl border border-ink/10 p-6 sm:p-8"
                        style={{
                          backgroundColor: "#EAE6DD",
                          backgroundImage:
                            "repeating-linear-gradient(45deg, rgba(10,10,10,0.028) 0px, rgba(10,10,10,0.028) 2px, transparent 2px, transparent 6px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 2px, transparent 2px, transparent 6px)",
                        }}
                      >
                        {/* Collar Stitch Lines */}
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-0 top-5 border-b border-dashed border-ink/18"
                        />
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-0 top-6.5 border-b border-dashed border-ink/10"
                        />

                        {/* Stitched Raw Cotton Neck Label */}
                        <motion.div
                          layout
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 24,
                          }}
                          className="relative w-full max-w-[330px] rounded-[4px] border border-[#D4CCB9] px-6 py-6 shadow-[0_18px_36px_-18px_rgba(10,10,10,0.3),0_2px_4px_rgba(10,10,10,0.08)]"
                          style={{
                            backgroundColor: "#F6F2E8",
                            backgroundImage:
                              "repeating-linear-gradient(135deg, rgba(120,108,86,0.06) 0px, rgba(120,108,86,0.06) 3px, transparent 3px, transparent 6px), repeating-linear-gradient(45deg, rgba(255,255,255,0.45) 0px, rgba(255,255,255,0.45) 3px, transparent 3px, transparent 6px)",
                          }}
                        >
                          {/* 4 Corner Bar-Tack Stitches */}
                          <span
                            aria-hidden="true"
                            className="absolute left-2.5 top-2.5 h-[2.5px] w-4 rounded-full bg-ink/85"
                          />
                          <span
                            aria-hidden="true"
                            className="absolute right-2.5 top-2.5 h-[2.5px] w-4 rounded-full bg-ink/85"
                          />
                          <span
                            aria-hidden="true"
                            className="absolute bottom-2.5 left-2.5 h-[2.5px] w-4 rounded-full bg-ink/85"
                          />
                          <span
                            aria-hidden="true"
                            className="absolute bottom-2.5 right-2.5 h-[2.5px] w-4 rounded-full bg-ink/85"
                          />

                          {/* Co-Credit Header */}
                          <div className="mb-4 border-b border-ink/15 pb-3 text-center">
                            <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-ink">
                              KNITX<span className="text-orange">®</span> ×{" "}
                              <span className="text-orange">
                                {normalizedHandle}
                              </span>
                            </p>
                          </div>

                          {/* Piece Title */}
                          <div className="my-4 text-center">
                            <p className="break-words font-poster text-xl uppercase leading-tight tracking-wide text-ink">
                              {displayTitle}
                            </p>
                            <p className="mt-1.5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted">
                              {category.toUpperCase()}
                            </p>
                          </div>

                          {/* Edition Stamp */}
                          <div className="my-4 flex items-center justify-center">
                            <span
                              className={cn(
                                "rounded-sm border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em]",
                                isOneOfOneCategory
                                  ? "border-orange/45 bg-orange/[0.08] text-orange"
                                  : "border-ink/25 bg-ink/[0.04] text-ink"
                              )}
                            >
                              {isOneOfOneCategory
                                ? "EDITION 01/01 · ARCHIVE"
                                : "EDITION 01/04 · SMALL BATCH"}
                            </span>
                          </div>

                          {/* Active Specs */}
                          <div className="border-y border-ink/12 py-2.5 text-center">
                            <p className="font-mono text-[9px] uppercase leading-relaxed tracking-[0.16em] text-ink/75">
                              {selectedSpecs.length > 0
                                ? selectedSpecs.slice(0, 3).join(" · ")
                                : "CUSTOM ATELIER CONSTRUCTION"}
                            </p>
                          </div>

                          {/* Origin Line */}
                          <div className="mt-3.5 flex items-center justify-between font-mono text-[8.5px] font-semibold uppercase tracking-[0.2em] text-muted">
                            <span>MADE IN INDIA</span>
                            <span>ZERO DEADSTOCK</span>
                          </div>
                        </motion.div>
                      </div>

                      {/* Selected Silhouette Strip */}
                      <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-porcelain px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-ink/10 bg-linen">
                            <Image
                              src={presetSrc}
                              alt="Selected silhouette reference"
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
                              BASE SILHOUETTE
                            </p>
                            <p className="text-xs font-semibold text-ink">
                              {category}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">
                          CO-CREDIT ON
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Submissions Row */}
                {submissions.length > 0 && (
                  <div className="mt-12">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                        RECENT SUBMISSIONS ON THE BENCH
                      </p>
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink">
                        {submissions.length} CONCEPTS
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {submissions.slice(0, 4).map((sub) => {
                        const badge = formatSubmissionStatus(sub.status);
                        return (
                          <div
                            key={sub._id}
                            className="flex flex-col justify-between rounded-2xl border border-ink/10 bg-white p-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-ink/10 bg-linen">
                                <Image
                                  src={
                                    sub.imageUrl ||
                                    "/images/look-batch-hoodie.jpg"
                                  }
                                  alt={sub.title}
                                  fill
                                  sizes="44px"
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-ink">
                                  {sub.title}
                                </p>
                                <p className="mt-0.5 truncate font-mono text-[10px] text-muted">
                                  {sub.creatorHandle} · {sub.category}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3.5 border-t border-ink/8 pt-2.5">
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em]",
                                  badge.tone === "orange" &&
                                    "bg-orange/10 text-orange",
                                  badge.tone === "ink" &&
                                    "bg-ink/10 text-ink",
                                  badge.tone === "neutral" &&
                                    "bg-linen text-muted"
                                )}
                              >
                                {badge.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}
