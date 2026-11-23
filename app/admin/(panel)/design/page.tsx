import { getPool } from "@/lib/db";
import DesignHome, { type DesignCard } from "./DesignHome";

export default async function DesignPage() {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not configured");
  const { rows } = await pool.query<DesignCard & { updated_at: Date }>(
    "SELECT id, name, width, height, thumbnail_url AS thumbnail, updated_at FROM designs ORDER BY updated_at DESC LIMIT 200"
  );
  return <DesignHome initial={rows.map(({ updated_at, ...row }) => ({ ...row, updatedAt: new Date(updated_at).toISOString() }))} />;
}
