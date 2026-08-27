"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Thin progress bar pinned under the navbar.
 *
 * Measures progress through the article element itself, not the whole page, so
 * it reads 100% when the reader finishes the piece rather than when they reach
 * the bottom of the comments and footer.
 *
 * Updates are batched into an animation frame — scroll handlers that write to
 * state on every event are a common source of jank on long pages.
 */

interface ReadingProgressProps {
  /** id of the element to measure. Falls back to the whole document. */
  targetId?: string;
}

export default function ReadingProgress({ targetId = "article-body" }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const compute = () => {
      frame.current = null;
      const el = document.getElementById(targetId);
      const viewport = window.innerHeight;

      if (!el) {
        const doc = document.documentElement;
        const scrollable = doc.scrollHeight - viewport;
        setProgress(scrollable > 0 ? Math.min(1, doc.scrollTop / scrollable) : 0);
        return;
      }

      const rect = el.getBoundingClientRect();
      const total = rect.height - viewport;
      if (total <= 0) {
        setProgress(rect.bottom <= viewport ? 1 : 0);
        return;
      }
      setProgress(Math.min(1, Math.max(0, -rect.top / total)));
    };

    const onScroll = () => {
      if (frame.current !== null) return;
      frame.current = window.requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [targetId]);

  return (
    <div
      className="reading-progress"
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    >
      <div
        className="reading-progress-bar"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
