import crypto from "crypto";
import { NextResponse } from "next/server";
import type { CreatorSubmissionItem } from "@/lib/types";
import { hasSanityWriteToken, writeClient } from "@/sanity/lib/writeClient";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string;
      creatorName?: string;
      creatorHandle?: string;
      email?: string;
      category?: string;
      craftsmanshipNotes?: string;
      imageUrl?: string;
    };

    const title = body.title?.trim() || "";
    const creatorName = body.creatorName?.trim() || "";
    const rawHandle = body.creatorHandle?.trim() || "";
    const creatorHandle = rawHandle
      ? rawHandle.startsWith("@")
        ? rawHandle
        : `@${rawHandle}`
      : `@${creatorName.toLowerCase().replace(/[^a-z0-9]+/g, ".") || "creator"}`;
    const email = body.email?.trim().toLowerCase() || "";
    const category = body.category?.trim() || "Small-Batch";
    const craftsmanshipNotes = body.craftsmanshipNotes?.trim() || "";
    const imageUrl = body.imageUrl?.trim() || "/images/piece-batch-puff.png";

    if (!title || !creatorName || !craftsmanshipNotes) {
      return NextResponse.json(
        {
          ok: false,
          error: "Title, creator name, and craftsmanship notes are required.",
        },
        { status: 400 }
      );
    }

    const createdAt = new Date().toISOString();
    let submissionId = `sub_${crypto.randomBytes(6).toString("hex")}`;
    let persisted = false;

    if (hasSanityWriteToken) {
      try {
        let mockupImage:
          | { _type: "image"; asset: { _type: "reference"; _ref: string }; alt: string }
          | undefined;

        const dataUrlMatch = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (dataUrlMatch) {
          const [, contentType, base64Data] = dataUrlMatch;
          const buffer = Buffer.from(base64Data, "base64");
          const uploadedAsset = await writeClient.assets.upload("image", buffer, {
            filename: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "concept"}.jpg`,
            contentType,
          });
          if (uploadedAsset?._id) {
            mockupImage = {
              _type: "image",
              asset: { _type: "reference", _ref: uploadedAsset._id },
              alt: title,
            };
          }
        }

        const doc: {
          _type: "creatorSubmission";
          title: string;
          creatorName: string;
          creatorHandle: string;
          email: string;
          category: string;
          craftsmanshipNotes: string;
          mockupImage?: {
            _type: "image";
            asset: { _type: "reference"; _ref: string };
            alt: string;
          };
          imageUrl?: string;
          createdAt: string;
          status: "pending";
        } = {
          _type: "creatorSubmission",
          title,
          creatorName,
          creatorHandle,
          email: email || "creator@knitx.in",
          category,
          craftsmanshipNotes,
          createdAt,
          status: "pending",
        };

        if (mockupImage) {
          doc.mockupImage = mockupImage;
        } else {
          doc.imageUrl = imageUrl;
        }

        const created = await writeClient.create(doc);
        if (created?._id) {
          submissionId = created._id;
          persisted = true;
        }
      } catch {
        persisted = false;
      }
    }

    const submission: CreatorSubmissionItem = {
      _id: submissionId,
      title,
      creatorName,
      creatorHandle,
      category,
      craftsmanshipNotes,
      imageUrl,
      createdAt,
      status: "pending",
    };

    return NextResponse.json({
      ok: true,
      submission,
      persisted,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to submit design concept." },
      { status: 500 }
    );
  }
}
