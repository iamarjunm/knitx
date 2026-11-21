import crypto from "crypto";
import Razorpay from "razorpay";

const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() || "";
const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";

export const isRazorpayConfigured = Boolean(keyId && keySecret);

export const razorpayKeyId = keyId;

let razorpayClient: Razorpay | null = null;

export function getRazorpayClient(): Razorpay | null {
  if (!isRazorpayConfigured) {
    return null;
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayClient;
}

export function inrToPaise(amountInr: number): number {
  return Math.max(0, Math.round(amountInr * 100));
}

export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!keySecret) {
    return false;
  }
  const { orderId, paymentId, signature } = params;
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(signature, "utf8");

  if (expectedBuf.length !== signatureBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

export function generateDemoOrderId(): string {
  const randomPart = crypto.randomBytes(6).toString("hex");
  return `order_demo_${randomPart}`;
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `KX-001-${timestamp}${rand}`;
}
