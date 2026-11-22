"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { VoteCandidate } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface V4StickerVoteProps {
  initialCandidates: VoteCandidate[];
}

type StickerStyleId = "make-this" | "drop-02" | "grail";

interface StickerPreset {
  id: StickerStyleId;
  label: string;
  shortLabel: string;
  className: string;
  tilt: number;
}

interface PlacedSticker {
  id: string;
  styleId: StickerStyleId;
  xPercent: number;
  yPercent: number;
  angle: number;
}

const STICKER_PRESETS: readonly StickerPreset[] = [
  {
    id: "make-this",
    label: "★ MAKE THIS",
    shortLabel: "★ MAKE THIS",
    className: "bg-riso text-white border-ink",
    tilt: -4,
  },
  {
    id: "drop-02",
    label: "⚡ DROP 02",
    shortLabel: "⚡ DROP 02",
    className: "bg-ochre text-ink border-ink",
    tilt: 3,
  },
  {
    id: "grail",
    label: "✦ 1/1 GRAIL",
    shortLabel: "✦ 1/1 GRAIL",
    className: "bg-ink text-white border-ink",
    tilt: -2,
  },
] as const;

const STICKER_STORAGE_KEY = "knitx_v4_slapped_stickers_v1";

function getStickerPreset(id: StickerStyleId): StickerPreset {
  return STICKER_PRESETS.find((s) => s.id === id) ?? STICKER_PRESETS[0];
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export default function V4StickerVote({
  initialCandidates,
}: V4StickerVoteProps) {
  const { user } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [candidates, setCandidates] =
    useState<VoteCandidate[]>(initialCandidates);
  const [selectedStickerId, setSelectedStickerId] =
    useState<StickerStyleId>("make-this");
  const [stickersByCard, setStickersByCard] = useState<
    Record<string, PlacedSticker[]>
  >({});
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({});
  const [statusFlash, setStatusFlash] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = window.localStorage.getItem(STICKER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, PlacedSticker[]>;
        if (parsed && typeof parsed === "object") {
          setStickersByCard(parsed);
        }
      }
    } catch {
      // Ignore malformed local storage
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(
        STICKER_STORAGE_KEY,
        JSON.stringify(stickersByCard)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [mounted, stickersByCard]);

  const activeSticker = useMemo(
    () => getStickerPreset(selectedStickerId),
    [selectedStickerId]
  );

  // Compute live rank (#01 - #06) while keeping cards stationary so slapping never jumps under cursor
  const rankMap = useMemo(() => {
    const sorted = [...candidates].sort((a, b) => b.votesCount - a.votesCount);
    const map: Record<string, number> = {};
    sorted.forEach((item, idx) => {
      map[item._id] = idx + 1;
    });
    return map;
  }, [candidates]);

  const rankedLeaderboard = useMemo(
    () => [...candidates].sort((a, b) => b.votesCount - a.votesCount),
    [candidates]
  );

  const totalVotes = useMemo(
    () => candidates.reduce((acc, c) => acc + c.votesCount, 0),
    [candidates]
  );

  const userSlapCount = useMemo(() => {
    if (!mounted) return 0;
    return Object.values(stickersByCard).reduce(
      (sum, list) => sum + list.length,
      0
    );
  }, [mounted, stickersByCard]);

  const slapStickerOnCard = async (
    candidate: VoteCandidate,
    xPercent: number,
    yPercent: number
  ) => {
    const safeX = clamp(Math.round(xPercent), 16, 84);
    const safeY = clamp(Math.round(yPercent), 18, 82);
    const existingCount = (stickersByCard[candidate._id] || []).length;
    const angleCycle = [-12, 9, -6, 13, -9, 6];
    const angle = angleCycle[existingCount % angleCycle.length];

    const newSticker: PlacedSticker = {
      id: `${candidate._id}-${Date.now()}-${existingCount}`,
      styleId: selectedStickerId,
      xPercent: safeX,
      yPercent: safeY,
      angle,
    };

    // Optimistically slap the sticker & increment vote count immediately
    setStickersByCard((prev) => ({
      ...prev,
      [candidate._id]: [...(prev[candidate._id] || []).slice(-7), newSticker],
    }));

    setCandidates((prev) =>
      prev.map((item) =>
        item._id === candidate._id
          ? { ...item, votesCount: item.votesCount + 1, hasVoted: true }
          : item
      )
    );

    setStatusFlash(
      `SLAPPED "${activeSticker.shortLabel}" ON ${candidate.title.toUpperCase()} (+1 VOTE)`
    );

    setPendingIds((prev) => ({ ...prev, [candidate._id]: true }));
    try {
      await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: candidate._id,
          uid: mounted ? user?.uid : undefined,
        }),
      });
    } catch {
      // Optimistic count remains intact in preview mode
    } finally {
      setPendingIds((prev) => ({ ...prev, [candidate._id]: false }));
    }
  };

  const handleSurfaceClick = (
    e: React.MouseEvent<HTMLDivElement>,
    candidate: VoteCandidate
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    void slapStickerOnCard(candidate, xPct, yPct);
  };

  const handleQuickVoteButton = (candidate: VoteCandidate) => {
    const count = (stickersByCard[candidate._id] || []).length;
    const offsets: Array<[number, number]> = [
      [50, 48],
      [34, 34],
      [68, 62],
      [64, 32],
      [36, 66],
    ];
    const [x, y] = offsets[count % offsets.length];
    void slapStickerOnCard(candidate, x, y);
  };

  return (
    <section
      id="sticker-poll"
      className="relative overflow-hidden border-b-2 border-ink bg-manila/55 py-20 text-ink"
    >
      <div className="mx-auto max-w-[1320px] px-4 sm:px-8">
        {/* Zine Folio Strip */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2.5">
            <span className="bg-ochre px-2 py-0.5 text-ink">PAGE 04</span>
            <span>DROP 02 CORKBOARD · PIN-UP SHEET</span>
          </div>
          <span className="text-muted">
            {totalVotes.toLocaleString("en-IN")} LIVE VOTES · TOP 4 ENTER
            PRODUCTION
          </span>
        </div>

        {/* Section Header */}
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <h2 className="font-poster text-5xl uppercase leading-[0.92] tracking-[0.01em] text-ink sm:text-6xl lg:text-7xl">
              SLAP A STICKER ON{" "}
              <span className="inline-block bg-riso px-2.5 text-white">
                DROP 02.
              </span>
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/80 sm:text-lg">
              Pick a sticker stamp below and click anywhere on a garment to cast
              your vote. Top 4 get made.
            </p>
          </div>

          {/* Live Tally Counter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="border-2 border-ink bg-white px-4 py-2.5 stamp-shadow-sm">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-muted">
                YOUR SLAPS
              </p>
              <p className="mt-0.5 font-poster text-2xl leading-none text-riso">
                {String(userSlapCount).padStart(2, "0")} STICKERS
              </p>
            </div>
            <div className="border-2 border-ink bg-ink px-4 py-2.5 text-white stamp-shadow-sm">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ochre">
                PRODUCTION CUTLINE
              </p>
              <p className="mt-0.5 font-poster text-2xl leading-none text-white">
                TOP 04 WIN
              </p>
            </div>
          </div>
        </div>

        {/* STICKER PALETTE SELECTOR BAR */}
        <div className="mt-9 border-2 border-ink bg-newsprint p-4 stamp-shadow sm:p-5">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center border-2 border-ink bg-ochre text-ink">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink">
                  ARMED DIE-CUT STICKER SHEET
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                  SELECT A STAMP · THEN CLICK ANY DESIGN PHOTO BELOW
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {STICKER_PRESETS.map((preset) => {
                const isSelected = preset.id === selectedStickerId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setSelectedStickerId(preset.id)}
                    style={{
                      transform: isSelected
                        ? `rotate(${preset.tilt}deg) translateY(-3px) scale(1.04)`
                        : `rotate(${preset.tilt}deg)`,
                    }}
                    className={cn(
                      "relative inline-flex items-center gap-2 border-2 px-4 py-2.5 font-mono text-xs font-extrabold uppercase tracking-[0.16em] transition-all",
                      preset.className,
                      isSelected
                        ? "ring-2 ring-ink ring-offset-2 ring-offset-newsprint stamp-shadow"
                        : "opacity-80 hover:opacity-100"
                    )}
                  >
                    <span>{preset.label}</span>
                    {isSelected && (
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-ink">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Feedback Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-ink/40 pt-3 font-mono text-[10px] uppercase tracking-[0.16em]">
            <span className="font-bold text-riso">
              {statusFlash ||
                `READY: CLICK ANY GARMENT TO SLAP "${activeSticker.label}"`}
            </span>
            <span className="text-muted">
              LIVE RANKS UPDATE AUTOMATICALLY ON EVERY SLAP
            </span>
          </div>
        </div>

        {/* Compact Live Cutline Ranking Strip */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {rankedLeaderboard.map((entry, idx) => {
            const isTop4 = idx < 4;
            return (
              <div
                key={`rank-pill-${entry._id}`}
                className={cn(
                  "inline-flex items-center gap-2 border border-ink px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em]",
                  isTop4
                    ? "bg-white text-ink"
                    : "border-dashed bg-newsprint/80 text-muted"
                )}
              >
                <span
                  className={cn(
                    "px-1.5 py-0.5 text-[9px]",
                    isTop4 ? "bg-ochre text-ink" : "bg-manila text-muted"
                  )}
                >
                  #{String(idx + 1).padStart(2, "0")}
                </span>
                <span className="max-w-[130px] truncate">{entry.title}</span>
                <span className="text-riso">{entry.votesCount}</span>
              </div>
            );
          })}
        </div>

        {/* CORKBOARD PIN-UP DESIGN GRID */}
        <div className="mt-8 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate, idx) => {
            const rank = rankMap[candidate._id] ?? idx + 1;
            const isTop4 = rank <= 4;
            const slapped = mounted ? stickersByCard[candidate._id] || [] : [];
            const voteShare =
              totalVotes > 0
                ? Math.round((candidate.votesCount / totalVotes) * 100)
                : 0;
            const isPending = Boolean(pendingIds[candidate._id]);

            return (
              <article
                key={candidate._id}
                className={cn(
                  "group relative flex flex-col border-2 border-ink bg-white stamp-shadow transition-transform duration-200 hover:-translate-y-1",
                  isTop4 ? "ring-0" : "opacity-95"
                )}
              >
                {/* Physical Masking Tape Pin at Top Center */}
                <div
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute -top-3 left-1/2 z-20 h-6 w-20 -translate-x-1/2 border border-ink/40",
                    idx % 2 === 0
                      ? "-rotate-2 bg-ochre/80"
                      : "rotate-2 bg-newsprint/95"
                  )}
                />

                {/* Top Pin-Up Rank Strip */}
                <div className="flex items-center justify-between gap-2 border-b-2 border-ink bg-newsprint px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 border border-ink px-2 py-0.5 font-mono text-[10.5px] font-extrabold uppercase tracking-[0.14em]",
                        rank === 1
                          ? "bg-riso text-white"
                          : isTop4
                            ? "bg-ochre text-ink"
                            : "bg-manila text-muted"
                      )}
                    >
                      {rank === 1 && <Trophy className="h-3 w-3" />}#
                      {String(rank).padStart(2, "0")}
                    </span>

                    {isTop4 ? (
                      <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-riso">
                        TOP 4 IN PRODUCTION
                      </span>
                    ) : (
                      <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted">
                        ON THE BUBBLE
                      </span>
                    )}
                  </div>

                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                    {candidate.code}
                  </span>
                </div>

                {/* CLICKABLE STICKER-SLAP PHOTO STAGE */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleSurfaceClick(e, candidate)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleQuickVoteButton(candidate);
                    }
                  }}
                  aria-label={`Slap ${activeSticker.label} sticker on ${candidate.title}`}
                  className="relative aspect-[4/4.35] w-full cursor-crosshair select-none overflow-hidden border-b-2 border-ink bg-manila/40 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-riso"
                >
                  <Image
                    src={candidate.imageUrl}
                    alt={candidate.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />

                  {/* Subtle Halftone / Zine Corner Registration Marks */}
                  <div className="pointer-events-none absolute inset-2.5 border border-white/40" />

                  {/* Hover Prompt Pill */}
                  <div className="pointer-events-none absolute bottom-3 left-3 z-10 border border-ink bg-white/95 px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-ink shadow-[2px_2px_0px_#0A0A0A] transition-opacity group-hover:bg-ochre">
                    CLICK ANYWHERE TO SLAP {activeSticker.shortLabel}
                  </div>

                  {/* Tier Tag Top-Right */}
                  <div className="pointer-events-none absolute right-3 top-3 z-10 border border-ink bg-newsprint/95 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-ink">
                    {candidate.tierSuggestion === "one-of-one"
                      ? "1-OF-1 GRAIL"
                      : "SMALL-BATCH"}
                  </div>

                  {/* SLAPPED PHYSICAL STICKERS LAYER */}
                  <AnimatePresence>
                    {slapped.map((sticker) => {
                      const preset = getStickerPreset(sticker.styleId);
                      return (
                        <motion.div
                          key={sticker.id}
                          initial={{
                            scale: 2.15,
                            rotate: sticker.angle - 18,
                            opacity: 0,
                          }}
                          animate={{
                            scale: 1,
                            rotate: sticker.angle,
                            opacity: 1,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 430,
                            damping: 19,
                            mass: 0.75,
                          }}
                          style={{
                            left: `${sticker.xPercent}%`,
                            top: `${sticker.yPercent}%`,
                          }}
                          className={cn(
                            "pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap border-2 px-2.5 py-1 font-mono text-[10.5px] font-extrabold uppercase tracking-[0.14em] shadow-[3px_3px_0px_#0A0A0A]",
                            preset.className
                          )}
                        >
                          {preset.shortLabel}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Card Copy & Vote Bar */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-poster text-2xl uppercase leading-[1.02] text-ink">
                        {candidate.title}
                      </h3>
                      <span className="shrink-0 font-mono text-sm font-extrabold text-riso">
                        {candidate.votesCount.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <p className="mt-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">
                      BY {candidate.creatorName} · {candidate.creatorHandle}
                    </p>

                    <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-ink/80">
                      {candidate.description}
                    </p>

                    {/* Craft Chips */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {candidate.craftsmanship.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="border border-ink/35 bg-newsprint px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-ink"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Vote Bar + Accessible Quick-Slap Button */}
                  <div className="mt-4 border-t border-dashed border-ink/40 pt-3.5">
                    <div className="mb-2 flex items-center justify-between font-mono text-[9.5px] font-bold uppercase tracking-[0.16em]">
                      <span className="text-muted">SHARE OF POLL</span>
                      <span className="text-ink">{voteShare}%</span>
                    </div>
                    <div className="mb-3.5 h-2 w-full overflow-hidden border border-ink bg-newsprint">
                      <div
                        className={cn(
                          "h-full transition-all duration-300",
                          isTop4 ? "bg-riso" : "bg-ink/45"
                        )}
                        style={{ width: `${Math.max(4, voteShare)}%` }}
                      />
                    </div>

                    <button
                      type="button"
                      suppressHydrationWarning
                      disabled={isPending}
                      onClick={() => handleQuickVoteButton(candidate)}
                      className={cn(
                        "flex w-full items-center justify-between border-2 border-ink px-3.5 py-2.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors active:translate-y-[1px]",
                        slapped.length > 0
                          ? "bg-ochre text-ink hover:bg-riso hover:text-white"
                          : "bg-ink text-white hover:bg-riso"
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {selectedStickerId === "make-this" ? (
                          <Star className="h-3.5 w-3.5" />
                        ) : (
                          <Zap className="h-3.5 w-3.5" />
                        )}
                        {slapped.length > 0
                          ? `SLAPPED ×${slapped.length} · SLAP AGAIN`
                          : `SLAP ${activeSticker.shortLabel}`}
                      </span>
                      <span>+1</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
