"use client";

import Image from "next/image";
import Link from "next/link";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { ArrowUpRight, Info, Lightbulb, AlertTriangle, Sparkles } from "lucide-react";
import {
  buildHeadingIdMap,
  collectCitations,
  toEmbedUrl,
  linkAttributes,
  INTERNAL_LINK_BASE,
  INTERNAL_LINK_FALLBACK,
  type PortableBlock,
} from "@/lib/article";

/**
 * Renders the article body from Portable Text.
 *
 * Two things are computed up front and shared with every nested renderer:
 *  · heading ids — so the table of contents and the headings agree
 *  · citation numbers — so the superscript matches the Sources list
 *
 * The first paragraph gets a drop cap. It is applied via a class rather than
 * `::first-letter` on every paragraph so it only ever appears once.
 */

interface ArticleBodyProps {
  value?: PortableBlock[] | null;
  className?: string;
}

/** Tone → icon, default label and the CSS modifier that carries the palette. */
const CALLOUT_STYLES: Record<string, { icon: typeof Info; label: string; modifier: string }> = {
  insight: { icon: Sparkles, label: "Key insight", modifier: "callout-insight" },
  note: { icon: Info, label: "Note", modifier: "callout-note" },
  tip: { icon: Lightbulb, label: "Tip", modifier: "callout-tip" },
  warning: { icon: AlertTriangle, label: "Caution", modifier: "callout-warning" },
};

export default function ArticleBody({ value, className }: ArticleBodyProps) {
  if (!Array.isArray(value) || value.length === 0) return null;

  const headingIds = buildHeadingIdMap(value);
  const { numberByKey } = collectCitations(value);

  // Index of the first body paragraph, which is the one that gets the drop cap.
  const firstParagraphKey = value.find(
    (b) => b?._type === "block" && (!b.style || b.style === "normal") && !b.listItem
  )?._key;

  const components: PortableTextComponents = {
    block: {
      normal: ({ value: block, children }) => {
        const isFirst = block?._key === firstParagraphKey;
        return (
          <p className={isFirst ? "article-lede-paragraph" : undefined}>{children}</p>
        );
      },
      lead: ({ children }) => <p className="article-standfirst">{children}</p>,
      h2: ({ value: block, children }) => (
        <h2 id={headingIds.get(block?._key ?? "")} className="article-h2">
          {children}
        </h2>
      ),
      h3: ({ value: block, children }) => (
        <h3 id={headingIds.get(block?._key ?? "")} className="article-h3">
          {children}
        </h3>
      ),
      h4: ({ children }) => <h4 className="article-h4">{children}</h4>,
      blockquote: ({ children }) => (
        <blockquote className="article-blockquote">{children}</blockquote>
      ),
    },

    marks: {
      strong: ({ children }) => <strong>{children}</strong>,
      em: ({ children }) => <em>{children}</em>,
      underline: ({ children }) => <span className="underline underline-offset-4">{children}</span>,
      "strike-through": ({ children }) => <s>{children}</s>,
      code: ({ children }) => <code className="article-code">{children}</code>,
      highlight: ({ children }) => <mark className="article-highlight">{children}</mark>,

      /**
       * Links are deliberately obvious: accent-coloured AND underlined, never
       * colour alone (colour-blind readers would lose the cue). External links
       * carry a small outward arrow so readers know they are leaving the site
       * before they click, and get the right rel attributes.
       */
      link: ({ value: mark, children }) => {
        const linkType = (mark?.linkType as string) ?? "external";
        const sponsored = Boolean(mark?.sponsored);

        if (linkType === "internal") {
          const ref = mark?.reference as { _type?: string; slug?: string } | undefined;
          const base = INTERNAL_LINK_BASE[ref?._type ?? ""] ?? INTERNAL_LINK_FALLBACK;
          const href = ref?.slug ? `${base}/${ref.slug}` : "#";
          return (
            <Link href={href} className="article-link">
              {children}
            </Link>
          );
        }

        const href = (mark?.href as string) || "#";
        const attrs = linkAttributes({ isExternal: true, sponsored });
        return (
          <a href={href} target={attrs.target} rel={attrs.rel} className="article-link">
            {children}
            <ArrowUpRight size={12} className="article-link-icon" aria-hidden="true" />
          </a>
        );
      },

      /** Superscript marker that jumps to the matching entry under Sources. */
      citation: ({ value: mark, children }) => {
        const number = numberByKey.get((mark?._key as string) ?? "");
        if (!number) return <>{children}</>;
        return (
          <span className="article-cited">
            {children}
            <a
              href={`#source-${number}`}
              id={`cite-${number}`}
              className="article-citation-marker"
              aria-label={`Jump to source ${number}`}
            >
              {number}
            </a>
          </span>
        );
      },
    },

    list: {
      bullet: ({ children }) => <ul className="article-ul">{children}</ul>,
      number: ({ children }) => <ol className="article-ol">{children}</ol>,
    },
    listItem: {
      bullet: ({ children }) => <li>{children}</li>,
      number: ({ children }) => <li>{children}</li>,
    },

    types: {
      articleImage: ({ value: node }) => {
        const url = node?.url as string | undefined;
        if (!url) return null;
        const layout = (node?.layout as string) || "inline";
        const wrap =
          layout === "full"
            ? "article-figure-full"
            : layout === "wide"
              ? "article-figure-wide"
              : "article-figure";
        return (
          <figure className={wrap}>
            <div className="relative aspect-[16/10] w-full overflow-hidden article-media-placeholder">
              <Image
                src={url}
                alt={(node?.alt as string) || ""}
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-cover"
              />
            </div>
            {(node?.caption || node?.credit) && (
              <figcaption className="article-figcaption">
                {node?.caption as string}
                {node?.credit ? (
                  <span className="article-credit"> — {node.credit as string}</span>
                ) : null}
              </figcaption>
            )}
          </figure>
        );
      },

      callout: ({ value: node }) => {
        const tone = (node?.tone as string) || "insight";
        const style = CALLOUT_STYLES[tone] ?? CALLOUT_STYLES.insight;
        const Icon = style.icon;
        return (
          <aside className={`article-callout ${style.modifier}`}>
            <p className="article-callout-label">
              <Icon size={13} aria-hidden="true" />
              {(node?.title as string) || style.label}
            </p>
            {Array.isArray(node?.body) && (
              <div className="article-callout-body">
                <PortableText value={node.body as PortableBlock[]} />
              </div>
            )}
          </aside>
        );
      },

      pullQuote: ({ value: node }) => (
        <figure className="article-pullquote">
          <blockquote>{node?.quote as string}</blockquote>
          {(node?.attribution || node?.role) && (
            <figcaption>
              {node?.attribution as string}
              {node?.role ? <span className="article-credit">, {node.role as string}</span> : null}
            </figcaption>
          )}
        </figure>
      ),

      statBlock: ({ value: node }) => {
        const stats = (node?.stats as { value?: string; label?: string; note?: string }[]) ?? [];
        if (stats.length === 0) return null;
        return (
          <section className="article-stats">
            {node?.heading ? (
              <p className="article-stats-heading">{node.heading as string}</p>
            ) : null}
            <div className="article-stats-grid">
              {stats.map((stat, i) => (
                <div key={i} className="article-stat">
                  <p className="article-stat-value">{stat.value}</p>
                  {stat.label && <p className="article-stat-label">{stat.label}</p>}
                  {stat.note && <p className="article-stat-note">{stat.note}</p>}
                </div>
              ))}
            </div>
          </section>
        );
      },

      videoEmbed: ({ value: node }) => {
        const src = toEmbedUrl(node?.url as string);
        if (!src) return null;
        return (
          <figure className="article-figure-wide">
            <div className="relative aspect-video w-full overflow-hidden article-media-placeholder">
              <iframe
                src={src}
                title={(node?.caption as string) || "Video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
            {node?.caption ? (
              <figcaption className="article-figcaption">{node.caption as string}</figcaption>
            ) : null}
          </figure>
        );
      },

      propertyEmbed: ({ value: node }) => {
        const p = node?.property as
          | { title?: string; slug?: string; imageUrl?: string; district?: string; details?: string }
          | undefined;
        if (!p?.slug) return null;
        return (
          <Link href={`/properties/${p.slug}`} className="article-property-card group">
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden article-media-placeholder sm:w-56">
              {p.imageUrl ? (
                <Image
                  src={p.imageUrl}
                  alt={p.title || "Property"}
                  fill
                  sizes="220px"
                  className="object-cover transition-transform duration-[1.5s] group-hover:scale-105"
                />
              ) : null}
            </div>
            <div className="flex flex-col justify-center gap-1.5 p-5">
              {p.district && <p className="article-property-eyebrow">{p.district}</p>}
              <p className="article-property-title">{p.title}</p>
              {p.details && <p className="article-property-details">{p.details}</p>}
              {node?.note ? (
                <p className="article-property-note">{node.note as string}</p>
              ) : null}
              <span className="article-property-cta">
                View listing <ArrowUpRight size={12} />
              </span>
            </div>
          </Link>
        );
      },

      sectionDivider: ({ value: node }) => {
        const style = (node?.style as string) || "rule";
        if (style === "space") return <div className="h-12" aria-hidden="true" />;
        if (style === "dots")
          return (
            <div className="article-divider-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          );
        return <hr className="article-divider-rule" />;
      },
    },
  };

  return (
    <div className={`article-body ${className ?? ""}`}>
      <PortableText value={value} components={components} />
    </div>
  );
}
