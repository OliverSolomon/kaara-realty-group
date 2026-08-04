import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PortableText, type PortableTextBlock } from "@portabletext/react";
import { sanityFetch } from "@/sanity/lib/live";
import {
  ABOUT_QUERY,
  SITE_SETTINGS_QUERY,
  TESTIMONIALS_QUERY,
  DEVELOPERS_QUERY,
} from "@/sanity/lib/queries";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Testimonials, { type Testimonial } from "@/components/site/Testimonials";
import DeveloperWall, { type Developer } from "@/components/site/DeveloperWall";
import EnquiryForm from "@/components/site/EnquiryForm";
import Reveal from "@/components/site/Reveal";
import { placeholderImage } from "@/lib/site";

export const metadata: Metadata = {
  title: "World of Kaara | Kaara & Co Realty Group",
  description:
    "Kaara & Co Realty Group exists to restore trust in property investment in Nairobi through education, selective developer partnerships and long term after sales management.",
};

/** Shown until the World of Kaara document is filled in from the Studio. */
const FALLBACK = {
  headline: "We are building a new standard for property advisory.",
  standfirst:
    "Kaara & Co Realty Group is a young company with a specific ambition: to help redefine how Nairobi buys property, through trust, transparency and intelligent investment guidance.",
  mission: "To restore trust in property investment.",
  paragraphs: [
    "Over the last several years, many investors have approached this market with uncertainty. Questions around oversupply, delayed developments, poor after sales support and misaligned advice have made it harder to buy with confidence. Too often the market has been driven by short term transactions rather than long term client outcomes.",
    "We believe real estate should never be sold through pressure. It should be guided through insight.",
    "That is why our approach starts with education. We work closely with every client so they understand the market, can identify the opportunities that match their goals, and make decisions backed by strategy rather than speculation.",
    "Our partnerships are deliberately selective. We work only with developers who have a demonstrated record of delivery, who uphold high construction standards, and who stay committed to support after the sale. That lets us present opportunities we genuinely believe in: projects designed not only to appreciate, but to perform over time.",
    "Confidence in real estate is not built through promises. It is built through consistent delivery, honest guidance and measurable results.",
    "Kaara & Co Realty Group exists to fill a specific gap in this market: the need for a partner that places client outcomes above transactions. Because the future of real estate belongs to the companies that do more than sell property. It belongs to the ones that build trust.",
  ],
  commitments: [
    {
      label: "Units under management by 2029",
      value: "2,000",
      detail:
        "A managed property ecosystem that extends past acquisition, so owners benefit from occupancy performance and not only from the asset itself.",
    },
    {
      label: "Advisory model",
      value: "Education first",
      detail:
        "Every engagement begins with the market, the numbers and the risks, before any specific building is put on the table.",
    },
    {
      label: "Developer partnerships",
      value: "Selective",
      detail:
        "Delivery record, construction standard and post sale support are the three tests a developer has to pass before we represent them.",
    },
  ],
};

export default async function WorldOfKaaraPage() {
  const [{ data: about }, { data: settings }, { data: testimonials }, { data: developers }] =
    await Promise.all([
      sanityFetch({ query: ABOUT_QUERY }),
      sanityFetch({ query: SITE_SETTINGS_QUERY }),
      sanityFetch({ query: TESTIMONIALS_QUERY }),
      sanityFetch({ query: DEVELOPERS_QUERY }),
    ]);

  const headline = about?.headline || FALLBACK.headline;
  const standfirst = about?.standfirst || FALLBACK.standfirst;
  const mission = about?.mission || FALLBACK.mission;
  const commitments = about?.commitments?.length ? about.commitments : FALLBACK.commitments;
  const heroImage =
    about?.heroImageUrl || placeholderImage("kaara-world-nairobi-city-morning", 2000, 1100);

  return (
    <>
      <Navbar settings={settings} />

      <main className="bg-[#100b28] pt-[72px] text-[#efebe3]">
        {/* Hero */}
        <section className="mx-auto max-w-[1500px] px-5 pb-16 pt-16 lg:px-10 lg:pb-20 lg:pt-24">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#4f9d8f]">
            World of Kaara
          </p>
          <h1 className="mt-6 max-w-[18ch] font-serif text-4xl leading-[1.08] md:text-5xl lg:text-6xl">
            {headline}
          </h1>
          <p className="mt-6 max-w-[58ch] text-base leading-relaxed text-white/65">{standfirst}</p>
        </section>

        <section className="mx-auto max-w-[1500px] px-5 lg:px-10">
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#171232] lg:aspect-[21/9]">
            <Image
              src={heroImage}
              alt="Nairobi city skyline"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </section>

        {/* The story */}
        <section className="mx-auto max-w-[1500px] px-5 py-20 lg:px-10 lg:py-28">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <h2 className="font-serif text-3xl leading-tight sm:text-4xl">Why we exist</h2>
            </div>
            <div className="lg:col-span-8">
              {about?.body?.length ? (
                <div className="space-y-6 text-base leading-relaxed text-white/70 [&_p]:max-w-[68ch]">
                  <PortableText value={about.body as PortableTextBlock[]} />
                </div>
              ) : (
                <div className="space-y-6">
                  {FALLBACK.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 32)} className="max-w-[68ch] text-base leading-relaxed text-white/70">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="border-y border-white/10 bg-[#0b0819]">
          <div className="mx-auto max-w-[1500px] px-5 py-24 lg:px-10 lg:py-32">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#4f9d8f]">
              Our mission
            </p>
            <p className="mt-8 max-w-[16ch] font-serif text-4xl leading-[1.15] sm:text-5xl lg:text-6xl">
              {mission}
            </p>
          </div>
        </section>

        {/* Commitments */}
        <section className="mx-auto max-w-[1500px] px-5 py-20 lg:px-10 lg:py-28">
          <h2 className="max-w-[20ch] font-serif text-3xl leading-tight sm:text-4xl">
            What we are working toward
          </h2>

          <div className="mt-14 grid grid-cols-1 gap-px bg-white/10 md:grid-cols-3">
            {commitments.map((item: (typeof commitments)[number], i: number) => (
              <Reveal key={item?.label || i} index={i} className="bg-[#100b28]">
                <div className="flex h-full flex-col p-8 lg:p-10">
                  <p className="font-serif text-4xl leading-none text-[#efebe3] tabular-nums">
                    {item?.value}
                  </p>
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#4f9d8f]">
                    {item?.label}
                  </p>
                  <p className="mt-5 text-sm leading-relaxed text-white/60">{item?.detail}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        {testimonials && testimonials.length > 0 && (
          <section className="border-t border-white/10 bg-[#0b0819]">
            <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-12 px-5 py-20 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-28">
              <div className="lg:col-span-4">
                <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
                  From the people we have worked with
                </h2>
              </div>
              <div className="lg:col-span-8">
                <Testimonials testimonials={testimonials as unknown as Testimonial[]} />
              </div>
            </div>
          </section>
        )}

        {/* Partners */}
        {developers && developers.length > 0 && (
          <section className="mx-auto max-w-[1500px] border-t border-white/10 px-5 py-20 lg:px-10 lg:py-28">
            <h2 className="max-w-[20ch] font-serif text-3xl leading-tight sm:text-4xl">
              Developers we represent
            </h2>
            <DeveloperWall developers={developers as unknown as Developer[]} className="mt-12" />
          </section>
        )}

        {/* Consultation */}
        <section className="border-t border-white/10 bg-[#0b0819]">
          <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-14 px-5 py-20 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-28">
            <div className="lg:col-span-5">
              <h2 className="max-w-[18ch] font-serif text-3xl leading-tight sm:text-4xl">
                Start with a conversation, not a listing
              </h2>
              <p className="mt-5 max-w-[48ch] text-sm leading-relaxed text-white/60">
                Book a virtual tour of a specific building, or an investment consultation if you are
                still working out where your money should go.
              </p>
              <Link
                href="/market-insights"
                className="press mt-8 inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-[#4f9d8f] underline underline-offset-4"
              >
                Read our market insights
              </Link>
            </div>
            <div className="lg:col-span-7">
              <EnquiryForm kind="tour" />
            </div>
          </div>
        </section>
      </main>

      <Footer settings={settings} />
    </>
  );
}
