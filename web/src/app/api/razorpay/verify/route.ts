import crypto from "crypto";
import { NextResponse } from "next/server";
import {
  generateOrderNumber,
  isRazorpayConfigured,
  verifyRazorpaySignature,
} from "@/lib/razorpay";
import type { CartItem, OrderReceipt } from "@/lib/types";
import { hasSanityWriteToken, writeClient } from "@/sanity/lib/writeClient";

interface VerifyOrderBody {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  orderId?: string;
  paymentId?: string;
  signature?: string;
  demoMode?: boolean;
  items?: CartItem[];
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  uid?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyOrderBody;
    const items = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Order items are required." },
        { status: 400 }
      );
    }

    const orderId = body.razorpay_order_id || body.orderId || "";
    const paymentId = body.razorpay_payment_id || body.paymentId || "";
    const signature = body.razorpay_signature || body.signature || "";

    const isDemo = !isRazorpayConfigured;

    if (isRazorpayConfigured) {
      const valid = verifyRazorpaySignature({
        orderId,
        paymentId,
        signature,
      });
      if (!valid) {
        return NextResponse.json(
          { ok: false, error: "Razorpay payment signature verification failed." },
          { status: 400 }
        );
      }
    } else if (body.demoMode === false) {
      return NextResponse.json(
        { ok: false, error: "Razorpay keys are not configured on the server." },
        { status: 400 }
      );
    }

    const totalAmountInr = items.reduce(
      (sum, item) => sum + item.product.priceInr * item.quantity,
      0
    );

    const maxProductionDays = items.reduce(
      (max, item) => Math.max(max, item.product.productionDays || 7),
      7
    );

    const createdAt = new Date().toISOString();
    const estimatedShipDate = new Date(
      Date.now() + maxProductionDays * 86_400_000
    ).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const resolvedPaymentId =
      paymentId ||
      `pay_demo_${crypto.randomBytes(6).toString("hex")}`;
    const orderNumber = generateOrderNumber();
    const customerName = body.customerName?.trim() || "KNITX Collector";
    const customerEmail =
      body.customerEmail?.trim().toLowerCase() || "collector@knitx.in";

    if (hasSanityWriteToken) {
      try {
        await writeClient.create({
          _type: "order",
          orderNumber,
          firebaseUid: body.uid || undefined,
          customerName,
          customerEmail,
          customerPhone: body.customerPhone || undefined,
          shippingAddress: body.shippingAddress || "India",
          razorpayOrderId: orderId || undefined,
          razorpayPaymentId: resolvedPaymentId,
          paymentStatus: isDemo ? "demo_paid" : "paid",
          productionStage: "sample_confirmed",
          totalAmountInr,
          createdAt,
          items: items.map((item) => ({
            _type: "orderItem",
            _key: crypto.randomBytes(4).toString("hex"),
            productId: item.product._id,
            title: item.product.title,
            serialCode: item.product.serialCode,
            tier: item.product.tier,
            size: item.size,
            quantity: item.quantity,
            priceInr: item.product.priceInr,
          })),
        });

        // Best-effort stock decrement for Sanity-persisted products
        await Promise.all(
          items.map(async (item) => {
            try {
              const current = await writeClient.fetch<{
                _id: string;
                remainingUnits?: number;
              } | null>(
                `*[_type == "product" && _id == $id][0]{ _id, remainingUnits }`,
                { id: item.product._id }
              );
              if (current && typeof current.remainingUnits === "number") {
                const nextRemaining = Math.max(
                  0,
                  current.remainingUnits - item.quantity
                );
                await writeClient
                  .patch(current._id)
                  .set({ remainingUnits: nextRemaining })
                  .commit();
              }
            } catch {
              // Ignore fallback product IDs not yet seeded in Sanity
            }
          })
        );
      } catch {
        // Proceed cleanly and return verified receipt
      }
    }

    const receipt: OrderReceipt = {
      orderNumber,
      items,
      totalAmountInr,
      paymentId: resolvedPaymentId,
      isDemo,
      customerName,
      customerEmail,
      createdAt,
      estimatedShipDate,
    };

    return NextResponse.json({
      ok: true,
      receipt,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to verify payment." },
      { status: 500 }
    );
  }
}
