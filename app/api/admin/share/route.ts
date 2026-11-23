import { adminFromRequest, audit, isOwnerEmail } from "@/lib/auth/admin";
import { ensureLogin, syncLogin } from "@/lib/auth/logins";
import { can } from "@/lib/auth/roles";
import type { ShareKind } from "@/lib/auth/shares";
import { getDocument } from "@/lib/cms/server";
import { CMS_TYPES, HIDDEN_TYPES } from "@/lib/cms/types";
import { getPool } from "@/lib/db";

const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (value: unknown, max = 200) => (typeof value === "string" ? value.slice(0, max) : "");
const bad = (error: string, status = 400) => Response.json({ error }, { status });

function db() {
  const pool = getPool();
  if (!pool) throw new Error("The database is not configured.");
  return pool;
}

/** Confirms the item exists and returns its current title. */
async function itemTitle(kind: ShareKind, itemId: string) {
  if (kind === "design") {
    if (!UUID_RE.test(itemId)) return null;
    const { rows } = await db().query<{ name: string }>("SELECT name FROM designs WHERE id = $1", [itemId]);
    return rows[0]?.name ?? null;
  }
  const at = itemId.indexOf(":");
  const type = itemId.slice(0, at);
  const id = itemId.slice(at + 1);
  if (at < 1 || !CMS_TYPES[type] || HIDDEN_TYPES.has(type)) return null;
  const { current } = await getDocument(type, id);
  if (!current) return null;
  const doc = current as { title?: unknown; name?: unknown };
  return String(doc.title ?? doc.name ?? CMS_TYPES[type].title).slice(0, 160);
}

async function people(kind: ShareKind, itemId: string) {
  const { rows } = await db().query<{ email: string; ready: boolean }>(
    `SELECT s.email, EXISTS (SELECT 1 FROM staff_users u WHERE u.email = s.email AND u.active) AS ready
     FROM shared_items s WHERE s.kind = $1 AND s.item_id = $2 ORDER BY s.created_at`,
    [kind, itemId]
  );
  return rows.map((row) => ({ email: row.email, ready: row.ready || isOwnerEmail(row.email) }));
}

export async function POST(request: Request) {
  const admin = await adminFromRequest(request);
  if (!admin) return bad("Unauthorized", 401);
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const op = text(body.op, 20);
    const kind = body.kind === "design" ? "design" : body.kind === "content" ? "content" : null;
    const itemId = text(body.itemId, 200);
    if (!kind || !itemId) return bad("Invalid item.");
    // Only people whose role covers the module can invite others. Co-editors cannot re-share.
    if (!can(admin.role, kind)) return bad("Unauthorized", 401);
    const title = await itemTitle(kind, itemId);
    if (!title) return bad("Save this item before sharing it.", 404);

    if (op === "list") return Response.json({ people: await people(kind, itemId) });

    const email = text(body.email, 200).trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return bad("Enter a valid email address.");

    if (op === "add") {
      if (email === admin.email) return bad("You already have access.");
      await db().query(
        `INSERT INTO shared_items (kind, item_id, email, title, created_by) VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (kind, item_id, email) DO UPDATE SET title = EXCLUDED.title`,
        [kind, itemId, email, title, admin.email]
      );
      let tempPassword: string | undefined;
      let needsLogin = false;
      if (!isOwnerEmail(email)) {
        const known = await db().query("SELECT 1 FROM staff_users WHERE email = $1", [email]);
        if (!known.rowCount) {
          if (can(admin.role, "users")) {
            tempPassword = await ensureLogin(email, "");
            await syncLogin(email, "guest", false);
            await db().query("INSERT INTO staff_users (email, role, created_by) VALUES ($1, 'guest', $2)", [email, admin.email]);
            await audit(admin.email, "staff.added", email, { role: "guest" });
          } else {
            needsLogin = true;
          }
        }
      }
      await audit(admin.email, "item.shared", `${kind}:${itemId}`, { with: email });
      return Response.json({ people: await people(kind, itemId), tempPassword, needsLogin });
    }

    if (op === "remove") {
      await db().query("DELETE FROM shared_items WHERE kind = $1 AND item_id = $2 AND email = $3", [kind, itemId, email]);
      await audit(admin.email, "item.unshared", `${kind}:${itemId}`, { with: email });
      return Response.json({ people: await people(kind, itemId) });
    }
    return bad("Unknown operation.");
  } catch (error) {
    console.error("Share failed:", error);
    return bad(error instanceof Error ? error.message : "That could not be shared.", 502);
  }
}
