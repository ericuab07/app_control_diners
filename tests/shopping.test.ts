import { describe, expect, it } from "vitest";
import {
  addProduct, cartTotal, catalogOrder, priceChanges, purchaseDescription, purchasesOf, setLinePrice, setQuantity, type CartLine,
} from "../src/lib/calc/shopping";
import { isDinersPath } from "../src/lib/nav";
import type { Product, PurchaseItem, Transaction } from "../src/lib/types";

const prod = (id: string, name: string, price_cents: number, extra: Partial<Product> = {}): Product => ({
  id, name, price_cents, by_weight: false, archived: false, price_date: "2026-11-20", created_at: "", ...extra,
});
const item = (transaction_id: string, product_id: string | null, name = "x", quantity = 1, unit_price_cents = 100): PurchaseItem => ({
  id: `${transaction_id}-${name}`, transaction_id, product_id, name, quantity, unit_price_cents, created_at: "",
});
const tx = (id: string, date: string): Transaction => ({
  id, account_id: "a", kind: "expense", amount_cents: 1, date, description: "", category_id: null,
  transfer_account_id: null, recurring_rule_id: null, created_at: "",
});

const formatge = prod("f", "Formatge", 349);
const pollastre = prod("p", "Pollastre", 612, { by_weight: true });

describe("cistella", () => {
  it("afegir un producte nou hi posa 1 unitat a l'últim preu", () => {
    expect(addProduct([], formatge)).toEqual([{ productId: "f", name: "Formatge", quantity: 1, unitPriceCents: 349, byWeight: false }]);
  });
  it("tornar-lo a afegir en suma una; un producte a pes no es duplica", () => {
    let cart = addProduct(addProduct([], formatge), formatge);
    expect(cart[0].quantity).toBe(2);
    cart = addProduct(addProduct(cart, pollastre), pollastre);
    expect(cart.find((l) => l.productId === "p")?.quantity).toBe(1);
  });
  it("quantitat 0 treu la línia", () => {
    const cart = addProduct(addProduct([], formatge), pollastre);
    expect(setQuantity(cart, "f", 0).map((l) => l.productId)).toEqual(["p"]);
    expect(setQuantity(cart, "f", 3)[0].quantity).toBe(3);
  });
  it("total = suma de quantitat × preu", () => {
    let cart: CartLine[] = addProduct(addProduct(addProduct([], formatge), formatge), pollastre);
    cart = setLinePrice(cart, "p", 580);
    expect(cartTotal(cart)).toBe(349 * 2 + 580);
  });
});

describe("priceChanges", () => {
  it("només els productes amb preu diferent del catàleg", () => {
    const cart = setLinePrice(addProduct(addProduct([], formatge), pollastre), "p", 580);
    expect(priceChanges(cart, [formatge, pollastre])).toEqual([{ id: "p", price_cents: 580 }]);
  });
});

describe("purchaseDescription", () => {
  it("fins a 3 noms i la resta comptada", () => {
    const names = ["Formatge", "Pernil", "Pollastre", "Llet", "Ous"];
    const cart = names.map((n, i) => addProduct([], prod(String(i), n, 100))[0]);
    expect(purchaseDescription(cart)).toBe("Súper: Formatge, Pernil, Pollastre i 2 més");
    expect(purchaseDescription(cart.slice(0, 2))).toBe("Súper: Formatge, Pernil");
  });
});

describe("catalogOrder", () => {
  const llet = prod("l", "Llet", 95);
  const arxivat = prod("x", "Iogurt", 200, { archived: true });
  it("amaga arxivats, primer els més comprats i després alfabètic", () => {
    const items = [item("t1", "l"), item("t2", "l"), item("t1", "p")];
    expect(catalogOrder([formatge, llet, pollastre, arxivat], items, "").map((p) => p.id)).toEqual(["l", "p", "f"]);
  });
  it("la cerca no distingeix accents ni majúscules", () => {
    const pa = prod("pa", "Pà de pagès", 180);
    expect(catalogOrder([pa, formatge], [], "PA DE PAGES").map((p) => p.id)).toEqual(["pa"]);
  });
});

describe("purchasesOf", () => {
  it("només moviments amb línies, del més recent al més antic", () => {
    const txs = [tx("t1", "2026-11-10"), tx("t2", "2026-11-20"), tx("t3", "2026-11-21")];
    const items = [item("t1", "f", "Formatge"), item("t2", "l", "Llet"), item("t2", "f", "Formatge")];
    const out = purchasesOf(txs, items);
    expect(out.map((p) => p.transaction.id)).toEqual(["t2", "t1"]);
    expect(out[0].items).toHaveLength(2);
  });
});

it("/super és una ruta de Diners", () => {
  expect(isDinersPath("/super")).toBe(true);
});
