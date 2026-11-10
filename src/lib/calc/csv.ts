import Papa from "papaparse";
import type { Category, Transaction } from "../types";
import { parseFlexibleDate } from "../dates";
import { parseAmountToCents } from "../money";

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

/** Llegeix un CSV detectant el separador (`,` `;` o tabulador). La primera fila són capçaleres. */
export function parseCsv(text: string): ParsedCsv {
  const result = Papa.parse<string[]>(text.replace(/^﻿/, ""), { skipEmptyLines: "greedy" });
  const all = result.data.filter((r) => r.some((c) => c.trim() !== ""));
  if (all.length === 0) return { headers: [], rows: [] };
  const [headers, ...rows] = all;
  return { headers: headers.map((h) => h.trim()), rows };
}

export interface ColumnMapping {
  date: number;
  description: number;
  /** Columna amb l'import amb signe (negatiu = despesa)... */
  amount: number;
  /** ...o bé dues columnes separades de càrrec i abonament (-1 si no n'hi ha). */
  debit: number;
  credit: number;
}

const HINTS: Record<keyof ColumnMapping, RegExp> = {
  date: /^(data|fecha|date|f\.? ?valor|data operaci)/i,
  description: /(concepte|concepto|descrip|description|detall|detalle|movim)/i,
  amount: /(import|importe|amount|quantitat|cantidad)/i,
  debit: /(c[aà]rrec|cargo|debit|d[eè]bit|deure|debe)/i,
  credit: /(abonament|abono|credit|cr[eè]dit|haver|haber)/i,
};

export function guessMapping(headers: string[]): ColumnMapping {
  const find = (re: RegExp) => headers.findIndex((h) => re.test(h));
  return {
    date: find(HINTS.date),
    description: find(HINTS.description),
    amount: find(HINTS.amount),
    debit: find(HINTS.debit),
    credit: find(HINTS.credit),
  };
}

export interface ImportRow {
  line: number;
  date: string;
  kind: "income" | "expense";
  amount_cents: number;
  description: string;
}

export interface ImportResult {
  rows: ImportRow[];
  errors: { line: number; reason: string }[];
}

export function buildImportRows(csv: ParsedCsv, mapping: ColumnMapping): ImportResult {
  const rows: ImportRow[] = [];
  const errors: ImportResult["errors"] = [];
  csv.rows.forEach((r, i) => {
    const line = i + 2;
    const date = parseFlexibleDate(r[mapping.date] ?? "");
    if (!date) return void errors.push({ line, reason: "Data no vàlida" });
    let signed: number | null = null;
    if (mapping.amount >= 0) {
      signed = parseAmountToCents(r[mapping.amount] ?? "");
    } else {
      const debit = mapping.debit >= 0 ? parseAmountToCents(r[mapping.debit] ?? "") : null;
      const credit = mapping.credit >= 0 ? parseAmountToCents(r[mapping.credit] ?? "") : null;
      if (credit) signed = Math.abs(credit);
      else if (debit) signed = -Math.abs(debit);
    }
    if (signed === null || signed === 0) return void errors.push({ line, reason: "Import no vàlid" });
    rows.push({
      line,
      date,
      kind: signed > 0 ? "income" : "expense",
      amount_cents: Math.abs(signed),
      description: (r[mapping.description] ?? "").trim().replace(/\s+/g, " "),
    });
  });
  return { rows, errors };
}

export function normalizeDescription(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type Keyable = Pick<Transaction, "date" | "kind" | "amount_cents" | "description">;

export function dedupeKey(t: Keyable): string {
  return `${t.date}|${t.kind}|${t.amount_cents}|${normalizeDescription(t.description)}`;
}

/** Marca com a duplicades les files que ja existeixen al compte (mateixa data, import i concepte). */
export function findDuplicates(rows: ImportRow[], existing: Keyable[]): Set<number> {
  const counts = new Map<string, number>();
  for (const t of existing) counts.set(dedupeKey(t), (counts.get(dedupeKey(t)) ?? 0) + 1);
  const dupes = new Set<number>();
  for (const row of rows) {
    const key = dedupeKey(row);
    const left = counts.get(key) ?? 0;
    if (left > 0) {
      dupes.add(row.line);
      counts.set(key, left - 1);
    }
  }
  return dupes;
}

const KEYWORDS: [RegExp, string][] = [
  [/mercadona|carrefour|lidl|aldi|bonpreu|condis|consum|caprabo|dia |supermerc|esclat/, "Supermercat"],
  [/restaurant|bar |cafe|burger|pizza|glovo|just eat|uber eats|mcdonald|kebab|sushi/, "Restaurants"],
  [/renfe|tmb|rodalies|fgc|metro|bus |taxi|cabify|bolt|uber|gasolin|repsol|cepsa|bicing|parking/, "Transport"],
  [/lloguer|alquiler|comunitat|hipoteca/, "Habitatge"],
  [/endesa|iberdrola|naturgy|aigues|agbar|llum|gas |movistar|vodafone|orange|digi|internet|fibra/, "Subministraments"],
  [/netflix|spotify|hbo|disney|prime video|youtube|icloud|google one|chatgpt|claude|subscrip/, "Subscripcions"],
  [/farmacia|clinica|dentista|hospital|optica|metge/, "Salut"],
  [/uab|universitat|matricula|llibre|abacus|curs|udemy/, "Estudis"],
  [/cinema|concert|teatre|steam|playstation|festa|entrades|ticketmaster/, "Oci"],
  [/zara|h m|pull bear|bershka|decathlon|nike|adidas|primark|mango/, "Roba"],
  [/nomina|salari|sou /, "Nòmina"],
  [/beca/, "Beca"],
  [/bizum/, "Bizum"],
];

/**
 * Suggereix una categoria per a un concepte: primer la que l'usuari ha fet servir
 * abans per al mateix concepte, després paraules clau conegudes.
 */
export function suggestCategory(
  description: string,
  kind: "income" | "expense",
  history: Pick<Transaction, "description" | "category_id" | "kind">[],
  categories: Category[],
): string | null {
  const norm = normalizeDescription(description);
  if (!norm) return null;
  const valid = new Set(categories.filter((c) => c.kind === kind).map((c) => c.id));
  const votes = new Map<string, number>();
  for (const t of history) {
    if (t.kind !== kind || !t.category_id || !valid.has(t.category_id)) continue;
    if (normalizeDescription(t.description) === norm) {
      votes.set(t.category_id, (votes.get(t.category_id) ?? 0) + 1);
    }
  }
  if (votes.size > 0) return [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const padded = `${norm} `;
  for (const [re, name] of KEYWORDS) {
    if (!re.test(padded)) continue;
    const cat = categories.find((c) => c.kind === kind && c.name === name);
    if (cat) return cat.id;
  }
  return null;
}
