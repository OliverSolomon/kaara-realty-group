"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { PiCaretLeft, PiCaretRight } from "react-icons/pi";
import { CMS_STRUCTURE, SINGLETONS, type CmsNode } from "@/lib/cms/types";

type Entry = CmsNode | "divider";

function findPath(entries: Entry[], match: (node: CmsNode) => boolean, trail: CmsNode[] = []): CmsNode[] | null {
  for (const entry of entries) {
    if (entry === "divider") continue;
    const here = [...trail, entry];
    if (match(entry)) return here;
    if (entry.children) {
      const found = findPath(entry.children, match, here);
      if (found) return found;
    }
  }
  return null;
}

function nodeByIds(ids: string[]) {
  const nodes: CmsNode[] = [];
  let level: Entry[] = CMS_STRUCTURE;
  for (const id of ids) {
    const node = level.find((entry): entry is CmsNode => entry !== "divider" && entry.id === id);
    if (!node) break;
    nodes.push(node);
    level = node.children ?? [];
  }
  return nodes;
}

function Pane({ title, entries, activeIds, counts, onOpen, onBack, visibleOnPhone }: {
  title: string;
  entries: Entry[];
  activeIds: Set<string>;
  counts: Record<string, number>;
  onOpen: (node: CmsNode) => void;
  onBack?: () => void;
  visibleOnPhone: boolean;
}) {
  return (
    <nav aria-label={title} className={`${visibleOnPhone ? "flex" : "hidden"} w-full shrink-0 flex-col border-white/10 lg:flex lg:h-dvh lg:w-60 lg:border-r`}>
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-white/10 px-2">
        {onBack && <button type="button" aria-label="Back" onClick={onBack} className="flex h-10 w-10 items-center justify-center text-white/65 lg:hidden"><PiCaretLeft size={16} /></button>}
        <h2 className="truncate px-2 text-sm font-semibold">{title}</h2>
      </div>
      <ul className="flex-1 overflow-y-auto p-1.5">
        {entries.map((entry, index) => {
          if (entry === "divider") return <li key={`divider-${index}`} role="separator" className="my-1.5 border-t border-white/10" />;
          const active = activeIds.has(entry.id);
          const count = entry.type && !SINGLETONS.has(entry.type) ? (entry.listing ? counts[`${entry.type}:${entry.listing}`] : counts[entry.type]) ?? 0 : null;
          const body = (
            <>
              <span className="min-w-0 flex-1 truncate">{entry.label}</span>
              {count !== null && <span className="text-xs tabular-nums text-white/40">{count}</span>}
              {entry.children && <PiCaretRight size={13} className="shrink-0 text-white/40" aria-hidden="true" />}
            </>
          );
          const className = `flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm lg:min-h-9 ${active ? "bg-[#2e7d6f]/30 text-white" : "text-white/70 hover:bg-white/5"}`;
          return (
            <li key={entry.id}>
              {entry.href ? (
                <Link href={entry.href} aria-current={active ? "page" : undefined} onClick={() => onOpen(entry)} className={className}>{body}</Link>
              ) : (
                <button type="button" aria-expanded={active} onClick={() => onOpen(entry)} className={className}>{body}</button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function ContentShell({ counts, children }: { counts: Record<string, number>; children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const listing = params.get("listing");
  const location = `${pathname}?${listing ?? ""}`;
  const [, , , typeSegment, idSegment] = pathname.split("/");

  const activePath = useMemo(() => {
    if (!typeSegment) return [];
    const exact = findPath(CMS_STRUCTURE, (node) => node.type === typeSegment && (SINGLETONS.has(typeSegment) || (node.listing ?? null) === listing));
    return (exact ?? findPath(CMS_STRUCTURE, (node) => node.type === typeSegment) ?? []).map((node) => node.id);
  }, [typeSegment, listing]);

  // A menu opened by hand applies until the page changes.
  const [manual, setManual] = useState<{ at: string; ids: string[] } | null>(null);
  const openIds = manual?.at === location ? manual.ids : activePath;
  const nodes = nodeByIds(openIds);
  const panes: { title: string; entries: Entry[]; ids: string[] }[] = [{ title: "Kaara Content", entries: CMS_STRUCTURE, ids: [] }];
  nodes.forEach((node, index) => {
    if (node.children) panes.push({ title: node.label, entries: node.children, ids: openIds.slice(0, index + 1) });
  });
  const pageOpen = Boolean(typeSegment);
  const showPageOnPhone = pageOpen && manual?.at !== location;
  const highlighted = new Set(openIds);

  return (
    <div className="-mx-4 -my-6 lg:-mx-8 lg:-my-8 lg:flex lg:h-dvh">
      <div className={`${showPageOnPhone ? "hidden" : "block"} lg:flex lg:shrink-0`}>
        {panes.map((pane, index) => (
          <Pane
            key={pane.ids.join("/") || "root"}
            title={pane.title}
            entries={pane.entries}
            activeIds={highlighted}
            counts={counts}
            visibleOnPhone={index === panes.length - 1}
            onBack={index > 0 ? () => setManual({ at: location, ids: pane.ids.slice(0, -1) }) : undefined}
            onOpen={(node) => {
              if (!node.href) setManual({ at: location, ids: [...pane.ids, node.id] });
              else setManual(null);
            }}
          />
        ))}
      </div>
      <section aria-label="Content" className={`${showPageOnPhone ? "block" : "hidden"} min-w-0 flex-1 px-4 py-4 lg:block lg:overflow-y-auto lg:px-6`} data-content-id={idSegment ?? ""}>
        {children}
      </section>
    </div>
  );
}
