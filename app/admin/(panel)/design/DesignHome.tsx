"use client";

import { useState } from "react";
import { PiPlus, PiTrash } from "react-icons/pi";
import { createPage } from "@canvix/lib/types";

export interface DesignCard {
  id: string;
  name: string;
  width: number;
  height: number;
  thumbnail: string | null;
  updatedAt: string;
}

const SIZES = [
  { name: "Instagram post", width: 1080, height: 1080 },
  { name: "Instagram portrait", width: 1080, height: 1350 },
  { name: "Story or WhatsApp status", width: 1080, height: 1920 },
  { name: "Facebook post", width: 1200, height: 630 },
  { name: "LinkedIn post", width: 1200, height: 627 },
  { name: "X post", width: 1600, height: 900 },
  { name: "Property flyer (A4)", width: 2480, height: 3508 },
  { name: "Presentation", width: 1920, height: 1080 },
];

export default function DesignHome({ initial }: { initial: DesignCard[] }) {
  const [designs, setDesigns] = useState(initial);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [custom, setCustom] = useState({ width: "1080", height: "1080" });

  async function create(name: string, width: number, height: number) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 16 || height < 16 || width > 8000 || height > 8000) {
      setError("Use a width and height between 16 and 8000 pixels.");
      return;
    }
    setBusy(name);
    setError("");
    try {
      const response = await fetch("/api/admin/studio/designs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, width, height, pages: [createPage()] }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      window.location.assign(`/design-studio/${body.id}`);
    } catch (failure) {
      setBusy("");
      setError(failure instanceof Error && failure.message ? failure.message : "The design could not be created.");
    }
  }

  async function remove(design: DesignCard) {
    if (!window.confirm(`Permanently delete “${design.name}”?`)) return;
    const response = await fetch(`/api/admin/studio/designs/${design.id}`, { method: "DELETE" });
    if (!response.ok) return setError("The design could not be deleted.");
    setDesigns((items) => items.filter((item) => item.id !== design.id));
  }

  return (
    <>
      <h1 className="font-serif text-3xl">Design</h1>
      <p className="mt-1 text-sm text-white/55">Create graphics for listings, posts and print.</p>
      {error && <p role="alert" className="mt-4 border border-[#f0a08a]/40 bg-[#f0a08a]/10 p-3 text-sm text-[#f0a08a]">{error}</p>}

      <h2 className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Start a design</h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {SIZES.map((size) => (
          <li key={size.name}>
            <button type="button" disabled={Boolean(busy)} onClick={() => create(size.name, size.width, size.height)} className="press flex h-full min-h-28 w-full flex-col justify-between border border-white/10 bg-[#171232] p-3 text-left hover:border-[#4f9d8f] disabled:opacity-60">
              <span className="flex h-10 items-center">
                <span className="block border border-[#4f9d8f]/70 bg-[#2e7d6f]/20" style={{ width: Math.round(40 * Math.min(1, size.width / size.height)), height: Math.round(40 * Math.min(1, size.height / size.width)) }} />
              </span>
              <span>
                <span className="block text-sm">{busy === size.name ? "Creating…" : size.name}</span>
                <span className="mt-0.5 block text-[11px] tabular-nums text-white/45">{size.width} × {size.height}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); void create("Custom design", Number(custom.width), Number(custom.height)); }}>
        <label className="text-xs text-white/55">Width
          <input inputMode="numeric" value={custom.width} onChange={(event) => setCustom({ ...custom, width: event.target.value })} className="mt-1 block min-h-11 w-24 border border-white/15 bg-transparent px-3 text-sm outline-none focus:border-[#4f9d8f]" />
        </label>
        <label className="text-xs text-white/55">Height
          <input inputMode="numeric" value={custom.height} onChange={(event) => setCustom({ ...custom, height: event.target.value })} className="mt-1 block min-h-11 w-24 border border-white/15 bg-transparent px-3 text-sm outline-none focus:border-[#4f9d8f]" />
        </label>
        <button type="submit" disabled={Boolean(busy)} className="press inline-flex min-h-11 items-center gap-2 border border-white/20 px-4 text-[10px] font-bold uppercase tracking-[0.14em] disabled:opacity-60">
          <PiPlus size={14} aria-hidden="true" />
          Custom size
        </button>
      </form>

      <h2 className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Your designs</h2>
      {designs.length === 0 ? (
        <p className="mt-3 border border-white/10 bg-[#171232] px-6 py-12 text-center text-sm text-white/55">No designs yet. Pick a size above.</p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {designs.map((design) => (
            <li key={design.id} className="min-w-0 border border-white/10 bg-[#171232]">
              <a href={`/design-studio/${design.id}`} className="flex aspect-square items-center justify-center overflow-hidden bg-white/5">
                {design.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={design.thumbnail} alt="" className="max-h-full max-w-full object-contain" />
                ) : <span className="text-xs text-white/35">{design.width} × {design.height}</span>}
              </a>
              <div className="flex items-center gap-1 p-2">
                <a href={`/design-studio/${design.id}`} className="min-w-0 flex-1 truncate text-xs">{design.name}</a>
                <button type="button" aria-label={`Delete ${design.name}`} onClick={() => remove(design)} className="flex h-9 w-9 shrink-0 items-center justify-center text-[#f0a08a]"><PiTrash size={14} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
