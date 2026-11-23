"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- Article values follow the CMS schema at runtime. */

import { useEffect, useMemo, useState } from "react";
import ArticleBody from "@/components/article/ArticleBody";
import ArticleSummary from "@/components/article/ArticleSummary";
import Sources, { type FurtherReadingItem } from "@/components/article/Sources";
import { collectCitations, estimateReadingMinutes, type PortableBlock } from "@/lib/article";
import { INSIGHT_CATEGORY_LABELS } from "@/lib/site";

const PROJECT = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;

function assetUrl(ref?: string) {
  const match = ref?.match(/^image-([a-f0-9]+-\d+x\d+)-([a-z0-9]+)$/i);
  return match ? `https://cdn.sanity.io/images/${PROJECT}/${DATASET}/${match[1]}.${match[2]}` : null;
}

/** Shows unsaved work the way the article page will show it once published. */
export default function ArticlePreview({ doc }: { doc: any }) {
  const [refs, setRefs] = useState<Record<string, any>>({});
  const [width, setWidth] = useState<"desktop" | "phone">("desktop");
  const raw: any[] = useMemo(() => (Array.isArray(doc.content) ? doc.content : []), [doc.content]);
  const ids = useMemo(() => {
    const found = new Set<string>();
    for (const block of raw) {
      if (block._type === "propertyEmbed" && block.property?._ref) found.add(block.property._ref);
      for (const mark of block.markDefs ?? []) if (mark._type === "link" && mark.reference?._ref) found.add(mark.reference._ref);
    }
    return [...found].sort().slice(0, 60);
  }, [raw]);

  useEffect(() => {
    if (!ids.length) return;
    let live = true;
    fetch("/api/admin/cms", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ op: "previewRefs", ids }) })
      .then((response) => (response.ok ? response.json() : { items: {} }))
      .then((data) => { if (live) setRefs(data.items ?? {}); })
      .catch(() => undefined);
    return () => { live = false; };
  }, [ids]);

  const content = useMemo(() => raw.map((block) => {
    if (block._type === "articleImage") return { ...block, url: block.url ?? assetUrl(block.asset?._ref) };
    if (block._type === "propertyEmbed") return { ...block, property: refs[block.property?._ref] };
    if (block.markDefs?.length) {
      return { ...block, markDefs: block.markDefs.map((mark: any) => (mark._type === "link" && mark.reference?._ref ? { ...mark, reference: refs[mark.reference._ref] ?? null } : mark)) };
    }
    return block;
  }) as PortableBlock[], [raw, refs]);

  const cover = assetUrl(doc.coverImage?.asset?._ref) ?? doc.coverImage?.externalUrl;
  const { citations } = collectCitations(content);
  const minutes = doc.readingMinutes || estimateReadingMinutes(content);
  const date = doc.publishedAt ? new Date(doc.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Not published";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs text-white/55">Preview of your current edits. Nothing here is public.</p>
        <div className="flex shrink-0 border border-white/15" role="group" aria-label="Preview width">
          {(["desktop", "phone"] as const).map((item) => (
            <button key={item} type="button" aria-pressed={width === item} onClick={() => setWidth(item)} className={`min-h-9 px-3 text-xs capitalize ${width === item ? "bg-[#2e7d6f] text-white" : "text-white/60"}`}>{item}</button>
          ))}
        </div>
      </div>
      <article data-testid="article-preview" className="mx-auto border border-white/10 bg-[#100b28] text-[#efebe3] transition-[max-width]" style={{ maxWidth: width === "phone" ? 390 : "100%" }}>
        <header className="px-5 pb-8 pt-10 sm:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#4f9d8f]">Market Insights</p>
          <h1 className="mt-5 font-serif text-3xl leading-[1.1] md:text-4xl">{doc.title || "Untitled article"}</h1>
          <p className="mt-5 text-xs uppercase tracking-[0.18em] text-white/40">
            {INSIGHT_CATEGORY_LABELS[doc.category as string] || "Market report"} · {date} · {minutes} min read
          </p>
        </header>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`${cover}?w=1400&fit=max&auto=format`} alt="" className="aspect-[16/9] w-full object-cover" />
        )}
        <div className="px-5 py-10 sm:px-8">
          {doc.excerpt && <p className="mb-10 border-l-2 border-[#2e7d6f] pl-6 font-serif text-xl leading-relaxed">{doc.excerpt}</p>}
          <ArticleSummary tldr={doc.tldr || undefined} keyTakeaways={doc.keyTakeaways || undefined} />
          {content.length ? <div id="article-body"><ArticleBody value={content} /></div> : <p className="text-base text-white/60">No article text yet.</p>}
          <Sources citations={citations} furtherReading={(doc.furtherReading ?? undefined) as FurtherReadingItem[] | undefined} />
        </div>
      </article>
    </div>
  );
}
