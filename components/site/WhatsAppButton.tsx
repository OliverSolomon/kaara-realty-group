"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PiWhatsappLogo } from "react-icons/pi";
import { whatsappLink } from "@/lib/site";

interface WhatsAppButtonProps {
  number?: string;
  siteUrl: string;
}

function messageFor(pathname: string, siteUrl: string) {
  if (pathname.startsWith("/properties/")) {
    return `Hello Kaara, I would like to talk about this property: ${siteUrl}${pathname}`;
  }
  return "Hello Kaara, I would like to speak to an advisor.";
}

function FloatingButton({ number, siteUrl, pathname }: WhatsAppButtonProps & { pathname: string }) {
  const [inlineCtaVisible, setInlineCtaVisible] = useState(false);

  // On a phone, step aside while a page's own WhatsApp button is on screen so
  // the same action never appears twice in one view.
  useEffect(() => {
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      setInlineCtaVisible(visible.size > 0);
    });
    document.querySelectorAll("[data-whatsapp-cta]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <a
      href={whatsappLink(number, messageFor(pathname, siteUrl))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Kaara on WhatsApp"
      className={`press fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[900] flex h-14 w-14 items-center justify-center gap-3 rounded-full border border-[#4f9d8f] bg-[#2e7d6f] text-[#f4faf8] shadow-[0_10px_30px_rgba(11,8,25,0.55)] transition-[opacity,translate,background-color] duration-300 hover:bg-[#256257] lg:bottom-8 lg:right-8 lg:w-auto lg:px-6 print:hidden ${
        inlineCtaVisible ? "max-lg:pointer-events-none max-lg:translate-y-3 max-lg:opacity-0" : ""
      }`}
    >
      <PiWhatsappLogo size={26} aria-hidden="true" />
      <span className="hidden text-[10px] font-bold uppercase tracking-[0.25em] lg:inline">
        WhatsApp us
      </span>
    </a>
  );
}

export default function WhatsAppButton(props: WhatsAppButtonProps) {
  const pathname = usePathname();
  // Keyed by route so the observer picks up the new page's buttons.
  return <FloatingButton key={pathname} {...props} pathname={pathname} />;
}
