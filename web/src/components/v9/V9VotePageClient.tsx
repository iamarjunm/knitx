"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUp,
  Check,
  Clock,
  Plus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { VoteCandidate } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_TOKENS = 5;
const QUALIFICATION_CUTOFF = 4;
const STORAGE_KEY = "knitx_v9_drop02_ballot_v1";
const BALLOT_ANCHOR_ISO = "2026-12-01T14:30:00.000Z";
const FALLBACK_WINDOW_SECONDS = 6 * 86400 + 14 * 3600 + 28 * 60 + 42;

type FilterTab = "all" | "one-of-one" | "small-batch";

interface FilterOption {
  id: FilterTab;
  label: string;
}

const FILTER_OPTIONS: readonly FilterOption[] = [
  { id: "all", label: "TOP RANKED" },
  { id: "one-of-one", label: "ONE-OF-ONE" },
  { id: "small-batch", label: "SMALL-BATCH" },
] as const;

interface StoredBallotState {
  allocations: Record<string, number>;
  unpersistedDeltas: Record<string, number>;
}

interface V9VotePageClientProps {
  initialCandidates: VoteCandidate[];
}

function formatCountdown(totalSeconds: number | null): string {
  if (totalSeconds === null) {
    return "--:--:--:--";
  }
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(clamped / 86400);
  const hours = Math.floor((clamped % 86400) / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function sortCandidates(list: VoteCandidate[]): VoteCandidate[] {
  return [...list].sort((a, b) => {
    if (b.votesCount !== a.votesCount) {
      return b.votesCount - a.votesCount;
    }
    return a.code.localeCompare(b.code);
  });
}

function computeRemainingSeconds(nowMs: number): number {
  const anchorMs = Date.parse(BALLOT_ANCHOR_ISO);
  if (Number.isFinite(anchorMs) && anchorMs > nowMs) {
    return Math.floor((anchorMs - nowMs) / 1000);
  }
  const cycleSeconds = 7 * 86400;
  const elapsedInCycle = Math.floor(nowMs / 1000) % cycleSeconds;
  const remaining = cycleSeconds - elapsedInCycle;
  return remaining > 0 ? remaining : FALLBACK_WINDOW_SECONDS;
}

function readStoredBallot(validIds: Set<string>): StoredBallotState {
  if (typeof window === "undefined") {
    return { allocations: {}, unpersistedDeltas: {} };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { allocations: {}, unpersistedDeltas: {} };
    }
    const parsed = JSON.parse(raw) as Partial<StoredBallotState>;
    const rawAllocations =
      parsed && typeof parsed.allocations === "object" && parsed.allocations
        ? parsed.allocations
        : {};
    const rawDeltas =
      parsed &&
      typeof parsed.unpersistedDeltas === "object" &&
      parsed.unpersistedDeltas
        ? parsed.unpersistedDeltas
        : {};

    const cleanAllocations: Record<string, number> = {};
    const cleanDeltas: Record<string, number> = {};
    let totalUsed = 0;

    for (const [id, count] of Object.entries(rawAllocations)) {
      if (!validIds.has(id)) continue;
      const numeric = Math.max(0, Math.floor(Number(count) || 0));
      if (numeric <= 0) continue;
      const allowed = Math.min(numeric, MAX_TOKENS - totalUsed);
      if (allowed > 0) {
        cleanAllocations[id] = allowed;
        totalUsed += allowed;
      }
    }

    for (const [id, count] of Object.entries(rawDeltas)) {
      if (!validIds.has(id)) continue;
      const numeric = Math.max(0, Math.floor(Number(count) || 0));
      if (numeric > 0 && cleanAllocations[id]) {
        cleanDeltas[id] = Math.min(numeric, cleanAllocations[id]);
      }
    }

    return {
      allocations: cleanAllocations,
      unpersistedDeltas: cleanDeltas,
    };
  } catch {
    return { allocations: {}, unpersistedDeltas: {} };
  }
}

function writeStoredBallot(state: StoredBallotState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota restrictions gracefully
  }
}

export default function V9VotePageClient({
  initialCandidates,
}: V9VotePageClientProps) {
  const { user } = useAuth();

  const [mounted, setMounted] = useState<boolean>(false);
  const [candidates, setCandidates] = useState<VoteCandidate[]>(() =>
    sortCandidates(initialCandidates)
  );
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [unpersistedDeltas, setUnpersistedDeltas] = useState<
    Record<string, number>
  >({});
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({});
  const [lastAllocatedId, setLastAllocatedId] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  const baseVotesMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of initialCandidates) {
      map[item._id] = item.votesCount;
    }
    return map;
  }, [initialCandidates]);

  // Mount-safe hydration of localStorage ballot state and ticking countdown
  useEffect(() => {
    setMounted(true);

    const validIds = new Set(initialCandidates.map((c) => c._id));
    const stored = readStoredBallot(validIds);
    setAllocations(stored.allocations);
    setUnpersistedDeltas(stored.unpersistedDeltas);

    if (Object.keys(stored.unpersistedDeltas).length > 0) {
      setCandidates(
        sortCandidates(
          initialCandidates.map((item) => ({
            ...item,
            votesCount:
              item.votesCount + (stored.unpersistedDeltas[item._id] ?? 0),
          }))
        )
      );
    }

    const updateTimer = () => {
      setCountdownSeconds(computeRemainingSeconds(Date.now()));
    };
    updateTimer();
    const intervalId = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(intervalId);
  }, [initialCandidates]);

  // Auto-dismiss status notice cleanly
  useEffect(() => {
    if (!statusNotice) return;
    const timeoutId = window.setTimeout(() => {
      setStatusNotice(null);
    }, 3200);
    return () => window.clearTimeout(timeoutId);
  }, [statusNotice]);

  // Clear pulse highlight on recently voted candidate
  useEffect(() => {
    if (!lastAllocatedId) return;
    const timeoutId = window.setTimeout(() => {
      setLastAllocatedId(null);
    }, 900);
    return () => window.clearTimeout(timeoutId);
  }, [lastAllocatedId]);

  const activeUser = mounted ? user : null;
  const safeAllocations = useMemo(
    () => (mounted ? allocations : {}),
    [mounted, allocations]
  );

  const tokensUsed = useMemo(
    () =>
      Object.values(safeAllocations).reduce((sum, count) => sum + count, 0),
    [safeAllocations]
  );
  const tokensRemaining = Math.max(0, MAX_TOKENS - tokensUsed);

  const sortedAll = useMemo(() => sortCandidates(candidates), [candidates]);

  const globalRankMap = useMemo(() => {
    const map: Record<string, number> = {};
    sortedAll.forEach((item, index) => {
      map[item._id] = index + 1;
    });
    return map;
  }, [sortedAll]);

  const totalVotesCast = useMemo(
    () => sortedAll.reduce((sum, item) => sum + item.votesCount, 0),
    [sortedAll]
  );

  const topFourVotes = useMemo(
    () =>
      sortedAll
        .slice(0, QUALIFICATION_CUTOFF)
        .reduce((sum, item) => sum + item.votesCount, 0),
    [sortedAll]
  );

  const filteredCandidates = useMemo(() => {
    if (activeFilter === "all") return sortedAll;
    return sortedAll.filter((item) => item.tierSuggestion === activeFilter);
  }, [sortedAll, activeFilter]);

  const qualifyingCandidates = useMemo(
    () =>
      filteredCandidates.filter(
        (item) => (globalRankMap[item._id] ?? 99) <= QUALIFICATION_CUTOFF
      ),
    [filteredCandidates, globalRankMap]
  );

  const contenderCandidates = useMemo(
    () =>
      filteredCandidates.filter(
        (item) => (globalRankMap[item._id] ?? 99) > QUALIFICATION_CUTOFF
      ),
    [filteredCandidates, globalRankMap]
  );

  const filterCounts = useMemo(
    () => ({
      all: sortedAll.length,
      "one-of-one": sortedAll.filter((c) => c.tierSuggestion === "one-of-one")
        .length,
      "small-batch": sortedAll.filter((c) => c.tierSuggestion === "small-batch")
        .length,
    }),
    [sortedAll]
  );

  const handleAllocateToken = useCallback(
    async (candidate: VoteCandidate) => {
      if (!mounted) return;
      if (tokensRemaining <= 0) {
        setStatusNotice("All 5 curator tokens allocated. Reset above to rebalance.");
        return;
      }
      if (pendingIds[candidate._id]) return;

      const candidateId = candidate._id;
      const nextAllocations: Record<string, number> = {
        ...allocations,
        [candidateId]: (allocations[candidateId] ?? 0) + 1,
      };

      setPendingIds((prev) => ({ ...prev, [candidateId]: true }));
      setAllocations(nextAllocations);
      setLastAllocatedId(candidateId);
      setCandidates((prev) =>
        sortCandidates(
          prev.map((item) =>
            item._id === candidateId
              ? { ...item, votesCount: item.votesCount + 1 }
              : item
          )
        )
      );
      setStatusNotice(`+1 Curator Token placed on ${candidate.title}`);

      let persistedOnServer = false;
      try {
        const response = await fetch("/api/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId,
            uid: activeUser?.uid,
          }),
        });
        if (response.ok) {
          const data = (await response.json()) as {
            ok?: boolean;
            persisted?: boolean;
          };
          persistedOnServer = Boolean(data.persisted);
        }
      } catch {
        persistedOnServer = false;
      }

      const nextDeltas: Record<string, number> = persistedOnServer
        ? { ...unpersistedDeltas }
        : {
            ...unpersistedDeltas,
            [candidateId]: (unpersistedDeltas[candidateId] ?? 0) + 1,
          };

      setUnpersistedDeltas(nextDeltas);
      writeStoredBallot({
        allocations: nextAllocations,
        unpersistedDeltas: nextDeltas,
      });

      setPendingIds((prev) => {
        const copy = { ...prev };
        delete copy[candidateId];
        return copy;
      });
    },
    [mounted, tokensRemaining, pendingIds, allocations, unpersistedDeltas, activeUser]
  );

  const handleResetTokens = useCallback(() => {
    if (!mounted || tokensUsed === 0) return;

    const currentAllocations = allocations;
    setCandidates((prev) =>
      sortCandidates(
        prev.map((item) => {
          const placed = currentAllocations[item._id] ?? 0;
          if (placed === 0) return item;
          const floor = baseVotesMap[item._id] ?? 0;
          return {
            ...item,
            votesCount: Math.max(floor, item.votesCount - placed),
          };
        })
      )
    );
    setAllocations({});
    setUnpersistedDeltas({});
    writeStoredBallot({ allocations: {}, unpersistedDeltas: {} });
    setStatusNotice("Curator tokens reset · 5 of 5 discs ready to allocate.");
  }, [mounted, tokensUsed, allocations, baseVotesMap]);

  const renderBallotCard = (candidate: VoteCandidate) => {
    const rank = globalRankMap[candidate._id] ?? 1;
    const isQualified = rank <= QUALIFICATION_CUTOFF;
    const placedCount = safeAllocations[candidate._id] ?? 0;
    const voteShare =
      totalVotesCast > 0 ? (candidate.votesCount / totalVotesCast) * 100 : 0;
    const isOneOfOne = candidate.tierSuggestion === "one-of-one";
    const isPending = Boolean(pendingIds[candidate._id]);
    const isJustVoted = lastAllocatedId === candidate._id;
    const canAllocate = mounted && tokensRemaining > 0 && !isPending;
    const craftSummary =
      candidate.craftsmanship.length > 0
        ? candidate.craftsmanship.slice(0, 2).join(" · ")
        : candidate.description;

    return (
      <motion.article
        key={candidate._id}
        layout
        transition={{
          layout: { type: "spring", stiffness: 280, damping: 28, mass: 0.9 },
        }}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300",
          isJustVoted
            ? "border-[#8E1C1C] shadow-[0_22px_48px_-24px_rgba(142,28,28,0.28)]"
            : placedCount > 0
              ? "border-[#9A7B4F]/80 shadow-[0_14px_34px_-22px_rgba(17,17,16,0.14)]"
              : "border-[#DDD7CB] hover:border-[#9A7B4F]/65 hover:shadow-[0_18px_40px_-24px_rgba(17,17,16,0.12)]"
        )}
      >
        {/* Tall 3:4 Gallery Frame */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#ECE8DF]">
          <Image
            src={candidate.imageUrl}
            alt={candidate.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />

          {/* Subtle Gallery Vignette for Badge Legibility */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#111110]/25 via-[#111110]/5 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#111110]/30 via-transparent to-transparent" />

          {/* Top Bar: Subtle Rank Index + Tier Tag */}
          <div className="absolute inset-x-3.5 top-3.5 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DDD7CB]/90 bg-white/95 px-2.5 py-1 font-mono text-[11px] font-medium tracking-[0.14em] text-[#111110] backdrop-blur-sm">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isQualified ? "bg-[#8E1C1C]" : "bg-[#6A655D]/45"
                )}
              />
              <span>{String(rank).padStart(2, "0")}</span>
            </span>

            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-medium tracking-[0.16em] uppercase backdrop-blur-sm",
                isOneOfOne
                  ? "border border-[#9A7B4F] bg-[#9A7B4F] text-white"
                  : "border border-[#DDD7CB]/90 bg-white/95 text-[#111110]"
              )}
            >
              {isOneOfOne ? "1-OF-1" : "SMALL-BATCH"}
            </span>
          </div>

          {/* Bottom Bar: Backed Pill When Curator Has Placed Tokens */}
          <AnimatePresence>
            {placedCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.94 }}
                transition={{ duration: 0.22 }}
                className="absolute bottom-3.5 left-3.5"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#9A7B4F]/70 bg-[#8E1C1C] px-3 py-1 font-mono text-[10px] font-medium tracking-[0.16em] text-white uppercase shadow-sm">
                  <Check className="h-3 w-3 stroke-[2.2]" />
                  <span>
                    {placedCount}{" "}
                    {placedCount === 1 ? "TOKEN PLACED" : "TOKENS PLACED"}
                  </span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Crisp Ivory Museum Details */}
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          {/* Serial & Creator Handle */}
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="font-mono tracking-[0.18em] text-[#6A655D] uppercase">
              {candidate.code}
            </span>
            <span className="truncate font-mono tracking-[0.06em] text-[#9A7B4F]">
              {candidate.creatorHandle}
            </span>
          </div>

          {/* Monumental Silhouette Title */}
          <h3 className="mt-2 font-poster text-[25px] leading-[1.06] tracking-[0.02em] text-[#111110] uppercase sm:text-[27px]">
            {candidate.title}
          </h3>

          {/* Craftsmanship Summary */}
          <p className="mt-2.5 line-clamp-2 font-sans text-[13px] leading-relaxed text-[#6A655D]">
            {candidate.description}
          </p>

          <p className="mt-2.5 truncate border-t border-[#DDD7CB]/70 pt-2.5 font-mono text-[10px] tracking-[0.08em] text-[#6A655D]">
            {craftSummary}
          </p>

          {/* Vote Share Progress + Live Tally */}
          <div className="mt-auto pt-5">
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-sm font-semibold tabular-nums text-[#111110]">
                  {candidate.votesCount.toLocaleString("en-IN")}
                </span>
                <span className="font-mono text-[10px] tracking-[0.16em] text-[#6A655D] uppercase">
                  VOTES
                </span>
              </div>

              <span className="font-mono text-[11px] tabular-nums tracking-[0.1em] text-[#6A655D]">
                {voteShare.toFixed(1)}% SHARE
              </span>
            </div>

            {/* Razor-Thin Oxblood Vote-Share Progress Bar */}
            <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[#ECE8DF]">
              <motion.div
                initial={false}
                animate={{ width: `${Math.min(100, Math.max(2, voteShare * 2.6))}%` }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "h-full rounded-full",
                  isQualified ? "bg-[#8E1C1C]" : "bg-[#9A7B4F]/65"
                )}
              />
            </div>

            {/* Tactile + ALLOCATE TOKEN CTA */}
            <div className="mt-4 flex items-center gap-2.5">
              <motion.button
                type="button"
                suppressHydrationWarning
                whileTap={canAllocate ? { scale: 0.975 } : undefined}
                disabled={!canAllocate}
                onClick={() => void handleAllocateToken(candidate)}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-mono text-[11px] font-medium tracking-[0.16em] uppercase transition-all duration-200 focus:outline-none",
                  canAllocate
                    ? placedCount > 0
                      ? "border-[#8E1C1C] bg-[#8E1C1C] text-white hover:bg-[#761616]"
                      : "border-[#111110] bg-[#111110] text-white hover:border-[#8E1C1C] hover:bg-[#8E1C1C]"
                    : "cursor-not-allowed border-[#DDD7CB] bg-[#ECE8DF] text-[#6A655D]"
                )}
              >
                {tokensRemaining > 0 ? (
                  <Plus className="h-3.5 w-3.5 stroke-[2.2]" />
                ) : placedCount > 0 ? (
                  <Check className="h-3.5 w-3.5 stroke-[2.2]" />
                ) : null}
                <span>
                  {isPending
                    ? "RECORDING TOKEN..."
                    : tokensRemaining > 0
                      ? "ALLOCATE TOKEN"
                      : placedCount > 0
                        ? `${placedCount} ${placedCount === 1 ? "TOKEN" : "TOKENS"} PLACED`
                        : "ALL 5 TOKENS ALLOCATED"}
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.article>
    );
  };

  return (
    <main className="min-h-screen bg-[#F7F5F0] pt-28 pb-24 text-[#111110] sm:pt-32 sm:pb-28">
      <div className="mx-auto max-w-[1380px] px-5 sm:px-10 lg:px-14">
        {/* 1. CLEAN EDITORIAL HEADER */}
        <section aria-labelledby="v9-vote-heading">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8E1C1C]" />
                <span className="font-mono text-[11px] tracking-[0.24em] text-[#9A7B4F] uppercase">
                  COMMUNITY BALLOT · DROP 02
                </span>
              </div>

              <h1
                id="v9-vote-heading"
                className="mt-3.5 font-poster text-[56px] leading-[0.94] tracking-[0.02em] text-[#111110] uppercase sm:text-[74px] lg:text-[86px]"
              >
                VOTE DROP 02.
              </h1>

              <p className="mt-4 max-w-xl font-sans text-[15px] leading-relaxed text-[#6A655D] sm:text-base">
                You decide what enters sample production. Top 4 silhouettes get
                cut and released.
              </p>
            </div>

            <div className="hidden items-center gap-2.5 pb-1 lg:inline-flex">
              <span className="h-px w-10 bg-[#DDD7CB]" />
              <span className="font-mono text-[10px] tracking-[0.22em] text-[#6A655D] uppercase">
                PAN-INDIA EDITION · INDIA
              </span>
            </div>
          </div>

          {/* 3-Stat Architectural Ledger */}
          <div className="mt-9 grid grid-cols-1 divide-y divide-[#DDD7CB] overflow-hidden rounded-2xl border border-[#DDD7CB] bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="px-6 py-5">
              <p className="font-mono text-[10px] tracking-[0.22em] text-[#6A655D] uppercase">
                TOTAL VOTES CAST
              </p>
              <div className="mt-2 flex items-baseline gap-2.5">
                <span className="font-mono text-2xl font-semibold tabular-nums text-[#111110] sm:text-[26px]">
                  {totalVotesCast.toLocaleString("en-IN")}
                </span>
                <span className="font-mono text-[10px] tracking-[0.16em] text-[#8E1C1C] uppercase">
                  LIVE TALLY
                </span>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="font-mono text-[10px] tracking-[0.22em] text-[#6A655D] uppercase">
                QUALIFICATION: TOP 4
              </p>
              <div className="mt-2 flex items-baseline gap-2.5">
                <span className="font-poster text-2xl tracking-[0.03em] text-[#111110] uppercase sm:text-[26px]">
                  4 SILHOUETTES
                </span>
                <span className="font-mono text-[10px] tracking-[0.14em] text-[#9A7B4F] uppercase">
                  SAMPLE CUT
                </span>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.22em] text-[#6A655D] uppercase">
                <Clock className="h-3 w-3 text-[#8E1C1C]" />
                <span>BALLOT CLOSES IN</span>
              </p>
              <div className="mt-2 flex items-baseline gap-2.5">
                <span className="font-mono text-2xl font-semibold tabular-nums tracking-[0.06em] text-[#111110] sm:text-[26px]">
                  {formatCountdown(countdownSeconds)}
                </span>
                <span className="font-mono text-[10px] tracking-[0.14em] text-[#6A655D] uppercase">
                  DD:HH:MM:SS
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. STICKY 5-TOKEN CURATOR TRAY */}
        <div className="sticky top-[70px] z-30 mt-8 sm:top-[76px]">
          <div className="rounded-2xl border border-[#DDD7CB] bg-white/95 px-5 py-4 shadow-sm backdrop-blur-md sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Left: 5 Tactile Circular Oxblood & Brass Curator Token Discs */}
              <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-start sm:gap-5">
                <div className="flex items-center gap-2.5" aria-label="Curator vote tokens">
                  {Array.from({ length: MAX_TOKENS }).map((_, index) => {
                    const isAvailable = index < tokensRemaining;
                    return (
                      <motion.div
                        key={index}
                        initial={false}
                        animate={{
                          scale: isAvailable ? 1 : 0.9,
                          opacity: isAvailable ? 1 : 0.4,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 340,
                          damping: 24,
                        }}
                        className={cn(
                          "relative flex h-10 w-10 select-none items-center justify-center rounded-full border-2 transition-colors duration-300",
                          isAvailable
                            ? "border-[#9A7B4F] bg-[#8E1C1C] text-[#F7F5F0] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_12px_-4px_rgba(142,28,28,0.45)]"
                            : "border-dashed border-[#DDD7CB] bg-[#ECE8DF] text-[#6A655D]"
                        )}
                        title={
                          isAvailable
                            ? `Curator Token ${index + 1} · Ready`
                            : `Curator Token ${index + 1} · Allocated`
                        }
                      >
                        <span
                          className={cn(
                            "pointer-events-none absolute inset-[2px] rounded-full border",
                            isAvailable
                              ? "border-[#9A7B4F]/60"
                              : "border-transparent"
                          )}
                        />
                        <span className="font-poster text-[13px] leading-none tracking-[0.08em]">
                          KX
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-[#111110] uppercase">
                      {tokensRemaining} / {MAX_TOKENS} TOKENS REMAINING
                    </p>
                    <p className="mt-0.5 font-sans text-xs text-[#6A655D]">
                      {tokensRemaining > 0
                        ? "Stack or split tokens across Drop 02 pieces."
                        : "Full allocation placed · Reset to adjust."}
                    </p>
                  </div>

                  <button
                    type="button"
                    suppressHydrationWarning
                    disabled={!mounted || tokensUsed === 0}
                    onClick={handleResetTokens}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-[10px] font-medium tracking-[0.16em] uppercase transition-colors duration-200 focus:outline-none",
                      mounted && tokensUsed > 0
                        ? "border-[#DDD7CB] bg-[#F7F5F0] text-[#111110] hover:border-[#8E1C1C] hover:text-[#8E1C1C]"
                        : "cursor-not-allowed border-[#DDD7CB]/70 bg-[#ECE8DF]/55 text-[#6A655D]/60"
                    )}
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>RESET TOKENS</span>
                  </button>
                </div>
              </div>

              {/* Right: Filter Tabs with layoutId Underline */}
              <div
                role="tablist"
                aria-label="Filter silhouettes by tier"
                className="flex items-center gap-6 border-t border-[#DDD7CB]/80 pt-3 lg:border-t-0 lg:pt-0"
              >
                {FILTER_OPTIONS.map((tab) => {
                  const isActive = activeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      suppressHydrationWarning
                      onClick={() => setActiveFilter(tab.id)}
                      className={cn(
                        "relative pb-2 pt-0.5 font-mono text-[11px] font-medium tracking-[0.16em] uppercase transition-colors duration-200 focus:outline-none",
                        isActive
                          ? "text-[#111110]"
                          : "text-[#6A655D] hover:text-[#111110]"
                      )}
                    >
                      <span>{tab.label}</span>
                      <span className="ml-1.5 text-[10px] text-[#9A7B4F]">
                        {String(filterCounts[tab.id]).padStart(2, "0")}
                      </span>
                      {isActive && (
                        <motion.span
                          layoutId="v9-vote-filter-underline"
                          transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 32,
                          }}
                          className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-[#8E1C1C]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Allocation Status Feedback Strip */}
            <AnimatePresence>
              {statusNotice && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-[#DDD7CB]/80 pt-2.5"
                >
                  <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-[#8E1C1C] uppercase">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#9A7B4F]" />
                    <span>{statusNotice}</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 3. LIVE AUTO-SORTING 3-COLUMN MUSEUM BALLOT GRID */}
        <section aria-label="Drop 02 Silhouette Ballot" className="mt-10">
          <LayoutGroup id="v9-drop02-ballot">
            {/* Qualifying Zone (Ranks 01 - 04) */}
            {qualifyingCandidates.length > 0 && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {qualifyingCandidates.map((candidate) =>
                  renderBallotCard(candidate)
                )}

                {/* Architectural Production Standing Note (fills cols 2-3 cleanly when 4 cards sit in 3-col grid) */}
                {activeFilter === "all" &&
                  qualifyingCandidates.length === QUALIFICATION_CUTOFF && (
                    <div className="hidden flex-col justify-between rounded-2xl border border-[#DDD7CB] bg-[#ECE8DF]/70 p-8 lg:col-span-2 lg:flex">
                      <div>
                        <div className="inline-flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#8E1C1C]" />
                          <span className="font-mono text-[10px] tracking-[0.22em] text-[#9A7B4F] uppercase">
                            SAMPLE PRODUCTION LEDGER · DROP 02
                          </span>
                        </div>

                        <h2 className="mt-4 font-poster text-4xl leading-[0.98] tracking-[0.02em] text-[#111110] uppercase">
                          FOUR PATTERNS MAKE THE CUT.
                        </h2>

                        <p className="mt-3 max-w-lg font-sans text-sm leading-relaxed text-[#6A655D]">
                          Rankings reorder in real time as curator tokens land.
                          When the Drop 02 ballot seals, the top four silhouettes
                          move immediately into pattern-making and micro-batch
                          production across our partner ateliers in India.
                        </p>
                      </div>

                      <div className="mt-8 grid grid-cols-3 gap-4 border-t border-[#DDD7CB] pt-6">
                        <div>
                          <p className="font-mono text-[10px] tracking-[0.18em] text-[#6A655D] uppercase">
                            TOP 4 SHARE
                          </p>
                          <p className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-[#111110]">
                            {totalVotesCast > 0
                              ? `${((topFourVotes / totalVotesCast) * 100).toFixed(1)}%`
                              : "0.0%"}
                          </p>
                        </div>

                        <div>
                          <p className="font-mono text-[10px] tracking-[0.18em] text-[#6A655D] uppercase">
                            YOUR ALLOCATION
                          </p>
                          <p className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-[#8E1C1C]">
                            {tokensUsed} / {MAX_TOKENS}
                          </p>
                        </div>

                        <div>
                          <p className="font-mono text-[10px] tracking-[0.18em] text-[#6A655D] uppercase">
                            EDITION ORIGIN
                          </p>
                          <p className="mt-1.5 font-mono text-xl font-semibold text-[#9A7B4F]">
                            INDIA
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Architectural TOP 4 SAMPLE PRODUCTION CUT-OFF Hairline Divider */}
            {contenderCandidates.length > 0 && (
              <div
                role="separator"
                aria-label="Top 4 Sample Production Cut-Off"
                className="my-12 flex items-center gap-4 sm:my-14 sm:gap-6"
              >
                <div className="h-px flex-1 bg-[#DDD7CB]" />
                <div className="flex flex-wrap items-center justify-center gap-2.5 rounded-full border border-[#8E1C1C]/35 bg-white px-4 py-2 shadow-xs">
                  <ArrowUp className="h-3.5 w-3.5 text-[#8E1C1C]" />
                  <span className="font-mono text-[10px] font-semibold tracking-[0.22em] text-[#8E1C1C] uppercase sm:text-[11px]">
                    TOP 4 SAMPLE PRODUCTION CUT-OFF
                  </span>
                  <span className="hidden h-3 w-px bg-[#DDD7CB] sm:inline-block" />
                  <span className="hidden font-mono text-[10px] tracking-[0.16em] text-[#6A655D] uppercase sm:inline">
                    BELOW LINE · CONTENDERS
                  </span>
                </div>
                <div className="h-px flex-1 bg-[#DDD7CB]" />
              </div>
            )}

            {/* Contenders Zone (Rank 05+) */}
            {contenderCandidates.length > 0 && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {contenderCandidates.map((candidate) =>
                  renderBallotCard(candidate)
                )}
              </div>
            )}

            {/* Empty Filter State */}
            {filteredCandidates.length === 0 && (
              <div className="rounded-2xl border border-[#DDD7CB] bg-white px-6 py-16 text-center">
                <p className="font-mono text-[11px] tracking-[0.2em] text-[#9A7B4F] uppercase">
                  NO SILHOUETTES IN THIS TIER
                </p>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setActiveFilter("all")}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#111110] px-5 py-2.5 font-mono text-[11px] tracking-[0.16em] text-[#111110] uppercase transition-colors hover:border-[#8E1C1C] hover:bg-[#8E1C1C] hover:text-white"
                >
                  VIEW ALL CANDIDATES
                </button>
              </div>
            )}
          </LayoutGroup>
        </section>

        {/* 4. REFINED BOTTOM PROMPT -> /v9/submit */}
        <section
          aria-labelledby="v9-pitch-heading"
          className="mt-20 overflow-hidden rounded-2xl border border-[#DDD7CB] bg-[#ECE8DF] p-8 sm:p-12 lg:p-14"
        >
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#9A7B4F]" />
                <span className="font-mono text-[11px] tracking-[0.22em] text-[#9A7B4F] uppercase">
                  OPEN CREATOR CALL · DROP 02 &amp; BEYOND
                </span>
              </div>

              <h2
                id="v9-pitch-heading"
                className="mt-3 font-poster text-4xl leading-[0.98] tracking-[0.02em] text-[#111110] uppercase sm:text-5xl"
              >
                DESIGN YOUR OWN SILHOUETTE.
              </h2>

              <p className="mt-3.5 max-w-xl font-sans text-[15px] leading-relaxed text-[#6A655D]">
                Independent pattern-makers, textile artists, and streetwear
                designers across India can submit original 1-of-1 or small-batch
                concepts. Selected silhouettes enter the next community ballot
                with full creator credit and studio sampling.
              </p>
            </div>

            <div className="shrink-0">
              <Link
                href="/v9/submit"
                className="group inline-flex items-center gap-3 rounded-xl border border-[#8E1C1C] bg-[#8E1C1C] px-7 py-4 font-mono text-xs font-medium tracking-[0.18em] text-white uppercase transition-colors duration-200 hover:border-[#111110] hover:bg-[#111110]"
              >
                <span>PITCH YOUR SILHOUETTE</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
