"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { VoteCandidate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { cleanV10Text, getV10CleanImage } from "@/components/v10/v10-media";

interface V10VoteClientProps {
  initialCandidates: VoteCandidate[];
}

type TierFilter = "all" | "one-of-one" | "small-batch";
type SortOption = "rank" | "code";

const STORAGE_KEY = "knitx_v10_votes";

function formatHandle(handle: string): string {
  const trimmed = handle.trim();
  if (!trimmed) return "@knitx.creator";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function formatEditorialTitle(raw: string): string {
  const cleaned = cleanV10Text(raw).trim();
  if (!cleaned) return "Untitled Silhouette";
  const isAllCaps = cleaned === cleaned.toUpperCase() && /[A-Z]/.test(cleaned);
  if (!isAllCaps) return cleaned;
  return cleaned
    .toLowerCase()
    .replace(/\b([a-z])/g, (letter) => letter.toUpperCase())
    .replace(/\bGsm\b/g, "GSM");
}

export default function V10VoteClient({
  initialCandidates,
}: V10VoteClientProps) {
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
      // Ignore storage access errors
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
      // Ignore storage access errors
    }
  }, []);

  const handleSupportConcept = useCallback(
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
          text: "Your ballot has been recorded for the next release cycle.",
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
    { id: "all", label: "ALL CONCEPTS" },
    { id: "one-of-one", label: "ONE OF ONE" },
    { id: "small-batch", label: "SMALL BATCH" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111110]">
      {/* Architectural Header */}
      <header className="border-b border-[#111110]/10 bg-[#FAF9F6] py-16 sm:py-24">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 items-end gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="font-sans text-[11px] tracking-[0.22em] text-[#6E6A63] uppercase">
                COMMUNITY CURATION · NEXT RELEASE BALLOT
              </p>
              <h1 className="mt-5 font-editorial text-5xl leading-[0.95] tracking-[-0.015em] text-[#111110] sm:text-7xl">
                Decide what enters <span className="italic">production.</span>
              </h1>
              <p className="mt-6 max-w-xl font-sans text-sm leading-relaxed text-[#6E6A63] sm:text-[15px]">
                Every upcoming KNITX edition is curated alongside our collectors.
                Review the shortlisted silhouettes below and register your
                support for the garments that enter sample cutting.
              </p>
            </div>

            {/* Right-Side Ledger Summary */}
            <aside className="lg:col-span-4">
              <div className="rounded-none border border-[#111110]/10 bg-[#FFFFFF] divide-y divide-[#111110]/10">
                <div className="px-6 py-5">
                  <p className="font-sans text-[10px] tracking-[0.2em] text-[#6E6A63] uppercase">
                    TOTAL BALLOTS CAST
                  </p>
                  <p className="mt-2 font-editorial text-4xl leading-none text-[#111110]">
                    {totalBallots.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="grid grid-cols-2 divide-x divide-[#111110]/10">
                  <div className="px-6 py-4">
                    <p className="font-sans text-[10px] tracking-[0.2em] text-[#6E6A63] uppercase">
                      SHORTLISTED
                    </p>
                    <p className="mt-1.5 font-mono text-[11px] tracking-[0.16em] text-[#111110] uppercase">
                      {String(candidates.length).padStart(2, "0")} SILHOUETTES
                    </p>
                  </div>
                  <div className="px-6 py-4">
                    <p className="font-sans text-[10px] tracking-[0.2em] text-[#6E6A63] uppercase">
                      YOUR BALLOTS
                    </p>
                    <p className="mt-1.5 font-mono text-[11px] tracking-[0.16em] text-[#8C1D18] uppercase">
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

      {/* Minimal Filter & Sort Rail */}
      <div className="border-b border-[#111110]/10 bg-[#FFFFFF]">
        <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-6 px-6 py-5 sm:px-10 lg:px-14">
          <nav
            aria-label="Filter concepts by tier"
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
                    "cursor-pointer border-b pb-1.5 font-sans text-[11px] tracking-[0.2em] uppercase transition-colors",
                    isActive
                      ? "border-[#111110] text-[#111110]"
                      : "border-transparent text-[#6E6A63] hover:text-[#111110]"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] tracking-[0.18em] text-[#6E6A63] uppercase">
              ORDER
            </span>
            <div className="inline-flex items-center border border-[#111110]/12">
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setSortBy("rank")}
                className={cn(
                  "cursor-pointer rounded-none px-3.5 py-2 font-mono text-[10px] tracking-[0.16em] uppercase transition-colors",
                  sortBy === "rank"
                    ? "bg-[#111110] text-[#FAF9F6]"
                    : "bg-[#FFFFFF] text-[#6E6A63] hover:text-[#111110]"
                )}
              >
                BY RANK
              </button>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setSortBy("code")}
                className={cn(
                  "cursor-pointer rounded-none border-l border-[#111110]/12 px-3.5 py-2 font-mono text-[10px] tracking-[0.16em] uppercase transition-colors",
                  sortBy === "code"
                    ? "bg-[#111110] text-[#FAF9F6]"
                    : "bg-[#FFFFFF] text-[#6E6A63] hover:text-[#111110]"
                )}
              >
                BY CODE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Feedback Bar */}
      {notice && (
        <div
          role="status"
          className={cn(
            "border-b border-[#111110]/10 px-6 py-3.5 sm:px-10 lg:px-14",
            notice.tone === "error" ? "bg-[#8C1D18]/5" : "bg-[#F2EFE9]"
          )}
        >
          <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-4">
            <p
              className={cn(
                "font-mono text-[11px] tracking-[0.12em]",
                notice.tone === "error" ? "text-[#8C1D18]" : "text-[#111110]"
              )}
            >
              {notice.text}
            </p>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setNotice(null)}
              className="cursor-pointer font-mono text-[10px] tracking-[0.18em] text-[#6E6A63] uppercase hover:text-[#111110]"
            >
              DISMISS
            </button>
          </div>
        </div>
      )}

      {/* Gallery Ballot Grid */}
      <section className="bg-[#FFFFFF] py-16 sm:py-20">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 lg:px-14">
          {visibleCandidates.length === 0 ? (
            <div className="border border-[#111110]/10 bg-[#FAF9F6] px-8 py-16 text-center">
              <p className="font-editorial text-3xl text-[#111110]">
                No silhouettes match this filter.
              </p>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setTierFilter("all")}
                className="mt-6 cursor-pointer rounded-none border border-[#111110] px-6 py-3 font-sans text-[11px] tracking-[0.2em] text-[#111110] uppercase transition-colors hover:bg-[#111110] hover:text-[#FAF9F6]"
              >
                VIEW ALL CONCEPTS
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
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
                  .map((tag) => cleanV10Text(tag));

                return (
                  <article
                    key={candidate._id}
                    className="group flex flex-col rounded-none"
                  >
                    {/* Tall 3:4 Museum Image Frame — Zero Floating Badges */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-none bg-[#141413]">
                      <Image
                        src={getV10CleanImage(candidate.imageUrl, idx)}
                        alt={formatEditorialTitle(candidate.title)}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                    </div>

                    {/* Clean Editorial Plate Underneath */}
                    <div className="flex flex-1 flex-col justify-between pt-5">
                      <div>
                        <div className="flex items-center justify-between gap-3 border-b border-[#111110]/10 pb-3">
                          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase">
                            <span
                              className={cn(
                                rank === 1 ? "text-[#8C1D18]" : "text-[#111110]"
                              )}
                            >
                              RANK #{rankFormatted}
                            </span>
                            <span className="text-[#111110]/25">·</span>
                            <span className="text-[#6E6A63]">
                              {candidate.code}
                            </span>
                          </div>

                          <span
                            className={cn(
                              "font-mono text-[10px] tracking-[0.18em] uppercase",
                              isOneOfOne ? "text-[#8C1D18]" : "text-[#6E6A63]"
                            )}
                          >
                            {isOneOfOne ? "ONE OF ONE" : "SMALL BATCH"}
                          </span>
                        </div>

                        <h2 className="mt-3.5 font-editorial text-2xl leading-[1.12] text-[#111110] sm:text-[26px]">
                          {formatEditorialTitle(candidate.title)}
                        </h2>

                        <p className="mt-1.5 font-sans text-[11px] tracking-[0.1em] text-[#6E6A63]">
                          By {candidate.creatorName} ·{" "}
                          {formatHandle(candidate.creatorHandle)}
                        </p>

                        <p className="mt-2.5 font-sans text-xs leading-relaxed text-[#6E6A63]">
                          {cleanV10Text(candidate.description)}
                        </p>

                        {craftTags.length > 0 && (
                          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-[#111110]/8 pt-3 font-mono text-[10px] tracking-[0.04em] text-[#6E6A63]">
                            {craftTags.map((tag, tagIdx) => (
                              <React.Fragment key={`${candidate._id}-tag-${tagIdx}`}>
                                {tagIdx > 0 && (
                                  <span
                                    aria-hidden="true"
                                    className="text-[#111110]/25"
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

                      {/* Precision Vote Meter + Crisp Action Button */}
                      <div className="mt-6 border-t border-[#111110]/10 pt-4">
                        <div className="flex items-baseline justify-between font-mono text-[10px] tracking-[0.16em] uppercase">
                          <span className="text-[#111110]">
                            {candidate.votesCount.toLocaleString("en-IN")}{" "}
                            BALLOTS
                          </span>
                          <span
                            className={cn(
                              rank === 1 ? "text-[#8C1D18]" : "text-[#6E6A63]"
                            )}
                          >
                            {sharePercent}% SHARE
                          </span>
                        </div>

                        <div className="mt-2.5 h-[2px] w-full overflow-hidden bg-[#111110]/10">
                          <div
                            className={cn(
                              "h-full transition-all duration-500 ease-out",
                              rank === 1 ? "bg-[#8C1D18]" : "bg-[#111110]"
                            )}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>

                        <button
                          type="button"
                          suppressHydrationWarning
                          disabled={isVoted || isSubmitting}
                          onClick={() => void handleSupportConcept(candidate._id)}
                          className={cn(
                            "mt-5 flex w-full items-center justify-center gap-2 rounded-none border px-4 py-3.5 font-sans text-[11px] tracking-[0.2em] uppercase transition-colors",
                            isVoted
                              ? "cursor-default border-[#111110] bg-[#111110] text-[#FAF9F6]"
                              : "cursor-pointer border-[#111110] bg-transparent text-[#111110] hover:bg-[#111110] hover:text-[#FAF9F6] disabled:cursor-wait disabled:opacity-60"
                          )}
                        >
                          {isVoted ? (
                            <>
                              <Check className="h-3.5 w-3.5 stroke-[1.75]" />
                              <span>VOTE RECORDED</span>
                            </>
                          ) : isSubmitting ? (
                            <span>RECORDING BALLOT...</span>
                          ) : (
                            <span>SUPPORT CONCEPT</span>
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

      {/* Bottom Editorial CTA Strip */}
      <section className="border-t border-[#111110]/10 bg-[#F2EFE9] py-14 sm:py-16">
        <div className="mx-auto flex max-w-[1380px] flex-col items-start justify-between gap-8 px-6 sm:px-10 lg:flex-row lg:items-center lg:px-14">
          <div className="max-w-2xl">
            <p className="font-sans text-[11px] tracking-[0.22em] text-[#6E6A63] uppercase">
              CREATOR RESIDENCY · FUTURE EDITIONS
            </p>
            <h2 className="mt-2.5 font-editorial text-3xl leading-[1.08] text-[#111110] sm:text-4xl">
              Have a silhouette for a future release?
            </h2>
            <p className="mt-2 font-sans text-sm leading-relaxed text-[#6E6A63]">
              Submit your concept to the next curation cycle for studio review,
              community voting, and numbered production.
            </p>
          </div>

          <Link
            href="/v10/submit"
            className="inline-flex items-center gap-3 rounded-none border border-[#111110] bg-[#111110] px-8 py-4 font-sans text-[11px] tracking-[0.2em] text-[#FAF9F6] uppercase transition-colors hover:border-[#8C1D18] hover:bg-[#8C1D18]"
          >
            <span>SUBMIT A CONCEPT</span>
            <ArrowRight className="h-3.5 w-3.5 stroke-[1.75]" />
          </Link>
        </div>
      </section>
    </div>
  );
}
