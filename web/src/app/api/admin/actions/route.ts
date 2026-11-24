import crypto from "crypto";
import { NextResponse } from "next/server";
import type {
  CreatorSubmissionItem,
  DropCampaign,
  DropPhase,
  Product,
  ProductTier,
  VoteCandidate,
} from "@/lib/types";
import { hasSanityWriteToken, writeClient } from "@/sanity/lib/writeClient";

export const dynamic = "force-dynamic";

type SubmissionStatus = CreatorSubmissionItem["status"];
type WaitlistStatus = "queued" | "invited" | "entered";
type OrderStatus =
  | "confirmed"
  | "pattern_cut"
  | "stitching"
  | "quality_check"
  | "dispatched";

interface UpdateProductPayload {
  _id: string;
  title?: string;
  priceInr?: number;
  tier?: ProductTier;
  totalUnits?: number;
  remainingUnits?: number;
  isMystery?: boolean;
  gsmWeight?: string;
  fabric?: string;
  imageUrl?: string;
  serialCode?: string;
  description?: string;
  creatorCredit?: string;
  productionDays?: number;
}

interface CreateProductPayload {
  title: string;
  serialCode?: string;
  tier?: ProductTier;
  priceInr?: number;
  totalUnits?: number;
  remainingUnits?: number;
  isMystery?: boolean;
  gsmWeight?: string;
  fabric?: string;
  description?: string;
  imageUrl?: string;
  sizes?: string[];
  craftsmanship?: string[];
  creatorCredit?: string;
  productionDays?: number;
}

interface UpdateDropPayload {
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

interface AdmitWaitlistPayload {
  _id: string;
  status?: WaitlistStatus;
  position?: number;
  accessCode?: string;
  name?: string;
  email?: string;
}

interface AdmitBatchPayload {
  count?: number;
  status?: Extract<WaitlistStatus, "invited" | "entered">;
  ids?: string[];
}

interface UpdateSubmissionStatusPayload {
  _id: string;
  status: SubmissionStatus;
}

interface PromoteSubmissionPayload {
  _id: string;
  title?: string;
  creatorName?: string;
  creatorHandle?: string;
  category?: string;
  craftsmanshipNotes?: string;
  imageUrl?: string;
  tierSuggestion?: ProductTier;
  code?: string;
}

interface UpdateOrderStatusPayload {
  _id: string;
  status: OrderStatus;
}

type AdminActionRequest =
  | { action: "update_product"; payload: UpdateProductPayload }
  | { action: "create_product"; payload: CreateProductPayload }
  | { action: "update_drop"; payload: UpdateDropPayload }
  | { action: "admit_waitlist"; payload: AdmitWaitlistPayload }
  | { action: "admit_batch"; payload: AdmitBatchPayload }
  | {
      action: "update_submission_status";
      payload: UpdateSubmissionStatusPayload;
    }
  | { action: "promote_submission_to_vote"; payload: PromoteSubmissionPayload }
  | { action: "update_order_status"; payload: UpdateOrderStatusPayload };

const VALID_SUBMISSION_STATUSES = new Set<SubmissionStatus>([
  "pending",
  "approved_for_vote",
  "selected",
]);

const VALID_ORDER_STATUSES = new Set<OrderStatus>([
  "confirmed",
  "pattern_cut",
  "stitching",
  "quality_check",
  "dispatched",
]);

const VALID_DROP_PHASES = new Set<DropPhase>([
  "teaser",
  "voting",
  "waitlist",
  "live",
  "sold_out",
]);

const ORDER_STATUS_TO_STUDIO_STAGE: Record<OrderStatus, string> = {
  confirmed: "sample_confirmed",
  pattern_cut: "cutting_fabric",
  stitching: "embroidery_craft",
  quality_check: "quality_numbered",
  dispatched: "dispatched",
};

function isAuthorizedAdmin(request: Request): boolean {
  const provided = (request.headers.get("x-knitx-admin-code") ?? "")
    .trim()
    .toUpperCase();
  const expected = (process.env.ADMIN_PASSCODE || "KNITX-ADMIN")
    .trim()
    .toUpperCase();
  return provided.length > 0 && provided === expected;
}

function slugify(value: string): string {
  const cleaned = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || `knitx-piece-${crypto.randomBytes(3).toString("hex")}`;
}

function generateWaitlistAccessCode(position?: number): string {
  if (typeof position === "number" && Number.isFinite(position) && position > 0) {
    return `KX-${Math.round(position)}`;
  }
  return "KNITX-001";
}

async function handleUpdateProduct(payload: UpdateProductPayload) {
  const id = payload._id?.trim();
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Product _id is required." },
      { status: 400 }
    );
  }

  const patchFields: Partial<Omit<Product, "_id" | "slug">> = {};

  if (typeof payload.title === "string" && payload.title.trim()) {
    patchFields.title = payload.title.trim();
  }
  if (typeof payload.priceInr === "number" && Number.isFinite(payload.priceInr)) {
    patchFields.priceInr = Math.max(0, Math.round(payload.priceInr));
  }
  if (payload.tier === "small-batch" || payload.tier === "one-of-one") {
    patchFields.tier = payload.tier;
  }
  if (
    typeof payload.totalUnits === "number" &&
    Number.isFinite(payload.totalUnits)
  ) {
    patchFields.totalUnits = Math.max(1, Math.round(payload.totalUnits));
  }
  if (
    typeof payload.remainingUnits === "number" &&
    Number.isFinite(payload.remainingUnits)
  ) {
    const maxUnits = patchFields.totalUnits;
    const clamped = Math.max(0, Math.round(payload.remainingUnits));
    patchFields.remainingUnits =
      typeof maxUnits === "number" ? Math.min(maxUnits, clamped) : clamped;
  }
  if (typeof payload.isMystery === "boolean") {
    patchFields.isMystery = payload.isMystery;
  }
  if (typeof payload.gsmWeight === "string") {
    patchFields.gsmWeight = payload.gsmWeight.trim();
  }
  if (typeof payload.fabric === "string") {
    patchFields.fabric = payload.fabric.trim();
  }
  if (typeof payload.imageUrl === "string" && payload.imageUrl.trim()) {
    patchFields.imageUrl = payload.imageUrl.trim();
  }
  if (typeof payload.serialCode === "string" && payload.serialCode.trim()) {
    patchFields.serialCode = payload.serialCode.trim();
  }
  if (typeof payload.description === "string") {
    patchFields.description = payload.description.trim();
  }
  if (typeof payload.creatorCredit === "string") {
    patchFields.creatorCredit = payload.creatorCredit.trim();
  }
  if (
    typeof payload.productionDays === "number" &&
    Number.isFinite(payload.productionDays)
  ) {
    patchFields.productionDays = Math.max(1, Math.round(payload.productionDays));
  }

  let persistedToStudio = false;

  if (hasSanityWriteToken) {
    try {
      const exists = await writeClient.fetch<string | null>(
        `*[_type == "product" && _id == $id][0]._id`,
        { id },
        { cache: "no-store" }
      );
      if (exists) {
        await writeClient.patch(exists).set(patchFields).commit();
        persistedToStudio = true;
      }
    } catch {
      persistedToStudio = false;
    }
  }

  return NextResponse.json({
    ok: true,
    persistedToStudio,
    product: {
      _id: id,
      ...patchFields,
    },
  });
}

async function handleCreateProduct(payload: CreateProductPayload) {
  const title = payload.title?.trim();
  if (!title) {
    return NextResponse.json(
      { ok: false, error: "Product title is required." },
      { status: 400 }
    );
  }

  const tier: ProductTier =
    payload.tier === "one-of-one" ? "one-of-one" : "small-batch";
  const defaultUnits = tier === "one-of-one" ? 1 : 4;
  const totalUnits =
    typeof payload.totalUnits === "number" && Number.isFinite(payload.totalUnits)
      ? Math.max(1, Math.round(payload.totalUnits))
      : defaultUnits;
  const remainingUnits =
    typeof payload.remainingUnits === "number" &&
    Number.isFinite(payload.remainingUnits)
      ? Math.min(totalUnits, Math.max(0, Math.round(payload.remainingUnits)))
      : totalUnits;
  const priceInr =
    typeof payload.priceInr === "number" && Number.isFinite(payload.priceInr)
      ? Math.max(1, Math.round(payload.priceInr))
      : tier === "one-of-one"
        ? 8500
        : 3400;
  const slug = slugify(title);
  const serialCode =
    payload.serialCode?.trim() ||
    `KX-${tier === "one-of-one" ? "1O1" : "SB"}-${crypto
      .randomBytes(2)
      .toString("hex")
      .toUpperCase()}`;
  const gsmWeight = payload.gsmWeight?.trim() || "440 GSM";
  const fabric =
    payload.fabric?.trim() || "100% Combed Ring-Spun Heavyweight Cotton";
  const imageUrl =
    payload.imageUrl?.trim() ||
    (tier === "one-of-one"
      ? "/images/v12-drop-bomber-studio.jpg"
      : "/images/v12-core-hoodie-slate.jpg");
  const sizes =
    Array.isArray(payload.sizes) && payload.sizes.length > 0
      ? payload.sizes
      : tier === "one-of-one"
        ? ["OS"]
        : ["S", "M", "L", "XL"];
  const craftsmanship =
    Array.isArray(payload.craftsmanship) && payload.craftsmanship.length > 0
      ? payload.craftsmanship
      : [
          `${gsmWeight} architectural studio cut`,
          "Individually numbered woven KNITX edition plate",
        ];
  const description =
    payload.description?.trim() ||
    "Numbered KNITX release crafted in micro-batch quantities with zero restocks.";
  const creatorCredit = payload.creatorCredit?.trim() || "KNITX ATELIER";
  const productionDays =
    typeof payload.productionDays === "number" &&
    Number.isFinite(payload.productionDays)
      ? Math.max(3, Math.round(payload.productionDays))
      : tier === "one-of-one"
        ? 14
        : 8;
  const isMystery = Boolean(payload.isMystery);

  let productId = `prod-${crypto.randomBytes(5).toString("hex")}`;
  let persistedToStudio = false;

  if (hasSanityWriteToken) {
    try {
      const activeDropId = await writeClient.fetch<string | null>(
        `*[_type == "drop"] | order(_createdAt desc)[0]._id`,
        {},
        { cache: "no-store" }
      );

      interface NewProductDoc {
        _type: "product";
        title: string;
        slug: { _type: "slug"; current: string };
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
        creatorCredit: string;
        productionDays: number;
        drop?: { _type: "reference"; _ref: string };
      }

      const doc: NewProductDoc = {
        _type: "product",
        title,
        slug: { _type: "slug", current: slug },
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
        imageUrl,
        creatorCredit,
        productionDays,
      };

      if (activeDropId) {
        doc.drop = { _type: "reference", _ref: activeDropId };
      }

      const created = await writeClient.create(doc);
      if (created?._id) {
        productId = created._id;
        persistedToStudio = true;
      }
    } catch {
      persistedToStudio = false;
    }
  }

  const product: Product = {
    _id: productId,
    title,
    slug,
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
    imageUrl,
    creatorCredit,
    productionDays,
  };

  return NextResponse.json({
    ok: true,
    persistedToStudio,
    product,
  });
}

async function handleUpdateDrop(payload: UpdateDropPayload) {
  const patchFields: Partial<Omit<DropCampaign, "_id">> = {};

  if (typeof payload.dropNumber === "string" && payload.dropNumber.trim()) {
    patchFields.dropNumber = payload.dropNumber.trim();
  }
  if (typeof payload.title === "string" && payload.title.trim()) {
    patchFields.title = payload.title.trim();
  }
  if (typeof payload.subtitle === "string") {
    patchFields.subtitle = payload.subtitle.trim();
  }
  if (payload.phase && VALID_DROP_PHASES.has(payload.phase)) {
    patchFields.phase = payload.phase;
  }
  if (typeof payload.launchDate === "string" && payload.launchDate.trim()) {
    patchFields.launchDate = payload.launchDate.trim();
  }
  if (typeof payload.manifesto === "string") {
    patchFields.manifesto = payload.manifesto.trim();
  }
  if (
    typeof payload.waitlistCount === "number" &&
    Number.isFinite(payload.waitlistCount)
  ) {
    patchFields.waitlistCount = Math.max(0, Math.round(payload.waitlistCount));
  }
  if (
    typeof payload.totalSlots === "number" &&
    Number.isFinite(payload.totalSlots)
  ) {
    patchFields.totalSlots = Math.max(1, Math.round(payload.totalSlots));
  }

  let resolvedId = payload._id?.trim() || "drop-001-monsoon-concrete";
  let persistedToStudio = false;

  if (hasSanityWriteToken) {
    try {
      let targetId: string | null = null;
      if (payload._id?.trim()) {
        targetId = await writeClient.fetch<string | null>(
          `*[_type == "drop" && _id == $id][0]._id`,
          { id: payload._id.trim() },
          { cache: "no-store" }
        );
      }
      if (!targetId) {
        targetId = await writeClient.fetch<string | null>(
          `*[_type == "drop"] | order(_createdAt desc)[0]._id`,
          {},
          { cache: "no-store" }
        );
      }
      if (targetId) {
        await writeClient.patch(targetId).set(patchFields).commit();
        resolvedId = targetId;
        persistedToStudio = true;
      }
    } catch {
      persistedToStudio = false;
    }
  }

  return NextResponse.json({
    ok: true,
    persistedToStudio,
    drop: {
      _id: resolvedId,
      ...patchFields,
    },
  });
}

async function handleAdmitWaitlist(payload: AdmitWaitlistPayload) {
  const id = payload._id?.trim();
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Waitlist entry _id is required." },
      { status: 400 }
    );
  }

  const nextStatus: WaitlistStatus =
    payload.status === "entered" || payload.status === "queued"
      ? payload.status
      : "invited";

  let accessCode =
    payload.accessCode?.trim() || generateWaitlistAccessCode(payload.position);
  let position = payload.position;
  let name = payload.name;
  let email = payload.email;
  let persistedToStudio = false;

  if (hasSanityWriteToken) {
    try {
      const existing = await writeClient.fetch<{
        _id: string;
        position?: number;
        accessCode?: string;
        name?: string;
        email?: string;
      } | null>(
        `*[_type == "waitlistEntry" && _id == $id][0]{ _id, position, accessCode, name, email }`,
        { id },
        { cache: "no-store" }
      );

      if (existing) {
        position = existing.position ?? position;
        name = existing.name ?? name;
        email = existing.email ?? email;
        accessCode =
          existing.accessCode?.trim() ||
          payload.accessCode?.trim() ||
          generateWaitlistAccessCode(position);

        await writeClient
          .patch(existing._id)
          .set({ status: nextStatus, accessCode })
          .commit();
        persistedToStudio = true;
      }
    } catch {
      persistedToStudio = false;
    }
  }

  return NextResponse.json({
    ok: true,
    persistedToStudio,
    entry: {
      _id: id,
      status: nextStatus,
      accessCode,
      ...(typeof position === "number" ? { position } : {}),
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
    },
  });
}

async function handleAdmitBatch(payload: AdmitBatchPayload) {
  const count =
    typeof payload.count === "number" && Number.isFinite(payload.count)
      ? Math.min(50, Math.max(1, Math.round(payload.count)))
      : 5;
  const nextStatus: Extract<WaitlistStatus, "invited" | "entered"> =
    payload.status === "entered" ? "entered" : "invited";

  let admittedIds: string[] = [];
  let persistedToStudio = false;

  if (hasSanityWriteToken) {
    try {
      const queuedDocs = await writeClient.fetch<
        Array<{ _id: string; position?: number; accessCode?: string }>
      >(
        `*[_type == "waitlistEntry" && status == "queued"] | order(position asc)[0...${count}]{ _id, position, accessCode }`,
        {},
        { cache: "no-store" }
      );

      if (queuedDocs.length > 0) {
        const tx = writeClient.transaction();
        for (const doc of queuedDocs) {
          const accessCode =
            doc.accessCode?.trim() || generateWaitlistAccessCode(doc.position);
          tx.patch(doc._id, (patch) =>
            patch.set({ status: nextStatus, accessCode })
          );
        }
        await tx.commit();
        admittedIds = queuedDocs.map((doc) => doc._id);
        persistedToStudio = true;
      }
    } catch {
      persistedToStudio = false;
    }
  }

  if (!persistedToStudio && Array.isArray(payload.ids) && payload.ids.length > 0) {
    admittedIds = payload.ids
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .slice(0, count);
  }

  return NextResponse.json({
    ok: true,
    persistedToStudio,
    admittedIds,
  });
}

async function handleUpdateSubmissionStatus(
  payload: UpdateSubmissionStatusPayload
) {
  const id = payload._id?.trim();
  if (!id || !VALID_SUBMISSION_STATUSES.has(payload.status)) {
    return NextResponse.json(
      { ok: false, error: "Valid submission _id and status are required." },
      { status: 400 }
    );
  }

  let persistedToStudio = false;

  if (hasSanityWriteToken) {
    try {
      const exists = await writeClient.fetch<string | null>(
        `*[_type == "creatorSubmission" && _id == $id][0]._id`,
        { id },
        { cache: "no-store" }
      );
      if (exists) {
        await writeClient
          .patch(exists)
          .set({ status: payload.status })
          .commit();
        persistedToStudio = true;
      }
    } catch {
      persistedToStudio = false;
    }
  }

  return NextResponse.json({
    ok: true,
    persistedToStudio,
    submission: {
      _id: id,
      status: payload.status,
    },
  });
}

async function handlePromoteSubmissionToVote(
  payload: PromoteSubmissionPayload
) {
  const id = payload._id?.trim();
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Submission _id is required." },
      { status: 400 }
    );
  }

  interface SanitySubmissionDoc {
    _id: string;
    title?: string;
    creatorName?: string;
    creatorHandle?: string;
    category?: string;
    craftsmanshipNotes?: string;
    imageUrl?: string;
    mockupImage?: {
      _type: "image";
      asset: { _type: "reference"; _ref: string };
      alt?: string;
    };
  }

  let studioSub: SanitySubmissionDoc | null = null;
  let existingCandidateCount = 0;

  if (hasSanityWriteToken) {
    try {
      const [subDoc, countVal] = await Promise.all([
        writeClient.fetch<SanitySubmissionDoc | null>(
          `*[_type == "creatorSubmission" && _id == $id][0]{
            _id,
            title,
            creatorName,
            creatorHandle,
            category,
            craftsmanshipNotes,
            "imageUrl": coalesce(imageUrl, mockupImage.asset->url),
            mockupImage
          }`,
          { id },
          { cache: "no-store" }
        ),
        writeClient.fetch<number>(
          `count(*[_type == "designVoteCandidate"])`,
          {},
          { cache: "no-store" }
        ),
      ]);
      studioSub = subDoc;
      existingCandidateCount = typeof countVal === "number" ? countVal : 0;
    } catch {
      studioSub = null;
    }
  }

  const title =
    studioSub?.title?.trim() || payload.title?.trim() || "COMMUNITY CONCEPT";
  const creatorName =
    studioSub?.creatorName?.trim() ||
    payload.creatorName?.trim() ||
    "KNITX Creator";
  const creatorHandle =
    studioSub?.creatorHandle?.trim() ||
    payload.creatorHandle?.trim() ||
    "@knitx.creator";
  const category = studioSub?.category?.trim() || payload.category?.trim() || "";
  const description =
    studioSub?.craftsmanshipNotes?.trim() ||
    payload.craftsmanshipNotes?.trim() ||
    "Community-submitted garment concept promoted to the Drop 002 voting arena.";
  const imageUrl =
    studioSub?.imageUrl?.trim() ||
    payload.imageUrl?.trim() ||
    "/images/v12-core-hoodie-slate.jpg";
  const tierSuggestion: ProductTier =
    payload.tierSuggestion === "one-of-one" ||
    category.toLowerCase().includes("1-of-1")
      ? "one-of-one"
      : "small-batch";
  const code =
    payload.code?.trim() ||
    `D02-V${String(existingCandidateCount + 1).padStart(2, "0")}`;
  const craftsmanship = description
    .split(/[.;\n]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .slice(0, 3);

  let candidateId = `cand-${crypto.randomBytes(5).toString("hex")}`;
  let persistedToStudio = false;

  if (hasSanityWriteToken) {
    try {
      interface NewCandidateDoc {
        _type: "designVoteCandidate";
        title: string;
        code: string;
        creatorName: string;
        creatorHandle: string;
        tierSuggestion: ProductTier;
        description: string;
        craftsmanship: string[];
        imageUrl: string;
        votesCount: number;
        voterUids: string[];
        status: "voting";
        conceptImage?: {
          _type: "image";
          asset: { _type: "reference"; _ref: string };
          alt?: string;
        };
      }

      const candidateDoc: NewCandidateDoc = {
        _type: "designVoteCandidate",
        title,
        code,
        creatorName,
        creatorHandle,
        tierSuggestion,
        description,
        craftsmanship:
          craftsmanship.length > 0
            ? craftsmanship
            : ["Community atelier concept"],
        imageUrl,
        votesCount: 0,
        voterUids: [],
        status: "voting",
      };

      if (studioSub?.mockupImage?.asset?._ref) {
        candidateDoc.conceptImage = studioSub.mockupImage;
      }

      const created = await writeClient.create(candidateDoc);
      if (created?._id) {
        candidateId = created._id;
        persistedToStudio = true;
      }

      if (studioSub?._id) {
        await writeClient
          .patch(studioSub._id)
          .set({ status: "approved_for_vote" })
          .commit();
      }
    } catch {
      persistedToStudio = false;
    }
  }

  const candidate: VoteCandidate = {
    _id: candidateId,
    title,
    code,
    creatorName,
    creatorHandle,
    tierSuggestion,
    description,
    craftsmanship:
      craftsmanship.length > 0 ? craftsmanship : ["Community atelier concept"],
    imageUrl,
    votesCount: 0,
  };

  return NextResponse.json({
    ok: true,
    persistedToStudio,
    candidate,
    submissionId: id,
    submissionStatus: "approved_for_vote" as const,
  });
}

async function handleUpdateOrderStatus(payload: UpdateOrderStatusPayload) {
  const id = payload._id?.trim();
  if (!id || !VALID_ORDER_STATUSES.has(payload.status)) {
    return NextResponse.json(
      { ok: false, error: "Valid order _id and status are required." },
      { status: 400 }
    );
  }

  let persistedToStudio = false;

  if (hasSanityWriteToken) {
    try {
      const exists = await writeClient.fetch<string | null>(
        `*[_type == "order" && _id == $id][0]._id`,
        { id },
        { cache: "no-store" }
      );
      if (exists) {
        await writeClient
          .patch(exists)
          .set({
            status: payload.status,
            productionStage: ORDER_STATUS_TO_STUDIO_STAGE[payload.status],
          })
          .commit();
        persistedToStudio = true;
      }
    } catch {
      persistedToStudio = false;
    }
  }

  return NextResponse.json({
    ok: true,
    persistedToStudio,
    order: {
      _id: id,
      status: payload.status,
    },
  });
}

export async function POST(request: Request) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json(
      { ok: false, error: "Invalid admin passcode." },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as Partial<AdminActionRequest>;

    if (!body || typeof body.action !== "string" || !body.payload) {
      return NextResponse.json(
        { ok: false, error: "Action and payload are required." },
        { status: 400 }
      );
    }

    switch (body.action) {
      case "update_product":
        return handleUpdateProduct(body.payload as UpdateProductPayload);
      case "create_product":
        return handleCreateProduct(body.payload as CreateProductPayload);
      case "update_drop":
        return handleUpdateDrop(body.payload as UpdateDropPayload);
      case "admit_waitlist":
        return handleAdmitWaitlist(body.payload as AdmitWaitlistPayload);
      case "admit_batch":
        return handleAdmitBatch(body.payload as AdmitBatchPayload);
      case "update_submission_status":
        return handleUpdateSubmissionStatus(
          body.payload as UpdateSubmissionStatusPayload
        );
      case "promote_submission_to_vote":
        return handlePromoteSubmissionToVote(
          body.payload as PromoteSubmissionPayload
        );
      case "update_order_status":
        return handleUpdateOrderStatus(body.payload as UpdateOrderStatusPayload);
      default:
        return NextResponse.json(
          { ok: false, error: "Unsupported admin action." },
          { status: 400 }
        );
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to execute admin action." },
      { status: 500 }
    );
  }
}
