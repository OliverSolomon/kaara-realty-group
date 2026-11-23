import "server-only";
import { randomUUID } from "node:crypto";
import { decryptSecret } from "@/lib/crypto";
import { getPool } from "@/lib/db";
import { assetRefFromUrl, sanityWriter } from "@/lib/sanityAdmin";
import { CHANNEL_INFO, textFor, withUtm, type Channel, type Variant } from "@/lib/social/channels";

export interface PostResult {
  ok: boolean;
  message: string;
  at: string;
  url?: string;
}

export interface PostForPublish {
  id: string;
  title: string | null;
  body: string;
  channels: Channel[];
  media: string[];
  variants: Partial<Record<Channel, Variant>>;
  link_url: string | null;
  results: Record<string, PostResult>;
}

interface Connection {
  channel: Channel;
  account_id: string;
  account_name: string | null;
  access_token_enc: string;
}

const GRAPH = "https://graph.facebook.com/v21.0";
const fail = (message: string): never => {
  throw new Error(message);
};
const json = async (response: Response) => (await response.json().catch(() => ({}))) as Record<string, unknown>;
const errorOf = (body: Record<string, unknown>) => (body.error as { message?: string } | undefined)?.message;

async function postFacebook(connection: Connection, token: string, text: string, images: string[], link: string | null) {
  const base = `${GRAPH}/${encodeURIComponent(connection.account_id)}`;
  const response = images.length
    ? await fetch(`${base}/photos`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: images[0], caption: text, access_token: token }), signal: AbortSignal.timeout(30_000) })
    : await fetch(`${base}/feed`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: text, ...(link ? { link } : {}), access_token: token }), signal: AbortSignal.timeout(20_000) });
  const body = await json(response);
  if (!response.ok) fail(errorOf(body) || "Facebook did not accept the post.");
  const id = body.post_id ?? body.id;
  return id ? `https://www.facebook.com/${id}` : undefined;
}

async function postInstagram(connection: Connection, token: string, text: string, images: string[]) {
  if (!images.length) fail("Instagram posts need an image.");
  const base = `${GRAPH}/${encodeURIComponent(connection.account_id)}`;
  const made = await fetch(`${base}/media`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ image_url: images[0], caption: text, access_token: token }), signal: AbortSignal.timeout(30_000) });
  const media = await json(made);
  if (!made.ok || !media.id) fail(errorOf(media) || "Instagram did not accept the image.");
  const published = await fetch(`${base}/media_publish`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ creation_id: media.id, access_token: token }), signal: AbortSignal.timeout(30_000) });
  const result = await json(published);
  if (!published.ok) fail(errorOf(result) || "Instagram did not publish the post.");
  return undefined;
}

async function postLinkedIn(connection: Connection, token: string, text: string, images: string[]) {
  const author = connection.account_id;
  const media: { status: string; media: string }[] = [];
  for (const url of images.slice(0, 4)) {
    const registered = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ registerUploadRequest: { recipes: ["urn:li:digitalmediaRecipe:feedshare-image"], owner: author, serviceRelationships: [{ relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" }] } }),
      signal: AbortSignal.timeout(20_000),
    });
    const data = (await json(registered)) as { value?: { asset?: string; uploadMechanism?: Record<string, { uploadUrl?: string }> } };
    const uploadUrl = data.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl;
    if (!registered.ok || !uploadUrl || !data.value?.asset) fail("LinkedIn would not accept the image.");
    const bytes = await (await fetch(url, { signal: AbortSignal.timeout(20_000) })).arrayBuffer();
    const uploaded = await fetch(uploadUrl!, { method: "PUT", headers: { authorization: `Bearer ${token}` }, body: Buffer.from(bytes), signal: AbortSignal.timeout(30_000) });
    if (!uploaded.ok) fail("LinkedIn would not accept the image.");
    media.push({ status: "READY", media: data.value!.asset! });
  }
  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "x-restli-protocol-version": "2.0.0" },
    body: JSON.stringify({
      author,
      lifecycleState: "PUBLISHED",
      specificContent: { "com.linkedin.ugc.ShareContent": { shareCommentary: { text }, shareMediaCategory: media.length ? "IMAGE" : "NONE", ...(media.length ? { media } : {}) } },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await json(response);
  if (!response.ok) fail(String(body.message ?? "LinkedIn did not accept the post."));
  const id = String(body.id ?? response.headers.get("x-restli-id") ?? "");
  return id ? `https://www.linkedin.com/feed/update/${id}` : undefined;
}

async function postX(token: string, text: string) {
  const response = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = (await json(response)) as { data?: { id?: string }; detail?: string; title?: string };
  if (!response.ok) fail(body.detail || body.title || "X did not accept the post.");
  return body.data?.id ? `https://x.com/i/web/status/${body.data.id}` : undefined;
}

async function postTikTok(token: string, text: string, images: string[], title: string | null) {
  if (!images.length) fail("TikTok posts need an image.");
  const response = await fetch("https://open.tiktokapis.com/v2/post/publish/content/init/", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json; charset=UTF-8" },
    body: JSON.stringify({
      post_info: { title: (title || text.split("\n")[0]).slice(0, 90), description: text.slice(0, 2200) },
      source_info: { source: "PULL_FROM_URL", photo_cover_index: 0, photo_images: images.slice(0, 35) },
      post_mode: "MEDIA_UPLOAD",
      media_type: "PHOTO",
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const body = (await json(response)) as { error?: { code?: string; message?: string } };
  if (!response.ok || (body.error?.code && body.error.code !== "ok")) fail(body.error?.message || "TikTok did not accept the post.");
  return undefined;
}

/** The website always gets a draft, so nothing goes live on the site without review. */
async function postWebsite(post: PostForPublish, text: string) {
  const title = (post.title || text.split("\n")[0] || "Untitled").slice(0, 120);
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70)}-${Date.now().toString(36)}`;
  const id = randomUUID();
  const coverRef = post.media[0] ? assetRefFromUrl(post.media[0]) : null;
  await sanityWriter().create({
    _id: `drafts.${id}`,
    _type: "post",
    title,
    slug: { _type: "slug", current: slug },
    category: "company-note",
    excerpt: text.replace(/\s+/g, " ").slice(0, 200),
    publishedAt: new Date().toISOString(),
    ...(coverRef ? { coverImage: { _type: "image", asset: { _type: "reference", _ref: coverRef } } } : {}),
    content: text.split(/\n{2,}/).filter(Boolean).map((paragraph) => ({
      _type: "block",
      _key: randomUUID().slice(0, 12),
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: randomUUID().slice(0, 12), text: paragraph, marks: [] }],
    })),
  });
  return `/admin/content/post/${id}`;
}

/** Publishes to each chosen channel. A channel that already succeeded is never posted twice. */
export async function publishPost(post: PostForPublish) {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not configured");
  const results = { ...(post.results ?? {}) };
  const { rows } = await pool.query<Connection>(
    "SELECT channel, account_id, account_name, access_token_enc FROM social_connections WHERE channel = ANY($1)",
    [post.channels]
  );
  const connections = new Map(rows.map((row) => [row.channel, row]));

  for (const channel of post.channels) {
    if (results[channel]?.ok) continue;
    const at = new Date().toISOString();
    try {
      const text = textFor(post, channel);
      const info = CHANNEL_INFO[channel];
      if (text.length > info.limit) fail(`The text is over the ${info.limit} character limit.`);
      if (channel === "website") {
        results[channel] = { ok: true, message: "Added to Content as a draft for review", at, url: await postWebsite(post, text) };
        continue;
      }
      const connection = connections.get(channel);
      if (!connection) fail(`${info.label} is not connected yet.`);
      const token = decryptSecret(connection!.access_token_enc);
      const link = post.link_url ? withUtm(post.link_url, channel, post.title) : null;
      const url =
        channel === "facebook" ? await postFacebook(connection!, token, text, post.media, link)
        : channel === "instagram" ? await postInstagram(connection!, token, text, post.media)
        : channel === "linkedin" ? await postLinkedIn(connection!, token, text, post.media)
        : channel === "x" ? await postX(token, text)
        : await postTikTok(token, text, post.media, post.title);
      results[channel] = { ok: true, message: `Posted to ${connection!.account_name ?? info.label}`, at, url };
    } catch (error) {
      results[channel] = { ok: false, message: error instanceof Error ? error.message.slice(0, 240) : "Could not publish.", at };
    }
  }

  const allOk = post.channels.length > 0 && post.channels.every((channel) => results[channel]?.ok);
  await pool.query(
    `UPDATE content_posts SET results = $2, status = $3,
       posted_at = CASE WHEN $3 = 'posted' THEN now() ELSE posted_at END, updated_at = now()
     WHERE id = $1`,
    [post.id, JSON.stringify(results), allOk ? "posted" : "failed"]
  );
  return results;
}

/** Each due post is claimed first, so overlapping runs cannot publish it twice. */
export async function publishDue() {
  const pool = getPool();
  if (!pool) return { due: 0, posted: 0 };
  await pool.query(
    `UPDATE content_posts
     SET status = 'failed', updated_at = now(),
         results = results || '{"_system":{"ok":false,"message":"Publishing was interrupted. Check each network before retrying."}}'::jsonb
     WHERE status = 'publishing' AND updated_at < now() - interval '15 minutes'`
  );
  const { rows } = await pool.query<PostForPublish>(
    `UPDATE content_posts SET status = 'publishing', updated_at = now()
     WHERE id IN (
       SELECT id FROM content_posts
       WHERE status = 'scheduled' AND scheduled_for <= now()
       ORDER BY scheduled_for
       LIMIT 10
       FOR UPDATE SKIP LOCKED
     )
     RETURNING id, title, body, channels, media, variants, link_url, results`
  );
  let posted = 0;
  for (const post of rows) {
    const results = await publishPost(post);
    if (post.channels.every((channel) => results[channel]?.ok)) posted += 1;
  }
  return { due: rows.length, posted };
}
