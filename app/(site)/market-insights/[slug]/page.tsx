import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PortableText, type PortableTextBlock } from "@portabletext/react";
import { sanityFetch } from "@/sanity/lib/live";
import { INSIGHT_QUERY, SITE_SETTINGS_QUERY } from "@/sanity/lib/queries";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { INSIGHT_CATEGORY_LABELS, placeholderImage } from "@/lib/site";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await sanityFetch({ query: INSIGHT_QUERY, params: { slug } });
  if (!data) return { title: "Market Insights | Kaara & Co Realty Group" };
  return {
    title: `${data.title} | Kaara & Co Realty Group`,
    description: data.excerpt || undefined,
  };
}

export default async function InsightPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [{ data: insight }, { data: settings }] = await Promise.all([
    sanityFetch({ query: INSIGHT_QUERY, params: { slug } }),
    sanityFetch({ query: SITE_SETTINGS_QUERY }),
  ]);

  if (!insight) notFound();

  const published = insight.publishedAt
    ? new Date(insight.publishedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <>
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
              {insight.readingMinutes ? ` · ${insight.readingMinutes} min read` : ""}
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
            <div className="mx-auto max-w-[68ch]">
              {insight.excerpt && (
                <p className="mb-10 border-l-2 border-[#2e7d6f] pl-6 font-serif text-xl leading-relaxed text-[#efebe3]">
                  {insight.excerpt}
                </p>
              )}
              <div className="space-y-6 text-base leading-relaxed text-white/70">
                {insight.content?.length ? (
                  <PortableText value={insight.content as PortableTextBlock[]} />
                ) : (
                  <p>This report is being prepared. Check back shortly.</p>
                )}
              </div>
            </div>
          </div>
        </article>
      </main>

      <Footer settings={settings} />
    </>
  );
}
