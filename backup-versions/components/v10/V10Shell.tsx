"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import { cn } from "@/lib/utils";

const V10_NAV_LINKS = [
  { href: "/v10/release", label: "RELEASE", num: "01" },
  { href: "/v10/archive", label: "ARCHIVE", num: "02" },
  { href: "/v10/vote", label: "VOTE", num: "03" },
  { href: "/v10/submit", label: "SUBMIT", num: "04" },
  { href: "/v10/atelier", label: "ATELIER", num: "05" },
] as const;

export default function V10Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, setAuthModalOpen, logout } = useAuth();
  const { cartCount, setCartOpen } = useVault();

  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const showUser = mounted ? user : null;
  const showCartCount = mounted ? cartCount : 0;
  const memberFirstName = showUser
    ? showUser.displayName.trim().split(/\s+/)[0] || "MEMBER"
    : null;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111110] selection:bg-[#111110] selection:text-[#FAF9F6]">
      {/* Fixed Minimalist Gallery Top Bar */}
      <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-[#111110]/10 bg-[#FAF9F6]/92 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          {/* Left: Quiet-Luxury Wordmark */}
          <Link
            href="/v10"
            className="group inline-flex items-center gap-2.5 text-[#111110]"
          >
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 bg-[#8C1D18] transition-transform duration-300 group-hover:scale-110"
            />
            <span className="font-sans text-[15px] font-semibold uppercase tracking-[0.32em]">
              KNITX
            </span>
          </Link>

          {/* Center: Desktop Primary Navigation */}
          <nav
            aria-label="House navigation"
            className="hidden h-full items-center gap-8 md:flex lg:gap-11"
          >
            {V10_NAV_LINKS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex h-full items-center font-sans text-[11px] font-medium uppercase tracking-[0.2em] transition-colors duration-200",
                    isActive
                      ? "text-[#111110]"
                      : "text-[#6E6A63] hover:text-[#111110]"
                  )}
                >
                  <span>{item.label}</span>
                  {isActive ? (
                    <motion.span
                      layoutId="v10-nav-line"
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-x-0 bottom-0 h-[1px] bg-[#111110]"
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          {/* Right: Account, Bag & Mobile Menu Trigger */}
          <div className="flex items-center gap-5 sm:gap-7">
            {showUser ? (
              <div className="hidden items-center gap-3 sm:flex">
                <span className="max-w-[96px] truncate font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#111110]">
                  {memberFirstName}
                </span>
                <span aria-hidden="true" className="text-[#111110]/25">
                  ·
                </span>
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => logout()}
                  className="cursor-pointer font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-[#6E6A63] transition-colors hover:text-[#8C1D18]"
                >
                  SIGN OUT
                </button>
              </div>
            ) : (
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="hidden cursor-pointer font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#111110] transition-colors hover:text-[#8C1D18] sm:inline-flex"
              >
                ACCOUNT
              </button>
            )}

            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Open shopping bag with ${showCartCount} items`}
              className="inline-flex cursor-pointer items-center gap-1.5 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#111110] transition-colors hover:text-[#8C1D18]"
            >
              <span>BAG</span>
              <span className="font-mono text-[10px] tracking-[0.08em] text-[#6E6A63] tabular-nums">
                ({showCartCount})
              </span>
            </button>

            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setDrawerOpen((open) => !open)}
              aria-label={drawerOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={drawerOpen}
              className="inline-flex cursor-pointer items-center justify-center p-1 text-[#111110] transition-colors hover:text-[#8C1D18] md:hidden"
            >
              {drawerOpen ? (
                <X className="h-5 w-5 stroke-[1.5]" />
              ) : (
                <Menu className="h-5 w-5 stroke-[1.5]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Full-Height Refined Ivory Slide-Over Drawer */}
      <AnimatePresence>
        {drawerOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-[#111110]/25 backdrop-blur-[2px]"
            />

            <motion.aside
              aria-label="Mobile navigation"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              className="relative ml-auto flex h-full w-full max-w-sm flex-col justify-between border-l border-[#111110]/10 bg-[#FAF9F6] px-6 py-6"
            >
              <div>
                <div className="flex h-10 items-center justify-between border-b border-[#111110]/10 pb-4">
                  <Link
                    href="/v10"
                    onClick={() => setDrawerOpen(false)}
                    className="inline-flex items-center gap-2.5 text-[#111110]"
                  >
                    <span aria-hidden="true" className="h-1.5 w-1.5 bg-[#8C1D18]" />
                    <span className="font-sans text-[14px] font-semibold uppercase tracking-[0.32em]">
                      KNITX
                    </span>
                  </Link>
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Close navigation menu"
                    className="cursor-pointer p-1 text-[#111110] transition-colors hover:text-[#8C1D18]"
                  >
                    <X className="h-5 w-5 stroke-[1.5]" />
                  </button>
                </div>

                <nav className="mt-8 divide-y divide-[#111110]/10 border-y border-[#111110]/10">
                  {V10_NAV_LINKS.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-baseline justify-between py-5 transition-colors hover:text-[#8C1D18]"
                      >
                        <div className="flex items-baseline gap-4">
                          <span className="font-mono text-[10px] tracking-[0.2em] text-[#6E6A63]">
                            {item.num}
                          </span>
                          <span
                            className={cn(
                              "font-editorial text-3xl leading-none",
                              isActive ? "italic text-[#8C1D18]" : "text-[#111110]"
                            )}
                          >
                            {item.label.charAt(0) + item.label.slice(1).toLowerCase()}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6E6A63]">
                          {isActive ? "ACTIVE" : "VIEW"}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-5 border-t border-[#111110]/10 pt-6">
                <div className="flex items-center justify-between">
                  {showUser ? (
                    <>
                      <span className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#111110]">
                        {showUser.displayName}
                      </span>
                      <button
                        suppressHydrationWarning
                        type="button"
                        onClick={() => {
                          logout();
                          setDrawerOpen(false);
                        }}
                        className="cursor-pointer font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-[#8C1D18] underline underline-offset-4"
                      >
                        SIGN OUT
                      </button>
                    </>
                  ) : (
                    <button
                      suppressHydrationWarning
                      type="button"
                      onClick={() => {
                        setDrawerOpen(false);
                        setAuthModalOpen(true);
                      }}
                      className="w-full cursor-pointer border border-[#111110] bg-[#111110] py-3.5 text-center font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-[#FAF9F6] transition-colors hover:bg-[#8C1D18] hover:border-[#8C1D18]"
                    >
                      ACCOUNT SIGN IN
                    </button>
                  )}
                </div>

                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6E6A63]">
                  CRAFTED IN INDIA · LIMITED EDITIONS · ZERO RESTOCKS
                </p>
              </div>
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Page Canvas */}
      <div className="pt-16">{children}</div>

      {/* Fashion-House Editorial Footer */}
      <footer className="border-t border-[#111110]/10 bg-[#FAF9F6] text-[#111110]">
        <div className="mx-auto max-w-[1440px] px-5 pt-20 pb-24 sm:px-8 sm:pb-20 lg:px-12">
          {/* 4-Column Architectural Ledger */}
          <div className="grid grid-cols-1 gap-12 border-b border-[#111110]/10 pb-16 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
            <div>
              <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-[#6E6A63]">
                THE HOUSE
              </h2>
              <p className="mt-5 text-[14px] leading-[1.7] text-[#6E6A63]">
                A contemporary Indian streetwear house devoted to numbered small-batch
                and one-of-one garments. Every silhouette is sampled once and cut to order
                with zero deadstock.
              </p>
              <Link
                href="/v10/atelier"
                className="mt-5 inline-block font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#111110] underline underline-offset-4 transition-colors hover:text-[#8C1D18]"
              >
                READ THE HOUSE NOTE
              </Link>
            </div>

            <div>
              <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-[#6E6A63]">
                EDITIONS
              </h2>
              <ul className="mt-5 space-y-3 text-[14px] text-[#111110]">
                <li>
                  <Link
                    href="/v10/release"
                    className="transition-colors hover:text-[#8C1D18]"
                  >
                    Current Release
                  </Link>
                </li>
                <li>
                  <Link
                    href="/v10/archive"
                    className="transition-colors hover:text-[#8C1D18]"
                  >
                    Edition Archive
                  </Link>
                </li>
                <li>
                  <Link
                    href="/v10#waitlist-desk"
                    className="transition-colors hover:text-[#8C1D18]"
                  >
                    Private Waitlist
                  </Link>
                </li>
                <li>
                  <Link
                    href="/v10/atelier"
                    className="transition-colors hover:text-[#8C1D18]"
                  >
                    Sample-First Atelier
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-[#6E6A63]">
                COMMUNITY
              </h2>
              <ul className="mt-5 space-y-3 text-[14px] text-[#111110]">
                <li>
                  <Link
                    href="/v10/vote"
                    className="transition-colors hover:text-[#8C1D18]"
                  >
                    Community Ballot
                  </Link>
                </li>
                <li>
                  <Link
                    href="/v10/submit"
                    className="transition-colors hover:text-[#8C1D18]"
                  >
                    Submit A Silhouette
                  </Link>
                </li>
              </ul>
              <p className="mt-5 text-[13px] leading-[1.65] text-[#6E6A63]">
                Selected creator garments enter studio sampling and carry the designer&apos;s
                credit on every numbered label.
              </p>
            </div>

            <div>
              <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-[#6E6A63]">
                CLIENT SERVICES
              </h2>
              <ul className="mt-5 space-y-3 text-[13px] leading-[1.65] text-[#6E6A63]">
                <li>Complimentary insured pan-India dispatch in archival linen bags.</li>
                <li>Cut-to-order atelier lead time of 5 to 14 business days.</li>
                <li>Strictly zero restocks once an edition closes permanently.</li>
              </ul>
            </div>
          </div>

          {/* Closing House Signature */}
          <div className="flex flex-col gap-6 pt-10 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-baseline gap-4">
              <Link
                href="/v10"
                className="font-editorial text-4xl leading-none tracking-[0.02em] text-[#111110] sm:text-5xl"
              >
                KNITX
              </Link>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#6E6A63]">
                INDIA
              </span>
            </div>

            <div className="flex flex-col gap-1.5 sm:items-end">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#111110]">
                CRAFTED IN INDIA · LIMITED EDITIONS · ZERO RESTOCKS
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6E6A63]">
                © 2026 KNITX HOUSE · PRIVATE RELEASE ATELIER
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
