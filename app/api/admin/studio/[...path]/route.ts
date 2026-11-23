import { adminFromRequest, audit } from "@/lib/auth/admin";
import { can } from "@/lib/auth/roles";
import { sharedDesignAllowed } from "@/lib/auth/shares";
import { getPool } from "@/lib/db";
import { sanityWriter } from "@/lib/sanityAdmin";
import { mergePages } from "@canvix/lib/collab/merge";

export const maxDuration = 60;

type Context = { params: Promise<{ path: string[] }> };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_MEDIA = 40 * 1024 * 1024;
const MAX_CHUNK = 3 * 1024 * 1024 + 64 * 1024;
const MAX_THUMBNAIL = 400_000;
const MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"]);
const json = (data: unknown, status = 200) => Response.json(data, { status });
const missing = () => json({ error: "Not found" }, 404);

function db() {
  const pool = getPool();
  if (!pool) throw new Error("The database is not configured.");
  return pool;
}

const clampSize = (value: unknown, fallback: number) => {
  const size = Math.round(Number(value));
  return Number.isFinite(size) && size >= 16 && size <= 8000 ? size : fallback;
};
const cleanName = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim().slice(0, 120) : "Untitled design");
const cleanThumbnail = (value: unknown) =>
  typeof value === "string" && /^data:image\/(png|jpeg|webp);base64,/.test(value) && value.length <= MAX_THUMBNAIL ? value : null;

interface DesignRow {
  id: string;
  name: string;
  width: number;
  height: number;
  data: { pages?: unknown[] };
  thumbnail_url: string | null;
  source: string;
  created_at: Date;
  updated_at: Date;
}

const toRecord = (row: DesignRow) => ({
  id: row.id,
  name: row.name,
  width: row.width,
  height: row.height,
  pages: row.data?.pages ?? [],
  thumbnail: row.thumbnail_url,
  source: row.source,
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
  readOnly: false,
  seq: 0,
});

async function designs(request: Request, method: string, id: string | undefined, action: string | undefined, actor: string) {
  if (!id) {
    if (method === "GET") {
      if (new URL(request.url).searchParams.get("trash") === "1") return json({ designs: [], nextCursor: null });
      const { rows } = await db().query(
        `SELECT id, name, width, height, thumbnail_url AS thumbnail, source, created_at AS "createdAt", updated_at AS "updatedAt"
         FROM designs ORDER BY updated_at DESC LIMIT 200`
      );
      return json({ designs: rows, nextCursor: null });
    }
    if (method === "POST") {
      const body = (await request.json()) as Record<string, unknown>;
      const { rows } = await db().query<DesignRow>(
        `INSERT INTO designs (name, width, height, data, thumbnail_url, source, created_by, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7, date_trunc('milliseconds', now())) RETURNING *`,
        [cleanName(body.name), clampSize(body.width, 1080), clampSize(body.height, 1080), JSON.stringify({ pages: Array.isArray(body.pages) ? body.pages : [] }), cleanThumbnail(body.thumbnail), typeof body.source === "string" ? body.source.slice(0, 120) : "blank", actor]
      );
      await audit(actor, "design.created", rows[0].id);
      return json(toRecord(rows[0]), 201);
    }
    return json({ error: "Method not allowed" }, 405);
  }
  if (!UUID_RE.test(id)) return missing();

  if (action === "versions") {
    if (method === "GET") {
      const { rows } = await db().query(
        `SELECT id, label, name, width, height, pages, created_at AS "createdAt", true AS server
         FROM design_versions WHERE design_id = $1 ORDER BY created_at DESC LIMIT 30`,
        [id]
      );
      return json(rows);
    }
    if (method === "POST") {
      const body = (await request.json()) as Record<string, unknown>;
      const { rows } = await db().query(
        `INSERT INTO design_versions (design_id, label, name, width, height, pages)
         SELECT id, $2, $3, $4, $5, $6 FROM designs WHERE id = $1 RETURNING id, created_at AS "createdAt"`,
        [id, typeof body.label === "string" && body.label.trim() ? body.label.trim().slice(0, 120) : "Version", cleanName(body.name), clampSize(body.width, 1080), clampSize(body.height, 1080), JSON.stringify(Array.isArray(body.pages) ? body.pages : [])]
      );
      if (!rows[0]) return missing();
      await db().query(
        `DELETE FROM design_versions WHERE design_id = $1 AND id NOT IN (
           SELECT id FROM design_versions WHERE design_id = $1 ORDER BY created_at DESC LIMIT 30)`,
        [id]
      );
      return json(rows[0], 201);
    }
    return json({ error: "Method not allowed" }, 405);
  }
  if (action === "comments") return method === "GET" ? json([]) : json({ error: "Comments are not enabled." }, 501);
  if (action) return missing();

  if (method === "GET") {
    const { rows } = await db().query<DesignRow>("SELECT * FROM designs WHERE id = $1", [id]);
    return rows[0] ? json(toRecord(rows[0])) : missing();
  }
  if (method === "PUT") {
    const body = (await request.json()) as Record<string, unknown>;
    const { rows } = await db().query<DesignRow>("SELECT * FROM designs WHERE id = $1", [id]);
    const current = rows[0];
    if (!current) return missing();
    let pages = Array.isArray(body.pages) ? body.pages : current.data?.pages ?? [];
    let merged = false;
    if (typeof body.baseUpdatedAt === "string" && Array.isArray(body.pages)) {
      const base = new Date(body.baseUpdatedAt).getTime();
      if (Number.isFinite(base) && base !== new Date(current.updated_at).getTime()) {
        pages = mergePages((current.data?.pages ?? []) as never, body.pages as never) as unknown[];
        merged = true;
      }
    }
    const thumbnail = body.thumbnail === undefined ? current.thumbnail_url : cleanThumbnail(body.thumbnail) ?? current.thumbnail_url;
    const updated = await db().query<{ updated_at: Date }>(
      `UPDATE designs SET name = $2, data = $3, thumbnail_url = $4, updated_at = date_trunc('milliseconds', now())
       WHERE id = $1 RETURNING updated_at`,
      [id, typeof body.name === "string" ? cleanName(body.name) : current.name, JSON.stringify({ pages }), thumbnail]
    );
    return json({ id, name: cleanName(body.name ?? current.name), updatedAt: new Date(updated.rows[0].updated_at).toISOString(), ...(merged ? { merged: true, pages } : {}) });
  }
  if (method === "DELETE") {
    await db().query("DELETE FROM designs WHERE id = $1", [id]);
    await audit(actor, "design.deleted", id);
    return json({ ok: true });
  }
  return json({ error: "Method not allowed" }, 405);
}

function matchesMime(bytes: Buffer, mime: string) {
  if (mime === "image/png") return bytes.subarray(0, 4).toString("hex") === "89504e47";
  if (mime === "image/jpeg") return bytes.subarray(0, 3).toString("hex") === "ffd8ff";
  if (mime === "image/gif") return bytes.subarray(0, 3).toString("latin1") === "GIF";
  if (mime === "image/webp") return bytes.subarray(8, 12).toString("latin1") === "WEBP";
  return true;
}

async function media(request: Request, method: string, parts: string[], actor: string) {
  const [first, second] = parts;
  if (first === "library") {
    if (!second && method === "GET") {
      const { rows } = await db().query(
        `SELECT id, mime, name, size, created_at AS "createdAt" FROM studio_media
         WHERE finalized_at IS NOT NULL ORDER BY created_at DESC LIMIT 300`
      );
      return json({ items: rows, usedBytes: rows.reduce((total, row) => total + Number(row.size), 0), quotaBytes: 2 * 1024 * 1024 * 1024 });
    }
    if (!second || !UUID_RE.test(second)) return missing();
    if (method === "PATCH") {
      const body = (await request.json()) as { name?: string };
      await db().query("UPDATE studio_media SET name = $2 WHERE id = $1", [second, String(body.name ?? "").trim().slice(0, 120) || null]);
      return json({ ok: true });
    }
    if (method === "DELETE") {
      // The file stays in storage because saved designs may still show it.
      await db().query("DELETE FROM studio_media WHERE id = $1", [second]);
      return json({ ok: true });
    }
    return json({ error: "Method not allowed" }, 405);
  }
  if (!first) {
    if (method !== "POST") return json({ error: "Method not allowed" }, 405);
    const body = (await request.json()) as { mime?: string; size?: number; name?: string };
    const size = Number(body.size);
    if (!MEDIA_TYPES.has(String(body.mime))) return json({ error: "That file type is not supported." }, 415);
    if (!Number.isInteger(size) || size < 1 || size > MAX_MEDIA) return json({ error: "Files must be under 40 MB." }, 413);
    await db().query("DELETE FROM upload_chunks WHERE created_at < now() - interval '2 hours'");
    const { rows } = await db().query<{ id: string }>(
      "INSERT INTO studio_media (mime, name, size, created_by) VALUES ($1,$2,$3,$4) RETURNING id",
      [body.mime, String(body.name ?? "").slice(0, 120) || null, size, actor]
    );
    return json({ id: rows[0].id }, 201);
  }
  if (!UUID_RE.test(first)) return missing();
  if (method === "GET") {
    const { rows } = await db().query<{ url: string | null }>("SELECT url FROM studio_media WHERE id = $1", [first]);
    if (!rows[0]?.url) return missing();
    return new Response(null, { status: 302, headers: { location: rows[0].url, "cache-control": "private, max-age=86400" } });
  }
  const { rows } = await db().query<{ mime: string; name: string | null; size: number; finalized_at: Date | null }>(
    "SELECT mime, name, size, finalized_at FROM studio_media WHERE id = $1",
    [first]
  );
  const item = rows[0];
  if (!item || item.finalized_at) return json({ error: "Upload not found." }, 404);
  if (method === "PATCH") {
    const offset = Number(new URL(request.url).searchParams.get("offset"));
    const chunk = Buffer.from(await request.arrayBuffer());
    if (!Number.isInteger(offset) || offset < 0 || !chunk.length || chunk.length > MAX_CHUNK) return json({ error: "Invalid part." }, 400);
    const stored = await db().query<{ total: number; parts: number }>(
      "SELECT COALESCE(sum(octet_length(data)), 0)::int AS total, count(*)::int AS parts FROM upload_chunks WHERE upload_id = $1",
      [first]
    );
    if (stored.rows[0].total !== offset) return json({ error: "Offset mismatch. Restart the upload." }, 409);
    if (offset + chunk.length > item.size) return json({ error: "The upload is larger than declared." }, 413);
    await db().query("INSERT INTO upload_chunks (upload_id, part, data, created_by) VALUES ($1,$2,$3,$4)", [first, stored.rows[0].parts, chunk, actor]);
    return json({ size: offset + chunk.length });
  }
  if (method === "PUT") {
    const chunks = await db().query<{ data: Buffer }>("SELECT data FROM upload_chunks WHERE upload_id = $1 ORDER BY part", [first]);
    const bytes = Buffer.concat(chunks.rows.map((row) => row.data));
    await db().query("DELETE FROM upload_chunks WHERE upload_id = $1", [first]);
    if (bytes.length !== item.size || !matchesMime(bytes, item.mime)) {
      await db().query("DELETE FROM studio_media WHERE id = $1", [first]);
      return json({ error: "The file did not arrive intact." }, 422);
    }
    const asset = await sanityWriter().assets.upload(item.mime.startsWith("image/") ? "image" : "file", bytes, {
      filename: (item.name ?? "design-media").replace(/[^\w.-]+/g, "-"),
      contentType: item.mime,
    });
    await db().query("UPDATE studio_media SET url = $2, asset_id = $3, finalized_at = now() WHERE id = $1", [first, asset.url, asset._id]);
    return json({ id: first, size: item.size, mime: item.mime });
  }
  return json({ error: "Method not allowed" }, 405);
}

async function icons(request: Request) {
  const query = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 60);
  if (query.length < 2) return json({ icons: [] });
  const response = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=96`, { signal: AbortSignal.timeout(6000) });
  if (!response.ok) return json({ icons: [] });
  const body = (await response.json()) as { icons?: string[] };
  return json({ icons: (body.icons ?? []).filter((icon) => /^[a-z0-9-]+:[a-z0-9-]+$/.test(icon)) });
}

async function fontFile(request: Request) {
  const params = new URL(request.url).searchParams;
  const family = (params.get("family") ?? "").trim();
  const weight = Number(params.get("weight") ?? "400");
  const italic = params.get("italic") === "1";
  if (!family || family.length > 40 || !/^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/.test(family) || ![400, 500, 600, 700, 800, 900].includes(weight)) {
    return json({ error: "invalid request" }, 400);
  }
  const axis = italic ? `ital,wght@1,${weight}` : `wght@${weight}`;
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:${axis}`, {
    headers: { "user-agent": "Mozilla/5.0 (Linux; U; Android 2.2; en-us) AppleWebKit/533.1 Version/4.0 Mobile Safari/533.1" },
    signal: AbortSignal.timeout(6000),
  });
  if (!css.ok) return json({ error: "font not found" }, 404);
  const url = (await css.text()).match(/https:\/\/fonts\.gstatic\.com\/[^)'"\s]+\.ttf/)?.[0];
  if (!url) return json({ error: "no truetype face" }, 404);
  const font = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!font.ok) return json({ error: "font not found" }, 404);
  return new Response(await font.arrayBuffer(), { headers: { "content-type": "font/ttf", "cache-control": "private, max-age=604800" } });
}

async function handle(request: Request, context: Context) {
  const admin = await adminFromRequest(request);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  const { path } = await context.params;
  const [family, ...rest] = path;
  const method = request.method;
  if (!can(admin.role, "design") && !(await sharedDesignAllowed(admin.email, method, family, rest))) return json({ error: "Unauthorized" }, 401);
  try {
    switch (family) {
      case "designs":
        return await designs(request, method, rest[0], rest[1], admin.email);
      case "versions":
        if (method !== "DELETE" || !UUID_RE.test(rest[0] ?? "")) return missing();
        await db().query("DELETE FROM design_versions WHERE id = $1", [rest[0]]);
        return json({ ok: true });
      case "media":
        return await media(request, method, rest, admin.email);
      case "icons":
        return await icons(request);
      case "fonts":
        if (rest[0] === "ttf") return await fontFile(request);
        return method === "GET" ? json({ fonts: [] }) : json({ error: "Custom fonts are not enabled." }, 501);
      case "folders":
        return method === "GET" ? json({ folders: [] }) : json({ error: "Folders are not enabled." }, 501);
      case "brand-kits":
        return method === "GET" ? json({ kits: [] }) : json({ error: "Not found" }, 404);
      case "templates":
        return method === "GET" ? json({ templates: [] }) : json({ error: "Saved templates are not enabled." }, 501);
      case "ai":
        return rest[0] === "capabilities" ? json({ configured: false, capabilities: {} }) : json({ error: "AI is not enabled in this editor." }, 503);
      case "stock-photo":
      case "stock-video":
      case "stock-sound":
        return rest[0] === "available" ? json({ available: false, providers: [] }) : json({ error: "No stock provider is connected." }, 503);
      case "plugins":
        return json({ error: "Plugins are disabled." }, 503);
      case "comments":
        return json({ error: "Comments are not enabled." }, 501);
      default:
        return missing();
    }
  } catch (error) {
    console.error("Studio API error:", error instanceof Error ? error.message : error);
    return json({ error: "The studio request failed." }, 500);
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
