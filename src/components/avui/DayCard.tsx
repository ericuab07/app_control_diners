"use client";

import { useMemo } from "react";
import { dayProgress } from "@/lib/calc/dayProgress";
import { doneDates, isDueOn } from "@/lib/calc/habits";
import { healthItems } from "@/lib/calc/health";
import { useLife } from "../LifeProvider";
import { Card } from "../ui";
import { ProgressRing } from "./ProgressRing";
import { useNow } from "./useNow";

/** «El teu dia»: tasques d'avui + hàbits que toquen avui + les 4 metes de salut. */
export function DayCard() {
  const { tasks, habits, habit_logs, health_logs, settings } = useLife();
  const { today } = useNow();
  const progress = useMemo(() => {
    const habitItems = habits
      .filter((h) => !h.archived)
      .map((h) => ({ habit: h, done: doneDates(habit_logs, h.id) }))
      .filter(({ habit, done }) => isDueOn(habit, done, today))
      .map(({ done }) => ({ done: done.has(today) }));
    return dayProgress([
      ...tasks.filter((t) => t.date === today),
      ...habitItems,
      ...healthItems(health_logs.find((l) => l.date === today), settings),
    ]);
  }, [tasks, habits, habit_logs, health_logs, settings, today]);
  return (
    <Card className="flex h-full items-center gap-5">
      <ProgressRing ratio={progress.ratio} caption={progress.label} size={112} />
      <div className="min-w-0">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">El teu dia</h2>
        <p className="mt-1 font-serif text-2xl font-semibold leading-tight lg:text-xl">{progress.label}</p>
        <p className="num mt-1 text-sm text-muted">{progress.done} de {progress.total} coses fetes</p>
      </div>
    </Card>
  );
}
