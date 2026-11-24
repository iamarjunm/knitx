import { NextResponse } from "next/server";
import { CORE_COLLECTION_GARMENTS } from "@/lib/core-catalog";
import {
  FALLBACK_DROP,
  FALLBACK_PRODUCTS,
  FALLBACK_SUBMISSIONS,
  FALLBACK_VOTE_CANDIDATES,
} from "@/lib/fallback-data";
import type {
  CreatorSubmissionItem,
  DropCampaign,
  Product,
  ProductTier,
  VoteCandidate,
} from "@/lib/types";
import { client } from "@/sanity/lib/client";
import { hasSanityWriteToken, writeClient } from "@/sanity/lib/writeClient";

export const dynamic = "force-dynamic";

interface AdminWaitlistEntry {
  _id: string;
  name: string;
  email: string;
  position: number;
  status: "queued" | "invited" | "entered";
  accessCode: string;
  joinedAt: string;
}

type AdminOrderStatus =
  | "confirmed"
  | "pattern_cut"
  | "stitching"
  | "quality_check"
  | "dispatched";

interface AdminOrderItem {
  productId?: string;
  title: string;
  serialCode?: string;
  tier?: ProductTier;
  size: string;
  quantity: number;
  priceInr: number;
}

interface AdminOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmountInr: number;
  status: AdminOrderStatus;
  paymentId: string;
  shippingAddress: string;
  items: AdminOrderItem[];
  createdAt: string;
}

interface RawOrderDoc {
  _id: string;
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
  totalAmountInr?: number;
  status?: string;
  paymentId?: string;
  shippingAddress?: string;
  items?: AdminOrderItem[];
  createdAt?: string;
}

const FALLBACK_WAITLIST: AdminWaitlistEntry[] = [
  {
    _id: "wl-demo-01",
    name: "Aarav Kapoor",
    email: "aarav.kapoor@studio.in",
    position: 101,
    status: "entered",
    accessCode: "KX-0101",
    joinedAt: "2026-11-18T09:15:00.000Z",
  },
  {
    _id: "wl-demo-02",
    name: "Ananya Deshmukh",
    email: "ananya.d@archive.co",
    position: 102,
    status: "entered",
    accessCode: "KX-0102",
    joinedAt: "2026-11-18T11:42:00.000Z",
  },
  {
    _id: "wl-demo-03",
    name: "Vikramaditya Rao",
    email: "vikram.rao@concrete.in",
    position: 103,
    status: "invited",
    accessCode: "KX-0103",
    joinedAt: "2026-11-19T08:05:00.000Z",
  },
  {
    _id: "wl-demo-04",
    name: "Ishita Banerjee",
    email: "ishita.b@designlab.in",
    position: 104,
    status: "invited",
    accessCode: "KX-0104",
    joinedAt: "2026-11-19T14:28:00.000Z",
  },
  {
    _id: "wl-demo-05",
    name: "Siddharth Menon",
    email: "sid.menon@monolith.in",
    position: 105,
    status: "queued",
    accessCode: "KX-0105",
    joinedAt: "2026-11-20T10:11:00.000Z",
  },
  {
    _id: "wl-demo-06",
    name: "Tara Malhotra",
    email: "tara.m@atelier.in",
    position: 106,
    status: "queued",
    accessCode: "KX-0106",
    joinedAt: "2026-11-21T16:50:00.000Z",
  },
  {
    _id: "wl-demo-07",
    name: "Neel Chatterjee",
    email: "neel.c@rawform.in",
    position: 107,
    status: "queued",
    accessCode: "KX-0107",
    joinedAt: "2026-11-22T12:04:00.000Z",
  },
  {
    _id: "wl-demo-08",
    name: "Riya Subramanian",
    email: "riya.sub@knitclub.in",
    position: 108,
    status: "queued",
    accessCode: "KX-0108",
    joinedAt: "2026-11-23T18:35:00.000Z",
  },
];

const FALLBACK_ORDERS: AdminOrder[] = [
  {
    _id: "ord-demo-01",
    orderNumber: "KX-ORD-001041",
    customerName: "Aarav Kapoor",
    customerEmail: "aarav.kapoor@studio.in",
    totalAmountInr: 9800,
    status: "stitching",
    paymentId: "pay_RZP9x8K2m1A01",
    shippingAddress: "14B Koregaon Park, Lane 7, Pune 411001",
    items: [
      {
        productId: "prod-kx-1o1-01",
        title: "KALI ARCHIVE BOMBER 01/01",
        serialCode: "KX-1O1-01",
        tier: "one-of-one",
        size: "ONE SIZE (BOX FIT L/XL)",
        quantity: 1,
        priceInr: 9800,
      },
    ],
    createdAt: "2026-11-20T13:20:00.000Z",
  },
  {
    _id: "ord-demo-02",
    orderNumber: "KX-ORD-001042",
    customerName: "Ananya Deshmukh",
    customerEmail: "ananya.d@archive.co",
    totalAmountInr: 6400,
    status: "pattern_cut",
    paymentId: "pay_RZP9x8K2m1A02",
    shippingAddress: "82 Indiranagar 12th Main, Bengaluru 560038",
    items: [
      {
        productId: "prod-kx-sb-01",
        title: "MONOLITH 420GSM PUFF HOODIE",
        serialCode: "KX-SB-01",
        tier: "small-batch",
        size: "L",
        quantity: 1,
        priceInr: 3850,
      },
      {
        productId: "prod-kx-sb-02",
        title: "STEPWELL GRID CHAIN-STITCH TEE",
        serialCode: "KX-SB-02",
        tier: "small-batch",
        size: "M",
        quantity: 1,
        priceInr: 2550,
      },
    ],
    createdAt: "2026-11-21T09:45:00.000Z",
  },
  {
    _id: "ord-demo-03",
    orderNumber: "KX-ORD-001043",
    customerName: "Vikramaditya Rao",
    customerEmail: "vikram.rao@concrete.in",
    totalAmountInr: 3950,
    status: "quality_check",
    paymentId: "pay_RZP9x8K2m1A03",
    shippingAddress: "24 Jubilee Hills Road 36, Hyderabad 500033",
    items: [
      {
        productId: "prod-kx-sb-04",
        title: "RAW SEAM SLUB OVERSHIRT",
        serialCode: "KX-SB-04",
        tier: "small-batch",
        size: "XL",
        quantity: 1,
        priceInr: 3950,
      },
    ],
    createdAt: "2026-11-22T15:10:00.000Z",
  },
  {
    _id: "ord-demo-04",
    orderNumber: "KX-ORD-001044",
    customerName: "Ishita Banerjee",
    customerEmail: "ishita.b@designlab.in",
    totalAmountInr: 3450,
    status: "confirmed",
    paymentId: "pay_RZP9x8K2m1A04",
    shippingAddress: "C-19 Defence Colony, New Delhi 110024",
    items: [
      {
        productId: "prod-kx-sb-03",
        title: "CONCRETE REBAR HEAVY CREWNECK",
        serialCode: "KX-SB-03",
        tier: "small-batch",
        size: "M",
        quantity: 1,
        priceInr: 3450,
      },
    ],
    createdAt: "2026-11-23T19:05:00.000Z",
  },
  {
    _id: "ord-demo-05",
    orderNumber: "KX-ORD-001045",
    customerName: "Kabir Sengupta",
    customerEmail: "kabir.s@studio.in",
    totalAmountInr: 3850,
    status: "dispatched",
    paymentId: "pay_RZP9x8K2m1A05",
    shippingAddress: "7B Park Street, Kolkata 700016",
    items: [
      {
        productId: "prod-kx-sb-01",
        title: "MONOLITH 420GSM PUFF HOODIE",
        serialCode: "KX-SB-01",
        tier: "small-batch",
        size: "XL",
        quantity: 1,
        priceInr: 3850,
      },
    ],
    createdAt: "2026-11-19T11:30:00.000Z",
  },
];

function isAuthorizedAdmin(request: Request): boolean {
  const provided = (request.headers.get("x-knitx-admin-code") ?? "")
    .trim()
    .toUpperCase();
  const expected = (process.env.ADMIN_PASSCODE || "KNITX-ADMIN")
    .trim()
    .toUpperCase();
  return provided.length > 0 && provided === expected;
}

function normalizeOrderStatus(rawStatus?: string): AdminOrderStatus {
  switch (rawStatus) {
    case "confirmed":
    case "sample_confirmed":
    case "paid":
    case "demo_paid":
      return "confirmed";
    case "pattern_cut":
    case "cutting_fabric":
      return "pattern_cut";
    case "stitching":
    case "embroidery_craft":
      return "stitching";
    case "quality_check":
    case "quality_numbered":
      return "quality_check";
    case "dispatched":
      return "dispatched";
    default:
      return "confirmed";
  }
}

export async function GET(request: Request) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json(
      { ok: false, error: "Invalid admin passcode." },
      { status: 401 }
    );
  }

  const readClient = hasSanityWriteToken ? writeClient : client;

  const [
    dropsResult,
    productsResult,
    waitlistResult,
    candidatesResult,
    submissionsResult,
    ordersResult,
  ] = await Promise.allSettled([
    readClient.fetch<DropCampaign[]>(
      `*[_type == "drop"] | order(_createdAt desc) {
        _id,
        dropNumber,
        title,
        subtitle,
        phase,
        launchDate,
        manifesto,
        waitlistCount,
        totalSlots
      }`,
      {},
      { cache: "no-store" }
    ),
    readClient.fetch<Product[]>(
      `*[_type == "product"] | order(tier desc, serialCode asc) {
        _id,
        title,
        "slug": slug.current,
        serialCode,
        tier,
        priceInr,
        totalUnits,
        remainingUnits,
        isMystery,
        gsmWeight,
        fabric,
        craftsmanship,
        sizes,
        description,
        "imageUrl": coalesce(imageUrl, mainImage.asset->url),
        "silhouetteUrl": coalesce(silhouetteUrl, silhouetteImage.asset->url),
        creatorCredit,
        productionDays
      }`,
      {},
      { cache: "no-store" }
    ),
    readClient.fetch<AdminWaitlistEntry[]>(
      `*[_type == "waitlistEntry"] | order(position asc)[0...200] {
        _id,
        name,
        email,
        position,
        status,
        accessCode,
        "joinedAt": coalesce(joinedAt, _createdAt)
      }`,
      {},
      { cache: "no-store" }
    ),
    readClient.fetch<VoteCandidate[]>(
      `*[_type == "designVoteCandidate"] | order(votesCount desc) {
        _id,
        title,
        code,
        creatorName,
        creatorHandle,
        tierSuggestion,
        description,
        craftsmanship,
        "imageUrl": coalesce(imageUrl, conceptImage.asset->url),
        votesCount
      }`,
      {},
      { cache: "no-store" }
    ),
    readClient.fetch<CreatorSubmissionItem[]>(
      `*[_type == "creatorSubmission"] | order(_createdAt desc) {
        _id,
        title,
        creatorName,
        creatorHandle,
        category,
        craftsmanshipNotes,
        "imageUrl": coalesce(imageUrl, mockupImage.asset->url),
        "createdAt": coalesce(createdAt, _createdAt),
        status
      }`,
      {},
      { cache: "no-store" }
    ),
    readClient.fetch<RawOrderDoc[]>(
      `*[_type == "order"] | order(_createdAt desc)[0...100] {
        _id,
        orderNumber,
        customerName,
        customerEmail,
        totalAmountInr,
        "status": coalesce(status, productionStage, paymentStatus),
        "paymentId": coalesce(paymentId, razorpayPaymentId),
        shippingAddress,
        items,
        "createdAt": coalesce(createdAt, _createdAt)
      }`,
      {},
      { cache: "no-store" }
    ),
  ]);

  const rawDrops =
    dropsResult.status === "fulfilled" && Array.isArray(dropsResult.value)
      ? dropsResult.value
      : [];
  const rawProducts =
    productsResult.status === "fulfilled" && Array.isArray(productsResult.value)
      ? productsResult.value
      : [];
  const rawWaitlist =
    waitlistResult.status === "fulfilled" && Array.isArray(waitlistResult.value)
      ? waitlistResult.value
      : [];
  const rawCandidates =
    candidatesResult.status === "fulfilled" && Array.isArray(candidatesResult.value)
      ? candidatesResult.value
      : [];
  const rawSubmissions =
    submissionsResult.status === "fulfilled" && Array.isArray(submissionsResult.value)
      ? submissionsResult.value
      : [];
  const rawOrders =
    ordersResult.status === "fulfilled" && Array.isArray(ordersResult.value)
      ? ordersResult.value
      : [];

  const drops: DropCampaign[] =
    rawDrops.length > 0 ? rawDrops : [FALLBACK_DROP];

  const products: Product[] =
    rawProducts.length > 0
      ? rawProducts.map((p) => ({
          ...p,
          slug: p.slug || p._id,
          imageUrl: p.imageUrl || "/images/v12-core-hoodie-slate.jpg",
          craftsmanship: Array.isArray(p.craftsmanship) ? p.craftsmanship : [],
          sizes: Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ["S", "M", "L", "XL"],
          productionDays: typeof p.productionDays === "number" ? p.productionDays : 10,
        }))
      : FALLBACK_PRODUCTS;

  const waitlist: AdminWaitlistEntry[] =
    rawWaitlist.length > 0
      ? rawWaitlist.map((w, idx) => ({
          _id: w._id,
          name: w.name || "KNITX Collector",
          email: w.email || "collector@knitx.in",
          position: typeof w.position === "number" ? w.position : idx + 1,
          status:
            w.status === "invited" || w.status === "entered"
              ? w.status
              : "queued",
          accessCode: w.accessCode || `KX-${String(w.position ?? idx + 1).padStart(3, "0")}`,
          joinedAt: w.joinedAt || new Date().toISOString(),
        }))
      : FALLBACK_WAITLIST;

  const candidates: VoteCandidate[] =
    rawCandidates.length > 0
      ? rawCandidates.map((c) => ({
          ...c,
          imageUrl: c.imageUrl || "/images/look-1of1-knit.jpg",
          craftsmanship: Array.isArray(c.craftsmanship) ? c.craftsmanship : [],
          votesCount: typeof c.votesCount === "number" ? c.votesCount : 0,
        }))
      : FALLBACK_VOTE_CANDIDATES;

  const submissions: CreatorSubmissionItem[] =
    rawSubmissions.length > 0
      ? rawSubmissions.map((s) => ({
          ...s,
          imageUrl: s.imageUrl || "/images/v12-core-hoodie-slate.jpg",
          createdAt: s.createdAt || new Date().toISOString(),
          status:
            s.status === "approved_for_vote" || s.status === "selected"
              ? s.status
              : "pending",
        }))
      : FALLBACK_SUBMISSIONS;

  const orders: AdminOrder[] =
    rawOrders.length > 0
      ? rawOrders.map((o) => ({
          _id: o._id,
          orderNumber: o.orderNumber || `KX-ORD-${o._id.slice(-6).toUpperCase()}`,
          customerName: o.customerName || "KNITX Collector",
          customerEmail: o.customerEmail || "collector@knitx.in",
          totalAmountInr: typeof o.totalAmountInr === "number" ? o.totalAmountInr : 0,
          status: normalizeOrderStatus(o.status),
          paymentId: o.paymentId || "pay_demo_verified",
          shippingAddress: o.shippingAddress || "India",
          items: Array.isArray(o.items) ? o.items : [],
          createdAt: o.createdAt || new Date().toISOString(),
        }))
      : FALLBACK_ORDERS;

  return NextResponse.json({
    ok: true,
    hasWriteAccess: hasSanityWriteToken,
    drops,
    products,
    waitlist,
    candidates,
    submissions,
    orders,
    coreCount: CORE_COLLECTION_GARMENTS.length,
  });
}
