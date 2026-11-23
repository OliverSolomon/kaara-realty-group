"use client";

import { useMemo, useState } from "react";
import {
  PiArrowLeft,
  PiCheck,
  PiCopy,
  PiDownloadSimple,
  PiFilePdf,
  PiFileText,
  PiFolderSimple,
  PiMagnifyingGlass,
  PiPaintBrush,
  PiTrash,
  PiUploadSimple,
  PiX,
} from "react-icons/pi";
import { uploadAsset } from "@/lib/cms/upload";
import { pagesFromImages, type DesignImage, type DesignLayout } from "@/lib/design/fromAssets";

export interface LibraryAsset {
  id: string;
  kind: string;
  url: string;
  name: string | null;
  mimeType: string | null;
  size: number | null;
  width?: number | null;
  height?: number | null;
  createdAt: string;
  uses: number;
}

export interface PropertyFolder {
  id: string;
  title: string | null;
  listingType: string | null;
  bedrooms: number | null;
  location: string | null;
  district: string | null;
  assetIds: string[];
}

export interface DesignOption {
  id: string;
  name: string;
  width: number;
  height: number;
}

const FILE_FILTERS = [
  { key: "all", label: "All" },
  { key: "image", label: "Images" },
  { key: "pdf", label: "PDFs" },
  { key: "unused", label: "Unused" },
] as const;
const TYPE_FILTERS = [
  { key: "all", label: "All" },
  { key: "buy", label: "Buy" },
  { key: "sell", label: "Sell" },
  { key: "stay", label: "Stay" },
] as const;
const SIZES = [
  { label: "Instagram post", width: 1080, height: 1080 },
  { label: "Instagram portrait", width: 1080, height: 1350 },
  { label: "Story or WhatsApp status", width: 1080, height: 1920 },
  { label: "Facebook post", width: 1200, height: 630 },
  { label: "LinkedIn post", width: 1200, height: 627 },
  { label: "Property flyer (A4)", width: 2480, height: 3508 },
];
const MAX_SELECTED = 30;
const CHIP = "min-h-11 shrink-0 border px-3 text-xs";
const FIELD = "min-h-11 w-full border border-white/15 px-3 text-sm outline-none focus:border-[#4f9d8f]";

const sizeLabel = (bytes: number | null) => (!bytes ? "" : bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
const isPhoto = (asset: LibraryAsset) => asset.kind === "sanity.imageAsset" && Boolean(asset.width && asset.height);
const folderTitle = (folder: PropertyFolder) => folder.title?.trim() || "Untitled property";
const folderDetail = (folder: PropertyFolder) =>
  [folder.bedrooms ? `${folder.bedrooms} bed` : null, folder.location || folder.district, folder.listingType].filter(Boolean).join(" · ");

export default function LibraryApp({ initial, properties, designs }: { initial: LibraryAsset[]; properties: PropertyFolder[]; designs: DesignOption[] }) {
  const [assets, setAssets] = useState(initial);
  const [view, setView] = useState<"properties" | "files">("properties");
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [fileFilter, setFileFilter] = useState<(typeof FILE_FILTERS)[number]["key"]>("all");
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]["key"]>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [showDesign, setShowDesign] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const byId = useMemo(() => new Map(assets.map((asset) => [asset.id, asset])), [assets]);
  const term = search.trim().toLowerCase();
  const folders = useMemo(
    () =>
      properties
        .map((folder) => ({ ...folder, photos: folder.assetIds.map((id) => byId.get(id)).filter((asset): asset is LibraryAsset => Boolean(asset)) }))
        .filter((folder) => folder.photos.length > 0)
        .filter((folder) => typeFilter === "all" || folder.listingType === typeFilter)
        .filter((folder) => !term || `${folderTitle(folder)} ${folderDetail(folder)}`.toLowerCase().includes(term)),
    [properties, byId, typeFilter, term]
  );
  const activeFolder = openFolder ? folders.find((folder) => folder.id === openFolder) ?? null : null;
  const files = useMemo(
    () =>
      assets.filter((asset) => {
        if (term && !(asset.name ?? "").toLowerCase().includes(term)) return false;
        if (fileFilter === "image") return asset.kind === "sanity.imageAsset";
        if (fileFilter === "pdf") return asset.mimeType === "application/pdf";
        if (fileFilter === "unused") return asset.uses === 0;
        return true;
      }),
    [assets, fileFilter, term]
  );
  const shown = view === "files" ? files : activeFolder?.photos ?? [];
  const selectable = shown.filter(isPhoto);
  const allSelected = selectable.length > 0 && selectable.every((asset) => selected.includes(asset.id));

  function toggle(id: string) {
    setError("");
    setSelected((items) => {
      if (items.includes(id)) return items.filter((item) => item !== id);
      if (items.length >= MAX_SELECTED) {
        setError(`Select up to ${MAX_SELECTED} photos at a time.`);
        return items;
      }
      return [...items, id];
    });
  }

  function toggleAll() {
    const ids = selectable.map((asset) => asset.id);
    if (allSelected) return setSelected((items) => items.filter((id) => !ids.includes(id)));
    const next = [...new Set([...selected, ...ids])];
    if (next.length > MAX_SELECTED) setError(`Only the first ${MAX_SELECTED} photos were selected.`);
    setSelected(next.slice(0, MAX_SELECTED));
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    for (const file of Array.from(files).slice(0, 20)) {
      try {
        const kind = file.type.startsWith("image/") ? "image" : "file";
        const asset = await uploadAsset(file, kind, (percent) => setStatus(`Uploading ${file.name}: ${percent}%`));
        const size = kind === "image" ? await imageSize(file) : null;
        setAssets((items) => [
          { id: asset.assetId, kind: kind === "image" ? "sanity.imageAsset" : "sanity.fileAsset", url: asset.url, name: asset.name ?? file.name, mimeType: file.type, size: file.size, width: size?.width, height: size?.height, createdAt: new Date().toISOString(), uses: 0 },
          ...items.filter((item) => item.id !== asset.assetId),
        ]);
      } catch (failure) {
        setError(`${file.name}: ${failure instanceof Error ? failure.message : "upload failed"}`);
      }
    }
    setStatus("");
    setView("files");
  }

  async function remove(asset: LibraryAsset) {
    if (!window.confirm(`Permanently delete ${asset.name ?? "this file"}?`)) return;
    setError("");
    const response = await fetch("/api/admin/library", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ op: "delete", id: asset.id }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return setError(body.error || "The file could not be deleted.");
    setAssets((items) => items.filter((item) => item.id !== asset.id));
    setSelected((items) => items.filter((id) => id !== asset.id));
  }

  const selectedImages: DesignImage[] = selected
    .map((id) => byId.get(id))
    .filter((asset): asset is LibraryAsset => Boolean(asset && isPhoto(asset)))
    .map((asset) => ({ url: asset.url, width: asset.width!, height: asset.height!, name: asset.name }));

  return (
    <div className={selected.length ? "pb-24" : ""}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Library</h1>
          <p className="mt-1 text-sm text-white/55">Photos by property, plus every file used across the site.</p>
        </div>
        <label className="press inline-flex min-h-11 cursor-pointer items-center gap-2 border border-[#4f9d8f] bg-[#2e7d6f] px-4 text-[10px] font-bold uppercase tracking-[0.16em]">
          <PiUploadSimple size={15} aria-hidden="true" />
          Upload
          <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.docx" className="sr-only" onChange={(event) => { void upload(event.target.files); event.target.value = ""; }} />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="flex border border-white/15" role="group" aria-label="Library view">
          {(["properties", "files"] as const).map((item) => (
            <button key={item} type="button" aria-pressed={view === item} onClick={() => { setView(item); setOpenFolder(null); }} className={`min-h-11 px-4 text-[10px] font-bold uppercase tracking-[0.14em] ${view === item ? "bg-[#2e7d6f]/30" : "text-white/55"}`}>
              {item === "properties" ? "By property" : "All files"}
            </button>
          ))}
        </div>
        <div className="flex min-w-48 flex-1 items-center gap-2 border border-white/15 px-3 focus-within:border-[#4f9d8f]">
          <PiMagnifyingGlass size={15} className="text-white/40" aria-hidden="true" />
          <input aria-label="Search library" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={view === "properties" ? "Search properties" : "Search files"} className="min-h-11 w-full min-w-0 bg-transparent text-sm outline-none" />
        </div>
        <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto" role="group" aria-label="Filter">
          {view === "properties"
            ? TYPE_FILTERS.map((item) => <button key={item.key} type="button" aria-pressed={typeFilter === item.key} onClick={() => setTypeFilter(item.key)} className={`${CHIP} ${typeFilter === item.key ? "border-[#4f9d8f] bg-[#2e7d6f]/25" : "border-white/15 text-white/55"}`}>{item.label}</button>)
            : FILE_FILTERS.map((item) => <button key={item.key} type="button" aria-pressed={fileFilter === item.key} onClick={() => setFileFilter(item.key)} className={`${CHIP} ${fileFilter === item.key ? "border-[#4f9d8f] bg-[#2e7d6f]/25" : "border-white/15 text-white/55"}`}>{item.label}</button>)}
        </div>
      </div>

      {status && <p role="status" className="mt-3 text-sm text-[#7fd0c1]">{status}</p>}
      {error && <p role="alert" className="mt-3 border border-[#f0a08a]/40 bg-[#f0a08a]/10 p-3 text-sm text-[#f0a08a]">{error}</p>}

      {view === "properties" && !activeFolder ? (
        folders.length === 0 ? (
          <p className="mt-4 border border-white/10 bg-[#171232] px-6 py-12 text-center text-sm text-white/55">No properties with photos here.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {folders.map((folder) => {
              const picked = folder.photos.filter((asset) => selected.includes(asset.id)).length;
              return (
                <li key={folder.id} className="min-w-0">
                  <button type="button" onClick={() => setOpenFolder(folder.id)} className="press block w-full border border-white/10 bg-[#171232] text-left hover:border-[#4f9d8f]">
                    <span className="relative block aspect-[4/3] overflow-hidden bg-white/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`${folder.photos[0].url}?w=420&h=315&fit=crop&auto=format`} alt="" loading="lazy" className="h-full w-full object-cover" />
                      <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 bg-[#100b28]/85 px-1.5 py-0.5 text-[11px] tabular-nums">
                        <PiFolderSimple size={12} aria-hidden="true" />
                        {folder.photos.length}
                      </span>
                      {picked > 0 && <span className="absolute left-1.5 top-1.5 bg-[#2e7d6f] px-1.5 py-0.5 text-[11px] tabular-nums">{picked} selected</span>}
                    </span>
                    <span className="block p-2">
                      <span className="block truncate text-sm">{folderTitle(folder)}</span>
                      <span className="mt-0.5 block truncate text-[11px] capitalize text-white/45">{folderDetail(folder) || "Property"}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            {activeFolder ? (
              <div className="flex min-w-0 items-center gap-2">
                <button type="button" aria-label="Back to properties" onClick={() => setOpenFolder(null)} className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/15"><PiArrowLeft size={15} /></button>
                <div className="min-w-0">
                  <h2 className="truncate font-serif text-xl">{folderTitle(activeFolder)}</h2>
                  <p className="truncate text-xs capitalize text-white/45">{folderDetail(activeFolder)}</p>
                </div>
              </div>
            ) : <span />}
            {selectable.length > 0 && <button type="button" onClick={toggleAll} className="min-h-11 border border-white/20 px-3 text-xs">{allSelected ? "Clear these" : "Select all"}</button>}
          </div>
          {shown.length === 0 ? (
            <p className="mt-3 border border-white/10 bg-[#171232] px-6 py-12 text-center text-sm text-white/55">No files here.</p>
          ) : (
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
              {shown.map((asset) => {
                const on = selected.includes(asset.id);
                return (
                  <li key={asset.id} className={`relative min-w-0 border bg-[#171232] ${on ? "border-[#4f9d8f]" : "border-white/10"}`}>
                    {isPhoto(asset) && (
                      <button type="button" role="checkbox" aria-checked={on} aria-label={`Select ${asset.name ?? "photo"}`} onClick={() => toggle(asset.id)} className="absolute left-0 top-0 z-10 flex h-11 w-11 items-center justify-center">
                        <span className={`flex h-6 w-6 items-center justify-center border ${on ? "border-[#7fd0c1] bg-[#2e7d6f]" : "border-white/70 bg-[#100b28]/70"}`}>{on && <PiCheck size={14} />}</span>
                      </button>
                    )}
                    {isPhoto(asset) ? (
                      <button type="button" aria-label={`Toggle ${asset.name ?? "photo"}`} onClick={() => toggle(asset.id)} className="block aspect-[4/3] w-full overflow-hidden bg-white/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`${asset.url}?w=360&h=270&fit=crop&auto=format`} alt={asset.name ?? ""} loading="lazy" className="h-full w-full object-cover" />
                      </button>
                    ) : (
                      <a href={asset.url} target="_blank" rel="noopener noreferrer" className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-white/5">
                        {asset.mimeType === "application/pdf" ? <PiFilePdf size={34} className="text-[#f0a08a]" aria-hidden="true" /> : <PiFileText size={34} className="text-white/40" aria-hidden="true" />}
                      </a>
                    )}
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
                );
              })}
            </ul>
          )}
        </>
      )}

      {selected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#4f9d8f]/50 bg-[#171232] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:left-56">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <button type="button" aria-label="Clear selection" onClick={() => setSelected([])} className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/15"><PiX size={15} /></button>
              <span className="truncate text-sm">{selected.length} photo{selected.length === 1 ? "" : "s"} selected</span>
            </div>
            <button type="button" onClick={() => setShowDesign(true)} className="press inline-flex min-h-11 shrink-0 items-center gap-2 border border-[#4f9d8f] bg-[#2e7d6f] px-4 text-[10px] font-bold uppercase tracking-[0.14em]">
              <PiPaintBrush size={15} aria-hidden="true" />
              Use in design
            </button>
          </div>
        </div>
      )}

      {showDesign && <UseInDesign images={selectedImages} designs={designs} onClose={() => setShowDesign(false)} />}
    </div>
  );
}

function imageSize(file: File) {
  return new Promise<{ width: number; height: number } | null>((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { resolve({ width: image.naturalWidth, height: image.naturalHeight }); URL.revokeObjectURL(url); };
    image.onerror = () => { resolve(null); URL.revokeObjectURL(url); };
    image.src = url;
  });
}

function UseInDesign({ images, designs, onClose }: { images: DesignImage[]; designs: DesignOption[]; onClose: () => void }) {
  const [target, setTarget] = useState<"new" | "existing">("new");
  const [size, setSize] = useState(0);
  const [designId, setDesignId] = useState(designs[0]?.id ?? "");
  const [layout, setLayout] = useState<DesignLayout>("pages");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    try {
      if (target === "new") {
        const choice = SIZES[size];
        const response = await fetch("/api/admin/studio/designs", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: `${choice.label} from library`, width: choice.width, height: choice.height, source: "library", pages: pagesFromImages(images, choice.width, choice.height, layout) }),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        window.location.assign(`/design-studio/${body.id}`);
        return;
      }
      const current = await fetch(`/api/admin/studio/designs/${designId}`, { cache: "no-store" });
      const design = await current.json();
      if (!current.ok) throw new Error(design.error);
      const saved = await fetch(`/api/admin/studio/designs/${designId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: design.name, baseUpdatedAt: design.updatedAt, pages: [...design.pages, ...pagesFromImages(images, design.width, design.height, layout)] }),
      });
      const body = await saved.json().catch(() => ({}));
      if (!saved.ok) throw new Error(body.error);
      window.location.assign(`/design-studio/${designId}`);
    } catch (failure) {
      setBusy(false);
      setError(failure instanceof Error && failure.message ? failure.message : "The design could not be created.");
    }
  }

  const choiceClass = (on: boolean) => `min-h-11 border px-3 text-sm ${on ? "border-[#4f9d8f] bg-[#2e7d6f]/25" : "border-white/15 text-white/60"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" role="dialog" aria-modal="true" aria-label="Use photos in a design">
      <div className="max-h-dvh w-full max-w-md overflow-y-auto border border-white/10 bg-[#171232] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl">Use in design</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="flex h-11 w-11 items-center justify-center text-white/70"><PiX size={18} /></button>
        </div>
        <p className="mt-1 text-sm text-white/55">{images.length} photo{images.length === 1 ? "" : "s"} selected</p>

        <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Destination">
          <button type="button" aria-pressed={target === "new"} onClick={() => setTarget("new")} className={choiceClass(target === "new")}>New design</button>
          <button type="button" aria-pressed={target === "existing"} disabled={!designs.length} onClick={() => setTarget("existing")} className={`${choiceClass(target === "existing")} disabled:opacity-40`}>Existing design</button>
        </div>

        <label className="mt-4 block text-xs text-white/55">
          {target === "new" ? "Size" : "Design"}
          {target === "new" ? (
            <select value={size} onChange={(event) => setSize(Number(event.target.value))} className={`${FIELD} mt-1.5`}>
              {SIZES.map((item, index) => <option key={item.label} value={index}>{item.label} ({item.width} × {item.height})</option>)}
            </select>
          ) : (
            <select value={designId} onChange={(event) => setDesignId(event.target.value)} className={`${FIELD} mt-1.5`}>
              {designs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          )}
        </label>

        {images.length > 1 && (
          <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Layout">
            <button type="button" aria-pressed={layout === "pages"} onClick={() => setLayout("pages")} className={choiceClass(layout === "pages")}>One per page</button>
            <button type="button" aria-pressed={layout === "grid"} onClick={() => setLayout("grid")} className={choiceClass(layout === "grid")}>All on one page</button>
          </div>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-[#f0a08a]">{error}</p>}
        <button type="button" disabled={busy || !images.length} onClick={submit} className="press mt-5 min-h-12 w-full border border-[#4f9d8f] bg-[#2e7d6f] text-[10px] font-bold uppercase tracking-[0.16em] text-[#f4faf8] disabled:opacity-50">
          {busy ? "Opening" : "Open in design studio"}
        </button>
      </div>
    </div>
  );
}
