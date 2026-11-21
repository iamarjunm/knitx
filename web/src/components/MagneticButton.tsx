"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

type ButtonVariant = "volt" | "crimson" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface MagneticButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  strength?: number;
  fullWidth?: boolean;
  ariaLabel?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  volt: "bg-volt text-obsidian border border-volt hover:bg-[#e5ff4d] shadow-[0_0_28px_rgba(217,255,0,0.22)] hover:shadow-[0_0_40px_rgba(217,255,0,0.42)]",
  crimson:
    "bg-crimson text-bone border border-crimson hover:bg-[#ff4242] shadow-[0_0_24px_rgba(255,42,42,0.25)] hover:shadow-[0_0_38px_rgba(255,42,42,0.42)]",
  outline:
    "bg-obsidian/60 text-bone border border-bone/25 hover:border-volt hover:text-volt hover:bg-volt/[0.06]",
  ghost:
    "bg-concrete text-bone border border-bone/12 hover:bg-steel hover:border-bone/30",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-[11px] tracking-[0.18em]",
  md: "px-6 py-3.5 text-xs tracking-[0.2em]",
  lg: "px-8 py-4 text-xs sm:text-sm tracking-[0.22em]",
};

export default function MagneticButton({
  children,
  variant = "volt",
  size = "md",
  href,
  onClick,
  type = "button",
  disabled = false,
  className,
  strength = 0.28,
  fullWidth = false,
  ariaLabel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 280, damping: 20, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 280, damping: 20, mass: 0.4 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - (rect.left + rect.width / 2);
    const offsetY = e.clientY - (rect.top + rect.height / 2);
    x.set(offsetX * strength);
    y.set(offsetY * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const sharedClasses = cn(
    "group relative inline-flex items-center justify-center gap-2.5 overflow-hidden font-mono font-bold uppercase transition-colors duration-200 select-none cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian",
    disabled && "pointer-events-none opacity-45",
    fullWidth && "w-full",
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  const innerContent = (
    <>
      {/* Subtle diagonal shimmer on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
      />
      {/* Corner Reticle Micro-Ticks */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0.5 left-0.5 h-1.5 w-1.5 border-t border-l border-current opacity-50 transition-opacity group-hover:opacity-100"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-0.5 bottom-0.5 h-1.5 w-1.5 border-r border-b border-current opacity-50 transition-opacity group-hover:opacity-100"
      />
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </>
  );

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={cn(fullWidth ? "block w-full" : "inline-block")}
    >
      {href ? (
        <Link
          href={href}
          onClick={onClick}
          aria-label={ariaLabel}
          className={sharedClasses}
        >
          {innerContent}
        </Link>
      ) : (
        <button
          type={type}
          onClick={onClick}
          disabled={disabled}
          aria-label={ariaLabel}
          className={sharedClasses}
        >
          {innerContent}
        </button>
      )}
    </motion.div>
  );
}
