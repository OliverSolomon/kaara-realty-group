import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getPool } from "@/lib/db";
import { phoneDigits } from "@/lib/leads";
import { listingInfo, slugFromText } from "@/lib/listing";

const GRAPH = "https://graph.facebook.com/v21.0";
const REF_RE = /\bKR-[2-9A-HJ-NP-Z]{6}\b/;

export function whatsappConfigured() {
  return Boolean(
    process.env.WHATSAPP_APP_SECRET &&
      process.env.WHATSAPP_VERIFY_TOKEN &&
      process.env.WHATSAPP_ACCESS_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

export function validSignature(rawBody: string, header: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(`sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

interface InboundMessage {
  id: string;
  from: string;
  type: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
  image?: { caption?: string };
  document?: { caption?: string; filename?: string };
  video?: { caption?: string };
}

interface WebhookPayload {
  entry?: {
    changes?: {
      field?: string;
      value?: {
        metadata?: { phone_number_id?: string };
        contacts?: { wa_id?: string; profile?: { name?: string } }[];
        messages?: InboundMessage[];
      };
    }[];
  }[];
}

function messageText(message: InboundMessage) {
  return (
    message.text?.body ??
    message.button?.text ??
    message.interactive?.button_reply?.title ??
    message.interactive?.list_reply?.title ??
    message.image?.caption ??
    message.video?.caption ??
    message.document?.caption ??
    message.document?.filename ??
    null
  )?.slice(0, 4000) ?? null;
}

/** Someone chose to message us, so WhatsApp supplies their number and profile name. */
async function saveInbound(message: InboundMessage, profileName: string | null) {
  const pool = getPool();
  const digits = phoneDigits(message.from);
  if (!pool || !digits) return;

  const text = messageText(message);
  const ref = text?.match(REF_RE)?.[0] ?? null;
  const textSlug = slugFromText(text);
  // If the listing type could not be read at click time, it is recovered here.
  const earlierClick = ref
    ? (
        await pool.query<{ listing_slug: string | null; listing_type: string | null }>(
          "SELECT listing_slug, listing_type FROM lead_events WHERE ref = $1 AND type = 'whatsapp_click'",
          [ref]
        )
      ).rows[0]
    : undefined;
  const looked = await listingInfo(textSlug ?? (earlierClick?.listing_type ? null : earlierClick?.listing_slug));
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO whatsapp_messages (wa_message_id, direction, phone_digits, message_type, body, ref)
       VALUES ($1, 'in', $2, $3, $4, $5)
       ON CONFLICT (wa_message_id) DO NOTHING
       RETURNING id`,
      [message.id, digits, message.type.slice(0, 30), text, ref]
    );
    // WhatsApp retries deliveries, so a repeat changes nothing.
    if (!inserted.rows[0]) {
      await client.query("ROLLBACK");
      return;
    }

    const click = ref
      ? (
          await client.query<{
            id: string;
            lead_id: string | null;
            path: string | null;
            listing_title: string | null;
            listing_slug: string | null;
            listing_type: string | null;
            referrer: string | null;
            utm_source: string | null;
            utm_medium: string | null;
            utm_campaign: string | null;
          }>(
            `SELECT id, lead_id, path, listing_title, listing_slug, listing_type, referrer,
                    utm_source, utm_medium, utm_campaign
             FROM lead_events
             WHERE ref = $1 AND type = 'whatsapp_click' AND created_at > now() - interval '30 days'
             FOR UPDATE`,
            [ref]
          )
        ).rows[0]
      : undefined;

    const slug = click?.listing_slug ?? textSlug;
    const title = click?.listing_title ?? looked?.title ?? null;
    const listingType = click?.listing_type ?? looked?.listingType ?? null;

    const lead = await client.query<{ id: string }>(
      `INSERT INTO leads (
         name, whatsapp_name, phone, phone_digits, latest_kind, latest_message, listing_title,
         listing_slug, listing_type, landing_path, referrer, utm_source, utm_medium, utm_campaign
       ) VALUES ($1, $1, $2, $3, 'whatsapp', $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (phone_digits) WHERE phone_digits IS NOT NULL DO UPDATE SET
         name = COALESCE(leads.name, EXCLUDED.name),
         whatsapp_name = COALESCE(EXCLUDED.whatsapp_name, leads.whatsapp_name),
         latest_kind = 'whatsapp',
         latest_message = COALESCE(EXCLUDED.latest_message, leads.latest_message),
         listing_title = COALESCE(EXCLUDED.listing_title, leads.listing_title),
         listing_slug = COALESCE(EXCLUDED.listing_slug, leads.listing_slug),
         listing_type = COALESCE(EXCLUDED.listing_type, leads.listing_type),
         status = CASE WHEN leads.status = 'lost' THEN 'new' ELSE leads.status END,
         last_activity_at = now()
       RETURNING id`,
      [
        profileName,
        `+${digits}`,
        digits,
        text,
        title,
        slug,
        listingType,
        click?.path ?? null,
        click?.referrer ?? null,
        click?.utm_source ?? null,
        click?.utm_medium ?? null,
        click?.utm_campaign ?? null,
      ]
    );
    const leadId = lead.rows[0].id;

    await client.query("UPDATE whatsapp_messages SET lead_id = $1 WHERE wa_message_id = $2", [leadId, message.id]);
    if (click && !click.lead_id) {
      await client.query("UPDATE lead_events SET lead_id = $1, archived_at = NULL WHERE id = $2", [leadId, click.id]);
    }
    await client.query(
      `INSERT INTO lead_events (lead_id, type, ref, listing_title, listing_slug, listing_type, meta)
       VALUES ($1, 'whatsapp_message', $2, $3, $4, $5, $6)`,
      [leadId, ref, title, slug, listingType, JSON.stringify({ text })]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function handleWebhook(payload: WebhookPayload) {
  const ownNumber = process.env.WHATSAPP_PHONE_NUMBER_ID;
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages" || !change.value?.messages?.length) continue;
      if (ownNumber && change.value.metadata?.phone_number_id !== ownNumber) continue;
      const names = new Map(
        (change.value.contacts ?? []).map((contact) => [contact.wa_id, contact.profile?.name?.slice(0, 200) ?? null])
      );
      for (const message of change.value.messages) {
        await saveInbound(message, names.get(message.from) ?? null);
      }
    }
  }
}

/** A free-form reply. WhatsApp allows these for 24 hours after the customer's last message. */
export async function sendWhatsAppText(leadId: string, to: string, body: string, sentBy: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const pool = getPool();
  if (!token || !phoneId || !pool) throw new Error("WhatsApp Business is not connected yet.");

  const { rows } = await pool.query<{ open: boolean }>(
    `SELECT COALESCE(max(created_at) > now() - interval '24 hours', false) AS open
     FROM whatsapp_messages WHERE lead_id = $1 AND direction = 'in'`,
    [leadId]
  );
  if (!rows[0]?.open) throw new Error("The 24-hour reply window has closed. Use the WhatsApp app instead.");

  const response = await fetch(`${GRAPH}/${phoneId}/messages`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body } }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await response.json().catch(() => ({}))) as {
    messages?: { id?: string }[];
    error?: { message?: string };
  };
  const id = data.messages?.[0]?.id;
  if (!response.ok || !id) throw new Error(data.error?.message || "WhatsApp did not accept the message.");

  await pool.query(
    `INSERT INTO whatsapp_messages (wa_message_id, lead_id, direction, phone_digits, body, sent_by)
     VALUES ($1, $2, 'out', $3, $4, $5)`,
    [id, leadId, to, body, sentBy]
  );
}
