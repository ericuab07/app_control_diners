"use client";

import { useMemo } from "react";
import { dayProgress } from "@/lib/calc/dayProgress";
import { useLife } from "../LifeProvider";
import { Card } from "../ui";
import { ProgressRing } from "./ProgressRing";
import { useNow } from "./useNow";

/** «El teu dia»: cercle de progrés amb les tasques d'avui (les fases següents hi sumaran hàbits i salut). */
export function DayCard() {
  const { tasks } = useLife();
  const { today } = useNow();
  const progress = useMemo(() => dayProgress(tasks.filter((t) => t.date === today)), [tasks, today]);
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
