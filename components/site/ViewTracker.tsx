"use client";

import { useEffect } from "react";

/**
 * Records one view of a listing and hands the fresh total back to the page.
 * Counted once per listing per browser session, so refreshing or navigating
 * back does not inflate the number.
 */
export default function ViewTracker({
  slug,
  onCount,
}: {
  slug: string;
  onCount: (count: number) => void;
}) {
  useEffect(() => {
    if (!slug) return;
    const key = `kaara:viewed:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: count the view rather than silently dropping it.
    }

    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (body && typeof body.count === "number") onCount(body.count);
      })
      .catch(() => {});
  }, [slug, onCount]);

  return null;
}
