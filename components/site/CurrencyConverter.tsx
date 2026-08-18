"use client";

import { useState } from "react";
import { CURRENCIES, useCurrency, type Currency } from "@/context/CurrencyContext";

interface CurrencyConverterProps {
  /** The listing price, in the currency it is stored in. */
  amount?: number;
  baseCurrency?: string;
  className?: string;
}

/**
 * Shows one price across the five currencies our buyers think in. The active
 * currency is the one selected site wide, so a buyer sets it once.
 */
export default function CurrencyConverter({
  amount,
  baseCurrency = "KES",
  className = "",
}: CurrencyConverterProps) {
  const { currency, setCurrency, convertTo, formatIn, ratesAreIndicative, ratesUpdated } =
    useCurrency();
  const [custom, setCustom] = useState(amount ? String(amount) : "");

  const numeric = parseFloat(custom.replace(/[^0-9.]/g, ""));
  const hasValue = !isNaN(numeric) && isFinite(numeric);

  return (
    <div className={className}>
      <label
        htmlFor="currency-amount"
        className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-white/55"
      >
        Amount in {baseCurrency.toUpperCase() === "KSH" ? "KES" : baseCurrency.toUpperCase()}
      </label>
      <input
        id="currency-amount"
        inputMode="decimal"
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        placeholder="32000000"
        className="w-full bg-transparent border border-white/15 px-4 py-3 text-sm text-[#efebe3] outline-none transition-colors duration-200 focus:border-[#4f9d8f] placeholder:text-white/35"
      />

      <div className="mt-5 divide-y divide-white/10 border-t border-white/10">
        {CURRENCIES.map(({ code, label }) => {
          const active = code === currency;
          return (
            <button
              key={code}
              type="button"
              onClick={() => setCurrency(code as Currency)}
              aria-pressed={active}
              className={`press flex w-full items-baseline justify-between gap-4 py-3 text-left transition-colors duration-200 ${
                active ? "text-[#efebe3]" : "text-white/55 hover:text-white/85"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.25em]">
                {code}
                <span className="ml-3 font-normal normal-case tracking-normal text-white/35">
                  {label}
                </span>
              </span>
              <span className="font-serif text-lg tabular-nums">
                {hasValue ? formatIn(convertTo(numeric, baseCurrency, code), code) : "-"}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-white/45">
        {ratesAreIndicative
          ? "Indicative rates for orientation only."
          : `Live mid-market rates${ratesUpdated ? `, updated ${ratesUpdated}` : ""}.`}{" "}
        Your bank or transfer service sets the rate that applies on the day of settlement.
      </p>
    </div>
  );
}
