import "server-only";
import { client } from "@/sanity/lib/client";

export interface ListingInfo {
  title: string | null;
  listingType: string | null;
}

/** Tells a staycation from a sale. A CMS fault must never lose the lead. */
export async function listingInfo(slug: string | null | undefined): Promise<ListingInfo | null> {
  if (!slug) return null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await client.fetch<ListingInfo | null>(
        `*[_type == "property" && slug.current == $slug][0]{ title, listingType }`,
        { slug },
        { signal: AbortSignal.timeout(3500) }
      );
    } catch (error) {
      if (attempt === 2) console.error("Listing lookup failed:", error);
    }
  }
  return null;
}

export function slugFromText(text: string | null | undefined) {
  const match = text?.match(/\/properties\/([^\s?#]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]).replace(/[.,)]+$/, "");
  } catch {
    return null;
  }
}
