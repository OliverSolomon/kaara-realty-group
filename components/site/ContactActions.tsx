"use client";

import { PiWhatsappLogo, PiPhone } from "react-icons/pi";
import { DEFAULT_CONTACT, telLink, whatsappLink } from "@/lib/site";

interface ContactActionsProps {
  contact?: { phone?: string; whatsapp?: string };
  /** What the prefilled WhatsApp message should refer to. */
  subject?: string;
  className?: string;
  variant?: "solid" | "quiet";
}

export default function ContactActions({
  contact,
  subject,
  className = "",
  variant = "solid",
}: ContactActionsProps) {
  const message = subject
    ? `Hello Kaara, I would like to talk about ${subject}.`
    : "Hello Kaara, I would like to speak to an advisor.";

  const base =
    "press inline-flex items-center justify-center gap-3 px-7 py-3.5 text-[10px] font-bold uppercase tracking-[0.25em] transition-colors duration-200";

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <a
        href={whatsappLink(contact?.whatsapp, message)}
        target="_blank"
        rel="noopener noreferrer"
        className={
          variant === "solid"
            ? `${base} border border-[#4f9d8f] bg-[#2e7d6f] text-[#f4faf8] hover:bg-[#256257]`
            : `${base} border border-white/20 text-[#efebe3] hover:border-[#4f9d8f] hover:text-[#4f9d8f]`
        }
      >
        <PiWhatsappLogo size={16} aria-hidden="true" />
        WhatsApp us
      </a>
      <a
        href={telLink(contact?.phone)}
        className={`${base} border border-white/20 text-[#efebe3] hover:border-white/50`}
      >
        <PiPhone size={16} aria-hidden="true" />
        {contact?.phone || DEFAULT_CONTACT.phone}
      </a>
    </div>
  );
}
