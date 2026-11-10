"use client";

import Link from "next/link";
import { useState } from "react";
import { todayISO } from "@/lib/dates";
import { centsToInput, parseAmountToCents } from "@/lib/money";
import type { Transaction, TxKind } from "@/lib/types";
import { useData } from "./DataProvider";
import { Button, ErrorNote, Field, inputClass, Modal, Segmented, useAction } from "./ui";

const KIND_OPTIONS: { value: TxKind; label: string }[] = [
  { value: "expense", label: "Despesa" },
  { value: "income", label: "Ingrés" },
  { value: "transfer", label: "Transferència" },
];

export function TransactionForm({ existing, defaultKind = "expense", onClose }: { existing?: Transaction; defaultKind?: TxKind; onClose: () => void }) {
  const { accounts, categories, insert, update, remove } = useData();
  const active = accounts.filter((a) => !a.archived || a.id === existing?.account_id || a.id === existing?.transfer_account_id);
  const [kind, setKind] = useState<TxKind>(existing?.kind ?? defaultKind);
  const [amount, setAmount] = useState(existing ? centsToInput(existing.amount_cents) : "");
  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [description, setDescription] = useState(existing?.description ?? "");
  const [accountId, setAccountId] = useState(existing?.account_id ?? active[0]?.id ?? "");
  const [toAccountId, setToAccountId] = useState(existing?.transfer_account_id ?? active[1]?.id ?? "");
  const [categoryId, setCategoryId] = useState(existing?.category_id ?? "");
  const { busy, error, setError, run } = useAction();

  const kindCategories = categories.filter((c) => c.kind === kind);

  if (active.length === 0) {
    return (
      <Modal title="Nou moviment" onClose={onClose}>
        <p className="text-sm text-muted">Abans d&apos;apuntar moviments has de crear almenys un compte (corrent, estalvis, efectiu…).</p>
        <Link href="/configuracio" onClick={onClose} className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-fg">
          Crear un compte
        </Link>
      </Modal>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cents = parseAmountToCents(amount);
    if (!cents || cents <= 0) return setError("Escriu un import més gran que zero.");
    if (kind === "transfer" && (!toAccountId || toAccountId === accountId)) {
      return setError("Tria un compte de destí diferent del d'origen.");
    }
    const row = {
      kind,
      amount_cents: cents,
      date,
      description: description.trim(),
      account_id: accountId,
      transfer_account_id: kind === "transfer" ? toAccountId : null,
      category_id: kind === "transfer" ? null : kindCategories.some((c) => c.id === categoryId) ? categoryId : null,
    };
    void run(async () => {
      if (existing) await update("transactions", existing.id, row);
      else await insert("transactions", row);
      onClose();
    });
  };

  return (
    <Modal title={existing ? "Editar moviment" : "Nou moviment"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Segmented value={kind} options={KIND_OPTIONS} onChange={setKind} />
        <Field label="Import (€)">
          <input className={`${inputClass} num text-lg font-semibold`} inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus={!existing} required />
        </Field>
        <Field label="Concepte">
          <input className={inputClass} placeholder={kind === "transfer" ? "Opcional" : "Ex.: compra setmanal"} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={kind === "transfer" ? "Des de" : "Compte"}>
            <select className={inputClass} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {active.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          {kind === "transfer" ? (
            <Field label="Cap a">
              <select className={inputClass} value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
                <option value="">Tria…</option>
                {active.filter((a) => a.id !== accountId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
          ) : (
            <Field label="Categoria">
              <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Sense categoria</option>
                {kindCategories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </Field>
          )}
        </div>
        <Field label="Data">
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <ErrorNote message={error} />
        <div className="flex gap-2 pt-1">
          {existing && (
            <Button type="button" variant="danger" disabled={busy}
              onClick={() => confirm("Vols esborrar aquest moviment?") && void run(async () => { await remove("transactions", existing.id); onClose(); })}>
              Esborrar
            </Button>
          )}
          <Button type="submit" disabled={busy} className="flex-1">{busy ? "Desant…" : "Desar"}</Button>
        </div>
      </form>
    </Modal>
  );
}
