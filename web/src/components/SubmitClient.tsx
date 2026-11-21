'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Flame,
  Loader2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import type { CreatorSubmissionItem } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SubmitClientProps {
  initialSubmissions: CreatorSubmissionItem[];
}

const GARMENT_CATEGORIES = [
  'Heavyweight Hoodie',
  'Boxy Graphic Tee',
  '1-of-1 Archive Outerwear',
  'Deconstructed Knit',
  'Tailored Utility Bottoms',
] as const;

const CRAFTSMANSHIP_TECHNIQUES = [
  '3D Puff Print',
  'Chain-Stitch Embroidery',
  'Hand-Painted Finish',
  '450 GSM Tiruppur Terry',
  'Raw Exposed Seams',
  'Acid / Enzyme Wash',
  'Woven Patchwork',
] as const;

const STUDIO_TEMPLATES = [
  {
    id: 'tpl-hoodie',
    label: 'HEAVY HOODIE',
    imageUrl: '/images/look-batch-hoodie.jpg',
  },
  {
    id: 'tpl-tee',
    label: 'BOXY TEE',
    imageUrl: '/images/look-batch-tee.jpg',
  },
  {
    id: 'tpl-jacket',
    label: '1-OF-1 JACKET',
    imageUrl: '/images/look-1of1-jacket.jpg',
  },
  {
    id: 'tpl-knit',
    label: '1-OF-1 KNIT',
    imageUrl: '/images/look-1of1-knit.jpg',
  },
] as const;

const REWARD_BOXES = [
  {
    num: '01',
    title: 'WE PRODUCE IT',
    detail: '450 GSM cotton, sampling & cut-and-sew. Zero cost to you.',
  },
  {
    num: '02',
    title: 'YOUR NAME ON THE TAG',
    detail: 'Woven neck-label credit stitched into every numbered garment.',
  },
  {
    num: '03',
    title: 'FULL PROMO + CREDIT',
    detail: 'Drop campaign film feature, studio spotlight & creator royalty.',
  },
] as const;

const MONTHS_UTC = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

function normalizeHandle(raw: string): string {
  const cleaned = raw.trim();
  if (!cleaned) return '@your.handle';
  return cleaned.startsWith('@') ? cleaned : `@${cleaned}`;
}

function formatDeterministicDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'RECENT';
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = MONTHS_UTC[d.getUTCMonth()] || 'JAN';
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

function formatStatusLabel(status: CreatorSubmissionItem['status']): string {
  if (status === 'selected') return 'SELECTED';
  if (status === 'approved_for_vote') return 'ON BALLOT';
  return 'IN REVIEW';
}

export default function SubmitClient({
  initialSubmissions,
}: SubmitClientProps) {
  const [submissions, setSubmissions] =
    useState<CreatorSubmissionItem[]>(initialSubmissions);

  // Blueprint Form State
  const [title, setTitle] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [creatorHandle, setCreatorHandle] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<string>(GARMENT_CATEGORIES[0]);
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([
    '3D Puff Print',
    '450 GSM Tiruppur Terry',
  ]);
  const [conceptNotes, setConceptNotes] = useState('');
  const [previewImage, setPreviewImage] = useState<string>(
    STUDIO_TEMPLATES[0].imageUrl
  );
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{
    docketCode: string;
    item: CreatorSubmissionItem;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleTechnique = (tech: string) => {
    setSelectedTechniques((prev) =>
      prev.includes(tech)
        ? prev.filter((item) => item !== tech)
        : [...prev, tech]
    );
  };

  const processArtworkFile = (file: File) => {
    setErrorMessage(null);
    if (!file.type.startsWith('image/')) {
      setErrorMessage('UPLOAD PNG, JPG, OR WEBP ONLY.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setErrorMessage('MAX FILE SIZE IS 4 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewImage(reader.result);
        setUploadedFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processArtworkFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processArtworkFile(file);
  };

  const handleSelectTemplate = (imageUrl: string) => {
    setPreviewImage(imageUrl);
    setUploadedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || !creatorName.trim() || !conceptNotes.trim()) {
      setErrorMessage('FILL IN TITLE, YOUR NAME, AND CONCEPT NOTES.');
      return;
    }

    const combinedCraftNotes =
      selectedTechniques.length > 0
        ? `${selectedTechniques.join(' · ')} — ${conceptNotes.trim()}`
        : conceptNotes.trim();

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          creatorName: creatorName.trim(),
          creatorHandle: creatorHandle.trim(),
          email: email.trim(),
          category,
          craftsmanshipNotes: combinedCraftNotes,
          imageUrl: previewImage,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        submission?: CreatorSubmissionItem;
        error?: string;
      };

      if (!res.ok || !data.ok || !data.submission) {
        throw new Error(data.error || 'SUBMISSION FAILED.');
      }

      const created = data.submission;
      const docketCode = `KX-OC-${created._id.slice(-5).toUpperCase()}`;
      setSubmissions((prev) => [created, ...prev]);
      setReceipt({ docketCode, item: created });

      // Reset fields for next design
      setTitle('');
      setConceptNotes('');
      setUploadedFileName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'COULD NOT SUBMIT DESIGN.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPreviewOneOfOne =
    category.toLowerCase().includes('1-of-1') ||
    category.toLowerCase().includes('knit');

  return (
    <div className="min-h-screen bg-paper bg-draft-grid pt-24 pb-28 text-ink">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        {/* Brutalist Poster Header */}
        <header className="flex flex-col justify-between gap-6 border-b-2 border-ink pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 border-2 border-ink bg-cobalt px-3.5 py-1.5 text-white stamp-shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase">
                CREATOR OPEN CALL // DROP 02
              </span>
            </div>

            <h1 className="mt-5 font-poster text-6xl leading-[0.88] tracking-tight text-ink uppercase sm:text-8xl lg:text-[112px]">
              DROP YOUR DESIGN<span className="text-orange">.</span>
            </h1>
          </div>

          <div className="max-w-xs border-2 border-ink bg-surface p-4 stamp-shadow-sm">
            <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-orange uppercase">
              NO GATEKEEPERS
            </p>
            <p className="mt-1 font-sans text-sm font-medium leading-snug text-ink">
              Pitch a silhouette. If the crowd votes it into the Top 4, we cut
              &amp; ship it under your name.
            </p>
          </div>
        </header>

        {/* Punchy 3-Box Reward Strip */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {REWARD_BOXES.map((box) => (
            <div
              key={box.num}
              className="flex flex-col justify-between border-2 border-ink bg-surface p-5 stamp-shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="border-2 border-ink bg-orange px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                  {box.num}
                </span>
                <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-muted uppercase">
                  CREATOR DEAL
                </span>
              </div>
              <h2 className="mt-4 font-poster text-3xl leading-none tracking-tight text-ink uppercase">
                {box.title}
              </h2>
              <p className="mt-2 font-sans text-xs font-medium leading-relaxed text-muted">
                {box.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Slammed-In SUBMITTED ✓ Stamp Confirmation */}
        <AnimatePresence>
          {receipt && (
            <motion.div
              key="submission-stamp-receipt"
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              className="mt-8 border-2 border-ink bg-surface p-6 stamp-shadow-orange sm:p-8"
            >
              <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  {/* Slamming Stamp */}
                  <motion.div
                    initial={{ scale: 1.9, rotate: -14, opacity: 0 }}
                    animate={{ scale: 1, rotate: -4, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 20,
                      delay: 0.08,
                    }}
                    className="inline-flex items-center gap-2 border-2 border-ink bg-orange px-4 py-2 font-poster text-3xl leading-none tracking-wide text-white uppercase stamp-shadow-sm"
                  >
                    <span>SUBMITTED ✓</span>
                  </motion.div>

                  <div>
                    <p className="font-mono text-[11px] font-bold tracking-[0.2em] text-cobalt uppercase">
                      DOCKET {receipt.docketCode} // LOGGED IN STUDIO
                    </p>
                    <h3 className="mt-1 font-poster text-3xl leading-none text-ink uppercase">
                      {receipt.item.title}
                    </h3>
                    <p className="mt-1 font-mono text-[11px] font-bold text-muted uppercase">
                      BY {receipt.item.creatorName} (
                      {normalizeHandle(receipt.item.creatorHandle)})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/vote"
                    className="inline-flex items-center gap-2 border-2 border-ink bg-ink px-5 py-3 font-mono text-xs font-bold tracking-[0.16em] text-paper uppercase stamp-shadow-sm transition-colors hover:bg-orange hover:text-white"
                  >
                    <span>LIVE BALLOT</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    aria-label="Dismiss confirmation"
                    onClick={() => setReceipt(null)}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center border-2 border-ink bg-paper text-ink transition-colors hover:bg-ink hover:text-paper"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Split Tactile Blueprint Studio */}
        <div className="mt-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left: Blueprint Form */}
          <form
            onSubmit={handleSubmit}
            className="border-2 border-ink bg-surface stamp-shadow lg:col-span-7"
          >
            <div className="flex items-center justify-between border-b-2 border-ink bg-ink px-5 py-3.5 text-paper">
              <span className="font-mono text-xs font-bold tracking-[0.2em] uppercase">
                BLUEPRINT STUDIO // SPEC SHEET
              </span>
              <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-orange uppercase">
                DROP 02
              </span>
            </div>

            <div className="space-y-5 p-6 sm:p-8">
              {/* Concept Title */}
              <div>
                <label
                  htmlFor="concept-title"
                  className="block font-mono text-[10px] font-bold tracking-[0.2em] text-ink uppercase"
                >
                  PIECE TITLE *
                </label>
                <input
                  id="concept-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. DECCAN MONSOON 450 GSM HOODIE"
                  className="mt-1.5 w-full border-2 border-ink bg-paper px-4 py-3 font-sans text-sm font-medium text-ink placeholder:text-muted/60 focus:bg-surface focus:outline-none"
                />
              </div>

              {/* Creator Name + Handle */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="creator-name"
                    className="block font-mono text-[10px] font-bold tracking-[0.2em] text-ink uppercase"
                  >
                    YOUR NAME *
                  </label>
                  <input
                    id="creator-name"
                    type="text"
                    required
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder="Kabir Deshmukh"
                    className="mt-1.5 w-full border-2 border-ink bg-paper px-4 py-3 font-sans text-sm font-medium text-ink placeholder:text-muted/60 focus:bg-surface focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="creator-handle"
                    className="block font-mono text-[10px] font-bold tracking-[0.2em] text-ink uppercase"
                  >
                    IG / HANDLE
                  </label>
                  <input
                    id="creator-handle"
                    type="text"
                    value={creatorHandle}
                    onChange={(e) => setCreatorHandle(e.target.value)}
                    placeholder="@kabir.drapes"
                    className="mt-1.5 w-full border-2 border-ink bg-paper px-4 py-3 font-mono text-xs font-bold text-ink placeholder:text-muted/60 focus:bg-surface focus:outline-none"
                  />
                </div>
              </div>

              {/* Email + Category */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="creator-email"
                    className="block font-mono text-[10px] font-bold tracking-[0.2em] text-ink uppercase"
                  >
                    EMAIL
                  </label>
                  <input
                    id="creator-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kabir@studio.in"
                    className="mt-1.5 w-full border-2 border-ink bg-paper px-4 py-3 font-sans text-sm font-medium text-ink placeholder:text-muted/60 focus:bg-surface focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="garment-category"
                    className="block font-mono text-[10px] font-bold tracking-[0.2em] text-ink uppercase"
                  >
                    SILHOUETTE TYPE
                  </label>
                  <select
                    id="garment-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1.5 w-full border-2 border-ink bg-paper px-4 py-3 font-sans text-sm font-bold text-ink focus:bg-surface focus:outline-none"
                  >
                    {GARMENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Craftsmanship Technique Toggles */}
              <div>
                <span className="block font-mono text-[10px] font-bold tracking-[0.2em] text-ink uppercase">
                  CRAFT &amp; FINISH SPECS
                </span>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {CRAFTSMANSHIP_TECHNIQUES.map((tech) => {
                    const active = selectedTechniques.includes(tech);
                    return (
                      <motion.button
                        key={tech}
                        whileTap={{ scale: 0.94 }}
                        type="button"
                        onClick={() => toggleTechnique(tech)}
                        className={cn(
                          'cursor-pointer border-2 border-ink px-3 py-1.5 font-mono text-[11px] font-bold uppercase transition-colors',
                          active
                            ? 'bg-ink text-paper stamp-shadow-sm'
                            : 'bg-paper text-ink hover:bg-stone'
                        )}
                      >
                        {active ? '✓ ' : '+ '}
                        {tech}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Concept Notes */}
              <div>
                <label
                  htmlFor="concept-notes"
                  className="block font-mono text-[10px] font-bold tracking-[0.2em] text-ink uppercase"
                >
                  DESIGN BREAKDOWN *
                </label>
                <textarea
                  id="concept-notes"
                  rows={3}
                  required
                  value={conceptNotes}
                  onChange={(e) => setConceptNotes(e.target.value)}
                  placeholder="Fit, GSM weight, print hits, seam details — keep it raw and specific."
                  className="mt-1.5 w-full resize-none border-2 border-ink bg-paper px-4 py-3 font-sans text-sm font-medium leading-relaxed text-ink placeholder:text-muted/60 focus:bg-surface focus:outline-none"
                />
              </div>

              {/* Artwork Upload OR Studio Silhouette Presets */}
              <div className="border-t-2 border-ink pt-5">
                <span className="block font-mono text-[10px] font-bold tracking-[0.2em] text-ink uppercase">
                  ARTWORK UPLOAD OR STUDIO PRESET
                </span>

                {/* Drag & Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'mt-2.5 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-5 py-6 text-center transition-colors',
                    isDragging
                      ? 'border-orange bg-orange/10'
                      : 'border-ink bg-paper hover:bg-stone'
                  )}
                >
                  <Upload className="h-5 w-5 text-orange" />
                  <p className="mt-2 font-mono text-xs font-bold tracking-[0.12em] text-ink uppercase">
                    {uploadedFileName
                      ? `LOADED: ${uploadedFileName}`
                      : 'DROP SKETCH / MOCKUP HERE OR CLICK TO BROWSE'}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-muted uppercase">
                    PNG, JPG, WEBP · MAX 4 MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* 4 Studio Presets */}
                <div className="mt-4">
                  <p className="font-mono text-[10px] font-bold tracking-[0.16em] text-muted uppercase">
                    OR PICK A STUDIO SILHOUETTE BASE:
                  </p>
                  <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {STUDIO_TEMPLATES.map((tpl) => {
                      const isSelected =
                        !uploadedFileName && previewImage === tpl.imageUrl;
                      return (
                        <motion.button
                          key={tpl.id}
                          whileTap={{ scale: 0.96 }}
                          type="button"
                          onClick={() => handleSelectTemplate(tpl.imageUrl)}
                          className={cn(
                            'group relative cursor-pointer overflow-hidden border-2 text-left transition-all',
                            isSelected
                              ? 'border-orange bg-surface stamp-shadow-sm'
                              : 'border-ink bg-paper hover:-translate-y-0.5'
                          )}
                        >
                          <div className="relative aspect-[3/4] overflow-hidden bg-stone">
                            <img
                              src={tpl.imageUrl}
                              alt={tpl.label}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {isSelected && (
                              <span className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center border-2 border-ink bg-orange text-white">
                                <Check className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </div>
                          <div className="border-t-2 border-ink bg-surface px-2 py-1.5">
                            <p className="truncate font-mono text-[10px] font-bold tracking-[0.1em] text-ink uppercase">
                              {tpl.label}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {errorMessage && (
                <p className="font-mono text-xs font-bold text-orange uppercase">
                  {errorMessage}
                </p>
              )}

              <motion.button
                whileHover={{ x: -2, y: -2 }}
                whileTap={{ x: 2, y: 2 }}
                type="submit"
                disabled={isSubmitting}
                className="flex w-full cursor-pointer items-center justify-center gap-2.5 border-2 border-ink bg-orange px-6 py-4 font-mono text-xs font-bold tracking-[0.18em] text-white uppercase stamp-shadow-sm transition-colors hover:bg-ink hover:text-paper disabled:opacity-50 sm:text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>LOGGING DESIGN...</span>
                  </>
                ) : (
                  <>
                    <span>SUBMIT TO DROP 02 BALLOT</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </div>
          </form>

          {/* Right: Sticky Live Interactive Drop 02 Ballot Preview Card */}
          <aside className="lg:sticky lg:top-24 lg:col-span-5">
            <div className="mb-3 flex items-center justify-between font-mono text-[11px] font-bold tracking-[0.18em] uppercase">
              <span className="text-ink">LIVE BALLOT CARD PREVIEW</span>
              <span className="bg-ink px-2 py-0.5 text-[10px] text-paper">
                REAL-TIME
              </span>
            </div>

            <div className="border-2 border-ink bg-surface stamp-shadow">
              <div className="relative aspect-[4/5] overflow-hidden border-b-2 border-ink bg-stone">
                <img
                  src={previewImage}
                  alt={title || 'Ballot card preview'}
                  className="h-full w-full object-cover"
                />

                <div className="absolute top-3.5 left-3.5">
                  <span className="border-2 border-ink bg-orange px-3 py-1 font-poster text-2xl leading-none text-white stamp-shadow-sm">
                    #NEW
                  </span>
                </div>

                <div className="absolute top-3.5 right-3.5">
                  {isPreviewOneOfOne ? (
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

              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between font-mono text-[10px] font-bold tracking-[0.16em] uppercase">
                  <span className="text-muted">{category}</span>
                  <span className="text-cobalt">
                    {normalizeHandle(creatorHandle)}
                  </span>
                </div>

                <h3 className="mt-2 font-poster text-3xl leading-[0.95] tracking-tight text-ink uppercase">
                  {title.trim() || 'YOUR SILHOUETTE TITLE'}
                </h3>

                <p className="mt-1 font-mono text-[11px] font-bold text-muted uppercase">
                  BY {creatorName.trim() || 'YOUR NAME'}
                </p>

                <p className="mt-3 font-sans text-xs leading-relaxed text-muted sm:text-sm">
                  {conceptNotes.trim() ||
                    'Your garment notes, fit specs, and finishing details preview live right here.'}
                </p>

                {selectedTechniques.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {selectedTechniques.map((tech) => (
                      <span
                        key={tech}
                        className="border border-ink bg-stone px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.1em] text-ink uppercase"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-6 border-t-2 border-ink pt-4">
                  <div className="flex items-baseline justify-between font-mono text-xs font-bold">
                    <span className="text-ink">0 VOTES</span>
                    <span className="text-orange">AWAITING BALLOT</span>
                  </div>
                  <div className="mt-2 h-3 w-full border-2 border-ink bg-stone">
                    <div className="h-full w-10 bg-orange" />
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2 border-2 border-ink bg-paper py-3 font-mono text-xs font-bold tracking-[0.18em] text-muted uppercase">
                    <Flame className="h-4 w-4" />
                    <span>UPVOTE +1</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Live Community Submissions Wall */}
        <section className="mt-16 border-t-2 border-ink pt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-block border-2 border-ink bg-stone px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.22em] text-ink uppercase">
                LIVE FEED
              </span>
              <h2 className="mt-2 font-poster text-4xl leading-none tracking-tight text-ink uppercase sm:text-5xl">
                COMMUNITY SUBMISSIONS [{submissions.length}]
              </h2>
            </div>
            <Link
              href="/vote"
              className="inline-flex items-center gap-2 border-2 border-ink bg-surface px-4 py-2 font-mono text-[11px] font-bold tracking-[0.16em] text-ink uppercase stamp-shadow-sm transition-colors hover:bg-ink hover:text-paper"
            >
              <span>GO TO BALLOT</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {submissions.map((item) => (
              <motion.article
                key={item._id}
                layout
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="flex flex-col border-2 border-ink bg-surface stamp-shadow-sm"
              >
                <div className="relative aspect-[4/5] overflow-hidden border-b-2 border-ink bg-stone">
                  <img
                    src={item.imageUrl || '/images/look-batch-hoodie.jpg'}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                  <span
                    className={cn(
                      'absolute top-3 left-3 border-2 border-ink px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.16em] uppercase',
                      item.status === 'selected'
                        ? 'bg-orange text-white'
                        : item.status === 'approved_for_vote'
                          ? 'bg-cobalt text-white'
                          : 'bg-surface text-ink'
                    )}
                  >
                    {formatStatusLabel(item.status)}
                  </span>
                </div>

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center justify-between font-mono text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
                      <span>{item.category}</span>
                      <span>{formatDeterministicDate(item.createdAt)}</span>
                    </div>

                    <h3 className="mt-2 font-poster text-2xl leading-[0.96] tracking-tight text-ink uppercase">
                      {item.title}
                    </h3>

                    <p className="mt-1 font-mono text-[11px] font-bold text-ink uppercase">
                      {item.creatorName}{' '}
                      <span className="text-cobalt">
                        {normalizeHandle(item.creatorHandle)}
                      </span>
                    </p>

                    <p className="mt-2.5 line-clamp-3 font-sans text-xs leading-relaxed text-muted">
                      {item.craftsmanshipNotes}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
