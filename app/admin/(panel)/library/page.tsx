import { sanityWriter } from "@/lib/sanityAdmin";
import LibraryApp, { type LibraryAsset } from "./LibraryApp";

export default async function LibraryPage() {
  const assets = await sanityWriter().fetch<LibraryAsset[]>(
    `*[_type in ["sanity.imageAsset", "sanity.fileAsset"]] | order(_createdAt desc)[0...400]{
      "id": _id, "kind": _type, url, "name": originalFilename, mimeType, size, "createdAt": _createdAt,
      "uses": count(*[references(^._id)])
    }`
  );
  return <LibraryApp initial={assets} />;
}
