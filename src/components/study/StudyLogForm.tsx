"use client";

import { useState } from "react";
import { todayISO } from "@/lib/dates";
import { useLife } from "../LifeProvider";
import { Button, ErrorNote, Field, inputClass, Modal, useAction } from "../ui";

const PRESETS = [25, 50, 90];

/** Apunta temps d'estudi d'una assignatura. */
export function StudyLogForm({ defaultCourseId, onClose }: { defaultCourseId?: string; onClose: () => void }) {
  const { courses, insert } = useLife();
  const active = courses.filter((c) => !c.archived);
  const [courseId, setCourseId] = useState(defaultCourseId ?? active[0]?.id ?? "");
  const [date, setDate] = useState(todayISO);
  const [minutes, setMinutes] = useState("50");
  const { busy, error, setError, run } = useAction();

  if (active.length === 0) {
    return (
      <Modal title="Temps d'estudi" onClose={onClose}>
        <p className="text-sm text-muted">Primer crea una assignatura a la pàgina d&apos;Estudis.</p>
      </Modal>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const m = Number(minutes);
    if (!Number.isInteger(m) || m < 1 || m > 1440) return setError("Els minuts han de ser un enter entre 1 i 1440.");
    void run(async () => {
      await insert("study_logs", { course_id: courseId, date, minutes: m });
      onClose();
    });
  };

  return (
    <Modal title="Temps d'estudi" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Assignatura">
          <select className={inputClass} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {active.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Minuts"><input className={`${inputClass} num`} inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} required /></Field>
          <Field label="Dia"><input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} required /></Field>
        </div>
        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <Button key={p} type="button" variant="secondary" onClick={() => setMinutes(String(p))} aria-pressed={minutes === String(p)}>{p} min</Button>
          ))}
        </div>
        <ErrorNote message={error} />
        <Button type="submit" disabled={busy} className="w-full">Apuntar</Button>
      </form>
    </Modal>
  );
}
