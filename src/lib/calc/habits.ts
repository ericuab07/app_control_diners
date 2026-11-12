import { addDaysISO } from "../dates";
import type { Habit, HabitLog } from "../types";
import { mondayOf } from "./week";

type Target = Pick<Habit, "target_per_week">;

export function doneDates(logs: Pick<HabitLog, "habit_id" | "date">[], habitId: string): Set<string> {
  return new Set(logs.filter((l) => l.habit_id === habitId).map((l) => l.date));
}

/** Cops fets dins la setmana [from, to] (dates incloses). */
function countBetween(done: Set<string>, from: string, to: string): number {
  let n = 0;
  for (const d of done) if (d >= from && d <= to) n++;
  return n;
}

/** Compliment de la setmana actual (de dilluns a avui). */
export function weeklyCompliance(habit: Target, done: Set<string>, today: string): { done: number; target: number; ratio: number } {
  const n = countBetween(done, mondayOf(today), today);
  return { done: n, target: habit.target_per_week, ratio: Math.min(1, n / habit.target_per_week) };
}

/** Diari: cada dia. Setmanal: mentre la setmana no arriba a la meta, i també el dia que s'ha fet. */
export function isDueOn(habit: Target, done: Set<string>, date: string): boolean {
  if (habit.target_per_week >= 7 || done.has(date)) return true;
  return countBetween(done, mondayOf(date), addDaysISO(date, -1)) < habit.target_per_week;
}

/**
 * Ratxa actual i millor. Diari en dies; setmanal en setmanes complertes.
 * El període en curs (avui o aquesta setmana) no trenca la ratxa si encara no s'ha fet.
 */
export function streaks(habit: Target, done: Set<string>, today: string): { current: number; best: number; unit: "dies" | "setmanes" } {
  const weekly = habit.target_per_week < 7;
  const unit = weekly ? "setmanes" : "dies";
  if (done.size === 0) return { current: 0, best: 0, unit };
  const step = weekly ? 7 : 1;
  const start = weekly ? mondayOf(today) : today;
  const ok = (p: string) => (weekly ? countBetween(done, p, addDaysISO(p, 6)) >= habit.target_per_week : done.has(p));

  let current = 0;
  let p = ok(start) ? start : addDaysISO(start, -step);
  while (ok(p)) {
    current++;
    p = addDaysISO(p, -step);
  }

  const first = [...done].sort()[0];
  let best = 0;
  let run = 0;
  for (let q = weekly ? mondayOf(first) : first; q <= start; q = addDaysISO(q, step)) {
    run = ok(q) ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return { current, best: Math.max(best, current), unit };
}
