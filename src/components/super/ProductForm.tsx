"use client";

import { useState } from "react";
import { todayISO } from "@/lib/dates";
import { centsToInput, parseAmountToCents } from "@/lib/money";
import type { Product } from "@/lib/types";
import { useData } from "../DataProvider";
import { Button, ErrorNote, Field, inputClass, Modal, useAction } from "../ui";

/** Afegir o editar un producte del catàleg del súper. */
export function ProductForm({ existing, onClose }: { existing?: Product; onClose: () => void }) {
  const { products, insert, update } = useData();
  const [name, setName] = useState(existing?.name ?? "");
  const [price, setPrice] = useState(existing ? centsToInput(existing.price_cents) : "");
  const [byWeight, setByWeight] = useState(existing?.by_weight ?? false);
  const { busy, error, setError, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    const cents = parseAmountToCents(price);
    if (!clean) return setError("Posa-li un nom.");
    if (cents === null || cents < 0) return setError("Escriu un preu vàlid.");
    if (products.some((p) => p.id !== existing?.id && p.name.toLowerCase() === clean.toLowerCase())) {
      return setError("Ja tens un producte amb aquest nom.");
    }
    const row = { name: clean, by_weight: byWeight, archived: false, ...(cents !== existing?.price_cents && { price_cents: cents, price_date: todayISO() }) };
    void run(async () => {
      if (existing) await update("products", existing.id, row);
      else await insert("products", { ...row, price_cents: cents, price_date: todayISO() });
      onClose();
    });
  };

  return (
    <Modal title={existing ? "Editar producte" : "Nou producte"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nom">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Ex.: Formatge tendre" autoFocus={!existing} required />
        </Field>
        <Field label={byWeight ? "Preu de l'últim paquet (€)" : "Preu (€)"} hint={byWeight ? "És orientatiu: a cada compra hi posaràs l'import de l'etiqueta." : undefined}>
          <input className={`${inputClass} num`} inputMode="decimal" placeholder="0,00" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </Field>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" className="size-5 accent-[var(--color-primary)]" checked={byWeight} onChange={(e) => setByWeight(e.target.checked)} />
          Es ven a pes (carn, peix, fruita…)
        </label>
        <ErrorNote message={error} />
        <div className="flex gap-2 pt-1">
          {existing && (
            <Button type="button" variant="danger" disabled={busy}
              onClick={() => confirm("Vols treure'l del catàleg? Les compres antigues el continuaran mostrant.") && void run(async () => { await update("products", existing.id, { archived: true }); onClose(); })}>
              Treu-lo
            </Button>
          )}
          <Button type="submit" disabled={busy} className="flex-1">{busy ? "Desant…" : "Desar"}</Button>
        </div>
      </form>
    </Modal>
  );
}
