import type { NextRequest } from "next/server";

const SYMBOL_RE = /^[A-Z0-9.\-=^]{1,15}$/;
const MAX_SYMBOLS = 30;

interface YahooMeta {
  regularMarketPrice?: number;
  currency?: string;
  longName?: string;
  shortName?: string;
}

async function fetchMeta(symbol: string): Promise<YahooMeta | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`,
      { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store", signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const meta: YahooMeta | undefined = json?.chart?.result?.[0]?.meta;
    return meta && typeof meta.regularMarketPrice === "number" ? meta : null;
  } catch {
    return null;
  }
}

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const auth = request.headers.get("authorization");
  if (!auth) return false;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: auth, apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * GET /api/quotes?symbols=AAPL,SAN.MC
 * Cotitzacions de Yahoo Finance (API no oficial) amb el canvi a EUR de cada moneda.
 * Només per a usuaris amb sessió: evita que la ruta sigui un proxy obert.
 */
export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return Response.json({ error: "No autoritzat" }, { status: 401 });
  }
  const symbols = [
    ...new Set(
      (request.nextUrl.searchParams.get("symbols") ?? "")
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter((s) => SYMBOL_RE.test(s)),
    ),
  ].slice(0, MAX_SYMBOLS);

  const metas = await Promise.all(symbols.map(fetchMeta));

  // Yahoo cotitza la borsa de Londres en penics ("GBp"): es normalitza a lliures.
  const normalized = symbols.map((symbol, i) => {
    const meta = metas[i];
    if (!meta) return null;
    const pence = meta.currency === "GBp" || meta.currency === "GBX";
    return {
      symbol,
      name: meta.longName ?? meta.shortName ?? symbol,
      price: pence ? meta.regularMarketPrice! / 100 : meta.regularMarketPrice!,
      currency: pence ? "GBP" : (meta.currency ?? "EUR").toUpperCase(),
    };
  });

  const currencies = [...new Set(normalized.flatMap((q) => (q && q.currency !== "EUR" ? [q.currency] : [])))];
  const rates = new Map<string, number>([["EUR", 1]]);
  await Promise.all(
    currencies.map(async (c) => {
      const meta = await fetchMeta(`${c}EUR=X`);
      if (meta) rates.set(c, meta.regularMarketPrice!);
    }),
  );

  const quotes: { symbol: string; name: string; price: number; currency: string; fx_rate: number }[] = [];
  const failed: string[] = [];
  symbols.forEach((symbol, i) => {
    const q = normalized[i];
    const fx = q ? rates.get(q.currency) : undefined;
    if (q && fx) quotes.push({ ...q, fx_rate: fx });
    else failed.push(symbol);
  });
  return Response.json({ quotes, failed });
}
