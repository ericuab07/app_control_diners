"use client";

import { useState } from "react";
import { PALETTE } from "@/lib/defaults";
import type { Course } from "@/lib/types";
import { useLife } from "../LifeProvider";
import { Button, ColorPicker, ErrorNote, Field, inputClass, Modal, useAction } from "../ui";

export function CourseForm({ existing, onClose }: { existing?: Course; onClose: () => void }) {
  const { courses, insert, update, remove } = useLife();
  const [name, setName] = useState(existing?.name ?? "");
  const [semester, setSemester] = useState(existing?.semester ?? "");
  const [color, setColor] = useState(existing?.color ?? PALETTE[courses.length % PALETTE.length]);
  const { busy, error, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const row = { name: name.trim(), semester: semester.trim(), color };
    void run(async () => {
      if (existing) await update("courses", existing.id, row);
      else await insert("courses", row);
      onClose();
    });
  };

  return (
    <Modal title={existing ? "Editar assignatura" : "Nova assignatura"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Assignatura">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} autoFocus={!existing} placeholder="Ex.: Estructura de Dades" />
        </Field>
        <Field label="Semestre (opcional)">
          <input className={inputClass} value={semester} onChange={(e) => setSemester(e.target.value)} maxLength={40} placeholder="Ex.: 1r quad. 2026-27" />
        </Field>
        <Field label="Color"><ColorPicker value={color} onChange={setColor} /></Field>
        <ErrorNote message={error} />
        <div className="flex flex-wrap gap-2">
          {existing && (
            <Button type="button" variant="secondary" disabled={busy}
              onClick={() => void run(async () => { await update("courses", existing.id, { archived: !existing.archived }); onClose(); })}>
              {existing.archived ? "Desarxivar" : "Arxivar"}
            </Button>
          )}
          {existing && (
            <Button type="button" variant="danger" disabled={busy}
              onClick={() => confirm(`Vols esborrar «${existing.name}»? S'esborraran també les seves entregues i el temps d'estudi. No es pot desfer.`) && void run(async () => { await remove("courses", existing.id); onClose(); })}>
              Esborrar
            </Button>
          )}
          <Button type="submit" disabled={busy} className="flex-1">{existing ? "Desar" : "Afegir"}</Button>
        </div>
      </form>
    </Modal>
  );
}
