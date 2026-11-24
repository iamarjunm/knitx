"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, LogOut, Menu, ShoppingBag, Unlock, User, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "v8-hero", href: "#v8-hero", label: "DROP" },
  { id: "v8-rack", href: "#v8-rack", label: "THE RACK" },
  { id: "v8-waitlist", href: "#v8-waitlist", label: "WAITLIST" },
  { id: "v8-community", href: "#v8-community", label: "COMMUNITY" },
];

function getFirstName(name: string): string {
  const first = name.trim().split(/\s+/)[0];
  return first || "Member";
}

export default function V8Navbar() {
  const { user, setAuthModalOpen, logout } = useAuth();
  const { waitlistPass, isVaultUnlocked, cartCount, setCartOpen } = useVault();

  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string>("v8-hero");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollMarker = window.scrollY + 200;
      let current = "v8-hero";
      for (const item of NAV_ITEMS) {
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
      <div className="mx-auto max-w-[1320px]">
        <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-full border border-ink/10 bg-white/86 px-3.5 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl sm:px-5">
          {/* Left: Bold V1 Anton KNITX mark + pulsing orange DROP 01 indicator */}
          <div className="flex items-center gap-3">
            <a
              href="#v8-hero"
              onClick={() => setActiveId("v8-hero")}
              className="group inline-flex items-baseline gap-0.5 pl-1"
            >
              <span className="font-poster text-2xl leading-none tracking-wide text-ink uppercase transition-colors group-hover:text-orange">
                KNITX
              </span>
              <sup className="font-mono text-[9px] font-semibold text-[#64625D]">
                ®
              </sup>
            </a>

            <span className="hidden h-4 w-px bg-ink/10 sm:inline-block" />

            <span className="hidden items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.18em] text-[#64625D] uppercase sm:inline-flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange" />
              </span>
              DROP 01
            </span>
          </div>

          {/* Center: 4 calm navigation links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden items-center gap-1 lg:flex"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeId === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={() => setActiveId(item.id)}
                  className={cn(
                    "relative rounded-full px-4 py-1.5 font-mono text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors",
                    isActive ? "text-ink" : "text-[#64625D] hover:text-ink"
                  )}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="v8-nav-active-pill"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 34,
                      }}
                      className="absolute inset-0 rounded-full bg-linen"
                    />
                  ) : null}
                  <span className="relative z-10">{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Right: Quiet Vault status + Circular Bag + Sign In / First Name */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mounted-safe Vault / Queue status */}
            <a
              href={showUnlocked ? "#v8-rack" : "#v8-waitlist"}
              className={cn(
                "hidden items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase transition-colors sm:inline-flex",
                showUnlocked
                  ? "border-orange/25 bg-orange/8 text-orange hover:bg-orange hover:text-white"
                  : showPass
                    ? "border-ink/10 bg-linen text-ink hover:border-orange/35"
                    : "border-ink/10 bg-porcelain text-[#64625D] hover:border-ink/25 hover:text-ink"
              )}
            >
              {showUnlocked ? (
                <>
                  <Unlock className="h-3 w-3" />
                  <span>Vault Open</span>
                </>
              ) : showPass ? (
                <>
                  <Lock className="h-3 w-3 text-orange" />
                  <span>Queue #{showPass.position}</span>
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  <span>Waitlist</span>
                </>
              )}
            </a>

            {/* Circular Bag pill with count */}
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setCartOpen(true)}
              aria-label={`Open bag with ${showCartCount} items`}
              className="group relative inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-ink/10 bg-porcelain px-3 text-ink transition-colors hover:border-orange/35 hover:bg-white"
            >
              <ShoppingBag className="h-3.5 w-3.5 transition-colors group-hover:text-orange" />
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[10px] font-bold transition-colors",
                  showCartCount > 0
                    ? "bg-orange text-white"
                    : "bg-linen text-[#64625D]"
                )}
              >
                {showCartCount}
              </span>
            </button>

            {/* Sign In or First Name */}
            {showUser ? (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => logout()}
                title={`Signed in as ${showUser.displayName} · Click to sign out`}
                className="group inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-ink/10 bg-ink px-3.5 text-xs font-medium text-white transition-colors hover:bg-orange"
              >
                <span className="max-w-[90px] truncate">
                  {getFirstName(showUser.displayName)}
                </span>
                <LogOut className="h-3 w-3 opacity-75 transition-transform group-hover:translate-x-0.5" />
              </button>
            ) : (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-ink/10 bg-ink px-3.5 text-xs font-medium text-white transition-colors hover:bg-orange"
              >
                <User className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-ink/10 bg-porcelain text-ink transition-colors hover:bg-linen lg:hidden"
            >
              {mobileOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Floating Frosted Dropdown */}
        <AnimatePresence>
          {mobileOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto mt-2.5 overflow-hidden rounded-3xl border border-ink/10 bg-white/95 p-3 shadow-[0_18px_48px_rgba(0,0,0,0.08)] backdrop-blur-xl lg:hidden"
            >
              <div className="mb-2 flex items-center justify-between px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#64625D] uppercase">
                <span>DROP 01 · INDIA</span>
                <span className={showUnlocked ? "text-orange" : "text-ink"}>
                  {showUnlocked
                    ? "VAULT OPEN"
                    : showPass
                      ? `QUEUE #${showPass.position}`
                      : "WAITLIST"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {NAV_ITEMS.map((item) => {
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
                        "flex items-center justify-between rounded-2xl border px-3.5 py-2.5 font-mono text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors",
                        isActive
                          ? "border-orange/25 bg-orange/8 text-orange"
                          : "border-ink/8 bg-porcelain text-ink hover:bg-linen"
                      )}
                    >
                      <span>{item.label}</span>
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
