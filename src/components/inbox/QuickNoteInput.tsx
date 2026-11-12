"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useLife } from "../LifeProvider";
import { cx, ErrorNote, inputClass, useAction } from "../ui";

/** Camp d'una línia per apuntar alguna cosa en dos segons. Enter desa i deixa el camp buit per a la següent. */
export function QuickNoteInput({ autoFocus, onSaved }: { autoFocus?: boolean; onSaved?: () => void }) {
  const { insert } = useLife();
  const [text, setText] = useState("");
  const { busy, error, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    void run(async () => {
      await insert("inbox_items", { text: value });
      setText("");
      onSaved?.();
    });
  };

  return (
    <form onSubmit={submit}>
      <div className="flex gap-2">
        <input className={cx(inputClass, "flex-1")} value={text} onChange={(e) => setText(e.target.value)} maxLength={500} autoFocus={autoFocus}
          placeholder="Apunta alguna cosa…" aria-label="Apunt ràpid" enterKeyHint="done" />
        <button type="submit" disabled={busy || !text.trim()} aria-label="Desar l'apunt"
          className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-fg disabled:opacity-40">
          <Plus size={20} />
        </button>
      </div>
      <ErrorNote message={error} />
    </form>
  );
}
