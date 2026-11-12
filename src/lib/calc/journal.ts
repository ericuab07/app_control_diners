import { addDaysISO } from "../dates";
import type { JournalEntry, Mood } from "../types";
import { daysUntil } from "./countdowns";

export const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 1, emoji: "😞", label: "Molt malament" },
  { value: 2, emoji: "🙁", label: "Malament" },
  { value: 3, emoji: "😐", label: "Normal" },
  { value: 4, emoji: "🙂", label: "Bé" },
  { value: 5, emoji: "😄", label: "Molt bé" },
];

/** Ànim dels últims `days` dies (de més antic a avui); `null` on no hi ha entrada. */
export function moodSeries(entries: Pick<JournalEntry, "date" | "mood">[], today: string, days = 30): { date: string; mood: Mood | null }[] {
  const byDate = new Map(entries.map((e) => [e.date, e.mood]));
  return Array.from({ length: days }, (_, i) => {
    const date = addDaysISO(today, i - days + 1);
    return { date, mood: byDate.get(date) ?? null };
  });
}

/** Mitjana d'ànim entre dues dates (incloses), o null si no hi ha cap entrada. */
export function averageMood(entries: Pick<JournalEntry, "date" | "mood">[], from: string, to: string): number | null {
  const inRange = entries.filter((e) => e.date >= from && e.date <= to);
  if (inRange.length === 0) return null;
  return inRange.reduce((sum, e) => sum + e.mood, 0) / inRange.length;
}

/** Frase del dia: la mateixa tot el dia i a tots els dispositius. */
export function quoteOfDay(iso: string, quotes: string[]): string {
  const day = daysUntil(iso, "1970-01-01");
  return quotes[((day % quotes.length) + quotes.length) % quotes.length];
}
