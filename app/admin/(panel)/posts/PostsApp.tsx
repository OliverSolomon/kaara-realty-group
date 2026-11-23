"use client";

import { confirmDialog } from "@/components/admin/Dialogs";

import { useMemo, useState } from "react";
import { PiCaretLeft, PiCaretRight, PiCheck, PiImage, PiPlus, PiPlugs, PiWarningCircle, PiX } from "react-icons/pi";
import {
  connectChannel,
  deletePost,
  disconnectChannel,
  markPosted,
  publishNow,
  savePost,
  type PostInput,
  type PostRow,
} from "@/app/admin/posts-actions";
import { CHANNELS, CHANNEL_INFO, NEEDS_ACCOUNT, PLATFORM_TIPS, textFor, type Channel, type Variant } from "@/lib/social/channels";

interface Connection {
  channel: Channel;
  account_name: string | null;
  account_id: string;
}

interface Draft {
  id: string | null;
  title: string;
  body: string;
  channels: Channel[];
  media: string[];
  variants: Partial<Record<Channel, Variant>>;
  linkUrl: string;
  when: string;
  status: PostRow["status"];
  results: PostRow["results"];
}

const FIELD = "w-full border border-white/15 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-white/35 focus:border-[#4f9d8f]";
const LABEL = "text-[10px] font-bold uppercase tracking-[0.18em] text-white/50";
const BUTTON = "press min-h-11 border px-4 text-[10px] font-bold uppercase tracking-[0.15em] disabled:opacity-50";
const PRIMARY = `${BUTTON} border-[#4f9d8f] bg-[#2e7d6f] text-[#f4faf8]`;
const SECONDARY = `${BUTTON} border-white/20 text-[#efebe3]`;
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STATUS_STYLE: Record<PostRow["status"], string> = {
  draft: "border-white/25 text-white/70",
  scheduled: "border-[#4f9d8f] bg-[#2e7d6f]/25 text-[#b8ece1]",
  publishing: "border-[#d8c07a] text-[#d8c07a]",
  posted: "border-[#4f9d8f]/40 text-white/55",
  failed: "border-[#f0a08a] bg-[#f0a08a]/10 text-[#f0a08a]",
  cancelled: "border-white/15 text-white/40",
};

const pad = (value: number) => String(value).padStart(2, "0");
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const dayKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const blank = (when = ""): Draft => ({ id: null, title: "", body: "", channels: ["website"], media: [], variants: {}, linkUrl: "", when, status: "draft", results: {} });
const fromPost = (post: PostRow): Draft => ({
  id: post.id,
  title: post.title ?? "",
  body: post.body,
  channels: post.channels,
  media: post.media,
  variants: post.variants ?? {},
  linkUrl: post.link_url ?? "",
  when: toLocalInput(post.scheduled_for),
  status: post.status,
  results: post.results ?? {},
});

export interface PostSeed {
  title: string;
  body: string;
  linkUrl: string;
  media: string[];
}

export default function PostsApp({ initialPosts, connections, seed }: { initialPosts: PostRow[]; connections: Connection[]; seed?: PostSeed | null }) {
  const [posts, setPosts] = useState(initialPosts);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  // The article itself is already on the website, so a shared insight targets the linked social accounts.
  const [draft, setDraft] = useState<Draft | null>(() =>
    seed
      ? { ...blank(), title: seed.title, body: seed.body, linkUrl: seed.linkUrl, media: seed.media, channels: connections.map((item) => item.channel) }
      : null
  );
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [showChannels, setShowChannels] = useState(false);

  const cells = useMemo(() => {
    const first = new Date(month);
    first.setDate(1 - ((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, index) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + index));
  }, [month]);

  const byDay = useMemo(() => {
    const map = new Map<string, PostRow[]>();
    for (const post of posts) {
      const value = post.scheduled_for ?? post.posted_at;
      if (!value) continue;
      const key = dayKey(new Date(value));
      map.set(key, [...(map.get(key) ?? []), post]);
    }
    return map;
  }, [posts]);

  const today = dayKey(new Date());
  const unscheduled = posts.filter((post) => post.status === "draft" && !post.scheduled_for);
  const upsert = (post: PostRow) => setPosts((items) => [post, ...items.filter((item) => item.id !== post.id)]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl">Posts</h1>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowChannels(true)} className={`${SECONDARY} inline-flex items-center gap-2`}>
            <PiPlugs size={15} aria-hidden="true" />
            Channels {connections.length}/{NEEDS_ACCOUNT.length}
          </button>
          <button type="button" onClick={() => setDraft(blank())} className={`${PRIMARY} inline-flex items-center gap-2`}>
            <PiPlus size={15} aria-hidden="true" />
            New post
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="press flex h-11 w-11 items-center justify-center border border-white/15"><PiCaretLeft size={15} /></button>
          <h2 className="min-w-44 text-center font-serif text-xl">{month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h2>
          <button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="press flex h-11 w-11 items-center justify-center border border-white/15"><PiCaretRight size={15} /></button>
        </div>
        <div className="flex border border-white/15" role="group" aria-label="View">
          {(["calendar", "list"] as const).map((item) => (
            <button key={item} type="button" aria-pressed={view === item} onClick={() => setView(item)} className={`min-h-10 px-4 text-[10px] font-bold uppercase tracking-[0.14em] ${view === item ? "bg-[#2e7d6f]/30" : "text-white/55"}`}>
              {item}
            </button>
          ))}
        </div>
      </div>

      {view === "calendar" ? (
        <div className="mt-4">
          <div className="grid grid-cols-7 gap-px border border-white/10 bg-white/10">
            {WEEK.map((day) => <div key={day} className="bg-[#100b28] py-2 text-center text-[9px] font-bold uppercase tracking-[0.06em] text-white/45 md:text-[10px] md:tracking-[0.14em]">{day}</div>)}
            {cells.map((date) => {
              const key = dayKey(date);
              const items = byDay.get(key) ?? [];
              const inMonth = date.getMonth() === month.getMonth();
              return (
                <div key={key} className={`group min-h-[72px] min-w-0 p-0.5 md:min-h-28 md:p-1.5 ${inMonth ? "bg-[#171232]" : "bg-[#120e2a]"}`}>
                  <button type="button" aria-label={`New post on ${date.toDateString()}`} onClick={() => setDraft(blank(`${key}T09:00`))} className="flex h-9 w-full items-center justify-between px-0.5 md:h-6">
                    <span className={`flex h-6 w-6 items-center justify-center text-xs ${key === today ? "bg-[#2e7d6f] text-white" : inMonth ? "text-white/70" : "text-white/25"}`}>{date.getDate()}</span>
                    <PiPlus size={13} aria-hidden="true" className="hidden text-white/40 group-hover:block" />
                  </button>
                  <div className="mt-0.5 grid gap-0.5 md:mt-1 md:gap-1">
                    {items.slice(0, 3).map((post) => {
                      const label = post.title || post.body.slice(0, 26) || "Untitled";
                      const time = new Date(post.scheduled_for ?? post.posted_at!).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                      return (
                        <button key={post.id} type="button" aria-label={`${time} ${label}, ${post.status}`} onClick={() => setDraft(fromPost(post))} className={`h-2.5 min-w-0 truncate border text-left text-[11px] md:h-auto md:px-1.5 md:py-1 ${STATUS_STYLE[post.status]}`}>
                          <span className="hidden md:inline">{time} {label}</span>
                        </button>
                      );
                    })}
                    {items.length > 3 && <span className="px-0.5 text-[9px] text-white/45 md:px-1 md:text-[10px]">+{items.length - 3}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-white/10 border border-white/10 bg-[#171232]">
          {posts.length === 0 && <li className="p-10 text-center text-sm text-white/55">No posts yet.</li>}
          {posts.map((post) => (
            <li key={post.id}>
              <button type="button" onClick={() => setDraft(fromPost(post))} className="flex w-full flex-wrap items-center gap-3 p-4 text-left hover:bg-white/5">
                <span className={`border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${STATUS_STYLE[post.status]}`}>{post.status}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{post.title || post.body.slice(0, 90) || "Untitled"}</span>
                <span className="text-xs text-white/45">{post.channels.map((channel) => CHANNEL_INFO[channel].label).join(", ")}</span>
                {post.scheduled_for && <span className="text-xs text-white/45">{new Date(post.scheduled_for).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {view === "calendar" && unscheduled.length > 0 && (
        <section className="mt-5">
          <h2 className={LABEL}>Drafts</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {unscheduled.map((post) => (
              <button key={post.id} type="button" onClick={() => setDraft(fromPost(post))} className="max-w-64 truncate border border-white/20 px-3 py-2 text-left text-sm">
                {post.title || post.body.slice(0, 40) || "Untitled"}
              </button>
            ))}
          </div>
        </section>
      )}

      {draft && (
        <Composer
          key={draft.id ?? draft.when ?? "new"}
          initial={draft}
          connections={connections}
          onClose={() => setDraft(null)}
          onSaved={upsert}
          onDeleted={(id) => {
            setPosts((items) => items.filter((item) => item.id !== id));
            setDraft(null);
          }}
        />
      )}
      {showChannels && <ChannelsPanel connections={connections} onClose={() => setShowChannels(false)} />}
    </>
  );
}

function Composer({ initial, connections, onClose, onSaved, onDeleted }: {
  initial: Draft;
  connections: Connection[];
  onClose: () => void;
  onSaved: (post: PostRow) => void;
  onDeleted: (id: string) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [tab, setTab] = useState<Channel | "shared">("shared");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const locked = draft.status === "posted" || draft.status === "publishing";
  const update = (patch: Partial<Draft>) => setDraft((value) => ({ ...value, ...patch }));
  const connected = new Set<Channel>(["website", ...connections.map((item) => item.channel)]);

  const input = (schedule: boolean): PostInput => ({
    title: draft.title,
    body: draft.body,
    channels: draft.channels,
    media: draft.media,
    variants: draft.variants,
    linkUrl: draft.linkUrl,
    scheduledFor: draft.when ? new Date(draft.when).toISOString() : null,
    schedule,
  });

  async function save(schedule: boolean) {
    setBusy(true);
    setError("");
    setNotice("");
    const result = await savePost(draft.id, input(schedule));
    setBusy(false);
    if (!result.ok) return setError(result.error);
    onSaved(result.data);
    update({ id: result.data.id, status: result.data.status });
    setNotice(schedule ? "Scheduled." : "Draft saved.");
  }

  async function publish() {
    if (!(await confirmDialog({ title: "Publish now?", body: `This posts to ${draft.channels.map((channel) => CHANNEL_INFO[channel].label).join(", ")}.`, confirmLabel: "Publish" }))) return;
    setBusy(true);
    setError("");
    setNotice("");
    const saved = await savePost(draft.id, { ...input(false), scheduledFor: null });
    if (!saved.ok) {
      setBusy(false);
      return setError(saved.error);
    }
    const result = await publishNow(saved.data.id);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    const allOk = draft.channels.every((channel) => result.data[channel]?.ok);
    const status = allOk ? "posted" : "failed";
    onSaved({ ...saved.data, results: result.data, status, posted_at: allOk ? new Date().toISOString() : null });
    update({ id: saved.data.id, results: result.data, status });
    setNotice(allOk ? "Published." : "Some channels failed. See below.");
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    const urls: string[] = [];
    for (const file of Array.from(files).slice(0, 10 - draft.media.length)) {
      const form = new FormData();
      form.set("file", file);
      form.set("kind", "image");
      const response = await fetch("/api/admin/upload", { method: "POST", body: form });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error || "The upload failed.");
        break;
      }
      urls.push(body.url);
    }
    update({ media: [...draft.media, ...urls] });
    setBusy(false);
  }

  const activeChannel = tab === "shared" ? null : tab;
  const variant = activeChannel ? draft.variants[activeChannel] : undefined;
  const preview = activeChannel ? textFor({ body: draft.body, title: draft.title, link_url: draft.linkUrl || null, variants: draft.variants }, activeChannel) : draft.body;
  const limit = activeChannel ? CHANNEL_INFO[activeChannel].limit : null;
  const setVariant = (patch: Variant) => activeChannel && update({ variants: { ...draft.variants, [activeChannel]: { ...variant, ...patch } } });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" role="dialog" aria-modal="true" aria-label="Post composer">
      <div className="flex h-dvh w-full max-w-2xl flex-col border-l border-white/10 bg-[#100b28]">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <h2 className="font-serif text-xl">{draft.id ? "Edit post" : "New post"}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="flex h-11 w-11 items-center justify-center text-white/70"><PiX size={20} /></button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <fieldset disabled={locked} className="space-y-4 disabled:opacity-70">
            <input aria-label="Title" value={draft.title} onChange={(event) => update({ title: event.target.value })} placeholder="Title or campaign name" className={FIELD} />

            <div>
              <p className={LABEL}>Channels</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {CHANNELS.map((channel) => {
                  const on = draft.channels.includes(channel);
                  return (
                    <button key={channel} type="button" aria-pressed={on} onClick={() => update({ channels: on ? draft.channels.filter((item) => item !== channel) : [...draft.channels, channel] })} className={`min-h-10 border px-3 text-xs ${on ? "border-[#4f9d8f] bg-[#2e7d6f]/25" : "border-white/15 text-white/55"}`}>
                      {CHANNEL_INFO[channel].label}
                      {!connected.has(channel) && <span className="ml-1 text-white/35">· manual</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-white/10" role="tablist">
                {(["shared", ...draft.channels] as const).map((item) => (
                  <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={`min-h-10 shrink-0 border-b-2 px-3 text-xs ${tab === item ? "border-[#4f9d8f]" : "border-transparent text-white/50"}`}>
                    {item === "shared" ? "Shared text" : CHANNEL_INFO[item].label}
                  </button>
                ))}
              </div>
              {activeChannel ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs leading-relaxed text-white/50">{PLATFORM_TIPS[activeChannel]}</p>
                  <textarea aria-label={`${CHANNEL_INFO[activeChannel].label} text`} rows={6} value={variant?.body ?? ""} onChange={(event) => setVariant({ body: event.target.value })} placeholder="Leave empty to use the shared text" className={`${FIELD} resize-y`} />
                  <input aria-label="Hashtags" value={(variant?.hashtags ?? []).join(" ")} onChange={(event) => setVariant({ hashtags: event.target.value.split(/[\s,]+/) })} placeholder="Hashtags, separated by spaces" className={FIELD} />
                  <p className={`text-right text-xs tabular-nums ${limit && preview.length > limit ? "text-[#f0a08a]" : "text-white/45"}`}>{preview.length} / {limit}</p>
                </div>
              ) : (
                <textarea aria-label="Post text" rows={8} value={draft.body} onChange={(event) => update({ body: event.target.value })} placeholder="What do you want to share?" className={`${FIELD} mt-3 resize-y`} />
              )}
            </div>

            <input aria-label="Link" type="url" value={draft.linkUrl} onChange={(event) => update({ linkUrl: event.target.value })} placeholder="https://www.kaararealtygroup.com/properties/..." className={FIELD} />

            <div>
              <p className={LABEL}>Images</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {draft.media.map((url) => (
                  <div key={url} className="relative h-20 w-20 border border-white/15">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${url}?w=160&h=160&fit=crop`} alt="" className="h-full w-full object-cover" />
                    <button type="button" aria-label="Remove image" onClick={() => update({ media: draft.media.filter((item) => item !== url) })} className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center bg-black/70"><PiX size={12} /></button>
                  </div>
                ))}
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-white/25 text-[10px] text-white/55">
                  <PiImage size={18} aria-hidden="true" />
                  Add
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => upload(event.target.files)} />
                </label>
              </div>
            </div>

            <label className="block">
              <span className={LABEL}>Publish at (your local time)</span>
              <input type="datetime-local" value={draft.when} onChange={(event) => update({ when: event.target.value })} className={`${FIELD} mt-2`} />
              <span className="mt-1 block text-xs text-white/40">Scheduled posts go out within about 30 minutes of this time.</span>
            </label>
          </fieldset>

          {Object.keys(draft.results).length > 0 && (
            <div className="border border-white/10 bg-[#171232] p-3">
              <p className={LABEL}>Results</p>
              <ul className="mt-2 grid gap-1.5 text-sm">
                {Object.entries(draft.results).map(([channel, result]) => (
                  <li key={channel} className="flex items-start gap-2">
                    {result.ok ? <PiCheck size={15} className="mt-0.5 shrink-0 text-[#4f9d8f]" /> : <PiWarningCircle size={15} className="mt-0.5 shrink-0 text-[#f0a08a]" />}
                    <span className="min-w-0 break-words">
                      {CHANNEL_INFO[channel as Channel]?.label ?? "System"}: {result.message}
                      {result.url && <> · <a href={result.url} target={result.url.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer" className="underline">Open</a></>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!locked && draft.channels.some((channel) => !connected.has(channel)) && draft.body.trim() && (
            <div className="flex flex-wrap gap-2">
              {draft.channels.filter((channel) => !connected.has(channel)).map((channel) => (
                <a key={channel} href={CHANNEL_INFO[channel].composeUrl(textFor({ body: draft.body, title: draft.title, link_url: draft.linkUrl || null, variants: draft.variants }, channel))} target="_blank" rel="noopener noreferrer" className="border border-white/20 px-3 py-2 text-xs">Open {CHANNEL_INFO[channel].label}</a>
              ))}
              {draft.id && <button type="button" onClick={async () => { const r = await markPosted(draft.id!); if (r.ok) update({ status: "posted" }); }} className="border border-white/20 px-3 py-2 text-xs">Mark as posted</button>}
            </div>
          )}
          {error && <p role="alert" className="border border-[#f0a08a]/40 bg-[#f0a08a]/10 p-3 text-sm text-[#f0a08a]">{error}</p>}
          {notice && <p role="status" className="text-sm text-[#7fd0c1]">{notice}</p>}
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t border-white/10 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {draft.id && !locked && (
            <button type="button" disabled={busy} onClick={async () => { if (!(await confirmDialog({ title: "Delete this post?", body: "This cannot be undone.", confirmLabel: "Delete", danger: true }))) return; const r = await deletePost(draft.id!); if (r.ok) onDeleted(draft.id!); else setError(r.error); }} className={`${BUTTON} border-[#f0a08a]/40 text-[#f0a08a]`}>Delete</button>
          )}
          <div className="ml-auto flex flex-wrap justify-end gap-2">
            {!locked && <button type="button" disabled={busy} onClick={() => save(false)} className={SECONDARY}>Save draft</button>}
            {!locked && <button type="button" disabled={busy} onClick={publish} className={SECONDARY}>Publish now</button>}
            {!locked && <button type="button" disabled={busy} onClick={() => save(true)} className={PRIMARY}>{busy ? "Working" : "Schedule"}</button>}
          </div>
        </footer>
      </div>
    </div>
  );
}

function ChannelsPanel({ connections, onClose }: { connections: Connection[]; onClose: () => void }) {
  const [editing, setEditing] = useState<Channel | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    const result = await connectChannel(editing, String(data.get("accountId")), String(data.get("accountName")), String(data.get("token")));
    setBusy(false);
    if (!result.ok) return setError(result.error);
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" role="dialog" aria-modal="true" aria-label="Connected channels">
      <div className="max-h-dvh w-full max-w-lg overflow-y-auto border border-white/10 bg-[#171232] p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl">Channels</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="flex h-11 w-11 items-center justify-center text-white/70"><PiX size={20} /></button>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-white/55">Tokens are encrypted and never shown again. Until a channel is connected, you can open it and post manually.</p>
        <ul className="mt-4 divide-y divide-white/10">
          {NEEDS_ACCOUNT.map((channel) => {
            const connection = connections.find((item) => item.channel === channel);
            return (
              <li key={channel} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{CHANNEL_INFO[channel].label}</p>
                  <p className="truncate text-xs text-white/45">{connection ? connection.account_name || connection.account_id : "Not connected"}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {connection && <button type="button" onClick={async () => { if (await confirmDialog({ title: `Disconnect ${CHANNEL_INFO[channel].label}?`, body: "You can connect it again later.", confirmLabel: "Disconnect", danger: true })) { await disconnectChannel(channel); window.location.reload(); } }} className="min-h-10 px-2 text-xs text-[#f0a08a]">Remove</button>}
                  <button type="button" onClick={() => setEditing(channel)} className="min-h-10 border border-white/20 px-3 text-xs">{connection ? "Replace" : "Connect"}</button>
                </div>
              </li>
            );
          })}
        </ul>
        {editing && (
          <form onSubmit={submit} className="mt-3 grid gap-2 border-t border-white/10 pt-4">
            <p className="text-sm font-medium">Connect {CHANNEL_INFO[editing].label}</p>
            <input name="accountId" required aria-label="Account" placeholder={CHANNEL_INFO[editing].accountHint} className={FIELD} />
            <input name="accountName" aria-label="Display name" placeholder="Display name" className={FIELD} />
            <input name="token" type="password" required autoComplete="off" aria-label="Access token" placeholder="Access token" className={FIELD} />
            {error && <p role="alert" className="text-sm text-[#f0a08a]">{error}</p>}
            <button type="submit" disabled={busy} className={PRIMARY}>{busy ? "Saving" : "Save connection"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
