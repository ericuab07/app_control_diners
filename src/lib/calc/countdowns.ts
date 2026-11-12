import type { Countdown } from "../types";

const DAY_MS = 86_400_000;
const utc = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

/** Dies de `today` a `target` (amb UTC perquè l'horari d'estiu no desquadri). Negatiu si ja ha passat. */
export function daysUntil(target: string, today: string): number {
  return Math.round((utc(target) - utc(today)) / DAY_MS);
}

/** Fracció 0..1 del camí entre l'inici i la data final. */
export function countdownProgress(c: Pick<Countdown, "start_date" | "target_date">, today: string): number {
  const span = utc(c.target_date) - utc(c.start_date);
  if (span <= 0) return today >= c.target_date ? 1 : 0;
  return Math.max(0, Math.min(1, (utc(today) - utc(c.start_date)) / span));
}

export function countdownLabel(days: number): string {
  if (days === 0) return "Avui";
  if (days === 1) return "Demà";
  if (days === -1) return "Ahir";
  return days > 0 ? `Falten ${days} dies` : `Fa ${-days} dies`;
}
