import "server-only";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

let pool: Pool | null = null;

/** The shared pool, or null where no database is configured (for example previews). */
export function getPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 5_000,
      connectionTimeoutMillis: 6_000,
    });
    pool.on("error", (error) => console.error("Database pool error:", error));
    attachDatabasePool(pool);
  }
  return pool;
}
