import { requireAdmin } from "@/lib/auth/admin";
import Link from "next/link";
import { PiArchive, PiArrowCounterClockwise, PiMagnifyingGlass, PiPlus, PiX } from "react-icons/pi";
import { addClickTag, createLeadFromClick, removeClickTag, setClickArchived } from "@/app/admin/actions";
import { listClicks, listClickTags } from "@/lib/admin";
import { formatDate, sourceLabel } from "../format";

const FIELD =
  "min-h-11 min-w-0 border border-white/15 bg-transparent px-3 text-sm outline-none placeholder:text-white/35 focus:border-[#4f9d8f]";
const SUGGESTED = ["Follow up", "Hot", "Booked", "Not interested", "Spam"];

export default async function WhatsAppClicksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; view?: string; tag?: string; q?: string }>;
}) {
  await requireAdmin("whatsapp");
  const { error, view: rawView, tag: rawTag, q: rawQuery } = await searchParams;
  const view = rawView === "archived" ? "archived" : "active";
  const tag = (rawTag ?? "").slice(0, 30) || null;
  const q = (rawQuery ?? "").slice(0, 100);
  const [clicks, tags] = await Promise.all([listClicks(view, tag, q), listClickTags()]);
  const suggestions = [...new Set([...SUGGESTED, ...tags.map((item) => item.tag)])];
  const href = (next: { view?: string; tag?: string | null }) => {
    const query = new URLSearchParams();
    const nextView = next.view ?? view;
    const nextTag = next.tag === undefined ? tag : next.tag;
    if (nextView === "archived") query.set("view", "archived");
    if (nextTag) query.set("tag", nextTag);
    if (q) query.set("q", q);
    const suffix = query.toString();
    return suffix ? `/admin/whatsapp?${suffix}` : "/admin/whatsapp";
  };
  const pill = (on: boolean) =>
    `inline-flex min-h-11 shrink-0 items-center border px-4 text-[10px] font-bold uppercase tracking-[0.14em] ${on ? "border-[#4f9d8f] bg-[#2e7d6f]/20" : "border-white/15 text-white/55"}`;

  return (
    <>
      <h1 className="font-serif text-3xl">WhatsApp clicks</h1>
      <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-white/60">
        A click does not prove a message was sent. When a chat arrives with a reference, enter the
        number here to turn it into a lead with its listing and source.
      </p>
      {error === "phone" && (
        <p role="alert" className="mt-4 border border-[#f0a08a]/40 bg-[#f0a08a]/10 p-3 text-sm text-[#f0a08a]">
          Enter a valid phone number.
        </p>
      )}

      <form className="mt-5 flex items-center gap-3 border border-white/15 px-4 focus-within:border-[#4f9d8f]">
        <PiMagnifyingGlass size={16} className="shrink-0 text-white/40" aria-hidden="true" />
        <label htmlFor="click-search" className="sr-only">Search clicks</label>
        <input id="click-search" name="q" defaultValue={q} placeholder="Reference, listing or tag" className="min-h-12 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-white/35" />
        {view === "archived" && <input type="hidden" name="view" value="archived" />}
        {tag && <input type="hidden" name="tag" value={tag} />}
      </form>

      <nav aria-label="Click views" className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        <Link href={href({ view: "active" })} aria-current={view === "active" ? "page" : undefined} className={pill(view === "active")}>Active</Link>
        <Link href={href({ view: "archived" })} aria-current={view === "archived" ? "page" : undefined} className={pill(view === "archived")}>Archived</Link>
        {tags.length > 0 && <span aria-hidden="true" className="mx-1 w-px shrink-0 bg-white/15" />}
        {tag && <Link href={href({ tag: null })} className={pill(false)}>All tags</Link>}
        {tags.map((item) => (
          <Link key={item.tag} href={href({ tag: item.tag })} aria-current={tag === item.tag ? "true" : undefined} className={pill(tag === item.tag)}>
            {item.tag} <span className="ml-1.5 tabular-nums text-white/45">{item.count}</span>
          </Link>
        ))}
      </nav>

      <datalist id="click-tag-options">
        {suggestions.map((item) => <option key={item} value={item} />)}
      </datalist>

      {clicks.length === 0 ? (
        <div className="mt-6 border border-white/10 bg-[#171232] px-6 py-14 text-center">
          <h2 className="font-serif text-2xl">{view === "archived" ? "Nothing archived" : tag || q ? "No matching clicks" : "No clicks yet"}</h2>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-white/10 border border-white/10 bg-[#171232]">
          {clicks.map((click) => (
            <li key={click.id} className="grid gap-3 p-4 lg:grid-cols-12 lg:items-start lg:px-5">
              <div className="min-w-0 lg:col-span-5">
                <p className="font-mono text-sm text-[#4f9d8f]">{click.ref}</p>
                <p className="mt-1 truncate text-sm">{click.listing_title || click.listing_slug || click.path || "Website"}</p>
                <p className="mt-1 truncate text-xs text-white/45">
                  {formatDate(click.created_at)} · {sourceLabel(click)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {click.click_tags.map((item) => (
                    <form key={item} action={removeClickTag} className="inline-flex min-h-9 items-center border border-[#4f9d8f]/50 bg-[#2e7d6f]/15 pl-2.5 text-xs">
                      <input type="hidden" name="eventId" value={click.id} />
                      <input type="hidden" name="tag" value={item} />
                      {item}
                      <button type="submit" aria-label={`Remove tag ${item} from ${click.ref}`} className="flex h-9 w-9 items-center justify-center text-white/60 hover:text-white"><PiX size={12} /></button>
                    </form>
                  ))}
                  {click.click_tags.length < 8 && (
                    <form action={addClickTag} className="flex">
                      <input type="hidden" name="eventId" value={click.id} />
                      <input name="tag" required maxLength={30} list="click-tag-options" aria-label={`Add tag to ${click.ref}`} placeholder="Add tag" className="h-9 w-28 min-w-0 border border-white/15 bg-transparent px-2 text-xs outline-none placeholder:text-white/35 focus:border-[#4f9d8f]" />
                      <button type="submit" aria-label={`Save tag for ${click.ref}`} className="flex h-9 w-9 items-center justify-center border border-l-0 border-white/15 text-white/65 hover:text-white"><PiPlus size={13} /></button>
                    </form>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-start gap-2 lg:col-span-7">
                <div className="min-w-0 flex-1 basis-64">
                  {click.lead_id ? (
                    <Link href={`/admin/leads/${click.lead_id}`} className="inline-flex min-h-11 items-center text-sm text-[#4f9d8f] underline underline-offset-4">
                      Matched to {click.lead_name || "lead"}
                    </Link>
                  ) : (
                    <form action={createLeadFromClick} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <input type="hidden" name="eventId" value={click.id} />
                      <input name="name" aria-label={`Name for ${click.ref}`} placeholder="Name" className={FIELD} />
                      <input name="phone" type="tel" required aria-label={`Phone for ${click.ref}`} placeholder="Phone" className={FIELD} />
                      <button type="submit" className="press col-span-2 min-h-11 border border-[#4f9d8f] px-4 text-[10px] font-bold uppercase tracking-[0.16em] sm:col-span-1">
                        Create lead
                      </button>
                    </form>
                  )}
                </div>
                <form action={setClickArchived}>
                  <input type="hidden" name="eventId" value={click.id} />
                  <input type="hidden" name="archived" value={click.archived_at ? "0" : "1"} />
                  <button type="submit" aria-label={`${click.archived_at ? "Restore" : "Archive"} ${click.ref}`} className="press inline-flex min-h-11 items-center gap-2 border border-white/20 px-3 text-[10px] font-bold uppercase tracking-[0.14em]">
                    {click.archived_at ? <PiArrowCounterClockwise size={14} aria-hidden="true" /> : <PiArchive size={14} aria-hidden="true" />}
                    {click.archived_at ? "Restore" : "Archive"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
