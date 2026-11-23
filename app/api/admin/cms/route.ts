import { adminFromRequest, audit } from "@/lib/auth/admin";
import { can } from "@/lib/auth/roles";
import { hasAnyShare, isSharedWith } from "@/lib/auth/shares";
import { sanityWriter } from "@/lib/sanityAdmin";
import {
  CmsError,
  deleteDocument,
  discardDraft,
  publishDocument,
  referenceTitle,
  saveDraft,
  searchReferences,
} from "@/lib/cms/server";

export const maxDuration = 30;

const text = (value: unknown, max = 200) => (typeof value === "string" ? value.slice(0, max) : "");

export async function POST(request: Request) {
  const admin = await adminFromRequest(request);
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const op = text(body.op, 30);
    const type = text(body.type, 60);
    const id = text(body.id, 130);
    const rev = typeof body.rev === "string" ? body.rev : null;
    const value = (body.value && typeof body.value === "object" ? body.value : {}) as Record<string, unknown>;

    if (!can(admin.role, "content")) {
      // A co-editor may save a draft of the shared item and read what its editor needs. Never publish or delete.
      const allowed = op === "save"
        ? await isSharedWith("content", `${type}:${id}`, admin.email)
        : ["references", "referenceTitle", "previewRefs"].includes(op) && (await hasAnyShare(admin.email, "content"));
      if (!allowed) return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    switch (op) {
      case "previewRefs": {
        const ids = Array.isArray(body.ids) ? body.ids.filter((item): item is string => typeof item === "string").slice(0, 60) : [];
        const rows = await sanityWriter().fetch<{ _id: string }[]>(
          `*[_id in $ids && _type in ["post", "property"]]{
            _id, _type, title, "slug": slug.current, details, "district": district->name,
            "imageUrl": coalesce(image.asset->url, image.externalUrl, media[_type == "image"][0].asset->url, media[_type == "externalImage"][0].url)
          }`,
          { ids }
        );
        return Response.json({ items: Object.fromEntries(rows.map((row) => [row._id, row])) });
      }
      case "save": {
        const doc = await saveDraft(type, id, value, rev);
        await audit(admin.email, "content.draft_saved", `${type}:${id}`);
        return Response.json({ doc });
      }
      case "publish": {
        const doc = await publishDocument(type, id, value, rev);
        await audit(admin.email, "content.published", `${type}:${id}`);
        return Response.json({ doc });
      }
      case "discard":
        await discardDraft(type, id);
        await audit(admin.email, "content.draft_discarded", `${type}:${id}`);
        return Response.json({ ok: true });
      case "delete":
        await deleteDocument(type, id);
        await audit(admin.email, "content.deleted", `${type}:${id}`);
        return Response.json({ ok: true });
      case "references": {
        const types = Array.isArray(body.types) ? body.types.map(String).slice(0, 10) : [];
        return Response.json({ items: await searchReferences(types, text(body.search, 60).trim()) });
      }
      case "referenceTitle":
        return Response.json({ title: await referenceTitle(id) });
      default:
        return Response.json({ error: "Unknown operation." }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof CmsError) return Response.json({ error: error.message }, { status: error.status });
    const conflict = (error as { statusCode?: number })?.statusCode === 409;
    if (conflict) return Response.json({ error: "Someone changed this while you were editing. Reload to get the latest version." }, { status: 409 });
    console.error("Content API error:", error);
    return Response.json({ error: "The content service could not complete that." }, { status: 502 });
  }
}
