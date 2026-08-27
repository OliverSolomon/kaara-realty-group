"use client";

import { useEffect, useState } from "react";
import { List } from "lucide-react";
import type { Heading } from "@/lib/article";

/**
 * Sticky contents list with scroll-spy.
 *
 * The point is to make a long article feel navigable rather than endless: the
 * reader can see the shape of the piece, jump straight to what they came for,
 * and always know where they are.
 *
 * Styling comes from semantic classes in globals.css so this file can be shared
 * unchanged between sites with different palettes.
 */

interface TableOfContentsProps {
  headings: Heading[];
  /** Rendered as a collapsible panel on small screens instead of a sidebar. */
  variant?: "sidebar" | "inline";
}

export default function TableOfContents({ headings, variant = "sidebar" }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (headings.length === 0) return;

    // IntersectionObserver rather than scroll maths — cheaper, and it does not
    // fight the site's smooth-scroll behaviour.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      // A heading counts as "current" from just under the navbar until it
      // scrolls past the upper third of the viewport.
      { rootMargin: "-88px 0px -70% 0px", threshold: 0 }
    );

    const nodes = headings
      .map((h) => document.getElementById(h.id))
      .filter((n): n is HTMLElement => Boolean(n));
    nodes.forEach((n) => observer.observe(n));

    return () => observer.disconnect();
  }, [headings]);

  // One heading is not a table of contents.
  if (headings.length < 2) return null;

  const list = (
    <ol className="toc-list">
      {headings.map((h) => (
        <li key={h.id} className={h.level === 3 ? "toc-item toc-item-sub" : "toc-item"}>
          <a
            href={`#${h.id}`}
            onClick={() => setOpen(false)}
            aria-current={activeId === h.id ? "true" : undefined}
            className={activeId === h.id ? "toc-link toc-link-active" : "toc-link"}
          >
            {h.text}
          </a>
        </li>
      ))}
    </ol>
  );

  if (variant === "inline") {
    return (
      <nav aria-label="Table of contents" className="toc-inline">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="toc-inline-toggle"
        >
          <span className="toc-inline-label">
            <List size={13} aria-hidden="true" /> In this article
          </span>
          <span className="toc-inline-count">{open ? "Hide" : `${headings.length} sections`}</span>
        </button>
        {open && <div className="toc-inline-body">{list}</div>}
      </nav>
    );
  }

  return (
    <nav aria-label="Table of contents" className="toc-sidebar">
      <p className="toc-heading">
        <List size={12} aria-hidden="true" /> In this article
      </p>
      {list}
    </nav>
  );
}
