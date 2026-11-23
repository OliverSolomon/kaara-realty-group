import { requireAdmin } from "@/lib/auth/admin";
import { roleLabel } from "@/lib/auth/roles";
import PasswordForm from "./PasswordForm";

export default async function AccountPage() {
  const admin = await requireAdmin();
  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-3xl">Account</h1>
      <p className="mt-2 break-all text-sm text-white/55">{admin.email} · {roleLabel(admin.role)}</p>
      <section className="mt-6 border border-white/10 bg-[#171232] p-4 sm:p-6">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Change password</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
