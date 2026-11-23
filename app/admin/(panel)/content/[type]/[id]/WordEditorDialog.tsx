"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- Portable Text values follow the CMS schema at runtime. */

import { useMemo, useRef, useState } from "react";
import { confirmDialog } from "@/components/admin/Dialogs";
import { WordcraftEditor, type WordcraftEditorRef } from "@gamine/wordcraft-react";
import { PiCheck, PiX } from "react-icons/pi";
import { htmlToPortable, portableToHtml } from "@/lib/cms/portable";
import { uploadAsset } from "@/lib/cms/upload";

async function storePastedImage(dataUrl: string) {
  const blob = await (await fetch(dataUrl)).blob();
  const extension = blob.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
  const asset = await uploadAsset(new File([blob], `article-image.${extension}`, { type: blob.type }), "image");
  return asset.assetId;
}

export default function WordEditorDialog({ title, value, file, onApply, onClose }: {
  title: string;
  value: any[];
  file: File | null;
  onApply: (blocks: any[]) => void;
  onClose: () => void;
}) {
  const ref = useRef<WordcraftEditorRef>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const document = useMemo(
    () => (file ? { name: file.name, data: file } : { name: "article.html", data: new TextEncoder().encode(portableToHtml(value)) }),
    // The editor opens one document. Later value changes must not reload it mid-edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [file]
  );

  async function apply(close: boolean) {
    const html = ref.current?.getHTML();
    if (html === undefined) return;
    setBusy(true);
    setError("");
    try {
      const next = await htmlToPortable(html, value, storePastedImage);
      const kept = new Set(next.filter((block) => block._type !== "block").map((block) => block._key));
      const removed = value.filter((block) => block._type !== "block" && !kept.has(block._key)).length;
      if (removed && !file && !(await confirmDialog({ title: `${removed} rich block${removed === 1 ? "" : "s"} removed`, body: `An image, callout or similar block was removed. Save without ${removed === 1 ? "it" : "them"}?`, confirmLabel: "Save anyway", danger: true }))) return;
      onApply(next);
      ref.current?.markSaved();
      if (close) onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The document could not be applied.");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (ref.current?.isDirty() && !(await confirmDialog({ title: "Discard your changes?", body: "Your edits in this document will be lost.", confirmLabel: "Discard", cancelLabel: "Keep editing", danger: true }))) return;
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#100b28]" style={{ "--wc-bg": "#171232", "--wc-fg": "#efebe3", "--wc-dim": "rgba(239,235,227,.62)", "--wc-line": "rgba(239,235,227,.14)", "--wc-soft": "#1d1740", "--wc-accent": "#4f9d8f", "--wc-accent-soft": "#1f3f45", "--wc-accent-fg": "#f4faf8" } as React.CSSProperties} role="dialog" aria-modal="true" aria-label={`Edit ${title}`}>
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 bg-[#100b28] px-3 text-[#efebe3]">
        <h2 className="truncate font-serif text-base">{title}</h2>
        <div className="flex shrink-0 items-center gap-2">
          {error && <p role="alert" className="hidden max-w-sm truncate text-xs text-[#f0a08a] md:block">{error}</p>}
          <button type="button" onClick={() => void cancel()} className="press inline-flex min-h-9 items-center gap-1.5 border border-white/25 px-3 text-[10px] font-bold uppercase tracking-[0.14em]">
            <PiX size={13} aria-hidden="true" />
            Cancel
          </button>
          <button type="button" disabled={busy} onClick={() => apply(true)} className="press inline-flex min-h-9 items-center gap-1.5 border border-[#4f9d8f] bg-[#2e7d6f] px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#f4faf8] disabled:opacity-50">
            <PiCheck size={13} aria-hidden="true" />
            {busy ? "Applying" : "Done"}
          </button>
        </div>
      </header>
      <div className="relative min-h-0 flex-1">
        <WordcraftEditor
          ref={ref}
          height="100%"
          document={document}
          autoSave={false}
          hiddenTabs={["Mailings", "Zotero"]}
          tools={{ outline: true, wordCount: true, accessibility: true }}
          checks
          onSave={async () => { await apply(false); }}
          onError={(failure) => setError(failure.message)}
          loading={<p className="p-8 text-center text-sm text-white/60">Starting the editor. The first time takes a moment.</p>}
          fallback={(failure: Error) => <p className="p-6 text-sm text-[#f0a08a]">The editor could not start: {failure.message}</p>}
        />
      </div>
    </div>
  );
}
