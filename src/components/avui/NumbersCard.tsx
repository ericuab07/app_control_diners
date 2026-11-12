"use client";

import { Droplet, Footprints, Moon } from "lucide-react";
import { useState } from "react";
import { formatDuration } from "@/lib/time";
import type { HealthLog, Workout } from "@/lib/types";
import { useLife } from "../LifeProvider";
import { Card, cx, ErrorNote, inputClass, useAction } from "../ui";
import { useNow } from "./useNow";

/** Barra prima de progrés cap a una meta. */
function Meter({ value, goal, caption }: { value: number; goal: number; caption: string }) {
  const pct = Math.max(0, Math.min(1, value / goal)) * 100;
  return (
    <>
      <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-surface-2" aria-hidden>
        <span className={cx("block h-full rounded-full", pct >= 100 ? "bg-done" : "bg-primary")} style={{ width: `${pct}%` }} />
      </span>
      <span className="num mt-0.5 block text-right text-xs text-muted">{caption}</span>
    </>
  );
}

/** Camp numèric que desa en perdre el focus (o amb Enter). */
function NumberField({ label, value, onSave, suffix, decimal }: { label: string; value: string; onSave: (raw: string) => void; suffix?: string; decimal?: boolean }) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? value;
  const commit = () => {
    if (draft !== null && draft !== value) onSave(draft);
    setDraft(null);
  };
  return (
    <span className="flex items-center gap-2">
      <input aria-label={label} className={cx(inputClass, "num min-h-9 w-20 py-1 text-right")} inputMode={decimal ? "decimal" : "numeric"} value={shown}
        onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()} placeholder="—" />
      {suffix && <span className="text-sm text-muted">{suffix}</span>}
    </span>
  );
}

/** «El teu dia en números»: aigua, passos, son i entreno, una fila per dia a `health_logs`. */
export function NumbersCard() {
  const { health_logs, settings, upsert } = useLife();
  const { today } = useNow();
  const log = health_logs.find((l) => l.date === today);
  const { error, setError, run } = useAction();
  const water = log?.water_glasses ?? 0;

  const save = (patch: Partial<HealthLog>) =>
    void run(async () => {
      await upsert("health_logs", { water_glasses: water, sleep_minutes: log?.sleep_minutes ?? null, steps: log?.steps ?? null, workout: log?.workout ?? null, ...patch, date: today }, "user_id,date");
    });

  const saveSteps = (raw: string) => {
    if (raw.trim() === "") return save({ steps: null });
    const n = Number(raw.replace(/\./g, ""));
    if (!Number.isInteger(n) || n < 0) return setError("Els passos han de ser un nombre enter.");
    save({ steps: n });
  };
  const saveSleep = (raw: string) => {
    if (raw.trim() === "") return save({ sleep_minutes: null });
    const h = Number(raw.replace(",", "."));
    if (!Number.isFinite(h) || h < 0 || h > 24) return setError("Les hores de son han de ser un número entre 0 i 24.");
    save({ sleep_minutes: Math.round(h * 60) });
  };
  const sleepHours = log?.sleep_minutes != null ? String(Math.round((log.sleep_minutes / 60) * 10) / 10).replace(".", ",") : "";

  return (
    <Card className="h-full">
      <h2 className="mb-3 font-serif text-xl font-semibold">El teu dia en números</h2>
      <div className="space-y-4">
        <div>
          <p className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-medium"><Droplet size={16} className="text-primary" aria-hidden /> Aigua</span>
            <span className="num text-muted">{water} de {settings.water_goal} gots</span>
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1" role="group" aria-label="Gots d'aigua">
            {Array.from({ length: Math.max(settings.water_goal, water) }, (_, i) => {
              const filled = i < water;
              return (
                <button key={i} onClick={() => save({ water_glasses: water === i + 1 ? i : i + 1 })} aria-label={`${i + 1} ${i === 0 ? "got" : "gots"}`} aria-pressed={filled}
                  className="grid size-8 place-items-center rounded-full hover:bg-surface-2">
                  <Droplet size={20} className={filled ? "fill-primary text-primary" : "text-muted/60"} />
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-sm font-medium"><Footprints size={16} className="text-primary" aria-hidden /> Passos</span>
            <NumberField label="Passos d'avui" value={log?.steps != null ? String(log.steps) : ""} onSave={saveSteps} />
          </div>
          <Meter value={log?.steps ?? 0} goal={settings.step_goal} caption={`Meta ${settings.step_goal.toLocaleString("ca-ES")}`} />
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-sm font-medium"><Moon size={16} className="text-primary" aria-hidden /> Son</span>
            <NumberField label="Hores de son" value={sleepHours} onSave={saveSleep} suffix="h" decimal />
          </div>
          <Meter value={log?.sleep_minutes ?? 0} goal={settings.sleep_goal_minutes} caption={`Meta ${formatDuration(settings.sleep_goal_minutes)}`} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Entreno</span>
          <div className="flex rounded-lg border border-border bg-surface-2 p-0.5" role="group" aria-label="Entreno d'avui">
            {([["done", "💪 Entrenat"], ["rest", "😴 Descans"]] as [Workout, string][]).map(([v, l]) => (
              <button key={v} onClick={() => save({ workout: log?.workout === v ? null : v })} aria-pressed={log?.workout === v}
                className={cx("min-h-9 rounded-md px-3 text-sm font-medium", log?.workout === v ? "bg-surface shadow-sm" : "text-muted")}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
      <ErrorNote message={error} />
    </Card>
  );
}
