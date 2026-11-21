export type DropPhase = "teaser" | "voting" | "waitlist" | "live" | "sold_out";

export type ProductTier = "small-batch" | "one-of-one";

export interface Product {
  _id: string;
  title: string;
  slug: string;
  serialCode: string;
  tier: ProductTier;
  priceInr: number;
  totalUnits: number;
  remainingUnits: number;
  isMystery: boolean;
  gsmWeight: string;
  fabric: string;
  craftsmanship: string[];
  sizes: string[];
  description: string;
  imageUrl: string;
  silhouetteUrl?: string;
  creatorCredit?: string;
  productionDays: number;
}

export interface DropCampaign {
  _id: string;
  dropNumber: string;
  title: string;
  subtitle: string;
  phase: DropPhase;
  launchDate: string;
  manifesto: string;
  waitlistCount: number;
  totalSlots: number;
}

export interface VoteCandidate {
  _id: string;
  title: string;
  code: string;
  creatorName: string;
  creatorHandle: string;
  tierSuggestion: ProductTier;
  description: string;
  craftsmanship: string[];
  imageUrl: string;
  votesCount: number;
  hasVoted?: boolean;
}

export interface CreatorSubmissionItem {
  _id: string;
  title: string;
  creatorName: string;
  creatorHandle: string;
  category: string;
  craftsmanshipNotes: string;
  imageUrl?: string;
  createdAt: string;
  status: "pending" | "approved_for_vote" | "selected";
}

export interface WaitlistPass {
  email: string;
  name: string;
  uid: string;
  position: number;
  totalInQueue: number;
  status: "queued" | "invited" | "entered";
  accessCode: string;
  joinedAt: string;
}

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

export interface OrderReceipt {
  orderNumber: string;
  items: CartItem[];
  totalAmountInr: number;
  paymentId: string;
  isDemo: boolean;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  estimatedShipDate: string;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isDemo?: boolean;
}
