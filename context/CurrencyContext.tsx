"use client";

import { useLanguage } from "./LanguageContext";
import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

export type Currency = "KES" | "USD" | "GBP" | "EUR" | "AED";

export const CURRENCIES: { code: Currency; label: string; symbol: string }[] = [
  { code: "KES", label: "Kenyan Shilling", symbol: "KSh" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "AED", label: "UAE Dirham", symbol: "AED" },
];

/**
 * Fallback rates against one US dollar, used for the server render and for the
 * moment before the live feed answers. `/api/rates` refreshes these from
 * open.er-api.com every twelve hours, the same source Pavani uses.
 */
const FALLBACK_RATES_PER_USD: Record<Currency, number> = {
  USD: 1,
  KES: 129.4,
  GBP: 0.79,
  EUR: 0.92,
  AED: 3.67,
};

const SYMBOLS = CURRENCIES.reduce(
  (acc, c) => ({ ...acc, [c.code]: c.symbol }),
  {} as Record<Currency, string>
);

const STORAGE_KEY = "kaara_currency";

interface CurrencyContextType {
  currency: Currency;
  /** Live rates against one US dollar, or the shipped fallback figures. */
  rates: Record<Currency, number>;
  /** True while the figures are still the shipped fallback, not the live feed. */
  ratesAreIndicative: boolean;
  /** When the live feed was last published, if it answered. */
  ratesUpdated: string | null;
  setCurrency: (currency: Currency) => void;
  /** Converts a value from its stored currency into the active currency. */
  convert: (amount: number, baseCurrency?: string) => number;
  /** Converts a value from one named currency into another. */
  convertTo: (amount: number, baseCurrency: string, target: Currency) => number;
  /** Formats a value in the active currency, e.g. KSh 32,000,000. */
  formatPrice: (amount: number | string, baseCurrency?: string) => string;
  /** Formats a value in a currency you name, ignoring the active selection. */
  formatIn: (amount: number, target: Currency) => string;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

function toNumber(amount: number | string): number {
  if (typeof amount === "number") return amount;
  return parseFloat(String(amount).replace(/[^0-9.]/g, ""));
}

/** Older documents stored Kenyan shillings as KSh. Fold those into KES. */
export function normaliseCurrency(code?: string): Currency {
  const upper = (code || "USD").toUpperCase();
  if (upper === "KSH" || upper === "KSHS") return "KES";
  return (CURRENCIES.find((c) => c.code === upper)?.code ?? "USD") as Currency;
}

/**
 * The saved currency lives in localStorage, which is outside React. Reading it
 * through an external store keeps the server render and the first client render
 * identical, then swaps in the saved value without a cascading update.
 */
const DEFAULT_CURRENCY: Currency = "KES";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot(): Currency {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved && CURRENCIES.some((c) => c.code === saved)
    ? (saved as Currency)
    : DEFAULT_CURRENCY;
}

function getServerSnapshot(): Currency {
  return DEFAULT_CURRENCY;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const currency = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Grouping separators and digit shapes follow the language selection, so a
  // price reads naturally in whichever language the visitor picked.
  const { locale } = useLanguage();
  const [rates, setRates] = useState<Record<Currency, number>>(FALLBACK_RATES_PER_USD);
  const [ratesAreIndicative, setRatesAreIndicative] = useState(true);
  const [ratesUpdated, setRatesUpdated] = useState<string | null>(null);

  // One fetch per page load. If it fails we keep the shipped figures and the
  // interface goes on saying they are indicative.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/rates")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("rates unavailable"))))
      .then((data) => {
        if (cancelled || !data?.rates) return;
        setRates({ ...FALLBACK_RATES_PER_USD, ...data.rates });
        setRatesAreIndicative(Boolean(data.fallback));
        setRatesUpdated(data.updated ?? null);
      })
      .catch(() => {
        /* keep the fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrency = useCallback((next: Currency) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    listeners.forEach((listener) => listener());
  }, []);

  const convert = useCallback(
    (amount: number, baseCurrency: string = "USD") => {
      const base = normaliseCurrency(baseCurrency);
      const inUsd = amount / rates[base];
      return inUsd * rates[currency];
    },
    [currency, rates]
  );

  const convertTo = useCallback(
    (amount: number, baseCurrency: string, target: Currency) => {
      const base = normaliseCurrency(baseCurrency);
      return (amount / rates[base]) * rates[target];
    },
    [rates]
  );

  const format = useCallback(
    (value: number, target: Currency) => {
      const rounded = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Math.round(value));
      return `${SYMBOLS[target]} ${rounded}`;
    },
    [locale]
  );

  const formatPrice = useCallback(
    (amount: number | string, baseCurrency: string = "USD") => {
      const numeric = toNumber(amount);
      if (!isFinite(numeric) || isNaN(numeric)) return "Price on request";
      return format(convert(numeric, baseCurrency), currency);
    },
    [convert, currency, format]
  );

  const formatIn = useCallback(
    (amount: number, target: Currency) => format(amount, target),
    [format]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        rates,
        ratesAreIndicative,
        ratesUpdated,
        setCurrency,
        convert,
        convertTo,
        formatPrice,
        formatIn,
        symbol: SYMBOLS[currency],
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
