import "server-only";
import { createHmac } from "node:crypto";
import { getPool } from "@/lib/db";
import type { Attribution } from "@/lib/leadTypes";

export const BOT_PATTERN = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget/i;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,199}$/i;

export function clip(value: unknown, max = 300): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).replace(/\u0000/g, "").trim();
  return text ? text.slice(0, max) : null;
}

export function cleanSlug(value: unknown): string | null {
  const slug = clip(value, 200);
  return slug && SLUG_RE.test(slug) ? slug : null;
}

export function cleanPath(value: unknown): string | null {
  const path = clip(value, 300);
  return path?.startsWith("/") && !path.startsWith("//") ? path : null;
}

export function cleanAttribution(value: unknown): Attribution {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    landingPath: cleanPath(raw.landingPath) ?? undefined,
    referrer: clip(raw.referrer, 300) ?? undefined,
    utmSource: clip(raw.utmSource, 120) ?? undefined,
    utmMedium: clip(raw.utmMedium, 120) ?? undefined,
    utmCampaign: clip(raw.utmCampaign, 160) ?? undefined,
  };
}

/** Stores Kenyan numbers in full international form so 07.. and +2547.. match. */
export function phoneDigits(phone: string | null | undefined): string | null {
  let digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("0")) digits = `254${digits.slice(1)}`;
  if (digits.length === 9 && /^[17]/.test(digits)) digits = `254${digits}`;
  return digits.length >= 9 && digits.length <= 15 ? digits : null;
}

/** True when this visitor is within the limit. A database fault never blocks an enquiry. */
export async function withinRateLimit(request: Request, scope: string, limit: number) {
  const pool = getPool();
  const secret = process.env.LEAD_HASH_SECRET;
  if (!pool || !secret) return true;
  const ip =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const key = createHmac("sha256", secret).update(`${scope}:${ip}`).digest("hex");
  try {
    const { rows } = await pool.query<{ count: number }>(
      `INSERT INTO rate_limits (key, window_start, count)
       VALUES ($1, date_bin('10 minutes', now(), 'epoch'::timestamptz), 1)
       ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
       RETURNING count`,
      [key]
    );
    if (Math.random() < 0.02) {
      await pool.query(`DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`);
    }
    return rows[0].count <= limit;
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return true;
  }
}

export interface LeadInput {
  kind: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  message?: string | null;
  listingTitle?: string | null;
  listingSlug?: string | null;
  path?: string | null;
  marketingConsent?: boolean;
  attribution?: Attribution;
  details?: Record<string, string>;
}

/** Saves a submission against the person's lead. Returns null if it could not be saved. */
export async function recordLead(input: LeadInput): Promise<{ id: string; ref: string } | null> {
  const pool = getPool();
  if (!pool) return null;

  const digits = phoneDigits(input.phone);
  const email = input.email?.trim().toLowerCase() || null;
  const consent = Boolean(input.marketingConsent);
  const a = input.attribution ?? {};
  const client = await pool.connect().catch((error) => {
    console.error("Could not connect to save a lead:", error);
    return null;
  });
  if (!client) return null;

  try {
    await client.query("BEGIN");
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM leads
       WHERE ($1::text IS NOT NULL AND phone_digits = $1)
          OR ($2::text IS NOT NULL AND lower(email) = $2)
       ORDER BY (phone_digits = $1) DESC NULLS LAST, last_activity_at DESC
       LIMIT 1`,
      [digits, email]
    );

    let lead: { id: string; ref: string };
    if (existing.rows[0]) {
      const updated = await client.query<{ id: string; ref: string }>(
        `UPDATE leads SET
           name = COALESCE(name, $2),
           phone = COALESCE(phone, $3),
           phone_digits = COALESCE(phone_digits, $4),
           email = COALESCE(email, $5),
           latest_kind = $6,
           latest_message = COALESCE($7, latest_message),
           listing_title = COALESCE($8, listing_title),
           listing_slug = COALESCE($9, listing_slug),
           marketing_consent = marketing_consent OR $10,
           consent_at = CASE WHEN $10 AND NOT marketing_consent THEN now() ELSE consent_at END,
           status = CASE WHEN status = 'lost' THEN 'new' ELSE status END,
           last_activity_at = now()
         WHERE id = $1
         RETURNING id, ref`,
        [
          existing.rows[0].id,
          input.name ?? null,
          input.phone ?? null,
          digits,
          email,
          input.kind,
          input.message ?? null,
          input.listingTitle ?? null,
          input.listingSlug ?? null,
          consent,
        ]
      );
      lead = updated.rows[0];
    } else {
      const inserted = await client.query<{ id: string; ref: string }>(
        `INSERT INTO leads (
           name, phone, phone_digits, email, latest_kind, latest_message,
           listing_title, listing_slug, landing_path, referrer,
           utm_source, utm_medium, utm_campaign, marketing_consent, consent_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, CASE WHEN $14 THEN now() END)
         ON CONFLICT (phone_digits) WHERE phone_digits IS NOT NULL
         DO UPDATE SET last_activity_at = now(), latest_kind = EXCLUDED.latest_kind
         RETURNING id, ref`,
        [
          input.name ?? null,
          input.phone ?? null,
          digits,
          email,
          input.kind,
          input.message ?? null,
          input.listingTitle ?? null,
          input.listingSlug ?? null,
          a.landingPath ?? input.path ?? null,
          a.referrer ?? null,
          a.utmSource ?? null,
          a.utmMedium ?? null,
          a.utmCampaign ?? null,
          consent,
        ]
      );
      lead = inserted.rows[0];
    }

    await client.query(
      `INSERT INTO lead_events (
         lead_id, type, path, listing_title, listing_slug,
         referrer, utm_source, utm_medium, utm_campaign, meta
       ) VALUES ($1, 'form_submitted', $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        lead.id,
        input.path ?? null,
        input.listingTitle ?? null,
        input.listingSlug ?? null,
        a.referrer ?? null,
        a.utmSource ?? null,
        a.utmMedium ?? null,
        a.utmCampaign ?? null,
        JSON.stringify({ kind: input.kind, message: input.message ?? null, ...input.details }),
      ]
    );
    await client.query("COMMIT");
    return lead;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Could not save a lead:", error);
    return null;
  } finally {
    client.release();
  }
}

export async function recordWhatsAppClick(input: {
  ref: string;
  path: string | null;
  placement: string | null;
  listingTitle: string | null;
  listingSlug: string | null;
  attribution: Attribution;
}) {
  const pool = getPool();
  if (!pool) return;
  const a = input.attribution;
  await pool.query(
    `INSERT INTO lead_events (
       type, ref, path, placement, listing_title, listing_slug,
       referrer, utm_source, utm_medium, utm_campaign, meta
     ) VALUES ('whatsapp_click', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (ref) WHERE type = 'whatsapp_click' AND ref IS NOT NULL DO NOTHING`,
    [
      input.ref,
      input.path,
      input.placement,
      input.listingTitle,
      input.listingSlug,
      a.referrer ?? null,
      a.utmSource ?? null,
      a.utmMedium ?? null,
      a.utmCampaign ?? null,
      JSON.stringify({ landingPath: a.landingPath ?? null }),
    ]
  );
}
