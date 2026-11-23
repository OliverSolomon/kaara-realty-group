"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PiCheck, PiX } from "react-icons/pi";
import { DesignPreview } from "@canvix/components/design-preview";
import { ensureDocumentFonts } from "@canvix/lib/fonts/loader";
import {
  allEstateSpecs,
  buildEstatePage,
  CAMPAIGNS,
  estateTemplateName,
  FORMATS,
  LAYOUTS,
  PALETTES,
  SAMPLE_LISTING,
  type CampaignId,
  type EstateListing,
  type EstateSpec,
  type FormatId,
} from "@/lib/design/estateTemplates";

const PAGE = 16;
const GROUPS = [
  { type: "buy", label: "For sale" },
  { type: "sell", label: "Owner resale" },
  { type: "stay", label: "Stays and rentals" },
];
const chip = (on: boolean) =>
  `shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${on ? "border-[#7D2AE8] bg-[#7D2AE8] text-white" : "border-black/15 bg-white text-[#0E1318]/75 hover:border-[#7D2AE8]/50"}`;

/** A stable mix, so neighbouring cards do not all share a layout or colour. */
function mixKey(spec: EstateSpec) {
  let hash = 7;
  for (const char of `${spec.campaign}${spec.layout}${spec.palette}`) hash = (hash * 31 + char.charCodeAt(0)) % 10007;
  return hash;
}

function Preview({ spec, listing, scale }: { spec: EstateSpec; listing: EstateListing; scale: number }) {
  const format = FORMATS.find((item) => item.id === spec.format)!;
  const box = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const watcher = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setSeen(true);
        watcher.disconnect();
      }
    }, { rootMargin: "240px" });
    watcher.observe(node);
    return () => watcher.disconnect();
  }, []);
  const page = useMemo(() => (seen ? buildEstatePage(spec, listing, scale) : null), [seen, spec, listing, scale]);
  useEffect(() => {
    if (page) ensureDocumentFonts([page]);
  }, [page]);
  return (
    <div ref={box} className="relative w-full overflow-hidden bg-[#F1F1F4]" style={{ aspectRatio: `${format.width} / ${format.height}` }}>
      {page && <div className="absolute inset-0"><DesignPreview page={page} width={format.width} height={format.height} /></div>}
    </div>
  );
}

function ListingSelect({ listings, value, onChange, label }: { listings: EstateListing[]; value: string; onChange: (id: string) => void; label: string }) {
  return (
    <label className="block min-w-0 text-xs font-medium text-[#0E1318]/65">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} style={{ background: "#FFFFFF", color: "#0E1318", colorScheme: "light" }} className="mt-1 block min-h-11 w-full min-w-0 rounded-lg border border-black/15 px-3 text-sm outline-none focus:border-[#7D2AE8]">
        {GROUPS.map((group) => {
          const items = listings.filter((item) => item.listingType === group.type);
          return items.length ? (
            <optgroup key={group.type} label={group.label}>
              {items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </optgroup>
          ) : null;
        })}
      </select>
    </label>
  );
}

export default function TemplateGallery({ listings, query }: { listings: EstateListing[]; query: string }) {
  const [campaign, setCampaign] = useState<CampaignId | "all">("all");
  const [format, setFormat] = useState<FormatId>("post");
  const [listingId, setListingId] = useState(listings[0]?.id ?? "");
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<EstateSpec | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const listing = listings.find((item) => item.id === listingId) ?? listings[0] ?? SAMPLE_LISTING;

  const specs = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return allEstateSpecs(format)
      .filter((spec) => campaign === "all" || spec.campaign === campaign)
      .filter((spec) => {
        const palette = PALETTES.find((item) => item.id === spec.palette)!.label;
        const haystack = `${estateTemplateName(spec)} ${palette}`.toLowerCase();
        return words.every((word) => haystack.includes(word));
      })
      .sort((a, b) => mixKey(a) - mixKey(b));
  }, [campaign, format, query]);

  function pickCampaign(next: CampaignId | "all") {
    setCampaign(next);
    setShown(PAGE);
    if (next === "all") return;
    const fits: readonly string[] = CAMPAIGNS.find((item) => item.id === next)!.fits;
    if (!fits.includes(listing.listingType ?? "")) {
      const match = listings.find((item) => fits.includes(item.listingType ?? ""));
      if (match) setListingId(match.id);
    }
  }

  async function customise(spec: EstateSpec) {
    const size = FORMATS.find((item) => item.id === spec.format)!;
    const label = CAMPAIGNS.find((item) => item.id === spec.campaign)!.label;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/studio/designs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: `${label}: ${listing.title}`.slice(0, 80),
          width: size.width,
          height: size.height,
          pages: [buildEstatePage(spec, listing)],
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      window.location.assign(`/design-studio/${body.id}`);
    } catch (failure) {
      setBusy(false);
      setError(failure instanceof Error && failure.message ? failure.message : "The design could not be created.");
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <section aria-label="Real estate templates">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label="Campaign">
        <button type="button" aria-pressed={campaign === "all"} onClick={() => pickCampaign("all")} className={chip(campaign === "all")}>All</button>
        {CAMPAIGNS.map((item) => (
          <button key={item.id} type="button" aria-pressed={campaign === item.id} onClick={() => pickCampaign(item.id)} className={chip(campaign === item.id)}>{item.label}</button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)] md:items-end">
        <div>
          <p className="text-xs font-medium text-[#0E1318]/65">Size</p>
          <div className="no-scrollbar mt-1 flex gap-1 overflow-x-auto rounded-lg border border-black/15 bg-white p-0.5 md:inline-flex" role="group" aria-label="Size">
            {FORMATS.map((item) => (
              <button key={item.id} type="button" aria-pressed={format === item.id} onClick={() => { setFormat(item.id); setShown(PAGE); }} className={`min-h-9 shrink-0 rounded-md px-3 text-xs font-semibold ${format === item.id ? "bg-[#7D2AE8] text-white" : "text-[#0E1318]/70 hover:bg-[#F1F1F4]"}`}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
        {listings.length > 0 && <ListingSelect listings={listings} value={listing.id} onChange={setListingId} label="Preview with property" />}
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <p className="mt-4 text-sm text-[#0E1318]/60">{specs.length} templates</p>

      {specs.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-[#F1F1F4] px-6 py-12 text-center text-sm text-[#0E1318]/60">No templates match that search.</p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {specs.slice(0, shown).map((spec) => (
            <li key={`${spec.campaign}-${spec.layout}-${spec.palette}`}>
              <button type="button" onClick={() => setOpen(spec)} className="group block w-full text-left" aria-label={`Open ${estateTemplateName(spec)}`}>
                <span className="relative block overflow-hidden rounded-xl shadow-sm ring-1 ring-black/10 transition group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:ring-2 group-hover:ring-[#7D2AE8]">
                  <Preview spec={spec} listing={listing} scale={0.34} />
                  <span className="absolute inset-x-2 bottom-2 hidden rounded-lg bg-[#7D2AE8] py-2 text-center text-xs font-semibold text-white group-hover:block">Use template</span>
                </span>
                <span className="mt-1.5 block truncate text-sm font-medium text-[#0E1318]">{estateTemplateName(spec)}</span>
                <span className="block truncate text-xs text-[#0E1318]/55">{PALETTES.find((item) => item.id === spec.palette)!.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {shown < specs.length && (
        <div className="mt-6 text-center">
          <button type="button" onClick={() => setShown((count) => count + PAGE)} className="min-h-11 rounded-lg border border-black/15 bg-white px-5 text-sm font-semibold hover:border-[#7D2AE8]">Show more templates</button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={() => setOpen(null)}>
          <div role="dialog" aria-modal="true" aria-label={estateTemplateName(open)} onClick={(event) => event.stopPropagation()} className="relative grid max-h-[94dvh] w-full max-w-4xl gap-5 overflow-y-auto rounded-t-2xl bg-white p-4 text-[#0E1318] sm:rounded-2xl sm:p-6 md:grid-cols-[minmax(0,1fr)_300px]">
            <button type="button" aria-label="Close" onClick={() => setOpen(null)} className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 hover:bg-[#F1F1F4]"><PiX size={18} /></button>
            <div className="flex items-start justify-center rounded-2xl bg-[#F1F1F4] p-4">
              <div className="w-full shadow-xl" style={{ maxWidth: FORMATS.find((item) => item.id === open.format)!.height > 1400 ? 300 : 440 }}>
                <Preview key={`${open.campaign}${open.layout}${open.palette}${open.format}${listing.id}`} spec={open} listing={listing} scale={0.6} />
              </div>
            </div>
            <div className="min-w-0 space-y-4">
              <div className="pr-10">
                <h2 className="text-xl font-bold">{estateTemplateName(open)}</h2>
                <p className="mt-1 text-sm text-[#0E1318]/60">Photos, price and details come from the listing. Everything stays editable.</p>
              </div>
              {listings.length > 0 && <ListingSelect listings={listings} value={listing.id} onChange={setListingId} label="Property" />}
              <div>
                <p className="text-xs font-medium text-[#0E1318]/65">Size</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {FORMATS.map((item) => (
                    <button key={item.id} type="button" aria-pressed={open.format === item.id} onClick={() => setOpen({ ...open, format: item.id })} className={`min-h-9 rounded-lg border px-2.5 text-xs font-medium ${open.format === item.id ? "border-[#7D2AE8] bg-[#F1E8FD] text-[#7D2AE8]" : "border-black/15"}`}>{item.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-[#0E1318]/65">Colours</p>
                <div className="mt-1 flex gap-2">
                  {PALETTES.map((item) => (
                    <button key={item.id} type="button" aria-label={item.label} aria-pressed={open.palette === item.id} onClick={() => setOpen({ ...open, palette: item.id })} className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-black/15" style={{ background: `linear-gradient(135deg, ${item.bg} 50%, ${item.accent} 50%)` }}>
                      {open.palette === item.id && <PiCheck size={16} color="#FFFFFF" style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,.7))" }} />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-[#0E1318]/65">Layout</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {LAYOUTS.map((item) => (
                    <button key={item.id} type="button" aria-pressed={open.layout === item.id} onClick={() => setOpen({ ...open, layout: item.id })} className={`min-h-9 rounded-lg border px-2.5 text-xs font-medium ${open.layout === item.id ? "border-[#7D2AE8] bg-[#F1E8FD] text-[#7D2AE8]" : "border-black/15"}`}>{item.label}</button>
                  ))}
                </div>
              </div>
              <button type="button" disabled={busy} onClick={() => customise(open)} className="min-h-12 w-full rounded-xl bg-[#7D2AE8] text-base font-semibold text-white hover:bg-[#6a22c9] disabled:opacity-60">
                {busy ? "Opening…" : "Customise this template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
