"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { CreatorSubmissionItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { cleanV10Text, getV10CleanImage } from "@/components/v10/v10-media";

interface V11SubmitClientProps {
  initialSubmissions: CreatorSubmissionItem[];
}

const CATEGORIES = [
  "Small-Batch Hoodie",
  "Small-Batch Tee",
  "1-of-1 Outerwear",
  "1-of-1 Knitwear",
  "Small-Batch Bottoms",
] as const;

const CREATOR_JOURNEY = [
  {
    number: "01",
    title: "ORIGINAL DOSSIER",
    summary: "Silhouette, textile weight & craft specification",
    detail:
      "Submit original garment proportions, GSM fabric weight, weave structure, embroidery or print techniques, and hardware details.",
  },
  {
    number: "02",
    title: "COMMUNITY BALLOT",
    summary: "Shortlisted works enter public curation",
    detail:
      "Our studio reviews every submission for pattern feasibility before advancing selected dossiers to the live community ballot.",
  },
  {
    number: "03",
    title: "SAMPLED & CREDITED",
    summary: "Cut in numbered micro-runs with woven attribution",
    detail:
      "Winning silhouettes enter single-sample prototyping, launch in strictly capped editions, and carry permanent interior creator credit.",
  },
] as const;

function cleanNoirText(text: string): string {
  return cleanV10Text(text).replace(/\bbombay\b/gi, "India");
}

function formatHandle(handle: string): string {
  const trimmed = handle.trim();
  if (!trimmed) return "@creator";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function getStatusMeta(status: CreatorSubmissionItem["status"]): {
  label: string;
  className: string;
} {
  if (status === "selected") {
    return {
      label: "SELECTED FOR RELEASE",
      className: "text-[#C81E1E]",
    };
  }
  if (status === "approved_for_vote") {
    return {
      label: "ON BALLOT",
      className: "text-[#F4F2ED]",
    };
  }
  return {
    label: "UNDER REVIEW",
    className: "text-[#8E8C87]",
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

export default function V11SubmitClient({
  initialSubmissions,
}: V11SubmitClientProps) {
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
        throw new Error(data.error || "Unable to register dossier right now.");
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
          : "Unable to register dossier right now. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-[#F4F2ED]">
      {/* Monumental Dark Editorial Header */}
      <header className="border-b border-white/10 bg-[#070709] py-14 sm:py-20">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.26em] text-[#8E8C87] uppercase">
            <span className="inline-block h-1.5 w-1.5 bg-[#C81E1E]" />
            <span>CREATOR RESIDENCY · FUTURE EDITIONS</span>
          </div>

          <h1 className="mt-6 max-w-5xl font-syne text-5xl leading-[0.9] font-extrabold tracking-[-0.03em] text-[#F4F2ED] uppercase sm:text-7xl lg:text-[84px]">
            SUBMISSION STUDIO
          </h1>

          <p className="mt-7 max-w-2xl font-sans text-sm leading-relaxed text-[#8E8C87] sm:text-base">
            Independent Indian designers and garment makers can file original
            silhouettes for upcoming KNITX editions. Community-selected designs
            are sampled in-house, cut in strictly limited runs, and credited by
            name on every numbered piece.
          </p>
        </div>
      </header>

      {/* 12-Column Obsidian Residency Split */}
      <section className="bg-[#070709] py-16 sm:py-24">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-start gap-12 px-6 sm:px-10 lg:grid-cols-12 lg:gap-16 lg:px-14">
          {/* Left Column (5 Cols): 3-Stage Creator Journey + Live Registry */}
          <div className="lg:col-span-5">
            <p className="font-mono text-[10px] tracking-[0.24em] text-[#8E8C87] uppercase">
              THREE-STAGE CREATOR JOURNEY
            </p>

            <ol className="mt-5 divide-y divide-white/10 border-t border-b border-white/10">
              {CREATOR_JOURNEY.map((stage) => (
                <li key={stage.number} className="py-6">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[10px] tracking-[0.2em] text-[#C81E1E]">
                      {stage.number}
                    </span>
                    <h2 className="font-syne text-base font-bold tracking-[0.04em] text-[#F4F2ED] uppercase">
                      {stage.title}
                    </h2>
                  </div>
                  <p className="mt-2 font-sans text-sm font-medium text-[#F4F2ED]/90">
                    {stage.summary}
                  </p>
                  <p className="mt-1.5 font-sans text-xs leading-relaxed text-[#8E8C87]">
                    {stage.detail}
                  </p>
                </li>
              ))}
            </ol>

            {/* Live Shortlisted Submissions Registry */}
            <div className="mt-14">
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-mono text-[10px] tracking-[0.24em] text-[#F4F2ED] uppercase">
                  SHORTLISTED REGISTRY
                </p>
                <span className="font-mono text-[10px] tracking-[0.18em] text-[#8E8C87] uppercase">
                  {String(submissions.length).padStart(2, "0")} DOSSIERS
                </span>
              </div>

              <div className="mt-5 divide-y divide-white/10 border-t border-b border-white/10">
                {submissions.map((item) => {
                  const statusMeta = getStatusMeta(item.status);
                  return (
                    <article key={item._id} className="py-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={cn(
                            "font-mono text-[10px] tracking-[0.2em] uppercase",
                            statusMeta.className
                          )}
                        >
                          {statusMeta.label}
                        </span>
                        <span className="font-mono text-[10px] tracking-[0.14em] text-[#8E8C87] uppercase">
                          {cleanNoirText(item.category)}
                        </span>
                      </div>

                      <h3 className="mt-2.5 font-syne text-lg leading-[1.1] font-bold tracking-[-0.01em] text-[#F4F2ED] uppercase">
                        {cleanNoirText(item.title)}
                      </h3>

                      <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-[#8E8C87]">
                        {item.creatorName} · {formatHandle(item.creatorHandle)}
                      </p>

                      <p className="mt-2.5 font-sans text-xs leading-relaxed text-[#8E8C87]">
                        {cleanNoirText(item.craftsmanshipNotes)}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (7 Cols): Sleek Obsidian Dossier Form */}
          <div className="lg:col-span-7">
            <div className="rounded-none border border-white/12 bg-[#0E0E12] p-8 sm:p-12">
              {receipt ? (
                <div>
                  <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.24em] text-[#C81E1E] uppercase">
                    <Check className="h-3.5 w-3.5 stroke-[2]" />
                    <span>DOSSIER LOGGED</span>
                  </div>

                  <h2 className="mt-5 font-syne text-3xl leading-[0.98] font-extrabold tracking-[-0.02em] text-[#F4F2ED] uppercase sm:text-5xl">
                    CONCEPT REGISTERED FOR STUDIO REVIEW
                  </h2>

                  <p className="mt-4 max-w-lg font-sans text-sm leading-relaxed text-[#8E8C87]">
                    Your silhouette dossier has been appended to the live
                    residency registry. Creators of shortlisted works are
                    contacted prior to the next ballot opening.
                  </p>

                  <dl className="mt-8 divide-y divide-white/10 border-t border-b border-white/10">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                      <dt className="font-mono text-[10px] tracking-[0.2em] text-[#8E8C87] uppercase">
                        CONCEPT TITLE
                      </dt>
                      <dd className="font-syne text-base font-bold text-[#F4F2ED] uppercase">
                        {cleanNoirText(receipt.title)}
                      </dd>
                    </div>

                    <div className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                      <dt className="font-mono text-[10px] tracking-[0.2em] text-[#8E8C87] uppercase">
                        CREATOR
                      </dt>
                      <dd className="font-sans text-xs text-[#F4F2ED]">
                        {receipt.creatorName} ·{" "}
                        {formatHandle(receipt.creatorHandle)}
                      </dd>
                    </div>

                    <div className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                      <dt className="font-mono text-[10px] tracking-[0.2em] text-[#8E8C87] uppercase">
                        CATEGORY
                      </dt>
                      <dd className="font-mono text-[11px] tracking-[0.14em] text-[#F4F2ED] uppercase">
                        {cleanNoirText(receipt.category)}
                      </dd>
                    </div>

                    <div className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                      <dt className="font-mono text-[10px] tracking-[0.2em] text-[#8E8C87] uppercase">
                        STATUS
                      </dt>
                      <dd className="font-mono text-[10px] tracking-[0.2em] text-[#C81E1E] uppercase">
                        UNDER REVIEW
                      </dd>
                    </div>

                    {mounted && (
                      <div className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                        <dt className="font-mono text-[10px] tracking-[0.2em] text-[#8E8C87] uppercase">
                          DOSSIER REF
                        </dt>
                        <dd className="font-mono text-[11px] tracking-[0.14em] text-[#8E8C87] uppercase">
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
                      className="cursor-pointer rounded-none border border-[#F4F2ED] bg-[#F4F2ED] px-7 py-4 font-sans text-[11px] font-semibold tracking-[0.22em] text-[#070709] uppercase transition-colors hover:border-[#C81E1E] hover:bg-[#C81E1E] hover:text-[#F4F2ED]"
                    >
                      FILE ANOTHER DOSSIER
                    </button>

                    <Link
                      href="/v11/vote"
                      className="inline-flex items-center justify-center gap-2.5 rounded-none border border-white/20 bg-transparent px-7 py-4 font-sans text-[11px] font-medium tracking-[0.22em] text-[#F4F2ED] uppercase transition-colors hover:border-[#F4F2ED]"
                    >
                      <span>OPEN COMMUNITY BALLOT</span>
                      <ArrowRight className="h-3.5 w-3.5 stroke-[1.75]" />
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <div className="border-b border-white/10 pb-6">
                    <p className="font-mono text-[10px] tracking-[0.24em] text-[#8E8C87] uppercase">
                      NEW GARMENT DOSSIER · FUTURE EDITIONS
                    </p>
                    <h2 className="mt-3 font-syne text-2xl font-extrabold tracking-[-0.02em] text-[#F4F2ED] uppercase sm:text-3xl">
                      SPECIFICATION SHEET
                    </h2>
                  </div>

                  <div className="mt-8 space-y-8">
                    {/* Concept Title */}
                    <div>
                      <label
                        htmlFor="v11-submit-title"
                        className="block font-mono text-[10px] tracking-[0.22em] text-[#F4F2ED] uppercase"
                      >
                        DESIGN TITLE <span className="text-[#C81E1E]">*</span>
                      </label>
                      <input
                        id="v11-submit-title"
                        type="text"
                        required
                        suppressHydrationWarning
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Deccan Slub Raw-Seam Field Jacket"
                        className="mt-2 w-full rounded-none border-0 border-b border-white/20 bg-transparent px-0 py-3 font-sans text-sm text-[#F4F2ED] placeholder:text-[#8E8C87]/50 transition-colors focus:border-[#F4F2ED] focus:outline-none"
                      />
                    </div>

                    {/* Creator Name & Handle */}
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="v11-submit-name"
                          className="block font-mono text-[10px] tracking-[0.22em] text-[#F4F2ED] uppercase"
                        >
                          CREATOR NAME <span className="text-[#C81E1E]">*</span>
                        </label>
                        <input
                          id="v11-submit-name"
                          type="text"
                          required
                          suppressHydrationWarning
                          value={creatorName}
                          onChange={(e) => setCreatorName(e.target.value)}
                          placeholder="Full name or studio name"
                          className="mt-2 w-full rounded-none border-0 border-b border-white/20 bg-transparent px-0 py-3 font-sans text-sm text-[#F4F2ED] placeholder:text-[#8E8C87]/50 transition-colors focus:border-[#F4F2ED] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="v11-submit-handle"
                          className="block font-mono text-[10px] tracking-[0.22em] text-[#F4F2ED] uppercase"
                        >
                          PORTFOLIO / SOCIAL HANDLE
                        </label>
                        <input
                          id="v11-submit-handle"
                          type="text"
                          suppressHydrationWarning
                          value={creatorHandle}
                          onChange={(e) => setCreatorHandle(e.target.value)}
                          placeholder="@your.atelier"
                          className="mt-2 w-full rounded-none border-0 border-b border-white/20 bg-transparent px-0 py-3 font-sans text-sm text-[#F4F2ED] placeholder:text-[#8E8C87]/50 transition-colors focus:border-[#F4F2ED] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Category Selector */}
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.22em] text-[#F4F2ED] uppercase">
                        SILHOUETTE CATEGORY
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
                                  ? "border-[#F4F2ED] bg-[#F4F2ED] text-[#070709]"
                                  : "border-white/15 bg-[#141419] text-[#8E8C87] hover:border-white/40 hover:text-[#F4F2ED]"
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
                        htmlFor="v11-submit-notes"
                        className="block font-mono text-[10px] tracking-[0.22em] text-[#F4F2ED] uppercase"
                      >
                        FABRIC &amp; CRAFTSMANSHIP NOTES{" "}
                        <span className="text-[#C81E1E]">*</span>
                      </label>
                      <textarea
                        id="v11-submit-notes"
                        required
                        rows={4}
                        suppressHydrationWarning
                        value={craftsmanshipNotes}
                        onChange={(e) => setCraftsmanshipNotes(e.target.value)}
                        placeholder="Specify GSM textile weight, weave, chain-stitching or raised puff ink methods, hardware, and structural drape..."
                        className="mt-3 w-full resize-y rounded-none border border-white/15 bg-[#141419] p-4 font-sans text-sm leading-relaxed text-[#F4F2ED] placeholder:text-[#8E8C87]/50 transition-colors focus:border-[#F4F2ED] focus:outline-none"
                      />
                    </div>

                    {/* Optional Concept Image URL + Instant Preview */}
                    <div>
                      <label
                        htmlFor="v11-submit-image"
                        className="block font-mono text-[10px] tracking-[0.22em] text-[#F4F2ED] uppercase"
                      >
                        CONCEPT IMAGE URL{" "}
                        <span className="text-[#8E8C87] normal-case">
                          (Optional)
                        </span>
                      </label>
                      <input
                        id="v11-submit-image"
                        type="url"
                        suppressHydrationWarning
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://... or /images/..."
                        className="mt-2 w-full rounded-none border-0 border-b border-white/20 bg-transparent px-0 py-3 font-mono text-xs text-[#F4F2ED] placeholder:text-[#8E8C87]/50 transition-colors focus:border-[#F4F2ED] focus:outline-none"
                      />

                      {showImagePreview && (
                        <div className="mt-5">
                          <p className="font-mono text-[10px] tracking-[0.2em] text-[#8E8C87] uppercase">
                            INSTANT STUDY PREVIEW
                          </p>
                          <div className="relative mt-2 aspect-[4/3] w-full overflow-hidden border border-white/10 bg-[#141419]">
                            {previewFailed ? (
                              <div className="flex h-full w-full items-center justify-center px-6 text-center font-mono text-[10px] tracking-[0.18em] text-[#8E8C87] uppercase">
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
                        className="border border-[#C81E1E]/50 bg-[#C81E1E]/15 px-4 py-3 font-sans text-xs text-[#F4F2ED]"
                      >
                        {errorMessage}
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        suppressHydrationWarning
                        disabled={isSubmitting}
                        className="w-full cursor-pointer rounded-none border border-[#F4F2ED] bg-[#F4F2ED] px-6 py-4 font-sans text-[11px] font-semibold tracking-[0.24em] text-[#070709] uppercase transition-colors hover:border-[#C81E1E] hover:bg-[#C81E1E] hover:text-[#F4F2ED] disabled:cursor-wait disabled:opacity-60"
                      >
                        {isSubmitting
                          ? "REGISTERING DOSSIER..."
                          : "SUBMIT CONCEPT DOSSIER"}
                      </button>

                      <p className="mt-4 font-mono text-[10px] leading-relaxed tracking-[0.06em] text-[#8E8C87]">
                        Creators retain full authorship. Shortlisted silhouettes
                        enter community voting and receive woven interior
                        attribution across every numbered unit produced.
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
