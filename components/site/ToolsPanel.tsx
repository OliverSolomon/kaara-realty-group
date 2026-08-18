import AreaConverter from "./AreaConverter";
import CurrencyConverter from "./CurrencyConverter";
import MortgageCalculator from "./MortgageCalculator";

interface ToolsPanelProps {
  /** Copy explaining why the tools sit on this particular page. */
  blurb: string;
  baseCurrency?: string;
  className?: string;
  /** Seeds the repayment estimator. Omit on section pages. */
  propertyPrice?: number;
  /** Short stays are not bought, so the repayment estimator is left off. */
  showMortgage?: boolean;
}

export default function ToolsPanel({
  blurb,
  baseCurrency = "KES",
  className = "",
  propertyPrice,
  showMortgage = true,
}: ToolsPanelProps) {
  return (
    <div className={className}>
      <h2 className="font-serif text-3xl leading-tight text-[#efebe3] sm:text-4xl">
        Check the numbers yourself
      </h2>
      <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-white/60">{blurb}</p>

      <div className="mt-12 grid grid-cols-1 gap-px bg-white/10 lg:grid-cols-2">
        <div className="bg-[#100b28] p-8 lg:p-10">
          <h3 className="mb-8 text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">
            Currency
          </h3>
          <CurrencyConverter baseCurrency={baseCurrency} />
        </div>
        <div className="bg-[#100b28] p-8 lg:p-10">
          <h3 className="mb-8 text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">
            Floor area
          </h3>
          <AreaConverter />
        </div>
        {showMortgage && (
          <div className="bg-[#100b28] p-8 lg:col-span-2 lg:p-10">
            <h3 className="mb-8 text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">
              Repayments
            </h3>
            <div className="max-w-[640px]">
              <MortgageCalculator propertyPrice={propertyPrice} baseCurrency={baseCurrency} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
