"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PiArrowRight, PiCheck, PiSealCheck } from "react-icons/pi";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { PRIMARY_NAV, SECONDARY_NAV, DEFAULT_CONTACT, telLink } from "@/lib/site";

interface FooterProps {
  settings?: {
    general?: { siteName?: string; footerText?: string };
    contact?: {
      email?: string;
      phone?: string;
      address?: string;
      registrationName?: string;
      registrationNumber?: string;
      registrationUrl?: string;
      registrationQrUrl?: string;
    };
    socials?: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      linkedin?: string;
    };
  };
}

export default function Footer({ settings }: FooterProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const contact = settings?.contact;
  const socials = settings?.socials;
  const siteName = settings?.general?.siteName || "Kaara & Co Realty Group";
  const agencyEmail = contact?.email || DEFAULT_CONTACT.email;

  async function subscribe(event: React.FormEvent) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error();
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  const socialLinks = [
    { href: socials?.instagram, Icon: FaInstagram, label: "Instagram" },
    { href: socials?.linkedin, Icon: FaLinkedinIn, label: "LinkedIn" },
    { href: socials?.facebook, Icon: FaFacebookF, label: "Facebook" },
    { href: socials?.twitter, Icon: FaXTwitter, label: "X" },
  ].filter((s) => Boolean(s.href));

  return (
    <footer className="border-t border-white/10 bg-[#0b0819] px-5 pb-12 pt-20 text-[#efebe3] lg:px-10 lg:pt-28 print:hidden">
      <div className="mx-auto max-w-[1500px]">
        <div className="grid grid-cols-1 gap-14 border-b border-white/10 pb-16 lg:grid-cols-12 lg:gap-10">
          {/* Wordmark and address */}
          <div className="lg:col-span-4">
            <p className="font-serif text-xl uppercase tracking-[0.24em]">
              Kaara <span className="text-white/50">&amp; Co</span>
            </p>
            <p className="mt-5 max-w-[34ch] text-sm leading-relaxed text-white/50">
              {contact?.address ||
                "Property advisory for buyers who want to understand the market before they commit to it."}
            </p>
            <div className="mt-6 space-y-1.5 text-sm">
              <a
                href={`mailto:${agencyEmail}`}
                className="block text-white/70 transition-colors duration-200 hover:text-[#4f9d8f]"
              >
                {agencyEmail}
              </a>
              <a
                href={telLink(contact?.phone)}
                className="block text-white/70 transition-colors duration-200 hover:text-[#4f9d8f]"
              >
                {contact?.phone || DEFAULT_CONTACT.phone}
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="grid grid-cols-2 gap-10 lg:col-span-4">
            <div>
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/35">
                Listings
              </p>
              <ul className="space-y-3 text-sm">
                {PRIMARY_NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-white/65 transition-colors duration-200 hover:text-[#efebe3]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/35">
                Company
              </p>
              <ul className="space-y-3 text-sm">
                {SECONDARY_NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-white/65 transition-colors duration-200 hover:text-[#efebe3]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/neighborhoods"
                    className="text-white/65 transition-colors duration-200 hover:text-[#efebe3]"
                  >
                    Neighbourhoods
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-4">
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/35">
              Market notes
            </p>
            <p className="mb-6 max-w-[38ch] text-sm leading-relaxed text-white/50">
              Quarterly reads on supply, pricing and handover performance across Nairobi. No listings
              blasts.
            </p>

            {status === "done" ? (
              <p className="flex items-center gap-2 text-sm text-[#4f9d8f]">
                <PiCheck size={16} aria-hidden="true" />
                You are on the list.
              </p>
            ) : (
              <form onSubmit={subscribe}>
                <label htmlFor="footer-email" className="sr-only">
                  Email address
                </label>
                <div className="flex items-center gap-3 border-b border-white/20 pb-3 transition-colors duration-200 focus-within:border-[#4f9d8f]">
                  <input
                    id="footer-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                    placeholder="you@example.com"
                    disabled={status === "sending"}
                    className="w-full bg-transparent text-sm text-[#efebe3] outline-none placeholder:text-white/25"
                  />
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    aria-label="Subscribe"
                    className="press text-white/40 transition-colors duration-200 hover:text-[#4f9d8f]"
                  >
                    <PiArrowRight size={20} />
                  </button>
                </div>
                {status === "error" && (
                  <p role="alert" className="mt-3 text-xs text-[#f0a08a]">
                    Check the email address and try once more.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Registration trust block */}
        <div className="flex flex-col gap-8 border-b border-white/10 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6">
            {contact?.registrationQrUrl ? (
              <span className="relative h-24 w-24 shrink-0 bg-white p-2">
                <Image
                  src={contact.registrationQrUrl}
                  alt={`Company registration verification code for ${
                    contact.registrationName || siteName
                  }`}
                  fill
                  sizes="96px"
                  className="object-contain p-2"
                />
              </span>
            ) : (
              <span
                aria-hidden="true"
                className="flex h-24 w-24 shrink-0 items-center justify-center border border-dashed border-white/20 text-center text-[9px] uppercase leading-tight tracking-[0.15em] text-white/30"
              >
                QR to add
              </span>
            )}
            <div>
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#4f9d8f]">
                <PiSealCheck size={14} aria-hidden="true" />
                Registered company
              </p>
              <p className="mt-2 text-sm text-white/70">
                {contact?.registrationName || siteName}
              </p>
              {contact?.registrationNumber && (
                <p className="mt-1 text-sm text-white/45 tabular-nums">
                  Registration {contact.registrationNumber}
                </p>
              )}
              {contact?.registrationUrl && (
                <a
                  href={contact.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs text-white/50 underline underline-offset-4 transition-colors duration-200 hover:text-[#4f9d8f]"
                >
                  Verify the registration
                </a>
              )}
            </div>
          </div>

          {socialLinks.length > 0 && (
            <div className="flex gap-7">
              {socialLinks.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="press text-white/40 transition-colors duration-200 hover:text-[#efebe3]"
                >
                  <Icon size={17} />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 pt-8 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-6">
            <Link href="/contact" className="transition-colors duration-200 hover:text-white/70">
              Contact
            </Link>
            <Link href="/sitemap.xml" className="transition-colors duration-200 hover:text-white/70">
              Sitemap
            </Link>
          </div>
        </div>

        <p className="mt-8 max-w-[80ch] text-xs leading-relaxed text-white/25">
          Listing information is provided by our developer partners and by verified owners, and is
          believed to be accurate at the time of publication. Prices, availability and floor areas
          should be confirmed in writing before you commit funds.
        </p>
      </div>
    </footer>
  );
}
