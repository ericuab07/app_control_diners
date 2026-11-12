"use client";

import { useState } from "react";
import { useLife } from "../LifeProvider";
import { Button, Card, ErrorNote, Field, inputClass, useAction } from "../ui";
import { ThemeSection } from "./ThemeSection";

const positiveInt = (s: string): number | null => (/^\d+$/.test(s.trim()) && Number(s) > 0 ? Number(s) : null);

/** Nom i metes diàries del panell. Les hores de son es desen en minuts. */
export function ProfileSection() {
  const { settings, saveSettings } = useLife();
  const [name, setName] = useState(settings.display_name);
  const [steps, setSteps] = useState(String(settings.step_goal));
  const [water, setWater] = useState(String(settings.water_goal));
  const [sleep, setSleep] = useState(String(Math.round((settings.sleep_goal_minutes / 60) * 10) / 10).replace(".", ","));
  const [saved, setSaved] = useState(false);
  const { busy, error, setError, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    const step_goal = positiveInt(steps);
    const water_goal = positiveInt(water);
    const sleepHours = Number(sleep.replace(",", "."));
    if (step_goal === null) return setError("Els passos han de ser un nombre enter més gran que 0.");
    if (water_goal === null) return setError("Els gots d'aigua han de ser un nombre enter més gran que 0.");
    if (!Number.isFinite(sleepHours) || sleepHours <= 0 || sleepHours > 24) return setError("Les hores de son han de ser un número entre 0 i 24.");
    void run(async () => {
      await saveSettings({ display_name: name.trim(), step_goal, water_goal, sleep_goal_minutes: Math.round(sleepHours * 60) });
      setSaved(true);
    });
  };

  return (
    <div className="space-y-4">
      <Card className="max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Com et dius?" hint="Surt a la salutació de la portada.">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Ex.: Eric" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Passos al dia">
              <input className={`${inputClass} num`} inputMode="numeric" value={steps} onChange={(e) => setSteps(e.target.value)} />
            </Field>
            <Field label="Gots d'aigua">
              <input className={`${inputClass} num`} inputMode="numeric" value={water} onChange={(e) => setWater(e.target.value)} />
            </Field>
            <Field label="Hores de son">
              <input className={`${inputClass} num`} inputMode="decimal" value={sleep} onChange={(e) => setSleep(e.target.value)} />
            </Field>
          </div>
          <ErrorNote message={error} />
          {saved && !error && <p role="status" className="text-sm text-done">Desat.</p>}
          <Button type="submit" disabled={busy}>Desar</Button>
        </form>
      </Card>
      <ThemeSection />
    </div>
  );
}
