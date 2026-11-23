import { NextResponse } from "next/server";
import {
  BOT_PATTERN,
  clip,
  cleanAttribution,
  cleanPath,
  cleanSlug,
  recordWhatsAppClick,
  withinRateLimit,
} from "@/lib/leads";

const REF_RE = /^KR-[2-9A-HJ-NP-Z]{6}$/;
const done = () => new NextResponse(null, { status: 204 });

export async function POST(request: Request) {
  try {
    const userAgent = request.headers.get("user-agent") || "";
    if (!userAgent || BOT_PATTERN.test(userAgent)) return done();

    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.ref !== "string" || !REF_RE.test(body.ref)) {
      return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
    }
    if (!(await withinRateLimit(request, "track", 40))) return done();

    await recordWhatsAppClick({
      ref: body.ref,
      path: cleanPath(body.path),
      placement: clip(body.placement, 40),
      listingTitle: clip(body.listingTitle, 200),
      listingSlug: cleanSlug(body.listingSlug),
      attribution: cleanAttribution(body.attribution),
    });
    return done();
  } catch (error) {
    console.error("Click tracking failed:", error);
    return done();
  }
}
