"use client";

import { MOODS } from "@/lib/calc/journal";
import type { Mood } from "@/lib/types";
import { cx } from "../ui";

/** Cinc botons d'ànim (1–5) amb emoji i l'etiqueta del seleccionat. */
export function MoodPicker({ value, onChange, disabled }: { value: Mood | null; onChange: (m: Mood) => void; disabled?: boolean }) {
  const selected = MOODS.find((m) => m.value === value);
  return (
    <div>
      <div className="flex gap-1.5" role="group" aria-label="Ànim">
        {MOODS.map((m) => (
          <button key={m.value} type="button" onClick={() => onChange(m.value)} disabled={disabled} aria-pressed={value === m.value} aria-label={m.label} title={m.label}
            className={cx("grid size-11 place-items-center rounded-full text-2xl transition-transform motion-reduce:transition-none",
              value === m.value ? "scale-110 bg-primary/15 ring-2 ring-primary" : "bg-surface-2 opacity-70 hover:opacity-100")}>
            {m.emoji}
          </button>
        ))}
      </div>
      <p className="mt-1.5 h-5 text-sm text-muted" aria-live="polite">{selected?.label ?? ""}</p>
    </div>
  );
}
