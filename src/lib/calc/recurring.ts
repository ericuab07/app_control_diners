import type { Frequency, RecurringRule } from "../types";
import { fromISO, toISO } from "../dates";

/**
 * Data de l'ocurrència número `n` (0 = la primera) d'una regla.
 * Es calcula sempre des de la data d'inici perquè un dia 31 no "derivi":
 * 31 gen → 28 feb → 31 mar (i no 28 mar).
 */
export function occurrence(startDate: string, frequency: Frequency, n: number): string {
  const start = fromISO(startDate);
  if (frequency === "weekly") {
    return toISO(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7 * n));
  }
  const months = frequency === "monthly" ? n : 12 * n;
  const target = new Date(start.getFullYear(), start.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(start.getDate(), lastDay));
  return toISO(target);
}

export interface DueResult {
  /** Dates dels moviments que cal crear, en ordre. */
  dates: string[];
  /** Nou valor de next_date de la regla. */
  nextDate: string;
}

const MAX_OCCURRENCES = 1000;

/** Ocurrències pendents d'una regla fins a `today` (inclòs). */
export function dueOccurrences(
  rule: Pick<RecurringRule, "start_date" | "end_date" | "next_date" | "frequency" | "active">,
  today: string,
): DueResult {
  const dates: string[] = [];
  if (!rule.active) return { dates, nextDate: rule.next_date };
  let n = 0;
  let date = occurrence(rule.start_date, rule.frequency, n);
  while (date < rule.next_date && n < MAX_OCCURRENCES) {
    date = occurrence(rule.start_date, rule.frequency, ++n);
  }
  while (date <= today && (!rule.end_date || date <= rule.end_date) && dates.length < MAX_OCCURRENCES) {
    dates.push(date);
    date = occurrence(rule.start_date, rule.frequency, ++n);
  }
  return { dates, nextDate: date };
}
