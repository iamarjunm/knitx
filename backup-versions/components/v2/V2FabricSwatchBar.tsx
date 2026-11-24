"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowUpRight, Search } from "lucide-react";

type AccentTone = "klein" | "red";

interface FabricSwatch {
  id: string;
  code: string;
  gsm: number;
  gsmLabel: string;
  name: string;
  category: string;
  summary: string;
  editorialNote: string;
  weaveType: string;
  yarnSpec: string;
  batchLimit: string;
  shrinkageNote: string;
  cutWindow: string;
  tierLabel: string;
  accent: AccentTone;
  fanAngle: number;
  dropTags: string[];
  weaveStyle: CSSProperties;
  zoomOverlayStyle: CSSProperties;
}

const SWATCHES: FabricSwatch[] = [
  {
    id: "diagonal-loopback-terry",
    code: "SW-01",
    gsm: 420,
    gsmLabel: "420 GSM",
    name: "Diagonal Loopback Terry",
    category: "Small-Batch Hoodies",
    summary: "Dry architectural handfeel, zero-shrink double enzyme wash",
    editorialNote:
      "Knitted on slow circular machines for a crisp exterior twill ridge and breathable unbrushed loopback interior that holds sculpted shoulder volume.",
    weaveType: "DIAGONAL FRENCH TERRY · 3-END LOOPBACK",
    yarnSpec: "100% COMBED RING-SPUN COTTON · 20s / 10s",
    batchLimit: "3–4 UNITS",
    shrinkageNote: "DOUBLE ENZYME WASHED",
    cutWindow: "7 DAYS · POST-CLAIM",
    tierLabel: "SMALL BATCH",
    accent: "klein",
    fanAngle: -1.4,
    dropTags: ["DROP 01 · KTX-01 HOODIE", "DROP 01 · KTX-02 ARCHIVE PULLOVER"],
    weaveStyle: {
      backgroundColor: "#ECE8DF",
      backgroundImage: [
        "repeating-linear-gradient(135deg, rgba(10,10,10,0.085) 0px, rgba(10,10,10,0.085) 1.5px, transparent 1.5px, transparent 5px)",
        "repeating-linear-gradient(135deg, rgba(255,255,255,0.68) 1.5px, rgba(255,255,255,0.68) 3px, transparent 3px, transparent 5px)",
        "repeating-linear-gradient(0deg, rgba(10,10,10,0.045) 0px, rgba(10,10,10,0.045) 1px, transparent 1px, transparent 4px)",
        "radial-gradient(circle at 22% 18%, rgba(255,255,255,0.52), transparent 64%)",
      ].join(", "),
    },
    zoomOverlayStyle: {
      backgroundImage:
        "repeating-linear-gradient(45deg, rgba(0,43,255,0.06) 0px, rgba(0,43,255,0.06) 1px, transparent 1px, transparent 7px)",
    },
  },
  {
    id: "heavy-dry-combed-jersey",
    code: "SW-02",
    gsm: 340,
    gsmLabel: "340 GSM",
    name: "Heavy Dry Combed Jersey",
    category: "Small-Batch Tees",
    summary: "High-tension 3.5cm rib collar, dense matte knit",
    editorialNote:
      "Tightly spun dry-hand single jersey engineered to stand off the body without clinging, finished with a locked 3.5cm ribbed neckband.",
    weaveType: "HIGH-TENSION SINGLE JERSEY · MATTE WALE",
    yarnSpec: "100% OPEN-END DRY COTTON · 16s SINGLES",
    batchLimit: "3–4 UNITS",
    shrinkageNote: "PRE-COMPACTED KNIT",
    cutWindow: "5 DAYS · POST-CLAIM",
    tierLabel: "SMALL BATCH",
    accent: "klein",
    fanAngle: 0.9,
    dropTags: ["DROP 01 · KTX-03 BOXY TEE", "DROP 01 · KTX-04 STUDIO SPECIMEN TEE"],
    weaveStyle: {
      backgroundColor: "#F3F1EB",
      backgroundImage: [
        "repeating-linear-gradient(90deg, rgba(10,10,10,0.07) 0px, rgba(10,10,10,0.07) 1px, rgba(255,255,255,0.62) 1px, rgba(255,255,255,0.62) 2px, transparent 2px, transparent 3.5px)",
        "repeating-linear-gradient(0deg, rgba(10,10,10,0.04) 0px, rgba(10,10,10,0.04) 1px, transparent 1px, transparent 3px)",
        "linear-gradient(125deg, rgba(255,255,255,0.48) 0%, transparent 50%, rgba(10,10,10,0.04) 100%)",
      ].join(", "),
    },
    zoomOverlayStyle: {
      backgroundImage:
        "repeating-linear-gradient(90deg, rgba(0,43,255,0.05) 0px, rgba(0,43,255,0.05) 1px, transparent 1px, transparent 4px)",
    },
  },
  {
    id: "waxed-archive-canvas",
    code: "SW-03",
    gsm: 480,
    gsmLabel: "480 GSM",
    name: "Waxed Archive Canvas",
    category: "One-of-One Outerwear",
    summary: "Weather-resistant patina, hand-painted volcanic brushwork",
    editorialNote:
      "Dense basketweave duck canvas cold-cured with dry micro-wax so every crease records wear, finished by hand with singular pigment strokes.",
    weaveType: "ORTHOGONAL DUCK CANVAS · WAXED FINISH",
    yarnSpec: "2-PLY TWISTED COTTON WARP · HAND-BRUSHED",
    batchLimit: "1 OF 1 · ARCHIVE",
    shrinkageNote: "HEAT-CURED WAX SEAL",
    cutWindow: "14 DAYS · HAND FINISHED",
    tierLabel: "ONE-OF-ONE",
    accent: "red",
    fanAngle: -0.8,
    dropTags: ["DROP 01 · 1/1 FIELD JACKET", "ARCHIVE SEAL · NUMBERED 01/01"],
    weaveStyle: {
      backgroundColor: "#DEDAD0",
      backgroundImage: [
        "repeating-linear-gradient(0deg, rgba(10,10,10,0.095) 0px, rgba(10,10,10,0.095) 1px, transparent 1px, transparent 4px)",
        "repeating-linear-gradient(90deg, rgba(10,10,10,0.095) 0px, rgba(10,10,10,0.095) 1px, transparent 1px, transparent 4px)",
        "repeating-linear-gradient(0deg, rgba(255,255,255,0.38) 2px, rgba(255,255,255,0.38) 3px, transparent 3px, transparent 8px)",
        "radial-gradient(ellipse at 74% 32%, rgba(10,10,10,0.13) 0%, transparent 52%)",
        "linear-gradient(140deg, rgba(255,255,255,0.42) 0%, transparent 45%, rgba(10,10,10,0.08) 100%)",
      ].join(", "),
    },
    zoomOverlayStyle: {
      backgroundImage:
        "repeating-linear-gradient(0deg, rgba(225,29,46,0.05) 0px, rgba(225,29,46,0.05) 1px, transparent 1px, transparent 6px)",
    },
  },
  {
    id: "five-gauge-distressed-jacquard",
    code: "SW-04",
    gsm: 540,
    gsmLabel: "540 GSM",
    name: "5-Gauge Distressed Jacquard",
    category: "One-of-One Knitwear",
    summary: "Multi-ply combed cotton yarn, exposed linked seams",
    editorialNote:
      "Flatbed 5-gauge architectural knit featuring open diamond jacquard tension cells and raw exterior hand-linked seam ridges.",
    weaveType: "5-GAUGE JACQUARD · EXPOSED LINKING",
    yarnSpec: "6-PLY COMBED COTTON YARN · RAW SELVEDGE",
    batchLimit: "1 OF 1 · ARCHIVE",
    shrinkageNote: "STEAM-BLOCKED FLAT",
    cutWindow: "14 DAYS · HAND LINKED",
    tierLabel: "ONE-OF-ONE",
    accent: "red",
    fanAngle: 1.2,
    dropTags: ["DROP 01 · 1/1 JACQUARD KNIT", "ARCHIVE SEAL · NUMBERED 01/01"],
    weaveStyle: {
      backgroundColor: "#E4DFD4",
      backgroundImage: [
        "repeating-linear-gradient(60deg, rgba(10,10,10,0.1) 0px, rgba(10,10,10,0.1) 2px, transparent 2px, transparent 9px)",
        "repeating-linear-gradient(-60deg, rgba(10,10,10,0.1) 0px, rgba(10,10,10,0.1) 2px, transparent 2px, transparent 9px)",
        "repeating-linear-gradient(60deg, rgba(255,255,255,0.58) 2px, rgba(255,255,255,0.58) 4px, transparent 4px, transparent 9px)",
        "repeating-linear-gradient(90deg, rgba(10,10,10,0.06) 0px, rgba(10,10,10,0.06) 1.5px, transparent 1.5px, transparent 18px)",
        "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.46), transparent 65%)",
      ].join(", "),
    },
    zoomOverlayStyle: {
      backgroundImage:
        "repeating-linear-gradient(-60deg, rgba(225,29,46,0.055) 0px, rgba(225,29,46,0.055) 1px, transparent 1px, transparent 8px)",
    },
  },
];

const GSM_SCALE_MIN = 200;
const GSM_SCALE_MAX = 600;
const GSM_TICKS = [340, 420, 480, 540];
const LOUPE_SIZE = 148;
const LOUPE_RADIUS = LOUPE_SIZE / 2;
const LOUPE_ZOOM = 2.4;

function getGsmPercent(gsm: number): number {
  const clamped = Math.max(GSM_SCALE_MIN, Math.min(GSM_SCALE_MAX, gsm));
  return ((clamped - GSM_SCALE_MIN) / (GSM_SCALE_MAX - GSM_SCALE_MIN)) * 100;
}

function MetalBinderGrommet({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_1px_3px_rgba(10,10,10,0.18)]"
      style={{
        background:
          "conic-gradient(from 40deg, #E5E3DC 0deg, #9A9891 85deg, #F6F5F0 165deg, #7C7A73 255deg, #E5E3DC 360deg)",
      }}
    >
      {/* Brushed inner rim */}
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-ink/25 bg-linen shadow-[inset_0_2px_4px_rgba(10,10,10,0.22)]">
        {/* Binder ring wire clip arc */}
        <span
          className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${
            active ? "bg-klein" : "bg-ink/20"
          }`}
        />
      </span>
    </span>
  );
}

interface MacroWeaveLoupeProps {
  swatch: FabricSwatch;
  mounted: boolean;
}

function MacroWeaveLoupe({ swatch, mounted }: MacroWeaveLoupeProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({
    w: 560,
    h: 260,
  });
  const [readout, setReadout] = useState<{ xMm: number; yMm: number }>({
    xMm: 50,
    yMm: 50,
  });

  const cursorX = useMotionValue(280);
  const cursorY = useMotionValue(130);

  const smoothX = useSpring(cursorX, { stiffness: 420, damping: 36, mass: 0.35 });
  const smoothY = useSpring(cursorY, { stiffness: 420, damping: 36, mass: 0.35 });

  const loupeLeft = useTransform(smoothX, (v) => v - LOUPE_RADIUS);
  const loupeTop = useTransform(smoothY, (v) => v - LOUPE_RADIUS);
  const innerTranslateX = useTransform(smoothX, (v) => LOUPE_RADIUS - v * LOUPE_ZOOM);
  const innerTranslateY = useTransform(smoothY, (v) => LOUPE_RADIUS - v * LOUPE_ZOOM);

  useEffect(() => {
    if (!mounted) return;
    const node = stageRef.current;
    if (!node) return;

    const measure = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setStageSize({ w: rect.width, h: rect.height });
      }
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [mounted]);

  const updatePointer = (e: PointerEvent<HTMLDivElement>) => {
    const node = stageRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    if (
      Math.abs(rect.width - stageSize.w) > 2 ||
      Math.abs(rect.height - stageSize.h) > 2
    ) {
      setStageSize({ w: rect.width, h: rect.height });
    }

    cursorX.set(x);
    cursorY.set(y);

    const nextX = Math.round((x / Math.max(rect.width, 1)) * 100);
    const nextY = Math.round((y / Math.max(rect.height, 1)) * 60);
    setReadout((prev) =>
      prev.xMm === nextX && prev.yMm === nextY ? prev : { xMm: nextX, yMm: nextY }
    );
  };

  const handlePointerEnter = (e: PointerEvent<HTMLDivElement>) => {
    updatePointer(e);
    setIsInspecting(true);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isInspecting) setIsInspecting(true);
    updatePointer(e);
  };

  const handlePointerLeave = () => {
    setIsInspecting(false);
  };

  const accentBorder =
    swatch.accent === "red" ? "border-archive-red/60" : "border-klein/60";
  const accentText =
    swatch.accent === "red" ? "text-archive-red" : "text-klein";
  const accentBg = swatch.accent === "red" ? "bg-archive-red" : "bg-klein";

  return (
    <div
      ref={stageRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="group relative h-60 w-full cursor-crosshair overflow-hidden border border-ink/10 bg-porcelain select-none touch-none sm:h-68"
      style={swatch.weaveStyle}
      aria-label={`Interactive magnifying loupe preview for ${swatch.name}`}
    >
      {/* Subtle Woven Selvedge Stitch Frame */}
      <div className="pointer-events-none absolute inset-2.5 border border-dashed border-ink/15" />

      {/* Top-Left Weave Spec Tag */}
      <div className="pointer-events-none absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <span className="border border-ink/10 bg-white/90 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.18em] text-ink uppercase backdrop-blur-xs">
          {swatch.weaveType}
        </span>
      </div>

      {/* Top-Right Live Micrometer Coordinates */}
      <div className="pointer-events-none absolute top-4 right-4 z-10 hidden items-center gap-2 border border-ink/10 bg-white/90 px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-muted uppercase backdrop-blur-xs sm:flex">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${accentBg}`} />
        <span className="tabular-nums">
          X {String(readout.xMm).padStart(2, "0")}MM · Y{" "}
          {String(readout.yMm).padStart(2, "0")}MM
        </span>
      </div>

      {/* Resting Prompt Pill (fades cleanly while loupe is active) */}
      <motion.div
        animate={{
          opacity: isInspecting ? 0 : 1,
          scale: isInspecting ? 0.94 : 1,
        }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
      >
        <div className="flex items-center gap-2 border border-ink/15 bg-white/92 px-4 py-2 shadow-[0_10px_30px_rgba(10,10,10,0.08)] backdrop-blur-xs">
          <Search className={`h-3.5 w-3.5 ${accentText}`} />
          <span className="font-mono text-[10px] font-medium tracking-[0.2em] text-ink uppercase">
            HOVER OR DRAG TO INSPECT WEAVE · 2.4× LOUPE
          </span>
        </div>
      </motion.div>

      {/* Bottom Calibrated Millimeter Ruler Strip */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between border-t border-ink/10 bg-white/82 px-4 py-1.5 font-mono text-[9px] tracking-[0.16em] text-muted uppercase backdrop-blur-xs">
        <span>00 MM</span>
        <span>25 MM</span>
        <span className={accentText}>MACRO WEAVE FIELD · {swatch.gsmLabel}</span>
        <span>75 MM</span>
        <span>100 MM</span>
      </div>

      {/* Interactive Cursor-Following Circular Magnifying Loupe */}
      {mounted && (
        <motion.div
          aria-hidden="true"
          style={{
            width: LOUPE_SIZE,
            height: LOUPE_SIZE,
            x: loupeLeft,
            y: loupeTop,
          }}
          initial={false}
          animate={{
            opacity: isInspecting ? 1 : 0,
            scale: isInspecting ? 1 : 0.72,
          }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className={`pointer-events-none absolute top-0 left-0 z-20 overflow-hidden rounded-full border-2 ${accentBorder} bg-porcelain shadow-[0_18px_40px_rgba(10,10,10,0.22),inset_0_0_0_3px_rgba(255,255,255,0.85)]`}
        >
          {/* Zoomed 2.4x Weave Surface Aligned Mathematically to Cursor */}
          <motion.div
            style={{
              width: stageSize.w,
              height: stageSize.h,
              x: innerTranslateX,
              y: innerTranslateY,
              scale: LOUPE_ZOOM,
              transformOrigin: "0 0",
            }}
            className="absolute top-0 left-0 will-change-transform"
          >
            <div className="h-full w-full" style={swatch.weaveStyle}>
              {/* Fine yarn twist micro-overlay visible under magnification */}
              <div
                className="h-full w-full opacity-80"
                style={swatch.zoomOverlayStyle}
              />
            </div>
          </motion.div>

          {/* Optical Glass Highlight & Subtle Lens Vignette */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.34) 0%, transparent 48%, rgba(10,10,10,0.12) 100%)",
            }}
          />

          {/* Precision Reticle Crosshair */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-6 w-6">
              <span
                className={`absolute top-1/2 left-0 h-px w-full -translate-y-1/2 ${accentBg} opacity-70`}
              />
              <span
                className={`absolute top-0 left-1/2 h-full w-px -translate-x-1/2 ${accentBg} opacity-70`}
              />
              <span
                className={`absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border ${accentBorder} bg-white/90`}
              />
            </div>
          </div>

          {/* Loupe Rim Micro Badge */}
          <div className="absolute inset-x-0 bottom-2.5 flex justify-center">
            <span className="rounded-full border border-ink/15 bg-white/95 px-2 py-0.5 font-mono text-[8.5px] font-semibold tracking-[0.16em] text-ink uppercase shadow-xs">
              2.4× · {swatch.gsmLabel}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function V2FabricSwatchBar() {
  const [activeId, setActiveId] = useState<string>(SWATCHES[0].id);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeSwatch =
    SWATCHES.find((item) => item.id === activeId) ?? SWATCHES[0];
  const densityPct = getGsmPercent(activeSwatch.gsm);
  const isOneOfOne = activeSwatch.accent === "red";

  return (
    <section
      id="swatches"
      aria-label="KNITX Studio Fabric Swatch Archive"
      className="relative overflow-hidden border-y border-ink/10 bg-linen py-20 text-ink sm:py-28"
    >
      {/* Sunlit Studio Linen Table Lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 72% 55% at 24% 12%, rgba(255,255,255,0.78) 0%, rgba(251,251,249,0.22) 55%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        {/* Editorial Section Header */}
        <div className="mb-12 flex flex-col gap-6 border-b border-ink/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3 font-mono text-[11px] tracking-[0.22em] uppercase">
              <span className="inline-flex items-center gap-2 text-klein">
                <span className="h-1.5 w-1.5 rounded-full bg-klein" />
                MATERIAL ARCHIVE · 04 SWATCHES
              </span>
              <span className="text-ink/25">·</span>
              <span className="text-muted">TACTILE GSM LOUPE</span>
            </div>

            <h2 className="flex flex-wrap items-baseline gap-x-3.5 text-4xl leading-[0.95] tracking-[-0.04em] text-ink sm:text-5xl lg:text-6xl">
              <span className="font-syne font-extrabold uppercase">
                Studio Swatch
              </span>
              <span className="font-editorial font-normal italic">
                Specimen Book
              </span>
            </h2>
          </div>

          <p className="max-w-md font-sans text-sm leading-relaxed text-muted sm:text-[15px]">
            Every Drop 01 garment begins on the cutting table as uncompromised
            heavyweight cloth. Clip through the four studio fabrics below and
            glide the optical loupe to inspect weave density before claiming.
          </p>
        </div>

        {/* Main Sunlit Desk Spread: Clipped Swatch Book + Detailed Studio Spec Sheet */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Column: Physical Clipped Fabric Swatch Book (4 Fanned Cards) */}
          <div className="lg:col-span-5">
            <div className="mb-4 flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
              <span>CLIPPED FABRIC CARDS · RING BOUND</span>
              <span>340 — 540 GSM</span>
            </div>

            {/* 4 Fanned Physical Fabric Swatch Cards */}
            <div
              role="tablist"
              aria-label="Fabric Swatches"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              {SWATCHES.map((swatch) => {
                const isSelected = swatch.id === activeSwatch.id;
                const accentPill =
                  swatch.accent === "red"
                    ? "text-archive-red bg-archive-red/8 border-archive-red/25"
                    : "text-klein bg-klein/8 border-klein/25";
                const activeClipBg =
                  swatch.accent === "red" ? "bg-archive-red" : "bg-klein";

                return (
                  <motion.button
                    key={swatch.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    aria-controls="v2-swatch-spec-sheet"
                    onClick={() => setActiveId(swatch.id)}
                    initial={false}
                    animate={{
                      rotate: isSelected ? 0 : swatch.fanAngle,
                      y: isSelected ? -4 : 0,
                    }}
                    whileHover={{ rotate: 0, y: -5 }}
                    transition={{
                      type: "spring",
                      stiffness: 360,
                      damping: 28,
                    }}
                    className={`group relative flex flex-col overflow-hidden border text-left transition-shadow duration-300 focus-visible:ring-2 focus-visible:ring-klein focus-visible:outline-none ${
                      isSelected
                        ? "z-10 border-ink/35 bg-white shadow-[0_18px_38px_rgba(10,10,10,0.11)]"
                        : "border-ink/12 bg-porcelain shadow-[0_6px_18px_rgba(10,10,10,0.05)] hover:border-ink/25 hover:bg-white"
                    }`}
                  >
                    {/* Active Layout-Animated Archival Tab Accent Bar */}
                    {isSelected && (
                      <motion.span
                        layoutId="v2-active-swatch-bar"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 32,
                        }}
                        className={`absolute inset-x-0 top-0 h-[3px] ${activeClipBg}`}
                      />
                    )}

                    {/* Card Top Header with Metal Binder Grommet Ring */}
                    <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
                      <div className="flex items-center gap-2.5">
                        <MetalBinderGrommet active={isSelected} />
                        <span className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
                          {swatch.code}
                        </span>
                      </div>

                      <span
                        className={`border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase ${accentPill}`}
                      >
                        {swatch.gsmLabel}
                      </span>
                    </div>

                    {/* Clipped Tactile Fabric Swatch Patch Window */}
                    <div className="px-4">
                      <div
                        className="relative h-24 w-full overflow-hidden border border-ink/12 transition-transform duration-300 group-hover:scale-[1.01]"
                        style={swatch.weaveStyle}
                      >
                        {/* Stitched Selvedge Cut Border */}
                        <div className="pointer-events-none absolute inset-1.5 border border-dashed border-ink/18" />

                        {/* Specimen Corner Index */}
                        <span className="absolute right-2 bottom-1.5 bg-white/88 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.14em] text-ink/80 uppercase">
                          {swatch.tierLabel}
                        </span>
                      </div>
                    </div>

                    {/* Swatch Typography Footer */}
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                          {swatch.category}
                        </p>
                        <h3 className="mt-1 font-syne text-base leading-snug font-bold tracking-[-0.02em] text-ink">
                          {swatch.name}
                        </h3>
                        <p className="mt-1.5 font-sans text-xs leading-relaxed text-muted">
                          {swatch.summary}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-2.5 font-mono text-[10px] tracking-[0.16em] uppercase">
                        <span
                          className={
                            isSelected ? "font-semibold text-ink" : "text-muted"
                          }
                        >
                          {isSelected ? "INSPECTING" : "SELECT SWATCH"}
                        </span>
                        <span
                          className={
                            isSelected
                              ? swatch.accent === "red"
                                ? "text-archive-red"
                                : "text-klein"
                              : "text-ink/35"
                          }
                        >
                          →
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Studio Swatch Spec Sheet */}
          <div id="v2-swatch-spec-sheet" className="lg:col-span-7">
            <div className="mb-4 flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
              <span>STUDIO SWATCH SPEC SHEET · LIVE LOUPE</span>
              <span>ARCHIVE EDITION 01</span>
            </div>

            <div className="relative border border-ink/12 bg-white shadow-[0_24px_54px_rgba(10,10,10,0.06)]">
              {/* Corner Registration Marks */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-2 left-2.5 font-mono text-[10px] text-ink/25"
              >
                +
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-2 right-2.5 font-mono text-[10px] text-ink/25"
              >
                +
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-2 left-2.5 font-mono text-[10px] text-ink/25"
              >
                +
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-2.5 bottom-2 font-mono text-[10px] text-ink/25"
              >
                +
              </span>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSwatch.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="p-5 sm:p-8"
                >
                  {/* Top Macro Textile Preview + Interactive Magnifying Loupe */}
                  <MacroWeaveLoupe swatch={activeSwatch} mounted={mounted} />

                  {/* Spec Sheet Title & Material Provenance */}
                  <div className="mt-6 flex flex-col gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-xl">
                      <div className="flex flex-wrap items-center gap-2.5 font-mono text-[10px] tracking-[0.2em] uppercase">
                        <span
                          className={`px-2 py-0.5 font-semibold text-white ${
                            isOneOfOne ? "bg-archive-red" : "bg-klein"
                          }`}
                        >
                          {activeSwatch.tierLabel}
                        </span>
                        <span className="text-muted">
                          {activeSwatch.code} · {activeSwatch.category}
                        </span>
                      </div>

                      <h3 className="mt-2.5 font-syne text-2xl leading-tight font-extrabold tracking-[-0.03em] text-ink sm:text-3xl">
                        {activeSwatch.name}
                      </h3>

                      <p className="mt-2 font-editorial text-lg leading-snug text-ink/85 italic sm:text-xl">
                        {activeSwatch.summary}
                      </p>

                      <p className="mt-2.5 font-sans text-sm leading-relaxed text-muted">
                        {activeSwatch.editorialNote}
                      </p>
                    </div>

                    <div className="shrink-0 border border-ink/10 bg-porcelain px-4 py-3 text-left sm:text-right">
                      <span className="block font-mono text-[9.5px] tracking-[0.2em] text-muted uppercase">
                        MEASURED WEIGHT
                      </span>
                      <span
                        className={`mt-1 block font-syne text-3xl leading-none font-extrabold tracking-[-0.04em] ${
                          isOneOfOne ? "text-archive-red" : "text-klein"
                        }`}
                      >
                        {activeSwatch.gsm}
                      </span>
                      <span className="mt-1 block font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
                        GRAMS / SQ.M
                      </span>
                    </div>
                  </div>

                  {/* Visual Density Gauge */}
                  <div className="mt-6">
                    <div className="mb-2.5 flex items-center justify-between font-mono text-[10px] tracking-[0.2em] uppercase">
                      <span className="text-ink">
                        VISUAL DENSITY GAUGE · YARN CALIBRATION
                      </span>
                      <span className="text-muted">
                        {activeSwatch.yarnSpec}
                      </span>
                    </div>

                    <div className="relative h-3 w-full overflow-hidden border border-ink/12 bg-linen">
                      {/* Reference GSM tick lines */}
                      {GSM_TICKS.map((tick) => (
                        <span
                          key={tick}
                          aria-hidden="true"
                          style={{ left: `${getGsmPercent(tick)}%` }}
                          className="absolute inset-y-0 z-10 w-px bg-ink/18"
                        />
                      ))}

                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${densityPct}%` }}
                        transition={{
                          duration: 0.55,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className={`h-full ${
                          isOneOfOne ? "bg-archive-red" : "bg-klein"
                        }`}
                      />
                    </div>

                    <div className="mt-1.5 flex items-center justify-between font-mono text-[9px] tracking-[0.16em] text-muted uppercase">
                      <span>200 GSM · LIGHT</span>
                      <span>340</span>
                      <span>420</span>
                      <span>480</span>
                      <span>540</span>
                      <span>600 GSM · ARMOR</span>
                    </div>
                  </div>

                  {/* 4-Cell Technical Specification Matrix */}
                  <div className="mt-6 grid grid-cols-2 gap-px border border-ink/10 bg-ink/10 sm:grid-cols-4">
                    <div className="bg-porcelain p-3.5">
                      <span className="block font-mono text-[9.5px] tracking-[0.18em] text-muted uppercase">
                        GSM WEIGHT
                      </span>
                      <span className="mt-1.5 block font-mono text-sm font-semibold text-ink">
                        {activeSwatch.gsmLabel}
                      </span>
                    </div>

                    <div className="bg-porcelain p-3.5">
                      <span className="block font-mono text-[9.5px] tracking-[0.18em] text-muted uppercase">
                        BATCH LIMIT
                      </span>
                      <span
                        className={`mt-1.5 block font-mono text-sm font-semibold ${
                          isOneOfOne ? "text-archive-red" : "text-ink"
                        }`}
                      >
                        {activeSwatch.batchLimit}
                      </span>
                    </div>

                    <div className="bg-porcelain p-3.5">
                      <span className="block font-mono text-[9.5px] tracking-[0.18em] text-muted uppercase">
                        SHRINKAGE: 0%
                      </span>
                      <span className="mt-1.5 block font-mono text-xs font-semibold text-ink">
                        {activeSwatch.shrinkageNote}
                      </span>
                    </div>

                    <div className="bg-porcelain p-3.5">
                      <span className="block font-mono text-[9.5px] tracking-[0.18em] text-muted uppercase">
                        CUT WINDOW
                      </span>
                      <span className="mt-1.5 block font-mono text-xs font-semibold text-ink">
                        {activeSwatch.cutWindow}
                      </span>
                    </div>
                  </div>

                  {/* Linked Drop 01 Edition Tags + Jump Link to #rack */}
                  <div className="mt-6 flex flex-col gap-4 border-t border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
                        LINKED EDITIONS ·
                      </span>
                      {activeSwatch.dropTags.map((tag) => (
                        <span
                          key={tag}
                          className="border border-ink/12 bg-linen px-2.5 py-1 font-mono text-[10px] font-medium tracking-[0.14em] text-ink uppercase"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <a
                      href="#rack"
                      className={`group inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2.5 font-mono text-[11px] font-semibold tracking-[0.18em] text-white uppercase transition-colors ${
                        isOneOfOne
                          ? "bg-archive-red hover:bg-ink"
                          : "bg-klein hover:bg-ink"
                      }`}
                    >
                      <span>VIEW ON ARCHIVE RACK</span>
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
