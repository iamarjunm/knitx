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
        err instanceof Error ? err.message : "Authentication could not be completed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoPass = () => {
    setError(null);
    signInDemo(name.trim() || "Aarav Mehta", email.trim() || "collector@knitx.in");
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
            transition={{ duration: 0.22 }}
            onClick={() => setAuthModalOpen(false)}
            className="absolute inset-0 bg-ink/35 backdrop-blur-xs"
          />

          {/* Gallery Modal */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md border-2 border-ink bg-surface p-7 stamp-shadow sm:p-9"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
                  KNITX · Collector Account
                </p>
                <h2 className="mt-2 font-serif text-3xl leading-none text-ink">
                  {mode === "signin" ? "Welcome back." : "Join the House."}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                aria-label="Close sign in dialog"
                className="flex h-8 w-8 cursor-pointer items-center justify-center text-muted transition-colors hover:text-ink"
              >
                <X className="h-4 w-4 stroke-[1.5]" />
              </button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted">
              Sign in to sync your Drop 01 waitlist position, cast community
              ballot votes, and submit garment concepts for Drop 02.
            </p>

            {/* Google Sign-In */}
            <button
              type="button"
              disabled={submitting}
              onClick={handleGoogle}
              className="mt-6 flex w-full cursor-pointer items-center justify-center gap-3 border border-hairline bg-paper/60 px-4 py-3 text-xs font-medium tracking-[0.04em] text-ink transition-colors hover:border-ink hover:bg-paper disabled:opacity-50"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
              >
                <path
                  fill="#111111"
                  d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.48-1.7 4.35-5.27 4.35-3.17 0-5.76-2.63-5.76-5.87s2.59-5.87 5.76-5.87c1.81 0 3.02.77 3.71 1.43l2.53-2.44C16.78 4.1 14.69 3.2 12.17 3.2 7.03 3.2 2.87 7.36 2.87 12.5s4.16 9.3 9.3 9.3c5.37 0 8.93-3.77 8.93-9.08 0-.61-.07-1.08-.15-1.62z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-hairline" />
              <span className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
                or email
              </span>
              <div className="h-px flex-1 bg-hairline" />
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-hairline">
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
                    onClick={() => {
                      setMode(tab.id);
                      setError(null);
                    }}
                    className={cn(
                      "relative cursor-pointer pb-3 text-xs font-medium tracking-[0.06em] transition-colors",
                      active ? "text-ink" : "text-muted hover:text-ink"
                    )}
                  >
                    {tab.label}
                    {active && (
                      <motion.span
                        layoutId="knitx-auth-tab-underline"
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 -bottom-px left-0 h-[1.5px] bg-ink"
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
                  <label className="block font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aarav Mehta"
                    required
                    className="mt-1.5 w-full border border-hairline bg-paper/50 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/50 focus:border-ink focus:bg-surface focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  required
                  className="mt-1.5 w-full border border-hairline bg-paper/50 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/50 focus:border-ink focus:bg-surface focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="mt-1.5 w-full border border-hairline bg-paper/50 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/50 focus:border-ink focus:bg-surface focus:outline-none"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 border border-vermilion/30 bg-vermilion/5 p-3 text-xs text-vermilion">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full cursor-pointer items-center justify-center gap-2 bg-ink py-3.5 text-xs font-medium tracking-[0.14em] text-paper uppercase transition-opacity hover:opacity-88 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>
                  {mode === "signin" ? "Sign In" : "Create Collector Account"}
                </span>
              </button>
            </form>

            {/* Discreet Local Preview Pass */}
            <div className="mt-6 border-t border-hairline pt-5 text-center">
              <button
                type="button"
                onClick={handleDemoPass}
                className="cursor-pointer font-mono text-[11px] tracking-[0.1em] text-muted underline decoration-hairline underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
              >
                Continue with Demo Pass
              </button>
              {!isConfigured && (
                <p className="mt-1.5 font-mono text-[10px] text-muted/80">
                  Local preview mode active — instant collector session.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
