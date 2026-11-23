import { audit } from "@/lib/auth/admin";
import { uploaderFromRequest } from "@/lib/auth/shares";
import { sanityWriter } from "@/lib/sanityAdmin";

export const maxDuration = 30;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const FILE_TYPES = new Set(["application/pdf", ...IMAGE_TYPES]);
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const admin = await uploaderFromRequest(request);
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  const kind = form.get("kind") === "file" ? "file" : "image";
  if (!(file instanceof File)) return Response.json({ error: "Choose a file." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Files must be under 4 MB." }, { status: 413 });
  if (!(kind === "image" ? IMAGE_TYPES : FILE_TYPES).has(file.type)) {
    return Response.json({ error: "That file type is not supported." }, { status: 415 });
  }
  try {
    const asset = await sanityWriter().assets.upload(kind, Buffer.from(await file.arrayBuffer()), {
      filename: file.name.replace(/[^\w.-]+/g, "-").slice(0, 120),
      contentType: file.type,
    });
    await audit(admin.email, "asset.uploaded", asset._id, { filename: file.name.slice(0, 120) });
    return Response.json({ assetId: asset._id, url: asset.url, name: asset.originalFilename });
  } catch (error) {
    console.error("Upload failed:", error);
    return Response.json({ error: "The upload failed." }, { status: 502 });
  }
}
