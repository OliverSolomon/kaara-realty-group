"use client";

import { useState } from "react";
import { PiCheckCircle, PiWarningCircle, PiArrowRight } from "react-icons/pi";

export type EnquiryKind = "buy" | "viewing" | "booking" | "tour";

interface EnquiryFormProps {
  kind: EnquiryKind;
  /** Listing this enquiry refers to, when it comes from a listing page. */
  listing?: string;
  className?: string;
}

interface FieldSpec {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "date" | "number" | "select" | "textarea";
  required?: boolean;
  options?: string[];
  helper?: string;
  half?: boolean;
}

const CALLING_TIMES = [
  "Morning, 8am to 11am",
  "Midday, 11am to 2pm",
  "Afternoon, 2pm to 5pm",
  "Evening, 5pm to 7pm",
];

const CORE: FieldSpec[] = [
  { name: "name", label: "Full name", type: "text", required: true },
  { name: "phone", label: "Phone number", type: "tel", required: true, half: true },
  { name: "email", label: "Email address", type: "email", required: true, half: true },
];

const CONFIG: Record<
  EnquiryKind,
  { heading: string; blurb: string; submit: string; fields: FieldSpec[] }
> = {
  buy: {
    heading: "Request the full listing pack",
    blurb:
      "Pricing, payment schedule, floor plans and the developer's delivery record. An advisor calls you at the time you choose.",
    submit: "Send request",
    fields: [
      ...CORE,
      {
        name: "callingTime",
        label: "Preferred calling time",
        type: "select",
        required: true,
        options: CALLING_TIMES,
        helper: "East Africa Time. We will not call outside this window.",
      },
      { name: "message", label: "Anything we should know", type: "textarea" },
    ],
  },
  viewing: {
    heading: "Schedule a viewing",
    blurb:
      "Resale units are shown by appointment with the owner present. Ownership and title are verified before any viewing is confirmed.",
    submit: "Request viewing",
    fields: [
      ...CORE,
      { name: "preferredDate", label: "Preferred date", type: "date", required: true, half: true },
      {
        name: "callingTime",
        label: "Preferred calling time",
        type: "select",
        required: true,
        options: CALLING_TIMES,
        half: true,
      },
      { name: "message", label: "Anything we should know", type: "textarea" },
    ],
  },
  booking: {
    heading: "Check availability",
    blurb: "Tell us your dates and we confirm the unit, the rate and the check in process by email.",
    submit: "Check availability",
    fields: [
      ...CORE,
      { name: "checkIn", label: "Check in", type: "date", required: true, half: true },
      { name: "checkOut", label: "Check out", type: "date", required: true, half: true },
      { name: "guests", label: "Guests", type: "number", half: true },
      { name: "message", label: "Anything we should know", type: "textarea" },
    ],
  },
  tour: {
    heading: "Request a virtual tour or consultation",
    blurb:
      "A live walkthrough with an advisor, or a strategy call if you are still deciding where to buy. No pressure to transact.",
    submit: "Request a session",
    fields: [
      ...CORE,
      {
        name: "sessionType",
        label: "What would you like",
        type: "select",
        required: true,
        options: ["Virtual property tour", "Investment consultation", "Both"],
      },
      {
        name: "callingTime",
        label: "Preferred calling time",
        type: "select",
        required: true,
        options: CALLING_TIMES,
      },
      { name: "message", label: "Anything we should know", type: "textarea" },
    ],
  },
};

const FIELD_CLASS =
  "w-full bg-transparent border border-white/15 px-4 py-3 text-sm text-[#efebe3] outline-none transition-colors duration-200 focus:border-[#4f9d8f] placeholder:text-white/35 disabled:opacity-50";

export default function EnquiryForm({ kind, listing, className = "" }: EnquiryFormProps) {
  const config = CONFIG[kind];
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    const nextErrors: Record<string, string> = {};
    config.fields.forEach((field) => {
      if (field.required && !String(data[field.name] || "").trim()) {
        nextErrors[field.name] = `${field.label} is required`;
      }
    });
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      nextErrors.email = "Enter an email address we can reply to";
    }
    if (data.phone && data.phone.replace(/\D/g, "").length < 9) {
      nextErrors.phone = "Enter a phone number including the country code";
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setStatus("sending");
    setError("");

    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, listing, ...data }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "We could not send that request");
      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "We could not send that request");
    }
  }

  if (status === "sent") {
    return (
      <div className={`border border-[#2e7d6f]/50 bg-[#2e7d6f]/10 p-8 ${className}`}>
        <PiCheckCircle size={28} className="mb-4 text-[#4f9d8f]" aria-hidden="true" />
        <h3 className="mb-3 font-serif text-2xl text-[#efebe3]">Request received</h3>
        <p className="max-w-[52ch] text-sm leading-relaxed text-white/70">
          An advisor will be in touch within one working day, at the time you asked for. If it is
          urgent, WhatsApp is the fastest route to us.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="press mt-6 text-[10px] font-bold uppercase tracking-[0.25em] text-[#4f9d8f] underline underline-offset-4"
        >
          Send another request
        </button>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form onSubmit={onSubmit} noValidate className={className}>
      <h3 className="font-serif text-2xl leading-tight text-[#efebe3] sm:text-3xl">
        {config.heading}
      </h3>
      <p className="mt-3 max-w-[58ch] text-sm leading-relaxed text-white/60">{config.blurb}</p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {config.fields.map((field) => {
          const id = `${kind}-${field.name}`;
          const invalid = Boolean(fieldErrors[field.name]);
          return (
            <div
              key={field.name}
              className={`flex flex-col gap-2 ${field.half ? "sm:col-span-1" : "sm:col-span-2"}`}
            >
              <label
                htmlFor={id}
                className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/55"
              >
                {field.label}
                {!field.required && <span className="ml-2 text-white/30">Optional</span>}
              </label>

              {field.type === "select" ? (
                <select
                  id={id}
                  name={field.name}
                  disabled={sending}
                  defaultValue=""
                  aria-invalid={invalid}
                  className={FIELD_CLASS}
                >
                  <option value="" disabled>
                    Select one
                  </option>
                  {field.options?.map((option) => (
                    <option key={option} value={option} className="bg-[#100b28]">
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  id={id}
                  name={field.name}
                  rows={4}
                  disabled={sending}
                  aria-invalid={invalid}
                  className={`${FIELD_CLASS} resize-y`}
                />
              ) : (
                <input
                  id={id}
                  name={field.name}
                  type={field.type}
                  disabled={sending}
                  aria-invalid={invalid}
                  className={FIELD_CLASS}
                />
              )}

              {field.helper && !invalid && (
                <p className="text-xs text-white/45">{field.helper}</p>
              )}
              {invalid && (
                <p role="alert" className="text-xs text-[#f0a08a]">
                  {fieldErrors[field.name]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {status === "error" && (
        <p
          role="alert"
          className="mt-6 flex items-start gap-3 border border-[#f0a08a]/40 bg-[#f0a08a]/10 p-4 text-sm text-[#f0a08a]"
        >
          <PiWarningCircle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="press group mt-8 inline-flex items-center gap-3 border border-[#4f9d8f] bg-[#2e7d6f] px-8 py-4 text-[10px] font-bold uppercase tracking-[0.25em] text-[#f4faf8] transition-colors duration-200 hover:bg-[#256257] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending ? "Sending" : config.submit}
        <PiArrowRight
          size={14}
          aria-hidden="true"
          className="transition-transform duration-200 group-hover:translate-x-1"
        />
      </button>

      <p className="mt-4 max-w-[52ch] text-xs leading-relaxed text-white/40">
        We use your details to answer this enquiry. We do not sell contact data or add you to
        marketing lists without asking first.
      </p>
    </form>
  );
}
