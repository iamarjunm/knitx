"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Check,
  Crosshair,
  Eye,
  Flame,
  Loader2,
  Lock,
  ScanLine,
  Scissors,
  Sparkles,
  Ticket,
  Unlock,
  Zap,
} from "lucide-react";
import type {
  DropCampaign,
  Product,
  ProductTier,
  VoteCandidate,
  WaitlistPass,
} from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";

interface HomeClientProps {
  drop: DropCampaign;
  products: Product[];
  candidates: VoteCandidate[];
}

interface CountdownParts {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

type DropBoardTab = "all" | "visible" | "locked";
type TierPanelId = "small-batch" | "one-of-one";

const LEGACY_TO_LIGHT_IMAGE: Record<string, string> = {
  "/images/piece-1of1-kali.png": "/images/look-1of1-jacket.jpg",
  "/images/piece-1of1-monolith.png": "/images/look-1of1-knit.jpg",
  "/images/piece-batch-puff.png": "/images/look-batch-hoodie.jpg",
  "/images/piece-batch-embroidery.png": "/images/look-batch-tee.jpg",
  "/images/piece-mystery-silhouette.png": "/images/look-mystery-veil.jpg",
};

const LIGHT_FALLBACK_CYCLE = [
  "/images/look-1of1-jacket.jpg",
  "/images/look-1of1-knit.jpg",
  "/images/look-batch-hoodie.jpg",
  "/images/look-batch-tee.jpg",
];

const TAPE_TEXT =
  "NO OPEN STORE ✦ WAITLIST ONLY ✦ 3–4 UNITS MAX ✦ 1-OF-1 COLLECTOR ARCHIVE ✦ COMMUNITY VOTED ✦ CUT AFTER YOU ORDER ✦";

const BARCODE_BARS = [
  2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 1, 3, 2, 1, 4, 1, 1, 2, 1, 3, 1, 2, 1, 1, 3, 2,
  1, 2, 4, 1, 1, 2, 1, 3, 1, 2, 1, 1, 2, 3, 1, 2,
];

const SAMPLE_FIRST_STEPS = [
  {
    num: "01",
    title: "TEASE HALF",
    tag: "50 / 50 SPLIT",
    accent: "bg-ink text-paper",
    punch: "5 pieces go public. 5 stay sealed inside the Vault until your number calls.",
    spec: "ZERO FULL-CATALOG SPOILERS",
  },
  {
    num: "02",
    title: "CROWD VOTES",
    tag: "DROP 02 BALLOT",
    accent: "bg-orange text-white",
    punch: "No focus groups. You vote head-to-head. Winning silhouettes enter production.",
    spec: "CREATORS CREDITED + PAID",
  },
  {
    num: "03",
    title: "ONE SAMPLE FOR REELS",
    tag: "STUDIO PROTOTYPE",
    accent: "bg-cobalt text-white",
    punch: "We cut exactly ONE physical piece in-house for fit checks, lookbooks, and reels.",
    spec: "420–480 GSM VERIFIED",
  },
  {
    num: "04",
    title: "CUT AFTER YOU BUY",
    tag: "ZERO DEADSTOCK",
    accent: "bg-ink text-paper",
    punch: "Your numbered garment hits the cutting table only after you lock your allocation.",
    spec: "0% OVERPRODUCTION WASTE",
  },
];

const SPRING_SNAPPY = {
  type: "spring" as const,
  stiffness: 380,
  damping: 28,
};

const SPRING_STAMP = {
  type: "spring" as const,
  stiffness: 460,
  damping: 22,
};

function resolveProductImage(
  url: string | undefined,
  tier: ProductTier,
  index: number
): string {
  if (!url) {
    return tier === "one-of-one"
      ? LIGHT_FALLBACK_CYCLE[index % 2]
      : LIGHT_FALLBACK_CYCLE[2 + (index % 2)];
  }
  return LEGACY_TO_LIGHT_IMAGE[url] ?? url;
}

function resolveCandidateImage(url: string | undefined, index: number): string {
  if (!url) return LIGHT_FALLBACK_CYCLE[index % LIGHT_FALLBACK_CYCLE.length];
  return LEGACY_TO_LIGHT_IMAGE[url] ?? url;
}

function computeCountdown(targetIso: string): CountdownParts {
  const targetMs = new Date(targetIso).getTime();
  const diff = Math.max(0, targetMs - Date.now());
  const totalSec = Math.floor(diff / 1000);

  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    days: pad(days),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
  };
}

/* ========================================================================= */
/* SUBCOMPONENT: INTERACTIVE X-RAY / HOLD-TO-PEEK LOCKED CARD                */
/* ========================================================================= */
interface LockedXRayCardProps {
  product: Product;
  href: string;
}

function LockedXRayCard({ product, href }: LockedXRayCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [peeking, setPeeking] = useState(false);

  const pointerX = useMotionValue(160);
  const pointerY = useMotionValue(200);
  const smoothX = useSpring(pointerX, { stiffness: 320, damping: 28 });
  const smoothY = useSpring(pointerY, { stiffness: 320, damping: 28 });
  const rawRadius = useMotionValue(0);
  const smoothRadius = useSpring(rawRadius, { stiffness: 300, damping: 26 });
  const reticleX = useTransform(smoothX, (v) => v - 48);
  const reticleY = useTransform(smoothY, (v) => v - 48);

  const veilMask = useMotionTemplate`radial-gradient(circle ${smoothRadius}px at ${smoothX}px ${smoothY}px, transparent 0%, rgba(0, 0, 0, 0.12) 48%, black 82%)`;

  useEffect(() => {
    rawRadius.set(peeking ? 118 : 0);
  }, [peeking, rawRadius]);

  const updatePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    pointerX.set(e.clientX - rect.left);
    pointerY.set(e.clientY - rect.top);
  };

  const isOneOfOne = product.tier === "one-of-one";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      whileHover={{ y: -6 }}
      transition={SPRING_SNAPPY}
      className="group"
    >
      <Link href={href} className="block">
        <div
          ref={cardRef}
          onPointerEnter={(e) => {
            updatePointer(e);
            setPeeking(true);
          }}
          onPointerMove={updatePointer}
          onPointerLeave={() => setPeeking(false)}
          onPointerDown={(e) => {
            updatePointer(e);
            setPeeking(true);
          }}
          className="relative aspect-[3/4] w-full overflow-hidden border-2 border-ink bg-surface stamp-shadow select-none"
        >
          {/* Base Hidden Silhouette Revealed by X-Ray Lens */}
          <Image
            src="/images/look-mystery-veil.jpg"
            alt={`Locked Vault Silhouette ${product.serialCode}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover object-center contrast-125 grayscale transition-transform duration-500 group-hover:scale-105"
          />

          {/* Blueprint Scan Tint Inside X-Ray Reveal */}
          <div className="pointer-events-none absolute inset-0 bg-cobalt/10 mix-blend-multiply" />

          {/* Frosted White Archival Veil Punched Through by Cursor Radial Mask */}
          <motion.div
            style={{
              maskImage: veilMask,
              WebkitMaskImage: veilMask,
            }}
            className="pointer-events-none absolute inset-0 bg-paper/92 backdrop-blur-md"
          >
            <div className="h-full w-full bg-draft-grid opacity-80" />
          </motion.div>

          {/* Live Cursor-Tracking X-Ray Reticle */}
          <motion.div
            style={{
              x: reticleX,
              y: reticleY,
              opacity: peeking ? 1 : 0,
              scale: peeking ? 1 : 0.7,
            }}
            transition={{ opacity: { duration: 0.15 }, scale: SPRING_SNAPPY }}
            className="pointer-events-none absolute top-0 left-0 z-20 flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-cobalt bg-cobalt/5"
          >
            <Crosshair className="h-4 w-4 text-cobalt" />
          </motion.div>

          {/* Top Left Serial Sticker */}
          <div className="pointer-events-none absolute top-3 left-3 z-20 flex items-center gap-1.5 border-2 border-ink bg-surface px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.14em] text-ink uppercase stamp-shadow-sm">
            <Lock className="h-3 w-3 text-orange" />
            <span>{product.serialCode}</span>
          </div>

          {/* Top Right X-Ray Prompt Pill */}
          <div className="pointer-events-none absolute top-3 right-3 z-20 flex items-center gap-1 border border-ink bg-paper/95 px-2 py-1 font-mono text-[9px] font-bold tracking-[0.14em] text-cobalt uppercase">
            <ScanLine className="h-3 w-3" />
            <span>{peeking ? "X-RAY ON" : "HOVER TO PEEK"}</span>
          </div>

          {/* Center Idle Lock Graphic / Active Rubber Stamp Slam */}
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center p-5 text-center">
            <AnimatePresence mode="wait">
              {peeking ? (
                <motion.div
                  key="stamp"
                  initial={{ scale: 1.75, opacity: 0, rotate: -18 }}
                  animate={{ scale: 1, opacity: 1, rotate: -7 }}
                  exit={{ scale: 0.85, opacity: 0, rotate: -2 }}
                  transition={SPRING_STAMP}
                  className="border-[3px] border-orange bg-surface/95 px-4 py-2.5 text-center stamp-shadow-sm"
                >
                  <p className="font-poster text-xl leading-none tracking-wide text-orange uppercase sm:text-2xl">
                    SEALED
                  </p>
                  <p className="mt-1 font-mono text-[9px] font-bold tracking-[0.16em] text-ink uppercase">
                    CLEAR THE LINE TO SEE
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center border-2 border-ink bg-surface stamp-shadow-sm">
                    <Eye className="h-5 w-5 text-ink" />
                  </div>
                  <p className="mt-3 font-poster text-2xl leading-none tracking-wide text-ink uppercase">
                    LOCKED PIECE
                  </p>
                  <p className="mt-1.5 font-mono text-[10px] font-bold tracking-[0.16em] text-muted uppercase">
                    MOVE CURSOR / HOLD TO X-RAY
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Lock Strip */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between border-t-2 border-ink bg-ink px-3 py-2 font-mono text-[10px] font-bold tracking-[0.14em] text-paper uppercase">
            <span>{isOneOfOne ? "1-OF-1 SEALED" : "3–4 UNITS SEALED"}</span>
            <span className="text-orange">UNLOCK →</span>
          </div>
        </div>

        {/* Below-Card Spec Row */}
        <div className="mt-3.5 flex items-start justify-between gap-2 px-0.5">
          <div className="min-w-0">
            <p className="truncate font-poster text-xl leading-tight tracking-wide text-ink uppercase">
              CLASSIFIED {product.serialCode}
            </p>
            <p className="mt-0.5 font-mono text-[10px] font-bold tracking-[0.12em] text-muted uppercase">
              {product.gsmWeight} · VAULT ONLY
            </p>
          </div>
          <span className="shrink-0 border border-ink bg-stone px-2 py-0.5 font-mono text-[10px] font-bold text-ink uppercase">
            SEALED
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

/* ========================================================================= */
/* SUBCOMPONENT: 3D-TILT THERMAL WAITLIST TICKET STUB                        */
/* ========================================================================= */
interface ThermalTicketStubProps {
  pass: WaitlistPass;
  isVaultUnlocked: boolean;
  onSimulateCall: () => void;
}

function ThermalTicketStub({
  pass,
  isVaultUnlocked,
  onSimulateCall,
}: ThermalTicketStubProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, { stiffness: 260, damping: 24 });
  const rotateY = useSpring(rawRotateY, { stiffness: 260, damping: 24 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = ticketRef.current?.getBoundingClientRect();
    if (!rect) return;
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;
    rawRotateY.set(normX * 16);
    rawRotateX.set(-normY * 14);
  };

  const handlePointerLeave = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
  };

  return (
    <div style={{ perspective: 1100 }} className="relative">
      {/* Printer Feed Slot Header */}
      <div className="relative z-20 mx-auto flex w-[94%] items-center justify-between border-2 border-ink bg-ink px-4 py-2 font-mono text-[10px] font-bold tracking-[0.18em] text-paper uppercase">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-orange" />
          THERMAL STUB PRINTED
        </span>
        <span className="text-orange">DROP 01 // INDIA</span>
      </div>

      {/* Physical Sliding Perforated Stub with 3D Hover Tilt */}
      <motion.div
        ref={ticketRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        initial={{ y: -48, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative z-10 -mt-1 border-2 border-ink bg-surface pt-5 stamp-shadow"
      >
        {/* Top Perforated Zig-Zag Strip */}
        <div className="ticket-perforated pointer-events-none absolute inset-x-0 top-0 h-3" />

        <div className="px-6 pt-3 pb-6 sm:px-8 sm:pb-7">
          {/* Stub Meta Top Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-ink/30 pb-4">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-orange" />
              <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-ink uppercase">
                KNITX® QUEUE PASS
              </span>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 border border-ink px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.16em] uppercase",
                isVaultUnlocked
                  ? "bg-orange text-white"
                  : "bg-paper text-cobalt"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isVaultUnlocked ? "bg-white" : "bg-cobalt"
                )}
              />
              {isVaultUnlocked ? "NUMBER CALLED · OPEN" : "IN LINE · ACTIVE"}
            </span>
          </div>

          {/* Giant Queue Number Display */}
          <div className="flex flex-col items-start justify-between gap-4 py-6 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-muted uppercase">
                YOUR LINE NUMBER
              </p>
              <p className="mt-1 font-poster text-7xl leading-[0.86] tracking-tight text-ink sm:text-8xl">
                #{pass.position.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="border-2 border-ink bg-paper px-3 py-2 text-left sm:text-right">
              <p className="font-mono text-[9px] font-bold tracking-[0.18em] text-muted uppercase">
                ACCESS CODE
              </p>
              <p className="mt-0.5 font-mono text-sm font-bold tracking-[0.14em] text-orange uppercase">
                {pass.accessCode}
              </p>
            </div>
          </div>

          {/* Collector Details Grid */}
          <div className="grid grid-cols-1 gap-3 border-y-2 border-dashed border-ink/30 py-4 sm:grid-cols-2">
            <div>
              <p className="font-mono text-[9px] font-bold tracking-[0.18em] text-muted uppercase">
                HOLDER
              </p>
              <p className="mt-0.5 truncate text-sm font-bold text-ink uppercase">
                {pass.name}
              </p>
            </div>
            <div>
              <p className="font-mono text-[9px] font-bold tracking-[0.18em] text-muted uppercase">
                ALERT EMAIL
              </p>
              <p className="mt-0.5 truncate font-mono text-xs text-ink">
                {pass.email}
              </p>
            </div>
          </div>

          {/* Crisp Deterministic Thermal Barcode */}
          <div className="mt-5 flex flex-col items-center border border-ink/20 bg-paper px-4 py-3">
            <div
              aria-hidden="true"
              className="flex h-11 w-full items-stretch justify-between gap-[2px]"
            >
              {BARCODE_BARS.map((width, idx) => (
                <span
                  key={idx}
                  style={{ flexGrow: width }}
                  className={cn(
                    "h-full",
                    idx % 2 === 0 ? "bg-ink" : "bg-transparent"
                  )}
                />
              ))}
            </div>
            <p className="mt-2 font-mono text-[10px] font-bold tracking-[0.32em] text-muted uppercase">
              KX-D01-{String(pass.position).padStart(4, "0")}-{pass.accessCode}
            </p>
          </div>

          {/* Instant Action CTA */}
          <div className="mt-6">
            {isVaultUnlocked ? (
              <Link
                href="/vault"
                className="flex w-full items-center justify-center gap-2 border-2 border-ink bg-orange px-5 py-4 font-mono text-xs font-bold tracking-[0.16em] text-white uppercase stamp-shadow-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
              >
                <Unlock className="h-4 w-4" />
                <span>ENTER THE DROP 01 VAULT NOW</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSimulateCall}
                className="flex w-full cursor-pointer items-center justify-center gap-2 border-2 border-ink bg-orange px-5 py-4 font-mono text-xs font-bold tracking-[0.14em] text-white uppercase stamp-shadow-sm transition-colors hover:bg-ink"
              >
                <Zap className="h-4 w-4" />
                <span>SIMULATE: CALL MY NUMBER NOW →</span>
              </motion.button>
            )}
            <p className="mt-2.5 text-center font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
              {isVaultUnlocked
                ? "ALL 10 PIECES UNLOCKED FOR YOUR SESSION"
                : "DEMO PREVIEW · INSTANTLY UNLOCKS ALL 5 HIDDEN PIECES"}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ========================================================================= */
/* MAIN COMPONENT: KNITX DROP 01 KINETIC HOME EXPERIENCE                     */
/* ========================================================================= */
export default function HomeClient({
  drop,
  products,
  candidates,
}: HomeClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    waitlistPass,
    isVaultUnlocked,
    joinWaitlist,
    unlockVaultDemo,
    unlockVaultWithCode,
  } = useVault();

  // Hydration & Countdown State
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState<CountdownParts | null>(null);

  // Section 3: Drop Board Filter State
  const [dropTab, setDropTab] = useState<DropBoardTab>("all");

  // Section 4: Expandable Tier Split State
  const [activeTier, setActiveTier] = useState<TierPanelId>("small-batch");

  // Section 5: Waitlist Form & Code State
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  // Section 6: Playable Head-to-Head Voting Duel State
  const [duelVotes, setDuelVotes] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const c of candidates) {
      map[c._id] = c.votesCount;
    }
    return map;
  });
  const [matchupIndex, setMatchupIndex] = useState(0);
  const [duelPickedId, setDuelPickedId] = useState<string | null>(null);
  const [duelSubmitting, setDuelSubmitting] = useState(false);

  // Section 1: Hero Scroll Choreography
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const smoothHeroProgress = useSpring(heroScrollProgress, {
    stiffness: 140,
    damping: 26,
    mass: 0.4,
  });
  const line1X = useTransform(smoothHeroProgress, [0, 1], [0, -140]);
  const line2X = useTransform(smoothHeroProgress, [0, 1], [0, 140]);
  const line3Scale = useTransform(smoothHeroProgress, [0, 0.7], [1, 0.94]);
  const frameScale = useTransform(smoothHeroProgress, [0, 0.55], [0.94, 1.02]);
  const frameY = useTransform(smoothHeroProgress, [0, 0.6], [12, -16]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setCountdown(computeCountdown(drop.launchDate));
    const timer = window.setInterval(() => {
      setCountdown(computeCountdown(drop.launchDate));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mounted, drop.launchDate]);

  useEffect(() => {
    if (mounted && user) {
      setWaitlistName((prev) => prev || user.displayName || "");
      setWaitlistEmail((prev) => prev || user.email || "");
    }
  }, [mounted, user]);

  const safeVaultUnlocked = mounted && isVaultUnlocked;
  const safeWaitlistPass = mounted ? waitlistPass : null;

  const visibleCount = useMemo(
    () => products.filter((p) => !p.isMystery || safeVaultUnlocked).length,
    [products, safeVaultUnlocked]
  );
  const lockedCount = useMemo(
    () => products.filter((p) => p.isMystery && !safeVaultUnlocked).length,
    [products, safeVaultUnlocked]
  );

  const filteredProducts = useMemo(() => {
    if (dropTab === "visible") {
      return products.filter((p) => !p.isMystery || safeVaultUnlocked);
    }
    if (dropTab === "locked") {
      return products.filter((p) => p.isMystery && !safeVaultUnlocked);
    }
    return products;
  }, [products, dropTab, safeVaultUnlocked]);

  const claimedSpots = safeWaitlistPass
    ? Math.max(drop.waitlistCount, safeWaitlistPass.position)
    : drop.waitlistCount;

  const queueProgressPct = Math.min(
    100,
    Math.round((claimedSpots / Math.max(1, drop.totalSlots)) * 100)
  );

  // Build head-to-head matchups from candidates
  const matchups = useMemo(() => {
    if (candidates.length < 2) return [];
    const pairs: Array<[VoteCandidate, VoteCandidate]> = [];
    for (let i = 0; i < candidates.length; i += 2) {
      const left = candidates[i];
      const right = candidates[(i + 1) % candidates.length];
      if (left && right && left._id !== right._id) {
        pairs.push([left, right]);
      }
    }
    // Add a bonus cross-matchup if only 1 pair exists and > 2 candidates
    if (candidates.length >= 3 && pairs.length < 2) {
      pairs.push([candidates[0], candidates[2]]);
    }
    return pairs;
  }, [candidates]);

  const activePair =
    matchups.length > 0 ? matchups[matchupIndex % matchups.length] : null;

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistError(null);

    if (!waitlistName.trim() || !waitlistEmail.trim()) {
      setWaitlistError("DROP YOUR NAME + EMAIL TO PRINT A TICKET.");
      return;
    }

    setWaitlistSubmitting(true);
    try {
      await joinWaitlist(waitlistName.trim(), waitlistEmail.trim());
    } catch (err) {
      setWaitlistError(
        err instanceof Error ? err.message : "TICKET PRINTER JAMMED. TRY AGAIN."
      );
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  const handleUnlockCode = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);
    const ok = unlockVaultWithCode(accessCodeInput);
    if (!ok) {
      setCodeError("BAD CODE. TRY KNITX-001 FOR INSTANT VAULT ACCESS.");
      return;
    }
    router.push("/vault");
  };

  const handleSimulateAdmit = () => {
    unlockVaultDemo();
    router.push("/vault");
  };

  const handleDuelVote = async (candidateId: string) => {
    if (duelPickedId || duelSubmitting) return;
    setDuelPickedId(candidateId);
    setDuelVotes((prev) => ({
      ...prev,
      [candidateId]: (prev[candidateId] ?? 0) + 1,
    }));
    setDuelSubmitting(true);
    try {
      await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          uid: user?.uid,
        }),
      });
    } catch {
      // Optimistic count stays responsive even offline
    } finally {
      setDuelSubmitting(false);
    }
  };

  const handleNextMatchup = () => {
    setDuelPickedId(null);
    setMatchupIndex((prev) => (prev + 1) % Math.max(1, matchups.length));
  };

  return (
    <div className="overflow-x-clip bg-paper text-ink">
      {/* ================================================================= */}
      {/* SECTION 1 — SCROLL-CHOREOGRAPHED POSTER HERO                      */}
      {/* ================================================================= */}
      <section
        ref={heroRef}
        className="relative min-h-screen bg-paper bg-draft-grid pt-24 pb-16 sm:pt-28 sm:pb-24"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          {/* Top Micro-Stamp Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING_SNAPPY}
            className="mb-6 flex flex-wrap items-center justify-between gap-3 border-y-2 border-ink bg-surface px-4 py-2.5 font-mono text-[10px] font-bold tracking-[0.18em] text-ink uppercase sm:text-[11px]"
          >
            <span className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-orange" />
              INDIA // {drop.dropNumber} · {drop.title}
            </span>
            <span className="hidden text-cobalt md:inline">
              WAITLIST-ONLY DROP ENGINE · NO OPEN STORE
            </span>
            <span className="tabular-nums text-orange">
              {claimedSpots.toLocaleString("en-IN")} /{" "}
              {drop.totalSlots.toLocaleString("en-IN")} IN LINE
            </span>
          </motion.div>

          {/* Giant Split Kinetic Headline */}
          <div className="relative z-20 flex flex-col items-center text-center select-none">
            <motion.h1
              aria-label="You can't buy until we call your number."
              className="w-full font-poster text-[13vw] leading-[0.86] tracking-[-0.015em] uppercase sm:text-[10.5vw] lg:text-[8.5rem]"
            >
              <motion.span
                style={{ x: line1X }}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="block text-ink"
              >
                YOU CAN&apos;T BUY
              </motion.span>

              <motion.span
                style={{ x: line2X }}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.65,
                  delay: 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="block text-orange"
              >
                UNTIL WE CALL
              </motion.span>

              <motion.span
                style={{ scale: line3Scale }}
                initial={{ opacity: 0, y: 24, rotate: -2 }}
                animate={{ opacity: 1, y: 0, rotate: -1 }}
                transition={{ ...SPRING_STAMP, delay: 0.16 }}
                className="mt-2 inline-block border-2 border-ink bg-ink px-5 py-1.5 text-paper stamp-shadow-orange sm:px-8 sm:py-2"
              >
                YOUR NUMBER.
              </motion.span>
            </motion.h1>
          </div>

          {/* Scroll-Expanding Lookbook Frame Overlapping the Typography */}
          <motion.div
            style={{ scale: frameScale, y: frameY }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mx-auto -mt-3 max-w-[1260px] sm:-mt-6"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden border-2 border-ink bg-stone stamp-shadow sm:aspect-[16/10] lg:aspect-[16/9]">
              <Image
                src="/images/hero-editorial-light.jpg"
                alt="KNITX Drop 01 Archival Streetwear Lookbook"
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1260px"
                className="object-cover object-center"
              />

              {/* Subtle Archival Vignette Only at Bottom for Crisp Stamp Readability */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-ink/55 via-ink/20 to-transparent" />

              {/* TOP-LEFT CORNER STAMP */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...SPRING_SNAPPY, delay: 0.35 }}
                className="absolute top-3 left-3 z-20 border-2 border-ink bg-surface px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.16em] text-ink uppercase stamp-shadow-sm sm:top-5 sm:left-5 sm:px-4 sm:py-2 sm:text-xs"
              >
                DROP 01 // 10 PIECES ONLY
              </motion.div>

              {/* TOP-RIGHT LIVE MOUNTED-SAFE COUNTDOWN STAMP */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...SPRING_SNAPPY, delay: 0.4 }}
                className="absolute top-3 right-3 z-20 border-2 border-ink bg-ink px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.14em] text-paper uppercase tabular-nums stamp-shadow-sm sm:top-5 sm:right-5 sm:px-4 sm:py-2 sm:text-xs"
              >
                <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-orange" />
                {mounted && countdown
                  ? `${countdown.days}D : ${countdown.hours}H : ${countdown.minutes}M : ${countdown.seconds}S`
                  : "--D : --H : --M : --S"}
              </motion.div>

              {/* BOTTOM OVERLAY BAR: PUNCHY 1-LINER + TACTILE STAMPED BUTTONS */}
              <div className="absolute inset-x-3 bottom-3 z-20 flex flex-col items-start justify-between gap-3 sm:inset-x-5 sm:bottom-5 lg:flex-row lg:items-end">
                <div className="border-2 border-ink bg-paper/95 px-3.5 py-2.5 backdrop-blur-xs stamp-shadow-sm sm:px-4 sm:py-3">
                  <p className="font-mono text-[10px] font-bold tracking-[0.16em] text-cobalt uppercase">
                    STRICT ALLOCATION // ZERO RESTOCKS
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] font-bold tracking-[0.08em] text-ink uppercase sm:text-xs">
                    3–4 UNITS PER PIECE · TWO 1-OF-1S · ZERO RESTOCKS
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <motion.div
                    whileHover={{ y: -2, x: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Link
                      href="#waitlist"
                      className="inline-flex items-center gap-2 border-2 border-ink bg-orange px-5 py-3 font-mono text-xs font-bold tracking-[0.14em] text-white uppercase stamp-shadow-sm transition-colors hover:bg-ink sm:px-6 sm:py-3.5"
                    >
                      <span>CLAIM YOUR SPOT →</span>
                    </Link>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2, x: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Link
                      href="/vault"
                      className="inline-flex items-center gap-2 border-2 border-ink bg-surface px-5 py-3 font-mono text-xs font-bold tracking-[0.14em] text-ink uppercase stamp-shadow-sm transition-colors hover:bg-stone sm:px-6 sm:py-3.5"
                    >
                      {safeVaultUnlocked ? (
                        <Unlock className="h-3.5 w-3.5 text-orange" />
                      ) : (
                        <Lock className="h-3.5 w-3.5" />
                      )}
                      <span>ENTER VAULT</span>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 2 — DUAL CROSSING KINETIC HAZARD / DROP TAPES             */}
      {/* ================================================================= */}
      <section
        aria-label="Drop Rules Ticker"
        className="relative overflow-hidden bg-paper py-10 sm:py-14"
      >
        {/* Tape 1: Angled -1deg Black with Chalk White Text scrolling LEFT */}
        <div className="relative z-10 -mx-6 -rotate-1 border-y-2 border-ink bg-ink py-3 text-paper shadow-sm">
          <div className="animate-tape-left flex items-center whitespace-nowrap">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={`black-tape-${i}`}
                className="pr-8 font-poster text-xl tracking-[0.08em] uppercase sm:text-2xl"
              >
                {TAPE_TEXT}
              </span>
            ))}
          </div>
        </div>

        {/* Tape 2: Angled +1deg Safety Orange with Pitch Black Text scrolling RIGHT */}
        <div className="relative z-20 -mx-6 -mt-3 rotate-1 border-y-2 border-ink bg-orange py-3 text-ink shadow-sm">
          <div className="animate-tape-right flex items-center whitespace-nowrap">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={`orange-tape-${i}`}
                className="pr-8 font-poster text-xl tracking-[0.08em] uppercase sm:text-2xl"
              >
                {TAPE_TEXT}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 3 — INTERACTIVE "X-RAY / HOLD TO PEEK" 50/50 DROP BOARD   */}
      {/* ================================================================= */}
      <section
        id="lookbook"
        className="border-t-2 border-ink bg-paper py-20 sm:py-28"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          {/* Header + Spring Pill Tabs */}
          <div className="flex flex-col justify-between gap-6 border-b-2 border-ink pb-8 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 border-2 border-ink bg-surface px-3 py-1 font-mono text-[10px] font-bold tracking-[0.18em] text-ink uppercase stamp-shadow-sm">
                <ScanLine className="h-3.5 w-3.5 text-cobalt" />
                <span>DROP 01 BOARD // 50% REVEAL PROTOCOL</span>
              </div>
              <h2 className="mt-4 font-poster text-5xl leading-[0.9] tracking-tight text-ink uppercase sm:text-7xl lg:text-8xl">
                HALF EXPOSED.{" "}
                <span className="text-orange">HALF LOCKED.</span>
              </h2>
              <p className="mt-3 font-mono text-xs font-bold tracking-[0.12em] text-muted uppercase">
                HOVER LOCKED CARDS TO X-RAY PEEK. CLEAR THE WAITLIST TO UNSEAL ALL 10.
              </p>
            </div>

            {/* Tactile Pill Tabs with layoutId Spring Indicator */}
            <div className="inline-flex flex-wrap items-center gap-1.5 self-start border-2 border-ink bg-surface p-1.5 stamp-shadow-sm lg:self-end">
              {(
                [
                  { id: "all", label: `ALL [${products.length}]` },
                  { id: "visible", label: `VISIBLE [${visibleCount}]` },
                  { id: "locked", label: `LOCKED [${lockedCount}]` },
                ] as const
              ).map((tab) => {
                const active = dropTab === tab.id;
                return (
                  <button
                    suppressHydrationWarning
                    key={tab.id}
                    type="button"
                    onClick={() => setDropTab(tab.id)}
                    className={cn(
                      "relative cursor-pointer px-4 py-2 font-mono text-[11px] font-bold tracking-[0.14em] uppercase transition-colors",
                      active ? "text-white" : "text-ink hover:text-orange"
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="drop-board-active-pill"
                        transition={SPRING_SNAPPY}
                        className="absolute inset-0 bg-ink"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 50/50 Interactive Board Grid */}
          <motion.div
            layout
            className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
          >
            {filteredProducts.map((product, index) => {
              const isHidden = product.isMystery && !safeVaultUnlocked;
              const isOneOfOne = product.tier === "one-of-one";

              if (isHidden) {
                return (
                  <LockedXRayCard
                    key={product._id}
                    product={product}
                    href={safeVaultUnlocked ? "/vault" : "#waitlist"}
                  />
                );
              }

              const imgSrc = resolveProductImage(
                product.imageUrl,
                product.tier,
                index
              );

              return (
                <motion.div
                  key={product._id}
                  layout
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  whileHover={{ y: -6 }}
                  transition={SPRING_SNAPPY}
                  className="group"
                >
                  <Link href="/vault" className="block">
                    <div className="relative aspect-[3/4] w-full overflow-hidden border-2 border-ink bg-surface stamp-shadow">
                      <Image
                        src={imgSrc}
                        alt={product.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                        className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                      />

                      {/* Bold Top-Left Edition Sticker */}
                      <span
                        className={cn(
                          "absolute top-3 left-3 z-10 border-2 border-ink px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.14em] uppercase stamp-shadow-sm",
                          isOneOfOne
                            ? "bg-orange text-white"
                            : "bg-ink text-paper"
                        )}
                      >
                        {isOneOfOne
                          ? "1 OF 1 · ONLY ONE"
                          : `${product.remainingUnits}/${product.totalUnits} LEFT`}
                      </span>

                      {/* Bottom Right GSM Stamp */}
                      <span className="absolute right-3 bottom-3 z-10 border border-ink bg-surface/95 px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.1em] text-ink uppercase">
                        {product.gsmWeight}
                      </span>
                    </div>

                    <div className="mt-3.5 flex items-start justify-between gap-2 px-0.5">
                      <div className="min-w-0">
                        <h3 className="truncate font-poster text-xl leading-tight tracking-wide text-ink uppercase transition-colors group-hover:text-orange">
                          {product.title}
                        </h3>
                        <p className="mt-0.5 font-mono text-[10px] font-bold tracking-[0.12em] text-muted uppercase">
                          {product.serialCode} ·{" "}
                          {isOneOfOne ? "ARCHIVE 1/1" : "SMALL-BATCH"}
                        </p>
                      </div>
                      <span className="shrink-0 border-2 border-ink bg-surface px-2 py-0.5 font-mono text-xs font-bold text-ink">
                        {formatInr(product.priceInr)}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          {filteredProducts.length === 0 && (
            <div className="mt-10 border-2 border-ink bg-surface p-10 text-center stamp-shadow">
              <p className="font-poster text-3xl text-ink uppercase">
                ALL 10 PIECES ARE ALREADY UNLOCKED.
              </p>
              <Link
                href="/vault"
                className="mt-4 inline-flex items-center gap-2 border-2 border-ink bg-orange px-6 py-3 font-mono text-xs font-bold tracking-[0.14em] text-white uppercase stamp-shadow-sm"
              >
                <span>OPEN THE VAULT →</span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 4 — EXPANDABLE INTERACTIVE TWO-TIER SPLIT                 */}
      {/* ================================================================= */}
      <section
        id="tiers"
        className="border-t-2 border-ink bg-paper py-20 sm:py-28"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[11px] font-bold tracking-[0.2em] text-cobalt uppercase">
                SCARCITY ARCHITECTURE // HOVER OR TAP TO EXPAND
              </p>
              <h2 className="mt-2 font-poster text-5xl leading-[0.9] tracking-tight text-ink uppercase sm:text-7xl">
                TWO TIERS. <span className="text-orange">ZERO MERCY.</span>
              </h2>
            </div>
            <p className="font-mono text-xs font-bold tracking-[0.14em] text-muted uppercase">
              NUMBERED LABELS · NO RESTOCKS · EVER
            </p>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row">
            {/* PANEL A — SMALL-BATCH */}
            <motion.article
              layout
              transition={SPRING_SNAPPY}
              onMouseEnter={() => setActiveTier("small-batch")}
              onClick={() => setActiveTier("small-batch")}
              className={cn(
                "group relative flex cursor-pointer flex-col overflow-hidden border-2 border-ink bg-surface stamp-shadow transition-colors",
                activeTier === "small-batch"
                  ? "lg:flex-[1.55]"
                  : "lg:flex-[1]"
              )}
            >
              <div className="relative h-72 w-full overflow-hidden border-b-2 border-ink bg-stone sm:h-88 lg:h-[420px]">
                <Image
                  src="/images/look-batch-hoodie.jpg"
                  alt="KNITX Small-Batch Heavyweight Hoodie"
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4 border-2 border-ink bg-ink px-3 py-1 font-mono text-[11px] font-bold tracking-[0.16em] text-paper uppercase stamp-shadow-sm">
                  PANEL A // SMALL-BATCH
                </div>
                <div className="absolute top-4 right-4 border-2 border-ink bg-surface px-3 py-1 font-mono text-xs font-bold text-ink stamp-shadow-sm">
                  ₹2,500–₹4,000
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-poster text-4xl leading-none tracking-tight text-ink uppercase sm:text-5xl">
                      SMALL-BATCH
                    </h3>
                    <span className="border-2 border-ink bg-stone px-3 py-1 font-mono text-xs font-bold text-ink uppercase">
                      3–4 UNITS ONLY
                    </span>
                  </div>

                  <p className="mt-4 text-sm font-medium leading-relaxed text-ink/85 sm:text-base">
                    Heavyweight 420–450 GSM French terry, 3D puff prints,
                    chain-stitch embroidery, hand-numbered{" "}
                    <span className="bg-stone px-1.5 py-0.5 font-mono text-xs font-bold text-ink">
                      01/04
                    </span>
                    . Blink and the run is gone forever.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {[
                      "420–450 GSM TERRY",
                      "3D PUFF INK",
                      "CHAIN-STITCH",
                      "TAGGED 01/04",
                    ].map((chip) => (
                      <span
                        key={chip}
                        className="border border-ink bg-paper px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.12em] text-ink uppercase"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-7 flex items-center justify-between border-t-2 border-ink pt-4">
                  <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
                    8 SILHOUETTES IN DROP 01
                  </span>
                  <Link
                    href={safeVaultUnlocked ? "/vault" : "#waitlist"}
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-[0.14em] text-ink uppercase transition-colors hover:text-orange"
                  >
                    <span>LOCK A UNIT</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.article>

            {/* PANEL B — ONE-OF-ONE */}
            <motion.article
              layout
              transition={SPRING_SNAPPY}
              onMouseEnter={() => setActiveTier("one-of-one")}
              onClick={() => setActiveTier("one-of-one")}
              className={cn(
                "group relative flex cursor-pointer flex-col overflow-hidden border-2 border-ink bg-surface stamp-shadow transition-colors",
                activeTier === "one-of-one"
                  ? "lg:flex-[1.55]"
                  : "lg:flex-[1]"
              )}
            >
              <div className="relative h-72 w-full overflow-hidden border-b-2 border-ink bg-stone sm:h-88 lg:h-[420px]">
                <Image
                  src="/images/look-1of1-jacket.jpg"
                  alt="KNITX One-of-One Collector Archive Jacket"
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4 border-2 border-ink bg-orange px-3 py-1 font-mono text-[11px] font-bold tracking-[0.16em] text-white uppercase stamp-shadow-sm">
                  PANEL B // ONE-OF-ONE
                </div>
                <div className="absolute top-4 right-4 border-2 border-ink bg-ink px-3 py-1 font-mono text-xs font-bold text-paper stamp-shadow-sm">
                  ₹5,000–₹10,000+
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-poster text-4xl leading-none tracking-tight text-orange uppercase sm:text-5xl">
                      ONE-OF-ONE
                    </h3>
                    <span className="border-2 border-ink bg-orange px-3 py-1 font-mono text-xs font-bold text-white uppercase">
                      1 IN THE WORLD
                    </span>
                  </div>

                  <p className="mt-4 text-sm font-medium leading-relaxed text-ink/85 sm:text-base">
                    Bespoke patchwork, hand-painted finishes, laser-etched{" "}
                    <span className="bg-orange px-1.5 py-0.5 font-mono text-xs font-bold text-white">
                      01/01
                    </span>{" "}
                    metal tag — literally nobody else on earth owns it.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {[
                      "BESPOKE PATCHWORK",
                      "HAND-PAINTED",
                      "METAL 01/01 TAG",
                      "NEVER REPEATED",
                    ].map((chip) => (
                      <span
                        key={chip}
                        className="border border-ink bg-paper px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.12em] text-ink uppercase"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-7 flex items-center justify-between border-t-2 border-ink pt-4">
                  <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-orange uppercase">
                    ONLY 2 PIECES IN DROP 01
                  </span>
                  <Link
                    href={safeVaultUnlocked ? "/vault" : "#waitlist"}
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-[0.14em] text-orange uppercase transition-colors hover:text-ink"
                  >
                    <span>CLAIM THE 1/1</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.article>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 5 — THE THERMAL TICKET MACHINE (#waitlist)                */}
      {/* ================================================================= */}
      <section
        id="waitlist"
        className="border-y-2 border-ink bg-stone bg-draft-grid py-20 sm:py-28"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-14">
            {/* LEFT: GIANT HEADLINE + ANIMATED QUEUE METER + MICRO-TICKER + CODE INPUT */}
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 border-2 border-ink bg-surface px-3 py-1 font-mono text-[10px] font-bold tracking-[0.18em] text-ink uppercase stamp-shadow-sm">
                <Ticket className="h-3.5 w-3.5 text-orange" />
                <span>DROP 01 THERMAL QUEUE DISPENSER</span>
              </div>

              <h2 className="mt-4 font-poster text-6xl leading-[0.86] tracking-tight text-ink uppercase sm:text-8xl">
                GET IN <span className="text-orange">LINE.</span>
              </h2>

              {/* Live Animated Queue Meter */}
              <div className="mt-8 border-2 border-ink bg-surface p-5 stamp-shadow">
                <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-xs font-bold tracking-[0.14em] uppercase">
                  <span className="text-ink tabular-nums">
                    {claimedSpots.toLocaleString("en-IN")} /{" "}
                    {drop.totalSlots.toLocaleString("en-IN")} IN QUEUE
                  </span>
                  <span className="text-orange tabular-nums">
                    {queueProgressPct}% FULL
                  </span>
                </div>

                <div className="mt-3 h-4 w-full overflow-hidden border-2 border-ink bg-paper p-0.5">
                  <motion.div
                    initial={{ width: "0%" }}
                    whileInView={{ width: `${queueProgressPct}%` }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 90, damping: 18 }}
                    className="h-full bg-orange"
                  />
                </div>

                <p className="mt-2.5 font-mono text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
                  WAVE 01 CALLS FIRST 500 NUMBERS · 10-MINUTE BAG LOCK
                </p>
              </div>

              {/* Punchy 3-Step Micro-Ticker */}
              <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {[
                  { step: "01", text: "SIGN UP" },
                  { step: "02", text: "WE EMAIL YOUR SPOT" },
                  { step: "03", text: "YOUR NUMBER CALLS → VAULT UNLOCKS" },
                ].map((item, idx) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ ...SPRING_SNAPPY, delay: idx * 0.08 }}
                    className="border-2 border-ink bg-paper p-3.5"
                  >
                    <span className="font-mono text-[10px] font-bold text-orange">
                      {item.step} {"//"}
                    </span>
                    <p className="mt-1 font-mono text-[11px] font-bold leading-snug tracking-[0.08em] text-ink uppercase">
                      {item.text}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Vault Access Code Direct Unlock */}
              <div className="mt-8 border-2 border-ink bg-surface p-5 stamp-shadow-sm">
                <p className="font-mono text-[10px] font-bold tracking-[0.18em] text-cobalt uppercase">
                  GOT A VAULT ACCESS CODE? SKIP THE LINE
                </p>
                <form
                  onSubmit={handleUnlockCode}
                  className="mt-3 flex flex-col gap-2.5 sm:flex-row"
                >
                  <input
                    suppressHydrationWarning
                    type="text"
                    value={accessCodeInput}
                    onChange={(e) => {
                      setAccessCodeInput(e.target.value);
                      setCodeError(null);
                    }}
                    placeholder="TRY KNITX-001"
                    className="flex-1 border-2 border-ink bg-paper px-4 py-3 font-mono text-xs font-bold tracking-[0.14em] text-ink uppercase placeholder:text-muted/60 focus:bg-surface focus:outline-none"
                  />
                  <motion.button
                    suppressHydrationWarning
                    type="submit"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="cursor-pointer border-2 border-ink bg-ink px-5 py-3 font-mono text-xs font-bold tracking-[0.14em] text-paper uppercase transition-colors hover:bg-orange hover:text-white"
                  >
                    UNLOCK →
                  </motion.button>
                </form>
                {codeError && (
                  <p className="mt-2 font-mono text-[11px] font-bold text-orange uppercase">
                    {codeError}
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT: THERMAL TICKET PRINTER / 3D-TILT PERFORATED STUB */}
            <div className="lg:col-span-6">
              <AnimatePresence mode="wait">
                {safeWaitlistPass ? (
                  <motion.div key="printed-stub">
                    <ThermalTicketStub
                      pass={safeWaitlistPass}
                      isVaultUnlocked={safeVaultUnlocked}
                      onSimulateCall={handleSimulateAdmit}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="ticket-form"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={SPRING_SNAPPY}
                    className="border-2 border-ink bg-surface stamp-shadow"
                  >
                    {/* Printer Header Strip */}
                    <div className="flex items-center justify-between border-b-2 border-ink bg-ink px-5 py-3 font-mono text-[10px] font-bold tracking-[0.18em] text-paper uppercase">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 animate-ping rounded-full bg-orange" />
                        TICKET MACHINE READY
                      </span>
                      <span className="text-orange">
                        NEXT #
                        {(claimedSpots + 1).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="p-6 sm:p-9">
                      <h3 className="font-poster text-4xl leading-none tracking-tight text-ink uppercase sm:text-5xl">
                        PRINT YOUR QUEUE NUMBER.
                      </h3>
                      <p className="mt-2 font-mono text-[11px] font-bold tracking-[0.12em] text-muted uppercase">
                        ONE SPOT PER COLLECTOR · ZERO SPAM · INSTANT TICKET STUB
                      </p>

                      <form
                        onSubmit={handleWaitlistSubmit}
                        className="mt-7 space-y-5"
                      >
                        <div>
                          <label
                            htmlFor="knitx-waitlist-name"
                            className="block font-mono text-[10px] font-bold tracking-[0.18em] text-ink uppercase"
                          >
                            YOUR NAME
                          </label>
                          <input
                            suppressHydrationWarning
                            id="knitx-waitlist-name"
                            type="text"
                            value={waitlistName}
                            onChange={(e) => setWaitlistName(e.target.value)}
                            placeholder="AARAV MEHTA"
                            required
                            className="mt-2 w-full border-2 border-ink bg-paper px-4 py-3.5 font-mono text-sm font-bold text-ink placeholder:text-muted/50 focus:bg-surface focus:outline-none"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="knitx-waitlist-email"
                            className="block font-mono text-[10px] font-bold tracking-[0.18em] text-ink uppercase"
                          >
                            YOUR EMAIL
                          </label>
                          <input
                            suppressHydrationWarning
                            id="knitx-waitlist-email"
                            type="email"
                            value={waitlistEmail}
                            onChange={(e) => setWaitlistEmail(e.target.value)}
                            placeholder="AARAV@DOMAIN.COM"
                            required
                            className="mt-2 w-full border-2 border-ink bg-paper px-4 py-3.5 font-mono text-sm font-bold text-ink placeholder:text-muted/50 focus:bg-surface focus:outline-none"
                          />
                        </div>

                        {waitlistError && (
                          <div className="flex items-start gap-2 border-2 border-orange bg-orange/10 p-3 font-mono text-xs font-bold text-orange uppercase">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{waitlistError}</span>
                          </div>
                        )}

                        <motion.button
                          suppressHydrationWarning
                          type="submit"
                          disabled={waitlistSubmitting}
                          whileHover={{ y: -2, x: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex w-full cursor-pointer items-center justify-center gap-2 border-2 border-ink bg-orange py-4 font-mono text-xs font-bold tracking-[0.16em] text-white uppercase stamp-shadow-sm transition-colors hover:bg-ink disabled:opacity-50"
                        >
                          {waitlistSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Ticket className="h-4 w-4" />
                          )}
                          <span>PRINT MY QUEUE TICKET →</span>
                        </motion.button>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 6 — LIVE HEAD-TO-HEAD DROP 02 VOTING DUEL                 */}
      {/* ================================================================= */}
      <section id="duel" className="bg-paper py-20 sm:py-28">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          {/* Header Row */}
          <div className="flex flex-col justify-between gap-6 border-b-2 border-ink pb-8 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 border-2 border-ink bg-orange px-3 py-1 font-mono text-[10px] font-bold tracking-[0.18em] text-white uppercase stamp-shadow-sm">
                <Flame className="h-3.5 w-3.5" />
                <span>LIVE 1V1 DESIGN DUEL // DROP 02</span>
              </div>
              <h2 className="mt-4 font-poster text-5xl leading-[0.88] tracking-tight text-ink uppercase sm:text-7xl lg:text-8xl">
                YOU PICK <span className="text-orange">DROP 02.</span>
              </h2>
              <p className="mt-3 font-mono text-xs font-bold tracking-[0.14em] text-muted uppercase">
                TAP THE HARDER PIECE. TOP DESIGNS GET MADE.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/vote"
                className="inline-flex items-center gap-2 border-2 border-ink bg-surface px-4 py-2.5 font-mono text-[11px] font-bold tracking-[0.14em] text-ink uppercase stamp-shadow-sm transition-colors hover:bg-ink hover:text-paper"
              >
                <span>OPEN FULL BALLOT</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 border-2 border-ink bg-cobalt px-4 py-2.5 font-mono text-[11px] font-bold tracking-[0.14em] text-white uppercase stamp-shadow-sm transition-colors hover:bg-ink"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>SUBMIT YOUR DESIGN</span>
              </Link>
            </div>
          </div>

          {/* Interactive 1v1 Arena */}
          {activePair ? (
            <div className="relative mt-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`matchup-${matchupIndex}`}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={SPRING_SNAPPY}
                  className="relative grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-10"
                >
                  {/* Floating Center Safety-Orange VS Stamp */}
                  <motion.div
                    initial={{ scale: 0.7, rotate: -18 }}
                    animate={{ scale: 1, rotate: -8 }}
                    transition={SPRING_STAMP}
                    className="pointer-events-none absolute top-1/2 left-1/2 z-30 hidden h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-ink bg-orange font-poster text-4xl text-white stamp-shadow md:flex"
                  >
                    VS
                  </motion.div>

                  {activePair.map((candidate, sideIdx) => {
                    const leftId = activePair[0]._id;
                    const rightId = activePair[1]._id;
                    const leftCount =
                      duelVotes[leftId] ?? activePair[0].votesCount;
                    const rightCount =
                      duelVotes[rightId] ?? activePair[1].votesCount;
                    const pairTotal = Math.max(1, leftCount + rightCount);
                    const myVotes =
                      duelVotes[candidate._id] ?? candidate.votesCount;
                    const pct = Math.round((myVotes / pairTotal) * 100);
                    const isPicked = duelPickedId === candidate._id;
                    const hasVoted = duelPickedId !== null;
                    const imgSrc = resolveCandidateImage(
                      candidate.imageUrl,
                      matchupIndex * 2 + sideIdx
                    );

                    return (
                      <motion.button
                        suppressHydrationWarning
                        key={candidate._id}
                        type="button"
                        disabled={hasVoted}
                        onClick={() => handleDuelVote(candidate._id)}
                        whileHover={hasVoted ? undefined : { y: -6 }}
                        whileTap={hasVoted ? undefined : { scale: 0.985 }}
                        transition={SPRING_SNAPPY}
                        className={cn(
                          "group relative flex cursor-pointer flex-col overflow-hidden border-2 border-ink bg-surface text-left stamp-shadow transition-all disabled:cursor-default",
                          isPicked && "ring-4 ring-orange ring-offset-2 ring-offset-paper",
                          hasVoted && !isPicked && "opacity-75"
                        )}
                      >
                        <div className="relative aspect-[4/3] w-full overflow-hidden border-b-2 border-ink bg-stone sm:aspect-[16/11]">
                          <Image
                            src={imgSrc}
                            alt={candidate.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                          />

                          {/* Contender Corner Tag */}
                          <span className="absolute top-3.5 left-3.5 border-2 border-ink bg-surface px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.14em] text-ink uppercase stamp-shadow-sm">
                            {candidate.code} {"//"}{" "}
                            {candidate.tierSuggestion === "one-of-one"
                              ? "1-OF-1"
                              : "SMALL-BATCH"}
                          </span>

                          {/* Instant Spring Stamp When Picked */}
                          <AnimatePresence>
                            {isPicked && (
                              <motion.div
                                initial={{ scale: 2, opacity: 0, rotate: -18 }}
                                animate={{ scale: 1, opacity: 1, rotate: -6 }}
                                transition={SPRING_STAMP}
                                className="absolute right-4 bottom-4 flex items-center gap-1.5 border-2 border-ink bg-orange px-4 py-2 font-poster text-2xl tracking-wide text-white uppercase stamp-shadow-sm"
                              >
                                <Check className="h-5 w-5 stroke-[3]" />
                                <span>PICKED</span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="flex flex-1 flex-col justify-between p-5 sm:p-7">
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="font-poster text-3xl leading-none tracking-tight text-ink uppercase transition-colors group-hover:text-orange sm:text-4xl">
                                {candidate.title}
                              </h3>
                              <span className="shrink-0 font-mono text-[11px] font-bold text-cobalt">
                                {candidate.creatorHandle}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {candidate.craftsmanship
                                .slice(0, 3)
                                .map((tag) => (
                                  <span
                                    key={tag}
                                    className="border border-ink/40 bg-paper px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.08em] text-ink uppercase"
                                  >
                                    {tag}
                                  </span>
                                ))}
                            </div>
                          </div>

                          {/* Live Percentage Result Bar OR Tap Prompt */}
                          <div className="mt-6">
                            {hasVoted ? (
                              <div>
                                <div className="flex items-baseline justify-between font-mono text-xs font-bold uppercase">
                                  <span
                                    className={cn(
                                      "text-2xl font-poster tracking-wide",
                                      isPicked ? "text-orange" : "text-ink"
                                    )}
                                  >
                                    {pct}%
                                  </span>
                                  <span className="text-[11px] text-muted tabular-nums">
                                    {myVotes.toLocaleString("en-IN")} VOTES
                                  </span>
                                </div>
                                <div className="mt-2 h-4 w-full overflow-hidden border-2 border-ink bg-paper p-0.5">
                                  <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 160,
                                      damping: 22,
                                    }}
                                    className={cn(
                                      "h-full",
                                      isPicked ? "bg-orange" : "bg-ink"
                                    )}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between border-2 border-ink bg-paper px-4 py-3 font-mono text-xs font-bold tracking-[0.14em] text-ink uppercase transition-colors group-hover:bg-orange group-hover:text-white">
                                <span>TAP TO VOTE THIS PIECE</span>
                                <ArrowRight className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>

              {/* Post-Vote Controls Bar */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-2 border-ink bg-stone px-5 py-4">
                <span className="font-mono text-xs font-bold tracking-[0.14em] text-ink uppercase">
                  MATCHUP {(matchupIndex % matchups.length) + 1} OF{" "}
                  {matchups.length} ·{" "}
                  {duelPickedId
                    ? "VOTE LOCKED IN."
                    : "PICK A SIDE TO SEE LIVE SPLIT."}
                </span>

                <div className="flex flex-wrap items-center gap-3">
                  {matchups.length > 1 && (
                    <motion.button
                      suppressHydrationWarning
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleNextMatchup}
                      className="inline-flex cursor-pointer items-center gap-2 border-2 border-ink bg-orange px-5 py-2.5 font-mono text-xs font-bold tracking-[0.14em] text-white uppercase stamp-shadow-sm transition-colors hover:bg-ink"
                    >
                      <span>NEXT MATCHUP →</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-10 border-2 border-ink bg-surface p-8 text-center stamp-shadow">
              <p className="font-poster text-3xl text-ink uppercase">
                DROP 02 BALLOT OPEN NOW.
              </p>
              <Link
                href="/vote"
                className="mt-4 inline-flex items-center gap-2 border-2 border-ink bg-orange px-6 py-3 font-mono text-xs font-bold tracking-[0.14em] text-white uppercase stamp-shadow-sm"
              >
                <span>GO TO VOTING BALLOT →</span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 7 — STICKY STACKED SAMPLE-FIRST CARDS (ZERO DEADSTOCK.)   */}
      {/* ================================================================= */}
      <section
        id="sample-first"
        className="border-t-2 border-ink bg-paper bg-draft-grid py-20 sm:py-28"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-14">
            {/* LEFT STICKY VISUAL + POSTER TITLE */}
            <div className="lg:sticky lg:top-28 lg:col-span-5">
              <div className="inline-flex items-center gap-2 border-2 border-ink bg-surface px-3 py-1 font-mono text-[10px] font-bold tracking-[0.18em] text-ink uppercase stamp-shadow-sm">
                <Scissors className="h-3.5 w-3.5 text-orange" />
                <span>SAMPLE-FIRST ATELIER OPS</span>
              </div>

              <h2 className="mt-4 font-poster text-6xl leading-[0.86] tracking-tight text-ink uppercase sm:text-7xl lg:text-8xl">
                ZERO <span className="text-orange">DEADSTOCK.</span>
              </h2>

              <p className="mt-3 font-mono text-xs font-bold tracking-[0.14em] text-muted uppercase">
                ONE SAMPLE FOR SHOOTS. REAL UNITS CUT ONLY AFTER YOU CLAIM.
              </p>

              {/* Framed Daylight Atelier Photo */}
              <div className="relative mt-7 aspect-[4/3] w-full overflow-hidden border-2 border-ink bg-stone stamp-shadow">
                <Image
                  src="/images/atelier-daylight.jpg"
                  alt="KNITX Daylight Cutting Studio"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover object-center"
                />
                <div className="absolute top-3 left-3 border-2 border-ink bg-surface px-3 py-1 font-mono text-[10px] font-bold tracking-[0.16em] text-ink uppercase stamp-shadow-sm">
                  KNITX STUDIO // LIVE FLOOR
                </div>
                <div className="absolute right-3 bottom-3 border-2 border-ink bg-ink px-3 py-1 font-mono text-[10px] font-bold tracking-[0.14em] text-paper uppercase">
                  10–14 DAY CUT &amp; DISPATCH
                </div>
              </div>

              <motion.div
                whileHover={{ y: -2, x: -2 }}
                whileTap={{ scale: 0.98 }}
                className="mt-6 inline-block"
              >
                <Link
                  href="/atelier"
                  className="inline-flex items-center gap-2.5 border-2 border-ink bg-ink px-6 py-4 font-mono text-xs font-bold tracking-[0.16em] text-paper uppercase stamp-shadow-sm transition-colors hover:bg-orange hover:text-white"
                >
                  <span>TOUR THE SAMPLE-FIRST ATELIER</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>

            {/* RIGHT STACKED NUMBERED TACTILE CARDS */}
            <div className="space-y-6 lg:col-span-7">
              {SAMPLE_FIRST_STEPS.map((step, idx) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 28, rotate: idx % 2 === 0 ? -1 : 1 }}
                  whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  whileHover={{ y: -4, x: -2 }}
                  transition={{ ...SPRING_SNAPPY, delay: idx * 0.06 }}
                  style={{ top: `${112 + idx * 18}px` }}
                  className="border-2 border-ink bg-surface p-6 stamp-shadow sm:p-8 lg:sticky"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-4">
                    <span
                      className={cn(
                        "border-2 border-ink px-3 py-1 font-mono text-xs font-bold tracking-[0.16em] uppercase",
                        step.accent
                      )}
                    >
                      STEP {step.num} {"//"} {step.tag}
                    </span>
                    <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-cobalt uppercase">
                      {step.spec}
                    </span>
                  </div>

                  <div className="mt-5 flex items-baseline gap-4">
                    <span className="font-poster text-5xl leading-none text-orange sm:text-6xl">
                      {step.num}
                    </span>
                    <h3 className="font-poster text-4xl leading-none tracking-tight text-ink uppercase sm:text-5xl">
                      {step.title}
                    </h3>
                  </div>

                  <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-ink/85 sm:text-base">
                    {step.punch}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
