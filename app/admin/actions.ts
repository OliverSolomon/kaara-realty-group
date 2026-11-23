"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { getPool } from "@/lib/db";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/leadTypes";
import { clip, phoneDigits } from "@/lib/leads";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function db() {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not configured");
  return pool;
}

function leadId(form: FormData) {
  const id = String(form.get("leadId") || "");
  if (!UUID_RE.test(id)) throw new Error("Invalid lead");
  return id;
}

export async function updateLeadStatus(form: FormData) {
  const admin = await requireAdmin();
  const id = leadId(form);
  const status = String(form.get("status")) as LeadStatus;
  if (!LEAD_STATUSES.includes(status)) throw new Error("Invalid status");

  await db().query(
    `WITH previous AS (SELECT status FROM leads WHERE id = $1),
     changed AS (
       UPDATE leads SET
         status = $2,
         first_contacted_at = CASE
           WHEN $2 <> 'new' AND first_contacted_at IS NULL THEN now()
           ELSE first_contacted_at
         END
       WHERE id = $1 AND status <> $2
       RETURNING id
     )
     INSERT INTO lead_events (lead_id, type, meta)
     SELECT id, 'status_changed',
            jsonb_build_object('from', (SELECT status FROM previous), 'to', $2::text, 'by', $3::text)
     FROM changed`,
    [id, status, admin.email]
  );
  revalidatePath("/admin");
  revalidatePath(`/admin/leads/${id}`);
}

export async function addLeadNote(form: FormData) {
  const admin = await requireAdmin();
  const id = leadId(form);
  const body = clip(form.get("body"), 4000);
  if (!body) return;
  await db().query(`INSERT INTO lead_notes (lead_id, author_email, body) VALUES ($1, $2, $3)`, [
    id,
    admin.email,
    body,
  ]);
  revalidatePath(`/admin/leads/${id}`);
}

/** Staff enter the number from the real chat, turning an anonymous click into a lead. */
export async function createLeadFromClick(form: FormData) {
  await requireAdmin();
  const eventId = String(form.get("eventId") || "");
  const phone = clip(form.get("phone"), 40);
  const name = clip(form.get("name"), 200);
  const digits = phoneDigits(phone);
  if (!/^\d+$/.test(eventId) || !digits) redirect("/admin/whatsapp?error=phone");

  const { rows } = await db().query<{ id: string }>(
    `WITH click AS (
       SELECT id, listing_title, listing_slug, path, referrer, utm_source, utm_medium, utm_campaign
       FROM lead_events
       WHERE id = $1::bigint AND type = 'whatsapp_click' AND lead_id IS NULL
     ),
     lead AS (
       INSERT INTO leads (name, phone, phone_digits, latest_kind, listing_title, listing_slug,
                          landing_path, referrer, utm_source, utm_medium, utm_campaign)
       SELECT $2, $3, $4, 'whatsapp', listing_title, listing_slug, path, referrer,
              utm_source, utm_medium, utm_campaign
       FROM click
       ON CONFLICT (phone_digits) WHERE phone_digits IS NOT NULL
       DO UPDATE SET
         name = COALESCE(leads.name, EXCLUDED.name),
         latest_kind = 'whatsapp',
         listing_title = COALESCE(EXCLUDED.listing_title, leads.listing_title),
         listing_slug = COALESCE(EXCLUDED.listing_slug, leads.listing_slug),
         last_activity_at = now()
       RETURNING id
     ),
     linked AS (
       UPDATE lead_events SET lead_id = (SELECT id FROM lead)
       WHERE id = (SELECT id FROM click)
     )
     SELECT id FROM lead`,
    [eventId, name, phone, digits]
  );
  revalidatePath("/admin");
  revalidatePath("/admin/whatsapp");
  if (rows[0]) redirect(`/admin/leads/${rows[0].id}`);
  redirect("/admin/whatsapp");
}
