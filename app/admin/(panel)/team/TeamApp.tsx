"use client";

import { useState, useTransition } from "react";
import { PiCopy, PiPlus, PiTrash } from "react-icons/pi";
import { addStaff, changeStaffRole, removeStaff, setStaffActive } from "@/app/admin/team-actions";
import { ROLES, roleLabel, type StaffRole } from "@/lib/auth/roles";

export interface TeamMember {
  email: string;
  name: string | null;
  role: StaffRole;
  active: boolean;
  owner: boolean;
}

const field = "min-h-11 w-full min-w-0 border border-white/15 bg-[#100b28] px-3 text-sm outline-none focus:border-[#4f9d8f]";

export default function TeamApp({ members, me, pending = [] }: { members: TeamMember[]; me: string; pending?: string[] }) {
  const [form, setForm] = useState({ email: "", name: "", role: "sales" as StaffRole });
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ email: string; password?: string } | null>(null);
  const [pending_, start] = useTransition();

  function run(work: () => Promise<{ ok: true; tempPassword?: string } | { ok: false; error: string }>, done?: (password?: string) => void) {
    setError("");
    start(async () => {
      const result = await work();
      if (!result.ok) setError(result.error);
      else done?.(result.tempPassword);
    });
  }

  return (
    <div className="max-w-5xl">
      <h1 className="font-serif text-3xl">Team</h1>
      <p className="mt-1 text-sm text-white/55">Choose who can sign in and what each person can use.</p>
      {error && <p role="alert" className="mt-4 border border-[#f0a08a]/40 bg-[#f0a08a]/10 p-3 text-sm text-[#f0a08a]">{error}</p>}
      {created && (
        <div role="status" className="mt-4 border border-[#4f9d8f]/50 bg-[#2e7d6f]/15 p-4 text-sm">
          <p>{created.email} can now sign in.</p>
          {created.password ? (
            <>
              <p className="mt-1 text-white/65">Share this temporary password privately. It is shown only once, and they can also sign in with an email code.</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 break-all bg-[#100b28] px-3 py-2 text-xs">{created.password}</code>
                <button type="button" aria-label="Copy temporary password" onClick={() => void navigator.clipboard.writeText(created.password!)} className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/20"><PiCopy size={16} /></button>
              </div>
            </>
          ) : <p className="mt-1 text-white/65">They already have a login, so they can use their existing password.</p>}
        </div>
      )}

      <form
        className="mt-6 grid gap-3 border border-white/10 bg-[#171232] p-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          const email = form.email.trim().toLowerCase();
          run(() => addStaff(form.email, form.name, form.role), (password) => {
            setCreated({ email, password });
            setForm({ email: "", name: "", role: "sales" });
          });
        }}
      >
        <label className="text-xs text-white/55">Email
          <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={`${field} mt-1`} />
        </label>
        <label className="text-xs text-white/55">Name
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={`${field} mt-1`} />
        </label>
        <label className="text-xs text-white/55">Role
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as StaffRole })} className={`${field} mt-1`}>
            {ROLES.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
          </select>
        </label>
        <button type="submit" disabled={pending_} className="press inline-flex min-h-11 items-center justify-center gap-2 bg-[#2e7d6f] px-5 text-[10px] font-bold uppercase tracking-[0.14em] disabled:opacity-60">
          <PiPlus size={14} aria-hidden="true" /> Add
        </button>
      </form>

      <ul className="mt-6 divide-y divide-white/10 border border-white/10 bg-[#171232]">
        {members.map((member) => {
          const locked = member.owner || member.email === me;
          return (
            <li key={member.email} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1 basis-56">
                <p className="truncate text-sm">{member.name || member.email}{member.email === me && <span className="text-white/45"> (you)</span>}</p>
                {member.name && <p className="truncate text-xs text-white/50">{member.email}</p>}
                {!member.active && <p className="mt-0.5 text-xs text-[#f0a08a]">Deactivated</p>}
              </div>
              {locked ? (
                <span className="border border-[#4f9d8f]/50 px-3 py-2 text-xs text-[#7fd0c1]">{roleLabel(member.role)}{member.owner ? " · Owner" : ""}</span>
              ) : (
                <>
                  <select aria-label={`Role for ${member.email}`} value={member.role} disabled={pending_} onChange={(event) => run(() => changeStaffRole(member.email, event.target.value as StaffRole))} className={`${field} !w-40`}>
                    {ROLES.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
                  </select>
                  <button type="button" disabled={pending_} onClick={() => run(() => setStaffActive(member.email, !member.active))} className="min-h-11 border border-white/20 px-3 text-xs disabled:opacity-60">
                    {member.active ? "Deactivate" : "Reactivate"}
                  </button>
                  <button
                    type="button"
                    disabled={pending_}
                    aria-label={`Remove ${member.email}`}
                    onClick={() => { if (window.confirm(`Remove ${member.email} from the team?`)) run(() => removeStaff(member.email)); }}
                    className="flex h-11 w-11 items-center justify-center text-[#f0a08a] disabled:opacity-60"
                  >
                    <PiTrash size={16} />
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>

      {pending.length > 0 && (
        <section aria-label="Waiting for a login" className="mt-6 border border-[#d8c07a]/40 bg-[#171232] p-4">
          <h2 className="text-sm">Invited to shared items, waiting for a login</h2>
          <ul className="mt-2 divide-y divide-white/10">
            {pending.map((email) => (
              <li key={email} className="flex items-center gap-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm">{email}</span>
                <button type="button" disabled={pending_} onClick={() => run(() => addStaff(email, "", "guest"), (password) => setCreated({ email, password }))} className="min-h-11 shrink-0 border border-white/20 px-3 text-xs disabled:opacity-60">Create guest login</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">What each role can use</h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {ROLES.map((role) => (
          <div key={role.id} className="border border-white/10 bg-[#171232] p-4">
            <dt className="text-sm">{role.label}</dt>
            <dd className="mt-1 text-xs leading-relaxed text-white/55">{role.summary}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
