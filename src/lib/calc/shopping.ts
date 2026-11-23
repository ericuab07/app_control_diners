import type { Product, PurchaseItem, Transaction } from "../types";

/** Línia de la cistella mentre fas la compra (encara no desada). */
export interface CartLine {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  /** A pes: una sola línia i l'import es posa a mà (l'últim preu és només un suggeriment). */
  byWeight: boolean;
}

export function addProduct(cart: CartLine[], product: Product): CartLine[] {
  const existing = cart.find((l) => l.productId === product.id);
  if (existing) {
    if (existing.byWeight) return cart;
    return cart.map((l) => (l === existing ? { ...l, quantity: l.quantity + 1 } : l));
  }
  return [...cart, { productId: product.id, name: product.name, quantity: 1, unitPriceCents: product.price_cents, byWeight: product.by_weight }];
}

export function setQuantity(cart: CartLine[], productId: string, quantity: number): CartLine[] {
  if (quantity <= 0) return cart.filter((l) => l.productId !== productId);
  return cart.map((l) => (l.productId === productId ? { ...l, quantity } : l));
}

export function setLinePrice(cart: CartLine[], productId: string, cents: number): CartLine[] {
  return cart.map((l) => (l.productId === productId ? { ...l, unitPriceCents: cents } : l));
}

export function cartTotal(cart: CartLine[]): number {
  return cart.reduce((sum, l) => sum + l.quantity * l.unitPriceCents, 0);
}

/** Productes del catàleg que s'han d'actualitzar perquè a la compra han tingut un altre preu. */
export function priceChanges(cart: CartLine[], products: Product[]): { id: string; price_cents: number }[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  return cart
    .filter((l) => byId.has(l.productId) && byId.get(l.productId)!.price_cents !== l.unitPriceCents)
    .map((l) => ({ id: l.productId, price_cents: l.unitPriceCents }));
}

export function purchaseDescription(cart: CartLine[], max = 3): string {
  const names = cart.slice(0, max).map((l) => l.name).join(", ");
  const rest = cart.length - max;
  return `Súper: ${names}${rest > 0 ? ` i ${rest} més` : ""}`;
}

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Catàleg per triar: sense arxivats, filtrat per la cerca, primer el que més compres. */
export function catalogOrder(products: Product[], items: PurchaseItem[], query: string): Product[] {
  const q = fold(query);
  const count = new Map<string, number>();
  for (const i of items) if (i.product_id) count.set(i.product_id, (count.get(i.product_id) ?? 0) + 1);
  return products
    .filter((p) => !p.archived && (!q || fold(p.name).includes(q)))
    .sort((a, b) => (count.get(b.id) ?? 0) - (count.get(a.id) ?? 0) || a.name.localeCompare(b.name, "ca"));
}

export interface Purchase {
  transaction: Transaction;
  items: PurchaseItem[];
}

/** Compres desades (moviments que tenen línies), de la més recent a la més antiga. */
export function purchasesOf(transactions: Transaction[], items: PurchaseItem[]): Purchase[] {
  const byTx = new Map<string, PurchaseItem[]>();
  for (const i of items) byTx.set(i.transaction_id, [...(byTx.get(i.transaction_id) ?? []), i]);
  return transactions
    .filter((t) => byTx.has(t.id))
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
    .map((transaction) => ({ transaction, items: byTx.get(transaction.id)! }));
}
