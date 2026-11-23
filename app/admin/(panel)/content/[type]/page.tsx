import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PiArrowLeft, PiMagnifyingGlass, PiPlus } from "react-icons/pi";
import { listDocuments } from "@/lib/cms/server";
import { CMS_TYPES, HIDDEN_TYPES, SINGLETONS } from "@/lib/cms/types";

const LISTING_TITLES: Record<string, string> = { buy: "Buy listings", sell: "Sell resale units", stay: "Stay short stays" };

export default async function ContentListPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ listing?: string; q?: string }>;
}) {
  const { type } = await params;
  const query = await searchParams;
  if (!CMS_TYPES[type] || HIDDEN_TYPES.has(type)) notFound();
  if (SINGLETONS.has(type)) redirect(`/admin/content/${type}/${type}`);
  const listing = type === "property" && LISTING_TITLES[query.listing ?? ""] ? query.listing! : null;
  const q = (query.q ?? "").slice(0, 80);
  const items = await listDocuments(type, listing, q);
  const title = listing ? LISTING_TITLES[listing] : CMS_TYPES[type].title;

  return (
    <>
      <Link href="/admin/content" className="inline-flex min-h-11 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#4f9d8f]">
        <PiArrowLeft size={13} aria-hidden="true" />
        Content
      </Link>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl">{title}</h1>
        <Link href={`/admin/content/${type}/new${listing ? `?listing=${listing}` : ""}`} className="press inline-flex min-h-11 items-center gap-2 border border-[#4f9d8f] bg-[#2e7d6f] px-4 text-[10px] font-bold uppercase tracking-[0.16em]">
          <PiPlus size={14} aria-hidden="true" />
          New
        </Link>
      </div>
      <form className="mt-4 flex items-center gap-3 border border-white/15 px-4 focus-within:border-[#4f9d8f]">
        <PiMagnifyingGlass size={16} className="shrink-0 text-white/40" aria-hidden="true" />
        <label htmlFor="content-search" className="sr-only">Search</label>
        <input id="content-search" name="q" defaultValue={q} placeholder="Search" className="min-h-12 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-white/35" />
        {listing && <input type="hidden" name="listing" value={listing} />}
      </form>
      {items.length === 0 ? (
        <p className="mt-4 border border-white/10 bg-[#171232] px-6 py-12 text-center text-sm text-white/55">Nothing here yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-white/10 border border-white/10 bg-[#171232]">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/admin/content/${type}/${encodeURIComponent(item.id)}`} className="flex items-center gap-3 p-3 hover:bg-white/5">
                <span className="h-12 w-16 shrink-0 overflow-hidden bg-white/5">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`${item.image}?w=128&h=96&fit=crop&auto=format`} alt="" loading="lazy" className="h-full w-full object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  {item.subtitle && <span className="block truncate text-xs capitalize text-white/45">{item.subtitle}</span>}
                </span>
                {item.draft && <span className="shrink-0 border border-[#d8c07a]/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#d8c07a]">{item.published ? "Edited" : "Draft"}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
