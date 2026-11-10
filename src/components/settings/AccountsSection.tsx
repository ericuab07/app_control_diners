"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { accountBalances } from "@/lib/calc/balances";
import { ACCOUNT_TYPE_LABELS, PALETTE } from "@/lib/defaults";
import { centsToInput, formatCents, parseAmountToCents } from "@/lib/money";
import type { Account, AccountType } from "@/lib/types";
import { useData } from "../DataProvider";
import { Button, ColorPicker, EmptyState, ErrorNote, Field, inputClass, Modal, useAction } from "../ui";

function AccountForm({ existing, onClose }: { existing?: Account; onClose: () => void }) {
  const { accounts, insert, update, remove } = useData();
  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState<AccountType>(existing?.type ?? "checking");
  const [initial, setInitial] = useState(existing ? centsToInput(existing.initial_balance_cents) : "");
  const [color, setColor] = useState(existing?.color ?? PALETTE[accounts.length % PALETTE.length]);
  const { busy, error, setError, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cents = initial.trim() === "" ? 0 : parseAmountToCents(initial);
    if (cents === null) return setError("El saldo inicial no és un número vàlid.");
    const row = { name: name.trim(), type, initial_balance_cents: cents, color };
    void run(async () => {
      if (existing) await update("accounts", existing.id, row);
      else await insert("accounts", row);
      onClose();
    });
  };

  return (
    <Modal title={existing ? "Editar compte" : "Nou compte"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nom">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} placeholder="Ex.: Compte corrent" autoFocus={!existing} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipus">
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as AccountType)}>
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Saldo inicial (€)" hint="El que hi tens abans del primer moviment que apuntis.">
            <input className={`${inputClass} num`} inputMode="decimal" value={initial} onChange={(e) => setInitial(e.target.value)} placeholder="0,00" />
          </Field>
        </div>
        <Field label="Color"><ColorPicker value={color} onChange={setColor} /></Field>
        <ErrorNote message={error} />
        <div className="flex flex-wrap gap-2">
          {existing && (
            <>
              <Button type="button" variant="danger" disabled={busy}
                onClick={() => confirm(`Vols esborrar «${existing.name}»? S'esborraran també TOTS els seus moviments. No es pot desfer.`) && void run(async () => { await remove("accounts", existing.id); onClose(); })}>
                Esborrar
              </Button>
              <Button type="button" variant="secondary" disabled={busy}
                onClick={() => void run(async () => { await update("accounts", existing.id, { archived: !existing.archived }); onClose(); })}>
                {existing.archived ? "Desarxivar" : "Arxivar"}
              </Button>
            </>
          )}
          <Button type="submit" disabled={busy} className="flex-1">Desar</Button>
        </div>
      </form>
    </Modal>
  );
}

export function AccountsSection() {
  const { accounts, transactions, trades } = useData();
  const [form, setForm] = useState<{ existing?: Account } | null>(null);
  const balances = useMemo(() => accountBalances(accounts, transactions, trades), [accounts, transactions, trades]);
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted">Els llocs on tens diners. Arxiva els que ja no facis servir per conservar-ne l&apos;historial.</p>
        <Button onClick={() => setForm({})} className="shrink-0"><Plus size={18} /> Compte</Button>
      </div>
      {accounts.length === 0 ? (
        <EmptyState title="Cap compte encara" hint="Crea el primer per començar a apuntar moviments." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {accounts.map((a) => (
            <li key={a.id}>
              <button onClick={() => setForm({ existing: a })} className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-surface-2">
                <span className="size-3 shrink-0 rounded-full" style={{ background: a.color }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{a.name}{a.archived && <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 text-xs text-muted">arxivat</span>}</span>
                  <span className="block text-xs text-muted">{ACCOUNT_TYPE_LABELS[a.type]}</span>
                </span>
                <span className="num font-semibold">{formatCents(balances.get(a.id) ?? 0)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {form && <AccountForm existing={form.existing} onClose={() => setForm(null)} />}
    </>
  );
}
