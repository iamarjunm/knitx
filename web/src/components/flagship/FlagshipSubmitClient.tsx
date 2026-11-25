"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import type { CreatorSubmissionItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useStorefrontConfig } from "@/context/StorefrontConfigContext";
import {
  cleanFlagshipText,
  getFlagshipCleanImage,
} from "@/lib/flagship-media";

interface FlagshipSubmitClientProps {
  initialSubmissions: CreatorSubmissionItem[];
}

const CATEGORIES = [
  "Small-Batch Hoodie",
  "Small-Batch Tee",
  "1-of-1 Outerwear",
  "1-of-1 Knitwear",
  "Small-Batch Bottoms",
] as const;

const CREATOR_BRIEF_STEPS = [
  {
    step: "01",
    title: "ORIGINAL SPEC SHEET",
    summary: "Silhouette, textile GSM & surface craft",
    detail:
      "Pitch an original garment with concrete fabric weight, weave structure, embroidery or print technique, and finishing notes.",
  },
  {
    step: "02",
    title: "COMMUNITY BALLOT",
    summary: "Shortlisted silhouettes go to public vote",
    detail:
      "Our studio reviews structural feasibility before advancing shortlisted entries directly to the live collector ballot.",
  },
  {
    step: "03",
    title: "SAMPLED & CREDITED",
    summary: "Cut in micro-runs with woven creator credit",
    detail:
      "Winning silhouettes enter single-sample prototyping, launch in numbered runs, and carry permanent interior creator attribution.",
  },
] as const;

function formatHandle(handle: string): string {
  const trimmed = handle.trim();
  if (!trimmed) return "@creator";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function getStatusBadge(status: CreatorSubmissionItem["status"]): {
  label: string;
  className: string;
} {
  if (status === "selected") {
    return {
      label: "SELECTED",
      className: "text-[var(--flagship-accent)]",
    };
  }
  if (status === "approved_for_vote") {
    return {
      label: "ON BALLOT",
      className: "text-[#000000]",
    };
  }
  return {
    label: "UNDER REVIEW",
    className: "text-[#666666]",
  };
}

function isPreviewableUrl(raw: string): boolean {
  const trimmed = raw.trim();
  return (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("/")
  );
}

export default function FlagshipSubmitClient({
  initialSubmissions,
}: FlagshipSubmitClientProps) {
  const { config } = useStorefrontConfig();
  const [mounted, setMounted] = useState(false);
  const [submissions, setSubmissions] =
    useState<CreatorSubmissionItem[]>(initialSubmissions);

  const [title, setTitle] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [creatorHandle, setCreatorHandle] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [craftsmanshipNotes, setCraftsmanshipNotes] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<CreatorSubmissionItem | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setPreviewFailed(false);
  }, [imageUrl]);

  const accent =
    mounted && config.accentColor ? config.accentColor : "#E11D2E";

  const trimmedImageUrl = imageUrl.trim();
  const showImagePreview =
    trimmedImageUrl.length > 0 && isPreviewableUrl(trimmedImageUrl);
  const safePreviewSrc = showImagePreview
    ? getFlagshipCleanImage(trimmedImageUrl, 0)
    : "";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const cleanTitle = title.trim();
    const cleanName = creatorName.trim();
    const cleanNotes = craftsmanshipNotes.trim();
    const cleanHandle = creatorHandle.trim();
    const cleanEmail = email.trim();

    if (!cleanTitle || !cleanName || !cleanNotes) {
      setErrorMessage(
        "Complete the concept title, creator name, and fabric & craftsmanship notes."
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          creatorName: cleanName,
          creatorHandle: cleanHandle,
          email: cleanEmail || undefined,
          category,
          craftsmanshipNotes: cleanNotes,
          imageUrl: showImagePreview ? safePreviewSrc : undefined,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        submission?: CreatorSubmissionItem;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Unable to submit concept right now.");
      }

      const created: CreatorSubmissionItem = data.submission ?? {
        _id: `sub_${Date.now()}`,
        title: cleanTitle,
        creatorName: cleanName,
        creatorHandle: formatHandle(cleanHandle || cleanName),
        category,
        craftsmanshipNotes: cleanNotes,
        imageUrl: showImagePreview ? safePreviewSrc : undefined,
        createdAt: new Date().toISOString(),
        status: "pending",
      };

      setSubmissions((prev) => [created, ...prev]);
      setReceipt(created);
      setTitle("");
      setCreatorName("");
      setCreatorHandle("");
      setEmail("");
      setCategory(CATEGORIES[0]);
      setCraftsmanshipNotes("");
      setImageUrl("");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Unable to submit concept right now. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen overflow-x-clip bg-[#FFFFFF] text-[#000000]"
      style={{ "--flagship-accent": accent } as React.CSSProperties}
    >
      {/* Pure-White Flagship Header */}
      <header className="border-b border-black/10 bg-[#FFFFFF] py-12 sm:py-20">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14">
          <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.2em] text-[#666666] uppercase sm:tracking-[0.22em]">
            <span className="inline-block h-2 w-2 shrink-0 bg-[var(--flagship-accent)]" />
            <span>CREATOR RESIDENCY · OPEN DESIGN SUBMISSIONS</span>
          </div>

          <h1 className="mt-4 max-w-4xl font-syne text-[36px] font-extrabold leading-[0.94] tracking-[-0.03em] text-[#000000] uppercase break-words sm:text-6xl lg:text-[80px]">
            SUBMIT A SILHOUETTE.
          </h1>

          <p className="mt-5 max-w-2xl font-sans text-sm leading-relaxed text-[#666666] sm:mt-6 sm:text-base">
            Independent designers and garment makers can pitch original pieces
            for upcoming KNITX editions. Community-selected silhouettes are
            sampled in-house, produced in numbered micro-runs, and credited by
            name.
          </p>
        </div>
      </header>

      {/* 12-Column Split: Brief + Shortlisted Ledger (Left) | Submission Form (Right) */}
      <section className="bg-[#FFFFFF] py-12 sm:py-20">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-start gap-10 px-5 sm:gap-12 sm:px-10 lg:grid-cols-12 lg:gap-16 lg:px-14">
          {/* Left Column (5 Cols): 3-Step Creator Brief + Recent Shortlisted Concepts */}
          <div className="lg:col-span-5">
            <p className="font-mono text-[10px] tracking-[0.22em] text-[#666666] uppercase">
              03-STEP CREATOR RESIDENCY BRIEF
            </p>

            <ol className="mt-4 divide-y divide-black/10 border-t border-b border-black/10">
              {CREATOR_BRIEF_STEPS.map((item) => (
                <li key={item.step} className="py-6">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[11px] font-semibold tracking-[0.18em] text-[var(--flagship-accent)]">
                      {item.step}
                    </span>
                    <h2 className="font-syne text-sm font-extrabold tracking-[0.06em] text-[#000000] uppercase">
                      {item.title}
                    </h2>
                  </div>
                  <p className="mt-2 font-sans text-sm font-medium text-[#000000]">
                    {item.summary}
                  </p>
                  <p className="mt-1.5 font-sans text-xs leading-relaxed text-[#666666]">
                    {item.detail}
                  </p>
                </li>
              ))}
            </ol>

            {/* Live Recent Shortlisted Concepts */}
            <div className="mt-12">
              <div className="flex items-baseline justify-between gap-4 border-b border-black/10 pb-3.5">
                <p className="font-syne text-xs font-extrabold tracking-[0.14em] text-[#000000] uppercase">
                  RECENT SHORTLISTED CONCEPTS
                </p>
                <span className="font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase">
                  {String(submissions.length).padStart(2, "0")} LOGGED
                </span>
              </div>

              <div className="divide-y divide-black/10 border-b border-black/10">
                {submissions.map((item) => {
                  const statusMeta = getStatusBadge(item.status);
                  return (
                    <article key={item._id} className="py-5">
                      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] tracking-[0.16em] uppercase">
                        <span
                          className={cn("font-semibold", statusMeta.className)}
                        >
                          {statusMeta.label}
                        </span>
                        <span className="text-[#666666]">
                          {cleanFlagshipText(item.category)}
                        </span>
                      </div>

                      <h3 className="mt-2 font-syne text-base font-bold leading-snug text-[#000000] uppercase">
                        {cleanFlagshipText(item.title)}
                      </h3>

                      <p className="mt-1 font-mono text-[10px] tracking-[0.1em] text-[#666666] uppercase">
                        {item.creatorName} · {formatHandle(item.creatorHandle)}
                      </p>

                      <p className="mt-2 font-sans text-xs leading-relaxed text-[#666666]">
                        {cleanFlagshipText(item.craftsmanshipNotes)}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (7 Cols): Pure-White & Cool-Silver Submission Form */}
          <div className="lg:col-span-7">
            <div className="border border-black/10 bg-[#F4F4F5] p-6 sm:p-10 lg:p-12">
              {receipt ? (
                <div className="border border-black/10 bg-[#FFFFFF] p-6 sm:p-10">
                  <div className="inline-flex items-center gap-2 bg-[#000000] px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-[#FFFFFF] uppercase">
                    <Check className="h-3.5 w-3.5 stroke-[2.25] text-[var(--flagship-accent)]" />
                    <span>CONCEPT LOGGED</span>
                  </div>

                  <h2 className="mt-5 font-syne text-3xl font-extrabold leading-[1.02] tracking-[-0.02em] text-[#000000] uppercase sm:text-4xl">
                    DOSSIER RECEIVED FOR STUDIO REVIEW.
                  </h2>

                  <p className="mt-3 max-w-lg font-sans text-sm leading-relaxed text-[#666666]">
                    Your silhouette has been prepended to the live curation
                    registry. Shortlisted entries advance directly to the
                    community ballot ahead of sample cutting.
                  </p>

                  <dl className="mt-8 divide-y divide-black/10 border-t border-b border-black/10">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                      <dt className="font-mono text-[10px] tracking-[0.18em] text-[#666666] uppercase">
                        DESIGN TITLE
                      </dt>
                      <dd className="font-syne text-sm font-bold text-[#000000] uppercase">
                        {cleanFlagshipText(receipt.title)}
                      </dd>
                    </div>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                      <dt className="font-mono text-[10px] tracking-[0.18em] text-[#666666] uppercase">
                        CREATOR
                      </dt>
                      <dd className="font-mono text-[11px] text-[#000000]">
                        {receipt.creatorName} ·{" "}
                        {formatHandle(receipt.creatorHandle)}
                      </dd>
                    </div>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                      <dt className="font-mono text-[10px] tracking-[0.18em] text-[#666666] uppercase">
                        CATEGORY
                      </dt>
                      <dd className="font-mono text-[11px] tracking-[0.12em] text-[#000000] uppercase">
                        {receipt.category}
                      </dd>
                    </div>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                      <dt className="font-mono text-[10px] tracking-[0.18em] text-[#666666] uppercase">
                        STATUS
                      </dt>
                      <dd className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[var(--flagship-accent)] uppercase">
                        UNDER REVIEW
                      </dd>
                    </div>
                    {mounted && (
                      <div className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                        <dt className="font-mono text-[10px] tracking-[0.18em] text-[#666666] uppercase">
                          RECEIPT ID
                        </dt>
                        <dd className="font-mono text-[11px] tracking-[0.12em] text-[#666666] uppercase">
                          {receipt._id}
                        </dd>
                      </div>
                    )}
                  </dl>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setReceipt(null)}
                      className="cursor-pointer border border-[#000000] bg-[#000000] px-6 py-4 font-sans text-[11px] font-semibold tracking-[0.2em] text-[#FFFFFF] uppercase transition-colors hover:border-[var(--flagship-accent)] hover:bg-[var(--flagship-accent)]"
                    >
                      SUBMIT ANOTHER CONCEPT
                    </button>
                    <Link
                      href="/vote"
                      className="inline-flex items-center justify-center gap-2 border border-black/20 bg-[#FFFFFF] px-6 py-4 font-sans text-[11px] font-semibold tracking-[0.2em] text-[#000000] uppercase transition-colors hover:border-[#000000]"
                    >
                      <span>OPEN BALLOT</span>
                      <ArrowUpRight className="h-3.5 w-3.5 stroke-[2]" />
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <div className="border-b border-black/10 pb-6">
                    <p className="font-mono text-[10px] tracking-[0.22em] text-[#666666] uppercase">
                      SUBMISSION SPEC SHEET · FUTURE EDITIONS
                    </p>
                    <h2 className="mt-2 font-syne text-2xl font-extrabold tracking-[-0.02em] text-[#000000] uppercase sm:text-3xl">
                      GARMENT CONCEPT FORM
                    </h2>
                  </div>

                  <div className="mt-8 space-y-7">
                    {/* Design Title */}
                    <div>
                      <label
                        htmlFor="flagship-submit-title"
                        className="block font-mono text-[10px] font-semibold tracking-[0.18em] text-[#000000] uppercase"
                      >
                        DESIGN TITLE{" "}
                        <span className="text-[var(--flagship-accent)]">*</span>
                      </label>
                      <input
                        id="flagship-submit-title"
                        type="text"
                        required
                        suppressHydrationWarning
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Heavyweight Slub Raw-Seam Field Jacket"
                        className="mt-2.5 w-full border border-black/15 bg-[#FFFFFF] px-4 py-3.5 font-sans text-base text-[#000000] placeholder:text-[#666666]/60 transition-colors focus:border-[#000000] focus:outline-none sm:text-sm"
                      />
                    </div>

                    {/* Creator Name & Handle */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="flagship-submit-name"
                          className="block font-mono text-[10px] font-semibold tracking-[0.18em] text-[#000000] uppercase"
                        >
                          CREATOR NAME{" "}
                          <span className="text-[var(--flagship-accent)]">
                            *
                          </span>
                        </label>
                        <input
                          id="flagship-submit-name"
                          type="text"
                          required
                          suppressHydrationWarning
                          value={creatorName}
                          onChange={(e) => setCreatorName(e.target.value)}
                          placeholder="Full name or studio"
                          className="mt-2.5 w-full border border-black/15 bg-[#FFFFFF] px-4 py-3.5 font-sans text-base text-[#000000] placeholder:text-[#666666]/60 transition-colors focus:border-[#000000] focus:outline-none sm:text-sm"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="flagship-submit-handle"
                          className="block font-mono text-[10px] font-semibold tracking-[0.18em] text-[#000000] uppercase"
                        >
                          INSTAGRAM / PORTFOLIO HANDLE
                        </label>
                        <input
                          id="flagship-submit-handle"
                          type="text"
                          suppressHydrationWarning
                          value={creatorHandle}
                          onChange={(e) => setCreatorHandle(e.target.value)}
                          placeholder="@your.studio"
                          className="mt-2.5 w-full border border-black/15 bg-[#FFFFFF] px-4 py-3.5 font-sans text-base text-[#000000] placeholder:text-[#666666]/60 transition-colors focus:border-[#000000] focus:outline-none sm:text-sm"
                        />
                      </div>
                    </div>

                    {/* Optional Contact Email */}
                    <div>
                      <label
                        htmlFor="flagship-submit-email"
                        className="block font-mono text-[10px] font-semibold tracking-[0.18em] text-[#000000] uppercase"
                      >
                        CONTACT EMAIL{" "}
                        <span className="font-normal text-[#666666]">
                          (OPTIONAL)
                        </span>
                      </label>
                      <input
                        id="flagship-submit-email"
                        type="email"
                        suppressHydrationWarning
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="studio@yourdomain.com"
                        className="mt-2.5 w-full border border-black/15 bg-[#FFFFFF] px-4 py-3.5 font-sans text-base text-[#000000] placeholder:text-[#666666]/60 transition-colors focus:border-[#000000] focus:outline-none sm:text-sm"
                      />
                    </div>

                    {/* Category Buttons */}
                    <div>
                      <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#000000] uppercase">
                        SILHOUETTE CATEGORY
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-3">
                        {CATEGORIES.map((option) => {
                          const selected = category === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              suppressHydrationWarning
                              onClick={() => setCategory(option)}
                              className={cn(
                                "cursor-pointer border px-3.5 py-3 text-left font-mono text-[10px] font-semibold tracking-[0.14em] uppercase transition-colors",
                                selected
                                  ? "border-[#000000] bg-[#000000] text-[#FFFFFF]"
                                  : "border-black/15 bg-[#FFFFFF] text-[#000000] hover:border-[#000000]"
                              )}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Craftsmanship Notes */}
                    <div>
                      <label
                        htmlFor="flagship-submit-notes"
                        className="block font-mono text-[10px] font-semibold tracking-[0.18em] text-[#000000] uppercase"
                      >
                        FABRIC &amp; CRAFTSMANSHIP NOTES{" "}
                        <span className="text-[var(--flagship-accent)]">*</span>
                      </label>
                      <textarea
                        id="flagship-submit-notes"
                        required
                        rows={4}
                        suppressHydrationWarning
                        value={craftsmanshipNotes}
                        onChange={(e) => setCraftsmanshipNotes(e.target.value)}
                        placeholder="Specify textile weight (GSM), weave, embroidery or print method, hardware, silhouette block, and finishing..."
                        className="mt-2.5 w-full resize-y border border-black/15 bg-[#FFFFFF] p-4 font-sans text-base leading-relaxed text-[#000000] placeholder:text-[#666666]/60 transition-colors focus:border-[#000000] focus:outline-none sm:text-sm"
                      />
                    </div>

                    {/* Optional Image URL with Instant Preview */}
                    <div>
                      <label
                        htmlFor="flagship-submit-image"
                        className="block font-mono text-[10px] font-semibold tracking-[0.18em] text-[#000000] uppercase"
                      >
                        CONCEPT IMAGE URL{" "}
                        <span className="font-normal text-[#666666]">
                          (OPTIONAL)
                        </span>
                      </label>
                      <input
                        id="flagship-submit-image"
                        type="url"
                        suppressHydrationWarning
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://... or /images/..."
                        className="mt-2.5 w-full border border-black/15 bg-[#FFFFFF] px-4 py-3.5 font-mono text-base text-[#000000] placeholder:text-[#666666]/60 transition-colors focus:border-[#000000] focus:outline-none sm:text-xs"
                      />

                      {showImagePreview && (
                        <div className="mt-4">
                          <p className="font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase">
                            INSTANT REFERENCE PREVIEW
                          </p>
                          <div className="relative mt-2 aspect-[4/3] w-full overflow-hidden border border-black/15 bg-[#FFFFFF]">
                            {previewFailed ? (
                              <div className="flex h-full w-full items-center justify-center px-6 text-center font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase">
                                PREVIEW UNAVAILABLE — CHECK IMAGE URL
                              </div>
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={safePreviewSrc}
                                alt="Submitted garment concept preview"
                                onError={() => setPreviewFailed(true)}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {errorMessage && (
                      <div
                        role="alert"
                        className="border border-[var(--flagship-accent)] bg-[#FFFFFF] px-4 py-3 font-mono text-[11px] text-[var(--flagship-accent)]"
                      >
                        {errorMessage}
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        suppressHydrationWarning
                        disabled={isSubmitting}
                        className="w-full cursor-pointer border border-[#000000] bg-[#000000] px-6 py-4 font-sans text-[11px] font-semibold tracking-[0.22em] text-[#FFFFFF] uppercase transition-colors hover:border-[var(--flagship-accent)] hover:bg-[var(--flagship-accent)] disabled:cursor-wait disabled:opacity-60"
                      >
                        {isSubmitting
                          ? "SUBMITTING CONCEPT..."
                          : "SUBMIT CONCEPT TO STUDIO"}
                      </button>

                      <p className="mt-4 font-mono text-[10px] leading-relaxed tracking-[0.06em] text-[#666666]">
                        Creators retain full design credit. Community-selected
                        silhouettes are prototyped by KNITX and issued in
                        strictly numbered runs.
                      </p>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
