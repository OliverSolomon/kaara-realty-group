import { requireAdmin } from "@/lib/auth/admin";
import Link from "next/link";
import { createLeadFromClick } from "@/app/admin/actions";
import { listClicks } from "@/lib/admin";
import { formatDate, sourceLabel } from "../format";

const FIELD =
  "min-h-11 min-w-0 border border-white/15 bg-transparent px-3 text-sm outline-none placeholder:text-white/35 focus:border-[#4f9d8f]";

export default async function WhatsAppClicksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin("whatsapp");
  const { error } = await searchParams;
  const clicks = await listClicks();

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

      {clicks.length === 0 ? (
        <div className="mt-6 border border-white/10 bg-[#171232] px-6 py-14 text-center">
          <h2 className="font-serif text-2xl">No clicks yet</h2>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-white/10 border border-white/10 bg-[#171232]">
          {clicks.map((click) => (
            <li key={click.id} className="grid gap-3 p-4 lg:grid-cols-12 lg:items-center lg:px-5">
              <div className="min-w-0 lg:col-span-5">
                <p className="font-mono text-sm text-[#4f9d8f]">{click.ref}</p>
                <p className="mt-1 truncate text-sm">{click.listing_title || click.listing_slug || click.path || "Website"}</p>
                <p className="mt-1 truncate text-xs text-white/45">
                  {formatDate(click.created_at)} · {sourceLabel(click)}
                </p>
              </div>
              <div className="lg:col-span-7">
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
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
