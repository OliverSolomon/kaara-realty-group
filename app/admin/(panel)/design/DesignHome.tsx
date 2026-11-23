"use client";

import { useState } from "react";
import { PiMagnifyingGlass, PiPlus, PiTrash } from "react-icons/pi";
import { createPage } from "@canvix/lib/types";
import type { EstateListing } from "@/lib/design/estateTemplates";
import TemplateGallery from "./TemplateGallery";

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

const TABS = [
  { id: "templates", label: "Templates" },
  { id: "sizes", label: "Blank sizes" },
  { id: "yours", label: "Your designs" },
] as const;

export default function DesignHome({ initial, listings }: { initial: DesignCard[]; listings: EstateListing[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("templates");
  const [query, setQuery] = useState("");
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
    <div className="-mx-4 -my-6 min-h-dvh bg-white px-4 py-6 text-[#0E1318] lg:-mx-8 lg:-my-8 lg:px-8 lg:py-8">
      <section className="rounded-3xl bg-gradient-to-br from-[#CFF3F5] via-[#EADFFF] to-[#FFE4F0] px-5 py-8 text-center sm:py-10">
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
          <span className="bg-gradient-to-r from-[#068297] to-[#7D2AE8] bg-clip-text text-transparent">What will you design today?</span>
        </h1>
        <p className="mt-2 text-sm text-[#0E1318]/65">Share homes for sale, to let and for short stays, ready to post.</p>
        <label className="mx-auto mt-5 flex min-h-12 max-w-xl items-center gap-2 rounded-xl bg-white px-4 shadow-sm ring-1 ring-black/10 focus-within:ring-2 focus-within:ring-[#7D2AE8]">
          <PiMagnifyingGlass size={18} className="shrink-0 text-[#0E1318]/50" aria-hidden="true" />
          <span className="sr-only">Search templates</span>
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setTab("templates"); }}
            placeholder="Search for sale, to let, open house, gold…"
            className="min-h-12 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-[#0E1318]/45"
          />
        </label>
      </section>
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div role="tablist" aria-label="Design sections" className="mt-5 inline-flex rounded-lg border border-black/15 bg-white p-0.5">
        {TABS.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`min-h-9 rounded-md px-3 text-xs font-semibold sm:px-4 ${tab === item.id ? "bg-[#7D2AE8] text-white" : "text-[#0E1318]/70 hover:bg-[#F1F1F4]"}`}>
            {item.label}{item.id === "yours" && designs.length ? ` (${designs.length})` : ""}
          </button>
        ))}
      </div>

      {tab === "templates" && <div className="mt-5"><TemplateGallery listings={listings} query={query} /></div>}

      {tab === "sizes" && <>
      <h2 className="mt-6 text-base font-semibold">Start from a blank page</h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SIZES.map((size) => (
          <li key={size.name}>
            <button type="button" disabled={Boolean(busy)} onClick={() => create(size.name, size.width, size.height)} className="group flex w-full flex-col gap-2 text-left disabled:opacity-60">
              <span className="flex h-[132px] w-full items-center justify-center rounded-2xl bg-[#F1F1F4] transition group-hover:bg-[#E9E4F7]">
                <span className="block rounded-sm bg-white shadow-[3px_4px_0_rgba(0,0,0,0.08)] ring-1 ring-black/10 transition-transform group-hover:-translate-y-1 group-hover:scale-105" style={{ width: Math.round(72 * Math.min(1, size.width / size.height)), height: Math.round(72 * Math.min(1, size.height / size.width)) }} />
              </span>
              <span>
                <span className="block text-sm font-medium">{busy === size.name ? "Creating…" : size.name}</span>
                <span className="block text-xs tabular-nums text-[#0E1318]/55">{size.width} × {size.height}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <form className="mt-4 flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); void create("Custom design", Number(custom.width), Number(custom.height)); }}>
        <label className="text-xs text-[#0E1318]/65">Width
          <input inputMode="numeric" value={custom.width} onChange={(event) => setCustom({ ...custom, width: event.target.value })} className="mt-1 block min-h-11 w-24 rounded-lg border border-black/15 bg-white px-3 text-sm outline-none focus:border-[#7D2AE8]" />
        </label>
        <label className="text-xs text-[#0E1318]/65">Height
          <input inputMode="numeric" value={custom.height} onChange={(event) => setCustom({ ...custom, height: event.target.value })} className="mt-1 block min-h-11 w-24 rounded-lg border border-black/15 bg-white px-3 text-sm outline-none focus:border-[#7D2AE8]" />
        </label>
        <button type="submit" disabled={Boolean(busy)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#7D2AE8] px-4 text-sm font-semibold text-white hover:bg-[#6a22c9] disabled:opacity-60">
          <PiPlus size={14} aria-hidden="true" />
          Custom size
        </button>
      </form>
      </>}

      {tab === "yours" && <>
      <h2 className="mt-6 text-base font-semibold">Your designs</h2>
      {designs.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-[#F1F1F4] px-6 py-12 text-center text-sm text-[#0E1318]/60">No designs yet. Start from a template.</p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {designs.map((design) => (
            <li key={design.id} className="group min-w-0">
              <a href={`/design-studio/${design.id}`} className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[#F1F1F4] ring-1 ring-black/5 transition group-hover:ring-[#7D2AE8]">
                {design.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={design.thumbnail} alt="" className="max-h-full max-w-full object-contain" />
                ) : <span className="text-xs text-[#0E1318]/45">{design.width} × {design.height}</span>}
              </a>
              <div className="mt-1 flex items-center gap-1">
                <a href={`/design-studio/${design.id}`} className="min-w-0 flex-1 truncate text-sm font-medium">{design.name}</a>
                <button type="button" aria-label={`Delete ${design.name}`} onClick={() => remove(design)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"><PiTrash size={15} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      </>}
    </div>
  );
}
