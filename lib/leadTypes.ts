export const LEAD_STATUSES = ["new", "contacted", "viewing", "negotiating", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  viewing: "Viewing",
  negotiating: "Negotiating",
  won: "Won",
  lost: "Lost",
};

export const KIND_LABELS: Record<string, string> = {
  buy: "Listing pack",
  viewing: "Viewing request",
  booking: "Short stay",
  tour: "Tour or consultation",
  payment_plan: "Payment plan",
  newsletter: "Market notes signup",
  whatsapp: "WhatsApp chat",
};

export const SOCIAL_NETWORKS = [
  { key: "instagram", label: "Instagram", base: "https://www.instagram.com/" },
  { key: "facebook", label: "Facebook", base: "https://www.facebook.com/" },
  { key: "linkedin", label: "LinkedIn", base: "https://www.linkedin.com/in/" },
  { key: "x", label: "X", base: "https://x.com/" },
  { key: "tiktok", label: "TikTok", base: "https://www.tiktok.com/@" },
] as const;

/** Accepts a handle or a link to that network. Anything else is dropped. */
export function socialUrl(key: string, value: string | null | undefined) {
  const network = SOCIAL_NETWORKS.find((item) => item.key === key);
  const text = value?.trim();
  if (!network || !text) return null;
  if (/^https?:\/\//i.test(text)) {
    try {
      const url = new URL(text);
      const expected = new URL(network.base).hostname.replace(/^www\./, "");
      const host = url.hostname.replace(/^www\./, "");
      return url.protocol === "https:" && (host === expected || host.endsWith(`.${expected}`)) ? url.toString() : null;
    } catch {
      return null;
    }
  }
  const handle = text.replace(/^@+/, "");
  return /^[A-Za-z0-9._-]{1,80}$/.test(handle) ? `${network.base}${handle}` : null;
}

export interface Attribution {
  landingPath?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export function replyTemplates(lead: {
  name?: string | null;
  listing_title?: string | null;
  latest_kind?: string | null;
}) {
  const first = lead.name?.trim().split(/\s+/)[0];
  const hello = first ? `Hello ${first}` : "Hello";
  const listing = lead.listing_title || "the property you asked about";
  const templates = [
    {
      label: "First reply",
      text: `${hello}, this is Kaara Realty Group. Thank you for asking about ${listing}. When is a good time to talk?`,
    },
    {
      label: "Book a viewing",
      text: `${hello}, we can arrange a private viewing of ${listing}. Which day this week works best for you?`,
    },
    {
      label: "Follow up",
      text: `${hello}, just checking in on ${listing}. Is there anything else you need from us before deciding?`,
    },
  ];
  if (lead.latest_kind === "payment_plan") {
    templates.unshift({
      label: "Send payment plan",
      text: `${hello}, here is the payment plan for ${listing}, as you requested:`,
    });
  }
  return templates;
}
