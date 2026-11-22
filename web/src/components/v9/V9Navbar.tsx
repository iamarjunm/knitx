"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVault } from "@/context/VaultContext";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Drop 01", href: "#v9-hero" },
  { label: "Collection", href: "#v9-gallery" },
  { label: "Waitlist", href: "#v9-envelope" },
  { label: "Community & Craft", href: "#v9-folio" },
] as const;

function getFirstName(displayName?: string, email?: string): string {
  const source = (displayName || "").trim();
  if (source) {
    return source.split(/\s+/)[0] || "Collector";
  }
  if (email) {
    return email.split("@")[0] || "Collector";
  }
  return "Collector";
}

export default function V9Navbar() {
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
      setScrolled(window.scrollY > 20);
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
          "fixed inset-x-0 top-0 z-40 border-b border-champagne/80 bg-white/90 backdrop-blur-lg transition-all duration-300",
          scrolled ? "py-3" : "py-4"
        )}
      >
        <div className="mx-auto flex max-w-[1380px] items-center justify-between px-5 sm:px-10 lg:px-14">
          {/* Left: Bold Anton Wordmark + Drop 01 Marker */}
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => scrollToSection("#v9-hero")}
            className="group flex items-center gap-3 text-left focus:outline-none"
            aria-label="KNITX Drop 01 Home"
          >
            <span className="font-poster text-2xl leading-none tracking-wide text-[#121110] uppercase transition-colors duration-300 group-hover:text-[#D9381E]">
              KNITX
            </span>
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D9381E]" />
              <span className="font-mono text-[10px] tracking-[0.22em] text-[#736E66] uppercase">
                DROP 01
              </span>
            </span>
          </button>

          {/* Center: 4 Whisper-Clean Gallery Links */}
          <nav
            aria-label="Primary Sections"
            className="hidden items-center gap-9 lg:flex"
          >
            {NAV_LINKS.map((item) => (
              <button
                key={item.href}
                type="button"
                suppressHydrationWarning
                onClick={() => scrollToSection(item.href)}
                className="group relative py-1 font-sans text-xs font-medium tracking-[0.14em] text-[#736E66] uppercase transition-colors duration-300 hover:text-[#121110] focus:outline-none"
              >
                <span>{item.label}</span>
                <span className="absolute inset-x-0 -bottom-0.5 h-[1.5px] origin-left scale-x-0 bg-[#D9381E] transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </button>
            ))}
          </nav>

          {/* Right: Quiet Status, Bag, Sign In / User */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Mounted-Safe Vault Status */}
            <button
              type="button"
              suppressHydrationWarning
              onClick={() =>
                scrollToSection(vaultOpen ? "#v9-gallery" : "#v9-envelope")
              }
              className="hidden items-center gap-2 font-sans text-[11px] font-medium tracking-[0.16em] uppercase transition-opacity duration-300 hover:opacity-75 sm:inline-flex focus:outline-none"
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors duration-500",
                  vaultOpen
                    ? "bg-[#D9381E]"
                    : activePass
                      ? "bg-[#121110]"
                      : "bg-[#736E66]/60"
                )}
              />
              <span
                className={cn(
                  vaultOpen ? "text-[#D9381E]" : "text-[#736E66]"
                )}
              >
                {vaultOpen
                  ? "Vault Open"
                  : activePass
                    ? `Waitlist #${String(activePass.position).padStart(3, "0")}`
                    : "Waitlist"}
              </span>
            </button>

            <span className="hidden h-3.5 w-px bg-champagne sm:inline-block" />

            {/* Bag Button */}
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setCartOpen(true)}
              className="font-sans text-[11px] font-medium tracking-[0.16em] text-[#121110] uppercase transition-colors duration-300 hover:text-[#D9381E] focus:outline-none"
            >
              Bag ({safeCartCount})
            </button>

            {/* Sign In / Collector First Name */}
            <div className="relative">
              {activeUser ? (
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setAccountOpen((prev) => !prev)}
                  aria-expanded={accountOpen}
                  className="inline-flex items-center gap-2 rounded-full border border-champagne bg-travertine/70 px-3.5 py-1.5 font-sans text-[11px] font-medium tracking-[0.12em] text-[#121110] uppercase transition-colors duration-300 hover:border-[#121110] focus:outline-none"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D9381E]" />
                  <span>
                    {getFirstName(activeUser.displayName, activeUser.email)}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setAuthModalOpen(true)}
                  className="border-b border-transparent pb-0.5 font-sans text-[11px] font-medium tracking-[0.16em] text-[#121110] uppercase transition-all duration-300 hover:border-[#D9381E] hover:text-[#D9381E] focus:outline-none"
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
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 mt-3 w-60 rounded-xl border border-champagne bg-white p-5 shadow-[0_20px_50px_-24px_rgba(18,17,16,0.18)]"
                  >
                    <p className="font-mono text-[10px] tracking-[0.2em] text-[#D9381E] uppercase">
                      Collector Pass
                    </p>
                    <p className="mt-1.5 truncate font-poster text-xl tracking-wide text-[#121110] uppercase">
                      {activeUser.displayName}
                    </p>
                    <p className="truncate font-sans text-xs text-[#736E66]">
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
                      className="w-full text-left font-sans text-[11px] font-medium tracking-[0.16em] text-[#736E66] uppercase transition-colors hover:text-[#D9381E] focus:outline-none"
                    >
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              className="inline-flex h-8 w-8 items-center justify-center text-[#121110] transition-colors hover:text-[#D9381E] focus:outline-none lg:hidden"
            >
              {mobileOpen ? (
                <X className="h-4 w-4 stroke-[1.75]" />
              ) : (
                <Menu className="h-4 w-4 stroke-[1.75]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Gallery Sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-[53px] z-30 border-b border-champagne bg-white/96 px-6 py-7 backdrop-blur-xl lg:hidden"
          >
            <div className="mx-auto flex max-w-md flex-col gap-5">
              <div className="flex items-center justify-between border-b border-champagne pb-4">
                <span className="font-mono text-[10px] tracking-[0.22em] text-[#736E66] uppercase">
                  Status
                </span>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() =>
                    scrollToSection(vaultOpen ? "#v9-gallery" : "#v9-envelope")
                  }
                  className={cn(
                    "inline-flex items-center gap-2 font-sans text-[11px] font-medium tracking-[0.16em] uppercase",
                    vaultOpen ? "text-[#D9381E]" : "text-[#736E66]"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      vaultOpen ? "bg-[#D9381E]" : "bg-[#736E66]/60"
                    )}
                  />
                  <span>{vaultOpen ? "Vault Open" : "Waitlist"}</span>
                </button>
              </div>

              {NAV_LINKS.map((item, idx) => (
                <button
                  key={item.href}
                  type="button"
                  suppressHydrationWarning
                  onClick={() => scrollToSection(item.href)}
                  className="flex items-baseline justify-between py-1 text-left focus:outline-none"
                >
                  <span className="font-poster text-3xl tracking-wide text-[#121110] uppercase">
                    {item.label}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#736E66]">
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
