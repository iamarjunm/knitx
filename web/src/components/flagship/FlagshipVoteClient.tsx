"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import type { VoteCandidate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useStorefrontConfig } from "@/context/StorefrontConfigContext";
import {
  cleanFlagshipText,
  getFlagshipCleanImage,
} from "@/lib/flagship-media";

interface FlagshipVoteClientProps {
  initialCandidates: VoteCandidate[];
}

type TierFilter = "all" | "one-of-one" | "small-batch";
type SortOption = "top" | "code";

const STORAGE_KEY = "knitx_flagship_votes";

function formatHandle(handle: string): string {
  const trimmed = handle.trim();
  if (!trimmed) return "@knitx.creator";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

export default function FlagshipVoteClient({
  initialCandidates,
}: FlagshipVoteClientProps) {
  const { user } = useAuth();
  const { config } = useStorefrontConfig();

  const [mounted, setMounted] = useState(false);
  const [candidates, setCandidates] =
    useState<VoteCandidate[]>(initialCandidates);
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("top");
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    tone: "neutral" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setVotedIds(
            parsed.filter((item): item is string => typeof item === "string")
          );
        }
      }
    } catch {
      // Ignore storage read errors
    }
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const accent =
    mounted && config.accentColor ? config.accentColor : "#E11D2E";

  const persistVotes = useCallback((nextIds: string[]) => {
    setVotedIds(nextIds);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));
    } catch {
      // Ignore storage write errors
    }
  }, []);

  const handleVote = useCallback(
    async (candidateId: string) => {
      if (submittingId === candidateId) return;
      if (votedIds.includes(candidateId)) return;

      const previousVotes = votedIds;
      const nextVotes = [...votedIds, candidateId];

      setSubmittingId(candidateId);
      setNotice(null);
      persistVotes(nextVotes);

      setCandidates((prev) =>
        prev.map((item) =>
          item._id === candidateId
            ? { ...item, votesCount: item.votesCount + 1 }
            : item
        )
      );

      try {
        const payload: { candidateId: string; uid?: string } = { candidateId };
        if (mounted && user?.uid) {
          payload.uid = user.uid;
        }

        const response = await fetch("/api/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = (await response.json()) as {
          ok?: boolean;
          votesCount?: number;
          error?: string;
        };

        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Unable to record ballot.");
        }

        if (typeof data.votesCount === "number") {
          setCandidates((prev) =>
            prev.map((item) =>
              item._id === candidateId
                ? { ...item, votesCount: data.votesCount as number }
                : item
            )
          );
        }

        setNotice({
          tone: "neutral",
          text: "Ballot locked in for the upcoming drop cycle.",
        });
      } catch {
        persistVotes(previousVotes);
        setCandidates((prev) =>
          prev.map((item) =>
            item._id === candidateId
              ? { ...item, votesCount: Math.max(0, item.votesCount - 1) }
              : item
          )
        );
        setNotice({
          tone: "error",
          text: "Could not record ballot right now. Please try again.",
        });
      } finally {
        setSubmittingId(null);
      }
    },
    [mounted, persistVotes, submittingId, user, votedIds]
  );

  const rankedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => {
      if (b.votesCount !== a.votesCount) {
        return b.votesCount - a.votesCount;
      }
      return a.code.localeCompare(b.code);
    });
  }, [candidates]);

  const rankById = useMemo(() => {
    const map = new Map<string, number>();
    rankedCandidates.forEach((candidate, idx) => {
      map.set(candidate._id, idx + 1);
    });
    return map;
  }, [rankedCandidates]);

  const totalBallots = useMemo(
    () => candidates.reduce((sum, item) => sum + item.votesCount, 0),
    [candidates]
  );

  const leadingVotes = useMemo(
    () => Math.max(1, ...candidates.map((item) => item.votesCount)),
    [candidates]
  );

  const visibleCandidates = useMemo(() => {
    const filtered =
      tierFilter === "all"
        ? rankedCandidates
        : rankedCandidates.filter((item) => item.tierSuggestion === tierFilter);

    if (sortBy === "code") {
      return [...filtered].sort((a, b) => a.code.localeCompare(b.code));
    }
    return filtered;
  }, [rankedCandidates, sortBy, tierFilter]);

  const filterOptions: { id: TierFilter; label: string }[] = [
    { id: "all", label: "ALL" },
    { id: "one-of-one", label: "1 OF 1" },
    { id: "small-batch", label: "SMALL BATCH" },
  ];

  return (
    <div
      className="min-h-screen bg-[#FFFFFF] text-[#000000]"
      style={{ "--flagship-accent": accent } as React.CSSProperties}
    >
      {/* Flagship Header */}
      <header className="border-b border-black/10 bg-[#FFFFFF] py-14 sm:py-20">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.22em] text-[#666666] uppercase">
                <span className="inline-block h-2 w-2 bg-[var(--flagship-accent)]" />
                <span>COMMUNITY BALLOT · LIVE CURATION ROOM</span>
              </div>

              <h1 className="mt-4 font-syne text-5xl font-extrabold leading-[0.94] tracking-[-0.03em] text-[#000000] uppercase sm:text-7xl lg:text-[80px]">
                VOTE NEXT DROP
              </h1>

              <p className="mt-6 max-w-xl font-sans text-sm leading-relaxed text-[#666666] sm:text-base">
                Collectors decide which shortlisted silhouettes move into
                physical sample cutting. Inspect each concept below and cast
                your vote on the pieces that enter the next edition.
              </p>
            </div>

            {/* Live Tally Board */}
            <aside className="lg:col-span-4">
              <div className="divide-y divide-black/10 border border-black/10 bg-[#F4F4F5]">
                <div className="px-6 py-5">
                  <p className="font-mono text-[10px] tracking-[0.2em] text-[#666666] uppercase">
                    LIVE TOTAL BALLOTS
                  </p>
                  <p className="mt-2 font-poster text-5xl leading-none text-[#000000]">
                    {totalBallots.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="grid grid-cols-2 divide-x divide-black/10 bg-[#FFFFFF]">
                  <div className="px-6 py-4">
                    <p className="font-mono text-[10px] tracking-[0.18em] text-[#666666] uppercase">
                      CANDIDATES
                    </p>
                    <p className="mt-1.5 font-mono text-[11px] font-semibold tracking-[0.14em] text-[#000000] uppercase">
                      {String(candidates.length).padStart(2, "0")} CONCEPTS
                    </p>
                  </div>
                  <div className="px-6 py-4">
                    <p className="font-mono text-[10px] tracking-[0.18em] text-[#666666] uppercase">
                      YOUR VOTES
                    </p>
                    <p className="mt-1.5 font-mono text-[11px] font-semibold tracking-[0.14em] text-[var(--flagship-accent)] uppercase">
                      {mounted ? String(votedIds.length).padStart(2, "0") : "00"}{" "}
                      CAST
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </header>

      {/* Filter & Sort Control Bar */}
      <div className="border-b border-black/10 bg-[#F4F4F5]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-10 lg:px-14">
          <div
            role="tablist"
            aria-label="Filter concepts by tier"
            className="flex flex-wrap items-center gap-2"
          >
            {filterOptions.map((option) => {
              const active = tierFilter === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  suppressHydrationWarning
                  onClick={() => setTierFilter(option.id)}
                  className={cn(
                    "cursor-pointer border px-4 py-2 font-mono text-[10px] font-semibold tracking-[0.18em] uppercase transition-colors",
                    active
                      ? "border-[#000000] bg-[#000000] text-[#FFFFFF]"
                      : "border-black/15 bg-[#FFFFFF] text-[#666666] hover:border-[#000000] hover:text-[#000000]"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.18em] text-[#666666] uppercase">
              SORT
            </span>
            <div className="inline-flex border border-black/15 bg-[#FFFFFF]">
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setSortBy("top")}
                className={cn(
                  "cursor-pointer px-4 py-2 font-mono text-[10px] font-semibold tracking-[0.16em] uppercase transition-colors",
                  sortBy === "top"
                    ? "bg-[#000000] text-[#FFFFFF]"
                    : "bg-[#FFFFFF] text-[#666666] hover:text-[#000000]"
                )}
              >
                TOP VOTED
              </button>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setSortBy("code")}
                className={cn(
                  "cursor-pointer border-l border-black/15 px-4 py-2 font-mono text-[10px] font-semibold tracking-[0.16em] uppercase transition-colors",
                  sortBy === "code"
                    ? "bg-[#000000] text-[#FFFFFF]"
                    : "bg-[#FFFFFF] text-[#666666] hover:text-[#000000]"
                )}
              >
                CODE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Status Notice */}
      {notice && (
        <div
          role="status"
          className={cn(
            "border-b border-black/10 px-6 py-3.5 sm:px-10 lg:px-14",
            notice.tone === "error" ? "bg-[#F4F4F5]" : "bg-[#FFFFFF]"
          )}
        >
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
            <p
              className={cn(
                "font-mono text-[11px] tracking-[0.12em] uppercase",
                notice.tone === "error"
                  ? "text-[var(--flagship-accent)]"
                  : "text-[#000000]"
              )}
            >
              {notice.text}
            </p>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setNotice(null)}
              className="cursor-pointer font-mono text-[10px] tracking-[0.18em] text-[#666666] uppercase hover:text-[#000000]"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* 3-Column Gallery Lookbook Ballot Grid */}
      <section className="bg-[#FFFFFF] py-14 sm:py-20">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          {visibleCandidates.length === 0 ? (
            <div className="border border-black/10 bg-[#F4F4F5] px-8 py-16 text-center">
              <p className="font-syne text-2xl font-bold text-[#000000] uppercase">
                NO CONCEPTS IN THIS TIER
              </p>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setTierFilter("all")}
                className="mt-6 cursor-pointer border border-[#000000] bg-[#000000] px-6 py-3 font-sans text-[11px] font-semibold tracking-[0.2em] text-[#FFFFFF] uppercase transition-colors hover:border-[var(--flagship-accent)] hover:bg-[var(--flagship-accent)]"
              >
                SHOW ALL CONCEPTS
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
              {visibleCandidates.map((candidate, idx) => {
                const rank = rankById.get(candidate._id) ?? idx + 1;
                const rankCode = String(rank).padStart(2, "0");
                const isLeading = rank === 1;
                const isVoted = mounted && votedIds.includes(candidate._id);
                const isSubmitting = submittingId === candidate._id;
                const isOneOfOne = candidate.tierSuggestion === "one-of-one";

                const sharePercent =
                  totalBallots > 0
                    ? Math.round((candidate.votesCount / totalBallots) * 100)
                    : 0;
                const barWidth = Math.max(
                  6,
                  Math.round((candidate.votesCount / leadingVotes) * 100)
                );

                const craftSpecs = candidate.craftsmanship
                  .slice(0, 3)
                  .map((spec) => cleanFlagshipText(spec));

                return (
                  <article
                    key={candidate._id}
                    className="group flex flex-col border border-black/10 bg-[#FFFFFF]"
                  >
                    {/* Crisp 3:4 Lookbook Frame */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden border-b border-black/10 bg-[#F4F4F5]">
                      <Image
                        src={getFlagshipCleanImage(candidate.imageUrl, idx)}
                        alt={cleanFlagshipText(candidate.title)}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                    </div>

                    {/* Spec Plate */}
                    <div className="flex flex-1 flex-col justify-between p-6">
                      <div>
                        <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-3 font-mono text-[10px] tracking-[0.16em] uppercase">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "font-semibold",
                                isLeading
                                  ? "text-[var(--flagship-accent)]"
                                  : "text-[#000000]"
                              )}
                            >
                              #{rankCode}
                            </span>
                            <span className="text-black/20">·</span>
                            <span className="text-[#666666]">
                              {candidate.code}
                            </span>
                          </div>

                          <span
                            className={cn(
                              "font-semibold",
                              isOneOfOne
                                ? "text-[var(--flagship-accent)]"
                                : "text-[#666666]"
                            )}
                          >
                            {isOneOfOne ? "1 OF 1" : "SMALL BATCH"}
                          </span>
                        </div>

                        <h2 className="mt-4 font-syne text-xl font-extrabold leading-[1.1] tracking-[-0.02em] text-[#000000] uppercase">
                          {cleanFlagshipText(candidate.title)}
                        </h2>

                        <p className="mt-1.5 font-mono text-[10px] tracking-[0.12em] text-[#666666] uppercase">
                          {candidate.creatorName} ·{" "}
                          {formatHandle(candidate.creatorHandle)}
                        </p>

                        <p className="mt-3 font-sans text-xs leading-relaxed text-[#666666]">
                          {cleanFlagshipText(candidate.description)}
                        </p>

                        {craftSpecs.length > 0 && (
                          <div className="mt-4 flex flex-wrap items-center gap-1.5">
                            {craftSpecs.map((spec, specIdx) => (
                              <span
                                key={`${candidate._id}-spec-${specIdx}`}
                                className="border border-black/10 bg-[#F4F4F5] px-2.5 py-1 font-mono text-[10px] tracking-[0.04em] text-[#000000]"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 3px Progress Meter + Vote Action */}
                      <div className="mt-6 border-t border-black/10 pt-4">
                        <div className="flex items-baseline justify-between font-mono text-[11px] tracking-[0.12em] uppercase">
                          <span className="font-semibold text-[#000000]">
                            {candidate.votesCount.toLocaleString("en-IN")} VOTES
                          </span>
                          <span
                            className={cn(
                              "font-semibold",
                              isLeading
                                ? "text-[var(--flagship-accent)]"
                                : "text-[#666666]"
                            )}
                          >
                            {sharePercent}% SHARE
                          </span>
                        </div>

                        <div className="mt-2.5 h-[3px] w-full overflow-hidden bg-black/10">
                          <div
                            className={cn(
                              "h-full transition-all duration-500 ease-out",
                              isLeading
                                ? "bg-[var(--flagship-accent)]"
                                : "bg-[#000000]"
                            )}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>

                        <button
                          type="button"
                          suppressHydrationWarning
                          disabled={isVoted || isSubmitting}
                          onClick={() => void handleVote(candidate._id)}
                          className={cn(
                            "mt-5 flex w-full items-center justify-center gap-2 border px-4 py-3.5 font-sans text-[11px] font-semibold tracking-[0.22em] uppercase transition-colors",
                            isVoted
                              ? "cursor-default border-[#000000] bg-[#F4F4F5] text-[#000000]"
                              : "cursor-pointer border-[#000000] bg-[#000000] text-[#FFFFFF] hover:border-[var(--flagship-accent)] hover:bg-[var(--flagship-accent)] disabled:cursor-wait disabled:opacity-60"
                          )}
                        >
                          {isVoted ? (
                            <>
                              <Check className="h-3.5 w-3.5 stroke-[2.25] text-[var(--flagship-accent)]" />
                              <span>VOTED</span>
                            </>
                          ) : isSubmitting ? (
                            <span>RECORDING...</span>
                          ) : (
                            <span>CAST VOTE</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Bottom Creator Residency CTA Strip */}
      <section className="border-t border-black/10 bg-[#F4F4F5] py-14 sm:py-16">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-8 px-6 sm:px-10 lg:flex-row lg:items-center lg:px-14">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] tracking-[0.22em] text-[#666666] uppercase">
              CREATOR RESIDENCY · OPEN GARMENT BRIEF
            </p>
            <h2 className="mt-2.5 font-syne text-2xl font-extrabold leading-[1.05] tracking-[-0.02em] text-[#000000] uppercase sm:text-4xl">
              PITCH YOUR SILHOUETTE FOR THE NEXT BALLOT.
            </h2>
            <p className="mt-2.5 font-sans text-sm leading-relaxed text-[#666666]">
              Submit original garment specs for studio review. Top community
              selections enter sample cutting and receive full woven creator
              credit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/submit"
              className="inline-flex items-center gap-2.5 border border-[#000000] bg-[#000000] px-7 py-4 font-sans text-[11px] font-semibold tracking-[0.2em] text-[#FFFFFF] uppercase transition-colors hover:border-[var(--flagship-accent)] hover:bg-[var(--flagship-accent)]"
            >
              <span>SUBMIT A CONCEPT</span>
              <ArrowUpRight className="h-3.5 w-3.5 stroke-[2]" />
            </Link>
            <Link
              href="/archive"
              className="inline-flex items-center gap-2.5 border border-black/20 bg-[#FFFFFF] px-7 py-4 font-sans text-[11px] font-semibold tracking-[0.2em] text-[#000000] uppercase transition-colors hover:border-[#000000]"
            >
              <span>EDITIONS CALENDAR</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
