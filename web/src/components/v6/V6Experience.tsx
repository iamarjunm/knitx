/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Lock,
  LogOut,
  ShoppingBag,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import type {
  CreatorSubmissionItem,
  DropCampaign,
  Product,
  VoteCandidate,
} from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";

export interface V6ExperienceProps {
  drop: DropCampaign;
  products: Product[];
  candidates: VoteCandidate[];
  submissions: CreatorSubmissionItem[];
}

type CollectionFilter = "all" | "small-batch" | "one-of-one";
type CommunityTab = "vote" | "submit";

const VOTED_STORAGE_KEY = "knitx_v6_voted_ids_v1";

const HERO_SLIDES = [
  {
    id: "01",
    image: "/images/hero-editorial-light.jpg",
    label: "Drop 01 · Editorial Look",
    alt: "KNITX Drop 01 studio editorial look",
  },
  {
    id: "02",
    image: "/images/look-1of1-jacket.jpg",
    label: "1 of 1 · Collector Piece",
    alt: "KNITX 1-of-1 waxed canvas collector jacket",
  },
  {
    id: "03",
    image: "/images/look-batch-hoodie.jpg",
    label: "Small-Batch · 4 Units",
    alt: "KNITX heavyweight small-batch hoodie",
  },
] as const;

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Join the waitlist",
    body: "Sign up to claim your spot in line. We notify you by email when your turn opens.",
  },
  {
    step: "02",
    title: "Unlock all 10 pieces",
    body: "Half the drop is teased publicly. The other 5 stay hidden until your number is called.",
  },
  {
    step: "03",
    title: "Cut & sewn to order",
    body: "We only make samples for shoots. Your numbered piece is crafted only after you order.",
  },
] as const;

const PRESET_PHOTOS = [
  {
    id: "hoodie",
    label: "Heavyweight Hoodie",
    url: "/images/look-batch-hoodie.jpg",
  },
  {
    id: "tee",
    label: "Boxy Heavy Tee",
    url: "/images/look-batch-tee.jpg",
  },
  {
    id: "jacket",
    label: "Collector Outerwear",
    url: "/images/look-1of1-jacket.jpg",
  },
  {
    id: "knit",
    label: "Archival Knit",
    url: "/images/look-1of1-knit.jpg",
  },
] as const;

const EASE_SWISS = [0.22, 1, 0.36, 1] as const;

function toCleanTitle(raw: string): string {
  if (!raw) return "";
  const isMostlyUpper = raw === raw.toUpperCase();
  if (!isMostlyUpper) return raw;
  return raw
    .split(" ")
    .map((word) => {
      if (/^\d{2}\/\d{2}$/.test(word) || /^\d+GSM$/i.test(word)) {
        return word.toUpperCase();
      }
      if (word.includes("-")) {
        return word
          .split("-")
          .map((part) =>
            part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part
          )
          .join("-");
      }
      return word[0].toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function getFirstName(displayName: string): string {
  const clean = displayName.trim();
  if (!clean) return "Member";
  return clean.split(/\s+/)[0] || clean;
}

export default function V6Experience({
  drop,
  products,
  candidates,
  submissions,
}: V6ExperienceProps) {
  const { user, setAuthModalOpen, logout } = useAuth();
  const {
    waitlistPass,
    isVaultUnlocked,
    cartCount,
    setCartOpen,
    addToCart,
    joinWaitlist,
    unlockVaultDemo,
    unlockVaultWithCode,
  } = useVault();

  // Client hydration guard
  const [mounted, setMounted] = useState(false);

  // Hero showcase slide state
  const [activeSlide, setActiveSlide] = useState(0);
  const [heroHovered, setHeroHovered] = useState(false);

  // Collection state
  const [filter, setFilter] = useState<CollectionFilter>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [bagFeedback, setBagFeedback] = useState<string | null>(null);

  // Waitlist & code state
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [codeMessage, setCodeMessage] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  // Community state
  const [communityTab, setCommunityTab] = useState<CommunityTab>("vote");
  const [voteList, setVoteList] = useState<VoteCandidate[]>(candidates);
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [votingId, setVotingId] = useState<string | null>(null);

  // Submission form state
  const [recentSubmissions, setRecentSubmissions] =
    useState<CreatorSubmissionItem[]>(submissions);
  const [subTitle, setSubTitle] = useState("");
  const [subName, setSubName] = useState("");
  const [subHandle, setSubHandle] = useState("");
  const [subEmail, setSubEmail] = useState("");
  const [subCategory, setSubCategory] = useState("Small-Batch");
  const [subNotes, setSubNotes] = useState("");
  const [subPhoto, setSubPhoto] = useState<string>(PRESET_PHOTOS[0].url);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);
  const [subConfirmation, setSubConfirmation] =
    useState<CreatorSubmissionItem | null>(null);

  useEffect(() => {
    setMounted(true);
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

  // Gentle auto-advance on hero lookbook
  useEffect(() => {
    if (heroHovered) return;
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [heroHovered]);

  // Reset size selection when product drawer opens
  useEffect(() => {
    if (selectedProduct) {
      setSelectedSize(selectedProduct.sizes[0] || "M");
      setBagFeedback(null);
    }
  }, [selectedProduct]);

  // Close product sheet on Escape
  useEffect(() => {
    if (!selectedProduct) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedProduct(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedProduct]);

  // Guarded client-hydrated values
  const showUnlocked = mounted && isVaultUnlocked;
  const showPass = mounted ? waitlistPass : null;
  const showCartCount = mounted ? cartCount : 0;
  const showUser = mounted ? user : null;

  const revealedCount = useMemo(
    () => products.filter((p) => !p.isMystery).length,
    [products]
  );
  const lockedCount = products.length - revealedCount;

  const filteredProducts = useMemo(() => {
    if (filter === "all") return products;
    return products.filter((p) => p.tier === filter);
  }, [filter, products]);

  const totalVotes = useMemo(
    () => voteList.reduce((sum, item) => sum + item.votesCount, 0),
    [voteList]
  );

  const liveQueueCount = showPass
    ? Math.max(drop.waitlistCount, showPass.totalInQueue)
    : drop.waitlistCount;

  const scrollToWaitlist = () => {
    const el = document.getElementById("waitlist");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAddToBag = () => {
    if (!selectedProduct) return;
    const chosenSize = selectedSize || selectedProduct.sizes[0] || "ONE SIZE";
    const result = addToCart(selectedProduct, chosenSize);
    if (!result.ok) {
      setBagFeedback(result.message || "Unable to add this piece to bag.");
      return;
    }
    setSelectedProduct(null);
    setCartOpen(true);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistError(null);

    const cleanName = waitlistName.trim();
    const cleanEmail = waitlistEmail.trim();
    if (!cleanName || !cleanEmail || !cleanEmail.includes("@")) {
      setWaitlistError("Please enter your name and a valid email address.");
      return;
    }

    setWaitlistSubmitting(true);
    try {
      await joinWaitlist(cleanName, cleanEmail);
      setWaitlistName("");
      setWaitlistEmail("");
    } catch (err) {
      setWaitlistError(
        err instanceof Error ? err.message : "Could not join the waitlist."
      );
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inviteCode.trim();
    if (!trimmed) {
      setCodeMessage({ type: "error", text: "Enter a code to unlock." });
      return;
    }
    const ok = unlockVaultWithCode(trimmed);
    if (ok) {
      setCodeMessage({
        type: "ok",
        text: "Drop unlocked — all 10 pieces are now open.",
      });
      setInviteCode("");
    } else {
      setCodeMessage({
        type: "error",
        text: "Code not recognized. Try KNITX-001.",
      });
    }
  };

  const handleVote = async (candidateId: string) => {
    if (votedIds.includes(candidateId) || votingId) return;
    setVotingId(candidateId);

    const nextVoted = [...votedIds, candidateId];
    setVotedIds(nextVoted);
    setVoteList((prev) =>
      prev.map((c) =>
        c._id === candidateId ? { ...c, votesCount: c.votesCount + 1 } : c
      )
    );

    try {
      window.localStorage.setItem(VOTED_STORAGE_KEY, JSON.stringify(nextVoted));
    } catch {
      // Ignore storage write errors
    }

    try {
      await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          uid: showUser?.uid || "guest_v6",
        }),
      });
    } catch {
      // Optimistic count remains intact
    } finally {
      setVotingId(null);
    }
  };

  const handleSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubError(null);

    if (!subTitle.trim() || !subName.trim() || !subNotes.trim()) {
      setSubError("Please add a design title, your name, and brief notes.");
      return;
    }

    setSubLoading(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: subTitle.trim(),
          creatorName: subName.trim(),
          creatorHandle: subHandle.trim(),
          email: subEmail.trim(),
          category: subCategory,
          craftsmanshipNotes: subNotes.trim(),
          imageUrl: subPhoto,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        submission?: CreatorSubmissionItem;
        error?: string;
      };

      if (!res.ok || !data.ok || !data.submission) {
        setSubError(data.error || "Unable to submit design right now.");
        return;
      }

      const createdSubmission = data.submission;
      setSubConfirmation(createdSubmission);
      setRecentSubmissions((prev) => [createdSubmission, ...prev]);
      setSubTitle("");
      setSubNotes("");
    } catch {
      setSubError("Network error while submitting. Please try again.");
    } finally {
      setSubLoading(false);
    }
  };

  const currentSlide = HERO_SLIDES[activeSlide] || HERO_SLIDES[0];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-[#0D0D0D] antialiased selection:bg-[#1A4BFF] selection:text-white">
      {/* 1. WHISPER-CLEAN SINGLE-ROW NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-[#E5E5E0] bg-[#FAFAFA]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <a
            href="#top"
            className="flex items-center gap-2.5 text-[#0D0D0D] focus:outline-none"
          >
            <span className="text-base font-bold tracking-[-0.03em]">
              KNITX
            </span>
            <span className="h-1 w-1 rounded-full bg-[#1A4BFF]" />
            <span className="font-mono text-xs text-[#6E6E73]">Drop 01</span>
          </a>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-8 md:flex"
          >
            <a
              href="#collection"
              className="text-sm text-[#6E6E73] transition-colors hover:text-[#0D0D0D]"
            >
              Collection
            </a>
            <a
              href="#how"
              className="text-sm text-[#6E6E73] transition-colors hover:text-[#0D0D0D]"
            >
              How it works
            </a>
            <a
              href="#waitlist"
              className="text-sm text-[#6E6E73] transition-colors hover:text-[#0D0D0D]"
            >
              Waitlist
            </a>
            <a
              href="#community"
              className="text-sm text-[#6E6E73] transition-colors hover:text-[#0D0D0D]"
            >
              Community
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setCartOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E0] bg-white px-3.5 py-1.5 text-xs font-medium text-[#0D0D0D] transition-colors hover:border-[#0D0D0D]"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Bag</span>
              <span className="font-mono text-[#6E6E73]">
                ({showCartCount})
              </span>
            </button>

            {showUser ? (
              <div className="inline-flex items-center gap-1 rounded-full border border-[#E5E5E0] bg-white pl-3.5 pr-1.5 py-1 text-xs font-medium text-[#0D0D0D]">
                <span>{getFirstName(showUser.displayName)}</span>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => void logout()}
                  aria-label="Sign out"
                  className="rounded-full p-1 text-[#6E6E73] transition-colors hover:bg-[#F1F1EE] hover:text-[#0D0D0D]"
                >
                  <LogOut className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setAuthModalOpen(true)}
                className="rounded-full bg-[#0D0D0D] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1A4BFF]"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. ICONIC SPLIT HERO */}
      <section
        id="top"
        className="mx-auto max-w-7xl px-6 pb-20 pt-14 sm:pt-16 lg:pb-24"
      >
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: EASE_SWISS }}
            className="lg:col-span-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E5E0] bg-white px-3.5 py-1.5 text-xs font-medium text-[#0D0D0D]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1A4BFF]" />
              <span>Waitlist Only · No Open Store</span>
            </div>

            <h1 className="mt-7 text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-[#0D0D0D] sm:text-7xl">
              Limited drops.
              <br />
              Made after
              <br />
              you order.
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-[#6E6E73]">
              10 designs per drop — 3–4 units for small-batch pieces, and two
              1-of-1 collector&apos;s pieces. Join the waitlist to unlock the
              full collection.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#waitlist"
                className="inline-flex items-center gap-2 rounded-full bg-[#0D0D0D] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1A4BFF]"
              >
                <span>Join the Waitlist</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#collection"
                className="inline-flex items-center rounded-full border border-[#E5E5E0] bg-white px-6 py-3 text-sm font-medium text-[#0D0D0D] transition-colors hover:border-[#0D0D0D]"
              >
                See Drop 01
              </a>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-[#E5E5E0] pt-8">
              <div>
                <p className="font-mono text-lg font-semibold tracking-tight text-[#0D0D0D] sm:text-xl">
                  3–4 Units
                </p>
                <p className="mt-1 text-xs text-[#6E6E73]">
                  Small-Batch ₹2.5k–₹4k
                </p>
              </div>
              <div>
                <p className="font-mono text-lg font-semibold tracking-tight text-[#0D0D0D] sm:text-xl">
                  1 of 1
                </p>
                <p className="mt-1 text-xs text-[#6E6E73]">
                  Collector ₹5k–₹10k+
                </p>
              </div>
              <div>
                <p className="font-mono text-lg font-semibold tracking-tight text-[#0D0D0D] sm:text-xl">
                  0%
                </p>
                <p className="mt-1 text-xs text-[#6E6E73]">Deadstock</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Curated Studio Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.08, ease: EASE_SWISS }}
            className="lg:col-span-6"
          >
            <div
              onMouseEnter={() => setHeroHovered(true)}
              onMouseLeave={() => setHeroHovered(false)}
              className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-[#E5E5E0] bg-[#F1F1EE]"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentSlide.id}
                  src={currentSlide.image}
                  alt={currentSlide.alt}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.6, ease: EASE_SWISS }}
                  className="h-full w-full object-cover"
                />
              </AnimatePresence>

              {/* Subtle bottom-left caption */}
              <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-[#E5E5E0]/80 bg-white/90 px-3.5 py-1.5 text-xs font-medium text-[#0D0D0D] backdrop-blur-md">
                {currentSlide.label}
              </div>

              {/* Clean 01 / 02 / 03 selector pills */}
              <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full border border-[#E5E5E0]/80 bg-white/90 p-1 backdrop-blur-md">
                {HERO_SLIDES.map((slide, idx) => {
                  const isActive = idx === activeSlide;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setActiveSlide(idx)}
                      aria-label={`Show look ${slide.id}`}
                      className={cn(
                        "rounded-full px-2.5 py-1 font-mono text-[11px] font-medium transition-colors",
                        isActive
                          ? "bg-[#0D0D0D] text-white"
                          : "text-[#6E6E73] hover:text-[#0D0D0D]"
                      )}
                    >
                      {slide.id}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. CRYSTAL-CLEAR 3-STEP HOW IT WORKS */}
      <section id="how" className="border-t border-[#E5E5E0] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: EASE_SWISS }}
          >
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#0D0D0D] sm:text-3xl">
              How it works
            </h2>
          </motion.div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {HOW_IT_WORKS_STEPS.map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{
                  duration: 0.55,
                  delay: idx * 0.08,
                  ease: EASE_SWISS,
                }}
                className="rounded-2xl border border-[#E5E5E0] bg-white p-8"
              >
                <span className="font-mono text-xs font-medium text-[#1A4BFF]">
                  {item.step}
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-[#0D0D0D]">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#6E6E73]">
                  {item.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SPACIOUS DROP 01 COLLECTION */}
      <section id="collection" className="border-t border-[#E5E5E0] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#0D0D0D] sm:text-3xl">
                Drop 01 — {products.length} Pieces
              </h2>
              <div className="mt-2 flex items-center gap-2 text-xs">
                {showUnlocked ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#1A4BFF]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1A4BFF]" />
                    <span>Vault Unlocked</span>
                  </span>
                ) : (
                  <span className="font-mono text-[#6E6E73]">
                    {revealedCount} Revealed · {lockedCount} Locked
                  </span>
                )}
              </div>
            </div>

            {/* Segmented Pill Filter */}
            <div className="inline-flex self-start rounded-full border border-[#E5E5E0] bg-[#F1F1EE] p-1 sm:self-auto">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "small-batch", label: "Small-Batch" },
                  { id: "one-of-one", label: "One-of-One" },
                ] as const
              ).map((tab) => {
                const active = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setFilter(tab.id)}
                    className={cn(
                      "relative rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "text-[#0D0D0D]"
                        : "text-[#6E6E73] hover:text-[#0D0D0D]"
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="v6-collection-filter"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 34,
                        }}
                        className="absolute inset-0 rounded-full bg-white shadow-xs"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spacious 2-col / 4-col Grid */}
          <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product, idx) => {
              const isLocked = product.isMystery && !showUnlocked;

              if (isLocked) {
                return (
                  <motion.button
                    key={product._id}
                    type="button"
                    suppressHydrationWarning
                    onClick={scrollToWaitlist}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{
                      duration: 0.45,
                      delay: (idx % 4) * 0.05,
                      ease: EASE_SWISS,
                    }}
                    className="group block w-full text-left focus:outline-none"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#F1F1EE]">
                      <img
                        src="/images/look-mystery-veil.jpg"
                        alt="Hidden waitlist garment"
                        className="h-full w-full scale-110 object-cover opacity-85 blur-md transition-transform duration-500 group-hover:scale-[1.13]"
                      />
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E0] bg-white/90 px-4 py-2 text-xs font-medium text-[#0D0D0D] shadow-xs backdrop-blur-md transition-colors group-hover:border-[#0D0D0D]">
                          <Lock className="h-3.5 w-3.5 text-[#1A4BFF]" />
                          <span>Hidden · Clear waitlist to view</span>
                        </span>
                      </div>
                    </div>

                    <div className="mt-3.5 flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm font-medium text-[#6E6E73]">
                        Unseen Piece
                      </p>
                      <span className="shrink-0 font-mono text-xs text-[#6E6E73]">
                        {product.serialCode}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-[#6E6E73]">
                      {product.tier === "one-of-one" ? "1 of 1" : "Small-Batch"}
                    </p>
                  </motion.button>
                );
              }

              return (
                <motion.button
                  key={product._id}
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setSelectedProduct(product)}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.45,
                    delay: (idx % 4) * 0.05,
                    ease: EASE_SWISS,
                  }}
                  className="group block w-full text-left focus:outline-none"
                >
                  <div className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#F1F1EE]">
                    <img
                      src={product.imageUrl}
                      alt={toCleanTitle(product.title)}
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                  </div>

                  {/* Row 1: Title + Price */}
                  <div className="mt-3.5 flex items-baseline justify-between gap-3">
                    <h3 className="truncate text-sm font-medium text-[#0D0D0D]">
                      {toCleanTitle(product.title)}
                    </h3>
                    <span className="shrink-0 font-mono text-sm text-[#0D0D0D]">
                      {formatInr(product.priceInr)}
                    </span>
                  </div>

                  {/* Row 2: Subtle Metadata */}
                  <div className="mt-1 flex items-center justify-between text-xs">
                    {product.tier === "one-of-one" ? (
                      <span className="font-mono font-medium text-[#1A4BFF]">
                        1 of 1
                      </span>
                    ) : (
                      <span className="font-mono text-[#6E6E73]">
                        {product.remainingUnits} of {product.totalUnits} left
                      </span>
                    )}
                    <span className="font-mono text-[#6E6E73]">
                      {product.gsmWeight}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. CLEAN WAITLIST BAND */}
      <section id="waitlist" className="border-t border-[#E5E5E0] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: EASE_SWISS }}
            className="rounded-3xl border border-[#E5E5E0] bg-white p-8 sm:p-12 lg:p-14"
          >
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
              {/* Left Info + Invite Code */}
              <div className="lg:col-span-6">
                <div className="inline-flex items-center gap-2 font-mono text-xs text-[#6E6E73]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1A4BFF]" />
                  <span>{liveQueueCount.toLocaleString("en-IN")} waiting</span>
                </div>

                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#0D0D0D] sm:text-4xl">
                  Reserve your spot in line.
                </h2>

                <p className="mt-3 max-w-md text-sm leading-relaxed text-[#6E6E73]">
                  We admit collectors in small waves across India. When your
                  number is called, your email link unlocks all 10 pieces of
                  Drop 01.
                </p>

                {/* Discreet Invite Code Box */}
                <div className="mt-8 border-t border-[#E5E5E0] pt-6">
                  <p className="text-xs text-[#6E6E73]">
                    Have a code? Try{" "}
                    <span className="font-mono font-medium text-[#0D0D0D]">
                      KNITX-001
                    </span>
                  </p>
                  <form
                    onSubmit={handleCodeSubmit}
                    className="mt-3 flex max-w-sm items-center gap-2"
                  >
                    <input
                      type="text"
                      suppressHydrationWarning
                      value={inviteCode}
                      onChange={(e) => {
                        setInviteCode(e.target.value);
                        if (codeMessage) setCodeMessage(null);
                      }}
                      placeholder="Enter access code"
                      className="w-full rounded-full border border-[#E5E5E0] bg-[#FAFAFA] px-4 py-2 font-mono text-xs text-[#0D0D0D] placeholder:font-sans placeholder:text-[#6E6E73] focus:border-[#0D0D0D] focus:bg-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      suppressHydrationWarning
                      className="shrink-0 rounded-full border border-[#E5E5E0] bg-white px-4 py-2 text-xs font-medium text-[#0D0D0D] transition-colors hover:border-[#0D0D0D]"
                    >
                      Unlock
                    </button>
                  </form>
                  {codeMessage && (
                    <p
                      className={cn(
                        "mt-2 text-xs",
                        codeMessage.type === "ok"
                          ? "text-[#1A4BFF]"
                          : "text-[#DC2626]"
                      )}
                    >
                      {codeMessage.text}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Form / Confirmation Card */}
              <div className="lg:col-span-6">
                <AnimatePresence mode="wait">
                  {!showPass ? (
                    <motion.form
                      key="waitlist-form"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.35, ease: EASE_SWISS }}
                      onSubmit={handleWaitlistSubmit}
                      className="rounded-2xl border border-[#E5E5E0] bg-[#FAFAFA] p-6 sm:p-8"
                    >
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="v6-waitlist-name"
                            className="block text-xs font-medium text-[#0D0D0D]"
                          >
                            Name
                          </label>
                          <input
                            id="v6-waitlist-name"
                            type="text"
                            suppressHydrationWarning
                            required
                            value={waitlistName}
                            onChange={(e) => setWaitlistName(e.target.value)}
                            placeholder="Your full name"
                            className="mt-1.5 w-full rounded-xl border border-[#E5E5E0] bg-white px-4 py-3 text-sm text-[#0D0D0D] placeholder:text-[#6E6E73] focus:border-[#0D0D0D] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="v6-waitlist-email"
                            className="block text-xs font-medium text-[#0D0D0D]"
                          >
                            Email
                          </label>
                          <input
                            id="v6-waitlist-email"
                            type="email"
                            suppressHydrationWarning
                            required
                            value={waitlistEmail}
                            onChange={(e) => setWaitlistEmail(e.target.value)}
                            placeholder="you@domain.com"
                            className="mt-1.5 w-full rounded-xl border border-[#E5E5E0] bg-white px-4 py-3 text-sm text-[#0D0D0D] placeholder:text-[#6E6E73] focus:border-[#0D0D0D] focus:outline-none"
                          />
                        </div>
                      </div>

                      {waitlistError && (
                        <p className="mt-3 text-xs text-[#DC2626]">
                          {waitlistError}
                        </p>
                      )}

                      <button
                        type="submit"
                        suppressHydrationWarning
                        disabled={waitlistSubmitting}
                        className="mt-6 w-full rounded-full bg-[#0D0D0D] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#1A4BFF] disabled:opacity-60"
                      >
                        {waitlistSubmitting
                          ? "Reserving your spot..."
                          : "Join Waitlist"}
                      </button>
                    </motion.form>
                  ) : (
                    <motion.div
                      key="waitlist-confirmed"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.35, ease: EASE_SWISS }}
                      className="rounded-2xl border border-[#E5E5E0] bg-[#FAFAFA] p-6 sm:p-8"
                    >
                      <div className="flex items-center gap-2 text-xs font-medium text-[#1A4BFF]">
                        <Check className="h-4 w-4" />
                        <span>Waitlist Pass Active</span>
                      </div>

                      <p className="mt-4 font-mono text-3xl font-semibold tracking-tight text-[#0D0D0D]">
                        Spot #{showPass.position.toLocaleString("en-IN")}
                      </p>

                      <div className="mt-5 space-y-2.5 border-t border-[#E5E5E0] pt-5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[#6E6E73]">Access Code</span>
                          <span className="font-mono font-medium text-[#0D0D0D]">
                            {showPass.accessCode}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#6E6E73]">Notifications</span>
                          <span className="text-[#0D0D0D]">
                            {showUnlocked
                              ? "Drop unlocked"
                              : "Email alerts active"}
                          </span>
                        </div>
                      </div>

                      {!showUnlocked ? (
                        <button
                          type="button"
                          suppressHydrationWarning
                          onClick={unlockVaultDemo}
                          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1A4BFF] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#143CE0]"
                        >
                          <span>Simulate Number Called</span>
                          <ArrowRight className="h-4 w-4" />
                          <span>Unlock Drop</span>
                        </button>
                      ) : (
                        <a
                          href="#collection"
                          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0D0D0D] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#1A4BFF]"
                        >
                          <span>Explore All {products.length} Pieces</span>
                          <ArrowRight className="h-4 w-4" />
                        </a>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 6. TABBED COMMUNITY STUDIO */}
      <section id="community" className="border-t border-[#E5E5E0] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#0D0D0D] sm:text-3xl">
                Shaped by the community.
              </h2>
              <p className="mt-2 text-sm text-[#6E6E73]">
                Vote on Drop 02 silhouettes or submit your own design to be cut
                and credited.
              </p>
            </div>

            {/* 2-Tab Segmented Switcher */}
            <div className="inline-flex self-start rounded-full border border-[#E5E5E0] bg-[#F1F1EE] p-1 sm:self-auto">
              {(
                [
                  { id: "vote", label: "Vote on Drop 02" },
                  { id: "submit", label: "Submit Your Design" },
                ] as const
              ).map((tab) => {
                const active = communityTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setCommunityTab(tab.id)}
                    className={cn(
                      "relative rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "text-[#0D0D0D]"
                        : "text-[#6E6E73] hover:text-[#0D0D0D]"
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="v6-community-tab"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 34,
                        }}
                        className="absolute inset-0 rounded-full bg-white shadow-xs"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-12">
            <AnimatePresence mode="wait">
              {communityTab === "vote" ? (
                <motion.div
                  key="community-vote"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: EASE_SWISS }}
                  className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                  {voteList.map((candidate) => {
                    const hasVoted = mounted && votedIds.includes(candidate._id);
                    const pct =
                      totalVotes > 0
                        ? Math.round((candidate.votesCount / totalVotes) * 100)
                        : 0;

                    return (
                      <div
                        key={candidate._id}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white"
                      >
                        <div className="aspect-[4/3] w-full overflow-hidden bg-[#F1F1EE]">
                          <img
                            src={candidate.imageUrl}
                            alt={toCleanTitle(candidate.title)}
                            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                          />
                        </div>

                        <div className="flex flex-1 flex-col justify-between p-6">
                          <div>
                            <h3 className="text-base font-semibold tracking-[-0.02em] text-[#0D0D0D]">
                              {toCleanTitle(candidate.title)}
                            </h3>
                            <p className="mt-1 font-mono text-xs text-[#6E6E73]">
                              {candidate.creatorHandle}
                            </p>
                            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#6E6E73]">
                              {candidate.description}
                            </p>
                          </div>

                          <div className="mt-6 border-t border-[#E5E5E0] pt-5">
                            <div className="flex items-center justify-between font-mono text-xs text-[#6E6E73]">
                              <span>
                                {candidate.votesCount.toLocaleString("en-IN")}{" "}
                                votes
                              </span>
                              <span>{pct}%</span>
                            </div>

                            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#F1F1EE]">
                              <motion.div
                                initial={false}
                                animate={{ width: `${Math.max(4, pct)}%` }}
                                transition={{ duration: 0.45, ease: EASE_SWISS }}
                                className={cn(
                                  "h-full rounded-full",
                                  hasVoted ? "bg-[#1A4BFF]" : "bg-[#0D0D0D]"
                                )}
                              />
                            </div>

                            <button
                              type="button"
                              suppressHydrationWarning
                              disabled={hasVoted || votingId === candidate._id}
                              onClick={() => void handleVote(candidate._id)}
                              className={cn(
                                "mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-medium transition-colors",
                                hasVoted
                                  ? "border border-[#1A4BFF]/25 bg-[#1A4BFF]/8 text-[#1A4BFF]"
                                  : "bg-[#0D0D0D] text-white hover:bg-[#1A4BFF]"
                              )}
                            >
                              {hasVoted ? (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Voted</span>
                                </>
                              ) : (
                                <span>Vote</span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="community-submit"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: EASE_SWISS }}
                  className="rounded-3xl border border-[#E5E5E0] bg-white p-8 sm:p-10"
                >
                  {subConfirmation ? (
                    <div className="mx-auto max-w-lg py-6 text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#1A4BFF]/10 text-[#1A4BFF]">
                        <Check className="h-5 w-5" />
                      </div>
                      <h3 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-[#0D0D0D]">
                        Design received.
                      </h3>
                      <p className="mt-2 text-sm text-[#6E6E73]">
                        &ldquo;{subConfirmation.title}&rdquo; by{" "}
                        <span className="font-mono text-[#0D0D0D]">
                          {subConfirmation.creatorHandle}
                        </span>{" "}
                        has been added to the Drop 02 curation queue.
                      </p>
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setSubConfirmation(null)}
                        className="mt-7 rounded-full border border-[#E5E5E0] bg-white px-6 py-2.5 text-xs font-medium text-[#0D0D0D] transition-colors hover:border-[#0D0D0D]"
                      >
                        Submit another design
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSubmissionSubmit}
                      className="grid grid-cols-1 gap-10 lg:grid-cols-12"
                    >
                      <div className="space-y-4 lg:col-span-7">
                        <div>
                          <label
                            htmlFor="v6-sub-title"
                            className="block text-xs font-medium text-[#0D0D0D]"
                          >
                            Design Title
                          </label>
                          <input
                            id="v6-sub-title"
                            type="text"
                            suppressHydrationWarning
                            required
                            value={subTitle}
                            onChange={(e) => setSubTitle(e.target.value)}
                            placeholder="e.g. Heavyweight Raw-Edge Work Jacket"
                            className="mt-1.5 w-full rounded-xl border border-[#E5E5E0] bg-[#FAFAFA] px-4 py-3 text-sm text-[#0D0D0D] placeholder:text-[#6E6E73] focus:border-[#0D0D0D] focus:bg-white focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="v6-sub-name"
                              className="block text-xs font-medium text-[#0D0D0D]"
                            >
                              Your Name
                            </label>
                            <input
                              id="v6-sub-name"
                              type="text"
                              suppressHydrationWarning
                              required
                              value={subName}
                              onChange={(e) => setSubName(e.target.value)}
                              placeholder="Aarav Mehta"
                              className="mt-1.5 w-full rounded-xl border border-[#E5E5E0] bg-[#FAFAFA] px-4 py-3 text-sm text-[#0D0D0D] placeholder:text-[#6E6E73] focus:border-[#0D0D0D] focus:bg-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="v6-sub-handle"
                              className="block text-xs font-medium text-[#0D0D0D]"
                            >
                              Handle
                            </label>
                            <input
                              id="v6-sub-handle"
                              type="text"
                              suppressHydrationWarning
                              value={subHandle}
                              onChange={(e) => setSubHandle(e.target.value)}
                              placeholder="@aarav.studio"
                              className="mt-1.5 w-full rounded-xl border border-[#E5E5E0] bg-[#FAFAFA] px-4 py-3 font-mono text-sm text-[#0D0D0D] placeholder:font-sans placeholder:text-[#6E6E73] focus:border-[#0D0D0D] focus:bg-white focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="v6-sub-email"
                              className="block text-xs font-medium text-[#0D0D0D]"
                            >
                              Email
                            </label>
                            <input
                              id="v6-sub-email"
                              type="email"
                              suppressHydrationWarning
                              value={subEmail}
                              onChange={(e) => setSubEmail(e.target.value)}
                              placeholder="you@domain.com"
                              className="mt-1.5 w-full rounded-xl border border-[#E5E5E0] bg-[#FAFAFA] px-4 py-3 text-sm text-[#0D0D0D] placeholder:text-[#6E6E73] focus:border-[#0D0D0D] focus:bg-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="v6-sub-category"
                              className="block text-xs font-medium text-[#0D0D0D]"
                            >
                              Category
                            </label>
                            <select
                              id="v6-sub-category"
                              suppressHydrationWarning
                              value={subCategory}
                              onChange={(e) => setSubCategory(e.target.value)}
                              className="mt-1.5 w-full rounded-xl border border-[#E5E5E0] bg-[#FAFAFA] px-4 py-3 text-sm text-[#0D0D0D] focus:border-[#0D0D0D] focus:bg-white focus:outline-none"
                            >
                              <option value="Small-Batch">
                                Small-Batch (3–4 Units)
                              </option>
                              <option value="One-of-One">
                                One-of-One Collector
                              </option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="v6-sub-notes"
                            className="block text-xs font-medium text-[#0D0D0D]"
                          >
                            Notes
                          </label>
                          <textarea
                            id="v6-sub-notes"
                            suppressHydrationWarning
                            required
                            rows={4}
                            value={subNotes}
                            onChange={(e) => setSubNotes(e.target.value)}
                            placeholder="Fabric weight, wash, stitching details, or silhouette fit..."
                            className="mt-1.5 w-full resize-none rounded-xl border border-[#E5E5E0] bg-[#FAFAFA] px-4 py-3 text-sm text-[#0D0D0D] placeholder:text-[#6E6E73] focus:border-[#0D0D0D] focus:bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Right Column: Reference Silhouette + Submit */}
                      <div className="flex flex-col justify-between lg:col-span-5">
                        <div>
                          <p className="text-xs font-medium text-[#0D0D0D]">
                            Reference Silhouette
                          </p>
                          <div className="mt-2.5 grid grid-cols-2 gap-3">
                            {PRESET_PHOTOS.map((preset) => {
                              const selected = subPhoto === preset.url;
                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  suppressHydrationWarning
                                  onClick={() => setSubPhoto(preset.url)}
                                  className={cn(
                                    "group overflow-hidden rounded-xl border text-left transition-all",
                                    selected
                                      ? "border-[#1A4BFF] ring-2 ring-[#1A4BFF]/20"
                                      : "border-[#E5E5E0] hover:border-[#0D0D0D]"
                                  )}
                                >
                                  <div className="aspect-[4/3] w-full overflow-hidden bg-[#F1F1EE]">
                                    <img
                                      src={preset.url}
                                      alt={preset.label}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between px-3 py-2">
                                    <span className="truncate text-[11px] font-medium text-[#0D0D0D]">
                                      {preset.label}
                                    </span>
                                    {selected && (
                                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1A4BFF]" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mt-6">
                          {subError && (
                            <p className="mb-3 text-xs text-[#DC2626]">
                              {subError}
                            </p>
                          )}
                          <button
                            type="submit"
                            suppressHydrationWarning
                            disabled={subLoading}
                            className="w-full rounded-full bg-[#0D0D0D] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#1A4BFF] disabled:opacity-60"
                          >
                            {subLoading ? "Submitting..." : "Submit Design"}
                          </button>
                          <p className="mt-3 text-center font-mono text-[11px] text-[#6E6E73]">
                            {recentSubmissions.length} concepts currently in
                            review for Drop 02
                          </p>
                        </div>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 7. MINIMAL FOOTER (pb-24 clearance for VersionSwitcher) */}
      <footer className="border-t border-[#E5E5E0] bg-[#FAFAFA] pb-24 pt-10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 text-xs text-[#6E6E73] sm:flex-row sm:items-center">
          <p>
            <span className="font-semibold text-[#0D0D0D]">KNITX</span> · Made
            in India · Small-Batch &amp; 1-of-1 Streetwear
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#collection"
              className="transition-colors hover:text-[#0D0D0D]"
            >
              Collection
            </a>
            <a href="#how" className="transition-colors hover:text-[#0D0D0D]">
              How it works
            </a>
            <a
              href="#waitlist"
              className="transition-colors hover:text-[#0D0D0D]"
            >
              Waitlist
            </a>
            <a
              href="#community"
              className="transition-colors hover:text-[#0D0D0D]"
            >
              Community
            </a>
          </div>
        </div>
      </footer>

      {/* RIGHT SLIDE-OVER PRODUCT SHEET */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div
              key="v6-sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 z-50 bg-[#0D0D0D]/30 backdrop-blur-[2px]"
            />

            <motion.aside
              key="v6-sheet-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 36 }}
              aria-label={toCleanTitle(selectedProduct.title)}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col border-l border-[#E5E5E0] bg-white shadow-2xl"
            >
              {/* Top Bar */}
              <div className="flex items-center justify-between border-b border-[#E5E5E0] px-6 py-4">
                <span className="font-mono text-xs text-[#6E6E73]">
                  {selectedProduct.serialCode}
                </span>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setSelectedProduct(null)}
                  aria-label="Close product sheet"
                  className="rounded-full p-1.5 text-[#6E6E73] transition-colors hover:bg-[#F1F1EE] hover:text-[#0D0D0D]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#F1F1EE]">
                  <img
                    src={selectedProduct.imageUrl}
                    alt={toCleanTitle(selectedProduct.title)}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="mt-6 flex items-baseline justify-between gap-4">
                  <h3 className="text-xl font-semibold tracking-[-0.03em] text-[#0D0D0D]">
                    {toCleanTitle(selectedProduct.title)}
                  </h3>
                  <span className="shrink-0 font-mono text-lg font-medium text-[#0D0D0D]">
                    {formatInr(selectedProduct.priceInr)}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-3 font-mono text-xs">
                  {selectedProduct.tier === "one-of-one" ? (
                    <span className="font-medium text-[#1A4BFF]">1 of 1</span>
                  ) : (
                    <span className="text-[#6E6E73]">
                      {selectedProduct.remainingUnits} of{" "}
                      {selectedProduct.totalUnits} left
                    </span>
                  )}
                  <span className="text-[#E5E5E0]">·</span>
                  <span className="text-[#6E6E73]">
                    {selectedProduct.gsmWeight}
                  </span>
                  <span className="text-[#E5E5E0]">·</span>
                  <span className="text-[#6E6E73]">
                    {selectedProduct.productionDays}d to craft
                  </span>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-[#6E6E73]">
                  {selectedProduct.description}
                </p>

                {/* Size Selector */}
                <div className="mt-7">
                  <p className="text-xs font-medium text-[#0D0D0D]">Size</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {selectedProduct.sizes.map((size) => {
                      const active = selectedSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          suppressHydrationWarning
                          onClick={() => {
                            setSelectedSize(size);
                            setBagFeedback(null);
                          }}
                          className={cn(
                            "rounded-full border px-4 py-2 font-mono text-xs transition-colors",
                            active
                              ? "border-[#0D0D0D] bg-[#0D0D0D] text-white"
                              : "border-[#E5E5E0] bg-white text-[#0D0D0D] hover:border-[#0D0D0D]"
                          )}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quiet Spec Details */}
                <div className="mt-7 border-t border-[#E5E5E0] pt-5">
                  <p className="text-xs font-medium text-[#0D0D0D]">Details</p>
                  <p className="mt-2 text-xs text-[#6E6E73]">
                    {selectedProduct.fabric}
                  </p>
                  {selectedProduct.craftsmanship.length > 0 && (
                    <ul className="mt-3 space-y-1.5 text-xs text-[#6E6E73]">
                      {selectedProduct.craftsmanship.map((detail) => (
                        <li key={detail} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#0D0D0D]" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {bagFeedback && (
                  <p className="mt-4 text-xs text-[#DC2626]">{bagFeedback}</p>
                )}
              </div>

              {/* Sticky Bottom CTA */}
              <div className="border-t border-[#E5E5E0] bg-white p-6">
                <button
                  type="button"
                  suppressHydrationWarning
                  disabled={selectedProduct.remainingUnits <= 0}
                  onClick={handleAddToBag}
                  className="w-full rounded-full bg-[#0D0D0D] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#1A4BFF] disabled:opacity-50"
                >
                  {selectedProduct.remainingUnits <= 0
                    ? "Sold Out"
                    : `Add to Bag — ${formatInr(selectedProduct.priceInr)}`}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
