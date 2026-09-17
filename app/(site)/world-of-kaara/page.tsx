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
import { sanityImage } from "@/lib/sanityImage";

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

interface GalleryItem {
  url?: string | null;
  alt?: string | null;
  caption?: string | null;
}

export default async function WorldOfKaaraPage() {
  const [{ data: about }, { data: settings }, { data: testimonials }, { data: developers }] =
    await Promise.all([
      sanityFetch({ query: ABOUT_QUERY }),
      sanityFetch({ query: SITE_SETTINGS_QUERY }),
      sanityFetch({ query: TESTIMONIALS_QUERY }),
      sanityFetch({ query: DEVELOPERS_QUERY }),
    ]);

  const eyebrow = about?.eyebrow || "World of Kaara";
  const headline = about?.headline || FALLBACK.headline;
  const standfirst = about?.standfirst || FALLBACK.standfirst;
  const storyHeading = about?.storyHeading || "Why we exist";
  const missionEyebrow = about?.missionEyebrow || "Our mission";
  const mission = about?.mission || FALLBACK.mission;
  const commitmentsHeading = about?.commitmentsHeading || "What we are working toward";
  const commitments = about?.commitments?.length ? about.commitments : FALLBACK.commitments;
  // Developers picked on the World of Kaara page, in the editor's order. If none
  // are picked, every developer partner is shown. Deleted references are skipped.
  const picked = ((about?.partners ?? []) as (Developer | null)[]).filter(
    (d): d is Developer => Boolean(d?._id && d?.name)
  );
  const partners: Developer[] = picked.length
    ? picked
    : ((developers ?? []) as unknown as Developer[]);
  const gallery = ((about?.gallery || []) as GalleryItem[]).filter((item) => Boolean(item?.url));
  // Honour the crop and focal point set in the Studio.
  const hero = sanityImage({
    url: about?.heroImageUrl || placeholderImage("kaara-world-nairobi-city-morning", 2400, 1350),
    crop: about?.heroImageCrop,
    hotspot: about?.heroImageHotspot,
    dimensions: about?.heroImageDimensions,
  })!;
  const story = sanityImage({
    url: about?.storyImageUrl,
    crop: about?.storyImageCrop,
    hotspot: about?.storyImageHotspot,
    dimensions: about?.storyImageDimensions,
  });

  return (
    <>
      <Navbar settings={settings} />

      <main className="bg-[#100b28] pt-[72px] text-[#efebe3]">
        {/* Hero. The photograph now sits at the very top, full width, with the
            headline set over it. It used to be a separate banner below the
            text, cropped to a thin strip that cut through the subject. */}
        <section className="relative isolate flex min-h-[72svh] items-end overflow-hidden bg-[#171232] lg:min-h-[82vh]">
          <Image
            src={hero.src}
            alt={about?.heroImageAlt || "Nairobi skyline seen across Nairobi National Park"}
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover"
            style={{ objectPosition: hero.objectPosition }}
          />
          {/* Scrim: darkens the lower half for the text and fades into the page. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,#100b28_0%,rgba(16,11,40,0.82)_28%,rgba(16,11,40,0.35)_60%,rgba(16,11,40,0.15)_100%)]"
          />
          <div className="mx-auto w-full max-w-[1500px] px-5 pb-12 pt-28 sm:pb-14 sm:pt-32 lg:px-10 lg:pb-20">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6fc2b3]">
              {eyebrow}
            </p>
            <h1 className="mt-5 max-w-[18ch] font-serif text-[2rem] leading-[1.1] text-white min-[380px]:text-4xl md:text-5xl lg:text-6xl">
              {headline}
            </h1>
            <p className="mt-5 max-w-[58ch] text-[15px] leading-relaxed text-white/80 sm:text-base">{standfirst}</p>
          </div>
        </section>

        {/* The story. The photograph, when one is set, runs as a wide banner
            above the narrative on every screen size. It used to sit as a tall
            portrait under the heading, which left a large empty gap beside
            the text and disappeared entirely on mobile. */}
        <section className="mx-auto max-w-[1500px] px-5 py-20 lg:px-10 lg:py-28">
          {story && (
            <Reveal className="mb-12 lg:mb-16">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#171232] sm:aspect-[16/9] lg:aspect-[5/2]">
                <Image
                  src={story.src}
                  alt={about?.storyImageAlt || storyHeading}
                  fill
                  sizes="(max-width: 1500px) 100vw, 1500px"
                  className="object-cover"
                  style={{ objectPosition: story.objectPosition }}
                />
              </div>
            </Reveal>
          )}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <h2 className="font-serif text-3xl leading-tight sm:text-4xl lg:sticky lg:top-28">
                {storyHeading}
              </h2>
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
        <section className="relative border-y border-white/10 bg-[#0b0819]">
          {about?.missionImageUrl && (
            <>
              <Image
                src={about.missionImageUrl}
                alt=""
                aria-hidden="true"
                fill
                sizes="100vw"
                className="object-cover opacity-25"
              />
              <div className="absolute inset-0 bg-[#0b0819]/70" />
            </>
          )}
          <div className="relative mx-auto max-w-[1500px] px-5 py-24 lg:px-10 lg:py-32">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#4f9d8f]">
              {missionEyebrow}
            </p>
            <p className="mt-8 max-w-[16ch] font-serif text-4xl leading-[1.15] sm:text-5xl lg:text-6xl">
              {mission}
            </p>
          </div>
        </section>

        {/* Commitments */}
        <section className="mx-auto max-w-[1500px] px-5 py-20 lg:px-10 lg:py-28">
          <h2 className="max-w-[20ch] font-serif text-3xl leading-tight sm:text-4xl">
            {commitmentsHeading}
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

        {/* Gallery. Appears only once photographs are added in the Studio. */}
        {gallery.length > 0 && (
          <section className="border-t border-white/10 bg-[#0b0819]">
            <div className="mx-auto max-w-[1500px] px-5 py-20 lg:px-10 lg:py-28">
              <h2 className="max-w-[20ch] font-serif text-3xl leading-tight sm:text-4xl">
                {about?.galleryHeading || "Inside the work"}
              </h2>
              {about?.galleryIntro && (
                <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-white/60">
                  {about.galleryIntro}
                </p>
              )}
              <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {gallery.map((item: GalleryItem, i: number) => (
                  <Reveal as="li" key={item.url || i} index={i}>
                    <figure>
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#171232]">
                        <Image
                          src={item.url as string}
                          alt={item.alt || item.caption || "Kaara & Co"}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-[1.03]"
                        />
                      </div>
                      {item.caption && (
                        <figcaption className="mt-3 text-xs leading-relaxed text-white/45">
                          {item.caption}
                        </figcaption>
                      )}
                    </figure>
                  </Reveal>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Testimonials */}
        {testimonials && testimonials.length > 0 && (
          <section className="border-t border-white/10 bg-[#0b0819]">
            <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-12 px-5 py-20 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-28">
              <div className="lg:col-span-4">
                <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
                  {about?.testimonialsHeading || "From the people we have worked with"}
                </h2>
              </div>
              <div className="lg:col-span-8">
                <Testimonials testimonials={testimonials as unknown as Testimonial[]} />
              </div>
            </div>
          </section>
        )}

        {/* Partners */}
        {partners.length > 0 && (
          <section className="mx-auto max-w-[1500px] border-t border-white/10 px-5 py-16 sm:py-20 lg:px-10 lg:py-28">
            <h2 className="max-w-[20ch] font-serif text-3xl leading-tight sm:text-4xl">
              {about?.partnersHeading || "Developers we represent"}
            </h2>
            {about?.partnersIntro && (
              <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-white/60">
                {about.partnersIntro}
              </p>
            )}
            <DeveloperWall developers={partners} className="mt-10 sm:mt-12" />
          </section>
        )}

        {/* Consultation */}
        <section className="border-t border-white/10 bg-[#0b0819]">
          <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-14 px-5 py-20 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-28">
            <div className="lg:col-span-5">
              <h2 className="max-w-[18ch] font-serif text-3xl leading-tight sm:text-4xl">
                {about?.ctaHeading || "Start with a conversation, not a listing"}
              </h2>
              <p className="mt-5 max-w-[48ch] text-sm leading-relaxed text-white/60">
                {about?.ctaBody ||
                  "Book a virtual tour of a specific building, or an investment consultation if you are still working out where your money should go."}
              </p>
              <Link
                href={about?.ctaLinkHref || "/market-insights"}
                className="press mt-8 inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-[#4f9d8f] underline underline-offset-4"
              >
                {about?.ctaLinkLabel || "Read our market insights"}
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
