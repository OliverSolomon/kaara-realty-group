import "server-only";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/server";

function adminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

/** Every admin page and action calls this. Being signed in alone is not enough. */
export async function requireAdmin() {
  const auth = getAuth();
  if (!auth) redirect("/admin/login");
  const { data: session } = await auth.getSession();
  const email = session?.user?.email?.toLowerCase();
  if (!email) redirect("/admin/login");
  if (!adminEmails().has(email)) redirect("/admin/login?denied=1");
  return { email, name: session?.user?.name || email };
}
