"use client";

import { Check, Moon, Plus, Sunrise, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { leftovers } from "@/lib/calc/closeDay";
import { dayProgress } from "@/lib/calc/dayProgress";
import { nextFreeRank } from "@/lib/calc/tasks";
import { addDaysISO } from "@/lib/dates";
import type { JournalEntry, Mood } from "@/lib/types";
import { MoodPicker } from "../journal/MoodPicker";
import { useLife } from "../LifeProvider";
import { Button, cx, ErrorNote, inputClass, Modal, useAction } from "../ui";
import { useCarryOver } from "./useCarryOver";

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="mb-2 flex items-center gap-2 font-serif text-lg font-semibold">
        <span className="num grid size-6 place-items-center rounded-full bg-primary/10 text-xs text-primary">{n}</span> {title}
      </h3>
      {children}
    </section>
  );
}

/** Ritual del vespre: repassar el dia, decidir què passa a demà, com estàs i les 3 de demà. */
export function CloseDaySheet({ today, onClose }: { today: string; onClose: () => void }) {
  const { tasks, journal_entries, insert, remove, upsert } = useLife();
  const tomorrow = addDaysISO(today, 1);
  const carry = useCarryOver();
  const { busy, error, setError, run } = useAction();
  const [notice, setNotice] = useState("");

  const todays = useMemo(() => tasks.filter((t) => t.date === today), [tasks, today]);
  const progress = dayProgress(todays);
  const pending = leftovers(tasks, today);
  const done = todays.filter((t) => t.done);
  const tomorrows = tasks.filter((t) => t.date === tomorrow && t.top_rank !== null).sort((a, b) => (a.top_rank ?? 0) - (b.top_rank ?? 0));
  const freeRank = nextFreeRank(tasks, tomorrow);

  const entry = journal_entries.find((e) => e.date === today);
  const [mood, setMood] = useState<Mood | null>(entry?.mood ?? null);
  const [note, setNote] = useState(entry?.note ?? "");
  const [savedJournal, setSavedJournal] = useState(false);
  const [newTask, setNewTask] = useState("");

  const moveToTomorrow = (ids?: string[]) =>
    void run(async () => {
      const toInbox = await carry(today, tomorrow, ids);
      setNotice(toInbox > 0 ? `Demà ja tenies les 3 prioritats: ${toInbox === 1 ? "1 tasca ha anat" : `${toInbox} tasques han anat`} a «Apunts».` : "");
    });

  const saveJournal = () => {
    if (mood === null) return setError("Tria com t'has sentit avui.");
    void run(async () => {
      await upsert("journal_entries", { date: today, mood, note: note.trim(), updated_at: new Date().toISOString() } as Partial<JournalEntry>, "user_id,date");
      setSavedJournal(true);
    });
  };

  const addTomorrow = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTask.trim();
    if (!title || freeRank === null) return;
    void run(async () => {
      await insert("tasks", { title, date: tomorrow, top_rank: freeRank });
      setNewTask("");
    });
  };

  return (
    <Modal title="Tanca el dia" onClose={onClose}>
      <div className="space-y-5">
        <Section n={1} title="Com ha anat">
          <p className="text-sm text-muted">
            {progress.total === 0 ? "Avui no tenies prioritats apuntades." : `Has fet ${progress.done} de ${progress.total} prioritats.`}
          </p>
          {done.length > 0 && (
            <ul className="mt-2 space-y-1">
              {done.map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm text-muted">
                  <Check size={16} className="shrink-0 text-done" aria-hidden /> <span className="line-through">{t.title}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {pending.length > 0 && (
          <Section n={2} title="Què en fem, del que falta?">
            <ul className="space-y-2">
              {pending.map((t) => (
                <li key={t.id} className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2">
                  <span className="min-w-0 flex-1 break-words text-sm">{t.title}</span>
                  <button onClick={() => moveToTomorrow([t.id])} disabled={busy} aria-label={`Passa «${t.title}» a demà`}
                    className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium hover:bg-surface-2">
                    <Sunrise size={15} aria-hidden /> Demà
                  </button>
                  <button onClick={() => void run(() => remove("tasks", t.id))} disabled={busy} aria-label={`Descarta «${t.title}»`}
                    className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface hover:text-expense">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
            {pending.length > 1 && (
              <Button variant="secondary" className="mt-2 w-full" disabled={busy} onClick={() => moveToTomorrow()}>
                <Sunrise size={16} /> Passa-les totes a demà
              </Button>
            )}
          </Section>
        )}
        {notice && <p role="status" className="rounded-lg bg-primary/10 px-3 py-2 text-sm">{notice}</p>}

        <Section n={pending.length > 0 ? 3 : 2} title="Com estàs?">
          <MoodPicker value={mood} onChange={(m) => { setMood(m); setSavedJournal(false); }} disabled={busy} />
          <textarea className={cx(inputClass, "mt-1 min-h-20")} value={note} maxLength={2000} placeholder="Una línia sobre el dia (opcional)"
            onChange={(e) => { setNote(e.target.value); setSavedJournal(false); }} aria-label="Nota del diari" />
          <div className="mt-2 flex items-center gap-3">
            <Button variant="secondary" disabled={busy} onClick={saveJournal}>Desa al diari</Button>
            {savedJournal && <span role="status" className="text-sm text-done">Desat.</span>}
          </div>
        </Section>

        <Section n={pending.length > 0 ? 4 : 3} title="Les 3 de demà">
          {tomorrows.length > 0 && (
            <ol className="mb-2 space-y-1.5">
              {tomorrows.map((t) => (
                <li key={t.id} className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm">
                  <span className="num font-serif font-semibold text-primary">{t.top_rank}</span>
                  <span className="min-w-0 flex-1 break-words">{t.title}</span>
                </li>
              ))}
            </ol>
          )}
          {freeRank === null ? (
            <p className="text-sm text-done">Demà ja tens les 3 prioritats. 👌</p>
          ) : (
            <form onSubmit={addTomorrow} className="flex gap-2">
              <input className={cx(inputClass, "flex-1")} value={newTask} onChange={(e) => setNewTask(e.target.value)} maxLength={120}
                placeholder={`Prioritat ${freeRank} de demà`} aria-label={`Prioritat ${freeRank} de demà`} enterKeyHint="done" />
              <button type="submit" disabled={busy || !newTask.trim()} aria-label="Afegeix la prioritat de demà"
                className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-fg disabled:opacity-40">
                <Plus size={20} />
              </button>
            </form>
          )}
        </Section>

        <ErrorNote message={error} />
        <Button className="w-full" onClick={onClose}><Moon size={16} /> Fet, bona nit</Button>
      </div>
    </Modal>
  );
}
