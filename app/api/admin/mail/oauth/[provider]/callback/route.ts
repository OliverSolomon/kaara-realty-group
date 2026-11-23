import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminFromRequest, audit } from "@/lib/auth/admin";
import { encryptSecret } from "@/lib/crypto";
import { getPool } from "@/lib/db";
import { testConnection } from "@/lib/mail/client";
import { emailFromIdToken, exchangeCode, isProvider, oauthServers, readState } from "@/lib/mail/oauth";

export const maxDuration = 45;

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const url = new URL(request.url);
  const done = (query: string) => {
    const response = NextResponse.redirect(new URL(`/admin/mail?${query}`, url));
    response.cookies.delete({ name: "kaara_mail_oauth", path: "/api/admin/mail/oauth" });
    response.cookies.delete({ name: "kaara_mail_name", path: "/api/admin/mail/oauth" });
    return response;
  };
  const admin = await adminFromRequest(request, "mail");
  if (!admin) return NextResponse.redirect(new URL("/admin/login", url));
  if (!isProvider(provider)) return done("mailError=provider");
  const jar = await cookies();
  const nonce = jar.get("kaara_mail_oauth")?.value;
  let senderName = "Kaara Realty Group";
  try {
    senderName = decodeURIComponent(jar.get("kaara_mail_name")?.value ?? "").trim().slice(0, 60) || senderName;
  } catch {
    // A damaged cookie only loses the custom name.
  }
  const state = url.searchParams.get("state") ?? "";
  let valid = false;
  try {
    valid = readState(state, provider, admin.email, nonce);
  } catch {
    valid = false;
  }
  if (!valid) return done("mailError=state");
  const code = url.searchParams.get("code");
  if (!code) return done("mailError=denied");

  try {
    const tokens = await exchangeCode(provider, url.origin, code);
    const email = emailFromIdToken(tokens.id_token);
    if (!email) return done("mailError=email");
    if (!tokens.refresh_token) return done("mailError=refresh");
    const servers = oauthServers(provider);
    const config = {
      imap_host: servers.imap[0],
      imap_port: servers.imap[1],
      imap_secure: servers.imap[2],
      smtp_host: servers.smtp[0],
      smtp_port: servers.smtp[1],
      smtp_secure: servers.smtp[2],
      username: email,
    };
    await testConnection(config, { accessToken: tokens.access_token! });
    const pool = getPool();
    if (!pool) throw new Error("The database is not configured.");
    await pool.query(
      `INSERT INTO mail_accounts (label, email, username, password_enc, auth_type, imap_host, imap_port, imap_secure, smtp_host, smtp_port, smtp_secure, connected_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (email) DO UPDATE SET label=EXCLUDED.label, username=EXCLUDED.username, password_enc=EXCLUDED.password_enc, auth_type=EXCLUDED.auth_type,
         imap_host=EXCLUDED.imap_host, imap_port=EXCLUDED.imap_port, imap_secure=EXCLUDED.imap_secure,
         smtp_host=EXCLUDED.smtp_host, smtp_port=EXCLUDED.smtp_port, smtp_secure=EXCLUDED.smtp_secure, connected_by=EXCLUDED.connected_by`,
      [senderName, email, email, encryptSecret(tokens.refresh_token), provider, config.imap_host, config.imap_port, config.imap_secure, config.smtp_host, config.smtp_port, config.smtp_secure, admin.email]
    );
    await audit(admin.email, "mail.account_connected", email, { provider });
    return done("mailConnected=1");
  } catch (error) {
    console.error("Mail sign-in failed:", error instanceof Error ? error.message : error);
    return done("mailError=connect");
  }
}
