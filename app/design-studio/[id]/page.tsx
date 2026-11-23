import { notFound } from "next/navigation";
import { getPool } from "@/lib/db";
import StudioClient from "./StudioClient";

export default async function DesignStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not configured");
  const { rows } = await pool.query<{
    id: string;
    name: string;
    width: number;
    height: number;
    data: { pages?: unknown[] };
    thumbnail_url: string | null;
    source: string;
    created_at: Date;
    updated_at: Date;
  }>("SELECT * FROM designs WHERE id = $1", [id]);
  const row = rows[0];
  if (!row) notFound();
  return (
    <StudioClient
      design={{
        id: row.id,
        name: row.name,
        width: row.width,
        height: row.height,
        pages: row.data?.pages ?? [],
        thumbnail: row.thumbnail_url,
        source: row.source,
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
      }}
    />
  );
}
