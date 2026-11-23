import { getPool } from "@/lib/db";
import type { PostRow } from "@/app/admin/posts-actions";
import type { Channel } from "@/lib/social/channels";
import PostsApp from "./PostsApp";

export default async function PostsPage() {
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
  return <PostsApp initialPosts={initial} connections={connections.rows} />;
}
