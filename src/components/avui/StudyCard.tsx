"use client";

import Link from "next/link";
import { useMemo } from "react";
import { dueLabel, upcomingItems } from "@/lib/calc/study";
import { useLife } from "../LifeProvider";
import { STUDY_KIND_LABELS } from "../study/StudyItemForm";
import { Card, cx } from "../ui";
import { useNow } from "./useNow";

const MAX = 4;

/** Properes entregues i exàmens (no es mostra si no n'hi ha). */
export function StudyCard() {
  const { study_items, courses } = useLife();
  const { today } = useNow();
  const list = useMemo(() => upcomingItems(study_items, today).slice(0, MAX), [study_items, today]);
  if (list.length === 0) return null;
  const byId = new Map(courses.map((c) => [c.id, c]));
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-serif text-xl font-semibold">Properes entregues</h2>
        <Link href="/estudis" className="text-sm text-primary hover:underline">Estudis</Link>
      </div>
      <ul className="space-y-2">
        {list.map((i) => {
          const c = byId.get(i.course_id);
          return (
            <li key={i.id} className="flex items-center gap-2.5">
              <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: c?.color }} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block break-words text-sm font-medium">{i.title}</span>
                <span className="block text-xs text-muted">{STUDY_KIND_LABELS[i.kind]} · {c?.name}</span>
              </span>
              <span className={cx("whitespace-nowrap text-sm font-semibold", i.due_date < today ? "text-expense" : "text-primary")}>{dueLabel(i.due_date, today)}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
