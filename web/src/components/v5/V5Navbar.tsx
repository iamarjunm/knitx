"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Exhibition", href: "#aperture" },
  { label: "Collection", href: "#curtain-gallery" },
  { label: "Invitation", href: "#envelope" },
  { label: "Curation", href: "#curator-vote" },
  { label: "Atelier", href: "#folio" },
] as const;

function getUserInitials(name?: string, email?: string): string {
  const source = (name || email || "K").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default function V5Navbar() {
  const { user, setAuthModalOpen, logout } = useAuth();
  const { isVaultUnlocked, waitlistPass, cartCount, setCartOpen } = useVault();

  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!accountOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [accountOpen]);

  const scrollToSection = (href: string) => {
    setMobileOpen(false);
    const id = href.replace(/^#/, "");
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const vaultOpen = mounted && isVaultUnlocked;
  const activePass = mounted ? waitlistPass : null;
  const safeCartCount = mounted ? cartCount : 0;
  const activeUser = mounted ? user : null;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 border-b border-champagne/80 bg-plaster/88 backdrop-blur-lg transition-all duration-500",
          scrolled ? "py-3.5" : "py-5"
        )}
      >
        <div className="mx-auto flex max-w-[1380px] items-center justify-between px-6 sm:px-10 lg:px-14">
          {/* Left: Museum Wordmark */}
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => scrollToSection("#aperture")}
            className="group flex items-center gap-3 text-left focus:outline-none"
            aria-label="KNITX Exhibition Home"
          >
            <span className="font-sans text-xs font-semibold tracking-[0.42em] text-umber transition-colors duration-300 group-hover:text-terracotta">
              K N I T X
            </span>
            <span className="hidden h-3 w-px bg-champagne sm:inline-block" />
            <span className="hidden font-mono text-[10px] tracking-[0.2em] text-muted uppercase sm:inline-block">
              Gallery 01
            </span>
          </button>

          {/* Center: Minimalist Hairline Links */}
          <nav
            aria-label="Exhibition Sections"
            className="hidden items-center gap-8 lg:flex xl:gap-10"
          >
            {NAV_LINKS.map((item) => (
              <button
                key={item.href}
                type="button"
                suppressHydrationWarning
                onClick={() => scrollToSection(item.href)}
                className="group relative py-1 font-sans text-[11px] font-medium tracking-[0.22em] text-muted uppercase transition-colors duration-300 hover:text-umber focus:outline-none"
              >
                <span>{item.label}</span>
                <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-terracotta transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </button>
            ))}
          </nav>

          {/* Right: Vault Status, Quiet Bag, Account */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Mounted-Safe Vault Status */}
            <button
              type="button"
              suppressHydrationWarning
              onClick={() =>
                scrollToSection(vaultOpen ? "#curtain-gallery" : "#envelope")
              }
              className="hidden items-center gap-2 font-sans text-[11px] tracking-[0.2em] uppercase transition-colors duration-300 hover:opacity-80 sm:inline-flex"
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors duration-500",
                  vaultOpen
                    ? "bg-terracotta"
                    : activePass
                      ? "bg-umber"
                      : "bg-muted/60"
                )}
              />
              <span
                className={cn(
                  vaultOpen ? "text-terracotta font-medium" : "text-muted"
                )}
              >
                {vaultOpen
                  ? "Private Vault Open"
                  : activePass
                    ? `Waitlist #${String(activePass.position).padStart(3, "0")}`
                    : "Waitlist"}
              </span>
            </button>

            <span className="hidden h-3 w-px bg-champagne sm:inline-block" />

            {/* Quiet Bag Trigger */}
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setCartOpen(true)}
              className="font-sans text-[11px] font-medium tracking-[0.2em] text-umber uppercase transition-colors duration-300 hover:text-terracotta focus:outline-none"
            >
              Bag ({safeCartCount})
            </button>

            {/* Sign In / Collector Monogram */}
            <div className="relative">
              {activeUser ? (
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setAccountOpen((prev) => !prev)}
                  aria-expanded={accountOpen}
                  aria-label="Collector account"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-champagne bg-travertine/70 font-sans text-[10px] font-medium tracking-[0.14em] text-umber transition-colors duration-300 hover:border-umber hover:bg-umber hover:text-plaster focus:outline-none"
                >
                  {getUserInitials(activeUser.displayName, activeUser.email)}
                </button>
              ) : (
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setAuthModalOpen(true)}
                  className="border-b border-transparent pb-0.5 font-sans text-[11px] font-medium tracking-[0.2em] text-umber uppercase transition-all duration-300 hover:border-terracotta hover:text-terracotta focus:outline-none"
                >
                  Sign In
                </button>
              )}

              <AnimatePresence>
                {accountOpen && activeUser && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 mt-3 w-60 border border-champagne bg-plaster p-5 shadow-[0_18px_50px_-24px_rgba(28,25,23,0.22)]"
                  >
                    <p className="font-mono text-[10px] tracking-[0.2em] text-terracotta uppercase">
                      Collector Profile
                    </p>
                    <p className="mt-1.5 truncate font-editorial text-xl text-umber">
                      {activeUser.displayName}
                    </p>
                    <p className="truncate font-sans text-xs text-muted">
                      {activeUser.email}
                    </p>
                    <div className="my-4 h-px bg-champagne" />
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => {
                        setAccountOpen(false);
                        void logout();
                      }}
                      className="w-full text-left font-sans text-[11px] tracking-[0.2em] text-muted uppercase transition-colors hover:text-terracotta"
                    >
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Drawer Toggle */}
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="inline-flex h-8 w-8 items-center justify-center text-umber transition-colors hover:text-terracotta lg:hidden"
            >
              {mobileOpen ? (
                <X className="h-4 w-4 stroke-[1.5]" />
              ) : (
                <Menu className="h-4 w-4 stroke-[1.5]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Gallery Navigation Sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-[57px] z-30 border-b border-champagne bg-plaster/96 px-6 py-8 backdrop-blur-xl lg:hidden"
          >
            <div className="mx-auto flex max-w-md flex-col gap-5">
              <div className="flex items-center justify-between border-b border-champagne pb-4">
                <span className="font-mono text-[10px] tracking-[0.22em] text-muted uppercase">
                  Status
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-2 font-sans text-[11px] tracking-[0.2em] uppercase",
                    vaultOpen ? "text-terracotta" : "text-muted"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      vaultOpen ? "bg-terracotta" : "bg-muted/60"
                    )}
                  />
                  {vaultOpen ? "Private Vault Open" : "Waitlist"}
                </span>
              </div>

              {NAV_LINKS.map((item, idx) => (
                <button
                  key={item.href}
                  type="button"
                  suppressHydrationWarning
                  onClick={() => scrollToSection(item.href)}
                  className="flex items-baseline justify-between py-1 text-left"
                >
                  <span className="font-editorial text-3xl text-umber">
                    {item.label}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.2em] text-muted">
                    0{idx + 1}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
