import { NextResponse, type NextRequest } from "next/server";
import { getAuth } from "@/lib/auth/server";

export default async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();
  const auth = getAuth();
  if (!auth) return NextResponse.redirect(new URL("/admin/login", request.url));
  return auth.middleware({ loginUrl: "/admin/login", publicRoutes: ["/admin/login"] })(request);
}

export const config = {
  matcher: ["/admin/:path*", "/design-studio/:path*"],
};
