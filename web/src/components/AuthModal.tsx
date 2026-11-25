"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Loader2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "signup";

export default function AuthModal() {
  const {
    authModalOpen,
    setAuthModalOpen,
    isConfigured,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInDemo,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authModalOpen) return;
    setError(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAuthModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [authModalOpen, setAuthModalOpen]);

  const handleGoogle = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Google sign-in could not be completed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both your email address and password.");
      return;
    }

    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(name.trim(), email.trim(), password);
      }
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication could not be completed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoPass = () => {
    setError(null);
    signInDemo(
      name.trim() || "Aarav Mehta",
      email.trim() || "collector@knitx.in"
    );
  };

  return (
    <AnimatePresence>
      {authModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Collector Sign In"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            onClick={() => setAuthModalOpen(false)}
            className="absolute inset-0 bg-[#111110]/45 backdrop-blur-[3px]"
          />

          {/* Flagship Limestone & Ivory Modal */}
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#DDD7CB] bg-[#FFFFFF] p-6 text-[#111110] shadow-[0_32px_90px_-30px_rgba(17,17,16,0.32)] sm:p-9"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] tracking-[0.22em] text-[#9A7B4F] uppercase">
                  KNITX · Collector Ledger
                </p>
                <h2 className="mt-2 font-poster text-4xl leading-none tracking-[0.02em] text-[#111110] uppercase">
                  {mode === "signin" ? "WELCOME BACK." : "JOIN KNITX."}
                </h2>
              </div>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setAuthModalOpen(false)}
                aria-label="Close sign in dialog"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#DDD7CB] text-[#6A655D] transition-colors hover:border-[#111110] hover:text-[#111110]"
              >
                <X className="h-4 w-4 stroke-[1.75]" />
              </button>
            </div>

            <p className="mt-3 font-sans text-xs leading-relaxed text-[#6A655D]">
              Sign in to sync your waitlist position, vote on upcoming releases,
              and submit original garment concepts.
            </p>

            {/* Google Sign-In */}
            <button
              type="button"
              suppressHydrationWarning
              disabled={submitting}
              onClick={handleGoogle}
              className="mt-6 flex w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-[#DDD7CB] bg-[#F7F5F0] px-4 py-3 text-xs font-medium tracking-[0.06em] text-[#111110] transition-colors hover:border-[#111110] hover:bg-[#FFFFFF] disabled:opacity-50"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                <path
                  fill="#111110"
                  d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.48-1.7 4.35-5.27 4.35-3.17 0-5.76-2.63-5.76-5.87s2.59-5.87 5.76-5.87c1.81 0 3.02.77 3.71 1.43l2.53-2.44C16.78 4.1 14.69 3.2 12.17 3.2 7.03 3.2 2.87 7.36 2.87 12.5s4.16 9.3 9.3 9.3c5.37 0 8.93-3.77 8.93-9.08 0-.61-.07-1.08-.15-1.62z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#DDD7CB]" />
              <span className="font-mono text-[10px] tracking-[0.18em] text-[#6A655D] uppercase">
                or email
              </span>
              <div className="h-px flex-1 bg-[#DDD7CB]" />
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-[#DDD7CB]">
              {(
                [
                  { id: "signin", label: "Sign In" },
                  { id: "signup", label: "Create Account" },
                ] as const
              ).map((tab) => {
                const active = mode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    suppressHydrationWarning
                    onClick={() => {
                      setMode(tab.id);
                      setError(null);
                    }}
                    className={cn(
                      "relative cursor-pointer pb-3 font-sans text-xs font-medium tracking-[0.08em] uppercase transition-colors",
                      active
                        ? "text-[#111110]"
                        : "text-[#6A655D] hover:text-[#111110]"
                    )}
                  >
                    {tab.label}
                    {active && (
                      <motion.span
                        layoutId="knitx-auth-tab-underline"
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 -bottom-px left-0 h-[1.5px] bg-[#8E1C1C]"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="mt-5 space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block font-mono text-[10px] tracking-[0.18em] text-[#6A655D] uppercase">
                    Full Name
                  </label>
                  <input
                    type="text"
                    suppressHydrationWarning
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aarav Mehta"
                    required
                    className="mt-1.5 w-full rounded-xl border border-[#DDD7CB] bg-[#F7F5F0] px-4 py-3 text-base text-[#111110] placeholder:text-[#6A655D]/60 focus:border-[#111110] focus:bg-[#FFFFFF] focus:outline-none sm:py-2.5 sm:text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block font-mono text-[10px] tracking-[0.18em] text-[#6A655D] uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  suppressHydrationWarning
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  required
                  className="mt-1.5 w-full rounded-xl border border-[#DDD7CB] bg-[#F7F5F0] px-4 py-3 text-base text-[#111110] placeholder:text-[#6A655D]/60 focus:border-[#111110] focus:bg-[#FFFFFF] focus:outline-none sm:py-2.5 sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] tracking-[0.18em] text-[#6A655D] uppercase">
                  Password
                </label>
                <input
                  type="password"
                  suppressHydrationWarning
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="mt-1.5 w-full rounded-xl border border-[#DDD7CB] bg-[#F7F5F0] px-4 py-3 text-base text-[#111110] placeholder:text-[#6A655D]/60 focus:border-[#111110] focus:bg-[#FFFFFF] focus:outline-none sm:py-2.5 sm:text-sm"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-[#8E1C1C]/30 bg-[#8E1C1C]/5 p-3 text-xs text-[#8E1C1C]">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                suppressHydrationWarning
                disabled={submitting}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#111110] py-3.5 font-sans text-xs font-medium tracking-[0.16em] text-[#F7F5F0] uppercase transition-colors hover:bg-[#8E1C1C] disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>
                  {mode === "signin" ? "Sign In" : "Create Collector Account"}
                </span>
              </button>
            </form>

            {/* Discreet Local Preview Pass */}
            <div className="mt-6 border-t border-[#DDD7CB] pt-5 text-center">
              <button
                type="button"
                suppressHydrationWarning
                onClick={handleDemoPass}
                className="cursor-pointer font-mono text-[11px] tracking-[0.12em] text-[#8E1C1C] underline decoration-[#8E1C1C]/40 underline-offset-4 transition-colors hover:text-[#111110] hover:decoration-[#111110]"
              >
                Continue with Demo Pass
              </button>
              {!isConfigured && (
                <p className="mt-1.5 font-mono text-[10px] text-[#6A655D]">
                  Instant collector session for previewing all flows.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
