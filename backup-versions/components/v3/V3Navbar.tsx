"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  KeyRound,
  Lock,
  LogOut,
  Menu,
  ShoppingBag,
  Unlock,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import { cn } from "@/lib/utils";

interface NavSection {
  id: string;
  href: string;
  label: string;
  code: string;
}

const V3_SECTIONS: NavSection[] = [
  { id: "film", href: "#film", label: "FILM REEL", code: "01" },
  { id: "lockers", href: "#lockers", label: "10 LOCKERS", code: "02" },
  { id: "passbook", href: "#passbook", label: "PASSBOOK", code: "03" },
  { id: "bracket", href: "#bracket", label: "KNOCKOUT VOTE", code: "04" },
  { id: "console", href: "#console", label: "CREATOR LAB", code: "05" },
  { id: "calculator", href: "#calculator", label: "SAMPLE-FIRST", code: "06" },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "KX";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export default function V3Navbar() {
  const { user, setAuthModalOpen, logout } = useAuth();
  const { waitlistPass, isVaultUnlocked, cartCount, setCartOpen } = useVault();

  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string>("film");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const marker = window.scrollY + 140;
      let current = "film";
      for (const sec of V3_SECTIONS) {
        const el = document.getElementById(sec.id);
        if (el && el.offsetTop <= marker) {
          current = sec.id;
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

  const jumpToSection = (id: string) => {
    setActiveId(id);
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `#${id}`);
      }
    }
  };

  const showUnlocked = mounted && isVaultUnlocked;
  const showPass = mounted ? waitlistPass : null;
  const showCartCount = mounted ? cartCount : 0;
  const showUser = mounted ? user : null;

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-hunter/15 bg-alabaster/90 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-[1440px] items-center justify-between gap-2 px-3 sm:px-6">
        {/* Left: KNITX® wordmark + chartreuse hardware LED */}
        <div className="flex items-center gap-3">
          <Link
            href="/v3#film"
            onClick={() => setActiveId("film")}
            className="group inline-flex items-baseline gap-0.5"
          >
            <span className="font-syne text-base font-extrabold tracking-[-0.03em] text-hunter transition-opacity group-hover:opacity-80 sm:text-[17px]">
              KNITX
            </span>
            <sup className="font-mono text-[9px] font-bold text-hunter/70">
              ®
            </sup>
          </Link>

          <span className="hidden h-4 w-px bg-hunter/15 sm:inline-block" />

          <div className="hidden items-center gap-1.5 rounded-sm border border-hunter/15 bg-white/80 px-2 py-0.5 sm:inline-flex">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-chartreuse opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-chartreuse ring-1 ring-hunter/30" />
            </span>
            <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-hunter uppercase">
              ISSUE 01
            </span>
          </div>
        </div>

        {/* Center: Tactile Teenage-Engineering hardware section keys (Desktop) */}
        <nav
          aria-label="Vault OS Navigation"
          className="hidden items-center gap-1 xl:flex"
        >
          {V3_SECTIONS.map((sec) => {
            const isActive = activeId === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                suppressHydrationWarning
                onClick={() => jumpToSection(sec.id)}
                className={cn(
                  "relative inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2.5 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase transition-colors",
                  isActive
                    ? "text-chartreuse"
                    : "text-espresso/70 hover:bg-chrome/60 hover:text-hunter"
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="v3-nav-hardware-key"
                    transition={{ type: "spring", stiffness: 460, damping: 34 }}
                    className="absolute inset-0 rounded-md bg-hunter shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                  />
                ) : null}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-colors",
                      isActive ? "bg-chartreuse" : "bg-hunter/20"
                    )}
                  />
                  <span>{sec.label}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Compact medium desktop nav (lg to xl) */}
        <nav
          aria-label="Vault OS Compact Navigation"
          className="hidden items-center gap-0.5 lg:flex xl:hidden"
        >
          {V3_SECTIONS.map((sec) => {
            const isActive = activeId === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                suppressHydrationWarning
                onClick={() => jumpToSection(sec.id)}
                className={cn(
                  "relative inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 font-mono text-[9px] font-semibold tracking-[0.1em] uppercase transition-colors",
                  isActive
                    ? "bg-hunter text-chartreuse"
                    : "text-espresso/70 hover:bg-chrome/60 hover:text-hunter"
                )}
              >
                <span>{sec.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Mounted-safe Vault Status + BAG [0] + PASS */}
        <div className="flex items-center gap-1.5">
          {/* Vault status telemetry badge */}
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => jumpToSection(showUnlocked ? "lockers" : "passbook")}
            className={cn(
              "hidden h-7 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase transition-all sm:inline-flex",
              showUnlocked
                ? "border-hunter bg-hunter text-chartreuse hover:bg-hunter/90"
                : showPass
                  ? "border-hunter/30 bg-white text-hunter hover:border-hunter"
                  : "border-hunter/15 bg-chrome/65 text-espresso/75 hover:border-hunter/35 hover:text-hunter"
            )}
          >
            {showUnlocked ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-chartreuse" />
                <Unlock className="h-3 w-3" />
                <span>VAULT OPEN</span>
              </>
            ) : showPass ? (
              <>
                <Lock className="h-3 w-3 text-hunter" />
                <span>QUEUE #{showPass.position}</span>
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 opacity-70" />
                <span>LOCKED</span>
              </>
            )}
          </button>

          {/* BAG [0] tactile pill */}
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setCartOpen(true)}
            aria-label={`Open Bag (${showCartCount} items)`}
            className={cn(
              "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase transition-all",
              showCartCount > 0
                ? "border-hunter bg-hunter text-alabaster hover:bg-hunter/90"
                : "border-hunter/20 bg-white text-hunter hover:border-hunter"
            )}
          >
            <ShoppingBag className="h-3 w-3" />
            <span>BAG</span>
            <span
              className={cn(
                "rounded-xs px-1 py-0.5 text-[9px] leading-none font-bold",
                showCartCount > 0
                  ? "bg-chartreuse text-hunter"
                  : "bg-chrome text-espresso"
              )}
            >
              [{showCartCount}]
            </span>
          </button>

          {/* PASS / Member button */}
          {showUser ? (
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => logout()}
              title={`Signed in as ${showUser.displayName} · Click to sign out`}
              className="group inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-hunter/25 bg-white px-2.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-hunter uppercase transition-colors hover:border-hunter hover:bg-hunter hover:text-chartreuse"
            >
              <span>{getInitials(showUser.displayName)}</span>
              <LogOut className="h-3 w-3 opacity-70 transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : (
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-hunter/20 bg-alabaster px-2.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-hunter uppercase transition-colors hover:border-hunter hover:bg-hunter hover:text-chartreuse"
            >
              <KeyRound className="h-3 w-3" />
              <span>PASS</span>
            </button>
          )}

          {/* Mobile Drawer Trigger */}
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle Vault OS Menu"
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-hunter/20 bg-white text-hunter transition-colors hover:border-hunter lg:hidden"
          >
            {mobileOpen ? (
              <X className="h-3.5 w-3.5" />
            ) : (
              <Menu className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Hardware Dropdown Deck */}
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-hunter/15 bg-alabaster/98 px-3 py-3 shadow-[0_18px_40px_rgba(20,54,40,0.12)] backdrop-blur-xl lg:hidden"
          >
            <div className="mb-2.5 flex items-center justify-between border-b border-hunter/10 pb-2 font-mono text-[10px] tracking-[0.16em] text-espresso/65 uppercase">
              <span>VAULT OS · ISSUE 01 · INDIA</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 font-bold",
                  showUnlocked
                    ? "bg-hunter text-chartreuse"
                    : "bg-chrome text-hunter"
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
              {V3_SECTIONS.map((sec) => {
                const isActive = activeId === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    suppressHydrationWarning
                    onClick={() => jumpToSection(sec.id)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-left font-mono text-[10px] font-semibold tracking-[0.14em] uppercase transition-colors",
                      isActive
                        ? "border-hunter bg-hunter text-chartreuse"
                        : "border-hunter/15 bg-white text-espresso hover:border-hunter/40"
                    )}
                  >
                    <span>{sec.label}</span>
                    <span className="opacity-65">{sec.code}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
