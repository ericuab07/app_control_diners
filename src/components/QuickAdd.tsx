"use client";

import { BookOpen, CalendarPlus, Clock, Flame, ListChecks } from "lucide-react";
import { useState } from "react";
import { EventForm } from "./avui/EventForm";
import { TaskForm } from "./avui/TaskForm";
import { HabitForm } from "./habits/HabitForm";
import { StudyItemForm } from "./study/StudyItemForm";
import { StudyLogForm } from "./study/StudyLogForm";
import { Modal } from "./ui";

type Choice = "task" | "event" | "habit" | "study" | "studyLog";

const OPTIONS: { id: Choice; label: string; hint: string; icon: typeof ListChecks }[] = [
  { id: "task", label: "Nova prioritat d'avui", hint: "Una de les 3 coses que vols fer avui", icon: ListChecks },
  { id: "event", label: "Nou esdeveniment", hint: "Classe, feina o pla a l'agenda", icon: CalendarPlus },
  { id: "habit", label: "Nou hàbit", hint: "Una cosa petita per repetir cada setmana", icon: Flame },
  { id: "study", label: "Entrega o examen", hint: "Una data important d'una assignatura", icon: BookOpen },
  { id: "studyLog", label: "Temps d'estudi", hint: "Apunta els minuts que has estudiat", icon: Clock },
];

/** Botó «+» fora de Diners: tria què vols afegir. */
export function QuickAdd({ onClose }: { onClose: () => void }) {
  const [choice, setChoice] = useState<Choice | null>(null);
  if (choice === "task") return <TaskForm onClose={onClose} />;
  if (choice === "event") return <EventForm onClose={onClose} />;
  if (choice === "habit") return <HabitForm onClose={onClose} />;
  if (choice === "study") return <StudyItemForm onClose={onClose} />;
  if (choice === "studyLog") return <StudyLogForm onClose={onClose} />;
  return (
    <Modal title="Afegir" onClose={onClose}>
      <ul className="space-y-2">
        {OPTIONS.map(({ id, label, hint, icon: Icon }) => (
          <li key={id}>
            <button onClick={() => setChoice(id)} className="flex w-full items-center gap-3 rounded-xl border border-border px-3 py-3 text-left hover:bg-surface-2">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Icon size={20} /></span>
              <span>
                <span className="block font-medium">{label}</span>
                <span className="block text-sm text-muted">{hint}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
