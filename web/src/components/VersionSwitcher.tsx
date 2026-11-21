"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

type ActiveVersion = "v1" | "v2" | "v3";

const VERSIONS: { id: ActiveVersion; href: string; label: string; activeBg: string; activeText: string }[] = [
  { id: "v1", href: "/", label: "V1 POSTER", activeBg: "bg-ink", activeText: "text-white" },
  { id: "v2", href: "/v2", label: "V2 STUDIO", activeBg: "bg-klein", activeText: "text-white" },
  { id: "v3", href: "/v3", label: "V3 VAULT OS", activeBg: "bg-hunter", activeText: "text-chartreuse" },
];

export default function VersionSwitcher() {
  const pathname = usePathname();
  const activeVersion: ActiveVersion = pathname.startsWith("/v3")
    ? "v3"
    : pathname.startsWith("/v2")
      ? "v2"
      : "v1";

  return (
    <div className="fixed bottom-20 left-4 z-50 sm:bottom-5 sm:left-6">
      <div
        className={cn(
          "flex items-center gap-1 rounded-full border bg-white/94 p-1 shadow-lg backdrop-blur-md",
          activeVersion === "v1"
            ? "border-2 border-ink stamp-shadow-sm"
            : activeVersion === "v3"
              ? "border-hunter/25"
              : "border-ink/15"
        )}
      >
        <span className="hidden items-center gap-1.5 pl-2.5 pr-1 font-mono text-[9px] font-bold tracking-[0.18em] text-muted uppercase md:inline-flex">
          <Layers className="h-3 w-3" />
          UI
        </span>

        {VERSIONS.map((v) => {
          const isActive = activeVersion === v.id;
          return (
            <Link
              key={v.id}
              href={v.href}
              className={cn(
                "relative rounded-full px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.12em] uppercase transition-colors",
                isActive ? v.activeText : "text-ink/70 hover:text-ink"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="knitx-ui-version-pill"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  className={cn("absolute inset-0 rounded-full", v.activeBg)}
                />
              )}
              <span className="relative z-10">{v.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
