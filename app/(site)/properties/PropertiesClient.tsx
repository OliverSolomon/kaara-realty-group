"use client";

import { useMemo, useState } from "react";
import { PiMagnifyingGlass, PiX } from "react-icons/pi";
import ListingGrid from "@/components/site/ListingGrid";
import type { Listing } from "@/components/site/ListingCard";
import { PROPERTY_TYPE_LABELS, type ListingType } from "@/lib/site";
import { useCurrency, normaliseCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";

type Section = "all" | ListingType;
type SortKey = "newest" | "price-asc" | "price-desc";

const SECTIONS: { key: string; value: Section }[] = [
  { key: "everything", value: "all" },
  { key: "buy", value: "buy" },
  { key: "sell", value: "sell" },
  { key: "stay", value: "stay" },
];

const SORTS: { key: string; value: SortKey }[] = [
  { key: "newest_first", value: "newest" },
  { key: "price_low_high", value: "price-asc" },
  { key: "price_high_low", value: "price-desc" },
];

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5];

/** Everything is compared in Kenyan shillings so a dollar listing sorts
    honestly against a shilling one. */
function amountInKes(
  listing: Listing,
  convertTo: (amount: number, base: string, target: "KES") => number
): number {
  const raw = listing.dailyRate?.amount ?? listing.price?.amount;
  const numeric =
    typeof raw === "number" ? raw : parseFloat(String(raw ?? "").replace(/[^0-9.]/g, ""));
  if (!numeric || !isFinite(numeric)) return 0;
  const base = normaliseCurrency(listing.dailyRate?.currency || listing.price?.currency || "KES");
  return convertTo(numeric, base, "KES");
}

export default function PropertiesClient({ listings }: { listings: Listing[] }) {
  const { convertTo, formatPrice } = useCurrency();
  const { t } = useLanguage();

  const [section, setSection] = useState<Section>("all");
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [minBeds, setMinBeds] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>("newest");

  const counts = useMemo(
    () => ({
      all: listings.length,
      buy: listings.filter((l) => l.listingType === "buy").length,
      sell: listings.filter((l) => l.listingType === "sell").length,
      stay: listings.filter((l) => l.listingType === "stay").length,
    }),
    [listings]
  );

  /** Only offer type chips the inventory can actually satisfy. */
  const availableTypes = useMemo(
    () =>
      Array.from(new Set(listings.flatMap((l) => l.propertyType || []))).sort((a, b) =>
        (PROPERTY_TYPE_LABELS[a] ?? a).localeCompare(PROPERTY_TYPE_LABELS[b] ?? b)
      ),
    [listings]
  );

  const priceCeiling = useMemo(() => {
    const sale = listings.filter((l) => l.listingType !== "stay");
    const highest = Math.max(0, ...sale.map((l) => amountInKes(l, convertTo)));
    if (!highest) return 0;
    // Round up to a clean step so the slider lands on readable numbers.
    const step = 5_000_000;
    return Math.ceil(highest / step) * step;
  }, [listings, convertTo]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const result = listings.filter((listing) => {
      if (section !== "all" && listing.listingType !== section) return false;

      if (q) {
        const haystack = [
          listing.title,
          listing.buildingName,
          listing.location,
          listing.district,
          listing.county,
          listing.developer?.name,
          listing.shortDescription,
          ...(listing.propertyType || []).map((t) => PROPERTY_TYPE_LABELS[t] ?? t),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (types.length) {
        const listingTypes = listing.propertyType || [];
        if (!listingTypes.some((t) => types.includes(t))) return false;
      }

      if (minBeds && (listing.bedrooms ?? 0) < minBeds) return false;

      if (maxPrice) {
        const value = amountInKes(listing, convertTo);
        // A listing with no published price is never hidden by a price filter;
        // "price on request" is an invitation to ask, not a reason to bury it.
        if (value > 0 && value > maxPrice) return false;
      }

      return true;
    });

    if (sort === "newest") return result;

    return [...result].sort((a, b) => {
      const av = amountInKes(a, convertTo);
      const bv = amountInKes(b, convertTo);
      // Unpriced listings sit at the end either way.
      if (!av) return 1;
      if (!bv) return -1;
      return sort === "price-asc" ? av - bv : bv - av;
    });
  }, [listings, section, query, types, minBeds, maxPrice, sort, convertTo]);

  const activeFilters =
    (query ? 1 : 0) + types.length + (minBeds ? 1 : 0) + (maxPrice ? 1 : 0) + (section !== "all" ? 1 : 0);

  const clearAll = () => {
    setSection("all");
    setQuery("");
    setTypes([]);
    setMinBeds(null);
    setMaxPrice(null);
    setSort("newest");
  };

  const toggleType = (type: string) =>
    setTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));

  return (
    <>
      {/* Section tabs */}
      <div className="flex flex-wrap items-center gap-8">
        {SECTIONS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setSection(item.value)}
            className={`press text-[11px] font-bold uppercase tracking-[0.22em] transition-colors duration-200 ${
              section === item.value
                ? "border-b border-[#4f9d8f] pb-1.5 text-[#efebe3]"
                : "text-white/50 hover:text-[#efebe3]"
            }`}
          >
            {t(item.key)}
            <span className="ml-2 tabular-nums text-white/35">{counts[item.value]}</span>
          </button>
        ))}
      </div>

      {/* Filter panel */}
      <div className="mt-10 border border-white/10 bg-[#171232] p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <label
              htmlFor="listing-search"
              className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-white/45"
            >
              {t("search")}
            </label>
            <div className="flex items-center gap-3 border border-white/15 px-4 transition-colors duration-200 focus-within:border-[#4f9d8f]">
              <PiMagnifyingGlass size={16} className="shrink-0 text-white/40" aria-hidden="true" />
              <input
                id="listing-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Building, area, developer"
                className="w-full bg-transparent py-3 text-sm text-[#efebe3] outline-none placeholder:text-white/30"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="press shrink-0 text-white/40 hover:text-[#efebe3]"
                >
                  <PiX size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            <label
              htmlFor="listing-beds"
              className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-white/45"
            >
              {t("bedrooms_minimum")}
            </label>
            <select
              id="listing-beds"
              value={minBeds ?? ""}
              onChange={(e) => setMinBeds(e.target.value ? Number(e.target.value) : null)}
              className="w-full border border-white/15 bg-transparent px-4 py-3 text-sm text-[#efebe3] outline-none focus:border-[#4f9d8f]"
            >
              <option value="" className="bg-[#171232]">
                {t("any")}
              </option>
              {BEDROOM_OPTIONS.map((n) => (
                <option key={n} value={n} className="bg-[#171232]">
                  {n}+
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <label
              htmlFor="listing-sort"
              className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-white/45"
            >
              {t("sort")}
            </label>
            <select
              id="listing-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="w-full border border-white/15 bg-transparent px-4 py-3 text-sm text-[#efebe3] outline-none focus:border-[#4f9d8f]"
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value} className="bg-[#171232]">
                  {t(option.key)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {availableTypes.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">
              {t("property_type")}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {availableTypes.map((type) => {
                const active = types.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    aria-pressed={active}
                    className={`press border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-200 ${
                      active
                        ? "border-[#4f9d8f] bg-[#2e7d6f]/15 text-[#4f9d8f]"
                        : "border-white/15 text-white/55 hover:border-white/35 hover:text-[#efebe3]"
                    }`}
                  >
                    {PROPERTY_TYPE_LABELS[type] ?? type}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {priceCeiling > 0 && (
          <div className="mt-8">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
              <label
                htmlFor="listing-price"
                className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45"
              >
                {t("maximum_price")}
              </label>
              <span className="text-sm text-white/70 tabular-nums">
                {maxPrice ? formatPrice(maxPrice, "KES") : t("no_limit")}
              </span>
            </div>
            <input
              id="listing-price"
              type="range"
              min={0}
              max={priceCeiling}
              step={priceCeiling / 40}
              value={maxPrice ?? priceCeiling}
              onChange={(e) => {
                const value = Number(e.target.value);
                setMaxPrice(value >= priceCeiling ? null : value);
              }}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#4f9d8f]"
            />
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <p className="text-sm text-white/50 tabular-nums">
            {filtered.length} {filtered.length === 1 ? t("property") : t("properties")}
            {activeFilters > 0 && ` · ${activeFilters} ${t("filters_on")}`}
          </p>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="press text-[10px] font-bold uppercase tracking-[0.25em] text-[#4f9d8f]"
            >
              {t("clear_all")}
            </button>
          )}
        </div>
      </div>

      <ListingGrid
        className="mt-16"
        listings={filtered}
        emptyTitle={t("nothing_found")}
        emptyBody="Widen the search, or tell us what you are looking for and we will send the next listing that fits, usually before it reaches the site."
      />
    </>
  );
}
