"use client";

import { useState } from "react";
import { PiArrowsLeftRightBold } from "react-icons/pi";
import { formatArea, sqftToSqm, sqmToSqft } from "@/lib/site";

interface AreaConverterProps {
  /** Seeds the calculator with the listing's own floor area. */
  initialSqm?: number;
  className?: string;
}

/**
 * Square metres to square feet, both directions. Kenyan listings quote square
 * metres; buyers in the Gulf, the UK and the US read square feet.
 */
export default function AreaConverter({ initialSqm, className = "" }: AreaConverterProps) {
  const [sqm, setSqm] = useState(initialSqm ? String(initialSqm) : "");
  const [sqft, setSqft] = useState(initialSqm ? formatArea(sqmToSqft(initialSqm)) : "");

  const onSqm = (value: string) => {
    setSqm(value);
    const n = parseFloat(value);
    setSqft(isNaN(n) ? "" : formatArea(sqmToSqft(n)));
  };

  const onSqft = (value: string) => {
    setSqft(value);
    const n = parseFloat(value.replace(/,/g, ""));
    setSqm(isNaN(n) ? "" : formatArea(sqftToSqm(n)));
  };

  const fieldClass =
    "w-full bg-transparent border border-white/15 px-4 py-3 text-sm text-[#efebe3] outline-none transition-colors duration-200 focus:border-[#4f9d8f] placeholder:text-white/35";

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="area-sqm"
            className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-white/55"
          >
            Square metres
          </label>
          <input
            id="area-sqm"
            inputMode="decimal"
            value={sqm}
            onChange={(e) => onSqm(e.target.value)}
            placeholder="148"
            className={fieldClass}
          />
        </div>

        <div className="hidden pb-3 text-white/30 sm:block" aria-hidden="true">
          <PiArrowsLeftRightBold size={18} />
        </div>

        <div className="flex-1">
          <label
            htmlFor="area-sqft"
            className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-white/55"
          >
            Square feet
          </label>
          <input
            id="area-sqft"
            inputMode="decimal"
            value={sqft}
            onChange={(e) => onSqft(e.target.value)}
            placeholder="1,593"
            className={fieldClass}
          />
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-white/45">
        One square metre is 10.7639 square feet. Areas are as quoted by the developer and should be
        confirmed against the title before purchase.
      </p>
    </div>
  );
}
