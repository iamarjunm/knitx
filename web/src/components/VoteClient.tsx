'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  Flame,
  Scissors,
} from 'lucide-react';
import type { VoteCandidate } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface VoteClientProps {
  initialCandidates: VoteCandidate[];
}

type VoteFilter = 'most-voted' | 'one-of-one' | 'small-batch';

const STORAGE_KEY = 'knitx_drop002_voted_ids';
const QUALIFICATION_CUTOFF = 4;

function formatHandle(handle: string): string {
  const trimmed = handle.trim();
  if (!trimmed) return '@knitx.creator';
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

function getCountdownParts(targetMs: number, nowMs: number) {
  const diff = Math.max(0, targetMs - nowMs);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    days: pad(days),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
  };
}

export default function VoteClient({ initialCandidates }: VoteClientProps) {
  const { user, setAuthModalOpen } = useAuth();

  // Hydration-safe mount guard
  const [mounted, setMounted] = useState(false);
  const [closeTimestamp, setCloseTimestamp] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState<number | null>(null);

  const [candidates, setCandidates] =
    useState<VoteCandidate[]>(initialCandidates);
  const [filter, setFilter] = useState<VoteFilter>('most-voted');
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [pendingCandidateId, setPendingCandidateId] = useState<string | null>(
    null
  );
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mount-only initialization for localStorage + countdown
  useEffect(() => {
    setMounted(true);
    const now = Date.now();
    setNowMs(now);
    setCloseTimestamp(now + (4 * 86400 + 11 * 3600 + 42 * 60) * 1000);

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setVotedIds(
            parsed.filter((id): id is string => typeof id === 'string')
          );
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, [mounted]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const persistVotedIds = useCallback((nextIds: string[]) => {
    setVotedIds(nextIds);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const executeVote = useCallback(
    async (candidateId: string, uid: string) => {
      const alreadyVoted = votedIds.includes(candidateId);
      const delta = alreadyVoted ? -1 : 1;
      const nextVotedIds = alreadyVoted
        ? votedIds.filter((id) => id !== candidateId)
        : [...votedIds, candidateId];

      setSubmittingId(candidateId);
      persistVotedIds(nextVotedIds);

      setCandidates((prev) =>
        prev.map((c) =>
          c._id === candidateId
            ? { ...c, votesCount: Math.max(0, c.votesCount + delta) }
            : c
        )
      );

      try {
        if (!alreadyVoted) {
          const res = await fetch('/api/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidateId, uid }),
          });
          if (!res.ok) {
            throw new Error('Vote request failed');
          }
          setToastMessage('UPVOTE LOCKED IN FOR DROP 02.');
        } else {
          setToastMessage('VOTE REMOVED.');
        }
      } catch {
        // Revert optimistic update
        persistVotedIds(votedIds);
        setCandidates((prev) =>
          prev.map((c) =>
            c._id === candidateId
              ? { ...c, votesCount: Math.max(0, c.votesCount - delta) }
              : c
          )
        );
        setToastMessage('COULD NOT RECORD VOTE. TRY AGAIN.');
      } finally {
        setSubmittingId(null);
      }
    },
    [votedIds, persistVotedIds]
  );

  // Resume pending vote right after sign-in
  useEffect(() => {
    if (user && pendingCandidateId) {
      const targetId = pendingCandidateId;
      setPendingCandidateId(null);
      void executeVote(targetId, user.uid);
    }
  }, [user, pendingCandidateId, executeVote]);

  const handleVoteClick = (candidateId: string) => {
    if (submittingId === candidateId) return;
    if (!user) {
      setPendingCandidateId(candidateId);
      setAuthModalOpen(true);
      return;
    }
    void executeVote(candidateId, user.uid);
  };

  // Global sorted rankings
  const rankedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => b.votesCount - a.votesCount);
  }, [candidates]);

  const globalRankMap = useMemo(() => {
    const map = new Map<string, number>();
    rankedCandidates.forEach((c, idx) => map.set(c._id, idx + 1));
    return map;
  }, [rankedCandidates]);

  const totalVotes = useMemo(
    () => candidates.reduce((sum, c) => sum + c.votesCount, 0),
    [candidates]
  );

  const maxVotes = useMemo(
    () => Math.max(1, ...candidates.map((c) => c.votesCount)),
    [candidates]
  );

  const filteredCandidates = useMemo(() => {
    if (filter === 'one-of-one') {
      return rankedCandidates.filter((c) => c.tierSuggestion === 'one-of-one');
    }
    if (filter === 'small-batch') {
      return rankedCandidates.filter((c) => c.tierSuggestion === 'small-batch');
    }
    return rankedCandidates;
  }, [rankedCandidates, filter]);

  const countdown = useMemo(() => {
    if (!mounted || closeTimestamp === null || nowMs === null) {
      return { days: '04', hours: '11', minutes: '42', seconds: '00' };
    }
    return getCountdownParts(closeTimestamp, nowMs);
  }, [mounted, closeTimestamp, nowMs]);

  const qualifyingFour =
    filter === 'most-voted'
      ? filteredCandidates.slice(0, QUALIFICATION_CUTOFF)
      : filteredCandidates;

  const belowCutoff =
    filter === 'most-voted'
      ? filteredCandidates.slice(QUALIFICATION_CUTOFF)
      : [];

  const renderCandidateCard = (candidate: VoteCandidate) => {
    const rank = globalRankMap.get(candidate._id) ?? 1;
    const rankLabel = `#${String(rank).padStart(2, '0')}`;
    const isQualifying = rank <= QUALIFICATION_CUTOFF;
    const hasVoted = mounted && votedIds.includes(candidate._id);
    const sharePercent =
      totalVotes > 0 ? Math.round((candidate.votesCount / totalVotes) * 100) : 0;
    const barWidth = Math.max(
      8,
      Math.round((candidate.votesCount / maxVotes) * 100)
    );

    return (
      <motion.article
        key={candidate._id}
        layout
        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
        whileHover={{ y: -5 }}
        className="group flex flex-col border-2 border-ink bg-surface stamp-shadow"
      >
        {/* 3:4 Portrait Frame */}
        <div className="relative aspect-[4/5] overflow-hidden border-b-2 border-ink bg-stone">
          <img
            src={candidate.imageUrl}
            alt={candidate.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />

          {/* Big Font-Poster Rank Stamp */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
            <span
              className={cn(
                'border-2 border-ink px-3 py-1 font-poster text-2xl leading-none tracking-tight stamp-shadow-sm',
                isQualifying
                  ? 'bg-orange text-white'
                  : 'bg-surface text-ink'
              )}
            >
              {rankLabel}
            </span>
            {isQualifying && (
              <span className="border-2 border-ink bg-surface px-2 py-1 font-mono text-[9px] font-bold tracking-[0.16em] text-ink uppercase">
                IN CUT
              </span>
            )}
          </div>

          {/* Tier Stamp */}
          <div className="absolute top-3.5 right-3.5">
            {candidate.tierSuggestion === 'one-of-one' ? (
              <span className="border-2 border-ink bg-ink px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.16em] text-paper uppercase">
                1-OF-1
              </span>
            ) : (
              <span className="border-2 border-ink bg-paper px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.16em] text-ink uppercase">
                SMALL-BATCH
              </span>
            )}
          </div>
        </div>

        {/* Card Content */}
        <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
          <div>
            <div className="flex items-center justify-between gap-2 font-mono text-[10px] font-bold tracking-[0.18em] text-muted uppercase">
              <span>{candidate.code}</span>
              <span className="text-cobalt">
                {formatHandle(candidate.creatorHandle)}
              </span>
            </div>

            <h3 className="mt-2 font-poster text-3xl leading-[0.95] tracking-tight text-ink uppercase">
              {candidate.title}
            </h3>

            <p className="mt-1 font-mono text-[11px] font-bold text-muted uppercase">
              BY {candidate.creatorName}
            </p>

            <p className="mt-3 font-sans text-xs leading-relaxed text-muted sm:text-sm">
              {candidate.description}
            </p>

            {/* Craftsmanship Pills */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {candidate.craftsmanship.map((spec) => (
                <span
                  key={spec}
                  className="border border-ink bg-stone px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.1em] text-ink uppercase"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>

          {/* Progress Bar + Tactile UPVOTE Button */}
          <div className="mt-6 border-t-2 border-ink pt-4">
            <div className="flex items-baseline justify-between font-mono text-xs font-bold">
              <span className="text-ink">
                {candidate.votesCount.toLocaleString('en-IN')} VOTES
              </span>
              <span
                className={cn(isQualifying ? 'text-orange' : 'text-muted')}
              >
                {sharePercent}% SHARE
              </span>
            </div>

            {/* Chunky Animated Progress Bar */}
            <div className="mt-2 h-3 w-full overflow-hidden border-2 border-ink bg-stone">
              <motion.div
                initial={false}
                animate={{ width: `${barWidth}%` }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                className={cn(
                  'h-full',
                  isQualifying ? 'bg-orange' : 'bg-ink'
                )}
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              disabled={submittingId === candidate._id}
              onClick={() => handleVoteClick(candidate._id)}
              className={cn(
                'mt-4 flex w-full cursor-pointer items-center justify-center gap-2 border-2 border-ink px-4 py-3 font-mono text-xs font-bold tracking-[0.18em] uppercase transition-colors disabled:opacity-50',
                hasVoted
                  ? 'bg-ink text-paper hover:bg-ink/90'
                  : 'bg-surface text-ink stamp-shadow-sm hover:bg-orange hover:text-white'
              )}
            >
              {hasVoted ? (
                <>
                  <Check className="h-4 w-4 text-orange" />
                  <span>VOTED ✓</span>
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4" />
                  <span>UPVOTE +1</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.article>
    );
  };

  const filterTabs: { id: VoteFilter; label: string }[] = [
    { id: 'most-voted', label: 'TOP RANKED' },
    { id: 'one-of-one', label: '1-OF-1' },
    { id: 'small-batch', label: 'SMALL-BATCH' },
  ];

  return (
    <div className="min-h-screen bg-paper bg-draft-grid pt-24 pb-28 text-ink">
      {/* Tactile Floating Toast (clears bottom dock cleanly) */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key="vote-toast"
            initial={{ opacity: 0, y: 18, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="fixed right-4 bottom-24 z-40 border-2 border-ink bg-ink px-4 py-3 font-mono text-xs font-bold tracking-[0.14em] text-paper uppercase stamp-shadow-orange sm:right-6"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        {/* Brutalist Poster Header */}
        <header className="flex flex-col justify-between gap-6 border-b-2 border-ink pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 border-2 border-ink bg-orange px-3.5 py-1.5 text-white stamp-shadow-sm">
              <Flame className="h-3.5 w-3.5 fill-current" />
              <span className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase">
                LIVE COMMUNITY BALLOT // DROP 02
              </span>
            </div>

            <h1 className="mt-5 font-poster text-6xl leading-[0.88] tracking-tight text-ink uppercase sm:text-8xl lg:text-[112px]">
              VOTE DROP 02<span className="text-orange">.</span>
            </h1>

            <p className="mt-3 font-poster text-2xl tracking-wide text-ink uppercase sm:text-3xl">
              TOP 4 GET CUT &amp; SEWN.
            </p>
          </div>

          <div className="max-w-xs border-2 border-ink bg-surface p-4 stamp-shadow-sm">
            <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-orange uppercase">
              HOW IT WORKS
            </p>
            <p className="mt-1 font-sans text-sm font-medium leading-snug text-ink">
              Upvote your favorites. Top 4 enter physical sample prototyping at
              our studio. Rest stay archived.
            </p>
          </div>
        </header>

        {/* Bold 3-Col Stats Strip */}
        <div className="mt-8 grid grid-cols-1 divide-y-2 divide-ink border-2 border-ink bg-surface stamp-shadow sm:grid-cols-3 sm:divide-x-2 sm:divide-y-0">
          <div className="p-5 sm:p-6">
            <p className="font-mono text-[10px] font-bold tracking-[0.22em] text-muted uppercase">
              TOTAL VOTES
            </p>
            <p className="mt-1.5 font-poster text-4xl leading-none tracking-tight text-ink sm:text-5xl">
              {totalVotes.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <p className="font-mono text-[10px] font-bold tracking-[0.22em] text-muted uppercase">
              PRODUCTION CUT-OFF
            </p>
            <p className="mt-1.5 font-poster text-4xl leading-none tracking-tight text-orange sm:text-5xl">
              CUT-OFF: TOP 4
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <p className="font-mono text-[10px] font-bold tracking-[0.22em] text-muted uppercase">
              BALLOT CLOSES IN
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-cobalt sm:text-3xl">
              {countdown.days}D:{countdown.hours}H:{countdown.minutes}M:
              {countdown.seconds}S
            </p>
          </div>
        </div>

        {/* Spring Filter Tabs + Voter Pass Indicator */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <nav
            aria-label="Ballot filter tabs"
            className="inline-flex flex-wrap items-center gap-1 border-2 border-ink bg-surface p-1 stamp-shadow-sm"
          >
            {filterTabs.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    'relative cursor-pointer px-4 py-2 font-mono text-[11px] font-bold tracking-[0.16em] uppercase transition-colors',
                    active ? 'text-paper' : 'text-ink hover:text-orange'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="vote-filter-pill"
                      transition={{
                        type: 'spring',
                        stiffness: 460,
                        damping: 32,
                      }}
                      className="absolute inset-0 bg-ink"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {mounted && user ? (
              <div className="border-2 border-ink bg-surface px-4 py-2 font-mono text-[11px] font-bold tracking-[0.16em] text-ink uppercase stamp-shadow-sm">
                YOUR VOTES:{' '}
                <span className="text-orange">{votedIds.length}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="cursor-pointer border-2 border-ink bg-surface px-4 py-2 font-mono text-[11px] font-bold tracking-[0.16em] text-ink uppercase stamp-shadow-sm transition-colors hover:bg-orange hover:text-white"
              >
                SIGN IN TO VOTE →
              </button>
            )}
          </div>
        </div>

        {/* Live Animated Ranking Grid */}
        <LayoutGroup>
          <div className="mt-8 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {qualifyingFour.map((candidate) => renderCandidateCard(candidate))}
          </div>

          {/* Unmissable Dashed Orange CUT-OFF LINE after Rank 4 */}
          {filter === 'most-voted' && belowCutoff.length > 0 && (
            <>
              <div className="my-12 border-y-2 border-dashed border-orange bg-orange/10 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-[0.18em] text-orange uppercase">
                    <ArrowUp className="h-4 w-4" />
                    QUALIFIED
                  </span>

                  <div className="inline-flex items-center gap-2 border-2 border-orange bg-surface px-4 py-1.5 font-mono text-xs font-bold tracking-[0.2em] text-orange uppercase stamp-shadow-sm">
                    <Scissors className="h-3.5 w-3.5" />
                    <span>
                      CUT-OFF LINE — TOP 4 ENTER SAMPLE PRODUCTION
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-[0.18em] text-ink uppercase">
                    ON THE BUBBLE
                    <ArrowDown className="h-4 w-4" />
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
                {belowCutoff.map((candidate) => renderCandidateCard(candidate))}
              </div>
            </>
          )}
        </LayoutGroup>

        {/* Bold Bottom Creator CTA */}
        <section className="mt-16 border-2 border-ink bg-ink p-7 text-paper stamp-shadow-orange sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <span className="inline-block bg-orange px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.22em] text-white uppercase">
                OPEN CALL
              </span>
              <h2 className="mt-3 font-poster text-4xl leading-none tracking-tight text-paper uppercase sm:text-6xl">
                GOT A HARDER SILHOUETTE?
              </h2>
              <p className="mt-2 font-mono text-xs tracking-[0.14em] text-paper/75 uppercase">
                WE PRODUCE IT · YOUR NAME ON THE TAG · FULL PROMO + ROYALTY
              </p>
            </div>

            <Link
              href="/submit"
              className="inline-flex items-center gap-2.5 border-2 border-paper bg-orange px-6 py-4 font-mono text-xs font-bold tracking-[0.18em] text-white uppercase transition-transform hover:-translate-y-0.5 hover:bg-surface hover:text-ink"
            >
              <span>DROP YOUR DESIGN</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
