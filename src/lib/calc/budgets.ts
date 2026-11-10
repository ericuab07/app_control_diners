import type { Budget, Transaction } from "../types";
import { daysInMonth, monthRange } from "../dates";

export type BudgetLevel = "ok" | "warn" | "over";

export interface BudgetStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  ratio: number;
  level: BudgetLevel;
  /** Despesa prevista a final de mes al ritme actual (només per al mes en curs). */
  projected: number | null;
}

export const WARN_THRESHOLD = 0.8;

export function levelFor(ratio: number): BudgetLevel {
  if (ratio >= 1) return "over";
  if (ratio >= WARN_THRESHOLD) return "warn";
  return "ok";
}

/**
 * Estat de cada pressupost per a un mes ("YYYY-MM"). El pressupost global
 * (category_id null) compta totes les despeses; els altres, només la seva categoria.
 * `today` permet projectar la despesa del mes en curs.
 */
export function budgetStatuses(
  budgets: Budget[],
  transactions: Transaction[],
  month: string,
  today?: string,
): BudgetStatus[] {
  const { from, to } = monthRange(month);
  let total = 0;
  const perCategory = new Map<string, number>();
  for (const t of transactions) {
    if (t.kind !== "expense" || t.date < from || t.date > to) continue;
    total += t.amount_cents;
    if (t.category_id) perCategory.set(t.category_id, (perCategory.get(t.category_id) ?? 0) + t.amount_cents);
  }
  const isCurrent = today !== undefined && today >= from && today <= to;
  const dayOfMonth = isCurrent ? Number(today!.slice(8, 10)) : 0;

  return budgets.map((budget) => {
    const spent = budget.category_id ? (perCategory.get(budget.category_id) ?? 0) : total;
    const ratio = spent / budget.amount_cents;
    return {
      budget,
      spent,
      remaining: budget.amount_cents - spent,
      ratio,
      level: levelFor(ratio),
      projected: isCurrent ? Math.round((spent / dayOfMonth) * daysInMonth(month)) : null,
    };
  });
}
