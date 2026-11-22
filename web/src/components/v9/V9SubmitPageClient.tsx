"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ImagePlus,
  Layers,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { CreatorSubmissionItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface V9SubmitPageClientProps {
  initialSubmissions: CreatorSubmissionItem[];
}

const REWARD_PILLARS = [
  {
    index: "01",
    title: "We Sample & Produce It",
    detail:
      "We cut one physical master sample for studio lookbooks and manufacture strictly after orders arrive.",
  },
  {
    index: "02",
    title: "Your Name Woven on the Neck Label",
    detail:
      "Every numbered garment carries a custom-woven cotton neck label credited permanently to your handle.",
  },
  {
    index: "03",
    title: "Drop Campaign Feature & Creator Royalty",
    detail:
      "Featured across the Drop 02 campaign film with a direct creator royalty paid on every unit claimed.",
  },
] as const;

const GARMENT_CATEGORIES = [
  "Small-Batch (3–4 Units)",
  "1-of-1 Collector Piece",
  "Heavyweight Hoodie",
  "Boxy Heavy Tee",
  "Structured Knitwear",
  "Tailored Outerwear",
] as const;

const CRAFTSMANSHIP_OPTIONS = [
  "3D Puff Print",
  "Chain-Stitch Embroidery",
  "Hand-Painted Finish",
  "450 GSM Loopback",
  "Raw Exposed Seams",
  "Bespoke Patchwork",
] as const;

const STUDIO_PRESETS = [
  {
    id: "preset-hoodie",
    label: "Heavy Hoodie",
    code: "SIL-01",
    imageUrl: "/images/look-batch-hoodie.jpg",
  },
  {
    id: "preset-tee",
    label: "Boxy Tee",
    code: "SIL-02",
    imageUrl: "/images/look-batch-tee.jpg",
  },
  {
    id: "preset-jacket",
    label: "1-of-1 Jacket",
    code: "SIL-03",
    imageUrl: "/images/look-1of1-jacket.jpg",
  },
  {
    id: "preset-knit",
    label: "1-of-1 Knit",
    code: "SIL-04",
    imageUrl: "/images/look-1of1-knit.jpg",
  },
] as const;

const MONTHS_UTC = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

function formatUtcDate(isoString: string): string {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return "DROP 02";
  }
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  const month = MONTHS_UTC[parsed.getUTCMonth()] || "JAN";
  const year = parsed.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

function normalizeHandle(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, "");
  if (!cleaned) return "@YOURHANDLE";
  const withAt = cleaned.startsWith("@") ? cleaned : `@${cleaned}`;
  return withAt.toUpperCase();
}

function getStatusBadge(status: CreatorSubmissionItem["status"]): {
  label: string;
  className: string;
} {
  switch (status) {
    case "selected":
      return {
        label: "Selected",
        className: "bg-[#8E1C1C] text-white border-[#8E1C1C]",
      };
    case "approved_for_vote":
      return {
        label: "On Ballot",
        className: "bg-[#9A7B4F] text-white border-[#9A7B4F]",
      };
    default:
      return {
        label: "In Review",
        className: "bg-white/95 text-[#111110] border-[#DDD7CB]",
      };
  }
}

export default function V9SubmitPageClient({
  initialSubmissions,
}: V9SubmitPageClientProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [submissions, setSubmissions] =
    useState<CreatorSubmissionItem[]>(initialSubmissions);

  const [title, setTitle] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [creatorHandle, setCreatorHandle] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<string>(GARMENT_CATEGORIES[0]);
  const [selectedCrafts, setSelectedCrafts] = useState<string[]>([
    "450 GSM Loopback",
  ]);
  const [designNotes, setDesignNotes] = useState("");

  const [selectedPresetUrl, setSelectedPresetUrl] = useState<string>(
    STUDIO_PRESETS[0].imageUrl
  );
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(
    null
  );
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedPiece, setSubmittedPiece] =
    useState<CreatorSubmissionItem | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    setCreatorName((prev) => (prev ? prev : user.displayName || ""));
    setEmail((prev) => (prev ? prev : user.email || ""));
  }, [mounted, user]);

  const activeArtworkUrl = uploadedPreviewUrl || selectedPresetUrl;
  const liveHandle = normalizeHandle(creatorHandle);
  const isOneOfOne = category.toLowerCase().includes("1-of-1");
  const liveEditionCode = isOneOfOne ? "01/01" : "01/04";

  const toggleCraft = (craft: string) => {
    setSelectedCrafts((prev) =>
      prev.includes(craft)
        ? prev.filter((item) => item !== craft)
        : [...prev, craft]
    );
  };

  const processArtworkFile = (file: File | undefined | null) => {
    if (!file) return;
    setUploadError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError("Please upload a PNG, JPG, or WEBP artwork file.");
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("Artwork must be 4 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setUploadedPreviewUrl(reader.result);
        setUploadedFileName(file.name);
      }
    };
    reader.onerror = () => {
      setUploadError("Unable to read artwork preview. Please try another file.");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processArtworkFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    processArtworkFile(file);
  };

  const clearUpload = () => {
    setUploadedPreviewUrl(null);
    setUploadedFileName(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSelectPreset = (url: string) => {
    setSelectedPresetUrl(url);
    clearUpload();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const trimmedTitle = title.trim();
    const trimmedName = creatorName.trim();
    const trimmedNotes = designNotes.trim();

    if (!trimmedTitle || !trimmedName || !trimmedNotes) {
      setSubmitError(
        "Please complete the piece title, your name, and design notes before submitting."
      );
      return;
    }

    const craftPrefix =
      selectedCrafts.length > 0 ? `[${selectedCrafts.join(" · ")}] ` : "";
    const composedNotes = `${craftPrefix}${trimmedNotes}`;

    setSubmitting(true);
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          creatorName: trimmedName,
          creatorHandle: creatorHandle.trim(),
          email: email.trim(),
          category,
          craftsmanshipNotes: composedNotes,
          imageUrl: activeArtworkUrl,
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        submission?: CreatorSubmissionItem;
      };

      if (!response.ok || !payload.ok || !payload.submission) {
        setSubmitError(
          payload.error || "Unable to register concept right now. Please retry."
        );
        return;
      }

      setSubmissions((prev) => [payload.submission!, ...prev]);
      setSubmittedPiece(payload.submission);
      setTitle("");
      setDesignNotes("");
      clearUpload();
    } catch {
      setSubmitError(
        "Connection interrupted while filing your dossier. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] pt-28 pb-24 text-[#111110]">
      <div className="mx-auto max-w-[1380px] px-5 sm:px-10 lg:px-14">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="pb-12"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#8E1C1C]" />
            <span className="font-mono text-[11px] font-medium tracking-[0.24em] text-[#9A7B4F] uppercase">
              CREATOR COMMISSION · DROP 02
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <h1 className="font-poster text-5xl leading-[0.94] tracking-tight text-[#111110] uppercase sm:text-7xl lg:text-[5.5rem]">
                SUBMIT YOUR DESIGN.
              </h1>
            </div>
            <div className="lg:col-span-4 lg:pb-2">
              <p className="font-sans text-sm leading-relaxed text-[#6A655D] sm:text-[15px]">
                Open to independent illustrators, patternmakers, and textile
                artists across India. Pitch one silhouette for the Drop 02
                community ballot.
              </p>
            </div>
          </div>

          {/* 3 Horizontal Reward Pillars */}
          <div className="mt-10 grid grid-cols-1 gap-5 border-y border-[#DDD7CB] py-7 md:grid-cols-3 md:gap-8">
            {REWARD_PILLARS.map((pillar, idx) => (
              <div
                key={pillar.index}
                className={cn(
                  "flex flex-col justify-between gap-2",
                  idx > 0 && "md:border-l md:border-[#DDD7CB] md:pl-8"
                )}
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs font-semibold tracking-[0.2em] text-[#9A7B4F]">
                    {pillar.index}
                  </span>
                  <h2 className="font-sans text-sm font-semibold tracking-[0.04em] text-[#111110] uppercase">
                    {pillar.title}
                  </h2>
                </div>
                <p className="pl-7 font-sans text-xs leading-relaxed text-[#6A655D]">
                  {pillar.detail}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Split-Screen Commission Studio */}
        <section
          aria-label="Creator Commission Studio"
          className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12"
        >
          {/* Left: Architectural Form Card (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-[#DDD7CB] bg-white p-6 shadow-[0_24px_60px_-36px_rgba(17,17,16,0.12)] sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDD7CB] pb-5">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.22em] text-[#9A7B4F] uppercase">
                    COMMISSION DOSSIER · INDIA
                  </p>
                  <h2 className="mt-1 font-poster text-2xl tracking-wide text-[#111110] uppercase sm:text-3xl">
                    DESIGN SPECIFICATION
                  </h2>
                </div>
                <span className="rounded-full border border-[#DDD7CB] bg-[#F7F5F0] px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-[#6A655D] uppercase">
                  DROP 02 OPEN
                </span>
              </div>

              <AnimatePresence>
                {submittedPiece && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-6 rounded-xl border border-[#9A7B4F]/40 bg-[#F7F5F0] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#8E1C1C]" />
                        <div>
                          <p className="font-mono text-[10px] font-semibold tracking-[0.2em] text-[#8E1C1C] uppercase">
                            CONCEPT FILED FOR DROP 02
                          </p>
                          <p className="mt-1 font-sans text-sm font-medium text-[#111110]">
                            &ldquo;{submittedPiece.title}&rdquo; by{" "}
                            {submittedPiece.creatorHandle} is now live in the
                            Community Submissions Archive below.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setSubmittedPiece(null)}
                        aria-label="Dismiss confirmation"
                        className="text-[#6A655D] transition-colors hover:text-[#111110]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                {/* Piece Title */}
                <div>
                  <label
                    htmlFor="v9-piece-title"
                    className="block font-mono text-[10px] font-medium tracking-[0.2em] text-[#6A655D] uppercase"
                  >
                    Piece Title *
                  </label>
                  <input
                    id="v9-piece-title"
                    type="text"
                    required
                    suppressHydrationWarning
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Monsoon Grid 480 GSM Hoodie"
                    className="mt-2 w-full rounded-xl border border-[#DDD7CB] bg-[#F7F5F0]/60 px-4 py-3 font-sans text-sm text-[#111110] placeholder:text-[#6A655D]/60 transition-colors focus:border-[#8E1C1C] focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Creator Name & Social Handle */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="v9-creator-name"
                      className="block font-mono text-[10px] font-medium tracking-[0.2em] text-[#6A655D] uppercase"
                    >
                      Your Name *
                    </label>
                    <input
                      id="v9-creator-name"
                      type="text"
                      required
                      suppressHydrationWarning
                      value={creatorName}
                      onChange={(e) => setCreatorName(e.target.value)}
                      placeholder="Full name or studio"
                      className="mt-2 w-full rounded-xl border border-[#DDD7CB] bg-[#F7F5F0]/60 px-4 py-3 font-sans text-sm text-[#111110] placeholder:text-[#6A655D]/60 transition-colors focus:border-[#8E1C1C] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="v9-creator-handle"
                      className="block font-mono text-[10px] font-medium tracking-[0.2em] text-[#6A655D] uppercase"
                    >
                      Instagram / Social Handle
                    </label>
                    <input
                      id="v9-creator-handle"
                      type="text"
                      suppressHydrationWarning
                      value={creatorHandle}
                      onChange={(e) => setCreatorHandle(e.target.value)}
                      placeholder="@yourhandle"
                      className="mt-2 w-full rounded-xl border border-[#DDD7CB] bg-[#F7F5F0]/60 px-4 py-3 font-mono text-sm text-[#111110] placeholder:text-[#6A655D]/60 transition-colors focus:border-[#8E1C1C] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Email & Garment Category */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="v9-creator-email"
                      className="block font-mono text-[10px] font-medium tracking-[0.2em] text-[#6A655D] uppercase"
                    >
                      Email
                    </label>
                    <input
                      id="v9-creator-email"
                      type="email"
                      suppressHydrationWarning
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@studio.in"
                      className="mt-2 w-full rounded-xl border border-[#DDD7CB] bg-[#F7F5F0]/60 px-4 py-3 font-sans text-sm text-[#111110] placeholder:text-[#6A655D]/60 transition-colors focus:border-[#8E1C1C] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="v9-garment-category"
                      className="block font-mono text-[10px] font-medium tracking-[0.2em] text-[#6A655D] uppercase"
                    >
                      Garment Category
                    </label>
                    <select
                      id="v9-garment-category"
                      suppressHydrationWarning
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#DDD7CB] bg-[#F7F5F0]/60 px-4 py-3 font-sans text-sm text-[#111110] transition-colors focus:border-[#8E1C1C] focus:bg-white focus:outline-none"
                    >
                      {GARMENT_CATEGORIES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Craftsmanship Pill Toggles */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-medium tracking-[0.2em] text-[#6A655D] uppercase">
                      Craftsmanship Details
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.14em] text-[#9A7B4F] uppercase">
                      {selectedCrafts.length} Selected
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {CRAFTSMANSHIP_OPTIONS.map((craft) => {
                      const active = selectedCrafts.includes(craft);
                      return (
                        <button
                          key={craft}
                          type="button"
                          suppressHydrationWarning
                          onClick={() => toggleCraft(craft)}
                          aria-pressed={active}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 font-sans text-xs font-medium transition-all duration-200 focus:outline-none",
                            active
                              ? "border-[#8E1C1C] bg-[#8E1C1C] text-white"
                              : "border-[#DDD7CB] bg-[#F7F5F0] text-[#111110] hover:border-[#9A7B4F] hover:bg-[#ECE8DF]"
                          )}
                        >
                          {active && <Check className="h-3.5 w-3.5 stroke-[2.2]" />}
                          <span>{craft}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Design Notes */}
                <div>
                  <label
                    htmlFor="v9-design-notes"
                    className="block font-mono text-[10px] font-medium tracking-[0.2em] text-[#6A655D] uppercase"
                  >
                    Design Notes *
                  </label>
                  <textarea
                    id="v9-design-notes"
                    rows={4}
                    required
                    suppressHydrationWarning
                    value={designNotes}
                    onChange={(e) => setDesignNotes(e.target.value)}
                    placeholder="Describe silhouette proportions, print placement, stitch colors, fabric weight, and finish..."
                    className="mt-2 w-full resize-none rounded-xl border border-[#DDD7CB] bg-[#F7F5F0]/60 px-4 py-3 font-sans text-sm leading-relaxed text-[#111110] placeholder:text-[#6A655D]/60 transition-colors focus:border-[#8E1C1C] focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Drag-and-Drop Artwork Upload + Studio Silhouette Presets */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-medium tracking-[0.2em] text-[#6A655D] uppercase">
                      Artwork Upload or Studio Silhouette
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.14em] text-[#6A655D] uppercase">
                      PNG · JPG · WEBP · MAX 4MB
                    </span>
                  </div>

                  {/* Drag & Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={cn(
                      "rounded-xl border border-dashed p-5 transition-colors duration-200",
                      isDragging
                        ? "border-[#8E1C1C] bg-[#8E1C1C]/5"
                        : uploadedPreviewUrl
                          ? "border-[#9A7B4F] bg-[#F7F5F0]"
                          : "border-[#DDD7CB] bg-[#F7F5F0]/70 hover:border-[#9A7B4F]"
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      suppressHydrationWarning
                      onChange={handleFileChange}
                      className="hidden"
                      aria-label="Upload design artwork"
                    />

                    {uploadedPreviewUrl ? (
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={uploadedPreviewUrl}
                            alt="Uploaded artwork thumbnail"
                            className="h-14 w-14 rounded-lg border border-[#DDD7CB] object-cover"
                          />
                          <div>
                            <p className="font-mono text-[10px] tracking-[0.18em] text-[#9A7B4F] uppercase">
                              CUSTOM ARTWORK LOADED
                            </p>
                            <p className="mt-0.5 max-w-[220px] truncate font-sans text-xs font-medium text-[#111110]">
                              {uploadedFileName || "creator-artwork.png"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            suppressHydrationWarning
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-lg border border-[#DDD7CB] bg-white px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-[#111110] uppercase transition-colors hover:border-[#111110]"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            suppressHydrationWarning
                            onClick={clearUpload}
                            className="rounded-lg border border-[#DDD7CB] bg-white px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-[#8E1C1C] uppercase transition-colors hover:border-[#8E1C1C]"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-2 text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DDD7CB] bg-white text-[#8E1C1C]">
                          <Upload className="h-4 w-4" />
                        </div>
                        <p className="mt-3 font-sans text-sm font-medium text-[#111110]">
                          Drag &amp; drop your tech-pack, sketch, or flat-lay
                        </p>
                        <p className="mt-1 font-sans text-xs text-[#6A655D]">
                          Or select one of our 4 studio silhouettes below to
                          preview immediately
                        </p>
                        <button
                          type="button"
                          suppressHydrationWarning
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-3.5 inline-flex items-center gap-2 rounded-lg border border-[#111110] bg-white px-4 py-2 font-mono text-[10px] font-medium tracking-[0.18em] text-[#111110] uppercase transition-colors hover:bg-[#111110] hover:text-white"
                        >
                          <ImagePlus className="h-3.5 w-3.5" />
                          <span>Browse Artwork</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {uploadError && (
                    <p className="font-mono text-[11px] text-[#8E1C1C]">
                      {uploadError}
                    </p>
                  )}

                  {/* 4 Studio Silhouette Presets */}
                  <div>
                    <p className="mb-2.5 font-mono text-[10px] tracking-[0.18em] text-[#6A655D] uppercase">
                      Or Choose Studio Silhouette Base
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {STUDIO_PRESETS.map((preset) => {
                        const isSelected =
                          !uploadedPreviewUrl &&
                          selectedPresetUrl === preset.imageUrl;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            suppressHydrationWarning
                            onClick={() => handleSelectPreset(preset.imageUrl)}
                            className={cn(
                              "group relative overflow-hidden rounded-xl border bg-[#ECE8DF] text-left transition-all duration-200 focus:outline-none",
                              isSelected
                                ? "border-[#8E1C1C] ring-2 ring-[#8E1C1C]/20"
                                : "border-[#DDD7CB] hover:border-[#9A7B4F]"
                            )}
                          >
                            <div className="aspect-[4/5] w-full overflow-hidden">
                              <img
                                src={preset.imageUrl}
                                alt={preset.label}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            </div>
                            <div className="flex items-center justify-between border-t border-[#DDD7CB] bg-white px-2.5 py-2">
                              <span className="truncate font-sans text-[11px] font-medium text-[#111110]">
                                {preset.label}
                              </span>
                              <span
                                className={cn(
                                  "font-mono text-[9px] tracking-[0.14em]",
                                  isSelected
                                    ? "font-semibold text-[#8E1C1C]"
                                    : "text-[#9A7B4F]"
                                )}
                              >
                                {preset.code}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {submitError && (
                  <div className="rounded-xl border border-[#8E1C1C]/30 bg-[#8E1C1C]/5 px-4 py-3 font-sans text-xs text-[#8E1C1C]">
                    {submitError}
                  </div>
                )}

                {/* Deep Oxblood Submit CTA */}
                <button
                  type="submit"
                  disabled={submitting}
                  suppressHydrationWarning
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#8E1C1C] px-6 py-4 font-mono text-xs font-semibold tracking-[0.22em] text-white uppercase transition-all duration-200 hover:bg-[#731515] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>
                    {submitting
                      ? "FILING DROP 02 DOSSIER..."
                      : "SUBMIT FOR DROP 02 →"}
                  </span>
                </button>
              </form>
            </div>
          </div>

          {/* Right: Live Woven Label & Live Ballot Preview (5 cols, sticky) */}
          <aside className="space-y-6 lg:sticky lg:top-28 lg:col-span-5">
            {/* Live Embossed Woven Cotton Neck Label */}
            <div className="rounded-2xl border border-[#DDD7CB] bg-white p-6 shadow-[0_24px_60px_-36px_rgba(17,17,16,0.1)]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-medium tracking-[0.2em] text-[#9A7B4F] uppercase">
                  LIVE GARMENT NECK LABEL
                </span>
                <span className="font-mono text-[10px] tracking-[0.16em] text-[#6A655D] uppercase">
                  100% WOVEN COTTON
                </span>
              </div>

              {/* Stitched Woven Label Patch */}
              <div className="mt-4 rounded-xl bg-[#ECE8DF] p-5">
                <div
                  className="relative overflow-hidden border border-[#DDD7CB] bg-[#F7F5F0] px-5 py-6 shadow-[inset_0_1px_4px_rgba(17,17,16,0.08)]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, rgba(154,123,79,0.045) 0px, rgba(154,123,79,0.045) 1px, transparent 1px, transparent 3px)",
                  }}
                >
                  {/* Inner Stitch Seam */}
                  <div className="pointer-events-none absolute inset-2 border border-dashed border-[#9A7B4F]/40" />

                  {/* 4 Bar-Tack Stitched Corners */}
                  <span
                    aria-hidden="true"
                    className="absolute top-2.5 left-2.5 h-[3px] w-4 rounded-full bg-[#8E1C1C]"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute top-2.5 right-2.5 h-[3px] w-4 rounded-full bg-[#8E1C1C]"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute bottom-2.5 left-2.5 h-[3px] w-4 rounded-full bg-[#8E1C1C]"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute right-2.5 bottom-2.5 h-[3px] w-4 rounded-full bg-[#8E1C1C]"
                  />

                  <div className="relative text-center">
                    <p className="font-mono text-[10px] tracking-[0.26em] text-[#9A7B4F] uppercase">
                      DROP 02 · WOVEN ARCHIVE LABEL
                    </p>
                    <p className="mt-3 break-words font-mono text-xs font-semibold tracking-[0.18em] text-[#111110] uppercase sm:text-[13px]">
                      KNITX® × {liveHandle} · EDITION {liveEditionCode} · MADE
                      IN INDIA
                    </p>
                    <div className="mx-auto my-3 h-px w-16 bg-[#DDD7CB]" />
                    <p className="truncate font-mono text-[10px] tracking-[0.2em] text-[#6A655D] uppercase">
                      {title.trim() || "SAMPLE-FIRST COMMISSION"}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-3.5 font-sans text-xs leading-relaxed text-[#6A655D]">
                Every chosen creator design is sewn with bar-tacked natural
                cotton neck labels crediting your handle permanently inside each
                piece.
              </p>
            </div>

            {/* Live Ballot Preview Card */}
            <div className="overflow-hidden rounded-2xl border border-[#DDD7CB] bg-white shadow-[0_24px_60px_-36px_rgba(17,17,16,0.1)]">
              <div className="flex items-center justify-between border-b border-[#DDD7CB] bg-[#F7F5F0]/70 px-5 py-3.5">
                <span className="inline-flex items-center gap-2 font-mono text-[10px] font-medium tracking-[0.2em] text-[#111110] uppercase">
                  <Sparkles className="h-3.5 w-3.5 text-[#8E1C1C]" />
                  <span>LIVE BALLOT PREVIEW</span>
                </span>
                <span className="font-mono text-[10px] tracking-[0.16em] text-[#9A7B4F] uppercase">
                  {uploadedPreviewUrl ? "UPLOADED ARTWORK" : "STUDIO BASE"}
                </span>
              </div>

              <div className="relative aspect-[4/4] w-full overflow-hidden bg-[#ECE8DF]">
                <img
                  src={activeArtworkUrl}
                  alt={title.trim() || "Live concept preview"}
                  className="h-full w-full object-cover transition-all duration-300"
                />
                <div className="absolute top-3.5 left-3.5 rounded-full border border-[#DDD7CB] bg-white/95 px-3 py-1 font-mono text-[10px] tracking-[0.16em] text-[#111110] uppercase backdrop-blur-sm">
                  {category}
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-[#9A7B4F] uppercase">
                    {creatorName.trim() || "YOUR NAME"} · {liveHandle}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.16em] text-[#6A655D] uppercase">
                    ED. {liveEditionCode}
                  </span>
                </div>

                <h3 className="mt-2 font-poster text-2xl tracking-wide text-[#111110] uppercase">
                  {title.trim() || "UNTITLED DROP 02 CONCEPT"}
                </h3>

                <p className="mt-2 line-clamp-2 font-sans text-xs leading-relaxed text-[#6A655D]">
                  {designNotes.trim() ||
                    "Your silhouette notes, fabric drape details, and finishing specs appear here for community voters."}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {selectedCrafts.length > 0 ? (
                    selectedCrafts.map((craft) => (
                      <span
                        key={craft}
                        className="rounded-full border border-[#DDD7CB] bg-[#F7F5F0] px-2.5 py-1 font-mono text-[10px] tracking-[0.1em] text-[#111110]"
                      >
                        {craft}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-dashed border-[#DDD7CB] px-2.5 py-1 font-mono text-[10px] text-[#6A655D]">
                      Select craftsmanship details
                    </span>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#DDD7CB] pt-3.5 font-mono text-[10px] tracking-[0.18em] text-[#6A655D] uppercase">
                  <span>STATUS · READY TO FILE</span>
                  <span className="text-[#8E1C1C]">DROP 02</span>
                </div>
              </div>
            </div>
          </aside>
        </section>

        {/* Community Submissions Archive */}
        <section
          aria-label="Community Submissions Archive"
          className="mt-24 border-t border-[#DDD7CB] pt-16"
        >
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2.5">
                <Layers className="h-3.5 w-3.5 text-[#9A7B4F]" />
                <span className="font-mono text-[10px] font-medium tracking-[0.22em] text-[#9A7B4F] uppercase">
                  COMMUNITY SUBMISSIONS ARCHIVE
                </span>
              </div>
              <h2 className="mt-2 font-poster text-4xl tracking-tight text-[#111110] uppercase sm:text-5xl">
                DROP 02 CREATOR LEDGER.
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[#DDD7CB] bg-white px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-[#6A655D] uppercase">
                {submissions.length} Concepts Logged
              </span>
              <Link
                href="/v9/vote"
                className="inline-flex items-center gap-2 rounded-full border border-[#111110] bg-[#111110] px-5 py-2 font-mono text-[10px] font-medium tracking-[0.2em] text-white uppercase transition-colors hover:border-[#8E1C1C] hover:bg-[#8E1C1C]"
              >
                <span>Open Community Ballot</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {submissions.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-[#DDD7CB] bg-white p-12 text-center">
              <p className="font-poster text-2xl text-[#111110] uppercase">
                BE THE FIRST TO FILE FOR DROP 02.
              </p>
              <p className="mt-2 font-sans text-sm text-[#6A655D]">
                Submitted creator dossiers appear in this gallery immediately.
              </p>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {submissions.map((item) => {
                const badge = getStatusBadge(item.status);
                const artwork = item.imageUrl || STUDIO_PRESETS[0].imageUrl;
                return (
                  <motion.article
                    key={item._id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-[#DDD7CB] bg-white transition-colors duration-300 hover:border-[#9A7B4F]"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#ECE8DF]">
                      <img
                        src={artwork}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span
                        className={cn(
                          "absolute top-3.5 right-3.5 rounded-full border px-3 py-1 font-mono text-[10px] font-medium tracking-[0.16em] uppercase backdrop-blur-sm",
                          badge.className
                        )}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-center justify-between gap-2 font-mono text-[10px] tracking-[0.16em] text-[#6A655D] uppercase">
                        <span className="truncate text-[#9A7B4F]">
                          {item.category}
                        </span>
                        <span className="shrink-0">
                          {formatUtcDate(item.createdAt)}
                        </span>
                      </div>

                      <h3 className="mt-2 font-poster text-2xl tracking-wide text-[#111110] uppercase">
                        {item.title}
                      </h3>

                      <p className="mt-1 font-mono text-[11px] tracking-[0.12em] text-[#6A655D]">
                        {item.creatorName} · {item.creatorHandle}
                      </p>

                      <p className="mt-3 line-clamp-3 flex-1 font-sans text-xs leading-relaxed text-[#6A655D]">
                        {item.craftsmanshipNotes}
                      </p>

                      <div className="mt-5 flex items-center justify-between border-t border-[#DDD7CB] pt-4">
                        <span className="font-mono text-[10px] tracking-[0.16em] text-[#6A655D] uppercase">
                          Woven Label Credit
                        </span>
                        <Link
                          href="/v9/vote"
                          className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.18em] text-[#8E1C1C] uppercase transition-opacity hover:opacity-75"
                        >
                          <span>Ballot</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
