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

export interface CmsNavItem {
  label: string;
  href: string;
  type: string;
  listing?: "buy" | "sell" | "stay";
}

const single = (label: string, type: string): CmsNavItem => ({ label, type, href: `/admin/content/${type}/${type}` });
const list = (label: string, type: string, listing?: CmsNavItem["listing"]): CmsNavItem => ({
  label,
  type,
  listing,
  href: listing ? `/admin/content/${type}?listing=${listing}` : `/admin/content/${type}`,
});

/** The same order as the Studio menu, so an editor who knows one knows the other. */
export const CMS_NAV: { title: string; items: CmsNavItem[] }[] = [
  {
    title: "Home page",
    items: [
      single("1 · Hero video", "heroSection"),
      single("2 · Secondary video", "secondarySection"),
      single("3 · The next move is yours", "propertiesSection"),
      single("4 · Experience video", "experienceSection"),
      single("5 · Closing video", "closingSection"),
    ],
  },
  {
    title: "Pages",
    items: [single("Buy page", "buyPage"), single("Sell page", "sellPage"), single("Stay page", "stayPage"), single("World of Kaara", "aboutPage")],
  },
  { title: "Editorial", items: [list("Market Insights", "post")] },
  {
    title: "Listings",
    items: [
      list("Buy listings", "property", "buy"),
      list("Sell resale units", "property", "sell"),
      list("Stay short stays", "property", "stay"),
      list("All listings", "property"),
    ],
  },
  { title: "People", items: [list("Developer partners", "developer"), list("Testimonials", "testimonial")] },
  { title: "Locations", items: [list("Districts", "district"), list("Counties", "county")] },
  {
    title: "Settings",
    items: [
      single("General", "generalSettings"),
      single("Brand assets", "brandSettings"),
      single("Contact details", "contactSettings"),
      single("Social links", "socialSettings"),
    ],
  },
];

export function fieldVisible(field: CmsField, document: Record<string, unknown>) {
  if (field.hidden) return false;
  return !field.showFor || field.showFor.includes(String(document.listingType ?? ""));
}
