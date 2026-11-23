/* eslint-disable @typescript-eslint/no-explicit-any -- Portable Text values are open-ended CMS data. */
/**
 * Moves article bodies between Portable Text and the Word editor.
 *
 * Word cannot hold citations, callouts, stat panels, property cards or hosted images. Each travels as a
 * visible marker and is put back unchanged on save. Deleting a marker deliberately deletes that block.
 */

const MARK_HOST = "https://kaara-mark.invalid/";
const TOKEN = /^\s*\[\[kaara-block:([A-Za-z0-9_-]+)(?:\|[^\]]*)?\]\]\s*$/;
const key = () => crypto.randomUUID().replace(/-/g, "").slice(0, 12);
const esc = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const DECORATORS: Record<string, [string, string]> = {
  strong: ["<strong>", "</strong>"],
  em: ["<em>", "</em>"],
  underline: ["<u>", "</u>"],
  "strike-through": ["<s>", "</s>"],
  code: ["<code>", "</code>"],
  highlight: ['<span style="background-color:#FFFF00">', "</span>"],
};
const STYLE_TAG: Record<string, string> = { h2: "h2", h3: "h3", h4: "h4", lead: "h5", normal: "p" };

function blockLabel(block: any) {
  const names: Record<string, string> = {
    articleImage: "Image",
    image: "Image",
    callout: "Callout",
    pullQuote: "Pull quote",
    statBlock: "Figures panel",
    videoEmbed: "Video",
    propertyEmbed: "Property card",
    sectionDivider: "Section break",
  };
  const detail = String(block.title ?? block.heading ?? block.caption ?? block.quote ?? block.alt ?? "").replace(/[\]|\n]/g, " ").slice(0, 40);
  return `${names[block._type] ?? block._type}${detail ? `: ${detail}` : ""}`;
}

function inline(block: any) {
  const defs = new Map<string, any>((block.markDefs ?? []).map((def: any) => [def._key, def]));
  return (block.children ?? [])
    .map((child: any) => {
      if (child._type !== "span") return "";
      let html = esc(child.text ?? "").replace(/\n/g, "<br>");
      for (const mark of child.marks ?? []) {
        const decorator = DECORATORS[mark];
        if (decorator) html = `${decorator[0]}${html}${decorator[1]}`;
        else if (defs.has(mark)) {
          const def = defs.get(mark);
          const plainLink = def._type === "link" && def.href && def.linkType !== "internal" && !def.sponsored;
          html = `<a href="${esc(plainLink ? def.href : `${MARK_HOST}${def._key}`)}">${html}</a>`;
        }
      }
      return html;
    })
    .join("");
}

export function portableToHtml(value: any[] | undefined) {
  const blocks = value ?? [];
  const out: string[] = [];
  let open: { tag: string; level: number }[] = [];
  const closeTo = (level: number) => {
    while (open.length > level) out.push(`</li></${open.pop()!.tag}>`);
  };
  for (const block of blocks) {
    if (block._type === "block" && block.listItem) {
      const tag = block.listItem === "number" ? "ol" : "ul";
      const level = Math.max(1, block.level ?? 1);
      closeTo(level);
      if (open.length === level && open[level - 1].tag !== tag) closeTo(level - 1);
      if (open.length === level) out.push("</li>");
      while (open.length < level) {
        out.push(`<${tag}>`);
        open.push({ tag, level: open.length + 1 });
      }
      out.push(`<li>${inline(block)}`);
      continue;
    }
    closeTo(0);
    open = [];
    if (block._type !== "block") {
      out.push(`<p>[[kaara-block:${block._key}|${esc(blockLabel(block))}]]</p>`);
    } else if (block.style === "blockquote") {
      out.push(`<blockquote><p>${inline(block)}</p></blockquote>`);
    } else {
      const tag = STYLE_TAG[block.style ?? "normal"] ?? "p";
      out.push(`<${tag}>${inline(block) || "<br>"}</${tag}>`);
    }
  }
  closeTo(0);
  return `<!doctype html><html><head><meta charset="utf-8"><title>Article</title></head><body>${out.join("\n") || "<p></p>"}</body></html>`;
}

interface Run { text: string; marks: string[] }

function collect(node: Node, marks: string[], defs: Map<string, any>, originals: Map<string, any>, runs: Run[]) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent ?? "").replace(/\s+/g, " ");
    if (text) runs.push({ text, marks });
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();
  if (tag === "br") {
    runs.push({ text: "\n", marks });
    return;
  }
  if (tag === "img" || tag === "style" || tag === "script") return;
  let next = marks;
  const add = (mark: string) => {
    if (!next.includes(mark)) next = [...next, mark];
  };
  if (tag === "strong" || tag === "b") add("strong");
  if (tag === "em" || tag === "i") add("em");
  if (tag === "u") add("underline");
  if (tag === "s" || tag === "strike" || tag === "del") add("strike-through");
  if (tag === "code") add("code");
  if (tag === "mark" || /background(-color)?:/i.test(element.getAttribute("style") ?? "")) add("highlight");
  if (tag === "a") {
    const href = element.getAttribute("href") ?? "";
    if (href.startsWith(MARK_HOST)) {
      const original = originals.get(href.slice(MARK_HOST.length));
      if (original) {
        defs.set(original._key, original);
        add(original._key);
      }
    } else if (/^(https?:|mailto:|tel:)/i.test(href)) {
      const existing = [...originals.values()].find((def) => def._type === "link" && def.href === href);
      const def = existing ?? [...defs.values()].find((item) => item.href === href) ?? { _type: "link", _key: key(), linkType: "external", href };
      defs.set(def._key, def);
      add(def._key);
    }
  }
  element.childNodes.forEach((child) => collect(child, next, defs, originals, runs));
}

function makeBlock(element: Node, style: string, originals: Map<string, any>, list?: { type: string; level: number }) {
  const defs = new Map<string, any>();
  const runs: Run[] = [];
  element.childNodes.forEach((child) => {
    const tag = child.nodeType === Node.ELEMENT_NODE ? (child as HTMLElement).tagName.toLowerCase() : "";
    if (tag !== "ul" && tag !== "ol") collect(child, [], defs, originals, runs);
  });
  const merged: Run[] = [];
  for (const run of runs) {
    const last = merged[merged.length - 1];
    if (last && last.marks.length === run.marks.length && last.marks.every((mark) => run.marks.includes(mark))) last.text += run.text;
    else merged.push({ ...run });
  }
  if (merged[0]) merged[0].text = merged[0].text.replace(/^ +/, "");
  if (merged.length) merged[merged.length - 1].text = merged[merged.length - 1].text.replace(/ +$/, "");
  const children = merged.filter((run) => run.text).map((run) => ({ _type: "span", _key: key(), text: run.text, marks: run.marks }));
  return {
    _type: "block",
    _key: key(),
    style,
    markDefs: [...defs.values()],
    children: children.length ? children : [{ _type: "span", _key: key(), text: "", marks: [] }],
    ...(list ? { listItem: list.type, level: list.level } : {}),
  };
}

/**
 * `uploadImage` stores a picture pasted into the document, so it is not lost when the article is saved.
 */
export async function htmlToPortable(html: string, previous: any[] | undefined, uploadImage: (dataUrl: string) => Promise<string | null>) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const originalBlocks = new Map<string, any>((previous ?? []).filter((block) => block._type !== "block").map((block) => [block._key, block]));
  const originalDefs = new Map<string, any>();
  for (const block of previous ?? []) for (const def of block.markDefs ?? []) originalDefs.set(def._key, def);
  const out: any[] = [];
  const pushed = new Set<string>();

  const images = async (element: Element) => {
    for (const image of Array.from(element.querySelectorAll("img"))) {
      const src = image.getAttribute("src") ?? "";
      if (!src.startsWith("data:image/")) continue;
      const assetId = await uploadImage(src);
      if (assetId) out.push({ _type: "articleImage", _key: key(), asset: { _type: "reference", _ref: assetId }, alt: image.getAttribute("alt")?.trim() || "Article image", layout: "inline" });
    }
  };
  const walkList = async (list: Element, level: number) => {
    const type = list.tagName.toLowerCase() === "ol" ? "number" : "bullet";
    for (const item of Array.from(list.children)) {
      if (item.tagName.toLowerCase() !== "li") continue;
      out.push(makeBlock(item, "normal", originalDefs, { type, level }));
      for (const nested of Array.from(item.children)) {
        if (/^(ul|ol)$/i.test(nested.tagName)) await walkList(nested, level + 1);
      }
    }
  };
  const walk = async (element: Element) => {
    const tag = element.tagName.toLowerCase();
    const token = element.textContent?.match(TOKEN)?.[1];
    if (token && originalBlocks.has(token)) {
      if (!pushed.has(token)) {
        out.push(originalBlocks.get(token));
        pushed.add(token);
      }
      return;
    }
    if (/^h[1-6]$/.test(tag)) {
      const style = tag === "h1" || tag === "h2" ? "h2" : tag === "h5" ? "lead" : tag === "h6" ? "h4" : tag;
      out.push(makeBlock(element, style, originalDefs));
      await images(element);
    } else if (tag === "p") {
      const block = makeBlock(element, "normal", originalDefs);
      if (block.children.some((child) => child.text.trim())) out.push(block);
      await images(element);
    } else if (tag === "blockquote") {
      const parts = element.querySelectorAll("p");
      if (parts.length) parts.forEach((part) => out.push(makeBlock(part, "blockquote", originalDefs)));
      else out.push(makeBlock(element, "blockquote", originalDefs));
    } else if (tag === "ul" || tag === "ol") {
      await walkList(element, 1);
    } else if (tag === "table") {
      for (const row of Array.from(element.querySelectorAll("tr"))) {
        const text = Array.from(row.children).map((cell) => cell.textContent?.trim() ?? "").join(" | ");
        if (text.trim()) out.push({ _type: "block", _key: key(), style: "normal", markDefs: [], children: [{ _type: "span", _key: key(), text, marks: [] }] });
      }
    } else if (tag === "img") {
      const holder = doc.createElement("div");
      holder.appendChild(element.cloneNode());
      await images(holder);
    } else {
      for (const child of Array.from(element.children)) await walk(child);
    }
  };
  for (const child of Array.from(doc.body.children)) await walk(child);
  return out;
}
