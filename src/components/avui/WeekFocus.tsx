"use client";

import { Pencil, Target } from "lucide-react";
import { useState } from "react";
import { focusIsCurrent, mondayOf } from "@/lib/calc/week";
import { todayISO } from "@/lib/dates";
import { useLife } from "../LifeProvider";
import { Button, ErrorNote, inputClass, useAction } from "../ui";

/** Focus de la setmana: editable en línia; caduca sol quan arriba un dilluns nou. */
export function WeekFocus() {
  const { settings, saveSettings } = useLife();
  const [today] = useState(todayISO);
  const current = focusIsCurrent(settings.week_focus_monday, today) && settings.week_focus.trim() !== "";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const { busy, error, run } = useAction();

  const start = () => {
    setDraft(current ? settings.week_focus : "");
    setEditing(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      await saveSettings({ week_focus: draft.trim(), week_focus_monday: mondayOf(today) });
      setEditing(false);
    });
  };

  if (editing) {
    return (
      <form onSubmit={submit} className="mt-3 space-y-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Focus de la setmana</span>
          <input className={inputClass} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={120} autoFocus placeholder="Ex.: Acabar la pràctica d'ER" />
        </label>
        <ErrorNote message={error} />
        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>Desar</Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel·lar</Button>
        </div>
      </form>
    );
  }

  if (!current) {
    return (
      <button onClick={start} className="mt-3 inline-flex items-center gap-2 rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted hover:border-primary hover:text-primary">
        <Target size={16} aria-hidden /> Quin és el teu focus d&apos;aquesta setmana?
      </button>
    );
  }

  return (
    <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm">
      <Target size={16} className="shrink-0 text-primary" aria-hidden />
      <span className="min-w-0">
        <span className="text-muted">Focus de la setmana: </span>
        <span className="font-medium">{settings.week_focus}</span>
      </span>
      <button onClick={start} aria-label="Editar el focus de la setmana" className="grid size-7 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-text">
        <Pencil size={14} />
      </button>
    </div>
  );
}
