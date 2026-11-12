"use client";

import { Check, Clock, Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNow } from "@/components/avui/useNow";
import { useLife } from "@/components/LifeProvider";
import { CourseForm } from "@/components/study/CourseForm";
import { STUDY_KIND_LABELS, StudyItemForm } from "@/components/study/StudyItemForm";
import { StudyLogForm } from "@/components/study/StudyLogForm";
import { Button, Card, cx, EmptyState, ErrorNote, PageHeader, useAction } from "@/components/ui";
import { dueLabel, minutesThisWeek, upcomingItems } from "@/lib/calc/study";
import { formatDuration } from "@/lib/time";
import type { Course, StudyItem } from "@/lib/types";

type Editing = { kind: "course"; course?: Course } | { kind: "item"; item?: StudyItem; courseId?: string } | { kind: "log"; courseId?: string } | null;

export default function EstudisPage() {
  const { courses, study_items, study_logs, update } = useLife();
  const { today } = useNow();
  const [editing, setEditing] = useState<Editing>(null);
  const { busy, error, run } = useAction();
  const active = courses.filter((c) => !c.archived);
  const archived = courses.filter((c) => c.archived);
  const byId = new Map(courses.map((c) => [c.id, c]));
  const upcoming = useMemo(() => upcomingItems(study_items, today), [study_items, today]);
  const week = useMemo(() => minutesThisWeek(study_logs, today), [study_logs, today]);
  const weekTotal = [...week.values()].reduce((a, b) => a + b, 0);

  const markDone = (i: StudyItem) => void run(() => update("study_items", i.id, { done: !i.done }));

  return (
    <>
      <PageHeader title="Estudis" subtitle="UAB · entregues, exàmens i hores d'estudi"
        action={active.length > 0 && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditing({ kind: "log" })}><Clock size={16} /> Temps</Button>
            <Button onClick={() => setEditing({ kind: "item" })}><Plus size={18} /> Entrega</Button>
          </div>
        )} />

      {active.length === 0 ? (
        <EmptyState title="Afegeix les teves assignatures" hint="Després hi podràs apuntar entregues, exàmens i el temps que hi dediques cada setmana."
          action={<Button onClick={() => setEditing({ kind: "course" })}><Plus size={18} /> Nova assignatura</Button>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <h2 className="mb-3 font-serif text-xl font-semibold">Properes</h2>
            <ErrorNote message={error} />
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted">Res pendent les pròximes dues setmanes. 🎉</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((i) => {
                  const c = byId.get(i.course_id);
                  const late = i.due_date < today;
                  return (
                    <li key={i.id} className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2">
                      <button onClick={() => markDone(i)} disabled={busy} role="checkbox" aria-checked={i.done} aria-label={`Fet: ${i.title}`}
                        className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-muted">
                        {i.done && <Check size={14} />}
                      </button>
                      <span className="w-1 self-stretch rounded-full" style={{ background: c?.color }} aria-hidden />
                      <button onClick={() => setEditing({ kind: "item", item: i })} className="min-w-0 flex-1 text-left">
                        <span className="block break-words font-medium">{i.title}</span>
                        <span className="block text-xs text-muted">{STUDY_KIND_LABELS[i.kind]} · {c?.name}</span>
                      </button>
                      <span className={cx("whitespace-nowrap text-sm font-semibold", late ? "text-expense" : "text-primary")}>{dueLabel(i.due_date, today)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="font-serif text-xl font-semibold">Aquesta setmana</h2>
              <span className="num font-serif text-lg font-semibold">{formatDuration(weekTotal)}</span>
            </div>
            <ul className="space-y-2">
              {active.map((c) => {
                const m = week.get(c.id) ?? 0;
                return (
                  <li key={c.id} className="flex items-center gap-2 text-sm">
                    <span className="size-3 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                    <span className="num text-muted">{m > 0 ? formatDuration(m) : "—"}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      )}

      {active.length > 0 && (
        <>
          <div className="mb-3 mt-6 flex items-center justify-between gap-2">
            <h2 className="font-serif text-xl font-semibold">Assignatures</h2>
            <Button variant="secondary" onClick={() => setEditing({ kind: "course" })}><Plus size={16} /> Nova</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((c) => {
              const pending = study_items.filter((i) => i.course_id === c.id && !i.done).length;
              return (
                <Card key={c.id}>
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 size-3 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-semibold">{c.name}</p>
                      <p className="text-xs text-muted">{[c.semester, `${pending} pendent${pending === 1 ? "" : "s"}`].filter(Boolean).join(" · ")}</p>
                    </div>
                    <button onClick={() => setEditing({ kind: "course", course: c })} aria-label={`Editar «${c.name}»`} className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-text"><Pencil size={16} /></button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="secondary" className="flex-1" onClick={() => setEditing({ kind: "item", courseId: c.id })}><Plus size={16} /> Entrega</Button>
                    <Button variant="secondary" className="flex-1" onClick={() => setEditing({ kind: "log", courseId: c.id })}><Clock size={16} /> Temps</Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {archived.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-muted">Arxivades ({archived.length})</summary>
          <ul className="mt-2 divide-y divide-border rounded-2xl border border-border bg-surface">
            {archived.map((c) => (
              <li key={c.id}><button onClick={() => setEditing({ kind: "course", course: c })} className="w-full px-4 py-3 text-left hover:bg-surface-2">{c.name}</button></li>
            ))}
          </ul>
        </details>
      )}

      {editing?.kind === "course" && <CourseForm existing={editing.course} onClose={() => setEditing(null)} />}
      {editing?.kind === "item" && <StudyItemForm existing={editing.item} defaultCourseId={editing.courseId} onClose={() => setEditing(null)} />}
      {editing?.kind === "log" && <StudyLogForm defaultCourseId={editing.courseId} onClose={() => setEditing(null)} />}
    </>
  );
}
