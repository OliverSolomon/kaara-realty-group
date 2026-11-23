import "server-only";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";

let writer: ReturnType<typeof createClient> | null = null;

/** Sees drafts and can write. It must never be imported into browser code. */
export function sanityWriter() {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) throw new Error("SANITY_API_WRITE_TOKEN is not configured");
  writer ??= createClient({ projectId, dataset, apiVersion, token, useCdn: false, perspective: "raw" });
  return writer;
}

/** Turns a Sanity CDN address back into the asset reference a document stores. */
export function assetRefFromUrl(url: string) {
  const match = url.match(/cdn\.sanity\.io\/images\/[^/]+\/[^/]+\/([a-f0-9]+-\d+x\d+)\.([a-z0-9]+)/i);
  return match ? `image-${match[1]}-${match[2]}` : null;
}
