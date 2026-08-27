/* eslint-disable @typescript-eslint/no-explicit-any --
 * The schema.org builders below consume Sanity documents whose shape is
 * defined by GROQ projections rather than by TypeScript. Typing each builder
 * against a generated document type would couple this file to every query and
 * break whenever a projection changes, for no runtime benefit — these
 * functions only ever read optional fields and omit what is missing.
 */
/**
 * Central SEO / GEO configuration and schema.org builders.
 *
 * Two audiences are being served here and they want different things:
 *
 *  · Search engines want unambiguous entities — a business with an address, a
 *    listing with a locality, a breadcrumb trail. Location queries ("premium
 *    apartments Westlands") are won by explicit address markup, not by having
 *    the word "Westlands" in the copy.
 *
 *  · Answer engines (ChatGPT, Perplexity, Gemini, Claude) want verifiable,
 *    self-contained passages near the top of a page, with sources. That is why
 *    articles carry `abstract`, `citation` and `speakable`.
 */
import type { Metadata } from 'next'

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://kaararealtygroup.com'
).replace(/\/+$/, '')

export const SITE_NAME = 'Kaara & Co Realty Group'
export const SITE_SHORT_NAME = 'Kaara Realty Group'
export const SITE_TAGLINE = 'Luxury Real Estate in Kenya'
export const OG_IMAGE = `${SITE_URL}/og-image.png`

export const ORG_ID = `${SITE_URL}/#organization`
export const AGENT_ID = `${SITE_URL}/#agent`
export const WEBSITE_ID = `${SITE_URL}/#website`

export const DEFAULT_DESCRIPTION =
  'Kaara & Co Realty Group is a premier luxury real estate brokerage in Kenya — vetted apartments, villas and exclusive estates for sale and short stays across Nairobi’s most prestigious neighbourhoods.'

/**
 * Primary keyword cluster. These are the queries the site is being built to
 * win, ordered roughly by commercial intent. They feed page metadata and the
 * `knowsAbout` entity signal.
 */
export const DEFAULT_KEYWORDS = [
  'luxury properties in Kenya',
  'premium properties Kenya',
  'luxury real estate Kenya',
  'luxury homes for sale in Nairobi',
  'luxury apartments Nairobi',
  'luxury villas Kenya',
  'property for sale in Nairobi',
  'gated community homes Nairobi',
  'off-plan properties Nairobi',
  'high-end real estate Nairobi',
  'furnished apartments Nairobi short stay',
  'Westlands apartments for sale',
  'Kilimani apartments for sale',
  'Karen homes for sale',
  'Runda villas for sale',
  'Muthaiga property for sale',
  'Kaara Realty Group',
]

/**
 * The suburbs the brand wants to own. Used for the service-area entity and as
 * the basis for neighbourhood landing pages.
 */
export const PRIME_NEIGHBOURHOODS = [
  'Westlands',
  'Kilimani',
  'Karen',
  'Muthaiga',
  'Runda',
  'Lavington',
  'Riverside',
  'Gigiri',
  'Parklands',
  'Spring Valley',
  'Kileleshwa',
  'Nyari',
]

export function absoluteUrl(path = ''): string {
  if (!path) return SITE_URL
  if (path.startsWith('http')) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/* ───────────────────────────── Entities ───────────────────────────── */

export function organizationSchema(settings?: any) {
  const contact = settings?.contact ?? {}
  const socials = settings?.socials ?? {}
  const sameAs = [
    socials.linkedin,
    socials.instagram,
    socials.facebook,
    socials.youtube,
    socials.x,
    socials.twitter,
  ].filter(Boolean)

  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    alternateName: SITE_SHORT_NAME,
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: OG_IMAGE },
    description: DEFAULT_DESCRIPTION,
    ...(contact.phone ? { telephone: contact.phone } : {}),
    ...(contact.email ? { email: contact.email } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    address: {
      '@type': 'PostalAddress',
      ...(contact.address ? { streetAddress: contact.address } : {}),
      addressLocality: 'Nairobi',
      addressRegion: 'Nairobi County',
      addressCountry: 'KE',
    },
  }
}

/**
 * RealEstateAgent — the local-business entity.
 *
 * Queries like "luxury property agents in Nairobi" are local-intent queries.
 * Without a LocalBusiness node carrying an address and an explicit service
 * area, the site is not a candidate for them at all.
 */
export function realEstateAgentSchema(settings?: any) {
  const contact = settings?.contact ?? {}
  return {
    '@type': 'RealEstateAgent',
    '@id': AGENT_ID,
    name: SITE_NAME,
    url: SITE_URL,
    image: OG_IMAGE,
    description: DEFAULT_DESCRIPTION,
    ...(contact.phone ? { telephone: contact.phone } : {}),
    ...(contact.email ? { email: contact.email } : {}),
    priceRange: 'KES 15,000,000 – KES 500,000,000',
    currenciesAccepted: 'KES, USD',
    address: {
      '@type': 'PostalAddress',
      ...(contact.address ? { streetAddress: contact.address } : {}),
      addressLocality: 'Nairobi',
      addressRegion: 'Nairobi County',
      addressCountry: 'KE',
    },
    areaServed: [
      { '@type': 'City', name: 'Nairobi' },
      { '@type': 'Country', name: 'Kenya' },
      ...PRIME_NEIGHBOURHOODS.map((name) => ({ '@type': 'Place', name })),
    ],
    knowsAbout: DEFAULT_KEYWORDS,
    parentOrganization: { '@id': ORG_ID },
  }
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    inLanguage: 'en-KE',
    publisher: { '@id': ORG_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/properties?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  }
}

/* ───────────────────────────── Listings ───────────────────────────── */

/** Pulls @lat,lng out of a pasted Google Maps URL, if present. */
function extractLatLng(mapsUrl?: string): { lat: number; lng: number } | null {
  if (!mapsUrl) return null
  const at = mapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (at) return { lat: parseFloat(at[1]), lng: parseFloat(at[2]) }
  const q = mapsUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (q) return { lat: parseFloat(q[1]), lng: parseFloat(q[2]) }
  return null
}

function amenityDisplayName(value: string): string {
  return value
    .replace(/^(security|utility|access|leisure|community|interior|outdoor|service)-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function priceOf(property: any) {
  const raw = typeof property.price === 'object' ? property.price?.amount : property.price
  const currency =
    (typeof property.price === 'object' ? property.price?.currency : undefined) || 'KES'
  const price = String(raw ?? '').replace(/[^0-9.]/g, '')
  return price ? { price, priceCurrency: currency.toUpperCase() } : null
}

/**
 * Emitted as two nodes per listing: Product carries the price into shopping and
 * rich results, RealEstateListing carries the meaning — that this is a home,
 * in this suburb, in Nairobi, Kenya.
 */
export function propertyProductSchema(property: any) {
  const url = absoluteUrl(`/properties/${property.slug}`)
  const districtName =
    typeof property.district === 'object' ? property.district?.name : property.district
  const offer = priceOf(property)
  const images = [
    property.imageUrl,
    ...((property.media ?? []).map((m: any) => m?.url).filter(Boolean) as string[]),
  ]
    .filter(Boolean)
    .slice(0, 6)

  return {
    '@type': 'Product',
    name: property.title,
    description:
      property.shortDescription ||
      `${property.title} — luxury property in ${districtName || 'Nairobi'}, Kenya.`,
    ...(images.length ? { image: images } : {}),
    url,
    sku: property._id,
    category: 'Luxury Residential Property',
    brand: { '@type': 'Organization', name: SITE_NAME },
    ...(offer
      ? {
          offers: {
            '@type': 'Offer',
            ...offer,
            availability: 'https://schema.org/InStock',
            url,
            seller: { '@id': ORG_ID },
          },
        }
      : {}),
  }
}

export function realEstateListingSchema(property: any) {
  const url = absoluteUrl(`/properties/${property.slug}`)
  const districtName =
    typeof property.district === 'object' ? property.district?.name : property.district
  const offer = priceOf(property)
  const coords = extractLatLng(property.googleMapsUrl)

  const amenityFeature = [...(property.amenities ?? []), ...(property.otherAmenities ?? [])]
    .slice(0, 30)
    .map((value: string) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenityDisplayName(value),
      value: true,
    }))

  return {
    '@type': 'RealEstateListing',
    name: property.title,
    url,
    description:
      property.shortDescription ||
      `${property.title} — luxury property in ${districtName || 'Nairobi'}, Kenya.`,
    ...(property.imageUrl ? { image: [property.imageUrl] } : {}),
    ...(property._createdAt ? { datePosted: property._createdAt } : {}),
    ...(offer
      ? {
          offers: {
            '@type': 'Offer',
            ...offer,
            availability: 'https://schema.org/InStock',
            url,
            seller: { '@id': ORG_ID },
          },
        }
      : {}),
    about: {
      '@type': 'Residence',
      name: property.title,
      ...(property.bedrooms ? { numberOfBedrooms: property.bedrooms } : {}),
      ...(property.bathrooms ? { numberOfBathroomsTotal: property.bathrooms } : {}),
      ...(property.sizeSqm
        ? {
            floorSize: {
              '@type': 'QuantitativeValue',
              value: property.sizeSqm,
              unitCode: 'MTK',
            },
          }
        : {}),
      address: {
        '@type': 'PostalAddress',
        ...(property.location ? { streetAddress: property.location } : {}),
        addressLocality: districtName || 'Nairobi',
        addressRegion: property.county || 'Nairobi County',
        addressCountry: 'KE',
      },
      ...(coords
        ? { geo: { '@type': 'GeoCoordinates', latitude: coords.lat, longitude: coords.lng } }
        : {}),
      ...(amenityFeature.length ? { amenityFeature } : {}),
    },
  }
}

export function itemListSchema(properties: any[], basePath = '/properties') {
  return {
    '@type': 'ItemList',
    itemListElement: (properties || []).slice(0, 25).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(`${basePath}/${p.slug}`),
      name: p.title,
    })),
  }
}

/* ───────────────────────────── Articles ───────────────────────────── */

/**
 * BlogPosting for a market insight.
 *
 * `abstract`, `citation` and `speakable` are the answer-engine levers: roughly
 * 44% of LLM citations come from the opening portion of a page, so the TL;DR is
 * the passage most likely to be quoted, and listed sources are a direct
 * verifiability signal.
 */
export function articleSchema(
  post: any,
  opts?: { citations?: { title: string; url?: string; publisher?: string }[]; wordCount?: number }
) {
  const url = absoluteUrl(`/market-insights/${post.slug}`)
  const takeaways = (post.keyTakeaways ?? []).filter(Boolean)
  const citations = (opts?.citations ?? []).filter((c) => c?.title)

  return {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: post.title,
    description: post.tldr || post.excerpt || post.title,
    ...(post.tldr ? { abstract: post.tldr } : {}),
    ...(post.coverUrl ? { image: [post.coverUrl] } : {}),
    datePublished: post.publishedAt,
    dateModified: post._updatedAt || post.publishedAt,
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@id': ORG_ID },
    mainEntityOfPage: url,
    url,
    inLanguage: 'en-KE',
    isAccessibleForFree: true,
    ...(post.category ? { articleSection: post.category } : {}),
    ...(opts?.wordCount ? { wordCount: opts.wordCount } : {}),
    ...(takeaways.length ? { keywords: takeaways.join(', ') } : {}),
    ...(citations.length
      ? {
          citation: citations.map((c) => ({
            '@type': 'CreativeWork',
            name: c.title,
            ...(c.url ? { url: c.url } : {}),
            ...(c.publisher
              ? { publisher: { '@type': 'Organization', name: c.publisher } }
              : {}),
          })),
        }
      : {}),
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.summary-tldr-text', '.summary-takeaway-list', '.article-standfirst'],
    },
  }
}

/* ───────────────────────────── FAQs ───────────────────────────── */

export function faqPageSchema(items: { q: string; a: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  }
}

/**
 * Answers to the questions people actually type. Rendered visibly on the page
 * as well as in structured data — Google ignores FAQ markup that has no visible
 * counterpart, and answer engines quote the visible text.
 */
export const PROPERTY_FAQS = [
  {
    q: 'Where can I buy luxury property in Kenya?',
    a: "Kenya's luxury property market is concentrated in Nairobi's prime suburbs — Westlands, Kilimani, Karen, Muthaiga, Runda, Lavington and Gigiri. Kaara & Co Realty Group lists vetted apartments, villas and estates across these neighbourhoods.",
  },
  {
    q: 'How much does a luxury home cost in Nairobi?',
    a: 'Luxury apartments in Nairobi generally start around KES 15 million. Premium villas and standalone homes in gated estates such as Karen, Runda and Muthaiga typically range from KES 60 million upwards, depending on plot size, finish and location.',
  },
  {
    q: 'Can foreigners buy property in Kenya?',
    a: 'Yes. Foreign nationals may own apartments and hold leasehold title in Kenya, with restrictions applying mainly to agricultural land. Leasehold terms run up to 99 years. Kaara & Co guides international buyers through due diligence, title verification and transfer.',
  },
  {
    q: 'What is an off-plan property?',
    a: 'An off-plan property is bought before or during construction, usually at a lower entry price with staged payment plans. In Nairobi it has been one of the strongest routes to capital growth, though it carries completion risk — which is why developer track record matters.',
  },
  {
    q: 'Which Nairobi suburbs give the best rental yields?',
    a: 'Prime residential areas in Nairobi have typically delivered gross rental yields of roughly 5–7%, with serviced and short-stay apartments in Westlands, Kilimani and Riverside at the upper end because of corporate and diplomatic demand.',
  },
  {
    q: 'What should I check before buying property in Kenya?',
    a: 'Confirm the title deed through an official search, verify the seller’s identity, check land rates and rent clearance, confirm approved development plans, and use an advocate for the sale agreement and transfer. Kaara & Co carries out this verification on every listing before it is published.',
  },
]

/* ───────────────────────────── Helpers ───────────────────────────── */

/** Wraps schema.org nodes in a single @graph document. */
export function graph(...nodes: object[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes.filter(Boolean),
  }
}

/** Builds page metadata, letting per-document SEO overrides win. */
export function resolveMeta(opts: {
  seo?: { metaTitle?: string; metaDescription?: string; keywords?: string[]; noIndex?: boolean; ogImage?: string }
  title: string
  description: string
  path: string
  image?: string
  type?: 'website' | 'article'
  publishedTime?: string
  keywords?: string[]
}): Metadata {
  const title = opts.seo?.metaTitle || opts.title
  const description = opts.seo?.metaDescription || opts.description
  const image = opts.seo?.ogImage || opts.image || OG_IMAGE
  const url = absoluteUrl(opts.path)
  const keywords = opts.seo?.keywords?.length
    ? opts.seo.keywords
    : opts.keywords?.length
      ? opts.keywords
      : DEFAULT_KEYWORDS

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    ...(opts.seo?.noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'en_KE',
      type: opts.type || 'website',
      ...(opts.publishedTime ? { publishedTime: opts.publishedTime } : {}),
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}
