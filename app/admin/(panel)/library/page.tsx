import { requireAdmin } from "@/lib/auth/admin";
import { getPool } from "@/lib/db";
import { sanityWriter } from "@/lib/sanityAdmin";
import LibraryApp, { type DesignOption, type LibraryAsset, type PropertyFolder } from "./LibraryApp";

export default async function LibraryPage() {
  await requireAdmin("library");
  const client = sanityWriter();
  const [assets, properties, designs] = await Promise.all([
    client.fetch<LibraryAsset[]>(
      `*[_type in ["sanity.imageAsset", "sanity.fileAsset"]] | order(_createdAt desc)[0...2000]{
        "id": _id, "kind": _type, url, "name": originalFilename, mimeType, size, "createdAt": _createdAt,
        "width": metadata.dimensions.width, "height": metadata.dimensions.height,
        "uses": count(*[references(^._id)])
      }`
    ),
    client.fetch<PropertyFolder[]>(
      `*[_type == "property" && !(_id in path("drafts.**"))] | order(title asc){
        "id": _id, title, listingType, bedrooms, location, "district": district->name,
        "assetIds": array::unique(array::compact([image.asset._ref] + coalesce(media[_type == "image"].asset._ref, [])))
      }`
    ),
    getPool()?.query<DesignOption>("SELECT id, name, width, height FROM designs ORDER BY updated_at DESC LIMIT 100"),
  ]);
  return <LibraryApp initial={assets} properties={properties} designs={designs?.rows ?? []} />;
}
