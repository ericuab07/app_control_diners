"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { doneDates, isDueOn, streaks } from "@/lib/calc/habits";
import { useLife } from "../LifeProvider";
import { Card, cx, ErrorNote } from "../ui";
import { useHabitToggle } from "../habits/useHabitToggle";
import { useNow } from "./useNow";

/** Hàbits que toquen avui, amb casella i ratxa. */
export function HabitsCard() {
  const { habits, habit_logs } = useLife();
  const { today } = useNow();
  const { busy, error, toggle } = useHabitToggle();
  const due = useMemo(
    () =>
      habits
        .filter((h) => !h.archived)
        .map((h) => ({ habit: h, done: doneDates(habit_logs, h.id) }))
        .filter(({ habit, done }) => isDueOn(habit, done, today)),
    [habits, habit_logs, today],
  );

  return (
    <Card className="h-full">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-serif text-xl font-semibold">Hàbits d&apos;avui</h2>
        <Link href="/habits" className="text-sm text-primary hover:underline">Tots</Link>
      </div>
      {habits.filter((h) => !h.archived).length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-3 py-6 text-center">
          <p className="text-sm text-muted">Els hàbits petits fan els canvis grans.</p>
          <Link href="/habits" className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-fg">Crea el teu primer hàbit</Link>
        </div>
      ) : due.length === 0 ? (
        <p className="rounded-xl bg-done-bg px-3 py-4 text-sm text-done">Avui no et toca cap hàbit més. Bona feina aquesta setmana!</p>
      ) : (
        <ul className="space-y-2">
          {due.map(({ habit, done }) => {
            const on = done.has(today);
            const s = streaks(habit, done, today);
            return (
              <li key={habit.id}>
                <button onClick={() => toggle(habit, today)} disabled={busy} role="checkbox" aria-checked={on}
                  className={cx("flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left", on ? "bg-done-bg" : "bg-surface-2 hover:bg-border/50")}>
                  <span className={cx("grid size-6 shrink-0 place-items-center rounded-full border-2", on ? "border-done bg-done text-surface" : "border-muted")}>
                    {on && <Check size={14} strokeWidth={3} />}
                  </span>
                  <span aria-hidden>{habit.icon}</span>
                  <span className={cx("min-w-0 flex-1 break-words", on && "text-muted")}>{habit.name}</span>
                  {s.current > 0 && <span className="num whitespace-nowrap text-sm text-muted" aria-label={`Ratxa de ${s.current} ${s.unit}`}>🔥 {s.current}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <ErrorNote message={error} />
    </Card>
  );
}
