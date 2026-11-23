import "server-only";
import { redirect } from "next/navigation";
import { getPool } from "@/lib/db";
import { getAuth } from "@/lib/auth/server";

export function isAdminEmail(email: string) {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

/** Every admin page and action calls this. Being signed in alone is not enough. */
export async function requireAdmin() {
  const auth = getAuth();
  if (!auth) redirect("/admin/login");
  const { data: session } = await auth.getSession();
  const email = session?.user?.email?.toLowerCase();
  if (!email) redirect("/admin/login");
  if (!isAdminEmail(email)) redirect("/admin/login?denied=1");
  return { email, name: session?.user?.name || email };
}

/** For admin API routes: null instead of a redirect, and writes must come from this site. */
export async function adminFromRequest(request: Request) {
  if (request.method !== "GET") {
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    if (!origin || !host || new URL(origin).host !== host) return null;
  }
  const auth = getAuth();
  if (!auth) return null;
  const { data: session } = await auth.getSession();
  const email = session?.user?.email?.toLowerCase();
  if (!email || !isAdminEmail(email)) return null;
  return { email, name: session?.user?.name || email };
}

export async function audit(actor: string, action: string, target?: string | null, details: object = {}) {
  try {
    await getPool()?.query(
      "INSERT INTO admin_audit (actor_email, action, target, details) VALUES ($1, $2, $3, $4)",
      [actor, action, target ?? null, JSON.stringify(details)]
    );
  } catch (error) {
    console.error("Audit write failed:", error);
  }
}
