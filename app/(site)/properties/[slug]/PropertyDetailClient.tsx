"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { PortableText, type PortableTextBlock } from "@portabletext/react";
import {
  PiArrowLeft,
  PiCaretLeft,
  PiCaretRight,
  PiEye,
  PiSealCheck,
  PiPlayCircle,
  PiFilePdf,
  PiCube,
  PiMapPin,
} from "react-icons/pi";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AmenityGrid from "@/components/site/AmenityGrid";
import AreaConverter from "@/components/site/AreaConverter";
import CurrencyConverter from "@/components/site/CurrencyConverter";
import EnquiryForm from "@/components/site/EnquiryForm";
import ContactActions from "@/components/site/ContactActions";
import ListingCard, { type Listing } from "@/components/site/ListingCard";
import Reveal from "@/components/site/Reveal";
import { useCurrency } from "@/context/CurrencyContext";
import {
  FACING_LABELS,
  PROPERTY_TYPE_LABELS,
  formatArea,
  placeholderImage,
  sqmToSqft,
} from "@/lib/site";
import { extractCoordsFromGoogleMapsUrl } from "@/lib/geocoding";

const PropertyMap = dynamic(() => import("@/components/PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#171232] text-[10px] uppercase tracking-[0.25em] text-white/30">
      Loading map
    </div>
  ),
});

interface MediaItem {
  _type?: string;
  url?: string;
  alt?: string;
  caption?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Property = any;

export default function PropertyDetailClient({ property }: { property: Property }) {
  const { formatPrice } = useCurrency();
  const [activeIndex, setActiveIndex] = useState(0);

  const settings = property?.siteSettings;
  const isStay = property?.listingType === "stay";

  const gallery: MediaItem[] = useMemo(() => {
    const media: MediaItem[] = (property?.media || []).filter((m: MediaItem) => m?.url);
    if (property?.imageUrl && !media.some((m) => m.url === property.imageUrl)) {
      media.unshift({ _type: "image", url: property.imageUrl, alt: property.title });
    }
    if (media.length === 0) {
      media.push({
        _type: "image",
        url: placeholderImage(property?.slug || "kaara-listing", 1600, 1000),
        alt: property?.title,
      });
    }
    return media;
  }, [property]);

  const active = gallery[Math.min(activeIndex, gallery.length - 1)];
  const isVideo = active?._type === "externalVideo";

  const coords = property?.googleMapsUrl
    ? extractCoordsFromGoogleMapsUrl(property.googleMapsUrl)
    : null;

  const priceLabel = isStay
    ? property?.dailyRate?.amount
      ? `${formatPrice(property.dailyRate.amount, property.dailyRate.currency || "KES")} a night`
      : "Rate on request"
    : property?.price?.amount
      ? formatPrice(property.price.amount, property.price.currency || "KES")
      : "Price on request";

  const facts = [
    property?.bedrooms ? { label: "Bedrooms", value: String(property.bedrooms) } : null,
    property?.bathrooms ? { label: "Bathrooms", value: String(property.bathrooms) } : null,
    property?.sizeSqm
      ? {
          label: "Floor area",
          value: `${formatArea(property.sizeSqm)} sqm / ${formatArea(sqmToSqft(property.sizeSqm))} sqft`,
        }
      : property?.size
        ? { label: "Size", value: property.size }
        : null,
    property?.floorNumber ? { label: "Floor", value: property.floorNumber } : null,
    property?.facingDirection
      ? { label: "Aspect", value: FACING_LABELS[property.facingDirection] || property.facingDirection }
      : null,
    property?.yearBuilt ? { label: "Handover", value: property.yearBuilt } : null,
    property?.propertyType?.length
      ? {
          label: "Type",
          value: property.propertyType
            .map((t: string) => PROPERTY_TYPE_LABELS[t] ?? t)
            .join(", "),
        }
      : null,
    property?.developer?.name ? { label: "Developer", value: property.developer.name } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const place = [property?.district?.name || property?.district, property?.county]
    .filter(Boolean)
    .join(", ");

  const enquiryKind = isStay ? "booking" : property?.listingType === "sell" ? "viewing" : "buy";

  return (
    <>
      <Navbar settings={settings} />

      <main className="bg-[#100b28] pt-[72px] text-[#efebe3]">
        {/* Gallery */}
        <section className="relative">
          <div className="relative aspect-[4/3] w-full bg-[#171232] sm:aspect-[16/9] lg:aspect-[21/9]">
            {isVideo ? (
              <div className="flex h-full w-full items-center justify-center">
                <a
                  href={active.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press inline-flex items-center gap-3 border border-white/30 px-8 py-4 text-[10px] font-bold uppercase tracking-[0.25em] text-[#efebe3] hover:border-[#4f9d8f]"
                >
                  <PiPlayCircle size={20} aria-hidden="true" />
                  Play the walkthrough
                </a>
              </div>
            ) : (
              <Image
                src={active?.url as string}
                alt={active?.alt || property?.title || "Property photograph"}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            )}

            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={() =>
                    setActiveIndex((i) => (i === 0 ? gallery.length - 1 : i - 1))
                  }
                  className="press absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/25 bg-[#100b28]/60 text-[#efebe3] backdrop-blur-sm transition-colors duration-200 hover:bg-[#100b28]/90"
                >
                  <PiCaretLeft size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={() => setActiveIndex((i) => (i + 1) % gallery.length)}
                  className="press absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/25 bg-[#100b28]/60 text-[#efebe3] backdrop-blur-sm transition-colors duration-200 hover:bg-[#100b28]/90"
                >
                  <PiCaretRight size={18} />
                </button>
              </>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="mx-auto flex max-w-[1500px] gap-3 overflow-x-auto px-5 py-4 lg:px-10">
              {gallery.map((item, i) => (
                <button
                  key={`${item.url}-${i}`}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Show image ${i + 1}`}
                  aria-current={i === activeIndex}
                  className={`press relative h-16 w-24 shrink-0 overflow-hidden border transition-colors duration-200 ${
                    i === activeIndex ? "border-[#4f9d8f]" : "border-transparent opacity-55"
                  }`}
                >
                  {item.url && (
                    <Image
                      src={item.url}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Headline block */}
        <section className="mx-auto max-w-[1500px] px-5 py-14 lg:px-10 lg:py-20">
          <Link
            href={`/${property?.listingType || "buy"}`}
            className="press inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#4f9d8f]"
          >
            <PiArrowLeft size={13} aria-hidden="true" />
            Back to {property?.listingType || "buy"}
          </Link>

          <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <p className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
                {place && (
                  <span className="inline-flex items-center gap-1.5">
                    <PiMapPin size={13} aria-hidden="true" />
                    {place}
                  </span>
                )}
                {typeof property?.viewCount === "number" && property.viewCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <PiEye size={13} aria-hidden="true" />
                    {property.viewCount} recorded views
                  </span>
                )}
              </p>

              <h1 className="mt-5 max-w-[20ch] font-serif text-4xl leading-[1.1] md:text-5xl">
                {property?.title}
              </h1>

              {property?.buildingName && property.buildingName !== property.title && (
                <p className="mt-3 text-base text-white/50">{property.buildingName}</p>
              )}

              {property?.shortDescription && (
                <p className="mt-6 max-w-[62ch] text-base leading-relaxed text-white/70">
                  {property.shortDescription}
                </p>
              )}

              {property?.ownerVetted && (
                <p className="mt-7 inline-flex items-center gap-2 border border-[#2e7d6f]/50 bg-[#2e7d6f]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#4f9d8f]">
                  <PiSealCheck size={15} aria-hidden="true" />
                  Ownership and title verified
                </p>
              )}
            </div>

            <aside className="lg:col-span-5">
              <div className="border border-white/10 p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">
                  {isStay ? "Nightly rate" : "Asking price"}
                </p>
                <p className="mt-3 font-serif text-4xl leading-none tabular-nums">{priceLabel}</p>

                <ContactActions
                  contact={settings?.contact}
                  subject={property?.title}
                  className="mt-8"
                />

                <a
                  href="#enquire"
                  className="press mt-4 block border border-white/20 py-3.5 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-[#efebe3] transition-colors duration-200 hover:border-[#4f9d8f]"
                >
                  {isStay ? "Check availability" : "Request the listing pack"}
                </a>

                {property?.virtualTourUrl && (
                  <a
                    href={property.virtualTourUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press mt-4 flex items-center justify-center gap-2 border border-white/20 py-3.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#efebe3] transition-colors duration-200 hover:border-[#4f9d8f]"
                  >
                    <PiCube size={15} aria-hidden="true" />
                    Take the virtual tour
                  </a>
                )}
              </div>
            </aside>
          </div>
        </section>

        {/* Facts */}
        {facts.length > 0 && (
          <section className="border-y border-white/10 bg-[#0b0819]">
            <div className="mx-auto max-w-[1500px] px-5 py-14 lg:px-10 lg:py-16">
              <dl className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
                      {fact.label}
                    </dt>
                    <dd className="mt-2 text-sm leading-relaxed text-[#efebe3]">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        )}

        {/* Description */}
        {property?.longDescription?.length ? (
          <section className="mx-auto max-w-[1500px] px-5 py-20 lg:px-10 lg:py-24">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
              <h2 className="font-serif text-3xl leading-tight lg:col-span-4">About this home</h2>
              <div className="space-y-6 text-base leading-relaxed text-white/70 lg:col-span-8 [&_p]:max-w-[68ch]">
                <PortableText value={property.longDescription as PortableTextBlock[]} />
              </div>
            </div>
          </section>
        ) : null}

        {/* Amenities */}
        {property?.amenities?.length ? (
          <section className="border-t border-white/10 bg-[#0b0819]">
            <div className="mx-auto max-w-[1500px] px-5 py-20 lg:px-10 lg:py-24">
              <h2 className="font-serif text-3xl leading-tight sm:text-4xl">Amenities</h2>
              <AmenityGrid amenities={property.amenities} className="mt-12" />
            </div>
          </section>
        ) : null}

        {/* Map */}
        {coords && (
          <section className="border-t border-white/10">
            <div className="h-[440px] w-full">
              <PropertyMap
                properties={[
                  {
                    _id: property._id,
                    title: property.title,
                    coords,
                    price: priceLabel,
                    imageUrl: property.imageUrl,
                    district: property.district?.name || property.district,
                  },
                ]}
                center={[coords.lat, coords.lng]}
                zoom={15}
              />
            </div>
          </section>
        )}

        {/* Tools */}
        <section className="border-t border-white/10">
          <div className="mx-auto max-w-[1500px] px-5 py-20 lg:px-10 lg:py-24">
            <h2 className="font-serif text-3xl leading-tight sm:text-4xl">Run the numbers</h2>
            <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-white/60">
              This listing is quoted in Kenyan shillings and square metres. Convert both into the
              units you work in.
            </p>

            <div className="mt-12 grid grid-cols-1 gap-px bg-white/10 lg:grid-cols-2">
              <div className="bg-[#100b28] p-8 lg:p-10">
                <h3 className="mb-8 text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">
                  Currency
                </h3>
                <CurrencyConverter
                  amount={
                    isStay
                      ? property?.dailyRate?.amount
                      : Number(String(property?.price?.amount || "").replace(/[^0-9.]/g, "")) ||
                        undefined
                  }
                  baseCurrency={
                    (isStay ? property?.dailyRate?.currency : property?.price?.currency) || "KES"
                  }
                />
              </div>
              <div className="bg-[#100b28] p-8 lg:p-10">
                <h3 className="mb-8 text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">
                  Floor area
                </h3>
                <AreaConverter initialSqm={property?.sizeSqm} />
              </div>
            </div>
          </div>
        </section>

        {/* Verification documents */}
        {property?.verificationDocuments?.length ? (
          <section className="border-t border-white/10 bg-[#0b0819]">
            <div className="mx-auto max-w-[1500px] px-5 py-16 lg:px-10 lg:py-20">
              <h2 className="font-serif text-2xl leading-tight">Verification documents</h2>
              <ul className="mt-8 divide-y divide-white/10 border-t border-white/10">
                {property.verificationDocuments.map((doc: MediaItem & { originalFilename?: string }, i: number) => (
                  <li key={`${doc.url}-${i}`}>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="press flex items-center gap-4 py-4 text-sm text-white/70 transition-colors duration-200 hover:text-[#4f9d8f]"
                    >
                      <PiFilePdf size={18} aria-hidden="true" />
                      {doc.originalFilename || `Document ${i + 1}`}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {/* Enquiry */}
        <section id="enquire" className="border-t border-white/10">
          <div className="mx-auto max-w-[1500px] px-5 py-20 lg:px-10 lg:py-28">
            <EnquiryForm kind={enquiryKind} listing={property?.title} />
          </div>
        </section>

        {/* Similar */}
        {property?.similarProperties?.length ? (
          <section className="border-t border-white/10 bg-[#0b0819]">
            <div className="mx-auto max-w-[1500px] px-5 py-20 lg:px-10 lg:py-24">
              <h2 className="font-serif text-3xl leading-tight sm:text-4xl">Also worth seeing</h2>
              <ul className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-4">
                {property.similarProperties.map((item: Listing, i: number) => (
                  <Reveal as="li" key={item._id} index={i}>
                    <ListingCard listing={item} />
                  </Reveal>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </main>

      <Footer settings={settings} />
    </>
  );
}
