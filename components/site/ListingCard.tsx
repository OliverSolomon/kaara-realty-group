"use client";

import Image from "next/image";
import Link from "next/link";
import { PiEye, PiSealCheck, PiArrowUpRight } from "react-icons/pi";
import { useCurrency } from "@/context/CurrencyContext";
import {
  FACING_LABELS,
  PROPERTY_TYPE_LABELS,
  formatArea,
  placeholderImage,
  sqmToSqft,
  type ListingType,
} from "@/lib/site";

export interface Listing {
  _id: string;
  title: string;
  slug: string;
  buildingName?: string;
  listingType?: ListingType;
  price?: { amount?: string; currency?: string };
  dailyRate?: { amount?: number; currency?: string };
  imageUrl?: string;
  county?: string;
  district?: string;
  developer?: { name?: string; slug?: string };
  details?: string;
  propertyType?: string[];
  shortDescription?: string;
  amenities?: string[];
  size?: string;
  sizeSqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: string;
  ownerVetted?: boolean;
  floorNumber?: string;
  facingDirection?: string;
  viewCount?: number;
  virtualTourUrl?: string;
}

interface ListingCardProps {
  listing: Listing;
  /** Only the first row should preload its photograph. */
  priority?: boolean;
}

export default function ListingCard({ listing, priority = false }: ListingCardProps) {
  const { formatPrice } = useCurrency();
  const isStay = listing.listingType === "stay";

  const image = listing.imageUrl || placeholderImage(listing.slug || listing._id, 1200, 900);
  const place = [listing.district, listing.county].filter(Boolean).join(", ");

  const priceLabel = isStay
    ? listing.dailyRate?.amount
      ? `${formatPrice(listing.dailyRate.amount, listing.dailyRate.currency || "KES")} a night`
      : "Rate on request"
    : listing.price?.amount
      ? formatPrice(listing.price.amount, listing.price.currency || "KES")
      : "Price on request";

  const specs = isStay
    ? [
        listing.floorNumber,
        listing.facingDirection ? FACING_LABELS[listing.facingDirection] : undefined,
        listing.bedrooms ? `${listing.bedrooms} bed` : undefined,
      ].filter(Boolean)
    : [
        listing.bedrooms ? `${listing.bedrooms} bed` : undefined,
        listing.bathrooms ? `${listing.bathrooms} bath` : undefined,
        listing.sizeSqm
          ? `${formatArea(listing.sizeSqm)} sqm / ${formatArea(sqmToSqft(listing.sizeSqm))} sqft`
          : listing.size,
      ].filter(Boolean);

  return (
    <article className="hover-lift group flex h-full flex-col">
      <Link href={`/properties/${listing.slug}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#171232]">
          <Image
            src={image}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            priority={priority}
            className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.04]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#100b28]/70 via-transparent to-transparent" />
        </div>
      </Link>

      <div className="flex flex-1 flex-col pt-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">
            {place || "Nairobi"}
          </p>
          {typeof listing.viewCount === "number" && listing.viewCount > 0 && (
            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-white/40 tabular-nums">
              <PiEye size={13} aria-hidden="true" />
              {listing.viewCount} views
            </p>
          )}
        </div>

        <h3 className="font-serif text-2xl leading-tight text-[#efebe3]">
          <Link href={`/properties/${listing.slug}`} className="transition-colors duration-200 hover:text-[#4f9d8f]">
            {listing.title}
          </Link>
        </h3>

        {listing.buildingName && listing.buildingName !== listing.title && (
          <p className="mt-1 text-sm text-white/45">{listing.buildingName}</p>
        )}

        <p className="mt-4 font-serif text-xl text-[#efebe3] tabular-nums">{priceLabel}</p>

        {specs.length > 0 && (
          <p className="mt-3 text-sm leading-relaxed text-white/55">{specs.join("  ·  ")}</p>
        )}

        {listing.ownerVetted && (
          <p className="mt-4 inline-flex w-fit items-center gap-2 border border-[#2e7d6f]/50 bg-[#2e7d6f]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#4f9d8f]">
            <PiSealCheck size={14} aria-hidden="true" />
            Owner vetted
          </p>
        )}

        {listing.propertyType?.length ? (
          <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-white/35">
            {listing.propertyType
              .map((t) => PROPERTY_TYPE_LABELS[t] ?? t)
              .join(", ")}
          </p>
        ) : null}

        <Link
          href={`/properties/${listing.slug}`}
          className="press mt-auto inline-flex items-center gap-2 pt-6 text-[10px] font-bold uppercase tracking-[0.25em] text-[#4f9d8f]"
        >
          View listing
          <PiArrowUpRight
            size={14}
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
      </div>
    </article>
  );
}
