"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { dueOccurrences } from "@/lib/calc/recurring";
import { formatDate, todayISO } from "@/lib/dates";
import { FREQUENCY_LABELS } from "@/lib/defaults";
import { centsToInput, formatCents, parseAmountToCents } from "@/lib/money";
import type { CategoryKind, Frequency, RecurringRule } from "@/lib/types";
import { useData } from "../DataProvider";
import { Button, EmptyState, ErrorNote, Field, inputClass, Modal, Segmented, useAction } from "../ui";

function RuleForm({ existing, onClose }: { existing?: RecurringRule; onClose: () => void }) {
  const { accounts, categories, insert, update, remove, reload } = useData();
  const active = accounts.filter((a) => !a.archived || a.id === existing?.account_id);
  const [kind, setKind] = useState<CategoryKind>(existing?.kind ?? "expense");
  const [amount, setAmount] = useState(existing ? centsToInput(existing.amount_cents) : "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [accountId, setAccountId] = useState(existing?.account_id ?? active[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(existing?.category_id ?? "");
  const [frequency, setFrequency] = useState<Frequency>(existing?.frequency ?? "monthly");
  const [startDate, setStartDate] = useState(existing?.start_date ?? todayISO());
  const [endDate, setEndDate] = useState(existing?.end_date ?? "");
  const [isActive, setIsActive] = useState(existing?.active ?? true);
  const { busy, error, setError, run } = useAction();
  const kindCategories = categories.filter((c) => c.kind === kind);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cents = parseAmountToCents(amount);
    if (!cents || cents <= 0) return setError("Escriu un import més gran que zero.");
    if (!accountId) return setError("Tria un compte.");
    if (endDate && endDate < startDate) return setError("La data final ha de ser posterior a la d'inici.");
    const base = {
      kind, amount_cents: cents, description: description.trim(), account_id: accountId,
      category_id: kindCategories.some((c) => c.id === categoryId) ? categoryId : null,
      end_date: endDate || null, active: isActive,
    };
    void run(async () => {
      // La periodicitat i l'inici només es fixen en crear: canviar-los reescriuria moviments ja generats.
      if (existing) await update("recurring_rules", existing.id, base);
      else await insert("recurring_rules", { ...base, frequency, start_date: startDate, next_date: startDate });
      await reload(); // genera ara els moviments que ja toquin
      onClose();
    });
  };

  return (
    <Modal title={existing ? "Editar recurrent" : "Nou moviment recurrent"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Segmented value={kind} onChange={setKind} options={[{ value: "expense", label: "Despesa" }, { value: "income", label: "Ingrés" }]} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Import (€)">
            <input className={`${inputClass} num`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0,00" />
          </Field>
          <Field label="Concepte">
            <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} required maxLength={200} placeholder="Ex.: Lloguer" />
          </Field>
          <Field label="Compte">
            <select className={inputClass} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {active.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="Categoria">
            <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Sense categoria</option>
              {kindCategories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </Field>
          <Field label="Periodicitat">
            <select className={inputClass} value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)} disabled={!!existing}>
              {Object.entries(FREQUENCY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Primera data">
            <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} required disabled={!!existing} />
          </Field>
        </div>
        <Field label="Data final (opcional)">
          <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
        {!existing && startDate < todayISO() && (
          <p className="rounded-lg bg-warn/10 px-3 py-2 text-sm text-warn">
            La primera data és passada: es crearan ara {dueOccurrences({ start_date: startDate, end_date: endDate || null, next_date: startDate, frequency, active: true }, todayISO()).dates.length} moviments endarrerits.
          </p>
        )}
        {existing && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4" /> Activa
          </label>
        )}
        <ErrorNote message={error} />
        <div className="flex gap-2">
          {existing && (
            <Button type="button" variant="danger" disabled={busy}
              onClick={() => confirm("Vols esborrar aquesta regla? Els moviments ja creats es conserven.") && void run(async () => { await remove("recurring_rules", existing.id); onClose(); })}>
              Esborrar
            </Button>
          )}
          <Button type="submit" disabled={busy || active.length === 0} className="flex-1">Desar</Button>
        </div>
      </form>
    </Modal>
  );
}

export function RecurringSection() {
  const { recurring_rules, accounts } = useData();
  const [form, setForm] = useState<{ existing?: RecurringRule } | null>(null);
  const accountName = new Map(accounts.map((a) => [a.id, a.name]));
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Lloguer, subscripcions, nòmina, beca… S&apos;apunten sols cada cop que obres l&apos;app.</p>
        <Button onClick={() => setForm({})} className="shrink-0" disabled={accounts.length === 0}><Plus size={18} /> Recurrent</Button>
      </div>
      {recurring_rules.length === 0 ? (
        <EmptyState title="Cap moviment recurrent" hint={accounts.length === 0 ? "Primer crea un compte." : "Afegeix els cobraments i pagaments que es repeteixen."} />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {recurring_rules.map((r) => (
            <li key={r.id}>
              <button onClick={() => setForm({ existing: r })} className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-surface-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{r.description}{!r.active && <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 text-xs text-muted">pausada</span>}</span>
                  <span className="block truncate text-xs text-muted">
                    {FREQUENCY_LABELS[r.frequency]} · {accountName.get(r.account_id) ?? "?"} · {r.end_date && r.next_date > r.end_date ? "finalitzada" : `propera: ${formatDate(r.next_date)}`}
                  </span>
                </span>
                <span className={`num font-semibold ${r.kind === "income" ? "text-income" : "text-expense"}`}>{r.kind === "income" ? "+" : "−"}{formatCents(r.amount_cents)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {form && <RuleForm existing={form.existing} onClose={() => setForm(null)} />}
    </>
  );
}
