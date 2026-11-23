import { getPool } from "@/lib/db";
import type { PostRow } from "@/app/admin/posts-actions";
import type { Channel } from "@/lib/social/channels";
import { sanityWriter } from "@/lib/sanityAdmin";
import { SHARE_ORIGIN } from "@/lib/seo";
import PostsApp, { type PostSeed } from "./PostsApp";

/** Prefills a social post from a published Market Insight. */
async function insightSeed(id?: string): Promise<PostSeed | null> {
  if (!id || !/^[A-Za-z0-9_-]{1,120}$/.test(id)) return null;
  const insight = await sanityWriter().fetch<{ title?: string; slug?: string; excerpt?: string; tldr?: string; cover?: string } | null>(
    `*[_type == "post" && _id == $id][0]{ title, "slug": slug.current, excerpt, tldr, "cover": coverImage.asset->url }`,
    { id }
  );
  if (!insight?.slug) return null;
  const summary = (insight.excerpt || insight.tldr || "").trim();
  return {
    title: insight.title ?? "Market Insight",
    body: [insight.title, summary].filter(Boolean).join("\n\n"),
    linkUrl: `${SHARE_ORIGIN}/market-insights/${encodeURIComponent(insight.slug)}`,
    media: insight.cover ? [insight.cover] : [],
  };
}

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ insight?: string }> }) {
  const { insight } = await searchParams;
  const seed = await insightSeed(insight);
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not configured");
  const [posts, connections] = await Promise.all([
    pool.query<PostRow>(
      `SELECT id, title, body, channels, media, variants, link_url, status, scheduled_for, posted_at, results
       FROM content_posts ORDER BY COALESCE(scheduled_for, updated_at) DESC LIMIT 500`
    ),
    pool.query<{ channel: Channel; account_name: string | null; account_id: string }>(
      "SELECT channel, account_name, account_id FROM social_connections ORDER BY channel"
    ),
  ]);
  const initial = posts.rows.map((post) => ({
    ...post,
    scheduled_for: post.scheduled_for ? new Date(post.scheduled_for).toISOString() : null,
    posted_at: post.posted_at ? new Date(post.posted_at).toISOString() : null,
  }));
  return <PostsApp initialPosts={initial} connections={connections.rows} seed={seed} />;
}
