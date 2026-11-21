"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Cpu,
  Minus,
  Plus,
  Radio,
  Ruler,
  Sliders,
  Sparkles,
} from "lucide-react";
import type { CreatorSubmissionItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface V3CreatorConsoleProps {
  initialSubmissions: CreatorSubmissionItem[];
}

interface SilhouetteOption {
  id: string;
  code: string;
  label: string;
  shortLabel: string;
  tierLabel: "SMALL-BATCH 03–04" | "1-OF-1 ARCHIVE";
  editionCode: string;
  defaultGsm: number;
  chestCm: number;
  lengthCm: number;
  fitNote: string;
  imageUrl: string;
}

const SILHOUETTES: readonly SilhouetteOption[] = [
  {
    id: "hoodie",
    code: "S-01",
    label: "Heavyweight Hoodie",
    shortLabel: "Heavyweight Hoodie",
    tierLabel: "SMALL-BATCH 03–04",
    editionCode: "01 / 04",
    defaultGsm: 460,
    chestCm: 66,
    lengthCm: 71,
    fitNote: "BOXY DROP-SHOULDER",
    imageUrl: "/images/look-batch-hoodie.jpg",
  },
  {
    id: "tee",
    code: "S-02",
    label: "Boxy Graphic Tee",
    shortLabel: "Boxy Graphic Tee",
    tierLabel: "SMALL-BATCH 03–04",
    editionCode: "01 / 04",
    defaultGsm: 320,
    chestCm: 62,
    lengthCm: 73,
    fitNote: "ARCHITECTURAL OVERSIZED",
    imageUrl: "/images/look-batch-tee.jpg",
  },
  {
    id: "jacket",
    code: "S-03",
    label: "1-of-1 Archive Jacket",
    shortLabel: "1-of-1 Archive Jacket",
    tierLabel: "1-OF-1 ARCHIVE",
    editionCode: "01 / 01",
    defaultGsm: 500,
    chestCm: 68,
    lengthCm: 69,
    fitNote: "CROPPED WORKWEAR SHELL",
    imageUrl: "/images/look-1of1-jacket.jpg",
  },
  {
    id: "knit",
    code: "S-04",
    label: "Distressed Knit",
    shortLabel: "Distressed Knit",
    tierLabel: "1-OF-1 ARCHIVE",
    editionCode: "01 / 01",
    defaultGsm: 440,
    chestCm: 64,
    lengthCm: 70,
    fitNote: "LOOSE GAUGE DRAPE",
    imageUrl: "/images/look-1of1-knit.jpg",
  },
] as const;

const CRAFT_FINISHES = [
  { id: "3d-puff", label: "3D Puff", code: "C1" },
  { id: "chain-stitch", label: "Chain-Stitch", code: "C2" },
  { id: "hand-painted", label: "Hand-Painted", code: "C3" },
  { id: "raw-seams", label: "Raw Seams", code: "C4" },
  { id: "acid-wash", label: "Acid Wash", code: "C5" },
  { id: "patchwork", label: "Patchwork", code: "C6" },
] as const;

const GSM_MIN = 300;
const GSM_MAX = 540;
const GSM_STEP = 10;

function getGsmGrade(gsm: number): string {
  if (gsm >= 500) return "ARMOR-GRADE HEAVYWEIGHT";
  if (gsm >= 440) return "ARCHITECTURAL LOOPBACK";
  if (gsm >= 380) return "STRUCTURED STUDIO TERRY";
  return "DENSE COMBED JERSEY";
}

function getStatusBadge(status: CreatorSubmissionItem["status"]): {
  label: string;
  className: string;
} {
  switch (status) {
    case "selected":
      return {
        label: "SELECTED",
        className: "bg-chartreuse text-espresso border-hunter/30",
      };
    case "approved_for_vote":
      return {
        label: "VOTE BOARD",
        className: "bg-hunter text-alabaster border-hunter",
      };
    default:
      return {
        label: "IN REVIEW",
        className: "bg-chrome text-espresso border-hunter/20",
      };
  }
}

export default function V3CreatorConsole({
  initialSubmissions,
}: V3CreatorConsoleProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(SILHOUETTES[0].id);
  const [gsm, setGsm] = useState<number>(SILHOUETTES[0].defaultGsm);
  const [selectedCrafts, setSelectedCrafts] = useState<string[]>([
    "3D Puff",
    "Raw Seams",
  ]);
  const [title, setTitle] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [creatorHandle, setCreatorHandle] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [submissions, setSubmissions] =
    useState<CreatorSubmissionItem[]>(initialSubmissions);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{
    id: string;
    title: string;
    handle: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const silhouette = useMemo(
    () => SILHOUETTES.find((s) => s.id === selectedId) ?? SILHOUETTES[0],
    [selectedId]
  );

  const gsmPercent = useMemo(
    () => Math.round(((gsm - GSM_MIN) / (GSM_MAX - GSM_MIN)) * 100),
    [gsm]
  );

  const activeLedCount = useMemo(() => {
    const ratio = (gsm - GSM_MIN) / (GSM_MAX - GSM_MIN);
    return Math.max(1, Math.min(12, Math.round(ratio * 11) + 1));
  }, [gsm]);

  const displayHandle = useMemo(() => {
    const cleaned = creatorHandle.trim().replace(/^@+/, "");
    if (cleaned) return `@${cleaned}`;
    const fallback = creatorName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".");
    return fallback ? `@${fallback}` : "@YOURHANDLE";
  }, [creatorHandle, creatorName]);

  const handleSelectSilhouette = (option: SilhouetteOption) => {
    setSelectedId(option.id);
    setGsm(option.defaultGsm);
    setErrorMsg(null);
  };

  const toggleCraft = (craftLabel: string) => {
    setSelectedCrafts((prev) =>
      prev.includes(craftLabel)
        ? prev.filter((item) => item !== craftLabel)
        : [...prev, craftLabel]
    );
  };

  const stepGsm = (delta: number) => {
    setGsm((prev) => Math.max(GSM_MIN, Math.min(GSM_MAX, prev + delta)));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setReceipt(null);

    const trimmedTitle = title.trim();
    const trimmedName = creatorName.trim();
    const trimmedNotes = notes.trim();

    if (!trimmedTitle || !trimmedName || !trimmedNotes) {
      setErrorMsg(
        "Complete concept title, creator name, and pattern/craft notes before transmitting."
      );
      return;
    }

    const craftSummary =
      selectedCrafts.length > 0 ? selectedCrafts.join(", ") : "Clean Raw Finish";
    const composedNotes = `${gsm} GSM · ${craftSummary} · ${trimmedNotes}`;

    setSubmitting(true);
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          creatorName: trimmedName,
          creatorHandle: creatorHandle.trim() || displayHandle,
          email: email.trim(),
          category: silhouette.label,
          craftsmanshipNotes: composedNotes,
          imageUrl: silhouette.imageUrl,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        submission?: CreatorSubmissionItem;
      };

      if (!response.ok || !data.ok || !data.submission) {
        setErrorMsg(
          data.error || "Transmission interrupted. Please retry in a moment."
        );
        return;
      }

      const createdSubmission = data.submission;
      setSubmissions((prev) => [createdSubmission, ...prev]);
      setReceipt({
        id: createdSubmission._id,
        title: createdSubmission.title,
        handle: createdSubmission.creatorHandle,
      });
      setTitle("");
      setNotes("");
    } catch {
      setErrorMsg("Network disruption while transmitting spec sheet.");
    } finally {
      setSubmitting(false);
    }
  };

  const visibleLedger = submissions.slice(0, 4);

  return (
    <section
      id="console"
      className="relative overflow-hidden border-t border-hunter/15 bg-chrome/45 py-24 text-espresso"
    >
      {/* Subtle top industrial index hairline */}
      <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
        {/* Section Header */}
        <div className="mb-12 flex flex-col justify-between gap-6 border-b border-hunter/15 pb-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-hunter/20 bg-white px-3.5 py-1.5 shadow-[0_1px_0_rgba(20,54,40,0.08)]">
              <span className="h-2 w-2 rounded-full bg-chartreuse ring-2 ring-hunter/25" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-hunter">
                MOD-05 · CREATOR SPEC CONSOLE · DROP 02 CALL
              </span>
            </div>

            <h2 className="mt-5 font-editorial text-5xl leading-[0.95] tracking-[-0.02em] text-espresso sm:text-6xl lg:text-[4.25rem]">
              Spec your{" "}
              <span className="italic text-hunter">silhouette.</span>
            </h2>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-espresso/75 sm:text-lg">
              Win the community vote. We cut it, tag your name, and promote your
              drop.
            </p>
          </div>

          {/* Hardware Telemetry Readout Chip */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-hunter/20 bg-white px-4 py-2.5">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-espresso/55">
                CREATOR CO-CREDIT
              </p>
              <p className="mt-0.5 font-mono text-xs font-semibold text-hunter">
                WOVEN LABEL · PAN-INDIA PROMO
              </p>
            </div>
            <div className="rounded-xl border border-hunter bg-hunter px-4 py-2.5 text-alabaster">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-chartreuse">
                QUEUED SPECS
              </p>
              <p className="mt-0.5 font-mono text-xs font-semibold">
                {String(submissions.length).padStart(2, "0")} CONCEPTS LOGGED
              </p>
            </div>
          </div>
        </div>

        {/* Teenage-Engineering Inspired Hardware Chassis */}
        <div className="rounded-[28px] border border-hunter/20 bg-alabaster p-3 shadow-[0_24px_60px_-28px_rgba(20,54,40,0.22)] sm:p-5">
          {/* Top Machined Bezel Strip */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hunter/15 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-4 w-4 items-center justify-center rounded-full border border-hunter/25 bg-chrome"
              >
                <span className="h-[1px] w-2 rotate-45 bg-hunter/40" />
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-hunter">
                <Cpu className="h-3.5 w-3.5" />
                KNITX SPEC DECK · UNIT KX-02
              </span>
              <span className="hidden text-hunter/25 sm:inline">|</span>
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-espresso/60 sm:inline">
                450+ GSM MILL CALIBRATED
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-hunter/20 bg-hunter px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.18em] text-chartreuse">
                <Radio className="h-3 w-3" />
                TX READY
              </span>
              <span
                aria-hidden="true"
                className="flex h-4 w-4 items-center justify-center rounded-full border border-hunter/25 bg-chrome"
              >
                <span className="h-[1px] w-2 -rotate-45 bg-hunter/40" />
              </span>
            </div>
          </div>

          {/* 2-Column Console Split */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* LEFT COLUMN: TACTILE HARDWARE CONTROL DECK */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col justify-between gap-6 rounded-2xl border border-hunter/15 bg-white p-5 sm:p-6 lg:col-span-6"
            >
              <div className="space-y-6">
                {/* 01. Segmented Silhouette Selector */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-hunter">
                      01 · SELECT SILHOUETTE CHASSIS
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-espresso/55">
                      {silhouette.code} · {silhouette.tierLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {SILHOUETTES.map((option) => {
                      const active = option.id === silhouette.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          suppressHydrationWarning
                          onClick={() => handleSelectSilhouette(option)}
                          className={cn(
                            "group relative flex flex-col items-start justify-between rounded-xl border p-3.5 text-left transition-all duration-150",
                            active
                              ? "border-hunter bg-hunter text-alabaster shadow-[0_3px_0_#0D241A]"
                              : "border-hunter/15 bg-alabaster/70 text-espresso shadow-[0_2px_0_rgba(20,54,40,0.12)] hover:border-hunter/40 hover:bg-white active:translate-y-[1px]"
                          )}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span
                              className={cn(
                                "font-mono text-[9.5px] font-bold tracking-[0.2em]",
                                active ? "text-chartreuse" : "text-hunter/70"
                              )}
                            >
                              {option.code}
                            </span>
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full transition-colors",
                                active
                                  ? "bg-chartreuse shadow-[0_0_8px_#C8F200]"
                                  : "bg-hunter/15 group-hover:bg-hunter/35"
                              )}
                            />
                          </div>

                          <p className="mt-2.5 font-sans text-sm font-semibold leading-tight">
                            {option.shortLabel}
                          </p>
                          <p
                            className={cn(
                              "mt-1 font-mono text-[9px] uppercase tracking-[0.16em]",
                              active ? "text-alabaster/75" : "text-espresso/55"
                            )}
                          >
                            {option.tierLabel}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 02. Interactive GSM Density Slider */}
                <div className="rounded-xl border border-hunter/15 bg-alabaster/75 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-hunter">
                      <Sliders className="h-3.5 w-3.5" />
                      02 · FABRIC GSM DENSITY
                    </span>
                    <span className="rounded-md bg-hunter px-2.5 py-0.5 font-mono text-xs font-bold tracking-[0.12em] text-chartreuse">
                      {gsm} GSM
                    </span>
                  </div>

                  {/* Fader Row */}
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => stepGsm(-GSM_STEP)}
                      aria-label="Decrease GSM by 10"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hunter/20 bg-white text-hunter shadow-[0_2px_0_rgba(20,54,40,0.12)] transition hover:border-hunter hover:bg-hunter hover:text-chartreuse active:translate-y-[1px]"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>

                    <div className="relative flex-1 py-2">
                      {/* Machined Track */}
                      <div className="h-2.5 w-full overflow-hidden rounded-full border border-hunter/20 bg-chrome">
                        <div
                          className="h-full rounded-full bg-hunter transition-all duration-150"
                          style={{ width: `${gsmPercent}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min={GSM_MIN}
                        max={GSM_MAX}
                        step={GSM_STEP}
                        value={gsm}
                        suppressHydrationWarning
                        aria-label="Fabric GSM density slider"
                        onChange={(e) => setGsm(Number(e.target.value))}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      />
                      {/* Tactile Thumb Indicator */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 h-5 w-3 -translate-x-1/2 -translate-y-1/2 rounded-[4px] border border-hunter bg-chartreuse shadow-[0_2px_4px_rgba(20,54,40,0.28)] transition-all duration-150"
                        style={{ left: `${gsmPercent}%` }}
                      />
                    </div>

                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => stepGsm(GSM_STEP)}
                      aria-label="Increase GSM by 10"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hunter/20 bg-white text-hunter shadow-[0_2px_0_rgba(20,54,40,0.12)] transition hover:border-hunter hover:bg-hunter hover:text-chartreuse active:translate-y-[1px]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Tick Marks & Grade */}
                  <div className="mt-2 flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.16em] text-espresso/55">
                    <span>300 GSM</span>
                    <span className="font-semibold text-hunter">
                      {getGsmGrade(gsm)}
                    </span>
                    <span>540 GSM</span>
                  </div>
                </div>

                {/* 03. Craft Toggle Switches */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-hunter">
                      03 · CRAFT FINISH SWITCHES
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-espresso/55">
                      {selectedCrafts.length} / {CRAFT_FINISHES.length} ARMED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {CRAFT_FINISHES.map((craft) => {
                      const active = selectedCrafts.includes(craft.label);
                      return (
                        <button
                          key={craft.id}
                          type="button"
                          suppressHydrationWarning
                          onClick={() => toggleCraft(craft.label)}
                          aria-pressed={active}
                          className={cn(
                            "flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-all duration-150",
                            active
                              ? "border-hunter bg-hunter text-alabaster shadow-[0_2px_0_#0D241A]"
                              : "border-hunter/15 bg-alabaster/70 text-espresso hover:border-hunter/35 hover:bg-white"
                          )}
                        >
                          <div>
                            <span
                              className={cn(
                                "block font-mono text-[8.5px] uppercase tracking-[0.2em]",
                                active ? "text-chartreuse" : "text-espresso/45"
                              )}
                            >
                              {craft.code}
                            </span>
                            <span className="text-xs font-semibold">
                              {craft.label}
                            </span>
                          </div>
                          {/* Tactile LED Switch Capsule */}
                          <span
                            className={cn(
                              "flex h-4 w-7 items-center rounded-full border p-0.5 transition-colors",
                              active
                                ? "justify-end border-chartreuse/60 bg-chartreuse/20"
                                : "justify-start border-hunter/20 bg-chrome"
                            )}
                          >
                            <span
                              className={cn(
                                "h-2.5 w-2.5 rounded-full transition-colors",
                                active ? "bg-chartreuse" : "bg-espresso/30"
                              )}
                            />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 04. Creator Spec Inputs */}
                <div className="space-y-3 border-t border-hunter/10 pt-5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-hunter">
                      04 · DESIGNER IDENTITY &amp; NOTES
                    </span>
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-espresso/50">
                      FIELDS REQUIRED *
                    </span>
                  </div>

                  <div>
                    <label
                      htmlFor="v3-spec-title"
                      className="mb-1 block font-mono text-[9.5px] font-semibold uppercase tracking-[0.18em] text-espresso/65"
                    >
                      Concept Title *
                    </label>
                    <input
                      id="v3-spec-title"
                      type="text"
                      suppressHydrationWarning
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Monsoon Acid-Wash Boxy Hoodie"
                      className="w-full rounded-xl border border-hunter/20 bg-alabaster/70 px-3.5 py-2.5 text-sm text-espresso placeholder:text-espresso/40 focus:border-hunter focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="v3-spec-name"
                        className="mb-1 block font-mono text-[9.5px] font-semibold uppercase tracking-[0.18em] text-espresso/65"
                      >
                        Creator Name *
                      </label>
                      <input
                        id="v3-spec-name"
                        type="text"
                        suppressHydrationWarning
                        value={creatorName}
                        onChange={(e) => setCreatorName(e.target.value)}
                        placeholder="Aarav Sen"
                        className="w-full rounded-xl border border-hunter/20 bg-alabaster/70 px-3.5 py-2.5 text-sm text-espresso placeholder:text-espresso/40 focus:border-hunter focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="v3-spec-handle"
                        className="mb-1 block font-mono text-[9.5px] font-semibold uppercase tracking-[0.18em] text-espresso/65"
                      >
                        Instagram / Handle
                      </label>
                      <input
                        id="v3-spec-handle"
                        type="text"
                        suppressHydrationWarning
                        value={creatorHandle}
                        onChange={(e) => setCreatorHandle(e.target.value)}
                        placeholder="@aarav.cuts"
                        className="w-full rounded-xl border border-hunter/20 bg-alabaster/70 px-3.5 py-2.5 font-mono text-sm text-espresso placeholder:text-espresso/40 focus:border-hunter focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="v3-spec-email"
                      className="mb-1 block font-mono text-[9.5px] font-semibold uppercase tracking-[0.18em] text-espresso/65"
                    >
                      Contact Email
                    </label>
                    <input
                      id="v3-spec-email"
                      type="email"
                      suppressHydrationWarning
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@studio.in"
                      className="w-full rounded-xl border border-hunter/20 bg-alabaster/70 px-3.5 py-2.5 text-sm text-espresso placeholder:text-espresso/40 focus:border-hunter focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="v3-spec-notes"
                      className="mb-1 block font-mono text-[9.5px] font-semibold uppercase tracking-[0.18em] text-espresso/65"
                    >
                      Pattern &amp; Craftsmanship Notes *
                    </label>
                    <textarea
                      id="v3-spec-notes"
                      rows={3}
                      suppressHydrationWarning
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Describe placement, stitching colour, distress zone, or back graphic geometry..."
                      className="w-full resize-none rounded-xl border border-hunter/20 bg-alabaster/70 px-3.5 py-2.5 text-sm text-espresso placeholder:text-espresso/40 focus:border-hunter focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Status Feedback & Submit Key */}
              <div className="space-y-3 pt-2">
                <AnimatePresence mode="wait">
                  {errorMsg && (
                    <motion.div
                      key="err"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="rounded-xl border border-archive-red/30 bg-archive-red/5 px-3.5 py-2.5 font-mono text-[11px] text-archive-red"
                    >
                      {errorMsg}
                    </motion.div>
                  )}

                  {receipt && (
                    <motion.div
                      key="ok"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-start gap-2.5 rounded-xl border border-hunter/25 bg-chartreuse/25 px-3.5 py-3 text-espresso"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-hunter" />
                      <div className="font-mono text-[11px] leading-relaxed">
                        <p className="font-bold uppercase tracking-[0.12em] text-hunter">
                          SPEC TRANSMITTED · {receipt.handle}
                        </p>
                        <p className="text-espresso/80">
                          &ldquo;{receipt.title}&rdquo; logged into Drop 02
                          community review queue.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  suppressHydrationWarning
                  disabled={submitting}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-xl border border-hunter bg-hunter px-5 py-4 font-mono text-xs font-bold uppercase tracking-[0.22em] text-alabaster shadow-[0_4px_0_#0B1F17] transition-all hover:bg-espresso active:translate-y-[2px] active:shadow-[0_2px_0_#0B1F17] disabled:cursor-not-allowed disabled:opacity-65"
                  )}
                >
                  <span className="inline-flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-chartreuse shadow-[0_0_8px_#C8F200]" />
                    {submitting
                      ? "TRANSMITTING SPEC SHEET..."
                      : "TRANSMIT SPEC SHEET"}
                  </span>
                  <ArrowRight className="h-4 w-4 text-chartreuse transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </form>

            {/* RIGHT COLUMN: LIVE TECHNICAL DRAFTING BLUEPRINT + RECENT LEDGER */}
            <div className="flex flex-col gap-5 lg:col-span-6">
              {/* LIVE DRAFTING BLUEPRINT CARD */}
              <div className="relative overflow-hidden rounded-2xl border border-hunter/25 bg-alabaster bg-dot-matrix p-5 sm:p-6">
                {/* Architectural Corner Registration Marks */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-2.5 top-2 font-mono text-[10px] text-hunter/40"
                >
                  +
                </span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2.5 top-2 font-mono text-[10px] text-hunter/40"
                >
                  +
                </span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-2 left-2.5 font-mono text-[10px] text-hunter/40"
                >
                  +
                </span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-2 right-2.5 font-mono text-[10px] text-hunter/40"
                >
                  +
                </span>

                {/* Blueprint Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hunter/15 pb-4">
                  <div>
                    <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.22em] text-hunter">
                      BLUEPRINT DWG {"//"} KX-02-{silhouette.code} · SCALE 1:10
                    </p>
                    <h3 className="mt-1 font-syne text-lg font-bold uppercase tracking-[-0.02em] text-espresso sm:text-xl">
                      {title.trim() || silhouette.label}
                    </h3>
                  </div>
                  <span className="rounded-md border border-hunter/25 bg-chartreuse px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-espresso">
                    {silhouette.tierLabel}
                  </span>
                </div>

                {/* Preview Garment + Dimension Callout Arrows */}
                <div className="relative mt-5 grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
                  {/* Left Vertical Length Dimension Callout */}
                  <div className="hidden flex-col items-center justify-between self-stretch py-6 sm:col-span-1 sm:flex">
                    <span className="h-px w-3 bg-hunter/45" />
                    <div className="flex flex-1 flex-col items-center justify-center">
                      <span className="w-px flex-1 bg-hunter/35" />
                      <span className="my-2 -rotate-90 whitespace-nowrap font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-hunter">
                        {silhouette.lengthCm} CM
                      </span>
                      <span className="w-px flex-1 bg-hunter/35" />
                    </div>
                    <span className="h-px w-3 bg-hunter/45" />
                  </div>

                  {/* Garment Blueprint Viewport */}
                  <div className="sm:col-span-11">
                    {/* Top Horizontal Chest Callout Arrow */}
                    <div className="mb-2 flex items-center gap-2 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-hunter">
                      <span className="h-2.5 w-px bg-hunter/45" />
                      <span className="h-px flex-1 bg-hunter/35" />
                      <span className="inline-flex items-center gap-1 rounded bg-white/90 px-2 py-0.5 border border-hunter/15">
                        <Ruler className="h-3 w-3" />
                        CHEST {silhouette.chestCm} CM · {silhouette.fitNote}
                      </span>
                      <span className="h-px flex-1 bg-hunter/35" />
                      <span className="h-2.5 w-px bg-hunter/45" />
                    </div>

                    <div className="relative aspect-[16/11] w-full overflow-hidden rounded-xl border border-hunter/20 bg-white">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={silhouette.id}
                          initial={{ opacity: 0, scale: 1.03 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.28, ease: "easeOut" }}
                          className="relative h-full w-full"
                        >
                          <Image
                            src={silhouette.imageUrl}
                            alt={silhouette.label}
                            fill
                            sizes="(max-width: 1024px) 100vw, 560px"
                            className="object-cover"
                          />
                        </motion.div>
                      </AnimatePresence>

                      {/* Technical Crosshair Overlay */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 border-[10px] border-white/25"
                      />

                      {/* Floating GSM Callout Tag */}
                      <div className="absolute left-3 top-3 rounded-lg border border-hunter/25 bg-alabaster/95 px-2.5 py-1.5 backdrop-blur-sm">
                        <p className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-espresso/60">
                          FABRIC SPEC
                        </p>
                        <p className="font-mono text-xs font-bold text-hunter">
                          {gsm} GSM · 100% INDIAN COTTON
                        </p>
                      </div>

                      {/* Floating Edition Tag */}
                      <div className="absolute bottom-3 right-3 rounded-lg border border-chartreuse/50 bg-hunter/95 px-2.5 py-1.5 text-alabaster backdrop-blur-sm">
                        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-chartreuse">
                          EDITION {silhouette.editionCode}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live GSM LED Meter Bar */}
                <div className="mt-5 rounded-xl border border-hunter/15 bg-white p-3.5">
                  <div className="mb-2 flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.18em]">
                    <span className="font-semibold text-hunter">
                      LIVE GSM DENSITY METER
                    </span>
                    <span className="font-bold text-espresso">
                      {gsm} GSM · {gsmPercent}% LOAD
                    </span>
                  </div>
                  <div className="grid grid-cols-12 gap-1.5">
                    {Array.from({ length: 12 }).map((_, idx) => {
                      const lit = idx < activeLedCount;
                      const isPeakZone = idx >= 8;
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "h-3 rounded-[3px] border transition-all duration-150",
                            lit
                              ? isPeakZone
                                ? "border-hunter bg-chartreuse shadow-[0_0_8px_rgba(200,242,0,0.6)]"
                                : "border-hunter bg-hunter"
                              : "border-hunter/15 bg-chrome/70"
                          )}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Active Finish LED Matrix */}
                <div className="mt-4">
                  <p className="mb-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.2em] text-espresso/60">
                    ACTIVE FINISH LEDS
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {CRAFT_FINISHES.map((craft) => {
                      const active = selectedCrafts.includes(craft.label);
                      return (
                        <span
                          key={craft.id}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] transition-colors",
                            active
                              ? "border-hunter bg-hunter text-alabaster"
                              : "border-hunter/15 bg-white/70 text-espresso/40"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              active
                                ? "bg-chartreuse shadow-[0_0_6px_#C8F200]"
                                : "bg-espresso/20"
                            )}
                          />
                          {craft.label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Woven Creator Credit Stamp */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-hunter/40 bg-white px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="h-4 w-4 text-hunter" />
                    <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-espresso">
                      DESIGNED BY{" "}
                      <span className="bg-chartreuse px-1.5 py-0.5 text-espresso">
                        {displayHandle.toUpperCase()}
                      </span>{" "}
                      · MADE IN INDIA
                    </span>
                  </div>
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-hunter">
                    NO RESTOCK
                  </span>
                </div>
              </div>

              {/* COMPACT RECENT SUBMISSIONS LEDGER */}
              <div className="flex-1 rounded-2xl border border-hunter/15 bg-white p-5">
                <div className="mb-3.5 flex items-center justify-between border-b border-hunter/10 pb-3">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-hunter">
                    RECENT SPEC LEDGER · COMMUNITY QUEUE
                  </span>
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-espresso/55">
                    SHOWING {visibleLedger.length} OF {submissions.length}
                  </span>
                </div>

                {visibleLedger.length === 0 ? (
                  <p className="py-6 text-center font-mono text-xs text-espresso/50">
                    No specs logged yet. Transmit the first Drop 02 blueprint.
                  </p>
                ) : (
                  <ul className="divide-y divide-hunter/10">
                    {visibleLedger.map((item, idx) => {
                      const badge = getStatusBadge(item.status);
                      const isJustSubmitted =
                        mounted && receipt?.id === item._id;
                      return (
                        <li
                          key={item._id}
                          className="flex flex-col gap-1.5 py-3 first:pt-1 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[9.5px] font-bold text-hunter/60">
                                {String(idx + 1).padStart(2, "0")}
                              </span>
                              <p className="truncate font-sans text-sm font-semibold text-espresso">
                                {item.title}
                              </p>
                              {isJustSubmitted && (
                                <span className="inline-flex items-center gap-0.5 rounded bg-chartreuse px-1.5 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.14em] text-espresso">
                                  <Check className="h-2.5 w-2.5" /> NEW
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate font-mono text-[10px] text-espresso/60">
                              {item.creatorHandle} · {item.category} ·{" "}
                              {item.craftsmanshipNotes}
                            </p>
                          </div>

                          <span
                            className={cn(
                              "w-fit shrink-0 rounded-md border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em]",
                              badge.className
                            )}
                          >
                            {badge.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
