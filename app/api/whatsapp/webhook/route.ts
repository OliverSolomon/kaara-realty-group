import { timingSafeEqual } from "node:crypto";
import { handleWebhook, validSignature } from "@/lib/whatsapp";

export const maxDuration = 30;

/** Meta calls this once to confirm the webhook belongs to us. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const expected = Buffer.from(process.env.WHATSAPP_VERIFY_TOKEN || "");
  const given = Buffer.from(params.get("hub.verify_token") || "");
  const ok =
    params.get("hub.mode") === "subscribe" &&
    expected.length > 0 &&
    given.length === expected.length &&
    timingSafeEqual(given, expected);
  if (!ok) return new Response("Forbidden", { status: 403 });
  return new Response(params.get("hub.challenge") || "", { status: 200 });
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-hub-signature-256"))) {
    return new Response("Invalid signature", { status: 401 });
  }
  try {
    await handleWebhook(JSON.parse(raw));
    return new Response("OK", { status: 200 });
  } catch (error) {
    // A non-200 makes Meta retry, and repeats are ignored by message id.
    console.error("WhatsApp webhook failed:", error);
    return new Response("Retry", { status: 500 });
  }
}
