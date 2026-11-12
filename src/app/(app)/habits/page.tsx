"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { HabitForm } from "@/components/habits/HabitForm";
import { HabitRow } from "@/components/habits/HabitRow";
import { useNow } from "@/components/avui/useNow";
import { useLife } from "@/components/LifeProvider";
import { Button, EmptyState, PageHeader } from "@/components/ui";
import type { Habit } from "@/lib/types";

export default function HabitsPage() {
  const { habits } = useLife();
  const { today } = useNow();
  const [editing, setEditing] = useState<Habit | "new" | null>(null);
  const active = habits.filter((h) => !h.archived);
  const archived = habits.filter((h) => h.archived);

  return (
    <>
      <PageHeader title="Hàbits" subtitle="Petites coses, cada dia. Toca un dia per marcar-lo." action={<Button onClick={() => setEditing("new")}><Plus size={18} /> Nou hàbit</Button>} />
      {active.length === 0 ? (
        <EmptyState title="Encara no tens cap hàbit" hint="Prova amb alguna cosa petita: llegir 20 minuts, beure aigua en llevar-te, anar al gimnàs 3 cops per setmana…"
          action={<Button onClick={() => setEditing("new")}><Plus size={18} /> Crear el primer hàbit</Button>} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {active.map((h) => <HabitRow key={h.id} habit={h} today={today} onEdit={() => setEditing(h)} />)}
        </div>
      )}
      {archived.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-muted">Arxivats ({archived.length})</summary>
          <ul className="mt-2 divide-y divide-border rounded-2xl border border-border bg-surface">
            {archived.map((h) => (
              <li key={h.id}>
                <button onClick={() => setEditing(h)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2">
                  <span aria-hidden>{h.icon}</span> {h.name}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
      {editing && <HabitForm existing={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  );
}
