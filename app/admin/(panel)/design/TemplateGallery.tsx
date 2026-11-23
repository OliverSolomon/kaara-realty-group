"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PiCheck, PiX } from "react-icons/pi";
import { CampaignIcon, FormatIcons } from "./TemplateIcons";
import { DesignPreview } from "@canvix/components/design-preview";
import { ensureDocumentFonts } from "@canvix/lib/fonts/loader";
import {
  allEstateSpecs,
  buildEstatePage,
  CAMPAIGNS,
  estateTemplateName,
  FORMATS,
  layoutsFor,
  PALETTES,
  SAMPLE_LISTING,
  type CampaignId,
  type EstateListing,
  type EstateSpec,
  type FormatId,
} from "@/lib/design/estateTemplates";

const PAGE = 24;
const MIX = "mix";
const GROUPS = [
  { type: "buy", label: "For sale" },
  { type: "sell", label: "Owner resale" },
  { type: "stay", label: "Stays and rentals" },
];
const chip = (on: boolean) =>
  `inline-flex min-h-11 shrink-0 items-center gap-2 border px-4 text-xs transition-colors ${on ? "border-[#4f9d8f] bg-[#2e7d6f]/25 text-white" : "border-white/15 text-white/60 hover:text-white"}`;
const small = (on: boolean) =>
  `inline-flex min-h-10 items-center gap-1.5 border px-2.5 text-xs ${on ? "border-[#4f9d8f] bg-[#2e7d6f]/25 text-white" : "border-white/15 text-white/60 hover:text-white"}`;

interface Card { spec: EstateSpec; listing: EstateListing; photo: number }

/** A stable mix, so neighbouring cards differ in layout, colour and size. */
function mixKey(spec: EstateSpec) {
  let hash = 7;
  for (const char of `${spec.campaign}${spec.layout}${spec.palette}${spec.format}`) hash = (hash * 31 + char.charCodeAt(0)) % 10007;
  return hash;
}

const fitsOf = (spec: EstateSpec): readonly string[] => CAMPAIGNS.find((item) => item.id === spec.campaign)!.fits;

function Preview({ spec, listing, photo, scale }: { spec: EstateSpec; listing: EstateListing; photo: number; scale: number }) {
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
  const page = useMemo(() => (seen ? buildEstatePage(spec, listing, scale, photo) : null), [seen, spec, listing, scale, photo]);
  useEffect(() => {
    if (page) ensureDocumentFonts([page]);
  }, [page]);
  return (
    <div ref={box} className="relative w-full overflow-hidden bg-white/5" style={{ aspectRatio: `${format.width} / ${format.height}` }}>
      {page && <div className="absolute inset-0"><DesignPreview page={page} width={format.width} height={format.height} /></div>}
    </div>
  );
}

function ListingOptions({ listings }: { listings: EstateListing[] }) {
  return GROUPS.map((group) => {
    const items = listings.filter((item) => item.listingType === group.type);
    return items.length ? (
      <optgroup key={group.type} label={group.label}>
        {items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
      </optgroup>
    ) : null;
  });
}

export default function TemplateGallery({ listings, query }: { listings: EstateListing[]; query: string }) {
  const [campaign, setCampaign] = useState<CampaignId | "all">("all");
  const [format, setFormat] = useState<FormatId | "all">("all");
  const [listingId, setListingId] = useState(MIX);
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<Card | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const chosen = listings.find((item) => item.id === listingId) ?? null;

  const specs = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return allEstateSpecs(format)
      .filter((spec) => campaign === "all" || spec.campaign === campaign)
      .filter((spec) => {
        const palette = PALETTES.find((item) => item.id === spec.palette)!.label;
        const size = FORMATS.find((item) => item.id === spec.format)!.label;
        const haystack = `${estateTemplateName(spec)} ${palette} ${size}`.toLowerCase();
        return words.every((word) => haystack.includes(word));
      })
      .sort((a, b) => mixKey(a) - mixKey(b));
  }, [campaign, format, query]);

  // Each card takes the next suitable property and photo, so the wall never repeats one home.
  const cards = useMemo<Card[]>(() => {
    const used = new Map<string, number>();
    return specs.slice(0, shown).map((spec) => {
      const fits = fitsOf(spec);
      const matching = listings.filter((item) => fits.includes(item.listingType ?? ""));
      const pool = chosen ? [chosen] : matching.length ? matching : listings;
      const key = chosen ? "chosen" : fits.join();
      const turn = used.get(key) ?? 0;
      used.set(key, turn + 1);
      return { spec, listing: pool.length ? pool[turn % pool.length] : SAMPLE_LISTING, photo: turn };
    });
  }, [specs, shown, listings, chosen]);

  function pickCampaign(next: CampaignId | "all") {
    setCampaign(next);
    setShown(PAGE);
    if (next === "all" || !chosen) return;
    const fits: readonly string[] = CAMPAIGNS.find((item) => item.id === next)!.fits;
    if (!fits.includes(chosen.listingType ?? "")) setListingId(MIX);
  }

  function changeOpenFormat(id: FormatId) {
    if (!open) return;
    const allowed = layoutsFor(id);
    const layout = allowed.some((item) => item.id === open.spec.layout) ? open.spec.layout : allowed[0].id;
    setOpen({ ...open, spec: { ...open.spec, format: id, layout } });
  }

  async function customise({ spec, listing, photo }: Card) {
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
          pages: [buildEstatePage(spec, listing, 1, photo)],
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

  const openFormat = open ? FORMATS.find((item) => item.id === open.spec.format)! : null;

  return (
    <section aria-label="Real estate templates">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label="Campaign">
        <button type="button" aria-pressed={campaign === "all"} onClick={() => pickCampaign("all")} className={chip(campaign === "all")}><CampaignIcon id="all" />All</button>
        {CAMPAIGNS.map((item) => (
          <button key={item.id} type="button" aria-pressed={campaign === item.id} onClick={() => pickCampaign(item.id)} className={chip(campaign === item.id)}><CampaignIcon id={item.id} />{item.label}</button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Size</p>
          <div className="no-scrollbar -mx-4 mt-1.5 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label="Size">
            <button type="button" aria-pressed={format === "all"} onClick={() => { setFormat("all"); setShown(PAGE); }} className={`${small(format === "all")} shrink-0`}>All sizes</button>
            {FORMATS.map((item) => (
              <button key={item.id} type="button" aria-pressed={format === item.id} title={`${item.width} × ${item.height}`} onClick={() => { setFormat(item.id); setShown(PAGE); }} className={`${small(format === item.id)} shrink-0`}>
                <FormatIcons id={item.id} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
        {listings.length > 0 && (
          <label className="block min-w-0 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
            Property
            <select value={listingId} onChange={(event) => { setListingId(event.target.value); setShown(PAGE); }} className="mt-1.5 block min-h-11 w-full min-w-0 border border-white/15 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#4f9d8f]">
              <option value={MIX}>All properties</option>
              <ListingOptions listings={listings} />
            </select>
          </label>
        )}
      </div>

      {error && <p role="alert" className="mt-4 border border-[#f0a08a]/40 bg-[#f0a08a]/10 p-3 text-sm text-[#f0a08a]">{error}</p>}
      <p className="mt-4 text-xs text-white/50">{specs.length} templates</p>

      {specs.length === 0 ? (
        <p className="mt-3 border border-white/10 bg-[#171232] px-6 py-12 text-center text-sm text-white/55">No templates match that search.</p>
      ) : (
        <ul className="mt-3 columns-2 gap-3 md:columns-3 xl:columns-4">
          {cards.map((card) => (
            <li key={`${card.spec.campaign}-${card.spec.layout}-${card.spec.palette}-${card.spec.format}`} data-listing={card.listing.id} data-format={card.spec.format} className="mb-3 break-inside-avoid">
              <button type="button" onClick={() => setOpen(card)} className="group block w-full border border-white/10 bg-[#171232] text-left transition-colors hover:border-[#4f9d8f]" aria-label={`Open ${estateTemplateName(card.spec)}`}>
                <span className="relative block overflow-hidden">
                  <Preview spec={card.spec} listing={card.listing} photo={card.photo} scale={0.34} />
                  <span className="absolute inset-x-2 bottom-2 hidden bg-[#2e7d6f] py-2 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-white group-hover:block">Use template</span>
                </span>
                <span className="block p-2.5">
                  <span className="flex items-center gap-1.5 text-sm"><span className="text-[#7fd0c1]"><CampaignIcon id={card.spec.campaign} size={14} /></span><span className="truncate">{estateTemplateName(card.spec)}</span></span>
                  <span className="mt-1 flex items-center gap-1.5 text-[11px] text-white/45"><FormatIcons id={card.spec.format} size={13} /><span className="truncate">{FORMATS.find((item) => item.id === card.spec.format)!.label} · {card.listing.title}</span></span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {shown < specs.length && (
        <div className="mt-5 text-center">
          <button type="button" onClick={() => setShown((count) => count + PAGE)} className="press min-h-11 border border-white/20 px-5 text-[10px] font-bold uppercase tracking-[0.14em]">Show more templates</button>
        </div>
      )}

      {open && openFormat && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4" onClick={() => setOpen(null)}>
          <div role="dialog" aria-modal="true" aria-label={estateTemplateName(open.spec)} onClick={(event) => event.stopPropagation()} className="relative grid max-h-[94dvh] w-full max-w-4xl gap-5 overflow-y-auto border border-white/15 bg-[#171232] p-4 text-[#efebe3] sm:p-6 md:grid-cols-[minmax(0,1fr)_300px]">
            <button type="button" aria-label="Close" onClick={() => setOpen(null)} className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center bg-[#171232] hover:bg-white/10"><PiX size={18} /></button>
            <div className="flex items-start justify-center bg-[#100b28] p-4">
              <div className="w-full" style={{ maxWidth: openFormat.height > openFormat.width * 1.4 ? 300 : 460 }}>
                <Preview key={`${open.spec.campaign}${open.spec.layout}${open.spec.palette}${open.spec.format}${open.listing.id}`} spec={open.spec} listing={open.listing} photo={open.photo} scale={0.6} />
              </div>
            </div>
            <div className="min-w-0 space-y-4">
              <div className="pr-10">
                <h2 className="font-serif text-2xl">{estateTemplateName(open.spec)}</h2>
                <p className="mt-1 text-sm text-white/55">Photos, price and details come from the listing. Everything stays editable.</p>
              </div>
              {listings.length > 0 && (
                <label className="block text-xs text-white/55">
                  Property
                  <select value={open.listing.id} onChange={(event) => { const next = listings.find((item) => item.id === event.target.value); if (next) setOpen({ ...open, listing: next, photo: 0 }); }} className="mt-1 block min-h-11 w-full min-w-0 border border-white/15 px-3 text-sm outline-none focus:border-[#4f9d8f]">
                    <ListingOptions listings={listings} />
                  </select>
                </label>
              )}
              {open.listing.photos.length > 1 && (
                <div>
                  <p className="text-xs text-white/55">Main photo</p>
                  <div className="mt-1 flex gap-1.5 overflow-x-auto">
                    {open.listing.photos.map((photo, index) => (
                      <button key={photo.url} type="button" aria-label={`Use photo ${index + 1}`} aria-pressed={open.photo % open.listing.photos.length === index} onClick={() => setOpen({ ...open, photo: index })} className={`h-12 w-14 shrink-0 overflow-hidden border-2 ${open.photo % open.listing.photos.length === index ? "border-[#4f9d8f]" : "border-transparent"}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`${photo.url}?w=112&h=96&fit=crop&auto=format`} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-white/55">Size</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {FORMATS.map((item) => (
                    <button key={item.id} type="button" aria-pressed={open.spec.format === item.id} onClick={() => changeOpenFormat(item.id)} className={small(open.spec.format === item.id)}><FormatIcons id={item.id} size={14} />{item.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-white/55">Colours</p>
                <div className="mt-1 flex gap-2">
                  {PALETTES.map((item) => (
                    <button key={item.id} type="button" aria-label={item.label} aria-pressed={open.spec.palette === item.id} onClick={() => setOpen({ ...open, spec: { ...open.spec, palette: item.id } })} className="flex h-11 w-11 items-center justify-center ring-1 ring-white/25" style={{ background: `linear-gradient(135deg, ${item.bg} 50%, ${item.accent} 50%)` }}>
                      {open.spec.palette === item.id && <PiCheck size={16} color="#FFFFFF" style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,.7))" }} />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-white/55">Layout</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {layoutsFor(open.spec.format).map((item) => (
                    <button key={item.id} type="button" aria-pressed={open.spec.layout === item.id} onClick={() => setOpen({ ...open, spec: { ...open.spec, layout: item.id } })} className={small(open.spec.layout === item.id)}>{item.label}</button>
                  ))}
                </div>
              </div>
              <button type="button" disabled={busy} onClick={() => customise(open)} className="press min-h-12 w-full border border-[#4f9d8f] bg-[#2e7d6f] text-[11px] font-bold uppercase tracking-[0.16em] text-[#f4faf8] disabled:opacity-60">
                {busy ? "Opening…" : "Customise this template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
