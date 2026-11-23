import { createNeonAuth } from "@neon/auth/next/server";

let instance: ReturnType<typeof createNeonAuth> | null = null;

/** Null where staff login is not configured, so the public site is never affected. */
export function getAuth() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !secret) return null;
  instance ??= createNeonAuth({ baseUrl, cookies: { secret } });
  return instance;
}
