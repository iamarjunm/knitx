"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const GLYPHS = "KX019#/_-[]<>▓▒";

interface ScrambleTextProps {
  text: string;
  className?: string;
  triggerOnMount?: boolean;
  triggerOnHover?: boolean;
  speed?: number;
  as?: "span" | "h1" | "h2" | "h3" | "p" | "div";
}

export default function ScrambleText({
  text,
  className,
  triggerOnMount = true,
  triggerOnHover = true,
  speed = 28,
  as: Tag = "span",
}: ScrambleTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const frameRef = useRef<number | null>(null);
  const lastStepRef = useRef<number>(0);

  const runScramble = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    let iteration = 0;
    lastStepRef.current = 0;

    const step = (timestamp: number) => {
      if (timestamp - lastStepRef.current >= speed) {
        lastStepRef.current = timestamp;

        const next = text
          .split("")
          .map((char, idx) => {
            if (char === " " || char === "/" || char === "\n") return char;
            if (idx < iteration) return text[idx];
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join("");

        setDisplayText(next);
        iteration += 0.55;
      }

      if (iteration < text.length) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        setDisplayText(text);
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(step);
  }, [text, speed]);

  useEffect(() => {
    setDisplayText(text);
    if (triggerOnMount) {
      runScramble();
    }
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [text, triggerOnMount, runScramble]);

  return (
    <Tag
      onMouseEnter={triggerOnHover ? runScramble : undefined}
      className={cn("inline-block", className)}
    >
      {displayText}
    </Tag>
  );
}
