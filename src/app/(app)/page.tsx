"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useData } from "@/components/DataProvider";
import { TransactionList } from "@/components/TransactionList";
import { Card, EmptyState, PageHeader, ProgressBar, Stat } from "@/components/ui";
import { accountBalances, totalBalance } from "@/lib/calc/balances";
import { budgetStatuses } from "@/lib/calc/budgets";
import { computePositions, valuePortfolio } from "@/lib/calc/portfolio";
import { totals } from "@/lib/calc/stats";
import { addMonthsToKey, currentMonthKey, formatMonth, formatMonthShort, monthRange, todayISO } from "@/lib/dates";
import { ACCOUNT_TYPE_LABELS } from "@/lib/defaults";
import { formatCents, formatCentsCompact, formatPercent } from "@/lib/money";

export default function BalancePage() {
  const { accounts, transactions, trades, budgets, categories, quotes, refreshQuotes } = useData();
  const [month] = useState(currentMonthKey);

  useEffect(() => {
    void refreshQuotes();
  }, [refreshQuotes]);

  const balances = useMemo(() => accountBalances(accounts, transactions, trades), [accounts, transactions, trades]);
  const cash = totalBalance(balances);
  const portfolio = useMemo(() => valuePortfolio(computePositions(trades), quotes), [trades, quotes]);
  const { from, to } = monthRange(month);
  const monthTotals = useMemo(() => totals(transactions, from, to), [transactions, from, to]);

  const series = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => addMonthsToKey(month, i - 11));
    return months.map((m) => ({
      month: formatMonthShort(m),
      saldo: totalBalance(accountBalances(accounts, transactions, trades, m === month ? todayISO() : monthRange(m).to)) / 100,
    }));
  }, [accounts, transactions, trades, month]);

  const alerts = useMemo(
    () => budgetStatuses(budgets, transactions, month, todayISO()).filter((s) => s.level !== "ok"),
    [budgets, transactions, month],
  );
  const categoryName = new Map(categories.map((c) => [c.id, `${c.icon} ${c.name}`]));
  const recent = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)).slice(0, 8),
    [transactions],
  );

  if (accounts.length === 0) {
    return (
      <>
        <PageHeader title="Balanç" />
        <EmptyState
          title="Benvingut! Comencem creant el teu primer compte"
          hint="Un compte és qualsevol lloc on tens diners: el compte corrent, estalvis, efectiu, Revolut… Indica'n el saldo actual i a partir d'aquí apunta els moviments."
          action={<Link href="/configuracio" className="inline-flex min-h-10 items-center rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-fg">Crear un compte</Link>}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Balanç" subtitle={formatMonth(month)} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 rounded-2xl bg-primary p-5 text-primary-fg lg:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide opacity-80">Patrimoni total</p>
          <p className="num mt-1 text-3xl font-semibold">{formatCents(cash + portfolio.valueCents)}</p>
          <p className="num mt-1 text-sm opacity-85">Comptes {formatCents(cash)} · Accions {formatCents(portfolio.valueCents)}</p>
        </div>
        <Stat label="Ingressos del mes" value={formatCents(monthTotals.income)} tone="income" />
        <Stat label="Despeses del mes" value={formatCents(monthTotals.expense)} tone="expense" />
        <Stat className="col-span-2 lg:col-span-1" label="Estalvi del mes" value={formatCents(monthTotals.net)} tone={monthTotals.net >= 0 ? "income" : "expense"}
          sub={Number.isNaN(monthTotals.savingsRate) ? undefined : `Taxa d'estalvi ${formatPercent(monthTotals.savingsRate, 0)}`} />
      </div>

      {alerts.length > 0 && (
        <Card className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Pressupostos a vigilar</h2>
            <Link href="/pressupostos" className="text-sm text-primary hover:underline">Veure tots</Link>
          </div>
          <ul className="space-y-3">
            {alerts.map((s) => (
              <li key={s.budget.id}>
                <div className="mb-1 flex justify-between gap-2 text-sm">
                  <span className="font-medium">{s.budget.category_id ? (categoryName.get(s.budget.category_id) ?? "Categoria") : "🌍 Global"}</span>
                  <span className={`num ${s.level === "over" ? "text-expense" : "text-warn"}`}>
                    {formatCents(s.spent)} de {formatCents(s.budget.amount_cents)} · {s.level === "over" ? "superat" : formatPercent(s.ratio, 0)}
                  </span>
                </div>
                <ProgressBar ratio={s.ratio} level={s.level} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <h2 className="mb-3 font-semibold">Comptes</h2>
          <ul className="divide-y divide-border">
            {accounts.filter((a) => !a.archived).map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2.5">
                <span className="size-3 shrink-0 rounded-full" style={{ background: a.color }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{a.name}</span>
                  <span className="block text-xs text-muted">{ACCOUNT_TYPE_LABELS[a.type]}</span>
                </span>
                <span className={`num font-semibold ${(balances.get(a.id) ?? 0) < 0 ? "text-expense" : ""}`}>{formatCents(balances.get(a.id) ?? 0)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold">Evolució del saldo</h2>
          <p className="mb-3 text-xs text-muted">Saldo dels comptes a final de cada mes (sense el valor de la cartera).</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="saldoFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "var(--muted)", fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} tickLine={false} axisLine={false} width={64} tickFormatter={(v: number) => formatCentsCompact(v * 100)} />
                <Tooltip formatter={(v) => [formatCents(Number(v) * 100), "Saldo"]} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)" }} />
                <Area type="monotone" dataKey="saldo" stroke="var(--primary)" strokeWidth={2} fill="url(#saldoFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <h2 className="mb-3 mt-6 font-semibold">Últims moviments</h2>
      {recent.length === 0 ? (
        <EmptyState title="Encara no hi ha moviments" hint="Apunta el primer amb el botó «Nou moviment»." />
      ) : (
        <TransactionList transactions={recent} />
      )}
    </>
  );
}
