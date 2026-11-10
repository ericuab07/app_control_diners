import { describe, expect, it } from "vitest";
import { accountBalances, totalBalance } from "../src/lib/calc/balances";
import { budgetStatuses } from "../src/lib/calc/budgets";
import { buildImportRows, findDuplicates, guessMapping, parseCsv, suggestCategory } from "../src/lib/calc/csv";
import { computePositions, valuePortfolio } from "../src/lib/calc/portfolio";
import { dueOccurrences, occurrence } from "../src/lib/calc/recurring";
import { byCategory, monthlyTotals, totals } from "../src/lib/calc/stats";
import { parseFlexibleDate } from "../src/lib/dates";
import { parseAmountToCents } from "../src/lib/money";
import type { Account, Category, Trade, Transaction } from "../src/lib/types";

const account = (id: string, initial = 0): Account => ({
  id, name: id, type: "checking", initial_balance_cents: initial, color: "#000", archived: false, created_at: "",
});
let seq = 0;
const tx = (p: Partial<Transaction>): Transaction => ({
  id: `t${seq++}`, account_id: "a", kind: "expense", amount_cents: 100, date: "2026-01-15", description: "",
  category_id: null, transfer_account_id: null, recurring_rule_id: null, created_at: "", ...p,
});
const trade = (p: Partial<Trade>): Trade => ({
  id: `tr${seq++}`, symbol: "AAPL", name: "Apple", side: "buy", quantity: 1, price: 100, currency: "USD",
  fx_rate: 1, fee_cents: 0, date: "2026-01-10", account_id: null, ...p,
});

describe("parseAmountToCents", () => {
  it.each([
    ["12,50", 1250], ["12.50", 1250], ["1.234,56", 123456], ["1,234.56", 123456], ["-45", -4500],
    ["1.234", 123400], ["12 €", 1200], ["(7,25)", -725], ["0,1", 10], ["1.000.000", 100000000], ["45,00-", -4500],
  ])("%s → %d", (input, cents) => expect(parseAmountToCents(input)).toBe(cents));
  it("rebutja text sense xifres", () => {
    expect(parseAmountToCents("")).toBeNull();
    expect(parseAmountToCents("abc")).toBeNull();
  });
});

describe("parseFlexibleDate", () => {
  it("accepta formats habituals", () => {
    expect(parseFlexibleDate("31/12/2025")).toBe("2025-12-31");
    expect(parseFlexibleDate("1-2-25")).toBe("2025-02-01");
    expect(parseFlexibleDate("2025-12-31 10:00")).toBe("2025-12-31");
    expect(parseFlexibleDate("31.01.2026")).toBe("2026-01-31");
  });
  it("rebutja dates impossibles", () => {
    expect(parseFlexibleDate("31/02/2025")).toBeNull();
    expect(parseFlexibleDate("hola")).toBeNull();
  });
});

describe("accountBalances", () => {
  const accounts = [account("a", 10000), account("b", 0)];
  const txs = [
    tx({ kind: "income", amount_cents: 50000 }),
    tx({ kind: "expense", amount_cents: 12000 }),
    tx({ kind: "transfer", amount_cents: 20000, transfer_account_id: "b", date: "2026-02-01" }),
  ];
  it("aplica ingressos, despeses i transferències", () => {
    const b = accountBalances(accounts, txs, []);
    expect(b.get("a")).toBe(10000 + 50000 - 12000 - 20000);
    expect(b.get("b")).toBe(20000);
    expect(totalBalance(b)).toBe(48000);
  });
  it("respecta la data límit", () => {
    expect(accountBalances(accounts, txs, [], "2026-01-31").get("b")).toBe(0);
  });
  it("les operacions de borsa mouen l'efectiu del compte", () => {
    const trades = [
      trade({ account_id: "a", quantity: 2, price: 100, fx_rate: 0.9, fee_cents: 100 }),
      trade({ account_id: "a", side: "sell", quantity: 1, price: 120, fx_rate: 0.9, fee_cents: 100, date: "2026-01-20" }),
    ];
    expect(accountBalances(accounts, [], trades).get("a")).toBe(10000 - 18100 + 10700);
  });
});

describe("stats", () => {
  const cats: Category[] = [{ id: "c1", name: "Menjar", kind: "expense", color: "#111", icon: "x" }];
  const txs = [
    tx({ kind: "income", amount_cents: 100000 }),
    tx({ amount_cents: 30000, category_id: "c1" }),
    tx({ amount_cents: 10000 }),
    tx({ kind: "transfer", amount_cents: 99999, transfer_account_id: "b" }),
    tx({ amount_cents: 5000, date: "2026-02-03" }),
  ];
  it("ignora transferències i calcula la taxa d'estalvi", () => {
    const t = totals(txs, "2026-01-01", "2026-01-31");
    expect(t).toMatchObject({ income: 100000, expense: 40000, net: 60000 });
    expect(t.savingsRate).toBeCloseTo(0.6);
  });
  it("agrupa per categoria amb 'sense categoria'", () => {
    const s = byCategory(txs, cats, "expense", "2026-01-01", "2026-01-31");
    expect(s.map((x) => [x.name, x.total])).toEqual([["Menjar", 30000], ["Sense categoria", 10000]]);
    expect(s[0].share).toBeCloseTo(0.75);
  });
  it("totals mensuals inclouen mesos buits", () => {
    const m = monthlyTotals(txs, ["2025-12", "2026-01", "2026-02"]);
    expect(m.map((x) => x.expense)).toEqual([0, 40000, 5000]);
  });
});

describe("budgetStatuses", () => {
  const budgets = [
    { id: "g", category_id: null, amount_cents: 50000 },
    { id: "b1", category_id: "c1", amount_cents: 20000 },
  ];
  const txs = [tx({ amount_cents: 17000, category_id: "c1" }), tx({ amount_cents: 10000 }), tx({ kind: "income", amount_cents: 1 })];
  it("calcula despesa, nivell i projecció", () => {
    const [global, cat] = budgetStatuses(budgets, txs, "2026-01", "2026-01-15");
    expect(global).toMatchObject({ spent: 27000, remaining: 23000, level: "ok" });
    expect(global.projected).toBe(Math.round((27000 / 15) * 31));
    expect(cat).toMatchObject({ spent: 17000, level: "warn" });
  });
  it("marca l'excés i no projecta mesos passats", () => {
    const [, cat] = budgetStatuses(budgets, [...txs, tx({ amount_cents: 4000, category_id: "c1" })], "2026-01", "2026-03-01");
    expect(cat.level).toBe("over");
    expect(cat.projected).toBeNull();
  });
});

describe("recurring", () => {
  it("manté el dia d'inici sense derivar a final de mes", () => {
    expect(occurrence("2026-01-31", "monthly", 1)).toBe("2026-02-28");
    expect(occurrence("2026-01-31", "monthly", 2)).toBe("2026-03-31");
    expect(occurrence("2024-02-29", "yearly", 1)).toBe("2025-02-28");
    expect(occurrence("2026-01-05", "weekly", 2)).toBe("2026-01-19");
  });
  const rule = { start_date: "2026-01-31", end_date: null, next_date: "2026-01-31", frequency: "monthly" as const, active: true };
  it("genera totes les ocurrències pendents", () => {
    expect(dueOccurrences(rule, "2026-04-10")).toEqual({
      dates: ["2026-01-31", "2026-02-28", "2026-03-31"], nextDate: "2026-04-30",
    });
  });
  it("és idempotent un cop avançat next_date", () => {
    expect(dueOccurrences({ ...rule, next_date: "2026-04-30" }, "2026-04-10").dates).toEqual([]);
  });
  it("respecta data final i regles inactives", () => {
    expect(dueOccurrences({ ...rule, end_date: "2026-02-28" }, "2026-06-01").dates).toHaveLength(2);
    expect(dueOccurrences({ ...rule, active: false }, "2026-06-01").dates).toEqual([]);
  });
});

describe("portfolio", () => {
  const trades = [
    trade({ quantity: 10, price: 100, fx_rate: 0.9, fee_cents: 200, date: "2026-01-01" }),
    trade({ quantity: 10, price: 120, fx_rate: 0.9, fee_cents: 200, date: "2026-02-01" }),
    trade({ side: "sell", quantity: 5, price: 150, fx_rate: 0.9, fee_cents: 200, date: "2026-03-01" }),
  ];
  it("cost mitjà ponderat i guany realitzat", () => {
    const [p] = computePositions(trades);
    // cost total: 90000+200 + 108000+200 = 198400 per 20 accions; es venen 5 → cost 49600
    expect(p.quantity).toBe(15);
    expect(p.costBasisCents).toBe(148800);
    expect(p.realizedCents).toBe(67500 - 200 - 49600);
    expect(p.avgCostEur).toBeCloseTo(99.2);
  });
  it("valora amb la cotització i el canvi", () => {
    const quotes = new Map([["AAPL", { symbol: "AAPL", name: "Apple", price: 200, currency: "USD", fx_rate: 0.5, manual: false, fetched_at: "" }]]);
    const s = valuePortfolio(computePositions(trades), quotes);
    expect(s.valueCents).toBe(150000);
    expect(s.unrealizedCents).toBe(1200);
    expect(s.positions[0].weight).toBe(1);
  });
  it("una posició tancada desapareix i sense preu val el cost", () => {
    const closed = computePositions([trade({ quantity: 1 }), trade({ side: "sell", quantity: 1, price: 110, date: "2026-02-01" })]);
    expect(valuePortfolio(closed, new Map())).toMatchObject({ positions: [], valueCents: 0, realizedCents: 1000 });
    expect(valuePortfolio(computePositions([trade({})]), new Map()).unrealizedCents).toBe(0);
  });
});

describe("csv", () => {
  const text = "Data;Concepte;Import\n15/01/2026;MERCADONA BCN;-23,45\n16/01/2026;Nomina gener;1.200,00\nxx;dolent;1\n";
  it("detecta separador, columnes i signe", () => {
    const csv = parseCsv(text);
    const mapping = guessMapping(csv.headers);
    expect(mapping).toMatchObject({ date: 0, description: 1, amount: 2 });
    const { rows, errors } = buildImportRows(csv, mapping);
    expect(rows).toEqual([
      { line: 2, date: "2026-01-15", kind: "expense", amount_cents: 2345, description: "MERCADONA BCN" },
      { line: 3, date: "2026-01-16", kind: "income", amount_cents: 120000, description: "Nomina gener" },
    ]);
    expect(errors).toEqual([{ line: 4, reason: "Data no vàlida" }]);
  });
  it("suporta columnes de càrrec i abonament", () => {
    const csv = parseCsv("Fecha,Concepto,Cargo,Abono\n2026-01-02,Bar,\"3,50\",\n2026-01-03,Beca,,500\n");
    const { rows } = buildImportRows(csv, guessMapping(csv.headers));
    expect(rows.map((r) => [r.kind, r.amount_cents])).toEqual([["expense", 350], ["income", 50000]]);
  });
  it("detecta duplicats una sola vegada per moviment existent", () => {
    const { rows } = buildImportRows(parseCsv(text + "15/01/2026;Mercadona  bcn;-23,45\n"), { date: 0, description: 1, amount: 2, debit: -1, credit: -1 });
    const existing = [tx({ date: "2026-01-15", amount_cents: 2345, description: "mercadona bcn" })];
    expect([...findDuplicates(rows, existing)]).toEqual([2]);
  });
  it("suggereix categoria per historial i per paraules clau", () => {
    const cats: Category[] = [
      { id: "s", name: "Supermercat", kind: "expense", color: "", icon: "" },
      { id: "o", name: "Oci", kind: "expense", color: "", icon: "" },
    ];
    expect(suggestCategory("MERCADONA BCN 123", "expense", [], cats)).toBe("s");
    const history = [tx({ description: "Mercadona BCN 999", category_id: "o" })];
    expect(suggestCategory("MERCADONA BCN 123", "expense", history, cats)).toBe("o");
    expect(suggestCategory("cosa rara", "expense", history, cats)).toBeNull();
  });
});
