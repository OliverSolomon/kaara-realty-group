"use client";

import React, { createContext, useContext, useCallback, useSyncExternalStore } from "react";

export type Currency = "KES" | "USD" | "GBP" | "EUR" | "AED";

export const CURRENCIES: { code: Currency; label: string; symbol: string }[] = [
  { code: "KES", label: "Kenyan Shilling", symbol: "KSh" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "AED", label: "UAE Dirham", symbol: "AED" },
];

/**
 * Indicative rates against one US dollar. These are reference figures for
 * orientation, not a live feed, and the interface says so wherever a converted
 * price appears. Swap this map for an API response once a rates provider is
 * contracted.
 */
const RATES_PER_USD: Record<Currency, number> = {
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
  setCurrency: (currency: Currency) => void;
  /** Converts a value from its stored currency into the active currency. */
  convert: (amount: number, baseCurrency?: string) => number;
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

  const setCurrency = useCallback((next: Currency) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    listeners.forEach((listener) => listener());
  }, []);

  const convert = useCallback(
    (amount: number, baseCurrency: string = "USD") => {
      const base = normaliseCurrency(baseCurrency);
      const inUsd = amount / RATES_PER_USD[base];
      return inUsd * RATES_PER_USD[currency];
    },
    [currency]
  );

  const format = useCallback((value: number, target: Currency) => {
    const rounded = new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(value));
    return `${SYMBOLS[target]} ${rounded}`;
  }, []);

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
        setCurrency,
        convert,
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
