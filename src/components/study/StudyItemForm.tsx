"use client";

import { useState } from "react";
import { todayISO } from "@/lib/dates";
import type { StudyItem, StudyKind } from "@/lib/types";
import { useLife } from "../LifeProvider";
import { Button, ErrorNote, Field, inputClass, Modal, Segmented, useAction } from "../ui";

export const STUDY_KIND_LABELS: Record<StudyKind, string> = { entrega: "Entrega", examen: "Examen", estudi: "Estudi" };

export function StudyItemForm({ existing, defaultCourseId, onClose, initialTitle = "", onSaved }: { existing?: StudyItem; defaultCourseId?: string; onClose: () => void; initialTitle?: string; onSaved?: () => Promise<void> }) {
  const { courses, insert, update, remove } = useLife();
  const active = courses.filter((c) => !c.archived || c.id === existing?.course_id);
  const [courseId, setCourseId] = useState(existing?.course_id ?? defaultCourseId ?? active[0]?.id ?? "");
  const [title, setTitle] = useState(existing?.title ?? initialTitle);
  const [kind, setKind] = useState<StudyKind>(existing?.kind ?? "entrega");
  const [due, setDue] = useState(existing?.due_date ?? todayISO());
  const { busy, error, setError, run } = useAction();

  if (active.length === 0) {
    return (
      <Modal title="Nova entrega" onClose={onClose}>
        <p className="text-sm text-muted">Primer crea una assignatura a la pàgina d&apos;Estudis.</p>
      </Modal>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return setError("Tria una assignatura.");
    const row = { course_id: courseId, title: title.trim(), kind, due_date: due };
    void run(async () => {
      if (existing) await update("study_items", existing.id, row);
      else await insert("study_items", row);
      await onSaved?.();
      onClose();
    });
  };

  return (
    <Modal title={existing ? "Editar" : "Nova entrega o examen"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Assignatura">
          <select className={inputClass} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {active.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Segmented value={kind} onChange={setKind} options={(Object.keys(STUDY_KIND_LABELS) as StudyKind[]).map((k) => ({ value: k, label: STUDY_KIND_LABELS[k] }))} />
        <Field label="Què és?">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} autoFocus={!existing} placeholder="Ex.: Pràctica 2" />
        </Field>
        <Field label="Data"><input type="date" className={inputClass} value={due} onChange={(e) => setDue(e.target.value)} required /></Field>
        <ErrorNote message={error} />
        <div className="flex flex-wrap gap-2">
          {existing && (
            <Button type="button" variant="danger" disabled={busy}
              onClick={() => confirm(`Vols esborrar «${existing.title}»?`) && void run(async () => { await remove("study_items", existing.id); onClose(); })}>
              Esborrar
            </Button>
          )}
          <Button type="submit" disabled={busy} className="flex-1">{existing ? "Desar" : "Afegir"}</Button>
        </div>
      </form>
    </Modal>
  );
}
