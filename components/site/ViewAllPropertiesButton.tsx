"use client";

import Link from "next/link";
import { PiArrowUpRight } from "react-icons/pi";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Buy, Sell and Stay are server components, so the one control on them whose
 * wording has to follow the language selection lives here as a client island.
 */
export default function ViewAllPropertiesButton({ className = "" }: { className?: string }) {
  const { t } = useLanguage();

  return (
    <div className={`flex justify-center ${className}`}>
      <Link
        href="/properties"
        className="press inline-flex items-center gap-3 border border-white/25 px-10 py-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[#efebe3] transition-colors duration-300 hover:border-[#4f9d8f] hover:text-[#4f9d8f]"
      >
        {t("view_all_properties")}
        <PiArrowUpRight size={14} aria-hidden="true" />
      </Link>
    </div>
  );
}
