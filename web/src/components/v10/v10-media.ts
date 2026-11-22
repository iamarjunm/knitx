import type { Product } from "@/lib/types";

/**
 * Curated high-resolution editorial photography for V10.
 * Filters out any mismatched third-party watermarked garment image and maps
 * every piece cleanly to genuine KNITX archival photography.
 */
export const V10_MEDIA = {
  heroCampaign: "/images/hero-editorial-light.jpg",
  atelierCuttingTable: "/images/atelier-daylight.jpg",
  mysterySilhouette: "/images/look-mystery-veil.jpg",
  bomber1of1: "/images/look-1of1-jacket.jpg",
  knit1of1: "/images/look-1of1-knit.jpg",
  chainStitchTee: "/images/look-batch-tee.jpg",
} as const;

const V10_CLEAN_LOOKS = [
  V10_MEDIA.bomber1of1,
  V10_MEDIA.knit1of1,
  V10_MEDIA.chainStitchTee,
  V10_MEDIA.heroCampaign,
  V10_MEDIA.atelierCuttingTable,
] as const;

export function getV10CleanImage(rawUrl: string | undefined, index = 0): string {
  if (!rawUrl || rawUrl.trim().length === 0) {
    return V10_CLEAN_LOOKS[index % V10_CLEAN_LOOKS.length];
  }
  const lower = rawUrl.toLowerCase();
  if (lower.includes("look-batch-hoodie") || lower.includes("piece-batch-puff")) {
    return V10_CLEAN_LOOKS[index % V10_CLEAN_LOOKS.length];
  }
  return rawUrl;
}

export function getV10ProductImage(
  product: Pick<Product, "imageUrl" | "silhouetteUrl" | "isMystery" | "tier">,
  index: number,
  isUnlocked: boolean
): string {
  if (product.isMystery && !isUnlocked) {
    return V10_MEDIA.mysterySilhouette;
  }
  return getV10CleanImage(product.imageUrl, index);
}

export function cleanV10Text(text: string): string {
  return text
    .replace(/\bthe vault\b/gi, "private access")
    .replace(/\bvault-locked\b/gi, "private-release")
    .replace(/\bvault\b/gi, "private release")
    .replace(/\bmumbai\b/gi, "India");
}

export function formatEditionLabel(dropNumber: string | undefined): string {
  if (!dropNumber || !dropNumber.trim()) {
    return "CURRENT EDITION";
  }
  const cleaned = dropNumber.trim().toUpperCase();
  return cleaned.replace(/^DROP\s*0*(\d+)$/i, (_, n: string) => `EDITION ${n.padStart(2, "0")}`);
}

export interface ReleaseScheduleItem {
  id: string;
  editionLabel: string;
  title: string;
  season: string;
  status: "active" | "voting" | "upcoming";
  piecesSummary: string;
  note: string;
  image: string;
  href: string;
  cta: string;
}

export function buildReleaseSchedule(
  activeDropNumber: string,
  activeTitle: string,
  candidateCount: number
): ReleaseScheduleItem[] {
  const numMatch = activeDropNumber.match(/\d+/);
  const currentNum = numMatch ? Number.parseInt(numMatch[0], 10) : 1;
  const nextNum = String(currentNum + 1).padStart(2, "0");
  const thirdNum = String(currentNum + 2).padStart(2, "0");

  return [
    {
      id: "current-release",
      editionLabel: formatEditionLabel(activeDropNumber),
      title: activeTitle,
      season: "CURRENT RELEASE",
      status: "active",
      piecesSummary: "10 Silhouettes · 2 One-of-One · 8 Small-Batch",
      note: "Five silhouettes revealed publicly. Five remain veiled until private admission opens.",
      image: V10_MEDIA.bomber1of1,
      href: "/v10/release",
      cta: "Enter Private Release",
    },
    {
      id: "next-release",
      editionLabel: `EDITION ${nextNum}`,
      title: "COMMUNITY BALLOT",
      season: "IN CURATION",
      status: "voting",
      piecesSummary: `${candidateCount} Shortlisted Garment Concepts`,
      note: "Our audience votes directly on which concepts enter sample cutting for the next release.",
      image: V10_MEDIA.knit1of1,
      href: "/v10/vote",
      cta: "Cast Your Ballot",
    },
    {
      id: "future-release",
      editionLabel: `EDITION ${thirdNum}`,
      title: "OPEN CREATOR BRIEF",
      season: "SUBMISSIONS OPEN",
      status: "upcoming",
      piecesSummary: "Independent Designers & Garment Makers",
      note: "Submit original silhouettes to be sampled, produced in limited runs, and credited by name.",
      image: V10_MEDIA.atelierCuttingTable,
      href: "/v10/submit",
      cta: "Submit A Concept",
    },
  ];
}
