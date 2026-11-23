import "server-only";
import { randomBytes } from "node:crypto";
import type { StaffRole } from "@/lib/auth/roles";
import { getAuth } from "@/lib/auth/server";

type AuthReply<T = unknown> = Promise<{ data?: T | null; error?: { message?: string } | null }>;

/** The parts of the login service's staff API used here. Its published types leave them untyped. */
interface LoginAdmin {
  listUsers(input: { query: { searchField: "email"; searchOperator: "contains"; searchValue: string; limit: number } }): AuthReply<{ users: { id: string; email: string }[] }>;
  createUser(input: { email: string; password: string; name: string; role: "user" | "admin" }): AuthReply;
  setRole(input: { userId: string; role: "user" | "admin" }): AuthReply;
  revokeUserSessions(input: { userId: string }): AuthReply;
}

function authAdmin() {
  const auth = getAuth();
  if (!auth) throw new Error("Staff login is not configured.");
  return auth.admin as unknown as LoginAdmin;
}

export async function loginId(email: string) {
  const { data, error } = await authAdmin().listUsers({
    query: { searchField: "email", searchOperator: "contains", searchValue: email, limit: 10 },
  });
  if (error) throw new Error("The login account could not be read.");
  return (data?.users ?? []).find((user) => user.email.toLowerCase() === email)?.id;
}

/** Only super admins may use the login service's staff tools, so its role follows the staff role. */
export async function syncLogin(email: string, role: StaffRole, endSessions: boolean) {
  const userId = await loginId(email);
  if (!userId) return;
  const { error } = await authAdmin().setRole({ userId, role: role === "super_admin" ? "admin" : "user" });
  if (error) throw new Error("The login account could not be updated.");
  if (endSessions) await authAdmin().revokeUserSessions({ userId });
}

/** Creates a login when needed. The temporary password is returned once and never stored. */
export async function ensureLogin(email: string, name: string) {
  if (await loginId(email)) return undefined;
  const tempPassword = `${randomBytes(12).toString("base64url")}-Aa1`;
  const { error } = await authAdmin().createUser({ email, password: tempPassword, name: name || email, role: "user" });
  if (error) throw new Error("The login account could not be created.");
  return tempPassword;
}
