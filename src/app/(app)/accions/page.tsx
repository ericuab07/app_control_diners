"use client";

import { Pencil, Plus, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useData } from "@/components/DataProvider";
import { Button, Card, cx, EmptyState, ErrorNote, Field, inputClass, Modal, PageHeader, Segmented, Stat, useAction } from "@/components/ui";
import { tradeGrossCents } from "@/lib/calc/balances";
import { computePositions, valuePortfolio, type ValuedPosition } from "@/lib/calc/portfolio";
import { formatDate, todayISO } from "@/lib/dates";
import { centsToInput, formatCents, formatNumber, formatPercent, parseAmountToCents } from "@/lib/money";
import type { Trade } from "@/lib/types";

const parseDecimal = (s: string) => Number(s.trim().replace(",", "."));
const signed = (cents: number) => `${cents > 0 ? "+" : ""}${formatCents(cents)}`;
const tone = (cents: number) => (cents > 0 ? "text-income" : cents < 0 ? "text-expense" : "");

function TradeForm({ existing, onClose }: { existing?: Trade; onClose: () => void }) {
  const { accounts, insert, update, remove, lookupQuote } = useData();
  const [side, setSide] = useState<Trade["side"]>(existing?.side ?? "buy");
  const [symbol, setSymbol] = useState(existing?.symbol ?? "");
  const [name, setName] = useState(existing?.name ?? "");
  const [quantity, setQuantity] = useState(existing ? String(existing.quantity).replace(".", ",") : "");
  const [price, setPrice] = useState(existing ? String(existing.price).replace(".", ",") : "");
  const [currency, setCurrency] = useState(existing?.currency ?? "EUR");
  const [fx, setFx] = useState(existing ? String(existing.fx_rate).replace(".", ",") : "1");
  const [fee, setFee] = useState(existing ? centsToInput(existing.fee_cents) : "0");
  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [accountId, setAccountId] = useState(existing?.account_id ?? "");
  const [lookup, setLookup] = useState<"idle" | "loading" | "found" | "missing">("idle");
  const { busy, error, setError, run } = useAction();

  const doLookup = async () => {
    const s = symbol.trim().toUpperCase();
    if (!s) return;
    setSymbol(s);
    setLookup("loading");
    const q = await lookupQuote(s);
    if (!q) return setLookup("missing");
    setLookup("found");
    setName(q.name);
    setCurrency(q.currency);
    if (!existing) {
      if (!price) setPrice(String(q.price).replace(".", ","));
      setFx(String(Number(q.fx_rate.toFixed(6))).replace(".", ","));
    }
  };

  const qty = parseDecimal(quantity);
  const px = parseDecimal(price);
  const rate = parseDecimal(fx);
  const feeCents = parseAmountToCents(fee) ?? 0;
  const valid = qty > 0 && px >= 0 && rate > 0 && Number.isFinite(qty * px * rate);
  const gross = valid ? tradeGrossCents({ quantity: qty, price: px, fx_rate: rate }) : 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return setError("Revisa la quantitat, el preu i el tipus de canvi.");
    if (feeCents < 0) return setError("La comissió no pot ser negativa.");
    const row = {
      side, symbol: symbol.trim().toUpperCase(), name: name.trim(), quantity: qty, price: px,
      currency: currency.trim().toUpperCase() || "EUR", fx_rate: rate, fee_cents: feeCents, date, account_id: accountId || null,
    };
    void run(async () => {
      if (existing) await update("trades", existing.id, row);
      else await insert("trades", row);
      onClose();
    });
  };

  return (
    <Modal title={existing ? "Editar operació" : "Nova operació"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Segmented value={side} onChange={setSide} options={[{ value: "buy", label: "Compra" }, { value: "sell", label: "Venda" }]} />
        <Field label="Ticker" hint={
          lookup === "loading" ? "Cercant cotització…" :
          lookup === "found" ? `Trobat: ${name}` :
          lookup === "missing" ? "No s'ha trobat a Yahoo Finance. Pots continuar i posar el preu a mà." :
          "Tal com surt a Yahoo Finance: AAPL, SAN.MC, VWCE.DE…"}>
          <input className={`${inputClass} uppercase`} value={symbol} onChange={(e) => setSymbol(e.target.value)} onBlur={() => void doLookup()} required maxLength={15} placeholder="AAPL" autoCapitalize="characters" />
        </Field>
        <Field label="Nom">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Opcional" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantitat">
            <input className={`${inputClass} num`} inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} required placeholder="0" />
          </Field>
          <Field label={`Preu per acció (${currency || "EUR"})`}>
            <input className={`${inputClass} num`} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="0,00" />
          </Field>
          <Field label="Moneda">
            <input className={`${inputClass} uppercase`} value={currency} onChange={(e) => setCurrency(e.target.value)} maxLength={3} required />
          </Field>
          <Field label="Canvi a EUR" hint={`1 ${currency || "EUR"} = ? €`}>
            <input className={`${inputClass} num`} inputMode="decimal" value={fx} onChange={(e) => setFx(e.target.value)} required />
          </Field>
          <Field label="Comissió (€)">
            <input className={`${inputClass} num`} inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} />
          </Field>
          <Field label="Data">
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
        </div>
        <Field label="Compte d'on surten o entren els diners" hint="Si en tries un, l'operació en modifica el saldo.">
          <select className={inputClass} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">Cap (no afecta cap compte)</option>
            {accounts.filter((a) => !a.archived || a.id === accountId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        {valid && (
          <p className="num rounded-lg bg-surface-2 px-3 py-2 text-sm">
            Total: <strong>{formatCents(side === "buy" ? gross + feeCents : gross - feeCents)}</strong>
          </p>
        )}
        <ErrorNote message={error} />
        <div className="flex gap-2">
          {existing && (
            <Button type="button" variant="danger" disabled={busy}
              onClick={() => confirm("Vols esborrar aquesta operació?") && void run(async () => { await remove("trades", existing.id); onClose(); })}>
              Esborrar
            </Button>
          )}
          <Button type="submit" disabled={busy} className="flex-1">{busy ? "Desant…" : "Desar"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function PriceForm({ position, onClose }: { position: ValuedPosition; onClose: () => void }) {
  const { setManualPrice } = useData();
  const [price, setPrice] = useState(position.quote ? String(position.quote.price).replace(".", ",") : "");
  const [fx, setFx] = useState(String(position.quote?.fx_rate ?? 1).replace(".", ","));
  const { busy, error, setError, run } = useAction();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseDecimal(price);
    const r = parseDecimal(fx);
    if (!(p >= 0) || !(r > 0)) return setError("Escriu un preu i un canvi vàlids.");
    void run(async () => {
      await setManualPrice(position.symbol, p, { name: position.name, currency: position.currency, fx_rate: r });
      onClose();
    });
  };
  return (
    <Modal title={`Preu de ${position.symbol}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted">Es farà servir fins a la propera actualització automàtica que funcioni.</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Preu (${position.currency})`}>
            <input className={`${inputClass} num`} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} required autoFocus />
          </Field>
          <Field label="Canvi a EUR">
            <input className={`${inputClass} num`} inputMode="decimal" value={fx} onChange={(e) => setFx(e.target.value)} required />
          </Field>
        </div>
        <ErrorNote message={error} />
        <Button type="submit" disabled={busy} className="w-full">Desar preu</Button>
      </form>
    </Modal>
  );
}

export default function StocksPage() {
  const { trades, quotes, quotesLoading, quotesFailed, refreshQuotes } = useData();
  const [form, setForm] = useState<{ existing?: Trade } | null>(null);
  const [pricing, setPricing] = useState<ValuedPosition | null>(null);

  // `refreshQuotes` canvia quan canvien les operacions: un ticker nou rep preu de seguida.
  useEffect(() => {
    void refreshQuotes();
  }, [refreshQuotes]);

  const summary = useMemo(() => valuePortfolio(computePositions(trades), quotes), [trades, quotes]);
  const sortedTrades = useMemo(() => [...trades].sort((a, b) => b.date.localeCompare(a.date)), [trades]);
  const lastUpdate = useMemo(() => {
    const times = summary.positions.flatMap((p) => (p.quote ? [p.quote.fetched_at] : []));
    return times.length ? times.sort()[0] : null;
  }, [summary]);
  const failedOpen = quotesFailed.filter((s) => summary.positions.some((p) => p.symbol === s));

  return (
    <>
      <PageHeader title="Accions" subtitle={lastUpdate ? `Preus actualitzats: ${new Date(lastUpdate).toLocaleString("ca-ES", { dateStyle: "short", timeStyle: "short" })}` : undefined}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void refreshQuotes(true)} disabled={quotesLoading || trades.length === 0}>
              <RefreshCw size={16} className={cx(quotesLoading && "animate-spin")} /> Actualitzar
            </Button>
            <Button onClick={() => setForm({})}><Plus size={18} /> Operació</Button>
          </div>
        } />

      {trades.length === 0 ? (
        <EmptyState title="Encara no tens cap operació" hint="Registra una compra amb el ticker de Yahoo Finance i l'app en calcularà el valor i el rendiment amb el preu actual."
          action={<Button onClick={() => setForm({})}><Plus size={18} /> Primera operació</Button>} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Valor de la cartera" value={formatCents(summary.valueCents)} />
            <Stat label="Invertit" value={formatCents(summary.costBasisCents)} />
            <Stat label="Guany latent" value={signed(summary.unrealizedCents)} tone={summary.unrealizedCents >= 0 ? "income" : "expense"}
              sub={summary.costBasisCents > 0 ? formatPercent(summary.unrealizedCents / summary.costBasisCents) : undefined} />
            <Stat label="Guany realitzat" value={signed(summary.realizedCents)} tone={summary.realizedCents >= 0 ? "income" : "expense"} />
          </div>

          {failedOpen.length > 0 && (
            <p role="status" className="mt-4 rounded-lg bg-warn/10 px-3 py-2 text-sm text-warn">
              No s&apos;ha pogut actualitzar: {failedOpen.join(", ")}. Es mostra l&apos;últim preu conegut; el pots corregir amb el llapis.
            </p>
          )}

          <h2 className="mb-3 mt-6 font-semibold">Posicions</h2>
          {summary.positions.length === 0 ? (
            <p className="text-sm text-muted">No tens cap posició oberta ara mateix.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {summary.positions.map((p) => (
                <Card key={p.symbol}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{p.symbol}</p>
                      <p className="truncate text-xs text-muted">{p.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="num font-semibold">{formatCents(p.valueCents)}</p>
                      <p className={cx("num text-sm", tone(p.unrealizedCents))}>
                        {signed(p.unrealizedCents)} ({formatPercent(p.unrealizedRatio)})
                      </p>
                    </div>
                  </div>
                  <dl className="num mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <dt className="text-muted">Quantitat</dt><dd className="text-right">{formatNumber(p.quantity)}</dd>
                    <dt className="text-muted">Cost mitjà</dt><dd className="text-right">{formatCents(Math.round(p.avgCostEur * 100))}</dd>
                    <dt className="text-muted">Preu actual</dt>
                    <dd className="flex items-center justify-end gap-1">
                      {p.quote ? `${formatNumber(p.quote.price, 2)} ${p.quote.currency}` : "Sense preu"}
                      {p.quote?.manual && <span className="rounded bg-surface-2 px-1 text-[10px] text-muted">manual</span>}
                      <button onClick={() => setPricing(p)} aria-label={`Editar preu de ${p.symbol}`} className="grid size-7 place-items-center rounded text-muted hover:bg-surface-2"><Pencil size={13} /></button>
                    </dd>
                    <dt className="text-muted">Pes a la cartera</dt><dd className="text-right">{formatPercent(p.weight, 0)}</dd>
                  </dl>
                </Card>
              ))}
            </div>
          )}

          <h2 className="mb-3 mt-6 font-semibold">Operacions</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {sortedTrades.map((t) => (
              <li key={t.id}>
                <button onClick={() => setForm({ existing: t })} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-2">
                  <span className={cx("w-16 shrink-0 rounded-md px-2 py-1 text-center text-xs font-semibold", t.side === "buy" ? "bg-income/15 text-income" : "bg-expense/15 text-expense")}>
                    {t.side === "buy" ? "Compra" : "Venda"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{t.symbol}</span>
                    <span className="num block truncate text-xs text-muted">{formatNumber(t.quantity)} × {formatNumber(t.price, 2)} {t.currency} · {formatDate(t.date)}</span>
                  </span>
                  <span className="num shrink-0 font-semibold">{formatCents(tradeGrossCents(t) + (t.side === "buy" ? t.fee_cents : -t.fee_cents))}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {form && <TradeForm existing={form.existing} onClose={() => setForm(null)} />}
      {pricing && <PriceForm position={pricing} onClose={() => setPricing(null)} />}
    </>
  );
}
