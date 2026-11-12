"use client";

import { useState } from "react";
import type { Habit } from "@/lib/types";
import { useLife } from "../LifeProvider";
import { Button, ErrorNote, Field, inputClass, Modal, Segmented, useAction } from "../ui";

export function HabitForm({ existing, onClose }: { existing?: Habit; onClose: () => void }) {
  const { insert, update, remove } = useLife();
  const [name, setName] = useState(existing?.name ?? "");
  const [icon, setIcon] = useState(existing?.icon ?? "✅");
  const [mode, setMode] = useState<"daily" | "weekly">(existing && existing.target_per_week < 7 ? "weekly" : "daily");
  const [times, setTimes] = useState(existing && existing.target_per_week < 7 ? existing.target_per_week : 3);
  const { busy, error, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const row = { name: name.trim(), icon: icon.trim() || "✅", target_per_week: mode === "daily" ? 7 : times };
    void run(async () => {
      if (existing) await update("habits", existing.id, row);
      else await insert("habits", row);
      onClose();
    });
  };

  return (
    <Modal title={existing ? "Editar hàbit" : "Nou hàbit"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-[5rem_1fr] gap-3">
          <Field label="Icona"><input className={`${inputClass} text-center`} value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={8} /></Field>
          <Field label="Hàbit">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} autoFocus={!existing} placeholder="Ex.: Llegir 20 minuts" />
          </Field>
        </div>
        <Segmented value={mode} onChange={setMode} options={[{ value: "daily", label: "Cada dia" }, { value: "weekly", label: "Uns dies per setmana" }]} />
        {mode === "weekly" && (
          <Field label="Quants cops per setmana?">
            <select className={inputClass} value={times} onChange={(e) => setTimes(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} {n === 1 ? "cop" : "cops"}</option>)}
            </select>
          </Field>
        )}
        <ErrorNote message={error} />
        <div className="flex flex-wrap gap-2">
          {existing && (
            <Button type="button" variant="secondary" disabled={busy}
              onClick={() => void run(async () => { await update("habits", existing.id, { archived: !existing.archived }); onClose(); })}>
              {existing.archived ? "Desarxivar" : "Arxivar"}
            </Button>
          )}
          {existing && (
            <Button type="button" variant="danger" disabled={busy}
              onClick={() => confirm(`Vols esborrar «${existing.name}»? S'esborrarà tot el seu historial. No es pot desfer.`) && void run(async () => { await remove("habits", existing.id); onClose(); })}>
              Esborrar
            </Button>
          )}
          <Button type="submit" disabled={busy} className="flex-1">{existing ? "Desar" : "Afegir"}</Button>
        </div>
      </form>
    </Modal>
  );
}
