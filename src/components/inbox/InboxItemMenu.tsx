"use client";

import { BookOpen, CalendarPlus, ListChecks, Sunrise, Trash2 } from "lucide-react";
import { useState } from "react";
import { addDaysISO, todayISO } from "@/lib/dates";
import type { InboxItem } from "@/lib/types";
import { EventForm } from "../avui/EventForm";
import { TaskForm } from "../avui/TaskForm";
import { useLife } from "../LifeProvider";
import { StudyItemForm } from "../study/StudyItemForm";
import { ErrorNote, Modal, useAction } from "../ui";

type Target = "today" | "tomorrow" | "event" | "study";

/** Classifica un apunt: el converteix en prioritat, esdeveniment o entrega (i l'esborra de la safata), o l'esborra. */
export function InboxItemMenu({ item, onClose }: { item: InboxItem; onClose: () => void }) {
  const { remove } = useLife();
  const [target, setTarget] = useState<Target | null>(null);
  const { busy, error, run } = useAction();
  const removeItem = () => remove("inbox_items", item.id);

  if (target === "today") return <TaskForm initialTitle={item.text} onSaved={removeItem} onClose={onClose} />;
  if (target === "tomorrow") return <TaskForm date={addDaysISO(todayISO(), 1)} initialTitle={item.text} onSaved={removeItem} onClose={onClose} />;
  if (target === "event") return <EventForm initialTitle={item.text} onSaved={removeItem} onClose={onClose} />;
  if (target === "study") return <StudyItemForm initialTitle={item.text} onSaved={removeItem} onClose={onClose} />;

  const options: { id: Target; label: string; icon: typeof ListChecks }[] = [
    { id: "today", label: "Prioritat d'avui", icon: ListChecks },
    { id: "tomorrow", label: "Prioritat de demà", icon: Sunrise },
    { id: "event", label: "Esdeveniment a l'agenda", icon: CalendarPlus },
    { id: "study", label: "Entrega o examen", icon: BookOpen },
  ];

  return (
    <Modal title="Què en fem?" onClose={onClose}>
      <p className="mb-4 break-words rounded-xl bg-surface-2 px-3 py-2 font-serif italic">«{item.text}»</p>
      <ul className="space-y-2">
        {options.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <button onClick={() => setTarget(id)} className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-border px-3 text-left hover:bg-surface-2">
              <Icon size={18} className="text-primary" aria-hidden /> {label}
            </button>
          </li>
        ))}
        <li>
          <button onClick={() => void run(async () => { await removeItem(); onClose(); })} disabled={busy}
            className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-expense/40 px-3 text-left text-expense hover:bg-expense/10">
            <Trash2 size={18} aria-hidden /> Ja està fet / esborrar
          </button>
        </li>
      </ul>
      <ErrorNote message={error} />
    </Modal>
  );
}
