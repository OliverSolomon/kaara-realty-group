import { NextResponse } from "next/server";

/**
 * Live FX rates relative to one US dollar.
 *
 * Google quotes mid-market rates, so we read from mid-market sources rather
 * than a bank's retail spread. Two are tried in order, because a free feed
 * going quiet should not leave the site quoting stale figures:
 *
 *   1. @fawazahmed0/currency-api on jsDelivr — mid-market, refreshed daily,
 *      no key, and it carries KES and AED.
 *   2. open.er-api.com — same idea, different operator.
 *
 * If both fail we answer with the shipped figures and set `fallback`, which is
 * what makes the converter say the rates are indicative rather than live.
 */
const CODES = ["USD", "KES", "GBP", "EUR", "AED"] as const;
type Code = (typeof CODES)[number];

const FALLBACK: Record<Code, number> = {
  USD: 1,
  KES: 129.4,
  GBP: 0.79,
  EUR: 0.92,
  AED: 3.67,
};

// An hour keeps the site within a rounding error of what Google shows, without
// hammering a free endpoint on every request.
export const revalidate = 3600;

type Source = { rates: Record<Code, number>; updated: string | null; source: string };

/** Rates are only trustworthy if every code came back as a sane number. */
function validate(
  raw: Record<string, unknown>,
  updated: string | null,
  source: string
): Source | null {
  const rates = {} as Record<Code, number>;
  for (const code of CODES) {
    if (code === "USD") {
      rates.USD = 1;
      continue;
    }
    const value = raw[code.toLowerCase()] ?? raw[code];
    if (typeof value !== "number" || !isFinite(value) || value <= 0) return null;
    rates[code] = value;
  }
  return { rates, updated, source };
}

async function fromCurrencyApi(): Promise<Source | null> {
  try {
    const res = await fetch(
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
      { next: { revalidate } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return validate(data?.usd || {}, data?.date ?? null, "currency-api");
  } catch {
    return null;
  }
}

async function fromErApi(): Promise<Source | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return validate(data?.rates || {}, data?.time_last_update_utc ?? null, "er-api");
  } catch {
    return null;
  }
}

export async function GET() {
  const live = (await fromCurrencyApi()) ?? (await fromErApi());

  if (live) {
    return NextResponse.json({ ...live, fallback: false });
  }

  console.error("[rates] every source failed, serving shipped figures");
  return NextResponse.json({
    rates: FALLBACK,
    updated: null,
    source: "fallback",
    fallback: true,
  });
}
