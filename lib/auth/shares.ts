import "server-only";
import { redirect } from "next/navigation";
import { adminFromRequest, requireAdmin } from "@/lib/auth/admin";
import { can, homeFor, type Permission } from "@/lib/auth/roles";
import { getPool } from "@/lib/db";

export type ShareKind = "content" | "design";

export async function isSharedWith(kind: ShareKind, itemId: string, email: string) {
  try {
    const result = await getPool()?.query("SELECT 1 FROM shared_items WHERE kind = $1 AND item_id = $2 AND email = $3", [kind, itemId, email]);
    return Boolean(result?.rowCount);
  } catch (error) {
    console.error("Share lookup failed:", error);
    return false;
  }
}

export async function hasAnyShare(email: string, kind?: ShareKind) {
  try {
    const result = await getPool()?.query("SELECT 1 FROM shared_items WHERE email = $1 AND ($2::text IS NULL OR kind = $2) LIMIT 1", [email, kind ?? null]);
    return Boolean(result?.rowCount);
  } catch (error) {
    console.error("Share lookup failed:", error);
    return false;
  }
}

/** For a page holding one item: the role grants it, or it was shared with this person. */
export async function requireItem(permission: Permission, kind: ShareKind, itemId: string) {
  const staff = await requireAdmin();
  if (can(staff.role, permission)) return { staff, shared: false };
  if (await isSharedWith(kind, itemId, staff.email)) return { staff, shared: true };
  redirect(homeFor(staff.role));
}

/** Uploads are open to the modules that use them and to anyone co-editing a shared item. */
export async function uploaderFromRequest(request: Request) {
  const staff = await adminFromRequest(request);
  if (!staff) return null;
  if (can(staff.role, ["content", "library", "posts", "design"]) || (await hasAnyShare(staff.email))) return staff;
  return null;
}

/** A co-editor can open and save the shared design, but cannot list, delete or browse others. */
export async function sharedDesignAllowed(email: string, method: string, family: string, rest: string[]) {
  if (family === "designs") {
    const [id, action] = rest;
    if (!id) return false;
    const allowed = !action ? ["GET", "PUT"] : action === "versions" ? ["GET", "POST"] : action === "comments" ? ["GET"] : [];
    return allowed.includes(method) && isSharedWith("design", id, email);
  }
  if (family === "media") return rest[0] !== "library" && method !== "DELETE" && hasAnyShare(email, "design");
  if (["icons", "fonts", "folders", "brand-kits", "templates", "ai", "stock-photo", "stock-video", "stock-sound"].includes(family)) {
    return method === "GET" && hasAnyShare(email, "design");
  }
  return false;
}
