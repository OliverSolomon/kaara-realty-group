import { PROPERTIES_QUERY, SITE_SETTINGS_QUERY } from "@/sanity/lib/queries";
import { sanityFetch } from "@/sanity/lib/live";
import PropertiesClient from "./PropertiesClient";

export const metadata = {
  title: "Properties | Kaara Realty Group",
  description: "Browse luxury properties across Nairobi and beyond. Find your next home with Kaara Realty Group.",
};

import { Suspense } from "react";

export default async function PropertiesPage() {
  const [{ data: properties }, { data: siteSettings }] = await Promise.all([
    sanityFetch({ query: PROPERTIES_QUERY }),
    sanityFetch({ query: SITE_SETTINGS_QUERY })
  ]);

  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <PropertiesClient initialProperties={properties} settings={siteSettings} />
    </Suspense>
  );
}
