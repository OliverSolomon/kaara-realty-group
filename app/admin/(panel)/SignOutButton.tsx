"use client";

import { authClient } from "@/lib/auth/client";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut();
        window.location.assign("/admin/login");
      }}
      className="press min-h-11 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55 hover:text-[#efebe3]"
    >
      Sign out
    </button>
  );
}
