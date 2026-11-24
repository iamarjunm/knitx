"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import { cn } from "@/lib/utils";

const V12_NAV_LINKS = [
  { href: "/v12/release", label: "SHOP RELEASE", num: "01" },
  { href: "/v12/releases", label: "RELEASES", num: "02" },
  { href: "/v12/vote", label: "VOTE", num: "03" },
  { href: "/v12/submit", label: "SUBMIT", num: "04" },
  { href: "/v12/atelier", label: "ATELIER", num: "05" },
] as const;

export default function V12Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, setAuthModalOpen, logout } = useAuth();
  const { cartCount, setCartOpen } = useVault();

  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isHome = pathname === "/v12";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  const isTransparent = isHome && !scrolled;
  const showUser = mounted ? user : null;
  const showCartCount = mounted ? cartCount : 0;
  const memberFirstName = showUser
    ? showUser.displayName.trim().split(/\s+/)[0] || "MEMBER"
    : null;

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white">
      {/* Ultra-Crisp 60px Fixed Gallery Flagship Header */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 h-[60px] transition-all duration-300",
          isTransparent
            ? "border-b border-white/15 bg-transparent text-white"
            : "border-b border-black/10 bg-white/95 text-black backdrop-blur-md"
        )}
      >
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-4 sm:px-8">
          {/* Left: Bold Geometric Wordmark */}
          <Link
            href="/v12"
            className={cn(
              "group inline-flex items-center gap-2.5 transition-colors",
              isTransparent ? "text-white" : "text-black"
            )}
          >
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 bg-[#E11D2E] transition-transform duration-300 group-hover:scale-125"
            />
            <span className="font-syne text-[16px] font-extrabold uppercase tracking-[0.26em]">
              KNITX
            </span>
          </Link>

          {/* Center: Desktop Primary Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden h-full items-center gap-7 md:flex lg:gap-9"
          >
            {V12_NAV_LINKS.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex h-full items-center font-sans text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors duration-200",
                    isTransparent
                      ? isActive
                        ? "text-white"
                        : "text-white/75 hover:text-white"
                      : isActive
                        ? "text-black"
                        : "text-neutral-500 hover:text-black"
                  )}
                >
                  <span>{item.label}</span>
                  {isActive ? (
                    <motion.span
                      layoutId="v12-nav-indicator"
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        "absolute inset-x-0 bottom-0 h-[2px]",
                        isTransparent ? "bg-white" : "bg-black"
                      )}
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          {/* Right: Account, Bag & Mobile Trigger */}
          <div className="flex items-center gap-5 sm:gap-6">
            {showUser ? (
              <div className="hidden items-center gap-2.5 sm:flex">
                <span className="max-w-[104px] truncate font-sans text-[11px] font-semibold uppercase tracking-[0.16em]">
                  {memberFirstName}
                </span>
                <span
                  aria-hidden="true"
                  className={isTransparent ? "text-white/35" : "text-black/25"}
                >
                  ·
                </span>
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => logout()}
                  className={cn(
                    "cursor-pointer font-sans text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors",
                    isTransparent
                      ? "text-white/75 hover:text-[#E11D2E]"
                      : "text-neutral-500 hover:text-[#E11D2E]"
                  )}
                >
                  SIGN OUT
                </button>
              </div>
            ) : (
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className={cn(
                  "hidden cursor-pointer font-sans text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors sm:inline-flex",
                  isTransparent
                    ? "text-white hover:text-white/75"
                    : "text-black hover:text-[#E11D2E]"
                )}
              >
                ACCOUNT
              </button>
            )}

            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Open shopping bag with ${showCartCount} items`}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors",
                isTransparent
                  ? "text-white hover:text-white/75"
                  : "text-black hover:text-[#E11D2E]"
              )}
            >
              <span>BAG</span>
              <span
                className={cn(
                  "font-mono text-[11px] tabular-nums",
                  isTransparent ? "text-white/80" : "text-neutral-500"
                )}
              >
                ({showCartCount})
              </span>
            </button>

            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setDrawerOpen((open) => !open)}
              aria-label={
                drawerOpen ? "Close navigation menu" : "Open navigation menu"
              }
              aria-expanded={drawerOpen}
              className={cn(
                "inline-flex cursor-pointer items-center justify-center p-1 transition-colors md:hidden",
                isTransparent
                  ? "text-white hover:text-white/75"
                  : "text-black hover:text-[#E11D2E]"
              )}
            >
              {drawerOpen ? (
                <X className="h-5 w-5 stroke-[1.75]" />
              ) : (
                <Menu className="h-5 w-5 stroke-[1.75]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Full-Height Pure-White Mobile Drawer */}
      <AnimatePresence>
        {drawerOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            />

            <motion.aside
              aria-label="Mobile navigation"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="relative ml-auto flex h-full w-full max-w-sm flex-col justify-between bg-white px-6 py-5 text-black"
            >
              <div>
                <div className="flex h-10 items-center justify-between border-b border-black/10 pb-4">
                  <Link
                    href="/v12"
                    onClick={() => setDrawerOpen(false)}
                    className="inline-flex items-center gap-2.5 text-black"
                  >
                    <span aria-hidden="true" className="h-1.5 w-1.5 bg-[#E11D2E]" />
                    <span className="font-syne text-[15px] font-extrabold uppercase tracking-[0.26em]">
                      KNITX
                    </span>
                  </Link>
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Close navigation menu"
                    className="cursor-pointer p-1 text-black transition-colors hover:text-[#E11D2E]"
                  >
                    <X className="h-5 w-5 stroke-[1.75]" />
                  </button>
                </div>

                <nav className="mt-6 divide-y divide-black/10 border-y border-black/10">
                  {V12_NAV_LINKS.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center justify-between py-5 transition-colors hover:text-[#E11D2E]"
                      >
                        <div className="flex items-baseline gap-4">
                          <span className="font-mono text-[10px] tracking-[0.18em] text-neutral-400">
                            {item.num}
                          </span>
                          <span
                            className={cn(
                              "font-syne text-xl font-extrabold uppercase tracking-[0.04em]",
                              isActive ? "text-[#E11D2E]" : "text-black"
                            )}
                          >
                            {item.label}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                          {isActive ? "ACTIVE" : "→"}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-4 border-t border-black/10 pt-5">
                {showUser ? (
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-black">
                      {showUser.displayName}
                    </span>
                    <button
                      suppressHydrationWarning
                      type="button"
                      onClick={() => {
                        logout();
                        setDrawerOpen(false);
                      }}
                      className="cursor-pointer font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E11D2E] underline underline-offset-4"
                    >
                      SIGN OUT
                    </button>
                  </div>
                ) : (
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      setAuthModalOpen(true);
                    }}
                    className="w-full cursor-pointer bg-black py-3.5 text-center font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#E11D2E]"
                  >
                    SIGN IN / ACCOUNT
                  </button>
                )}

                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  INDIAN STREETWEAR · 1–4 UNITS · ZERO RESTOCKS
                </p>
              </div>
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Main Content Canvas */}
      <div className={isHome ? "" : "pt-[60px]"}>{children}</div>

      {/* Minimalist Gallery Flagship Footer */}
      <footer className="border-t border-black/10 bg-white text-black">
        <div className="mx-auto max-w-[1600px] px-4 pt-16 pb-24 sm:px-8 sm:pb-20">
          {/* Clean 4-Column SSENSE/Acne-Style Grid */}
          <div className="grid grid-cols-2 gap-10 border-b border-black/10 pb-14 lg:grid-cols-4">
            <div className="col-span-2 lg:col-span-1">
              <div className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="h-1.5 w-1.5 bg-[#E11D2E]" />
                <span className="font-syne text-xs font-extrabold uppercase tracking-[0.24em]">
                  KNITX
                </span>
              </div>
              <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-neutral-600">
                Limited-run Indian streetwear. 1–4 numbered units per silhouette,
                cut to order after release access opens.
              </p>
            </div>

            <div>
              <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                RELEASES
              </h2>
              <ul className="mt-4 space-y-2.5 text-[13px] font-medium">
                <li>
                  <Link
                    href="/v12/release"
                    className="transition-colors hover:text-[#E11D2E]"
                  >
                    Shop Current Release
                  </Link>
                </li>
                <li>
                  <Link
                    href="/v12/releases"
                    className="transition-colors hover:text-[#E11D2E]"
                  >
                    Releases Archive
                  </Link>
                </li>
                <li>
                  <Link
                    href="/v12#v12-waitlist"
                    className="transition-colors hover:text-[#E11D2E]"
                  >
                    Join Waitlist
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                COMMUNITY
              </h2>
              <ul className="mt-4 space-y-2.5 text-[13px] font-medium">
                <li>
                  <Link
                    href="/v12/vote"
                    className="transition-colors hover:text-[#E11D2E]"
                  >
                    Vote Next Release
                  </Link>
                </li>
                <li>
                  <Link
                    href="/v12/submit"
                    className="transition-colors hover:text-[#E11D2E]"
                  >
                    Submit Your Design
                  </Link>
                </li>
                <li>
                  <Link
                    href="/v12/atelier"
                    className="transition-colors hover:text-[#E11D2E]"
                  >
                    Inside The Atelier
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-span-2 lg:col-span-1">
              <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                CLIENT CARE
              </h2>
              <ul className="mt-4 space-y-2 text-[13px] text-neutral-600">
                <li>Cut-to-order atelier lead time: 5–14 business days</li>
                <li>Complimentary insured pan-India dispatch</li>
                <li>Zero deadstock · Strictly zero restocks</li>
              </ul>
            </div>
          </div>

          {/* Massive Edge-to-Edge Poster Wordmark */}
          <div className="pt-8">
            <Link
              href="/v12"
              aria-label="KNITX Flagship Home"
              className="block overflow-hidden text-center"
            >
              <span className="block font-poster text-[23vw] leading-[0.82] tracking-[0.02em] text-black uppercase select-none sm:text-[18vw] lg:text-[16vw]">
                KNITX
              </span>
            </Link>

            <div className="mt-6 flex flex-col gap-2 border-t border-black/10 pt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
              <span>© 2026 KNITX · OFFICIAL STREETWEAR FLAGSHIP</span>
              <span>CRAFTED IN INDIA · LIMITED TO 1–4 UNITS PER DESIGN</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
