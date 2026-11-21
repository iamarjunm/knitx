'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Scissors, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KineticStep {
  id: string;
  num: string;
  label: string;
  headline: string;
  summary: string;
  bullets: string[];
  stats: { label: string; value: string }[];
  ctaLabel: string;
  ctaHref: string;
}

const KINETIC_STEPS: KineticStep[] = [
  {
    id: 'tease',
    num: '01',
    label: 'MYSTERY TEASE',
    headline: 'HALF REVEALED. HALF LOCKED.',
    summary:
      '5 pieces shoot in daylight. 5 stay veiled inside the Vault until your queue number is called.',
    bullets: [
      'Sequential queue numbers replace chaotic bot drops',
      'Zero bulk fabric cut before real demand hits',
      '10 total silhouettes per drop — no bloated catalogs',
    ],
    stats: [
      { label: 'VISIBILITY', value: '5 OPEN · 5 VEILED' },
      { label: 'DEADSTOCK', value: '0 UNITS' },
      { label: 'ACCESS', value: 'WAITLIST ONLY' },
    ],
    ctaLabel: 'JOIN WAITLIST',
    ctaHref: '/#waitlist',
  },
  {
    id: 'vote',
    num: '02',
    label: 'CROWD VOTES',
    headline: 'THE STREETS EDIT THE DROP.',
    summary:
      'Independent designers pitch silhouettes. You upvote the winners. Top 4 move straight to the cutting table.',
    bullets: [
      'Live transparent leaderboard with a hard Top 4 cut-off',
      'Creator name stitched onto every woven neck label',
      'Direct royalties + drop campaign spotlight for winners',
    ],
    stats: [
      { label: 'CUT-OFF', value: 'TOP 4 WIN' },
      { label: 'CREDIT', value: 'WOVEN TAG' },
      { label: 'SELECTION', value: '100% CROWD' },
    ],
    ctaLabel: 'VOTE DROP 02',
    ctaHref: '/vote',
  },
  {
    id: 'sample',
    num: '03',
    label: '1 SAMPLE SHOT',
    headline: 'ONE MASTER GARMENT. ZERO WASTE.',
    summary:
      'We sew 1 real physical sample in-house to lock 450+ GSM drape, puff height, and wash — then shoot it raw.',
    bullets: [
      'No 500-piece factory minimums sitting in warehouses',
      'Every rupee goes into fabric density & artisan finish',
      'Tested on body in natural daylight before launch',
    ],
    stats: [
      { label: 'SAMPLES CUT', value: '1 PER PIECE' },
      { label: 'WEIGHT', value: '420–540 GSM' },
      { label: 'WASTE', value: '0%' },
    ],
    ctaLabel: 'DROP YOUR DESIGN',
    ctaHref: '/submit',
  },
  {
    id: 'order',
    num: '04',
    label: 'MADE TO ORDER',
    headline: 'CLAIMED FIRST. CUT SECOND.',
    summary:
      'Vault opens in waves. Small-batch cuts cap at 3–4 units worldwide. 1-of-1s stay singular forever.',
    bullets: [
      'Hand-numbered serial tag stitched inside every piece',
      'Cut, finished & quality-checked in our India studio',
      'Dispatched straight to your door in 8–14 days',
    ],
    stats: [
      { label: 'SMALL-BATCH', value: '3–4 UNITS MAX' },
      { label: 'ARCHIVE', value: '1 OF 1 ONLY' },
      { label: 'DISPATCH', value: '8–14 DAYS' },
    ],
    ctaLabel: 'ENTER THE VAULT',
    ctaHref: '/vault',
  },
];

const COMPARISON_ROWS = [
  {
    metric: 'UPFRONT STOCK',
    oldBrand: '500–1,000 units guessed before launch',
    knitx: '1 master sample per silhouette',
  },
  {
    metric: 'BATCH CAP',
    oldBrand: 'Mass runs + quiet restocks',
    knitx: '3–4 units max + two 1-of-1s',
  },
  {
    metric: 'DEADSTOCK',
    oldBrand: 'Discounted, dumped, or burned',
    knitx: '0% — cut only after claim',
  },
  {
    metric: 'FABRIC WEIGHT',
    oldBrand: 'Thin 240 GSM generic blanks',
    knitx: '420–540 GSM Tiruppur loopback',
  },
  {
    metric: 'WHO DECIDES',
    oldBrand: 'Closed boardroom forecasts',
    knitx: 'Live Community Ballot + Open Call',
  },
  {
    metric: 'LABEL CREDIT',
    oldBrand: 'Anonymous factory tags',
    knitx: 'Hand-numbered serial + creator name',
  },
] as const;

const CRAFT_CARDS = [
  {
    num: '01',
    title: '450 GSM',
    tag: 'TIRUPPUR LOOPBACK',
    image: '/images/look-batch-hoodie.jpg',
    copy: 'Heavy combed Indian French terry. Dry boxy drape that holds structure for years.',
  },
  {
    num: '02',
    title: '3D PUFF',
    tag: 'IN-HOUSE SCREEN LAB',
    image: '/images/look-batch-tee.jpg',
    copy: 'Multi-pass high-density matte puff ink cured to crisp sculptural relief.',
  },
  {
    num: '03',
    title: 'CHAIN-STITCH',
    tag: 'ARTISAN EMBROIDERY LAB',
    image: '/images/look-1of1-knit.jpg',
    copy: 'Heavy cotton thread run on guided chain-stitch heads for raised tactile graphics.',
  },
  {
    num: '04',
    title: '1-OF-1 HAND-PAINTED',
    tag: 'SINGULAR ARCHIVE',
    image: '/images/look-1of1-jacket.jpg',
    copy: 'Mineral dye baths, raw brushwork & custom hardware. Impossible to duplicate.',
  },
] as const;

export default function AtelierClient() {
  const [activeStepId, setActiveStepId] = useState<string>(KINETIC_STEPS[0].id);

  const activeStep =
    KINETIC_STEPS.find((s) => s.id === activeStepId) || KINETIC_STEPS[0];

  return (
    <div className="min-h-screen bg-paper bg-draft-grid pt-24 pb-28 text-ink">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        {/* ================================================================= */}
        {/* HERO + FRAMED DAYLIGHT ATELIER PHOTO                              */}
        {/* ================================================================= */}
        <header className="flex flex-col justify-between gap-6 border-b-2 border-ink pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 border-2 border-ink bg-ink px-3.5 py-1.5 text-paper stamp-shadow-sm">
              <Scissors className="h-3.5 w-3.5 text-orange" />
              <span className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase">
                KNITX STUDIO // SAMPLE-FIRST OPS
              </span>
            </div>

            <h1 className="mt-5 font-poster text-6xl leading-[0.88] tracking-tight text-ink uppercase sm:text-8xl lg:text-[108px]">
              SAMPLE FIRST.
              <br />
              ZERO DEADSTOCK<span className="text-orange">.</span>
            </h1>
          </div>

          <div className="max-w-xs border-2 border-ink bg-surface p-4 stamp-shadow-sm">
            <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-orange uppercase">
              THE RULE
            </p>
            <p className="mt-1 font-sans text-sm font-medium leading-snug text-ink">
              One physical sample for the lens. Zero warehouse stock. Every
              numbered piece is cut only when claimed.
            </p>
          </div>
        </header>

        {/* Full-Width Framed Daylight Studio Image */}
        <div className="mt-8 border-2 border-ink bg-surface p-2.5 stamp-shadow sm:p-3.5">
          <div className="relative aspect-[16/9] max-h-[560px] w-full overflow-hidden border-2 border-ink bg-stone">
            <img
              src="/images/atelier-daylight.jpg"
              alt="KNITX Sample-First Studio in Natural Daylight"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-2">
              <span className="border-2 border-ink bg-surface px-3 py-1 font-mono text-[10px] font-bold tracking-[0.18em] text-ink uppercase stamp-shadow-sm">
                MADE IN INDIA
              </span>
              <span className="border-2 border-ink bg-orange px-3 py-1 font-mono text-[10px] font-bold tracking-[0.18em] text-white uppercase stamp-shadow-sm">
                420–540 GSM COTTON
              </span>
            </div>
            <div className="absolute right-3.5 bottom-3.5 hidden border-2 border-ink bg-ink px-3.5 py-1.5 font-mono text-[10px] font-bold tracking-[0.2em] text-paper uppercase sm:block">
              3–4 UNITS MAX · 1-OF-1 ARCHIVE
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* INTERACTIVE 4-STEP KINETIC FLOW                                   */}
        {/* ================================================================= */}
        <section className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-block bg-orange px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.22em] text-white uppercase">
                HOW DROPS WORK
              </span>
              <h2 className="mt-2 font-poster text-4xl leading-none tracking-tight text-ink uppercase sm:text-6xl">
                4-STEP KINETIC FLOW.
              </h2>
            </div>
            <p className="font-mono text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
              CLICK A STAGE TO INSPECT
            </p>
          </div>

          {/* 4 Interactive Stage Selector Buttons */}
          <div
            role="tablist"
            aria-label="KNITX 4-step drop cycle"
            className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            {KINETIC_STEPS.map((step) => {
              const active = step.id === activeStep.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveStepId(step.id)}
                  className={cn(
                    'relative cursor-pointer overflow-hidden border-2 border-ink p-4 text-left transition-transform hover:-translate-y-0.5',
                    active
                      ? 'text-paper stamp-shadow'
                      : 'bg-surface text-ink stamp-shadow-sm hover:bg-stone'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="atelier-step-bg"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 32,
                      }}
                      className="absolute inset-0 bg-ink"
                    />
                  )}
                  <div className="relative z-10">
                    <span
                      className={cn(
                        'inline-block font-mono text-xs font-bold tracking-[0.18em]',
                        active ? 'text-orange' : 'text-orange'
                      )}
                    >
                      {step.num}
                    </span>
                    <p className="mt-1.5 font-poster text-2xl leading-none tracking-tight uppercase sm:text-3xl">
                      {step.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Animated Stage Detail Card */}
          <div className="mt-5 border-2 border-ink bg-surface p-6 stamp-shadow sm:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-1 gap-8 lg:grid-cols-12"
              >
                <div className="lg:col-span-7">
                  <span className="font-mono text-[11px] font-bold tracking-[0.22em] text-orange uppercase">
                    STAGE {activeStep.num} // {activeStep.label}
                  </span>
                  <h3 className="mt-2 font-poster text-4xl leading-[0.94] tracking-tight text-ink uppercase sm:text-5xl">
                    {activeStep.headline}
                  </h3>
                  <p className="mt-3 font-sans text-base font-medium leading-relaxed text-muted">
                    {activeStep.summary}
                  </p>

                  <ul className="mt-6 space-y-2.5 border-t-2 border-ink pt-5">
                    {activeStep.bullets.map((bullet, idx) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-3 font-sans text-sm font-medium text-ink"
                      >
                        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center border border-ink bg-stone font-mono text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col justify-between gap-6 border-t-2 border-ink pt-6 lg:col-span-5 lg:border-t-0 lg:border-l-2 lg:pt-0 lg:pl-8">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    {activeStep.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="border-2 border-ink bg-paper p-3.5"
                      >
                        <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-muted uppercase">
                          {stat.label}
                        </p>
                        <p className="mt-1 font-poster text-2xl leading-none text-ink uppercase">
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={activeStep.ctaHref}
                    className="inline-flex w-full items-center justify-center gap-2 border-2 border-ink bg-orange px-6 py-4 font-mono text-xs font-bold tracking-[0.18em] text-white uppercase stamp-shadow-sm transition-colors hover:bg-ink hover:text-paper"
                  >
                    <span>{activeStep.ctaLabel}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* ================================================================= */}
        {/* BOLD SIDE-BY-SIDE: OLD BRANDS vs KNITX                            */}
        {/* ================================================================= */}
        <section className="mt-16">
          <div className="mb-6">
            <span className="inline-block border-2 border-ink bg-stone px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.22em] text-ink uppercase">
              ZERO-BS RECEIPT
            </span>
            <h2 className="mt-2 font-poster text-4xl leading-none tracking-tight text-ink uppercase sm:text-6xl">
              OLD BRANDS VS KNITX<span className="text-orange">.</span>
            </h2>
          </div>

          <div className="overflow-hidden border-2 border-ink bg-surface stamp-shadow">
            {/* Header Row */}
            <div className="grid grid-cols-1 border-b-2 border-ink bg-ink text-paper sm:grid-cols-12">
              <div className="hidden px-5 py-3.5 font-mono text-[11px] font-bold tracking-[0.2em] uppercase sm:col-span-3 sm:block">
                METRIC
              </div>
              <div className="border-paper/20 px-5 py-3.5 font-mono text-[11px] font-bold tracking-[0.2em] text-paper/65 uppercase sm:col-span-4 sm:border-l-2">
                OLD BRANDS
              </div>
              <div className="bg-orange px-5 py-3.5 font-mono text-[11px] font-bold tracking-[0.2em] text-white uppercase sm:col-span-5 sm:border-l-2 sm:border-ink">
                KNITX SAMPLE-FIRST
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y-2 divide-ink">
              {COMPARISON_ROWS.map((row) => (
                <div
                  key={row.metric}
                  className="grid grid-cols-1 sm:grid-cols-12"
                >
                  <div className="bg-paper px-5 pt-4 pb-1 font-mono text-xs font-bold tracking-[0.14em] text-ink uppercase sm:col-span-3 sm:py-4">
                    {row.metric}
                  </div>

                  <div className="flex items-center gap-2 border-ink px-5 py-2 font-sans text-sm text-muted sm:col-span-4 sm:border-l-2 sm:py-4">
                    <X className="h-4 w-4 shrink-0 text-muted" />
                    <span className="line-through decoration-ink/30">
                      {row.oldBrand}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 border-ink bg-surface px-5 pt-1 pb-4 font-sans text-sm font-bold text-ink sm:col-span-5 sm:border-l-2 sm:py-4">
                    <Check className="h-4 w-4 shrink-0 text-orange" />
                    <span>{row.knitx}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 4 TACTILE FABRIC & CRAFT CARDS                                    */}
        {/* ================================================================= */}
        <section className="mt-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="inline-block bg-cobalt px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.22em] text-white uppercase">
                MATERIAL SPECS
              </span>
              <h2 className="mt-2 font-poster text-4xl leading-none tracking-tight text-ink uppercase sm:text-6xl">
                HEAVYWEIGHT CRAFT.
              </h2>
            </div>
            <p className="font-mono text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
              INDIAN MILLS → KNITX STUDIO
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CRAFT_CARDS.map((card) => (
              <motion.article
                key={card.num}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                className="group flex flex-col border-2 border-ink bg-surface stamp-shadow-sm transition-shadow hover:shadow-[6px_6px_0px_#0A0A0A]"
              >
                <div className="relative aspect-[3/4] overflow-hidden border-b-2 border-ink bg-stone">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 border-2 border-ink bg-surface px-2.5 py-0.5 font-mono text-[11px] font-bold text-ink">
                    {card.num}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-orange uppercase">
                    {card.tag}
                  </span>
                  <h3 className="mt-1.5 font-poster text-3xl leading-none tracking-tight text-ink uppercase">
                    {card.title}
                  </h3>
                  <p className="mt-2.5 font-sans text-xs font-medium leading-relaxed text-muted">
                    {card.copy}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* ================================================================= */}
        {/* STAMPED BOTTOM CTAS                                               */}
        {/* ================================================================= */}
        <section className="mt-16 border-2 border-ink bg-ink p-8 text-center text-paper stamp-shadow-orange sm:p-14">
          <span className="inline-block border border-orange bg-orange px-3 py-1 font-mono text-[10px] font-bold tracking-[0.24em] text-white uppercase">
            DROP 01 // MONSOON
          </span>

          <h2 className="mt-4 font-poster text-5xl leading-[0.9] tracking-tight text-paper uppercase sm:text-7xl">
            BUILT SMALL. MADE TO KEEP.
          </h2>

          <p className="mx-auto mt-3 max-w-md font-mono text-xs tracking-[0.14em] text-paper/75 uppercase">
            LOCK YOUR QUEUE NUMBER OR STEP STRAIGHT INTO THE VAULT.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/#waitlist"
              className="inline-flex items-center gap-2.5 border-2 border-paper bg-orange px-7 py-4 font-mono text-xs font-bold tracking-[0.18em] text-white uppercase transition-transform hover:-translate-y-0.5 hover:bg-surface hover:text-ink"
            >
              <span>JOIN WAITLIST</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/vault"
              className="inline-flex items-center gap-2.5 border-2 border-paper bg-surface px-7 py-4 font-mono text-xs font-bold tracking-[0.18em] text-ink uppercase transition-transform hover:-translate-y-0.5 hover:bg-orange hover:text-white"
            >
              <span>ENTER THE VAULT</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
