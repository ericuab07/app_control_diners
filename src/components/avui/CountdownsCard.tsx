"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { countdownLabel, countdownProgress, daysUntil } from "@/lib/calc/countdowns";
import type { Countdown } from "@/lib/types";
import { useLife } from "../LifeProvider";
import { Button, Card } from "../ui";
import { CountdownForm } from "./CountdownForm";
import { useNow } from "./useNow";

const MAX = 3;

/** Els propers comptes enrere (els passats es queden a la BD però no es mostren). */
export function CountdownsCard() {
  const { countdowns } = useLife();
  const { today } = useNow();
  const [editing, setEditing] = useState<Countdown | "new" | null>(null);
  const upcoming = useMemo(
    () => countdowns.filter((c) => !c.archived && daysUntil(c.target_date, today) >= 0).sort((a, b) => a.target_date.localeCompare(b.target_date)).slice(0, MAX),
    [countdowns, today],
  );

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-serif text-xl font-semibold">Comptes enrere</h2>
        {upcoming.length > 0 && (
          <button onClick={() => setEditing("new")} aria-label="Afegeix un compte enrere" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-text"><Plus size={18} /></button>
        )}
      </div>
      {upcoming.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-3 py-6 text-center">
          <p className="text-sm text-muted">Un viatge, un examen, un concert… Compta els dies que falten.</p>
          <Button className="mt-3" onClick={() => setEditing("new")}><Plus size={16} /> Afegeix un compte enrere</Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {upcoming.map((c) => {
            const days = daysUntil(c.target_date, today);
            const pct = Math.round(countdownProgress(c, today) * 100);
            return (
              <li key={c.id}>
                <button onClick={() => setEditing(c)} className="w-full rounded-xl px-1 py-1 text-left hover:bg-surface-2">
                  <span className="mb-1.5 flex items-start gap-2">
                    <span className="text-xl leading-6" aria-hidden>{c.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words font-medium leading-6">{c.title}</span>
                      <span className="num block font-serif text-sm font-semibold text-primary">{countdownLabel(days)}</span>
                    </span>
                  </span>
                  <span className="block h-2 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-label={`Camí cap a ${c.title}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {editing && <CountdownForm existing={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </Card>
  );
}
