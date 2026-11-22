"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Clock,
  Eye,
  Lock,
  RotateCcw,
  Scissors,
  Sparkles,
  Unlock,
  X,
} from "lucide-react";
import { useVault } from "@/context/VaultContext";
import type { Product } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";

export interface V4ScratchBoardProps {
  products: Product[];
  onInspectProduct: (p: Product) => void;
}

export interface V4ClaimModalProps {
  product: Product | null;
  onClose: () => void;
}

type FilterMode = "all" | "clippings" | "sealed" | "one-of-one";

const CANVAS_W = 420;
const CANVAS_H = 520;

interface ScratchOffCardProps {
  product: Product;
  tiltClass: string;
}

function ScratchOffCard({ product, tiltClass }: ScratchOffCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastCalcTimeRef = useRef<number>(0);

  const [scratchedPct, setScratchedPct] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  const paintFoil = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Metallic silver foil base gradient
    const grad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
    grad.addColorStop(0, "#D4D1C9");
    grad.addColorStop(0.28, "#B8B4AC");
    grad.addColorStop(0.52, "#DFDCD4");
    grad.addColorStop(0.76, "#AEAAA1");
    grad.addColorStop(1, "#C9C6BE");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Diagonal metallic sheen stripes
    ctx.save();
    for (let i = -CANVAS_H; i < CANVAS_W + CANVAS_H; i += 22) {
      ctx.fillStyle =
        i % 44 === 0 ? "rgba(255,255,255,0.22)" : "rgba(10,10,10,0.045)";
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 10, 0);
      ctx.lineTo(i - 160, CANVAS_H);
      ctx.lineTo(i - 170, CANVAS_H);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Subtle deterministic foil micro-grain speckles
    ctx.save();
    for (let y = 6; y < CANVAS_H; y += 12) {
      for (let x = 6; x < CANVAS_W; x += 12) {
        const hash = ((x * 37 + y * 17) ^ (x * y)) & 15;
        if (hash < 4) {
          ctx.fillStyle = "rgba(255,255,255,0.16)";
          ctx.fillRect(x, y, 2, 2);
        } else if (hash > 12) {
          ctx.fillStyle = "rgba(10,10,10,0.08)";
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
    ctx.restore();

    // Double-rule stamped foil border
    ctx.strokeStyle = "rgba(10,10,10,0.45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, CANVAS_W - 28, CANVAS_H - 28);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, CANVAS_W - 40, CANVAS_H - 40);

    // Center stamped foil callout
    ctx.fillStyle = "rgba(10,10,10,0.82)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "700 13px monospace";
    ctx.fillText(`FOIL-SEALED ARCHIVE · ${product.serialCode}`, CANVAS_W / 2, 84);

    // Decorative dashed scratch zone badge
    ctx.save();
    ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
    ctx.rotate(-0.06);
    ctx.fillStyle = "rgba(245,239,224,0.85)";
    ctx.fillRect(-142, -48, 284, 96);
    ctx.strokeStyle = "#0A0A0A";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-142, -48, 284, 96);

    ctx.fillStyle = "#0A0A0A";
    ctx.font = "900 22px sans-serif";
    ctx.fillText("SCRATCH FOIL TO PEEK", 0, -10);

    ctx.fillStyle = "#E6007A";
    ctx.font = "700 12px monospace";
    ctx.fillText("DRAG POINTER OR FINGER HERE", 0, 20);
    ctx.restore();

    ctx.fillStyle = "rgba(10,10,10,0.65)";
    ctx.font = "700 11px monospace";
    ctx.fillText(
      product.tier === "one-of-one" ? "EDITION: 1 OF 1" : `EDITION: ${product.totalUnits} UNITS`,
      CANVAS_W / 2,
      CANVAS_H - 52
    );

    setScratchedPct(0);
    setHasInteracted(false);
  }, [product.serialCode, product.tier, product.totalUnits]);

  useEffect(() => {
    paintFoil();
  }, [paintFoil]);

  const computeScratchedPercent = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const { data } = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    let transparent = 0;
    let sampled = 0;
    // Sample every 10th pixel in both dimensions for instant 60fps feedback
    for (let y = 0; y < CANVAS_H; y += 10) {
      for (let x = 0; x < CANVAS_W; x += 10) {
        const alpha = data[(y * CANVAS_W + x) * 4 + 3];
        sampled += 1;
        if (alpha < 40) {
          transparent += 1;
        }
      }
    }
    const pct = sampled > 0 ? Math.min(100, Math.round((transparent / sampled) * 100)) : 0;
    setScratchedPct(pct);
  }, []);

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  };

  const eraseAt = (pt: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 54;
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.fillStyle = "rgba(0,0,0,1)";

    if (lastPointRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 27, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    lastPointRef.current = pt;

    const now = performance.now();
    if (now - lastCalcTimeRef.current > 110) {
      lastCalcTimeRef.current = now;
      computeScratchedPercent();
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    setHasInteracted(true);
    const pt = getCanvasPoint(e);
    if (pt) {
      lastPointRef.current = pt;
      eraseAt(pt);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const pt = getCanvasPoint(e);
    if (pt) {
      eraseAt(pt);
    }
  };

  const handlePointerEnd = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;
    computeScratchedPercent();
  };

  const underImage = product.silhouetteUrl || "/images/look-mystery-veil.jpg";

  return (
    <article
      className={cn(
        "group relative flex flex-col border-2 border-ink bg-white p-3 shadow-[6px_6px_0px_rgba(10,10,10,0.14)] transition-transform duration-300 hover:rotate-0",
        tiltClass
      )}
    >
      {/* Translucent Masking Tape Pin */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-3 left-1/2 z-20 h-6 w-24 -translate-x-1/2 -rotate-2 border border-ink/15 bg-[#EFE7D1]/85 shadow-sm backdrop-blur-[1px]"
      />

      {/* Top Foil Card Stamp Header */}
      <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
        <span className="inline-flex items-center gap-1 text-ink">
          <Lock className="h-3 w-3 text-riso" />
          {product.serialCode}
        </span>
        <span
          className={cn(
            "border border-ink px-1.5 py-0.5 text-[9px] font-extrabold",
            product.tier === "one-of-one"
              ? "bg-riso text-white"
              : "bg-ochre text-ink"
          )}
        >
          {product.tier === "one-of-one" ? "1 OF 1 · SEALED" : "FOIL SEALED"}
        </span>
      </div>

      {/* Scratch-Off Layered Window */}
      <div className="relative aspect-[4/5] w-full overflow-hidden border-2 border-ink bg-newsprint select-none">
        {/* UNDERNEATH LAYER — Mystery Veil Silhouette + Riso Stamp */}
        <img
          src={underImage}
          alt={`Sealed silhouette ${product.serialCode}`}
          className="h-full w-full object-cover object-center"
          draggable={false}
        />

        {/* Underneath archival ink tint + sealed stamp */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between bg-ink/25 p-3">
          <div className="flex items-center justify-between">
            <span className="border border-ink bg-newsprint px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink">
              {product.serialCode}
            </span>
            <span className="border border-ink bg-ochre px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-ink">
              {product.gsmWeight}
            </span>
          </div>

          <div className="my-auto flex flex-col items-center text-center">
            <div className="-rotate-3 border-2 border-ink bg-riso px-3 py-2 font-mono text-[10px] font-extrabold uppercase leading-snug tracking-[0.14em] text-white shadow-[3px_3px_0px_#0A0A0A]">
              SEALED — CLEAR WAITLIST TO UNLOCK FULL PIECE
            </div>
          </div>

          <div className="border border-ink bg-white/95 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-ink">
            <span>MYSTERY CUT · </span>
            <span className="text-riso">WAITLIST KEY REQUIRED</span>
          </div>
        </div>

        {/* REAL INTERACTIVE HTML5 METALLIC SILVER SCRATCH-OFF CANVAS */}
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          aria-label={`Scratch metallic silver foil on ${product.serialCode} to peek`}
          className="absolute inset-0 z-10 h-full w-full touch-none cursor-crosshair"
        />
      </div>

      {/* Scratch Progress & Action Footer */}
      <div className="mt-3 flex flex-col gap-2.5 pt-1">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-editorial text-xl italic leading-tight text-ink">
              Sealed Vault Specimen
            </h3>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/60">
              {hasInteracted ? "FOIL RUBBED · PEEK ACTIVE" : "SCRATCH SILVER FOIL ABOVE"}
            </p>
          </div>
          <span className="font-mono text-xs font-extrabold text-riso">
            {scratchedPct}%
          </span>
        </div>

        {/* Tiny Riso Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden border border-ink/30 bg-manila">
          <div
            className="h-full bg-riso transition-all duration-150"
            style={{ width: `${scratchedPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-ink/20 pt-2">
          <button
            type="button"
            suppressHydrationWarning
            onClick={paintFoil}
            className="inline-flex items-center gap-1 border border-ink/40 bg-newsprint px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-ink hover:border-ink hover:bg-ink hover:text-newsprint transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>RESET FOIL</span>
          </button>

          <a
            href="#stamp-card"
            className="inline-flex items-center gap-1 font-mono text-[10px] font-extrabold uppercase tracking-[0.12em] text-riso hover:underline"
          >
            <span>UNLOCK PIECE →</span>
          </a>
        </div>
      </div>
    </article>
  );
}

export function V4ScratchBoard({
  products,
  onInspectProduct,
}: V4ScratchBoardProps) {
  const { isVaultUnlocked } = useVault();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  const vaultOpen = mounted && isVaultUnlocked;

  const counts = useMemo(() => {
    const clippings = products.filter((p) => !p.isMystery).length;
    const sealed = products.filter((p) => p.isMystery).length;
    const oneOfOne = products.filter((p) => p.tier === "one-of-one").length;
    return {
      all: products.length,
      clippings,
      sealed,
      oneOfOne,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    switch (filter) {
      case "clippings":
        return products.filter((p) => !p.isMystery);
      case "sealed":
        return products.filter((p) => p.isMystery);
      case "one-of-one":
        return products.filter((p) => p.tier === "one-of-one");
      default:
        return products;
    }
  }, [filter, products]);

  const filterOptions: Array<{ id: FilterMode; label: string }> = [
    { id: "all", label: `ALL ${counts.all}` },
    { id: "clippings", label: `CLIPPINGS ${counts.clippings}` },
    { id: "sealed", label: `FOIL SEALED ${counts.sealed}` },
    { id: "one-of-one", label: `1-OF-1 (${counts.oneOfOne})` },
  ];

  return (
    <section
      id="scratch"
      className="relative border-b-2 border-ink bg-manila/60 py-20 text-ink"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Broadsheet Section Header */}
        <div className="flex flex-col gap-6 border-b-2 border-ink pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 border border-ink bg-white px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink">
              <Scissors className="h-3.5 w-3.5 text-riso" />
              <span>SECTION 02 · PINNED CLIPPINGS & SCRATCH FOIL</span>
            </div>

            <h2 className="mt-4 font-poster text-5xl sm:text-7xl uppercase leading-[0.9] tracking-tight text-ink">
              SCRATCH TO PEEK.
            </h2>

            <p className="mt-2 font-editorial text-2xl sm:text-3xl italic text-ink/85">
              Five printed clippings. Five foil-sealed mystery cuts.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {filterOptions.map((opt) => {
              const active = filter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setFilter(opt.id)}
                  className={cn(
                    "border-2 border-ink px-3.5 py-2 font-mono text-[11px] font-extrabold uppercase tracking-[0.14em] transition-all cursor-pointer",
                    active
                      ? "bg-ink text-newsprint shadow-[3px_3px_0px_#E6007A]"
                      : "bg-white text-ink hover:bg-ochre"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Vault Unsealed Banner */}
        {vaultOpen && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-riso px-4 py-3 text-white shadow-[4px_4px_0px_#0A0A0A]">
            <div className="flex items-center gap-2.5 font-mono text-xs font-extrabold uppercase tracking-[0.14em]">
              <Unlock className="h-4 w-4" />
              <span>
                VAULT UNSEALED ✓ — ALL 5 METALLIC FOIL SEALS LIFTED. FULL DROP READY TO CLAIM.
              </span>
            </div>
            <span className="border border-white/60 bg-ink/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em]">
              PRIORITY ACCESS ACTIVE
            </span>
          </div>
        )}

        {/* Archive Board Grid */}
        <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product, idx) => {
            const tiltClass =
              idx % 2 === 0 ? "-rotate-[1deg]" : "rotate-[1deg]";
            const isSealed = product.isMystery && !vaultOpen;

            if (isSealed) {
              return (
                <ScratchOffCard
                  key={product._id}
                  product={product}
                  tiltClass={tiltClass}
                />
              );
            }

            const isUnsealedMystery = product.isMystery && vaultOpen;
            const isOneOfOne = product.tier === "one-of-one";

            return (
              <article
                key={product._id}
                onClick={() => onInspectProduct(product)}
                className={cn(
                  "group relative flex cursor-pointer flex-col border-2 border-ink bg-white p-3 shadow-[6px_6px_0px_rgba(10,10,10,0.14)] transition-all duration-300 hover:rotate-0 hover:-translate-y-1 hover:shadow-[8px_8px_0px_#0A0A0A]",
                  tiltClass
                )}
              >
                {/* Translucent Masking Tape Strip at Top Center */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-3 left-1/2 z-20 h-6 w-24 -translate-x-1/2 rotate-1 border border-ink/15 bg-[#EFE7D1]/85 shadow-sm backdrop-blur-[1px]"
                />

                {/* Top Ledger Row */}
                <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink/75">
                  <span>{product.serialCode}</span>
                  <span>{product.gsmWeight}</span>
                </div>

                {/* Printed Photo Clipping */}
                <div className="relative aspect-[4/5] w-full overflow-hidden border-2 border-ink bg-newsprint">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
                  />

                  {/* Corner Riso / Ochre Edition Stamp */}
                  <div
                    className={cn(
                      "absolute right-2.5 top-2.5 border-2 border-ink px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.14em] shadow-[2px_2px_0px_#0A0A0A]",
                      isOneOfOne
                        ? "-rotate-3 bg-riso text-white"
                        : "rotate-2 bg-ochre text-ink"
                    )}
                  >
                    {isOneOfOne
                      ? "1 OF 1"
                      : `${product.remainingUnits}/${product.totalUnits} LEFT`}
                  </div>

                  {/* Unsealed Stamp when Vault Unlocked */}
                  {isUnsealedMystery && (
                    <div className="absolute left-2.5 top-2.5 -rotate-2 border-2 border-ink bg-riso px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.14em] text-white shadow-[2px_2px_0px_#0A0A0A]">
                      UNSEALED ✓
                    </div>
                  )}

                  {/* Quick Hover Inspect Tag */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between border border-ink bg-white/95 px-2.5 py-1.5 opacity-95 transition-colors group-hover:bg-ink group-hover:text-newsprint">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
                      OPEN CLIPPING SPEC
                    </span>
                    <Eye className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Clipping Caption & Price */}
                <div className="mt-3 flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="font-editorial text-2xl leading-tight text-ink group-hover:text-riso transition-colors">
                      {product.title}
                    </h3>
                    <p className="mt-1 line-clamp-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink/65">
                      {product.fabric}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-ink/20 pt-2.5">
                    <span className="font-mono text-base font-extrabold text-ink">
                      {formatInr(product.priceInr)}
                    </span>

                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectProduct(product);
                      }}
                      className="border border-ink bg-newsprint px-2.5 py-1 font-mono text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink transition-colors group-hover:bg-riso group-hover:text-white cursor-pointer"
                    >
                      CLAIM PIECE →
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function V4ClaimModal({ product, onClose }: V4ClaimModalProps) {
  const { addToCart, setCartOpen } = useVault();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0] ?? "FREE");
      setFeedback(null);
    }
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [product, onClose]);

  const handleClaim = () => {
    if (!product) return;
    const sizeToClaim = selectedSize || product.sizes[0] || "FREE";
    const result = addToCart(product, sizeToClaim);
    if (!result.ok) {
      setFeedback(result.message || "Unable to reserve this piece right now.");
      return;
    }
    setCartOpen(true);
    onClose();
  };

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label={`Archive spec sheet for ${product.title}`}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto border-2 border-ink bg-newsprint text-ink shadow-[10px_10px_0px_#0A0A0A]"
          >
            {/* Broadsheet Top Press Strip */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-ink bg-manila px-4 py-3 sm:px-6">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em]">
                <span className="border border-ink bg-riso px-2 py-0.5 text-white">
                  CLIPPING SPEC SHEET
                </span>
                <span>{product.serialCode}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {product.tier === "one-of-one"
                    ? "1-OF-1 COLLECTOR ARCHIVE"
                    : `SMALL BATCH (${product.remainingUnits}/${product.totalUnits} LEFT)`}
                </span>
              </div>

              <button
                type="button"
                suppressHydrationWarning
                onClick={onClose}
                aria-label="Close spec modal"
                className="inline-flex items-center gap-1 border-2 border-ink bg-white px-2.5 py-1 font-mono text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink hover:bg-ink hover:text-newsprint transition-colors cursor-pointer"
              >
                <span>CLOSE</span>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Two-Column Printed Broadsheet Spec Body */}
            <div className="grid grid-cols-1 md:grid-cols-12">
              {/* Left Pinned Garment Photograph */}
              <div className="border-b-2 border-ink md:col-span-5 md:border-b-0 md:border-r-2 bg-white p-5 sm:p-6">
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-2.5 left-1/2 z-10 h-5 w-20 -translate-x-1/2 -rotate-2 border border-ink/15 bg-[#EFE7D1]/85 shadow-sm"
                  />
                  <div className="relative aspect-[4/5] w-full overflow-hidden border-2 border-ink bg-newsprint">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="h-full w-full object-cover object-center"
                    />
                    <div
                      className={cn(
                        "absolute right-2.5 top-2.5 border-2 border-ink px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.14em] shadow-[2px_2px_0px_#0A0A0A]",
                        product.tier === "one-of-one"
                          ? "-rotate-2 bg-riso text-white"
                          : "rotate-2 bg-ochre text-ink"
                      )}
                    >
                      {product.tier === "one-of-one"
                        ? "1 OF 1"
                        : `${product.remainingUnits}/${product.totalUnits} LEFT`}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border border-ink/30 bg-newsprint px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em]">
                  <span className="inline-flex items-center gap-1.5 text-ink/75">
                    <Clock className="h-3.5 w-3.5 text-riso" />
                    ATELIER FINISH
                  </span>
                  <span className="font-bold text-ink">
                    {product.productionDays} DAYS · PAN-INDIA
                  </span>
                </div>
              </div>

              {/* Right Broadsheet Specs & Claim Ledger */}
              <div className="flex flex-col justify-between p-5 sm:p-7 md:col-span-7">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-riso">
                        {product.creatorCredit
                          ? `DESIGNED WITH ${product.creatorCredit.toUpperCase()}`
                          : "KNITX ARCHIVE PRESS · ISSUE 001"}
                      </p>
                      <h3 className="mt-1 font-editorial text-3xl sm:text-4xl leading-[1.02] text-ink">
                        {product.title}
                      </h3>
                    </div>

                    <div className="border-2 border-ink bg-white px-3 py-1.5 text-right shadow-[3px_3px_0px_#0A0A0A]">
                      <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink/60">
                        ARCHIVE PRICE
                      </div>
                      <div className="font-mono text-lg font-extrabold text-ink">
                        {formatInr(product.priceInr)}
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 border-y border-ink/20 py-3.5 font-sans text-sm leading-relaxed text-ink/85">
                    {product.description}
                  </p>

                  {/* Fabric & GSM Spec Table */}
                  <div className="mt-4 grid grid-cols-2 gap-2.5 font-mono text-[11px]">
                    <div className="border border-ink/25 bg-white p-2.5">
                      <div className="text-[9px] uppercase tracking-[0.14em] text-ink/55">
                        FABRIC WEIGHT
                      </div>
                      <div className="mt-0.5 font-bold text-ink">
                        {product.gsmWeight}
                      </div>
                    </div>
                    <div className="border border-ink/25 bg-white p-2.5">
                      <div className="text-[9px] uppercase tracking-[0.14em] text-ink/55">
                        COMPOSITION
                      </div>
                      <div className="mt-0.5 font-bold text-ink">
                        {product.fabric}
                      </div>
                    </div>
                  </div>

                  {/* Craftsmanship Notes */}
                  {product.craftsmanship.length > 0 && (
                    <div className="mt-4">
                      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink/65">
                        ATELIER CONSTRUCTION NOTES
                      </div>
                      <ul className="mt-2 space-y-1.5">
                        {product.craftsmanship.map((note) => (
                          <li
                            key={note}
                            className="flex items-start gap-2 font-sans text-xs sm:text-sm text-ink/85"
                          >
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-riso" />
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Size Selector */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink/70">
                      <span>SELECT SIZE CUT</span>
                      <span>SELECTED: {selectedSize || "FREE"}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {product.sizes.map((size) => {
                        const active = selectedSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            suppressHydrationWarning
                            onClick={() => {
                              setSelectedSize(size);
                              setFeedback(null);
                            }}
                            className={cn(
                              "min-w-[52px] border-2 border-ink px-3 py-2 font-mono text-xs font-extrabold uppercase tracking-[0.12em] transition-all cursor-pointer",
                              active
                                ? "bg-ink text-newsprint shadow-[3px_3px_0px_#E6007A]"
                                : "bg-white text-ink hover:bg-ochre"
                            )}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {feedback && (
                    <div className="mt-4 border-2 border-riso bg-white px-3 py-2 font-mono text-[11px] font-bold text-riso">
                      {feedback}
                    </div>
                  )}
                </div>

                {/* Primary Risograph Magenta Claim CTA */}
                <div className="mt-6 border-t-2 border-ink pt-4">
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={handleClaim}
                    disabled={product.remainingUnits <= 0}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 border-2 border-ink px-5 py-3.5 font-mono text-xs sm:text-sm font-extrabold uppercase tracking-[0.16em] transition-all cursor-pointer",
                      product.remainingUnits <= 0
                        ? "bg-manila text-ink/50 cursor-not-allowed"
                        : "bg-riso text-white shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#0A0A0A]"
                    )}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>
                      {product.remainingUnits <= 0
                        ? "ARCHIVED · SOLD OUT"
                        : `CLAIM PIECE — ${formatInr(product.priceInr)}`}
                    </span>
                  </button>

                  <p className="mt-2.5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60">
                    10-MINUTE ARCHIVE HOLD · NUMBERED EDITION · PAN-INDIA DISPATCH
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
