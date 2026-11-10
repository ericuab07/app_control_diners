import type { PriceQuote, Trade } from "../types";
import { tradeGrossCents } from "./balances";

export interface Position {
  symbol: string;
  name: string;
  currency: string;
  quantity: number;
  /** Cost de les accions que encara es tenen (comissions de compra incloses), en cèntims d'EUR. */
  costBasisCents: number;
  /** Cost mitjà per acció en EUR. */
  avgCostEur: number;
  /** Guany/pèrdua ja realitzat amb vendes, en cèntims d'EUR. */
  realizedCents: number;
}

const EPSILON = 1e-9;

/** Posicions pel mètode del cost mitjà ponderat. Les operacions s'apliquen per ordre de data. */
export function computePositions(trades: Trade[]): Position[] {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date) || (a.side === "buy" ? -1 : 1));
  const map = new Map<string, Position>();
  for (const t of sorted) {
    const p = map.get(t.symbol) ?? {
      symbol: t.symbol,
      name: t.name,
      currency: t.currency,
      quantity: 0,
      costBasisCents: 0,
      avgCostEur: 0,
      realizedCents: 0,
    };
    if (t.name) p.name = t.name;
    const gross = tradeGrossCents(t);
    if (t.side === "buy") {
      p.quantity += t.quantity;
      p.costBasisCents += gross + t.fee_cents;
    } else {
      const sold = Math.min(t.quantity, p.quantity);
      const costOfSold = p.quantity > EPSILON ? Math.round(p.costBasisCents * (sold / p.quantity)) : 0;
      p.realizedCents += gross - t.fee_cents - costOfSold;
      p.quantity -= sold;
      p.costBasisCents -= costOfSold;
      if (p.quantity < EPSILON) {
        p.quantity = 0;
        p.costBasisCents = 0;
      }
    }
    p.avgCostEur = p.quantity > EPSILON ? p.costBasisCents / 100 / p.quantity : 0;
    map.set(t.symbol, p);
  }
  return [...map.values()];
}

export interface ValuedPosition extends Position {
  quote: PriceQuote | null;
  /** Valor de mercat en cèntims d'EUR; si no hi ha preu es fa servir el cost. */
  valueCents: number;
  unrealizedCents: number;
  unrealizedRatio: number;
  weight: number;
}

export interface PortfolioSummary {
  positions: ValuedPosition[];
  valueCents: number;
  costBasisCents: number;
  unrealizedCents: number;
  realizedCents: number;
}

export function valuePortfolio(positions: Position[], quotes: Map<string, PriceQuote>): PortfolioSummary {
  const open = positions.filter((p) => p.quantity > 0);
  const valued = open.map((p) => {
    const quote = quotes.get(p.symbol) ?? null;
    const valueCents = quote ? Math.round(p.quantity * quote.price * quote.fx_rate * 100) : p.costBasisCents;
    const unrealizedCents = valueCents - p.costBasisCents;
    return {
      ...p,
      quote,
      valueCents,
      unrealizedCents,
      unrealizedRatio: p.costBasisCents > 0 ? unrealizedCents / p.costBasisCents : NaN,
      weight: 0,
    };
  });
  const valueCents = valued.reduce((s, p) => s + p.valueCents, 0);
  for (const p of valued) p.weight = valueCents > 0 ? p.valueCents / valueCents : 0;
  valued.sort((a, b) => b.valueCents - a.valueCents);
  return {
    positions: valued,
    valueCents,
    costBasisCents: valued.reduce((s, p) => s + p.costBasisCents, 0),
    unrealizedCents: valued.reduce((s, p) => s + p.unrealizedCents, 0),
    realizedCents: positions.reduce((s, p) => s + p.realizedCents, 0),
  };
}
