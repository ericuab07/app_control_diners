import { toMinutes } from "../time";
import type { Task } from "../types";

/** Hora a partir de la qual «Avui» proposa tancar el dia. */
export const EVENING_FROM = "20:00";

export function isEvening(now: string): boolean {
  return toMinutes(now) >= toMinutes(EVENING_FROM);
}

/** Tasques no fetes d'un dia, en l'ordre de les prioritats (les sense rang al final). */
export function leftovers(tasks: Task[], date: string): Task[] {
  return tasks
    .filter((t) => t.date === date && !t.done)
    .sort((a, b) => (a.top_rank ?? 9) - (b.top_rank ?? 9));
}

/**
 * Pla per passar les pendents de `from` a `to`: cada tasca rep el primer rang lliure de `to`
 * en ordre; si ja n'hi ha 3, rang null (es desa a la safata d'apunts).
 * `onlyIds` limita el pla a aquestes tasques.
 */
export function carryOverPlan(tasks: Task[], from: string, to: string, onlyIds?: string[]): { task: Task; rank: 1 | 2 | 3 | null }[] {
  const used = new Set(tasks.filter((t) => t.date === to).map((t) => t.top_rank));
  const free = ([1, 2, 3] as const).filter((r) => !used.has(r));
  return leftovers(tasks, from)
    .filter((t) => !onlyIds || onlyIds.includes(t.id))
    .map((task) => ({ task, rank: free.shift() ?? null }));
}
