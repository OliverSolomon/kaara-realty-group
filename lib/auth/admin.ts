import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getPool } from "@/lib/db";
import { getAuth } from "@/lib/auth/server";
import { can, homeFor, isStaffRole, type Permission, type StaffRole } from "@/lib/auth/roles";

export interface StaffMember {
  email: string;
  name: string;
  role: StaffRole;
}

/** Owners listed in ADMIN_EMAILS. They are always super admins and cannot be changed in the app. */
export function ownerEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export const isOwnerEmail = (email: string) => ownerEmails().includes(email.toLowerCase());

async function roleFor(email: string): Promise<StaffRole | null> {
  if (isOwnerEmail(email)) return "super_admin";
  try {
    const result = await getPool()?.query<{ role: string }>("SELECT role FROM staff_users WHERE email = $1 AND active", [email]);
    const role = result?.rows[0]?.role;
    return isStaffRole(role) ? role : null;
  } catch (error) {
    // Access fails closed: if the role cannot be read, only owners get in.
    console.error("Staff role lookup failed:", error);
    return null;
  }
}

/** The signed-in staff member for this request, or null. Roles are read fresh so removal takes effect at once. */
export const currentStaff = cache(async (): Promise<StaffMember | null> => {
  const auth = getAuth();
  if (!auth) return null;
  const { data: session } = await auth.getSession();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;
  const role = await roleFor(email);
  return role ? { email, name: session?.user?.name || email, role } : null;
});

/** Every admin page and action calls this. Being signed in alone is not enough. */
export async function requireAdmin(permission?: Permission | Permission[]) {
  const auth = getAuth();
  if (!auth) redirect("/admin/login");
  const { data: session } = await auth.getSession();
  if (!session?.user?.email) redirect("/admin/login");
  const staff = await currentStaff();
  if (!staff) redirect("/admin/login?denied=1");
  if (permission && !can(staff.role, permission)) redirect(homeFor(staff.role));
  return staff;
}

/** For admin API routes: null instead of a redirect, and writes must come from this site. */
export async function adminFromRequest(request: Request, permission?: Permission | Permission[]) {
  if (request.method !== "GET") {
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    if (!origin || !host || new URL(origin).host !== host) return null;
  }
  const staff = await currentStaff();
  if (!staff || (permission && !can(staff.role, permission))) return null;
  return staff;
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
