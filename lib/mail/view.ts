/** Shows a message once and folds the history it quotes, so a thread reads as what is new. */

const QUOTE_SELECTORS = [".gmail_quote", ".gmail_extra", ".yahoo_quoted", ".moz-cite-prefix", 'blockquote[type="cite"]', "#divRplyFwdMsg", "#appendonsend", ".OutlookMessageHeader"];
const WROTE = /^\s*(on|el|le|am)\s.{5,160}(wrote|escribió|a écrit|schrieb)\s*:?\s*$/i;
const escapeText = (text: string) => text.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]!);

function trimQuoted(html: string) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const body = doc.body;
  let start: Element | null = null;
  for (const selector of QUOTE_SELECTORS) {
    start = body.querySelector(selector);
    if (start) break;
  }
  if (!start) {
    const quote = body.querySelector("blockquote");
    if (quote && (body.textContent ?? "").replace(/\s+/g, "").length > (quote.textContent ?? "").replace(/\s+/g, "").length) start = quote;
  }
  if (!start) {
    start = Array.from(body.querySelectorAll("hr")).find((rule) => /^from:/i.test((rule.nextElementSibling?.textContent ?? "").trim())) ?? null;
  }
  if (!start) return html;

  let first: Element = start;
  const previous = start.previousElementSibling;
  if (previous && WROTE.test((previous.textContent ?? "").trim())) first = previous;
  const holder = first.parentElement ?? body;
  const details = doc.createElement("details");
  details.className = "kaara-quoted";
  const summary = doc.createElement("summary");
  summary.textContent = "Show quoted text";
  details.appendChild(summary);
  const moved: ChildNode[] = [];
  for (let node: ChildNode | null = first; node; node = node.nextSibling) moved.push(node);
  holder.insertBefore(details, first);
  moved.forEach((node) => details.appendChild(node));
  const above = Array.from(body.childNodes).filter((node) => node !== details).map((node) => node.textContent ?? "").join("").replace(/\s+/g, "");
  return !above && holder === body ? html : body.innerHTML;
}

const CSS = `html{height:auto!important;min-height:0!important;overflow-y:hidden!important;overflow-x:auto}
body{height:auto!important;min-height:0!important;margin:0;padding:16px;background:#fff;font:15px/1.65 -apple-system,Segoe UI,Roboto,sans-serif;color:#1f2937;overflow-wrap:anywhere}
img{max-width:100%;height:auto}pre{white-space:pre-wrap;font:inherit}table{max-width:100%}
a{color:#1a56db;text-decoration:underline}
blockquote{margin:8px 0;padding-left:12px;border-left:3px solid #4f9d8f;color:#6b7280}
details.kaara-quoted{margin-top:12px}
details.kaara-quoted>summary{display:inline-block;cursor:pointer;list-style:none;padding:3px 10px;background:#eef3f2;color:#2e7d6f;font-size:12px}
details.kaara-quoted>summary::-webkit-details-marker{display:none}
details.kaara-quoted[open]>summary{margin-bottom:8px}`;

export function messageDocument(message: { html: string | null; text: string }) {
  const raw = message.html ?? `<pre>${escapeText(message.text)}</pre>`;
  const csp = "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; font-src https: data:";
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><meta name="referrer" content="no-referrer"><base target="_blank"><style>${CSS}</style></head><body>${trimQuoted(raw)}</body></html>`;
}

/** Sizes the frame to its content, and keeps it right as images load. */
export function fitFrame(frame: HTMLIFrameElement) {
  const doc = frame.contentDocument;
  if (!doc?.documentElement) return () => undefined;
  let scheduled = 0;
  const run = () => {
    scheduled = 0;
    const previous = frame.style.height;
    frame.style.height = "1px";
    const height = Math.max(doc.body?.scrollHeight ?? 0, doc.documentElement.scrollHeight);
    frame.style.height = previous;
    frame.style.height = `${Math.min(30000, Math.max(60, height + 2))}px`;
  };
  const schedule = () => {
    if (!scheduled) scheduled = requestAnimationFrame(run);
  };
  run();
  const observer = doc.body ? new ResizeObserver(schedule) : null;
  if (doc.body) observer?.observe(doc.body);
  doc.addEventListener("load", schedule, true);
  doc.addEventListener("toggle", schedule, true);
  return () => {
    observer?.disconnect();
    doc.removeEventListener("load", schedule, true);
    doc.removeEventListener("toggle", schedule, true);
    if (scheduled) cancelAnimationFrame(scheduled);
  };
}
