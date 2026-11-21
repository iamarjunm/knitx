import { NextResponse } from "next/server";
import { hasSanityWriteToken, writeClient } from "@/sanity/lib/writeClient";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      candidateId?: string;
      uid?: string;
    };

    const candidateId = body.candidateId?.trim();
    const uid = body.uid?.trim();

    if (!candidateId) {
      return NextResponse.json(
        { ok: false, error: "candidateId is required." },
        { status: 400 }
      );
    }

    let persisted = false;

    if (hasSanityWriteToken) {
      try {
        await writeClient
          .patch(candidateId)
          .setIfMissing({ votesCount: 0 })
          .inc({ votesCount: 1 })
          .commit();
        persisted = true;
      } catch {
        // Fallback candidate IDs (not yet in Sanity) succeed optimistically
        persisted = false;
      }
    }

    return NextResponse.json({
      ok: true,
      candidateId,
      uid: uid || null,
      persisted,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to record vote." },
      { status: 500 }
    );
  }
}
