"use client";

import { useState } from "react";
import { isValidTimeRange } from "@/lib/calc/agenda";
import { weekdayOf } from "@/lib/calc/week";
import { addDaysISO, todayISO } from "@/lib/dates";
import type { EventKind, LifeEvent } from "@/lib/types";
import { useLife } from "../LifeProvider";
import { Button, ErrorNote, Field, inputClass, Modal, Segmented, useAction } from "../ui";

export const KIND_LABELS: Record<EventKind, string> = { class: "Classe", work: "Feina", personal: "Personal", other: "Altre" };
/** Color de cada tipus (variables del tema, clar i fosc). */
export const KIND_COLORS: Record<EventKind, string> = {
  class: "var(--primary)",
  work: "var(--warn)",
  personal: "var(--done)",
  other: "var(--muted)",
};
const WEEKDAYS = ["dilluns", "dimarts", "dimecres", "dijous", "divendres", "dissabte", "diumenge"];

/** Data d'exemple (avui o la propera) que cau en el dia de la setmana indicat. */
function dateForWeekday(weekday: number): string {
  const today = todayISO();
  return addDaysISO(today, (weekday - weekdayOf(today) + 7) % 7);
}

export function EventForm({ existing, onClose }: { existing?: LifeEvent; onClose: () => void }) {
  const { insert, update, remove } = useLife();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [kind, setKind] = useState<EventKind>(existing?.kind ?? "class");
  const [start, setStart] = useState(existing?.start_time ?? "09:00");
  const [end, setEnd] = useState(existing?.end_time ?? "10:00");
  const [repeat, setRepeat] = useState<"once" | "weekly">(existing?.weekday != null ? "weekly" : "once");
  const [date, setDate] = useState(existing?.date ?? (existing?.weekday != null ? dateForWeekday(existing.weekday) : todayISO()));
  const [until, setUntil] = useState(existing?.repeat_until ?? "");
  const { busy, error, setError, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidTimeRange(start, end)) return setError("L'hora de fi ha de ser posterior a la d'inici.");
    if (repeat === "weekly" && until && until < date) return setError("La data «fins a» no pot ser anterior al primer dia.");
    const row: Partial<LifeEvent> = {
      title: title.trim(), kind, start_time: start, end_time: end,
      ...(repeat === "once"
        ? { date, weekday: null, repeat_until: null }
        : { date: null, weekday: weekdayOf(date), repeat_until: until || null }),
    };
    void run(async () => {
      if (existing) await update("events", existing.id, row);
      else await insert("events", row);
      onClose();
    });
  };

  return (
    <Modal title={existing ? "Editar esdeveniment" : "Nou esdeveniment"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Títol">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={80} autoFocus={!existing} placeholder="Ex.: Estructura de Dades" />
        </Field>
        <Segmented value={kind} onChange={setKind} options={(Object.keys(KIND_LABELS) as EventKind[]).map((k) => ({ value: k, label: KIND_LABELS[k] }))} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Inici"><input type="time" className={`${inputClass} num`} value={start} onChange={(e) => setStart(e.target.value)} required /></Field>
          <Field label="Fi"><input type="time" className={`${inputClass} num`} value={end} onChange={(e) => setEnd(e.target.value)} required /></Field>
        </div>
        <Segmented value={repeat} onChange={setRepeat} options={[{ value: "once", label: "Només un dia" }, { value: "weekly", label: "Cada setmana" }]} />
        <div className="grid grid-cols-2 gap-3">
          <Field label={repeat === "once" ? "Dia" : "A partir de"} hint={repeat === "weekly" ? `Cada ${WEEKDAYS[weekdayOf(date)]}` : undefined}>
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          {repeat === "weekly" && (
            <Field label="Fins a (opcional)">
              <input type="date" className={inputClass} value={until} onChange={(e) => setUntil(e.target.value)} />
            </Field>
          )}
        </div>
        <ErrorNote message={error} />
        <div className="flex flex-wrap gap-2">
          {existing && (
            <Button type="button" variant="danger" disabled={busy}
              onClick={() => confirm(`Vols esborrar «${existing.title}»${existing.weekday != null ? " de totes les setmanes" : ""}?`) && void run(async () => { await remove("events", existing.id); onClose(); })}>
              Esborrar
            </Button>
          )}
          <Button type="submit" disabled={busy} className="flex-1">{existing ? "Desar" : "Afegir"}</Button>
        </div>
      </form>
    </Modal>
  );
}
