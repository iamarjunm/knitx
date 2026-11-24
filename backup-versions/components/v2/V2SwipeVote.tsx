"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { Check, RotateCcw, Sparkles, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { VoteCandidate } from "@/lib/types";
import { cn } from "@/lib/utils";

interface V2SwipeVoteProps {
  initialCandidates: VoteCandidate[];
}

const VOTED_STORAGE_KEY = "knitx_v2_voted_ids";
const SWIPE_THRESHOLD = 110;

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
    rotate: dirRef.current === "right" ? 18 : -18,
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
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const produceOpacity = useTransform(x, [24, 115], [0, 1]);
  const produceScale = useTransform(x, [24, 115], [0.82, 1]);
  const passOpacity = useTransform(x, [-115, -24], [1, 0]);
  const passScale = useTransform(x, [-115, -24], [1, 0.82]);

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
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
        scale: Math.max(0.86, 1 - stackIndex * 0.05),
        y: stackIndex * 16,
        opacity: stackIndex === 0 ? 1 : Math.max(0.45, 1 - stackIndex * 0.25),
      }}
      animate={{
        scale: Math.max(0.86, 1 - stackIndex * 0.05),
        y: stackIndex * 16,
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
        "absolute inset-0 flex flex-col overflow-hidden rounded-[28px] border border-ink/10 bg-white shadow-[0_28px_70px_-32px_rgba(14,14,14,0.2)] select-none",
        isTop ? "cursor-grab touch-pan-y" : "pointer-events-none"
      )}
    >
      {/* Top Photograph Frame */}
      <div className="relative h-[56%] w-full overflow-hidden bg-linen sm:h-[58%]">
        <Image
          src={candidate.imageUrl}
          alt={candidate.title}
          fill
          sizes="(max-width: 1024px) 100vw, 560px"
          className="pointer-events-none object-cover object-center"
          priority={isTop}
        />

        {/* Delicate top gallery gradient for badge legibility */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/35 to-transparent" />

        {/* Serial + Tier badges */}
        <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
          <span className="rounded-full border border-white/25 bg-white/88 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink backdrop-blur-md">
            {candidate.code}
          </span>
          <span
            className={cn(
              "rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md",
              candidate.tierSuggestion === "one-of-one"
                ? "bg-archive-red/92"
                : "bg-klein/92"
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
            className="pointer-events-none absolute left-5 top-16 -rotate-8 rounded-2xl border-2 border-klein bg-white/95 px-4 py-2 shadow-xl backdrop-blur-sm"
          >
            <span className="font-mono text-sm font-extrabold uppercase tracking-[0.2em] text-klein">
              PRODUCE ✓
            </span>
          </motion.div>
        )}

        {/* Live Drag Stamp: PASS ✕ (Left) */}
        {isTop && (
          <motion.div
            style={{ opacity: passOpacity, scale: passScale }}
            className="pointer-events-none absolute right-5 top-16 rotate-8 rounded-2xl border-2 border-archive-red bg-white/95 px-4 py-2 shadow-xl backdrop-blur-sm"
          >
            <span className="font-mono text-sm font-extrabold uppercase tracking-[0.2em] text-archive-red">
              PASS ✕
            </span>
          </motion.div>
        )}

        {/* Already voted indicator */}
        {alreadyVoted && (
          <div className="absolute bottom-3.5 left-4 rounded-full bg-klein px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-md">
            VOTE RECORDED ✓
          </div>
        )}
      </div>

      {/* Bottom Exhibition Card Spec Sheet */}
      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              BY {candidate.creatorName.toUpperCase()} · {candidate.creatorHandle}
            </span>
            <span className="font-mono text-[11px] font-semibold tabular-nums text-klein">
              {candidate.votesCount.toLocaleString("en-IN")} VOTES
            </span>
          </div>

          <h3 className="mt-1.5 font-syne text-xl font-bold leading-snug tracking-tight text-ink sm:text-2xl">
            {candidate.title}
          </h3>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted sm:text-[13px]">
            {candidate.description}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-ink/8 pt-3">
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

export default function V2SwipeVote({ initialCandidates }: V2SwipeVoteProps) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [candidates, setCandidates] = useState<VoteCandidate[]>(initialCandidates);
  const [deckIds, setDeckIds] = useState<string[]>(() =>
    initialCandidates.map((c) => c._id)
  );
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [passedCount, setPassedCount] = useState(0);
  const exitDirRef = useRef<"left" | "right">("right");
  const [lastActionBanner, setLastActionBanner] = useState<string | null>(null);

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
              uid: user?.uid,
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
    [candidateById, deckIds, persistVotedIds, user?.uid, votedIds]
  );

  function handleResetStack() {
    setDeckIds(candidates.map((c) => c._id));
    setPassedCount(0);
    setLastActionBanner("Stack reset — swipe to refine your Drop 02 curation.");
  }

  const reviewedCount = candidates.length - deckIds.length;
  const activeVotedIds = mounted ? votedIds : [];

  return (
    <section
      id="swipe-vote"
      className="relative bg-porcelain py-24 text-ink"
    >
      <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
        {/* Section Header */}
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2.5 rounded-full border border-ink/10 bg-white px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-klein" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
                ROOM 04 · DROP 02 COMMUNITY JURY
              </span>
            </div>
            <h2 className="font-syne text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-[3.4rem] lg:leading-[1.02]">
              Swipe to{" "}
              <span className="font-editorial font-normal italic text-klein">
                produce.
              </span>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-[15px]">
              Drag right to vote a piece into Drop 02. Top 4 get cut.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-ink/10 bg-white px-4 py-2.5 text-right">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted">
                LIVE TALLIES
              </p>
              <p className="font-mono text-sm font-bold tabular-nums text-ink">
                {totalVotes.toLocaleString("en-IN")} VOTES CAST
              </p>
            </div>
          </div>
        </div>

        {/* 12-Col Interactive Arena */}
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          {/* LEFT (7 COLS): Real Tinder-Style Draggable Card Stack */}
          <div className="flex flex-col items-center lg:col-span-7">
            <div className="relative h-[500px] w-full max-w-[520px] sm:h-[550px]">
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
                          alreadyVoted={activeVotedIds.includes(candidate._id)}
                          exitDirRef={exitDirRef}
                          onCommitSwipe={commitSwipe}
                        />
                      );
                    })
                ) : (
                  <motion.div
                    key="stack-complete"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
                    className="flex h-full flex-col items-center justify-center rounded-[28px] border border-ink/10 bg-white p-8 text-center shadow-[0_24px_60px_-32px_rgba(14,14,14,0.12)]"
                  >
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-klein/10 text-klein">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-klein">
                      CURATION COMPLETE
                    </p>
                    <h3 className="mt-2 font-syne text-2xl font-bold tracking-tight text-ink">
                      All {candidates.length} Drop 02 silhouettes reviewed.
                    </h3>
                    <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-muted">
                      You greenlit{" "}
                      <span className="font-semibold text-ink">
                        {activeVotedIds.length}
                      </span>{" "}
                      silhouette{activeVotedIds.length === 1 ? "" : "s"} and
                      passed on{" "}
                      <span className="font-semibold text-ink">
                        {passedCount}
                      </span>
                      . Watch the live Top 4 board on the right.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetStack}
                      className="mt-7 inline-flex items-center gap-2 rounded-full bg-klein px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_12px_28px_-10px_rgba(0,43,255,0.45)] transition-transform hover:-translate-y-0.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      RESET STACK
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tactile Action Controls Below Stack */}
            <div className="mt-9 flex w-full max-w-[520px] items-center justify-between gap-4 px-2">
              <button
                type="button"
                onClick={() => commitSwipe("left")}
                disabled={visibleDeck.length === 0}
                aria-label="Pass silhouette"
                className="group flex h-14 items-center gap-2.5 rounded-full border border-ink/15 bg-white px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink shadow-sm transition-all hover:border-archive-red hover:text-archive-red disabled:cursor-not-allowed disabled:opacity-35"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-linen transition-colors group-hover:bg-archive-red/10">
                  <X className="h-4 w-4" />
                </span>
                <span>PASS</span>
              </button>

              <div className="flex flex-col items-center">
                <span className="font-mono text-xs font-bold tabular-nums text-ink">
                  {Math.min(reviewedCount + 1, candidates.length)
                    .toString()
                    .padStart(2, "0")}{" "}
                  · {candidates.length.toString().padStart(2, "0")}
                </span>
                <span className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted">
                  {visibleDeck.length > 0 ? "DRAG OR TAP" : "FINISHED"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => commitSwipe("right")}
                disabled={visibleDeck.length === 0}
                aria-label="Vote to produce silhouette"
                className="group flex h-14 items-center gap-2.5 rounded-full bg-klein px-6 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_14px_30px_-10px_rgba(0,43,255,0.5)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <span>PRODUCE</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                  <Check className="h-4 w-4" />
                </span>
              </button>
            </div>

            {lastActionBanner && (
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                {lastActionBanner}
              </p>
            )}
          </div>

          {/* RIGHT (5 COLS): Live Real-Time Top 4 Production Leaderboard */}
          <div className="lg:col-span-5">
            <div className="rounded-[28px] border border-ink/10 bg-white p-6 shadow-[0_24px_60px_-32px_rgba(14,14,14,0.1)] sm:p-7">
              <div className="mb-5 flex items-center justify-between border-b border-ink/8 pb-4">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-klein">
                    LIVE PRODUCTION BOARD
                  </p>
                  <h3 className="mt-1 font-syne text-xl font-bold tracking-tight text-ink">
                    Drop 02{" "}
                    <span className="font-editorial font-normal italic">
                      cut-off ranking.
                    </span>
                  </h3>
                </div>
                {deckIds.length < candidates.length && (
                  <button
                    type="button"
                    onClick={handleResetStack}
                    className="inline-flex items-center gap-1 rounded-full border border-ink/12 bg-porcelain px-3 py-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted transition-colors hover:border-klein hover:text-klein"
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
                  const sharePct =
                    totalVotes > 0
                      ? Math.round((item.votesCount / totalVotes) * 100)
                      : 0;
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
                            ? "border-ink/10 bg-porcelain/75"
                            : "border-ink/8 bg-white opacity-75"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold tabular-nums",
                              inTopFour
                                ? "bg-klein text-white"
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
                              <p className="truncate font-syne text-xs font-bold tracking-tight text-ink sm:text-[13px]">
                                {item.title}
                              </p>
                              <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-ink">
                                {item.votesCount.toLocaleString("en-IN")}
                              </span>
                            </div>

                            <div className="mt-0.5 flex items-center justify-between gap-2">
                              <span className="truncate font-mono text-[10px] text-muted">
                                {item.creatorHandle}
                                {userVoted ? " · YOUR VOTE ✓" : ""}
                              </span>
                              <span className="font-mono text-[10px] tabular-nums text-muted">
                                {sharePct}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Live animated vote-share bar */}
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
                              inTopFour ? "bg-klein" : "bg-ink/25"
                            )}
                          />
                        </div>
                      </motion.div>

                      {/* Thin Klein-Blue TOP 4 CUT-OFF divider line */}
                      {rank === 4 && (
                        <div className="relative flex items-center py-2">
                          <div className="h-px flex-1 border-t border-dashed border-klein/65" />
                          <span className="mx-3 rounded-full border border-klein/25 bg-klein/[0.06] px-3 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.2em] text-klein">
                            TOP 4 CUT-OFF · ENTERS PRODUCTION
                          </span>
                          <div className="h-px flex-1 border-t border-dashed border-klein/65" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
