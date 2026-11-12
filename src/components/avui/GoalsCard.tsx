"use client";

import Link from "next/link";
import { useLife } from "../LifeProvider";
import { GoalBar } from "../goals/GoalBar";
import { Card } from "../ui";
import { useNow } from "./useNow";

const MAX = 4;

/** Objectius de l'any actual amb la seva barra i el ritme. */
export function GoalsCard() {
  const { goals } = useLife();
  const { today } = useNow();
  const year = Number(today.slice(0, 4));
  const list = goals.filter((g) => g.year === year).slice(0, MAX);
  return (
    <Card className="h-full">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-serif text-xl font-semibold">Objectius {year}</h2>
        <Link href="/objectius" className="text-sm text-primary hover:underline">Tots</Link>
      </div>
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-3 py-6 text-center">
          <p className="text-sm text-muted">Què vols aconseguir aquest any?</p>
          <Link href="/objectius" className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-fg">Afegir un objectiu</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((g) => (
            <li key={g.id}>
              <p className="mb-1 break-words text-sm font-medium">{g.title}</p>
              <GoalBar goal={g} today={today} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
