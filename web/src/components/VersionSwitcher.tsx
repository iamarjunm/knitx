"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VersionSwitcher() {
  const pathname = usePathname();
  const isV2 = pathname.startsWith("/v2");

  return (
    <div className="fixed bottom-20 left-4 z-50 sm:bottom-5 sm:left-6">
      <div
        className={cn(
          "flex items-center gap-1 rounded-full border bg-white/92 p-1 shadow-lg backdrop-blur-md",
          isV2 ? "border-ink/15" : "border-2 border-ink stamp-shadow-sm"
        )}
      >
        <span className="hidden items-center gap-1.5 pl-2.5 pr-1 font-mono text-[9px] font-bold tracking-[0.18em] text-muted uppercase md:inline-flex">
          <Layers className="h-3 w-3" />
          UI
        </span>

        <Link
          href="/"
          className={cn(
            "relative rounded-full px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.14em] uppercase transition-colors",
            !isV2 ? "text-white" : "text-ink/70 hover:text-ink"
          )}
        >
          {!isV2 && (
            <motion.span
              layoutId="knitx-ui-version-pill"
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
              className="absolute inset-0 rounded-full bg-ink"
            />
          )}
          <span className="relative z-10">V1 POSTER</span>
        </Link>

        <Link
          href="/v2"
          className={cn(
            "relative rounded-full px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.14em] uppercase transition-colors",
            isV2 ? "text-white" : "text-ink/70 hover:text-klein"
          )}
        >
          {isV2 && (
            <motion.span
              layoutId="knitx-ui-version-pill"
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
              className="absolute inset-0 rounded-full bg-klein"
            />
          )}
          <span className="relative z-10">V2 STUDIO</span>
        </Link>
      </div>
    </div>
  );
}
