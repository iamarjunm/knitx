"use client";

import React, { useEffect, useState } from "react";
import { Menu, ShoppingBag, Stamp, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#spread", code: "01", label: "SPREAD" },
  { href: "#scratch", code: "02", label: "SCRATCH BOARD" },
  { href: "#stamp-card", code: "03", label: "WAITLIST" },
  { href: "#sticker-poll", code: "04", label: "STICKER VOTE" },
  { href: "#postcard", code: "05", label: "OPEN CALL" },
] as const;

export function V4Navbar() {
  const { user, setAuthModalOpen } = useAuth();
  const { isVaultUnlocked, waitlistPass, cartCount, setCartOpen } = useVault();

  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const vaultOpen = mounted && isVaultUnlocked;
  const safeCartCount = mounted ? cartCount : 0;
  const safePass = mounted ? waitlistPass : null;
  const safeUser = mounted ? user : null;

  const shortUserName = safeUser?.displayName
    ? safeUser.displayName.split(" ")[0].toUpperCase().slice(0, 10)
    : null;

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-newsprint/95 backdrop-blur-sm text-ink">
      {/* Top Broadsheet Hairline Dateline Strip */}
      <div className="border-b border-ink/25 bg-manila/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-1.5 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-2 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-ink/80">
            <span>VOL. 01</span>
            <span aria-hidden="true">·</span>
            <span>ISSUE NO. 001</span>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <span className="hidden sm:inline">PRINTED IN INDIA</span>
            <span aria-hidden="true" className="hidden md:inline">
              ·
            </span>
            <span className="hidden md:inline">WAITLIST EDITION ONLY</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em]">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 border px-2 py-0.5",
                vaultOpen
                  ? "border-riso bg-riso text-white"
                  : "border-ink bg-ochre/90 text-ink"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  vaultOpen
                    ? "bg-white animate-pulse"
                    : "bg-ink animate-pulse"
                )}
              />
              {vaultOpen ? "VAULT OPEN" : "WAITLIST LIVE"}
            </span>
            {safePass && (
              <span className="hidden sm:inline-block border border-ink/40 bg-white px-2 py-0.5 text-ink">
                QUEUE #{safePass.position}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Broadsheet Masthead Row */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Masthead Title */}
        <a
          href="#spread"
          className="group flex items-baseline gap-2.5 focus:outline-none"
        >
          <span className="font-editorial text-2xl sm:text-3xl italic font-normal tracking-tight text-ink leading-none group-hover:text-riso transition-colors">
            THE KNITX ZINE
          </span>
          <span className="hidden sm:inline-block -rotate-2 border border-ink bg-riso px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white">
            ED. 01
          </span>
        </a>

        {/* Desktop Newspaper Index Jumps */}
        <nav
          aria-label="Zine sections"
          className="hidden lg:flex items-center divide-x divide-ink/20 border border-ink/25 bg-white/70"
        >
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-newsprint"
            >
              <span className="text-[9px] text-riso group-hover:text-ochre">
                {item.code}
              </span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        {/* Right Action Stamps */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setCartOpen(true)}
            className={cn(
              "inline-flex items-center gap-1.5 border-2 border-ink px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-all cursor-pointer",
              safeCartCount > 0
                ? "bg-ochre text-ink shadow-[2.5px_2.5px_0px_#0A0A0A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#0A0A0A]"
                : "bg-white text-ink hover:bg-ink hover:text-newsprint"
            )}
          >
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.2} />
            <span>BAG [{safeCartCount}]</span>
          </button>

          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setAuthModalOpen(true)}
            className={cn(
              "inline-flex items-center gap-1.5 border-2 border-ink px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-all cursor-pointer",
              safeUser
                ? "bg-riso text-white shadow-[2.5px_2.5px_0px_#0A0A0A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#0A0A0A]"
                : "bg-ink text-newsprint hover:bg-riso hover:text-white"
            )}
          >
            <Stamp className="h-3.5 w-3.5" strokeWidth={2.2} />
            <span>{shortUserName ? `PASS · ${shortUserName}` : "PASS"}</span>
          </button>

          {/* Mobile Index Trigger */}
          <button
            type="button"
            suppressHydrationWarning
            aria-label={mobileMenuOpen ? "Close index menu" : "Open index menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex lg:hidden items-center justify-center border-2 border-ink bg-white p-1.5 text-ink hover:bg-ink hover:text-newsprint transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Broadsheet Index Drawer */}
      {mobileMenuOpen && (
        <div className="border-t-2 border-ink bg-manila/95 lg:hidden">
          <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-ink/20 px-4 py-2 sm:px-6">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2.5 font-mono text-xs font-bold uppercase tracking-[0.16em] text-ink hover:text-riso"
              >
                <span className="flex items-center gap-2">
                  <span className="text-riso">{item.code}</span>
                  <span>{item.label}</span>
                </span>
                <span className="text-[10px] text-ink/60">JUMP →</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
