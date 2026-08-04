import Image from "next/image";
import type { Metadata } from "next";
import { sanityFetch } from "@/sanity/lib/live";
import {
  LISTINGS_BY_TYPE_QUERY,
  SITE_SETTINGS_QUERY,
  DEVELOPERS_QUERY,
} from "@/sanity/lib/queries";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingGrid from "@/components/site/ListingGrid";
import ToolsPanel from "@/components/site/ToolsPanel";
import EnquiryForm from "@/components/site/EnquiryForm";
import ContactActions from "@/components/site/ContactActions";
import DeveloperWall from "@/components/site/DeveloperWall";
import AmenityGrid from "@/components/site/AmenityGrid";
import Reveal from "@/components/site/Reveal";
import { placeholderImage } from "@/lib/site";
import type { Listing } from "@/components/site/ListingCard";

export const metadata: Metadata = {
  title: "Buy | Kaara & Co Realty Group",
  description:
    "Active listings from developers with a delivery record, priced in the currency you think in, with the payment schedule and handover terms stated up front.",
};

export default async function BuyPage() {
  const [{ data: listings }, { data: settings }, { data: developers }] = await Promise.all([
    sanityFetch({ query: LISTINGS_BY_TYPE_QUERY, params: { listingType: "buy" } }),
    sanityFetch({ query: SITE_SETTINGS_QUERY }),
    sanityFetch({ query: DEVELOPERS_QUERY }),
  ]);

  const items = (listings || []) as unknown as Listing[];

  // The amenity set shown on the section page is the union of what the
  // current listings actually offer, so the icons never promise more than
  // the inventory delivers.
  const amenities = Array.from(
    new Set(items.flatMap((listing) => listing.amenities || []))
  ).slice(0, 12);

  const heroImage =
    items.find((l) => l.imageUrl)?.imageUrl || placeholderImage("kaara-buy-nairobi-skyline", 1400, 1700);

  return (
    <>
      <Navbar settings={settings} />

      <main className="bg-[#100b28] pt-[72px] text-[#efebe3]">
        {/* Hero: split, asset on the right */}
        <section className="mx-auto grid max-w-[1500px] grid-cols-1 items-center gap-12 px-5 pb-20 pt-16 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:pb-28 lg:pt-24">
          <div className="lg:col-span-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#4f9d8f]">
              Buy
            </p>
            <h1 className="mt-6 font-serif text-4xl leading-[1.08] md:text-5xl lg:text-6xl">
              Buy where the developer has already delivered.
            </h1>
            <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-white/65">
              Every listing here comes from a partner with a completed track record, published
              payment terms and support after handover.
            </p>
            <ContactActions
              contact={settings?.contact}
              subject="a listing in your Buy collection"
              className="mt-9"
            />
          </div>

          <div className="lg:col-span-6">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#171232] lg:aspect-[4/4.4]">
              <Image
                src={heroImage}
                alt="A residential tower from the Kaara buy collection in Nairobi"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* Listings */}
        <section className="mx-auto max-w-[1500px] border-t border-white/10 px-5 py-20 lg:px-10 lg:py-28">
          <div className="mb-14 flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-serif text-3xl leading-tight sm:text-4xl">Active listings</h2>
            <p className="text-sm text-white/45 tabular-nums">
              {items.length} {items.length === 1 ? "listing" : "listings"} available
            </p>
          </div>

          <ListingGrid
            listings={items}
            emptyTitle="Nothing is live in this collection right now"
            emptyBody="New releases are usually allocated before they reach the site. Tell us what you are looking for and we will send the next one that fits."
          />
        </section>

        {/* Amenities, icon led */}
        {amenities.length > 0 && (
          <section className="border-t border-white/10 bg-[#0b0819]">
            <div className="mx-auto max-w-[1500px] px-5 py-20 lg:px-10 lg:py-28">
              <Reveal>
                <h2 className="max-w-[18ch] font-serif text-3xl leading-tight sm:text-4xl">
                  What comes with the address
                </h2>
                <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-white/60">
                  Shared facilities across the current buy collection. Individual listings state
                  exactly which of these are included.
                </p>
                <AmenityGrid amenities={amenities} className="mt-14" />
              </Reveal>
            </div>
          </section>
        )}

        {/* Developer partnerships */}
        {developers && developers.length > 0 && (
          <section className="mx-auto max-w-[1500px] border-t border-white/10 px-5 py-20 lg:px-10 lg:py-28">
            <Reveal>
              <h2 className="max-w-[20ch] font-serif text-3xl leading-tight sm:text-4xl">
                The developers we sell for
              </h2>
              <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-white/60">
                Partnerships are deliberately few. A developer joins this list once they have
                completed on time, built to standard and stayed reachable after handover.
              </p>
              <DeveloperWall developers={developers} className="mt-12" />
            </Reveal>
          </section>
        )}

        {/* Tools */}
        <section className="border-t border-white/10 bg-[#0b0819]">
          <div className="mx-auto max-w-[1500px] px-5 py-20 lg:px-10 lg:py-28">
            <ToolsPanel
              baseCurrency="KES"
              blurb="Listings are quoted in Kenyan shillings. Convert a price into the currency you hold, and read floor areas in the unit you are used to, before you speak to anyone."
            />
          </div>
        </section>

        {/* Lead capture */}
        <section
          id="enquire"
          className="mx-auto max-w-[1500px] border-t border-white/10 px-5 py-20 lg:px-10 lg:py-28"
        >
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <h2 className="max-w-[16ch] font-serif text-3xl leading-tight sm:text-4xl">
                Speak to an advisor before you commit
              </h2>
              <p className="mt-5 max-w-[46ch] text-sm leading-relaxed text-white/60">
                We start with what you are trying to achieve, then work backwards to the buildings
                that fit. If nothing fits, we say so.
              </p>
              <ContactActions
                contact={settings?.contact}
                subject="a purchase in Nairobi"
                variant="quiet"
                className="mt-8"
              />
            </div>
            <div className="lg:col-span-7">
              <EnquiryForm kind="buy" />
            </div>
          </div>
        </section>
      </main>

      <Footer settings={settings} />
    </>
  );
}
