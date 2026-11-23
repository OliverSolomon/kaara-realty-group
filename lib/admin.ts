import "server-only";
import { getPool } from "@/lib/db";
import type { LeadStatus } from "@/lib/leadTypes";

export interface LeadRow {
  id: string;
  ref: string;
  status: LeadStatus;
  name: string | null;
  phone: string | null;
  phone_digits: string | null;
  email: string | null;
  latest_kind: string;
  latest_message: string | null;
  listing_title: string | null;
  listing_slug: string | null;
  listing_type: string | null;
  whatsapp_name: string | null;
  social_profiles: Record<string, string>;
  landing_path: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  marketing_consent: boolean;
  first_contacted_at: Date | null;
  created_at: Date;
  last_activity_at: Date;
}

export interface TimelineItem {
  id: string;
  kind: "event" | "note";
  type: string;
  body: string | null;
  author: string | null;
  listing_title: string | null;
  ref: string | null;
  meta: Record<string, unknown> | null;
  created_at: Date;
}

export interface ClickRow {
  id: string;
  ref: string;
  path: string | null;
  placement: string | null;
  listing_title: string | null;
  listing_slug: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  lead_id: string | null;
  lead_name: string | null;
  created_at: Date;
}

const LEAD_COLUMNS = `id, ref, status, name, phone, phone_digits, email, latest_kind, latest_message,
  listing_title, listing_slug, listing_type, whatsapp_name, social_profiles,
  landing_path, referrer, utm_source, utm_medium, utm_campaign, marketing_consent, first_contacted_at, created_at, last_activity_at`;

function db() {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not configured");
  return pool;
}

export async function getStats() {
  const { rows } = await db().query<{
    fresh: number;
    overdue: number;
    week: number;
    won: number;
    clicks: number;
    stays: number;
    stay_clicks: number;
  }>(`SELECT
      count(*) FILTER (WHERE listing_type = 'stay' AND status NOT IN ('won', 'lost'))::int AS stays,
      (SELECT count(*)::int FROM lead_events
        WHERE type = 'whatsapp_click' AND listing_type = 'stay'
          AND created_at > now() - interval '7 days') AS stay_clicks,
      count(*) FILTER (WHERE status = 'new')::int AS fresh,
      count(*) FILTER (WHERE status = 'new' AND last_activity_at < now() - interval '5 minutes')::int AS overdue,
      count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS week,
      count(*) FILTER (WHERE status = 'won')::int AS won,
      (SELECT count(*)::int FROM lead_events
        WHERE type = 'whatsapp_click' AND lead_id IS NULL
          AND created_at > now() - interval '7 days') AS clicks
    FROM leads`);
  return rows[0];
}

export async function getMessages(leadId: string) {
  const { rows } = await db().query<{
    id: string;
    direction: "in" | "out";
    body: string | null;
    message_type: string;
    sent_by: string | null;
    created_at: Date;
  }>(
    `SELECT id::text, direction, body, message_type, sent_by, created_at
     FROM whatsapp_messages WHERE lead_id = $1 ORDER BY created_at ASC LIMIT 200`,
    [leadId]
  );
  return rows;
}

export async function listLeads(status: LeadStatus | null, search: string, interest: string | null = null) {
  const term = search.trim() ? `%${search.trim().replace(/[\\%_]/g, "\\$&")}%` : null;
  const { rows } = await db().query<LeadRow>(
    `SELECT ${LEAD_COLUMNS} FROM leads
     WHERE ($1::text IS NULL OR status = $1)
       AND ($2::text IS NULL OR name ILIKE $2 OR phone ILIKE $2 OR email ILIKE $2
            OR ref ILIKE $2 OR listing_title ILIKE $2)
       AND ($3::text IS NULL OR listing_type = $3)
     ORDER BY (status = 'new') DESC, last_activity_at DESC
     LIMIT 200`,
    [status, term, interest]
  );
  return rows;
}

export async function getLead(id: string) {
  const { rows } = await db().query<LeadRow>(`SELECT ${LEAD_COLUMNS} FROM leads WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function getTimeline(id: string) {
  const { rows } = await db().query<TimelineItem>(
    `SELECT 'e' || id AS id, 'event' AS kind, type, NULL AS body, NULL AS author,
            listing_title, ref, meta, created_at
       FROM lead_events WHERE lead_id = $1
     UNION ALL
     SELECT 'n' || id, 'note', 'note', body, author_email, NULL, NULL, NULL, created_at
       FROM lead_notes WHERE lead_id = $1
     ORDER BY created_at DESC
     LIMIT 200`,
    [id]
  );
  return rows;
}

export async function listClicks() {
  const { rows } = await db().query<ClickRow>(
    `SELECT e.id::text, e.ref, e.path, e.placement, e.listing_title, e.listing_slug,
            e.referrer, e.utm_source, e.utm_campaign, e.lead_id, l.name AS lead_name, e.created_at
       FROM lead_events e LEFT JOIN leads l ON l.id = e.lead_id
      WHERE e.type = 'whatsapp_click'
      ORDER BY e.created_at DESC
      LIMIT 200`
  );
  return rows;
}
