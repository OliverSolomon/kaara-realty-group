import type { MetadataRoute } from 'next';
import { client } from '@/sanity/lib/client';
import { SITE_URL } from '@/lib/seo';

// Single source of truth, so the sitemap can never disagree with the
// canonical tags or the structured data.
const baseUrl = SITE_URL;

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: 'daily' as const, priority: 1 },
    { url: `${baseUrl}/properties`, changeFrequency: 'daily' as const, priority: 0.95 },
    { url: `${baseUrl}/buy`, changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/sell`, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/stay`, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/world-of-kaara`, changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/market-insights`, changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly' as const, priority: 0.6 },
  ].map((route) => ({ ...route, lastModified: now }));

  try {
    const [properties, insights] = await Promise.all([
      client.fetch<{ slug: string; _updatedAt: string }[]>(
        `*[_type == "property" && defined(slug.current)]{"slug": slug.current, _updatedAt}`
      ),
      client.fetch<{ slug: string; _updatedAt: string }[]>(
        `*[_type == "post" && defined(slug.current)]{"slug": slug.current, _updatedAt}`
      ),
    ]);

    return [
      ...staticRoutes,
      ...properties.map((p) => ({
        url: `${baseUrl}/properties/${p.slug}`,
        lastModified: new Date(p._updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      ...insights.map((p) => ({
        url: `${baseUrl}/market-insights/${p.slug}`,
        lastModified: new Date(p._updatedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // A sitemap without listings is better than a build that fails on it.
    return staticRoutes;
  }
}
