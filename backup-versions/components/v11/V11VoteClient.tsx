"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { VoteCandidate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { cleanV10Text, getV10CleanImage } from "@/components/v10/v10-media";

interface V11VoteClientProps {
  initialCandidates: VoteCandidate[];
}

type TierFilter = "all" | "one-of-one" | "small-batch";
type SortOption = "rank" | "code";

const STORAGE_KEY = "knitx_v11_votes";

function cleanNoirText(text: string): string {
  return cleanV10Text(text).replace(/\bbombay\b/gi, "India");
}

function formatHandle(handle: string): string {
  const trimmed = handle.trim();
  if (!trimmed) return "@knitx.creator";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

export default function V11VoteClient({
  initialCandidates,
}: V11VoteClientProps) {
  const { user } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [candidates, setCandidates] =
    useState<VoteCandidate[]>(initialCandidates);
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("rank");
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
    const timeout = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

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
          text: "Ballot recorded. Your selection has been added to the next edition tally.",
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
          text: "Unable to record ballot right now. Please try again.",
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
    rankedCandidates.forEach((candidate, index) => {
      map.set(candidate._id, index + 1);
    });
    return map;
  }, [rankedCandidates]);

  const totalBallots = useMemo(
    () => candidates.reduce((acc, item) => acc + item.votesCount, 0),
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

  const filterTabs: { id: TierFilter; label: string }[] = [
    { id: "all", label: "ALL" },
    { id: "one-of-one", label: "ONE OF ONE" },
    { id: "small-batch", label: "SMALL BATCH" },
  ];

  return (
    <div className="min-h-screen bg-[#070709] text-[#F4F2ED]">
      {/* Monumental Dark Cinema Header */}
      <header className="border-b border-white/10 bg-[#070709] py-14 sm:py-20">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 items-end gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.26em] text-[#8E8C87] uppercase">
                <span className="inline-block h-1.5 w-1.5 bg-[#C81E1E]" />
                <span>NEXT EDITION CURATION · LIVE TALLY</span>
              </div>

              <h1 className="mt-6 font-syne text-5xl leading-[0.9] font-extrabold tracking-[-0.03em] text-[#F4F2ED] uppercase sm:text-7xl lg:text-[84px]">
                COMMUNITY BALLOT
              </h1>

              <p className="mt-7 max-w-2xl font-sans text-sm leading-relaxed text-[#8E8C87] sm:text-base">
                Every upcoming KNITX edition is decided directly by our
                audience. Inspect each shortlisted garment study below and cast
                your support for the silhouettes entering physical sample
                cutting.
              </p>
            </div>

            {/* Live Tally Ledger */}
            <aside className="lg:col-span-4">
              <div className="divide-y divide-white/10 border border-white/10 bg-[#0E0E12]">
                <div className="px-6 py-5">
                  <p className="font-mono text-[10px] tracking-[0.22em] text-[#8E8C87] uppercase">
                    LIVE TOTAL VOTES
                  </p>
                  <p className="mt-2 font-syne text-4xl leading-none font-extrabold text-[#F4F2ED]">
                    {totalBallots.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="grid grid-cols-2 divide-x divide-white/10">
                  <div className="px-6 py-4">
                    <p className="font-mono text-[10px] tracking-[0.2em] text-[#8E8C87] uppercase">
                      SHORTLIST
                    </p>
                    <p className="mt-1.5 font-mono text-[11px] tracking-[0.16em] text-[#F4F2ED] uppercase">
                      {String(candidates.length).padStart(2, "0")} CONCEPTS
                    </p>
                  </div>

                  <div className="px-6 py-4">
                    <p className="font-mono text-[10px] tracking-[0.2em] text-[#8E8C87] uppercase">
                      YOUR BALLOTS
                    </p>
                    <p className="mt-1.5 font-mono text-[11px] tracking-[0.16em] text-[#C81E1E] uppercase">
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

      {/* Crisp Tier Filter & Sort Bar */}
      <div className="border-b border-white/10 bg-[#0E0E12]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-6 px-6 py-5 sm:px-10 lg:px-14">
          <nav
            aria-label="Filter ballot concepts by tier"
            className="flex flex-wrap items-center gap-6 sm:gap-8"
          >
            {filterTabs.map((tab) => {
              const isActive = tierFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setTierFilter(tab.id)}
                  className={cn(
                    "cursor-pointer border-b pb-1.5 font-mono text-[11px] tracking-[0.22em] uppercase transition-colors",
                    isActive
                      ? "border-[#C81E1E] text-[#F4F2ED]"
                      : "border-transparent text-[#8E8C87] hover:text-[#F4F2ED]"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#8E8C87] uppercase">
              SORT
            </span>
            <div className="inline-flex items-center border border-white/15">
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setSortBy("rank")}
                className={cn(
                  "cursor-pointer rounded-none px-4 py-2 font-mono text-[10px] tracking-[0.18em] uppercase transition-colors",
                  sortBy === "rank"
                    ? "bg-[#F4F2ED] text-[#070709]"
                    : "bg-transparent text-[#8E8C87] hover:text-[#F4F2ED]"
                )}
              >
                BY RANK
              </button>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setSortBy("code")}
                className={cn(
                  "cursor-pointer rounded-none border-l border-white/15 px-4 py-2 font-mono text-[10px] tracking-[0.18em] uppercase transition-colors",
                  sortBy === "code"
                    ? "bg-[#F4F2ED] text-[#070709]"
                    : "bg-transparent text-[#8E8C87] hover:text-[#F4F2ED]"
                )}
              >
                BY CODE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Status Notification */}
      {notice && (
        <div
          role="status"
          className={cn(
            "border-b border-white/10 px-6 py-3.5 sm:px-10 lg:px-14",
            notice.tone === "error" ? "bg-[#C81E1E]/15" : "bg-[#141419]"
          )}
        >
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
            <p
              className={cn(
                "font-mono text-[11px] tracking-[0.12em]",
                notice.tone === "error" ? "text-[#F4F2ED]" : "text-[#F4F2ED]/90"
              )}
            >
              {notice.text}
            </p>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setNotice(null)}
              className="cursor-pointer font-mono text-[10px] tracking-[0.2em] text-[#8E8C87] uppercase hover:text-[#F4F2ED]"
            >
              DISMISS
            </button>
          </div>
        </div>
      )}

      {/* 3-Column Edge-to-Edge Dark-Studio Concept Grid */}
      <section className="bg-[#070709]">
        {visibleCandidates.length === 0 ? (
          <div className="mx-auto max-w-[1440px] px-6 py-24 text-center sm:px-10 lg:px-14">
            <p className="font-syne text-2xl font-bold tracking-[-0.02em] text-[#F4F2ED] uppercase">
              NO CONCEPTS IN THIS TIER
            </p>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setTierFilter("all")}
              className="mt-6 cursor-pointer rounded-none border border-white/20 px-7 py-3.5 font-sans text-[11px] tracking-[0.2em] text-[#F4F2ED] uppercase transition-colors hover:border-[#F4F2ED] hover:bg-[#F4F2ED] hover:text-[#070709]"
            >
              SHOW ALL CONCEPTS
            </button>
          </div>
        ) : (
          <div className="mx-auto max-w-[1440px]">
            <div className="grid grid-cols-1 border-b border-white/10 md:grid-cols-2 lg:grid-cols-3">
              {visibleCandidates.map((candidate, idx) => {
                const rank = rankById.get(candidate._id) ?? idx + 1;
                const rankFormatted = String(rank).padStart(2, "0");
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
                const craftTags = candidate.craftsmanship
                  .slice(0, 3)
                  .map((tag) => cleanNoirText(tag));

                return (
                  <article
                    key={candidate._id}
                    className="group flex flex-col border-b border-white/10 bg-[#070709] transition-colors hover:bg-[#0E0E12]/70 md:odd:border-r md:odd:border-white/10 lg:border-r lg:border-white/10 lg:odd:border-r lg:[&:nth-child(3n)]:border-r-0"
                  >
                    {/* Edge-to-Edge 3:4 Dark Studio Frame */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#141419]">
                      <Image
                        src={getV10CleanImage(candidate.imageUrl, idx)}
                        alt={cleanNoirText(candidate.title)}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/20 to-transparent" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-baseline justify-between px-6 pb-5">
                        <span
                          className={cn(
                            "font-mono text-[11px] font-semibold tracking-[0.22em] uppercase",
                            rank === 1 ? "text-[#C81E1E]" : "text-[#F4F2ED]"
                          )}
                        >
                          RANK #{rankFormatted}
                        </span>
                        <span className="font-mono text-[10px] tracking-[0.2em] text-[#8E8C87] uppercase">
                          {candidate.code}
                        </span>
                      </div>
                    </div>

                    {/* Concept Dossier & Vote Telemetry */}
                    <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
                      <div>
                        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 font-mono text-[10px] tracking-[0.2em] uppercase">
                          <span className="text-[#8E8C87]">
                            {formatHandle(candidate.creatorHandle)}
                          </span>
                          <span
                            className={cn(
                              isOneOfOne ? "text-[#C81E1E]" : "text-[#8E8C87]"
                            )}
                          >
                            {isOneOfOne ? "ONE OF ONE" : "SMALL BATCH"}
                          </span>
                        </div>

                        <h2 className="mt-4 font-syne text-2xl leading-[1.04] font-extrabold tracking-[-0.02em] text-[#F4F2ED] uppercase">
                          {cleanNoirText(candidate.title)}
                        </h2>

                        <p className="mt-1.5 font-sans text-xs text-[#8E8C87]">
                          By {candidate.creatorName}
                        </p>

                        <p className="mt-3 font-sans text-xs leading-relaxed text-[#8E8C87]">
                          {cleanNoirText(candidate.description)}
                        </p>

                        {craftTags.length > 0 && (
                          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-white/10 pt-3 font-mono text-[10px] tracking-[0.06em] text-[#8E8C87]">
                            {craftTags.map((tag, tagIdx) => (
                              <React.Fragment
                                key={`${candidate._id}-craft-${tagIdx}`}
                              >
                                {tagIdx > 0 && (
                                  <span
                                    aria-hidden="true"
                                    className="text-white/20"
                                  >
                                    ·
                                  </span>
                                )}
                                <span>{tag}</span>
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 2px Live Share Meter + Support Button */}
                      <div className="mt-6 border-t border-white/10 pt-5">
                        <div className="flex items-baseline justify-between font-mono text-[10px] tracking-[0.18em] uppercase">
                          <span className="text-[#F4F2ED]">
                            {candidate.votesCount.toLocaleString("en-IN")} VOTES
                          </span>
                          <span
                            className={cn(
                              rank === 1 ? "text-[#C81E1E]" : "text-[#8E8C87]"
                            )}
                          >
                            {sharePercent}% SHARE
                          </span>
                        </div>

                        <div className="mt-2.5 h-[2px] w-full overflow-hidden bg-white/10">
                          <div
                            className={cn(
                              "h-full transition-all duration-500 ease-out",
                              rank === 1 || isVoted
                                ? "bg-[#C81E1E]"
                                : "bg-[#F4F2ED]"
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
                            "mt-5 flex w-full items-center justify-center gap-2 rounded-none border px-4 py-3.5 font-sans text-[11px] font-semibold tracking-[0.22em] uppercase transition-colors",
                            isVoted
                              ? "cursor-default border-[#C81E1E] bg-[#C81E1E] text-[#F4F2ED]"
                              : "cursor-pointer border-white/25 bg-transparent text-[#F4F2ED] hover:border-[#F4F2ED] hover:bg-[#F4F2ED] hover:text-[#070709] disabled:cursor-wait disabled:opacity-60"
                          )}
                        >
                          {isVoted ? (
                            <>
                              <Check className="h-3.5 w-3.5 stroke-[2]" />
                              <span>VOTED</span>
                            </>
                          ) : isSubmitting ? (
                            <span>RECORDING...</span>
                          ) : (
                            <span>SUPPORT DESIGN</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Bottom Creator Submission CTA Banner */}
      <section className="bg-[#0E0E12] py-16 sm:py-20">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-8 px-6 sm:px-10 lg:flex-row lg:items-center lg:px-14">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] tracking-[0.24em] text-[#C81E1E] uppercase">
              CREATOR RESIDENCY · OPEN BRIEF
            </p>
            <h2 className="mt-3 font-syne text-3xl leading-[0.98] font-extrabold tracking-[-0.02em] text-[#F4F2ED] uppercase sm:text-4xl">
              PITCH A SILHOUETTE FOR FUTURE EDITIONS
            </h2>
            <p className="mt-3 font-sans text-sm leading-relaxed text-[#8E8C87]">
              Submit original garment concepts directly to the KNITX atelier.
              Shortlisted dossiers enter the live community ballot and move into
              numbered studio production with full creator credit.
            </p>
          </div>

          <Link
            href="/v11/submit"
            className="inline-flex items-center gap-3 rounded-none border border-[#F4F2ED] bg-[#F4F2ED] px-8 py-4 font-sans text-[11px] font-semibold tracking-[0.22em] text-[#070709] uppercase transition-colors hover:border-[#C81E1E] hover:bg-[#C81E1E] hover:text-[#F4F2ED]"
          >
            <span>SUBMIT A CONCEPT</span>
            <ArrowRight className="h-3.5 w-3.5 stroke-[1.75]" />
          </Link>
        </div>
      </section>
    </div>
  );
}
