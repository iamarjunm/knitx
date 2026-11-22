"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import { cn } from "@/lib/utils";

const V11_NAV_LINKS = [
  { href: "/v11/release", label: "RELEASE", num: "01" },
  { href: "/v11/releases", label: "RELEASES", num: "02" },
  { href: "/v11/vote", label: "VOTE", num: "03" },
  { href: "/v11/submit", label: "SUBMIT", num: "04" },
  { href: "/v11/atelier", label: "ATELIER", num: "05" },
] as const;

export default function V11Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, setAuthModalOpen, logout } = useAuth();
  const { cartCount, setCartOpen } = useVault();

  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isHome = pathname === "/v11";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 36);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const showUser = mounted ? user : null;
  const showCartCount = mounted ? cartCount : 0;
  const showFrostedHeader = !isHome || (mounted && scrolled);

  const memberFirstName = showUser
    ? showUser.displayName.trim().split(/\s+/)[0] || "MEMBER"
    : null;

  return (
    <div className="min-h-screen bg-[#070709] text-[#F4F2ED] selection:bg-[#C81E1E] selection:text-[#F4F2ED]">
      {/* Fixed Minimalist Obsidian Header */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 h-16 transition-all duration-300",
          showFrostedHeader
            ? "border-b border-white/10 bg-[#070709]/85 backdrop-blur-xl"
            : "border-b border-transparent bg-gradient-to-b from-[#070709]/75 via-[#070709]/25 to-transparent"
        )}
      >
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          {/* Left: Bold Wide-Tracked Wordmark + Live Crimson Dot */}
          <Link
            href="/v11"
            className="group inline-flex items-center gap-2.5 text-[#F4F2ED]"
          >
            <span className="font-syne text-[16px] font-extrabold uppercase tracking-[0.28em]">
              KNITX
            </span>
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-[#C81E1E] shadow-[0_0_8px_rgba(200,30,30,0.85)] transition-transform duration-300 group-hover:scale-125"
            />
          </Link>

          {/* Center: Desktop Primary Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden h-full items-center gap-8 md:flex lg:gap-10"
          >
            {V11_NAV_LINKS.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex h-full items-center font-sans text-[11px] font-medium uppercase tracking-[0.22em] transition-colors duration-200",
                    isActive
                      ? "text-[#F4F2ED]"
                      : "text-white/60 hover:text-white"
                  )}
                >
                  <span>{item.label}</span>
                  {isActive ? (
                    <motion.span
                      layoutId="v11-nav-indicator"
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-x-0 bottom-0 h-[1.5px] bg-[#F4F2ED]"
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          {/* Right: Account, Bag & Mobile Trigger */}
          <div className="flex items-center gap-5 sm:gap-7">
            {showUser ? (
              <div className="hidden items-center gap-3 sm:flex">
                <span className="max-w-[96px] truncate font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#F4F2ED]">
                  {memberFirstName}
                </span>
                <span aria-hidden="true" className="text-white/25">
                  ·
                </span>
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => logout()}
                  className="cursor-pointer font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-[#8E8C87] transition-colors hover:text-[#C81E1E]"
                >
                  SIGN OUT
                </button>
              </div>
            ) : (
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="hidden cursor-pointer font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-white/80 transition-colors hover:text-white sm:inline-flex"
              >
                ACCOUNT
              </button>
            )}

            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Open shopping bag with ${showCartCount} items`}
              className="inline-flex cursor-pointer items-center gap-1.5 font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-[#F4F2ED] transition-colors hover:text-[#C81E1E]"
            >
              <span>BAG</span>
              <span className="font-mono text-[10px] tracking-[0.08em] text-[#8E8C87] tabular-nums">
                ({showCartCount})
              </span>
            </button>

            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              className="inline-flex cursor-pointer items-center justify-center p-1 text-[#F4F2ED] transition-colors hover:text-[#C81E1E] md:hidden"
            >
              {menuOpen ? (
                <X className="h-5 w-5 stroke-[1.5]" />
              ) : (
                <Menu className="h-5 w-5 stroke-[1.5]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Mobile Obsidian Overlay Menu */}
      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            key="v11-mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex flex-col justify-between bg-[#070709]/98 px-6 py-5 backdrop-blur-2xl md:hidden"
          >
            {/* Top Bar */}
            <div className="flex h-10 items-center justify-between border-b border-white/10 pb-4">
              <Link
                href="/v11"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center gap-2.5 text-[#F4F2ED]"
              >
                <span className="font-syne text-[16px] font-extrabold uppercase tracking-[0.28em]">
                  KNITX
                </span>
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-[#C81E1E]"
                />
              </Link>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation menu"
                className="cursor-pointer p-1 text-[#F4F2ED] transition-colors hover:text-[#C81E1E]"
              >
                <X className="h-5 w-5 stroke-[1.5]" />
              </button>
            </div>

            {/* Center Monumental Links */}
            <nav
              aria-label="Mobile navigation"
              className="my-auto divide-y divide-white/10 border-y border-white/10"
            >
              {V11_NAV_LINKS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-baseline justify-between py-5 transition-colors hover:text-[#C81E1E]"
                  >
                    <div className="flex items-baseline gap-4">
                      <span className="font-mono text-[10px] tracking-[0.2em] text-[#8E8C87]">
                        {item.num}
                      </span>
                      <span
                        className={cn(
                          "font-syne text-3xl font-extrabold uppercase tracking-[-0.02em]",
                          isActive ? "text-[#C81E1E]" : "text-[#F4F2ED]"
                        )}
                      >
                        {item.label}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8E8C87]">
                      {isActive ? "ACTIVE" : "ENTER"}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Account & Origin */}
            <div className="space-y-4 border-t border-white/10 pt-5">
              {showUser ? (
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#F4F2ED]">
                    {showUser.displayName}
                  </span>
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.2em] text-[#C81E1E] underline underline-offset-4"
                  >
                    SIGN OUT
                  </button>
                </div>
              ) : (
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="w-full cursor-pointer bg-[#F4F2ED] py-4 text-center font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#070709] transition-colors hover:bg-[#C81E1E] hover:text-white"
                >
                  ACCOUNT SIGN IN
                </button>
              )}

              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8E8C87]">
                CRAFTED IN INDIA · NUMBERED EDITIONS · ZERO RESTOCKS
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Main Content Canvas */}
      <div className={isHome ? "" : "pt-16"}>{children}</div>

      {/* Obsidian Monolith Footer */}
      <footer className="border-t border-white/10 bg-[#050506] text-[#F4F2ED]">
        <div className="mx-auto max-w-[1440px] px-5 pt-20 pb-24 sm:px-8 sm:pb-20 lg:px-12">
          {/* 4 Ultra-Clean Minimal Columns */}
          <div className="grid grid-cols-2 gap-10 border-b border-white/10 pb-16 lg:grid-cols-4">
            <div>
              <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#8E8C87]">
                RELEASES
              </h2>
              <ul className="mt-5 space-y-3 text-[13px] text-[#F4F2ED]/80">
                <li>
                  <Link
                    href="/v11/release"
                    className="transition-colors hover:text-white"
                  >
                    Current Release
                  </Link>
                </li>
                <li>
                  <Link
                    href="/v11/releases"
                    className="transition-colors hover:text-white"
                  >
                    All Releases
                  </Link>
                </li>
                <li>
                  <Link
                    href="/v11#v11-access"
                    className="transition-colors hover:text-white"
                  >
                    Private Waitlist
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#8E8C87]">
                COMMUNITY
              </h2>
              <ul className="mt-5 space-y-3 text-[13px] text-[#F4F2ED]/80">
                <li>
                  <Link
                    href="/v11/vote"
                    className="transition-colors hover:text-white"
                  >
                    Community Ballot
                  </Link>
                </li>
                <li>
                  <Link
                    href="/v11/submit"
                    className="transition-colors hover:text-white"
                  >
                    Submit A Design
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#8E8C87]">
                ATELIER
              </h2>
              <ul className="mt-5 space-y-3 text-[13px] text-[#F4F2ED]/80">
                <li>
                  <Link
                    href="/v11/atelier"
                    className="transition-colors hover:text-white"
                  >
                    Sample-First Craft
                  </Link>
                </li>
                <li className="text-[#8E8C87]">Zero Deadstock Policy</li>
                <li className="text-[#8E8C87]">Permanent Pattern Archive</li>
              </ul>
            </div>

            <div>
              <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#8E8C87]">
                INDIA DISPATCH
              </h2>
              <ul className="mt-5 space-y-3 text-[13px] text-[#8E8C87]">
                <li>Insured Pan-India Delivery</li>
                <li>5–14 Day Cut-To-Order Studio Lead</li>
                <li>Individually Numbered Garment Labels</li>
              </ul>
            </div>
          </div>

          {/* Monumental Oversized Edge-to-Edge Wordmark */}
          <div className="pt-10">
            <Link
              href="/v11"
              aria-label="KNITX Flagship Home"
              className="block overflow-hidden"
            >
              <span className="block w-full select-none font-syne text-[clamp(4.25rem,17.5vw,15rem)] font-extrabold uppercase leading-[0.82] tracking-[-0.04em] text-[#F4F2ED]/[0.1] transition-colors duration-500 hover:text-[#F4F2ED]/[0.18]">
                KNITX
              </span>
            </Link>

            <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8E8C87] sm:flex-row sm:items-center sm:justify-between">
              <span>CRAFTED IN INDIA · 1–4 UNITS PER DESIGN · ZERO RESTOCKS</span>
              <span>© 2026 KNITX</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
