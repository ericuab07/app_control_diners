"use client";

import Link from "next/link";
import type { JournalEntry, Mood } from "@/lib/types";
import { MoodPicker } from "../journal/MoodPicker";
import { useLife } from "../LifeProvider";
import { Card, ErrorNote, useAction } from "../ui";
import { useNow } from "./useNow";

/** «Com estàs avui?»: desa l'ànim d'un toc; la nota es fa al diari. */
export function MoodCard() {
  const { journal_entries, upsert } = useLife();
  const { today } = useNow();
  const entry = journal_entries.find((e) => e.date === today);
  const { busy, error, run } = useAction();
  const save = (mood: Mood) =>
    void run(async () => {
      await upsert("journal_entries", { date: today, mood, note: entry?.note ?? "", updated_at: new Date().toISOString() } as Partial<JournalEntry>, "user_id,date");
    });
  return (
    <Card className="h-full">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-serif text-xl font-semibold">Com estàs avui?</h2>
        <Link href="/diari" className="text-sm text-primary hover:underline">{entry?.note ? "Diari" : "Escriu al diari"}</Link>
      </div>
      <MoodPicker value={entry?.mood ?? null} onChange={save} disabled={busy} />
      {entry?.note && <p className="mt-1 line-clamp-2 break-words text-sm italic text-muted">«{entry.note}»</p>}
      <ErrorNote message={error} />
    </Card>
  );
}
