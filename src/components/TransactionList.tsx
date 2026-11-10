"use client";

import { ArrowLeftRight, Repeat } from "lucide-react";
import { useMemo, useState } from "react";
import { UNCATEGORIZED } from "@/lib/calc/stats";
import { formatDate } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import type { Transaction } from "@/lib/types";
import { useData } from "./DataProvider";
import { TransactionForm } from "./TransactionForm";
import { cx } from "./ui";

/** Llista de moviments agrupada per dia. Cada fila obre el formulari d'edició. */
export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const { accounts, categories } = useData();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const accountName = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const groups = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
    const out: { date: string; items: Transaction[] }[] = [];
    for (const t of sorted) {
      const last = out[out.length - 1];
      if (last?.date === t.date) last.items.push(t);
      else out.push({ date: t.date, items: [t] });
    }
    return out;
  }, [transactions]);

  return (
    <>
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.date}>
            <p className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wide text-muted">{formatDate(g.date)}</p>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
              {g.items.map((t) => {
                const cat = t.category_id ? categoryMap.get(t.category_id) : undefined;
                const isTransfer = t.kind === "transfer";
                const title = t.description || (isTransfer ? "Transferència" : (cat?.name ?? UNCATEGORIZED.name));
                const sub = isTransfer
                  ? `${accountName.get(t.account_id) ?? "?"} → ${accountName.get(t.transfer_account_id ?? "") ?? "?"}`
                  : `${cat?.name ?? UNCATEGORIZED.name} · ${accountName.get(t.account_id) ?? "?"}`;
                return (
                  <li key={t.id}>
                    <button onClick={() => setEditing(t)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-2">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full text-lg" style={{ background: `${isTransfer ? "#64748b" : (cat?.color ?? UNCATEGORIZED.color)}26` }} aria-hidden>
                        {isTransfer ? <ArrowLeftRight size={18} /> : (cat?.icon ?? UNCATEGORIZED.icon)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 truncate font-medium">
                          <span className="truncate">{title}</span>
                          {t.recurring_rule_id && <Repeat size={13} className="shrink-0 text-muted" aria-label="Recurrent" />}
                        </span>
                        <span className="block truncate text-xs text-muted">{sub}</span>
                      </span>
                      <span className={cx("num shrink-0 font-semibold", t.kind === "income" && "text-income", t.kind === "expense" && "text-expense")}>
                        {t.kind === "income" ? "+" : t.kind === "expense" ? "−" : ""}{formatCents(t.amount_cents)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {editing && <TransactionForm existing={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
