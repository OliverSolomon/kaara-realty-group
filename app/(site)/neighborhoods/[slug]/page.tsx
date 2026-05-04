import { NEIGHBORHOOD_QUERY, SITE_SETTINGS_QUERY } from "@/sanity/lib/queries";
import { sanityFetch } from "@/sanity/lib/live";
import NeighborhoodClient from "./NeighborhoodClient";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: neighborhood } = await sanityFetch({ 
    query: NEIGHBORHOOD_QUERY, 
    params: { slug: slug } 
  });

  if (!neighborhood) return { title: "Neighborhood Not Found" };

  return {
    title: `${neighborhood.name} Neighborhood Guide | Kaara Realty Group`,
    description: `Explore ${neighborhood.name} with our comprehensive neighborhood guide.`,
  };
}

export default async function NeighborhoodPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ data: neighborhood }, { data: siteSettings }] = await Promise.all([
    sanityFetch({ 
      query: NEIGHBORHOOD_QUERY, 
      params: { slug: slug } 
    }),
    sanityFetch({ query: SITE_SETTINGS_QUERY })
  ]);

  if (!neighborhood) {
    notFound();
  }

  return <NeighborhoodClient neighborhood={neighborhood} settings={siteSettings} />;
}
