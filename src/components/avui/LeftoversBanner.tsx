"use client";

import { History } from "lucide-react";
import { useState } from "react";
import { leftovers } from "@/lib/calc/closeDay";
import { addDaysISO } from "@/lib/dates";
import { useLife } from "../LifeProvider";
import { Button, Card, ErrorNote, useAction } from "../ui";
import { useCarryOver } from "./useCarryOver";
import { useNow } from "./useNow";

const KEY = "pendents-descartats";

function dismissedFor(date: string): boolean {
  try {
    return localStorage.getItem(KEY) === date;
  } catch {
    return false;
  }
}

/** Si ahir van quedar prioritats sense fer (i no es va tancar el dia), proposa passar-les a avui. */
export function LeftoversBanner() {
  const { tasks } = useLife();
  const { today } = useNow();
  const yesterday = addDaysISO(today, -1);
  const carry = useCarryOver();
  const { busy, error, run } = useAction();
  const [hidden, setHidden] = useState(() => dismissedFor(yesterday));
  const [notice, setNotice] = useState("");
  const left = leftovers(tasks, yesterday);

  if (notice) return <p role="status" className="rounded-xl bg-primary/10 px-4 py-3 text-sm">{notice}</p>;
  if (hidden || left.length === 0) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, yesterday);
    } catch {
      // sense emmagatzematge: només s'amaga fins a recarregar
    }
    setHidden(true);
  };

  return (
    <Card className="border-warn/40">
      <div className="flex items-start gap-3">
        <History size={20} className="mt-0.5 shrink-0 text-warn" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Ahir et {left.length === 1 ? "va quedar 1 cosa" : `van quedar ${left.length} coses`}</p>
          <ul className="mt-1 list-disc pl-5 text-sm text-muted">
            {left.map((t) => <li key={t.id} className="break-words">{t.title}</li>)}
          </ul>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => void run(async () => {
          const toInbox = await carry(yesterday, today);
          setNotice(toInbox > 0 ? `Passades a avui. ${toInbox === 1 ? "Una no hi cabia i és" : `${toInbox} no hi cabien i són`} a «Apunts».` : "Passades a avui.");
        })}>Passa-les a avui</Button>
        <Button variant="ghost" disabled={busy} onClick={dismiss}>Deixa-ho</Button>
      </div>
      <ErrorNote message={error} />
    </Card>
  );
}
