import { requireAdmin } from "@/lib/auth/admin";
import Link from "next/link";

export default async function ContentHome() {
  await requireAdmin("content");
  return (
    <div className="flex h-full min-h-64 flex-col items-center justify-center gap-4 text-center">
      <p className="max-w-sm text-sm leading-relaxed text-white/50">
        Choose something from the menu. It follows the same order as Sanity Studio, and changes stay in draft until you publish.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/admin/content/property/new" className="press inline-flex min-h-11 items-center border border-[#4f9d8f] bg-[#2e7d6f] px-4 text-[10px] font-bold uppercase tracking-[0.14em]">Add property</Link>
        <Link href="/admin/content/post/new" className="press inline-flex min-h-11 items-center border border-white/20 px-4 text-[10px] font-bold uppercase tracking-[0.14em]">New insight</Link>
      </div>
    </div>
  );
}
