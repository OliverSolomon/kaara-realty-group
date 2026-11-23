"use client";

import { useState } from "react";
import { PiCheckCircle, PiFileText, PiWarningCircle } from "react-icons/pi";
import { readAttribution } from "@/lib/attribution";

const FIELD =
  "w-full border border-white/15 bg-transparent px-4 py-3 text-sm text-[#efebe3] outline-none transition-colors duration-200 placeholder:text-white/35 focus:border-[#4f9d8f]";

export default function PaymentPlanOffer({ title, slug }: { title?: string; slug?: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const phone = String(data.get("phone") || "");
    if (!String(data.get("name") || "").trim() || phone.replace(/\D/g, "").length < 9) {
      setStatus("error");
      setError("Enter your name and a phone number we can WhatsApp.");
      return;
    }

    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "payment_plan",
          name: data.get("name"),
          phone,
          website: data.get("website"),
          marketingConsent: data.get("marketingConsent") === "on",
          listing: title,
          listingSlug: slug,
          path: window.location.pathname,
          attribution: readAttribution(),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error && err.message ? err.message : "We could not send that request.");
    }
  }

  if (status === "sent") {
    return (
      <p role="status" className="mt-4 flex items-start gap-3 border border-[#2e7d6f]/50 bg-[#2e7d6f]/10 p-4 text-sm leading-relaxed text-white/75">
        <PiCheckCircle size={20} className="mt-0.5 shrink-0 text-[#4f9d8f]" aria-hidden="true" />
        Request received. An advisor will WhatsApp you the payment plan and floor plans.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press mt-4 flex min-h-12 w-full items-center justify-center gap-2 border border-[#4f9d8f]/60 bg-[#2e7d6f]/10 px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#efebe3] transition-colors duration-200 hover:bg-[#2e7d6f]/25"
      >
        <PiFileText size={16} aria-hidden="true" />
        Get the payment plan
      </button>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mt-4 border border-white/15 p-4">
      <p className="text-sm leading-relaxed text-white/70">
        We will WhatsApp you the price breakdown and floor plans for this home.
      </p>
      <div className="mt-4 grid gap-3">
        <label className="sr-only" htmlFor="plan-name">Full name</label>
        <input id="plan-name" name="name" autoComplete="name" placeholder="Full name" className={FIELD} />
        <label className="sr-only" htmlFor="plan-phone">WhatsApp number</label>
        <input id="plan-phone" name="phone" type="tel" autoComplete="tel" placeholder="WhatsApp number" className={FIELD} />
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
        <label className="flex items-start gap-3 text-xs leading-relaxed text-white/55">
          <input name="marketingConsent" type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#4f9d8f]" />
          Also send me similar listings. I can opt out at any time.
        </label>
      </div>
      {status === "error" && (
        <p role="alert" className="mt-3 flex items-start gap-2 text-xs text-[#f0a08a]">
          <PiWarningCircle size={15} className="shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="press mt-4 min-h-12 w-full border border-[#4f9d8f] bg-[#2e7d6f] px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4faf8] transition-colors duration-200 hover:bg-[#256257] disabled:opacity-60"
      >
        {status === "sending" ? "Sending" : "Send it to my WhatsApp"}
      </button>
    </form>
  );
}
