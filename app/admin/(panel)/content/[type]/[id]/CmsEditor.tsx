"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- Document values follow the CMS schema at runtime. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { PiArrowDown, PiArrowLeft, PiArrowUp, PiFile, PiImage, PiPlus, PiShareNetwork, PiTrash, PiX } from "react-icons/pi";
import { uploadAsset } from "@/lib/cms/upload";
import { fieldVisible, type CmsDocumentType, type CmsField } from "@/lib/cms/types";

const WordEditorDialog = dynamic(() => import("./WordEditorDialog"), { ssr: false });

type Value = any;
const FIELD = "w-full border border-white/15 bg-transparent px-3 py-2.5 text-sm text-[#efebe3] outline-none placeholder:text-white/30 focus:border-[#4f9d8f]";
const SMALL = "press flex h-9 w-9 shrink-0 items-center justify-center border border-white/15 text-white/65 hover:text-white disabled:opacity-30";
const ADD = "press inline-flex min-h-10 items-center gap-2 border border-white/20 px-3 text-xs";
const key = () => crypto.randomUUID().replace(/-/g, "").slice(0, 12);
const PROJECT = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;

async function cms(body: object) {
  const response = await fetch("/api/admin/cms", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The change could not be saved.");
  // Parsed here so every caller gets the server's error text.
  return data;
}

function imageUrl(ref?: string) {
  const match = ref?.match(/^image-([a-f0-9]+-\d+x\d+)-([a-z0-9]+)$/i);
  return match ? `https://cdn.sanity.io/images/${PROJECT}/${DATASET}/${match[1]}.${match[2]}` : null;
}

const slugify = (text: string, max = 96) =>
  text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, max);

function emptyFor(member: CmsField): Value {
  if (member.type === "image" || member.type === "file") return { _type: member.type, _key: key() };
  if (member.type === "reference") return { _type: "reference", _key: key() };
  if (member.type === "object" || member.fields) return { _type: member.name, _key: key() };
  return "";
}

/** Array rows that were added but never filled in are not saved. */
function prune(value: Value): Value {
  if (Array.isArray(value)) {
    return value
      .filter((item) => !(item && typeof item === "object" && Object.keys(item).every((name) => name === "_type" || name === "_key")))
      .map(prune);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, prune(item)]));
  }
  return value;
}

function setOrRemove(object: Value, name: string, value: Value) {
  const next = { ...(object ?? {}) };
  if (value === undefined || value === "" || value === null) delete next[name];
  else next[name] = value;
  return next;
}

function Shell({ field, id, children }: { field: CmsField; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">
        {field.title}{field.required && <span className="text-[#f0a08a]"> *</span>}
      </label>
      {field.description && <p className="mt-1 text-xs leading-relaxed text-white/40">{field.description}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function AssetInput({ field, value, onChange, id }: { field: CmsField; value: Value; onChange: (value: Value) => void; id: string }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const kind = field.type === "file" ? "file" : "image";
  const ref = value?.asset?._ref as string | undefined;
  const preview = kind === "image" ? imageUrl(ref) ?? value?.externalUrl : null;

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const data = await uploadAsset(file, kind, setProgress);
      onChange({ ...(value ?? {}), _type: kind, asset: { _type: "reference", _ref: data.assetId } });
    } catch (failure) {
      setError(failure instanceof Error && failure.message ? failure.message : "The upload failed.");
    } finally {
      setBusy(false);
    }
  }

  const extras = (field.fields ?? []).filter((item) => item.name !== "asset");
  return (
    <div className="border border-white/10 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-20 w-28 items-center justify-center overflow-hidden bg-white/5">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.includes("cdn.sanity.io") ? `${preview}?w=224&h=160&fit=crop&auto=format` : preview} alt="" className="h-full w-full object-cover" />
          ) : kind === "image" ? <PiImage size={22} className="text-white/30" /> : <PiFile size={22} className={ref ? "text-[#7fd0c1]" : "text-white/30"} />}
        </div>
        <label className="press inline-flex min-h-10 cursor-pointer items-center border border-white/20 px-3 text-xs">
          {busy ? `Uploading ${progress}%` : ref ? "Replace" : "Upload"}
          <input id={id} type="file" accept={kind === "image" ? "image/jpeg,image/png,image/webp,image/gif" : "application/pdf,.docx,image/*"} disabled={busy} className="sr-only" onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
        </label>
        {ref && <button type="button" onClick={() => { const next = { ...value }; delete next.asset; delete next.hotspot; delete next.crop; onChange(Object.keys(next).filter((item) => !item.startsWith("_")).length ? next : undefined); }} className="min-h-10 px-2 text-xs text-[#f0a08a]">Remove</button>}
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-[#f0a08a]">{error}</p>}
      {extras.length > 0 && <div className="mt-3 grid gap-3"><Fields fields={extras} value={value ?? {}} document={value ?? {}} onChange={(next) => onChange({ _type: kind, ...next })} prefix={id} /></div>}
    </div>
  );
}

function ReferenceInput({ field, value, onChange, id }: { field: CmsField; value: Value; onChange: (value: Value) => void; id: string }) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<{ id: string; title: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const ref = value?._ref as string | undefined;

  useEffect(() => {
    if (!ref) return;
    let active = true;
    cms({ op: "referenceTitle", id: ref }).then((data) => { if (active) setTitle(data.title ?? "Missing item"); }).catch(() => undefined);
    return () => { active = false; };
  }, [ref]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      cms({ op: "references", types: field.to, search }).then((data) => setItems(data.items)).catch(() => setItems([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [open, search, field.to]);

  if (ref && !open) {
    return (
      <div className="flex items-center justify-between gap-2 border border-white/15 px-3 py-1.5 text-sm">
        <span className="truncate">{title || "Loading…"}</span>
        <span className="flex shrink-0 gap-1">
          <button type="button" onClick={() => setOpen(true)} className="min-h-9 px-2 text-xs text-[#7fd0c1]">Change</button>
          <button type="button" aria-label={`Clear ${field.title}`} onClick={() => onChange(undefined)} className="min-h-9 px-2 text-white/50"><PiX size={13} /></button>
        </span>
      </div>
    );
  }
  return (
    <div className="relative">
      <input id={id} value={search} onFocus={() => setOpen(true)} onChange={(event) => setSearch(event.target.value)} onBlur={() => setTimeout(() => setOpen(false), 150)} placeholder="Search…" className={FIELD} />
      {open && items.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto border border-white/15 bg-[#1d1740] shadow-2xl">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange({ ...(value?._key ? { _key: value._key } : {}), _type: "reference", _ref: item.id }); setTitle(item.title); setOpen(false); setSearch(""); }} className="min-h-10 w-full truncate px-3 text-left text-sm hover:bg-white/10">
                {item.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const blockText = (block: Value) => (block.children ?? []).map((child: Value) => child.text ?? "").join("");

/** Rich text opens in the full Word editor. Citations, callouts and images travel through it safely. */
function PortableTextInput({ field, value, onChange }: { field: CmsField; value: Value; onChange: (value: Value) => void }) {
  const blocks: Value[] = Array.isArray(value) ? value : [];
  const [editing, setEditing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const words = blocks.reduce((total, block) => total + (block._type === "block" ? blockText(block).trim().split(/\s+/).filter(Boolean).length : 0), 0);
  const rich = blocks.filter((block) => block._type !== "block").length;
  const preview = blocks.filter((block) => block._type === "block" && blockText(block).trim()).slice(0, 2).map(blockText).join(" ");
  return (
    <div className="border border-white/15 p-3">
      {preview ? <p className="line-clamp-3 text-sm leading-relaxed text-white/65">{preview}</p> : <p className="text-sm text-white/40">Nothing written yet.</p>}
      <p className="mt-2 text-xs text-white/40">{words} words{rich ? ` · ${rich} rich block${rich === 1 ? "" : "s"}` : ""}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => { setFile(null); setEditing(true); }} className="press min-h-11 border border-[#4f9d8f] bg-[#2e7d6f] px-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#f4faf8]">Open Word editor</button>
        <label className="press inline-flex min-h-11 cursor-pointer items-center border border-white/20 px-4 text-[10px] font-bold uppercase tracking-[0.14em]">
          Upload Word file
          <input type="file" accept=".docx,.doc,.odt,.rtf,.md,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(event) => { const picked = event.target.files?.[0]; event.target.value = ""; if (!picked) return; if (blocks.length && !window.confirm("Replace the current text with this file?")) return; setFile(picked); setEditing(true); }} />
        </label>
      </div>
      {editing && <WordEditorDialog title={field.title} value={blocks} file={file} onApply={(next) => onChange(next.length ? next : undefined)} onClose={() => setEditing(false)} />}
    </div>
  );
}

function ArrayInput({ field, value, onChange, document, id }: { field: CmsField; value: Value; onChange: (value: Value) => void; document: Value; id: string }) {
  const items: Value[] = Array.isArray(value) ? value : [];
  const members = field.of ?? [];
  const update = (next: Value[]) => onChange(next.length ? next : undefined);
  const stringsOnly = members.length === 1 && members[0].type === "string";
  const [tag, setTag] = useState("");

  if (stringsOnly && field.list) {
    const groups = [...new Set(field.list.map((option) => option.group ?? ""))];
    return (
      <div className="grid gap-3">
        {groups.map((group) => (
          <div key={group}>
            {group && <p className="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-white/40">{group}</p>}
            <div className="flex flex-wrap gap-1.5">
              {field.list!.filter((option) => (option.group ?? "") === group).map((option) => {
                const on = items.includes(option.value);
                return <button key={option.value} type="button" aria-pressed={on} onClick={() => update(on ? items.filter((item) => item !== option.value) : [...items, option.value])} className={`min-h-9 border px-2.5 text-xs ${on ? "border-[#4f9d8f] bg-[#2e7d6f]/25" : "border-white/15 text-white/55"}`}>{option.title}</button>;
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (stringsOnly) {
    const add = () => {
      const text = tag.trim();
      if (text && !items.includes(text)) update([...items, text]);
      setTag("");
    };
    return (
      <div>
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span key={item} className="inline-flex max-w-full items-center gap-1 border border-white/15 px-2 py-1 text-xs">
              <span className="truncate">{item}</span>
              <button type="button" aria-label={`Remove ${item}`} onClick={() => update(items.filter((other) => other !== item))}><PiX size={11} /></button>
            </span>
          ))}
        </div>
        <input id={id} value={tag} onChange={(event) => setTag(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }} onBlur={add} placeholder="Type and press Enter" className={`${FIELD} mt-2`} />
      </div>
    );
  }

  const memberFor = (item: Value) => members.find((member) => member.name === item?._type || member.type === item?._type) ?? members[0];
  const move = (index: number, delta: number) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    update(next);
  };

  return (
    <div className="grid gap-2">
      {items.map((item, index) => {
        const member = memberFor(item);
        return (
          <div key={item?._key ?? index} className="border border-white/10 bg-white/[0.02] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="truncate text-xs text-white/50">{member?.title ?? "Item"} {index + 1}</span>
              <span className="flex gap-1">
                <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)} className={SMALL}><PiArrowUp size={13} /></button>
                <button type="button" aria-label="Move down" disabled={index === items.length - 1} onClick={() => move(index, 1)} className={SMALL}><PiArrowDown size={13} /></button>
                <button type="button" aria-label="Remove item" onClick={() => update(items.filter((_, position) => position !== index))} className={SMALL}><PiTrash size={13} /></button>
              </span>
            </div>
            {member && (
              <SingleField
                field={{ ...member, title: "", description: undefined }}
                value={item}
                document={document}
                id={`${id}-${index}`}
                bare
                onChange={(next) => update(items.map((value, position) => {
                  if (position !== index) return value;
                  if (next === undefined) return emptyFor(member);
                  return typeof next === "object" ? { ...next, _key: item?._key ?? key(), ...(item?._type ? { _type: item._type } : {}) } : next;
                }))}
              />
            )}
          </div>
        );
      })}
      <div className="flex flex-wrap gap-2">
        {members.map((member) => (
          <button key={member.name + member.type} type="button" onClick={() => update([...items, emptyFor(member)])} className={ADD}><PiPlus size={13} />{member.title || "Item"}</button>
        ))}
      </div>
    </div>
  );
}

function SingleField({ field, value, onChange, document, id, bare = false }: { field: CmsField; value: Value; onChange: (value: Value) => void; document: Value; id: string; bare?: boolean }) {
  let control: React.ReactNode;
  switch (field.type) {
    case "text":
      control = <textarea id={id} rows={field.rows ?? 4} value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={`${FIELD} resize-y`} />;
      break;
    case "number":
      control = <input id={id} type="number" step="any" value={value ?? ""} onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))} className={FIELD} />;
      break;
    case "boolean":
      control = (
        <label className="inline-flex min-h-10 items-center gap-2 text-sm">
          <input id={id} type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#4f9d8f]" />
          {value ? "Yes" : "No"}
        </label>
      );
      break;
    case "url":
      control = <input id={id} type="url" value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder="https://" className={FIELD} />;
      break;
    case "email":
      control = <input id={id} type="email" value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={FIELD} />;
      break;
    case "date":
      control = <input id={id} type="date" value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={FIELD} />;
      break;
    case "datetime": {
      const date = value ? new Date(value) : null;
      const local = date && !Number.isNaN(date.getTime()) ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
      control = <input id={id} type="datetime-local" value={local} onChange={(event) => onChange(event.target.value ? new Date(event.target.value).toISOString() : undefined)} className={FIELD} />;
      break;
    }
    case "slug":
      control = (
        <div className="flex gap-2">
          <input id={id} value={value?.current ?? ""} onChange={(event) => onChange(event.target.value ? { _type: "slug", current: event.target.value } : undefined)} className={`${FIELD} min-w-0`} />
          {field.source && <button type="button" onClick={() => { const generated = slugify(String(document?.[field.source!] ?? ""), field.maxLength); if (generated) onChange({ _type: "slug", current: generated }); }} className="press min-h-10 shrink-0 border border-white/20 px-3 text-xs">Generate</button>}
        </div>
      );
      break;
    case "image":
    case "file":
      control = <AssetInput field={field} value={value} onChange={onChange} id={id} />;
      break;
    case "reference":
      control = <ReferenceInput field={field} value={value} onChange={onChange} id={id} />;
      break;
    case "portableText":
      control = <PortableTextInput field={field} value={value} onChange={onChange} />;
      break;
    case "array":
      control = <ArrayInput field={field} value={value} onChange={onChange} document={document} id={id} />;
      break;
    case "object":
      control = (
        <div className={bare ? "grid gap-3" : "grid gap-3 border border-white/10 p-3"}>
          <Fields fields={field.fields ?? []} value={value ?? {}} document={document} prefix={id} onChange={(next) => onChange(Object.keys(next).some((item) => !item.startsWith("_")) ? next : undefined)} />
        </div>
      );
      break;
    default:
      control = field.list ? (
        <select id={id} value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={FIELD}>
          <option value="">Select</option>
          {field.list.map((option) => <option key={option.value} value={option.value}>{option.title}</option>)}
        </select>
      ) : (
        <input id={id} value={value ?? ""} maxLength={field.max} onChange={(event) => onChange(event.target.value)} className={FIELD} />
      );
  }
  return bare ? <>{control}</> : <Shell field={field} id={id}>{control}</Shell>;
}

function Fields({ fields, value, onChange, document, prefix }: { fields: CmsField[]; value: Value; onChange: (value: Value) => void; document: Value; prefix: string }) {
  return (
    <>
      {fields.filter((field) => fieldVisible(field, document)).map((field) => (
        <SingleField key={field.name} field={field} id={`${prefix}-${field.name}`} value={value?.[field.name]} document={document} onChange={(next) => onChange(setOrRemove(value, field.name, next))} />
      ))}
    </>
  );
}

export default function CmsEditor({ schema, initial, rev, hasPublished, hasDraft, isNew, singleton }: {
  schema: CmsDocumentType;
  initial: Value;
  rev: string | null;
  hasPublished: boolean;
  hasDraft: boolean;
  isNew: boolean;
  singleton: boolean;
}) {
  const router = useRouter();
  const [doc, setDoc] = useState<Value>(initial);
  const [revision, setRevision] = useState(rev);
  const [published, setPublished] = useState(hasPublished);
  const [draft, setDraft] = useState(hasDraft);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [created, setCreated] = useState(!isNew);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const backHref = singleton ? "/admin/content" : `/admin/content/${schema.name}${doc.listingType ? `?listing=${doc.listingType}` : ""}`;
  const id = doc._id as string;

  async function run(op: "save" | "publish") {
    setBusy(op);
    setMessage(null);
    try {
      const { doc: saved } = await cms({ op, type: schema.name, id, value: prune(doc), rev: revision });
      setDoc({ ...saved, _id: id });
      setRevision(saved._rev);
      setDirty(false);
      setDraft(op === "save");
      if (op === "publish") setPublished(true);
      setMessage({ ok: true, text: op === "publish" ? "Published. The website updates within a minute." : "Draft saved." });
      if (!created) {
        setCreated(true);
        router.replace(`/admin/content/${schema.name}/${encodeURIComponent(id)}`);
      }
    } catch (failure) {
      setMessage({ ok: false, text: failure instanceof Error ? failure.message : "That failed." });
    } finally {
      setBusy("");
    }
  }

  async function remove(op: "discard" | "delete") {
    const prompt = op === "discard" ? "Discard this draft and go back to the published version?" : `Permanently delete “${String(doc.title ?? doc.name ?? "this item")}”? This cannot be undone.`;
    if (!window.confirm(prompt)) return;
    setBusy(op);
    setMessage(null);
    try {
      await cms({ op, type: schema.name, id });
      setDirty(false);
      if (op === "delete") router.push(backHref);
      else window.location.reload();
    } catch (failure) {
      setMessage({ ok: false, text: failure instanceof Error ? failure.message : "That failed." });
      setBusy("");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={backHref} className="inline-flex min-h-11 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#4f9d8f] lg:hidden">
        <PiArrowLeft size={13} aria-hidden="true" />
        Back
      </Link>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="min-w-0 break-words font-serif text-3xl">{String(doc.title ?? doc.name ?? schema.title)}</h1>
        <span className={`border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${draft || dirty ? "border-[#d8c07a]/60 text-[#d8c07a]" : "border-[#4f9d8f]/60 text-[#7fd0c1]"}`}>
          {dirty ? "Unsaved" : draft ? (published ? "Draft changes" : "Draft") : published ? "Published" : "New"}
        </span>
      </div>
      <div className="mt-5 grid gap-5 border border-white/10 bg-[#171232] p-4 sm:p-6">
        <Fields fields={schema.fields} value={doc} document={doc} prefix="cms" onChange={(next) => { setDoc({ ...next, _id: id, _type: schema.name, ...(doc._rev ? { _rev: doc._rev } : {}) }); setDirty(true); setMessage(null); }} />
      </div>
      <div className="sticky bottom-0 z-20 -mx-4 mt-5 border-t border-white/10 bg-[#100b28]/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
          {message && <p role={message.ok ? "status" : "alert"} className={`w-full text-sm ${message.ok ? "text-[#7fd0c1]" : "text-[#f0a08a]"}`}>{message.text}</p>}
          {!singleton && created && <button type="button" disabled={Boolean(busy)} onClick={() => remove("delete")} className="press min-h-11 border border-[#f0a08a]/40 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#f0a08a] disabled:opacity-50">Delete</button>}
          {draft && published && <button type="button" disabled={Boolean(busy)} onClick={() => remove("discard")} className="press min-h-11 border border-white/20 px-3 text-[10px] font-bold uppercase tracking-[0.14em] disabled:opacity-50">Discard</button>}
          {schema.name === "post" && published && !dirty && !draft && (
            <Link href={`/admin/posts?insight=${encodeURIComponent(id)}`} className="press inline-flex min-h-11 items-center gap-2 border border-[#4f9d8f] px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7fd0c1]">
              <PiShareNetwork size={14} aria-hidden="true" />
              Share to social
            </Link>
          )}
          <div className="ml-auto flex gap-2">
            <button type="button" disabled={Boolean(busy) || !dirty} onClick={() => run("save")} className="press min-h-11 border border-white/20 px-4 text-[10px] font-bold uppercase tracking-[0.14em] disabled:opacity-40">{busy === "save" ? "Saving" : "Save draft"}</button>
            <button type="button" disabled={Boolean(busy) || (!dirty && !draft && published)} onClick={() => run("publish")} className="press min-h-11 border border-[#4f9d8f] bg-[#2e7d6f] px-5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#f4faf8] disabled:opacity-40">{busy === "publish" ? "Publishing" : "Publish"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
