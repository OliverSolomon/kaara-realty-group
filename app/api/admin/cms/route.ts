import { adminFromRequest, audit } from "@/lib/auth/admin";
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

    switch (op) {
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
