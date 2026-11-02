"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef } from "react";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Delay in ms before the element animates in, used for staggering. */
  delay?: number;
  /** Vertical travel distance in px. */
  y?: number;
  /** Starting scale, e.g. 0.97 for a subtle zoom. */
  scale?: number;
  /** Soften the entrance with a blur. */
  blur?: boolean;
  /** How much of the element must be visible before it animates. */
  amount?: number;
};

/**
 * Fades, lifts and unblurs its children the first time they scroll into view.
 * Pure IntersectionObserver + CSS transitions, so it stays on the compositor.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
  scale = 1,
  blur = true,
  amount = 0.12,
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      el.dataset.visible = "true";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-visible", "true");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: amount, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [amount]);

  const style = {
    "--reveal-y": `${y}px`,
    "--reveal-scale": String(scale),
    "--reveal-delay": `${delay}ms`,
    "--reveal-blur": blur ? "10px" : "0px",
  } as CSSProperties;

  return (
    <div ref={ref} className={className ? `reveal ${className}` : "reveal"} style={style}>
      {children}
    </div>
  );
}

type ParallaxProps = {
  children: ReactNode;
  className?: string;
  /**
   * Depth strength. Positive values drift with the scroll, negative ones drift
   * against it. Roughly `speed * 100` px of travel per viewport of scrolling.
   */
  speed?: number;
  /** Hard limit on the transform so nothing ever escapes its section. */
  maxOffset?: number;
};

/**
 * Moves its children at a slightly different rate than the page scroll,
 * which is what gives a page that layered, continuous feel.
 */
export function Parallax({
  children,
  className,
  speed = 0.2,
  maxOffset = 90,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let frame = 0;
    let lastOffset = 0;

    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const center = rect.top + rect.height / 2;
      const progress = (vh / 2 - center) / vh;

      if (Math.abs(progress) > 1.3) return;

      const raw = progress * speed * 100;
      const offset = Math.max(-maxOffset, Math.min(maxOffset, raw));

      if (Math.abs(offset - lastOffset) < 0.1) return;
      lastOffset = offset;
      el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [speed, maxOffset]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
