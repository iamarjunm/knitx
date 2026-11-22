"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

type ActiveVersion = "v1" | "v2" | "v3" | "v4" | "v5" | "v6" | "v7";

const VERSIONS: {
  id: ActiveVersion;
  href: string;
  label: string;
  title: string;
  activeBg: string;
  activeText: string;
}[] = [
  { id: "v1", href: "/", label: "V1", title: "V1 Poster", activeBg: "bg-ink", activeText: "text-white" },
  { id: "v2", href: "/v2", label: "V2", title: "V2 Studio", activeBg: "bg-klein", activeText: "text-white" },
  { id: "v3", href: "/v3", label: "V3", title: "V3 Vault OS", activeBg: "bg-hunter", activeText: "text-chartreuse" },
  { id: "v4", href: "/v4", label: "V4", title: "V4 Zine", activeBg: "bg-riso", activeText: "text-white" },
  { id: "v5", href: "/v5", label: "V5", title: "V5 Gallery", activeBg: "bg-terracotta", activeText: "text-white" },
  { id: "v6", href: "/v6", label: "V6", title: "V6 Swiss Clean", activeBg: "bg-[#1A4BFF]", activeText: "text-white" },
  { id: "v7", href: "/v7", label: "V7", title: "V7 Warm Atelier", activeBg: "bg-[#254336]", activeText: "text-white" },
];

export default function VersionSwitcher() {
  const pathname = usePathname();
  const activeVersion: ActiveVersion = pathname.startsWith("/v7")
    ? "v7"
    : pathname.startsWith("/v6")
      ? "v6"
      : pathname.startsWith("/v5")
        ? "v5"
        : pathname.startsWith("/v4")
          ? "v4"
          : pathname.startsWith("/v3")
            ? "v3"
            : pathname.startsWith("/v2")
              ? "v2"
              : "v1";

  return (
    <div className="fixed bottom-4 left-3 z-50 sm:bottom-5 sm:left-5">
      <div className="flex items-center gap-0.5 rounded-full border border-ink/12 bg-white/94 p-1 shadow-[0_8px_28px_rgba(0,0,0,0.08)] backdrop-blur-md">
        <span className="hidden items-center gap-1 pl-2.5 pr-1 font-mono text-[9px] font-bold tracking-[0.16em] text-muted uppercase sm:inline-flex">
          <Layers className="h-3 w-3" />
          UI
        </span>

        {VERSIONS.map((v) => {
          const isActive = activeVersion === v.id;
          return (
            <Link
              key={v.id}
              href={v.href}
              title={v.title}
              className={cn(
                "relative rounded-full px-2.5 py-1.5 font-mono text-[10px] font-bold tracking-[0.08em] uppercase transition-colors",
                isActive ? v.activeText : "text-ink/65 hover:text-ink"
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
