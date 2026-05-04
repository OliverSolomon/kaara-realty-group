"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Currency = "USD" | "KSH" | "EUR";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (amount: number | string, baseCurrency?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Exchange rates (mock rates, in production these would come from an API)
const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  KSH: 130, // 1 USD = 130 KSH
  EUR: 0.92, // 1 USD = 0.92 EUR
};

const SYMBOLS: Record<Currency, string> = {
  USD: "$",
  KSH: "KSh",
  EUR: "€",
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");

  useEffect(() => {
    const savedCurrency = localStorage.getItem("kaara_currency") as Currency;
    if (savedCurrency && ["USD", "KSH", "EUR"].includes(savedCurrency)) {
      setCurrencyState(savedCurrency);
    }
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("kaara_currency", newCurrency);
  };

  const formatPrice = (amount: number | string, baseCurrency: string = "USD") => {
    // Strip non-numeric characters if it's a string
    const numericAmount = typeof amount === "string" 
      ? parseFloat(amount.replace(/[^0-9.]/g, "")) 
      : amount;

    if (isNaN(numericAmount)) return "Price on Request";

    // Convert to USD first (if base is KSH) then to target currency
    // For now, we assume all prices in Sanity are USD or KSH. 
    // If base is KSH, convert to USD then to target.
    let amountInUSD = numericAmount;
    if (baseCurrency === "KSH") amountInUSD = numericAmount / EXCHANGE_RATES.KSH;
    if (baseCurrency === "EUR") amountInUSD = numericAmount / EXCHANGE_RATES.EUR;

    const convertedAmount = amountInUSD * EXCHANGE_RATES[currency];

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(convertedAmount).replace(currency, SYMBOLS[currency]);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
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
