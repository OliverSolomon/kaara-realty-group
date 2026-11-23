export type Channel = "website" | "instagram" | "facebook" | "linkedin" | "x" | "tiktok";

export const CHANNELS: Channel[] = ["website", "instagram", "facebook", "linkedin", "x", "tiktok"];
export const NEEDS_ACCOUNT: Channel[] = ["instagram", "facebook", "linkedin", "x", "tiktok"];

export const CHANNEL_INFO: Record<
  Channel,
  { label: string; limit: number; needsImage: boolean; accountHint: string; composeUrl: (text: string) => string }
> = {
  website: { label: "Website", limit: 10000, needsImage: false, accountHint: "", composeUrl: () => "/admin/content/post" },
  instagram: { label: "Instagram", limit: 2200, needsImage: true, accountHint: "Instagram business account ID", composeUrl: () => "https://www.instagram.com/" },
  facebook: { label: "Facebook", limit: 63206, needsImage: false, accountHint: "Facebook Page ID", composeUrl: () => "https://www.facebook.com/" },
  linkedin: { label: "LinkedIn", limit: 3000, needsImage: false, accountHint: "Author URN, such as urn:li:organization:123", composeUrl: () => "https://www.linkedin.com/feed/" },
  x: { label: "X", limit: 280, needsImage: false, accountHint: "X username", composeUrl: (text) => `https://x.com/intent/post?text=${encodeURIComponent(text)}` },
  tiktok: { label: "TikTok", limit: 2200, needsImage: true, accountHint: "TikTok username", composeUrl: () => "https://www.tiktok.com/upload" },
};

export const PLATFORM_TIPS: Record<Channel, string> = {
  website: "Creates a Market Insights draft to review in Content before it goes live.",
  instagram: "The first line shows before “more”. Links are not clickable, so say “link in bio”.",
  facebook: "Conversational works best. A question invites comments.",
  linkedin: "The first two lines show before “see more”. Use short paragraphs.",
  x: "280 characters including the link. Lead with the point.",
  tiktok: "Short caption and vertical 9:16 photos. It lands in your TikTok inbox to finish.",
};

export interface Variant {
  body?: string;
  hashtags?: string[];
}

export function withUtm(url: string, channel: Channel, campaign: string | null) {
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("utm_source")) parsed.searchParams.set("utm_source", channel);
    if (!parsed.searchParams.has("utm_medium")) parsed.searchParams.set("utm_medium", "social");
    if (!parsed.searchParams.has("utm_campaign") && campaign) {
      parsed.searchParams.set("utm_campaign", campaign.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40));
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export function textFor(
  post: { body: string; title: string | null; link_url: string | null; variants: Partial<Record<Channel, Variant>> },
  channel: Channel
) {
  const variant = post.variants?.[channel];
  let text = (variant?.body?.trim() || post.body).trim();
  const tags = (variant?.hashtags ?? []).map((tag) => `#${tag.trim().replace(/^#+/, "").replace(/\s+/g, "")}`).filter((tag) => tag.length > 1);
  if (tags.length) text += `\n\n${tags.join(" ")}`;
  if (post.link_url && channel !== "website") text += `\n\n${withUtm(post.link_url, channel, post.title)}`;
  return text;
}
