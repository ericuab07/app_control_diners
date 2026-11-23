"use client";

import { Pencil, Plus, Search, ShoppingBasket } from "lucide-react";
import { useMemo, useState } from "react";
import { addProduct, cartTotal, catalogOrder, purchasesOf, type CartLine } from "@/lib/calc/shopping";
import { formatDate } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import type { Product } from "@/lib/types";
import { useData } from "../DataProvider";
import { Button, Card, cx, EmptyState, inputClass, PageHeader } from "../ui";
import { CheckoutModal } from "./CheckoutModal";
import { ProductForm } from "./ProductForm";

/** Diners → Súper: tria el que has comprat del catàleg i es desa com una despesa amb la llista. */
export function SuperPage() {
  const { products, purchase_items, transactions } = useData();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [checkout, setCheckout] = useState(false);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [saved, setSaved] = useState(false);

  const catalog = useMemo(() => catalogOrder(products, purchase_items, query), [products, purchase_items, query]);
  const purchases = useMemo(() => purchasesOf(transactions, purchase_items).slice(0, 10), [transactions, purchase_items]);
  const inCart = new Map(cart.map((l) => [l.productId, l]));
  const units = cart.reduce((n, l) => n + l.quantity, 0);

  const add = (p: Product) => { setSaved(false); setCart((c) => addProduct(c, p)); };
  const repeat = (items: typeof purchase_items) => {
    let next: CartLine[] = [];
    for (const i of items) {
      const p = products.find((x) => x.id === i.product_id && !x.archived);
      if (!p) continue;
      next = addProduct(next, p);
      if (!p.by_weight && i.quantity > 1) next = next.map((l) => (l.productId === p.id ? { ...l, quantity: i.quantity } : l));
    }
    setSaved(false);
    setCart(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={cx(cart.length > 0 && "pb-20")}>
      <PageHeader title="Súper" subtitle="Toca el que has comprat i desa-ho com una despesa."
        action={<Button variant="secondary" onClick={() => setEditing("new")}><Plus size={18} /> Producte</Button>} />

      {saved && <p role="status" className="mb-4 rounded-lg bg-income/10 px-3 py-2 text-sm text-income">Compra desada a les despeses.</p>}

      {products.length === 0 ? (
        <EmptyState title="Encara no tens productes"
          hint="Envia la foto d'un tiquet a Claude i els afegirà amb el preu, o afegeix-los tu a mà."
          action={<Button onClick={() => setEditing("new")}><Plus size={18} /> Nou producte</Button>} />
      ) : (
        <>
          <label className="relative mb-3 block">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input type="search" className={`${inputClass} pl-10`} placeholder="Busca un producte" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {catalog.map((p) => {
              const line = inCart.get(p.id);
              return (
                <li key={p.id} className="flex items-center">
                  <button onClick={() => add(p)} className={cx("flex min-h-14 min-w-0 flex-1 items-center gap-3 px-4 py-2 text-left", line && "bg-primary/5")}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{p.name}</span>
                      <span className="num block text-xs text-muted">{p.by_weight ? `a pes · últim ${formatCents(p.price_cents)}` : formatCents(p.price_cents)}</span>
                    </span>
                    {line ? (
                      <span className="num grid min-w-8 place-items-center rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-fg">
                        {line.byWeight ? "✓" : `×${line.quantity}`}
                      </span>
                    ) : (
                      <Plus size={18} className="text-muted" />
                    )}
                  </button>
                  <button onClick={() => setEditing(p)} aria-label={`Edita ${p.name}`} className="grid size-11 shrink-0 place-items-center text-muted hover:text-text">
                    <Pencil size={16} />
                  </button>
                </li>
              );
            })}
            {catalog.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">Cap producte amb «{query}».</li>}
          </ul>
        </>
      )}

      {purchases.length > 0 && (
        <Card className="mt-6">
          <h2 className="mb-2 font-serif text-xl font-semibold">Últimes compres</h2>
          <ul className="divide-y divide-border">
            {purchases.map(({ transaction: t, items }) => (
              <li key={t.id}>
                <details className="group py-2">
                  <summary className="flex cursor-pointer list-none items-center gap-3 py-1">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{formatDate(t.date)}</span>
                      <span className="block text-xs text-muted">{items.length} productes</span>
                    </span>
                    <span className="num font-medium text-expense">−{formatCents(t.amount_cents)}</span>
                  </summary>
                  <ul className="mt-1 space-y-1 text-sm">
                    {items.map((i) => (
                      <li key={i.id} className="flex justify-between gap-3 text-muted">
                        <span className="min-w-0 truncate">{i.quantity > 1 && `${i.quantity} × `}{i.name}</span>
                        <span className="num">{formatCents(i.quantity * i.unit_price_cents)}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="ghost" className="mt-2 -ml-3" onClick={() => repeat(items)}>
                    <ShoppingBasket size={16} /> Torna a comprar el mateix
                  </Button>
                </details>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {cart.length > 0 && (
        <button onClick={() => setCheckout(true)}
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 right-24 z-30 flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-text px-4 text-surface shadow-lg md:left-auto md:right-8 md:w-96">
          <span className="text-sm">{units} {units === 1 ? "producte" : "productes"}</span>
          <span className="num font-semibold">{formatCents(cartTotal(cart))} · Revisa</span>
        </button>
      )}

      {checkout && (
        <CheckoutModal cart={cart} onChange={setCart} onClose={() => setCheckout(false)}
          onDone={() => { setCart([]); setCheckout(false); setSaved(true); }} />
      )}
      {editing && <ProductForm existing={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
