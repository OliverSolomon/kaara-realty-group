"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- Portable Text values are open-ended CMS data. */

import {
  defineSchema,
  EditorProvider,
  PortableTextEditable,
  useEditor,
  useEditorSelector,
  type RenderAnnotationFunction,
  type RenderBlockFunction,
  type RenderDecoratorFunction,
  type RenderStyleFunction,
} from "@portabletext/editor";
import { getActiveListItem, getActiveStyle, isActiveAnnotation, isActiveDecorator } from "@portabletext/editor/selectors";
import { useEffect, useRef, useState } from "react";
import { PiImage, PiLink, PiListBullets, PiListNumbers, PiTextB, PiTextItalic, PiTextStrikethrough, PiTextUnderline } from "react-icons/pi";
import { uploadAsset } from "@/lib/cms/upload";

const STYLES = [
  { value: "normal", title: "Body text" },
  { value: "h2", title: "Section heading (H2)" },
  { value: "h3", title: "Sub-heading (H3)" },
  { value: "h4", title: "Minor heading (H4)" },
  { value: "lead", title: "Standfirst / intro" },
  { value: "blockquote", title: "Quote" },
];
const DECORATORS = [
  { value: "strong", title: "Bold", Icon: PiTextB },
  { value: "em", title: "Italic", Icon: PiTextItalic },
  { value: "underline", title: "Underline", Icon: PiTextUnderline },
  { value: "strike-through", title: "Strikethrough", Icon: PiTextStrikethrough },
];
const BLOCK_LABELS: Record<string, string> = {
  articleImage: "Image",
  callout: "Callout",
  pullQuote: "Pull quote",
  statBlock: "Figures panel",
  videoEmbed: "Video",
  propertyEmbed: "Property card",
  sectionDivider: "Divider",
};

const schemaDefinition = defineSchema({
  decorators: [...DECORATORS.map(({ value, title }) => ({ name: value, title })), { name: "highlight", title: "Highlight" }, { name: "code", title: "Code" }],
  styles: STYLES.map(({ value, title }) => ({ name: value, title })),
  lists: [{ name: "bullet", title: "Bulleted list" }, { name: "number", title: "Numbered list" }],
  annotations: [{ name: "link", title: "Link" }, { name: "citation", title: "Citation" }],
  blockObjects: Object.entries(BLOCK_LABELS).map(([name, title]) => ({ name, title })),
  inlineObjects: [],
});

const renderStyle: RenderStyleFunction = ({ schemaType, children }) => {
  switch (schemaType.value) {
    case "h2": return <div className="mb-2 mt-5 font-serif text-2xl leading-tight">{children}</div>;
    case "h3": return <div className="mb-2 mt-4 font-serif text-xl leading-tight">{children}</div>;
    case "h4": return <div className="mb-1 mt-3 text-base font-semibold">{children}</div>;
    case "lead": return <div className="mb-3 font-serif text-lg leading-relaxed text-white/85">{children}</div>;
    case "blockquote": return <div className="my-3 border-l-2 border-[#4f9d8f] pl-4 italic text-white/80">{children}</div>;
    default: return <div className="mb-3 leading-relaxed">{children}</div>;
  }
};

const renderDecorator: RenderDecoratorFunction = ({ value, children }) => {
  if (value === "strong") return <strong>{children}</strong>;
  if (value === "em") return <em>{children}</em>;
  if (value === "underline") return <u>{children}</u>;
  if (value === "strike-through") return <s>{children}</s>;
  if (value === "code") return <code className="bg-white/10 px-1 text-[0.9em]">{children}</code>;
  if (value === "highlight") return <mark className="bg-[#d8c07a]/40 text-inherit">{children}</mark>;
  return <>{children}</>;
};

const renderAnnotation: RenderAnnotationFunction = ({ schemaType, children }) =>
  schemaType.name === "citation"
    ? <span className="border-b border-dotted border-[#d8c07a] text-[#f2e3b5]" title="Citation">{children}</span>
    : <span className="text-[#7fd0c1] underline underline-offset-2">{children}</span>;

const renderBlock: RenderBlockFunction = ({ value, children }) => {
  const block = value as any;
  if (block._type !== "block") {
    const label = BLOCK_LABELS[block._type] ?? "Rich block";
    const detail = block.title || block.quote || block.heading || block.caption || block.alt || block.url || "";
    return (
      <div contentEditable={false} className="my-3 select-none border border-[#4f9d8f]/50 bg-[#2e7d6f]/15 px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7fd0c1]">{label}</span>
        {detail && <span className="mt-0.5 block truncate text-xs text-white/65">{String(detail)}</span>}
        <span className="hidden">{children}</span>
      </div>
    );
  }
  if (block.listItem) {
    return (
      <div className="flex gap-2" style={{ paddingLeft: `${Math.max(0, (block.level ?? 1) - 1) * 18}px` }}>
        <span aria-hidden="true" contentEditable={false} className="select-none text-[#4f9d8f]">{block.listItem === "number" ? "#" : "•"}</span>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    );
  }
  return <>{children}</>;
};

const toolButton = (on: boolean) =>
  `flex h-11 w-11 shrink-0 items-center justify-center border ${on ? "border-[#4f9d8f] bg-[#2e7d6f] text-white" : "border-white/15 text-white/70 hover:text-white"}`;

function Toolbar({ touch }: { touch: () => void }) {
  const editor = useEditor();
  const style = useEditorSelector(editor, getActiveStyle) ?? "normal";
  const list = useEditorSelector(editor, getActiveListItem);
  const linked = useEditorSelector(editor, isActiveAnnotation("link"));
  const bold = useEditorSelector(editor, isActiveDecorator("strong"));
  const italic = useEditorSelector(editor, isActiveDecorator("em"));
  const underline = useEditorSelector(editor, isActiveDecorator("underline"));
  const strike = useEditorSelector(editor, isActiveDecorator("strike-through"));
  const active: Record<string, boolean> = { strong: bold, em: italic, underline, "strike-through": strike };
  const file = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");

  function toggleLink() {
    touch();
    if (linked) {
      editor.send({ type: "annotation.remove", annotation: { name: "link" } });
    } else {
      const href = window.prompt("Link address")?.trim();
      if (!href) return;
      if (!/^(https?:|mailto:|tel:)/i.test(href)) return setStatus("Links must start with https://, mailto: or tel:");
      setStatus("");
      editor.send({ type: "annotation.add", annotation: { name: "link", value: { linkType: "external", href } } });
    }
    editor.send({ type: "focus" });
  }

  async function addImage(picked?: File) {
    if (!picked) return;
    const alt = window.prompt("Describe this image for people who cannot see it")?.trim();
    if (!alt) return setStatus("Image not added. It needs a description.");
    setStatus("Uploading image…");
    try {
      const asset = await uploadAsset(picked, "image");
      touch();
      editor.send({
        type: "insert.block",
        placement: "auto",
        block: { _type: "articleImage", asset: { _type: "reference", _ref: asset.assetId }, alt, layout: "inline" },
      });
      editor.send({ type: "focus" });
      setStatus("");
    } catch (failure) {
      setStatus(failure instanceof Error ? failure.message : "The image could not be uploaded.");
    }
  }

  return (
    <div className="sticky top-0 z-10 border-b border-white/15 bg-[#171232] p-1.5">
      <div className="flex flex-wrap items-center gap-1">
        <label className="sr-only" htmlFor="body-style">Text style</label>
        <select id="body-style" value={style} onChange={(event) => { touch(); editor.send({ type: "style.toggle", style: event.target.value }); editor.send({ type: "focus" }); }} className="min-h-11 max-w-44 border border-white/15 px-2 text-xs">
          {STYLES.map((item) => <option key={item.value} value={item.value}>{item.title}</option>)}
        </select>
        {DECORATORS.map(({ value, title, Icon }) => (
          <button key={value} type="button" aria-label={title} title={title} aria-pressed={active[value]} onMouseDown={(event) => event.preventDefault()} onClick={() => { touch(); editor.send({ type: "decorator.toggle", decorator: value }); editor.send({ type: "focus" }); }} className={toolButton(active[value])}><Icon size={16} /></button>
        ))}
        <button type="button" aria-label="Bulleted list" title="Bulleted list" aria-pressed={list === "bullet"} onMouseDown={(event) => event.preventDefault()} onClick={() => { touch(); editor.send({ type: "list item.toggle", listItem: "bullet" }); editor.send({ type: "focus" }); }} className={toolButton(list === "bullet")}><PiListBullets size={16} /></button>
        <button type="button" aria-label="Numbered list" title="Numbered list" aria-pressed={list === "number"} onMouseDown={(event) => event.preventDefault()} onClick={() => { touch(); editor.send({ type: "list item.toggle", listItem: "number" }); editor.send({ type: "focus" }); }} className={toolButton(list === "number")}><PiListNumbers size={16} /></button>
        <button type="button" aria-label={linked ? "Remove link" : "Add link"} title={linked ? "Remove link" : "Add link"} aria-pressed={linked} onMouseDown={(event) => event.preventDefault()} onClick={toggleLink} className={toolButton(linked)}><PiLink size={16} /></button>
        <button type="button" aria-label="Add image" title="Add image" onClick={() => file.current?.click()} className={toolButton(false)}><PiImage size={16} /></button>
        <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" tabIndex={-1} onChange={(event) => { const picked = event.target.files?.[0]; event.target.value = ""; void addImage(picked); }} />
      </div>
      {status && <p role="status" className="px-1 pt-1 text-xs text-[#f0a08a]">{status}</p>}
    </div>
  );
}

/** Reports the live value after a real edit, so opening an article never marks it as changed. */
function ValueBridge({ touched, onChange }: { touched: React.RefObject<boolean>; onChange: (blocks: any[]) => void }) {
  const editor = useEditor();
  const value = useEditorSelector(editor, (snapshot) => snapshot.context.value);
  const latest = useRef(onChange);
  useEffect(() => { latest.current = onChange; }, [onChange]);
  useEffect(() => {
    if (touched.current) latest.current((value ?? []) as any[]);
  }, [value, touched]);
  return null;
}

export default function SanityBodyEditor({ value, onChange }: { value: any[]; onChange: (blocks: any[]) => void }) {
  const touched = useRef(false);
  const touch = () => { touched.current = true; };
  return (
    <div className="border border-white/15" data-testid="sanity-body-editor">
      <EditorProvider initialConfig={{ schemaDefinition, initialValue: value.length ? value : undefined }}>
        <ValueBridge touched={touched} onChange={onChange} />
        <Toolbar touch={touch} />
        <div onKeyDownCapture={touch} onBeforeInputCapture={touch} onPasteCapture={touch} onDropCapture={touch} onCutCapture={touch}>
          <PortableTextEditable
            aria-label="Article text"
            className="max-h-[70vh] min-h-64 overflow-y-auto px-4 py-3 text-[15px] text-[#efebe3] outline-none"
            renderStyle={renderStyle}
            renderDecorator={renderDecorator}
            renderAnnotation={renderAnnotation}
            renderBlock={renderBlock}
            renderListItem={({ children }) => <>{children}</>}
            renderPlaceholder={() => <span className="text-white/35">Start writing…</span>}
          />
        </div>
      </EditorProvider>
    </div>
  );
}
