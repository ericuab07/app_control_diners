"use client";

import { useState } from "react";
import { nextFreeRank } from "@/lib/calc/tasks";
import { todayISO } from "@/lib/dates";
import { useLife } from "../LifeProvider";
import { Button, ErrorNote, Field, inputClass, Modal, useAction } from "../ui";

const FULL = "Ja tens les 3 prioritats d'avui. Acaba'n o esborra'n una.";

/** Crea una de «les 3 d'avui» al primer rang lliure. */
export function TaskForm({ onClose }: { onClose: () => void }) {
  const { tasks, insert } = useLife();
  const [today] = useState(todayISO);
  const [title, setTitle] = useState("");
  const rank = nextFreeRank(tasks, today);
  const { busy, error, setError, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rank === null) return setError(FULL);
    void run(async () => {
      try {
        await insert("tasks", { title: title.trim(), date: today, top_rank: rank });
      } catch (err) {
        // Un altre dispositiu pot haver ocupat el rang: missatge clar en lloc de l'error de Postgres.
        if (err instanceof Error && /duplicate key|unique/i.test(err.message)) throw new Error(FULL);
        throw err;
      }
      onClose();
    });
  };

  return (
    <Modal title="Nova prioritat d'avui" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={rank ? `Prioritat ${rank}` : "Prioritat"}>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} autoFocus placeholder="Ex.: Repassar el tema 3" />
        </Field>
        <ErrorNote message={error || (rank === null ? FULL : "")} />
        <Button type="submit" disabled={busy || rank === null} className="w-full">Afegir</Button>
      </form>
    </Modal>
  );
}
