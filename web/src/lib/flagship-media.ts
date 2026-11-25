import type { Product } from "@/lib/types";

/**
 * Flagship V12 & KNITX CORE curated photography manifest.
 * Uses freshly art-directed high-key daylight & studio photography paired with
 * verified KNITX archival drop pieces, filtering out any mismatched images.
 */
export const FLAGSHIP_MEDIA = {
  heroCampaign: "/images/v12-hero-flagship.jpg",
  coreHoodieSlate: "/images/v12-core-hoodie-slate.jpg",
  coreColorwaysStack: "/images/v12-core-colorways-stack.jpg",
  coreCampaignDuo: "/images/v12-core-campaign-duo.jpg",
  dropBomberStudio: "/images/v12-drop-bomber-studio.jpg",
  atelierSunlit: "/images/v12-atelier-sunlit.jpg",
  bomber1of1: "/images/look-1of1-jacket.jpg",
  knit1of1: "/images/look-1of1-knit.jpg",
  chainStitchTee: "/images/look-batch-tee.jpg",
  mysterySilhouette: "/images/look-mystery-veil.jpg",
  atelierCuttingDark: "/images/atelier-daylight.jpg",
} as const;

const CLEAN_DROP_LOOKS = [
  FLAGSHIP_MEDIA.dropBomberStudio,
  FLAGSHIP_MEDIA.knit1of1,
  FLAGSHIP_MEDIA.chainStitchTee,
  FLAGSHIP_MEDIA.bomber1of1,
  FLAGSHIP_MEDIA.coreHoodieSlate,
] as const;

export function getFlagshipCleanImage(
  rawUrl: string | undefined,
  index = 0
): string {
  if (!rawUrl || rawUrl.trim().length === 0) {
    return CLEAN_DROP_LOOKS[index % CLEAN_DROP_LOOKS.length];
  }
  const lower = rawUrl.toLowerCase();
  if (
    lower.includes("look-batch-hoodie") ||
    lower.includes("piece-batch-puff")
  ) {
    return CLEAN_DROP_LOOKS[index % CLEAN_DROP_LOOKS.length];
  }
  return rawUrl;
}

export function getFlagshipProductImage(
  product: Pick<Product, "imageUrl" | "silhouetteUrl" | "isMystery" | "tier">,
  index: number,
  isUnlocked: boolean
): string {
  if (product.isMystery && !isUnlocked) {
    return FLAGSHIP_MEDIA.mysterySilhouette;
  }
  return getFlagshipCleanImage(product.imageUrl, index);
}

export function cleanFlagshipText(text: string): string {
  return text
    .replace(/\bthe vault\b/gi, "private access")
    .replace(/\bvault-locked\b/gi, "private-drop")
    .replace(/\bvault\b/gi, "private drop")
    .replace(/\bmumbai\b/gi, "India")
    .replace(/\bbombay\b/gi, "India");
}

export function formatDropEditionLabel(dropNumber: string | undefined): string {
  if (!dropNumber || !dropNumber.trim()) {
    return "EDITION 01";
  }
  const cleaned = dropNumber.trim().toUpperCase();
  return cleaned.replace(
    /^DROP\s*0*(\d+)$/i,
    (_, n: string) => `EDITION ${n.padStart(2, "0")}`
  );
}

export interface EditionTimelineItem {
  id: string;
  editionLabel: string;
  title: string;
  timingLabel: string;
  status: "active" | "core" | "voting" | "upcoming";
  summary: string;
  note: string;
  image: string;
  href: string;
  cta: string;
}

export function buildFlagshipTimeline(
  activeDropNumber: string,
  activeTitle: string,
  candidateCount: number,
  coreOffsetDays = 14
): EditionTimelineItem[] {
  const numMatch = activeDropNumber.match(/\d+/);
  const currentNum = numMatch ? Number.parseInt(numMatch[0], 10) : 1;
  const nextNum = String(currentNum + 1).padStart(2, "0");
  const thirdNum = String(currentNum + 2).padStart(2, "0");

  return [
    {
      id: "active-drop",
      editionLabel: formatDropEditionLabel(activeDropNumber),
      title: cleanFlagshipText(activeTitle),
      timingLabel: "ACTIVE DROP",
      status: "active",
      summary: "Curated Limited-Edition Drop · Small-Batch & One-of-One",
      note: "Selected silhouettes are previewed publicly while remaining pieces unlock automatically once your account receives access.",
      image: FLAGSHIP_MEDIA.dropBomberStudio,
      href: "/drops",
      cta: "Enter Current Drop",
    },
    {
      id: "core-wardrobe",
      editionLabel: "KNITX CORE",
      title: "ESSENTIAL WARDROBE",
      timingLabel: `+${coreOffsetDays} DAYS POST-DROP`,
      status: "core",
      summary: "Heavyweight Minimalist Essentials · Curated Mineral Colorways",
      note: "Signature 320–480 GSM branded essentials opening two weeks after Drop 1 for admitted Drop 1 & community waitlist accounts.",
      image: FLAGSHIP_MEDIA.coreCampaignDuo,
      href: "/core",
      cta: "Explore Core Wardrobe",
    },
    {
      id: "next-ballot",
      editionLabel: `EDITION ${nextNum}`,
      title: "COMMUNITY BALLOT",
      timingLabel: "VOTING OPEN",
      status: "voting",
      summary: `${candidateCount} Shortlisted Silhouettes`,
      note: "The community votes directly on which concepts advance into sample cutting for the next drop.",
      image: FLAGSHIP_MEDIA.knit1of1,
      href: "/vote",
      cta: "Vote Next Drop",
    },
    {
      id: "future-residency",
      editionLabel: `EDITION ${thirdNum}`,
      title: "CREATOR RESIDENCY",
      timingLabel: "SUBMISSIONS OPEN",
      status: "upcoming",
      summary: "Independent Designers & Garment Makers",
      note: "Submit original designs to be sampled in-house, produced in limited runs, and credited by name.",
      image: FLAGSHIP_MEDIA.atelierSunlit,
      href: "/submit",
      cta: "Submit A Concept",
    },
  ];
}
