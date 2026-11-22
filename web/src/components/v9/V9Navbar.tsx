"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Lock, Menu, ShoppingBag, Unlock, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  index: string;
  isVault?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "DROP 01", href: "/v9", index: "01" },
  { label: "VAULT", href: "/v9/vault", index: "02", isVault: true },
  { label: "VOTE", href: "/v9/vote", index: "03" },
  { label: "SUBMIT", href: "/v9/submit", index: "04" },
  { label: "CRAFT", href: "/v9/craft", index: "05" },
];

function getInitials(displayName?: string, email?: string): string {
  const cleanName = (displayName || "").trim();
  if (cleanName) {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "KX";
}

function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/v9") {
    return pathname === "/v9";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function V9Navbar() {
  const pathname = usePathname() || "/v9";
  const { user, setAuthModalOpen, logout } = useAuth();
  const { isVaultUnlocked, waitlistPass, cartCount, setCartOpen } = useVault();

  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close drawers/dropdowns when route changes
  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  // Close account menu on Escape or outside click
  useEffect(() => {
    if (!accountOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    const onPointerDown = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [accountOpen]);

  // Lock body scroll when full-height mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  const vaultOpen = mounted && isVaultUnlocked;
  const activePass = mounted ? waitlistPass : null;
  const safeCartCount = mounted ? cartCount : 0;
  const activeUser = mounted ? user : null;

  const queuePosition = activePass ? activePass.position : 1843;

  return (
    <>
      <header className="sticky top-0 z-40 w-full">
        {/* Tier 1: Top Whisper Strip (28px) */}
        <div className="flex h-7 w-full items-center justify-center bg-[#111110] px-4 text-[#F7F5F0]">
          <p className="truncate font-mono text-[9px] tracking-[0.22em] uppercase sm:text-[10px]">
            <span className="hidden md:inline">
              DROP 01 · WAITLIST OPEN · 3–4 UNITS SMALL-BATCH · TWO 1-OF-1
              COLLECTOR PIECES · MADE IN INDIA
            </span>
            <span className="md:hidden">
              DROP 01 · WAITLIST OPEN · 3–4 UNITS · TWO 1-OF-1s · INDIA
            </span>
          </p>
        </div>

        {/* Tier 2: Main Architectural Header (68px) */}
        <div className="h-[68px] w-full border-b border-[#DDD7CB] bg-[#F7F5F0]/92 backdrop-blur-xl">
          <div className="mx-auto grid h-full max-w-[1400px] grid-cols-3 items-center px-4 sm:px-8">
            {/* Left: Multi-page Navigation + Mobile Menu Button */}
            <div className="flex items-center justify-start">
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#DDD7CB] bg-[#FFFFFF] text-[#111110] transition-colors duration-200 hover:border-[#111110] lg:hidden"
              >
                <Menu className="h-4 w-4 stroke-[1.75]" />
              </button>

              <nav
                aria-label="Flagship navigation"
                className="hidden items-center gap-5 lg:flex xl:gap-7"
              >
                {NAV_ITEMS.map((item) => {
                  const active = isRouteActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "relative inline-flex items-center gap-1.5 py-2 font-sans text-[11px] font-medium tracking-[0.16em] uppercase transition-colors duration-200",
                        active
                          ? "text-[#111110]"
                          : "text-[#6A655D] hover:text-[#111110]"
                      )}
                    >
                      <span>{item.label}</span>
                      {item.isVault && (
                        <span
                          aria-hidden="true"
                          className={cn(
                            "h-1.5 w-1.5 rounded-full transition-colors duration-300",
                            vaultOpen ? "bg-[#8E1C1C]" : "bg-[#9A7B4F]"
                          )}
                        />
                      )}
                      {active && (
                        <motion.span
                          layoutId="v9-nav-underline"
                          transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 34,
                          }}
                          className="absolute inset-x-0 -bottom-0.5 h-[1.5px] bg-[#8E1C1C]"
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Center: Sculptural KNITX Wordmark */}
            <div className="flex items-center justify-center">
              <Link
                href="/v9"
                aria-label="KNITX Flagship Home"
                className="group inline-flex items-baseline focus:outline-none"
              >
                <span className="font-poster text-3xl leading-none tracking-[0.06em] text-[#111110] uppercase transition-opacity duration-200 group-hover:opacity-85 sm:text-4xl">
                  KNITX
                </span>
                <span className="font-poster text-3xl leading-none text-[#8E1C1C] sm:text-4xl">
                  .
                </span>
              </Link>
            </div>

            {/* Right: Queue/Vault Pill, Bag, Account */}
            <div className="flex items-center justify-end gap-2.5 sm:gap-4">
              {/* Mounted-safe Vault / Line Pill */}
              {vaultOpen ? (
                <Link
                  href="/v9/vault"
                  className="hidden items-center gap-1.5 rounded-full bg-[#8E1C1C] px-3.5 py-1.5 font-mono text-[10px] font-medium tracking-[0.16em] text-white uppercase transition-colors duration-200 hover:bg-[#721515] sm:inline-flex"
                >
                  <Unlock className="h-3 w-3 stroke-[2]" />
                  <span>VAULT OPEN</span>
                </Link>
              ) : (
                <Link
                  href="/v9#waitlist"
                  className="hidden items-center gap-1.5 rounded-full border border-[#DDD7CB] bg-[#FFFFFF] px-3.5 py-1.5 font-mono text-[10px] font-medium tracking-[0.16em] text-[#111110] uppercase transition-colors duration-200 hover:border-[#8E1C1C] hover:text-[#8E1C1C] sm:inline-flex"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9A7B4F]" />
                  <span>LINE #{queuePosition}</span>
                </Link>
              )}

              {/* Bag Button */}
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setCartOpen(true)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1.5 font-mono text-[11px] font-medium tracking-[0.14em] text-[#111110] uppercase transition-colors duration-200 hover:border-[#DDD7CB] hover:bg-[#FFFFFF]"
              >
                <ShoppingBag className="h-3.5 w-3.5 stroke-[1.75]" />
                <span>BAG ({safeCartCount})</span>
              </button>

              {/* Sign In / Collector Initials Dropdown */}
              <div ref={dropdownRef} className="relative">
                {activeUser ? (
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setAccountOpen((prev) => !prev)}
                    aria-expanded={accountOpen}
                    aria-label="Collector account menu"
                    className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#111110] bg-[#111110] font-mono text-[11px] font-semibold tracking-[0.08em] text-[#F7F5F0] uppercase transition-colors duration-200 hover:border-[#8E1C1C] hover:bg-[#8E1C1C]"
                  >
                    {getInitials(activeUser.displayName, activeUser.email)}
                  </button>
                ) : (
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setAuthModalOpen(true)}
                    className="hidden cursor-pointer border-b border-[#111110]/30 pb-0.5 font-sans text-[11px] font-medium tracking-[0.16em] text-[#111110] uppercase transition-colors duration-200 hover:border-[#8E1C1C] hover:text-[#8E1C1C] sm:inline-block"
                  >
                    SIGN IN
                  </button>
                )}

                <AnimatePresence>
                  {accountOpen && activeUser && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 mt-3 w-64 rounded-2xl border border-[#DDD7CB] bg-[#FFFFFF] p-5 shadow-[0_24px_60px_-24px_rgba(17,17,16,0.22)]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] tracking-[0.2em] text-[#9A7B4F] uppercase">
                          COLLECTOR PASS
                        </span>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#8E1C1C]" />
                      </div>

                      <p className="mt-2 truncate font-poster text-xl tracking-wide text-[#111110] uppercase">
                        {activeUser.displayName}
                      </p>
                      <p className="truncate font-sans text-xs text-[#6A655D]">
                        {activeUser.email}
                      </p>

                      <div className="my-4 h-px bg-[#DDD7CB]" />

                      <div className="flex flex-col gap-2.5">
                        <Link
                          href="/v9/vault"
                          className="flex items-center justify-between font-mono text-[10px] tracking-[0.16em] text-[#111110] uppercase transition-colors hover:text-[#8E1C1C]"
                        >
                          <span>
                            {vaultOpen ? "ENTER OPEN VAULT" : "VIEW DROP VAULT"}
                          </span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          suppressHydrationWarning
                          onClick={() => {
                            setAccountOpen(false);
                            void logout();
                          }}
                          className="cursor-pointer text-left font-mono text-[10px] tracking-[0.16em] text-[#6A655D] uppercase transition-colors hover:text-[#8E1C1C]"
                        >
                          SIGN OUT
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Silky Full-Height Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex flex-col bg-[#F7F5F0] lg:hidden"
          >
            {/* Mobile Drawer Top Bar */}
            <div className="flex h-[68px] items-center justify-between border-b border-[#DDD7CB] px-5">
              <Link
                href="/v9"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-baseline"
              >
                <span className="font-poster text-3xl leading-none tracking-[0.06em] text-[#111110] uppercase">
                  KNITX
                </span>
                <span className="font-poster text-3xl leading-none text-[#8E1C1C]">
                  .
                </span>
              </Link>

              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#DDD7CB] bg-[#FFFFFF] text-[#111110]"
              >
                <X className="h-4 w-4 stroke-[1.75]" />
              </button>
            </div>

            {/* Mobile Status Banner */}
            <div className="flex items-center justify-between border-b border-[#DDD7CB] bg-[#ECE8DF] px-5 py-3.5">
              <span className="font-mono text-[10px] tracking-[0.2em] text-[#6A655D] uppercase">
                DROP 01 ACCESS
              </span>
              {vaultOpen ? (
                <Link
                  href="/v9/vault"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#8E1C1C] px-3 py-1 font-mono text-[10px] tracking-[0.16em] text-white uppercase"
                >
                  <Unlock className="h-3 w-3" />
                  <span>VAULT OPEN</span>
                </Link>
              ) : (
                <Link
                  href="/v9#waitlist"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#DDD7CB] bg-[#FFFFFF] px-3 py-1 font-mono text-[10px] tracking-[0.16em] text-[#111110] uppercase"
                >
                  <Lock className="h-3 w-3 text-[#9A7B4F]" />
                  <span>LINE #{queuePosition}</span>
                </Link>
              )}
            </div>

            {/* All 5 Flagship Routes */}
            <motion.nav
              aria-label="Mobile flagship navigation"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-1 flex-col justify-center divide-y divide-[#DDD7CB] overflow-y-auto px-6 py-4"
            >
              {NAV_ITEMS.map((item) => {
                const active = isRouteActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="group flex items-baseline justify-between py-5"
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={cn(
                          "font-poster text-4xl tracking-[0.02em] uppercase transition-colors",
                          active ? "text-[#8E1C1C]" : "text-[#111110]"
                        )}
                      >
                        {item.label}
                      </span>
                      {item.isVault && (
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            vaultOpen ? "bg-[#8E1C1C]" : "bg-[#9A7B4F]"
                          )}
                        />
                      )}
                    </span>
                    <span className="font-mono text-xs tracking-[0.2em] text-[#6A655D]">
                      {item.index}
                    </span>
                  </Link>
                );
              })}
            </motion.nav>

            {/* Mobile Drawer Footer Controls */}
            <div className="border-t border-[#DDD7CB] bg-[#ECE8DF]/70 px-6 py-5">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => {
                    setMobileOpen(false);
                    setCartOpen(true);
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#111110] bg-[#FFFFFF] px-4 py-3 font-mono text-[11px] font-medium tracking-[0.16em] text-[#111110] uppercase"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>BAG ({safeCartCount})</span>
                </button>

                {activeUser ? (
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => {
                      setMobileOpen(false);
                      void logout();
                    }}
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-[#111110] px-4 py-3 font-mono text-[11px] font-medium tracking-[0.16em] text-[#F7F5F0] uppercase"
                  >
                    SIGN OUT
                  </button>
                ) : (
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => {
                      setMobileOpen(false);
                      setAuthModalOpen(true);
                    }}
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-[#8E1C1C] px-4 py-3 font-mono text-[11px] font-medium tracking-[0.16em] text-white uppercase"
                  >
                    SIGN IN
                  </button>
                )}
              </div>
              <p className="mt-4 text-center font-mono text-[10px] tracking-[0.2em] text-[#6A655D] uppercase">
                KNITX ARCHIVE · MADE IN INDIA · ZERO DEADSTOCK
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
