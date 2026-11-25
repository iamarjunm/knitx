import type { Product } from "./types";

export interface CoreSwatch {
  id: string;
  name: string;
  hex: string;
  borderHex?: string;
  imageUrl: string;
}

export interface CoreGarment {
  _id: string;
  serialCode: string;
  title: string;
  category: "Hoodie" | "Tee" | "Zip" | "Crewneck" | "Trouser" | "Long Sleeve";
  priceInr: number;
  gsmWeight: string;
  fabric: string;
  fit: string;
  description: string;
  craftsmanship: string[];
  sizes: string[];
  productionDays: number;
  defaultSwatchId: string;
  swatches: CoreSwatch[];
  inStock: boolean;
}

export type CoreAccessMode = "community" | "open" | "locked";
export type StoreDropPhase = "waitlist" | "live" | "core_early" | "sold_out";

export interface StorefrontConfig {
  brandName: string;
  accentColor: string;
  announcementEnabled: boolean;
  announcementText: string;
  heroEyebrow: string;
  heroTitleOverride: string;
  heroSubtitle: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  dropPhase: StoreDropPhase;
  activeDropNumber: string;
  activeDropTitle: string;
  dropLaunchDate: string;
  coreEnabled: boolean;
  coreTitle: string;
  coreSubtitle: string;
  coreLaunchOffsetDays: number;
  coreLaunchDateOverride: string;
  coreAccessMode: CoreAccessMode;
  masterAccessCode: string;
  coreAccessCode: string;
  gridColumns: 3 | 4;
  showVoteSection: boolean;
  showSubmitSection: boolean;
  showAtelierSection: boolean;
  footerTagline: string;
}

export const DEFAULT_STOREFRONT_CONFIG: StorefrontConfig = {
  brandName: "KNITX",
  accentColor: "#E11D2E",
  announcementEnabled: false,
  announcementText:
    "WAITLIST LIVE · ACCOUNT-BASED DROP ACCESS · KNITX CORE OPENS 2 WEEKS POST-DROP FOR COMMUNITY MEMBERS",
  heroEyebrow: "LIMITED-EDITION DROPS · CUT TO ORDER · ZERO RESTOCKS",
  heroTitleOverride: "",
  heroSubtitle:
    "Numbered Indian streetwear cut to order. One-of-one collector works and strictly limited small-batch editions.",
  heroCtaPrimary: "JOIN WAITLIST",
  heroCtaSecondary: "ENTER DROP",
  dropPhase: "waitlist",
  activeDropNumber: "DROP 001",
  activeDropTitle: "MONSOON CONCRETE",
  dropLaunchDate: "2026-12-01T14:30:00.000Z",
  coreEnabled: true,
  coreTitle: "KNITX CORE",
  coreSubtitle:
    "Heavyweight everyday essentials in curated mineral colorways finished with subtle signature KNITX branding. Opens 2 weeks after Drop 1 for admitted Drop 1 & community waitlist accounts.",
  coreLaunchOffsetDays: 14,
  coreLaunchDateOverride: "",
  coreAccessMode: "community",
  masterAccessCode: "KNITX-001",
  coreAccessCode: "KNITX-CORE",
  gridColumns: 4,
  showVoteSection: true,
  showSubmitSection: true,
  showAtelierSection: true,
  footerTagline: "CRAFTED IN INDIA · LIMITED EDITIONS · CUT TO ORDER · ZERO DEADSTOCK",
};

export const CORE_COLLECTION_GARMENTS: CoreGarment[] = [
  {
    _id: "core-kx-01",
    serialCode: "KX-CORE-01",
    title: "CORE 460GSM BOXY HOODIE",
    category: "Hoodie",
    priceInr: 3400,
    gsmWeight: "460 GSM",
    fabric: "100% Combed Ring-Spun Heavy Diagonal French Terry",
    fit: "Structured Boxy Cropped Fit · Drop Shoulder",
    description:
      "Architectural everyday hoodie milled to 460 GSM with a self-supporting double-lined hood, zero drawstrings, and dense 2x2 ribbed cuffs. Finished with tonal KNITX embroidery and woven archival hem branding.",
    craftsmanship: [
      "460 GSM brushed diagonal loopback cotton",
      "Double-layer structured hood with zero drawstrings",
      "Garment-dyed mineral pigment wash with tonal KNITX chest mark",
      "Pre-shrunk enzyme finish with signature woven KNITX neck & hem labels",
    ],
    sizes: ["S", "M", "L", "XL"],
    productionDays: 5,
    defaultSwatchId: "mineral-slate",
    inStock: true,
    swatches: [
      {
        id: "mineral-slate",
        name: "Mineral Slate",
        hex: "#6E7378",
        imageUrl: "/images/v12-core-hoodie-slate.jpg",
      },
      {
        id: "washed-obsidian",
        name: "Washed Obsidian",
        hex: "#161618",
        imageUrl: "/images/v12-core-hoodie-slate.jpg",
      },
      {
        id: "chalk-bone",
        name: "Chalk Bone",
        hex: "#F2EFE9",
        borderHex: "#D4D0C8",
        imageUrl: "/images/v12-core-campaign-duo.jpg",
      },
      {
        id: "deep-espresso",
        name: "Deep Espresso",
        hex: "#332924",
        imageUrl: "/images/v12-core-campaign-duo.jpg",
      },
      {
        id: "sage-stone",
        name: "Sage Stone",
        hex: "#6D7469",
        imageUrl: "/images/v12-core-colorways-stack.jpg",
      },
    ],
  },
  {
    _id: "core-kx-02",
    serialCode: "KX-CORE-02",
    title: "CORE 320GSM HEAVYWEIGHT TEE",
    category: "Tee",
    priceInr: 1850,
    gsmWeight: "320 GSM",
    fabric: "100% Open-End Dry-Hand Carded Indian Cotton",
    fit: "Oversized Box Fit · High 3cm Mock Rib Collar",
    description:
      "Our foundational heavyweight tee engineered with a dry, crisp hand-feel and a dense 3cm collar rib that never loses shape. Dyed in small mineral baths across six timeless colorways with signature tonal KNITX branding.",
    craftsmanship: [
      "320 GSM dry-hand heavy single jersey",
      "3cm high-tension mock rib collar",
      "Subtle tonal KNITX embroidery & woven side-seam branding",
      "Twin-needle reinforced hem & interior woven KNITX neck label",
    ],
    sizes: ["S", "M", "L", "XL"],
    productionDays: 4,
    defaultSwatchId: "chalk-bone",
    inStock: true,
    swatches: [
      {
        id: "chalk-bone",
        name: "Chalk Bone",
        hex: "#F2EFE9",
        borderHex: "#D4D0C8",
        imageUrl: "/images/v12-core-colorways-stack.jpg",
      },
      {
        id: "washed-obsidian",
        name: "Washed Obsidian",
        hex: "#161618",
        imageUrl: "/images/v12-core-colorways-stack.jpg",
      },
      {
        id: "warm-sand",
        name: "Warm Sand",
        hex: "#C8BFA8",
        imageUrl: "/images/v12-core-colorways-stack.jpg",
      },
      {
        id: "mineral-slate",
        name: "Mineral Slate",
        hex: "#6E7378",
        imageUrl: "/images/v12-core-colorways-stack.jpg",
      },
      {
        id: "deep-espresso",
        name: "Deep Espresso",
        hex: "#332924",
        imageUrl: "/images/v12-core-campaign-duo.jpg",
      },
      {
        id: "sage-stone",
        name: "Sage Stone",
        hex: "#6D7469",
        imageUrl: "/images/v12-core-colorways-stack.jpg",
      },
    ],
  },
  {
    _id: "core-kx-03",
    serialCode: "KX-CORE-03",
    title: "CORE 480GSM TWO-WAY ZIP HOODIE",
    category: "Zip",
    priceInr: 3900,
    gsmWeight: "480 GSM",
    fabric: "Heavyweight Loopback Terry with Brushed Metal Hardware",
    fit: "Cropped Boxy Outer-Layer Proportion",
    description:
      "Substantial outer-layer zip silhouette cut from 480 GSM unbrushed loopback cotton with custom KNITX-engraved two-way metal hardware. Built to layer cleanly over Core 320 GSM tees.",
    craftsmanship: [
      "480 GSM heavy loopback cotton body",
      "Custom KNITX-engraved two-way brushed gunmetal zipper",
      "Bar-tacked angled welt pockets & structured hood",
      "Garment-washed tonal finish with subtle embroidered KNITX insignia",
    ],
    sizes: ["S", "M", "L", "XL"],
    productionDays: 6,
    defaultSwatchId: "deep-espresso",
    inStock: true,
    swatches: [
      {
        id: "deep-espresso",
        name: "Deep Espresso",
        hex: "#332924",
        imageUrl: "/images/v12-core-campaign-duo.jpg",
      },
      {
        id: "washed-obsidian",
        name: "Washed Obsidian",
        hex: "#161618",
        imageUrl: "/images/v12-core-hoodie-slate.jpg",
      },
      {
        id: "mineral-slate",
        name: "Mineral Slate",
        hex: "#6E7378",
        imageUrl: "/images/v12-core-hoodie-slate.jpg",
      },
      {
        id: "warm-sand",
        name: "Warm Sand",
        hex: "#C8BFA8",
        imageUrl: "/images/v12-core-colorways-stack.jpg",
      },
    ],
  },
  {
    _id: "core-kx-04",
    serialCode: "KX-CORE-04",
    title: "CORE 440GSM ARCHITECTURAL CREWNECK",
    category: "Crewneck",
    priceInr: 3100,
    gsmWeight: "440 GSM",
    fabric: "100% Heavy Combed Cotton French Terry",
    fit: "Wide Chest · Gently Tapered Rib Waistband",
    description:
      "Clean, sculptural crewneck sweatshirt with reverse-side flatlock shoulder reinforcement and a thick ribbed neckline that frames layered tees cleanly.",
    craftsmanship: [
      "440 GSM pre-shrunk heavyweight French terry",
      "Subtle tonal flatlock shoulder seam articulation",
      "Dense 7cm waist & cuff ribbing",
      "Soft mineral enzyme wash",
    ],
    sizes: ["S", "M", "L", "XL"],
    productionDays: 5,
    defaultSwatchId: "warm-sand",
    inStock: true,
    swatches: [
      {
        id: "warm-sand",
        name: "Warm Sand",
        hex: "#C8BFA8",
        imageUrl: "/images/v12-core-colorways-stack.jpg",
      },
      {
        id: "chalk-bone",
        name: "Chalk Bone",
        hex: "#F2EFE9",
        borderHex: "#D4D0C8",
        imageUrl: "/images/v12-core-campaign-duo.jpg",
      },
      {
        id: "washed-obsidian",
        name: "Washed Obsidian",
        hex: "#161618",
        imageUrl: "/images/v12-core-hoodie-slate.jpg",
      },
      {
        id: "sage-stone",
        name: "Sage Stone",
        hex: "#6D7469",
        imageUrl: "/images/v12-core-colorways-stack.jpg",
      },
    ],
  },
  {
    _id: "core-kx-05",
    serialCode: "KX-CORE-05",
    title: "CORE 400GSM WIDE-LEG LOUNGE TROUSER",
    category: "Trouser",
    priceInr: 3250,
    gsmWeight: "400 GSM",
    fabric: "Heavyweight Structured Cotton Fleece",
    fit: "Full-Length Straight Wide Leg · Open Tailored Hem",
    description:
      "Tailored-drape heavyweight fleece trouser with an internal concealed drawcord, deep side-seam pockets, and an open wide hem that breaks cleanly over footwear.",
    craftsmanship: [
      "400 GSM high-recovery cotton fleece",
      "Tailored front pintuck crease for structured drape",
      "Concealed interior cotton-twill drawcord",
      "Deep cotton-poplin pocket bags",
    ],
    sizes: ["S", "M", "L", "XL"],
    productionDays: 5,
    defaultSwatchId: "washed-obsidian",
    inStock: true,
    swatches: [
      {
        id: "washed-obsidian",
        name: "Washed Obsidian",
        hex: "#161618",
        imageUrl: "/images/v12-core-campaign-duo.jpg",
      },
      {
        id: "mineral-slate",
        name: "Mineral Slate",
        hex: "#6E7378",
        imageUrl: "/images/v12-core-hoodie-slate.jpg",
      },
      {
        id: "deep-espresso",
        name: "Deep Espresso",
        hex: "#332924",
        imageUrl: "/images/v12-core-campaign-duo.jpg",
      },
      {
        id: "warm-sand",
        name: "Warm Sand",
        hex: "#C8BFA8",
        imageUrl: "/images/v12-core-colorways-stack.jpg",
      },
    ],
  },
  {
    _id: "core-kx-06",
    serialCode: "KX-CORE-06",
    title: "CORE 340GSM LONG-SLEEVE BOX TEE",
    category: "Long Sleeve",
    priceInr: 2250,
    gsmWeight: "340 GSM",
    fabric: "Heavyweight Single Jersey Combed Cotton",
    fit: "Relaxed Box Silhouette · Ribbed Cuffs",
    description:
      "Mid-weight transitional long-sleeve cut on our signature boxy block with cuffed sleeves and a structured high collar.",
    craftsmanship: [
      "340 GSM dense combed cotton jersey",
      "Ribbed cuffs that hold sleeve stack",
      "Tonal mineral garment dye",
      "Pre-shrunk studio finish",
    ],
    sizes: ["S", "M", "L", "XL"],
    productionDays: 4,
    defaultSwatchId: "sage-stone",
    inStock: true,
    swatches: [
      {
        id: "sage-stone",
        name: "Sage Stone",
        hex: "#6D7469",
        imageUrl: "/images/v12-core-colorways-stack.jpg",
      },
      {
        id: "chalk-bone",
        name: "Chalk Bone",
        hex: "#F2EFE9",
        borderHex: "#D4D0C8",
        imageUrl: "/images/v12-core-campaign-duo.jpg",
      },
      {
        id: "washed-obsidian",
        name: "Washed Obsidian",
        hex: "#161618",
        imageUrl: "/images/v12-core-hoodie-slate.jpg",
      },
      {
        id: "mineral-slate",
        name: "Mineral Slate",
        hex: "#6E7378",
        imageUrl: "/images/v12-core-hoodie-slate.jpg",
      },
    ],
  },
];

export function computeCoreLaunchDate(
  dropLaunchIso: string,
  offsetDays = 14,
  overrideIso?: string
): string {
  if (overrideIso && overrideIso.trim().length > 0) {
    const parsedOverride = Date.parse(overrideIso);
    if (Number.isFinite(parsedOverride)) {
      return new Date(parsedOverride).toISOString();
    }
  }
  const baseMs = Date.parse(dropLaunchIso);
  const safeBase = Number.isFinite(baseMs)
    ? baseMs
    : Date.parse("2026-12-01T14:30:00.000Z");
  return new Date(safeBase + offsetDays * 24 * 60 * 60 * 1000).toISOString();
}

export function coreGarmentToProduct(
  garment: CoreGarment,
  swatch: CoreSwatch
): Product {
  return {
    _id: `${garment._id}-${swatch.id}`,
    title: `${garment.title} — ${swatch.name.toUpperCase()}`,
    slug: `${garment._id}-${swatch.id}`,
    serialCode: `${garment.serialCode}-${swatch.id.slice(0, 3).toUpperCase()}`,
    tier: "small-batch",
    priceInr: garment.priceInr,
    totalUnits: 25,
    remainingUnits: garment.inStock ? 25 : 0,
    isMystery: false,
    gsmWeight: garment.gsmWeight,
    fabric: garment.fabric,
    craftsmanship: garment.craftsmanship,
    sizes: garment.sizes,
    description: garment.description,
    imageUrl: swatch.imageUrl,
    creatorCredit: "KNITX CORE WARDROBE",
    productionDays: garment.productionDays,
  };
}
