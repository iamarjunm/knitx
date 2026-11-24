"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  Eye,
  EyeOff,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  Package,
  Palette,
  Plus,
  RefreshCw,
  RotateCcw,
  Scissors,
  Search,
  Shirt,
  Sliders,
  Sparkles,
  Users,
  Vote,
  X,
} from "lucide-react";
import { useStorefrontConfig } from "@/context/StorefrontConfigContext";
import {
  CORE_COLLECTION_GARMENTS,
  DEFAULT_STOREFRONT_CONFIG,
  computeCoreLaunchDate,
  type CoreAccessMode,
  type StoreDropPhase,
  type StorefrontConfig,
} from "@/lib/core-catalog";
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

const SESSION_CODE_KEY = "knitx_admin_code";
const DEFAULT_PREVIEW_PASSCODE = "KNITX-ADMIN";

type AdminTab =
  | "overview"
  | "customizer"
  | "catalog"
  | "core"
  | "waitlist"
  | "vote"
  | "orders";

type ProductionStage =
  | "Confirmed"
  | "Pattern Cut"
  | "In Stitching"
  | "Quality Check"
  | "Dispatched";

type ApiOrderStatus =
  | "confirmed"
  | "pattern_cut"
  | "stitching"
  | "quality_check"
  | "dispatched";

const PRODUCTION_STAGES: ProductionStage[] = [
  "Confirmed",
  "Pattern Cut",
  "In Stitching",
  "Quality Check",
  "Dispatched",
];

const STAGE_TO_API_STATUS: Record<ProductionStage, ApiOrderStatus> = {
  Confirmed: "confirmed",
  "Pattern Cut": "pattern_cut",
  "In Stitching": "stitching",
  "Quality Check": "quality_check",
  Dispatched: "dispatched",
};

interface AdminWaitlistEntry {
  _id: string;
  name: string;
  email: string;
  position: number;
  status: "queued" | "invited" | "entered" | "admitted";
  accessCode: string;
  joinedAt: string;
}

interface AdminOrderItem {
  title: string;
  serialCode?: string;
  size: string;
  quantity: number;
  priceInr: number;
}

interface AdminOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: AdminOrderItem[];
  totalAmountInr: number;
  shippingAddress: string;
  status: ProductionStage;
  createdAt: string;
  paymentId?: string;
}

interface AdminOverviewResponse {
  ok?: boolean;
  error?: string;
  hasWriteAccess?: boolean;
  persistedToStudio?: boolean;
  studioSynced?: boolean;
  liveSync?: boolean;
  connected?: boolean;
  drop?: DropCampaign;
  drops?: DropCampaign[];
  products?: Product[];
  waitlist?: AdminWaitlistEntry[];
  orders?: Array<
    Omit<AdminOrder, "status" | "totalAmountInr" | "items"> & {
      status?: string;
      productionStage?: string;
      totalAmountInr?: number;
      totalInr?: number;
      items?: Array<{
        title?: string;
        productTitle?: string;
        serialCode?: string;
        size?: string;
        quantity?: number;
        priceInr?: number;
        product?: { title?: string; serialCode?: string; priceInr?: number };
      }>;
    }
  >;
  voteCandidates?: VoteCandidate[];
  candidates?: VoteCandidate[];
  submissions?: CreatorSubmissionItem[];
}

interface ToastMessage {
  id: number;
  tone: "success" | "error";
  text: string;
}

const ACCENT_PRESETS = [
  { name: "Signal Red", hex: "#E11D2E" },
  { name: "Jet Black", hex: "#000000" },
  { name: "Electric Cobalt", hex: "#1A4BFF" },
  { name: "Hunter Green", hex: "#143628" },
  { name: "Couture Garnet", hex: "#8C1D18" },
] as const;

const MINERAL_COLORWAYS = [
  { id: "chalk-bone", name: "Chalk Bone", hex: "#F2EFE9", borderHex: "#D4D0C8" },
  { id: "warm-sand", name: "Warm Sand", hex: "#C8BFA8" },
  { id: "mineral-slate", name: "Mineral Slate", hex: "#6E7378" },
  { id: "deep-espresso", name: "Deep Espresso", hex: "#332924" },
  { id: "washed-obsidian", name: "Washed Obsidian", hex: "#161618" },
  { id: "sage-stone", name: "Sage Stone", hex: "#6D7469" },
] as const;

const IMAGE_PRESETS = [
  { label: "1-of-1 Jacket", url: "/images/look-1of1-jacket.jpg" },
  { label: "1-of-1 Knit", url: "/images/look-1of1-knit.jpg" },
  { label: "Batch Hoodie", url: "/images/look-batch-hoodie.jpg" },
  { label: "Batch Tee", url: "/images/look-batch-tee.jpg" },
  { label: "Core Slate Hoodie", url: "/images/v12-core-hoodie-slate.jpg" },
  { label: "Core Duo", url: "/images/v12-core-campaign-duo.jpg" },
];

const FALLBACK_WAITLIST: AdminWaitlistEntry[] = [
  {
    _id: "wl-001",
    name: "Aarav Sharma",
    email: "aarav.sharma@studio.in",
    position: 101,
    status: "admitted",
    accessCode: "KX-A19F",
    joinedAt: "2026-11-18T09:15:00.000Z",
  },
  {
    _id: "wl-002",
    name: "Diya Menon",
    email: "diya.menon@archive.co",
    position: 102,
    status: "admitted",
    accessCode: "KX-B42C",
    joinedAt: "2026-11-18T11:40:00.000Z",
  },
  {
    _id: "wl-003",
    name: "Kabir Malhotra",
    email: "kabir.m@designhouse.in",
    position: 103,
    status: "queued",
    accessCode: "KX-C88E",
    joinedAt: "2026-11-19T08:05:00.000Z",
  },
  {
    _id: "wl-004",
    name: "Meera Nair",
    email: "meera.nair@atelier.in",
    position: 104,
    status: "queued",
    accessCode: "KX-D31A",
    joinedAt: "2026-11-19T14:22:00.000Z",
  },
  {
    _id: "wl-005",
    name: "Rohan Kulkarni",
    email: "rohan.k@craftlab.in",
    position: 105,
    status: "queued",
    accessCode: "KX-E74B",
    joinedAt: "2026-11-20T06:50:00.000Z",
  },
  {
    _id: "wl-006",
    name: "Zoya Khan",
    email: "zoya.khan@textile.in",
    position: 106,
    status: "queued",
    accessCode: "KX-F29D",
    joinedAt: "2026-11-20T17:10:00.000Z",
  },
  {
    _id: "wl-007",
    name: "Siddharth Rao",
    email: "siddharth.rao@collectors.in",
    position: 107,
    status: "queued",
    accessCode: "KX-G63C",
    joinedAt: "2026-11-21T10:30:00.000Z",
  },
  {
    _id: "wl-008",
    name: "Ananya Verma",
    email: "ananya.v@minimal.in",
    position: 108,
    status: "queued",
    accessCode: "KX-H95E",
    joinedAt: "2026-11-22T12:45:00.000Z",
  },
];

const FALLBACK_ORDERS: AdminOrder[] = [
  {
    _id: "ord-001",
    orderNumber: "KX-2026-0104",
    customerName: "Aarav Sharma",
    customerEmail: "aarav.sharma@studio.in",
    items: [
      {
        title: "KALI ARCHIVE BOMBER 01/01",
        serialCode: "KX-1O1-01",
        size: "ONE SIZE",
        quantity: 1,
        priceInr: 9800,
      },
    ],
    totalAmountInr: 9800,
    shippingAddress: "14 Indiranagar 100ft Rd, Bengaluru, Karnataka 560038",
    status: "In Stitching",
    createdAt: "2026-11-21T11:20:00.000Z",
    paymentId: "pay_kx_984210",
  },
  {
    _id: "ord-002",
    orderNumber: "KX-2026-0105",
    customerName: "Diya Menon",
    customerEmail: "diya.menon@archive.co",
    items: [
      {
        title: "MONOLITH 420GSM PUFF HOODIE",
        serialCode: "KX-SB-01",
        size: "L",
        quantity: 1,
        priceInr: 3850,
      },
      {
        title: "STEPWELL GRID CHAIN-STITCH TEE",
        serialCode: "KX-SB-02",
        size: "M",
        quantity: 1,
        priceInr: 2550,
      },
    ],
    totalAmountInr: 6400,
    shippingAddress: "28 Hauz Khas Enclave, New Delhi 110016",
    status: "Pattern Cut",
    createdAt: "2026-11-22T09:10:00.000Z",
    paymentId: "pay_kx_984315",
  },
  {
    _id: "ord-003",
    orderNumber: "KX-2026-0106",
    customerName: "Vikramaditya Sen",
    customerEmail: "vikram.sen@gallery.in",
    items: [
      {
        title: "RAW SEAM SLUB OVERSHIRT",
        serialCode: "KX-SB-04",
        size: "XL",
        quantity: 1,
        priceInr: 3950,
      },
    ],
    totalAmountInr: 3950,
    shippingAddress: "82 Jubilee Hills Rd 36, Hyderabad, Telangana 500033",
    status: "Quality Check",
    createdAt: "2026-11-23T15:40:00.000Z",
    paymentId: "pay_kx_984488",
  },
  {
    _id: "ord-004",
    orderNumber: "KX-2026-0107",
    customerName: "Nandini Bose",
    customerEmail: "nandini.b@atelier.co",
    items: [
      {
        title: "CONCRETE REBAR HEAVY CREWNECK",
        serialCode: "KX-SB-03",
        size: "M",
        quantity: 1,
        priceInr: 3450,
      },
    ],
    totalAmountInr: 3450,
    shippingAddress: "19 Park Street, Kolkata, West Bengal 700016",
    status: "Confirmed",
    createdAt: "2026-11-24T07:35:00.000Z",
    paymentId: "pay_kx_984602",
  },
];

function formatInr(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `₹${safe.toLocaleString("en-IN")}`;
}

function formatShortDate(iso: string, mounted: boolean): string {
  if (!mounted || !iso) return "—";
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return iso;
  return new Date(parsed).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isoToDatetimeLocal(iso: string): string {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return "2026-12-01T14:30";
  const d = new Date(parsed);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function datetimeLocalToIso(value: string, fallbackIso: string): string {
  if (!value) return fallbackIso;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return fallbackIso;
  return new Date(parsed).toISOString();
}

function normalizeStage(raw?: string): ProductionStage {
  const lower = (raw || "").trim().toLowerCase();
  if (lower.includes("pattern") || lower === "cut") return "Pattern Cut";
  if (lower.includes("stitch") || lower.includes("production"))
    return "In Stitching";
  if (lower.includes("quality") || lower === "qc") return "Quality Check";
  if (lower.includes("dispatch") || lower.includes("ship")) return "Dispatched";
  return "Confirmed";
}

function isAdmittedStatus(status: AdminWaitlistEntry["status"]): boolean {
  return status === "admitted" || status === "invited" || status === "entered";
}

function generateAccessCode(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return `KX-${hash.toString(16).toUpperCase().padStart(4, "0").slice(0, 4)}`;
}

function escapeCsvCell(val: string | number): string {
  const str = String(val ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

interface GarmentFormState {
  _id?: string;
  title: string;
  serialCode: string;
  priceInr: number;
  tier: ProductTier;
  totalUnits: number;
  remainingUnits: number;
  gsmWeight: string;
  fabric: string;
  imageUrl: string;
  isMystery: boolean;
  description: string;
}

const EMPTY_GARMENT_FORM: GarmentFormState = {
  title: "",
  serialCode: "KX-SB-09",
  priceInr: 3600,
  tier: "small-batch",
  totalUnits: 4,
  remainingUnits: 4,
  gsmWeight: "440 GSM",
  fabric: "100% Combed Ring-Spun Heavyweight Cotton",
  imageUrl: "/images/look-batch-hoodie.jpg",
  isMystery: false,
  description:
    "Numbered small-batch architectural garment cut to order in our studio.",
};

export default function AdminPortalClient() {
  const { config, saving: configSaving, updateConfig, resetConfig } =
    useStorefrontConfig();

  const [mounted, setMounted] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [passcodeInput, setPasscodeInput] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [liveSync, setLiveSync] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Operational data
  const [drop, setDrop] = useState<DropCampaign>(FALLBACK_DROP);
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [waitlist, setWaitlist] =
    useState<AdminWaitlistEntry[]>(FALLBACK_WAITLIST);
  const [orders, setOrders] = useState<AdminOrder[]>(FALLBACK_ORDERS);
  const [voteCandidates, setVoteCandidates] = useState<VoteCandidate[]>(
    FALLBACK_VOTE_CANDIDATES
  );
  const [submissions, setSubmissions] =
    useState<CreatorSubmissionItem[]>(FALLBACK_SUBMISSIONS);

  // Customizer draft state
  const [draft, setDraft] = useState<StorefrontConfig>(
    DEFAULT_STOREFRONT_CONFIG
  );
  const [draftDirty, setDraftDirty] = useState(false);

  // Active Drop Editor state (Drops & Catalog tab)
  const [dropDraft, setDropDraft] = useState({
    dropNumber: FALLBACK_DROP.dropNumber,
    title: FALLBACK_DROP.title,
    phase: FALLBACK_DROP.phase as DropPhase,
    launchDate: FALLBACK_DROP.launchDate,
  });

  // Catalog filters & drawer
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogTierFilter, setCatalogTierFilter] = useState<
    "all" | ProductTier
  >("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"edit" | "create">("edit");
  const [garmentForm, setGarmentForm] =
    useState<GarmentFormState>(EMPTY_GARMENT_FORM);

  // Core Wardrobe interactive swatch selection per garment
  const [selectedCoreSwatches, setSelectedCoreSwatches] = useState<
    Record<string, string>
  >(() => {
    const initial: Record<string, string> = {};
    for (const g of CORE_COLLECTION_GARMENTS) {
      initial[g._id] = g.defaultSwatchId;
    }
    return initial;
  });
  const [activeMineralFilter, setActiveMineralFilter] = useState<string>("all");

  // Waitlist filters
  const [waitlistQuery, setWaitlistQuery] = useState("");
  const [waitlistFilter, setWaitlistFilter] = useState<
    "all" | "queued" | "admitted"
  >("all");
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Submissions filter
  const [submissionFilter, setSubmissionFilter] = useState<
    "all" | "pending" | "approved_for_vote" | "selected"
  >("all");

  // Orders filter
  const [orderStageFilter, setOrderStageFilter] = useState<
    "all" | ProductionStage
  >("all");

  const pushToast = useCallback((tone: "success" | "error", text: string) => {
    const id = Date.now();
    setToast({ id, tone, text });
    window.setTimeout(() => {
      setToast((prev) => (prev && prev.id === id ? null : prev));
    }, 3600);
  }, []);

  // Sync draft when StorefrontConfig loads initially (if not actively edited)
  useEffect(() => {
    if (!draftDirty) {
      setDraft(config);
    }
  }, [config, draftDirty]);

  const fetchOverview = useCallback(
    async (code: string, isSignIn = false): Promise<boolean> => {
      if (isSignIn) {
        setAuthLoading(true);
        setAuthError("");
      } else {
        setRefreshing(true);
      }

      try {
        const res = await fetch("/api/admin/overview", {
          method: "GET",
          headers: {
            "x-knitx-admin-code": code.trim(),
          },
          cache: "no-store",
        });

        const data = (await res.json().catch(() => ({}))) as AdminOverviewResponse;

        if (res.status === 401 || res.status === 403) {
          setAuthenticated(false);
          if (typeof window !== "undefined") {
            window.sessionStorage.removeItem(SESSION_CODE_KEY);
          }
          setAuthError(
            data.error || "Invalid admin passcode. Verify credentials and retry."
          );
          return false;
        }

        if (!res.ok) {
          // Allow preview fallback if endpoint returns 404 during local bootstrap and code matches default
          if (
            res.status === 404 &&
            code.trim().toUpperCase() === DEFAULT_PREVIEW_PASSCODE
          ) {
            setAdminCode(code.trim());
            setAuthenticated(true);
            setLiveSync(false);
            if (typeof window !== "undefined") {
              window.sessionStorage.setItem(SESSION_CODE_KEY, code.trim());
            }
            return true;
          }
          setAuthError(
            data.error || "Unable to reach admin overview service."
          );
          return false;
        }

        const synced = Boolean(
          data.hasWriteAccess ??
            data.persistedToStudio ??
            data.studioSynced ??
            data.liveSync ??
            data.connected
        );
        setLiveSync(synced);

        const activeDrop =
          data.drop ||
          (Array.isArray(data.drops) && data.drops.length > 0
            ? data.drops[0]
            : undefined);

        if (activeDrop) {
          setDrop(activeDrop);
          setDropDraft({
            dropNumber: activeDrop.dropNumber,
            title: activeDrop.title,
            phase: activeDrop.phase,
            launchDate: activeDrop.launchDate,
          });
        }

        if (Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        }

        if (Array.isArray(data.waitlist) && data.waitlist.length > 0) {
          setWaitlist(data.waitlist);
        }

        if (Array.isArray(data.orders) && data.orders.length > 0) {
          const normalizedOrders: AdminOrder[] = data.orders.map((o, idx) => ({
            _id: o._id || `ord-live-${idx}`,
            orderNumber: o.orderNumber || `KX-2026-0${100 + idx}`,
            customerName: o.customerName || "KNITX Collector",
            customerEmail: o.customerEmail || "collector@knitx.in",
            items: Array.isArray(o.items)
              ? o.items.map((item) => ({
                  title:
                    item.title ||
                    item.productTitle ||
                    item.product?.title ||
                    "KNITX Piece",
                  serialCode: item.serialCode || item.product?.serialCode,
                  size: item.size || "L",
                  quantity: typeof item.quantity === "number" ? item.quantity : 1,
                  priceInr:
                    typeof item.priceInr === "number"
                      ? item.priceInr
                      : typeof item.product?.priceInr === "number"
                        ? item.product.priceInr
                        : 3500,
                }))
              : [],
            totalAmountInr:
              typeof o.totalAmountInr === "number"
                ? o.totalAmountInr
                : typeof o.totalInr === "number"
                  ? o.totalInr
                  : 0,
            shippingAddress:
              o.shippingAddress || "Studio Pickup / Priority Courier, India",
            status: normalizeStage(o.status || o.productionStage),
            createdAt: o.createdAt || new Date().toISOString(),
            paymentId: o.paymentId,
          }));
          setOrders(normalizedOrders);
        }

        const incomingVotes = data.voteCandidates || data.candidates;
        if (Array.isArray(incomingVotes) && incomingVotes.length > 0) {
          setVoteCandidates(incomingVotes);
        }

        if (Array.isArray(data.submissions) && data.submissions.length > 0) {
          setSubmissions(data.submissions);
        }

        setAdminCode(code.trim());
        setAuthenticated(true);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(SESSION_CODE_KEY, code.trim());
        }
        return true;
      } catch {
        if (code.trim().toUpperCase() === DEFAULT_PREVIEW_PASSCODE) {
          setAdminCode(code.trim());
          setAuthenticated(true);
          setLiveSync(false);
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(SESSION_CODE_KEY, code.trim());
          }
          return true;
        }
        setAuthError("Network error while verifying admin passcode.");
        return false;
      } finally {
        setAuthLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // Hydrate persisted session
  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    const saved = window.sessionStorage.getItem(SESSION_CODE_KEY);
    if (saved) {
      setPasscodeInput(saved);
      void fetchOverview(saved, true);
    }
  }, [fetchOverview]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeInput.trim()) {
      setAuthError("Enter your admin passcode to unlock Backstage.");
      return;
    }
    const ok = await fetchOverview(passcodeInput.trim(), true);
    if (ok) {
      pushToast("success", "Authenticated to KNITX Backstage Command Center.");
    }
  };

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(SESSION_CODE_KEY);
    }
    setAuthenticated(false);
    setAdminCode("");
    setPasscodeInput("");
    setAuthError("");
  };

  const postAdminAction = useCallback(
    async (action: string, payload: Record<string, unknown>) => {
      try {
        const res = await fetch("/api/admin/actions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-knitx-admin-code": adminCode,
          },
          body: JSON.stringify({ action, payload }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          persistedToStudio?: boolean;
          product?: Product;
          entry?: Partial<AdminWaitlistEntry>;
          admittedIds?: string[];
          candidate?: VoteCandidate;
        };
        return { ok: res.ok && data.ok !== false, status: res.status, data };
      } catch {
        return { ok: false, status: 0, data: {} };
      }
    },
    [adminCode]
  );

  // --- Computed Metrics ---
  const metrics = useMemo(() => {
    const queuedCount = waitlist.filter((w) => !isAdmittedStatus(w.status)).length;
    const admittedCount = waitlist.filter((w) => isAdmittedStatus(w.status)).length;
    const totalRevenueInr = orders.reduce(
      (sum, o) => sum + (Number.isFinite(o.totalAmountInr) ? o.totalAmountInr : 0),
      0
    );
    const totalUnits = products.reduce((sum, p) => sum + p.totalUnits, 0);
    const remainingUnits = products.reduce((sum, p) => sum + p.remainingUnits, 0);
    const veiledCount = products.filter((p) => p.isMystery).length;
    const pendingSubmissions = submissions.filter((s) => s.status === "pending").length;
    const totalVotes = voteCandidates.reduce((sum, c) => sum + c.votesCount, 0);

    return {
      totalWaitlist: waitlist.length,
      queuedCount,
      admittedCount,
      admitRate:
        waitlist.length > 0
          ? Math.round((admittedCount / waitlist.length) * 100)
          : 0,
      totalOrders: orders.length,
      totalRevenueInr,
      totalUnits,
      remainingUnits,
      veiledCount,
      pendingSubmissions,
      totalVotes,
    };
  }, [waitlist, orders, products, submissions, voteCandidates]);

  // --- Customizer Handlers ---
  const patchDraft = <K extends keyof StorefrontConfig>(
    key: K,
    value: StorefrontConfig[K]
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDraftDirty(true);
  };

  const handlePublishConfig = async (overridePatch?: Partial<StorefrontConfig>) => {
    const nextConfig = overridePatch ? { ...draft, ...overridePatch } : draft;
    if (overridePatch) {
      setDraft(nextConfig);
    }
    const result = await updateConfig(nextConfig, adminCode);
    if (result.ok) {
      setDraftDirty(false);
      pushToast(
        "success",
        result.persistedToStudio
          ? "Storefront configuration published to Live Store & Studio Sync."
          : "Storefront configuration published to Live Store (Preview Mode)."
      );
    } else {
      pushToast("error", result.error || "Unable to publish configuration.");
    }
  };

  const handleResetConfig = async () => {
    const result = await resetConfig(adminCode);
    setDraft(DEFAULT_STOREFRONT_CONFIG);
    setDraftDirty(false);
    if (result.ok) {
      pushToast("success", "Storefront configuration restored to house defaults.");
    } else {
      pushToast("error", result.error || "Unable to reset configuration.");
    }
  };

  // --- Drop & Catalog Handlers ---
  const handleUpdateActiveDrop = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyAction("update_drop");
    const updatedDrop: DropCampaign = {
      ...drop,
      dropNumber: dropDraft.dropNumber.trim() || drop.dropNumber,
      title: dropDraft.title.trim() || drop.title,
      phase: dropDraft.phase,
      launchDate: dropDraft.launchDate,
    };
    setDrop(updatedDrop);

    const mappedStorePhase: StoreDropPhase =
      updatedDrop.phase === "live"
        ? "live"
        : updatedDrop.phase === "sold_out"
          ? "sold_out"
          : "waitlist";

    const res = await postAdminAction("update_drop", {
      _id: updatedDrop._id,
      dropNumber: updatedDrop.dropNumber,
      title: updatedDrop.title,
      phase: updatedDrop.phase,
      launchDate: updatedDrop.launchDate,
    });

    await updateConfig(
      {
        activeDropNumber: updatedDrop.dropNumber,
        activeDropTitle: updatedDrop.title,
        dropPhase: mappedStorePhase,
        dropLaunchDate: updatedDrop.launchDate,
      },
      adminCode
    );
    setDraft((prev) => ({
      ...prev,
      activeDropNumber: updatedDrop.dropNumber,
      activeDropTitle: updatedDrop.title,
      dropPhase: mappedStorePhase,
      dropLaunchDate: updatedDrop.launchDate,
    }));

    setBusyAction(null);
    pushToast(
      "success",
      res.ok
        ? `Updated ${updatedDrop.dropNumber} — ${updatedDrop.title}.`
        : `Updated ${updatedDrop.dropNumber} locally (Preview Mode).`
    );
  };

  const handleToggleVeil = async (product: Product) => {
    const nextMystery = !product.isMystery;
    setBusyAction(`veil-${product._id}`);
    setProducts((prev) =>
      prev.map((p) =>
        p._id === product._id ? { ...p, isMystery: nextMystery } : p
      )
    );

    const res = await postAdminAction("update_product", {
      _id: product._id,
      isMystery: nextMystery,
    });

    setBusyAction(null);
    pushToast(
      "success",
      `${product.serialCode} ${nextMystery ? "veiled behind mystery curtain" : "revealed to storefront"}${res.ok ? "." : " (Preview Mode)."}`
    );
  };

  const openEditGarmentDrawer = (product: Product) => {
    setDrawerMode("edit");
    setGarmentForm({
      _id: product._id,
      title: product.title,
      serialCode: product.serialCode,
      priceInr: product.priceInr,
      tier: product.tier,
      totalUnits: product.totalUnits,
      remainingUnits: product.remainingUnits,
      gsmWeight: product.gsmWeight,
      fabric: product.fabric,
      imageUrl: product.imageUrl,
      isMystery: product.isMystery,
      description: product.description,
    });
    setDrawerOpen(true);
  };

  const openCreateGarmentDrawer = () => {
    setDrawerMode("create");
    const nextIndex = String(products.length + 1).padStart(2, "0");
    setGarmentForm({
      ...EMPTY_GARMENT_FORM,
      serialCode: `KX-SB-${nextIndex}`,
    });
    setDrawerOpen(true);
  };

  const handleSaveGarment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = garmentForm.title.trim().toUpperCase();
    if (!cleanTitle) {
      pushToast("error", "Garment title is required.");
      return;
    }

    const totalUnits = Math.max(
      1,
      garmentForm.tier === "one-of-one" ? 1 : Number(garmentForm.totalUnits) || 1
    );
    const remainingUnits = Math.max(
      0,
      Math.min(totalUnits, Number(garmentForm.remainingUnits) || 0)
    );

    setBusyAction("save_garment");

    if (drawerMode === "edit" && garmentForm._id) {
      const targetId = garmentForm._id;
      const patchFields = {
        title: cleanTitle,
        serialCode: garmentForm.serialCode.trim().toUpperCase(),
        priceInr: Math.max(100, Number(garmentForm.priceInr) || 1000),
        tier: garmentForm.tier,
        totalUnits,
        remainingUnits,
        gsmWeight: garmentForm.gsmWeight.trim() || "420 GSM",
        fabric: garmentForm.fabric.trim() || "100% Heavyweight Cotton",
        imageUrl: garmentForm.imageUrl.trim() || "/images/look-batch-hoodie.jpg",
        isMystery: garmentForm.isMystery,
        description: garmentForm.description.trim(),
      };

      setProducts((prev) =>
        prev.map((p) => (p._id === targetId ? { ...p, ...patchFields } : p))
      );

      await postAdminAction("update_product", {
        _id: targetId,
        ...patchFields,
      });

      setDrawerOpen(false);
      setBusyAction(null);
      pushToast("success", `Saved changes to ${patchFields.serialCode}.`);
      return;
    }

    // Create mode
    const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const newProduct: Product = {
      _id: `prod-kx-${Date.now()}`,
      title: cleanTitle,
      slug,
      serialCode: garmentForm.serialCode.trim().toUpperCase() || "KX-NEW-01",
      tier: garmentForm.tier,
      priceInr: Math.max(100, Number(garmentForm.priceInr) || 3500),
      totalUnits,
      remainingUnits,
      isMystery: garmentForm.isMystery,
      gsmWeight: garmentForm.gsmWeight.trim() || "440 GSM",
      fabric: garmentForm.fabric.trim() || "100% Heavyweight Indian Cotton",
      craftsmanship: [
        "Cut to order in our studio",
        "Individually numbered woven archive label",
      ],
      sizes:
        garmentForm.tier === "one-of-one"
          ? ["ONE SIZE (BOX FIT L/XL)"]
          : ["S", "M", "L", "XL"],
      description:
        garmentForm.description.trim() ||
        "Limited numbered KNITX garment crafted with zero deadstock.",
      imageUrl: garmentForm.imageUrl.trim() || "/images/look-batch-hoodie.jpg",
      silhouetteUrl: garmentForm.isMystery
        ? "/images/look-mystery-veil.jpg"
        : undefined,
      creatorCredit: "KNITX STUDIO",
      productionDays: garmentForm.tier === "one-of-one" ? 14 : 7,
    };

    const res = await postAdminAction("create_product", {
      title: newProduct.title,
      serialCode: newProduct.serialCode,
      tier: newProduct.tier,
      priceInr: newProduct.priceInr,
      totalUnits: newProduct.totalUnits,
      remainingUnits: newProduct.remainingUnits,
      isMystery: newProduct.isMystery,
      gsmWeight: newProduct.gsmWeight,
      fabric: newProduct.fabric,
      description: newProduct.description,
      imageUrl: newProduct.imageUrl,
      sizes: newProduct.sizes,
      craftsmanship: newProduct.craftsmanship,
      creatorCredit: newProduct.creatorCredit,
      productionDays: newProduct.productionDays,
    });

    const appended = res.data.product ? res.data.product : newProduct;
    setProducts((prev) => [appended, ...prev]);
    setDrawerOpen(false);
    setBusyAction(null);
    pushToast("success", `Added ${appended.serialCode} to catalog.`);
  };

  // --- Waitlist Handlers ---
  const handleAdmitSingle = async (entry: AdminWaitlistEntry) => {
    setBusyAction(`admit-${entry._id}`);
    const nextCode = entry.accessCode || generateAccessCode(entry.email);

    setWaitlist((prev) =>
      prev.map((w) =>
        w._id === entry._id
          ? { ...w, status: "admitted", accessCode: nextCode }
          : w
      )
    );

    const res = await postAdminAction("admit_waitlist", {
      _id: entry._id,
      status: "invited",
      position: entry.position,
      accessCode: nextCode,
      name: entry.name,
      email: entry.email,
    });

    if (res.data.entry) {
      setWaitlist((prev) =>
        prev.map((w) =>
          w._id === entry._id
            ? {
                ...w,
                status: res.data.entry?.status || "invited",
                accessCode: res.data.entry?.accessCode || w.accessCode,
              }
            : w
        )
      );
    }

    setBusyAction(null);
    pushToast(
      "success",
      `Admitted #${entry.position} ${entry.name} · Code ${nextCode}`
    );
  };

  const handleAdmitBatch = async (count = 5) => {
    const queued = waitlist
      .filter((w) => !isAdmittedStatus(w.status))
      .sort((a, b) => a.position - b.position)
      .slice(0, count);

    if (queued.length === 0) {
      pushToast("error", "No queued collectors remaining to admit.");
      return;
    }

    setBusyAction("admit_batch");
    const ids = new Set(queued.map((q) => q._id));

    setWaitlist((prev) =>
      prev.map((w) =>
        ids.has(w._id)
          ? {
              ...w,
              status: "admitted",
              accessCode: w.accessCode || generateAccessCode(w.email),
            }
          : w
      )
    );

    await postAdminAction("admit_batch", {
      count: queued.length,
      status: "invited",
      ids: queued.map((q) => q._id),
    });

    setBusyAction(null);
    pushToast(
      "success",
      `Admitted next ${queued.length} collector${queued.length === 1 ? "" : "s"} in queue.`
    );
  };

  const handleExportWaitlistCsv = () => {
    const headers = [
      "Position",
      "Name",
      "Email",
      "Status",
      "Access Code",
      "Joined At",
    ];
    const rows = waitlist.map((w) => [
      w.position,
      w.name,
      w.email,
      isAdmittedStatus(w.status) ? "ADMITTED" : "QUEUED",
      w.accessCode,
      w.joinedAt,
    ]);
    const csv = [
      headers.map(escapeCsvCell).join(","),
      ...rows.map((r) => r.map(escapeCsvCell).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `knitx-waitlist-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    pushToast("success", `Exported ${waitlist.length} waitlist entries to CSV.`);
  };

  const handleCopyCode = (id: string, code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(code);
      setCopiedCodeId(id);
      window.setTimeout(() => setCopiedCodeId(null), 1600);
    }
  };

  // --- Vote & Submissions Handlers ---
  const handlePromoteSubmission = async (sub: CreatorSubmissionItem) => {
    setBusyAction(`promote-${sub._id}`);
    setSubmissions((prev) =>
      prev.map((s) =>
        s._id === sub._id ? { ...s, status: "approved_for_vote" } : s
      )
    );

    const existingOnBallot = voteCandidates.some(
      (c) => c.title.toLowerCase() === sub.title.toLowerCase()
    );

    if (!existingOnBallot) {
      const nextCode = `D02-V${String(voteCandidates.length + 1).padStart(2, "0")}`;
      const newCandidate: VoteCandidate = {
        _id: `cand-promoted-${sub._id}`,
        title: sub.title,
        code: nextCode,
        creatorName: sub.creatorName,
        creatorHandle: sub.creatorHandle,
        tierSuggestion: sub.category.toLowerCase().includes("1-of-1")
          ? "one-of-one"
          : "small-batch",
        description: sub.craftsmanshipNotes,
        craftsmanship: [sub.category, "Community curated submission"],
        imageUrl: sub.imageUrl || "/images/look-batch-hoodie.jpg",
        votesCount: 1,
      };
      setVoteCandidates((prev) => [...prev, newCandidate]);
    }

    const res = await postAdminAction("promote_submission_to_vote", {
      _id: sub._id,
      title: sub.title,
      creatorName: sub.creatorName,
      creatorHandle: sub.creatorHandle,
      category: sub.category,
      craftsmanshipNotes: sub.craftsmanshipNotes,
      imageUrl: sub.imageUrl,
    });

    if (res.data.candidate && !existingOnBallot) {
      const serverCand = res.data.candidate;
      setVoteCandidates((prev) =>
        prev.map((c) =>
          c._id === `cand-promoted-${sub._id}` ? serverCand : c
        )
      );
    }

    setBusyAction(null);
    pushToast("success", `Approved "${sub.title}" onto the live Community Ballot.`);
  };

  const handleUpdateSubmissionStatus = async (
    sub: CreatorSubmissionItem,
    status: CreatorSubmissionItem["status"]
  ) => {
    setBusyAction(`sub-status-${sub._id}`);
    setSubmissions((prev) =>
      prev.map((s) => (s._id === sub._id ? { ...s, status } : s))
    );

    await postAdminAction("update_submission_status", {
      _id: sub._id,
      status,
    });

    setBusyAction(null);
    pushToast(
      "success",
      status === "selected"
        ? `Selected "${sub.title}" for Studio Production.`
        : `Updated "${sub.title}" status.`
    );
  };

  // --- Orders & Atelier Handler ---
  const handleOrderStageChange = async (
    order: AdminOrder,
    stage: ProductionStage
  ) => {
    setBusyAction(`order-${order._id}`);
    setOrders((prev) =>
      prev.map((o) => (o._id === order._id ? { ...o, status: stage } : o))
    );

    await postAdminAction("update_order_status", {
      _id: order._id,
      status: STAGE_TO_API_STATUS[stage],
    });

    setBusyAction(null);
    pushToast("success", `${order.orderNumber} moved to ${stage}.`);
  };

  // --- Filtered Lists ---
  const filteredProducts = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (catalogTierFilter !== "all" && p.tier !== catalogTierFilter) {
        return false;
      }
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.serialCode.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q)
      );
    });
  }, [products, catalogQuery, catalogTierFilter]);

  const filteredWaitlist = useMemo(() => {
    const q = waitlistQuery.trim().toLowerCase();
    return waitlist
      .filter((w) => {
        const admitted = isAdmittedStatus(w.status);
        if (waitlistFilter === "queued" && admitted) return false;
        if (waitlistFilter === "admitted" && !admitted) return false;
        if (!q) return true;
        return (
          w.name.toLowerCase().includes(q) ||
          w.email.toLowerCase().includes(q) ||
          w.accessCode.toLowerCase().includes(q) ||
          String(w.position).includes(q)
        );
      })
      .sort((a, b) => a.position - b.position);
  }, [waitlist, waitlistQuery, waitlistFilter]);

  const sortedBallot = useMemo(
    () => [...voteCandidates].sort((a, b) => b.votesCount - a.votesCount),
    [voteCandidates]
  );

  const filteredSubmissions = useMemo(() => {
    if (submissionFilter === "all") return submissions;
    return submissions.filter((s) => s.status === submissionFilter);
  }, [submissions, submissionFilter]);

  const filteredOrders = useMemo(() => {
    if (orderStageFilter === "all") return orders;
    return orders.filter((o) => o.status === orderStageFilter);
  }, [orders, orderStageFilter]);

  const filteredCoreGarments = useMemo(() => {
    if (activeMineralFilter === "all") return CORE_COLLECTION_GARMENTS;
    return CORE_COLLECTION_GARMENTS.filter((g) =>
      g.swatches.some((s) => s.id === activeMineralFilter)
    );
  }, [activeMineralFilter]);

  const computedCoreUnlockIso = useMemo(
    () =>
      computeCoreLaunchDate(
        draft.dropLaunchDate,
        draft.coreLaunchOffsetDays,
        draft.coreLaunchDateOverride
      ),
    [draft.dropLaunchDate, draft.coreLaunchOffsetDays, draft.coreLaunchDateOverride]
  );

  const navItems: Array<{
    id: AdminTab;
    label: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
  }> = [
    {
      id: "overview",
      label: "Overview",
      subtitle: "Live house telemetry, queue pulse & quick switches",
      icon: LayoutDashboard,
    },
    {
      id: "customizer",
      label: "Customizer",
      subtitle: "Live storefront studio, typography, accent & drop rules",
      icon: Sliders,
    },
    {
      id: "catalog",
      label: "Drops & Catalog",
      subtitle: "Active drop campaign, inventory stock & mystery veils",
      icon: Package,
      badge: products.length,
    },
    {
      id: "core",
      label: "Core Wardrobe",
      subtitle: "Heavyweight mineral basics, colorways & community gating",
      icon: Shirt,
      badge: CORE_COLLECTION_GARMENTS.length,
    },
    {
      id: "waitlist",
      label: "Waitlist & Queue",
      subtitle: "Collector intake, batch admission & CSV ledger export",
      icon: Users,
      badge: metrics.queuedCount,
    },
    {
      id: "vote",
      label: "Vote & Submit",
      subtitle: "Community ballot standings & creator moderation queue",
      icon: Vote,
      badge: metrics.pendingSubmissions || undefined,
    },
    {
      id: "orders",
      label: "Orders & Atelier",
      subtitle: "Cut-to-order fulfillment board & studio production stages",
      icon: Scissors,
      badge: orders.length,
    },
  ];

  const currentNav =
    navItems.find((item) => item.id === activeTab) || navItems[0];

  // ============================================================================
  // 1. SLEEK PASSCODE LOCK SCREEN
  // ============================================================================
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] text-[#000000] flex flex-col justify-between selection:bg-[#000000] selection:text-[#FFFFFF]">
        <header className="h-16 border-b border-[#E5E5E7] px-6 md:px-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-syne text-lg font-extrabold tracking-tight uppercase">
              {mounted ? config.brandName : "KNITX"}
            </span>
            <span className="h-4 w-px bg-[#E5E5E7]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#666666]">
              BACKSTAGE
            </span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#666666] hover:text-[#000000] transition-colors"
          >
            <span>Return to Storefront</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-[440px]">
            <div className="border border-[#E5E5E7] bg-[#FFFFFF] p-8 md:p-10">
              <div className="flex items-center justify-between mb-8">
                <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#666666]">
                  <Lock className="w-3.5 h-3.5 text-[#000000]" />
                  <span>KNITX BACKSTAGE · ADMIN PORTAL</span>
                </div>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: mounted ? config.accentColor : "#E11D2E",
                  }}
                />
              </div>

              <h1 className="font-syne text-2xl md:text-[28px] font-extrabold uppercase tracking-tight leading-[1.1] text-[#000000] mb-3">
                COMMAND CENTER
              </h1>
              <p className="text-[13px] leading-relaxed text-[#666666] mb-8">
                Authenticate with your studio passcode to configure the live
                storefront, manage drop inventory, admit collectors, and track
                atelier production.
              </p>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label
                    htmlFor="admin-passcode-input"
                    className="block font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#666666] mb-2"
                  >
                    ADMIN PASSCODE
                  </label>
                  <input
                    id="admin-passcode-input"
                    type="password"
                    value={passcodeInput}
                    onChange={(e) => {
                      setPasscodeInput(e.target.value);
                      if (authError) setAuthError("");
                    }}
                    placeholder="Enter passcode"
                    autoComplete="current-password"
                    suppressHydrationWarning
                    className="w-full h-11 px-3.5 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[13px] tracking-[0.08em] text-[#000000] placeholder:text-[#999999] focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF] transition-colors"
                  />
                </div>

                {authError && (
                  <div className="border border-[#E11D2E]/30 bg-[#E11D2E]/5 px-3.5 py-2.5 text-[12px] font-mono text-[#E11D2E]">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  suppressHydrationWarning
                  className="w-full h-11 bg-[#000000] text-[#FFFFFF] font-mono text-[11px] font-semibold uppercase tracking-[0.18em] rounded-[2px] hover:bg-[#1A1A1A] disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>VERIFYING CREDENTIALS</span>
                    </>
                  ) : (
                    <span>ENTER COMMAND CENTER</span>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-[#E5E5E7] flex items-center justify-between">
                <span className="text-[11px] text-[#666666]">
                  Default preview passcode:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPasscodeInput(DEFAULT_PREVIEW_PASSCODE);
                    setAuthError("");
                  }}
                  suppressHydrationWarning
                  className="font-mono text-[11px] font-semibold text-[#000000] bg-[#F8F8F9] border border-[#E5E5E7] px-2.5 py-1 rounded-[2px] hover:border-[#000000] transition-colors cursor-pointer"
                >
                  KNITX-ADMIN
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#666666]">
              <span>PROTECTED STUDIO SESSION</span>
              <span>INDIA ATELIER OPS</span>
            </div>
          </div>
        </main>

        <footer className="h-12 border-t border-[#E5E5E7] px-6 md:px-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-[#666666]">
          <span>KNITX HOUSE OPERATIONS</span>
          <span>STRICT ACCESS CONTROL</span>
        </footer>
      </div>
    );
  }

  // ============================================================================
  // 2. AUTHENTICATED COMMAND CENTER SHELL
  // ============================================================================
  return (
    <div className="min-h-screen bg-[#F8F8F9] text-[#000000] flex selection:bg-[#000000] selection:text-[#FFFFFF]">
      {/* Architectural Left Sidebar (Desktop) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[252px] lg:shrink-0 bg-[#FFFFFF] border-r border-[#E5E5E7] sticky top-0 h-screen">
        <div className="h-16 px-6 border-b border-[#E5E5E7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-syne text-[18px] font-extrabold tracking-tight uppercase">
              {draft.brandName || "KNITX"}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] px-1.5 py-0.5 border border-[#E5E5E7] bg-[#F8F8F9] text-[#666666] rounded-[2px]">
              ADMIN
            </span>
          </div>
          <span
            className="w-2.5 h-2.5 rounded-full border border-black/10"
            style={{ backgroundColor: draft.accentColor }}
            title={`Active accent: ${draft.accentColor}`}
          />
        </div>

        {/* Active Drop Pulse */}
        <div className="px-5 py-4 border-b border-[#E5E5E7] bg-[#F8F8F9]/60">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#666666]">
              {draft.activeDropNumber}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#000000]">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor:
                    draft.dropPhase === "live"
                      ? "#15803D"
                      : draft.dropPhase === "sold_out"
                        ? "#666666"
                        : draft.accentColor,
                }}
              />
              {draft.dropPhase.replace("_", " ")}
            </span>
          </div>
          <div className="font-syne text-[13px] font-bold uppercase tracking-tight truncate">
            {draft.activeDropTitle}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                suppressHydrationWarning
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[3px] text-left transition-colors cursor-pointer ${
                  active
                    ? "bg-[#000000] text-[#FFFFFF]"
                    : "text-[#666666] hover:bg-[#F8F8F9] hover:text-[#000000]"
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? "text-[#FFFFFF]" : "text-[#666666]"
                    }`}
                  />
                  <span className="text-[13px] font-medium truncate">
                    {item.label}
                  </span>
                </span>
                {item.badge !== undefined && (
                  <span
                    className={`font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded-[2px] ${
                      active
                        ? "bg-white/15 text-[#FFFFFF]"
                        : "bg-[#F8F8F9] text-[#666666] border border-[#E5E5E7]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Sidebar Actions */}
        <div className="p-4 border-t border-[#E5E5E7] space-y-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-9 px-3 border border-[#E5E5E7] bg-[#FFFFFF] hover:border-[#000000] rounded-[2px] flex items-center justify-between font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#000000] transition-colors"
          >
            <span>OPEN LIVE STORE</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={handleSignOut}
            suppressHydrationWarning
            className="w-full h-9 px-3 bg-[#F8F8F9] hover:bg-[#EFEFF1] rounded-[2px] flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666] hover:text-[#000000] transition-colors cursor-pointer"
          >
            <span>SIGN OUT</span>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Architectural Header */}
        <header className="sticky top-0 z-30 h-16 bg-[#FFFFFF]/95 backdrop-blur-sm border-b border-[#E5E5E7] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="lg:hidden font-syne text-sm font-extrabold uppercase">
                {draft.brandName || "KNITX"}
              </span>
              <span className="lg:hidden text-[#E5E5E7]">/</span>
              <h1 className="font-syne text-[16px] sm:text-[18px] font-extrabold uppercase tracking-tight truncate">
                {currentNav.label}
              </h1>
            </div>
            <p className="hidden sm:block text-[12px] text-[#666666] truncate">
              {currentNav.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Studio Sync Status Badge */}
            <div
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[2px] border font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${
                liveSync
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-[#E5E5E7] bg-[#F8F8F9] text-[#666666]"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  liveSync ? "bg-emerald-600" : "bg-[#666666]"
                }`}
              />
              <span>{liveSync ? "LIVE SYNC" : "PREVIEW MODE"}</span>
            </div>

            <button
              type="button"
              onClick={() => void fetchOverview(adminCode, false)}
              disabled={refreshing}
              title="Refresh live studio data"
              suppressHydrationWarning
              className="h-8 w-8 border border-[#E5E5E7] bg-[#FFFFFF] hover:border-[#000000] rounded-[2px] flex items-center justify-center text-[#000000] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 bg-[#000000] text-[#FFFFFF] hover:bg-[#1E1E1E] rounded-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors"
            >
              <span>OPEN LIVE STORE</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={handleSignOut}
              suppressHydrationWarning
              className="h-8 px-2.5 border border-[#E5E5E7] bg-[#FFFFFF] hover:border-[#000000] rounded-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#666666] hover:text-[#000000] transition-colors cursor-pointer"
            >
              SIGN OUT
            </button>
          </div>
        </header>

        {/* Mobile / Tablet Horizontal Tab Bar */}
        <div className="lg:hidden sticky top-16 z-20 bg-[#FFFFFF] border-b border-[#E5E5E7] overflow-x-auto">
          <div className="flex items-center px-3 py-2 gap-1.5 min-w-max">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  suppressHydrationWarning
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] font-mono text-[11px] uppercase tracking-[0.1em] transition-colors cursor-pointer ${
                    active
                      ? "bg-[#000000] text-[#FFFFFF]"
                      : "bg-[#F8F8F9] text-[#666666] border border-[#E5E5E7]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1520px] w-full mx-auto">
          {/* ================================================================ */}
          {/* TAB 1: OVERVIEW                                                  */}
          {/* ================================================================ */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* 4 Crisp KPI Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#666666]">
                      WAITLIST QUEUE
                    </span>
                    <Users className="w-4 h-4 text-[#666666]" />
                  </div>
                  <div className="font-mono text-3xl font-semibold tabular-nums text-[#000000]">
                    {metrics.queuedCount}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[12px] text-[#666666]">
                    <span>Awaiting admission</span>
                    <span className="font-mono text-[11px] tabular-nums text-[#000000]">
                      {metrics.totalWaitlist} total
                    </span>
                  </div>
                </div>

                <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#666666]">
                      ADMITTED COLLECTORS
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-[#000000]" />
                  </div>
                  <div className="font-mono text-3xl font-semibold tabular-nums text-[#000000]">
                    {metrics.admittedCount}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[12px] text-[#666666]">
                    <span>Access keys issued</span>
                    <span className="font-mono text-[11px] tabular-nums text-[#000000]">
                      {metrics.admitRate}% rate
                    </span>
                  </div>
                </div>

                <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#666666]">
                      ORDERS & REVENUE
                    </span>
                    <Activity className="w-4 h-4 text-[#666666]" />
                  </div>
                  <div className="font-mono text-3xl font-semibold tabular-nums text-[#000000]">
                    {formatInr(metrics.totalRevenueInr)}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[12px] text-[#666666]">
                    <span>Confirmed checkout volume</span>
                    <span className="font-mono text-[11px] tabular-nums text-[#000000]">
                      {metrics.totalOrders} orders
                    </span>
                  </div>
                </div>

                <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#666666]">
                      REMAINING DROP STOCK
                    </span>
                    <Package className="w-4 h-4 text-[#666666]" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-semibold tabular-nums text-[#000000]">
                      {metrics.remainingUnits}
                    </span>
                    <span className="font-mono text-sm tabular-nums text-[#666666]">
                      / {metrics.totalUnits} units
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 w-full bg-[#F8F8F9] border border-[#E5E5E7] overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${
                          metrics.totalUnits > 0
                            ? Math.round(
                                (metrics.remainingUnits / metrics.totalUnits) *
                                  100
                              )
                            : 0
                        }%`,
                        backgroundColor: draft.accentColor,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Live Quick-Toggles Control Strip */}
              <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] p-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div>
                    <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#666666] mb-2">
                      LIVE DROP PHASE SWITCHER
                    </div>
                    <div className="inline-flex flex-wrap border border-[#E5E5E7] bg-[#F8F8F9] p-1 rounded-[2px] gap-1">
                      {(
                        [
                          { id: "waitlist", label: "WAITLIST" },
                          { id: "live", label: "LIVE DROP" },
                          { id: "core_early", label: "CORE EARLY" },
                          { id: "sold_out", label: "SOLD OUT" },
                        ] as const
                      ).map((phase) => {
                        const active = draft.dropPhase === phase.id;
                        return (
                          <button
                            key={phase.id}
                            type="button"
                            onClick={() =>
                              void handlePublishConfig({ dropPhase: phase.id })
                            }
                            suppressHydrationWarning
                            className={`px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] rounded-[2px] transition-colors cursor-pointer ${
                              active
                                ? "bg-[#000000] text-[#FFFFFF]"
                                : "text-[#666666] hover:text-[#000000]"
                            }`}
                          >
                            {phase.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        void handlePublishConfig({
                          announcementEnabled: !draft.announcementEnabled,
                        })
                      }
                      suppressHydrationWarning
                      className={`h-10 px-4 border rounded-[2px] flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors cursor-pointer ${
                        draft.announcementEnabled
                          ? "bg-[#000000] text-[#FFFFFF] border-[#000000]"
                          : "bg-[#FFFFFF] text-[#000000] border-[#E5E5E7] hover:border-[#000000]"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: draft.announcementEnabled
                            ? draft.accentColor
                            : "#D4D4D8",
                        }}
                      />
                      <span>
                        ANNOUNCEMENT BAR:{" "}
                        {draft.announcementEnabled ? "ON" : "OFF"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void handlePublishConfig({
                          coreEnabled: !draft.coreEnabled,
                        })
                      }
                      suppressHydrationWarning
                      className={`h-10 px-4 border rounded-[2px] flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors cursor-pointer ${
                        draft.coreEnabled
                          ? "bg-[#000000] text-[#FFFFFF] border-[#000000]"
                          : "bg-[#FFFFFF] text-[#000000] border-[#E5E5E7] hover:border-[#000000]"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          draft.coreEnabled ? "bg-emerald-400" : "bg-[#D4D4D8]"
                        }`}
                      />
                      <span>
                        CORE WARDROBE: {draft.coreEnabled ? "ON" : "OFF"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Operational Two-Column Overview */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Recent Waitlist Arrivals */}
                <div className="xl:col-span-7 bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#E5E5E7] flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-syne text-[14px] font-extrabold uppercase tracking-tight">
                        RECENT WAITLIST ARRIVALS
                      </h2>
                      <p className="text-[12px] text-[#666666]">
                        Latest collector queue registrations
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleAdmitBatch(5)}
                        disabled={busyAction === "admit_batch"}
                        suppressHydrationWarning
                        className="h-8 px-3 bg-[#000000] text-[#FFFFFF] hover:bg-[#1E1E1E] rounded-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        ADMIT NEXT 5
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("waitlist")}
                        suppressHydrationWarning
                        className="h-8 px-3 border border-[#E5E5E7] hover:border-[#000000] rounded-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#000000] transition-colors cursor-pointer"
                      >
                        FULL QUEUE
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#E5E5E7] bg-[#F8F8F9] font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666]">
                          <th className="py-2.5 px-4 font-medium">#</th>
                          <th className="py-2.5 px-4 font-medium">COLLECTOR</th>
                          <th className="py-2.5 px-4 font-medium">STATUS</th>
                          <th className="py-2.5 px-4 font-medium">CODE</th>
                          <th className="py-2.5 px-4 font-medium text-right">
                            ACTION
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E7] text-[13px]">
                        {waitlist.slice(0, 6).map((entry) => {
                          const admitted = isAdmittedStatus(entry.status);
                          return (
                            <tr
                              key={entry._id}
                              className="hover:bg-[#F8F8F9]/60 transition-colors"
                            >
                              <td className="py-3 px-4 font-mono text-[12px] tabular-nums text-[#666666]">
                                #{entry.position}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-medium text-[#000000]">
                                  {entry.name}
                                </div>
                                <div className="font-mono text-[11px] text-[#666666]">
                                  {entry.email}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-[2px] font-mono text-[10px] uppercase tracking-[0.12em] ${
                                    admitted
                                      ? "bg-[#000000] text-[#FFFFFF]"
                                      : "bg-[#F8F8F9] text-[#666666] border border-[#E5E5E7]"
                                  }`}
                                >
                                  {admitted ? "ADMITTED" : "QUEUED"}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono text-[12px] tabular-nums text-[#000000]">
                                {entry.accessCode}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {admitted ? (
                                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#666666]">
                                    INVITED
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => void handleAdmitSingle(entry)}
                                    disabled={
                                      busyAction === `admit-${entry._id}`
                                    }
                                    suppressHydrationWarning
                                    className="px-2.5 py-1 border border-[#000000] text-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF] rounded-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors cursor-pointer"
                                  >
                                    ADMIT
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Studio Pulse & Shortcuts */}
                <div className="xl:col-span-5 space-y-4">
                  <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-syne text-[14px] font-extrabold uppercase tracking-tight">
                        STUDIO SNAPSHOT
                      </h2>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666]">
                        {draft.activeDropNumber}
                      </span>
                    </div>

                    <div className="divide-y divide-[#E5E5E7] text-[13px]">
                      <div className="py-3 flex items-center justify-between">
                        <span className="text-[#666666]">
                          Mystery Veiled Pieces
                        </span>
                        <span className="font-mono font-semibold tabular-nums">
                          {metrics.veiledCount} / {products.length}
                        </span>
                      </div>
                      <div className="py-3 flex items-center justify-between">
                        <span className="text-[#666666]">
                          Core Wardrobe Access
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-[0.12em] px-2 py-0.5 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px]">
                          {draft.coreAccessMode}
                        </span>
                      </div>
                      <div className="py-3 flex items-center justify-between">
                        <span className="text-[#666666]">
                          Core Unlock Date
                        </span>
                        <span className="font-mono text-[12px] tabular-nums">
                          {formatShortDate(computedCoreUnlockIso, mounted)}
                        </span>
                      </div>
                      <div className="py-3 flex items-center justify-between">
                        <span className="text-[#666666]">
                          Pending Creator Submissions
                        </span>
                        <span className="font-mono font-semibold tabular-nums">
                          {metrics.pendingSubmissions}
                        </span>
                      </div>
                      <div className="py-3 flex items-center justify-between">
                        <span className="text-[#666666]">
                          Community Ballot Votes
                        </span>
                        <span className="font-mono font-semibold tabular-nums">
                          {metrics.totalVotes.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#E5E5E7] grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab("customizer")}
                        suppressHydrationWarning
                        className="h-9 px-3 bg-[#000000] text-[#FFFFFF] hover:bg-[#1E1E1E] rounded-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors cursor-pointer"
                      >
                        OPEN CUSTOMIZER
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("orders")}
                        suppressHydrationWarning
                        className="h-9 px-3 border border-[#E5E5E7] hover:border-[#000000] rounded-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#000000] transition-colors cursor-pointer"
                      >
                        ATELIER BOARD
                      </button>
                    </div>
                  </div>

                  {/* Latest Orders Mini Feed */}
                  <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-syne text-[13px] font-extrabold uppercase tracking-tight">
                        ACTIVE PRODUCTION QUEUE
                      </h3>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666]">
                        {orders.length} ORDERS
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {orders.slice(0, 3).map((ord) => (
                        <div
                          key={ord._id}
                          className="p-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="font-mono text-[11px] font-semibold text-[#000000]">
                              {ord.orderNumber}
                            </div>
                            <div className="text-[12px] text-[#666666] truncate">
                              {ord.customerName} · {ord.items.length} item
                              {ord.items.length === 1 ? "" : "s"}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-mono text-[12px] font-semibold tabular-nums">
                              {formatInr(ord.totalAmountInr)}
                            </div>
                            <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#666666]">
                              {ord.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: CUSTOMIZER (LIVE STOREFRONT STUDIO)                       */}
          {/* ================================================================ */}
          {activeTab === "customizer" && (
            <div className="space-y-6">
              {/* Top Publish Action Bar */}
              <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] px-5 py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-[#000000]" />
                  <div>
                    <div className="font-syne text-[14px] font-extrabold uppercase tracking-tight">
                      LIVE STOREFRONT STUDIO
                    </div>
                    <div className="font-mono text-[11px] text-[#666666]">
                      {draftDirty ? (
                        <span className="text-[#E11D2E] font-semibold">
                          UNSAVED EDITS READY TO PUBLISH
                        </span>
                      ) : (
                        <span>SYNCED WITH ACTIVE STOREFRONT CONFIG</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => void handleResetConfig()}
                    disabled={configSaving}
                    suppressHydrationWarning
                    className="h-10 px-4 border border-[#E5E5E7] bg-[#FFFFFF] hover:border-[#000000] rounded-[2px] inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#000000] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>RESET TO DEFAULTS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handlePublishConfig()}
                    disabled={configSaving}
                    suppressHydrationWarning
                    className="h-10 px-5 bg-[#000000] text-[#FFFFFF] hover:bg-[#1E1E1E] rounded-[2px] inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {configSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>PUBLISHING...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>PUBLISH CHANGES TO LIVE STORE</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Split Controls + Live Interactive Mini-Preview */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Left Controls */}
                <div className="xl:col-span-7 space-y-5">
                  {/* 1. Brand & Theme Controls */}
                  <section className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] p-6 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-[#000000]" />
                        <h2 className="font-syne text-[14px] font-extrabold uppercase tracking-tight">
                          BRAND & THEME CONTROLS
                        </h2>
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666]">
                        IDENTITY
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666] mb-1.5">
                          BRAND NAME
                        </label>
                        <input
                          type="text"
                          value={draft.brandName}
                          onChange={(e) =>
                            patchDraft("brandName", e.target.value)
                          }
                          suppressHydrationWarning
                          className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-syne font-bold uppercase text-[13px] focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666] mb-1.5">
                          LOOKBOOK GRID COLUMNS
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {([3, 4] as const).map((cols) => (
                            <button
                              key={cols}
                              type="button"
                              onClick={() => patchDraft("gridColumns", cols)}
                              suppressHydrationWarning
                              className={`h-10 rounded-[2px] border font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors cursor-pointer ${
                                draft.gridColumns === cols
                                  ? "bg-[#000000] text-[#FFFFFF] border-[#000000]"
                                  : "bg-[#F8F8F9] text-[#666666] border-[#E5E5E7] hover:border-[#000000] hover:text-[#000000]"
                              }`}
                            >
                              {cols} COLUMNS
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Interactive Accent Color Swatch Picker */}
                    <div>
                      <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666] mb-2">
                        ACCENT COLOR SWATCHES & CUSTOM HEX
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
                        {ACCENT_PRESETS.map((preset) => {
                          const selected =
                            draft.accentColor.toLowerCase() ===
                            preset.hex.toLowerCase();
                          return (
                            <button
                              key={preset.hex}
                              type="button"
                              onClick={() =>
                                patchDraft("accentColor", preset.hex)
                              }
                              suppressHydrationWarning
                              className={`p-2.5 border rounded-[2px] text-left transition-all cursor-pointer ${
                                selected
                                  ? "border-[#000000] bg-[#F8F8F9]"
                                  : "border-[#E5E5E7] bg-[#FFFFFF] hover:border-[#000000]"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span
                                  className="w-5 h-5 rounded-[2px] border border-black/15"
                                  style={{ backgroundColor: preset.hex }}
                                />
                                {selected && (
                                  <Check className="w-3.5 h-3.5 text-[#000000]" />
                                )}
                              </div>
                              <div className="text-[11px] font-medium leading-tight text-[#000000]">
                                {preset.name}
                              </div>
                              <div className="font-mono text-[10px] text-[#666666]">
                                {preset.hex}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2.5">
                        <input
                          type="color"
                          value={
                            /^#[0-9A-Fa-f]{6}$/.test(draft.accentColor)
                              ? draft.accentColor
                              : "#E11D2E"
                          }
                          onChange={(e) =>
                            patchDraft("accentColor", e.target.value.toUpperCase())
                          }
                          suppressHydrationWarning
                          className="h-10 w-12 p-1 bg-[#FFFFFF] border border-[#E5E5E7] rounded-[2px] cursor-pointer"
                        />
                        <input
                          type="text"
                          value={draft.accentColor}
                          onChange={(e) =>
                            patchDraft("accentColor", e.target.value)
                          }
                          placeholder="#E11D2E"
                          suppressHydrationWarning
                          className="w-40 h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[12px] uppercase focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                        />
                        <span className="text-[12px] text-[#666666]">
                          Applies live to badges, status dots & active accents
                        </span>
                      </div>
                    </div>

                    {/* Top Announcement Bar */}
                    <div className="pt-3 border-t border-[#E5E5E7] space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[13px] font-medium text-[#000000]">
                            Top Announcement Banner
                          </div>
                          <div className="text-[12px] text-[#666666]">
                            Pinned architectural marquee strip above the navbar
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            patchDraft(
                              "announcementEnabled",
                              !draft.announcementEnabled
                            )
                          }
                          suppressHydrationWarning
                          className={`h-8 px-3 rounded-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.14em] border transition-colors cursor-pointer ${
                            draft.announcementEnabled
                              ? "bg-[#000000] text-[#FFFFFF] border-[#000000]"
                              : "bg-[#F8F8F9] text-[#666666] border-[#E5E5E7]"
                          }`}
                        >
                          {draft.announcementEnabled ? "ENABLED" : "DISABLED"}
                        </button>
                      </div>

                      <input
                        type="text"
                        value={draft.announcementText}
                        onChange={(e) =>
                          patchDraft("announcementText", e.target.value)
                        }
                        placeholder="Announcement bar copy..."
                        suppressHydrationWarning
                        className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[12px] focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                      />
                    </div>
                  </section>

                  {/* 2. Hero & Copy Studio */}
                  <section className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
                      <h2 className="font-syne text-[14px] font-extrabold uppercase tracking-tight">
                        HERO & COPY STUDIO
                      </h2>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666]">
                        EDITORIAL COPY
                      </span>
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666] mb-1.5">
                        HERO EYEBROW TEXT
                      </label>
                      <input
                        type="text"
                        value={draft.heroEyebrow}
                        onChange={(e) =>
                          patchDraft("heroEyebrow", e.target.value)
                        }
                        suppressHydrationWarning
                        className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[12px] focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666] mb-1.5">
                        HERO HEADLINE OVERRIDE (LEAVE BLANK TO USE ACTIVE DROP
                        TITLE)
                      </label>
                      <input
                        type="text"
                        value={draft.heroTitleOverride}
                        onChange={(e) =>
                          patchDraft("heroTitleOverride", e.target.value)
                        }
                        placeholder={draft.activeDropTitle}
                        suppressHydrationWarning
                        className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-syne font-bold uppercase text-[13px] focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666] mb-1.5">
                        HERO SUBTITLE
                      </label>
                      <textarea
                        rows={3}
                        value={draft.heroSubtitle}
                        onChange={(e) =>
                          patchDraft("heroSubtitle", e.target.value)
                        }
                        suppressHydrationWarning
                        className="w-full p-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] text-[13px] leading-relaxed focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666] mb-1.5">
                          PRIMARY CTA LABEL
                        </label>
                        <input
                          type="text"
                          value={draft.heroCtaPrimary}
                          onChange={(e) =>
                            patchDraft("heroCtaPrimary", e.target.value)
                          }
                          suppressHydrationWarning
                          className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[12px] uppercase focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666] mb-1.5">
                          SECONDARY CTA LABEL
                        </label>
                        <input
                          type="text"
                          value={draft.heroCtaSecondary}
                          onChange={(e) =>
                            patchDraft("heroCtaSecondary", e.target.value)
                          }
                          suppressHydrationWarning
                          className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[12px] uppercase focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666] mb-1.5">
                        FOOTER TAGLINE
                      </label>
                      <input
                        type="text"
                        value={draft.footerTagline}
                        onChange={(e) =>
                          patchDraft("footerTagline", e.target.value)
                        }
                        suppressHydrationWarning
                        className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[12px] focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                      />
                    </div>
                  </section>

                  {/* 3. Drop & Core Collection Controls */}
                  <section className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] p-6 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#000000]" />
                        <h2 className="font-syne text-[14px] font-extrabold uppercase tracking-tight">
                          DROP & CORE COLLECTION CONTROLS
                        </h2>
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666]">
                        ACCESS & SCHEDULE
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666] mb-1.5">
                          DROP PHASE
                        </label>
                        <select
                          value={draft.dropPhase}
                          onChange={(e) =>
                            patchDraft(
                              "dropPhase",
                              e.target.value as StoreDropPhase
                            )
                          }
                          suppressHydrationWarning
                          className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[12px] uppercase focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                        >
                          <option value="waitlist">WAITLIST</option>
                          <option value="live">LIVE</option>
                          <option value="core_early">CORE EARLY</option>
                          <option value="sold_out">SOLD OUT</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666] mb-1.5">
                          ACTIVE DROP NUMBER
                        </label>
                        <input
                          type="text"
                          value={draft.activeDropNumber}
                          onChange={(e) =>
                            patchDraft("activeDropNumber", e.target.value)
                          }
                          suppressHydrationWarning
                          className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[12px] uppercase focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666] mb-1.5">
                          ACTIVE DROP TITLE
                        </label>
                        <input
                          type="text"
                          value={draft.activeDropTitle}
                          onChange={(e) =>
                            patchDraft("activeDropTitle", e.target.value)
                          }
                          suppressHydrationWarning
                          className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-syne font-bold uppercase text-[12px] focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666] mb-1.5">
                          DROP LAUNCH DATE
                        </label>
                        <input
                          type="datetime-local"
                          value={isoToDatetimeLocal(draft.dropLaunchDate)}
                          onChange={(e) =>
                            patchDraft(
                              "dropLaunchDate",
                              datetimeLocalToIso(
                                e.target.value,
                                draft.dropLaunchDate
                              )
                            )
                          }
                          suppressHydrationWarning
                          className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[12px] focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666] mb-1.5">
                          CORE LAUNCH OFFSET (DAYS POST-DROP)
                        </label>
                        <div className="flex items-center gap-2.5">
                          <input
                            type="number"
                            min={1}
                            max={90}
                            value={draft.coreLaunchOffsetDays}
                            onChange={(e) =>
                              patchDraft(
                                "coreLaunchOffsetDays",
                                Math.max(1, Math.min(90, Number(e.target.value) || 14))
                              )
                            }
                            suppressHydrationWarning
                            className="w-24 h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[13px] tabular-nums focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                          />
                          <span className="font-mono text-[11px] text-[#666666]">
                            Opens {formatShortDate(computedCoreUnlockIso, mounted)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* KNITX CORE Sub-Panel */}
                    <div className="p-4 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-syne text-[13px] font-extrabold uppercase">
                            KNITX CORE WARDROBE
                          </div>
                          <div className="text-[12px] text-[#666666]">
                            Unbranded heavyweight mineral basics
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            patchDraft("coreEnabled", !draft.coreEnabled)
                          }
                          suppressHydrationWarning
                          className={`h-8 px-3 rounded-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.14em] border cursor-pointer ${
                            draft.coreEnabled
                              ? "bg-[#000000] text-[#FFFFFF] border-[#000000]"
                              : "bg-[#FFFFFF] text-[#666666] border-[#E5E5E7]"
                          }`}
                        >
                          {draft.coreEnabled ? "ENABLED" : "HIDDEN"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666] mb-1">
                            CORE TITLE
                          </label>
                          <input
                            type="text"
                            value={draft.coreTitle}
                            onChange={(e) =>
                              patchDraft("coreTitle", e.target.value)
                            }
                            suppressHydrationWarning
                            className="w-full h-9 px-3 bg-[#FFFFFF] border border-[#E5E5E7] rounded-[2px] font-syne font-bold uppercase text-[12px] focus:outline-none focus:border-[#000000]"
                          />
                        </div>
                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666] mb-1">
                            CORE ACCESS MODE
                          </label>
                          <select
                            value={draft.coreAccessMode}
                            onChange={(e) =>
                              patchDraft(
                                "coreAccessMode",
                                e.target.value as CoreAccessMode
                              )
                            }
                            suppressHydrationWarning
                            className="w-full h-9 px-3 bg-[#FFFFFF] border border-[#E5E5E7] rounded-[2px] font-mono text-[11px] focus:outline-none focus:border-[#000000]"
                          >
                            <option value="community">
                              Drop 1 & Community Waitlist
                            </option>
                            <option value="open">Open Public Access</option>
                            <option value="locked">Code Only</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666] mb-1">
                          CORE SUBTITLE
                        </label>
                        <textarea
                          rows={2}
                          value={draft.coreSubtitle}
                          onChange={(e) =>
                            patchDraft("coreSubtitle", e.target.value)
                          }
                          suppressHydrationWarning
                          className="w-full p-2.5 bg-[#FFFFFF] border border-[#E5E5E7] rounded-[2px] text-[12px] leading-relaxed focus:outline-none focus:border-[#000000]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666] mb-1">
                            MASTER DROP ACCESS CODE
                          </label>
                          <input
                            type="text"
                            value={draft.masterAccessCode}
                            onChange={(e) =>
                              patchDraft(
                                "masterAccessCode",
                                e.target.value.toUpperCase()
                              )
                            }
                            suppressHydrationWarning
                            className="w-full h-9 px-3 bg-[#FFFFFF] border border-[#E5E5E7] rounded-[2px] font-mono text-[12px] uppercase focus:outline-none focus:border-[#000000]"
                          />
                        </div>
                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666] mb-1">
                            CORE COMMUNITY CODE
                          </label>
                          <input
                            type="text"
                            value={draft.coreAccessCode}
                            onChange={(e) =>
                              patchDraft(
                                "coreAccessCode",
                                e.target.value.toUpperCase()
                              )
                            }
                            suppressHydrationWarning
                            className="w-full h-9 px-3 bg-[#FFFFFF] border border-[#E5E5E7] rounded-[2px] font-mono text-[12px] uppercase focus:outline-none focus:border-[#000000]"
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 4. Section Visibility Toggles */}
                  <section className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] p-6">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E5E7]">
                      <h2 className="font-syne text-[14px] font-extrabold uppercase tracking-tight">
                        SECTION VISIBILITY TOGGLES
                      </h2>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666]">
                        STOREFRONT MODULES
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(
                        [
                          {
                            key: "showVoteSection",
                            label: "Community Vote",
                            desc: "Drop 002 ballot",
                          },
                          {
                            key: "showSubmitSection",
                            label: "Creator Submissions",
                            desc: "Open design portal",
                          },
                          {
                            key: "showAtelierSection",
                            label: "The Atelier",
                            desc: "Craft & manifesto",
                          },
                        ] as const
                      ).map((item) => {
                        const enabled = draft[item.key];
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => patchDraft(item.key, !enabled)}
                            suppressHydrationWarning
                            className={`p-4 border rounded-[2px] text-left transition-colors cursor-pointer ${
                              enabled
                                ? "border-[#000000] bg-[#FFFFFF]"
                                : "border-[#E5E5E7] bg-[#F8F8F9] opacity-75"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">
                                {enabled ? "VISIBLE" : "HIDDEN"}
                              </span>
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{
                                  backgroundColor: enabled
                                    ? draft.accentColor
                                    : "#D4D4D8",
                                }}
                              />
                            </div>
                            <div className="text-[13px] font-semibold text-[#000000]">
                              {item.label}
                            </div>
                            <div className="text-[11px] text-[#666666]">
                              {item.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </div>

                {/* Right Sticky Live Interactive Mini-Preview */}
                <div className="xl:col-span-5 xl:sticky xl:top-24">
                  <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] overflow-hidden">
                    {/* Browser Frame Bar */}
                    <div className="px-4 py-2.5 bg-[#F8F8F9] border-b border-[#E5E5E7] flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#D4D4D8]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#D4D4D8]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#D4D4D8]" />
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666]">
                        LIVE STOREFRONT PREVIEW
                      </div>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: draft.accentColor }}
                      />
                    </div>

                    {/* Preview Viewport */}
                    <div className="bg-[#FFFFFF] text-[#000000]">
                      {/* Announcement Banner */}
                      {draft.announcementEnabled && (
                        <div
                          className="px-3 py-1.5 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-[#FFFFFF] truncate"
                          style={{ backgroundColor: draft.accentColor }}
                        >
                          {draft.announcementText || "ANNOUNCEMENT BAR"}
                        </div>
                      )}

                      {/* Mini Navbar */}
                      <div className="px-4 h-11 border-b border-[#E5E5E7] flex items-center justify-between">
                        <span className="font-syne text-[13px] font-extrabold uppercase tracking-tight">
                          {draft.brandName || "KNITX"}
                        </span>
                        <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[#666666]">
                          <span className="text-[#000000] font-semibold">
                            DROP
                          </span>
                          {draft.coreEnabled && <span>CORE</span>}
                          {draft.showVoteSection && <span>VOTE</span>}
                          {draft.showSubmitSection && <span>SUBMIT</span>}
                          {draft.showAtelierSection && <span>ATELIER</span>}
                        </div>
                        <span className="font-mono text-[9px] uppercase px-2 py-0.5 bg-[#000000] text-[#FFFFFF] rounded-[2px]">
                          BAG (0)
                        </span>
                      </div>

                      {/* Mini Hero */}
                      <div className="p-6 border-b border-[#E5E5E7] bg-[#F8F8F9]/60">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#666666] truncate">
                            {draft.heroEyebrow}
                          </span>
                          <span
                            className="shrink-0 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#FFFFFF] rounded-[2px]"
                            style={{ backgroundColor: draft.accentColor }}
                          >
                            {draft.dropPhase.replace("_", " ")}
                          </span>
                        </div>

                        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#666666] mb-1">
                          {draft.activeDropNumber}
                        </div>

                        <h3 className="font-syne text-[22px] font-extrabold uppercase tracking-tight leading-[1.05] text-[#000000] mb-2.5">
                          {draft.heroTitleOverride.trim() ||
                            draft.activeDropTitle}
                        </h3>

                        <p className="text-[11px] leading-relaxed text-[#666666] mb-5 line-clamp-3">
                          {draft.heroSubtitle}
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3.5 py-2 bg-[#000000] text-[#FFFFFF] font-mono text-[9px] font-semibold uppercase tracking-[0.16em] rounded-[2px]">
                            {draft.heroCtaPrimary || "JOIN WAITLIST"}
                          </span>
                          <span
                            className="px-3.5 py-2 border font-mono text-[9px] font-semibold uppercase tracking-[0.16em] rounded-[2px] bg-[#FFFFFF]"
                            style={{
                              borderColor: draft.accentColor,
                              color: draft.accentColor,
                            }}
                          >
                            {draft.heroCtaSecondary || "ENTER DROP"}
                          </span>
                        </div>
                      </div>

                      {/* Mini Lookbook Grid Reflecting 3 vs 4 Columns */}
                      <div className="p-5 border-b border-[#E5E5E7]">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#666666]">
                            LOOKBOOK GRID · {draft.gridColumns} COLUMNS
                          </span>
                          <span className="font-mono text-[9px] text-[#666666]">
                            {products.length} PIECES
                          </span>
                        </div>
                        <div
                          className={`grid gap-2 ${
                            draft.gridColumns === 3
                              ? "grid-cols-3"
                              : "grid-cols-4"
                          }`}
                        >
                          {products.slice(0, draft.gridColumns).map((p) => (
                            <div
                              key={p._id}
                              className="border border-[#E5E5E7] bg-[#F8F8F9] overflow-hidden"
                            >
                              <div className="aspect-[3/4] bg-[#EFEFF1] relative overflow-hidden">
                                <img
                                  src={p.imageUrl}
                                  alt={p.title}
                                  className="w-full h-full object-cover"
                                />
                                <span
                                  className="absolute top-1 left-1 px-1 py-0.5 font-mono text-[7px] uppercase text-[#FFFFFF]"
                                  style={{
                                    backgroundColor:
                                      p.tier === "one-of-one"
                                        ? draft.accentColor
                                        : "#000000",
                                  }}
                                >
                                  {p.tier === "one-of-one" ? "1/1" : "BATCH"}
                                </span>
                              </div>
                              <div className="p-1.5">
                                <div className="font-mono text-[8px] font-semibold truncate">
                                  {p.serialCode}
                                </div>
                                <div className="font-mono text-[8px] text-[#666666] tabular-nums">
                                  {formatInr(p.priceInr)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mini KNITX CORE Strip */}
                      {draft.coreEnabled && (
                        <div className="px-5 py-3.5 border-b border-[#E5E5E7] bg-[#F8F8F9] flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-syne text-[11px] font-extrabold uppercase truncate">
                              {draft.coreTitle}
                            </div>
                            <div className="font-mono text-[9px] text-[#666666] truncate">
                              Opens {formatShortDate(computedCoreUnlockIso, mounted)} ·{" "}
                              {draft.coreAccessMode.toUpperCase()}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {MINERAL_COLORWAYS.map((c) => (
                              <span
                                key={c.id}
                                className="w-3 h-3 rounded-full border border-black/15"
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mini Footer */}
                      <div className="px-5 py-3 bg-[#000000] text-[#FFFFFF] flex items-center justify-between gap-2">
                        <span className="font-syne text-[10px] font-bold uppercase">
                          {draft.brandName || "KNITX"}
                        </span>
                        <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/70 truncate">
                          {draft.footerTagline}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 3: DROPS & CATALOG                                           */}
          {/* ================================================================ */}
          {activeTab === "catalog" && (
            <div className="space-y-6">
              {/* Active Drop Editor Bar */}
              <form
                onSubmit={handleUpdateActiveDrop}
                className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-syne text-[14px] font-extrabold uppercase tracking-tight">
                      ACTIVE DROP CAMPAIGN EDITOR
                    </h2>
                    <p className="text-[12px] text-[#666666]">
                      Synchronizes active drop header, launch countdown, and
                      release phase
                    </p>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666]">
                    ID: {drop._id}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666] mb-1">
                      DROP NUMBER
                    </label>
                    <input
                      type="text"
                      value={dropDraft.dropNumber}
                      onChange={(e) =>
                        setDropDraft((p) => ({
                          ...p,
                          dropNumber: e.target.value,
                        }))
                      }
                      suppressHydrationWarning
                      className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[12px] uppercase focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666] mb-1">
                      DROP TITLE
                    </label>
                    <input
                      type="text"
                      value={dropDraft.title}
                      onChange={(e) =>
                        setDropDraft((p) => ({ ...p, title: e.target.value }))
                      }
                      suppressHydrationWarning
                      className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-syne font-bold uppercase text-[12px] focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666] mb-1">
                      CAMPAIGN PHASE
                    </label>
                    <select
                      value={dropDraft.phase}
                      onChange={(e) =>
                        setDropDraft((p) => ({
                          ...p,
                          phase: e.target.value as DropPhase,
                        }))
                      }
                      suppressHydrationWarning
                      className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[12px] uppercase focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                    >
                      <option value="teaser">TEASER</option>
                      <option value="voting">VOTING</option>
                      <option value="waitlist">WAITLIST</option>
                      <option value="live">LIVE</option>
                      <option value="sold_out">SOLD OUT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666] mb-1">
                      LAUNCH DATE
                    </label>
                    <input
                      type="datetime-local"
                      value={isoToDatetimeLocal(dropDraft.launchDate)}
                      onChange={(e) =>
                        setDropDraft((p) => ({
                          ...p,
                          launchDate: datetimeLocalToIso(
                            e.target.value,
                            p.launchDate
                          ),
                        }))
                      }
                      suppressHydrationWarning
                      className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[12px] focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busyAction === "update_drop"}
                    suppressHydrationWarning
                    className="h-10 px-4 bg-[#000000] text-[#FFFFFF] hover:bg-[#1E1E1E] rounded-[2px] font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {busyAction === "update_drop" ? "SAVING..." : "UPDATE DROP"}
                  </button>
                </div>
              </form>

              {/* Garment Inventory Table */}
              <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] overflow-hidden">
                <div className="p-5 border-b border-[#E5E5E7] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={catalogQuery}
                        onChange={(e) => setCatalogQuery(e.target.value)}
                        placeholder="Search serial, title, fabric..."
                        suppressHydrationWarning
                        className="h-9 pl-9 pr-3 w-64 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] text-[12px] focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                      />
                    </div>

                    <div className="inline-flex border border-[#E5E5E7] bg-[#F8F8F9] p-0.5 rounded-[2px]">
                      {(
                        [
                          { id: "all", label: "ALL" },
                          { id: "one-of-one", label: "1-OF-1" },
                          { id: "small-batch", label: "SMALL-BATCH" },
                        ] as const
                      ).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setCatalogTierFilter(t.id)}
                          suppressHydrationWarning
                          className={`px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] rounded-[2px] cursor-pointer ${
                            catalogTierFilter === t.id
                              ? "bg-[#000000] text-[#FFFFFF]"
                              : "text-[#666666] hover:text-[#000000]"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openCreateGarmentDrawer}
                    suppressHydrationWarning
                    className="h-9 px-4 bg-[#000000] text-[#FFFFFF] hover:bg-[#1E1E1E] rounded-[2px] inline-flex items-center justify-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>NEW GARMENT</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E5E7] bg-[#F8F8F9] font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666]">
                        <th className="py-3 px-4 font-medium">GARMENT</th>
                        <th className="py-3 px-4 font-medium">SERIAL</th>
                        <th className="py-3 px-4 font-medium">TIER</th>
                        <th className="py-3 px-4 font-medium">PRICE</th>
                        <th className="py-3 px-4 font-medium">STOCK</th>
                        <th className="py-3 px-4 font-medium">GSM</th>
                        <th className="py-3 px-4 font-medium">MYSTERY VEIL</th>
                        <th className="py-3 px-4 font-medium text-right">
                          EDIT
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E7] text-[13px]">
                      {filteredProducts.map((product) => (
                        <tr
                          key={product._id}
                          className="hover:bg-[#F8F8F9]/60 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.imageUrl}
                                alt={product.title}
                                className="w-10 h-12 object-cover border border-[#E5E5E7] bg-[#F8F8F9] shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-semibold text-[#000000] truncate max-w-[240px]">
                                  {product.title}
                                </div>
                                <div className="text-[11px] text-[#666666] truncate max-w-[240px]">
                                  {product.fabric}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[12px] text-[#000000]">
                            {product.serialCode}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className="inline-flex px-2 py-0.5 rounded-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.12em]"
                              style={
                                product.tier === "one-of-one"
                                  ? {
                                      backgroundColor: draft.accentColor,
                                      color: "#FFFFFF",
                                    }
                                  : {
                                      backgroundColor: "#F8F8F9",
                                      color: "#000000",
                                      border: "1px solid #E5E5E7",
                                    }
                              }
                            >
                              {product.tier === "one-of-one"
                                ? "1-OF-1"
                                : "SMALL-BATCH"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[12px] font-semibold tabular-nums">
                            {formatInr(product.priceInr)}
                          </td>
                          <td className="py-3 px-4 font-mono text-[12px] tabular-nums">
                            <span
                              className={
                                product.remainingUnits <= 1
                                  ? "text-[#E11D2E] font-semibold"
                                  : "text-[#000000]"
                              }
                            >
                              {product.remainingUnits}
                            </span>
                            <span className="text-[#666666]">
                              /{product.totalUnits}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#666666]">
                            {product.gsmWeight}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => void handleToggleVeil(product)}
                              disabled={busyAction === `veil-${product._id}`}
                              suppressHydrationWarning
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.12em] border transition-colors cursor-pointer ${
                                product.isMystery
                                  ? "bg-[#000000] text-[#FFFFFF] border-[#000000]"
                                  : "bg-[#FFFFFF] text-[#000000] border-[#E5E5E7] hover:border-[#000000]"
                              }`}
                            >
                              {product.isMystery ? (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  <span>VEILED</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" />
                                  <span>REVEALED</span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => openEditGarmentDrawer(product)}
                              suppressHydrationWarning
                              className="px-3 py-1 border border-[#E5E5E7] hover:border-[#000000] rounded-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#000000] transition-colors cursor-pointer"
                            >
                              EDIT
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 4: CORE WARDROBE                                             */}
          {/* ================================================================ */}
          {activeTab === "core" && (
            <div className="space-y-6">
              {/* Core Policy Controls */}
              <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] p-5 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <h2 className="font-syne text-[16px] font-extrabold uppercase tracking-tight">
                        {draft.coreTitle || "KNITX CORE"} · RELEASE POLICY
                      </h2>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px]">
                        6 SILHOUETTES · 6 MINERAL TONES
                      </span>
                    </div>
                    <p className="text-[12px] text-[#666666]">
                      Unlocks automatically {draft.coreLaunchOffsetDays} days
                      after {draft.activeDropNumber} (
                      {formatShortDate(computedCoreUnlockIso, mounted)})
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handlePublishConfig()}
                    disabled={configSaving}
                    suppressHydrationWarning
                    className="h-10 px-5 bg-[#000000] text-[#FFFFFF] hover:bg-[#1E1E1E] rounded-[2px] font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {configSaving ? "SAVING..." : "SAVE CORE POLICY"}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4 border-t border-[#E5E5E7]">
                  <div className="lg:col-span-2">
                    <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666] mb-2">
                      CORE ACCESS MODE
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(
                        [
                          {
                            id: "community",
                            label: "DROP 1 & COMMUNITY",
                            sub: "Waitlist & Drop 1 holders",
                          },
                          {
                            id: "open",
                            label: "OPEN PUBLIC",
                            sub: "Direct public checkout",
                          },
                          {
                            id: "locked",
                            label: "CODE ONLY",
                            sub: `Requires ${draft.coreAccessCode}`,
                          },
                        ] as const
                      ).map((mode) => {
                        const active = draft.coreAccessMode === mode.id;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => patchDraft("coreAccessMode", mode.id)}
                            suppressHydrationWarning
                            className={`p-3 border rounded-[2px] text-left transition-colors cursor-pointer ${
                              active
                                ? "bg-[#000000] text-[#FFFFFF] border-[#000000]"
                                : "bg-[#F8F8F9] text-[#000000] border-[#E5E5E7] hover:border-[#000000]"
                            }`}
                          >
                            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em]">
                              {mode.label}
                            </div>
                            <div
                              className={`text-[11px] mt-0.5 ${
                                active ? "text-white/75" : "text-[#666666]"
                              }`}
                            >
                              {mode.sub}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666] mb-2">
                      LAUNCH OFFSET (DAYS AFTER DROP 1)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={draft.coreLaunchOffsetDays}
                        onChange={(e) =>
                          patchDraft(
                            "coreLaunchOffsetDays",
                            Math.max(1, Math.min(90, Number(e.target.value) || 14))
                          )
                        }
                        suppressHydrationWarning
                        className="w-24 h-11 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[14px] font-semibold tabular-nums focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                      />
                      <div className="text-[12px] text-[#666666] leading-snug">
                        Default 14 days (2 weeks). Computed unlock:{" "}
                        <span className="font-mono text-[#000000]">
                          {formatShortDate(computedCoreUnlockIso, mounted)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mineral Colorways Directory */}
              <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-syne text-[13px] font-extrabold uppercase tracking-tight">
                      CURATED MINERAL COLORWAYS
                    </h3>
                    <p className="text-[12px] text-[#666666]">
                      Click any pigment bath to filter Core silhouettes
                    </p>
                  </div>
                  {activeMineralFilter !== "all" && (
                    <button
                      type="button"
                      onClick={() => setActiveMineralFilter("all")}
                      suppressHydrationWarning
                      className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#000000] underline cursor-pointer"
                    >
                      SHOW ALL 6 SILHOUETTES
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {MINERAL_COLORWAYS.map((tone) => {
                    const active = activeMineralFilter === tone.id;
                    const count = CORE_COLLECTION_GARMENTS.filter((g) =>
                      g.swatches.some((s) => s.id === tone.id)
                    ).length;
                    return (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() =>
                          setActiveMineralFilter(active ? "all" : tone.id)
                        }
                        suppressHydrationWarning
                        className={`p-3 border rounded-[2px] text-left transition-all cursor-pointer ${
                          active
                            ? "border-[#000000] bg-[#F8F8F9]"
                            : "border-[#E5E5E7] bg-[#FFFFFF] hover:border-[#000000]"
                        }`}
                      >
                        <div
                          className="w-full h-8 rounded-[2px] mb-2 border"
                          style={{
                            backgroundColor: tone.hex,
                            borderColor:
                              "borderHex" in tone ? tone.borderHex : "rgba(0,0,0,0.08)",
                          }}
                        />
                        <div className="text-[12px] font-semibold text-[#000000] truncate">
                          {tone.name}
                        </div>
                        <div className="flex items-center justify-between font-mono text-[10px] text-[#666666] mt-0.5">
                          <span>{tone.hex}</span>
                          <span>{count} pcs</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6 Heavyweight Plain Core Silhouettes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredCoreGarments.map((garment) => {
                  const chosenId =
                    selectedCoreSwatches[garment._id] || garment.defaultSwatchId;
                  const activeSwatch =
                    garment.swatches.find((s) => s.id === chosenId) ||
                    garment.swatches[0];

                  return (
                    <div
                      key={garment._id}
                      className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] overflow-hidden flex flex-col"
                    >
                      <div className="relative aspect-[4/3] bg-[#F8F8F9] border-b border-[#E5E5E7] overflow-hidden">
                        <img
                          src={activeSwatch.imageUrl}
                          alt={`${garment.title} in ${activeSwatch.name}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-[#000000] text-[#FFFFFF] font-mono text-[10px] font-semibold uppercase tracking-[0.12em] rounded-[2px]">
                            {garment.gsmWeight}
                          </span>
                          <span className="px-2 py-0.5 bg-[#FFFFFF]/95 text-[#000000] border border-[#E5E5E7] font-mono text-[10px] uppercase tracking-[0.12em] rounded-[2px]">
                            {garment.category}
                          </span>
                        </div>
                        <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-[#FFFFFF]/95 border border-[#E5E5E7] font-mono text-[10px] uppercase tracking-[0.1em] text-[#000000] rounded-[2px]">
                          {activeSwatch.name}
                        </span>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-mono text-[11px] text-[#666666]">
                              {garment.serialCode}
                            </span>
                            <span className="font-mono text-[14px] font-semibold tabular-nums text-[#000000]">
                              {formatInr(garment.priceInr)}
                            </span>
                          </div>
                          <h3 className="font-syne text-[14px] font-extrabold uppercase tracking-tight text-[#000000] mb-1">
                            {garment.title}
                          </h3>
                          <p className="text-[12px] text-[#666666] mb-3">
                            {garment.fit}
                          </p>
                          <div className="text-[11px] font-mono text-[#666666] bg-[#F8F8F9] border border-[#E5E5E7] px-2.5 py-1.5 rounded-[2px]">
                            {garment.fabric}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#E5E5E7] flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5">
                            {garment.swatches.map((sw) => {
                              const isSelected = sw.id === activeSwatch.id;
                              return (
                                <button
                                  key={sw.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedCoreSwatches((prev) => ({
                                      ...prev,
                                      [garment._id]: sw.id,
                                    }))
                                  }
                                  title={sw.name}
                                  suppressHydrationWarning
                                  className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                                    isSelected
                                      ? "ring-2 ring-[#000000] ring-offset-1 scale-105"
                                      : "hover:scale-105"
                                  }`}
                                  style={{
                                    backgroundColor: sw.hex,
                                    borderColor:
                                      sw.borderHex || "rgba(0,0,0,0.18)",
                                  }}
                                />
                              );
                            })}
                          </div>
                          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#666666]">
                            {garment.productionDays}D LEAD
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 5: WAITLIST & QUEUE                                          */}
          {/* ================================================================ */}
          {activeTab === "waitlist" && (
            <div className="space-y-5">
              {/* Summary Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666]">
                    TOTAL REGISTERED
                  </div>
                  <div className="font-mono text-2xl font-semibold tabular-nums mt-1">
                    {metrics.totalWaitlist}
                  </div>
                </div>
                <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666]">
                    CURRENTLY QUEUED
                  </div>
                  <div className="font-mono text-2xl font-semibold tabular-nums mt-1">
                    {metrics.queuedCount}
                  </div>
                </div>
                <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666]">
                    ADMITTED
                  </div>
                  <div className="font-mono text-2xl font-semibold tabular-nums mt-1">
                    {metrics.admittedCount}
                  </div>
                </div>
                <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666]">
                    ADMISSION RATIO
                  </div>
                  <div className="font-mono text-2xl font-semibold tabular-nums mt-1">
                    {metrics.admitRate}%
                  </div>
                </div>
              </div>

              {/* Queue Table Card */}
              <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] overflow-hidden">
                <div className="p-5 border-b border-[#E5E5E7] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={waitlistQuery}
                        onChange={(e) => setWaitlistQuery(e.target.value)}
                        placeholder="Search name, email, code..."
                        suppressHydrationWarning
                        className="h-9 pl-9 pr-3 w-64 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] text-[12px] focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                      />
                    </div>

                    <div className="inline-flex border border-[#E5E5E7] bg-[#F8F8F9] p-0.5 rounded-[2px]">
                      {(
                        [
                          { id: "all", label: "ALL" },
                          { id: "queued", label: "QUEUED" },
                          { id: "admitted", label: "ADMITTED" },
                        ] as const
                      ).map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setWaitlistFilter(st.id)}
                          suppressHydrationWarning
                          className={`px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] rounded-[2px] cursor-pointer ${
                            waitlistFilter === st.id
                              ? "bg-[#000000] text-[#FFFFFF]"
                              : "text-[#666666] hover:text-[#000000]"
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportWaitlistCsv}
                      suppressHydrationWarning
                      className="h-9 px-3.5 border border-[#E5E5E7] bg-[#FFFFFF] hover:border-[#000000] rounded-[2px] inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#000000] transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>EXPORT CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleAdmitBatch(5)}
                      disabled={busyAction === "admit_batch"}
                      suppressHydrationWarning
                      className="h-9 px-4 bg-[#000000] text-[#FFFFFF] hover:bg-[#1E1E1E] rounded-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      ADMIT NEXT 5 IN QUEUE
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E5E7] bg-[#F8F8F9] font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666]">
                        <th className="py-3 px-4 font-medium">QUEUE #</th>
                        <th className="py-3 px-4 font-medium">COLLECTOR</th>
                        <th className="py-3 px-4 font-medium">JOINED</th>
                        <th className="py-3 px-4 font-medium">STATUS</th>
                        <th className="py-3 px-4 font-medium">ACCESS CODE</th>
                        <th className="py-3 px-4 font-medium text-right">
                          ADMISSION
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E7] text-[13px]">
                      {filteredWaitlist.map((entry) => {
                        const admitted = isAdmittedStatus(entry.status);
                        return (
                          <tr
                            key={entry._id}
                            className="hover:bg-[#F8F8F9]/60 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono text-[12px] font-semibold tabular-nums text-[#000000]">
                              #{entry.position}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-[#000000]">
                                {entry.name}
                              </div>
                              <div className="font-mono text-[11px] text-[#666666]">
                                {entry.email}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-[#666666]">
                              {formatShortDate(entry.joinedAt, mounted)}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${
                                  admitted
                                    ? "bg-[#000000] text-[#FFFFFF]"
                                    : "bg-[#F8F8F9] text-[#666666] border border-[#E5E5E7]"
                                }`}
                              >
                                {admitted ? "ADMITTED" : "QUEUED"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[#000000]">
                                <span>{entry.accessCode}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyCode(entry._id, entry.accessCode)
                                  }
                                  title="Copy access code"
                                  suppressHydrationWarning
                                  className="p-1 text-[#666666] hover:text-[#000000] cursor-pointer"
                                >
                                  {copiedCodeId === entry._id ? (
                                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-700" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {admitted ? (
                                <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-[2px]">
                                  <Check className="w-3 h-3" />
                                  <span>CODE ACTIVE</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => void handleAdmitSingle(entry)}
                                  disabled={
                                    busyAction === `admit-${entry._id}`
                                  }
                                  suppressHydrationWarning
                                  className="px-3 py-1.5 bg-[#000000] text-[#FFFFFF] hover:bg-[#1E1E1E] rounded-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  CALL NUMBER / ADMIT
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {filteredWaitlist.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-10 text-center font-mono text-[12px] text-[#666666]"
                          >
                            No collectors match the current search or filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 6: VOTE & SUBMIT                                             */}
          {/* ================================================================ */}
          {activeTab === "vote" && (
            <div className="space-y-6">
              {/* Top: Live Community Ballot Standings */}
              <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-[#E5E5E7]">
                  <div>
                    <h2 className="font-syne text-[15px] font-extrabold uppercase tracking-tight">
                      LIVE COMMUNITY BALLOT STANDINGS
                    </h2>
                    <p className="text-[12px] text-[#666666]">
                      Real-time tallies determining the next Drop production
                      slate
                    </p>
                  </div>
                  <div className="font-mono text-[12px] tabular-nums bg-[#F8F8F9] border border-[#E5E5E7] px-3 py-1.5 rounded-[2px]">
                    {metrics.totalVotes.toLocaleString("en-IN")} TOTAL VOTES
                  </div>
                </div>

                <div className="space-y-4">
                  {sortedBallot.map((candidate, idx) => {
                    const share =
                      metrics.totalVotes > 0
                        ? Math.round(
                            (candidate.votesCount / metrics.totalVotes) * 100
                          )
                        : 0;
                    const isLeader = idx === 0;
                    return (
                      <div
                        key={candidate._id}
                        className="p-4 border border-[#E5E5E7] bg-[#F8F8F9]/50 rounded-[2px]"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className="w-7 h-7 shrink-0 rounded-[2px] flex items-center justify-center font-mono text-[11px] font-semibold"
                              style={
                                isLeader
                                  ? {
                                      backgroundColor: draft.accentColor,
                                      color: "#FFFFFF",
                                    }
                                  : {
                                      backgroundColor: "#FFFFFF",
                                      color: "#000000",
                                      border: "1px solid #E5E5E7",
                                    }
                              }
                            >
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            <img
                              src={candidate.imageUrl}
                              alt={candidate.title}
                              className="w-10 h-10 object-cover border border-[#E5E5E7] shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-syne text-[13px] font-bold uppercase truncate">
                                  {candidate.title}
                                </span>
                                <span className="font-mono text-[10px] text-[#666666]">
                                  {candidate.code}
                                </span>
                              </div>
                              <div className="font-mono text-[11px] text-[#666666]">
                                {candidate.creatorName} ({candidate.creatorHandle}
                                ) ·{" "}
                                {candidate.tierSuggestion === "one-of-one"
                                  ? "1-OF-1"
                                  : "SMALL-BATCH"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-baseline gap-3 shrink-0 font-mono tabular-nums">
                            <span className="text-[16px] font-semibold text-[#000000]">
                              {candidate.votesCount.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[11px] text-[#666666] w-10 text-right">
                              {share}%
                            </span>
                          </div>
                        </div>

                        <div className="h-1.5 w-full bg-[#E5E5E7] overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${Math.max(2, share)}%`,
                              backgroundColor: isLeader
                                ? draft.accentColor
                                : "#000000",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom: Creator Submissions Moderation Queue */}
              <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] overflow-hidden">
                <div className="p-5 border-b border-[#E5E5E7] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-syne text-[15px] font-extrabold uppercase tracking-tight">
                      CREATOR SUBMISSIONS MODERATION QUEUE
                    </h2>
                    <p className="text-[12px] text-[#666666]">
                      Promote community designs to the live ballot or greenlight
                      for studio sampling
                    </p>
                  </div>

                  <div className="inline-flex border border-[#E5E5E7] bg-[#F8F8F9] p-0.5 rounded-[2px]">
                    {(
                      [
                        { id: "all", label: "ALL" },
                        { id: "pending", label: "PENDING" },
                        { id: "approved_for_vote", label: "ON BALLOT" },
                        { id: "selected", label: "SELECTED" },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSubmissionFilter(f.id)}
                        suppressHydrationWarning
                        className={`px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] rounded-[2px] cursor-pointer ${
                          submissionFilter === f.id
                            ? "bg-[#000000] text-[#FFFFFF]"
                            : "text-[#666666] hover:text-[#000000]"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-[#E5E5E7]">
                  {filteredSubmissions.map((sub) => (
                    <div
                      key={sub._id}
                      className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#F8F8F9]/50 transition-colors"
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        <img
                          src={sub.imageUrl || "/images/look-batch-hoodie.jpg"}
                          alt={sub.title}
                          className="w-16 h-20 object-cover border border-[#E5E5E7] bg-[#F8F8F9] shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-syne text-[14px] font-extrabold uppercase">
                              {sub.title}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${
                                sub.status === "selected"
                                  ? "bg-[#000000] text-[#FFFFFF]"
                                  : sub.status === "approved_for_vote"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : "bg-[#F8F8F9] text-[#666666] border border-[#E5E5E7]"
                              }`}
                            >
                              {sub.status === "selected"
                                ? "SELECTED FOR PRODUCTION"
                                : sub.status === "approved_for_vote"
                                  ? "ON BALLOT"
                                  : "PENDING REVIEW"}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-[#666666] mb-1.5">
                            {sub.creatorName} ({sub.creatorHandle}) ·{" "}
                            {sub.category} ·{" "}
                            {formatShortDate(sub.createdAt, mounted)}
                          </div>
                          <p className="text-[12px] text-[#666666] max-w-2xl leading-relaxed">
                            {sub.craftsmanshipNotes}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => void handlePromoteSubmission(sub)}
                          disabled={
                            sub.status === "approved_for_vote" ||
                            busyAction === `promote-${sub._id}`
                          }
                          suppressHydrationWarning
                          className="h-9 px-3.5 border border-[#000000] bg-[#FFFFFF] text-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF] rounded-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors cursor-pointer disabled:opacity-40"
                        >
                          APPROVE FOR BALLOT
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void handleUpdateSubmissionStatus(sub, "selected")
                          }
                          disabled={
                            sub.status === "selected" ||
                            busyAction === `sub-status-${sub._id}`
                          }
                          suppressHydrationWarning
                          className="h-9 px-3.5 bg-[#000000] text-[#FFFFFF] hover:bg-[#1E1E1E] rounded-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors cursor-pointer disabled:opacity-40"
                        >
                          SELECT FOR PRODUCTION
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 7: ORDERS & ATELIER                                          */}
          {/* ================================================================ */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              {/* Pipeline Stage Selector Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <button
                  type="button"
                  onClick={() => setOrderStageFilter("all")}
                  suppressHydrationWarning
                  className={`p-3.5 border rounded-[3px] text-left transition-colors cursor-pointer ${
                    orderStageFilter === "all"
                      ? "bg-[#000000] text-[#FFFFFF] border-[#000000]"
                      : "bg-[#FFFFFF] text-[#000000] border-[#E5E5E7] hover:border-[#000000]"
                  }`}
                >
                  <div
                    className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
                      orderStageFilter === "all"
                        ? "text-white/70"
                        : "text-[#666666]"
                    }`}
                  >
                    ALL ORDERS
                  </div>
                  <div className="font-mono text-xl font-semibold tabular-nums mt-1">
                    {orders.length}
                  </div>
                </button>

                {PRODUCTION_STAGES.map((stage) => {
                  const count = orders.filter((o) => o.status === stage).length;
                  const active = orderStageFilter === stage;
                  return (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => setOrderStageFilter(stage)}
                      suppressHydrationWarning
                      className={`p-3.5 border rounded-[3px] text-left transition-colors cursor-pointer ${
                        active
                          ? "bg-[#000000] text-[#FFFFFF] border-[#000000]"
                          : "bg-[#FFFFFF] text-[#000000] border-[#E5E5E7] hover:border-[#000000]"
                      }`}
                    >
                      <div
                        className={`font-mono text-[10px] uppercase tracking-[0.12em] truncate ${
                          active ? "text-white/70" : "text-[#666666]"
                        }`}
                      >
                        {stage}
                      </div>
                      <div className="font-mono text-xl font-semibold tabular-nums mt-1">
                        {count}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Studio Cut-to-Order Fulfillment Board */}
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const stageIdx = PRODUCTION_STAGES.indexOf(order.status);
                  return (
                    <div
                      key={order._id}
                      className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] p-5"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-[#E5E5E7]">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="font-mono text-[14px] font-semibold text-[#000000]">
                              {order.orderNumber}
                            </span>
                            <span className="font-mono text-[11px] text-[#666666]">
                              {formatShortDate(order.createdAt, mounted)}
                            </span>
                            {order.paymentId && (
                              <span className="font-mono text-[10px] uppercase px-2 py-0.5 bg-[#F8F8F9] border border-[#E5E5E7] text-[#666666] rounded-[2px]">
                                CHECKOUT REF: {order.paymentId}
                              </span>
                            )}
                          </div>
                          <div className="text-[13px] font-medium text-[#000000]">
                            {order.customerName}{" "}
                            <span className="font-mono text-[12px] text-[#666666]">
                              · {order.customerEmail}
                            </span>
                          </div>
                          <div className="text-[12px] text-[#666666]">
                            Dispatch Address: {order.shippingAddress}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <div className="text-left lg:text-right">
                            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666]">
                              ORDER TOTAL
                            </div>
                            <div className="font-mono text-[18px] font-semibold tabular-nums text-[#000000]">
                              {formatInr(order.totalAmountInr)}
                            </div>
                          </div>

                          <div>
                            <label className="block font-mono text-[9px] uppercase tracking-[0.14em] text-[#666666] mb-1">
                              PRODUCTION STAGE
                            </label>
                            <select
                              value={order.status}
                              onChange={(e) =>
                                void handleOrderStageChange(
                                  order,
                                  e.target.value as ProductionStage
                                )
                              }
                              disabled={busyAction === `order-${order._id}`}
                              suppressHydrationWarning
                              className="h-9 px-3 bg-[#F8F8F9] border border-[#000000] rounded-[2px] font-mono text-[11px] font-semibold uppercase text-[#000000] focus:outline-none cursor-pointer"
                            >
                              {PRODUCTION_STAGES.map((stage) => (
                                <option key={stage} value={stage}>
                                  {stage}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Ordered Items */}
                      <div className="py-3.5 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {order.items.map((item, idx) => (
                          <div
                            key={`${order._id}-item-${idx}`}
                            className="px-3 py-2 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] flex items-center justify-between gap-2 text-[12px]"
                          >
                            <div className="min-w-0">
                              <span className="font-semibold text-[#000000]">
                                {item.title}
                              </span>
                              <span className="font-mono text-[11px] text-[#666666] ml-2">
                                {item.serialCode ? `${item.serialCode} · ` : ""}
                                Size {item.size} × {item.quantity}
                              </span>
                            </div>
                            <span className="font-mono font-semibold tabular-nums shrink-0">
                              {formatInr(item.priceInr * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* 5-Stage Atelier Progress Rail */}
                      <div className="pt-2 grid grid-cols-5 gap-1.5">
                        {PRODUCTION_STAGES.map((stage, idx) => {
                          const completed = idx <= stageIdx;
                          return (
                            <button
                              key={stage}
                              type="button"
                              onClick={() =>
                                void handleOrderStageChange(order, stage)
                              }
                              suppressHydrationWarning
                              className="text-left group cursor-pointer"
                            >
                              <div
                                className="h-1.5 w-full mb-1.5 transition-colors"
                                style={{
                                  backgroundColor: completed
                                    ? idx === stageIdx
                                      ? draft.accentColor
                                      : "#000000"
                                    : "#E5E5E7",
                                }}
                              />
                              <span
                                className={`block font-mono text-[9px] uppercase tracking-[0.1em] truncate ${
                                  completed
                                    ? "text-[#000000] font-semibold"
                                    : "text-[#666666] group-hover:text-[#000000]"
                                }`}
                              >
                                {stage}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {filteredOrders.length === 0 && (
                  <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-[3px] py-12 text-center font-mono text-[12px] text-[#666666]">
                    No studio orders currently in {orderStageFilter}.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* SLIDE-OVER GARMENT EDITOR / CREATOR DRAWER                           */}
      {/* ==================================================================== */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-[1px]">
          <div className="w-full max-w-[520px] bg-[#FFFFFF] border-l border-[#E5E5E7] h-full flex flex-col">
            <div className="h-16 px-6 border-b border-[#E5E5E7] flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-syne text-[15px] font-extrabold uppercase tracking-tight">
                  {drawerMode === "edit"
                    ? "EDIT GARMENT ARCHIVE"
                    : "NEW GARMENT PIECE"}
                </h2>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666]">
                  {garmentForm.serialCode || "NEW SERIAL"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                suppressHydrationWarning
                className="w-8 h-8 border border-[#E5E5E7] hover:border-[#000000] rounded-[2px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveGarment}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              {/* Live Image Preview */}
              <div className="flex items-center gap-4 p-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px]">
                <img
                  src={garmentForm.imageUrl || "/images/look-batch-hoodie.jpg"}
                  alt="Garment preview"
                  className="w-16 h-20 object-cover border border-[#E5E5E7] bg-[#FFFFFF] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#666666] mb-1.5">
                    QUICK STUDIO IMAGE PRESETS
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() =>
                          setGarmentForm((prev) => ({
                            ...prev,
                            imageUrl: preset.url,
                          }))
                        }
                        suppressHydrationWarning
                        className={`px-2 py-0.5 font-mono text-[9px] uppercase rounded-[2px] border cursor-pointer ${
                          garmentForm.imageUrl === preset.url
                            ? "bg-[#000000] text-[#FFFFFF] border-[#000000]"
                            : "bg-[#FFFFFF] text-[#666666] border-[#E5E5E7] hover:border-[#000000]"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#666666] mb-1">
                  GARMENT TITLE
                </label>
                <input
                  type="text"
                  required
                  value={garmentForm.title}
                  onChange={(e) =>
                    setGarmentForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="E.G. BASALT STRUCTURE BOMBER"
                  suppressHydrationWarning
                  className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-syne font-bold uppercase text-[12px] focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#666666] mb-1">
                    SERIAL CODE
                  </label>
                  <input
                    type="text"
                    required
                    value={garmentForm.serialCode}
                    onChange={(e) =>
                      setGarmentForm((p) => ({
                        ...p,
                        serialCode: e.target.value.toUpperCase(),
                      }))
                    }
                    suppressHydrationWarning
                    className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[12px] uppercase focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#666666] mb-1">
                    PRICE (INR)
                  </label>
                  <input
                    type="number"
                    min={100}
                    required
                    value={garmentForm.priceInr}
                    onChange={(e) =>
                      setGarmentForm((p) => ({
                        ...p,
                        priceInr: Number(e.target.value) || 0,
                      }))
                    }
                    suppressHydrationWarning
                    className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[12px] tabular-nums focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#666666] mb-1">
                    TIER
                  </label>
                  <select
                    value={garmentForm.tier}
                    onChange={(e) => {
                      const nextTier = e.target.value as ProductTier;
                      setGarmentForm((p) => ({
                        ...p,
                        tier: nextTier,
                        totalUnits: nextTier === "one-of-one" ? 1 : p.totalUnits,
                        remainingUnits:
                          nextTier === "one-of-one"
                            ? Math.min(1, p.remainingUnits)
                            : p.remainingUnits,
                      }));
                    }}
                    suppressHydrationWarning
                    className="w-full h-10 px-2.5 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[11px] uppercase focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                  >
                    <option value="small-batch">SMALL-BATCH</option>
                    <option value="one-of-one">ONE-OF-ONE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#666666] mb-1">
                    TOTAL UNITS
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={garmentForm.totalUnits}
                    onChange={(e) =>
                      setGarmentForm((p) => ({
                        ...p,
                        totalUnits: Number(e.target.value) || 1,
                      }))
                    }
                    suppressHydrationWarning
                    className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[12px] tabular-nums focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#666666] mb-1">
                    REMAINING
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={garmentForm.totalUnits}
                    value={garmentForm.remainingUnits}
                    onChange={(e) =>
                      setGarmentForm((p) => ({
                        ...p,
                        remainingUnits: Number(e.target.value) || 0,
                      }))
                    }
                    suppressHydrationWarning
                    className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[12px] tabular-nums focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#666666] mb-1">
                    GSM WEIGHT
                  </label>
                  <input
                    type="text"
                    value={garmentForm.gsmWeight}
                    onChange={(e) =>
                      setGarmentForm((p) => ({
                        ...p,
                        gsmWeight: e.target.value,
                      }))
                    }
                    suppressHydrationWarning
                    className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[12px] focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#666666] mb-1">
                    MYSTERY VEIL
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setGarmentForm((p) => ({ ...p, isMystery: !p.isMystery }))
                    }
                    suppressHydrationWarning
                    className={`w-full h-10 px-3 rounded-[2px] border font-mono text-[11px] font-semibold uppercase tracking-[0.12em] flex items-center justify-center gap-2 cursor-pointer ${
                      garmentForm.isMystery
                        ? "bg-[#000000] text-[#FFFFFF] border-[#000000]"
                        : "bg-[#F8F8F9] text-[#000000] border-[#E5E5E7]"
                    }`}
                  >
                    {garmentForm.isMystery ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>VEILED PIECE</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>REVEALED PIECE</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#666666] mb-1">
                  FABRIC COMPOSITION
                </label>
                <input
                  type="text"
                  value={garmentForm.fabric}
                  onChange={(e) =>
                    setGarmentForm((p) => ({ ...p, fabric: e.target.value }))
                  }
                  suppressHydrationWarning
                  className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] text-[12px] focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#666666] mb-1">
                  IMAGE URL
                </label>
                <input
                  type="text"
                  value={garmentForm.imageUrl}
                  onChange={(e) =>
                    setGarmentForm((p) => ({ ...p, imageUrl: e.target.value }))
                  }
                  suppressHydrationWarning
                  className="w-full h-10 px-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] font-mono text-[12px] focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#666666] mb-1">
                  STUDIO DESCRIPTION
                </label>
                <textarea
                  rows={3}
                  value={garmentForm.description}
                  onChange={(e) =>
                    setGarmentForm((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  suppressHydrationWarning
                  className="w-full p-3 bg-[#F8F8F9] border border-[#E5E5E7] rounded-[2px] text-[12px] leading-relaxed focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF]"
                />
              </div>

              <div className="pt-4 border-t border-[#E5E5E7] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  suppressHydrationWarning
                  className="h-10 px-4 border border-[#E5E5E7] hover:border-[#000000] rounded-[2px] font-mono text-[11px] font-semibold uppercase tracking-[0.12em] cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={busyAction === "save_garment"}
                  suppressHydrationWarning
                  className="h-10 px-5 bg-[#000000] text-[#FFFFFF] hover:bg-[#1E1E1E] rounded-[2px] font-mono text-[11px] font-semibold uppercase tracking-[0.14em] cursor-pointer disabled:opacity-50"
                >
                  {busyAction === "save_garment"
                    ? "SAVING..."
                    : drawerMode === "edit"
                      ? "SAVE CHANGES"
                      : "CREATE GARMENT"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ARCHITECTURAL TOAST NOTIFICATION                                     */}
      {/* ==================================================================== */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 max-w-md px-4 py-3 rounded-[2px] border shadow-lg flex items-center gap-2.5 font-mono text-[11px] tracking-[0.04em] ${
            toast.tone === "error"
              ? "bg-[#E11D2E] text-[#FFFFFF] border-[#E11D2E]"
              : "bg-[#000000] text-[#FFFFFF] border-[#000000]"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}
