import Link from "next/link";
import { PiMagnifyingGlass, PiWhatsappLogo } from "react-icons/pi";
import { getStats, listLeads } from "@/lib/admin";
import { KIND_LABELS, LEAD_STATUSES, STATUS_LABELS, replyTemplates, type LeadStatus } from "@/lib/leadTypes";
import { whatsappLink } from "@/lib/site";
import { sourceLabel, timeAgo } from "./format";

export default async function AdminInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status = LEAD_STATUSES.includes(params.status as LeadStatus) ? (params.status as LeadStatus) : null;
  const q = (params.q || "").slice(0, 100);
  const [stats, leads] = await Promise.all([getStats(), listLeads(status, q)]);
  // eslint-disable-next-line react-hooks/purity -- this server page renders per request.
  const now = Date.now();

  const tiles = [
    { label: "New", value: stats.fresh },
    { label: "Waiting over 5 min", value: stats.overdue, alert: stats.overdue > 0 },
    { label: "Leads this week", value: stats.week },
    { label: "Unmatched WhatsApp, 7 days", value: stats.clicks },
    { label: "Won", value: stats.won },
  ];

  return (
    <>
      <h1 className="font-serif text-3xl">Lead inbox</h1>

      <dl className="mt-6 grid grid-cols-2 gap-px border border-white/10 bg-white/10 lg:grid-cols-5">
        {tiles.map((tile) => (
          <div key={tile.label} className="bg-[#171232] p-4 last:col-span-2 lg:p-5 lg:last:col-span-1">
            <dt className="text-[10px] font-bold uppercase leading-relaxed tracking-[0.14em] text-white/50">{tile.label}</dt>
            <dd className={`mt-2 font-serif text-3xl tabular-nums ${tile.alert ? "text-[#f0a08a]" : ""}`}>{tile.value}</dd>
          </div>
        ))}
      </dl>

      <form className="mt-6 flex items-center gap-3 border border-white/15 px-4 focus-within:border-[#4f9d8f]">
        <PiMagnifyingGlass size={16} className="shrink-0 text-white/40" aria-hidden="true" />
        <label htmlFor="lead-search" className="sr-only">Search leads</label>
        <input
          id="lead-search"
          name="q"
          defaultValue={q}
          placeholder="Name, phone, email, reference or listing"
          className="min-h-12 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-white/35"
        />
        {status && <input type="hidden" name="status" value={status} />}
      </form>

      <nav aria-label="Filter by status" className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        {[null, ...LEAD_STATUSES].map((item) => {
          const query = new URLSearchParams();
          if (item) query.set("status", item);
          if (q) query.set("q", q);
          const suffix = query.toString();
          return (
            <Link
              key={item ?? "all"}
              href={suffix ? `/admin?${suffix}` : "/admin"}
              aria-current={status === item ? "page" : undefined}
              className={`flex min-h-11 shrink-0 items-center border px-4 text-[10px] font-bold uppercase tracking-[0.16em] ${
                status === item ? "border-[#4f9d8f] bg-[#2e7d6f]/15" : "border-white/15 text-white/55"
              }`}
            >
              {item ? STATUS_LABELS[item] : "All"}
            </Link>
          );
        })}
      </nav>

      {leads.length === 0 ? (
        <div className="mt-6 border border-white/10 bg-[#171232] px-6 py-14 text-center">
          <h2 className="font-serif text-2xl">No leads here yet</h2>
          <p className="mt-2 text-sm text-white/55">New enquiries appear here as soon as they are sent.</p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-white/10 border border-white/10 bg-[#171232]">
          {leads.map((lead) => {
            const waiting = lead.status === "new" && now - new Date(lead.last_activity_at).getTime() > 5 * 60_000;
            return (
              <li key={lead.id} className="flex items-center gap-3 p-4 lg:gap-6 lg:px-5">
                <Link href={`/admin/leads/${lead.id}`} className="grid min-w-0 flex-1 gap-1 lg:grid-cols-12 lg:items-center lg:gap-4">
                  <span className="min-w-0 lg:col-span-3">
                    <span className="block truncate font-medium">{lead.name || lead.email || lead.phone || lead.ref}</span>
                    <span className="block truncate text-xs text-white/50">{lead.phone || lead.email}</span>
                  </span>
                  <span className="min-w-0 truncate text-sm text-white/70 lg:col-span-3">
                    {KIND_LABELS[lead.latest_kind] ?? lead.latest_kind}
                    {lead.listing_title ? `: ${lead.listing_title}` : ""}
                  </span>
                  <span className="truncate text-xs text-white/45 lg:col-span-2">{sourceLabel(lead)}</span>
                  <span className={`text-xs lg:col-span-2 ${waiting ? "text-[#f0a08a]" : "text-white/45"}`}>
                    {timeAgo(lead.last_activity_at, now)}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#4f9d8f] lg:col-span-2">
                    {STATUS_LABELS[lead.status]}
                  </span>
                </Link>
                {lead.phone_digits && (
                  <a
                    href={whatsappLink(lead.phone_digits, replyTemplates(lead)[0].text)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`WhatsApp ${lead.name || "this lead"}`}
                    className="press flex h-11 w-11 shrink-0 items-center justify-center border border-[#4f9d8f] bg-[#2e7d6f] text-[#f4faf8]"
                  >
                    <PiWhatsappLogo size={20} aria-hidden="true" />
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
