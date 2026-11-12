import { formatDuration, toMinutes } from "../time";
import type { LifeEvent } from "../types";
import { weekdayOf } from "./week";

/** L'avís «En X min» només es mostra si falten com a molt 3 hores. */
const STARTS_IN_MAX = 180;

/** Esdeveniments d'un dia concret (puntuals i setmanals), ordenats per hora d'inici. */
export function eventsOn(events: LifeEvent[], date: string): LifeEvent[] {
  const wd = weekdayOf(date);
  return events
    .filter((e) =>
      e.date !== null ? e.date === date : e.weekday === wd && (e.repeat_until === null || date <= e.repeat_until),
    )
    .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time) || toMinutes(a.end_time) - toMinutes(b.end_time));
}

/** La fi ha de ser posterior a l'inici el mateix dia (no es pot travessar mitjanit). */
export function isValidTimeRange(start: string, end: string): boolean {
  return toMinutes(end) > toMinutes(start);
}

/** Inici inclòs, fi exclosa. */
export function eventStatus(ev: Pick<LifeEvent, "start_time" | "end_time">, now: string): "done" | "current" | "upcoming" {
  const n = toMinutes(now);
  if (n >= toMinutes(ev.end_time)) return "done";
  if (n >= toMinutes(ev.start_time)) return "current";
  return "upcoming";
}

export function minutesUntilStart(ev: Pick<LifeEvent, "start_time">, now: string): number {
  return toMinutes(ev.start_time) - toMinutes(now);
}

export function startsInLabel(minutes: number): string | null {
  if (minutes <= 0 || minutes > STARTS_IN_MAX) return null;
  return `En ${formatDuration(minutes)}`;
}
