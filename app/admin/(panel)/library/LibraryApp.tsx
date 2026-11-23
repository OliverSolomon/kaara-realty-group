"use client";

import { useMemo, useState } from "react";
import { PiCopy, PiDownloadSimple, PiFilePdf, PiFileText, PiMagnifyingGlass, PiTrash, PiUploadSimple } from "react-icons/pi";
import { uploadAsset } from "@/lib/cms/upload";

export interface LibraryAsset {
  id: string;
  kind: string;
  url: string;
  name: string | null;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
  uses: number;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "image", label: "Images" },
  { key: "pdf", label: "PDFs" },
  { key: "unused", label: "Unused" },
] as const;

const sizeLabel = (bytes: number | null) => (!bytes ? "" : bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export default function LibraryApp({ initial }: { initial: LibraryAsset[] }) {
  const [assets, setAssets] = useState(initial);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return assets.filter((asset) => {
      if (term && !(asset.name ?? "").toLowerCase().includes(term)) return false;
      if (filter === "image") return asset.kind === "sanity.imageAsset";
      if (filter === "pdf") return asset.mimeType === "application/pdf";
      if (filter === "unused") return asset.uses === 0;
      return true;
    });
  }, [assets, filter, search]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    for (const file of Array.from(files).slice(0, 20)) {
      try {
        const kind = file.type.startsWith("image/") ? "image" : "file";
        const asset = await uploadAsset(file, kind, (percent) => setStatus(`Uploading ${file.name}: ${percent}%`));
        setAssets((items) => [
          { id: asset.assetId, kind: kind === "image" ? "sanity.imageAsset" : "sanity.fileAsset", url: asset.url, name: asset.name ?? file.name, mimeType: file.type, size: file.size, createdAt: new Date().toISOString(), uses: 0 },
          ...items.filter((item) => item.id !== asset.assetId),
        ]);
      } catch (failure) {
        setError(`${file.name}: ${failure instanceof Error ? failure.message : "upload failed"}`);
      }
    }
    setStatus("");
  }

  async function remove(asset: LibraryAsset) {
    if (!window.confirm(`Permanently delete ${asset.name ?? "this file"}?`)) return;
    setError("");
    const response = await fetch("/api/admin/library", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ op: "delete", id: asset.id }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return setError(body.error || "The file could not be deleted.");
    setAssets((items) => items.filter((item) => item.id !== asset.id));
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Library</h1>
          <p className="mt-1 text-sm text-white/55">Every image, PDF and file used across the site.</p>
        </div>
        <label className="press inline-flex min-h-11 cursor-pointer items-center gap-2 border border-[#4f9d8f] bg-[#2e7d6f] px-4 text-[10px] font-bold uppercase tracking-[0.16em]">
          <PiUploadSimple size={15} aria-hidden="true" />
          Upload
          <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.docx" className="sr-only" onChange={(event) => { void upload(event.target.files); event.target.value = ""; }} />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="flex min-w-48 flex-1 items-center gap-2 border border-white/15 px-3 focus-within:border-[#4f9d8f]">
          <PiMagnifyingGlass size={15} className="text-white/40" aria-hidden="true" />
          <input aria-label="Search files" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search files" className="min-h-11 w-full min-w-0 bg-transparent text-sm outline-none" />
        </div>
        <div className="no-scrollbar flex gap-1 overflow-x-auto" role="group" aria-label="Filter">
          {FILTERS.map((item) => (
            <button key={item.key} type="button" aria-pressed={filter === item.key} onClick={() => setFilter(item.key)} className={`min-h-11 shrink-0 border px-3 text-xs ${filter === item.key ? "border-[#4f9d8f] bg-[#2e7d6f]/25" : "border-white/15 text-white/55"}`}>{item.label}</button>
          ))}
        </div>
      </div>
      {status && <p role="status" className="mt-3 text-sm text-[#7fd0c1]">{status}</p>}
      {error && <p role="alert" className="mt-3 border border-[#f0a08a]/40 bg-[#f0a08a]/10 p-3 text-sm text-[#f0a08a]">{error}</p>}
      {visible.length === 0 ? (
        <p className="mt-4 border border-white/10 bg-[#171232] px-6 py-12 text-center text-sm text-white/55">No files here.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          {visible.map((asset) => (
            <li key={asset.id} className="min-w-0 border border-white/10 bg-[#171232]">
              <a href={asset.url} target="_blank" rel="noopener noreferrer" className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-white/5">
                {asset.kind === "sanity.imageAsset" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${asset.url}?w=360&h=270&fit=crop&auto=format`} alt={asset.name ?? ""} loading="lazy" className="h-full w-full object-cover" />
                ) : asset.mimeType === "application/pdf" ? <PiFilePdf size={34} className="text-[#f0a08a]" aria-hidden="true" /> : <PiFileText size={34} className="text-white/40" aria-hidden="true" />}
              </a>
              <div className="p-2">
                <p className="truncate text-xs" title={asset.name ?? ""}>{asset.name ?? "Untitled"}</p>
                <p className="mt-0.5 text-[11px] text-white/40">{sizeLabel(asset.size)}{asset.uses ? ` · used ${asset.uses}×` : " · unused"}</p>
                <div className="mt-1 flex">
                  <button type="button" aria-label={`Copy link to ${asset.name ?? "file"}`} onClick={() => { void navigator.clipboard.writeText(asset.url); setStatus("Link copied."); setTimeout(() => setStatus(""), 1800); }} className="flex h-9 w-9 items-center justify-center text-white/60 hover:text-white"><PiCopy size={15} /></button>
                  <a aria-label={`Download ${asset.name ?? "file"}`} href={`${asset.url}?dl=`} className="flex h-9 w-9 items-center justify-center text-white/60 hover:text-white"><PiDownloadSimple size={15} /></a>
                  {asset.uses === 0 && <button type="button" aria-label={`Delete ${asset.name ?? "file"}`} onClick={() => remove(asset)} className="ml-auto flex h-9 w-9 items-center justify-center text-[#f0a08a]"><PiTrash size={15} /></button>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
