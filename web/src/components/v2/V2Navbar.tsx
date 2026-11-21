"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Lock,
  LogOut,
  Menu,
  ShoppingBag,
  Unlock,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import { cn } from "@/lib/utils";

interface NavAnchor {
  href: string;
  id: string;
  label: string;
  num: string;
}

const NAV_ANCHORS: NavAnchor[] = [
  { href: "#deck", id: "deck", label: "Lookbook", num: "01" },
  { href: "#rack", id: "rack", label: "Garment Rack", num: "02" },
  { href: "#vault-gate", id: "vault-gate", label: "Waitlist", num: "03" },
  { href: "#swipe-vote", id: "swipe-vote", label: "Swipe Vote", num: "04" },
  { href: "#tag-lab", id: "tag-lab", label: "Creator Lab", num: "05" },
  { href: "#dissect", id: "dissect", label: "Sample-First", num: "06" },
];

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "KX";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export default function V2Navbar() {
  const { user, setAuthModalOpen, logout } = useAuth();
  const { waitlistPass, isVaultUnlocked, cartCount, setCartOpen } = useVault();

  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string>("deck");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollMarker = window.scrollY + 180;
      let current = "deck";
      for (const item of NAV_ANCHORS) {
        const el = document.getElementById(item.id);
        if (el && el.offsetTop <= scrollMarker) {
          current = item.id;
        }
      }
      setActiveId(current);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const showUnlocked = mounted && isVaultUnlocked;
  const showPass = mounted ? waitlistPass : null;
  const showCartCount = mounted ? cartCount : 0;
  const showUser = mounted ? user : null;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-4 pt-4 sm:px-8">
      <div className="mx-auto max-w-[1380px]">
        <div className="pointer-events-auto flex items-center justify-between gap-2 rounded-full border border-ink/12 bg-white/82 px-3 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:px-4">
          {/* Left: Sculptural KNITX wordmark + Klein-blue Archive dot */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <Link
              href="/v2#deck"
              onClick={() => setActiveId("deck")}
              className="group inline-flex items-baseline gap-0.5 pl-1.5"
            >
              <span className="font-syne text-lg font-extrabold tracking-tight text-ink transition-colors group-hover:text-klein sm:text-xl">
                KNITX
              </span>
              <sup className="font-mono text-[9px] font-semibold text-[#64625D]">
                ®
              </sup>
            </Link>

            <span className="hidden h-4 w-px bg-ink/12 sm:inline-block" />

            <span className="hidden items-center gap-1.5 font-mono text-[10px] font-medium tracking-[0.2em] text-[#64625D] uppercase sm:inline-flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-klein opacity-55" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-klein" />
              </span>
              ARCHIVE 01
            </span>
          </div>

          {/* Center: Smooth anchor jumps (Desktop) */}
          <nav
            aria-label="Exhibition Rooms"
            className="hidden items-center gap-0.5 lg:flex"
          >
            {NAV_ANCHORS.map((item) => {
              const isActive = activeId === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={() => setActiveId(item.id)}
                  className={cn(
                    "relative rounded-full px-3.5 py-1.5 text-[12px] font-medium tracking-[-0.01em] transition-colors",
                    isActive
                      ? "text-ink"
                      : "text-[#64625D] hover:text-ink"
                  )}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="v2-nav-active-pill"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 34,
                      }}
                      className="absolute inset-0 rounded-full bg-linen"
                    />
                  ) : null}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {isActive ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-klein" />
                    ) : null}
                    {item.label}
                  </span>
                </a>
              );
            })}
          </nav>

          {/* Right: Vault status pill + Circular Bag + Member Pass */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mounted-safe Vault / Queue status pill */}
            <a
              href={showUnlocked ? "#rack" : "#vault-gate"}
              className={cn(
                "hidden items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] font-semibold tracking-[0.16em] uppercase transition-all sm:inline-flex",
                showUnlocked
                  ? "border-klein/25 bg-klein/8 text-klein hover:bg-klein hover:text-white"
                  : showPass
                    ? "border-ink/12 bg-linen text-ink hover:border-klein/40"
                    : "border-ink/12 bg-porcelain text-[#64625D] hover:border-ink/25 hover:text-ink"
              )}
            >
              {showUnlocked ? (
                <>
                  <Unlock className="h-3 w-3" />
                  VAULT OPEN
                </>
              ) : showPass ? (
                <>
                  <Lock className="h-3 w-3 text-klein" />
                  QUEUE #{showPass.position}
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  LOCKED
                </>
              )}
            </a>

            {/* Circular BAG button with Klein-blue badge */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Open Bag (${showCartCount} items)`}
              className="group relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-ink/12 bg-porcelain text-ink transition-all hover:border-klein/40 hover:bg-white hover:text-klein"
            >
              <ShoppingBag className="h-4 w-4" />
              <span
                className={cn(
                  "absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold transition-transform group-hover:scale-105",
                  showCartCount > 0
                    ? "bg-klein text-white shadow-[0_2px_8px_rgba(0,43,255,0.35)]"
                    : "border border-ink/12 bg-white text-[#64625D]"
                )}
              >
                {showCartCount}
              </span>
            </button>

            {/* PASS / Member initials button */}
            {showUser ? (
              <button
                type="button"
                onClick={() => logout()}
                title={`Signed in as ${showUser.displayName} · Click to sign out`}
                className="group inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-ink/12 bg-ink px-2.5 text-white transition-all hover:bg-klein"
              >
                <span className="font-mono text-[10px] font-bold tracking-[0.12em]">
                  {getInitials(showUser.displayName)}
                </span>
                <LogOut className="h-3 w-3 opacity-75 transition-transform group-hover:translate-x-0.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-ink/12 bg-ink px-3.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-white uppercase transition-all hover:bg-klein"
              >
                <User className="h-3 w-3" />
                <span>PASS</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle Exhibition Navigation"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-ink/12 bg-porcelain text-ink transition-colors hover:bg-linen lg:hidden"
            >
              {mobileOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Floating Glass Porcelain Sheet */}
        <AnimatePresence>
          {mobileOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto mt-2.5 overflow-hidden rounded-3xl border border-ink/12 bg-white/94 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.1)] backdrop-blur-xl lg:hidden"
            >
              <div className="mb-2 flex items-center justify-between px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-[#64625D] uppercase">
                <span>EXHIBITION MAP · INDIA</span>
                <span
                  className={cn(
                    "font-semibold",
                    showUnlocked ? "text-klein" : "text-ink"
                  )}
                >
                  {showUnlocked
                    ? "VAULT OPEN"
                    : showPass
                      ? `QUEUE #${showPass.position}`
                      : "LOCKED"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {NAV_ANCHORS.map((item) => {
                  const isActive = activeId === item.id;
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      onClick={() => {
                        setActiveId(item.id);
                        setMobileOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-3.5 py-2.5 text-sm transition-colors",
                        isActive
                          ? "border-klein/25 bg-klein/6 font-semibold text-klein"
                          : "border-ink/8 bg-porcelain/70 text-ink hover:bg-linen"
                      )}
                    >
                      <span>{item.label}</span>
                      <span className="font-mono text-[10px] opacity-60">
                        {item.num}
                      </span>
                    </a>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
