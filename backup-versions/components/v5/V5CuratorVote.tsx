"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Check, Plus, RotateCcw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { VoteCandidate } from "@/lib/types";
import { cn } from "@/lib/utils";

interface V5CuratorVoteProps {
  initialCandidates: VoteCandidate[];
}

const TOTAL_TOKENS = 5;
const STORAGE_KEY = "knitx_v5_curator_tokens_v1";

type TokenAllocationMap = Record<string, number>;

export default function V5CuratorVote({
  initialCandidates,
}: V5CuratorVoteProps) {
  const { user } = useAuth();

  const [mounted, setMounted] = useState<boolean>(false);
  const [candidates, setCandidates] =
    useState<VoteCandidate[]>(initialCandidates);
  const [allocations, setAllocations] = useState<TokenAllocationMap>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
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

  async function handleAllocateToken(candidate: VoteCandidate) {
    if (tokensRemaining <= 0 || submittingId) return;

    setSubmittingId(candidate._id);
    setStatusNote(null);

    const nextAllocations: TokenAllocationMap = {
      ...allocations,
      [candidate._id]: (allocations[candidate._id] || 0) + 1,
    };

    // Optimistic update for responsive curatorial tactile feel
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
          STORAGE_KEY,
          JSON.stringify(nextAllocations)
        );
      } catch {
        // Storage quota ignored
      }
    }

    try {
      await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: candidate._id,
          uid: user?.uid || "v5_gallery_curator",
        }),
      });
      setStatusNote(
        `1 curator token placed on “${candidate.title}” · ${Math.max(
          0,
          tokensRemaining - 1
        )} remaining.`
      );
    } catch {
      setStatusNote(
        `Token recorded locally on “${candidate.title}”.`
      );
    } finally {
      setSubmittingId(null);
    }
  }

  function handleResetTokens() {
    if (spentTokens === 0) return;

    setCandidates((prev) =>
      prev.map((item) => ({
        ...item,
        votesCount: Math.max(0, item.votesCount - (allocations[item._id] || 0)),
      }))
    );
    setAllocations({});
    setStatusNote("All 5 curator tokens returned to your tray.");

    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
    }
  }

  return (
    <section
      id="curator-vote"
      className="relative border-t border-champagne bg-travertine/60 py-28"
    >
      <div className="mx-auto max-w-[1340px] px-6 sm:px-10 lg:px-12">
        {/* Editorial Header */}
        <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-muted">
              DROP 02 ACQUISITION BALLOT · 6 ARCHIVE CONCEPTS
            </p>
            <h2 className="mt-4 font-editorial text-5xl leading-[0.98] tracking-[-0.015em] text-umber sm:text-6xl lg:text-[4.25rem]">
              Community <span className="italic text-terracotta">Curation.</span>
            </h2>
            <p className="mt-5 max-w-xl font-sans text-sm leading-relaxed text-muted sm:text-[15px]">
              Every guest receives 5 curator tokens. Place them on the
              silhouettes you want produced for Drop 02. The top 4 concepts
              enter single-sample studio production.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 lg:col-span-5 lg:items-end">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              LIVE COMMUNITY BALLOTS
            </span>
            <p className="font-editorial text-4xl leading-none text-umber">
              {totalCommunityVotes.toLocaleString("en-IN")}{" "}
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                Votes Cast
              </span>
            </p>
          </div>
        </div>

        {/* Sticky Curator Token Tray */}
        <div className="sticky top-20 z-20 mt-10 rounded-sm border border-champagne bg-plaster/95 px-5 py-4 shadow-[0_14px_34px_rgba(28,25,23,0.06)] backdrop-blur-md sm:px-7">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            {/* Left Label */}
            <div>
              <p className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-muted">
                CURATOR TOKEN TRAY
              </p>
              <p className="mt-1 font-sans text-sm font-medium text-umber">
                {tokensRemaining} of {TOTAL_TOKENS} Tokens Available
              </p>
            </div>

            {/* Center 5 Physical Terracotta Token Discs */}
            <div
              className="flex items-center gap-2.5 sm:gap-3"
              aria-label={`${tokensRemaining} of ${TOTAL_TOKENS} curator tokens remaining`}
            >
              {Array.from({ length: TOTAL_TOKENS }).map((_, index) => {
                const isAvailable = index < tokensRemaining;
                return (
                  <motion.div
                    key={index}
                    initial={false}
                    animate={{
                      scale: isAvailable ? 1 : 0.88,
                      opacity: isAvailable ? 1 : 0.36,
                    }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border transition-colors sm:h-10 sm:w-10",
                      isAvailable
                        ? "border-terracotta bg-terracotta text-plaster shadow-[0_4px_12px_rgba(168,75,47,0.28),inset_0_1px_2px_rgba(255,255,255,0.3)]"
                        : "border-champagne bg-travertine text-muted/50"
                    )}
                  >
                    <span className="font-editorial text-xs tracking-[0.04em]">
                      KX
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Right Reset Control */}
            <div className="flex items-center gap-3 self-end md:self-auto">
              <button
                type="button"
                suppressHydrationWarning
                disabled={!mounted || spentTokens === 0}
                onClick={handleResetTokens}
                className="inline-flex items-center gap-1.5 rounded-sm border border-champagne bg-travertine/60 px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-umber transition-colors hover:border-umber hover:bg-plaster disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Tokens</span>
              </button>
            </div>
          </div>

          {statusNote && (
            <p className="mt-3 border-t border-champagne/70 pt-2.5 font-mono text-[10.5px] tracking-[0.04em] text-terracotta">
              {statusNote}
            </p>
          )}
        </div>

        {/* 3-Column Museum Gallery Grid */}
        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate) => {
            const placedCount = mounted ? allocations[candidate._id] || 0 : 0;
            const isTopFour = topFourIds.has(candidate._id);
            const sharePercent =
              totalCommunityVotes > 0
                ? Math.round((candidate.votesCount / totalCommunityVotes) * 100)
                : 0;
            const isBusy = submittingId === candidate._id;

            return (
              <article
                key={candidate._id}
                className="group flex flex-col overflow-hidden rounded-sm border border-champagne bg-plaster transition-shadow duration-500 hover:shadow-[0_20px_50px_rgba(28,25,23,0.07)]"
              >
                {/* Tall Portrait Museum Frame */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-travertine">
                  <Image
                    src={candidate.imageUrl}
                    alt={candidate.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                  />

                  {/* Top Overlay Plates */}
                  <div className="pointer-events-none absolute inset-x-3.5 top-3.5 flex items-start justify-between gap-2">
                    <span className="rounded-sm border border-champagne/90 bg-plaster/95 px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.2em] text-umber backdrop-blur-sm">
                      {candidate.code}
                    </span>

                    {isTopFour && (
                      <span className="rounded-sm border border-terracotta/35 bg-plaster/95 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-terracotta backdrop-blur-sm">
                        Top 4 · Enters Sample Production
                      </span>
                    )}
                  </div>

                  {/* Placed Token Indicator Ribbon */}
                  {placedCount > 0 && (
                    <div className="pointer-events-none absolute bottom-3.5 left-3.5 inline-flex items-center gap-2 rounded-sm border border-terracotta/30 bg-plaster/95 px-3 py-1.5 backdrop-blur-sm">
                      <span className="flex items-center gap-1">
                        {Array.from({ length: placedCount }).map((_, idx) => (
                          <span
                            key={idx}
                            className="h-2 w-2 rounded-full bg-terracotta"
                          />
                        ))}
                      </span>
                      <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.16em] text-terracotta">
                        {placedCount}{" "}
                        {placedCount === 1 ? "Token" : "Tokens"} Placed
                      </span>
                    </div>
                  )}
                </div>

                {/* Curatorial Plaque */}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between gap-2 font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted">
                    <span>{candidate.creatorHandle}</span>
                    <span>
                      {candidate.tierSuggestion === "one-of-one"
                        ? "1-of-1 Archive"
                        : "Small-Batch 3–4"}
                    </span>
                  </div>

                  <h3 className="mt-2.5 font-editorial text-[1.75rem] leading-[1.08] text-umber">
                    {candidate.title}
                  </h3>

                  <p className="mt-1 font-sans text-xs text-muted">
                    Designed by {candidate.creatorName}
                  </p>

                  <p className="mt-3.5 line-clamp-2 font-sans text-xs leading-relaxed text-muted/90">
                    {candidate.description}
                  </p>

                  {/* Craftsmanship Hairline Tags */}
                  {candidate.craftsmanship.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {candidate.craftsmanship.slice(0, 3).map((detail) => (
                        <span
                          key={detail}
                          className="rounded-sm border border-champagne bg-travertine/55 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted"
                        >
                          {detail}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Spacer to anchor vote bar & CTA */}
                  <div className="mt-auto pt-6">
                    {/* Live Community Total & Razor-Thin Vote-Share Bar */}
                    <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.18em]">
                      <span className="font-medium text-umber">
                        {candidate.votesCount.toLocaleString("en-IN")} Votes
                      </span>
                      <span className="text-muted">{sharePercent}% Share</span>
                    </div>

                    <div className="mt-2 h-[2px] w-full overflow-hidden bg-champagne">
                      <motion.div
                        className="h-full bg-terracotta"
                        initial={false}
                        animate={{ width: `${Math.max(sharePercent, 3)}%` }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>

                    {/* Tactile Allocate Token Button */}
                    <button
                      type="button"
                      suppressHydrationWarning
                      disabled={tokensRemaining <= 0 || isBusy}
                      onClick={() => handleAllocateToken(candidate)}
                      className={cn(
                        "mt-5 flex w-full items-center justify-center gap-2 rounded-sm border px-4 py-3 font-mono text-[10.5px] uppercase tracking-[0.2em] transition-all",
                        tokensRemaining > 0
                          ? placedCount > 0
                            ? "border-terracotta bg-terracotta text-plaster hover:bg-umber hover:border-umber"
                            : "border-umber bg-plaster text-umber hover:border-terracotta hover:bg-terracotta hover:text-plaster"
                          : "cursor-not-allowed border-champagne bg-travertine/60 text-muted"
                      )}
                    >
                      {tokensRemaining > 0 ? (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          <span>
                            {isBusy
                              ? "Recording Token..."
                              : placedCount > 0
                                ? `Allocate Token (${placedCount} Placed)`
                                : "Allocate Token"}
                          </span>
                        </>
                      ) : placedCount > 0 ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-terracotta" />
                          <span>
                            {placedCount}{" "}
                            {placedCount === 1 ? "Token" : "Tokens"} Placed
                          </span>
                        </>
                      ) : (
                        <span>All 5 Tokens Allocated</span>
                      )}
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
