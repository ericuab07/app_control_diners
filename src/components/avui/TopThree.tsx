"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { QUOTES } from "@/lib/defaults";
import type { Task } from "@/lib/types";
import { useLife } from "../LifeProvider";
import { Card, cx, ErrorNote, useAction } from "../ui";
import { TaskForm } from "./TaskForm";
import { useNow } from "./useNow";

export function TopThree() {
  const { tasks, update, remove } = useLife();
  const { today } = useNow();
  const [adding, setAdding] = useState(false);
  const { busy, error, run } = useAction();
  const top = useMemo(
    () => tasks.filter((t) => t.date === today && t.top_rank !== null).sort((a, b) => (a.top_rank ?? 0) - (b.top_rank ?? 0)),
    [tasks, today],
  );
  const byRank = new Map(top.map((t) => [t.top_rank, t]));

  const toggle = (t: Task) =>
    void run(() => update("tasks", t.id, { done: !t.done, done_at: t.done ? null : new Date().toISOString() }));
  const del = (t: Task) => confirm(`Vols esborrar «${t.title}»?`) && void run(() => remove("tasks", t.id));

  return (
    <Card className="h-full">
      <h2 className="mb-3 font-serif text-xl font-semibold">Les 3 d&apos;avui</h2>
      <ol className="space-y-2">
        {([1, 2, 3] as const).map((rank) => {
          const t = byRank.get(rank);
          if (!t) {
            return (
              <li key={rank}>
                <button onClick={() => setAdding(true)} className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-dashed border-border px-3 text-left text-sm text-muted hover:border-primary hover:text-primary">
                  <Plus size={18} aria-hidden /> Afegeix la prioritat {rank}
                </button>
              </li>
            );
          }
          return (
            <li key={rank} className={cx("group flex min-h-12 items-center gap-3 rounded-xl px-3 py-2", t.done ? "bg-done-bg" : "bg-surface-2")}>
              <button onClick={() => toggle(t)} disabled={busy} role="checkbox" aria-checked={t.done} aria-label={`Fet: ${t.title}`}
                className={cx("grid size-6 shrink-0 place-items-center rounded-full border-2", t.done ? "border-done bg-done text-surface" : "border-muted")}>
                {t.done && <Check size={14} strokeWidth={3} />}
              </button>
              <span className={cx("min-w-0 flex-1 break-words", t.done && "text-muted line-through")}>{t.title}</span>
              <button onClick={() => del(t)} disabled={busy} aria-label={`Esborrar «${t.title}»`} className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface hover:text-expense">
                <Trash2 size={16} />
              </button>
            </li>
          );
        })}
      </ol>
      <ErrorNote message={error} />
      <blockquote className="mt-4 border-l-2 border-primary pl-3 font-serif text-sm italic text-muted">{QUOTES[0]}</blockquote>
      {adding && <TaskForm onClose={() => setAdding(false)} />}
    </Card>
  );
}
