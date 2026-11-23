"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { cartTotal, priceChanges, purchaseDescription, setLinePrice, setQuantity, type CartLine } from "@/lib/calc/shopping";
import { todayISO } from "@/lib/dates";
import { centsToInput, formatCents, parseAmountToCents } from "@/lib/money";
import { useData } from "../DataProvider";
import { Button, ErrorNote, Field, inputClass, Modal, useAction } from "../ui";

/** Revisa la cistella i la desa com una despesa amb la llista de productes. */
export function CheckoutModal({ cart, onChange, onDone, onClose }: {
  cart: CartLine[];
  onChange: (cart: CartLine[]) => void;
  onDone: () => void;
  onClose: () => void;
}) {
  const { accounts, categories, products, insert, update, remove } = useData();
  const active = accounts.filter((a) => !a.archived);
  const expenseCats = categories.filter((c) => c.kind === "expense");
  const [accountId, setAccountId] = useState(active[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(expenseCats.find((c) => c.name === "Supermercat")?.id ?? "");
  const [date, setDate] = useState(todayISO());
  // Text dels imports a pes mentre s'escriuen («5,» encara no és un número).
  const [priceText, setPriceText] = useState<Record<string, string>>({});
  const { busy, error, setError, run } = useAction();
  const total = cartTotal(cart);

  const editPrice = (productId: string, text: string) => {
    setPriceText((t) => ({ ...t, [productId]: text }));
    const cents = parseAmountToCents(text);
    if (cents !== null && cents >= 0) onChange(setLinePrice(cart, productId, cents));
  };

  const save = () => {
    if (!accountId) return setError("Crea primer un compte a Configuració.");
    if (total <= 0) return setError("La compra ha de sumar més de zero.");
    void run(async () => {
      const [tx] = await insert("transactions", {
        kind: "expense", amount_cents: total, date, description: purchaseDescription(cart),
        account_id: accountId, transfer_account_id: null, category_id: categoryId || null,
      });
      try {
        await insert("purchase_items", cart.map((l) => ({
          transaction_id: tx.id, product_id: l.productId, name: l.name, quantity: l.quantity, unit_price_cents: l.unitPriceCents,
        })));
      } catch (e) {
        await remove("transactions", tx.id); // sense llista no volem una despesa a mitges
        throw e;
      }
      for (const c of priceChanges(cart, products)) await update("products", c.id, { price_cents: c.price_cents, price_date: date });
      onDone();
    });
  };

  return (
    <Modal title="La teva compra" onClose={onClose}>
      <ul className="divide-y divide-border">
        {cart.map((l) => (
          <li key={l.productId} className="flex items-center gap-2 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{l.name}</span>
              {!l.byWeight && <span className="num block text-xs text-muted">{formatCents(l.unitPriceCents)} / u.</span>}
              {l.byWeight && <span className="block text-xs text-muted">A pes: posa l&apos;import</span>}
            </span>
            {l.byWeight ? (
              <>
                <input aria-label={`Import de ${l.name}`} inputMode="decimal" className={`${inputClass.replace("w-full ", "")} num w-24 text-right`}
                  value={priceText[l.productId] ?? centsToInput(l.unitPriceCents)} onChange={(e) => editPrice(l.productId, e.target.value)} />
                <button type="button" onClick={() => onChange(setQuantity(cart, l.productId, 0))} aria-label={`Treu ${l.name}`}
                  className="grid size-9 place-items-center rounded-lg border border-border text-muted"><Minus size={16} /></button>
              </>
            ) : (
              <span className="flex items-center gap-1">
                <button type="button" onClick={() => onChange(setQuantity(cart, l.productId, l.quantity - 1))} aria-label={`Una menys de ${l.name}`}
                  className="grid size-9 place-items-center rounded-lg border border-border"><Minus size={16} /></button>
                <span className="num w-7 text-center font-medium">{l.quantity}</span>
                <button type="button" onClick={() => onChange(setQuantity(cart, l.productId, l.quantity + 1))} aria-label={`Una més de ${l.name}`}
                  className="grid size-9 place-items-center rounded-lg border border-border"><Plus size={16} /></button>
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
        <span className="text-sm text-muted">Total</span>
        <span className="num font-serif text-2xl font-semibold text-expense">{formatCents(total)}</span>
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Compte">
          <select className={inputClass} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {active.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        <Field label="Categoria">
          <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Sense categoria</option>
            {expenseCats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Data">
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
      </div>
      <div className="mt-4 space-y-3">
        <ErrorNote message={error} />
        <Button onClick={save} disabled={busy || cart.length === 0} className="w-full">
          {busy ? "Desant…" : `Desa la compra · ${formatCents(total)}`}
        </Button>
      </div>
    </Modal>
  );
}
