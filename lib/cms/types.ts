import schemaJson from "./schema.json";

export interface CmsField {
  name: string;
  title: string;
  type: string;
  description?: string;
  required?: boolean;
  max?: number;
  hidden?: boolean;
  showFor?: string[];
  initialValue?: unknown;
  rows?: number;
  list?: { title: string; value: string; group?: string }[];
  layout?: string;
  source?: string;
  maxLength?: number;
  to?: string[];
  fields?: CmsField[];
  of?: CmsField[];
  styles?: { title: string; value: string }[];
}

export interface CmsDocumentType {
  name: string;
  title: string;
  fields: CmsField[];
}

export const CMS_TYPES = (schemaJson as unknown as { documents: Record<string, CmsDocumentType> }).documents;

/** Page-level documents with exactly one copy, as in Studio. */
export const SINGLETONS = new Set([
  "heroSection", "secondarySection", "propertiesSection", "experienceSection", "closingSection",
  "buyPage", "sellPage", "stayPage", "aboutPage",
  "generalSettings", "brandSettings", "contactSettings", "socialSettings",
]);

/** System counters and retired types stay out of the editor. */
export const HIDDEN_TYPES = new Set(["propertyViews", "event"]);

export interface CmsNode {
  id: string;
  label: string;
  type?: string;
  listing?: "buy" | "sell" | "stay";
  href?: string;
  children?: (CmsNode | "divider")[];
}

const page = (label: string, type: string): CmsNode => ({ id: type, label, type, href: `/admin/content/${type}/${type}` });
const list = (id: string, label: string, type: string, listing?: CmsNode["listing"]): CmsNode => ({
  id,
  label,
  type,
  listing,
  href: listing ? `/admin/content/${type}?listing=${listing}` : `/admin/content/${type}`,
});

/** Word for word the Studio menu, so an editor who knows one knows the other. */
export const CMS_STRUCTURE: (CmsNode | "divider")[] = [
  {
    id: "pages",
    label: "Pages",
    children: [
      {
        id: "home",
        label: "Home Page",
        children: [
          page("1 · Hero Video (background)", "heroSection"),
          page("2 · Secondary Video", "secondarySection"),
          page("3 · The Next Move Is Yours (featured + filters)", "propertiesSection"),
          page("4 · Experience Video", "experienceSection"),
          page("5 · Closing Video", "closingSection"),
        ],
      },
      page("Buy Page", "buyPage"),
      page("Sell Page", "sellPage"),
      page("Stay Page", "stayPage"),
      {
        id: "world",
        label: "World of Kaara",
        children: [page("Page Content", "aboutPage"), list("world-developers", "Developer Partners (names & logos)", "developer")],
      },
    ],
  },
  list("insights", "Market Insights", "post"),
  "divider",
  {
    id: "listings",
    label: "Listings",
    children: [
      list("buy", "Buy - Active Listings", "property", "buy"),
      list("sell", "Sell - Resale Units", "property", "sell"),
      list("stay", "Stay - Short Stay Units", "property", "stay"),
      "divider",
      list("all-listings", "All Listings", "property"),
    ],
  },
  list("developers", "Developer Partners", "developer"),
  list("testimonials", "Testimonials", "testimonial"),
  {
    id: "locations",
    label: "Locations",
    children: [list("districts", "Districts", "district"), list("counties", "Counties", "county")],
  },
  "divider",
  {
    id: "settings",
    label: "Settings",
    children: [
      page("General (site name, SEO, currency)", "generalSettings"),
      page("Brand Assets (logos, favicon)", "brandSettings"),
      page("Contact Details (phone, WhatsApp, address)", "contactSettings"),
      page("Social Links", "socialSettings"),
    ],
  },
];

export function fieldVisible(field: CmsField, document: Record<string, unknown>) {
  if (field.hidden) return false;
  return !field.showFor || field.showFor.includes(String(document.listingType ?? ""));
}
