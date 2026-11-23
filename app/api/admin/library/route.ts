import { adminFromRequest, audit } from "@/lib/auth/admin";
import { sanityWriter } from "@/lib/sanityAdmin";

export async function POST(request: Request) {
  const admin = await adminFromRequest(request);
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { op?: string; id?: string };
  if (body.op !== "delete" || !/^(image|file)-[A-Za-z0-9-]+$/.test(body.id ?? "")) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  try {
    const client = sanityWriter();
    const uses = await client.fetch<number>("count(*[references($id)])", { id: body.id });
    if (uses) return Response.json({ error: `This file is used in ${uses} place${uses === 1 ? "" : "s"}. Remove it there first.` }, { status: 409 });
    await client.delete(body.id!);
    await audit(admin.email, "asset.deleted", body.id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Library delete failed:", error);
    return Response.json({ error: "The file could not be deleted." }, { status: 502 });
  }
}
