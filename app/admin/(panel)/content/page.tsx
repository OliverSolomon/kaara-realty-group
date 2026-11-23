import Link from "next/link";
import { counts } from "@/lib/cms/server";
import { CMS_NAV, SINGLETONS } from "@/lib/cms/types";

export default async function ContentHome() {
  const totals = await counts();
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Content</h1>
          <p className="mt-1 text-sm text-white/55">Everything on the website. Changes stay in draft until you publish.</p>
        </div>
        <a href="/studio" target="_blank" rel="noopener noreferrer" className="press inline-flex min-h-11 items-center border border-white/20 px-4 text-[10px] font-bold uppercase tracking-[0.16em]">Open Studio</a>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CMS_NAV.map((group) => (
          <section key={group.title} className="border border-white/10 bg-[#171232]">
            <h2 className="border-b border-white/10 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{group.title}</h2>
            <ul className="divide-y divide-white/5">
              {group.items.map((item) => {
                const count = item.listing ? totals[`${item.type}:${item.listing}`] : totals[item.type];
                return (
                  <li key={item.href}>
                    <Link href={item.href} className="flex min-h-12 items-center justify-between gap-3 px-4 text-sm hover:bg-white/5">
                      <span>{item.label}</span>
                      {!SINGLETONS.has(item.type) && <span className="text-xs tabular-nums text-white/45">{count ?? 0}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
