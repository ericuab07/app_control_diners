"use client";

import { Check, Pencil } from "lucide-react";
import { useMemo } from "react";
import { doneDates, streaks, weeklyCompliance } from "@/lib/calc/habits";
import { addDaysISO, fromISO } from "@/lib/dates";
import type { Habit } from "@/lib/types";
import { useLife } from "../LifeProvider";
import { Card, cx, ErrorNote } from "../ui";
import { useHabitToggle } from "./useHabitToggle";

const dayLetter = new Intl.DateTimeFormat("ca-ES", { weekday: "narrow" });
const dayLong = new Intl.DateTimeFormat("ca-ES", { weekday: "long", day: "numeric", month: "long" });

/** Un hàbit: ratxes, compliment de la setmana i els últims 7 dies per marcar. */
export function HabitRow({ habit, today, onEdit }: { habit: Habit; today: string; onEdit: () => void }) {
  const { habit_logs } = useLife();
  const { busy, error, toggle } = useHabitToggle();
  const done = useMemo(() => doneDates(habit_logs, habit.id), [habit_logs, habit.id]);
  const s = streaks(habit, done, today);
  const week = weeklyCompliance(habit, done, today);
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(today, i - 6));

  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden>{habit.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="break-words font-semibold">{habit.name}</p>
          <p className="text-sm text-muted">
            {habit.target_per_week >= 7 ? "Cada dia" : `${habit.target_per_week} cops per setmana · ${week.done} de ${week.target} aquesta setmana`}
          </p>
        </div>
        <div className="text-right">
          <p className="num font-serif text-lg font-semibold">🔥 {s.current} <span className="text-sm font-normal text-muted">{s.unit}</span></p>
          <p className="num text-xs text-muted">Millor: {s.best}</p>
        </div>
        <button onClick={onEdit} aria-label={`Editar «${habit.name}»`} className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-text">
          <Pencil size={16} />
        </button>
      </div>
      <ol className="mt-3 grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const on = done.has(d);
          const label = dayLong.format(fromISO(d));
          return (
            <li key={d} className="flex flex-col items-center gap-1">
              <span className={cx("text-xs", d === today ? "font-semibold text-primary" : "text-muted")}>{dayLetter.format(fromISO(d)).toUpperCase()}</span>
              <button onClick={() => toggle(habit, d)} disabled={busy} role="checkbox" aria-checked={on} aria-label={`${habit.name}, ${label}`}
                className={cx("grid size-9 place-items-center rounded-full border-2", on ? "border-done bg-done text-surface" : "border-border hover:border-primary")}>
                {on && <Check size={16} strokeWidth={3} />}
              </button>
            </li>
          );
        })}
      </ol>
      <ErrorNote message={error} />
    </Card>
  );
}
