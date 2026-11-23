import Link from "next/link";
import {
  PiAddressBook,
  PiCalendarDots,
  PiEnvelopeSimple,
  PiFiles,
  PiImages,
  PiPaintBrush,
  PiShareNetwork,
  PiUserCircle,
  PiUsersThree,
  PiWhatsappLogo,
} from "react-icons/pi";
import { requireAdmin } from "@/lib/auth/admin";
import { can, roleLabel, type Permission } from "@/lib/auth/roles";
import SignOutButton from "./SignOutButton";

// Private, per-request data. None of it may be prerendered or cached.
export const dynamic = "force-dynamic";

const NAV: { href: string; label: string; Icon: typeof PiAddressBook; permission?: Permission }[] = [
  { href: "/admin", label: "Leads", Icon: PiAddressBook, permission: "leads" },
  { href: "/admin/whatsapp", label: "WhatsApp", Icon: PiWhatsappLogo, permission: "whatsapp" },
  { href: "/admin/posts", label: "Posts", Icon: PiCalendarDots, permission: "posts" },
  { href: "/admin/mail", label: "Mail", Icon: PiEnvelopeSimple, permission: "mail" },
  { href: "/admin/content", label: "Content", Icon: PiFiles, permission: "content" },
  { href: "/admin/design", label: "Design", Icon: PiPaintBrush, permission: "design" },
  { href: "/admin/library", label: "Library", Icon: PiImages, permission: "library" }
  ,{ href: "/admin/team", label: "Team", Icon: PiUsersThree, permission: "users" },
  { href: "/admin/shared", label: "Shared", Icon: PiShareNetwork },
  { href: "/admin/account", label: "Account", Icon: PiUserCircle },
];

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireAdmin();
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
          {NAV.filter((item) => !item.permission || can(staff.role, item.permission)).map(({ href, label, Icon }) => (
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
        <div className="absolute bottom-4 left-6 hidden lg:block">
          <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-white/40">{roleLabel(staff.role)}</p>
          <SignOutButton />
        </div>
      </aside>
      <main className="mx-auto w-full min-w-0 max-w-[1500px] px-4 py-6 pb-[calc(2rem+env(safe-area-inset-bottom))] lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
