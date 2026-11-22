"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
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

const NAV_ITEMS = [
  { href: "/", label: "DROP 01", short: "DROP", num: "01", note: "Waitlist & Teaser" },
  { href: "/vault", label: "THE VAULT", short: "VAULT", num: "02", note: "Gated 10-Piece Drop" },
  { href: "/vote", label: "VOTE", short: "VOTE", num: "03", note: "Decide Drop 02" },
  { href: "/submit", label: "SUBMIT", short: "SUBMIT", num: "04", note: "Get Produced & Credited" },
  { href: "/atelier", label: "SAMPLE-FIRST", short: "CRAFT", num: "05", note: "Zero Deadstock Ops" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, setAuthModalOpen, logout } = useAuth();
  const { waitlistPass, isVaultUnlocked, cartCount, setCartOpen } = useVault();

  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const showUnlocked = mounted && isVaultUnlocked;
  const showPass = mounted ? waitlistPass : null;
  const showCartCount = mounted ? cartCount : 0;
  const showUser = mounted ? user : null;

  if (
    pathname.startsWith("/v2") ||
    pathname.startsWith("/v3") ||
    pathname.startsWith("/v4") ||
    pathname.startsWith("/v5") ||
    pathname.startsWith("/v6") ||
    pathname.startsWith("/v7") ||
    pathname.startsWith("/v8") ||
    pathname.startsWith("/v9")
  ) {
    return null;
  }

  return (
    <>
      {/* TOP FLOATING CORNER CHROME — ZERO CLUTTER, PURE STREETWEAR ATTITUDE */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-4 pt-4 sm:px-6 md:px-8">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
          {/* Left: Stamped KNITX Brand Box */}
          <div className="pointer-events-auto flex items-center gap-2.5">
            <Link
              href="/"
              className="group inline-flex items-center gap-2.5 border-2 border-ink bg-surface px-3.5 py-2 stamp-shadow-sm transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
            >
              <span className="font-poster text-xl leading-none tracking-wider text-ink sm:text-2xl">
                KNITX<sup className="ml-0.5 font-mono text-[9px] font-bold">®</sup>
              </span>
              <span className="h-4 w-[1.5px] bg-ink/20" />
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-orange" />
                </span>
                D01
              </span>
            </Link>

            {/* Live Vault / Queue Status Stamp (Desktop) */}
            <Link
              href={showUnlocked ? "/vault" : "/#waitlist"}
              className={cn(
                "hidden items-center gap-1.5 border-2 border-ink px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition-all sm:inline-flex",
                showUnlocked
                  ? "bg-orange text-white stamp-shadow-sm"
                  : "bg-paper/95 text-ink backdrop-blur-md hover:bg-stone"
              )}
            >
              {showUnlocked ? (
                <>
                  <Unlock className="h-3 w-3" />
                  VAULT OPEN
                </>
              ) : showPass ? (
                <>
                  <Lock className="h-3 w-3 text-orange" />
                  LINE #{showPass.position}
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  WAITLIST LIVE
                </>
              )}
            </Link>
          </div>

          {/* Right: Bag + Auth + Fullscreen Index Trigger */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label="Open Bag"
              className="group relative inline-flex cursor-pointer items-center gap-2 border-2 border-ink bg-surface px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-ink stamp-shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">BAG</span>
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center px-1 font-mono text-[10px] font-bold",
                  showCartCount > 0 ? "bg-orange text-white" : "bg-stone text-ink"
                )}
              >
                {showCartCount}
              </span>
            </button>

            {showUser ? (
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => logout()}
                title={`Signed in as ${showUser.displayName} — click to sign out`}
                className="hidden cursor-pointer items-center gap-1.5 border-2 border-ink bg-paper/95 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-ink backdrop-blur-md transition-colors hover:bg-ink hover:text-paper sm:inline-flex"
              >
                <span className="max-w-[90px] truncate">
                  {showUser.displayName.split(" ")[0]}
                </span>
                <LogOut className="h-3 w-3 opacity-70" />
              </button>
            ) : (
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="hidden cursor-pointer items-center gap-1.5 border-2 border-ink bg-paper/95 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-ink backdrop-blur-md transition-colors hover:bg-ink hover:text-paper sm:inline-flex"
              >
                <User className="h-3.5 w-3.5" />
                PASS
              </button>
            )}

            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle Fullscreen Index Menu"
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 border-2 border-ink px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-widest stamp-shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0.5",
                menuOpen ? "bg-orange text-white" : "bg-ink text-paper"
              )}
            >
              {menuOpen ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
              <span>{menuOpen ? "CLOSE" : "INDEX"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* FLOATING BOTTOM KINETIC DOCK — SIGNATURE ANTI-TEMPLATE NAV */}
      <nav
        aria-label="Primary Dock"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3"
      >
        <div className="pointer-events-auto flex items-center gap-1 border-2 border-ink bg-surface/95 p-1.5 backdrop-blur-md stamp-shadow">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors sm:px-4 sm:text-[11px]",
                  isActive ? "text-paper" : "text-ink hover:text-orange"
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="knitx-dock-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className="absolute inset-0 bg-ink"
                  />
                ) : null}
                <span className="relative z-10 flex items-center gap-1.5">
                  {item.href === "/vault" ? (
                    showUnlocked ? (
                      <Unlock className="h-3 w-3 text-orange" />
                    ) : (
                      <Lock className="h-3 w-3 opacity-70" />
                    )
                  ) : null}
                  <span className="sm:hidden">{item.short}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* FULLSCREEN KINETIC TYPOGRAPHIC TAKEOVER MENU */}
      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-30 flex flex-col justify-between bg-paper bg-draft-grid px-6 pt-24 pb-24 sm:px-12"
          >
            <div className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col justify-center">
              <p className="mb-6 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-muted">
                KNITX® DIRECTORY // INDIA
              </p>

              <div className="divide-y-2 divide-ink border-y-2 border-ink">
                {NAV_ITEMS.map((item, idx) => {
                  const isActive =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const isDimmed = hoveredIdx !== null && hoveredIdx !== idx;

                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 + idx * 0.05, duration: 0.35 }}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "group flex items-baseline justify-between py-3.5 transition-opacity duration-200 sm:py-5",
                          isDimmed ? "opacity-30" : "opacity-100"
                        )}
                      >
                        <div className="flex items-baseline gap-4 sm:gap-8">
                          <span className="font-mono text-xs font-bold text-orange">
                            {item.num}
                          </span>
                          <span
                            className={cn(
                              "font-poster text-4xl uppercase tracking-tight transition-transform duration-200 group-hover:translate-x-3 sm:text-6xl lg:text-7xl",
                              isActive ? "text-orange" : "text-ink"
                            )}
                          >
                            {item.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="hidden font-mono text-xs uppercase tracking-widest text-muted md:inline">
                            {item.note}
                          </span>
                          <ArrowUpRight className="h-6 w-6 text-ink transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-orange" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="mx-auto flex w-full max-w-[1360px] flex-wrap items-center justify-between gap-4 pt-6 font-mono text-xs uppercase tracking-widest text-muted">
              <span>NO OPEN STORE · WAITLIST ONLY · ZERO DEADSTOCK</span>
              <div className="flex items-center gap-4">
                {showUser ? (
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="cursor-pointer font-bold text-ink underline underline-offset-4 hover:text-orange"
                  >
                    SIGN OUT ({showUser.displayName})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setAuthModalOpen(true);
                    }}
                    className="cursor-pointer font-bold text-ink underline underline-offset-4 hover:text-orange"
                  >
                    SIGN IN / DEMO PASS
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
