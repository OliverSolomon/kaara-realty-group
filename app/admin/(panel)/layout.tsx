import Link from "next/link";
import {
  PiAddressBook,
  PiCalendarDots,
  PiEnvelopeSimple,
  PiFiles,
  PiUserCircle,
  PiWhatsappLogo,
} from "react-icons/pi";
import { requireAdmin } from "@/lib/auth/admin";
import SignOutButton from "./SignOutButton";

// Private, per-request data. None of it may be prerendered or cached.
export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Leads", Icon: PiAddressBook },
  { href: "/admin/whatsapp", label: "WhatsApp", Icon: PiWhatsappLogo },
  { href: "/admin/posts", label: "Posts", Icon: PiCalendarDots },
  { href: "/admin/mail", label: "Mail", Icon: PiEnvelopeSimple },
  { href: "/admin/content", label: "Content", Icon: PiFiles },
  { href: "/admin/account", label: "Account", Icon: PiUserCircle },
];

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="lg:flex">
      <aside className="sticky top-0 z-30 border-b border-white/10 bg-[#100b28]/95 backdrop-blur-md lg:h-dvh lg:w-56 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex h-14 items-center justify-between px-4 lg:h-20 lg:px-6">
          <Link href="/admin" className="whitespace-nowrap font-serif text-xs uppercase tracking-[0.2em] lg:text-sm">
            Kaara <span className="text-white/50">Admin</span>
          </Link>
          <div className="lg:hidden"><SignOutButton /></div>
        </div>
        <nav aria-label="Admin" className="no-scrollbar flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:overflow-visible lg:px-3">
          {NAV.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-11 shrink-0 items-center gap-2.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/65 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-6 hidden lg:block"><SignOutButton /></div>
      </aside>
      <main className="mx-auto w-full min-w-0 max-w-[1500px] px-4 py-6 pb-[calc(2rem+env(safe-area-inset-bottom))] lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
