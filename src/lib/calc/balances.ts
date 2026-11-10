import type { Account, Trade, Transaction } from "../types";

/** Import brut d'una operació en cèntims d'EUR (sense comissió). */
export function tradeGrossCents(t: Pick<Trade, "quantity" | "price" | "fx_rate">): number {
  return Math.round(t.quantity * t.price * t.fx_rate * 100);
}

/** Efecte d'una operació sobre l'efectiu del compte: negatiu en compres, positiu en vendes. */
export function tradeCashEffectCents(t: Trade): number {
  const gross = tradeGrossCents(t);
  return t.side === "buy" ? -(gross + t.fee_cents) : gross - t.fee_cents;
}

/**
 * Saldo de cada compte = saldo inicial + ingressos − despeses ± transferències
 * ± operacions de borsa liquidades contra el compte. `upTo` (inclòs) limita la data.
 */
export function accountBalances(
  accounts: Account[],
  transactions: Transaction[],
  trades: Trade[],
  upTo?: string,
): Map<string, number> {
  const balances = new Map<string, number>();
  for (const a of accounts) balances.set(a.id, a.initial_balance_cents);
  const add = (id: string | null, delta: number) => {
    if (id && balances.has(id)) balances.set(id, balances.get(id)! + delta);
  };
  for (const t of transactions) {
    if (upTo && t.date > upTo) continue;
    if (t.kind === "income") add(t.account_id, t.amount_cents);
    else if (t.kind === "expense") add(t.account_id, -t.amount_cents);
    else {
      add(t.account_id, -t.amount_cents);
      add(t.transfer_account_id, t.amount_cents);
    }
  }
  for (const t of trades) {
    if (upTo && t.date > upTo) continue;
    add(t.account_id, tradeCashEffectCents(t));
  }
  return balances;
}

export function totalBalance(balances: Map<string, number>): number {
  let total = 0;
  for (const v of balances.values()) total += v;
  return total;
}
