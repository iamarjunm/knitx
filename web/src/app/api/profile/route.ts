import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { hasSanityWriteToken, writeClient } from "@/sanity/lib/writeClient";

export const dynamic = "force-dynamic";

interface ProfileWaitlistDoc {
  _id: string;
  name?: string;
  email?: string;
  position?: number;
  status?: "queued" | "invited" | "entered";
  joinedAt?: string;
}

interface ProfileOrderItem {
  title?: string;
  serialCode?: string;
  size?: string;
  quantity?: number;
  priceInr?: number;
}

interface ProfileOrderDoc {
  _id: string;
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
  totalAmountInr?: number;
  status?: string;
  paymentId?: string;
  shippingAddress?: string;
  items?: ProfileOrderItem[];
  createdAt?: string;
}

interface ProfileSubmissionDoc {
  _id: string;
  title?: string;
  creatorName?: string;
  creatorHandle?: string;
  category?: string;
  craftsmanshipNotes?: string;
  status?: "pending" | "approved_for_vote" | "selected";
  createdAt?: string;
}

interface ProfileVoteDoc {
  _id: string;
  title?: string;
  code?: string;
  creatorHandle?: string;
  tierSuggestion?: "small-batch" | "one-of-one";
  votesCount?: number;
  imageUrl?: string;
}

function normalizeStage(
  raw?: string
): "confirmed" | "pattern_cut" | "stitching" | "quality_check" | "dispatched" {
  switch (raw) {
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
  const { searchParams } = new URL(request.url);
  const email = (searchParams.get("email") || "").trim().toLowerCase();
  const uid = (searchParams.get("uid") || "").trim();

  if (!email && !uid) {
    return NextResponse.json(
      { ok: false, error: "Email or uid query parameter is required." },
      { status: 400 }
    );
  }

  const readClient = hasSanityWriteToken ? writeClient : client;

  const [waitlistRes, ordersRes, submissionsRes, votesRes] =
    await Promise.allSettled([
      readClient.fetch<ProfileWaitlistDoc | null>(
        `*[_type == "waitlistEntry" && (lower(email) == $email || firebaseUid == $uid || uid == $uid)][0]{
          _id,
          name,
          email,
          position,
          status,
          "joinedAt": coalesce(joinedAt, _createdAt)
        }`,
        { email, uid },
        { cache: "no-store" }
      ),
      readClient.fetch<ProfileOrderDoc[]>(
        `*[_type == "order" && (lower(customerEmail) == $email || firebaseUid == $uid || uid == $uid)] | order(_createdAt desc)[0...30]{
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
        { email, uid },
        { cache: "no-store" }
      ),
      readClient.fetch<ProfileSubmissionDoc[]>(
        `*[_type == "creatorSubmission" && (lower(email) == $email || lower(contactEmail) == $email)] | order(_createdAt desc)[0...20]{
          _id,
          title,
          creatorName,
          creatorHandle,
          category,
          craftsmanshipNotes,
          status,
          "createdAt": coalesce(createdAt, _createdAt)
        }`,
        { email },
        { cache: "no-store" }
      ),
      readClient.fetch<ProfileVoteDoc[]>(
        `*[_type == "designVoteCandidate" && ($uid in voterUids)] | order(votesCount desc)[0...20]{
          _id,
          title,
          code,
          creatorHandle,
          tierSuggestion,
          votesCount,
          "imageUrl": coalesce(imageUrl, conceptImage.asset->url)
        }`,
        { uid },
        { cache: "no-store" }
      ),
    ]);

  const waitlistDoc =
    waitlistRes.status === "fulfilled" ? waitlistRes.value : null;
  const rawOrders =
    ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value)
      ? ordersRes.value
      : [];
  const rawSubmissions =
    submissionsRes.status === "fulfilled" && Array.isArray(submissionsRes.value)
      ? submissionsRes.value
      : [];
  const rawVotes =
    votesRes.status === "fulfilled" && Array.isArray(votesRes.value)
      ? votesRes.value
      : [];

  return NextResponse.json({
    ok: true,
    waitlist: waitlistDoc
      ? {
          _id: waitlistDoc._id,
          name: waitlistDoc.name || "KNITX Member",
          email: waitlistDoc.email || email,
          position:
            typeof waitlistDoc.position === "number" ? waitlistDoc.position : 0,
          status: waitlistDoc.status || "queued",
          joinedAt: waitlistDoc.joinedAt || new Date().toISOString(),
        }
      : null,
    orders: rawOrders.map((o) => ({
      _id: o._id,
      orderNumber: o.orderNumber || `KX-ORD-${o._id.slice(-6).toUpperCase()}`,
      customerName: o.customerName || "KNITX Member",
      customerEmail: o.customerEmail || email,
      totalAmountInr:
        typeof o.totalAmountInr === "number" ? o.totalAmountInr : 0,
      status: normalizeStage(o.status),
      paymentId: o.paymentId || "",
      shippingAddress: o.shippingAddress || "India",
      items: Array.isArray(o.items) ? o.items : [],
      createdAt: o.createdAt || new Date().toISOString(),
    })),
    submissions: rawSubmissions.map((s) => ({
      _id: s._id,
      title: s.title || "Untitled Concept",
      creatorName: s.creatorName || "KNITX Creator",
      creatorHandle: s.creatorHandle || "@creator",
      category: s.category || "Small-Batch",
      craftsmanshipNotes: s.craftsmanshipNotes || "",
      status: s.status || "pending",
      createdAt: s.createdAt || new Date().toISOString(),
    })),
    votes: rawVotes.map((v) => ({
      _id: v._id,
      title: v.title || "Ballot Silhouette",
      code: v.code || "KX-VOTE",
      creatorHandle: v.creatorHandle || "@knitx",
      tierSuggestion: v.tierSuggestion || "small-batch",
      votesCount: typeof v.votesCount === "number" ? v.votesCount : 0,
      imageUrl: v.imageUrl || "/images/look-1of1-knit.jpg",
    })),
  });
}
