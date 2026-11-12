"use client";

import { Moon } from "lucide-react";
import { useState } from "react";
import { isEvening, leftovers } from "@/lib/calc/closeDay";
import { addDaysISO } from "@/lib/dates";
import { useLife } from "../LifeProvider";
import { Button, Card } from "../ui";
import { CloseDaySheet } from "./CloseDaySheet";
import { useNow } from "./useNow";

/** A partir de les 20:00, proposa tancar el dia. Si ja està tancat, ho diu en una línia. */
export function CloseDayCard() {
  const { tasks, journal_entries } = useLife();
  const { today, now } = useNow();
  const [open, setOpen] = useState(false);
  if (!isEvening(now) && !open) return null;

  const pending = leftovers(tasks, today).length;
  const tomorrow = addDaysISO(today, 1);
  const planned = tasks.filter((t) => t.date === tomorrow && t.top_rank !== null).length;
  const closed = pending === 0 && planned > 0 && journal_entries.some((e) => e.date === today);

  return (
    <>
      {closed ? (
        <Card className="flex items-center gap-3">
          <Moon size={20} className="shrink-0 text-primary" aria-hidden />
          <p className="min-w-0 flex-1 text-sm"><span className="font-semibold">Dia tancat.</span> <span className="text-muted">Demà tens {planned} {planned === 1 ? "prioritat" : "prioritats"} a punt. Bona nit!</span></p>
          <button onClick={() => setOpen(true)} className="text-sm text-primary hover:underline">Obrir</button>
        </Card>
      ) : (
        <Card className="border-primary/40 bg-primary/5">
          <div className="flex items-start gap-3">
            <Moon size={22} className="mt-0.5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-xl font-semibold">Tanca el dia</h2>
              <p className="mt-0.5 text-sm text-muted">
                {pending > 0 ? `${pending} ${pending === 1 ? "cosa pendent" : "coses pendents"} · ` : ""}
                demà: {planned} de 3 prioritats · 2 minuts
              </p>
            </div>
          </div>
          <Button className="mt-3 w-full" onClick={() => setOpen(true)}>Comença</Button>
        </Card>
      )}
      {open && <CloseDaySheet today={today} onClose={() => setOpen(false)} />}
    </>
  );
}
