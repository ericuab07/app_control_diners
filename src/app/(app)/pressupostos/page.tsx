"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useData } from "@/components/DataProvider";
import { Button, Card, EmptyState, ErrorNote, Field, inputClass, Modal, MonthPicker, PageHeader, ProgressBar, useAction } from "@/components/ui";
import { budgetStatuses, type BudgetStatus } from "@/lib/calc/budgets";
import { currentMonthKey, todayISO } from "@/lib/dates";
import { centsToInput, formatCents, formatPercent, parseAmountToCents } from "@/lib/money";
import type { Budget } from "@/lib/types";

const GLOBAL = "__global__";

function BudgetForm({ existing, onClose }: { existing?: Budget; onClose: () => void }) {
  const { budgets, categories, insert, update, remove } = useData();
  const used = new Set(budgets.map((b) => b.category_id ?? GLOBAL));
  const options = [
    { id: GLOBAL, label: "🌍 Global (totes les despeses)" },
    ...categories.filter((c) => c.kind === "expense").map((c) => ({ id: c.id, label: `${c.icon} ${c.name}` })),
  ].filter((o) => !used.has(o.id) || o.id === (existing ? (existing.category_id ?? GLOBAL) : ""));
  const [target, setTarget] = useState(existing ? (existing.category_id ?? GLOBAL) : (options[0]?.id ?? ""));
  const [amount, setAmount] = useState(existing ? centsToInput(existing.amount_cents) : "");
  const { busy, error, setError, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cents = parseAmountToCents(amount);
    if (!cents || cents <= 0) return setError("Escriu un límit més gran que zero.");
    void run(async () => {
      if (existing) await update("budgets", existing.id, { amount_cents: cents });
      else await insert("budgets", { category_id: target === GLOBAL ? null : target, amount_cents: cents });
      onClose();
    });
  };

  return (
    <Modal title={existing ? "Editar pressupost" : "Nou pressupost"} onClose={onClose}>
      {options.length === 0 ? (
        <p className="text-sm text-muted">Ja tens un pressupost per a cada categoria.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="S'aplica a">
            <select className={inputClass} value={target} onChange={(e) => setTarget(e.target.value)} disabled={!!existing}>
              {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Límit mensual (€)">
            <input className={`${inputClass} num text-lg font-semibold`} inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus />
          </Field>
          <ErrorNote message={error} />
          <div className="flex gap-2">
            {existing && (
              <Button type="button" variant="danger" disabled={busy}
                onClick={() => confirm("Vols esborrar aquest pressupost?") && void run(async () => { await remove("budgets", existing.id); onClose(); })}>
                Esborrar
              </Button>
            )}
            <Button type="submit" disabled={busy} className="flex-1">Desar</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function BudgetRow({ status, label, onEdit }: { status: BudgetStatus; label: string; onEdit: () => void }) {
  const { spent, remaining, ratio, level, projected, budget } = status;
  return (
    <button onClick={onEdit} className="block w-full rounded-2xl border border-border bg-surface p-4 text-left hover:bg-surface-2">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="truncate font-medium">{label}</span>
        <span className="num shrink-0 text-sm"><strong>{formatCents(spent)}</strong> <span className="text-muted">de {formatCents(budget.amount_cents)}</span></span>
      </div>
      <ProgressBar ratio={ratio} level={level} />
      <div className="num mt-2 flex flex-wrap justify-between gap-x-3 text-xs">
        <span className={level === "over" ? "font-medium text-expense" : level === "warn" ? "font-medium text-warn" : "text-muted"}>
          {level === "over" ? `Superat per ${formatCents(-remaining)}` : `Queden ${formatCents(remaining)} · ${formatPercent(ratio, 0)} gastat`}
        </span>
        {projected !== null && (
          <span className={projected > budget.amount_cents ? "text-warn" : "text-muted"}>Previsió a final de mes: {formatCents(projected)}</span>
        )}
      </div>
    </button>
  );
}

export default function BudgetsPage() {
  const { budgets, transactions, categories } = useData();
  const [month, setMonth] = useState(currentMonthKey());
  const [form, setForm] = useState<{ existing?: Budget } | null>(null);
  const statuses = useMemo(() => budgetStatuses(budgets, transactions, month, todayISO()), [budgets, transactions, month]);
  const catLabel = new Map(categories.map((c) => [c.id, `${c.icon} ${c.name}`]));
  const global = statuses.find((s) => s.budget.category_id === null);
  const perCategory = statuses.filter((s) => s.budget.category_id !== null).sort((a, b) => b.ratio - a.ratio);

  return (
    <>
      <PageHeader title="Pressupostos" subtitle="Límits mensuals de despesa" action={<Button onClick={() => setForm({})}><Plus size={18} /> Pressupost</Button>} />
      <div className="mb-4"><MonthPicker value={month} onChange={setMonth} /></div>
      {budgets.length === 0 ? (
        <EmptyState title="Encara no has definit cap pressupost" hint="Posa un límit global per a tot el mes i límits per a les categories on vulguis controlar més la despesa. T'avisarem quan arribis al 80 % i al 100 %."
          action={<Button onClick={() => setForm({})}><Plus size={18} /> Crear pressupost</Button>} />
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 font-semibold">Global</h2>
            {global ? <BudgetRow status={global} label="🌍 Totes les despeses" onEdit={() => setForm({ existing: global.budget })} />
              : <Card><p className="text-sm text-muted">Sense pressupost global. Afegeix-ne un per limitar la despesa total del mes.</p></Card>}
          </div>
          {perCategory.length > 0 && (
            <div>
              <h2 className="mb-3 font-semibold">Per categoria</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {perCategory.map((s) => (
                  <BudgetRow key={s.budget.id} status={s} label={catLabel.get(s.budget.category_id!) ?? "Categoria"} onEdit={() => setForm({ existing: s.budget })} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {form && <BudgetForm existing={form.existing} onClose={() => setForm(null)} />}
    </>
  );
}
