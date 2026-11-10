"use client";

import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { normalizeDescription } from "@/lib/calc/csv";
import { currentMonthKey, monthKey } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { useData } from "./DataProvider";
import { TransactionForm } from "./TransactionForm";
import { TransactionList } from "./TransactionList";
import { Button, EmptyState, inputClass, MonthPicker, PageHeader, Segmented } from "./ui";

const COPY = {
  income: { title: "Ingressos", total: "Total ingressat", add: "Nou ingrés", empty: "Cap ingrés en aquest període" },
  expense: { title: "Despeses", total: "Total gastat", add: "Nova despesa", empty: "Cap despesa en aquest període" },
};

export function TransactionsPage({ kind }: { kind: "income" | "expense" }) {
  const { transactions, categories, accounts } = useData();
  const copy = COPY[kind];
  const [scope, setScope] = useState<"month" | "all">("month");
  const [month, setMonth] = useState(currentMonthKey());
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = normalizeDescription(query);
    const catName = new Map(categories.map((c) => [c.id, c.name]));
    return transactions.filter((t) => {
      if (t.kind !== kind) return false;
      if (scope === "month" && monthKey(t.date) !== month) return false;
      if (categoryId === "none" ? t.category_id !== null : categoryId && t.category_id !== categoryId) return false;
      if (accountId && t.account_id !== accountId) return false;
      if (q && !normalizeDescription(`${t.description} ${catName.get(t.category_id ?? "") ?? ""}`).includes(q)) return false;
      return true;
    });
  }, [transactions, categories, kind, scope, month, query, categoryId, accountId]);

  const total = filtered.reduce((s, t) => s + t.amount_cents, 0);

  return (
    <>
      <PageHeader title={copy.title} action={<Button onClick={() => setAdding(true)}><Plus size={18} /> {copy.add}</Button>} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-44"><Segmented value={scope} onChange={setScope} options={[{ value: "month", label: "Per mes" }, { value: "all", label: "Tot" }]} /></div>
        {scope === "month" && <MonthPicker value={month} onChange={setMonth} />}
      </div>
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className={`${inputClass} pl-9`} placeholder="Cercar per concepte o categoria" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Cercar" />
        </div>
        <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="Categoria">
          <option value="">Totes les categories</option>
          {categories.filter((c) => c.kind === kind).map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          <option value="none">Sense categoria</option>
        </select>
        <select className={inputClass} value={accountId} onChange={(e) => setAccountId(e.target.value)} aria-label="Compte">
          <option value="">Tots els comptes</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <div className="mb-4 flex items-baseline justify-between rounded-2xl border border-border bg-surface px-4 py-3">
        <span className="text-sm text-muted">{copy.total} · {filtered.length} {filtered.length === 1 ? "moviment" : "moviments"}</span>
        <span className={`num text-xl font-semibold ${kind === "income" ? "text-income" : "text-expense"}`}>{formatCents(total)}</span>
      </div>
      {filtered.length === 0 ? (
        <EmptyState title={copy.empty} hint="Afegeix-ne un amb el botó, o importa l'extracte del banc des de Configuració." />
      ) : (
        <TransactionList transactions={filtered} />
      )}
      {adding && <TransactionForm defaultKind={kind} onClose={() => setAdding(false)} />}
    </>
  );
}
