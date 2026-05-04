import { PROPERTIES_QUERY, SITE_SETTINGS_QUERY } from "@/sanity/lib/queries";
import { sanityFetch } from "@/sanity/lib/live";
import PropertiesClient from "./PropertiesClient";

export const metadata = {
  title: "Properties | Kaara Realty Group",
  description: "Browse luxury properties across Nairobi and beyond. Find your next home with Kaara Realty Group.",
};

export default async function PropertiesPage() {
  const [{ data: properties }, { data: siteSettings }] = await Promise.all([
    sanityFetch({ query: PROPERTIES_QUERY }),
    sanityFetch({ query: SITE_SETTINGS_QUERY })
  ]);

  return <PropertiesClient initialProperties={properties} settings={siteSettings} />;
}
