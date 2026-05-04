import { HOME_PAGE_QUERY, SITE_SETTINGS_QUERY } from "@/sanity/lib/queries";
import { sanityFetch } from "@/sanity/lib/live";
import HomeClient from "./HomeClient";

export default async function Home() {
  const [{ data: homeData }, { data: siteSettings }] = await Promise.all([
    sanityFetch({ query: HOME_PAGE_QUERY }),
    sanityFetch({ query: SITE_SETTINGS_QUERY })
  ]);

  return <HomeClient data={homeData} settings={siteSettings} />;
}
