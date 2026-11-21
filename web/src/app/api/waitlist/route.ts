import crypto from "crypto";
import { NextResponse } from "next/server";
import { FALLBACK_DROP } from "@/lib/fallback-data";
import type { WaitlistPass } from "@/lib/types";
import { client } from "@/sanity/lib/client";
import { WAITLIST_BY_UID_QUERY } from "@/sanity/lib/queries";
import { hasSanityWriteToken, writeClient } from "@/sanity/lib/writeClient";

function buildDeterministicPass(
  name: string,
  email: string,
  uid: string
): WaitlistPass {
  const hash = crypto
    .createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");

  const hashInt = parseInt(hash.slice(0, 6), 16);
  const position = FALLBACK_DROP.waitlistCount + 1 + (hashInt % 320);
  const totalInQueue = Math.max(position + 14, FALLBACK_DROP.waitlistCount + 340);
  const codeSuffix = hash.slice(6, 10).toUpperCase();

  return {
    email: email.trim().toLowerCase(),
    name: name.trim() || "KNITX Collector",
    uid,
    position,
    totalInQueue,
    status: "queued",
    accessCode: `KX-${codeSuffix}`,
    joinedAt: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid")?.trim() || "";
    const email = searchParams.get("email")?.trim().toLowerCase() || "";

    if (!uid && !email) {
      return NextResponse.json({ pass: null });
    }

    try {
      const existing = await client.fetch<WaitlistPass | null>(
        WAITLIST_BY_UID_QUERY,
        { uid, email }
      );
      if (existing && existing.email) {
        return NextResponse.json({ pass: existing });
      }
    } catch {
      // Sanity not seeded or unreachable; client falls back to localStorage
    }

    return NextResponse.json({ pass: null });
  } catch {
    return NextResponse.json(
      { error: "Unable to check waitlist status." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      uid?: string;
    };

    const email = body.email?.trim().toLowerCase() || "";
    const name = body.name?.trim() || "KNITX Collector";
    const uid =
      body.uid?.trim() ||
      `guest_${crypto.createHash("md5").update(email || Date.now().toString()).digest("hex").slice(0, 10)}`;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const deterministicPass = buildDeterministicPass(name, email, uid);

    if (hasSanityWriteToken) {
      try {
        const existing = await writeClient.fetch<WaitlistPass | null>(
          WAITLIST_BY_UID_QUERY,
          { uid, email }
        );
        if (existing && existing.email) {
          return NextResponse.json({
            ok: true,
            pass: existing,
            persisted: true,
          });
        }

        const existingCount = await writeClient.fetch<number>(
          `count(*[_type == "waitlistEntry"])`
        );
        const position = FALLBACK_DROP.waitlistCount + existingCount + 1;
        const totalInQueue = Math.max(position, FALLBACK_DROP.waitlistCount + existingCount + 1);

        const pass: WaitlistPass = {
          ...deterministicPass,
          position,
          totalInQueue,
        };

        await writeClient.create({
          _type: "waitlistEntry",
          firebaseUid: pass.uid,
          name: pass.name,
          email: pass.email,
          position: pass.position,
          status: pass.status,
          accessCode: pass.accessCode,
          joinedAt: pass.joinedAt,
        });

        // Best-effort increment on active drop campaign
        const activeDropId = await writeClient.fetch<string | null>(
          `*[_type == "drop"] | order(_createdAt desc)[0]._id`
        );
        if (activeDropId) {
          await writeClient
            .patch(activeDropId)
            .setIfMissing({ waitlistCount: FALLBACK_DROP.waitlistCount })
            .inc({ waitlistCount: 1 })
            .commit();
        }

        return NextResponse.json({
          ok: true,
          pass,
          persisted: true,
        });
      } catch {
        // Fall through to deterministic pass if Sanity write fails
      }
    }

    return NextResponse.json({
      ok: true,
      pass: deterministicPass,
      persisted: false,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to process waitlist registration." },
      { status: 500 }
    );
  }
}
