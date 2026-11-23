"use client";

import { useEffect, useState } from "react";
import { PiCopy, PiTrash, PiX } from "react-icons/pi";

interface Person { email: string; ready: boolean }

async function share(body: object) {
  const response = await fetch("/api/admin/share", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "That could not be shared.");
  return data as { people: Person[]; tempPassword?: string; needsLogin?: boolean };
}

export default function ShareDialog({ kind, itemId, title, link, onClose }: { kind: "content" | "design"; itemId: string; title: string; link: string; onClose: () => void }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ text: string; password?: string } | null>(null);

  useEffect(() => {
    let live = true;
    share({ op: "list", kind, itemId })
      .then((data) => { if (live) setPeople(data.people); })
      .catch((failure) => { if (live) setError(failure.message); });
    return () => { live = false; };
  }, [kind, itemId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    const invited = email.trim().toLowerCase();
    setBusy(true);
    setError("");
    setNotice(null);
    try {
      const data = await share({ op: "add", kind, itemId, email: invited });
      setPeople(data.people);
      setEmail("");
      setNotice(data.tempPassword
        ? { text: `${invited} can now sign in. Send them the link and this temporary password privately. It is shown only once.`, password: data.tempPassword }
        : data.needsLogin
          ? { text: `Shared. A super admin must create a login for ${invited} in Team before they can open it.` }
          : { text: `Shared with ${invited}. Send them the link.` });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "That could not be shared.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(person: string) {
    setError("");
    setNotice(null);
    try {
      setPeople((await share({ op: "remove", kind, itemId, email: person })).people);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "That could not be removed.");
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={`Share ${title}`} onClick={(event) => event.stopPropagation()} className="max-h-[92dvh] w-full max-w-lg overflow-y-auto border border-white/15 bg-[#171232] p-5 text-[#efebe3]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-serif text-xl">Share “{title}”</h2>
            <p className="mt-1 text-sm text-white/60">People you add can open and edit this item only. Publishing stays with your team.</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center hover:bg-white/10"><PiX size={18} /></button>
        </div>
        <form onSubmit={add} className="mt-4 flex gap-2">
          <label className="sr-only" htmlFor="share-email">Email address</label>
          <input id="share-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="min-h-11 w-full min-w-0 border border-white/15 bg-transparent px-3 text-sm outline-none placeholder:text-white/35 focus:border-[#4f9d8f]" />
          <button type="submit" disabled={busy} className="press min-h-11 shrink-0 border border-[#4f9d8f] bg-[#2e7d6f] px-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#f4faf8] disabled:opacity-60">{busy ? "Sharing" : "Share"}</button>
        </form>
        {error && <p role="alert" className="mt-3 border border-[#f0a08a]/40 bg-[#f0a08a]/10 p-3 text-sm text-[#f0a08a]">{error}</p>}
        {notice && (
          <div role="status" className="mt-3 border border-[#4f9d8f]/40 bg-[#2e7d6f]/15 p-3 text-sm">
            <p>{notice.text}</p>
            {notice.password && (
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 break-all bg-[#100b28] px-2 py-1.5 text-xs">{notice.password}</code>
                <button type="button" aria-label="Copy temporary password" onClick={() => void navigator.clipboard.writeText(notice.password!)} className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/20"><PiCopy size={16} /></button>
              </div>
            )}
          </div>
        )}
        <button type="button" onClick={() => { void navigator.clipboard.writeText(link); setNotice({ text: "Link copied." }); }} className="mt-3 inline-flex min-h-11 items-center gap-2 border border-white/20 px-3 text-sm">
          <PiCopy size={15} aria-hidden="true" /> Copy link
        </button>
        <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-white/55">People with access</h3>
        {people.length === 0 ? <p className="mt-2 text-sm text-white/55">Only your team, so far.</p> : (
          <ul className="mt-2 divide-y divide-white/10">
            {people.map((person) => (
              <li key={person.email} className="flex items-center gap-2 py-1.5">
                <span className="min-w-0 flex-1 truncate text-sm">{person.email}</span>
                {!person.ready && <span className="shrink-0 text-xs text-[#d8c07a]">Needs a login</span>}
                <button type="button" aria-label={`Remove ${person.email}`} onClick={() => remove(person.email)} className="flex h-11 w-11 shrink-0 items-center justify-center text-[#f0a08a] hover:bg-white/5"><PiTrash size={15} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
