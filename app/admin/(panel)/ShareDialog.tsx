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
      <div role="dialog" aria-modal="true" aria-label={`Share ${title}`} onClick={(event) => event.stopPropagation()} className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 text-[#0E1318] sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold">Share “{title}”</h2>
            <p className="mt-1 text-sm text-[#0E1318]/60">People you add can open and edit this item only. Publishing stays with your team.</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-[#F1F1F4]"><PiX size={18} /></button>
        </div>
        <form onSubmit={add} className="mt-4 flex gap-2">
          <label className="sr-only" htmlFor="share-email">Email address</label>
          <input id="share-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="min-h-11 w-full min-w-0 rounded-lg border border-black/15 bg-white px-3 text-sm text-[#0E1318] outline-none focus:border-[#7D2AE8]" />
          <button type="submit" disabled={busy} className="min-h-11 shrink-0 rounded-lg bg-[#7D2AE8] px-4 text-sm font-semibold text-white hover:bg-[#6a22c9] disabled:opacity-60">{busy ? "Sharing" : "Share"}</button>
        </form>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {notice && (
          <div role="status" className="mt-3 rounded-lg bg-[#F1E8FD] p-3 text-sm">
            <p>{notice.text}</p>
            {notice.password && (
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 break-all rounded bg-white px-2 py-1.5 text-xs">{notice.password}</code>
                <button type="button" aria-label="Copy temporary password" onClick={() => void navigator.clipboard.writeText(notice.password!)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white"><PiCopy size={16} /></button>
              </div>
            )}
          </div>
        )}
        <button type="button" onClick={() => { void navigator.clipboard.writeText(link); setNotice({ text: "Link copied." }); }} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-black/15 px-3 text-sm font-medium">
          <PiCopy size={15} aria-hidden="true" /> Copy link
        </button>
        <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-[#0E1318]/55">People with access</h3>
        {people.length === 0 ? <p className="mt-2 text-sm text-[#0E1318]/55">Only your team, so far.</p> : (
          <ul className="mt-2 divide-y divide-black/10">
            {people.map((person) => (
              <li key={person.email} className="flex items-center gap-2 py-1.5">
                <span className="min-w-0 flex-1 truncate text-sm">{person.email}</span>
                {!person.ready && <span className="shrink-0 text-xs text-amber-700">Needs a login</span>}
                <button type="button" aria-label={`Remove ${person.email}`} onClick={() => remove(person.email)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"><PiTrash size={15} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
