"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { CreatorSubmissionItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { cleanV10Text, getV10CleanImage } from "@/components/v10/v10-media";

interface V10SubmitClientProps {
  initialSubmissions: CreatorSubmissionItem[];
}

const CATEGORIES = [
  "Small-Batch Hoodie",
  "Small-Batch Tee",
  "1-of-1 Outerwear",
  "1-of-1 Knitwear",
  "Small-Batch Bottoms",
] as const;

const RESIDENCY_RULES = [
  {
    number: "01",
    title: "ORIGINALITY",
    summary: "Silhouette, fabric & craft notes",
    detail:
      "Pitch original garment proportions with GSM weight, textile sourcing, stitching methods, and surface finishing details.",
  },
  {
    number: "02",
    title: "COMMUNITY BALLOT",
    summary: "Shortlisted pieces enter public voting",
    detail:
      "Our atelier reviews every dossier for structural feasibility before advancing shortlisted silhouettes to the live community ballot.",
  },
  {
    number: "03",
    title: "PRODUCED & CREDITED",
    summary: "Sampled, produced & credited prominently",
    detail:
      "Selected concepts enter physical sample cutting, launch in strictly limited runs, and carry permanent woven creator attribution.",
  },
] as const;

function formatHandle(handle: string): string {
  const trimmed = handle.trim();
  if (!trimmed) return "@creator";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function formatEditorialTitle(raw: string): string {
  const cleaned = cleanV10Text(raw).trim();
  if (!cleaned) return "Untitled Concept";
  const isAllCaps = cleaned === cleaned.toUpperCase() && /[A-Z]/.test(cleaned);
  if (!isAllCaps) return cleaned;
  return cleaned
    .toLowerCase()
    .replace(/\b([a-z])/g, (letter) => letter.toUpperCase())
    .replace(/\bGsm\b/g, "GSM");
}

function getStatusMeta(status: CreatorSubmissionItem["status"]): {
  label: string;
  className: string;
} {
  if (status === "selected") {
    return {
      label: "SELECTED FOR RELEASE",
      className: "text-[#8C1D18]",
    };
  }
  if (status === "approved_for_vote") {
    return {
      label: "ON BALLOT",
      className: "text-[#111110]",
    };
  }
  return {
    label: "UNDER REVIEW",
    className: "text-[#6E6A63]",
  };
}

function isPreviewableImageUrl(raw: string): boolean {
  const trimmed = raw.trim();
  return (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("/")
  );
}

export default function V10SubmitClient({
  initialSubmissions,
}: V10SubmitClientProps) {
  const [mounted, setMounted] = useState(false);
  const [submissions, setSubmissions] =
    useState<CreatorSubmissionItem[]>(initialSubmissions);

  const [title, setTitle] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [creatorHandle, setCreatorHandle] = useState("");
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

  const trimmedImageUrl = imageUrl.trim();
  const showImagePreview =
    trimmedImageUrl.length > 0 && isPreviewableImageUrl(trimmedImageUrl);
  const safePreviewSrc = showImagePreview
    ? getV10CleanImage(trimmedImageUrl, 0)
    : "";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const cleanTitle = title.trim();
    const cleanName = creatorName.trim();
    const cleanNotes = craftsmanshipNotes.trim();
    const cleanHandle = creatorHandle.trim();

    if (!cleanTitle || !cleanName || !cleanNotes) {
      setErrorMessage(
        "Please complete the design title, your name, and fabric & craftsmanship notes."
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
    <div className="min-h-screen bg-[#FAF9F6] text-[#111110]">
      {/* Architectural Header */}
      <header className="border-b border-[#111110]/10 bg-[#FAF9F6] py-16 sm:py-24">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 lg:px-14">
          <p className="font-sans text-[11px] tracking-[0.22em] text-[#6E6A63] uppercase">
            CREATOR RESIDENCY · FUTURE EDITIONS
          </p>
          <h1 className="mt-5 max-w-4xl font-editorial text-5xl leading-[0.95] tracking-[-0.015em] text-[#111110] sm:text-7xl">
            Submit a silhouette <span className="italic">to be produced.</span>
          </h1>
          <p className="mt-6 max-w-2xl font-sans text-sm leading-relaxed text-[#6E6A63] sm:text-[15px]">
            Independent Indian designers and garment makers can pitch original
            pieces for upcoming releases. Community-selected designs are
            sampled, produced in strictly limited runs, and credited
            prominently.
          </p>
        </div>
      </header>

      {/* 12-Column Editorial Split */}
      <section className="bg-[#FFFFFF] py-16 sm:py-20">
        <div className="mx-auto grid max-w-[1380px] grid-cols-1 items-start gap-12 px-6 sm:px-10 lg:grid-cols-12 lg:gap-16 lg:px-14">
          {/* Left Column (5 Cols): Rules + Shortlisted Concepts */}
          <div className="lg:col-span-5">
            <p className="font-sans text-[11px] tracking-[0.2em] text-[#6E6A63] uppercase">
              CURATION PROTOCOL
            </p>

            <ol className="mt-5 divide-y divide-[#111110]/10 border-t border-b border-[#111110]/10">
              {RESIDENCY_RULES.map((rule) => (
                <li key={rule.number} className="py-6">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[10px] tracking-[0.18em] text-[#8C1D18]">
                      {rule.number}
                    </span>
                    <h2 className="font-sans text-[11px] font-medium tracking-[0.2em] text-[#111110] uppercase">
                      {rule.title}
                    </h2>
                  </div>
                  <p className="mt-2 font-editorial text-xl text-[#111110]">
                    {rule.summary}
                  </p>
                  <p className="mt-1.5 font-sans text-xs leading-relaxed text-[#6E6A63]">
                    {rule.detail}
                  </p>
                </li>
              ))}
            </ol>

            {/* Recent Shortlisted Concepts */}
            <div className="mt-12">
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-sans text-[11px] tracking-[0.2em] text-[#111110] uppercase">
                  RECENT SHORTLISTED CONCEPTS
                </p>
                <span className="font-mono text-[10px] tracking-[0.16em] text-[#6E6A63] uppercase">
                  {String(submissions.length).padStart(2, "0")} LOGGED
                </span>
              </div>

              <div className="mt-5 divide-y divide-[#111110]/10 border-t border-b border-[#111110]/10">
                {submissions.map((item) => {
                  const statusMeta = getStatusMeta(item.status);
                  return (
                    <article key={item._id} className="py-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={cn(
                            "font-mono text-[10px] tracking-[0.18em] uppercase",
                            statusMeta.className
                          )}
                        >
                          {statusMeta.label}
                        </span>
                        <span className="font-mono text-[10px] tracking-[0.12em] text-[#6E6A63] uppercase">
                          {cleanV10Text(item.category)}
                        </span>
                      </div>

                      <h3 className="mt-2 font-editorial text-2xl leading-[1.1] text-[#111110]">
                        {formatEditorialTitle(item.title)}
                      </h3>

                      <p className="mt-1 font-sans text-[11px] tracking-[0.08em] text-[#6E6A63]">
                        {item.creatorName} · {formatHandle(item.creatorHandle)}
                      </p>

                      <p className="mt-2 font-sans text-xs leading-relaxed text-[#6E6A63]">
                        {cleanV10Text(item.craftsmanshipNotes)}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (7 Cols): Architectural Submission Dossier */}
          <div className="lg:col-span-7">
            <div className="rounded-none border border-[#111110]/12 bg-[#FAF9F6] p-8 sm:p-12">
              {receipt ? (
                <div>
                  <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.2em] text-[#8C1D18] uppercase">
                    <Check className="h-3.5 w-3.5 stroke-[1.75]" />
                    <span>DOSSIER REGISTERED</span>
                  </div>

                  <h2 className="mt-4 font-editorial text-4xl leading-[1.02] text-[#111110] sm:text-5xl">
                    Concept received for{" "}
                    <span className="italic">studio review.</span>
                  </h2>

                  <p className="mt-4 max-w-lg font-sans text-sm leading-relaxed text-[#6E6A63]">
                    Your silhouette has been logged into the curation ledger and
                    added to the live registry. Shortlisted pieces are contacted
                    prior to ballot opening.
                  </p>

                  <dl className="mt-8 divide-y divide-[#111110]/10 border-t border-b border-[#111110]/10">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                      <dt className="font-mono text-[10px] tracking-[0.18em] text-[#6E6A63] uppercase">
                        CONCEPT TITLE
                      </dt>
                      <dd className="font-editorial text-xl text-[#111110]">
                        {formatEditorialTitle(receipt.title)}
                      </dd>
                    </div>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                      <dt className="font-mono text-[10px] tracking-[0.18em] text-[#6E6A63] uppercase">
                        CREATOR
                      </dt>
                      <dd className="font-sans text-xs text-[#111110]">
                        {receipt.creatorName} ·{" "}
                        {formatHandle(receipt.creatorHandle)}
                      </dd>
                    </div>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                      <dt className="font-mono text-[10px] tracking-[0.18em] text-[#6E6A63] uppercase">
                        CATEGORY
                      </dt>
                      <dd className="font-mono text-[11px] tracking-[0.12em] text-[#111110] uppercase">
                        {receipt.category}
                      </dd>
                    </div>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                      <dt className="font-mono text-[10px] tracking-[0.18em] text-[#6E6A63] uppercase">
                        STATUS
                      </dt>
                      <dd className="font-mono text-[10px] tracking-[0.18em] text-[#8C1D18] uppercase">
                        UNDER REVIEW
                      </dd>
                    </div>
                    {mounted && (
                      <div className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                        <dt className="font-mono text-[10px] tracking-[0.18em] text-[#6E6A63] uppercase">
                          REFERENCE CODE
                        </dt>
                        <dd className="font-mono text-[11px] tracking-[0.14em] text-[#6E6A63] uppercase">
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
                      className="cursor-pointer rounded-none border border-[#111110] bg-[#111110] px-7 py-4 font-sans text-[11px] tracking-[0.2em] text-[#FAF9F6] uppercase transition-colors hover:border-[#8C1D18] hover:bg-[#8C1D18]"
                    >
                      SUBMIT ANOTHER CONCEPT
                    </button>
                    <Link
                      href="/v10/vote"
                      className="inline-flex items-center justify-center gap-2.5 rounded-none border border-[#111110]/20 bg-transparent px-7 py-4 font-sans text-[11px] tracking-[0.2em] text-[#111110] uppercase transition-colors hover:border-[#111110]"
                    >
                      <span>VIEW COMMUNITY BALLOT</span>
                      <ArrowRight className="h-3.5 w-3.5 stroke-[1.75]" />
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <div className="border-b border-[#111110]/10 pb-6">
                    <p className="font-sans text-[10px] tracking-[0.22em] text-[#6E6A63] uppercase">
                      CONCEPT DOSSIER · FUTURE RELEASES
                    </p>
                    <h2 className="mt-2 font-editorial text-3xl text-[#111110] sm:text-4xl">
                      Garment specification
                    </h2>
                  </div>

                  <div className="mt-8 space-y-8">
                    {/* Design Title */}
                    <div>
                      <label
                        htmlFor="v10-submit-title"
                        className="block font-sans text-[11px] tracking-[0.2em] text-[#111110] uppercase"
                      >
                        Design Title <span className="text-[#8C1D18]">*</span>
                      </label>
                      <input
                        id="v10-submit-title"
                        type="text"
                        required
                        suppressHydrationWarning
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Deccan Slub Raw-Seam Field Jacket"
                        className="mt-2 w-full rounded-none border-0 border-b border-[#111110]/20 bg-transparent px-0 py-3 font-sans text-sm text-[#111110] placeholder:text-[#6E6A63]/55 transition-colors focus:border-[#111110] focus:outline-none"
                      />
                    </div>

                    {/* Creator Name & Handle */}
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="v10-submit-name"
                          className="block font-sans text-[11px] tracking-[0.2em] text-[#111110] uppercase"
                        >
                          Your Name <span className="text-[#8C1D18]">*</span>
                        </label>
                        <input
                          id="v10-submit-name"
                          type="text"
                          required
                          suppressHydrationWarning
                          value={creatorName}
                          onChange={(e) => setCreatorName(e.target.value)}
                          placeholder="Full name or studio name"
                          className="mt-2 w-full rounded-none border-0 border-b border-[#111110]/20 bg-transparent px-0 py-3 font-sans text-sm text-[#111110] placeholder:text-[#6E6A63]/55 transition-colors focus:border-[#111110] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="v10-submit-handle"
                          className="block font-sans text-[11px] tracking-[0.2em] text-[#111110] uppercase"
                        >
                          Instagram / Portfolio Handle
                        </label>
                        <input
                          id="v10-submit-handle"
                          type="text"
                          suppressHydrationWarning
                          value={creatorHandle}
                          onChange={(e) => setCreatorHandle(e.target.value)}
                          placeholder="@your.atelier"
                          className="mt-2 w-full rounded-none border-0 border-b border-[#111110]/20 bg-transparent px-0 py-3 font-sans text-sm text-[#111110] placeholder:text-[#6E6A63]/55 transition-colors focus:border-[#111110] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Tier / Category Selector */}
                    <div>
                      <p className="font-sans text-[11px] tracking-[0.2em] text-[#111110] uppercase">
                        Silhouette Tier &amp; Category
                      </p>
                      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        {CATEGORIES.map((option) => {
                          const selected = category === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              suppressHydrationWarning
                              onClick={() => setCategory(option)}
                              className={cn(
                                "cursor-pointer rounded-none border px-3.5 py-3 text-left font-mono text-[10px] tracking-[0.14em] uppercase transition-colors",
                                selected
                                  ? "border-[#111110] bg-[#111110] text-[#FAF9F6]"
                                  : "border-[#111110]/15 bg-[#FFFFFF] text-[#111110] hover:border-[#111110]/55"
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
                        htmlFor="v10-submit-notes"
                        className="block font-sans text-[11px] tracking-[0.2em] text-[#111110] uppercase"
                      >
                        Fabric &amp; Craftsmanship Notes{" "}
                        <span className="text-[#8C1D18]">*</span>
                      </label>
                      <textarea
                        id="v10-submit-notes"
                        required
                        rows={4}
                        suppressHydrationWarning
                        value={craftsmanshipNotes}
                        onChange={(e) => setCraftsmanshipNotes(e.target.value)}
                        placeholder="Describe textile weight (GSM), weave, embroidery or print method, hardware, drape, and finishing details..."
                        className="mt-3 w-full resize-y rounded-none border border-[#111110]/15 bg-[#FFFFFF] p-4 font-sans text-sm leading-relaxed text-[#111110] placeholder:text-[#6E6A63]/55 transition-colors focus:border-[#111110] focus:outline-none"
                      />
                    </div>

                    {/* Optional Concept Image URL + Clean 4:3 Preview */}
                    <div>
                      <label
                        htmlFor="v10-submit-image"
                        className="block font-sans text-[11px] tracking-[0.2em] text-[#111110] uppercase"
                      >
                        Concept Image URL{" "}
                        <span className="font-mono text-[10px] tracking-[0.12em] text-[#6E6A63] normal-case">
                          (Optional)
                        </span>
                      </label>
                      <input
                        id="v10-submit-image"
                        type="url"
                        suppressHydrationWarning
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://... or /images/..."
                        className="mt-2 w-full rounded-none border-0 border-b border-[#111110]/20 bg-transparent px-0 py-3 font-mono text-xs text-[#111110] placeholder:text-[#6E6A63]/55 transition-colors focus:border-[#111110] focus:outline-none"
                      />

                      {showImagePreview && (
                        <div className="mt-4">
                          <p className="font-mono text-[10px] tracking-[0.16em] text-[#6E6A63] uppercase">
                            CONCEPT STUDY PREVIEW
                          </p>
                          <div className="relative mt-2 aspect-[4/3] w-full overflow-hidden rounded-none border border-[#111110]/12 bg-[#F2EFE9]">
                            {previewFailed ? (
                              <div className="flex h-full w-full items-center justify-center px-6 text-center font-mono text-[10px] tracking-[0.16em] text-[#6E6A63] uppercase">
                                PREVIEW UNAVAILABLE — VERIFY IMAGE URL
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
                        className="border border-[#8C1D18]/25 bg-[#8C1D18]/5 px-4 py-3 font-sans text-xs text-[#8C1D18]"
                      >
                        {errorMessage}
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        suppressHydrationWarning
                        disabled={isSubmitting}
                        className="w-full cursor-pointer rounded-none border border-[#111110] bg-[#111110] px-6 py-4 font-sans text-[11px] tracking-[0.22em] text-[#FAF9F6] uppercase transition-colors hover:border-[#8C1D18] hover:bg-[#8C1D18] disabled:cursor-wait disabled:opacity-60"
                      >
                        {isSubmitting
                          ? "REGISTERING CONCEPT..."
                          : "SUBMIT CONCEPT FOR REVIEW"}
                      </button>

                      <p className="mt-4 font-mono text-[10px] leading-relaxed tracking-[0.06em] text-[#6E6A63]">
                        Creators retain full authorship. Concepts selected by
                        the community enter studio sampling and receive woven
                        interior attribution and release promotion.
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
