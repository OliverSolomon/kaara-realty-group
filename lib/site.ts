export type ListingType = "buy" | "sell" | "stay";

export const PRIMARY_NAV = [
  { label: "Buy", href: "/buy" },
  { label: "Sell", href: "/sell" },
  { label: "Stay", href: "/stay" },
] as const;

export const SECONDARY_NAV = [
  { label: "World of Kaara", href: "/world-of-kaara" },
  { label: "Market Insights", href: "/market-insights" },
  { label: "Contact", href: "/contact" },
] as const;

export const SQM_TO_SQFT = 10.7639;

export function sqmToSqft(sqm: number): number {
  return sqm * SQM_TO_SQFT;
}

export function sqftToSqm(sqft: number): number {
  return sqft / SQM_TO_SQFT;
}

export function formatArea(value: number): string {
  return new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: value < 100 ? 1 : 0,
  }).format(value);
}

export const AMENITY_LABELS: Record<string, string> = {
  pool: "Swimming pool",
  gym: "Gym",
  rooftop: "Rooftop terrace",
  garden: "Private garden",
  elevator: "Elevator",
  generator: "Backup generator",
  borehole: "Borehole",
  security: "CCTV and security",
  concierge: "Concierge",
  parking: "Parking",
  sq: "Staff quarters",
};

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  penthouse: "Penthouse",
  apartment: "Apartment",
  villa: "Villa",
  townhouse: "Townhouse",
  commercial: "Commercial",
  land: "Land",
  ranch: "Ranch",
  farm: "Farm",
};

export const FACING_LABELS: Record<string, string> = {
  north: "North facing",
  "north-east": "North east facing",
  east: "East facing",
  "south-east": "South east facing",
  south: "South facing",
  "south-west": "South west facing",
  west: "West facing",
  "north-west": "North west facing",
};

export const INSIGHT_CATEGORY_LABELS: Record<string, string> = {
  "market-report": "Market report",
  "investor-guide": "Investor guide",
  "neighbourhood-study": "Neighbourhood study",
  "company-note": "Company note",
};

export const DEFAULT_CONTACT = {
  email: "kaara@kaararealtygroup.com",
  phone: "+254 700 000 000",
  whatsapp: "254700000000",
  callingHours: "Weekdays 8am to 6pm, Saturday 9am to 1pm, East Africa Time",
};

export function whatsappLink(number: string | undefined, message: string): string {
  const digits = (number || DEFAULT_CONTACT.whatsapp).replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function telLink(phone: string | undefined): string {
  return `tel:${(phone || DEFAULT_CONTACT.phone).replace(/[^\d+]/g, "")}`;
}

/**
 * Placeholder photography used when a listing has no image yet. Seeded so the
 * same listing always resolves to the same frame instead of flickering between
 * renders. Replace with real photography in Sanity before launch.
 */
export function placeholderImage(seed: string, w = 1200, h = 900): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}
