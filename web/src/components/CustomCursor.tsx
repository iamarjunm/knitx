"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [cursorLabel, setCursorLabel] = useState<string | null>(null);

  const rawX = useMotionValue(-100);
  const rawY = useMotionValue(-100);

  const ringX = useSpring(rawX, { stiffness: 320, damping: 28, mass: 0.45 });
  const ringY = useSpring(rawY, { stiffness: 320, damping: 28, mass: 0.45 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!finePointer || reducedMotion) return;
    setEnabled(true);

    const interactiveSelector =
      'a, button, [role="button"], input, select, textarea, [data-cursor="expand"]';

    const handleMove = (event: MouseEvent) => {
      rawX.set(event.clientX);
      rawY.set(event.clientY);
      if (!visible) setVisible(true);

      const target = event.target as HTMLElement | null;
      const interactive = target?.closest(interactiveSelector) as
        | HTMLElement
        | null;

      if (interactive) {
        setIsHovering(true);
        const label = interactive.getAttribute("data-cursor-text");
        setCursorLabel(label);
      } else {
        setIsHovering(false);
        setCursorLabel(null);
      }
    };

    const handleLeave = () => setVisible(false);
    const handleEnter = () => setVisible(true);
    const handleDown = () => setIsPressed(true);
    const handleUp = () => setIsPressed(false);

    window.addEventListener("mousemove", handleMove, { passive: true });
    document.addEventListener("mouseleave", handleLeave);
    document.addEventListener("mouseenter", handleEnter);
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
      document.removeEventListener("mouseenter", handleEnter);
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [rawX, rawY, visible]);

  if (!enabled) return null;

  const ringSize = cursorLabel ? 68 : isHovering ? 46 : 26;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] hidden lg:block"
    >
      {/* Spring Outer Ring */}
      <motion.div
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: ringSize,
          height: ringSize,
          opacity: visible ? 1 : 0,
          scale: isPressed ? 0.84 : 1,
          borderColor: isHovering
            ? "rgba(217, 255, 0, 0.95)"
            : "rgba(242, 239, 233, 0.42)",
          backgroundColor: cursorLabel
            ? "rgba(217, 255, 0, 0.14)"
            : isHovering
              ? "rgba(217, 255, 0, 0.06)"
              : "transparent",
        }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="fixed top-0 left-0 flex items-center justify-center rounded-full border backdrop-blur-[1px]"
      >
        {cursorLabel && (
          <span className="font-mono text-[9px] font-bold tracking-[0.18em] text-volt uppercase">
            {cursorLabel}
          </span>
        )}
      </motion.div>

      {/* Center Reticle Dot */}
      <motion.div
        style={{
          x: rawX,
          y: rawY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          opacity: visible && !cursorLabel ? 1 : 0,
          scale: isPressed ? 1.8 : isHovering ? 0.5 : 1,
          backgroundColor: isHovering ? "#D9FF00" : "#F2EFE9",
        }}
        transition={{ duration: 0.12 }}
        className="fixed top-0 left-0 h-1.5 w-1.5 rounded-full"
      />
    </div>
  );
}
