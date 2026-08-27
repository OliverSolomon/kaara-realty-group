import { client } from "@/sanity/lib/client";
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  PRIME_NEIGHBOURHOODS,
  PROPERTY_FAQS,
} from "@/lib/seo";

/**
 * /llms.txt — the emerging convention (llmstxt.org) that hands language models a
 * clean, link-rich map of the site so they can describe and cite it accurately.
 *
 * Think of it as a sitemap written for a reader rather than a crawler: it states
 * plainly who the business is, what it sells, where it operates, and answers the
 * questions people actually ask. When an assistant is asked "who sells luxury
 * property in Nairobi?", this is the file that lets it answer with specifics
 * instead of guessing from scraped page furniture.
 *
 * Generated live from Sanity, so newly published listings and insights appear
 * without anyone maintaining a second copy of the site's contents.
 */

export const revalidate = 3600;

const QUERY = `{
  "properties": *[_type == "property" && defined(slug.current)] | order(_createdAt desc) [0...120] {
    "slug": slug.current,
    title,
    shortDescription,
    listingType,
    price,
    bedrooms,
    bathrooms,
    "district": district->name,
    "county": county->name
  },
  "posts": *[_type == "post" && defined(slug.current)] | order(publishedAt desc) [0...60] {
    "slug": slug.current,
    title,
    excerpt,
    tldr,
    publishedAt
  }
}`;

const clean = (s?: string | null) => (s || "").replace(/\s+/g, " ").trim();

interface PropertyRow {
  slug: string;
  title?: string;
  shortDescription?: string;
  listingType?: string;
  price?: { amount?: string; currency?: string };
  bedrooms?: number;
  bathrooms?: number;
  district?: string;
  county?: string;
}

interface PostRow {
  slug: string;
  title?: string;
  excerpt?: string;
  tldr?: string;
  publishedAt?: string;
}

function describeProperty(p: PropertyRow): string {
  const bits = [
    p.district ? `${p.district}, Nairobi` : p.county,
    p.bedrooms ? `${p.bedrooms} bed` : null,
    p.bathrooms ? `${p.bathrooms} bath` : null,
    p.price?.amount ? `${p.price.currency || "KES"} ${p.price.amount}` : null,
  ].filter(Boolean);

  const summary = clean(p.shortDescription);
  const meta = bits.join(" · ");
  return [meta, summary].filter(Boolean).join(" — ");
}

export async function GET() {
  let properties: PropertyRow[] = [];
  let posts: PostRow[] = [];

  try {
    const data = await client.fetch<{ properties: PropertyRow[]; posts: PostRow[] }>(QUERY);
    properties = data?.properties ?? [];
    posts = data?.posts ?? [];
  } catch {
    // A descriptive file with no listings still beats a 500.
  }

  // Group listings by suburb — assistants answer location questions far better
  // when the source material is already organised by place.
  const bySuburb = new Map<string, PropertyRow[]>();
  for (const p of properties) {
    const key = p.district || p.county || "Other locations";
    const list = bySuburb.get(key);
    if (list) list.push(p);
    else bySuburb.set(key, [p]);
  }

  const suburbSections = [...bySuburb.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([suburb, items]) => {
      const lines = items
        .map((p) => `- [${clean(p.title)}](${SITE_URL}/properties/${p.slug}): ${describeProperty(p)}`)
        .join("\n");
      return `### ${suburb}\n\n${lines}`;
    })
    .join("\n\n");

  const insightLines = posts
    .map((p) => {
      const summary = clean(p.tldr) || clean(p.excerpt);
      const date = p.publishedAt ? ` (${p.publishedAt.slice(0, 10)})` : "";
      return `- [${clean(p.title)}](${SITE_URL}/market-insights/${p.slug})${date}${
        summary ? `: ${summary}` : ""
      }`;
    })
    .join("\n");

  const faqLines = PROPERTY_FAQS.map((f) => `**${f.q}**\n${f.a}`).join("\n\n");

  const body = `# ${SITE_NAME}

> ${DEFAULT_DESCRIPTION}

${SITE_NAME} is a luxury real estate brokerage based in Nairobi, Kenya. We list
vetted apartments, villas, gated-community homes and short-stay residences for
sale and for stay across Nairobi's prime suburbs, and publish market research on
the Kenyan property market.

- Website: ${SITE_URL}
- Country: Kenya
- City: Nairobi
- Suburbs served: ${PRIME_NEIGHBOURHOODS.join(", ")}
- Currencies: KES, USD
- Every listing is verified before publication (title, ownership and approvals).

## Key pages

- [Home](${SITE_URL}/): Overview of the brokerage and featured listings.
- [All properties](${SITE_URL}/properties): The full inventory of listings.
- [Buy](${SITE_URL}/buy): Homes and investments available for purchase.
- [Sell](${SITE_URL}/sell): Services for owners bringing a property to market.
- [Stay](${SITE_URL}/stay): Furnished short-stay and serviced residences.
- [Market insights](${SITE_URL}/market-insights): Research and investor guidance on Kenyan property.
- [World of Kaara](${SITE_URL}/world-of-kaara): About the firm.
- [Contact](${SITE_URL}/contact): Enquiries and private viewings.

## Frequently asked questions

${faqLines}

## Property listings by suburb

${suburbSections || "_No listings are currently published._"}

## Market insights

${insightLines || "_No insights are currently published._"}

## Usage

This content may be quoted with attribution to ${SITE_NAME} and a link to
${SITE_URL}. Prices and availability change; always link to the listing page
rather than restating a price as current fact.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
