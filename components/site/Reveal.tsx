"use client";

import { createElement, useCallback, useState, type ElementType } from "react";

interface RevealProps {
  children: React.ReactNode;
  /** Stagger position within a group. Kept short so nothing feels delayed. */
  index?: number;
  className?: string;
  as?: ElementType;
}

/**
 * Reveals a block once as it scrolls into view. Runs a single CSS animation,
 * so it stays off the main thread and cannot restart mid-scroll. The observer
 * is attached from a callback ref, which fires exactly when the node mounts.
 */
export default function Reveal({ children, index = 0, className = "", as = "div" }: RevealProps) {
  const [visible, setVisible] = useState(false);

  const attach = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-60px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return createElement(
    as,
    {
      ref: attach,
      "data-visible": visible,
      className: `reveal ${className}`.trim(),
      style: { animationDelay: `${Math.min(index, 5) * 60}ms` },
    },
    children
  );
}
