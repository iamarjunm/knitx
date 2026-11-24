"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import type {
  CartItem,
  OrderReceipt,
  Product,
  WaitlistPass,
} from "@/lib/types";

const WAITLIST_STORAGE_KEY = "knitx_waitlist_pass_v1";
const VAULT_UNLOCKED_STORAGE_KEY = "knitx_vault_unlocked_v1";
const CART_STORAGE_KEY = "knitx_vault_cart_v1";
const MASTER_PREVIEW_CODE = "KNITX-001";
const CORE_COMMUNITY_CODE = "KNITX-CORE";
const RESERVATION_DURATION_SECONDS = 10 * 60; // 10 minutes

export interface VaultContextValue {
  waitlistPass: WaitlistPass | null;
  isVaultUnlocked: boolean;
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, size: string) => { ok: boolean; message?: string };
  removeFromCart: (productId: string, size: string) => void;
  clearCart: () => void;
  cartTotalInr: number;
  cartCount: number;
  reservationSecondsLeft: number;
  recentOrder: OrderReceipt | null;
  setRecentOrder: (order: OrderReceipt | null) => void;
  joinWaitlist: (name: string, email: string) => Promise<WaitlistPass>;
  unlockVaultDemo: () => void;
  unlockVaultWithCode: (code: string) => boolean;
  lockVaultPreview: () => void;
}

const VaultContext = createContext<VaultContextValue | undefined>(undefined);

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [waitlistPass, setWaitlistPass] = useState<WaitlistPass | null>(null);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [reservationSecondsLeft, setReservationSecondsLeft] = useState<number>(0);
  const [recentOrder, setRecentOrder] = useState<OrderReceipt | null>(null);
  const [hydrated, setHydrated] = useState<boolean>(false);

  // Hydrate persisted state from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedPass = safeJsonParse<WaitlistPass>(
      window.localStorage.getItem(WAITLIST_STORAGE_KEY)
    );
    const storedUnlocked =
      window.localStorage.getItem(VAULT_UNLOCKED_STORAGE_KEY) === "true";
    const storedCart = safeJsonParse<CartItem[]>(
      window.localStorage.getItem(CART_STORAGE_KEY)
    );

    if (storedPass) {
      setWaitlistPass(storedPass);
    }
    if (storedUnlocked) {
      setIsVaultUnlocked(true);
    }
    if (Array.isArray(storedCart) && storedCart.length > 0) {
      setCart(storedCart);
      setReservationSecondsLeft(RESERVATION_DURATION_SECONDS);
    }
    setHydrated(true);
  }, []);

  // Sync waitlist status with /api/waitlist when authenticated
  useEffect(() => {
    if (!hydrated || !user) return;
    let cancelled = false;

    async function syncWaitlist() {
      try {
        const params = new URLSearchParams();
        if (user?.uid) params.set("uid", user.uid);
        if (user?.email) params.set("email", user.email);

        const res = await fetch(`/api/waitlist?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { pass?: WaitlistPass | null };
        if (!cancelled && data.pass) {
          setWaitlistPass(data.pass);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              WAITLIST_STORAGE_KEY,
              JSON.stringify(data.pass)
            );
          }
          if (data.pass.status === "entered") {
            setIsVaultUnlocked(true);
            if (typeof window !== "undefined") {
              window.localStorage.setItem(VAULT_UNLOCKED_STORAGE_KEY, "true");
            }
          }
        }
      } catch {
        // Keep localStorage state if API sync is temporarily unreachable
      }
    }

    syncWaitlist();
    return () => {
      cancelled = true;
    };
  }, [hydrated, user]);

  // Persist cart changes
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  // 10-minute FOMO reservation timer when cart has items
  useEffect(() => {
    if (cart.length === 0) {
      setReservationSecondsLeft(0);
      return;
    }

    const interval = window.setInterval(() => {
      setReservationSecondsLeft((prev) => {
        if (prev <= 1) {
          setCart([]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [cart.length]);

  const addToCart = useCallback(
    (product: Product, size: string): { ok: boolean; message?: string } => {
      if (product.remainingUnits <= 0) {
        return { ok: false, message: "This archive piece is sold out." };
      }

      const existingTotalForProduct = cart
        .filter((item) => item.product._id === product._id)
        .reduce((sum, item) => sum + item.quantity, 0);

      if (product.tier === "one-of-one" && existingTotalForProduct >= 1) {
        return {
          ok: false,
          message: "One-of-One collector pieces are strictly limited to 1 unit.",
        };
      }

      if (existingTotalForProduct >= product.remainingUnits) {
        return {
          ok: false,
          message: `Only ${product.remainingUnits} unit${product.remainingUnits === 1 ? "" : "s"} remaining in this vault batch.`,
        };
      }

      setCart((prev) => {
        const idx = prev.findIndex(
          (item) => item.product._id === product._id && item.size === size
        );
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            quantity: updated[idx].quantity + 1,
          };
          return updated;
        }
        return [...prev, { product, size, quantity: 1 }];
      });

      setReservationSecondsLeft((prev) =>
        prev > 0 ? prev : RESERVATION_DURATION_SECONDS
      );
      setCartOpen(true);
      return { ok: true };
    },
    [cart]
  );

  const removeFromCart = useCallback((productId: string, size: string) => {
    setCart((prev) => {
      const next = prev.filter(
        (item) => !(item.product._id === productId && item.size === size)
      );
      if (next.length === 0) {
        setReservationSecondsLeft(0);
      }
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setReservationSecondsLeft(0);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, []);

  const joinWaitlist = useCallback(
    async (name: string, email: string): Promise<WaitlistPass> => {
      const cleanName = name.trim() || user?.displayName || "KNITX Collector";
      const cleanEmail = (email.trim() || user?.email || "").toLowerCase();
      const uid =
        user?.uid ||
        `guest_${cleanEmail.replace(/[^a-z0-9]/g, "").slice(0, 12) || "anon"}`;

      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          uid,
        }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errBody.error || "Failed to register on waitlist.");
      }

      const data = (await res.json()) as { pass: WaitlistPass };
      setWaitlistPass(data.pass);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          WAITLIST_STORAGE_KEY,
          JSON.stringify(data.pass)
        );
      }
      return data.pass;
    },
    [user]
  );

  const unlockVaultDemo = useCallback(() => {
    const nextPass: WaitlistPass = waitlistPass
      ? {
          ...waitlistPass,
          status: "entered",
        }
      : {
          email: user?.email || "collector@knitx.in",
          name: user?.displayName || "VIP Collector",
          uid: user?.uid || "demo_vip_collector",
          position: 108,
          totalInQueue: 1843,
          status: "entered",
          accessCode: MASTER_PREVIEW_CODE,
          joinedAt: new Date().toISOString(),
        };

    setWaitlistPass(nextPass);
    setIsVaultUnlocked(true);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        WAITLIST_STORAGE_KEY,
        JSON.stringify(nextPass)
      );
      window.localStorage.setItem(VAULT_UNLOCKED_STORAGE_KEY, "true");
    }
  }, [user, waitlistPass]);

  const unlockVaultWithCode = useCallback(
    (code: string): boolean => {
      const normalized = code.trim().toUpperCase();
      if (!normalized) return false;

      const passCode = waitlistPass?.accessCode?.trim().toUpperCase();
      let customMasterCode = "";
      let customCoreCode = "";
      if (typeof window !== "undefined") {
        try {
          const rawCfg = window.localStorage.getItem("knitx_storefront_config_v12");
          if (rawCfg) {
            const parsed = JSON.parse(rawCfg) as {
              masterAccessCode?: string;
              coreAccessCode?: string;
            };
            customMasterCode = parsed.masterAccessCode?.trim().toUpperCase() || "";
            customCoreCode = parsed.coreAccessCode?.trim().toUpperCase() || "";
          }
        } catch {
          // Ignore storage errors
        }
      }
      const isValid =
        normalized === MASTER_PREVIEW_CODE ||
        normalized === CORE_COMMUNITY_CODE ||
        (Boolean(customMasterCode) && normalized === customMasterCode) ||
        (Boolean(customCoreCode) && normalized === customCoreCode) ||
        (Boolean(passCode) && normalized === passCode);

      if (!isValid) {
        return false;
      }

      setIsVaultUnlocked(true);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(VAULT_UNLOCKED_STORAGE_KEY, "true");
      }

      if (waitlistPass) {
        const updatedPass: WaitlistPass = {
          ...waitlistPass,
          status: "entered",
        };
        setWaitlistPass(updatedPass);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            WAITLIST_STORAGE_KEY,
            JSON.stringify(updatedPass)
          );
        }
      }

      return true;
    },
    [waitlistPass]
  );

  const lockVaultPreview = useCallback(() => {
    setIsVaultUnlocked(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(VAULT_UNLOCKED_STORAGE_KEY);
    }
    if (waitlistPass) {
      const resetPass: WaitlistPass = {
        ...waitlistPass,
        status: "queued",
      };
      setWaitlistPass(resetPass);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          WAITLIST_STORAGE_KEY,
          JSON.stringify(resetPass)
        );
      }
    }
  }, [waitlistPass]);

  const cartTotalInr = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.product.priceInr * item.quantity,
        0
      ),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const value = useMemo<VaultContextValue>(
    () => ({
      waitlistPass,
      isVaultUnlocked,
      cart,
      cartOpen,
      setCartOpen,
      addToCart,
      removeFromCart,
      clearCart,
      cartTotalInr,
      cartCount,
      reservationSecondsLeft,
      recentOrder,
      setRecentOrder,
      joinWaitlist,
      unlockVaultDemo,
      unlockVaultWithCode,
      lockVaultPreview,
    }),
    [
      waitlistPass,
      isVaultUnlocked,
      cart,
      cartOpen,
      addToCart,
      removeFromCart,
      clearCart,
      cartTotalInr,
      cartCount,
      reservationSecondsLeft,
      recentOrder,
      joinWaitlist,
      unlockVaultDemo,
      unlockVaultWithCode,
      lockVaultPreview,
    ]
  );

  return (
    <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
  );
}

export function useVault(): VaultContextValue {
  const ctx = useContext(VaultContext);
  if (!ctx) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return ctx;
}
