"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import { useStorefrontConfig } from "@/context/StorefrontConfigContext";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  num: string;
}

function isChromeBypassPath(pathname: string): boolean {
  if (!pathname) return false;
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/studio" ||
    pathname.startsWith("/studio/")
  ) {
    return true;
  }
  return /^\/v([2-9]|1[0-2])(\/|$)/.test(pathname);
}

export default function FlagshipShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, setAuthModalOpen, logout } = useAuth();
  const { cartCount, setCartOpen } = useVault();
  const { config } = useStorefrontConfig();

  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const bypassChrome = isChromeBypassPath(pathname);
  const isHome = pathname === "/";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (bypassChrome) return;
    if (!isHome) {
      setScrolled(true);
      return;
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 72);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome, bypassChrome]);

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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen]);

  const navItems = useMemo<NavItem[]>(() => {
    const list: Array<{ href: string; label: string }> = [
      { href: "/drops", label: "DROPS" },
    ];
    if (config.coreEnabled) {
      list.push({ href: "/core", label: "CORE" });
    }
    list.push({ href: "/archive", label: "ARCHIVE" });
    if (config.showVoteSection) {
      list.push({ href: "/vote", label: "VOTE" });
    }
    if (config.showSubmitSection) {
      list.push({ href: "/submit", label: "SUBMIT" });
    }
    if (config.showAtelierSection) {
      list.push({ href: "/atelier", label: "ATELIER" });
    }
    return list.map((item, idx) => ({
      ...item,
      num: String(idx + 1).padStart(2, "0"),
    }));
  }, [
    config.coreEnabled,
    config.showVoteSection,
    config.showSubmitSection,
    config.showAtelierSection,
  ]);

  if (bypassChrome) {
    return <>{children}</>;
  }

  const brandName = (config.brandName || "KNITX").trim() || "KNITX";
  const accentColor = config.accentColor || "#E11D2E";
  const showAnnouncement =
    mounted &&
    config.announcementEnabled &&
    config.announcementText.trim().length > 0;
  const isTransparent = isHome && !(mounted && scrolled);
  const showUser = mounted ? user : null;
  const showCartCount = mounted ? cartCount : 0;
  const memberFirstName = showUser
    ? showUser.displayName.trim().split(/\s+/)[0] || "MEMBER"
    : null;

  return (
    <div className="min-h-screen overflow-x-clip bg-white text-black selection:bg-black selection:text-white">
      {/* Optional Live 32px Jet-Black Top Announcement Strip */}
      {showAnnouncement ? (
        <div
          role="region"
          aria-label="Storefront announcement"
          className="fixed inset-x-0 top-0 z-50 flex h-8 items-center justify-center bg-black px-4 text-white"
        >
          <div className="flex max-w-[1600px] items-center gap-2.5 overflow-hidden">
            <span
              aria-hidden="true"
              style={{ backgroundColor: accentColor }}
              className="h-1.5 w-1.5 shrink-0"
            />
            <p className="truncate font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-white/95">
              {config.announcementText}
            </p>
          </div>
        </div>
      ) : null}

      {/* Ultra-Crisp 60px Fixed Gallery Flagship Header */}
      <header
        className={cn(
          "fixed inset-x-0 z-40 h-[60px] transition-all duration-300",
          showAnnouncement ? "top-8" : "top-0",
          isTransparent
            ? "border-b border-white/15 bg-gradient-to-b from-black/55 via-black/20 to-transparent text-white"
            : "border-b border-black/10 bg-white/95 text-black backdrop-blur-md"
        )}
      >
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-4 sm:px-8">
          {/* Left: Bold Geometric Wordmark */}
          <Link
            href="/"
            className={cn(
              "group inline-flex items-center gap-2.5 transition-colors",
              isTransparent ? "text-white" : "text-black"
            )}
          >
            <span
              aria-hidden="true"
              style={{ backgroundColor: accentColor }}
              className="h-1.5 w-1.5 transition-transform duration-300 group-hover:scale-125"
            />
            <span className="font-syne text-[16px] font-extrabold uppercase tracking-[0.26em]">
              {brandName}
            </span>
          </Link>

          {/* Center: Desktop Primary Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden h-full items-center gap-7 md:flex lg:gap-9"
          >
            {navItems.map((item) => {
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
                        : "text-[#666666] hover:text-black"
                  )}
                >
                  <span>{item.label}</span>
                  {isActive ? (
                    <motion.span
                      layoutId="flagship-nav-line"
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
          <div className="flex items-center gap-2 sm:gap-6">
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
                      ? "text-white/75 hover:text-white"
                      : "text-[#666666] hover:text-black"
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
                    : "text-black hover:text-[#666666]"
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
                "inline-flex min-h-[40px] cursor-pointer items-center gap-1 px-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors sm:px-0",
                isTransparent
                  ? "text-white hover:text-white/75"
                  : "text-black hover:text-[#666666]"
              )}
            >
              <span>BAG</span>
              <span
                className={cn(
                  "font-mono text-[11px] tabular-nums",
                  isTransparent ? "text-white/80" : "text-[#666666]"
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
                "-mr-2 inline-flex min-h-[40px] min-w-[40px] cursor-pointer items-center justify-center transition-colors md:hidden",
                isTransparent
                  ? "text-white hover:text-white/75"
                  : "text-black hover:text-[#666666]"
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
              className="relative ml-auto flex h-full w-full max-w-sm flex-col justify-between gap-8 overflow-y-auto bg-white px-5 py-5 text-black sm:px-6"
            >
              <div>
                <div className="flex min-h-[44px] shrink-0 items-center justify-between border-b border-black/10 pb-3">
                  <Link
                    href="/"
                    onClick={() => setDrawerOpen(false)}
                    className="inline-flex min-h-[40px] items-center gap-2.5 text-black"
                  >
                    <span
                      aria-hidden="true"
                      style={{ backgroundColor: accentColor }}
                      className="h-1.5 w-1.5"
                    />
                    <span className="font-syne text-[15px] font-extrabold uppercase tracking-[0.26em]">
                      {brandName}
                    </span>
                  </Link>
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Close navigation menu"
                    className="-mr-2 inline-flex min-h-[40px] min-w-[40px] cursor-pointer items-center justify-center text-black transition-colors hover:text-[#666666]"
                  >
                    <X className="h-5 w-5 stroke-[1.75]" />
                  </button>
                </div>

                <nav className="mt-5 divide-y divide-black/10 border-y border-black/10">
                  {navItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className="flex min-h-[52px] items-center justify-between py-3.5 transition-colors hover:opacity-75 sm:py-4"
                      >
                        <div className="flex items-baseline gap-4">
                          <span className="font-mono text-[10px] tracking-[0.18em] text-[#666666]">
                            {item.num}
                          </span>
                          <span
                            style={isActive ? { color: accentColor } : undefined}
                            className="font-syne text-xl font-extrabold uppercase tracking-[0.04em] text-black"
                          >
                            {item.label}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#666666]">
                          {isActive ? "ACTIVE" : "→"}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="shrink-0 space-y-4 border-t border-black/10 pt-5 pb-2">
                {showUser ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-sans text-xs font-semibold uppercase tracking-[0.14em] text-black">
                      {showUser.displayName}
                    </span>
                    <button
                      suppressHydrationWarning
                      type="button"
                      onClick={() => {
                        logout();
                        setDrawerOpen(false);
                      }}
                      style={{ color: accentColor }}
                      className="inline-flex min-h-[40px] shrink-0 cursor-pointer items-center font-sans text-[11px] font-semibold uppercase tracking-[0.16em] underline underline-offset-4"
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
                    className="min-h-[46px] w-full cursor-pointer bg-black py-3.5 text-center font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-85"
                  >
                    SIGN IN / ACCOUNT
                  </button>
                )}

                <p className="font-mono text-[10px] leading-relaxed uppercase tracking-[0.18em] text-[#666666]">
                  {config.footerTagline}
                </p>
              </div>
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Main Content Canvas */}
      <main
        className={
          isHome ? "" : showAnnouncement ? "pt-[92px]" : "pt-[60px]"
        }
      >
        {children}
      </main>

      {/* Minimalist Gallery Flagship Footer */}
      <footer className="border-t border-black/10 bg-white text-black">
        <div className="mx-auto max-w-[1600px] px-4 pt-12 pb-16 sm:px-8 sm:pt-16 sm:pb-20">
          {/* Clean 4-Column SSENSE / Acne-Style Grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-9 border-b border-black/10 pb-12 sm:gap-10 sm:pb-14 lg:grid-cols-4">
            <div className="col-span-2 lg:col-span-1">
              <div className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: accentColor }}
                  className="h-1.5 w-1.5"
                />
                <span className="font-syne text-xs font-extrabold uppercase tracking-[0.24em]">
                  {brandName}
                </span>
              </div>
              <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-[#666666]">
                Limited-run Indian streetwear. Curated limited-edition runs,
                cut to order with zero deadstock alongside the heavyweight
                Core wardrobe.
              </p>
            </div>

            <div>
              <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#666666]">
                COLLECTIONS
              </h2>
              <ul className="mt-4 space-y-2.5 text-[13px] font-medium">
                <li>
                  <Link
                    href="/drops"
                    className="transition-opacity hover:opacity-60"
                  >
                    Current Drop
                  </Link>
                </li>
                {config.coreEnabled ? (
                  <li>
                    <Link
                      href="/core"
                      className="transition-opacity hover:opacity-60"
                    >
                      {config.coreTitle}
                    </Link>
                  </li>
                ) : null}
                <li>
                  <Link
                    href="/archive"
                    className="transition-opacity hover:opacity-60"
                  >
                    Editions Archive
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#waitlist"
                    className="transition-opacity hover:opacity-60"
                  >
                    Community Waitlist
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#666666]">
                COMMUNITY
              </h2>
              <ul className="mt-4 space-y-2.5 text-[13px] font-medium">
                {config.showVoteSection ? (
                  <li>
                    <Link
                      href="/vote"
                      className="transition-opacity hover:opacity-60"
                    >
                      Vote Next Drop
                    </Link>
                  </li>
                ) : null}
                {config.showSubmitSection ? (
                  <li>
                    <Link
                      href="/submit"
                      className="transition-opacity hover:opacity-60"
                    >
                      Submit Your Design
                    </Link>
                  </li>
                ) : null}
                {config.showAtelierSection ? (
                  <li>
                    <Link
                      href="/atelier"
                      className="transition-opacity hover:opacity-60"
                    >
                      Inside The Atelier
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="col-span-2 lg:col-span-1">
              <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#666666]">
                CLIENT CARE
              </h2>
              <ul className="mt-4 space-y-2 text-[13px] text-[#666666]">
                <li>Cut-to-order atelier lead time: 5–14 business days</li>
                <li>Complimentary insured pan-India dispatch</li>
                <li>Zero deadstock · Strictly zero restocks</li>
              </ul>
            </div>
          </div>

          {/* Monumental V11-Style Solid Black Edge-to-Edge Wordmark */}
          <div className="pt-8 sm:pt-10">
            <Link
              href="/"
              aria-label={`${brandName} Flagship Home`}
              className="block overflow-hidden"
            >
              <span className="block w-full select-none font-syne text-[clamp(3.6rem,18vw,15rem)] font-extrabold uppercase leading-[0.82] tracking-[-0.04em] text-black">
                {brandName}
              </span>
            </Link>

            <div className="mt-7 flex flex-col gap-3 border-t border-black/10 pt-6 font-mono text-[10px] leading-relaxed uppercase tracking-[0.18em] text-[#666666] sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:tracking-[0.2em]">
              <span>{config.footerTagline}</span>
              <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                <span>© 2026 {brandName}</span>
                <span aria-hidden="true" className="text-black/20">
                  ·
                </span>
                <Link
                  href="/admin"
                  className="text-neutral-400 transition-colors hover:text-black"
                >
                  ADMIN
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
