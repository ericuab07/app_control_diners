import type { Task } from "../types";

/** Primer rang (1–3) lliure per a «les 3» d'aquell dia, o null si ja n'hi ha tres. */
export function nextFreeRank(tasks: Pick<Task, "date" | "top_rank">[], date: string): 1 | 2 | 3 | null {
  const used = new Set(tasks.filter((t) => t.date === date).map((t) => t.top_rank));
  for (const r of [1, 2, 3] as const) if (!used.has(r)) return r;
  return null;
}
