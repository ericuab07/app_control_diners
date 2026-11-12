"use client";

import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { InboxItem } from "@/lib/types";
import { InboxItemMenu } from "../inbox/InboxItemMenu";
import { QuickNoteInput } from "../inbox/QuickNoteInput";
import { useLife } from "../LifeProvider";
import { Card } from "../ui";

/** «Apunts»: captura ràpida i la safata de coses per classificar. */
export function InboxCard() {
  const { inbox_items } = useLife();
  const [open, setOpen] = useState<InboxItem | null>(null);
  const items = useMemo(() => [...inbox_items].sort((a, b) => b.created_at.localeCompare(a.created_at)), [inbox_items]);
  return (
    <Card>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-serif text-xl font-semibold">Apunts</h2>
        {items.length > 0 && <span className="num text-sm text-muted">{items.length} per classificar</span>}
      </div>
      <QuickNoteInput />
      {items.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {items.map((i) => (
            <li key={i.id}>
              <button onClick={() => setOpen(i)} className="flex min-h-11 w-full items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-left text-sm hover:bg-border/50">
                <span className="min-w-0 flex-1 break-words">{i.text}</span>
                <ChevronRight size={16} className="shrink-0 text-muted" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && <InboxItemMenu item={open} onClose={() => setOpen(null)} />}
    </Card>
  );
}
