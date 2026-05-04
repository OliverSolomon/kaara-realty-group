import { sanityFetch } from "@/sanity/lib/live";
import { NEIGHBORHOODS_QUERY, SITE_SETTINGS_QUERY } from "@/sanity/lib/queries";
import NeighborhoodsClient from "./NeighborhoodsClient";

export default async function NeighborhoodsPage() {
  const { data: neighborhoods } = await sanityFetch({ query: NEIGHBORHOODS_QUERY });
  const { data: settings } = await sanityFetch({ query: SITE_SETTINGS_QUERY });

  return (
    <NeighborhoodsClient 
      neighborhoods={neighborhoods} 
      settings={settings} 
    />
  );
}
