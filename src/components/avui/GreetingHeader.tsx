"use client";

import { isoWeekNumber } from "@/lib/calc/week";
import { formatLongDate } from "@/lib/dates";
import { greeting, toMinutes } from "@/lib/time";
import { useLife } from "../LifeProvider";
import { useNow } from "./useNow";

export function GreetingHeader() {
  const { settings } = useLife();
  const { today, now } = useNow();
  const hour = Math.floor(toMinutes(now) / 60);
  const name = settings.display_name.trim();
  return (
    <header className="mb-1">
      <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        {greeting(hour)}
        {name && (
          <>
            , <em className="text-primary">{name}</em>
          </>
        )}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {formatLongDate(today)} · setmana {isoWeekNumber(today)}
      </p>
    </header>
  );
}
