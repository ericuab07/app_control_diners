"use client";

import { useState } from "react";
import { isoWeekNumber } from "@/lib/calc/week";
import { formatLongDate, todayISO } from "@/lib/dates";
import { greeting } from "@/lib/time";
import { useLife } from "../LifeProvider";

export function GreetingHeader() {
  const { settings } = useLife();
  const [{ hour, today }] = useState(() => ({ hour: new Date().getHours(), today: todayISO() }));
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
