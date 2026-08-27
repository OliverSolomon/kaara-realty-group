import type { Metadata } from "next";
import { sanityFetch } from "@/sanity/lib/live";
import { ALL_LISTINGS_QUERY, SITE_SETTINGS_QUERY } from "@/sanity/lib/queries";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactActions from "@/components/site/ContactActions";
import PropertiesClient from "./PropertiesClient";
import type { Listing } from "@/components/site/ListingCard";
import FaqSection from "@/components/site/FaqSection";
import JsonLd from "@/components/JsonLd";
import {
  graph,
  breadcrumbSchema,
  itemListSchema,
  faqPageSchema,
  realEstateAgentSchema,
  resolveMeta,
  PROPERTY_FAQS,
  SITE_NAME,
} from "@/lib/seo";

export const metadata: Metadata = resolveMeta({
  title: `Luxury Properties for Sale in Nairobi, Kenya | ${SITE_NAME}`,
  description:
    "Browse verified luxury properties for sale in Kenya — apartments, villas and gated-community homes across Westlands, Kilimani, Karen, Runda, Muthaiga and Lavington. Every listing title-checked before publication.",
  path: "/properties",
  keywords: [
    "luxury properties in Kenya",
    "premium properties Kenya",
    "property for sale in Nairobi",
    "luxury apartments Nairobi",
    "luxury villas Kenya",
    "gated community homes Nairobi",
    "Westlands apartments for sale",
    "Kilimani apartments for sale",
    "Karen homes for sale",
    "Runda villas for sale",
  ],
});

export default async function PropertiesPage() {
  const [{ data: listings }, { data: settings }] = await Promise.all([
    sanityFetch({ query: ALL_LISTINGS_QUERY }),
    sanityFetch({ query: SITE_SETTINGS_QUERY }),
  ]);

  const items = (listings || []) as unknown as Listing[];

  // ItemList tells search engines this is a listing index and what is on it;
  // the FAQ block answers the long-tail questions behind "luxury property Kenya".
  const jsonLd = graph(
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Properties", path: "/properties" },
    ]),
    itemListSchema(items as unknown as { slug: string; title: string }[]),
    faqPageSchema(PROPERTY_FAQS),
    realEstateAgentSchema(settings)
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <Navbar settings={settings} />

      <main className="bg-[#100b28] pt-[72px] text-[#efebe3]">
        <section className="mx-auto max-w-[1500px] px-5 pb-16 pt-16 lg:px-10 lg:pt-24">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#4f9d8f]">
            All properties
          </p>
          <h1 className="mt-6 max-w-[18ch] font-serif text-4xl leading-[1.08] md:text-5xl lg:text-6xl">
            Everything we have on the books.
          </h1>
          <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-white/65">
            New releases, owner vetted resales and short stays, in one list. Filter by section, or
            open a listing to see the terms in full.
          </p>
          <ContactActions
            contact={settings?.contact}
            subject="the full Kaara portfolio"
            className="mt-9"
          />
        </section>

        <section className="mx-auto max-w-[1500px] border-t border-white/10 px-5 py-16 lg:px-10 lg:py-24">
          <PropertiesClient listings={items} />
        </section>
      </main>

      <FaqSection items={PROPERTY_FAQS} />

      <Footer settings={settings} />
    </>
  );
}
