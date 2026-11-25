"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  Layers,
  Loader2,
  Lock,
  LogOut,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Unlock,
  Vote,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStorefrontConfig } from "@/context/StorefrontConfigContext";
import { useVault } from "@/context/VaultContext";
import { computeCoreLaunchDate } from "@/lib/core-catalog";
import {
  cleanFlagshipText,
  formatDropEditionLabel,
  getFlagshipCleanImage,
} from "@/lib/flagship-media";
import type { DropCampaign, VoteCandidate } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";

type ProfileTab = "access" | "orders" | "votes" | "submissions";

type OrderStage =
  | "confirmed"
  | "pattern_cut"
  | "stitching"
  | "quality_check"
  | "dispatched";

interface ProfileWaitlistRecord {
  _id: string;
  name: string;
  email: string;
  position: number;
  status: "queued" | "invited" | "entered";
  joinedAt: string;
}

interface ProfileOrderItem {
  title?: string;
  serialCode?: string;
  size?: string;
  quantity?: number;
  priceInr?: number;
}

interface ProfileOrderRecord {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmountInr: number;
  status: OrderStage;
  paymentId: string;
  shippingAddress: string;
  items: ProfileOrderItem[];
  createdAt: string;
}

interface ProfileSubmissionRecord {
  _id: string;
  title: string;
  creatorName: string;
  creatorHandle: string;
  category: string;
  craftsmanshipNotes: string;
  status: "pending" | "approved_for_vote" | "selected";
  createdAt: string;
}

interface ProfileVoteRecord {
  _id: string;
  title: string;
  code: string;
  creatorHandle: string;
  tierSuggestion: "small-batch" | "one-of-one";
  votesCount: number;
  imageUrl: string;
}

interface ProfileApiResponse {
  ok: boolean;
  waitlist: ProfileWaitlistRecord | null;
  orders: ProfileOrderRecord[];
  submissions: ProfileSubmissionRecord[];
  votes: ProfileVoteRecord[];
}

const VOTE_STORAGE_KEY = "knitx_flagship_votes";

const ORDER_STAGES: Array<{ id: OrderStage; label: string; short: string }> = [
  { id: "confirmed", label: "Order Confirmed", short: "01 CONFIRMED" },
  { id: "pattern_cut", label: "Pattern Cut", short: "02 CUT" },
  { id: "stitching", label: "Atelier Stitching", short: "03 STITCH" },
  { id: "quality_check", label: "Quality & Numbering", short: "04 QC" },
  { id: "dispatched", label: "Insured Dispatch", short: "05 SHIPPED" },
];

function getStageIndex(stage: OrderStage): number {
  const idx = ORDER_STAGES.findIndex((s) => s.id === stage);
  return idx >= 0 ? idx : 0;
}

function getInitials(name?: string | null, email?: string | null): string {
  const source = (name || email || "KX").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function formatDateLabel(iso?: string): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(ms))
    .toUpperCase();
}

export default function FlagshipProfileClient({
  drop,
  allCandidates,
}: {
  drop: DropCampaign;
  allCandidates: VoteCandidate[];
}) {
  const { user, setAuthModalOpen, logout } = useAuth();
  const { config } = useStorefrontConfig();
  const {
    isVaultUnlocked,
    waitlistPass,
    recentOrder,
    unlockVaultDemo,
    lockVaultPreview,
  } = useVault();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("access");
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileApiResponse | null>(
    null
  );
  const [localVotedIds, setLocalVotedIds] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = window.localStorage.getItem(VOTE_STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setLocalVotedIds(
            parsed.filter((item): item is string => typeof item === "string")
          );
        }
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!user?.email && !user?.uid) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (user.email) params.set("email", user.email);
      if (user.uid) params.set("uid", user.uid);
      const res = await fetch(`/api/profile?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = (await res.json()) as ProfileApiResponse;
        if (json.ok) {
          setProfileData(json);
        }
      }
    } catch {
      // Non-blocking: fall back to client context
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.uid]);

  useEffect(() => {
    if (mounted && user) {
      void fetchProfile();
    } else if (mounted && !user) {
      setProfileData(null);
    }
  }, [mounted, user, fetchProfile]);

  const safeUser = mounted ? user : null;
  const safePass = mounted ? waitlistPass : null;
  const showUnlocked = mounted && isVaultUnlocked;
  const accentColor = mounted ? config.accentColor || "#E11D2E" : "#E11D2E";
  const editionLabel = formatDropEditionLabel(
    (mounted && config.activeDropNumber) || drop.dropNumber
  );

  const isDropLive =
    (mounted && config.dropPhase === "live") || drop.phase === "live";

  const remoteWaitlist = profileData?.waitlist || null;
  const isDropAdmitted =
    showUnlocked ||
    isDropLive ||
    remoteWaitlist?.status === "invited" ||
    remoteWaitlist?.status === "entered";

  const effectivePosition =
    remoteWaitlist?.position || safePass?.position || null;
  const effectiveJoinedAt =
    remoteWaitlist?.joinedAt || safePass?.joinedAt || "";

  const effectiveCoreMode = mounted ? config.coreAccessMode : "community";
  const hasCoreAccess = useMemo(() => {
    if (!mounted) return false;
    if (effectiveCoreMode === "open") return true;
    if (effectiveCoreMode === "locked") return isDropAdmitted;
    return (
      isDropAdmitted ||
      Boolean(remoteWaitlist) ||
      Boolean(safePass) ||
      Boolean(safeUser)
    );
  }, [
    mounted,
    effectiveCoreMode,
    isDropAdmitted,
    remoteWaitlist,
    safePass,
    safeUser,
  ]);

  const coreLaunchDateLabel = useMemo(() => {
    if (!mounted) return "";
    const iso = computeCoreLaunchDate(
      config.dropLaunchDate || drop.launchDate,
      config.coreLaunchOffsetDays,
      config.coreLaunchDateOverride
    );
    return formatDateLabel(iso);
  }, [
    mounted,
    config.dropLaunchDate,
    drop.launchDate,
    config.coreLaunchOffsetDays,
    config.coreLaunchDateOverride,
  ]);

  const mergedVotes = useMemo<ProfileVoteRecord[]>(() => {
    const byId = new Map<string, ProfileVoteRecord>();
    for (const remote of profileData?.votes || []) {
      byId.set(remote._id, remote);
    }
    for (const id of localVotedIds) {
      if (byId.has(id)) continue;
      const matched = allCandidates.find((c) => c._id === id);
      if (matched) {
        byId.set(matched._id, {
          _id: matched._id,
          title: matched.title,
          code: matched.code,
          creatorHandle: matched.creatorHandle,
          tierSuggestion: matched.tierSuggestion,
          votesCount: matched.votesCount,
          imageUrl: matched.imageUrl,
        });
      }
    }
    return Array.from(byId.values());
  }, [profileData?.votes, localVotedIds, allCandidates]);

  const orders = useMemo<ProfileOrderRecord[]>(() => {
    const base = profileData?.orders || [];
    if (
      mounted &&
      recentOrder &&
      !base.some((o) => o.orderNumber === recentOrder.orderNumber)
    ) {
      return [
        {
          _id: `local-${recentOrder.orderNumber}`,
          orderNumber: recentOrder.orderNumber,
          customerName: recentOrder.customerName,
          customerEmail: recentOrder.customerEmail,
          totalAmountInr: recentOrder.totalAmountInr,
          status: "confirmed",
          paymentId: recentOrder.paymentId,
          shippingAddress: "India",
          items: recentOrder.items.map((item) => ({
            title: item.product.title,
            serialCode: item.product.serialCode,
            size: item.size,
            quantity: item.quantity,
            priceInr: item.product.priceInr,
          })),
          createdAt: recentOrder.createdAt,
        },
        ...base,
      ];
    }
    return base;
  }, [profileData?.orders, mounted, recentOrder]);
  const submissions = profileData?.submissions || [];

  // =========================================================================
  // UNAUTHENTICATED MEMBER GATE
  // =========================================================================
  if (!safeUser) {
    return (
      <section className="flex min-h-[calc(100svh-3.75rem)] flex-col justify-center bg-[#FFFFFF] px-4 py-12 text-[#000000] sm:px-8 sm:py-20">
        <div className="mx-auto w-full max-w-xl text-center">
          <div className="inline-flex items-center justify-center gap-2 font-mono text-[10px] font-semibold tracking-[0.22em] text-[#666666] uppercase">
            <span
              aria-hidden="true"
              style={{ backgroundColor: accentColor }}
              className="h-2 w-2 shrink-0"
            />
            <span>KNITX MEMBER ACCOUNT · PRIVATE HUB</span>
          </div>

          <h1 className="mt-4 font-poster text-4xl leading-[0.9] tracking-[0.01em] text-[#000000] uppercase sm:text-6xl">
            YOUR KNITX PROFILE
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#666666]">
            Sign in to check your live drop access, waitlist pass, KNITX CORE
            eligibility, cut-to-order garment tracking, community votes, and
            creator pitches — all synced directly to your account with zero
            access codes.
          </p>

          <div className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex min-h-[48px] flex-1 cursor-pointer items-center justify-center gap-2 bg-[#000000] px-6 py-3.5 font-mono text-[11px] font-bold tracking-[0.18em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85"
            >
              <span>SIGN IN / CREATE ACCOUNT</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <Link
              href="/#waitlist"
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 border border-[#000000] bg-[#FFFFFF] px-6 py-3.5 font-mono text-[11px] font-bold tracking-[0.18em] text-[#000000] uppercase transition-colors hover:bg-[#000000] hover:text-[#FFFFFF]"
            >
              <span>JOIN WAITLIST</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 border-t border-black/10 pt-6 font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase">
            <Link href="/drops" className="transition-colors hover:text-black">
              CURRENT DROP
            </Link>
            <span aria-hidden="true" className="text-black/20">
              ·
            </span>
            <Link href="/core" className="transition-colors hover:text-black">
              KNITX CORE
            </Link>
            <span aria-hidden="true" className="text-black/20">
              ·
            </span>
            <Link href="/vote" className="transition-colors hover:text-black">
              VOTE NEXT DROP
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // =========================================================================
  // AUTHENTICATED MEMBER PROFILE HUB
  // =========================================================================
  const initials = getInitials(safeUser.displayName, safeUser.email);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#FFFFFF] text-[#000000]">
      {/* Architectural Member Header */}
      <header className="border-b border-black/10 bg-[#FFFFFF] py-10 sm:py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4 sm:gap-6">
              {/* Architectural Monogram Square */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-[#000000] font-syne text-xl font-extrabold tracking-[0.06em] text-[#FFFFFF] uppercase sm:h-20 sm:w-20 sm:text-2xl">
                {initials}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.18em] text-[#666666] uppercase">
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: accentColor }}
                    className="h-2 w-2 shrink-0"
                  />
                  <span>
                    {isDropAdmitted
                      ? `${editionLabel} · ADMITTED COLLECTOR`
                      : "KNITX COMMUNITY MEMBER"}
                  </span>
                </div>

                <h1 className="mt-2 truncate font-syne text-2xl leading-tight font-extrabold tracking-[-0.02em] text-[#000000] uppercase sm:text-4xl">
                  {safeUser.displayName || "KNITX MEMBER"}
                </h1>

                <p className="mt-1 break-all font-mono text-xs text-[#666666]">
                  {safeUser.email}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => void fetchProfile()}
                disabled={loading}
                className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 border border-black/15 bg-[#FFFFFF] px-4 py-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#000000] uppercase transition-colors hover:border-[#000000] disabled:opacity-50"
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", loading ? "animate-spin" : "")}
                />
                <span>{loading ? "SYNCING" : "SYNC STATUS"}</span>
              </button>

              <button
                type="button"
                suppressHydrationWarning
                onClick={() => void logout()}
                className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 border border-[#000000] bg-[#000000] px-4 py-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>SIGN OUT</span>
              </button>
            </div>
          </div>

          {/* 4-Column Architectural Status Strip */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-4 lg:grid-cols-4">
            <div className="border border-black/10 bg-[#F4F4F5] p-4 sm:p-5">
              <p className="font-mono text-[9px] tracking-[0.18em] text-[#666666] uppercase">
                {editionLabel} ACCESS
              </p>
              <div className="mt-2 flex items-center gap-2">
                {isDropAdmitted ? (
                  <Unlock
                    style={{ color: accentColor }}
                    className="h-4 w-4 shrink-0"
                  />
                ) : (
                  <Lock className="h-4 w-4 shrink-0 text-[#666666]" />
                )}
                <span className="font-syne text-sm font-extrabold tracking-[-0.01em] text-[#000000] uppercase sm:text-base">
                  {isDropAdmitted ? "UNLOCKED" : "WAITLISTED"}
                </span>
              </div>
              <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-[#666666] uppercase">
                {effectivePosition
                  ? `QUEUE #${String(effectivePosition).padStart(4, "0")}`
                  : isDropAdmitted
                    ? "ACCOUNT VERIFIED"
                    : "JOIN WAITLIST"}
              </p>
            </div>

            <div className="border border-black/10 bg-[#F4F4F5] p-4 sm:p-5">
              <p className="font-mono text-[9px] tracking-[0.18em] text-[#666666] uppercase">
                KNITX CORE
              </p>
              <div className="mt-2 flex items-center gap-2">
                <ShieldCheck
                  style={{ color: hasCoreAccess ? accentColor : "#666666" }}
                  className="h-4 w-4 shrink-0"
                />
                <span className="font-syne text-sm font-extrabold tracking-[-0.01em] text-[#000000] uppercase sm:text-base">
                  {hasCoreAccess ? "ELIGIBLE" : "LOCKED"}
                </span>
              </div>
              <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-[#666666] uppercase">
                {coreLaunchDateLabel
                  ? `WINDOW · ${coreLaunchDateLabel}`
                  : "COMMUNITY PRIORITY"}
              </p>
            </div>

            <div className="border border-black/10 bg-[#F4F4F5] p-4 sm:p-5">
              <p className="font-mono text-[9px] tracking-[0.18em] text-[#666666] uppercase">
                GARMENT ORDERS
              </p>
              <p className="mt-2 font-poster text-2xl leading-none text-[#000000] tabular-nums sm:text-3xl">
                {String(orders.length).padStart(2, "0")}
              </p>
              <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-[#666666] uppercase">
                CUT-TO-ORDER ATELIER
              </p>
            </div>

            <div className="border border-black/10 bg-[#F4F4F5] p-4 sm:p-5">
              <p className="font-mono text-[9px] tracking-[0.18em] text-[#666666] uppercase">
                COMMUNITY ACTIVITY
              </p>
              <p className="mt-2 font-poster text-2xl leading-none text-[#000000] tabular-nums sm:text-3xl">
                {String(mergedVotes.length + submissions.length).padStart(2, "0")}
              </p>
              <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-[#666666] uppercase">
                {mergedVotes.length} VOTES · {submissions.length} PITCHES
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Sticky Section Navigation Tabs */}
      <div className="border-b border-black/10 bg-[#FFFFFF]">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <div className="no-scrollbar -mx-4 flex flex-nowrap items-center gap-1 overflow-x-auto px-4 sm:mx-0 sm:gap-2 sm:px-0">
            {(
              [
                { id: "access", label: "ACCESS & PASS" },
                { id: "orders", label: `ORDERS (${orders.length})` },
                { id: "votes", label: `MY VOTES (${mergedVotes.length})` },
                {
                  id: "submissions",
                  label: `SUBMISSIONS (${submissions.length})`,
                },
              ] as const
            ).map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative min-h-[50px] shrink-0 cursor-pointer whitespace-nowrap px-4 py-3 font-mono text-[11px] font-semibold tracking-[0.16em] uppercase transition-colors",
                    isSelected
                      ? "text-[#000000]"
                      : "text-[#666666] hover:text-[#000000]"
                  )}
                >
                  <span>{tab.label}</span>
                  {isSelected ? (
                    <span
                      style={{ backgroundColor: accentColor }}
                      className="absolute inset-x-0 bottom-0 h-[2px]"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content Area */}
      <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-8 sm:py-14 lg:px-12">
        {loading && !profileData ? (
          <div className="flex items-center justify-center gap-3 border border-black/10 bg-[#F4F4F5] py-16 font-mono text-xs tracking-[0.16em] text-[#666666] uppercase">
            <Loader2 className="h-4 w-4 animate-spin text-[#000000]" />
            <span>SYNCING ACCOUNT LEDGER…</span>
          </div>
        ) : null}

        {/* TAB 1: ACCESS & PASS */}
        {activeTab === "access" ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Limited Drop Account Access Card */}
            <div className="flex flex-col justify-between border border-black/15 bg-[#FFFFFF] p-6 sm:p-8">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-4">
                  <span className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase">
                    <span
                      aria-hidden="true"
                      style={{ backgroundColor: accentColor }}
                      className="h-2 w-2"
                    />
                    <span>{editionLabel} · DROP ACCESS</span>
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.16em] uppercase",
                      isDropAdmitted
                        ? "bg-[#000000] text-[#FFFFFF]"
                        : "bg-[#F4F4F5] text-[#666666]"
                    )}
                  >
                    {isDropAdmitted ? "ACCESS ACTIVE" : "PENDING ADMISSION"}
                  </span>
                </div>

                <h2 className="mt-5 font-syne text-2xl font-extrabold tracking-[-0.02em] text-[#000000] uppercase">
                  {isDropAdmitted
                    ? "Your account has full drop access."
                    : "Account-based waitlist pass."}
                </h2>

                <p className="mt-2.5 text-sm leading-relaxed text-[#666666]">
                  {isDropAdmitted
                    ? "Every unveiled silhouette and product page in the active drop is unlocked directly through your account — no access code required."
                    : "Public designs remain visible on our lookbook cards. Product pages and veiled silhouettes unlock automatically the moment your account receives access or the drop goes live."}
                </p>

                <dl className="mt-6 divide-y divide-black/10 border-y border-black/10 font-mono text-[11px] uppercase">
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-[#666666]">ACCOUNT EMAIL</dt>
                    <dd className="truncate font-semibold text-[#000000] lowercase">
                      {safeUser.email}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-[#666666]">WAITLIST QUEUE</dt>
                    <dd className="font-semibold text-[#000000]">
                      {effectivePosition
                        ? `#${String(effectivePosition).padStart(4, "0")}`
                        : "NOT REGISTERED"}
                    </dd>
                  </div>
                  {effectiveJoinedAt ? (
                    <div className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-[#666666]">REGISTERED ON</dt>
                      <dd className="font-semibold text-[#000000]">
                        {formatDateLabel(effectiveJoinedAt)}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                {isDropAdmitted ? (
                  <Link
                    href="/drops"
                    className="inline-flex min-h-[44px] items-center gap-2 bg-[#000000] px-6 py-3 font-mono text-[11px] font-bold tracking-[0.18em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85"
                  >
                    <span>ENTER CURRENT DROP</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <Link
                    href="/#waitlist"
                    className="inline-flex min-h-[44px] items-center gap-2 bg-[#000000] px-6 py-3 font-mono text-[11px] font-bold tracking-[0.18em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85"
                  >
                    <span>
                      {effectivePosition ? "VIEW WAITLIST" : "JOIN WAITLIST"}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}

                {showUnlocked ? (
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={lockVaultPreview}
                    className="cursor-pointer font-mono text-[10px] tracking-[0.14em] text-[#666666] underline underline-offset-4 transition-colors hover:text-[#000000]"
                  >
                    Lock Local Preview
                  </button>
                ) : !isDropLive ? (
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={unlockVaultDemo}
                    className="cursor-pointer font-mono text-[10px] tracking-[0.14em] text-neutral-400 underline-offset-4 transition-colors hover:text-[#000000] hover:underline"
                  >
                    Preview Unlocked Mode
                  </button>
                ) : null}
              </div>
            </div>

            {/* KNITX CORE Eligibility Card */}
            <div className="flex flex-col justify-between border border-black/15 bg-[#F4F4F5] p-6 sm:p-8">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-4">
                  <span className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase">
                    <Layers className="h-3.5 w-3.5 text-[#000000]" />
                    <span>KNITX CORE · ESSENTIAL WARDROBE</span>
                  </span>
                  <span
                    style={
                      hasCoreAccess
                        ? { backgroundColor: accentColor, color: "#FFFFFF" }
                        : undefined
                    }
                    className={cn(
                      "px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.16em] uppercase",
                      !hasCoreAccess ? "bg-white text-[#666666]" : ""
                    )}
                  >
                    {hasCoreAccess ? "COMMUNITY UNLOCKED" : "WAITLIST REQUIRED"}
                  </span>
                </div>

                <h2 className="mt-5 font-syne text-2xl font-extrabold tracking-[-0.02em] text-[#000000] uppercase">
                  Heavyweight mineral essentials with subtle signature KNITX
                  branding.
                </h2>

                <p className="mt-2.5 text-sm leading-relaxed text-[#666666]">
                  KNITX CORE opens {config.coreLaunchOffsetDays} days after{" "}
                  {editionLabel} exclusively for admitted drop accounts and
                  community waitlist members. Your account status carries over
                  automatically.
                </p>

                <dl className="mt-6 divide-y divide-black/10 border-y border-black/10 font-mono text-[11px] uppercase">
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-[#666666]">ELIGIBILITY</dt>
                    <dd className="font-semibold text-[#000000]">
                      {hasCoreAccess
                        ? "ACTIVE · PRODUCT PAGES OPEN"
                        : "JOIN CORE WAITLIST"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-[#666666]">RELEASE SCHEDULE</dt>
                    <dd className="font-semibold text-[#000000]">
                      {coreLaunchDateLabel ||
                        `+${config.coreLaunchOffsetDays} DAYS POST-DROP`}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-[#666666]">SPECIFICATION</dt>
                    <dd className="font-semibold text-[#000000]">
                      320–480 GSM · 6 MINERAL TONES
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6">
                <Link
                  href="/core"
                  className="inline-flex min-h-[44px] items-center gap-2 bg-[#000000] px-6 py-3 font-mono text-[11px] font-bold tracking-[0.18em] text-[#FFFFFF] uppercase transition-opacity hover:opacity-85"
                >
                  <span>EXPLORE KNITX CORE</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {/* TAB 2: ORDERS & 5-STAGE ATELIER TRACKING */}
        {activeTab === "orders" ? (
          orders.length === 0 ? (
            <div className="border border-black/10 bg-[#F4F4F5] px-6 py-16 text-center">
              <Package className="mx-auto h-8 w-8 text-[#666666]" />
              <h2 className="mt-4 font-syne text-xl font-extrabold tracking-[-0.02em] text-[#000000] uppercase">
                NO GARMENT RESERVATIONS YET
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#666666]">
                Every KNITX piece is cut to order after confirmation. Once you
                claim a silhouette from a live drop or KNITX CORE, track every
                atelier stage right here.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/drops"
                  className="inline-flex min-h-[44px] items-center gap-2 bg-[#000000] px-6 py-3 font-mono text-[11px] font-bold tracking-[0.16em] text-[#FFFFFF] uppercase"
                >
                  <span>EXPLORE DROPS</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/core"
                  className="inline-flex min-h-[44px] items-center gap-2 border border-[#000000] bg-[#FFFFFF] px-6 py-3 font-mono text-[11px] font-bold tracking-[0.16em] text-[#000000] uppercase"
                >
                  <span>EXPLORE CORE</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const currentStageIdx = getStageIndex(order.status);
                return (
                  <article
                    key={order._id}
                    className="border border-black/15 bg-[#FFFFFF] p-5 sm:p-8"
                  >
                    <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-center">
                      <div>
                        <p className="font-mono text-[10px] tracking-[0.18em] text-[#666666] uppercase">
                          ORDER {order.orderNumber} ·{" "}
                          {formatDateLabel(order.createdAt)}
                        </p>
                        <p className="mt-1 font-syne text-xl font-extrabold text-[#000000] uppercase">
                          {ORDER_STAGES[currentStageIdx]?.label}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="font-mono text-lg font-bold text-[#000000] tabular-nums">
                          {formatInr(order.totalAmountInr)}
                        </p>
                        <p className="font-mono text-[10px] tracking-[0.14em] text-[#666666] uppercase">
                          INSURED PAN-INDIA DISPATCH
                        </p>
                      </div>
                    </div>

                    {/* 5-Stage Cut-to-Order Progress Tracker */}
                    <div className="mt-6">
                      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                        {ORDER_STAGES.map((stage, idx) => {
                          const completed = idx <= currentStageIdx;
                          const isCurrent = idx === currentStageIdx;
                          return (
                            <div key={stage.id} className="space-y-2">
                              <div
                                style={
                                  completed
                                    ? {
                                        backgroundColor: isCurrent
                                          ? accentColor
                                          : "#000000",
                                      }
                                    : undefined
                                }
                                className={cn(
                                  "h-1.5 w-full",
                                  !completed ? "bg-black/10" : ""
                                )}
                              />
                              <p
                                className={cn(
                                  "font-mono text-[8px] tracking-[0.1em] uppercase sm:text-[9px] sm:tracking-[0.14em]",
                                  completed
                                    ? "font-semibold text-[#000000]"
                                    : "text-[#666666]"
                                )}
                              >
                                {stage.short}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Line Items */}
                    {order.items.length > 0 ? (
                      <div className="mt-6 divide-y divide-black/10 border-t border-black/10">
                        {order.items.map((item, idx) => (
                          <div
                            key={`${order._id}-item-${idx}`}
                            className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-sans font-semibold text-[#000000] uppercase">
                                {cleanFlagshipText(item.title || "KNITX Piece")}
                              </p>
                              <p className="mt-0.5 font-mono text-[10px] tracking-[0.14em] text-[#666666] uppercase">
                                {item.serialCode ? `${item.serialCode} · ` : ""}
                                SIZE {item.size || "M"} · QTY{" "}
                                {item.quantity || 1}
                              </p>
                            </div>
                            {typeof item.priceInr === "number" ? (
                              <span className="font-mono font-semibold text-[#000000] tabular-nums">
                                {formatInr(item.priceInr)}
                              </span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )
        ) : null}

        {/* TAB 3: MY VOTES */}
        {activeTab === "votes" ? (
          mergedVotes.length === 0 ? (
            <div className="border border-black/10 bg-[#F4F4F5] px-6 py-16 text-center">
              <Vote className="mx-auto h-8 w-8 text-[#666666]" />
              <h2 className="mt-4 font-syne text-xl font-extrabold tracking-[-0.02em] text-[#000000] uppercase">
                NO BALLOT VOTES RECORDED YET
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#666666]">
                Cast your ballot on upcoming creator silhouettes to shape which
                designs enter production for the next KNITX edition.
              </p>
              <Link
                href="/vote"
                className="mt-6 inline-flex min-h-[44px] items-center gap-2 bg-[#000000] px-6 py-3 font-mono text-[11px] font-bold tracking-[0.16em] text-[#FFFFFF] uppercase"
              >
                <span>OPEN NEXT-DROP BALLOT</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-[11px] tracking-[0.16em] text-[#666666] uppercase">
                  SILHOUETTES BACKED BY YOUR ACCOUNT
                </p>
                <Link
                  href="/vote"
                  className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#000000] uppercase underline underline-offset-4"
                >
                  <span>VIEW FULL BALLOT</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {mergedVotes.map((vote, idx) => (
                  <article
                    key={vote._id}
                    className="border border-black/10 bg-[#FFFFFF]"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F4F4F5]">
                      <Image
                        src={getFlagshipCleanImage(vote.imageUrl, idx)}
                        alt={cleanFlagshipText(vote.title)}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover"
                      />
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-[#000000] px-2 py-0.5 font-mono text-[9px] font-semibold tracking-[0.14em] text-[#FFFFFF] uppercase">
                        <Check className="h-2.5 w-2.5" />
                        <span>VOTED</span>
                      </span>
                    </div>

                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2 font-mono text-[10px] tracking-[0.14em] text-[#666666] uppercase">
                        <span>{vote.code}</span>
                        <span
                          style={
                            vote.tierSuggestion === "one-of-one"
                              ? { color: accentColor }
                              : undefined
                          }
                          className="font-semibold text-[#000000]"
                        >
                          {vote.tierSuggestion === "one-of-one"
                            ? "1 OF 1"
                            : "SMALL BATCH"}
                        </span>
                      </div>
                      <h3 className="mt-2 font-syne text-base font-extrabold text-[#000000] uppercase">
                        {cleanFlagshipText(vote.title)}
                      </h3>
                      <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-[#666666]">
                        <span>{vote.creatorHandle}</span>
                        <span className="font-semibold text-[#000000] tabular-nums">
                          {vote.votesCount} VOTES
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )
        ) : null}

        {/* TAB 4: CREATOR SUBMISSIONS */}
        {activeTab === "submissions" ? (
          submissions.length === 0 ? (
            <div className="border border-black/10 bg-[#F4F4F5] px-6 py-16 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-[#666666]" />
              <h2 className="mt-4 font-syne text-xl font-extrabold tracking-[-0.02em] text-[#000000] uppercase">
                NO DESIGN SUBMISSIONS YET
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#666666]">
                Submit an original silhouette concept to the KNITX atelier.
                Selected designs advance to community ballot and earn creator
                credit &amp; royalties.
              </p>
              <Link
                href="/submit"
                className="mt-6 inline-flex min-h-[44px] items-center gap-2 bg-[#000000] px-6 py-3 font-mono text-[11px] font-bold tracking-[0.16em] text-[#FFFFFF] uppercase"
              >
                <span>SUBMIT YOUR DESIGN</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-[11px] tracking-[0.16em] text-[#666666] uppercase">
                  CREATOR RESIDENCY PITCHES
                </p>
                <Link
                  href="/submit"
                  className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#000000] uppercase underline underline-offset-4"
                >
                  <span>NEW SUBMISSION</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              {submissions.map((sub) => (
                <article
                  key={sub._id}
                  className="border border-black/15 bg-[#FFFFFF] p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase">
                        {sub.category} · {sub.creatorHandle} ·{" "}
                        {formatDateLabel(sub.createdAt)}
                      </p>
                      <h3 className="mt-1.5 font-syne text-lg font-extrabold text-[#000000] uppercase">
                        {cleanFlagshipText(sub.title)}
                      </h3>
                    </div>

                    <span
                      style={
                        sub.status === "selected"
                          ? { backgroundColor: accentColor, color: "#FFFFFF" }
                          : undefined
                      }
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase",
                        sub.status === "approved_for_vote"
                          ? "bg-[#000000] text-[#FFFFFF]"
                          : sub.status === "pending"
                            ? "bg-[#F4F4F5] text-[#666666]"
                            : ""
                      )}
                    >
                      <Clock className="h-3 w-3" />
                      <span>
                        {sub.status === "selected"
                          ? "SELECTED FOR DROP"
                          : sub.status === "approved_for_vote"
                            ? "LIVE ON BALLOT"
                            : "UNDER REVIEW"}
                      </span>
                    </span>
                  </div>

                  {sub.craftsmanshipNotes ? (
                    <p className="mt-3 text-sm leading-relaxed text-[#666666]">
                      {cleanFlagshipText(sub.craftsmanshipNotes)}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )
        ) : null}
      </section>
    </div>
  );
}
