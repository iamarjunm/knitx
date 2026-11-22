"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

type ActiveVersion = "v1" | "v2" | "v3" | "v4" | "v5";

const VERSIONS: {
  id: ActiveVersion;
  href: string;
  label: string;
  short: string;
  activeBg: string;
  activeText: string;
}[] = [
  { id: "v1", href: "/", label: "V1 POSTER", short: "V1", activeBg: "bg-ink", activeText: "text-white" },
  { id: "v2", href: "/v2", label: "V2 STUDIO", short: "V2", activeBg: "bg-klein", activeText: "text-white" },
  { id: "v3", href: "/v3", label: "V3 VAULT OS", short: "V3", activeBg: "bg-hunter", activeText: "text-chartreuse" },
  { id: "v4", href: "/v4", label: "V4 ZINE", short: "V4", activeBg: "bg-riso", activeText: "text-white" },
  { id: "v5", href: "/v5", label: "V5 GALLERY", short: "V5", activeBg: "bg-terracotta", activeText: "text-white" },
];

export default function VersionSwitcher() {
  const pathname = usePathname();
  const activeVersion: ActiveVersion = pathname.startsWith("/v5")
    ? "v5"
    : pathname.startsWith("/v4")
      ? "v4"
      : pathname.startsWith("/v3")
        ? "v3"
        : pathname.startsWith("/v2")
          ? "v2"
          : "v1";

  return (
    <div className="fixed bottom-20 left-3 z-50 sm:bottom-5 sm:left-5">
      <div
        className={cn(
          "flex items-center gap-0.5 rounded-full border bg-white/95 p-1 shadow-lg backdrop-blur-md",
          activeVersion === "v1"
            ? "border-2 border-ink stamp-shadow-sm"
            : activeVersion === "v4"
              ? "border-2 border-ink"
              : "border-ink/15"
        )}
      >
        <span className="hidden items-center gap-1.5 pl-2.5 pr-1 font-mono text-[9px] font-bold tracking-[0.18em] text-muted uppercase lg:inline-flex">
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
                "relative rounded-full px-2.5 py-1.5 font-mono text-[10px] font-bold tracking-[0.1em] uppercase transition-colors sm:px-3",
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
              <span className="relative z-10 sm:hidden">{v.short}</span>
              <span className="relative z-10 hidden sm:inline">{v.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
