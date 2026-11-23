import { isOwnerEmail, ownerEmails, requireAdmin } from "@/lib/auth/admin";
import { isStaffRole } from "@/lib/auth/roles";
import { getPool } from "@/lib/db";
import TeamApp, { type TeamMember } from "./TeamApp";

export default async function TeamPage() {
  const admin = await requireAdmin("users");
  const result = await getPool()?.query<{ email: string; name: string | null; role: string; active: boolean }>(
    "SELECT email, name, role, active FROM staff_users ORDER BY lower(coalesce(name, email))"
  );
  const owners: TeamMember[] = ownerEmails().map((email) => ({ email, name: null, role: "super_admin", active: true, owner: true }));
  const staff: TeamMember[] = (result?.rows ?? [])
    .filter((row) => !isOwnerEmail(row.email) && isStaffRole(row.role))
    .map((row) => ({ email: row.email, name: row.name, role: row.role as TeamMember["role"], active: row.active, owner: false }));
  const known = new Set([...owners, ...staff].map((member) => member.email));
  const invited = await getPool()?.query<{ email: string }>("SELECT DISTINCT email FROM shared_items ORDER BY email");
  const pending = (invited?.rows ?? []).map((row) => row.email).filter((email) => !known.has(email));
  return <TeamApp members={[...owners, ...staff]} me={admin.email} pending={pending} />;
}
