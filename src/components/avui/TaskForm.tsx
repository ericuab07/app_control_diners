"use client";

import { useState } from "react";
import { nextFreeRank } from "@/lib/calc/tasks";
import { addDaysISO, todayISO } from "@/lib/dates";
import { useLife } from "../LifeProvider";
import { Button, ErrorNote, Field, inputClass, Modal, useAction } from "../ui";

/**
 * Crea una de «les 3» d'un dia (avui per defecte) al primer rang lliure.
 * `onSaved` s'executa després de crear-la (p. ex. per esborrar l'apunt d'on ve).
 */
export function TaskForm({ onClose, date, initialTitle = "", onSaved }: { onClose: () => void; date?: string; initialTitle?: string; onSaved?: () => Promise<void> }) {
  const { tasks, insert } = useLife();
  const [day] = useState(() => date ?? todayISO());
  const tomorrow = day === addDaysISO(todayISO(), 1);
  const full = `Ja tens les 3 prioritats ${tomorrow ? "de demà" : "d'avui"}. Acaba'n o esborra'n una.`;
  const [title, setTitle] = useState(initialTitle);
  const rank = nextFreeRank(tasks, day);
  const { busy, error, setError, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rank === null) return setError(full);
    void run(async () => {
      try {
        await insert("tasks", { title: title.trim(), date: day, top_rank: rank });
      } catch (err) {
        // Un altre dispositiu pot haver ocupat el rang: missatge clar en lloc de l'error de Postgres.
        if (err instanceof Error && /duplicate key|unique/i.test(err.message)) throw new Error(full);
        throw err;
      }
      await onSaved?.();
      onClose();
    });
  };

  return (
    <Modal title={tomorrow ? "Prioritat de demà" : "Nova prioritat d'avui"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={rank ? `Prioritat ${rank}` : "Prioritat"}>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} autoFocus placeholder="Ex.: Repassar el tema 3" />
        </Field>
        <ErrorNote message={error || (rank === null ? full : "")} />
        <Button type="submit" disabled={busy || rank === null} className="w-full">Afegir</Button>
      </form>
    </Modal>
  );
}
