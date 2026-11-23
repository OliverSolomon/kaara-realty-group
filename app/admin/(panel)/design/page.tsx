import { requireAdmin } from "@/lib/auth/admin";
import type { EstateListing, EstatePhoto } from "@/lib/design/estateTemplates";
import { getPool } from "@/lib/db";
import { sanityWriter } from "@/lib/sanityAdmin";
import DesignHome, { type DesignCard } from "./DesignHome";

export default async function DesignPage() {
  await requireAdmin("design");
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not configured");
  const asset = `{ url, "width": metadata.dimensions.width, "height": metadata.dimensions.height }`;
  const [{ rows }, properties] = await Promise.all([
    pool.query<DesignCard & { updated_at: Date }>(
      "SELECT id, name, width, height, thumbnail_url AS thumbnail, updated_at FROM designs ORDER BY updated_at DESC LIMIT 200"
    ),
    sanityWriter().fetch<(Omit<EstateListing, "photos"> & { cover: EstatePhoto | null; gallery: (EstatePhoto | null)[] | null })[]>(
      `*[_type == "property" && !(_id in path("drafts.**"))] | order(_updatedAt desc)[0...300]{
        "id": _id, title, "slug": slug.current, listingType, propertyType, bedrooms, bathrooms, sizeSqm, location,
        "district": district->name, "priceAmount": price.amount, "currency": price.currency,
        "rate": dailyRate.amount, "rateCurrency": dailyRate.currency,
        "cover": image.asset->${asset},
        "gallery": media[_type == "image"][0...7].asset->${asset}
      }`
    ),
  ]);
  const listings: EstateListing[] = properties
    .map(({ cover, gallery, ...property }) => {
      const photos = [cover, ...(gallery ?? [])].filter((photo): photo is EstatePhoto => Boolean(photo?.url && photo.width && photo.height));
      return { ...property, photos: photos.filter((photo, index) => photos.findIndex((item) => item.url === photo.url) === index).slice(0, 6) };
    })
    .filter((listing) => listing.photos.length > 0);
  return <DesignHome listings={listings} initial={rows.map(({ updated_at, ...row }) => ({ ...row, updatedAt: new Date(updated_at).toISOString() }))} />;
}
