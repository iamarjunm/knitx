"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  Check,
  Lock,
  ShoppingBag,
  User,
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

interface V7ExperienceProps {
  drop: DropCampaign;
  products: Product[];
  candidates: VoteCandidate[];
  submissions: CreatorSubmissionItem[];
}

type CollectionFilter = "all" | "revealed" | "hidden";
type CommunityTab = "vote" | "submit" | "craft";

const VOTED_STORAGE_KEY = "knitx_v7_voted_ids";

const SUBMISSION_TEMPLATES = [
  {
    id: "hoodie",
    label: "Heavy Hoodie",
    category: "Small-Batch Hoodie",
    imageUrl: "/images/look-batch-hoodie.jpg",
  },
  {
    id: "tee",
    label: "Boxy Tee",
    category: "Small-Batch Tee",
    imageUrl: "/images/look-batch-tee.jpg",
  },
  {
    id: "jacket",
    label: "Archive Outerwear",
    category: "1-of-1 Outerwear",
    imageUrl: "/images/look-1of1-jacket.jpg",
  },
  {
    id: "knit",
    label: "Sculpted Knit",
    category: "1-of-1 Knitwear",
    imageUrl: "/images/look-1of1-knit.jpg",
  },
] as const;

const SUBMISSION_CATEGORIES = [
  "Small-Batch Hoodie",
  "Small-Batch Tee",
  "1-of-1 Outerwear",
  "1-of-1 Knitwear",
] as const;

const CRAFT_STEPS = [
  {
    number: "01",
    title: "Teaser & Reels",
    description:
      "Every silhouette begins as a quiet film and lookbook study before a single roll of fabric is cut.",
  },
  {
    number: "02",
    title: "Community Vote",
    description:
      "Collectors and independent designers vote on which concepts move into the next numbered drop.",
  },
  {
    number: "03",
    title: "One Sample Shot",
    description:
      "We pattern, stitch, and photograph one physical atelier sample to perfect weight, drape, and finish.",
  },
  {
    number: "04",
    title: "Cut After You Order",
    description:
      "Your piece is cut and hand-finished in India only after you claim it — ensuring zero deadstock.",
  },
] as const;

function toEditorialTitle(raw: string): string {
  const preserveUpper = new Set(["GSM", "420GSM", "480GSM", "310GSM", "KNITX", "KX"]);
  return raw
    .split(" ")
    .map((word) => {
      const upper = word.toUpperCase();
      if (preserveUpper.has(upper) || /^\d+\/\d+$/.test(word) || /^\d+GSM$/i.test(word)) {
        return upper;
      }
      if (word.includes("-")) {
        return word
          .split("-")
          .map((part) =>
            part.length > 0
              ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
              : part
          )
          .join("-");
      }
      return word.length > 0
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : word;
    })
    .join(" ");
}

function formatDropLabel(dropNumber: string): string {
  const digits = dropNumber.replace(/\D/g, "");
  if (!digits) return "DROP 01";
  const parsed = Number.parseInt(digits, 10);
  if (!Number.isFinite(parsed)) return "DROP 01";
  return `DROP ${String(parsed).padStart(2, "0")}`;
}

export default function V7Experience({
  drop,
  products,
  candidates: initialCandidates,
  submissions: initialSubmissions,
}: V7ExperienceProps) {
  const { user, setAuthModalOpen } = useAuth();
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

  const [mounted, setMounted] = useState(false);

  // Collection state
  const [collectionFilter, setCollectionFilter] =
    useState<CollectionFilter>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [bagFeedback, setBagFeedback] = useState<string | null>(null);

  // Waitlist state
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [showCodeField, setShowCodeField] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [accessCodeFeedback, setAccessCodeFeedback] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  // Community tabs state
  const [communityTab, setCommunityTab] = useState<CommunityTab>("vote");
  const [candidates, setCandidates] =
    useState<VoteCandidate[]>(initialCandidates);
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [votingId, setVotingId] = useState<string | null>(null);

  // Creator submission state
  const [submissions, setSubmissions] =
    useState<CreatorSubmissionItem[]>(initialSubmissions);
  const [subTitle, setSubTitle] = useState("");
  const [subCreatorName, setSubCreatorName] = useState("");
  const [subHandle, setSubHandle] = useState("");
  const [subEmail, setSubEmail] = useState("");
  const [subCategory, setSubCategory] = useState<string>(
    SUBMISSION_CATEGORIES[0]
  );
  const [subNotes, setSubNotes] = useState("");
  const [subTemplateId, setSubTemplateId] = useState<string>(
    SUBMISSION_TEMPLATES[0].id
  );
  const [submittingDesign, setSubmittingDesign] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  // Hero scroll parallax
  const heroFrameRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroFrameRef,
    offset: ["start end", "end start"],
  });
  const heroImageScale = useTransform(scrollYProgress, [0, 1], [1.0, 1.07]);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = window.localStorage.getItem(VOTED_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          setVotedIds(parsed.filter((id): id is string => typeof id === "string"));
        }
      }
    } catch {
      // Ignore storage read issues
    }
  }, []);

  // Pre-fill email/name softly if user signs in
  useEffect(() => {
    if (!mounted || !user) return;
    if (user.displayName) {
      setWaitlistName((prev) => prev || user.displayName);
    }
    if (user.email) {
      setWaitlistEmail((prev) => prev || user.email);
    }
  }, [mounted, user]);

  // Escape key to close quick-view modal
  useEffect(() => {
    if (!selectedProduct) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedProduct(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedProduct]);

  // Guard all client-hydrated states behind `mounted`
  const safeVaultUnlocked = mounted ? isVaultUnlocked : false;
  const safeWaitlistPass = mounted ? waitlistPass : null;
  const safeCartCount = mounted ? cartCount : 0;
  const safeUser = mounted ? user : null;
  const safeVotedIds = mounted ? votedIds : [];

  const dropLabel = formatDropLabel(drop.dropNumber);

  const revealedCount = useMemo(
    () =>
      products.filter((item) => !item.isMystery || safeVaultUnlocked).length,
    [products, safeVaultUnlocked]
  );

  const hiddenCount = useMemo(
    () =>
      products.filter((item) => item.isMystery && !safeVaultUnlocked).length,
    [products, safeVaultUnlocked]
  );

  const filteredProducts = useMemo(() => {
    if (collectionFilter === "revealed") {
      return products.filter((item) => !item.isMystery || safeVaultUnlocked);
    }
    if (collectionFilter === "hidden") {
      return products.filter((item) => item.isMystery && !safeVaultUnlocked);
    }
    return products;
  }, [collectionFilter, products, safeVaultUnlocked]);

  const totalVotes = useMemo(
    () => candidates.reduce((acc, item) => acc + item.votesCount, 0),
    [candidates]
  );

  const selectedTemplate = useMemo(
    () =>
      SUBMISSION_TEMPLATES.find((tpl) => tpl.id === subTemplateId) ??
      SUBMISSION_TEMPLATES[0],
    [subTemplateId]
  );

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const openQuickView = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize(product.sizes[0] ?? "ONE SIZE");
    setBagFeedback(null);
  };

  const handleAddToBag = () => {
    if (!selectedProduct) return;
    const sizeToUse = selectedSize || selectedProduct.sizes[0] || "ONE SIZE";
    const result = addToCart(selectedProduct, sizeToUse);
    if (!result.ok) {
      setBagFeedback(result.message ?? "Unable to add this piece to your bag.");
      return;
    }
    setBagFeedback(null);
    setSelectedProduct(null);
    setCartOpen(true);
  };

  const handleJoinWaitlist = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWaitlistError(null);

    const trimmedName = waitlistName.trim();
    const trimmedEmail = waitlistEmail.trim();

    if (!trimmedName) {
      setWaitlistError("Please enter your name to reserve a spot.");
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setWaitlistError("Please enter a valid email address.");
      return;
    }

    setWaitlistSubmitting(true);
    try {
      await joinWaitlist(trimmedName, trimmedEmail);
    } catch (err) {
      setWaitlistError(
        err instanceof Error
          ? err.message
          : "Could not complete waitlist registration."
      );
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  const handleCodeUnlock = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccessCodeFeedback(null);
    const trimmed = accessCodeInput.trim();
    if (!trimmed) {
      setAccessCodeFeedback({
        type: "error",
        text: "Enter your invitation code to continue.",
      });
      return;
    }
    const ok = unlockVaultWithCode(trimmed);
    if (!ok) {
      setAccessCodeFeedback({
        type: "error",
        text: "Code not recognized. Try KNITX-001 to preview full access.",
      });
      return;
    }
    setAccessCodeFeedback({
      type: "success",
      text: "Access granted. All 10 silhouettes are now revealed.",
    });
    setAccessCodeInput("");
  };

  const handleVote = async (candidate: VoteCandidate) => {
    if (safeVotedIds.includes(candidate._id) || votingId === candidate._id) {
      return;
    }

    setVotingId(candidate._id);
    const nextVoted = [...votedIds, candidate._id];
    setVotedIds(nextVoted);
    setCandidates((prev) =>
      prev.map((item) =>
        item._id === candidate._id
          ? { ...item, votesCount: item.votesCount + 1 }
          : item
      )
    );

    try {
      window.localStorage.setItem(VOTED_STORAGE_KEY, JSON.stringify(nextVoted));
    } catch {
      // Ignore storage write issues
    }

    try {
      await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: candidate._id,
          uid: safeUser?.uid,
        }),
      });
    } catch {
      // Optimistic count remains intact
    } finally {
      setVotingId(null);
    }
  };

  const handleSubmitDesign = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setSubmissionFeedback(null);

    if (!subTitle.trim() || !subCreatorName.trim() || !subNotes.trim()) {
      setSubmissionFeedback({
        type: "error",
        text: "Please complete your design title, name, and craft notes.",
      });
      return;
    }

    setSubmittingDesign(true);
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: subTitle.trim(),
          creatorName: subCreatorName.trim(),
          creatorHandle: subHandle.trim(),
          email: subEmail.trim(),
          category: subCategory,
          craftsmanshipNotes: subNotes.trim(),
          imageUrl: selectedTemplate.imageUrl,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        submission?: CreatorSubmissionItem;
      };

      const createdSubmission = data.submission;
      if (!response.ok || !data.ok || !createdSubmission) {
        throw new Error(data.error || "Unable to submit design concept.");
      }

      setSubmissions((prev) => [createdSubmission, ...prev]);
      setSubTitle("");
      setSubNotes("");
      setSubmissionFeedback({
        type: "success",
        text: "Concept received. Selected pieces enter the next community vote.",
      });
    } catch (err) {
      setSubmissionFeedback({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Unable to submit design right now.",
      });
    } finally {
      setSubmittingDesign(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-[#181614] selection:bg-[#254336] selection:text-white">
      {/* 1. REFINED CENTERED-WORDMARK HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#DED8CB] bg-[#F6F3EC]/92 backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-3 items-center px-5 sm:px-8">
          {/* Left quiet links */}
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-7 md:flex"
          >
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => scrollToSection("collection")}
              className="text-xs tracking-[0.12em] uppercase text-[#767067] transition-colors hover:text-[#181614]"
            >
              Collection
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => scrollToSection("waitlist")}
              className="text-xs tracking-[0.12em] uppercase text-[#767067] transition-colors hover:text-[#181614]"
            >
              Waitlist
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => scrollToSection("community")}
              className="text-xs tracking-[0.12em] uppercase text-[#767067] transition-colors hover:text-[#181614]"
            >
              Community
            </button>
          </nav>

          {/* Mobile left quiet action */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => scrollToSection("collection")}
              className="text-[11px] tracking-[0.12em] uppercase text-[#767067] transition-colors hover:text-[#181614]"
            >
              Collection
            </button>
          </div>

          {/* Center iconic wordmark */}
          <div className="flex justify-center">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="font-editorial text-2xl tracking-[0.06em] text-[#181614] transition-opacity hover:opacity-75 sm:text-[1.7rem]"
            >
              KNITX
            </button>
          </div>

          {/* Right status, bag, account */}
          <div className="flex items-center justify-end gap-4 sm:gap-6">
            {safeVaultUnlocked ? (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => scrollToSection("collection")}
                className="hidden items-center gap-1.5 text-xs font-medium text-[#254336] sm:inline-flex"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#254336]" />
                Vault Open
              </button>
            ) : (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => scrollToSection("waitlist")}
                className="hidden text-xs tracking-[0.1em] uppercase text-[#767067] transition-colors hover:text-[#181614] sm:inline-block"
              >
                Waitlist
              </button>
            )}

            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setCartOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-[#181614] transition-opacity hover:opacity-70"
            >
              <ShoppingBag className="h-3.5 w-3.5 stroke-[1.6]" />
              <span>
                Bag{" "}
                <span className="font-mono text-[11px] text-[#767067]">
                  ({safeCartCount})
                </span>
              </span>
            </button>

            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-[#767067] transition-colors hover:text-[#181614]"
            >
              <User className="h-3.5 w-3.5 stroke-[1.6]" />
              <span className="hidden sm:inline">
                {safeUser ? "Account" : "Sign In"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. CINEMATIC EDITORIAL HERO */}
      <section className="px-4 pt-10 pb-20 sm:px-8 sm:pt-14 sm:pb-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-3xl text-center"
          >
            <p className="text-[11px] tracking-[0.22em] uppercase text-[#767067]">
              {dropLabel} · MADE IN INDIA
            </p>

            <h1 className="mt-4 font-editorial text-5xl leading-[0.95] tracking-[-0.015em] text-[#181614] sm:text-7xl lg:text-[5.5rem]">
              Small batches.{" "}
              <em className="italic font-normal">Never restocked.</em>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-[#767067] sm:text-base">
              Waitlist-only streetwear crafted in runs of 3–4 pieces and
              singular 1-of-1 editions — cut only after you order.
            </p>
          </motion.div>

          {/* Framed lookbook hero with gentle scroll-linked scale */}
          <motion.div
            ref={heroFrameRef}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.85,
              delay: 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative mt-10 aspect-[16/9] max-h-[540px] w-full overflow-hidden rounded-2xl border border-[#DED8CB] bg-[#ECE7DC] sm:mt-12"
          >
            <motion.div
              style={{ scale: heroImageScale }}
              className="relative h-full w-full will-change-transform"
            >
              <Image
                src="/images/hero-editorial-light.jpg"
                alt="KNITX Drop 01 lookbook editorial"
                fill
                priority
                sizes="(max-width: 1200px) 100vw, 1152px"
                className="object-cover object-center"
              />
            </motion.div>

            {/* Subtle warm-dark bottom scrim for legibility */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#181614]/40 via-[#181614]/10 to-transparent" />

            {/* Single floating olive CTA pill */}
            <div className="absolute inset-x-0 bottom-6 flex justify-center px-4 sm:bottom-8">
              <button
                type="button"
                suppressHydrationWarning
                onClick={() =>
                  scrollToSection(safeVaultUnlocked ? "collection" : "waitlist")
                }
                className="inline-flex items-center gap-2.5 rounded-full bg-[#254336] px-6 py-3 text-xs font-medium tracking-[0.06em] text-white shadow-lg transition-all duration-300 hover:bg-[#1D352B] hover:shadow-xl sm:px-7 sm:py-3.5 sm:text-sm"
              >
                <span>
                  {safeVaultUnlocked
                    ? "Explore All 10 Pieces"
                    : `Join the ${toEditorialTitle(dropLabel)} Waitlist`}
                </span>
                <ArrowRight className="h-4 w-4 stroke-[1.75]" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. TWO EDITIONS — INSTANT CLARITY */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-[#767067]">
              Two Editions
            </p>
            <h2 className="mt-2 font-editorial text-4xl leading-tight text-[#181614] sm:text-5xl">
              Numbered by craft.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[#767067]">
            Every drop pairs tightly capped small-batch silhouettes with
            singular collector works.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Small-Batch Card */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="group overflow-hidden rounded-2xl border border-[#DED8CB] bg-white"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#ECE7DC]">
              <Image
                src="/images/look-batch-hoodie.jpg"
                alt="KNITX Small-Batch heavyweight hoodie"
                fill
                sizes="(max-width: 768px) 100vw, 560px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            </div>
            <div className="p-7 sm:p-8">
              <p className="font-mono text-xs text-[#767067]">
                3–4 units per design · ₹2,500–₹4,000
              </p>
              <h3 className="mt-2 font-editorial text-3xl text-[#181614]">
                Small-Batch Pieces
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#767067]">
                Heavyweight fabrics, custom embroidery, and puff prints — cut
                in strictly capped runs and retired the moment they clear.
              </p>
            </div>
          </motion.article>

          {/* One-of-One Card */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{
              duration: 0.65,
              delay: 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="group overflow-hidden rounded-2xl border border-[#DED8CB] bg-white"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#ECE7DC]">
              <Image
                src="/images/look-1of1-jacket.jpg"
                alt="KNITX One-of-One Collector jacket"
                fill
                sizes="(max-width: 768px) 100vw, 560px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            </div>
            <div className="p-7 sm:p-8">
              <p className="font-mono text-xs text-[#254336]">
                Only 1 piece in the world · ₹5,000–₹10,000+
              </p>
              <h3 className="mt-2 font-editorial text-3xl text-[#181614]">
                One-of-One Collector’s
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#767067]">
                Bespoke patches, hand-painting, and individual numbering —
                created once in the studio and never repeated.
              </p>
            </div>
          </motion.article>
        </div>
      </section>

      {/* 4. SERENE DROP 01 LOOKBOOK */}
      <section
        id="collection"
        className="border-y border-[#DED8CB] bg-[#ECE7DC]/55 py-24"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col justify-between gap-6 border-b border-[#DED8CB] pb-7 md:flex-row md:items-end">
            <div>
              <h2 className="font-editorial text-4xl text-[#181614] sm:text-5xl">
                {toEditorialTitle(dropLabel)} Collection
              </h2>
              <p className="mt-2 text-sm text-[#767067]">
                {safeVaultUnlocked
                  ? `Your access is active. All ${products.length} pieces are revealed and ready to claim.`
                  : `Half revealed publicly. Clear the waitlist to see all ${products.length}.`}
              </p>
            </div>

            {/* Simple underline tabs */}
            <div
              role="tablist"
              aria-label="Filter collection"
              className="flex items-center gap-7"
            >
              {(
                [
                  { id: "all", label: `All (${products.length})` },
                  { id: "revealed", label: `Revealed (${revealedCount})` },
                  { id: "hidden", label: `Hidden (${hiddenCount})` },
                ] as const
              ).map((tab) => {
                const isActive = collectionFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    suppressHydrationWarning
                    onClick={() => setCollectionFilter(tab.id)}
                    className={cn(
                      "relative pb-2.5 text-xs tracking-[0.08em] uppercase transition-colors",
                      isActive
                        ? "font-medium text-[#181614]"
                        : "text-[#767067] hover:text-[#181614]"
                    )}
                  >
                    {tab.label}
                    {isActive && (
                      <motion.span
                        layoutId="v7-collection-underline"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 32,
                        }}
                        className="absolute inset-x-0 bottom-0 h-[1.5px] bg-[#254336]"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spacious 2-to-4 column photography grid */}
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-editorial italic text-2xl text-[#181614]">
                Every silhouette in this drop is now unlocked.
              </p>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setCollectionFilter("all")}
                className="mt-4 text-xs tracking-[0.12em] uppercase text-[#254336] underline underline-offset-4"
              >
                View all pieces
              </button>
            </div>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {filteredProducts.map((product, index) => {
                const isHidden = product.isMystery && !safeVaultUnlocked;

                if (isHidden) {
                  return (
                    <motion.button
                      key={product._id}
                      type="button"
                      suppressHydrationWarning
                      onClick={() => scrollToSection("waitlist")}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{
                        duration: 0.55,
                        delay: Math.min(index * 0.04, 0.2),
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="group block text-left"
                    >
                      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-[#DED8CB] bg-[#ECE7DC]">
                        <Image
                          src={product.silhouetteUrl || "/images/look-mystery-veil.jpg"}
                          alt="Hidden waitlist silhouette"
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="scale-105 object-cover blur-[7px] opacity-85 transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-[#F6F3EC]/45 transition-colors duration-500 group-hover:bg-[#F6F3EC]/35" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                          <Lock className="mb-3 h-4 w-4 stroke-[1.5] text-[#254336]" />
                          <p className="font-editorial italic text-2xl leading-snug text-[#181614]">
                            Hidden until your number is called
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-baseline justify-between gap-3">
                        <p className="text-sm text-[#767067]">
                          Waitlist-Only Silhouette
                        </p>
                        <span className="font-mono text-[11px] text-[#767067]">
                          {product.tier === "one-of-one" ? "1/1" : `0${product.totalUnits} units`}
                        </span>
                      </div>
                    </motion.button>
                  );
                }

                return (
                  <motion.button
                    key={product._id}
                    type="button"
                    suppressHydrationWarning
                    onClick={() => openQuickView(product)}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{
                      duration: 0.55,
                      delay: Math.min(index * 0.04, 0.2),
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="group block text-left"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#ECE7DC]">
                      <Image
                        src={product.imageUrl}
                        alt={toEditorialTitle(product.title)}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                    </div>

                    <div className="mt-4 space-y-1.5">
                      <h3 className="text-[15px] font-medium leading-snug text-[#181614] transition-colors group-hover:text-[#254336]">
                        {toEditorialTitle(product.title)}
                      </h3>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-[#181614]">
                          {formatInr(product.priceInr)}
                        </span>
                        {product.tier === "one-of-one" ? (
                          <span className="text-xs font-medium text-[#254336]">
                            One of One
                          </span>
                        ) : (
                          <span className="text-xs text-[#767067]">
                            {product.remainingUnits} of {product.totalUnits}{" "}
                            available
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 5A. CALM WAITLIST CARD */}
      <section
        id="waitlist"
        className="mx-auto max-w-3xl px-6 py-24 text-center"
      >
        <p className="text-[11px] tracking-[0.22em] uppercase text-[#767067]">
          {dropLabel} ACCESS · {drop.waitlistCount.toLocaleString("en-IN")} IN LINE
        </p>

        <h2 className="mt-3 font-editorial italic text-4xl leading-tight text-[#181614] sm:text-6xl">
          Reserve your place in line.
        </h2>

        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#767067]">
          Access opens in quiet waves across India so every numbered piece is
          claimed fairly and cut to order.
        </p>

        <div className="mt-10 rounded-2xl border border-[#DED8CB] bg-white p-8 text-left shadow-xs sm:p-10">
          {!safeWaitlistPass ? (
            <div>
              <form onSubmit={handleJoinWaitlist} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="v7-waitlist-name"
                      className="mb-1.5 block text-xs text-[#767067]"
                    >
                      Full Name
                    </label>
                    <input
                      id="v7-waitlist-name"
                      type="text"
                      suppressHydrationWarning
                      value={waitlistName}
                      onChange={(e) => setWaitlistName(e.target.value)}
                      placeholder="Aarav Sharma"
                      className="w-full rounded-xl border border-[#DED8CB] bg-[#F6F3EC]/50 px-4 py-3 text-sm text-[#181614] placeholder:text-[#767067]/60 focus:border-[#254336] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="v7-waitlist-email"
                      className="mb-1.5 block text-xs text-[#767067]"
                    >
                      Email Address
                    </label>
                    <input
                      id="v7-waitlist-email"
                      type="email"
                      suppressHydrationWarning
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      placeholder="you@domain.in"
                      className="w-full rounded-xl border border-[#DED8CB] bg-[#F6F3EC]/50 px-4 py-3 text-sm text-[#181614] placeholder:text-[#767067]/60 focus:border-[#254336] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {waitlistError && (
                  <p className="text-xs text-[#8F3A2B]">{waitlistError}</p>
                )}

                <button
                  type="submit"
                  suppressHydrationWarning
                  disabled={waitlistSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#254336] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#1D352B] disabled:opacity-60"
                >
                  <span>
                    {waitlistSubmitting ? "Reserving your place…" : "Join Waitlist"}
                  </span>
                  {!waitlistSubmitting && (
                    <ArrowRight className="h-4 w-4 stroke-[1.75]" />
                  )}
                </button>
              </form>

              {/* Quiet access code option */}
              <div className="mt-7 border-t border-[#DED8CB] pt-6 text-center">
                {!showCodeField ? (
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setShowCodeField(true)}
                    className="text-xs text-[#767067] transition-colors hover:text-[#181614]"
                  >
                    Have an access code?{" "}
                    <span className="font-mono text-[#254336] underline underline-offset-4">
                      Try KNITX-001
                    </span>
                  </button>
                ) : (
                  <form
                    onSubmit={handleCodeUnlock}
                    className="mx-auto max-w-md space-y-3"
                  >
                    <p className="text-xs text-[#767067]">
                      Have an access code?{" "}
                      <span className="font-mono text-[#181614]">
                        Try KNITX-001
                      </span>
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        suppressHydrationWarning
                        value={accessCodeInput}
                        onChange={(e) => setAccessCodeInput(e.target.value)}
                        placeholder="KNITX-001"
                        className="flex-1 rounded-xl border border-[#DED8CB] bg-[#F6F3EC]/50 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-[#181614] placeholder:text-[#767067]/60 focus:border-[#254336] focus:bg-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        suppressHydrationWarning
                        className="rounded-xl border border-[#181614] px-5 py-2.5 text-xs font-medium text-[#181614] transition-colors hover:bg-[#181614] hover:text-white"
                      >
                        Unlock
                      </button>
                    </div>
                    {accessCodeFeedback && (
                      <p
                        className={cn(
                          "text-xs",
                          accessCodeFeedback.type === "success"
                            ? "text-[#254336]"
                            : "text-[#8F3A2B]"
                        )}
                      >
                        {accessCodeFeedback.text}
                      </p>
                    )}
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DED8CB] pb-5">
                <div>
                  <p className="text-xs font-medium text-[#254336]">
                    {safeVaultUnlocked
                      ? "Your Number Was Called · Vault Open"
                      : "Waitlist Pass Confirmed"}
                  </p>
                  <p className="mt-1 font-editorial text-3xl text-[#181614]">
                    Welcome, {safeWaitlistPass.name}.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#254336]/10 px-3.5 py-1.5 text-xs font-medium text-[#254336]">
                  <Check className="h-3.5 w-3.5" />
                  Email updates enabled
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-[#F6F3EC] p-5">
                  <p className="text-xs text-[#767067]">Queue Position</p>
                  <p className="mt-1.5 font-mono text-2xl text-[#181614]">
                    #{safeWaitlistPass.position.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="rounded-xl bg-[#F6F3EC] p-5">
                  <p className="text-xs text-[#767067]">Personal Access Code</p>
                  <p className="mt-1.5 font-mono text-2xl text-[#181614]">
                    {safeWaitlistPass.accessCode}
                  </p>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-[#767067]">
                We will write to{" "}
                <span className="text-[#181614]">{safeWaitlistPass.email}</span>{" "}
                the moment your wave opens.
              </p>

              <div className="border-t border-[#DED8CB] pt-5">
                {!safeVaultUnlocked ? (
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={unlockVaultDemo}
                    className="inline-flex items-center gap-2 text-xs font-medium text-[#254336] transition-opacity hover:opacity-75"
                  >
                    <span>
                      Preview: Simulate Number Called → Unlock All{" "}
                      {products.length} Pieces
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => scrollToSection("collection")}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#254336] px-5 py-3 text-xs font-medium text-white transition-colors hover:bg-[#1D352B]"
                  >
                    <span>Browse All {products.length} Unlocked Pieces</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5B. COMMUNITY & CRAFT — ONE VIEW AT A TIME */}
      <section id="community" className="border-t border-[#DED8CB] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-[11px] tracking-[0.22em] uppercase text-[#767067]">
              Community & Craft
            </p>
            <h2 className="mt-3 font-editorial text-4xl text-[#181614] sm:text-5xl">
              Built with the people who wear it.
            </h2>
          </div>

          {/* Clean 3-tab bar with Framer Motion layoutId olive underline */}
          <div
            role="tablist"
            aria-label="Community and craft sections"
            className="mx-auto mt-10 flex max-w-xl items-center justify-center gap-6 border-b border-[#DED8CB] sm:gap-12"
          >
            {(
              [
                { id: "vote", label: "Vote Next Drop" },
                { id: "submit", label: "Submit a Design" },
                { id: "craft", label: "Sample-First Craft" },
              ] as const
            ).map((tab) => {
              const isActive = communityTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  suppressHydrationWarning
                  onClick={() => setCommunityTab(tab.id)}
                  className={cn(
                    "relative pb-4 text-xs tracking-[0.06em] transition-colors sm:text-sm",
                    isActive
                      ? "font-medium text-[#181614]"
                      : "text-[#767067] hover:text-[#181614]"
                  )}
                >
                  {tab.label}
                  {isActive && (
                    <motion.span
                      layoutId="v7-community-underline"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                      }}
                      className="absolute inset-x-0 bottom-0 h-[2px] bg-[#254336]"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content with serene AnimatePresence transition */}
          <div className="mt-12">
            <AnimatePresence mode="wait">
              {communityTab === "vote" && (
                <motion.div
                  key="vote"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="mx-auto mb-10 max-w-xl text-center text-sm text-[#767067]">
                    Cast your vote for Drop 02. The highest-voted concepts go
                    straight into sample development.
                  </p>

                  <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
                    {candidates.map((candidate) => {
                      const hasVoted = safeVotedIds.includes(candidate._id);
                      const pct =
                        totalVotes > 0
                          ? Math.round((candidate.votesCount / totalVotes) * 100)
                          : 0;

                      return (
                        <article
                          key={candidate._id}
                          className="flex flex-col overflow-hidden rounded-2xl border border-[#DED8CB] bg-white"
                        >
                          <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#ECE7DC]">
                            <Image
                              src={candidate.imageUrl}
                              alt={toEditorialTitle(candidate.title)}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover"
                            />
                          </div>

                          <div className="flex flex-1 flex-col justify-between p-6">
                            <div>
                              <div className="flex items-center justify-between gap-2 text-xs text-[#767067]">
                                <span>{candidate.creatorHandle}</span>
                                <span className="font-mono text-[11px]">
                                  {candidate.tierSuggestion === "one-of-one"
                                    ? "1/1"
                                    : "3–4 units"}
                                </span>
                              </div>
                              <h3 className="mt-2 font-editorial text-2xl leading-snug text-[#181614]">
                                {toEditorialTitle(candidate.title)}
                              </h3>
                              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#767067]">
                                {candidate.description}
                              </p>
                            </div>

                            <div className="mt-6 space-y-4">
                              <div>
                                <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] text-[#767067]">
                                  <span>
                                    {candidate.votesCount.toLocaleString("en-IN")}{" "}
                                    votes
                                  </span>
                                  <span>{pct}%</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#ECE7DC]">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max(pct, 6)}%` }}
                                    transition={{
                                      duration: 0.6,
                                      ease: [0.22, 1, 0.36, 1],
                                    }}
                                    className="h-full rounded-full bg-[#254336]"
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                suppressHydrationWarning
                                disabled={hasVoted || votingId === candidate._id}
                                onClick={() => handleVote(candidate)}
                                className={cn(
                                  "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition-colors",
                                  hasVoted
                                    ? "border border-[#254336]/25 bg-[#254336]/10 text-[#254336]"
                                    : "border border-[#DED8CB] bg-[#F6F3EC] text-[#181614] hover:border-[#254336] hover:bg-[#254336] hover:text-white"
                                )}
                              >
                                {hasVoted ? (
                                  <>
                                    <Check className="h-3.5 w-3.5" />
                                    <span>Voted</span>
                                  </>
                                ) : (
                                  <span>
                                    {votingId === candidate._id
                                      ? "Recording…"
                                      : "Vote"}
                                  </span>
                                )}
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {communityTab === "submit" && (
                <motion.div
                  key="submit"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="mx-auto mb-10 max-w-xl text-center font-editorial italic text-2xl text-[#181614]">
                    If your design wins the community vote, we produce it and
                    promote you.
                  </p>

                  <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    {/* Left: Serene submission form */}
                    <form
                      onSubmit={handleSubmitDesign}
                      className="space-y-5 rounded-2xl border border-[#DED8CB] bg-white p-7 sm:p-9 lg:col-span-7"
                    >
                      <div>
                        <label
                          htmlFor="v7-sub-title"
                          className="mb-1.5 block text-xs text-[#767067]"
                        >
                          Design Title
                        </label>
                        <input
                          id="v7-sub-title"
                          type="text"
                          suppressHydrationWarning
                          value={subTitle}
                          onChange={(e) => setSubTitle(e.target.value)}
                          placeholder="Indigo Raw-Edge Canvas Work Jacket"
                          className="w-full rounded-xl border border-[#DED8CB] bg-[#F6F3EC]/50 px-4 py-3 text-sm text-[#181614] placeholder:text-[#767067]/60 focus:border-[#254336] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="v7-sub-name"
                            className="mb-1.5 block text-xs text-[#767067]"
                          >
                            Your Name
                          </label>
                          <input
                            id="v7-sub-name"
                            type="text"
                            suppressHydrationWarning
                            value={subCreatorName}
                            onChange={(e) => setSubCreatorName(e.target.value)}
                            placeholder="Meera Nair"
                            className="w-full rounded-xl border border-[#DED8CB] bg-[#F6F3EC]/50 px-4 py-3 text-sm text-[#181614] placeholder:text-[#767067]/60 focus:border-[#254336] focus:bg-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="v7-sub-handle"
                            className="mb-1.5 block text-xs text-[#767067]"
                          >
                            Handle
                          </label>
                          <input
                            id="v7-sub-handle"
                            type="text"
                            suppressHydrationWarning
                            value={subHandle}
                            onChange={(e) => setSubHandle(e.target.value)}
                            placeholder="@meera.drapes"
                            className="w-full rounded-xl border border-[#DED8CB] bg-[#F6F3EC]/50 px-4 py-3 text-sm text-[#181614] placeholder:text-[#767067]/60 focus:border-[#254336] focus:bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="v7-sub-email"
                          className="mb-1.5 block text-xs text-[#767067]"
                        >
                          Email
                        </label>
                        <input
                          id="v7-sub-email"
                          type="email"
                          suppressHydrationWarning
                          value={subEmail}
                          onChange={(e) => setSubEmail(e.target.value)}
                          placeholder="creator@domain.in"
                          className="w-full rounded-xl border border-[#DED8CB] bg-[#F6F3EC]/50 px-4 py-3 text-sm text-[#181614] placeholder:text-[#767067]/60 focus:border-[#254336] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <p className="mb-2 text-xs text-[#767067]">Category</p>
                        <div className="flex flex-wrap gap-2">
                          {SUBMISSION_CATEGORIES.map((category) => {
                            const active = subCategory === category;
                            return (
                              <button
                                key={category}
                                type="button"
                                suppressHydrationWarning
                                onClick={() => setSubCategory(category)}
                                className={cn(
                                  "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
                                  active
                                    ? "border-[#254336] bg-[#254336] text-white"
                                    : "border-[#DED8CB] bg-[#F6F3EC]/60 text-[#767067] hover:border-[#181614] hover:text-[#181614]"
                                )}
                              >
                                {category}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="v7-sub-notes"
                          className="mb-1.5 block text-xs text-[#767067]"
                        >
                          Craft & Fabric Notes
                        </label>
                        <textarea
                          id="v7-sub-notes"
                          rows={4}
                          suppressHydrationWarning
                          value={subNotes}
                          onChange={(e) => setSubNotes(e.target.value)}
                          placeholder="Describe weight (GSM), stitch details, dye lot, embroidery, or silhouette proportions…"
                          className="w-full resize-none rounded-xl border border-[#DED8CB] bg-[#F6F3EC]/50 px-4 py-3 text-sm text-[#181614] placeholder:text-[#767067]/60 focus:border-[#254336] focus:bg-white focus:outline-none"
                        />
                      </div>

                      {submissionFeedback && (
                        <p
                          className={cn(
                            "text-xs",
                            submissionFeedback.type === "success"
                              ? "text-[#254336]"
                              : "text-[#8F3A2B]"
                          )}
                        >
                          {submissionFeedback.text}
                        </p>
                      )}

                      <button
                        type="submit"
                        suppressHydrationWarning
                        disabled={submittingDesign}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#254336] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#1D352B] disabled:opacity-60"
                      >
                        <span>
                          {submittingDesign
                            ? "Submitting Concept…"
                            : "Submit Concept"}
                        </span>
                        {!submittingDesign && (
                          <ArrowRight className="h-4 w-4 stroke-[1.75]" />
                        )}
                      </button>
                    </form>

                    {/* Right: Template preview selector & recent entries */}
                    <div className="flex flex-col gap-6 lg:col-span-5">
                      <div className="rounded-2xl border border-[#DED8CB] bg-white p-6">
                        <p className="text-xs text-[#767067]">
                          Silhouette Reference
                        </p>

                        <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#ECE7DC]">
                          <Image
                            src={selectedTemplate.imageUrl}
                            alt={selectedTemplate.label}
                            fill
                            sizes="(max-width: 1024px) 100vw, 420px"
                            className="object-cover"
                          />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {SUBMISSION_TEMPLATES.map((tpl) => {
                            const active = tpl.id === subTemplateId;
                            return (
                              <button
                                key={tpl.id}
                                type="button"
                                suppressHydrationWarning
                                onClick={() => {
                                  setSubTemplateId(tpl.id);
                                  setSubCategory(tpl.category);
                                }}
                                className={cn(
                                  "rounded-xl border px-3 py-2 text-left text-xs transition-colors",
                                  active
                                    ? "border-[#254336] bg-[#254336]/8 font-medium text-[#254336]"
                                    : "border-[#DED8CB] text-[#767067] hover:border-[#181614] hover:text-[#181614]"
                                )}
                              >
                                {tpl.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {submissions.length > 0 && (
                        <div className="rounded-2xl border border-[#DED8CB] bg-[#ECE7DC]/45 p-6">
                          <p className="text-xs tracking-[0.12em] uppercase text-[#767067]">
                            Recent Community Submissions
                          </p>
                          <ul className="mt-4 divide-y divide-[#DED8CB]">
                            {submissions.slice(0, 3).map((item) => (
                              <li key={item._id} className="py-3 first:pt-0 last:pb-0">
                                <p className="text-sm font-medium text-[#181614]">
                                  {toEditorialTitle(item.title)}
                                </p>
                                <p className="mt-0.5 text-xs text-[#767067]">
                                  {item.creatorHandle} · {item.category}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {communityTab === "craft" && (
                <motion.div
                  key="craft"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#DED8CB] bg-[#ECE7DC] lg:col-span-6">
                    <Image
                      src="/images/atelier-daylight.jpg"
                      alt="KNITX daylight craft atelier"
                      fill
                      sizes="(max-width: 1024px) 100vw, 560px"
                      className="object-cover"
                    />
                  </div>

                  <div className="lg:col-span-6">
                    <p className="font-editorial italic text-3xl text-[#181614] sm:text-4xl">
                      Zero deadstock, by design.
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-[#767067]">
                      Traditional streetwear prints hundreds of extras that end
                      up discounted or discarded. We cut every piece only after
                      it has a home.
                    </p>

                    <ol className="mt-8 divide-y divide-[#DED8CB] border-y border-[#DED8CB]">
                      {CRAFT_STEPS.map((step) => (
                        <li
                          key={step.number}
                          className="grid grid-cols-[2.5rem_1fr] gap-4 py-5"
                        >
                          <span className="font-mono text-xs text-[#254336]">
                            {step.number}
                          </span>
                          <div>
                            <h3 className="text-sm font-medium text-[#181614]">
                              {step.title}
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-[#767067]">
                              {step.description}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 6. QUIET FLAGSHIP FOOTER */}
      <footer className="border-t border-[#DED8CB] bg-[#ECE7DC]/70 pt-16 pb-28">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="font-editorial text-3xl tracking-[0.08em] text-[#181614]">
            KNITX
          </p>
          <p className="mt-3 text-xs tracking-[0.16em] uppercase text-[#767067]">
            Made in India · Waitlist Only · Zero Deadstock
          </p>
          <div className="mt-7 flex items-center justify-center gap-8 text-xs text-[#767067]">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => scrollToSection("collection")}
              className="transition-colors hover:text-[#181614]"
            >
              Collection
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => scrollToSection("waitlist")}
              className="transition-colors hover:text-[#181614]"
            >
              Waitlist
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => scrollToSection("community")}
              className="transition-colors hover:text-[#181614]"
            >
              Community
            </button>
          </div>
        </div>
      </footer>

      {/* SERENE CENTERED PRODUCT QUICK-VIEW MODAL */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setSelectedProduct(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#181614]/45 p-4 backdrop-blur-xs sm:p-6"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={toEditorialTitle(selectedProduct.title)}
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative grid max-h-[90vh] w-full max-w-3xl grid-cols-1 overflow-y-auto rounded-2xl border border-[#DED8CB] bg-white shadow-2xl md:grid-cols-2 md:overflow-hidden"
            >
              <button
                type="button"
                suppressHydrationWarning
                aria-label="Close quick view"
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#DED8CB] bg-white/90 text-[#181614] transition-colors hover:bg-[#F6F3EC]"
              >
                <X className="h-4 w-4 stroke-[1.75]" />
              </button>

              {/* Left 3:4 Photo */}
              <div className="relative aspect-[3/4] w-full bg-[#ECE7DC] md:h-full md:aspect-auto">
                <Image
                  src={selectedProduct.imageUrl}
                  alt={toEditorialTitle(selectedProduct.title)}
                  fill
                  sizes="(max-width: 768px) 100vw, 384px"
                  className="object-cover"
                />
              </div>

              {/* Right Details */}
              <div className="flex flex-col justify-between p-7 sm:p-8 md:max-h-[90vh] md:overflow-y-auto">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#767067]">
                    <span>{selectedProduct.serialCode}</span>
                    <span>·</span>
                    <span
                      className={cn(
                        selectedProduct.tier === "one-of-one"
                          ? "text-[#254336]"
                          : "text-[#767067]"
                      )}
                    >
                      {selectedProduct.tier === "one-of-one"
                        ? "One of One"
                        : `${selectedProduct.remainingUnits} of ${selectedProduct.totalUnits} available`}
                    </span>
                  </div>

                  <h3 className="mt-2.5 font-editorial text-3xl leading-tight text-[#181614]">
                    {toEditorialTitle(selectedProduct.title)}
                  </h3>

                  <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-[#DED8CB] pb-4">
                    <span className="font-mono text-lg text-[#181614]">
                      {formatInr(selectedProduct.priceInr)}
                    </span>
                    <span className="text-xs text-[#767067]">
                      Cut to order in {selectedProduct.productionDays} days
                    </span>
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-[#767067]">
                    {selectedProduct.description}
                  </p>

                  {/* Fabric & Craft notes */}
                  <div className="mt-5 space-y-2.5 rounded-xl bg-[#F6F3EC] p-4">
                    <p className="text-xs font-medium text-[#181614]">
                      {selectedProduct.gsmWeight} · {selectedProduct.fabric}
                    </p>
                    <ul className="space-y-1.5 text-xs text-[#767067]">
                      {selectedProduct.craftsmanship.slice(0, 3).map((note) => (
                        <li key={note} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#254336]" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Size selector */}
                  <div className="mt-5">
                    <p className="mb-2 text-xs text-[#767067]">Select Size</p>
                    <div className="flex flex-wrap gap-2">
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
                              "min-w-[3rem] rounded-lg border px-3.5 py-2 font-mono text-xs transition-colors",
                              active
                                ? "border-[#181614] bg-[#181614] text-white"
                                : "border-[#DED8CB] bg-white text-[#181614] hover:border-[#181614]"
                            )}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-7 space-y-2.5">
                  {bagFeedback && (
                    <p className="text-xs text-[#8F3A2B]">{bagFeedback}</p>
                  )}

                  <button
                    type="button"
                    suppressHydrationWarning
                    disabled={selectedProduct.remainingUnits <= 0}
                    onClick={handleAddToBag}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#254336] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#1D352B] disabled:opacity-50"
                  >
                    <span>
                      {selectedProduct.remainingUnits <= 0
                        ? "Edition Archived"
                        : `Add to Bag — ${formatInr(selectedProduct.priceInr)}`}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
