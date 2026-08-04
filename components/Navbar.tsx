"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PiMagnifyingGlass,
  PiList,
  PiX,
  PiGlobeHemisphereEast,
  PiCaretDown,
} from "react-icons/pi";
import { useCurrency, CURRENCIES, type Currency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { PRIMARY_NAV, SECONDARY_NAV } from "@/lib/site";
import SearchOverlay from "./SearchOverlay";

interface NavbarProps {
  settings?: {
    general?: { siteName?: string; defaultCurrency?: string; defaultLanguage?: string };
    brand?: Record<string, unknown>;
    contact?: Record<string, unknown>;
    socials?: Record<string, unknown>;
  };
  /** Lets the hero sit under a transparent bar on the home page. */
  transparent?: boolean;
}

export default function Navbar({ settings, transparent = false }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const { currency, setCurrency } = useCurrency();
  const { language, setLanguage } = useLanguage();
  const siteName = settings?.general?.siteName || "Kaara & Co Realty Group";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Panels close from the interaction that navigates away, not from a
  // pathname effect, so no cascading render follows a route change.
  const closePanels = () => {
    setIsMenuOpen(false);
    setIsSettingsOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const barBackground =
    transparent && !scrolled
      ? "bg-transparent border-transparent"
      : "bg-[#100b28]/92 border-white/10 backdrop-blur-md";

  return (
    <>
      <header
        className={`fixed top-0 z-[1000] flex h-[72px] w-full items-center justify-between border-b px-5 transition-colors duration-300 lg:px-10 ${barBackground}`}
      >
        <div className="flex items-center gap-8 xl:gap-12">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
            className="press -ml-2 p-2 text-[#efebe3] lg:hidden"
          >
            <PiList size={22} />
          </button>

          <Link
            href="/"
            onClick={closePanels}
            className="whitespace-nowrap font-serif text-[13px] uppercase tracking-[0.28em] text-[#efebe3] lg:text-[15px]"
          >
            Kaara <span className="text-white/50">&amp; Co</span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closePanels}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`relative py-1 text-[11px] font-bold uppercase tracking-[0.22em] transition-colors duration-200 ${
                  isActive(item.href) ? "text-[#efebe3]" : "text-white/60 hover:text-[#efebe3]"
                }`}
              >
                {item.label}
                <span
                  className={`absolute -bottom-0.5 left-0 h-px bg-[#4f9d8f] transition-[width] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                    isActive(item.href) ? "w-full" : "w-0"
                  }`}
                />
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-5 lg:gap-7">
          <nav aria-label="Secondary" className="hidden items-center gap-6 xl:flex">
            {SECONDARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closePanels}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`text-[10px] uppercase tracking-[0.2em] transition-colors duration-200 ${
                  isActive(item.href) ? "text-[#efebe3]" : "text-white/50 hover:text-[#efebe3]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search listings"
            className="press p-1 text-[#efebe3]"
          >
            <PiMagnifyingGlass size={19} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSettingsOpen((open) => !open)}
              aria-expanded={isSettingsOpen}
              className="press flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#efebe3]"
            >
              {currency}
              <PiCaretDown
                size={11}
                className={`transition-transform duration-200 ${isSettingsOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isSettingsOpen && (
              <div className="reveal absolute right-0 top-11 w-72 origin-top-right border border-white/10 bg-[#171232] p-6 shadow-2xl" data-visible="true">
                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">
                    Currency
                  </p>
                  <div className="grid grid-cols-1 divide-y divide-white/10">
                    {CURRENCIES.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setCurrency(c.code as Currency)}
                        className={`press flex items-center justify-between py-2.5 text-left text-xs transition-colors duration-200 ${
                          currency === c.code
                            ? "text-[#4f9d8f]"
                            : "text-white/60 hover:text-[#efebe3]"
                        }`}
                      >
                        <span>{c.label}</span>
                        <span className="font-bold tracking-[0.15em]">{c.code}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-white/10 pt-5">
                  <label
                    htmlFor="nav-language"
                    className="mb-3 block text-[10px] font-bold uppercase tracking-[0.25em] text-white/45"
                  >
                    Language
                  </label>
                  <select
                    id="nav-language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as "en" | "ar" | "zh")}
                    className="w-full border border-white/15 bg-transparent px-3 py-2.5 text-xs text-[#efebe3] outline-none focus:border-[#4f9d8f]"
                  >
                    <option value="en" className="bg-[#171232]">
                      English
                    </option>
                    <option value="ar" className="bg-[#171232]">
                      العربية
                    </option>
                    <option value="zh" className="bg-[#171232]">
                      中文
                    </option>
                  </select>
                </div>

                <p className="mt-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/35">
                  <PiGlobeHemisphereEast size={13} />
                  Nairobi, Kenya
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[2000] flex flex-col overflow-y-auto bg-[#100b28] p-6 lg:hidden">
          <div className="flex h-[60px] items-center justify-between">
            <span className="font-serif text-[13px] uppercase tracking-[0.28em] text-[#efebe3]">
              Kaara &amp; Co
            </span>
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
              className="press p-2 text-[#efebe3]"
            >
              <PiX size={22} />
            </button>
          </div>

          <nav aria-label="Primary" className="mt-10 flex flex-col">
            {PRIMARY_NAV.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closePanels}
                data-visible="true"
                style={{ animationDelay: `${i * 50}ms` }}
                className="reveal border-b border-white/10 py-5 font-serif text-3xl text-[#efebe3]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <nav aria-label="Secondary" className="mt-10 flex flex-col gap-5">
            {SECONDARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closePanels}
                className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/60"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <p className="mt-auto pt-12 text-xs leading-relaxed text-white/35">
            {siteName}. Nairobi, Kenya.
          </p>
        </div>
      )}

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
