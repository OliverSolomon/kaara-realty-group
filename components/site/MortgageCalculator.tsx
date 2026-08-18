"use client";

import { useMemo, useState } from "react";
import { useCurrency } from "@/context/CurrencyContext";

interface MortgageCalculatorProps {
  /** The listing price, in the currency it is stored in. */
  propertyPrice?: number;
  baseCurrency?: string;
  className?: string;
}

/**
 * Repayment estimator, ported from Pavani and rendered in the Kaara palette.
 *
 * Everything is computed in Kenyan shillings because that is what Kenyan
 * lenders quote, then displayed through the site-wide currency selection so a
 * buyer reading in dollars still sees a figure they recognise.
 */
export default function MortgageCalculator({
  propertyPrice = 0,
  baseCurrency = "KES",
  className = "",
}: MortgageCalculatorProps) {
  const { convertTo, formatPrice } = useCurrency();

  const initialKes = propertyPrice
    ? Math.round(convertTo(propertyPrice, baseCurrency, "KES"))
    : 20000000;

  const [price, setPrice] = useState(initialKes);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(13);
  const [termYears, setTermYears] = useState(25);

  const results = useMemo(() => {
    const downPayment = price * (downPaymentPct / 100);
    const principal = price - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const payments = termYears * 12;

    if (payments === 0) {
      return { monthly: 0, principal, downPayment, totalInterest: 0, totalCost: principal };
    }
    if (monthlyRate === 0) {
      const monthly = principal / payments;
      return { monthly, principal, downPayment, totalInterest: 0, totalCost: principal };
    }

    const growth = Math.pow(1 + monthlyRate, payments);
    const monthly = (principal * monthlyRate * growth) / (growth - 1);
    const totalCost = monthly * payments;
    return {
      monthly,
      principal,
      downPayment,
      totalInterest: totalCost - principal,
      totalCost,
    };
  }, [price, downPaymentPct, interestRate, termYears]);

  const money = (value: number) => formatPrice(value, "KES");

  const sliderClass =
    "h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#4f9d8f]";

  return (
    <div className={className}>
      <div className="border border-white/10 bg-[#171232] px-6 py-8 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">
          Estimated monthly repayment
        </p>
        <p className="mt-3 font-serif text-4xl leading-none text-[#4f9d8f] tabular-nums">
          {money(results.monthly)}
        </p>
        <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-white/35">per month</p>
      </div>

      <div className="mt-8 space-y-8">
        <div>
          <label
            htmlFor="mortgage-price"
            className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-white/55"
          >
            Purchase price (KES)
          </label>
          <input
            id="mortgage-price"
            inputMode="numeric"
            value={price ? price.toLocaleString("en-KE") : ""}
            onChange={(e) => setPrice(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
            placeholder="20,000,000"
            className="w-full border border-white/15 bg-transparent px-4 py-3 text-sm tabular-nums text-[#efebe3] outline-none transition-colors duration-200 focus:border-[#4f9d8f] placeholder:text-white/35"
          />
        </div>

        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <label
              htmlFor="mortgage-deposit"
              className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/55"
            >
              Deposit
            </label>
            <span className="text-sm text-white/70 tabular-nums">
              {downPaymentPct}% · {money(results.downPayment)}
            </span>
          </div>
          <input
            id="mortgage-deposit"
            type="range"
            min={0}
            max={80}
            step={1}
            value={downPaymentPct}
            onChange={(e) => setDownPaymentPct(Number(e.target.value))}
            className={sliderClass}
          />
        </div>

        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <label
              htmlFor="mortgage-rate"
              className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/55"
            >
              Interest rate
            </label>
            <span className="text-sm text-white/70 tabular-nums">{interestRate}%</span>
          </div>
          <input
            id="mortgage-rate"
            type="range"
            min={5}
            max={25}
            step={0.25}
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className={sliderClass}
          />
        </div>

        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <label
              htmlFor="mortgage-term"
              className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/55"
            >
              Term
            </label>
            <span className="text-sm text-white/70 tabular-nums">{termYears} years</span>
          </div>
          <input
            id="mortgage-term"
            type="range"
            min={5}
            max={30}
            step={1}
            value={termYears}
            onChange={(e) => setTermYears(Number(e.target.value))}
            className={sliderClass}
          />
        </div>
      </div>

      <dl className="mt-8 divide-y divide-white/10 border-t border-white/10 text-sm">
        {[
          { label: "Amount borrowed", value: money(results.principal) },
          { label: "Total interest", value: money(results.totalInterest) },
          { label: "Total repaid", value: money(results.totalCost) },
        ].map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-white/50">{row.label}</dt>
            <dd className="text-[#efebe3] tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 text-xs leading-relaxed text-white/45">
        An estimate on a repayment mortgage, not an offer. Kenyan lenders price individually and
        add arrangement, valuation and legal costs on top. Ask your bank for a written illustration
        before you commit.
      </p>
    </div>
  );
}
