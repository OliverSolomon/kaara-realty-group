import Image from "next/image";
import type { Metadata } from "next";
import { sanityFetch } from "@/sanity/lib/live";
import {
  LISTINGS_BY_TYPE_QUERY,
  SITE_SETTINGS_QUERY,
  SECTION_PAGE_QUERY,
} from "@/sanity/lib/queries";
import ViewAllPropertiesButton from "@/components/site/ViewAllPropertiesButton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingGrid from "@/components/site/ListingGrid";
import EnquiryForm from "@/components/site/EnquiryForm";
import ContactActions from "@/components/site/ContactActions";
import AreaConverter from "@/components/site/AreaConverter";
import AmenityGrid from "@/components/site/AmenityGrid";
import Reveal from "@/components/site/Reveal";
import { placeholderImage } from "@/lib/site";
import type { Listing } from "@/components/site/ListingCard";

export const metadata: Metadata = {
  title: "Stay | Kaara & Co Realty Group",
  description:
    "Luxury short stay apartments in Nairobi. Floor, aspect and nightly rate stated for every unit, with booking confirmed by phone and email.",
};

export default async function StayPage() {
  const [{ data: listings }, { data: settings }, { data: page }] = await Promise.all([
    sanityFetch({ query: LISTINGS_BY_TYPE_QUERY, params: { listingType: "stay" } }),
    sanityFetch({ query: SITE_SETTINGS_QUERY }),
    sanityFetch({ query: SECTION_PAGE_QUERY, params: { type: "stayPage" } }),
  ]);

  const items = (listings || []) as unknown as Listing[];
  const amenities = Array.from(
    new Set(items.flatMap((listing) => listing.amenities || []))
  ).slice(0, 12);

  return (
    <>
      <Navbar settings={settings} />

      <main className="bg-[#100b28] pt-[72px] text-[#efebe3]">
        {/* Hero: editorial horizontal, asset left */}
        <section className="mx-auto grid max-w-[1500px] grid-cols-1 items-end gap-12 px-5 pb-20 pt-16 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:pb-28 lg:pt-24">
          <div className="order-2 lg:order-1 lg:col-span-7">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#171232]">
              <Image
                src={
                  page?.heroImageUrl ||
                  items.find((l) => l.imageUrl)?.imageUrl ||
                  placeholderImage("kaara-stay-nairobi-serviced-apartment", 1600, 1000)
                }
                alt="A serviced apartment interior available for short stays in Nairobi"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#4f9d8f]">
              {page?.eyebrow || "Stay"}
            </p>
            <h1 className="mt-6 font-serif text-4xl leading-[1.08] md:text-5xl">
              {page?.headline || "Short stays in buildings we know well."}
            </h1>
            <p className="mt-6 max-w-[42ch] text-base leading-relaxed text-white/65">
              {page?.intro ||
                "Floor, aspect and nightly rate are stated for every unit. What you see is what you check into."}
            </p>
            <ContactActions
              contact={settings?.contact}
              subject="a short stay booking"
              className="mt-9"
            />
          </div>
        </section>

        {/* Listings */}
        <section className="border-t border-white/10 bg-[#0b0819]">
          <div className="mx-auto max-w-[1500px] px-5 py-20 lg:px-10 lg:py-28">
            <div className="mb-14 flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
                {page?.listingsHeading || "Available units"}
              </h2>
              <p className="text-sm text-white/45 tabular-nums">
                {items.length} {items.length === 1 ? "unit" : "units"} listed
              </p>
            </div>

            <ListingGrid
              listings={items}
              emptyTitle={page?.listingsEmptyTitle || "No short stay units are listed yet"}
              emptyBody={
                page?.listingsEmptyBody ||
                "Our short stay portfolio is being onboarded building by building. Send us your dates and we will tell you what we can hold for you."
              }
            />

            <ViewAllPropertiesButton className="mt-16" />
          </div>
        </section>

        {/* Amenities */}
        {amenities.length > 0 && (
          <section className="mx-auto max-w-[1500px] border-t border-white/10 px-5 py-20 lg:px-10 lg:py-28">
            <Reveal>
              <h2 className="max-w-[20ch] font-serif text-3xl leading-tight sm:text-4xl">
                In the building
              </h2>
              <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-white/60">
                Facilities guests can use during a stay. Access to each one is confirmed at booking.
              </p>
              <AmenityGrid amenities={amenities} className="mt-14" />
            </Reveal>
          </section>
        )}

        {/* Booking, with the area tool alongside */}
        <section className="border-t border-white/10 bg-[#0b0819]">
          <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-14 px-5 py-20 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-28">
            <div className="lg:col-span-7">
              <EnquiryForm kind="booking" />
            </div>

            <aside className="lg:col-span-5">
              <div className="border border-white/10 p-8 lg:p-10">
                <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">
                  Floor area
                </h3>
                <p className="mb-8 text-sm leading-relaxed text-white/60">
                  Unit sizes are quoted in square metres. Convert them if square feet is what you
                  picture.
                </p>
                <AreaConverter />
              </div>

              <div className="mt-8 border border-white/10 p-8 lg:p-10">
                <h3 className="mb-4 font-serif text-xl text-[#efebe3]">Booking, plainly</h3>
                <ul className="space-y-3 text-sm leading-relaxed text-white/60">
                  <li>We confirm the unit and the rate by email before any payment.</li>
                  <li>Check in is coordinated by phone on the day of arrival.</li>
                  <li>Rates are per night and exclude any building levies where these apply.</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <Footer settings={settings} />
    </>
  );
}
