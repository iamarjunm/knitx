'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  KeyRound,
  Loader2,
  Lock,
  ShoppingBag,
  Sparkles,
  Unlock,
  X,
  Zap,
} from 'lucide-react';
import type { DropCampaign, Product } from '@/lib/types';
import { cn, formatInr } from '@/lib/utils';
import { useVault } from '@/context/VaultContext';
import { useAuth } from '@/context/AuthContext';

interface VaultClientProps {
  drop: DropCampaign;
  products: Product[];
}

type VaultFilter = 'all' | 'one-of-one' | 'small-batch' | 'mystery';

const VEIL_PLATES = [
  { plate: '01', code: 'KX-06', label: 'OUTERWEAR' },
  { plate: '02', code: 'KX-07', label: 'ARCHIVAL KNIT' },
  { plate: '03', code: 'KX-08', label: '500 GSM FLEECE' },
  { plate: '04', code: 'KX-09', label: 'BOXY JERSEY' },
  { plate: '05', code: 'KX-10', label: '1-OF-1 STUDY' },
];

export default function VaultClient({ drop, products }: VaultClientProps) {
  const { user } = useAuth();
  const {
    waitlistPass,
    isVaultUnlocked,
    joinWaitlist,
    unlockVaultDemo,
    unlockVaultWithCode,
    addToCart,
    setCartOpen,
  } = useVault();

  // Hydration-safe mount guard
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Gate form state
  const [accessCode, setAccessCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [joinName, setJoinName] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // 2-panel horizontal split shutter reveal
  const [shutterActive, setShutterActive] = useState(false);

  // Unlocked vault state
  const [activeFilter, setActiveFilter] = useState<VaultFilter>('all');
  const [inspectedProduct, setInspectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [bagError, setBagError] = useState<string | null>(null);

  // Pre-fill waitlist fields from signed-in user
  useEffect(() => {
    if (!mounted || !user) return;
    if (!joinName && user.displayName) setJoinName(user.displayName);
    if (!joinEmail && user.email) setJoinEmail(user.email);
  }, [mounted, user, joinName, joinEmail]);

  // Reset selected size when inspecting a piece
  useEffect(() => {
    if (inspectedProduct) {
      setSelectedSize(inspectedProduct.sizes[0] || 'One Size');
      setBagError(null);
    }
  }, [inspectedProduct]);

  // Close modal on Escape
  useEffect(() => {
    if (!inspectedProduct) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInspectedProduct(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inspectedProduct]);

  const effectiveUnlocked = mounted && isVaultUnlocked;
  const effectivePass = mounted ? waitlistPass : null;

  const oneOfOneProducts = useMemo(
    () => products.filter((p) => p.tier === 'one-of-one'),
    [products]
  );

  const smallBatchProducts = useMemo(
    () => products.filter((p) => p.tier === 'small-batch'),
    [products]
  );

  const unveiledProducts = useMemo(
    () => products.filter((p) => p.isMystery),
    [products]
  );

  const inventoryStats = useMemo(() => {
    const remaining = products.reduce((sum, p) => sum + p.remainingUnits, 0);
    const total = products.reduce((sum, p) => sum + p.totalUnits, 0);
    return { remaining, total };
  }, [products]);

  const visibleOneOfOnes = useMemo(() => {
    if (activeFilter === 'small-batch') return [];
    if (activeFilter === 'mystery') {
      return oneOfOneProducts.filter((p) => p.isMystery);
    }
    return oneOfOneProducts;
  }, [activeFilter, oneOfOneProducts]);

  const visibleSmallBatch = useMemo(() => {
    if (activeFilter === 'one-of-one') return [];
    if (activeFilter === 'mystery') {
      return smallBatchProducts.filter((p) => p.isMystery);
    }
    return smallBatchProducts;
  }, [activeFilter, smallBatchProducts]);

  const triggerShutterSplit = (onUnlock: () => void) => {
    if (shutterActive) return;
    setShutterActive(true);
    window.setTimeout(() => {
      onUnlock();
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 420);
    window.setTimeout(() => {
      setShutterActive(false);
    }, 950);
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);
    const trimmed = accessCode.trim();
    if (!trimmed) {
      setCodeError('ENTER AN ACCESS CODE. TRY KNITX-001.');
      return;
    }

    const normalized = trimmed.toUpperCase();
    const passCode = effectivePass?.accessCode?.trim().toUpperCase();
    const willSucceed =
      normalized === 'KNITX-001' || (Boolean(passCode) && normalized === passCode);

    if (!willSucceed) {
      setCodeError('INVALID CODE. PREVIEW CODE: KNITX-001.');
      return;
    }

    triggerShutterSplit(() => {
      unlockVaultWithCode(trimmed);
      setAccessCode('');
    });
  };

  const handleSimulateUnlock = () => {
    setCodeError(null);
    triggerShutterSplit(() => {
      unlockVaultDemo();
    });
  };

  const handleInlineWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    if (!joinName.trim() || !joinEmail.trim()) {
      setJoinError('DROP YOUR NAME + EMAIL TO CLAIM A SPOT.');
      return;
    }

    setJoiningWaitlist(true);
    try {
      await joinWaitlist(joinName.trim(), joinEmail.trim());
    } catch (err) {
      setJoinError(
        err instanceof Error ? err.message : 'COULD NOT JOIN QUEUE RIGHT NOW.'
      );
    } finally {
      setJoiningWaitlist(false);
    }
  };

  const handleClaimPiece = () => {
    if (!inspectedProduct) return;
    setBagError(null);
    const sizeToUse = selectedSize || inspectedProduct.sizes[0] || 'One Size';
    const result = addToCart(inspectedProduct, sizeToUse);
    if (!result.ok) {
      setBagError(result.message || 'UNABLE TO CLAIM THIS PIECE.');
      return;
    }
    setInspectedProduct(null);
    setCartOpen(true);
  };

  const filterTabs: { id: VaultFilter; label: string; count: number }[] = [
    { id: 'all', label: 'ALL', count: products.length },
    { id: 'one-of-one', label: '1-OF-1', count: oneOfOneProducts.length },
    { id: 'small-batch', label: 'SMALL-BATCH', count: smallBatchProducts.length },
    { id: 'mystery', label: 'UNVEILED', count: unveiledProducts.length },
  ];

  return (
    <div className="relative min-h-screen bg-paper text-ink">
      {/* ================================================================= */}
      {/* EXPLOSIVE 2-PANEL HORIZONTAL WHITE & BLACK SHUTTER SPLIT REVEAL   */}
      {/* ================================================================= */}
      <AnimatePresence>
        {shutterActive && (
          <motion.div
            key="vault-shutter-overlay"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1, transition: { duration: 0.65 } }}
            className="pointer-events-none fixed inset-0 z-50 flex overflow-hidden"
          >
            {/* Left White Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{
                x: '0%',
                transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
              }}
              exit={{
                x: '-100%',
                transition: { duration: 0.58, ease: [0.76, 0, 0.24, 1] },
              }}
              className="relative flex h-full w-1/2 flex-col items-end justify-center border-r-4 border-ink bg-surface pr-4 sm:pr-10"
            >
              <span className="font-mono text-[10px] font-bold tracking-[0.26em] text-orange uppercase">
                DROP 01 // ADMISSION
              </span>
              <span className="mt-1 font-poster text-6xl leading-none tracking-tight text-ink uppercase sm:text-8xl lg:text-9xl">
                VAULT
              </span>
            </motion.div>

            {/* Right Black Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{
                x: '0%',
                transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
              }}
              exit={{
                x: '100%',
                transition: { duration: 0.58, ease: [0.76, 0, 0.24, 1] },
              }}
              className="relative flex h-full w-1/2 flex-col items-start justify-center bg-ink pl-4 sm:pl-10"
            >
              <span className="bg-orange px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.24em] text-white uppercase">
                NUMBER CALLED
              </span>
              <span className="mt-1 font-poster text-6xl leading-none tracking-tight text-paper uppercase sm:text-8xl lg:text-9xl">
                OPEN.
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!effectiveUnlocked ? (
          /* ============================================================= */
          /* LOCKED STATE — ARCHITECTURAL PAPER AIRLOCK                    */
          /* ============================================================= */
          <motion.section
            key="vault-locked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
            className="min-h-screen bg-draft-grid pt-24 pb-28"
          >
            <div className="mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-10">
              {/* Top Airlock Header */}
              <div className="flex flex-col items-start justify-between gap-6 border-b-2 border-ink pb-8 lg:flex-row lg:items-end">
                <div>
                  <div className="inline-flex items-center gap-2 border-2 border-ink bg-surface px-3.5 py-1.5 stamp-shadow-sm">
                    <Lock className="h-3.5 w-3.5 text-orange" />
                    <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-ink uppercase">
                      {drop.dropNumber} · 10 PIECES · INVITE ONLY
                    </span>
                  </div>

                  <h1 className="mt-5 font-poster text-6xl leading-[0.88] tracking-tight text-ink uppercase sm:text-8xl lg:text-[116px]">
                    VAULT LOCKED<span className="text-orange">.</span>
                  </h1>
                </div>

                <div className="max-w-sm border-2 border-ink bg-surface p-4 stamp-shadow-sm">
                  <p className="font-mono text-[10px] font-bold tracking-[0.22em] text-orange uppercase">
                    AIRLOCK PROTOCOL
                  </p>
                  <p className="mt-1.5 font-sans text-sm font-medium leading-snug text-ink">
                    No open store. 8 small-batch cuts (3–4 units) + 2 one-of-ones.
                    Queue numbers enter one wave at a time.
                  </p>
                </div>
              </div>

              {/* Split Airlock Grid: Gate Card + Veiled Pieces Preview */}
              <div className="mt-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                {/* Left: Crisp Stamped White Gate Card */}
                <div className="border-2 border-ink bg-surface stamp-shadow lg:col-span-6">
                  {/* Card Top Bar */}
                  <div className="flex items-center justify-between border-b-2 border-ink bg-ink px-5 py-3 text-paper">
                    <span className="font-mono text-[11px] font-bold tracking-[0.22em] uppercase">
                      GATE TERMINAL // {drop.dropNumber}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-[0.18em] text-orange uppercase">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-orange" />
                      GATED
                    </span>
                  </div>

                  <div className="p-6 sm:p-8">
                    {effectivePass ? (
                      /* Queue Pass Active View */
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-paper p-4">
                          <div>
                            <p className="font-mono text-[10px] font-bold tracking-[0.22em] text-muted uppercase">
                              YOUR QUEUE SPOT
                            </p>
                            <p className="mt-1 font-poster text-5xl leading-none tracking-tight text-ink sm:text-6xl">
                              #{effectivePass.position.toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block border-2 border-ink bg-cobalt px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.18em] text-white uppercase">
                              IN LINE
                            </span>
                            <p className="mt-2 font-mono text-[11px] font-bold text-ink">
                              {effectivePass.name}
                            </p>
                            <p className="font-mono text-[10px] text-muted">
                              {effectivePass.email}
                            </p>
                          </div>
                        </div>

                        {/* Access Code Entry */}
                        <form onSubmit={handleCodeSubmit} className="mt-6">
                          <label
                            htmlFor="vault-code-pass"
                            className="block font-mono text-[11px] font-bold tracking-[0.2em] text-ink uppercase"
                          >
                            ACCESS CODE
                          </label>
                          <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
                            <div className="relative flex-1">
                              <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
                              <input
                                id="vault-code-pass"
                                type="text"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                placeholder="KNITX-001"
                                className="w-full border-2 border-ink bg-paper py-3 pr-4 pl-10 font-mono text-xs font-bold uppercase tracking-wider text-ink placeholder:text-muted/60 focus:bg-surface focus:outline-none"
                              />
                            </div>
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              type="submit"
                              className="cursor-pointer border-2 border-ink bg-ink px-6 py-3 font-mono text-xs font-bold tracking-[0.18em] text-paper uppercase transition-colors hover:bg-orange hover:text-white"
                            >
                              UNLOCK
                            </motion.button>
                          </div>
                          {codeError && (
                            <p className="mt-2 font-mono text-[11px] font-bold text-orange uppercase">
                              {codeError}
                            </p>
                          )}
                        </form>
                      </div>
                    ) : (
                      /* Unregistered: Inline Queue Form + Code Entry */
                      <div>
                        <div className="flex items-baseline justify-between gap-3">
                          <h2 className="font-poster text-3xl tracking-tight text-ink uppercase">
                            CLAIM YOUR QUEUE SPOT
                          </h2>
                          <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-muted uppercase">
                            {drop.waitlistCount.toLocaleString('en-IN')} IN LINE
                          </span>
                        </div>

                        <form
                          onSubmit={handleInlineWaitlist}
                          className="mt-5 space-y-3.5"
                        >
                          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                            <div>
                              <label
                                htmlFor="vault-wl-name"
                                className="block font-mono text-[10px] font-bold tracking-[0.2em] text-muted uppercase"
                              >
                                NAME
                              </label>
                              <input
                                id="vault-wl-name"
                                type="text"
                                required
                                value={joinName}
                                onChange={(e) => setJoinName(e.target.value)}
                                placeholder="Aarav Mehta"
                                className="mt-1.5 w-full border-2 border-ink bg-paper px-3.5 py-2.5 font-sans text-sm font-medium text-ink placeholder:text-muted/60 focus:bg-surface focus:outline-none"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="vault-wl-email"
                                className="block font-mono text-[10px] font-bold tracking-[0.2em] text-muted uppercase"
                              >
                                EMAIL
                              </label>
                              <input
                                id="vault-wl-email"
                                type="email"
                                required
                                value={joinEmail}
                                onChange={(e) => setJoinEmail(e.target.value)}
                                placeholder="aarav@domain.com"
                                className="mt-1.5 w-full border-2 border-ink bg-paper px-3.5 py-2.5 font-sans text-sm font-medium text-ink placeholder:text-muted/60 focus:bg-surface focus:outline-none"
                              />
                            </div>
                          </div>

                          {joinError && (
                            <p className="font-mono text-[11px] font-bold text-orange uppercase">
                              {joinError}
                            </p>
                          )}

                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={joiningWaitlist}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 border-2 border-ink bg-ink px-5 py-3.5 font-mono text-xs font-bold tracking-[0.18em] text-paper uppercase transition-colors hover:bg-cobalt disabled:opacity-50"
                          >
                            {joiningWaitlist ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>ISSUING SPOT...</span>
                              </>
                            ) : (
                              <>
                                <span>GET QUEUE NUMBER</span>
                                <ArrowRight className="h-4 w-4" />
                              </>
                            )}
                          </motion.button>
                        </form>

                        {/* Access Code Input */}
                        <form
                          onSubmit={handleCodeSubmit}
                          className="mt-6 border-t-2 border-dashed border-ink/25 pt-5"
                        >
                          <label
                            htmlFor="vault-code-guest"
                            className="block font-mono text-[10px] font-bold tracking-[0.2em] text-muted uppercase"
                          >
                            GOT AN INVITE CODE? (PREVIEW: KNITX-001)
                          </label>
                          <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
                            <div className="relative flex-1">
                              <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
                              <input
                                id="vault-code-guest"
                                type="text"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                placeholder="KNITX-001"
                                className="w-full border-2 border-ink bg-paper py-2.5 pr-4 pl-10 font-mono text-xs font-bold uppercase tracking-wider text-ink placeholder:text-muted/60 focus:bg-surface focus:outline-none"
                              />
                            </div>
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              type="submit"
                              className="cursor-pointer border-2 border-ink bg-surface px-5 py-2.5 font-mono text-xs font-bold tracking-[0.16em] text-ink uppercase transition-colors hover:bg-ink hover:text-paper"
                            >
                              ENTER
                            </motion.button>
                          </div>
                          {codeError && (
                            <p className="mt-2 font-mono text-[11px] font-bold text-orange uppercase">
                              {codeError}
                            </p>
                          )}
                        </form>
                      </div>
                    )}

                    {/* Explosive Instant Simulation Button */}
                    <div className="mt-7 border-t-2 border-ink pt-6">
                      <motion.button
                        whileHover={{ x: -2, y: -2 }}
                        whileTap={{ x: 2, y: 2 }}
                        type="button"
                        onClick={handleSimulateUnlock}
                        className="flex w-full cursor-pointer items-center justify-center gap-2.5 border-2 border-ink bg-orange px-6 py-4 font-mono text-xs font-bold tracking-[0.16em] text-white uppercase stamp-shadow-sm transition-colors hover:bg-ink hover:text-paper sm:text-sm"
                      >
                        <Zap className="h-4 w-4 fill-current" />
                        <span>SIMULATE: MY NUMBER IS CALLED →</span>
                      </motion.button>
                      <p className="mt-2.5 text-center font-mono text-[10px] font-bold tracking-[0.16em] text-muted uppercase">
                        INSTANT DEMO TRIGGER · UNVEILS ALL 10 DROP 01 PIECES
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: 5 Unseen Silhouettes Locker Wall */}
                <div className="lg:col-span-6">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-ink uppercase">
                      LOCKED INSIDE // {unveiledProducts.length} UNSEEN CUTS
                    </span>
                    <span className="border-2 border-ink bg-stone px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.16em] text-ink uppercase">
                      10 TOTAL
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {VEIL_PLATES.map((item, idx) => (
                      <motion.div
                        key={item.plate}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.3 }}
                        className={cn(
                          'group relative overflow-hidden border-2 border-ink bg-surface stamp-shadow-sm',
                          idx === 4 && 'col-span-2 sm:col-span-1'
                        )}
                      >
                        <div className="relative aspect-[3/4] overflow-hidden bg-stone">
                          <img
                            src="/images/look-mystery-veil.jpg"
                            alt={`Locked piece ${item.label}`}
                            className="h-full w-full scale-105 object-cover blur-[2px] grayscale-[25%] transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-paper/35" />
                          <div className="absolute top-2.5 left-2.5 border-2 border-ink bg-surface px-2 py-0.5 font-mono text-[10px] font-bold text-ink">
                            {item.code}
                          </div>
                          <div className="absolute top-2.5 right-2.5 bg-orange px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest text-white uppercase">
                            VEILED
                          </div>
                          <div className="absolute inset-x-0 bottom-0 border-t-2 border-ink bg-surface/95 px-2.5 py-2">
                            <p className="font-mono text-[10px] font-bold tracking-[0.14em] text-ink uppercase">
                              {item.label}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* 6th Tile: Unlock Teaser Tile */}
                    <button
                      type="button"
                      onClick={handleSimulateUnlock}
                      className="hidden cursor-pointer flex-col items-center justify-center border-2 border-dashed border-ink bg-stone/70 p-4 text-center transition-colors hover:bg-orange hover:text-white sm:flex"
                    >
                      <Unlock className="h-6 w-6" />
                      <span className="mt-2 font-poster text-2xl leading-none uppercase">
                        OPEN ALL 10
                      </span>
                      <span className="mt-1 font-mono text-[10px] font-bold tracking-widest uppercase opacity-80">
                        CLICK TO ENTER
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        ) : (
          /* ============================================================= */
          /* UNLOCKED STATE — FULL 10-PIECE DROP ARCHIVE                   */
          /* ============================================================= */
          <motion.section
            key="vault-unlocked"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-screen bg-paper pt-24 pb-28"
          >
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
              {/* Bold VAULT OPEN // DROP 01 Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-surface px-4 py-3 stamp-shadow sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange" />
                  </span>
                  <span className="font-mono text-xs font-bold tracking-[0.22em] text-ink uppercase">
                    VAULT OPEN // DROP 01
                  </span>
                  {effectivePass && (
                    <span className="hidden border-2 border-ink bg-stone px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.16em] text-ink uppercase sm:inline-block">
                      PASS #{effectivePass.position.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="border-2 border-ink bg-ink px-3 py-1 font-mono text-[11px] font-bold tracking-[0.16em] text-paper uppercase">
                    {inventoryStats.remaining} / {inventoryStats.total} LEFT
                  </span>
                </div>
              </div>

              {/* Hero Title + Tactile Spring Filter Tabs */}
              <div className="mt-8 flex flex-col justify-between gap-6 border-b-2 border-ink pb-7 lg:flex-row lg:items-end">
                <div>
                  <h1 className="font-poster text-6xl leading-[0.88] tracking-tight text-ink uppercase sm:text-7xl lg:text-8xl">
                    DROP 01 ARCHIVE<span className="text-orange">.</span>
                  </h1>
                  <p className="mt-3 font-mono text-xs font-bold tracking-[0.16em] text-muted uppercase">
                    CUT &amp; SEWN TO ORDER IN INDIA · NEVER RESTOCKED
                  </p>
                </div>

                {/* Tactile Spring Filter Tabs */}
                <nav
                  aria-label="Vault collection filters"
                  className="inline-flex flex-wrap items-center gap-1 border-2 border-ink bg-surface p-1 stamp-shadow-sm"
                >
                  {filterTabs.map((tab) => {
                    const active = activeFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveFilter(tab.id)}
                        className={cn(
                          'relative cursor-pointer px-3.5 py-2 font-mono text-[11px] font-bold tracking-[0.14em] uppercase transition-colors',
                          active ? 'text-paper' : 'text-ink hover:text-orange'
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="vault-filter-pill"
                            transition={{
                              type: 'spring',
                              stiffness: 460,
                              damping: 32,
                            }}
                            className="absolute inset-0 bg-ink"
                          />
                        )}
                        <span className="relative z-10">
                          {tab.label} [{tab.count}]
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* =========================================================== */}
              {/* MONUMENTAL 2-COL ONE-OF-ONE ARCHIVE SHOWCASE                */}
              {/* =========================================================== */}
              {visibleOneOfOnes.length > 0 && (
                <div className="mt-12">
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <span className="inline-block bg-orange px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.22em] text-white uppercase">
                        01 // ARCHIVE TIER
                      </span>
                      <h2 className="mt-2 font-poster text-4xl leading-none tracking-tight text-ink uppercase sm:text-5xl">
                        ONE-OF-ONE EDITIONS
                      </h2>
                    </div>
                    <p className="font-mono text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
                      1 UNIT WORLDWIDE · HAND-FINISHED · NEVER REPEATED
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {visibleOneOfOnes.map((product) => {
                      const soldOut = product.remainingUnits <= 0;
                      return (
                        <motion.article
                          key={product._id}
                          whileHover={{ y: -6 }}
                          transition={{
                            type: 'spring',
                            stiffness: 380,
                            damping: 26,
                          }}
                          className="group flex flex-col border-2 border-ink bg-surface stamp-shadow"
                        >
                          {/* Image Frame */}
                          <button
                            type="button"
                            onClick={() => setInspectedProduct(product)}
                            className="relative aspect-[4/5] w-full cursor-pointer overflow-hidden border-b-2 border-ink bg-stone text-left"
                          >
                            <img
                              src={product.imageUrl}
                              alt={product.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                            />

                            {/* Unmissable Orange 1-of-1 Ribbon */}
                            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                              <span className="border-2 border-ink bg-orange px-3 py-1 font-mono text-[10px] font-bold tracking-[0.2em] text-white uppercase stamp-shadow-sm">
                                1 OF 1 · ONLY ONE IN THE WORLD
                              </span>
                              {product.isMystery && (
                                <span className="inline-flex items-center gap-1 border-2 border-ink bg-surface px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.16em] text-cobalt uppercase">
                                  <Sparkles className="h-3 w-3" />
                                  UNVEILED
                                </span>
                              )}
                            </div>

                            {soldOut && (
                              <div className="absolute inset-0 flex items-center justify-center bg-paper/75">
                                <span className="border-2 border-ink bg-ink px-4 py-2 font-poster text-3xl tracking-wider text-paper uppercase">
                                  CLAIMED
                                </span>
                              </div>
                            )}
                          </button>

                          {/* Details Body */}
                          <div className="flex flex-1 flex-col justify-between p-6 sm:p-7">
                            <div>
                              <div className="flex items-center justify-between gap-2 font-mono text-[11px] font-bold tracking-[0.16em] uppercase">
                                <span className="text-muted">
                                  {product.serialCode} · {product.gsmWeight}
                                </span>
                                <span className="text-orange">
                                  {soldOut ? 'CLAIMED' : '1/1 AVAILABLE'}
                                </span>
                              </div>

                              <h3 className="mt-2 font-poster text-3xl leading-[0.95] tracking-tight text-ink uppercase sm:text-4xl">
                                {product.title}
                              </h3>

                              <p className="mt-2.5 font-sans text-sm leading-snug text-muted">
                                {product.description}
                              </p>

                              <div className="mt-4 flex flex-wrap gap-1.5">
                                {product.craftsmanship.map((note) => (
                                  <span
                                    key={note}
                                    className="border border-ink bg-stone px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.12em] text-ink uppercase"
                                  >
                                    {note}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t-2 border-ink pt-5">
                              <div>
                                <p className="font-mono text-[10px] font-bold tracking-[0.18em] text-muted uppercase">
                                  ARCHIVE PRICE
                                </p>
                                <p className="font-poster text-3xl leading-none text-ink">
                                  {formatInr(product.priceInr)}
                                </p>
                              </div>

                              <motion.button
                                whileTap={{ scale: 0.96 }}
                                type="button"
                                onClick={() => setInspectedProduct(product)}
                                className="inline-flex cursor-pointer items-center gap-2 border-2 border-ink bg-ink px-5 py-3 font-mono text-xs font-bold tracking-[0.16em] text-paper uppercase stamp-shadow-sm transition-colors hover:bg-orange hover:text-white"
                              >
                                <span>INSPECT &amp; CLAIM</span>
                                <ArrowUpRight className="h-4 w-4" />
                              </motion.button>
                            </div>
                          </div>
                        </motion.article>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* =========================================================== */}
              {/* 4-COL SMALL-BATCH GRID                                      */}
              {/* =========================================================== */}
              {visibleSmallBatch.length > 0 && (
                <div
                  className={cn(
                    visibleOneOfOnes.length > 0
                      ? 'mt-16 border-t-2 border-ink pt-12'
                      : 'mt-12'
                  )}
                >
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <span className="inline-block border-2 border-ink bg-stone px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.22em] text-ink uppercase">
                        02 // NUMBERED RUNS
                      </span>
                      <h2 className="mt-2 font-poster text-4xl leading-none tracking-tight text-ink uppercase sm:text-5xl">
                        SMALL-BATCH EDITIONS
                      </h2>
                    </div>
                    <p className="font-mono text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
                      3–4 UNITS PER CUT · HAND-NUMBERED
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {visibleSmallBatch.map((product) => {
                      const soldOut = product.remainingUnits <= 0;
                      const lowStock = !soldOut && product.remainingUnits <= 2;

                      return (
                        <motion.article
                          key={product._id}
                          whileHover={{ y: -6 }}
                          transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 26,
                          }}
                          onClick={() => setInspectedProduct(product)}
                          className="group flex cursor-pointer flex-col border-2 border-ink bg-surface stamp-shadow-sm transition-shadow hover:shadow-[6px_6px_0px_#0A0A0A]"
                        >
                          <div className="relative aspect-[3/4] overflow-hidden border-b-2 border-ink bg-stone">
                            <img
                              src={product.imageUrl}
                              alt={product.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                            />

                            {/* Top Left Badges */}
                            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                              {product.isMystery && (
                                <span className="border-2 border-ink bg-surface px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.16em] text-cobalt uppercase">
                                  UNVEILED
                                </span>
                              )}
                            </div>

                            {/* Top Right Live Stock Counter */}
                            <div className="absolute top-3 right-3">
                              <span
                                className={cn(
                                  'border-2 border-ink px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.12em] uppercase',
                                  soldOut
                                    ? 'bg-ink text-paper'
                                    : lowStock
                                      ? 'bg-orange text-white'
                                      : 'bg-surface text-ink'
                                )}
                              >
                                {soldOut
                                  ? 'SOLD OUT'
                                  : `${product.remainingUnits}/${product.totalUnits} LEFT`}
                              </span>
                            </div>

                            {/* Hover Inspect Ribbon */}
                            {!soldOut && (
                              <div className="absolute inset-x-0 bottom-0 translate-y-full border-t-2 border-ink bg-ink px-3 py-2 text-center font-mono text-[10px] font-bold tracking-[0.2em] text-paper uppercase transition-transform duration-200 group-hover:translate-y-0">
                                INSPECT &amp; CLAIM →
                              </div>
                            )}

                            {soldOut && (
                              <div className="absolute inset-0 flex items-center justify-center bg-paper/70">
                                <span className="border-2 border-ink bg-ink px-3 py-1 font-poster text-2xl tracking-wider text-paper uppercase">
                                  SOLD OUT
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-1 flex-col justify-between p-4">
                            <div>
                              <div className="flex items-center justify-between gap-2 font-mono text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
                                <span>{product.serialCode}</span>
                                <span>{product.gsmWeight}</span>
                              </div>
                              <h3 className="mt-1.5 font-poster text-2xl leading-[0.98] tracking-tight text-ink uppercase transition-colors group-hover:text-orange">
                                {product.title}
                              </h3>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t-2 border-ink/15 pt-3">
                              <span className="font-poster text-2xl leading-none text-ink">
                                {formatInr(product.priceInr)}
                              </span>
                              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold tracking-[0.16em] text-ink uppercase group-hover:text-orange">
                                CLAIM <ArrowUpRight className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </div>
                        </motion.article>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* CRISP HIGH-CONTRAST INSPECT & CLAIM MODAL                         */}
      {/* ================================================================= */}
      <AnimatePresence>
        {inspectedProduct && (
          <motion.div
            key="garment-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setInspectedProduct(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-3 backdrop-blur-[2px] sm:p-6"
          >
            <motion.div
              key={inspectedProduct._id}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative grid max-h-[90vh] w-full max-w-5xl grid-cols-1 overflow-y-auto border-2 border-ink bg-surface stamp-shadow md:grid-cols-12"
            >
              {/* Chunky Square Close Button */}
              <button
                type="button"
                aria-label="Close garment details"
                onClick={() => setInspectedProduct(null)}
                className="absolute top-3.5 right-3.5 z-20 flex h-10 w-10 cursor-pointer items-center justify-center border-2 border-ink bg-surface text-ink stamp-shadow-sm transition-colors hover:bg-orange hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Left: Full Studio Image */}
              <div className="relative aspect-[4/5] border-b-2 border-ink bg-stone md:col-span-6 md:aspect-auto md:min-h-[540px] md:border-r-2 md:border-b-0">
                <img
                  src={inspectedProduct.imageUrl}
                  alt={inspectedProduct.title}
                  className="h-full w-full object-cover"
                />

                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {inspectedProduct.tier === 'one-of-one' ? (
                    <span className="border-2 border-ink bg-orange px-3 py-1 font-mono text-[10px] font-bold tracking-[0.2em] text-white uppercase stamp-shadow-sm">
                      1 OF 1 · ONLY ONE IN THE WORLD
                    </span>
                  ) : (
                    <span className="border-2 border-ink bg-surface px-3 py-1 font-mono text-[10px] font-bold tracking-[0.18em] text-ink uppercase stamp-shadow-sm">
                      {inspectedProduct.remainingUnits}/
                      {inspectedProduct.totalUnits} LEFT
                    </span>
                  )}

                  {inspectedProduct.isMystery && (
                    <span className="border-2 border-ink bg-cobalt px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.16em] text-white uppercase">
                      UNVEILED
                    </span>
                  )}
                </div>
              </div>

              {/* Right: High-Contrast Specs & Claim Panel */}
              <div className="flex flex-col justify-between p-6 sm:p-8 md:col-span-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 pr-12 font-mono text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
                    <span className="text-ink">{inspectedProduct.serialCode}</span>
                    <span>/</span>
                    <span>{inspectedProduct.gsmWeight}</span>
                    {inspectedProduct.creatorCredit && (
                      <>
                        <span>/</span>
                        <span className="text-cobalt">
                          BY {inspectedProduct.creatorCredit}
                        </span>
                      </>
                    )}
                  </div>

                  <h2 className="mt-2.5 font-poster text-4xl leading-[0.94] tracking-tight text-ink uppercase sm:text-5xl">
                    {inspectedProduct.title}
                  </h2>

                  <p className="mt-3 font-poster text-3xl leading-none text-orange">
                    {formatInr(inspectedProduct.priceInr)}
                  </p>

                  <p className="mt-3.5 font-sans text-sm leading-relaxed text-muted">
                    {inspectedProduct.description}
                  </p>

                  {/* Compact Spec Grid */}
                  <div className="mt-5 grid grid-cols-2 gap-2.5">
                    <div className="border-2 border-ink bg-paper p-3">
                      <p className="font-mono text-[9px] font-bold tracking-[0.2em] text-muted uppercase">
                        FABRIC
                      </p>
                      <p className="mt-1 font-sans text-xs font-bold text-ink">
                        {inspectedProduct.fabric}
                      </p>
                    </div>
                    <div className="border-2 border-ink bg-paper p-3">
                      <p className="font-mono text-[9px] font-bold tracking-[0.2em] text-muted uppercase">
                        DISPATCH
                      </p>
                      <p className="mt-1 font-sans text-xs font-bold text-ink">
                        CUT TO ORDER · {inspectedProduct.productionDays || 10} DAYS
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {inspectedProduct.craftsmanship.map((item) => (
                      <span
                        key={item}
                        className="border border-ink bg-stone px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.12em] text-ink uppercase"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  {/* Size Pills */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between font-mono text-[10px] font-bold tracking-[0.2em] uppercase">
                      <span className="text-ink">SELECT SIZE</span>
                      <span className="text-muted">BOXY STREET FIT</span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {(inspectedProduct.sizes.length > 0
                        ? inspectedProduct.sizes
                        : ['One Size']
                      ).map((size) => {
                        const isSelected = selectedSize === size;
                        return (
                          <motion.button
                            key={size}
                            whileTap={{ scale: 0.94 }}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            className={cn(
                              'min-w-[54px] cursor-pointer border-2 border-ink px-4 py-2.5 font-mono text-xs font-bold uppercase transition-colors',
                              isSelected
                                ? 'bg-ink text-paper stamp-shadow-sm'
                                : 'bg-surface text-ink hover:bg-stone'
                            )}
                          >
                            {size}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {bagError && (
                    <p className="mt-3 font-mono text-[11px] font-bold text-orange uppercase">
                      {bagError}
                    </p>
                  )}
                </div>

                {/* Tactile CLAIM PIECE CTA */}
                <div className="mt-7 border-t-2 border-ink pt-5">
                  <motion.button
                    whileHover={
                      inspectedProduct.remainingUnits > 0
                        ? { x: -2, y: -2 }
                        : undefined
                    }
                    whileTap={
                      inspectedProduct.remainingUnits > 0
                        ? { x: 2, y: 2 }
                        : undefined
                    }
                    type="button"
                    disabled={inspectedProduct.remainingUnits <= 0}
                    onClick={handleClaimPiece}
                    className="flex w-full cursor-pointer items-center justify-center gap-2.5 border-2 border-ink bg-orange px-6 py-4 font-mono text-xs font-bold tracking-[0.18em] text-white uppercase stamp-shadow-sm transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:bg-stone disabled:text-muted disabled:shadow-none sm:text-sm"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>
                      {inspectedProduct.remainingUnits <= 0
                        ? 'EDITION SOLD OUT'
                        : `CLAIM PIECE — ${formatInr(inspectedProduct.priceInr)}`}
                    </span>
                  </motion.button>

                  <p className="mt-3 flex items-center justify-center gap-1.5 font-mono text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
                    <Check className="h-3.5 w-3.5 text-ink" />
                    <span>HAND-NUMBERED LABEL · 10-MIN BAG HOLD</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
