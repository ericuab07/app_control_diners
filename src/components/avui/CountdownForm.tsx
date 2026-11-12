"use client";

import { useState } from "react";
import { todayISO } from "@/lib/dates";
import type { Countdown } from "@/lib/types";
import { useLife } from "../LifeProvider";
import { Button, ErrorNote, Field, inputClass, Modal, useAction } from "../ui";

export function CountdownForm({ existing, onClose }: { existing?: Countdown; onClose: () => void }) {
  const { insert, update, remove } = useLife();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [emoji, setEmoji] = useState(existing?.emoji ?? "✈️");
  const [start, setStart] = useState(existing?.start_date ?? todayISO());
  const [target, setTarget] = useState(existing?.target_date ?? "");
  const { busy, error, setError, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (target < start) return setError("La data final no pot ser anterior a l'inici.");
    const row = { title: title.trim(), emoji: emoji.trim() || "📌", start_date: start, target_date: target };
    void run(async () => {
      if (existing) await update("countdowns", existing.id, row);
      else await insert("countdowns", row);
      onClose();
    });
  };

  return (
    <Modal title={existing ? "Editar compte enrere" : "Nou compte enrere"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-[5rem_1fr] gap-3">
          <Field label="Emoji"><input className={`${inputClass} text-center`} value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={8} /></Field>
          <Field label="Què esperes?">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={80} autoFocus={!existing} placeholder="Ex.: Viatge a Roma" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Des de"><input type="date" className={inputClass} value={start} onChange={(e) => setStart(e.target.value)} required /></Field>
          <Field label="Fins a"><input type="date" className={inputClass} value={target} onChange={(e) => setTarget(e.target.value)} required /></Field>
        </div>
        <ErrorNote message={error} />
        <div className="flex flex-wrap gap-2">
          {existing && (
            <Button type="button" variant="secondary" disabled={busy}
              onClick={() => void run(async () => { await update("countdowns", existing.id, { archived: true }); onClose(); })}>
              Arxivar
            </Button>
          )}
          {existing && (
            <Button type="button" variant="danger" disabled={busy}
              onClick={() => confirm(`Vols esborrar «${existing.title}»?`) && void run(async () => { await remove("countdowns", existing.id); onClose(); })}>
              Esborrar
            </Button>
          )}
          <Button type="submit" disabled={busy} className="flex-1">{existing ? "Desar" : "Afegir"}</Button>
        </div>
      </form>
    </Modal>
  );
}
