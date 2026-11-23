const dateTime = new Intl.DateTimeFormat("en-KE", {
  timeZone: "Africa/Nairobi",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const formatDate = (value: Date) => dateTime.format(new Date(value));

export function timeAgo(value: Date, now: number) {
  const minutes = Math.max(0, Math.floor((now - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function sourceLabel(lead: { utm_source?: string | null; utm_campaign?: string | null; referrer?: string | null }) {
  if (lead.utm_source) return lead.utm_campaign ? `${lead.utm_source} / ${lead.utm_campaign}` : lead.utm_source;
  return lead.referrer || "Direct";
}
