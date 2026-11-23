import { requireAdmin } from "@/lib/auth/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PiArrowLeft, PiEnvelope, PiPhone, PiWhatsappLogo } from "react-icons/pi";
import { addLeadNote, replyOnWhatsApp, updateLeadProfile, updateLeadStatus } from "@/app/admin/actions";
import { getLead, getMessages, getTimeline, type TimelineItem } from "@/lib/admin";
import { KIND_LABELS, LEAD_STATUSES, SOCIAL_NETWORKS, STATUS_LABELS, replyTemplates } from "@/lib/leadTypes";
import { telLink, whatsappLink } from "@/lib/site";
import { whatsappConfigured } from "@/lib/whatsapp";
import { formatDate, sourceLabel } from "../../format";

const LABEL = "text-[10px] font-bold uppercase tracking-[0.2em] text-white/45";
const PANEL = "border border-white/10 bg-[#171232] p-4 sm:p-6";
const FIELD = "mt-1.5 min-h-11 w-full border border-white/15 bg-transparent px-3 text-sm outline-none focus:border-[#4f9d8f]";

function describe(item: TimelineItem) {
  if (item.kind === "note") return item.body;
  const meta = item.meta ?? {};
  if (item.type === "status_changed") {
    const to = String(meta.to) as keyof typeof STATUS_LABELS;
    return `Status changed to ${STATUS_LABELS[to] ?? meta.to}${meta.by ? ` by ${meta.by}` : ""}`;
  }
  if (item.type === "whatsapp_click") return `Opened WhatsApp${item.ref ? ` (${item.ref})` : ""}`;
  if (item.type === "whatsapp_message") return `Sent a WhatsApp message${item.ref ? ` (${item.ref})` : ""}`;
  const kind = KIND_LABELS[String(meta.kind)] ?? "Form submitted";
  return `${kind}${item.listing_title ? `: ${item.listing_title}` : ""}`;
}

export default async function LeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; whatsappError?: string }>;
}) {
  await requireAdmin("leads");
  const { id } = await params;
  const query = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [lead, timeline, messages] = await Promise.all([getLead(id), getTimeline(id), getMessages(id)]);
  if (!lead) notFound();

  const details: [string, string | null][] = [
    ["Reference", lead.ref],
    ["Interest", lead.listing_type === "stay" ? "Staycation" : lead.listing_type ? lead.listing_type[0].toUpperCase() + lead.listing_type.slice(1) : null],
    ["Listing", lead.listing_title],
    ["WhatsApp name", lead.whatsapp_name],
    ["Source", sourceLabel(lead)],
    ["First page", lead.landing_path],
    ["First seen", formatDate(lead.created_at)],
    ["Marketing consent", lead.marketing_consent ? "Yes" : "No"],
  ];
  const socialLinks = SOCIAL_NETWORKS.filter((network) => lead.social_profiles?.[network.key]);

  return (
    <>
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#4f9d8f]">
        <PiArrowLeft size={13} aria-hidden="true" />
        Inbox
      </Link>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="break-words font-serif text-3xl">{lead.name || lead.email || lead.phone}</h1>
          <p className="mt-1 text-sm text-white/55">{KIND_LABELS[lead.latest_kind] ?? lead.latest_kind}</p>
        </div>
        <form key={lead.status} action={updateLeadStatus} className="flex w-full gap-2 sm:w-auto">
          <input type="hidden" name="leadId" value={lead.id} />
          <label htmlFor="lead-status" className="sr-only">Status</label>
          <select id="lead-status" name="status" defaultValue={lead.status} className="min-h-11 min-w-0 flex-1 border border-white/15 px-3 text-sm sm:w-44">
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>{STATUS_LABELS[status]}</option>
            ))}
          </select>
          <button type="submit" className="press min-h-11 border border-[#4f9d8f] px-4 text-[10px] font-bold uppercase tracking-[0.16em]">
            Update
          </button>
        </form>
      </div>

      {query.error && (
        <p role="alert" className="mt-4 border border-[#f0a08a]/40 bg-[#f0a08a]/10 p-3 text-sm text-[#f0a08a]">
          {query.error === "email" ? "Enter a valid email address." : "This lead has no phone number."}
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <div className="grid content-start gap-4 lg:col-span-5">
          <section className={PANEL}>
            <h2 className={LABEL}>Contact</h2>
            <div className="mt-3 grid gap-2">
              {lead.phone && (
                <a href={telLink(lead.phone)} className="flex min-h-11 items-center gap-3 text-sm hover:text-[#4f9d8f]">
                  <PiPhone size={17} aria-hidden="true" />
                  {lead.phone}
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="flex min-h-11 items-center gap-3 break-all text-sm hover:text-[#4f9d8f]">
                  <PiEnvelope size={17} className="shrink-0" aria-hidden="true" />
                  {lead.email}
                </a>
              )}
              {socialLinks.map((network) => (
                <a key={network.key} href={lead.social_profiles[network.key]} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-between gap-3 text-sm hover:text-[#4f9d8f]">
                  <span className="text-white/50">{network.label}</span>
                  <span className="truncate">{lead.social_profiles[network.key].replace(/^https:\/\/(www\.)?/, "")}</span>
                </a>
              ))}
            </div>
            {lead.phone_digits && (
              <div className="mt-4 grid gap-2 border-t border-white/10 pt-4">
                <h3 className={LABEL}>WhatsApp reply</h3>
                {replyTemplates(lead).map((template) => (
                  <a
                    key={template.label}
                    href={whatsappLink(lead.phone_digits ?? undefined, template.text)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press flex min-h-11 items-center gap-3 border border-[#4f9d8f]/60 bg-[#2e7d6f]/10 px-4 text-sm hover:bg-[#2e7d6f]/25"
                  >
                    <PiWhatsappLogo size={17} aria-hidden="true" />
                    {template.label}
                  </a>
                ))}
              </div>
            )}
          </section>

          <section className={PANEL}>
            <h2 className={LABEL}>Details shared with us</h2>
            <form key={JSON.stringify([lead.name, lead.email, lead.social_profiles])} action={updateLeadProfile} className="mt-3 grid gap-3">
              <input type="hidden" name="leadId" value={lead.id} />
              <label className="text-xs text-white/55">
                Name
                <input name="name" defaultValue={lead.name ?? ""} className={FIELD} />
              </label>
              <label className="text-xs text-white/55">
                Email
                <input name="email" type="email" defaultValue={lead.email ?? ""} className={FIELD} />
              </label>
              {SOCIAL_NETWORKS.map((network) => (
                <label key={network.key} className="text-xs text-white/55">
                  {network.label}
                  <input name={`social_${network.key}`} defaultValue={lead.social_profiles?.[network.key] ?? ""} placeholder="Handle or link" className={FIELD} />
                </label>
              ))}
              <button type="submit" className="press min-h-11 border border-[#4f9d8f] px-4 text-[10px] font-bold uppercase tracking-[0.16em]">
                Save details
              </button>
            </form>
          </section>

          <section className={PANEL}>
            <h2 className={LABEL}>Details</h2>
            <dl className="mt-3 divide-y divide-white/10">
              {details.filter(([, value]) => value).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-2.5 text-sm">
                  <dt className="shrink-0 text-white/50">{label}</dt>
                  <dd className="min-w-0 break-words text-right">{value}</dd>
                </div>
              ))}
            </dl>
            {lead.latest_message && (
              <p className="mt-3 whitespace-pre-wrap border-t border-white/10 pt-3 text-sm leading-relaxed text-white/75">
                {lead.latest_message}
              </p>
            )}
          </section>
        </div>

        <div className="grid content-start gap-4 lg:col-span-7">
          {(messages.length > 0 || whatsappConfigured()) && (
            <section className={PANEL}>
              <h2 className={LABEL}>WhatsApp conversation</h2>
              <ol className="mt-3 grid max-h-[420px] gap-2 overflow-y-auto">
                {messages.map((message) => (
                  <li key={message.id} className={`max-w-[85%] border px-3 py-2 text-sm ${message.direction === "out" ? "justify-self-end border-[#4f9d8f]/50 bg-[#2e7d6f]/20" : "justify-self-start border-white/10 bg-white/5"}`}>
                    <p className="whitespace-pre-wrap break-words">{message.body || `[${message.message_type}]`}</p>
                    <p className="mt-1 text-[11px] text-white/40">
                      {formatDate(message.created_at)}
                      {message.sent_by ? ` · ${message.sent_by}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
              {query.whatsappError && (
                <p role="alert" className="mt-3 border border-[#f0a08a]/40 bg-[#f0a08a]/10 p-3 text-sm text-[#f0a08a]">
                  {query.whatsappError.slice(0, 200)}
                </p>
              )}
              {whatsappConfigured() && lead.phone_digits && (
                <form action={replyOnWhatsApp} className="mt-3 flex gap-2">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <label htmlFor="wa-reply" className="sr-only">Reply on WhatsApp</label>
                  <input id="wa-reply" name="body" required maxLength={4000} placeholder="Reply on WhatsApp" className="min-h-11 min-w-0 flex-1 border border-white/15 bg-transparent px-3 text-sm outline-none focus:border-[#4f9d8f]" />
                  <button type="submit" className="press min-h-11 border border-[#4f9d8f] bg-[#2e7d6f] px-4 text-[10px] font-bold uppercase tracking-[0.16em]">Send</button>
                </form>
              )}
            </section>
          )}

          <section className={PANEL}>
            <h2 className={LABEL}>Add a note</h2>
            <form action={addLeadNote} className="mt-3">
              <input type="hidden" name="leadId" value={lead.id} />
              <label htmlFor="lead-note" className="sr-only">Note</label>
              <textarea id="lead-note" name="body" required maxLength={4000} rows={3} className="w-full resize-y border border-white/15 bg-transparent p-3 text-sm outline-none focus:border-[#4f9d8f]" />
              <button type="submit" className="press mt-3 min-h-11 border border-[#4f9d8f] bg-[#2e7d6f] px-5 text-[10px] font-bold uppercase tracking-[0.16em]">
                Save note
              </button>
            </form>
          </section>

          <section className={PANEL}>
            <h2 className={LABEL}>Activity</h2>
            <ol className="mt-3 divide-y divide-white/10">
              {timeline.map((item) => (
                <li key={item.id} className="py-3">
                  <p className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${item.kind === "note" ? "" : "text-white/70"}`}>
                    {describe(item)}
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    {formatDate(item.created_at)}
                    {item.author ? ` · ${item.author}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}
