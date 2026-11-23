import type { MouseEvent } from "react";
import type { Attribution } from "@/lib/leadTypes";
import { whatsappLink } from "@/lib/site";

const KEY = "kaara.attribution";
const REF_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** Remembers how this browser first arrived. Holds no identifier and is only sent on an action. */
export function captureAttribution() {
  try {
    if (window.localStorage.getItem(KEY)) return;
    const params = new URLSearchParams(window.location.search);
    let referrer: string | undefined;
    if (document.referrer) {
      const url = new URL(document.referrer);
      if (url.host !== window.location.host) referrer = url.host;
    }
    const value: Attribution = {
      landingPath: window.location.pathname,
      referrer,
      utmSource: params.get("utm_source") ?? undefined,
      utmMedium: params.get("utm_medium") ?? undefined,
      utmCampaign: params.get("utm_campaign") ?? undefined,
    };
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Storage can be blocked. Lead capture still works without attribution.
  }
}

export function readAttribution(): Attribution {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "{}") as Attribution;
  } catch {
    return {};
  }
}

function createRef() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `KR-${Array.from(bytes, (byte) => REF_ALPHABET[byte % REF_ALPHABET.length]).join("")}`;
}

/** Adds a reference to the message at click time and records the click. */
export function trackWhatsAppClick(
  event: MouseEvent<HTMLAnchorElement>,
  options: {
    number?: string;
    message: string;
    placement: string;
    listingSlug?: string;
    listingTitle?: string;
  }
) {
  const ref = createRef();
  event.currentTarget.href = whatsappLink(options.number, `${options.message}\n\nRef: ${ref}`);
  try {
    navigator.sendBeacon(
      "/api/track",
      new Blob(
        [
          JSON.stringify({
            ref,
            path: window.location.pathname,
            placement: options.placement,
            listingSlug: options.listingSlug,
            listingTitle: options.listingTitle,
            attribution: readAttribution(),
          }),
        ],
        { type: "application/json" }
      )
    );
  } catch {
    // Tracking must never get in the way of opening the chat.
  }
}
