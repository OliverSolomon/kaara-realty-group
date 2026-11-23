"use server";

import { revalidatePath } from "next/cache";
import { audit, isOwnerEmail, requireAdmin } from "@/lib/auth/admin";
import { ensureLogin, syncLogin } from "@/lib/auth/logins";
import { isStaffRole, type StaffRole } from "@/lib/auth/roles";
import { getPool } from "@/lib/db";

type Result = { ok: true; tempPassword?: string } | { ok: false; error: string };

function db() {
  const pool = getPool();
  if (!pool) throw new Error("The database is not configured.");
  return pool;
}

async function attempt(work: () => Promise<Result>): Promise<Result> {
  try {
    return await work();
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT")) throw error;
    console.error("Team change failed:", error);
    return { ok: false, error: error instanceof Error ? error.message : "The change could not be saved." };
  }
}

function targetEmail(value: string, actor: string) {
  const email = value.trim().toLowerCase();
  if (isOwnerEmail(email)) throw new Error("Owner accounts are always super admins.");
  if (email === actor) throw new Error("You cannot change your own access.");
  return email;
}

export async function addStaff(rawEmail: string, rawName: string, role: StaffRole) {
  return attempt(async () => {
    const admin = await requireAdmin("users");
    const email = rawEmail.trim().toLowerCase().slice(0, 200);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
    if (!isStaffRole(role)) throw new Error("Choose a role.");
    targetEmail(email, admin.email);
    const name = rawName.trim().slice(0, 80);
    const taken = await db().query("SELECT 1 FROM staff_users WHERE email = $1", [email]);
    if (taken.rowCount) throw new Error("That person is already on the team.");

    const tempPassword = await ensureLogin(email, name);
    await syncLogin(email, role, false);
    await db().query("INSERT INTO staff_users (email, name, role, created_by) VALUES ($1, $2, $3, $4)", [email, name || null, role, admin.email]);
    await audit(admin.email, "staff.added", email, { role });
    revalidatePath("/admin/team");
    return { ok: true, tempPassword };
  });
}

export async function changeStaffRole(rawEmail: string, role: StaffRole) {
  return attempt(async () => {
    const admin = await requireAdmin("users");
    const email = targetEmail(rawEmail, admin.email);
    if (!isStaffRole(role)) throw new Error("Choose a role.");
    const updated = await db().query("UPDATE staff_users SET role = $2, updated_at = now() WHERE email = $1", [email, role]);
    if (!updated.rowCount) throw new Error("That person is not on the team.");
    await syncLogin(email, role, false);
    await audit(admin.email, "staff.role_changed", email, { role });
    revalidatePath("/admin/team");
    return { ok: true };
  });
}

export async function setStaffActive(rawEmail: string, active: boolean) {
  return attempt(async () => {
    const admin = await requireAdmin("users");
    const email = targetEmail(rawEmail, admin.email);
    const { rows } = await db().query<{ role: StaffRole }>("UPDATE staff_users SET active = $2, updated_at = now() WHERE email = $1 RETURNING role", [email, active]);
    if (!rows[0]) throw new Error("That person is not on the team.");
    await syncLogin(email, active ? rows[0].role : "sales", !active);
    await audit(admin.email, active ? "staff.reactivated" : "staff.deactivated", email);
    revalidatePath("/admin/team");
    return { ok: true };
  });
}

export async function removeStaff(rawEmail: string) {
  return attempt(async () => {
    const admin = await requireAdmin("users");
    const email = targetEmail(rawEmail, admin.email);
    const removed = await db().query("DELETE FROM staff_users WHERE email = $1", [email]);
    if (!removed.rowCount) throw new Error("That person is not on the team.");
    await syncLogin(email, "sales", true);
    await audit(admin.email, "staff.removed", email);
    revalidatePath("/admin/team");
    return { ok: true };
  });
}
