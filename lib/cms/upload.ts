const PART_SIZE = 3 * 1024 * 1024;

export interface UploadedAsset {
  assetId: string;
  url: string;
  name?: string;
}

/** Sends a file in parts, because one request to the server is limited to 4.5 MB. */
export async function uploadAsset(file: File, kind: "image" | "file", onProgress?: (percent: number) => void) {
  const uploadId = crypto.randomUUID();
  const total = Math.max(1, Math.ceil(file.size / PART_SIZE));
  for (let part = 0; part < total; part += 1) {
    const form = new FormData();
    form.set("uploadId", uploadId);
    form.set("part", String(part));
    form.set("total", String(total));
    form.set("size", String(file.size));
    form.set("kind", kind);
    form.set("filename", file.name);
    form.set("type", file.type);
    form.set("chunk", file.slice(part * PART_SIZE, (part + 1) * PART_SIZE));
    const response = await fetch("/api/admin/upload/chunk", { method: "POST", body: form });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "The upload failed.");
    onProgress?.(Math.round(((part + 1) / total) * 100));
    if (part === total - 1) return body as UploadedAsset;
  }
  throw new Error("The upload failed.");
}
