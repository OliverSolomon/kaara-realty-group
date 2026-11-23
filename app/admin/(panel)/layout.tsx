import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import SignOutButton from "./SignOutButton";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#100b28]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-4 lg:px-8">
          <Link href="/admin" className="whitespace-nowrap font-serif text-xs uppercase tracking-[0.2em] sm:text-sm">
            Kaara <span className="text-white/50">Leads</span>
          </Link>
          <nav aria-label="Admin" className="no-scrollbar flex min-w-0 items-center gap-3 overflow-x-auto sm:gap-6">
            {[
              ["/admin", "Inbox"],
              ["/admin/whatsapp", "WhatsApp"],
              ["/admin/account", "Account"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="min-h-11 shrink-0 content-center text-[10px] font-bold uppercase tracking-[0.14em] text-white/70 hover:text-white sm:tracking-[0.18em]">
                {label}
              </Link>
            ))}
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-6 pb-[calc(2rem+env(safe-area-inset-bottom))] lg:px-8 lg:py-10">
        {children}
      </main>
    </>
  );
}
