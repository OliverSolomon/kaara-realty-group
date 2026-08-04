import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { sanityFetch } from "@/sanity/lib/live";
import { INSIGHTS_QUERY, SITE_SETTINGS_QUERY } from "@/sanity/lib/queries";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/site/Reveal";
import { INSIGHT_CATEGORY_LABELS, placeholderImage } from "@/lib/site";

export const metadata: Metadata = {
  title: "Market Insights | Kaara & Co Realty Group",
  description:
    "Research on supply, pricing, handover performance and investment strategy across the Nairobi property market.",
};

function formatDate(value?: string) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function MarketInsightsPage() {
  const [{ data: insights }, { data: settings }] = await Promise.all([
    sanityFetch({ query: INSIGHTS_QUERY }),
    sanityFetch({ query: SITE_SETTINGS_QUERY }),
  ]);

  const items = insights || [];
  const [lead, ...rest] = items;

  return (
    <>
      <Navbar settings={settings} />

      <main className="bg-[#100b28] pt-[72px] text-[#efebe3]">
        <section className="mx-auto max-w-[1500px] px-5 pb-16 pt-16 lg:px-10 lg:pb-20 lg:pt-24">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#4f9d8f]">
            Market Insights
          </p>
          <h1 className="mt-6 max-w-[20ch] font-serif text-4xl leading-[1.08] md:text-5xl lg:text-6xl">
            The market, read honestly.
          </h1>
          <p className="mt-6 max-w-[56ch] text-base leading-relaxed text-white/65">
            Supply, pricing and delivery performance across Nairobi, including the parts that make
            buying harder rather than easier.
          </p>
        </section>

        {items.length === 0 ? (
          <section className="mx-auto max-w-[1500px] px-5 pb-24 lg:px-10 lg:pb-32">
            <div className="border border-white/10 bg-[#171232] px-8 py-16 text-center">
              <h2 className="font-serif text-2xl">The first reports are being written</h2>
              <p className="mx-auto mt-4 max-w-[52ch] text-sm leading-relaxed text-white/55">
                Our quarterly note on Nairobi supply and pricing publishes here. Join the list in the
                footer and it will reach you as soon as it is out.
              </p>
            </div>
          </section>
        ) : (
          <>
            {/* Lead article */}
            <section className="mx-auto max-w-[1500px] px-5 lg:px-10">
              <Link href={`/market-insights/${lead.slug}`} className="group block">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#171232] lg:aspect-[21/9]">
                  <Image
                    src={lead.coverUrl || placeholderImage(`kaara-insight-${lead.slug}`, 2000, 1000)}
                    alt={lead.title}
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.02]"
                  />
                </div>
                <div className="grid grid-cols-1 gap-6 py-8 lg:grid-cols-12 lg:gap-16">
                  <div className="lg:col-span-7">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4f9d8f]">
                      {INSIGHT_CATEGORY_LABELS[lead.category as string] || "Market report"}
                    </p>
                    <h2 className="mt-4 max-w-[22ch] font-serif text-3xl leading-tight transition-colors duration-200 group-hover:text-[#4f9d8f] sm:text-4xl">
                      {lead.title}
                    </h2>
                  </div>
                  <div className="lg:col-span-5">
                    {lead.excerpt && (
                      <p className="max-w-[58ch] text-sm leading-relaxed text-white/60">
                        {lead.excerpt}
                      </p>
                    )}
                    <p className="mt-5 text-xs uppercase tracking-[0.18em] text-white/35">
                      {formatDate(lead.publishedAt as string)}
                      {lead.readingMinutes ? ` · ${lead.readingMinutes} min read` : ""}
                    </p>
                  </div>
                </div>
              </Link>
            </section>

            {/* Remaining, as rows rather than a card wall */}
            {rest.length > 0 && (
              <section className="mx-auto max-w-[1500px] px-5 pb-24 lg:px-10 lg:pb-32">
                <ul className="divide-y divide-white/10 border-t border-white/10">
                  {rest.map((insight: (typeof items)[number], i: number) => (
                    <Reveal as="li" key={insight._id} index={i}>
                      <Link
                        href={`/market-insights/${insight.slug}`}
                        className="group grid grid-cols-1 items-center gap-6 py-8 sm:grid-cols-12 sm:gap-8"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-[#171232] sm:col-span-3 sm:aspect-[4/3]">
                          <Image
                            src={
                              insight.coverUrl ||
                              placeholderImage(`kaara-insight-${insight.slug}`, 800, 600)
                            }
                            alt={insight.title}
                            fill
                            sizes="(max-width: 640px) 100vw, 25vw"
                            className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.04]"
                          />
                        </div>
                        <div className="sm:col-span-6">
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4f9d8f]">
                            {INSIGHT_CATEGORY_LABELS[insight.category as string] || "Market report"}
                          </p>
                          <h3 className="mt-3 max-w-[28ch] font-serif text-2xl leading-snug transition-colors duration-200 group-hover:text-[#4f9d8f]">
                            {insight.title}
                          </h3>
                          {insight.excerpt && (
                            <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-white/55">
                              {insight.excerpt}
                            </p>
                          )}
                        </div>
                        <p className="text-xs uppercase tracking-[0.18em] text-white/35 sm:col-span-3 sm:text-right">
                          {formatDate(insight.publishedAt as string)}
                        </p>
                      </Link>
                    </Reveal>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>

      <Footer settings={settings} />
    </>
  );
}
