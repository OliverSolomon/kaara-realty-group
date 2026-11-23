import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export type OAuthProvider = "google" | "microsoft";

const tenant = () => process.env.MS_TENANT || "common";

interface ProviderConfig {
  authUrl: string;
  tokenUrl: string;
  scope: string;
  id?: string;
  secret?: string;
  imap: [string, number, boolean];
  smtp: [string, number, boolean];
  extra: Record<string, string>;
}

function config(provider: OAuthProvider): ProviderConfig {
  return provider === "google"
    ? {
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scope: "https://mail.google.com/ openid email",
        id: process.env.GOOGLE_CLIENT_ID,
        secret: process.env.GOOGLE_CLIENT_SECRET,
        imap: ["imap.gmail.com", 993, true] as [string, number, boolean],
        smtp: ["smtp.gmail.com", 465, true] as [string, number, boolean],
        extra: { access_type: "offline", prompt: "consent" },
      }
    : {
        authUrl: `https://login.microsoftonline.com/${tenant()}/oauth2/v2.0/authorize`,
        tokenUrl: `https://login.microsoftonline.com/${tenant()}/oauth2/v2.0/token`,
        scope: "offline_access openid email https://outlook.office.com/IMAP.AccessAsUser.All https://outlook.office.com/SMTP.Send",
        id: process.env.MS_CLIENT_ID,
        secret: process.env.MS_CLIENT_SECRET,
        imap: ["outlook.office365.com", 993, true] as [string, number, boolean],
        smtp: ["smtp.office365.com", 587, false] as [string, number, boolean],
        extra: { prompt: "select_account" },
      };
}

export const isProvider = (value: string): value is OAuthProvider => value === "google" || value === "microsoft";
export const oauthServers = (provider: OAuthProvider) => ({ imap: config(provider).imap, smtp: config(provider).smtp });
export const oauthConfigured = (provider: OAuthProvider) => Boolean(config(provider).id && config(provider).secret);
export const redirectUri = (origin: string, provider: OAuthProvider) => `${origin}/api/admin/mail/oauth/${provider}/callback`;

const stateKey = () => process.env.ADMIN_ENCRYPTION_KEY || "";
const sign = (value: string) => createHmac("sha256", stateKey()).update(value).digest("base64url");

/** Ties the sign-in to this admin and this browser, and expires after ten minutes. */
export function createState(provider: OAuthProvider, admin: string) {
  const nonce = randomBytes(18).toString("base64url");
  const body = Buffer.from(JSON.stringify({ provider, admin, nonce, exp: Date.now() + 600_000 })).toString("base64url");
  return { state: `${body}.${sign(body)}`, nonce };
}

export function readState(state: string, provider: OAuthProvider, admin: string, cookieNonce: string | undefined) {
  const [body, signature] = state.split(".");
  if (!body || !signature || !stateKey()) return false;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { provider: string; admin: string; nonce: string; exp: number };
  return data.provider === provider && data.admin === admin && data.exp > Date.now() && Boolean(cookieNonce) && data.nonce === cookieNonce;
}

export function authorizeUrl(provider: OAuthProvider, origin: string, state: string, loginHint?: string) {
  const item = config(provider);
  const query = new URLSearchParams({
    client_id: item.id!,
    redirect_uri: redirectUri(origin, provider),
    response_type: "code",
    scope: item.scope,
    state,
    ...item.extra,
    ...(loginHint ? { login_hint: loginHint } : {}),
  });
  return `${item.authUrl}?${query}`;
}

async function token(provider: OAuthProvider, params: Record<string, string>) {
  const item = config(provider);
  const response = await fetch(item.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: item.id!, client_secret: item.secret!, ...params }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = (await response.json().catch(() => ({}))) as { access_token?: string; refresh_token?: string; id_token?: string; error?: string; error_description?: string };
  if (!response.ok || !body.access_token) throw new Error(body.error_description || body.error || "The sign-in provider refused the request.");
  return body;
}

export const exchangeCode = (provider: OAuthProvider, origin: string, code: string) =>
  token(provider, { grant_type: "authorization_code", code, redirect_uri: redirectUri(origin, provider) });

export async function accessTokenFromRefresh(provider: OAuthProvider, refreshToken: string) {
  return (await token(provider, { grant_type: "refresh_token", refresh_token: refreshToken })).access_token!;
}

/** The id_token comes straight from the provider over TLS in the code exchange. */
export function emailFromIdToken(idToken: string | undefined) {
  if (!idToken) return null;
  try {
    const payload = JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString("utf8")) as { email?: string; preferred_username?: string };
    return (payload.email || payload.preferred_username || "").toLowerCase() || null;
  } catch {
    return null;
  }
}
