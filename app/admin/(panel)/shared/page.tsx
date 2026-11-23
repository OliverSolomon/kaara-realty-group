import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { getPool } from "@/lib/db";

export default async function SharedPage() {
  const staff = await requireAdmin();
  const result = await getPool()?.query<{ kind: "content" | "design"; item_id: string; title: string; created_by: string }>(
    "SELECT kind, item_id, title, created_by FROM shared_items WHERE email = $1 ORDER BY created_at DESC LIMIT 200",
    [staff.email]
  );
  const items = result?.rows ?? [];
  const href = (item: (typeof items)[number]) => {
    if (item.kind === "design") return `/design-studio/${item.item_id}`;
    const at = item.item_id.indexOf(":");
    return `/admin/content/${item.item_id.slice(0, at)}/${encodeURIComponent(item.item_id.slice(at + 1))}`;
  };
  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-3xl">Shared with me</h1>
      <p className="mt-1 text-sm text-white/55">Articles and designs other people invited you to edit.</p>
      {items.length === 0 ? (
        <p className="mt-6 border border-white/10 bg-[#171232] px-6 py-12 text-center text-sm text-white/55">Nothing has been shared with you yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-white/10 border border-white/10 bg-[#171232]">
          {items.map((item) => (
            <li key={`${item.kind}:${item.item_id}`}>
              <Link href={href(item)} className="flex min-h-14 items-center gap-3 p-3 hover:bg-white/5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  <span className="block truncate text-xs text-white/45">Shared by {item.created_by}</span>
                </span>
                <span className="shrink-0 border border-white/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/60">{item.kind === "design" ? "Design" : "Article"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
