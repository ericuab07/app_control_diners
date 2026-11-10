"use client";

import { useMemo, useState } from "react";
import { buildImportRows, findDuplicates, guessMapping, parseCsv, suggestCategory, type ColumnMapping, type ParsedCsv } from "@/lib/calc/csv";
import { formatDate } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { useData } from "../DataProvider";
import { Button, Card, ErrorNote, Field, inputClass, useAction } from "../ui";

const MAPPING_FIELDS: { key: keyof ColumnMapping; label: string }[] = [
  { key: "date", label: "Data" },
  { key: "description", label: "Concepte" },
  { key: "amount", label: "Import (amb signe)" },
  { key: "debit", label: "Càrrec (si va separat)" },
  { key: "credit", label: "Abonament (si va separat)" },
];

async function readFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer); // molts bancs exporten en Latin-1
  }
}

export function ImportSection() {
  const { accounts, categories, transactions, insert } = useData();
  const active = accounts.filter((a) => !a.archived);
  const [accountId, setAccountId] = useState(active[0]?.id ?? "");
  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
  const [overrides, setOverrides] = useState<Map<number, string>>(new Map());
  const [done, setDone] = useState("");
  const { busy, error, setError, run } = useAction();

  const result = useMemo(() => (csv && mapping && mapping.date >= 0 ? buildImportRows(csv, mapping) : null), [csv, mapping]);
  const duplicates = useMemo(
    () => (result ? findDuplicates(result.rows, transactions.filter((t) => t.account_id === accountId)) : new Set<number>()),
    [result, transactions, accountId],
  );
  const suggestions = useMemo(
    () => new Map((result?.rows ?? []).map((r) => [r.line, suggestCategory(r.description, r.kind, transactions, categories) ?? ""])),
    [result, transactions, categories],
  );

  const isSkipped = (line: number) => skipped.has(line) !== duplicates.has(line); // els duplicats s'ometen per defecte
  const toggle = (line: number) => setSkipped((prev) => {
    const next = new Set(prev);
    if (next.has(line)) next.delete(line); else next.add(line);
    return next;
  });
  const toImport = result?.rows.filter((r) => !isSkipped(r.line)) ?? [];

  const onFile = async (file: File | undefined) => {
    setDone("");
    setError("");
    if (!file) return;
    const parsed = parseCsv(await readFile(file));
    if (parsed.rows.length === 0) return setError("El fitxer és buit o no és un CSV vàlid.");
    setCsv(parsed);
    setMapping(guessMapping(parsed.headers));
    setSkipped(new Set());
    setOverrides(new Map());
  };

  const doImport = () => void run(async () => {
    const rows = toImport.map((r) => ({
      account_id: accountId, kind: r.kind, amount_cents: r.amount_cents, date: r.date, description: r.description,
      category_id: (overrides.get(r.line) ?? suggestions.get(r.line)) || null,
    }));
    for (let i = 0; i < rows.length; i += 500) await insert("transactions", rows.slice(i, i + 500));
    setDone(`S'han importat ${rows.length} moviments.`);
    setCsv(null);
    setMapping(null);
  });

  if (active.length === 0) return <p className="text-sm text-muted">Primer crea un compte on importar els moviments.</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Descarrega l&apos;extracte del teu banc en format CSV i puja&apos;l aquí. Podràs revisar-ho tot abans de desar res.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Compte de destí">
          <select className={inputClass} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {active.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        <Field label="Fitxer CSV">
          <input type="file" accept=".csv,text/csv,text/plain" className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-2 file:py-1 file:text-sm file:text-text`}
            onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
        </Field>
      </div>
      <ErrorNote message={error} />
      {done && <p role="status" className="rounded-lg bg-income/10 px-3 py-2 text-sm text-income">{done}</p>}

      {csv && mapping && (
        <>
          <Card>
            <h3 className="mb-3 font-semibold">Columnes del fitxer</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {MAPPING_FIELDS.map(({ key, label }) => (
                <Field key={key} label={label}>
                  <select className={inputClass} value={mapping[key]} onChange={(e) => setMapping({ ...mapping, [key]: Number(e.target.value) })}>
                    <option value={-1}>—</option>
                    {csv.headers.map((h, i) => <option key={i} value={i}>{h || `Columna ${i + 1}`}</option>)}
                  </select>
                </Field>
              ))}
            </div>
          </Card>

          {result && (
            <Card>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">Previsualització</h3>
                <p className="text-sm text-muted">
                  {toImport.length} per importar · {duplicates.size} possibles duplicats · {result.errors.length} files il·legibles
                </p>
              </div>
              {result.rows.length === 0 ? (
                <p className="text-sm text-muted">No s&apos;ha pogut llegir cap fila. Revisa quines columnes contenen la data i l&apos;import.</p>
              ) : (
                <ul className="max-h-[28rem] divide-y divide-border overflow-y-auto rounded-xl border border-border">
                  {result.rows.map((r) => {
                    const skip = isSkipped(r.line);
                    return (
                      <li key={r.line} className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm ${skip ? "opacity-50" : ""}`}>
                        <input type="checkbox" checked={!skip} onChange={() => toggle(r.line)} className="size-4" aria-label={`Importar fila ${r.line}`} />
                        <span className="min-w-0 flex-1 basis-40">
                          <span className="block truncate font-medium">{r.description || "Sense concepte"}</span>
                          <span className="block text-xs text-muted">{formatDate(r.date)}{duplicates.has(r.line) && <span className="ml-2 text-warn">possible duplicat</span>}</span>
                        </span>
                        <select className="min-h-9 max-w-40 rounded-lg border border-border bg-surface px-2 text-sm" aria-label="Categoria"
                          value={overrides.get(r.line) ?? suggestions.get(r.line) ?? ""} onChange={(e) => setOverrides(new Map(overrides).set(r.line, e.target.value))}>
                          <option value="">Sense categoria</option>
                          {categories.filter((c) => c.kind === r.kind).map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                        </select>
                        <span className={`num w-24 text-right font-semibold ${r.kind === "income" ? "text-income" : "text-expense"}`}>
                          {r.kind === "income" ? "+" : "−"}{formatCents(r.amount_cents)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {result.errors.length > 0 && (
                <p className="mt-3 text-xs text-muted">
                  Files omeses: {result.errors.slice(0, 8).map((e) => `${e.line} (${e.reason.toLowerCase()})`).join(", ")}{result.errors.length > 8 ? "…" : ""}
                </p>
              )}
              <Button onClick={doImport} disabled={busy || toImport.length === 0} className="mt-4 w-full">
                {busy ? "Important…" : `Importar ${toImport.length} moviments`}
              </Button>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
