import type { Goal } from "../types";
import { daysUntil } from "./countdowns";

export type GoalStatus = "done" | "ahead" | "behind";

/** Marge d'una setmana: anar just al ritme (o pocs dies per sota) encara és «Vas bé». */
const GRACE = 7 / 365;

/** Fracció de l'any `year` transcorreguda a `today` (el dia en curs compta sencer). */
export function yearFraction(year: number, today: string): number {
  const y = Number(today.slice(0, 4));
  if (y < year) return 0;
  if (y > year) return 1;
  const days = daysUntil(`${year + 1}-01-01`, `${year}-01-01`);
  return (daysUntil(today, `${year}-01-01`) + 1) / days;
}

/** Progrés d'un objectiu i com va respecte del ritme esperat segons la data. */
export function goalProgress(g: Pick<Goal, "year" | "target_value" | "current_value">, today: string): { ratio: number; expected: number; status: GoalStatus } {
  const ratio = g.target_value > 0 ? Math.max(0, Math.min(1, g.current_value / g.target_value)) : 0;
  const expected = yearFraction(g.year, today);
  const status: GoalStatus = ratio >= 1 ? "done" : ratio >= expected - GRACE ? "ahead" : "behind";
  return { ratio, expected, status };
}

export function goalStatusLabel(status: GoalStatus): string {
  return status === "done" ? "Fet!" : status === "ahead" ? "Vas bé" : "Per sota del ritme";
}
