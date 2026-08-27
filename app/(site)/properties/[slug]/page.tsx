import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PROPERTY_DETAIL_QUERY, SITE_SETTINGS_QUERY } from "@/sanity/lib/queries";
import { sanityFetch } from "@/sanity/lib/live";
import PropertyDetailClient from "./PropertyDetailClient";
import JsonLd from "@/components/JsonLd";
import {
  graph,
  breadcrumbSchema,
  propertyProductSchema,
  realEstateListingSchema,
  resolveMeta,
  SITE_NAME,
} from "@/lib/seo";

/**
 * Builds the description and keyword set from the listing's own facts.
 *
 * A generic "View details for X" description is a wasted search result. Naming
 * the suburb, the bedroom count and the price is what makes the page a credible
 * match for "3 bedroom apartment Kilimani" style queries, which is where the
 * commercial intent lives.
 */
function listingCopy(property: {
  title?: string;
  shortDescription?: string;
  district?: { name?: string } | string;
  county?: string;
  bedrooms?: number;
  propertyType?: string[];
}) {
  const district =
    typeof property.district === "object" ? property.district?.name : property.district;
  const place = district ? `${district}, Nairobi` : "Nairobi, Kenya";
  const type = property.propertyType?.[0] ?? "property";
  const beds = property.bedrooms ? `${property.bedrooms}-bedroom ` : "";

  const description =
    property.shortDescription?.trim() ||
    `${property.title} — a ${beds}luxury ${type} in ${place}. Verified listing from ${SITE_NAME}. Book a private viewing.`;

  const keywords = [
    property.title,
    district ? `${type} for sale in ${district}` : null,
    district ? `luxury property ${district}` : null,
    district ? `${district} Nairobi real estate` : null,
    property.bedrooms && district ? `${property.bedrooms} bedroom ${type} ${district}` : null,
    "luxury property Nairobi",
    "premium properties Kenya",
  ].filter(Boolean) as string[];

  return { description, keywords, place };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data: property } = await sanityFetch({
    query: PROPERTY_DETAIL_QUERY,
    params: { slug },
  });

  if (!property) return { title: "Property Not Found" };

  const { description, keywords, place } = listingCopy(property);

  return resolveMeta({
    title: `${property.title} | Luxury Property in ${place} | ${SITE_NAME}`,
    description,
    keywords,
    path: `/properties/${slug}`,
    image: property.imageUrl || undefined,
    type: "website",
  });
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [{ data: property }, { data: siteSettings }] = await Promise.all([
    sanityFetch({ query: PROPERTY_DETAIL_QUERY, params: { slug } }),
    sanityFetch({ query: SITE_SETTINGS_QUERY }),
  ]);

  if (!property) notFound();

  const district =
    typeof property.district === "object" ? property.district?.name : property.district;

  // Product carries the price into rich results; RealEstateListing carries the
  // meaning — a home, in this suburb, in Nairobi, Kenya.
  const jsonLd = graph(
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Properties", path: "/properties" },
      ...(district ? [{ name: district, path: `/properties?district=${encodeURIComponent(district)}` }] : []),
      { name: property.title ?? "Property", path: `/properties/${slug}` },
    ]),
    propertyProductSchema(property),
    realEstateListingSchema(property)
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <PropertyDetailClient property={{ ...property, siteSettings }} />
    </>
  );
}
