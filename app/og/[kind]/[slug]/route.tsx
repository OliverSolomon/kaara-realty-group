import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { client } from "@/sanity/lib/client";
import {
  ALL_LISTINGS_QUERY,
  INSIGHT_QUERY,
  LISTINGS_BY_TYPE_QUERY,
  PROPERTY_DETAIL_QUERY,
} from "@/sanity/lib/queries";
import { INSIGHT_CATEGORY_LABELS } from "@/lib/site";

const WIDTH = 1200;
const HEIGHT = 630;
const MAX_BYTES = 280_000;
const PHOTO_HOSTS = new Set(["cdn.sanity.io", "images.unsplash.com", "res.cloudinary.com"]);

interface Card {
  eyebrow: string;
  title: string;
  detail?: string;
  photo?: string | null;
}

const PAGES: Record<string, Card & { listingType?: "buy" | "sell" | "stay" }> = {
  home: { eyebrow: "Luxury real estate", title: "Where do you want to live?", detail: "Verified homes across Nairobi" },
  buy: { eyebrow: "Buy", title: "Homes from developers with a delivery record", detail: "Prices and payment plans up front", listingType: "buy" },
  sell: { eyebrow: "Owner vetted", title: "Verified resale homes in Nairobi", detail: "Title checked before listing", listingType: "sell" },
  stay: { eyebrow: "Short stays", title: "Luxury apartments in Nairobi", detail: "Nightly rates stated for every unit", listingType: "stay" },
  properties: { eyebrow: "All properties", title: "Everything we have on the books", detail: "New releases, resales and short stays" },
  contact: { eyebrow: "Talk to us", title: "Speak to a Kaara advisor", detail: "WhatsApp, phone or email" },
  "market-insights": { eyebrow: "Market insights", title: "Research on the Nairobi property market", detail: "Supply, pricing and handover performance" },
  "world-of-kaara": { eyebrow: "World of Kaara", title: "A new standard for property advisory", detail: "Trust, transparency and guidance" },
};

function money(amount: unknown, currency = "KES") {
  const raw = String(amount ?? "").trim();
  if (!raw) return null;
  const value = Number(raw.replace(/[^0-9.]/g, ""));
  if (!value || !Number.isFinite(value)) return raw;
  return `${currency} ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(value)}`;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- CMS query results. */
function propertyCard(property: any): Card {
  const district = typeof property.district === "object" ? property.district?.name : property.district;
  const stay = property.listingType === "stay";
  const price = stay
    ? money(property.dailyRate?.amount, property.dailyRate?.currency)
    : money(property.price?.amount, property.price?.currency);
  return {
    eyebrow: property.location || [district, property.county].filter(Boolean).join(", ") || "Nairobi",
    title: property.title || "Kaara listing",
    detail: price ? (stay ? `${price} per night` : price) : stay ? "Rate on request" : "Price on request",
    photo: property.imageUrl,
  };
}

async function loadCard(kind: string, slug: string): Promise<Card | null> {
  if (kind === "page") {
    const page = PAGES[slug];
    if (!page) return null;
    const listings: any[] = page.listingType
      ? await client.fetch(LISTINGS_BY_TYPE_QUERY, { listingType: page.listingType })
      : await client.fetch(ALL_LISTINGS_QUERY);
    return { ...page, photo: listings?.find((item) => item?.imageUrl)?.imageUrl };
  }
  if (!/^[a-z0-9][a-z0-9 -]{0,199}$/i.test(slug)) return null;
  if (kind === "property") {
    const property = await client.fetch(PROPERTY_DETAIL_QUERY, { slug });
    return property ? propertyCard(property) : null;
  }
  if (kind === "insight") {
    const insight: any = await client.fetch(INSIGHT_QUERY, { slug });
    if (!insight) return null;
    return {
      eyebrow: INSIGHT_CATEGORY_LABELS[insight.category] ?? "Market insights",
      title: insight.title || "Market insights",
      detail: "Kaara research",
      photo: insight.coverUrl,
    };
  }
  return null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Fetched up front so a slow or unsupported photo falls back to the plain brand card. */
async function photoData(source?: string | null) {
  if (!source) return null;
  try {
    const url = new URL(source);
    if (url.protocol !== "https:" || !PHOTO_HOSTS.has(url.hostname)) return null;
    if (url.hostname === "cdn.sanity.io") {
      url.search = `?w=${WIDTH}&h=${HEIGHT}&fit=crop&crop=entropy&fm=jpg&q=82`;
    }
    const response = await fetch(url, { signal: AbortSignal.timeout(7_000) });
    if (!response.ok) return null;
    const input = Buffer.from(await response.arrayBuffer());
    if (input.byteLength > 12_000_000) return null;
    const output = await sharp(input)
      .rotate()
      .resize(WIDTH, HEIGHT, { fit: "cover", position: "attention" })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${output.toString("base64")}`;
  } catch {
    return null;
  }
}

function shorten(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

const fontFile = (name: string) => readFile(join(process.cwd(), "assets", "fonts", name));

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; slug: string }> }) {
  const { kind, slug: rawSlug } = await params;
  try {
    const card = await loadCard(kind, decodeURIComponent(rawSlug));
    if (!card) return new Response("Not found", { status: 404 });

    const [photo, serif, sans, sansBold] = await Promise.all([
      photoData(card.photo),
      fontFile("playfair-display-latin-500-normal.woff"),
      fontFile("montserrat-latin-500-normal.woff"),
      fontFile("montserrat-latin-700-normal.woff"),
    ]);
    const title = shorten(card.title, 100);
    const titleSize = title.length > 72 ? 42 : title.length > 48 ? 48 : title.length > 28 ? 58 : 70;

    const image = new ImageResponse(
      (
        <div style={{ position: "relative", display: "flex", width: WIDTH, height: HEIGHT, background: "#100b28", color: "#efebe3", fontFamily: "Montserrat" }}>
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- rendered to a static image.
            <img src={photo} width={WIDTH} height={HEIGHT} style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }} />
          )}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: WIDTH,
              height: HEIGHT,
              display: "flex",
              backgroundImage: photo
                ? "linear-gradient(to top, rgba(11,8,25,0.98) 0%, rgba(11,8,25,0.92) 34%, rgba(11,8,25,0.62) 52%, rgba(11,8,25,0.06) 76%, rgba(11,8,25,0.2) 100%)"
                : "linear-gradient(135deg, #171232 0%, #100b28 58%, #173f3f 100%)",
            }}
          />
          <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", padding: "44px 56px" }}>
            <div style={{ display: "flex", alignSelf: "flex-start", padding: "12px 20px", background: "rgba(16,11,40,0.82)", border: "1px solid rgba(239,235,227,0.24)", fontFamily: "Playfair Display", fontSize: 25, letterSpacing: 6 }}>
              KAARA
              <span style={{ marginLeft: 11, color: "rgba(239,235,227,0.72)" }}>&amp; CO</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontWeight: 700, fontSize: 21, letterSpacing: 3.5, color: "#7fd0c1", textTransform: "uppercase" }}>
                {shorten(card.eyebrow, 46)}
              </div>
              <div style={{ display: "flex", marginTop: 14, maxWidth: 1040, fontFamily: "Playfair Display", fontSize: titleSize, lineHeight: 1.12 }}>
                {title}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(239,235,227,0.28)" }}>
                <div style={{ display: "flex", fontWeight: 700, fontSize: 30 }}>{shorten(card.detail || "", 42)}</div>
                <div style={{ display: "flex", fontSize: 21, color: "rgba(239,235,227,0.78)" }}>kaararealtygroup.com</div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
        fonts: [
          { name: "Playfair Display", data: serif, weight: 500, style: "normal" },
          { name: "Montserrat", data: sans, weight: 500, style: "normal" },
          { name: "Montserrat", data: sansBold, weight: 700, style: "normal" },
        ],
      }
    );

    const png = Buffer.from(await image.arrayBuffer());
    let jpeg = await sharp(png).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
    for (const quality of [76, 68, 60]) {
      if (jpeg.byteLength <= MAX_BYTES) break;
      jpeg = await sharp(png).jpeg({ quality, mozjpeg: true }).toBuffer();
    }

    return new Response(new Uint8Array(jpeg), {
      headers: {
        "content-type": "image/jpeg",
        "content-length": String(jpeg.byteLength),
        "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Share card failed:", error);
    return new Response("Could not create the image", { status: 500 });
  }
}
