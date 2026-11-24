import { NextResponse } from "next/server";
import {
  DEFAULT_STOREFRONT_CONFIG,
  type CoreAccessMode,
  type StoreDropPhase,
  type StorefrontConfig,
} from "@/lib/core-catalog";
import { client } from "@/sanity/lib/client";
import { hasSanityWriteToken, writeClient } from "@/sanity/lib/writeClient";

export const dynamic = "force-dynamic";

let memoryConfig: StorefrontConfig | null = null;

const VALID_DROP_PHASES = new Set<StoreDropPhase>([
  "waitlist",
  "live",
  "core_early",
  "sold_out",
]);

const VALID_CORE_ACCESS_MODES = new Set<CoreAccessMode>([
  "community",
  "open",
  "locked",
]);

interface SiteSettingsDoc {
  _id: string;
  brandName?: string;
  announcementTicker?: string;
  customizerConfig?: string;
}

function isAuthorizedAdmin(request: Request): boolean {
  const provided = (request.headers.get("x-knitx-admin-code") ?? "")
    .trim()
    .toUpperCase();
  const expected = (process.env.ADMIN_PASSCODE || "KNITX-ADMIN")
    .trim()
    .toUpperCase();
  return provided.length > 0 && provided === expected;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickString(
  input: Record<string, unknown>,
  key: keyof StorefrontConfig,
  fallback: string
): string {
  const value = input[key];
  return typeof value === "string" ? value : fallback;
}

function pickBoolean(
  input: Record<string, unknown>,
  key: keyof StorefrontConfig,
  fallback: boolean
): boolean {
  const value = input[key];
  return typeof value === "boolean" ? value : fallback;
}

function pickNumber(
  input: Record<string, unknown>,
  key: keyof StorefrontConfig,
  fallback: number,
  min: number,
  max: number
): number {
  const value = input[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(max, Math.max(min, Math.round(value)));
  }
  return fallback;
}

function mergeStorefrontConfig(
  raw: unknown,
  base: StorefrontConfig = DEFAULT_STOREFRONT_CONFIG
): StorefrontConfig {
  if (!isRecord(raw)) {
    return { ...base };
  }

  const dropPhaseCandidate = raw.dropPhase;
  const dropPhase: StoreDropPhase =
    typeof dropPhaseCandidate === "string" &&
    VALID_DROP_PHASES.has(dropPhaseCandidate as StoreDropPhase)
      ? (dropPhaseCandidate as StoreDropPhase)
      : base.dropPhase;

  const coreAccessCandidate = raw.coreAccessMode;
  const coreAccessMode: CoreAccessMode =
    typeof coreAccessCandidate === "string" &&
    VALID_CORE_ACCESS_MODES.has(coreAccessCandidate as CoreAccessMode)
      ? (coreAccessCandidate as CoreAccessMode)
      : base.coreAccessMode;

  const gridColumnsCandidate = raw.gridColumns;
  const gridColumns: 3 | 4 =
    gridColumnsCandidate === 3 || gridColumnsCandidate === 4
      ? gridColumnsCandidate
      : base.gridColumns;

  return {
    brandName: pickString(raw, "brandName", base.brandName).trim() || base.brandName,
    accentColor: pickString(raw, "accentColor", base.accentColor).trim() || base.accentColor,
    announcementEnabled: pickBoolean(
      raw,
      "announcementEnabled",
      base.announcementEnabled
    ),
    announcementText: pickString(raw, "announcementText", base.announcementText),
    heroEyebrow: pickString(raw, "heroEyebrow", base.heroEyebrow),
    heroTitleOverride: pickString(raw, "heroTitleOverride", base.heroTitleOverride),
    heroSubtitle: pickString(raw, "heroSubtitle", base.heroSubtitle),
    heroCtaPrimary: pickString(raw, "heroCtaPrimary", base.heroCtaPrimary),
    heroCtaSecondary: pickString(raw, "heroCtaSecondary", base.heroCtaSecondary),
    dropPhase,
    activeDropNumber: pickString(raw, "activeDropNumber", base.activeDropNumber),
    activeDropTitle: pickString(raw, "activeDropTitle", base.activeDropTitle),
    dropLaunchDate: pickString(raw, "dropLaunchDate", base.dropLaunchDate),
    coreEnabled: pickBoolean(raw, "coreEnabled", base.coreEnabled),
    coreTitle: pickString(raw, "coreTitle", base.coreTitle),
    coreSubtitle: pickString(raw, "coreSubtitle", base.coreSubtitle),
    coreLaunchOffsetDays: pickNumber(
      raw,
      "coreLaunchOffsetDays",
      base.coreLaunchOffsetDays,
      0,
      365
    ),
    coreLaunchDateOverride: pickString(
      raw,
      "coreLaunchDateOverride",
      base.coreLaunchDateOverride
    ),
    coreAccessMode,
    masterAccessCode:
      pickString(raw, "masterAccessCode", base.masterAccessCode).trim() ||
      base.masterAccessCode,
    coreAccessCode:
      pickString(raw, "coreAccessCode", base.coreAccessCode).trim() ||
      base.coreAccessCode,
    gridColumns,
    showVoteSection: pickBoolean(raw, "showVoteSection", base.showVoteSection),
    showSubmitSection: pickBoolean(
      raw,
      "showSubmitSection",
      base.showSubmitSection
    ),
    showAtelierSection: pickBoolean(
      raw,
      "showAtelierSection",
      base.showAtelierSection
    ),
    footerTagline: pickString(raw, "footerTagline", base.footerTagline),
  };
}

export async function GET() {
  try {
    const readClient = hasSanityWriteToken ? writeClient : client;
    const settingsDoc = await readClient.fetch<SiteSettingsDoc | null>(
      `*[_type == "siteSettings"][0]{ _id, brandName, announcementTicker, customizerConfig }`,
      {},
      { cache: "no-store" }
    );

    if (settingsDoc?.customizerConfig) {
      try {
        const parsed: unknown = JSON.parse(settingsDoc.customizerConfig);
        if (isRecord(parsed)) {
          const merged = mergeStorefrontConfig(parsed, DEFAULT_STOREFRONT_CONFIG);
          const config: StorefrontConfig = {
            ...merged,
            brandName:
              settingsDoc.brandName && settingsDoc.brandName.trim().length > 0
                ? settingsDoc.brandName.trim()
                : merged.brandName,
            announcementText:
              settingsDoc.announcementTicker &&
              settingsDoc.announcementTicker.trim().length > 0
                ? settingsDoc.announcementTicker
                : merged.announcementText,
          };
          return NextResponse.json({
            ok: true,
            config,
            source: "studio" as const,
          });
        }
      } catch {
        // Malformed customizerConfig JSON — fall through to memory/default
      }
    }
  } catch {
    // Sanity unreachable or unconfigured — fall through to memory/default
  }

  return NextResponse.json({
    ok: true,
    config: memoryConfig ?? DEFAULT_STOREFRONT_CONFIG,
    source: memoryConfig ? ("memory" as const) : ("default" as const),
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
    const body: unknown = await request.json();
    const rawConfig = isRecord(body) && "config" in body ? body.config : body;

    if (!isRecord(rawConfig)) {
      return NextResponse.json(
        { ok: false, error: "A valid config object is required." },
        { status: 400 }
      );
    }

    const merged = mergeStorefrontConfig(rawConfig, DEFAULT_STOREFRONT_CONFIG);
    memoryConfig = merged;

    let persistedToStudio = false;

    if (hasSanityWriteToken) {
      try {
        const existingId = await writeClient.fetch<string | null>(
          `*[_type == "siteSettings"][0]._id`,
          {},
          { cache: "no-store" }
        );

        const serialized = JSON.stringify(merged);

        if (existingId) {
          await writeClient
            .patch(existingId)
            .set({
              brandName: merged.brandName,
              announcementTicker: merged.announcementText,
              customizerConfig: serialized,
            })
            .commit();
        } else {
          await writeClient.createOrReplace({
            _id: "siteSettings",
            _type: "siteSettings",
            brandName: merged.brandName,
            announcementTicker: merged.announcementText,
            customizerConfig: serialized,
          });
        }
        persistedToStudio = true;
      } catch {
        persistedToStudio = false;
      }
    }

    return NextResponse.json({
      ok: true,
      config: merged,
      persistedToStudio,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to save storefront settings." },
      { status: 500 }
    );
  }
}
