import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import {
  FALLBACK_DROP,
  FALLBACK_PRODUCTS,
  FALLBACK_SUBMISSIONS,
  FALLBACK_VOTE_CANDIDATES,
} from "@/lib/fallback-data";
import type {
  CreatorSubmissionItem,
  DropCampaign,
  DropPhase,
  Product,
  ProductTier,
  VoteCandidate,
} from "@/lib/types";
import { urlFor } from "./image";
import { sanityFetch } from "./live";
import {
  ACTIVE_DROP_QUERY,
  ALL_PRODUCTS_QUERY,
  SUBMISSIONS_QUERY,
  VOTE_CANDIDATES_QUERY,
} from "./queries";

const DEFAULT_FALLBACK_IMAGES = [
  "/images/look-1of1-jacket.jpg",
  "/images/look-1of1-knit.jpg",
  "/images/look-batch-hoodie.jpg",
  "/images/look-batch-tee.jpg",
];

function resolveImageUrl(
  sanityImage: SanityImageSource | null | undefined,
  directUrl: string | null | undefined,
  fallbackPath: string
): string {
  if (sanityImage && typeof sanityImage === "object" && "asset" in sanityImage && sanityImage.asset) {
    try {
      const built = urlFor(sanityImage).width(1200).auto("format").url();
      if (built) return built;
    } catch {
      // Fallback gracefully if image asset reference is incomplete
    }
  }
  if (directUrl && directUrl.trim().length > 0) {
    return directUrl;
  }
  return fallbackPath;
}

interface RawDropDoc {
  _id?: string;
  dropNumber?: string;
  title?: string;
  subtitle?: string;
  phase?: DropPhase;
  launchDate?: string;
  manifesto?: string;
  waitlistCount?: number;
  totalSlots?: number;
}

interface RawProductDoc {
  _id?: string;
  title?: string;
  slug?: string;
  serialCode?: string;
  tier?: ProductTier;
  priceInr?: number;
  totalUnits?: number;
  remainingUnits?: number;
  isMystery?: boolean;
  gsmWeight?: string;
  fabric?: string;
  craftsmanship?: string[];
  sizes?: string[];
  description?: string;
  image?: SanityImageSource;
  imageUrl?: string;
  silhouetteImage?: SanityImageSource;
  silhouetteUrl?: string;
  creatorCredit?: string;
  productionDays?: number;
}

interface RawVoteCandidateDoc {
  _id?: string;
  title?: string;
  code?: string;
  creatorName?: string;
  creatorHandle?: string;
  tierSuggestion?: ProductTier;
  description?: string;
  craftsmanship?: string[] | string;
  image?: SanityImageSource;
  imageUrl?: string;
  votesCount?: number;
}

interface RawSubmissionDoc {
  _id?: string;
  title?: string;
  creatorName?: string;
  creatorHandle?: string;
  category?: string;
  craftsmanshipNotes?: string;
  image?: SanityImageSource;
  imageUrl?: string;
  createdAt?: string;
  status?: "pending" | "approved_for_vote" | "selected";
}

export async function getActiveDrop(): Promise<DropCampaign> {
  try {
    const result = await sanityFetch({ query: ACTIVE_DROP_QUERY });
    const raw = result?.data as RawDropDoc | null | undefined;
    if (!raw || !raw._id || !raw.title) {
      return FALLBACK_DROP;
    }
    return {
      _id: raw._id,
      dropNumber: raw.dropNumber || FALLBACK_DROP.dropNumber,
      title: raw.title,
      subtitle: raw.subtitle || FALLBACK_DROP.subtitle,
      phase: raw.phase || FALLBACK_DROP.phase,
      launchDate: raw.launchDate || FALLBACK_DROP.launchDate,
      manifesto: raw.manifesto || FALLBACK_DROP.manifesto,
      waitlistCount:
        typeof raw.waitlistCount === "number"
          ? raw.waitlistCount
          : FALLBACK_DROP.waitlistCount,
      totalSlots:
        typeof raw.totalSlots === "number"
          ? raw.totalSlots
          : FALLBACK_DROP.totalSlots,
    };
  } catch {
    return FALLBACK_DROP;
  }
}

export async function getDropProducts(): Promise<Product[]> {
  try {
    const result = await sanityFetch({ query: ALL_PRODUCTS_QUERY });
    const rawList = result?.data as RawProductDoc[] | null | undefined;
    if (!Array.isArray(rawList) || rawList.length === 0) {
      return FALLBACK_PRODUCTS;
    }

    return rawList.map((raw, idx): Product => {
      const fallbackImg =
        DEFAULT_FALLBACK_IMAGES[idx % DEFAULT_FALLBACK_IMAGES.length];
      const tier: ProductTier =
        raw.tier === "one-of-one" ? "one-of-one" : "small-batch";
      const totalUnits =
        typeof raw.totalUnits === "number"
          ? raw.totalUnits
          : tier === "one-of-one"
            ? 1
            : 4;
      const remainingUnits =
        typeof raw.remainingUnits === "number"
          ? raw.remainingUnits
          : totalUnits;

      const isMystery = Boolean(raw.isMystery);

      return {
        _id: raw._id || `sanity-prod-${idx}`,
        title: raw.title || `ARCHIVE PIECE 0${idx + 1}`,
        slug:
          raw.slug ||
          (raw.title || `archive-piece-${idx + 1}`)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-"),
        serialCode: raw.serialCode || `KX-0${idx + 1}`,
        tier,
        priceInr: typeof raw.priceInr === "number" ? raw.priceInr : 3450,
        totalUnits,
        remainingUnits,
        isMystery,
        gsmWeight: raw.gsmWeight || "420 GSM",
        fabric: raw.fabric || "100% Combed Heavyweight Cotton",
        craftsmanship:
          Array.isArray(raw.craftsmanship) && raw.craftsmanship.length > 0
            ? raw.craftsmanship
            : ["Hand-finished in-house", "Numbered archive edition"],
        sizes:
          Array.isArray(raw.sizes) && raw.sizes.length > 0
            ? raw.sizes
            : tier === "one-of-one"
              ? ["ONE SIZE"]
              : ["S", "M", "L", "XL"],
        description:
          raw.description ||
          "Small-batch architectural streetwear crafted in strictly limited units.",
        imageUrl: resolveImageUrl(raw.image, raw.imageUrl, fallbackImg),
        silhouetteUrl: isMystery
          ? resolveImageUrl(
            raw.silhouetteImage,
            raw.silhouetteUrl,
            "/images/look-mystery-veil.jpg"
          )
          : undefined,
        creatorCredit: raw.creatorCredit || undefined,
        productionDays:
          typeof raw.productionDays === "number" ? raw.productionDays : 7,
      };
    });
  } catch {
    return FALLBACK_PRODUCTS;
  }
}

export async function getVoteCandidates(): Promise<VoteCandidate[]> {
  try {
    const result = await sanityFetch({ query: VOTE_CANDIDATES_QUERY });
    const rawList = result?.data as RawVoteCandidateDoc[] | null | undefined;
    if (!Array.isArray(rawList) || rawList.length === 0) {
      return FALLBACK_VOTE_CANDIDATES;
    }

    return rawList.map((raw, idx): VoteCandidate => {
      const fallbackImg =
        DEFAULT_FALLBACK_IMAGES[idx % DEFAULT_FALLBACK_IMAGES.length];
      return {
        _id: raw._id || `sanity-cand-${idx}`,
        title: raw.title || `DROP 002 CONCEPT 0${idx + 1}`,
        code: raw.code || `D02-V0${idx + 1}`,
        creatorName: raw.creatorName || "KNITX Community Creator",
        creatorHandle: raw.creatorHandle || "@knitx.creator",
        tierSuggestion:
          raw.tierSuggestion === "one-of-one" ? "one-of-one" : "small-batch",
        description:
          raw.description || "Community-submitted Drop 002 garment concept.",
        craftsmanship:
          Array.isArray(raw.craftsmanship) && raw.craftsmanship.length > 0
            ? raw.craftsmanship
            : typeof raw.craftsmanship === "string" && raw.craftsmanship.trim().length > 0
              ? raw.craftsmanship
                .split(/[•,]/)
                .map((s) => s.trim())
                .filter(Boolean)
              : ["Heavyweight Indian cotton", "Limited micro-batch"],
        imageUrl: resolveImageUrl(raw.image, raw.imageUrl, fallbackImg),
        votesCount: typeof raw.votesCount === "number" ? raw.votesCount : 100,
      };
    });
  } catch {
    return FALLBACK_VOTE_CANDIDATES;
  }
}

export async function getCreatorSubmissions(): Promise<CreatorSubmissionItem[]> {
  try {
    const result = await sanityFetch({ query: SUBMISSIONS_QUERY });
    const rawList = result?.data as RawSubmissionDoc[] | null | undefined;
    if (!Array.isArray(rawList) || rawList.length === 0) {
      return FALLBACK_SUBMISSIONS;
    }

    return rawList.map((raw, idx): CreatorSubmissionItem => {
      const fallbackImg =
        DEFAULT_FALLBACK_IMAGES[idx % DEFAULT_FALLBACK_IMAGES.length];
      return {
        _id: raw._id || `sanity-sub-${idx}`,
        title: raw.title || "UNTITLED ARCHIVE CONCEPT",
        creatorName: raw.creatorName || "Independent Creator",
        creatorHandle: raw.creatorHandle || "@creator",
        category: raw.category || "Small-Batch",
        craftsmanshipNotes:
          raw.craftsmanshipNotes || "Submitted for Drop 002 curation.",
        imageUrl: resolveImageUrl(raw.image, raw.imageUrl, fallbackImg),
        createdAt: raw.createdAt || new Date().toISOString(),
        status: raw.status || "pending",
      };
    });
  } catch {
    return FALLBACK_SUBMISSIONS;
  }
}
