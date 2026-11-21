import { NextResponse } from "next/server";
import {
  generateDemoOrderId,
  generateOrderNumber,
  getRazorpayClient,
  inrToPaise,
  isRazorpayConfigured,
  razorpayKeyId,
} from "@/lib/razorpay";
import type { CartItem } from "@/lib/types";

interface CreateOrderBody {
  items?: CartItem[];
  customerEmail?: string;
  customerName?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderBody;
    const items = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty. Add at least one archive piece." },
        { status: 400 }
      );
    }

    let totalInr = 0;
    for (const item of items) {
      const unitPrice = Number(item?.product?.priceInr);
      const qty = Number(item?.quantity);
      if (!Number.isFinite(unitPrice) || unitPrice <= 0 || !Number.isFinite(qty) || qty <= 0) {
        return NextResponse.json(
          { error: "Invalid cart item pricing or quantity." },
          { status: 400 }
        );
      }
      totalInr += unitPrice * qty;
    }

    const amountPaise = inrToPaise(totalInr);
    const receipt = generateOrderNumber();

    if (isRazorpayConfigured) {
      const razorpay = getRazorpayClient();
      if (razorpay) {
        const order = await razorpay.orders.create({
          amount: amountPaise,
          currency: "INR",
          receipt,
          notes: {
            customerEmail: body.customerEmail || "",
            customerName: body.customerName || "",
            itemCount: String(items.length),
          },
        });

        return NextResponse.json({
          demoMode: false,
          orderId: order.id,
          amountPaise,
          amountInr: totalInr,
          currency: "INR",
          keyId: razorpayKeyId,
          receipt,
        });
      }
    }

    return NextResponse.json({
      demoMode: true,
      orderId: generateDemoOrderId(),
      amountPaise,
      amountInr: totalInr,
      currency: "INR",
      receipt,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to initialize Razorpay order." },
      { status: 500 }
    );
  }
}
