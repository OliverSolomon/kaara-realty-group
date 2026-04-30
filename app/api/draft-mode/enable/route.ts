import { client } from '@/sanity/lib/client'
import { validatePreviewUrl } from "@sanity/preview-url-secret";
import { perspectiveCookieName } from "@sanity/preview-url-secret/constants";
import { cookies, draftMode } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { isValid, redirectTo = "/", studioPreviewPerspective } = await validatePreviewUrl(
    client.withConfig({ token: process.env.SANITY_API_READ_TOKEN }),
    request.url
  );

  if (!isValid) {
    return new Response("Invalid secret", { status: 401 });
  }

  const draftModeStore = await draftMode();
  if (!draftModeStore.isEnabled) {
    draftModeStore.enable();
  }

  const isSecure = process.env.NODE_ENV === "production";
  const cookieStore = await cookies();
  const cookie = cookieStore.get("__prerender_bypass");
  
  if (cookie) {
    cookieStore.set({
      name: "__prerender_bypass",
      value: cookie.value,
      httpOnly: true,
      path: "/",
      secure: isSecure,
      sameSite: isSecure ? "none" : "lax",
    });
  }

  if (studioPreviewPerspective) {
    cookieStore.set({
      name: perspectiveCookieName,
      value: studioPreviewPerspective,
      httpOnly: true,
      path: "/",
      secure: isSecure,
      sameSite: isSecure ? "none" : "lax",
    });
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
