import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { sanityFetch } from "@/sanity/lib/live";
import { INSIGHT_QUERY, SITE_SETTINGS_QUERY } from "@/sanity/lib/queries";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleBody from "@/components/article/ArticleBody";
import ArticleSummary from "@/components/article/ArticleSummary";
import TableOfContents from "@/components/article/TableOfContents";
import ReadingProgress from "@/components/article/ReadingProgress";
import Sources, { type FurtherReadingItem } from "@/components/article/Sources";
import {
  collectCitations,
  countWords,
  estimateReadingMinutes,
  extractHeadings,
  type PortableBlock,
} from "@/lib/article";
import { INSIGHT_CATEGORY_LABELS, placeholderImage } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import {
  graph,
  breadcrumbSchema,
  articleSchema,
  resolveMeta,
  SITE_NAME,
} from "@/lib/seo";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await sanityFetch({ query: INSIGHT_QUERY, params: { slug } });
  if (!data) return { title: `Market Insights | ${SITE_NAME}` };

  // The TL;DR makes a far better search snippet than a truncated first
  // paragraph, and it is the passage answer engines are most likely to quote.
  const description =
    data.tldr?.trim() ||
    data.excerpt?.trim() ||
    `${data.title} — market research on Kenyan property from ${SITE_NAME}.`;

  return resolveMeta({
    title: `${data.title} | ${SITE_NAME}`,
    description,
    path: `/market-insights/${slug}`,
    image: data.coverUrl || undefined,
    type: "article",
    publishedTime: data.publishedAt || undefined,
    keywords: [
      data.title,
      "Kenya property market",
      "Nairobi real estate market report",
      "Kenya real estate investment",
      ...((data.keyTakeaways ?? []).filter(Boolean) as string[]).slice(0, 4),
    ].filter(Boolean) as string[],
  });
}

export default async function InsightPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [{ data: insight }, { data: settings }] = await Promise.all([
    sanityFetch({ query: INSIGHT_QUERY, params: { slug } }),
    sanityFetch({ query: SITE_SETTINGS_QUERY }),
  ]);

  if (!insight) notFound();

  // Derived from the body itself, so an editor never maintains these by hand.
  const content = (insight.content ?? null) as PortableBlock[] | null;
  const headings = extractHeadings(content);
  const { citations } = collectCitations(content);
  const hasBody = Array.isArray(content) && content.length > 0;
  // The manual field wins if set, otherwise the length of the piece decides.
  const readingMinutes =
    insight.readingMinutes || estimateReadingMinutes(content, insight.excerpt ?? "");

  const published = insight.publishedAt
    ? new Date(insight.publishedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  // Citations and length are read straight from the body, so the structured
  // data can never disagree with what is actually on the page.
  const jsonLd = graph(
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Market Insights", path: "/market-insights" },
      { name: insight.title ?? "Insight", path: `/market-insights/${slug}` },
    ]),
    articleSchema(insight, { citations, wordCount: countWords(content) })
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      {hasBody && <ReadingProgress targetId="article-body" />}
      <Navbar settings={settings} />

      <main className="bg-[#100b28] pt-[72px] text-[#efebe3]">
        <article>
          <header className="mx-auto max-w-[1500px] px-5 pb-12 pt-16 lg:px-10 lg:pt-24">
            <Link
              href="/market-insights"
              className="press text-[10px] font-bold uppercase tracking-[0.25em] text-[#4f9d8f]"
            >
              Market Insights
            </Link>
            <h1 className="mt-6 max-w-[24ch] font-serif text-4xl leading-[1.1] md:text-5xl">
              {insight.title}
            </h1>
            <p className="mt-6 text-xs uppercase tracking-[0.18em] text-white/40">
              {INSIGHT_CATEGORY_LABELS[insight.category as string] || "Market report"}
              {published ? ` · ${published}` : ""}
              {hasBody ? ` · ${readingMinutes} min read` : ""}
            </p>
          </header>

          <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#171232]">
              <Image
                src={insight.coverUrl || placeholderImage(`kaara-insight-${slug}`, 2000, 1125)}
                alt={insight.title}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="mx-auto max-w-[1500px] px-5 py-16 lg:px-10 lg:py-24">
            {/* Two columns on large screens so the contents list sits alongside
                the text; below that it collapses into a panel above the body. */}
            <div className="mx-auto max-w-[1080px] lg:grid lg:grid-cols-[minmax(0,68ch)_220px] lg:gap-14">
              <div>
                {insight.excerpt && (
                  <p className="mb-10 border-l-2 border-[#2e7d6f] pl-6 font-serif text-xl leading-relaxed text-[#efebe3]">
                    {insight.excerpt}
                  </p>
                )}

                <ArticleSummary
                  tldr={insight.tldr ?? undefined}
                  keyTakeaways={(insight.keyTakeaways ?? undefined) as string[] | undefined}
                />

                {headings.length >= 2 && (
                  <div className="lg:hidden">
                    <TableOfContents headings={headings} variant="inline" />
                  </div>
                )}

                {hasBody ? (
                  <div id="article-body">
                    <ArticleBody value={content} />
                  </div>
                ) : (
                  <p className="text-base leading-relaxed text-white/70">
                    This report is being prepared. Check back shortly.
                  </p>
                )}

                <Sources
                  citations={citations}
                  furtherReading={(insight.furtherReading ?? undefined) as FurtherReadingItem[] | undefined}
                />
              </div>

              {headings.length >= 2 && (
                <aside className="hidden lg:block">
                  <TableOfContents headings={headings} />
                </aside>
              )}
            </div>
          </div>
        </article>
      </main>

      <Footer settings={settings} />
    </>
  );
}
