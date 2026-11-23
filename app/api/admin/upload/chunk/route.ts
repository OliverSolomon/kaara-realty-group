import { audit } from "@/lib/auth/admin";
import { uploaderFromRequest } from "@/lib/auth/shares";
import { getPool } from "@/lib/db";
import { sanityWriter } from "@/lib/sanityAdmin";

export const maxDuration = 60;

const MAX_BYTES = 40 * 1024 * 1024;
const MAX_PART = 3.5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const FILE_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ...IMAGE_TYPES,
]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function matchesType(bytes: Buffer, type: string) {
  if (type === "application/pdf") return bytes.subarray(0, 5).toString("latin1") === "%PDF-";
  if (type === "image/png") return bytes.subarray(0, 4).toString("hex") === "89504e47";
  if (type === "image/jpeg") return bytes.subarray(0, 3).toString("hex") === "ffd8ff";
  if (type === "image/gif") return bytes.subarray(0, 3).toString("latin1") === "GIF";
  if (type === "image/webp") return bytes.subarray(8, 12).toString("latin1") === "WEBP";
  return bytes.subarray(0, 2).toString("latin1") === "PK";
}

export async function POST(request: Request) {
  const admin = await uploaderFromRequest(request);
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const pool = getPool();
  if (!pool) return Response.json({ error: "The database is not configured." }, { status: 503 });

  const form = await request.formData();
  const uploadId = String(form.get("uploadId") ?? "");
  const part = Number(form.get("part"));
  const total = Number(form.get("total"));
  const size = Number(form.get("size"));
  const kind = form.get("kind") === "file" ? "file" : "image";
  const type = String(form.get("type") ?? "");
  const filename = String(form.get("filename") ?? "upload").replace(/[^\w.-]+/g, "-").slice(0, 120);
  const chunk = form.get("chunk");

  if (!UUID_RE.test(uploadId) || !Number.isInteger(part) || !Number.isInteger(total) || part < 0 || part >= total || total > 20) {
    return Response.json({ error: "Invalid upload." }, { status: 400 });
  }
  if (!(chunk instanceof Blob) || chunk.size > MAX_PART) return Response.json({ error: "Invalid upload." }, { status: 413 });
  if (!Number.isInteger(size) || size < 1 || size > MAX_BYTES) return Response.json({ error: "Files must be under 40 MB." }, { status: 413 });
  if (!(kind === "image" ? IMAGE_TYPES : FILE_TYPES).has(type)) {
    return Response.json({ error: "That file type is not supported." }, { status: 415 });
  }

  try {
    await pool.query("DELETE FROM upload_chunks WHERE created_at < now() - interval '2 hours'");
    await pool.query(
      `INSERT INTO upload_chunks (upload_id, part, data, created_by) VALUES ($1,$2,$3,$4)
       ON CONFLICT (upload_id, part) DO UPDATE SET data = EXCLUDED.data
       WHERE upload_chunks.created_by = EXCLUDED.created_by`,
      [uploadId, part, Buffer.from(await chunk.arrayBuffer()), admin.email]
    );
    if (part !== total - 1) return Response.json({ ok: true });

    const { rows } = await pool.query<{ data: Buffer }>(
      "SELECT data FROM upload_chunks WHERE upload_id = $1 AND created_by = $2 ORDER BY part",
      [uploadId, admin.email]
    );
    await pool.query("DELETE FROM upload_chunks WHERE upload_id = $1", [uploadId]);
    const bytes = Buffer.concat(rows.map((row) => row.data));
    if (rows.length !== total || bytes.length !== size) return Response.json({ error: "Part of the upload was lost. Try again." }, { status: 409 });
    if (!matchesType(bytes, type)) return Response.json({ error: "The file does not match its type." }, { status: 415 });

    const asset = await sanityWriter().assets.upload(kind, bytes, { filename, contentType: type });
    await audit(admin.email, "asset.uploaded", asset._id, { filename, bytes: bytes.length });
    return Response.json({ assetId: asset._id, url: asset.url, name: asset.originalFilename });
  } catch (error) {
    console.error("Chunk upload failed:", error);
    return Response.json({ error: "The upload failed." }, { status: 502 });
  }
}
