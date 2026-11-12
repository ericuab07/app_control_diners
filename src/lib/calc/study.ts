import { addDaysISO } from "../dates";
import type { StudyItem, StudyLog } from "../types";
import { daysUntil } from "./countdowns";
import { mondayOf } from "./week";

/** Entregues i exàmens no fets fins d'aquí a `days` dies, incloent-hi els vençuts. */
export function upcomingItems(items: StudyItem[], today: string, days = 14): StudyItem[] {
  const limit = addDaysISO(today, days);
  return items.filter((i) => !i.done && i.due_date <= limit).sort((a, b) => a.due_date.localeCompare(b.due_date));
}

export function dueLabel(due: string, today: string): string {
  const d = daysUntil(due, today);
  if (d === 0) return "Avui";
  if (d === 1) return "Demà";
  return d > 0 ? `En ${d} dies` : `Fa ${-d} ${d === -1 ? "dia" : "dies"}`;
}

/** Minuts d'estudi per assignatura des de dilluns fins avui. */
export function minutesThisWeek(logs: Pick<StudyLog, "course_id" | "date" | "minutes">[], today: string): Map<string, number> {
  const from = mondayOf(today);
  const out = new Map<string, number>();
  for (const l of logs) if (l.date >= from && l.date <= today) out.set(l.course_id, (out.get(l.course_id) ?? 0) + l.minutes);
  return out;
}
