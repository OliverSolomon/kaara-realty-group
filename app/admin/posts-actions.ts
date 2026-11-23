"use server";

import { revalidatePath } from "next/cache";
import { audit, requireAdmin } from "@/lib/auth/admin";
import { encryptSecret } from "@/lib/crypto";
import { getPool } from "@/lib/db";
import { CHANNELS, CHANNEL_INFO, NEEDS_ACCOUNT, textFor, type Channel, type Variant } from "@/lib/social/channels";
import { publishPost, type PostForPublish, type PostResult } from "@/lib/social/publish";

export interface PostRow {
  id: string;
  title: string | null;
  body: string;
  channels: Channel[];
  media: string[];
  variants: Partial<Record<Channel, Variant>>;
  link_url: string | null;
  status: "draft" | "scheduled" | "publishing" | "posted" | "failed" | "cancelled";
  scheduled_for: string | null;
  posted_at: string | null;
  results: Record<string, PostResult>;
}

export interface PostInput {
  title?: string | null;
  body: string;
  channels: Channel[];
  media: string[];
  variants: Partial<Record<Channel, Variant>>;
  linkUrl?: string | null;
  scheduledFor?: string | null;
  schedule: boolean;
}

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const COLUMNS = "id, title, body, channels, media, variants, link_url, status, scheduled_for, posted_at, results";
const UUID_RE = /^[0-9a-f-]{36}$/i;

function db() {
  const pool = getPool();
  if (!pool) throw new Error("The database is not configured.");
  return pool;
}

const serial = (row: PostRow & { scheduled_for: unknown; posted_at: unknown }): PostRow => ({
  ...row,
  scheduled_for: row.scheduled_for ? new Date(row.scheduled_for as string).toISOString() : null,
  posted_at: row.posted_at ? new Date(row.posted_at as string).toISOString() : null,
});

async function attempt<T>(work: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

function normalise(input: PostInput) {
  const body = (input.body ?? "").trim().slice(0, 10000);
  const channels = [...new Set((input.channels ?? []).filter((channel) => CHANNELS.includes(channel)))];
  const media = (input.media ?? []).filter((url) => /^https:\/\/cdn\.sanity\.io\//.test(url)).slice(0, 10);
  const variants: Partial<Record<Channel, Variant>> = {};
  for (const channel of channels) {
    const variant = input.variants?.[channel];
    if (!variant) continue;
    const text = variant.body?.trim().slice(0, 10000);
    const hashtags = (variant.hashtags ?? []).map((tag) => tag.trim().replace(/^#+/, "")).filter((tag) => /^[\p{L}\p{N}_]{1,60}$/u.test(tag)).slice(0, 30);
    if (text || hashtags.length) variants[channel] = { ...(text ? { body: text } : {}), ...(hashtags.length ? { hashtags } : {}) };
  }
  let link: string | null = null;
  if (input.linkUrl?.trim()) {
    const parsed = new URL(input.linkUrl.trim());
    if (parsed.protocol !== "https:") throw new Error("The link must start with https://.");
    link = parsed.toString();
  }
  let when: string | null = null;
  if (input.scheduledFor) {
    const date = new Date(input.scheduledFor);
    if (Number.isNaN(date.getTime())) throw new Error("That date and time is not valid.");
    when = date.toISOString();
  }
  const title = input.title?.trim().slice(0, 120) || null;
  if (input.schedule) {
    if (!when) throw new Error("Pick a date and time.");
    if (new Date(when).getTime() < Date.now() - 60_000) throw new Error("Pick a time in the future.");
    if (!channels.length) throw new Error("Choose at least one channel.");
    if (!body) throw new Error("Write the post first.");
    for (const channel of channels) {
      const info = CHANNEL_INFO[channel];
      if (info.needsImage && !media.length) throw new Error(`${info.label} posts need an image.`);
      const length = textFor({ body, title, link_url: link, variants }, channel).length;
      if (length > info.limit) throw new Error(`${info.label} is limited to ${info.limit} characters. This is ${length}.`);
    }
  }
  return { title, body, channels, media, variants, link, when, status: input.schedule ? "scheduled" : "draft" };
}

export async function savePost(id: string | null, input: PostInput) {
  return attempt(async () => {
    const admin = await requireAdmin();
    if (id && !UUID_RE.test(id)) throw new Error("Invalid post.");
    const row = normalise(input);
    const values = [row.title, row.body, row.channels, row.media, JSON.stringify(row.variants), row.link, row.status, row.when];
    const result = id
      ? await db().query<PostRow>(
          `UPDATE content_posts SET title=$1, body=$2, channels=$3, media=$4, variants=$5, link_url=$6, status=$7,
             scheduled_for=$8, updated_at=now()
           WHERE id=$9 AND status NOT IN ('publishing', 'posted') RETURNING ${COLUMNS}`,
          [...values, id]
        )
      : await db().query<PostRow>(
          `INSERT INTO content_posts (title, body, channels, media, variants, link_url, status, scheduled_for, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ${COLUMNS}`,
          [...values, admin.email]
        );
    if (!result.rows[0]) throw new Error("This post is being published or was already posted.");
    await audit(admin.email, id ? "post.updated" : "post.created", result.rows[0].id, { status: row.status });
    revalidatePath("/admin/posts");
    return serial(result.rows[0]);
  });
}

export async function publishNow(id: string) {
  return attempt(async () => {
    const admin = await requireAdmin();
    if (!UUID_RE.test(id)) throw new Error("Invalid post.");
    const { rows } = await db().query<PostForPublish>(
      `UPDATE content_posts SET status='publishing', updated_at=now()
       WHERE id=$1 AND status IN ('draft','scheduled','failed') AND btrim(body) <> ''
         AND cardinality(channels) > 0
       RETURNING id, title, body, channels, media, variants, link_url, results`,
      [id]
    );
    if (!rows[0]) throw new Error("Add text and a channel, or wait for the current publish to finish.");
    const results = await publishPost(rows[0]);
    await audit(admin.email, "post.published", id, { channels: rows[0].channels });
    revalidatePath("/admin/posts");
    return results;
  });
}

export async function markPosted(id: string) {
  return attempt(async () => {
    const admin = await requireAdmin();
    if (!UUID_RE.test(id)) throw new Error("Invalid post.");
    await db().query("UPDATE content_posts SET status='posted', posted_at=now(), updated_at=now() WHERE id=$1 AND status <> 'publishing'", [id]);
    await audit(admin.email, "post.marked_posted", id);
    revalidatePath("/admin/posts");
  });
}

export async function deletePost(id: string) {
  return attempt(async () => {
    const admin = await requireAdmin();
    if (!UUID_RE.test(id)) throw new Error("Invalid post.");
    await db().query("DELETE FROM content_posts WHERE id=$1 AND status <> 'publishing'", [id]);
    await audit(admin.email, "post.deleted", id);
    revalidatePath("/admin/posts");
  });
}

export async function connectChannel(channel: Channel, accountId: string, accountName: string, token: string) {
  return attempt(async () => {
    const admin = await requireAdmin();
    if (!NEEDS_ACCOUNT.includes(channel)) throw new Error("Unknown network.");
    const id = accountId.trim().slice(0, 120);
    if (!id || !token.trim()) throw new Error("Enter the account and access token.");
    await db().query(
      `INSERT INTO social_connections (channel, account_id, account_name, access_token_enc, connected_by)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (channel) DO UPDATE SET account_id=EXCLUDED.account_id, account_name=EXCLUDED.account_name,
         access_token_enc=EXCLUDED.access_token_enc, connected_by=EXCLUDED.connected_by, connected_at=now()`,
      [channel, id, accountName.trim().slice(0, 80) || null, encryptSecret(token.trim()), admin.email]
    );
    await audit(admin.email, "channel.connected", channel);
    revalidatePath("/admin/posts");
  });
}

export async function disconnectChannel(channel: Channel) {
  return attempt(async () => {
    const admin = await requireAdmin();
    await db().query("DELETE FROM social_connections WHERE channel=$1", [channel]);
    await audit(admin.email, "channel.disconnected", channel);
    revalidatePath("/admin/posts");
  });
}
