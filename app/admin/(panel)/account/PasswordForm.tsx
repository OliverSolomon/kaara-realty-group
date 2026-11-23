"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";

const LABEL = "mt-4 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/55";
const FIELD =
  "mt-2 w-full border border-white/15 bg-transparent px-4 py-3 text-sm text-[#efebe3] outline-none focus:border-[#4f9d8f]";

export default function PasswordForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("current") || "");
    const newPassword = String(data.get("next") || "");
    if (newPassword.length < 12) {
      setMessage({ ok: false, text: "Use at least 12 characters." });
      return;
    }
    if (newPassword !== data.get("confirm")) {
      setMessage({ ok: false, text: "The new passwords do not match." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (error) throw error;
      form.reset();
      setMessage({ ok: true, text: "Password changed. Other devices were signed out." });
    } catch {
      setMessage({ ok: false, text: "Your current password is incorrect." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="current" className={LABEL}>Current password</label>
      <input id="current" name="current" type="password" required autoComplete="current-password" className={FIELD} />
      <label htmlFor="next" className={LABEL}>New password</label>
      <input id="next" name="next" type="password" required minLength={12} autoComplete="new-password" className={FIELD} />
      <label htmlFor="confirm" className={LABEL}>Repeat new password</label>
      <input id="confirm" name="confirm" type="password" required minLength={12} autoComplete="new-password" className={FIELD} />
      {message && (
        <p role={message.ok ? "status" : "alert"} className={`mt-4 text-sm ${message.ok ? "text-[#4f9d8f]" : "text-[#f0a08a]"}`}>
          {message.text}
        </p>
      )}
      <button type="submit" disabled={busy} className="press mt-5 min-h-12 w-full border border-[#4f9d8f] bg-[#2e7d6f] text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4faf8] disabled:opacity-60">
        {busy ? "Saving" : "Change password"}
      </button>
    </form>
  );
}
