"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";

const LABEL = "text-[10px] font-bold uppercase tracking-[0.22em] text-white/55";
const FIELD =
  "mt-2 w-full border border-white/15 bg-transparent px-4 py-3 text-sm text-[#efebe3] outline-none focus:border-[#4f9d8f]";
const BUTTON =
  "press mt-5 min-h-12 w-full border border-[#4f9d8f] bg-[#2e7d6f] text-[10px] font-bold uppercase tracking-[0.22em] text-[#f4faf8] hover:bg-[#256257] disabled:opacity-60";
const LINK = "mt-4 min-h-11 w-full text-xs text-white/55 underline underline-offset-4 disabled:opacity-60";

export default function LoginForm({ denied }: { denied: boolean }) {
  const [step, setStep] = useState<"password" | "code">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(denied ? "This account does not have admin access." : "");

  // An account without access must not stay signed in.
  useEffect(() => {
    if (denied) void authClient.signOut();
  }, [denied]);

  async function signInWithPassword(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error: failure } = await authClient.signIn.email({ email: email.trim(), password });
      if (failure) throw failure;
      window.location.assign("/admin");
    } catch {
      setBusy(false);
      setError("That email or password is incorrect.");
    }
  }

  async function sendCode() {
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { error: failure } = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "sign-in",
      });
      if (failure) throw failure;
      setStep("code");
    } catch {
      setError("We could not send a code. Check the address and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error: failure } = await authClient.signIn.emailOtp({
        email: email.trim(),
        otp: code.trim(),
      });
      if (failure) throw failure;
      window.location.assign("/admin");
    } catch {
      setBusy(false);
      setError("That code is wrong or has expired.");
    }
  }

  return (
    <>
      {error && (
        <p role="alert" className="mt-5 border border-[#f0a08a]/40 bg-[#f0a08a]/10 p-3 text-sm text-[#f0a08a]">
          {error}
        </p>
      )}
      {step === "password" ? (
        <form onSubmit={signInWithPassword} className="mt-6">
          <label htmlFor="admin-email" className={LABEL}>Work email</label>
          <input
            id="admin-email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={FIELD}
          />
          <label htmlFor="admin-password" className={`${LABEL} mt-5 block`}>Password</label>
          <input
            id="admin-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={FIELD}
          />
          <button type="submit" disabled={busy} className={BUTTON}>
            {busy ? "Signing in" : "Sign in"}
          </button>
          <button type="button" onClick={sendCode} disabled={busy} className={LINK}>
            Email me a code instead
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-6">
          <label htmlFor="admin-code" className={LABEL}>Code sent to {email}</label>
          <input
            id="admin-code"
            inputMode="numeric"
            required
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className={`${FIELD} tracking-[0.3em]`}
          />
          <button type="submit" disabled={busy} className={BUTTON}>
            {busy ? "Checking" : "Sign in"}
          </button>
          <button type="button" onClick={() => setStep("password")} className={LINK}>
            Use my password
          </button>
        </form>
      )}
    </>
  );
}
