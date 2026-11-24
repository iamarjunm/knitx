"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Check,
  Crown,
  Flame,
  RotateCcw,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { VoteCandidate } from "@/lib/types";
import { cn } from "@/lib/utils";

interface V3BracketVoteProps {
  initialCandidates: VoteCandidate[];
}

interface StoredBracketState {
  semiAWinnerId: string | null;
  semiBWinnerId: string | null;
  championId: string | null;
  localIncrements: Record<string, number>;
}

const BRACKET_STORAGE_KEY = "knitx_v3_bracket_state_v1";
const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");

function formatVotes(value: number): string {
  return NUMBER_FORMATTER.format(Math.max(0, Math.floor(value)));
}

interface SparkParticle {
  id: number;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  color: "chartreuse" | "alabaster" | "hunter";
  shape: "diamond" | "bar" | "dot";
}

const CHAMPION_PARTICLES: SparkParticle[] = [
  { id: 1, x: -118, y: -78, rotate: -38, scale: 1.1, color: "chartreuse", shape: "diamond" },
  { id: 2, x: -84, y: -110, rotate: 24, scale: 0.9, color: "alabaster", shape: "bar" },
  { id: 3, x: -34, y: -124, rotate: -18, scale: 1.15, color: "chartreuse", shape: "dot" },
  { id: 4, x: 26, y: -126, rotate: 32, scale: 1.0, color: "chartreuse", shape: "diamond" },
  { id: 5, x: 82, y: -108, rotate: -42, scale: 0.95, color: "alabaster", shape: "bar" },
  { id: 6, x: 120, y: -74, rotate: 48, scale: 1.1, color: "chartreuse", shape: "diamond" },
  { id: 7, x: -126, y: -14, rotate: 16, scale: 0.85, color: "alabaster", shape: "dot" },
  { id: 8, x: 128, y: -12, rotate: -26, scale: 0.95, color: "chartreuse", shape: "bar" },
  { id: 9, x: -104, y: 58, rotate: 40, scale: 0.9, color: "chartreuse", shape: "diamond" },
  { id: 10, x: 106, y: 56, rotate: -36, scale: 0.9, color: "alabaster", shape: "diamond" },
  { id: 11, x: -56, y: 92, rotate: -22, scale: 0.85, color: "alabaster", shape: "dot" },
  { id: 12, x: 58, y: 94, rotate: 28, scale: 1.0, color: "chartreuse", shape: "dot" },
];

export default function V3BracketVote({ initialCandidates }: V3BracketVoteProps) {
  const { user } = useAuth();

  const [mounted, setMounted] = useState<boolean>(false);
  const [localIncrements, setLocalIncrements] = useState<Record<string, number>>({});
  const [semiAWinnerId, setSemiAWinnerId] = useState<string | null>(null);
  const [semiBWinnerId, setSemiBWinnerId] = useState<string | null>(null);
  const [championId, setChampionId] = useState<string | null>(null);
  const [lastVotedId, setLastVotedId] = useState<string | null>(null);
  const [burstKey, setBurstKey] = useState<number>(0);
  const [voteNotice, setVoteNotice] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = window.localStorage.getItem(BRACKET_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<StoredBracketState>;
      const validIds = new Set(initialCandidates.map((c) => c._id));
      if (parsed.semiAWinnerId && validIds.has(parsed.semiAWinnerId)) {
        setSemiAWinnerId(parsed.semiAWinnerId);
      }
      if (parsed.semiBWinnerId && validIds.has(parsed.semiBWinnerId)) {
        setSemiBWinnerId(parsed.semiBWinnerId);
      }
      if (parsed.championId && validIds.has(parsed.championId)) {
        setChampionId(parsed.championId);
      }
      if (parsed.localIncrements && typeof parsed.localIncrements === "object") {
        setLocalIncrements(parsed.localIncrements);
      }
    } catch {
      // Ignore malformed local state
    }
  }, [initialCandidates]);

  // Persist bracket selections after hydration
  useEffect(() => {
    if (!mounted) return;
    try {
      const payload: StoredBracketState = {
        semiAWinnerId,
        semiBWinnerId,
        championId,
        localIncrements,
      };
      window.localStorage.setItem(BRACKET_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [mounted, semiAWinnerId, semiBWinnerId, championId, localIncrements]);

  const candidates = useMemo<VoteCandidate[]>(() => {
    return initialCandidates.map((cand) => ({
      ...cand,
      votesCount:
        cand.votesCount + (mounted ? localIncrements[cand._id] || 0 : 0),
    }));
  }, [initialCandidates, localIncrements, mounted]);

  const bracketContenders = useMemo(
    () => candidates.slice(0, 4),
    [candidates]
  );

  const semiA1 = bracketContenders[0] ?? null;
  const semiA2 = bracketContenders[1] ?? null;
  const semiB1 = bracketContenders[2] ?? null;
  const semiB2 = bracketContenders[3] ?? null;

  const activeSemiAId = mounted ? semiAWinnerId : null;
  const activeSemiBId = mounted ? semiBWinnerId : null;
  const activeChampionId = mounted ? championId : null;

  const semiAWinner = useMemo(
    () => candidates.find((c) => c._id === activeSemiAId) ?? null,
    [candidates, activeSemiAId]
  );

  const semiBWinner = useMemo(
    () => candidates.find((c) => c._id === activeSemiBId) ?? null,
    [candidates, activeSemiBId]
  );

  const champion = useMemo(
    () => candidates.find((c) => c._id === activeChampionId) ?? null,
    [candidates, activeChampionId]
  );

  const totalVotes = useMemo(
    () => candidates.reduce((sum, item) => sum + item.votesCount, 0),
    [candidates]
  );

  const sortedTally = useMemo(
    () => [...candidates].sort((a, b) => b.votesCount - a.votesCount),
    [candidates]
  );

  const castCommunityVote = useCallback(
    async (candidate: VoteCandidate, roundLabel: string) => {
      setLocalIncrements((prev) => ({
        ...prev,
        [candidate._id]: (prev[candidate._id] || 0) + 1,
      }));
      setLastVotedId(candidate._id);
      setVoteNotice(`+1 VOTE CAST FOR ${candidate.code} · ${roundLabel}`);

      try {
        await fetch("/api/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId: candidate._id,
            uid: user?.uid,
          }),
        });
      } catch {
        // Optimistic UI remains intact
      }
    },
    [user?.uid]
  );

  const handleSelectSemiA = (candidate: VoteCandidate) => {
    setSemiAWinnerId(candidate._id);
    if (championId && championId !== semiBWinnerId && championId !== candidate._id) {
      setChampionId(null);
    }
    void castCommunityVote(candidate, "SEMIFINAL A");
  };

  const handleSelectSemiB = (candidate: VoteCandidate) => {
    setSemiBWinnerId(candidate._id);
    if (championId && championId !== semiAWinnerId && championId !== candidate._id) {
      setChampionId(null);
    }
    void castCommunityVote(candidate, "SEMIFINAL B");
  };

  const handleSelectChampion = (candidate: VoteCandidate) => {
    if (!semiAWinner || !semiBWinner) return;
    setChampionId(candidate._id);
    setBurstKey((prev) => prev + 1);
    void castCommunityVote(candidate, "GRAND FINAL");
  };

  const handleReplayBracket = () => {
    setSemiAWinnerId(null);
    setSemiBWinnerId(null);
    setChampionId(null);
    setLastVotedId(null);
    setVoteNotice("BRACKET RESET · PICK YOUR NEW DROP 02 WINNERS");
  };

  const bothFinalistsReady = Boolean(semiAWinner && semiBWinner);

  return (
    <section
      id="bracket"
      className="relative overflow-hidden bg-alabaster py-24"
    >
      {/* Subtle top hairline & ambient architectural grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-hunter/15"
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {/* Header Bar */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-hunter/20 bg-white px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-hunter">
              <Trophy className="h-3.5 w-3.5 text-hunter" />
              <span>DROP 02 COMMISSION · KNOCKOUT ARENA · INDIA</span>
            </div>

            <h2 className="font-editorial text-5xl leading-[0.95] tracking-tight text-espresso sm:text-6xl lg:text-7xl">
              Drop 02 <span className="italic text-hunter">Knockout.</span>
            </h2>

            <p className="font-sans text-base leading-relaxed text-espresso/75 sm:text-lg">
              Pick your winners round by round. Every click casts a real
              community vote.
            </p>
          </div>

          {/* Live Telemetry & Replay Pill */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-[2px] border border-hunter/15 bg-white px-4 py-2.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-espresso/50">
                TOTAL COMMUNITY VOTES
              </p>
              <p className="mt-0.5 font-mono text-lg font-bold tracking-wider text-hunter">
                {formatVotes(totalVotes)}
              </p>
            </div>

            {(activeSemiAId || activeSemiBId || activeChampionId) && (
              <button
                type="button"
                suppressHydrationWarning
                onClick={handleReplayBracket}
                className="inline-flex items-center gap-2 rounded-[2px] border border-hunter/25 bg-white px-4 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-hunter transition-colors hover:bg-hunter hover:text-chartreuse"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>REPLAY BRACKET</span>
              </button>
            )}
          </div>
        </div>

        {/* 4-Step Interactive Progress Strip */}
        <div className="mt-10 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            {
              step: "01",
              label: "SEMIFINAL A",
              done: Boolean(semiAWinner),
              active: !semiAWinner,
            },
            {
              step: "02",
              label: "SEMIFINAL B",
              done: Boolean(semiBWinner),
              active: Boolean(semiAWinner) && !semiBWinner,
            },
            {
              step: "03",
              label: "GRAND FINAL",
              done: Boolean(champion),
              active: bothFinalistsReady && !champion,
            },
            {
              step: "04",
              label: "CHAMPION",
              done: Boolean(champion),
              active: Boolean(champion),
            },
          ].map((stage) => (
            <div
              key={stage.step}
              className={cn(
                "flex items-center justify-between rounded-[2px] border px-3.5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
                stage.done
                  ? "border-hunter bg-hunter text-alabaster"
                  : stage.active
                  ? "border-hunter bg-white text-hunter shadow-sm"
                  : "border-hunter/15 bg-white/60 text-espresso/45"
              )}
            >
              <span className="flex items-center gap-2 font-semibold">
                <span
                  className={cn(
                    "text-[10px]",
                    stage.done ? "text-chartreuse" : "text-hunter/60"
                  )}
                >
                  {stage.step}
                </span>
                <span>{stage.label}</span>
              </span>
              {stage.done ? (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-chartreuse text-hunter">
                  <Check className="h-2.5 w-2.5" />
                </span>
              ) : (
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    stage.active ? "bg-hunter animate-pulse" : "bg-hunter/15"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Live Vote Confirmation Ribbon */}
        <div className="mt-4 min-h-[34px]">
          <AnimatePresence mode="wait">
            {voteNotice && (
              <motion.div
                key={voteNotice}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="inline-flex items-center gap-2 rounded-full bg-hunter px-3.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-chartreuse"
              >
                <Zap className="h-3 w-3" />
                <span>{voteNotice}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ================================================================
            3-STAGE PLAYABLE TOURNAMENT BRACKET
           ================================================================ */}
        {!(semiA1 && semiA2 && semiB1 && semiB2) ? (
          <div className="mt-6 rounded-[4px] border border-hunter/20 bg-white p-10 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-hunter">
              DROP 02 CONTENDERS CALIBRATING
            </p>
            <p className="mt-2 font-sans text-sm text-espresso/70">
              Vote contenders will populate the knockout bracket as soon as 4
              submissions are finalized.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.08fr_56px_0.96fr_52px_1.06fr] lg:gap-0">
            {/* ==================== STAGE 1: SEMIFINALS A & B ==================== */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1 lg:gap-7">
              {/* SEMIFINAL A */}
              <div className="rounded-[4px] border border-hunter/15 bg-white/80 p-4 shadow-[0_6px_20px_rgba(20,54,40,0.04)]">
                <div className="mb-3 flex items-center justify-between border-b border-hunter/10 pb-2.5">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-hunter">
                    SEMIFINAL A · MATCH 01
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em]",
                      semiAWinner
                        ? "bg-hunter text-chartreuse"
                        : "bg-alabaster text-espresso/60"
                    )}
                  >
                    {semiAWinner ? "WINNER LOCKED ✓" : "PICK 1"}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {[semiA1, semiA2].map((contender) => {
                    const isSelected = activeSemiAId === contender._id;
                    const isEliminated =
                      Boolean(activeSemiAId) && activeSemiAId !== contender._id;
                    return (
                      <ContenderBracketCard
                        key={contender._id}
                        candidate={contender}
                        isSelected={isSelected}
                        isEliminated={isEliminated}
                        justVoted={lastVotedId === contender._id}
                        actionLabel={isSelected ? "ADVANCES" : "VOTE"}
                        onSelect={() => handleSelectSemiA(contender)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* SEMIFINAL B */}
              <div className="rounded-[4px] border border-hunter/15 bg-white/80 p-4 shadow-[0_6px_20px_rgba(20,54,40,0.04)]">
                <div className="mb-3 flex items-center justify-between border-b border-hunter/10 pb-2.5">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-hunter">
                    SEMIFINAL B · MATCH 02
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em]",
                      semiBWinner
                        ? "bg-hunter text-chartreuse"
                        : "bg-alabaster text-espresso/60"
                    )}
                  >
                    {semiBWinner ? "WINNER LOCKED ✓" : "PICK 1"}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {[semiB1, semiB2].map((contender) => {
                    const isSelected = activeSemiBId === contender._id;
                    const isEliminated =
                      Boolean(activeSemiBId) && activeSemiBId !== contender._id;
                    return (
                      <ContenderBracketCard
                        key={contender._id}
                        candidate={contender}
                        isSelected={isSelected}
                        isEliminated={isEliminated}
                        justVoted={lastVotedId === contender._id}
                        actionLabel={isSelected ? "ADVANCES" : "VOTE"}
                        onSelect={() => handleSelectSemiB(contender)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ==================== CONNECTOR 1 (DESKTOP SVG) ==================== */}
            <div
              aria-hidden="true"
              className="hidden h-[460px] w-full items-center justify-center lg:flex"
            >
              <svg
                viewBox="0 0 56 460"
                className="h-full w-full overflow-visible"
                fill="none"
              >
                {/* Base tracks */}
                <path
                  d="M 0 112 L 28 112 L 28 192 L 56 192"
                  stroke="#143628"
                  strokeOpacity="0.16"
                  strokeWidth="2"
                />
                <path
                  d="M 0 348 L 28 348 L 28 268 L 56 268"
                  stroke="#143628"
                  strokeOpacity="0.16"
                  strokeWidth="2"
                />

                {/* Animated Semifinal A -> Final Slot A path */}
                <motion.path
                  d="M 0 112 L 28 112 L 28 192 L 56 192"
                  stroke="#143628"
                  strokeWidth="2.75"
                  strokeLinecap="square"
                  initial={false}
                  animate={{ pathLength: semiAWinner ? 1 : 0 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                />
                {semiAWinner && (
                  <motion.circle
                    cx="53"
                    cy="192"
                    r="4.5"
                    fill="#C8F200"
                    stroke="#143628"
                    strokeWidth="1.5"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.35, type: "spring", stiffness: 260 }}
                  />
                )}

                {/* Animated Semifinal B -> Final Slot B path */}
                <motion.path
                  d="M 0 348 L 28 348 L 28 268 L 56 268"
                  stroke="#143628"
                  strokeWidth="2.75"
                  strokeLinecap="square"
                  initial={false}
                  animate={{ pathLength: semiBWinner ? 1 : 0 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                />
                {semiBWinner && (
                  <motion.circle
                    cx="53"
                    cy="268"
                    r="4.5"
                    fill="#C8F200"
                    stroke="#143628"
                    strokeWidth="1.5"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.35, type: "spring", stiffness: 260 }}
                  />
                )}
              </svg>
            </div>

            {/* Mobile Vertical Connector 1 */}
            <div
              aria-hidden="true"
              className="flex items-center justify-center lg:hidden"
            >
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "h-6 w-0.5 transition-colors",
                    semiAWinner || semiBWinner ? "bg-hunter" : "bg-hunter/20"
                  )}
                />
                <span className="rounded-full border border-hunter/25 bg-white px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-hunter">
                  TO GRAND FINAL ↓
                </span>
              </div>
            </div>

            {/* ==================== STAGE 2: GRAND FINAL ==================== */}
            <div className="rounded-[4px] border-2 border-hunter/20 bg-white p-4 shadow-[0_12px_32px_rgba(20,54,40,0.07)]">
              <div className="mb-3.5 flex items-center justify-between border-b border-hunter/15 pb-2.5">
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-hunter">
                  <Flame className="h-3.5 w-3.5 text-hunter" />
                  <span>GRAND FINAL · MATCH 03</span>
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em]",
                    champion
                      ? "bg-hunter text-chartreuse"
                      : bothFinalistsReady
                      ? "bg-chartreuse text-hunter"
                      : "bg-alabaster text-espresso/55"
                  )}
                >
                  {champion
                    ? "DECIDED ✓"
                    : bothFinalistsReady
                    ? "VOTE CHAMPION"
                    : "AWAITING WINNERS"}
                </span>
              </div>

              {/* Finalist A Slot */}
              <div>
                {semiAWinner ? (
                  <ContenderBracketCard
                    candidate={semiAWinner}
                    isSelected={activeChampionId === semiAWinner._id}
                    isEliminated={
                      Boolean(activeChampionId) &&
                      activeChampionId !== semiAWinner._id
                    }
                    justVoted={lastVotedId === semiAWinner._id}
                    disabled={!bothFinalistsReady}
                    actionLabel={
                      activeChampionId === semiAWinner._id
                        ? "CHAMPION"
                        : bothFinalistsReady
                        ? "CROWN"
                        : "WAITING"
                    }
                    onSelect={() => handleSelectChampion(semiAWinner)}
                  />
                ) : (
                  <div className="flex min-h-[104px] flex-col items-center justify-center rounded-[3px] border border-dashed border-hunter/25 bg-alabaster/70 p-4 text-center">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-hunter/60">
                      FINALIST SLOT A
                    </span>
                    <span className="mt-1 font-sans text-xs text-espresso/50">
                      Select a winner in Semifinal A
                    </span>
                  </div>
                )}
              </div>

              {/* Center VS Medallion */}
              <div className="my-3 flex items-center gap-3">
                <span className="h-px flex-1 bg-hunter/15" />
                <span
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-full border font-syne text-[11px] font-extrabold transition-colors",
                    bothFinalistsReady
                      ? "border-hunter bg-hunter text-chartreuse"
                      : "border-hunter/20 bg-alabaster text-espresso/45"
                  )}
                >
                  VS
                </span>
                <span className="h-px flex-1 bg-hunter/15" />
              </div>

              {/* Finalist B Slot */}
              <div>
                {semiBWinner ? (
                  <ContenderBracketCard
                    candidate={semiBWinner}
                    isSelected={activeChampionId === semiBWinner._id}
                    isEliminated={
                      Boolean(activeChampionId) &&
                      activeChampionId !== semiBWinner._id
                    }
                    justVoted={lastVotedId === semiBWinner._id}
                    disabled={!bothFinalistsReady}
                    actionLabel={
                      activeChampionId === semiBWinner._id
                        ? "CHAMPION"
                        : bothFinalistsReady
                        ? "CROWN"
                        : "WAITING"
                    }
                    onSelect={() => handleSelectChampion(semiBWinner)}
                  />
                ) : (
                  <div className="flex min-h-[104px] flex-col items-center justify-center rounded-[3px] border border-dashed border-hunter/25 bg-alabaster/70 p-4 text-center">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-hunter/60">
                      FINALIST SLOT B
                    </span>
                    <span className="mt-1 font-sans text-xs text-espresso/50">
                      Select a winner in Semifinal B
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ==================== CONNECTOR 2 (DESKTOP SVG) ==================== */}
            <div
              aria-hidden="true"
              className="hidden h-[120px] w-full items-center justify-center lg:flex"
            >
              <svg
                viewBox="0 0 52 120"
                className="h-full w-full overflow-visible"
                fill="none"
              >
                <line
                  x1="0"
                  y1="60"
                  x2="48"
                  y2="60"
                  stroke="#143628"
                  strokeOpacity="0.16"
                  strokeWidth="2"
                />
                <motion.line
                  x1="0"
                  y1="60"
                  x2="48"
                  y2="60"
                  stroke="#143628"
                  strokeWidth="3"
                  initial={false}
                  animate={{ pathLength: champion ? 1 : 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                />
                {champion && (
                  <motion.polygon
                    points="42,53 52,60 42,67"
                    fill="#C8F200"
                    stroke="#143628"
                    strokeWidth="1.5"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.25, type: "spring", stiffness: 260 }}
                  />
                )}
              </svg>
            </div>

            {/* Mobile Vertical Connector 2 */}
            <div
              aria-hidden="true"
              className="flex items-center justify-center lg:hidden"
            >
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "h-6 w-0.5 transition-colors",
                    champion ? "bg-hunter" : "bg-hunter/20"
                  )}
                />
                <span className="rounded-full border border-hunter/25 bg-white px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-hunter">
                  CHAMPION TROPHY ↓
                </span>
              </div>
            </div>

            {/* ==================== STAGE 3: DROP 02 CHAMPION TROPHY ==================== */}
            <div className="relative">
              <AnimatePresence mode="wait">
                {champion ? (
                  <motion.div
                    key={`${champion._id}-${burstKey}`}
                    initial={{ opacity: 0, scale: 0.92, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      type: "spring",
                      stiffness: 190,
                      damping: 18,
                    }}
                    className="relative overflow-hidden rounded-[6px] border-2 border-hunter bg-hunter p-1.5 text-alabaster shadow-[0_24px_55px_rgba(20,54,40,0.3)]"
                  >
                    {/* Chartreuse outer architectural inner border */}
                    <div className="relative overflow-hidden rounded-[4px] border border-chartreuse/55 bg-hunter p-5">
                      {/* Confetti / Sparkle Spring Burst */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute left-1/2 top-20 z-20"
                      >
                        {CHAMPION_PARTICLES.map((particle) => (
                          <motion.span
                            key={`${burstKey}-${particle.id}`}
                            initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                            animate={{
                              x: particle.x,
                              y: particle.y,
                              scale: [0, particle.scale, 0.2],
                              opacity: [1, 1, 0],
                              rotate: particle.rotate,
                            }}
                            transition={{
                              duration: 0.95,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            className={cn(
                              "absolute block",
                              particle.shape === "diamond" && "h-2.5 w-2.5 rotate-45",
                              particle.shape === "bar" && "h-1.5 w-4 rounded-full",
                              particle.shape === "dot" && "h-2 w-2 rounded-full",
                              particle.color === "chartreuse" && "bg-chartreuse",
                              particle.color === "alabaster" && "bg-alabaster",
                              particle.color === "hunter" && "bg-hunter"
                            )}
                          />
                        ))}
                      </div>

                      {/* Top Chartreuse Trophy Banner */}
                      <div className="flex items-center justify-between gap-2 rounded-[2px] bg-chartreuse px-3 py-1.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.2em] text-hunter">
                        <span className="inline-flex items-center gap-1.5">
                          <Crown className="h-3.5 w-3.5" />
                          <span>DROP 02 CHAMPION</span>
                        </span>
                        <span>{champion.code}</span>
                      </div>

                      {/* Champion Garment Portrait */}
                      <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-[3px] border border-alabaster/20 bg-espresso">
                        <Image
                          src={champion.imageUrl}
                          alt={champion.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 340px"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-hunter/80 via-transparent to-transparent" />
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                          <span className="rounded-full bg-hunter/90 px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-chartreuse">
                            {champion.tierSuggestion === "one-of-one"
                              ? "1-OF-1 ARCHIVE"
                              : "SMALL BATCH"}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 font-mono text-[10px] font-bold text-hunter">
                            <Sparkles className="h-3 w-3" />
                            <span>{formatVotes(champion.votesCount)} VOTES</span>
                          </span>
                        </div>
                      </div>

                      {/* Champion Typography */}
                      <div className="mt-4 space-y-1.5">
                        <h3 className="font-editorial text-2xl leading-tight text-alabaster sm:text-3xl">
                          {champion.title}
                        </h3>
                        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-chartreuse">
                          {champion.creatorName} · {champion.creatorHandle}
                        </p>
                        <p className="pt-1 font-sans text-xs leading-relaxed text-alabaster/75">
                          {champion.description}
                        </p>
                      </div>

                      {/* Craftsmanship Chips */}
                      {champion.craftsmanship.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {champion.craftsmanship.slice(0, 2).map((note) => (
                            <span
                              key={note}
                              className="rounded-[2px] border border-alabaster/20 bg-white/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-alabaster/90"
                            >
                              {note}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Replay Bracket CTA */}
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={handleReplayBracket}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-[2px] bg-chartreuse px-4 py-2.5 font-mono text-[11px] font-extrabold uppercase tracking-[0.16em] text-hunter transition-colors hover:bg-white"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>REPLAY BRACKET</span>
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="trophy-placeholder"
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 1 }}
                    className="flex min-h-[390px] flex-col justify-between rounded-[6px] border-2 border-dashed border-hunter/25 bg-white/85 p-6 text-espresso"
                  >
                    <div className="flex items-center justify-between border-b border-hunter/15 pb-3">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-hunter">
                        CHAMPION PODIUM
                      </span>
                      <Award className="h-4 w-4 text-hunter/50" />
                    </div>

                    <div className="my-auto py-8 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-hunter/20 bg-alabaster text-hunter">
                        <Trophy className="h-7 w-7" />
                      </div>
                      <h3 className="mt-4 font-editorial text-3xl leading-tight text-espresso">
                        Crown Your{" "}
                        <span className="italic text-hunter">Drop 02</span>{" "}
                        Champion
                      </h3>
                      <p className="mx-auto mt-2 max-w-xs font-sans text-xs leading-relaxed text-espresso/65">
                        Advance winners from Semifinal A and Semifinal B, then
                        cast the deciding Grand Final vote.
                      </p>
                    </div>

                    {/* Mini Step Checklist */}
                    <div className="space-y-2 border-t border-hunter/15 pt-4 font-mono text-[10px] uppercase tracking-[0.15em]">
                      <div className="flex items-center justify-between">
                        <span className="text-espresso/70">SEMIFINAL A</span>
                        <span
                          className={
                            semiAWinner
                              ? "font-bold text-hunter"
                              : "text-espresso/40"
                          }
                        >
                          {semiAWinner ? `${semiAWinner.code} ✓` : "PENDING"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-espresso/70">SEMIFINAL B</span>
                        <span
                          className={
                            semiBWinner
                              ? "font-bold text-hunter"
                              : "text-espresso/40"
                          }
                        >
                          {semiBWinner ? `${semiBWinner.code} ✓` : "PENDING"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-espresso/70">GRAND FINAL</span>
                        <span className="text-espresso/40">
                          {bothFinalistsReady ? "READY TO VOTE" : "LOCKED"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ================================================================
            LIVE VOTE TALLY BAR FOR ALL CANDIDATES
           ================================================================ */}
        <div className="mt-14 rounded-[4px] border border-hunter/15 bg-white p-6 shadow-[0_10px_28px_rgba(20,54,40,0.05)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hunter/15 pb-4">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-hunter">
                LIVE COMMUNITY TALLY · ALL DROP 02 CANDIDATES
              </p>
              <h3 className="mt-1 font-editorial text-2xl text-espresso sm:text-3xl">
                Real-Time <span className="italic text-hunter">Standings</span>
              </h3>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-hunter/20 bg-alabaster px-3.5 py-1.5 font-mono text-[11px] font-semibold text-hunter">
              <span className="h-2 w-2 rounded-full bg-hunter animate-pulse" />
              <span>{formatVotes(totalVotes)} VOTES RECORDED</span>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {sortedTally.map((item, idx) => {
              const share =
                totalVotes > 0
                  ? Math.round((item.votesCount / totalVotes) * 1000) / 10
                  : 0;
              const isUserChampion = activeChampionId === item._id;
              const isLeader = idx === 0;
              const isInBracket = bracketContenders.some(
                (b) => b._id === item._id
              );

              return (
                <div key={item._id} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "flex h-6 w-7 shrink-0 items-center justify-center rounded-[2px] font-mono text-[10px] font-bold",
                          isUserChampion || isLeader
                            ? "bg-hunter text-chartreuse"
                            : "bg-alabaster text-espresso/60"
                        )}
                      >
                        #{String(idx + 1).padStart(2, "0")}
                      </span>

                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-[2px] border border-hunter/15 bg-alabaster">
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-sans text-xs font-semibold uppercase tracking-wide text-espresso sm:text-sm">
                            {item.title}
                          </span>
                          <span className="font-mono text-[10px] text-espresso/50">
                            {item.code}
                          </span>
                          {isUserChampion && (
                            <span className="rounded-full bg-hunter px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-chartreuse">
                              YOUR CHAMPION
                            </span>
                          )}
                          {!isUserChampion && isLeader && (
                            <span className="rounded-full border border-hunter/25 bg-alabaster px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-hunter">
                              LEADING
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[10px] text-espresso/55">
                          {item.creatorHandle} ·{" "}
                          {item.tierSuggestion === "one-of-one"
                            ? "1-OF-1"
                            : "SMALL BATCH"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {!isInBracket && (
                        <button
                          type="button"
                          suppressHydrationWarning
                          onClick={() =>
                            void castCommunityVote(item, "WILDCARD TALLY")
                          }
                          className="rounded-[2px] border border-hunter/25 bg-alabaster px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-hunter transition-colors hover:bg-hunter hover:text-chartreuse"
                        >
                          +1 WILDCARD
                        </button>
                      )}
                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-hunter">
                          {formatVotes(item.votesCount)}
                        </span>
                        <span className="ml-2 text-[11px] text-espresso/50">
                          {share}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="h-2.5 w-full overflow-hidden rounded-[2px] bg-alabaster p-0.5">
                    <motion.div
                      initial={false}
                      animate={{ width: `${Math.max(share, 3)}%` }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        "relative h-full rounded-[1px]",
                        isUserChampion
                          ? "bg-hunter"
                          : isLeader
                          ? "bg-hunter/85"
                          : "bg-hunter/35"
                      )}
                    >
                      {(isUserChampion || isLeader) && (
                        <span className="absolute inset-y-0 right-0 w-2 bg-chartreuse" />
                      )}
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   INTERACTIVE CONTENDER CARD SUBCOMPONENT
   ============================================================================ */
interface ContenderBracketCardProps {
  candidate: VoteCandidate;
  isSelected: boolean;
  isEliminated: boolean;
  justVoted: boolean;
  disabled?: boolean;
  actionLabel: string;
  onSelect: () => void;
}

function ContenderBracketCard({
  candidate,
  isSelected,
  isEliminated,
  justVoted,
  disabled = false,
  actionLabel,
  onSelect,
}: ContenderBracketCardProps) {
  return (
    <motion.button
      type="button"
      suppressHydrationWarning
      disabled={disabled}
      onClick={onSelect}
      whileHover={disabled ? undefined : { y: -1.5 }}
      whileTap={disabled ? undefined : { scale: 0.99 }}
      className={cn(
        "group relative flex w-full items-center gap-3.5 rounded-[3px] border p-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-hunter",
        isSelected
          ? "border-hunter bg-hunter text-alabaster shadow-[0_12px_26px_rgba(20,54,40,0.24)]"
          : "border-hunter/15 bg-white text-espresso hover:border-hunter hover:shadow-sm",
        isEliminated && "opacity-60 hover:opacity-95",
        disabled && "cursor-not-allowed opacity-75"
      )}
    >
      {/* Garment Thumbnail */}
      <div
        className={cn(
          "relative h-16 w-16 shrink-0 overflow-hidden rounded-[2px] border",
          isSelected ? "border-chartreuse/60" : "border-hunter/15"
        )}
      >
        <Image
          src={candidate.imageUrl}
          alt={candidate.title}
          fill
          sizes="64px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Text Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "font-mono text-[9px] font-semibold uppercase tracking-[0.16em]",
              isSelected ? "text-chartreuse" : "text-hunter/70"
            )}
          >
            {candidate.code} ·{" "}
            {candidate.tierSuggestion === "one-of-one" ? "1-OF-1" : "BATCH"}
          </span>

          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em]",
              isSelected
                ? "bg-chartreuse text-hunter"
                : "bg-alabaster text-hunter group-hover:bg-hunter group-hover:text-chartreuse"
            )}
          >
            <span>{actionLabel}</span>
            <ArrowRight className="h-2.5 w-2.5" />
          </span>
        </div>

        <h4
          className={cn(
            "mt-1 line-clamp-1 font-sans text-xs font-bold uppercase tracking-tight sm:text-[13px]",
            isSelected ? "text-alabaster" : "text-espresso"
          )}
        >
          {candidate.title}
        </h4>

        <div className="mt-1 flex items-center justify-between gap-2 font-mono text-[10px]">
          <span
            className={cn(
              "truncate",
              isSelected ? "text-alabaster/75" : "text-espresso/55"
            )}
          >
            {candidate.creatorHandle}
          </span>
          <span
            className={cn(
              "shrink-0 font-semibold",
              isSelected ? "text-chartreuse" : "text-hunter"
            )}
          >
            {formatVotes(candidate.votesCount)} VOTES
          </span>
        </div>
      </div>

      {/* Subtle +1 flash dot when just voted */}
      {justVoted && isSelected && (
        <motion.span
          key={candidate.votesCount}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="pointer-events-none absolute -right-1.5 -top-1.5 rounded-full bg-chartreuse px-1.5 py-0.5 font-mono text-[9px] font-extrabold text-hunter shadow-sm"
        >
          +1
        </motion.span>
      )}
    </motion.button>
  );
}
