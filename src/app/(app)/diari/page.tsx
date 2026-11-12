"use client";

import { useMemo, useState } from "react";
import { useNow } from "@/components/avui/useNow";
import { MoodChart } from "@/components/journal/MoodChart";
import { MoodPicker } from "@/components/journal/MoodPicker";
import { useLife } from "@/components/LifeProvider";
import { Button, Card, cx, EmptyState, ErrorNote, Field, inputClass, PageHeader, useAction } from "@/components/ui";
import { MOODS } from "@/lib/calc/journal";
import { formatLongDate } from "@/lib/dates";
import type { JournalEntry, Mood } from "@/lib/types";

const MAX_NOTE = 2000;

/** Editor d'un dia. Es remunta (key) quan canvia el dia triat. */
function DayEditor({ date, existing, today, onDateChange }: { date: string; existing?: JournalEntry; today: string; onDateChange: (d: string) => void }) {
  const { upsert } = useLife();
  const [mood, setMood] = useState<Mood | null>(existing?.mood ?? null);
  const [note, setNote] = useState(existing?.note ?? "");
  const [saved, setSaved] = useState(false);
  const { busy, error, setError, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    if (mood === null) return setError("Tria com t'has sentit aquest dia.");
    void run(async () => {
      await upsert("journal_entries", { date, mood, note: note.trim(), updated_at: new Date().toISOString() } as Partial<JournalEntry>, "user_id,date");
      setSaved(true);
    });
  };

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-serif text-xl font-semibold">{date === today ? "Com ha anat avui?" : formatLongDate(date)}</h2>
          <label className="text-sm">
            <span className="sr-only">Dia</span>
            <input type="date" className={cx(inputClass, "min-h-9 w-auto py-1")} value={date} max={today} onChange={(e) => e.target.value && onDateChange(e.target.value)} />
          </label>
        </div>
        <MoodPicker value={mood} onChange={setMood} disabled={busy} />
        <Field label="Nota (opcional)" hint={`${note.length} / ${MAX_NOTE}`}>
          <textarea className={cx(inputClass, "min-h-28")} value={note} onChange={(e) => setNote(e.target.value)} maxLength={MAX_NOTE} placeholder="Què ha passat? Què t'emportes del dia?" />
        </Field>
        <ErrorNote message={error} />
        {saved && !error && <p role="status" className="text-sm text-done">Desat.</p>}
        <Button type="submit" disabled={busy}>Desar</Button>
      </form>
    </Card>
  );
}

export default function DiariPage() {
  const { journal_entries } = useLife();
  const { today } = useNow();
  const [date, setDate] = useState(today);
  const byDate = useMemo(() => new Map(journal_entries.map((e) => [e.date, e])), [journal_entries]);
  const recent = useMemo(() => [...journal_entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30), [journal_entries]);
  const existing = byDate.get(date);

  return (
    <>
      <PageHeader title="Diari" subtitle="Un minut al dia: com estàs i què t'ha passat." />
      <div className="grid gap-4 lg:grid-cols-2">
        <DayEditor key={date} date={date} existing={existing} today={today} onDateChange={setDate} />
        <MoodChart entries={journal_entries} today={today} />
      </div>
      <h2 className="mb-3 mt-6 font-serif text-xl font-semibold">Entrades</h2>
      {recent.length === 0 ? (
        <EmptyState title="Encara no has escrit res" hint="Tria com estàs avui i, si vols, deixa-hi una nota." />
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {recent.map((e) => {
            const m = MOODS.find((x) => x.value === e.mood);
            return (
              <li key={e.id}>
                <button onClick={() => { setDate(e.date); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-surface-2">
                  <span className="text-2xl leading-none" aria-label={m?.label}>{m?.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{formatLongDate(e.date)}</span>
                    {e.note ? <span className="line-clamp-2 block whitespace-pre-line break-words text-sm text-muted">{e.note}</span> : <span className="block text-sm text-muted">{m?.label}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
