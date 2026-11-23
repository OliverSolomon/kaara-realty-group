import { NextResponse } from "next/server";
import { adminFromRequest } from "@/lib/auth/admin";
import { authorizeUrl, createState, isProvider, oauthConfigured } from "@/lib/mail/oauth";

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const url = new URL(request.url);
  const admin = await adminFromRequest(request);
  if (!admin) return NextResponse.redirect(new URL("/admin/login", url));
  if (!isProvider(provider) || !oauthConfigured(provider)) {
    return NextResponse.redirect(new URL("/admin/mail?mailError=provider", url));
  }
  const { state, nonce } = createState(provider, admin.email);
  const hint = url.searchParams.get("email")?.slice(0, 200) || undefined;
  const response = NextResponse.redirect(authorizeUrl(provider, url.origin, state, hint));
  response.cookies.set("kaara_mail_oauth", nonce, {
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "lax",
    path: "/api/admin/mail/oauth",
    maxAge: 600,
  });
  return response;
}
