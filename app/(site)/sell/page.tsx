import Image from "next/image";
import type { Metadata } from "next";
import { PiFileText, PiUserCheck, PiHandshake, PiChartLineUp } from "react-icons/pi";
import { sanityFetch } from "@/sanity/lib/live";
import { LISTINGS_BY_TYPE_QUERY, SITE_SETTINGS_QUERY } from "@/sanity/lib/queries";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingGrid from "@/components/site/ListingGrid";
import EnquiryForm from "@/components/site/EnquiryForm";
import ContactActions from "@/components/site/ContactActions";
import ToolsPanel from "@/components/site/ToolsPanel";
import Reveal from "@/components/site/Reveal";
import { placeholderImage } from "@/lib/site";
import type { Listing } from "@/components/site/ListingCard";

export const metadata: Metadata = {
  title: "Sell | Kaara & Co Realty Group",
  description:
    "Owner vetted resale units in Nairobi. Title and ownership are verified before a unit is listed, and viewings are arranged with the owner present.",
};

const VETTING = [
  {
    Icon: PiFileText,
    title: "Title and ownership are checked first",
    body: "We read the title, confirm the registered owner and look for encumbrances before the unit appears on this page. A unit that does not clear this stage is not listed.",
  },
  {
    Icon: PiUserCheck,
    title: "The owner is who they say they are",
    body: "Identity is confirmed against the title record. Viewings are arranged with the owner or their written representative, never through a chain of intermediaries.",
  },
  {
    Icon: PiChartLineUp,
    title: "The asking price is tested against the market",
    body: "We compare recent transactions in the same building and district. If the ask is out of step with what the market is paying, we tell the owner and we tell you.",
  },
  {
    Icon: PiHandshake,
    title: "Both sides know the terms before the viewing",
    body: "Service charge, outstanding levies and handover condition are documented up front, so nothing surfaces late in the negotiation.",
  },
];

export default async function SellPage() {
  const [{ data: listings }, { data: settings }] = await Promise.all([
    sanityFetch({ query: LISTINGS_BY_TYPE_QUERY, params: { listingType: "sell" } }),
    sanityFetch({ query: SITE_SETTINGS_QUERY }),
  ]);

  const items = (listings || []) as unknown as Listing[];

  return (
    <>
      <Navbar settings={settings} />

      <main className="bg-[#100b28] pt-[72px] text-[#efebe3]">
        {/* Hero: full width band */}
        <section className="relative flex min-h-[62vh] items-end overflow-hidden">
          <Image
            src={placeholderImage("kaara-sell-nairobi-resale-apartment", 2000, 1100)}
            alt="Interior of a resale apartment in Nairobi"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#100b28] via-[#100b28]/75 to-[#100b28]/35" />
          <div className="relative mx-auto w-full max-w-[1500px] px-5 pb-16 lg:px-10 lg:pb-20">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#4f9d8f]">Sell</p>
            <h1 className="mt-6 max-w-[16ch] font-serif text-4xl leading-[1.08] md:text-5xl lg:text-6xl">
              Resale units, vetted before they are listed.
            </h1>
            <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-white/70">
              Ownership and title are confirmed first. Only then does a unit reach this page.
            </p>
          </div>
        </section>

        {/* Vetting: vertical numbered stack, not a card row */}
        <section className="mx-auto max-w-[1500px] px-5 py-20 lg:px-10 lg:py-28">
          <h2 className="max-w-[20ch] font-serif text-3xl leading-tight sm:text-4xl">
            What owner vetted means here
          </h2>

          <div className="mt-14 divide-y divide-white/10 border-t border-white/10">
            {VETTING.map(({ Icon, title, body }, i) => (
              <Reveal key={title} index={i}>
                <div className="grid grid-cols-1 gap-6 py-10 lg:grid-cols-12 lg:gap-10">
                  <div className="lg:col-span-1">
                    <Icon size={28} className="text-[#4f9d8f]" aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-2xl leading-snug lg:col-span-5">{title}</h3>
                  <p className="max-w-[62ch] text-sm leading-relaxed text-white/60 lg:col-span-6">
                    {body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Listings */}
        <section className="border-t border-white/10 bg-[#0b0819]">
          <div className="mx-auto max-w-[1500px] px-5 py-20 lg:px-10 lg:py-28">
            <div className="mb-14 flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="font-serif text-3xl leading-tight sm:text-4xl">Available resales</h2>
              <p className="text-sm text-white/45 tabular-nums">
                {items.length} {items.length === 1 ? "unit" : "units"} on the market
              </p>
            </div>

            <ListingGrid
              listings={items}
              emptyTitle="No resale units are listed at the moment"
              emptyBody="Resales move quickly and we only publish units that have cleared vetting. Tell us the building or district you want and we will contact you when one becomes available."
            />
          </div>
        </section>

        {/* Tools */}
        <section className="mx-auto max-w-[1500px] border-t border-white/10 px-5 py-20 lg:px-10 lg:py-28">
          <ToolsPanel
            baseCurrency="KES"
            blurb="Resale asks are quoted in Kenyan shillings and floor areas in square metres. Convert both here before you compare a resale against a new release."
          />
        </section>

        {/* Owner side and viewing form */}
        <section className="border-t border-white/10 bg-[#0b0819]">
          <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-14 px-5 py-20 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-28">
            <div className="lg:col-span-5">
              <h2 className="max-w-[18ch] font-serif text-3xl leading-tight sm:text-4xl">
                Selling a unit of your own
              </h2>
              <p className="mt-5 max-w-[48ch] text-sm leading-relaxed text-white/60">
                We take a small number of resale mandates at a time so each one gets real attention.
                Send us the building, the unit and your title reference, and we will tell you
                honestly what it is worth today.
              </p>
              <ContactActions
                contact={settings?.contact}
                subject="listing a resale unit"
                variant="quiet"
                className="mt-8"
              />
            </div>
            <div className="lg:col-span-7">
              <EnquiryForm kind="viewing" />
            </div>
          </div>
        </section>
      </main>

      <Footer settings={settings} />
    </>
  );
}
