import { HOME_PAGE_QUERY } from "@/sanity/lib/queries";
import { sanityFetch } from "@/sanity/lib/live";
import HomeClient from "./HomeClient";

export default async function Home() {
  const { data } = await sanityFetch({ query: HOME_PAGE_QUERY });

  return <HomeClient data={data} />;
}
