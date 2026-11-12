"use client";

import { Minus, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { useNow } from "@/components/avui/useNow";
import { GoalBar } from "@/components/goals/GoalBar";
import { GoalForm } from "@/components/goals/GoalForm";
import { useLife } from "@/components/LifeProvider";
import { Button, Card, cx, EmptyState, ErrorNote, PageHeader, useAction } from "@/components/ui";
import type { Goal } from "@/lib/types";

export default function ObjectiusPage() {
  const { goals, update } = useLife();
  const { today } = useNow();
  const thisYear = Number(today.slice(0, 4));
  const [year, setYear] = useState(thisYear);
  const [editing, setEditing] = useState<Goal | "new" | null>(null);
  const { busy, error, run } = useAction();
  const years = [...new Set([thisYear, ...goals.map((g) => g.year)])].sort((a, b) => b - a);
  const list = goals.filter((g) => g.year === year);

  const bump = (g: Goal, delta: number) => void run(() => update("goals", g.id, { current_value: Math.max(0, g.current_value + delta) }));

  return (
    <>
      <PageHeader title="Objectius" subtitle="La marca de cada barra és on hauries de ser avui per arribar-hi." action={<Button onClick={() => setEditing("new")}><Plus size={18} /> Nou objectiu</Button>} />
      {years.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-1" role="tablist" aria-label="Any">
          {years.map((y) => (
            <button key={y} role="tab" aria-selected={y === year} onClick={() => setYear(y)}
              className={cx("num min-h-9 rounded-full px-3 text-sm font-medium", y === year ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted hover:text-text")}>
              {y}
            </button>
          ))}
        </div>
      )}
      <ErrorNote message={error} />
      {list.length === 0 ? (
        <EmptyState title={`Cap objectiu per al ${year}`} hint="Pensa en coses que es puguin comptar: llibres llegits, km correguts, euros estalviats, assignatures aprovades…"
          action={<Button onClick={() => setEditing("new")}><Plus size={18} /> Afegir un objectiu</Button>} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((g) => (
            <Card key={g.id}>
              <div className="mb-3 flex items-start gap-2">
                <h2 className="min-w-0 flex-1 break-words font-serif text-lg font-semibold">{g.title}</h2>
                <button onClick={() => bump(g, -1)} disabled={busy || g.current_value <= 0} aria-label={`Restar 1 a «${g.title}»`} className="grid size-9 place-items-center rounded-lg border border-border hover:bg-surface-2 disabled:opacity-40"><Minus size={16} /></button>
                <button onClick={() => bump(g, 1)} disabled={busy} aria-label={`Sumar 1 a «${g.title}»`} className="grid size-9 place-items-center rounded-lg border border-border hover:bg-surface-2"><Plus size={16} /></button>
                <button onClick={() => setEditing(g)} aria-label={`Editar «${g.title}»`} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-text"><Pencil size={16} /></button>
              </div>
              <GoalBar goal={g} today={today} />
            </Card>
          ))}
        </div>
      )}
      {editing && <GoalForm existing={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  );
}
