"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Shared easing curve — same cubic-bezier as Cursor.tsx / CommandPalette.tsx /
// SplitText.tsx (registered there as a GSAP CustomEase with the same control
// points). Reused here rather than introducing a fourth motion language.
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export interface DigitFlipProps {
  value: number;
  className?: string;
  /** Left-pads the digit string to this length (e.g. `007`). Default 1 (no padding). */
  minDigits?: number;
  padChar?: string;
  /** Rendered outside the animated digit slots, e.g. prefix="+" / suffix="%". */
  prefix?: string;
  suffix?: string;
}

/**
 * Animates a numeric value change with a flip/settle transition, one slot
 * per digit. Uses `font-mono` (JetBrains Mono, wired up in layout.tsx) with a
 * fixed-width slot per digit so changing digit counts don't jitter neighbors.
 *
 * Note: `minDigits`/`padStart` assumes non-negative integers (e.g. commit
 * counts, streak days) — negative values aren't specifically handled since
 * none of the Gallery's planned stat tiles are signed.
 */
export default function DigitFlip({ value, className, minDigits = 1, padChar = "0", prefix, suffix }: DigitFlipProps) {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReduced(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  const digits = Math.round(value).toString().padStart(minDigits, padChar).split("");
  const fullText = `${prefix ?? ""}${digits.join("")}${suffix ?? ""}`;

  return (
    <span className={`inline-flex items-baseline font-mono tabular-nums ${className ?? ""}`} aria-label={fullText}>
      {prefix}
      {digits.map((digit, i) => (
        <span key={i} className="relative inline-block w-[1ch] overflow-hidden text-center" aria-hidden>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={digit}
              className="block"
              initial={prefersReduced ? false : { y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={prefersReduced ? undefined : { y: "-100%", opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              {digit}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
      {suffix}
    </span>
  );
}
