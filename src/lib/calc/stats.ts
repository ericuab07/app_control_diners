import type { Category, Transaction } from "../types";
import { monthKey } from "../dates";

export interface Totals {
  income: number;
  expense: number;
  net: number;
  /** (ingressos − despeses) / ingressos; NaN si no hi ha ingressos */
  savingsRate: number;
}

export function inRange(t: Transaction, from: string, to: string): boolean {
  return t.date >= from && t.date <= to;
}

/** Les transferències entre comptes no són ni ingrés ni despesa. */
export function totals(transactions: Transaction[], from: string, to: string): Totals {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (!inRange(t, from, to)) continue;
    if (t.kind === "income") income += t.amount_cents;
    else if (t.kind === "expense") expense += t.amount_cents;
  }
  return { income, expense, net: income - expense, savingsRate: income > 0 ? (income - expense) / income : NaN };
}

export interface CategorySlice {
  categoryId: string | null;
  name: string;
  color: string;
  icon: string;
  total: number;
  share: number;
  count: number;
}

export const UNCATEGORIZED = { name: "Sense categoria", color: "#94a3b8", icon: "❔" };

export function byCategory(
  transactions: Transaction[],
  categories: Category[],
  kind: "income" | "expense",
  from: string,
  to: string,
): CategorySlice[] {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const acc = new Map<string | null, { total: number; count: number }>();
  let grand = 0;
  for (const t of transactions) {
    if (t.kind !== kind || !inRange(t, from, to)) continue;
    const key = t.category_id && catMap.has(t.category_id) ? t.category_id : null;
    const cur = acc.get(key) ?? { total: 0, count: 0 };
    cur.total += t.amount_cents;
    cur.count += 1;
    acc.set(key, cur);
    grand += t.amount_cents;
  }
  return [...acc.entries()]
    .map(([categoryId, v]) => {
      const c = categoryId ? catMap.get(categoryId)! : UNCATEGORIZED;
      return {
        categoryId,
        name: c.name,
        color: c.color,
        icon: c.icon,
        total: v.total,
        count: v.count,
        share: grand > 0 ? v.total / grand : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export interface MonthTotals extends Totals {
  month: string;
}

export function monthlyTotals(transactions: Transaction[], months: string[]): MonthTotals[] {
  const map = new Map<string, { income: number; expense: number }>(
    months.map((m) => [m, { income: 0, expense: 0 }]),
  );
  for (const t of transactions) {
    const slot = map.get(monthKey(t.date));
    if (!slot) continue;
    if (t.kind === "income") slot.income += t.amount_cents;
    else if (t.kind === "expense") slot.expense += t.amount_cents;
  }
  return months.map((month) => {
    const { income, expense } = map.get(month)!;
    return {
      month,
      income,
      expense,
      net: income - expense,
      savingsRate: income > 0 ? (income - expense) / income : NaN,
    };
  });
}

/** Variació relativa respecte d'un valor anterior; NaN si l'anterior és 0. */
export function change(current: number, previous: number): number {
  return previous === 0 ? NaN : (current - previous) / previous;
}
