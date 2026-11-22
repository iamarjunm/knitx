"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  Printer,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import { cn, formatInr, formatTimer } from "@/lib/utils";
import type { OrderReceipt, ProductTier } from "@/lib/types";

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
    backdrop_color?: string;
  };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface CreateOrderResponse {
  demoMode: boolean;
  orderId: string;
  amountPaise: number;
  amountInr: number;
  currency: string;
  keyId?: string;
  receipt: string;
  error?: string;
}

interface VerifyOrderResponse {
  ok: boolean;
  receipt?: OrderReceipt;
  error?: string;
}

const LEGACY_TO_LIGHT_IMAGE: Record<string, string> = {
  "/images/piece-1of1-kali.png": "/images/look-1of1-jacket.jpg",
  "/images/piece-1of1-monolith.png": "/images/look-1of1-knit.jpg",
  "/images/piece-batch-puff.png": "/images/look-batch-tee.jpg",
  "/images/look-batch-hoodie.jpg": "/images/look-batch-tee.jpg",
  "/images/piece-batch-embroidery.png": "/images/look-batch-tee.jpg",
  "/images/piece-mystery-silhouette.png": "/images/look-mystery-veil.jpg",
};

function resolveStudioImage(url: string, tier: ProductTier): string {
  if (!url) {
    return tier === "one-of-one"
      ? "/images/look-1of1-jacket.jpg"
      : "/images/look-batch-tee.jpg";
  }
  return LEGACY_TO_LIGHT_IMAGE[url] ?? url;
}

export default function VaultBagDrawer() {
  const pathname = usePathname();
  const releaseHref = pathname.startsWith("/v10")
    ? "/v10/release"
    : pathname.startsWith("/v9")
      ? "/v9/vault"
      : "/vault";
  const { user } = useAuth();
  const {
    cart,
    cartOpen,
    setCartOpen,
    removeFromCart,
    clearCart,
    cartTotalInr,
    reservationSecondsLeft,
    waitlistPass,
    recentOrder,
    setRecentOrder,
  } = useVault();

  const [mounted, setMounted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<
    null | "initializing" | "authorizing" | "verifying"
  >(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (cartOpen) {
      setFullName(
        (prev) => prev || user?.displayName || waitlistPass?.name || ""
      );
      setError(null);
    }
  }, [cartOpen, user, waitlistPass]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (recentOrder) setRecentOrder(null);
        else if (cartOpen && !processingStage) setCartOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cartOpen, recentOrder, processingStage, setCartOpen, setRecentOrder]);

  const customerEmail =
    user?.email || waitlistPass?.email || "collector@knitx.in";

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cart.length === 0) {
      setError("Your bag is currently empty.");
      return;
    }

    if (
      !fullName.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !city.trim() ||
      !pincode.trim()
    ) {
      setError("Please complete all shipping fields before checkout.");
      return;
    }

    const cleanPincode = pincode.replace(/\D/g, "");
    if (cleanPincode.length !== 6) {
      setError("Please enter a valid 6-digit Indian pincode.");
      return;
    }

    const shippingAddress = `${address.trim()}, ${city.trim()} - ${cleanPincode} (+91 ${phone.trim()})`;
    setProcessingStage("initializing");

    try {
      const createRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          customerName: fullName.trim(),
          customerEmail,
        }),
      });

      const orderData = (await createRes.json()) as CreateOrderResponse;
      if (!createRes.ok || !orderData.orderId) {
        throw new Error(orderData.error || "Unable to initialize checkout order.");
      }

      const verifyOrder = async (payload: {
        razorpay_order_id?: string;
        razorpay_payment_id?: string;
        razorpay_signature?: string;
        orderId?: string;
        demoMode: boolean;
      }) => {
        setProcessingStage("verifying");
        const verifyRes = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            items: cart,
            customerName: fullName.trim(),
            customerEmail,
            shippingAddress,
            uid: user?.uid,
          }),
        });

        const verified = (await verifyRes.json()) as VerifyOrderResponse;
        if (!verifyRes.ok || !verified.ok || !verified.receipt) {
          throw new Error(verified.error || "Payment verification failed.");
        }

        setRecentOrder(verified.receipt);
        clearCart();
        setCartOpen(false);
        setProcessingStage(null);
      };

      // Live Razorpay checkout modal when configured
      if (
        !orderData.demoMode &&
        orderData.keyId &&
        typeof window !== "undefined" &&
        window.Razorpay
      ) {
        const rzp = new window.Razorpay({
          key: orderData.keyId,
          amount: orderData.amountPaise,
          currency: orderData.currency || "INR",
          name: "KNITX",
          description: `Limited Edition Allocation · ${orderData.receipt}`,
          order_id: orderData.orderId,
          prefill: {
            name: fullName.trim(),
            email: customerEmail,
            contact: phone.trim(),
          },
          theme: {
            color: "#111111",
            backdrop_color: "#F6F4EF",
          },
          handler: (response) => {
            verifyOrder({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              demoMode: false,
            }).catch((err) => {
              setError(
                err instanceof Error ? err.message : "Verification error."
              );
              setProcessingStage(null);
            });
          },
          modal: {
            ondismiss: () => {
              setProcessingStage(null);
            },
          },
        });
        rzp.open();
        return;
      }

      // Smooth local preview settlement
      setProcessingStage("authorizing");
      await new Promise((resolve) => setTimeout(resolve, 1100));
      await verifyOrder({
        orderId: orderData.orderId,
        demoMode: true,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Checkout was interrupted. Please try again."
      );
      setProcessingStage(null);
    }
  };

  const progressPercent = Math.min(
    100,
    Math.max(0, (reservationSecondsLeft / 600) * 100)
  );
  const isUrgent = reservationSecondsLeft > 0 && reservationSecondsLeft <= 180;
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Editorial Slide-Over Bag Drawer */}
      <AnimatePresence>
        {mounted && cartOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Shopping Bag"
            className="fixed inset-0 z-50 flex justify-end"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24 }}
              onClick={() => !processingStage && setCartOpen(false)}
              className="absolute inset-0 bg-ink/30 backdrop-blur-xs"
            />

            {/* Drawer Panel */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-[#DDD7CB] bg-[#FFFFFF] text-[#111110] shadow-[-24px_0_80px_rgba(17,17,15,0.16)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#DDD7CB] bg-[#F7F5F0]/80 px-6 py-5 sm:px-7">
                <div className="flex items-baseline gap-3">
                  <h2 className="font-poster text-2xl tracking-[0.03em] text-[#111110] uppercase">
                    YOUR BAG
                  </h2>
                  <span className="font-mono text-[11px] tracking-[0.14em] text-[#6A655D] uppercase">
                    ({totalQuantity})
                  </span>
                </div>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => !processingStage && setCartOpen(false)}
                  aria-label="Close bag"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#DDD7CB] bg-[#FFFFFF] text-[#6A655D] transition-colors hover:border-[#111110] hover:text-[#111110]"
                >
                  <X className="h-4 w-4 stroke-[1.75]" />
                </button>
              </div>

              {/* Minimalist Reservation Timer Strip */}
              {cart.length > 0 && reservationSecondsLeft > 0 && (
                <div className="border-b border-[#DDD7CB] bg-[#F7F5F0] px-6 py-3 sm:px-7">
                  <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.12em] uppercase">
                    <span className="flex items-center gap-2 text-[#6A655D]">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          isUrgent ? "bg-[#8E1C1C]" : "bg-[#9A7B4F]"
                        )}
                      />
                      Held for{" "}
                      <span
                        className={cn(
                          "font-semibold",
                          isUrgent ? "text-[#8E1C1C]" : "text-[#111110]"
                        )}
                      >
                        {formatTimer(reservationSecondsLeft)}
                      </span>
                    </span>
                    <span className="text-[10px] text-[#9A7B4F]">
                      Current Edition
                    </span>
                  </div>
                  <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-[#DDD7CB]">
                    <div
                      style={{ width: `${progressPercent}%` }}
                      className={cn(
                        "h-full transition-all duration-1000",
                        isUrgent ? "bg-[#8E1C1C]" : "bg-[#111110]"
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Processing Overlay */}
              <AnimatePresence>
                {processingStage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-surface/95 px-8 text-center backdrop-blur-xs"
                  >
                    <Loader2 className="h-6 w-6 animate-spin stroke-[1.5] text-ink" />
                    <p className="mt-5 font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
                      Secure Checkout
                    </p>
                    <h3 className="mt-2 font-serif text-2xl text-ink">
                      {processingStage === "initializing" &&
                        "Reserving your numbered edition…"}
                      {processingStage === "authorizing" &&
                        "Confirming payment authorization…"}
                      {processingStage === "verifying" &&
                        "Issuing your archival certificate…"}
                    </h3>
                    <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted">
                      Please keep this window open while we confirm your
                      numbered edition allocation with our atelier.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Drawer Content */}
              {cart.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                  <p className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
                    KNITX · Private Release
                  </p>
                  <h3 className="mt-3 font-editorial text-3xl text-ink">
                    Your bag is empty.
                  </h3>
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
                    Enter the current release to reserve small-batch silhouettes
                    or one-of-one collector pieces before editions close.
                  </p>
                  <Link
                    href={releaseHref}
                    onClick={() => setCartOpen(false)}
                    className="mt-8 inline-flex items-center gap-2.5 bg-ink px-7 py-3.5 text-xs font-medium tracking-[0.12em] text-paper uppercase transition-opacity hover:opacity-88"
                  >
                    <span>Explore Current Release</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-1 flex-col overflow-y-auto">
                  {/* Product Rows */}
                  <div className="divide-y divide-hairline border-b border-hairline px-6 sm:px-7">
                    {cart.map((item) => {
                      const isOneOfOne = item.product.tier === "one-of-one";
                      return (
                        <div
                          key={`${item.product._id}-${item.size}`}
                          className="flex gap-4 py-5"
                        >
                          <div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden bg-stone">
                            <Image
                              src={resolveStudioImage(
                                item.product.imageUrl,
                                item.product.tier
                              )}
                              alt={item.product.title}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>

                          <div className="flex flex-1 flex-col justify-between py-0.5">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <span
                                  className={cn(
                                    "font-mono text-[10px] tracking-[0.14em] uppercase",
                                    isOneOfOne ? "text-vermilion" : "text-muted"
                                  )}
                                >
                                  {item.product.serialCode} ·{" "}
                                  {isOneOfOne ? "1 OF 1" : "Small-Batch"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeFromCart(item.product._id, item.size)
                                  }
                                  aria-label={`Remove ${item.product.title}`}
                                  className="cursor-pointer text-muted transition-colors hover:text-vermilion"
                                >
                                  <Trash2 className="h-3.5 w-3.5 stroke-[1.5]" />
                                </button>
                              </div>

                              <h3 className="mt-1 text-sm font-medium text-ink">
                                {item.product.title}
                              </h3>

                              <p className="mt-1 font-mono text-[11px] text-muted">
                                Size {item.size} · Qty {item.quantity} ·{" "}
                                {item.product.gsmWeight}
                              </p>
                            </div>

                            <div className="mt-3 flex items-baseline justify-between">
                              <span className="font-mono text-[10px] tracking-[0.1em] text-muted uppercase">
                                Cut & sew · {item.product.productionDays}d
                              </span>
                              <span className="font-mono text-sm font-medium text-ink">
                                {formatInr(
                                  item.product.priceInr * item.quantity
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Indian Shipping Form */}
                  <form
                    onSubmit={handleCheckout}
                    className="flex flex-1 flex-col justify-between px-6 py-6 sm:px-7"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-[10px] tracking-[0.18em] text-ink uppercase">
                          India Dispatch Details
                        </p>
                        <span className="font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
                          Complimentary Insured Air
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Full Name"
                          required
                          className="w-full border border-hairline bg-paper/50 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-ink focus:bg-surface focus:outline-none"
                        />
                        <div className="flex border border-hairline bg-paper/50 focus-within:border-ink focus-within:bg-surface">
                          <span className="flex items-center border-r border-hairline px-3 font-mono text-xs text-muted">
                            +91
                          </span>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="98XXXXXXXX"
                            required
                            className="w-full bg-transparent px-3 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:outline-none"
                          />
                        </div>
                      </div>

                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Flat, Building, Street & Landmark"
                        required
                        className="w-full border border-hairline bg-paper/50 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-ink focus:bg-surface focus:outline-none"
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City"
                          required
                          className="w-full border border-hairline bg-paper/50 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-ink focus:bg-surface focus:outline-none"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={pincode}
                          onChange={(e) =>
                            setPincode(e.target.value.replace(/\D/g, ""))
                          }
                          placeholder="Pincode (6 digits)"
                          required
                          className="w-full border border-hairline bg-paper/50 px-3.5 py-2.5 font-mono text-sm text-ink placeholder:font-sans placeholder:text-muted/60 focus:border-ink focus:bg-surface focus:outline-none"
                        />
                      </div>

                      {error && (
                        <div className="flex items-start gap-2 border border-vermilion/30 bg-vermilion/5 p-3 text-xs text-vermilion">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}
                    </div>

                    {/* Totals & Razorpay CTA */}
                    <div className="mt-7 border-t border-hairline pt-5">
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-muted">
                          <span>Sample-First Cut &amp; Sew</span>
                          <span className="text-ink">Included</span>
                        </div>
                        <div className="flex justify-between text-muted">
                          <span>Insured Courier (Pan-India)</span>
                          <span className="text-ink">Complimentary</span>
                        </div>
                        <div className="flex items-baseline justify-between border-t border-hairline pt-3 text-sm font-medium text-ink">
                          <span>Total</span>
                          <span className="font-mono text-base font-medium">
                            {formatInr(cartTotalInr)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        suppressHydrationWarning
                        disabled={Boolean(processingStage)}
                        className="mt-5 flex w-full cursor-pointer items-center justify-center rounded-full bg-[#8E1C1C] py-4 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase transition-colors hover:bg-[#111110] disabled:opacity-50"
                      >
                        Complete Order — {formatInr(cartTotalInr)}
                      </button>

                      <p className="mt-3 text-center font-mono text-[10px] tracking-[0.12em] text-[#6A655D] uppercase">
                        UPI · Cards · Netbanking · 100% Encrypted Checkout
                      </p>
                    </div>
                  </form>
                </div>
              )}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Archival Certificate of Authenticity (Letterpress Cotton Card) */}
      <AnimatePresence>
        {mounted && recentOrder && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Archival Certificate of Authenticity"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRecentOrder(null)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto border border-hairline bg-paper p-3 shadow-2xl sm:p-4"
            >
              {/* Inner Cotton Letterpress Frame */}
              <div className="border border-ink/20 bg-paper px-6 py-7 sm:px-9 sm:py-9">
                {/* Top Seal Row */}
                <div className="flex items-center justify-between border-b border-hairline pb-5">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-vermilion" />
                    <span className="font-mono text-[10px] tracking-[0.22em] text-ink uppercase">
                      KNITX · Archival Provenance
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {recentOrder.isDemo && (
                      <span className="border border-hairline bg-stone px-2 py-0.5 font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
                        Preview Receipt
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setRecentOrder(null)}
                      aria-label="Close certificate"
                      className="cursor-pointer text-muted transition-colors hover:text-ink"
                    >
                      <X className="h-4 w-4 stroke-[1.5]" />
                    </button>
                  </div>
                </div>

                {/* Letterpress Heading */}
                <div className="py-7 text-center">
                  <p className="font-mono text-[10px] tracking-[0.24em] text-muted uppercase">
                    Limited Edition · KNITX India
                  </p>
                  <h2 className="mt-3 font-editorial text-4xl leading-tight text-ink sm:text-[42px]">
                    Certificate of{" "}
                    <span className="italic">Authenticity</span>
                  </h2>
                  <p className="mt-3 text-sm text-muted">
                    Issued to{" "}
                    <span className="font-medium text-ink">
                      {recentOrder.customerName}
                    </span>{" "}
                    ({recentOrder.customerEmail})
                  </p>
                </div>

                {/* Ledger Metadata */}
                <div className="grid grid-cols-1 gap-px border border-hairline bg-hairline sm:grid-cols-3">
                  <div className="bg-surface px-4 py-3.5">
                    <p className="font-mono text-[9px] tracking-[0.18em] text-muted uppercase">
                      Edition Order
                    </p>
                    <p className="mt-1 font-mono text-xs font-medium text-ink">
                      {recentOrder.orderNumber}
                    </p>
                  </div>
                  <div className="bg-surface px-4 py-3.5">
                    <p className="font-mono text-[9px] tracking-[0.18em] text-muted uppercase">
                      Payment Reference
                    </p>
                    <p className="mt-1 truncate font-mono text-xs text-ink">
                      {recentOrder.paymentId}
                    </p>
                  </div>
                  <div className="bg-surface px-4 py-3.5">
                    <p className="font-mono text-[9px] tracking-[0.18em] text-muted uppercase">
                      Est. Dispatch
                    </p>
                    <p className="mt-1 font-mono text-xs text-ink">
                      {recentOrder.estimatedShipDate}
                    </p>
                  </div>
                </div>

                {/* Allocated Garments */}
                <div className="mt-6 border-t border-hairline pt-5">
                  <p className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
                    Registered Silhouettes
                  </p>
                  <div className="mt-3 divide-y divide-hairline border-y border-hairline">
                    {recentOrder.items.map((item) => (
                      <div
                        key={`${item.product._id}-${item.size}`}
                        className="flex items-baseline justify-between gap-4 py-3.5"
                      >
                        <div>
                          <p className="text-sm font-medium text-ink">
                            {item.product.title}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] tracking-[0.1em] text-muted uppercase">
                            {item.product.serialCode} · Size {item.size} · Qty{" "}
                            {item.quantity}
                          </p>
                        </div>
                        <span className="font-mono text-xs text-ink">
                          {formatInr(item.product.priceInr * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sample-First Note */}
                <p className="mt-5 text-xs leading-relaxed text-muted">
                  Your allocation has entered our sample-first cut &amp; sew
                  schedule. Each garment is hand-cut from our
                  master studio pattern, finished individually, and sealed with
                  its edition stamp prior to insured dispatch.
                </p>

                {/* Total Settled */}
                <div className="mt-6 flex items-baseline justify-between border-t border-hairline pt-4">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
                    Total Settled
                  </span>
                  <span className="font-mono text-base font-medium text-ink">
                    {formatInr(recentOrder.totalAmountInr)}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 border border-hairline bg-surface py-3 text-xs font-medium tracking-[0.12em] text-ink uppercase transition-colors hover:border-ink"
                  >
                    <Printer className="h-3.5 w-3.5 stroke-[1.5]" />
                    <span>Print Certificate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecentOrder(null)}
                    className="flex-1 cursor-pointer bg-ink py-3 text-xs font-medium tracking-[0.12em] text-paper uppercase transition-opacity hover:opacity-88"
                  >
                    Return to Archive
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
