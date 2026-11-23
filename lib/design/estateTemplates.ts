import { createImageElement, createPage, createShapeElement, createTextElement, type PageData } from "@canvix/lib/types";

export interface EstatePhoto {
  url: string;
  width: number;
  height: number;
}

export interface EstateListing {
  id: string;
  title: string;
  slug: string | null;
  listingType: "buy" | "sell" | "stay" | string | null;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqm: number | null;
  location: string | null;
  district: string | null;
  priceAmount: number | null;
  currency: string | null;
  rate: number | null;
  rateCurrency: string | null;
  photos: EstatePhoto[];
}

export const CAMPAIGNS = [
  { id: "sale", label: "For sale", badge: "For sale", fits: ["buy", "sell"], price: "sale" },
  { id: "let", label: "To let", badge: "To let", fits: ["stay", "buy", "sell"], price: "rent" },
  { id: "stay", label: "Staycation", badge: "Book your stay", fits: ["stay"], price: "stay" },
  { id: "new", label: "Just listed", badge: "Just listed", fits: ["buy", "sell", "stay"], price: "auto" },
  { id: "drop", label: "Price drop", badge: "Price reduced", fits: ["buy", "sell"], price: "sale" },
  { id: "open", label: "Open house", badge: "Open house", fits: ["buy", "sell"], price: "date" },
  { id: "sold", label: "Sold", badge: "Sold", fits: ["buy", "sell"], price: "none" },
  { id: "rented", label: "Rented", badge: "Rented", fits: ["stay", "buy", "sell"], price: "none" },
] as const;

export const FORMATS = [
  { id: "post", label: "Instagram post", width: 1080, height: 1080 },
  { id: "portrait", label: "Portrait post", width: 1080, height: 1350 },
  { id: "story", label: "Story or status", width: 1080, height: 1920 },
  { id: "wide", label: "Facebook or LinkedIn", width: 1200, height: 630 },
  { id: "flyer", label: "A4 flyer", width: 2480, height: 3508 },
] as const;

export const LAYOUTS = [
  { id: "full", label: "Full photo" },
  { id: "split", label: "Split panel" },
  { id: "frame", label: "Framed" },
  { id: "gallery", label: "Photo gallery" },
  { id: "card", label: "Detail card" },
  { id: "band", label: "Price band" },
] as const;

export const PALETTES = [
  { id: "navy", label: "Kaara navy", bg: "#100B28", panel: "#171232", text: "#F7F4EC", muted: "#C9C4D6", accent: "#4F9D8F", onAccent: "#FFFFFF" },
  { id: "ivory", label: "Ivory", bg: "#F7F4EC", panel: "#FFFFFF", text: "#171232", muted: "#5E5A6E", accent: "#2E7D6F", onAccent: "#FFFFFF" },
  { id: "gold", label: "Gold", bg: "#14110B", panel: "#1F1A10", text: "#FBF6E9", muted: "#CFC5AB", accent: "#D8C07A", onAccent: "#14110B" },
  { id: "jade", label: "Jade", bg: "#123B35", panel: "#184A43", text: "#F4FAF8", muted: "#BFDAD4", accent: "#F2D891", onAccent: "#123B35" },
] as const;

export type CampaignId = (typeof CAMPAIGNS)[number]["id"];
export type FormatId = (typeof FORMATS)[number]["id"];
export type LayoutId = (typeof LAYOUTS)[number]["id"];
export type PaletteId = (typeof PALETTES)[number]["id"];

export interface EstateSpec {
  campaign: CampaignId;
  format: FormatId;
  layout: LayoutId;
  palette: PaletteId;
}

export const SAMPLE_LISTING: EstateListing = {
  id: "sample",
  title: "Property name",
  slug: null,
  listingType: "buy",
  propertyType: "apartment",
  bedrooms: 3,
  bathrooms: 2,
  sizeSqm: 120,
  location: "Neighbourhood, City",
  district: null,
  priceAmount: null,
  currency: "KSh",
  rate: null,
  rateCurrency: "KSh",
  photos: [],
};

const SERIF = "Playfair Display";
const SANS = "Montserrat";
const SITE = "kaararealtygroup.com";
const money = (currency: string | null, amount: number) => `${currency || "KSh"} ${Math.round(amount).toLocaleString("en-US")}`;

/** Never invents a figure: a price that is not on the listing reads "on request". */
export function priceLine(campaign: (typeof CAMPAIGNS)[number], listing: EstateListing) {
  const sale = listing.priceAmount ? money(listing.currency, listing.priceAmount) : "Price on request";
  const stay = listing.rate ? `${money(listing.rateCurrency, listing.rate)} / night` : "Rate on request";
  switch (campaign.price) {
    case "sale":
      return sale;
    case "stay":
      return stay;
    case "rent":
      return listing.listingType === "stay" ? stay : "Rent on request";
    case "auto":
      return listing.listingType === "stay" ? stay : sale;
    case "date":
      return "Add date and time";
    default:
      return "Thank you to our clients";
  }
}

export function specLine(listing: EstateListing) {
  return [
    listing.bedrooms ? `${listing.bedrooms} Bed` : null,
    listing.bathrooms ? `${listing.bathrooms} Bath` : null,
    listing.sizeSqm ? `${listing.sizeSqm} m²` : null,
  ].filter(Boolean).join("  ·  ");
}

export const placeLine = (listing: EstateListing) => listing.location || listing.district || "";

export function estateTemplateName(spec: EstateSpec) {
  const campaign = CAMPAIGNS.find((item) => item.id === spec.campaign)!;
  const layout = LAYOUTS.find((item) => item.id === spec.layout)!;
  return `${campaign.label} · ${layout.label}`;
}

/** One finished, fully editable page. `scale` lowers photo resolution for gallery previews. */
export function buildEstatePage(spec: EstateSpec, listing: EstateListing, scale = 1): PageData {
  const campaign = CAMPAIGNS.find((item) => item.id === spec.campaign)!;
  const format = FORMATS.find((item) => item.id === spec.format)!;
  const colours = PALETTES.find((item) => item.id === spec.palette)!;
  const { width: W, height: H } = format;
  const wide = W > H;
  const unit = Math.min(W, H) / 1080;
  const margin = Math.round(56 * unit);
  const page = createPage({ type: "solid", color: colours.bg });
  const add = (...items: unknown[]) => page.elements.push(...(items as PageData["elements"]));

  const rect = (x: number, y: number, width: number, height: number, fill: string, extra: Record<string, unknown> = {}) =>
    createShapeElement("rect", { x, y, width, height, fill, stroke: "transparent", strokeWidth: 0, cornerRadius: 0, name: "Panel", ...extra });
  const text = (value: string, x: number, y: number, width: number, height: number, size: number, fill: string, extra: Record<string, unknown> = {}) =>
    createTextElement({ text: value, x, y, width, height, fontSize: Math.round(size), fontFamily: SANS, fill, align: "left", lineHeight: 1.15, autoFit: true, ...extra });

  const photo = (index: number, x: number, y: number, width: number, height: number) => {
    const source = listing.photos.length ? listing.photos[index % listing.photos.length] : null;
    if (!source) {
      add(
        rect(x, y, width, height, colours.panel, { name: "Photo placeholder" }),
        text("Add a property photo", x, y + height / 2 - 30 * unit, width, 60 * unit, 30 * unit, colours.muted, { align: "center", name: "Photo hint" })
      );
      return;
    }
    const pixels = Math.min(1, Math.min(2400 / width, 2400 / height)) * scale;
    const w = Math.max(64, Math.round(width * pixels));
    const h = Math.max(64, Math.round(height * pixels));
    add(createImageElement(`${source.url}?w=${w}&h=${h}&fit=crop&auto=format&q=82`, w, h, { x, y, width, height, radius: 0, name: "Property photo" }));
  };

  const badge = (x: number, y: number) => {
    const label = campaign.badge.toUpperCase();
    const width = Math.round((label.length * 19 + 64) * unit);
    const height = Math.round(62 * unit);
    add(
      rect(x, y, width, height, colours.accent, { name: "Badge" }),
      text(label, x, y + 15 * unit, width, 34 * unit, 24 * unit, colours.onAccent, { bold: true, align: "center", letterSpacing: 2 * unit, name: "Campaign" })
    );
  };

  /** Stacks the copy tightly and shrinks it together, so short and long titles both look set. */
  const details = (x: number, y: number, width: number, height: number, options: { price?: boolean; anchor?: "top" | "bottom" } = {}) => {
    const { price = true, anchor = "top" } = options;
    const specs = specLine(listing);
    const titleLines = Math.min(2, Math.ceil((listing.title.length * 72 * unit * 0.56) / width));
    const rows = [
      { value: listing.title, size: 72, lines: titleLines, gap: 14, fill: colours.text, extra: { fontFamily: SERIF, bold: true, name: "Property name" } },
      { value: placeLine(listing), size: 32, lines: 1, gap: 8, fill: colours.muted, extra: { name: "Location" } },
      ...(specs ? [{ value: specs, size: 30, lines: 1, gap: 18, fill: colours.muted, extra: { bold: true, name: "Specs" } }] : []),
      ...(price ? [{ value: priceLine(campaign, listing), size: 54, lines: 1, gap: 14, fill: colours.accent, extra: { bold: true, name: "Price" } }] : []),
      { value: SITE, size: 26, lines: 1, gap: 0, fill: colours.muted, extra: { name: "Website" } },
    ];
    const needed = rows.reduce((total, row) => total + (row.size * 1.2 * row.lines + row.gap) * unit, 0);
    const fit = Math.min(1, height / needed);
    let cursor = anchor === "bottom" ? y + height - needed * fit : y;
    for (const row of rows) {
      const rowHeight = row.size * 1.2 * row.lines * unit * fit;
      add(text(row.value, x, cursor, width, rowHeight, row.size * unit * fit, row.fill, row.extra));
      cursor += rowHeight + row.gap * unit * fit;
    }
  };

  if (spec.layout === "full") {
    photo(0, 0, 0, W, H);
    add(rect(0, H * 0.34, W, H * 0.66, colours.bg, { fillGradient: { type: "linear", from: `${colours.bg}00`, to: colours.bg, angle: 90 }, name: "Photo shade" }));
    badge(margin, margin);
    details(margin, H * (wide ? 0.42 : 0.6), W - margin * 2, H * (wide ? 0.58 : 0.4) - margin, { anchor: "bottom" });
  } else if (spec.layout === "split") {
    if (wide) {
      photo(0, 0, 0, W * 0.58, H);
      add(rect(W * 0.58, 0, W * 0.42, H, colours.panel));
      badge(W * 0.58 + margin, margin);
      details(W * 0.58 + margin, margin * 2.6, W * 0.42 - margin * 2, H - margin * 3.4);
    } else {
      photo(0, 0, 0, W, H * 0.6);
      add(rect(0, H * 0.6, W, H * 0.4, colours.panel));
      badge(margin, H * 0.6 - 31 * unit);
      details(margin, H * 0.6 + margin, W - margin * 2, H * 0.4 - margin * 1.5);
    }
  } else if (spec.layout === "frame") {
    if (wide) {
      photo(0, margin, margin, W * 0.55 - margin, H - margin * 2);
      badge(W * 0.55 + margin / 2, margin);
      details(W * 0.55 + margin / 2, margin * 2.6, W * 0.45 - margin * 1.5, H - margin * 3.4);
    } else {
      photo(0, margin, margin, W - margin * 2, H * 0.58);
      add(rect(margin, H * 0.58 + margin, W - margin * 2, 3 * unit, colours.accent, { name: "Rule" }));
      badge(margin, H * 0.58 + margin * 1.4);
      details(margin, H * 0.58 + margin * 1.4 + 84 * unit, W - margin * 2, H * 0.42 - margin * 2.6 - 84 * unit);
    }
  } else if (spec.layout === "gallery") {
    const gap = Math.round(12 * unit);
    if (wide) {
      const left = W * 0.42;
      photo(0, 0, 0, left, H);
      photo(1, left + gap, 0, W * 0.24 - gap, H / 2 - gap / 2);
      photo(2, left + gap, H / 2 + gap / 2, W * 0.24 - gap, H / 2 - gap / 2);
      badge(W * 0.66 + margin / 2, margin);
      details(W * 0.66 + margin / 2, margin * 2.6, W * 0.34 - margin, H - margin * 3.4);
    } else {
      const main = H * 0.4;
      const small = H * 0.2;
      photo(0, 0, 0, W, main);
      photo(1, 0, main + gap, W / 2 - gap / 2, small);
      photo(2, W / 2 + gap / 2, main + gap, W / 2 - gap / 2, small);
      badge(margin, margin);
      details(margin, main + small + gap + margin * 0.7, W - margin * 2, H - main - small - gap - margin * 1.2);
    }
  } else if (spec.layout === "card") {
    photo(0, 0, 0, W, H);
    badge(margin, margin);
    const cardWidth = wide ? W * 0.46 : W - margin * 2;
    const cardHeight = wide ? H - margin * 2 : H * 0.4;
    const cardX = wide ? W - cardWidth - margin : margin;
    const cardY = wide ? margin : H - cardHeight - margin;
    add(rect(cardX, cardY, cardWidth, cardHeight, colours.panel, { cornerRadius: Math.round(20 * unit), name: "Detail card" }));
    details(cardX + margin * 0.7, cardY + margin * 0.6, cardWidth - margin * 1.4, cardHeight - margin * 1.1);
  } else {
    const bandHeight = wide ? H * 0.3 : H * 0.17;
    const bandY = H - bandHeight;
    photo(0, 0, 0, W, wide ? bandY : H * 0.56);
    if (!wide) details(margin, H * 0.56 + margin * 0.5, W - margin * 2, bandY - H * 0.56 - margin * 0.8, { price: false });
    badge(margin, margin);
    add(rect(0, bandY, W, bandHeight, colours.accent, { name: "Price band" }));
    add(text(priceLine(campaign, listing), margin, bandY + bandHeight * 0.18, W - margin * 2, bandHeight * 0.42, Math.min(bandHeight * 0.34, 84 * unit), colours.onAccent, { bold: true, name: "Price" }));
    add(text(wide ? `${listing.title}  ·  ${placeLine(listing)}` : SITE, margin, bandY + bandHeight * 0.66, W - margin * 2, bandHeight * 0.22, Math.min(bandHeight * 0.14, 30 * unit), colours.onAccent, { name: wide ? "Property name" : "Website" }));
  }
  return page;
}

export function allEstateSpecs(format: FormatId): EstateSpec[] {
  return CAMPAIGNS.flatMap((campaign) =>
    LAYOUTS.flatMap((layout) => PALETTES.map((palette) => ({ campaign: campaign.id, format, layout: layout.id, palette: palette.id })))
  );
}

/** The same designs for the editor's Templates panel, with a sample listing to overwrite. */
export function estateTemplateDefs() {
  return CAMPAIGNS.flatMap((campaign, campaignIndex) =>
    LAYOUTS.flatMap((layout, layoutIndex) =>
      FORMATS.filter((format) => format.id !== "flyer").map((format) => {
        const palette = PALETTES[(campaignIndex + layoutIndex) % PALETTES.length];
        const spec: EstateSpec = { campaign: campaign.id, format: format.id, layout: layout.id, palette: palette.id };
        return {
          slug: `estate-${campaign.id}-${layout.id}-${format.id}`,
          name: `${estateTemplateName(spec)} · ${format.label}`,
          category: "real-estate",
          width: format.width,
          height: format.height,
          accent: palette.accent,
          pages: [buildEstatePage(spec, SAMPLE_LISTING)],
        };
      })
    )
  );
}
