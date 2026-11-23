"use client";

import { confirmDialog, linkProblem, promptDialog } from "@/components/admin/Dialogs";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PiArchive,
  PiArrowBendUpLeft,
  PiArrowBendDoubleUpLeft,
  PiArrowBendUpRight,
  PiArrowClockwise,
  PiCaretLeft,
  PiEnvelopeOpen,
  PiEnvelopeSimple,
  PiGear,
  PiLinkSimple,
  PiListBullets,
  PiMagnifyingGlass,
  PiPaperclip,
  PiPencilSimple,
  PiStar,
  PiStarFill,
  PiTextB,
  PiTextItalic,
  PiTextUnderline,
  PiTrash,
  PiWarningOctagon,
  PiX,
} from "react-icons/pi";
import type { MailKind } from "@/lib/mail/sort";
import { fitFrame, messageDocument } from "@/lib/mail/view";

interface Account { id: string; label: string; email: string; auth_type?: string }
interface Providers { google: boolean; microsoft: boolean }
const OAUTH_ERRORS: Record<string, string> = {
  provider: "That sign-in option is not set up yet.",
  state: "The sign-in expired. Please try again.",
  denied: "The sign-in was cancelled.",
  email: "The provider did not share an email address.",
  refresh: "The provider did not grant lasting access. Remove the app from your account and try again.",
  connect: "Signed in, but the mailbox could not be reached. Make sure IMAP is enabled for this account.",
};
interface Box { path: string; name: string; special: string; unread?: number }
interface Addr { name: string; address: string }
interface Row { uid: number; subject: string; from: Addr; to: Addr[]; date: string | null; seen: boolean; flagged: boolean; answered: boolean; hasAttachment: boolean; kind: MailKind }
interface Attachment { index: number; filename: string; size: number; contentType: string; inline: boolean }
interface Message { uid: number; mailbox: string; messageId: string | null; references: string[]; subject: string; from: Addr[]; to: Addr[]; cc: Addr[]; date: string | null; html: string | null; text: string; attachments: Attachment[]; flagged?: boolean }
interface Snippet { id: string; name: string; body_html: string }
interface Settings { signature_html: string; undo_seconds: number }
interface ComposeState { to: string; cc: string; bcc: string; subject: string; html: string; inReplyTo?: string | null; references?: string[]; individually?: boolean }

type Bucket = "inbox" | "subscription" | "receipt" | "update";
const BUCKETS: { key: Bucket; label: string }[] = [
  { key: "inbox", label: "Primary" },
  { key: "subscription", label: "Subscriptions" },
  { key: "receipt", label: "Receipts" },
  { key: "update", label: "Updates" },
];
const ICON_BUTTON = "press flex h-10 w-10 shrink-0 items-center justify-center text-white/65 hover:bg-white/10 hover:text-white disabled:opacity-40";
const FIELD = "w-full border border-white/15 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-white/35 focus:border-[#4f9d8f]";
const PRIMARY = "press min-h-11 border border-[#4f9d8f] bg-[#2e7d6f] px-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#f4faf8] disabled:opacity-50";
const SECONDARY = "press min-h-11 border border-white/20 px-4 text-[10px] font-bold uppercase tracking-[0.16em] disabled:opacity-50";
const DRAFT_KEY = "kaara.mail.draft";

async function api<T = Record<string, unknown>>(op: string, payload: object = {}): Promise<T> {
  const response = await fetch("/api/admin/mail", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ op, ...payload }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "The mail request failed.");
  return body as T;
}

const escapeHtml = (value: string) => value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]!);
const who = (address?: Addr) => address?.name || address?.address || "Unknown";
const addressList = (list: Addr[]) => list.map((item) => item.address).filter(Boolean).join(", ");
const splitAddresses = (value: string) => value.split(/[,;\n]+/).map((item) => item.trim()).filter(Boolean);

function shortDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(date.getFullYear() !== now.getFullYear() ? { year: "2-digit" } : {}) });
}

function MessageFrame({ message }: { message: Message }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const cleanup = useRef<(() => void) | null>(null);
  const doc = useMemo(() => messageDocument(message), [message]);
  useEffect(() => () => cleanup.current?.(), []);
  return (
    <iframe
      ref={ref}
      title={`Message: ${message.subject}`}
      srcDoc={doc}
      // No allow-scripts: nothing inside an email can run.
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      className="block w-full border-0 bg-white"
      style={{ height: 120 }}
      onLoad={() => {
        cleanup.current?.();
        if (ref.current) cleanup.current = fitFrame(ref.current);
      }}
    />
  );
}

export default function MailApp() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [providers, setProviders] = useState<Providers>({ google: false, microsoft: false });
  const [accountId, setAccountId] = useState("");
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [mailbox, setMailbox] = useState("INBOX");
  const [bucket, setBucket] = useState<Bucket>("inbox");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [listing, setListing] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [cursor, setCursor] = useState(0);
  const [openUid, setOpenUid] = useState<number | null>(null);
  const [thread, setThread] = useState<Message[] | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [compose, setCompose] = useState<ComposeState | null>(null);
  const [settings, setSettings] = useState<Settings>({ signature_html: "", undo_seconds: 10 });
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const sendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isInbox = boxes.find((box) => box.path === mailbox)?.special === "inbox" || mailbox === "INBOX";
  const visible = useMemo(() => {
    if (!isInbox || query) return rows;
    return rows.filter((row) => (bucket === "inbox" ? row.kind === "person" || row.kind === "payment" : row.kind === bucket));
  }, [rows, bucket, isInbox, query]);
  const counts = useMemo(() => {
    const result: Record<Bucket, number> = { inbox: 0, subscription: 0, receipt: 0, update: 0 };
    for (const row of rows) {
      if (row.seen) continue;
      result[row.kind === "person" || row.kind === "payment" ? "inbox" : row.kind] += 1;
    }
    return result;
  }, [rows]);

  useEffect(() => {
    const returned = new URLSearchParams(window.location.search);
    const oauthError = returned.get("mailError");
    api<{ me: string; providers: Providers; accounts: Account[]; settings: Settings; snippets: Snippet[] }>("bootstrap")
      .then((data) => {
        setMe(data.me);
        setProviders(data.providers);
        if (oauthError) setError(OAUTH_ERRORS[oauthError] ?? "The sign-in failed.");
        if (oauthError || returned.has("mailConnected")) window.history.replaceState(null, "", "/admin/mail");
        setAccounts(data.accounts);
        setSettings(data.settings);
        setSnippets(data.snippets);
        setAccountId(data.accounts[0]?.id ?? "");
      })
      .catch((failure) => setError(failure.message))
      .finally(() => setLoading(false));
  }, []);

  const loadList = useCallback(async (offset = 0, quiet = false) => {
    if (!accountId) return;
    if (!quiet) setListing(true);
    try {
      const data = await api<{ items: Row[]; total: number }>("list", { accountId, mailbox, query, offset, limit: 50 });
      setTotal(data.total);
      setRows((current) => (offset ? [...current, ...data.items.filter((item) => !current.some((row) => row.uid === item.uid))] : data.items));
      if (!quiet) setError("");
    } catch (failure) {
      if (!quiet) setError(failure instanceof Error ? failure.message : "Could not load mail.");
    } finally {
      if (!quiet) setListing(false);
    }
  }, [accountId, mailbox, query]);

  const loadBoxes = useCallback(async () => {
    if (!accountId) return;
    try {
      const data = await api<{ boxes: Box[] }>("boxes", { accountId });
      setBoxes(data.boxes);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not load folders.");
    }
  }, [accountId]);

  useEffect(() => {
    const timer = setTimeout(() => void loadBoxes(), 0);
    return () => clearTimeout(timer);
  }, [loadBoxes]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSelected(new Set());
      setOpenUid(null);
      setThread(null);
      setCursor(0);
      void loadList(0);
    }, 0);
    return () => clearTimeout(timer);
  }, [loadList]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void loadList(0, true);
    }, 60_000);
    return () => clearInterval(timer);
  }, [loadList]);

  const showToast = useCallback((text: string, undo?: () => void) => {
    setToast({ text, undo });
    if (!undo) setTimeout(() => setToast((current) => (current?.text === text ? null : current)), 4000);
  }, []);

  const openMessage = useCallback(async (row: Row) => {
    setOpenUid(row.uid);
    setThread(null);
    setThreadLoading(true);
    setRows((items) => items.map((item) => (item.uid === row.uid ? { ...item, seen: true } : item)));
    try {
      const data = await api<{ messages: Message[] }>("thread", { accountId, mailbox, uid: row.uid });
      setThread(data.messages);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not open that message.");
      setOpenUid(null);
    } finally {
      setThreadLoading(false);
    }
  }, [accountId, mailbox]);

  const act = useCallback(async (uids: number[], action: string) => {
    if (!uids.length) return;
    const previous = rows;
    const removes = ["archive", "trash", "spam", "inbox"].includes(action);
    setRows((items) => removes
      ? items.filter((item) => !uids.includes(item.uid))
      : items.map((item) => uids.includes(item.uid)
        ? { ...item, ...(action === "read" ? { seen: true } : action === "unread" ? { seen: false } : action === "star" ? { flagged: true } : action === "unstar" ? { flagged: false } : {}) }
        : item));
    setSelected(new Set());
    if (removes && openUid && uids.includes(openUid)) {
      setOpenUid(null);
      setThread(null);
    }
    try {
      await api("act", { accountId, mailbox, uids, action });
      if (removes) {
        showToast(`${uids.length === 1 ? "Conversation" : `${uids.length} conversations`} moved to ${action}.`);
        void loadBoxes();
      }
    } catch (failure) {
      setRows(previous);
      setError(failure instanceof Error ? failure.message : "That action failed.");
    }
  }, [accountId, mailbox, openUid, rows, showToast, loadBoxes]);

  const signature = settings.signature_html ? `<br><br><div>${settings.signature_html}</div>` : "";
  const account = accounts.find((item) => item.id === accountId);

  const startCompose = useCallback((initial?: Partial<ComposeState>) => {
    let restored: ComposeState | null = null;
    if (!initial) {
      try { restored = JSON.parse(window.localStorage.getItem(DRAFT_KEY) || "null"); } catch { restored = null; }
    }
    setCompose(restored ?? { to: "", cc: "", bcc: "", subject: "", html: signature, ...initial });
  }, [signature]);

  const startReply = useCallback((message: Message, mode: "reply" | "all" | "forward") => {
    const mine = account?.email.toLowerCase();
    const date = message.date ? new Date(message.date).toLocaleString("en-GB") : "";
    const original = message.html ?? `<p>${escapeHtml(message.text).replace(/\n/g, "<br>")}</p>`;
    const base = message.subject.replace(/^\s*((re|fwd?)\s*:\s*)+/i, "");
    if (mode === "forward") {
      startCompose({ subject: `Fwd: ${base}`, html: `${signature}<br><p>---------- Forwarded message ----------<br>From: ${escapeHtml(who(message.from[0]))} &lt;${escapeHtml(message.from[0]?.address ?? "")}&gt;<br>Date: ${escapeHtml(date)}<br>Subject: ${escapeHtml(message.subject)}</p>${original}` });
      return;
    }
    const sender = message.from[0]?.address ?? "";
    const fromMe = sender.toLowerCase() === mine;
    const to = fromMe ? addressList(message.to) : sender;
    const cc = mode === "all" ? [...message.to, ...message.cc].map((item) => item.address).filter((item) => item && item.toLowerCase() !== mine && item.toLowerCase() !== sender.toLowerCase()).join(", ") : "";
    startCompose({
      to,
      cc,
      subject: /^re:/i.test(message.subject) ? message.subject : `Re: ${base}`,
      inReplyTo: message.messageId,
      references: [...message.references, ...(message.messageId ? [message.messageId] : [])],
      html: `${signature}<br><p>On ${escapeHtml(date)}, ${escapeHtml(who(message.from[0]))} wrote:</p><blockquote>${original}</blockquote>`,
    });
  }, [account, signature, startCompose]);

  const queueSend = useCallback((payload: ComposeState & { attachments: { filename: string; contentBase64: string; contentType: string }[] }) => {
    const deliver = async () => {
      sendTimer.current = null;
      setToast({ text: "Sending…" });
      try {
        await api("send", {
          accountId,
          to: splitAddresses(payload.to),
          cc: splitAddresses(payload.cc),
          bcc: splitAddresses(payload.bcc),
          subject: payload.subject,
          html: payload.html,
          inReplyTo: payload.inReplyTo,
          references: payload.references,
          individually: payload.individually,
          attachments: payload.attachments,
        });
        try { window.localStorage.removeItem(DRAFT_KEY); } catch { /* storage can be blocked */ }
        showToast("Message sent.");
        void loadList(0, true);
      } catch (failure) {
        setToast(null);
        setCompose(payload);
        setError(failure instanceof Error ? failure.message : "The message was not sent.");
      }
    };
    setCompose(null);
    if (!settings.undo_seconds) return void deliver();
    sendTimer.current = setTimeout(deliver, settings.undo_seconds * 1000);
    setToast({
      text: `Sending in ${settings.undo_seconds} seconds.`,
      undo: () => {
        if (sendTimer.current) clearTimeout(sendTimer.current);
        sendTimer.current = null;
        setToast(null);
        setCompose(payload);
      },
    });
  }, [accountId, loadList, settings.undo_seconds, showToast]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (sendTimer.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (compose || showSettings) return;
      const row = openUid ? rows.find((item) => item.uid === openUid) : visible[cursor];
      const last = thread?.[thread.length - 1];
      const key = event.key;
      if (key === "j") setCursor((value) => Math.min(value + 1, visible.length - 1));
      else if (key === "k") setCursor((value) => Math.max(value - 1, 0));
      else if ((key === "Enter" || key === "o") && visible[cursor]) void openMessage(visible[cursor]);
      else if (key === "Escape") { setOpenUid(null); setThread(null); }
      else if (key === "c") startCompose();
      else if (key === "/") searchRef.current?.focus();
      else if (key === "e" && row) void act([row.uid], "archive");
      else if (key === "#" && row) void act([row.uid], "trash");
      else if (key === "s" && row) void act([row.uid], row.flagged ? "unstar" : "star");
      else if (key === "u" && row) void act([row.uid], row.seen ? "unread" : "read");
      else if (key === "r" && last) startReply(last, "reply");
      else if (key === "a" && last) startReply(last, "all");
      else if (key === "f" && last) startReply(last, "forward");
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act, compose, cursor, openMessage, openUid, rows, showSettings, startCompose, startReply, thread, visible]);

  if (loading) return <p className="py-16 text-center text-sm text-white/55">Loading mail…</p>;

  if (!accounts.length) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="font-serif text-3xl">Mail</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/60">Connect as many mailboxes as you need. Sign-ins are tested, then stored encrypted.</p>
        {error && <p role="alert" className="mt-4 border border-[#f0a08a]/40 bg-[#f0a08a]/10 p-3 text-sm text-[#f0a08a]">{error}</p>}
        <div className="mt-5 border border-white/10 bg-[#171232] p-5">
          <AccountForm providers={providers} onAdded={(added) => { setAccounts([added]); setAccountId(added.id); }} />
        </div>
      </div>
    );
  }

  const selectedList = [...selected];
  const paneOpen = openUid !== null;

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-104px)] flex-col lg:-mx-8 lg:-my-8 lg:h-dvh">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
        <select aria-label="Mailbox account" value={accountId} onChange={(event) => { setAccountId(event.target.value); setMailbox("INBOX"); }} className="min-h-10 max-w-44 truncate border border-white/15 px-2 text-sm">
          {accounts.map((item) => <option key={item.id} value={item.id}>{item.email}</option>)}
        </select>
        <form className="flex min-w-40 flex-1 items-center gap-2 border border-white/15 px-3 focus-within:border-[#4f9d8f]" onSubmit={(event) => { event.preventDefault(); setQuery(search.trim()); }}>
          <PiMagnifyingGlass size={15} className="shrink-0 text-white/40" aria-hidden="true" />
          <input ref={searchRef} aria-label="Search mail" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search mail" className="min-h-10 w-full min-w-0 bg-transparent text-sm outline-none" />
          {query && <button type="button" aria-label="Clear search" onClick={() => { setSearch(""); setQuery(""); }}><PiX size={14} /></button>}
        </form>
        <button type="button" aria-label="Refresh" onClick={() => { void loadList(0); void loadBoxes(); }} className={ICON_BUTTON}><PiArrowClockwise size={17} /></button>
        <button type="button" aria-label="Mail settings" onClick={() => setShowSettings(true)} className={ICON_BUTTON}><PiGear size={17} /></button>
        <button type="button" onClick={() => startCompose()} className={`${PRIMARY} inline-flex items-center gap-2`}><PiPencilSimple size={15} aria-hidden="true" />Compose</button>
      </header>

      {error && (
        <p role="alert" className="flex items-center justify-between gap-3 border-b border-[#f0a08a]/30 bg-[#f0a08a]/10 px-4 py-2 text-sm text-[#f0a08a]">
          {error}
          <button type="button" aria-label="Dismiss" onClick={() => setError("")}><PiX size={14} /></button>
        </p>
      )}

      <nav aria-label="Folders" className="no-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 px-2 py-1 lg:hidden">
        {boxes.map((box) => (
          <button key={box.path} type="button" onClick={() => setMailbox(box.path)} className={`min-h-9 shrink-0 px-3 text-xs ${box.path === mailbox ? "bg-[#2e7d6f]/30" : "text-white/60"}`}>
            {box.name}{box.unread ? ` ${box.unread}` : ""}
          </button>
        ))}
      </nav>

      <div className="flex min-h-0 flex-1">
        <nav aria-label="Folders" className="hidden w-48 shrink-0 overflow-y-auto border-r border-white/10 p-2 lg:block">
          {boxes.map((box) => (
            <button key={box.path} type="button" onClick={() => setMailbox(box.path)} className={`flex min-h-10 w-full items-center justify-between px-3 text-left text-sm ${box.path === mailbox ? "bg-[#2e7d6f]/30 text-white" : "text-white/65 hover:bg-white/5"}`}>
              <span className="truncate">{box.name}</span>
              {Boolean(box.unread) && <span className="text-xs tabular-nums text-[#7fd0c1]">{box.unread}</span>}
            </button>
          ))}
        </nav>

        <section aria-label="Messages" className={`min-w-0 flex-col border-r border-white/10 lg:flex lg:w-[400px] lg:shrink-0 ${paneOpen ? "hidden" : "flex w-full"}`}>
          {isInbox && !query && (
            <div className="no-scrollbar flex shrink-0 overflow-x-auto border-b border-white/10" role="tablist">
              {BUCKETS.map((item) => (
                <button key={item.key} type="button" role="tab" aria-selected={bucket === item.key} onClick={() => { setBucket(item.key); setCursor(0); }} className={`min-h-10 shrink-0 border-b-2 px-3 text-xs ${bucket === item.key ? "border-[#4f9d8f] text-white" : "border-transparent text-white/50"}`}>
                  {item.label}{counts[item.key] ? ` ${counts[item.key]}` : ""}
                </button>
              ))}
            </div>
          )}
          {selectedList.length > 0 && (
            <div className="flex shrink-0 items-center gap-1 border-b border-white/10 bg-[#171232] px-2">
              <span className="px-2 text-xs text-white/60">{selectedList.length} selected</span>
              <button type="button" aria-label="Archive selected" onClick={() => act(selectedList, "archive")} className={ICON_BUTTON}><PiArchive size={16} /></button>
              <button type="button" aria-label="Move selected to trash" onClick={() => act(selectedList, "trash")} className={ICON_BUTTON}><PiTrash size={16} /></button>
              <button type="button" aria-label="Mark selected read" onClick={() => act(selectedList, "read")} className={ICON_BUTTON}><PiEnvelopeOpen size={16} /></button>
              <button type="button" aria-label="Mark selected unread" onClick={() => act(selectedList, "unread")} className={ICON_BUTTON}><PiEnvelopeSimple size={16} /></button>
            </div>
          )}
          <ul className="min-h-0 flex-1 divide-y divide-white/5 overflow-y-auto">
            {listing && !rows.length && <li className="p-8 text-center text-sm text-white/50">Loading…</li>}
            {!listing && !visible.length && <li className="p-10 text-center text-sm text-white/50">Nothing here.</li>}
            {visible.map((row, index) => (
              <li key={row.uid} className={`flex items-start gap-1 px-1.5 py-1 ${row.uid === openUid ? "bg-[#2e7d6f]/20" : index === cursor ? "bg-white/[0.05]" : "hover:bg-white/[0.03]"}`}>
                <label className="flex h-10 w-8 shrink-0 cursor-pointer items-center justify-center">
                  <input type="checkbox" aria-label={`Select ${row.subject}`} checked={selected.has(row.uid)} onChange={(event) => setSelected((current) => { const next = new Set(current); if (event.target.checked) next.add(row.uid); else next.delete(row.uid); return next; })} className="h-4 w-4 accent-[#4f9d8f]" />
                </label>
                <button type="button" aria-label={row.flagged ? "Remove star" : "Add star"} onClick={() => act([row.uid], row.flagged ? "unstar" : "star")} className="flex h-10 w-7 shrink-0 items-center justify-center">
                  {row.flagged ? <PiStarFill size={15} className="text-[#d8c07a]" /> : <PiStar size={15} className="text-white/30" />}
                </button>
                <button type="button" onClick={() => { setCursor(index); void openMessage(row); }} className="min-w-0 flex-1 py-1 pr-1 text-left">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={`truncate text-sm ${row.seen ? "text-white/65" : "font-semibold text-white"}`}>{who(row.from)}</span>
                    <span className="shrink-0 text-[11px] tabular-nums text-white/40">{shortDate(row.date)}</span>
                  </span>
                  <span className={`mt-0.5 flex items-center gap-1 text-xs ${row.seen ? "text-white/45" : "text-white/80"}`}>
                    {row.kind === "payment" && <span className="shrink-0 border border-[#d8c07a]/60 px-1 text-[9px] uppercase text-[#d8c07a]">Payment</span>}
                    <span className="truncate">{row.subject}</span>
                    {row.hasAttachment && <PiPaperclip size={12} className="shrink-0" aria-label="Has attachment" />}
                  </span>
                </button>
              </li>
            ))}
            {rows.length < total && (
              <li className="p-2">
                <button type="button" onClick={() => loadList(rows.length)} disabled={listing} className={`${SECONDARY} w-full`}>{listing ? "Loading" : "Load more"}</button>
              </li>
            )}
          </ul>
        </section>

        <section aria-label="Conversation" className={`min-w-0 flex-1 flex-col ${paneOpen ? "flex" : "hidden lg:flex"}`}>
          {!paneOpen ? (
            <div className="m-auto max-w-xs p-6 text-center">
              <PiEnvelopeOpen size={30} className="mx-auto text-white/25" aria-hidden="true" />
              <p className="mt-3 text-sm text-white/50">Select a conversation.</p>
              <p className="mt-2 text-xs leading-relaxed text-white/35">Shortcuts: j/k move, e archive, # trash, s star, u unread, r reply, a reply all, f forward, c compose, / search.</p>
            </div>
          ) : threadLoading || !thread ? (
            <p className="m-auto text-sm text-white/50">Opening…</p>
          ) : (
            <>
              <div className="flex shrink-0 items-center gap-1 border-b border-white/10 px-2 py-1">
                <button type="button" aria-label="Back to list" onClick={() => { setOpenUid(null); setThread(null); }} className={`${ICON_BUTTON} lg:hidden`}><PiCaretLeft size={18} /></button>
                <button type="button" aria-label="Archive" onClick={() => act([openUid!], "archive")} className={ICON_BUTTON}><PiArchive size={17} /></button>
                <button type="button" aria-label="Report spam" onClick={() => act([openUid!], "spam")} className={ICON_BUTTON}><PiWarningOctagon size={17} /></button>
                <button type="button" aria-label="Move to trash" onClick={() => act([openUid!], "trash")} className={ICON_BUTTON}><PiTrash size={17} /></button>
                <button type="button" aria-label="Mark unread" onClick={() => { void act([openUid!], "unread"); setOpenUid(null); setThread(null); }} className={ICON_BUTTON}><PiEnvelopeSimple size={17} /></button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-3 lg:p-5">
                <h2 className="break-words font-serif text-2xl leading-tight">{thread[thread.length - 1]?.subject}</h2>
                <div className="mt-4 grid gap-3">
                  {thread.map((message, index) => (
                    <details key={`${message.mailbox}:${message.uid}`} open={index === thread.length - 1 || message.uid === openUid} className="border border-white/10 bg-[#171232]">
                      <summary className="flex cursor-pointer list-none flex-wrap items-baseline justify-between gap-2 px-4 py-3">
                        <span className="min-w-0">
                          <span className="font-medium">{who(message.from[0])}</span>
                          <span className="ml-2 break-all text-xs text-white/45">{message.from[0]?.address}</span>
                          <span className="mt-0.5 block truncate text-xs text-white/45">to {message.to.map(who).join(", ")}</span>
                        </span>
                        <span className="shrink-0 text-xs text-white/45">{message.date ? new Date(message.date).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</span>
                      </summary>
                      <MessageFrame message={message} />
                      {message.attachments.filter((item) => !item.inline).length > 0 && (
                        <div className="flex flex-wrap gap-2 border-t border-white/10 p-3">
                          {message.attachments.filter((item) => !item.inline).map((item) => (
                            <a key={item.index} href={`/api/admin/mail?account=${accountId}&mailbox=${encodeURIComponent(message.mailbox)}&uid=${message.uid}&index=${item.index}`} className="inline-flex min-h-10 max-w-full items-center gap-2 border border-white/15 px-3 text-xs">
                              <PiPaperclip size={13} aria-hidden="true" />
                              <span className="truncate">{item.filename}</span>
                              <span className="shrink-0 text-white/40">{Math.max(1, Math.round(item.size / 1024))} KB</span>
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 border-t border-white/10 p-3">
                        <button type="button" onClick={() => startReply(message, "reply")} className={`${SECONDARY} inline-flex items-center gap-2`}><PiArrowBendUpLeft size={14} aria-hidden="true" />Reply</button>
                        <button type="button" onClick={() => startReply(message, "all")} className={`${SECONDARY} inline-flex items-center gap-2`}><PiArrowBendDoubleUpLeft size={14} aria-hidden="true" />Reply all</button>
                        <button type="button" onClick={() => startReply(message, "forward")} className={`${SECONDARY} inline-flex items-center gap-2`}><PiArrowBendUpRight size={14} aria-hidden="true" />Forward</button>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {compose && <Composer key={compose.subject + compose.to} initial={compose} fromEmail={account?.email ?? me} snippets={snippets} onClose={() => setCompose(null)} onSend={queueSend} />}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          snippets={snippets}
          accounts={accounts}
          providers={providers}
          onSettings={setSettings}
          onSnippets={setSnippets}
          onAccounts={(next) => { setAccounts(next); if (!next.some((item) => item.id === accountId)) setAccountId(next[0]?.id ?? ""); }}
          onClose={() => setShowSettings(false)}
        />
      )}
      {toast && (
        <div role="status" className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-[70] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-4 border border-[#4f9d8f]/60 bg-[#171232] px-4 py-3 text-sm shadow-2xl">
          {toast.text}
          {toast.undo && <button type="button" onClick={toast.undo} className="font-bold uppercase tracking-[0.12em] text-[#7fd0c1]">Undo</button>}
        </div>
      )}
    </div>
  );
}

function Composer({ initial, fromEmail, snippets, onClose, onSend }: {
  initial: ComposeState;
  fromEmail: string;
  snippets: Snippet[];
  onClose: () => void;
  onSend: (payload: ComposeState & { attachments: { filename: string; contentBase64: string; contentType: string }[] }) => void;
}) {
  const [state, setState] = useState(initial);
  const [showCc, setShowCc] = useState(Boolean(initial.cc || initial.bcc));
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const editor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editor.current) editor.current.innerHTML = initial.html;
  }, [initial.html]);

  useEffect(() => {
    const timer = setInterval(() => {
      const html = editor.current?.innerHTML ?? "";
      if (!state.to && !state.subject && !editor.current?.textContent?.trim()) return;
      try { window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...state, html })); } catch { /* storage can be blocked */ }
    }, 3000);
    return () => clearInterval(timer);
  }, [state]);

  const format = (command: string, value?: string) => {
    editor.current?.focus();
    document.execCommand(command, false, value);
  };

  async function send() {
    if (!splitAddresses(state.to).length) return setError("Add at least one recipient.");
    const total = files.reduce((sum, file) => sum + file.size, 0);
    if (total > 3 * 1024 * 1024) return setError("Attachments must total under 3 MB.");
    const attachments = await Promise.all(files.map(async (file) => {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
      return { filename: file.name, contentBase64: btoa(binary), contentType: file.type || "application/octet-stream" };
    }));
    onSend({ ...state, html: editor.current?.innerHTML ?? "", attachments });
  }

  const discard = () => {
    try { window.localStorage.removeItem(DRAFT_KEY); } catch { /* storage can be blocked */ }
    onClose();
  };

  const line = "flex items-center gap-2 border-b border-white/10 px-3";
  const inputClass = "min-h-10 w-full min-w-0 bg-transparent text-sm outline-none";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-end bg-black/40 sm:p-4" role="dialog" aria-modal="true" aria-label="Compose message">
      <div className="flex h-dvh w-full flex-col border border-white/15 bg-[#100b28] shadow-2xl sm:h-[min(720px,calc(100dvh-2rem))] sm:max-w-2xl">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-[#171232] px-3">
          <h2 className="text-sm font-semibold">New message</h2>
          <button type="button" aria-label="Close and keep draft" onClick={onClose} className={ICON_BUTTON}><PiX size={17} /></button>
        </header>
        <div className={line}><span className="w-10 text-xs text-white/45">From</span><span className="truncate text-sm text-white/70">{fromEmail}</span></div>
        <div className={line}>
          <label htmlFor="mail-to" className="w-10 text-xs text-white/45">To</label>
          <input id="mail-to" value={state.to} onChange={(event) => setState({ ...state, to: event.target.value })} className={inputClass} />
          {!showCc && <button type="button" onClick={() => setShowCc(true)} className="text-xs text-white/50">Cc/Bcc</button>}
        </div>
        {showCc && (
          <>
            <div className={line}><label htmlFor="mail-cc" className="w-10 text-xs text-white/45">Cc</label><input id="mail-cc" value={state.cc} onChange={(event) => setState({ ...state, cc: event.target.value })} className={inputClass} /></div>
            <div className={line}><label htmlFor="mail-bcc" className="w-10 text-xs text-white/45">Bcc</label><input id="mail-bcc" value={state.bcc} onChange={(event) => setState({ ...state, bcc: event.target.value })} className={inputClass} /></div>
          </>
        )}
        <div className={line}><label htmlFor="mail-subject" className="sr-only">Subject</label><input id="mail-subject" placeholder="Subject" value={state.subject} onChange={(event) => setState({ ...state, subject: event.target.value })} className={inputClass} /></div>
        <div className="no-scrollbar flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-white/10 px-1">
          <button type="button" aria-label="Bold" onMouseDown={(event) => { event.preventDefault(); format("bold"); }} className={ICON_BUTTON}><PiTextB size={16} /></button>
          <button type="button" aria-label="Italic" onMouseDown={(event) => { event.preventDefault(); format("italic"); }} className={ICON_BUTTON}><PiTextItalic size={16} /></button>
          <button type="button" aria-label="Underline" onMouseDown={(event) => { event.preventDefault(); format("underline"); }} className={ICON_BUTTON}><PiTextUnderline size={16} /></button>
          <button type="button" aria-label="Bulleted list" onMouseDown={(event) => { event.preventDefault(); format("insertUnorderedList"); }} className={ICON_BUTTON}><PiListBullets size={16} /></button>
          <button type="button" aria-label="Add link" onMouseDown={(event) => { event.preventDefault(); const selection = window.getSelection(); const range = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null; void promptDialog({ title: "Add a link", label: "Link address", placeholder: "https://", inputType: "url", confirmLabel: "Add link", validate: linkProblem }).then((url) => { editor.current?.focus(); if (range) { const now = window.getSelection(); now?.removeAllRanges(); now?.addRange(range); } if (url) format("createLink", url); }); }} className={ICON_BUTTON}><PiLinkSimple size={16} /></button>
          <label aria-label="Attach files" className={`${ICON_BUTTON} cursor-pointer`}>
            <PiPaperclip size={16} />
            <input type="file" multiple className="sr-only" onChange={(event) => { setFiles([...files, ...Array.from(event.target.files ?? [])].slice(0, 10)); event.target.value = ""; }} />
          </label>
          {snippets.length > 0 && (
            <select aria-label="Insert snippet" value="" onChange={(event) => { const snippet = snippets.find((item) => item.id === event.target.value); if (snippet) format("insertHTML", snippet.body_html); }} className="ml-1 min-h-9 max-w-36 border border-white/15 px-2 text-xs">
              <option value="">Snippets</option>
              {snippets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          )}
        </div>
        <div ref={editor} role="textbox" aria-multiline="true" aria-label="Message body" contentEditable suppressContentEditableWarning className="min-h-0 flex-1 overflow-y-auto bg-white p-4 text-[15px] leading-relaxed text-gray-900 outline-none [&_a]:text-blue-700 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-teal-600 [&_blockquote]:pl-3 [&_blockquote]:text-gray-500 [&_ul]:list-disc [&_ul]:pl-6" />
        {files.length > 0 && (
          <ul className="flex shrink-0 flex-wrap gap-2 border-t border-white/10 p-2">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex max-w-56 items-center gap-1 border border-white/15 px-2 py-1 text-xs">
                <span className="truncate">{file.name}</span>
                <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles(files.filter((_, item) => item !== index))}><PiX size={12} /></button>
              </li>
            ))}
          </ul>
        )}
        {error && <p role="alert" className="shrink-0 px-3 py-2 text-sm text-[#f0a08a]">{error}</p>}
        <footer className="flex shrink-0 flex-wrap items-center gap-3 border-t border-white/10 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button type="button" onClick={send} className={PRIMARY}>Send</button>
          {splitAddresses(state.to).length > 1 && (
            <label className="flex items-center gap-2 text-xs text-white/60">
              <input type="checkbox" checked={Boolean(state.individually)} onChange={(event) => setState({ ...state, individually: event.target.checked })} className="h-4 w-4 accent-[#4f9d8f]" />
              Send individually
            </label>
          )}
          <button type="button" aria-label="Discard draft" onClick={discard} className={`${ICON_BUTTON} ml-auto`}><PiTrash size={17} /></button>
        </footer>
      </div>
    </div>
  );
}

interface MailDetection { provider: string | null; oauth: "google" | "microsoft" | null; help: string | null }

function AccountForm({ onAdded }: { providers: Providers; onAdded: (account: Account) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [email, setEmail] = useState("");
  const [sender, setSender] = useState("");
  const [detection, setDetection] = useState<(MailDetection & { email: string }) | null>(null);
  const clean = email.trim().toLowerCase();
  const current = detection?.email === clean ? detection : null;

  async function detect() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) || detection?.email === clean) return;
    try {
      const found = await api<MailDetection>("detectMail", { email: clean });
      setDetection({ ...found, email: clean });
    } catch {
      setDetection(null);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setBusy(true);
    setError("");
    try {
      const result = await api<{ account: Account }>("addAccount", data);
      form.reset();
      setEmail("");
      setSender("");
      setDetection(null);
      setAdvanced(false);
      onAdded(result.account);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not connect.");
    } finally {
      setBusy(false);
    }
  }

  const oauthName = current?.oauth === "google" ? "Google" : "Microsoft";
  const oauthHref = current?.oauth ? `/api/admin/mail/oauth/${current.oauth}/start?${new URLSearchParams({ email: clean, ...(sender.trim() ? { name: sender.trim() } : {}) })}` : "";

  return (
    <form onSubmit={submit} className="grid gap-3">
      <input name="email" type="email" required autoComplete="off" aria-label="Email address" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} onBlur={() => void detect()} className={FIELD} />
      {!current?.oauth && <input name="password" type="password" required autoComplete="new-password" aria-label="Password" placeholder="Password" onFocus={() => void detect()} className={FIELD} />}
      <input name="label" aria-label="Sender name" placeholder="Sender name, such as Kaara Realty Group" value={sender} onChange={(event) => setSender(event.target.value)} className={FIELD} />
      {current?.provider && <p role="status" className="text-xs leading-relaxed text-white/55">{current.provider} mailbox detected.{current.help ? ` ${current.help}` : ""}</p>}
      {error && !advanced && <button type="button" onClick={() => setAdvanced(true)} className="justify-self-start text-xs text-white/55 underline underline-offset-4">Enter server settings</button>}
      {advanced && !current?.oauth && (
        <div className="grid grid-cols-2 gap-2">
          <input name="imapHost" aria-label="IMAP server" placeholder="IMAP server" className={FIELD} />
          <input name="imapPort" inputMode="numeric" aria-label="IMAP port" placeholder="993" className={FIELD} />
          <input name="smtpHost" aria-label="SMTP server" placeholder="SMTP server" className={FIELD} />
          <input name="smtpPort" inputMode="numeric" aria-label="SMTP port" placeholder="465" className={FIELD} />
          <input name="username" aria-label="Username" placeholder="Username, if different" className={`${FIELD} col-span-2`} />
        </div>
      )}
      {error && <p role="alert" className="text-sm text-[#f0a08a]">{error}</p>}
      {current?.oauth ? (
        <a href={oauthHref} className={`${PRIMARY} inline-flex items-center justify-center`}>Continue with {oauthName}</a>
      ) : (
        <button type="submit" disabled={busy} className={PRIMARY}>{busy ? "Finding your mail settings" : "Connect mailbox"}</button>
      )}
    </form>
  );
}

function SettingsPanel({ settings, snippets, accounts, providers, onSettings, onSnippets, onAccounts, onClose }: {
  settings: Settings;
  snippets: Snippet[];
  accounts: Account[];
  providers: Providers;
  onSettings: (value: Settings) => void;
  onSnippets: (value: Snippet[]) => void;
  onAccounts: (value: Account[]) => void;
  onClose: () => void;
}) {
  const [undo, setUndo] = useState(settings.undo_seconds);
  const [signature, setSignature] = useState(settings.signature_html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""));
  const [name, setName] = useState("");
  const [snippet, setSnippet] = useState("");
  const [message, setMessage] = useState("");
  const toHtml = (value: string) => escapeHtml(value).replace(/\n/g, "<br>");

  async function save() {
    try {
      const result = await api<{ settings: Settings }>("saveSettings", { undoSeconds: undo, signatureHtml: toHtml(signature) });
      onSettings(result.settings);
      setMessage("Saved.");
    } catch (failure) {
      setMessage(failure instanceof Error ? failure.message : "Could not save.");
    }
  }

  async function addSnippet() {
    try {
      const result = await api<{ snippet: Snippet }>("saveSnippet", { name, html: toHtml(snippet) });
      onSnippets([...snippets, result.snippet]);
      setName("");
      setSnippet("");
    } catch (failure) {
      setMessage(failure instanceof Error ? failure.message : "Could not save.");
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/60" role="dialog" aria-modal="true" aria-label="Mail settings">
      <div className="h-dvh w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#171232] p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl">Mail settings</h2>
          <button type="button" aria-label="Close" onClick={onClose} className={ICON_BUTTON}><PiX size={18} /></button>
        </div>
        <label className="mt-4 block text-xs text-white/60">Undo send
          <select value={undo} onChange={(event) => setUndo(Number(event.target.value))} className={`${FIELD} mt-1.5`}>
            {[0, 5, 10, 20, 30].map((value) => <option key={value} value={value}>{value ? `${value} seconds` : "Off"}</option>)}
          </select>
        </label>
        <label className="mt-4 block text-xs text-white/60">Signature
          <textarea rows={4} value={signature} onChange={(event) => setSignature(event.target.value)} className={`${FIELD} mt-1.5 resize-y`} />
        </label>
        <button type="button" onClick={save} className={`${PRIMARY} mt-3`}>Save settings</button>
        {message && <p role="status" className="mt-2 text-sm text-[#7fd0c1]">{message}</p>}

        <h3 className="mt-7 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Snippets</h3>
        <ul className="mt-2 divide-y divide-white/10">
          {snippets.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="truncate">{item.name}</span>
              <button type="button" onClick={async () => { await api("deleteSnippet", { id: item.id }); onSnippets(snippets.filter((value) => value.id !== item.id)); }} className="min-h-9 px-2 text-xs text-[#f0a08a]">Delete</button>
            </li>
          ))}
        </ul>
        <div className="mt-2 grid gap-2">
          <input aria-label="Snippet name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Name, such as Staycation rates" className={FIELD} />
          <textarea aria-label="Snippet text" rows={3} value={snippet} onChange={(event) => setSnippet(event.target.value)} placeholder="Reusable text" className={`${FIELD} resize-y`} />
          <button type="button" onClick={addSnippet} className={SECONDARY}>Add snippet</button>
        </div>

        <h3 className="mt-7 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Mailboxes</h3>
        <ul className="mt-2 divide-y divide-white/10">
          {accounts.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="truncate">{item.email}</span>
              <button type="button" onClick={async () => { if (!(await confirmDialog({ title: "Disconnect this mailbox?", body: `${item.email} will be removed here. Its mail stays on the server.`, confirmLabel: "Disconnect", danger: true }))) return; await api("removeAccount", { accountId: item.id }); onAccounts(accounts.filter((value) => value.id !== item.id)); }} className="min-h-9 px-2 text-xs text-[#f0a08a]">Remove</button>
            </li>
          ))}
        </ul>
        <div className="mt-3"><AccountForm providers={providers} onAdded={(added) => onAccounts([...accounts.filter((item) => item.id !== added.id), added])} /></div>
      </div>
    </div>
  );
}
