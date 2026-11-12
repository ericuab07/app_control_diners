"use client";

import { useState } from "react";
import { todayISO } from "@/lib/dates";
import type { Goal } from "@/lib/types";
import { useLife } from "../LifeProvider";
import { Button, ErrorNote, Field, inputClass, Modal, useAction } from "../ui";

const parse = (s: string) => Number(s.replace(",", "."));

export function GoalForm({ existing, onClose }: { existing?: Goal; onClose: () => void }) {
  const { insert, update, remove } = useLife();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [year, setYear] = useState(String(existing?.year ?? todayISO().slice(0, 4)));
  const [target, setTarget] = useState(existing ? String(existing.target_value).replace(".", ",") : "");
  const [current, setCurrent] = useState(existing ? String(existing.current_value).replace(".", ",") : "0");
  const [unit, setUnit] = useState(existing?.unit ?? "");
  const { busy, error, setError, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const y = Number(year);
    const t = parse(target);
    const c = parse(current);
    if (!Number.isInteger(y) || y < 2000 || y > 2100) return setError("L'any no és vàlid.");
    if (!Number.isFinite(t) || t <= 0) return setError("La meta ha de ser un número més gran que 0.");
    if (!Number.isFinite(c) || c < 0) return setError("El valor actual no pot ser negatiu.");
    const row = { title: title.trim(), year: y, target_value: t, current_value: c, unit: unit.trim() };
    void run(async () => {
      if (existing) await update("goals", existing.id, row);
      else await insert("goals", row);
      onClose();
    });
  };

  return (
    <Modal title={existing ? "Editar objectiu" : "Nou objectiu"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Objectiu">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={80} autoFocus={!existing} placeholder="Ex.: Llegir llibres" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Meta"><input className={`${inputClass} num`} inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} required placeholder="24" /></Field>
          <Field label="Unitat"><input className={inputClass} value={unit} onChange={(e) => setUnit(e.target.value)} maxLength={20} placeholder="llibres" /></Field>
          <Field label="Portes"><input className={`${inputClass} num`} inputMode="decimal" value={current} onChange={(e) => setCurrent(e.target.value)} /></Field>
          <Field label="Any"><input className={`${inputClass} num`} inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} /></Field>
        </div>
        <ErrorNote message={error} />
        <div className="flex flex-wrap gap-2">
          {existing && (
            <Button type="button" variant="danger" disabled={busy}
              onClick={() => confirm(`Vols esborrar «${existing.title}»?`) && void run(async () => { await remove("goals", existing.id); onClose(); })}>
              Esborrar
            </Button>
          )}
          <Button type="submit" disabled={busy} className="flex-1">{existing ? "Desar" : "Afegir"}</Button>
        </div>
      </form>
    </Modal>
  );
}
