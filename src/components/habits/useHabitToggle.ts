"use client";

import type { Habit } from "@/lib/types";
import { useLife } from "../LifeProvider";
import { useAction } from "../ui";

/** Marca o desmarca un hàbit un dia concret (crea o esborra el registre). */
export function useHabitToggle() {
  const { habit_logs, insert, remove } = useLife();
  const action = useAction();
  const toggle = (habit: Habit, date: string) =>
    void action.run(async () => {
      const log = habit_logs.find((l) => l.habit_id === habit.id && l.date === date);
      if (log) await remove("habit_logs", log.id);
      else await insert("habit_logs", { habit_id: habit.id, date });
    });
  return { ...action, toggle };
}
