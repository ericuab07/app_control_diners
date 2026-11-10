"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useData } from "@/components/DataProvider";
import { Card, EmptyState, MonthPicker, PageHeader, Segmented, Stat } from "@/components/ui";
import { byCategory, change, monthlyTotals, totals, type CategorySlice } from "@/lib/calc/stats";
import { addMonthsToKey, currentMonthKey, formatDate, formatMonthShort, monthRange } from "@/lib/dates";
import { formatCents, formatCentsCompact, formatPercent } from "@/lib/money";

const tooltipStyle = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)" };

function Delta({ ratio, goodWhenUp }: { ratio: number; goodWhenUp: boolean }) {
  if (Number.isNaN(ratio)) return <>Sense dades del període anterior</>;
  const up = ratio > 0;
  const good = ratio === 0 ? null : up === goodWhenUp;
  return (
    <span className={good === null ? "" : good ? "text-income" : "text-expense"}>
      {up ? "▲" : ratio < 0 ? "▼" : "="} {formatPercent(Math.abs(ratio), 0)} vs període anterior
    </span>
  );
}

function Breakdown({ title, slices }: { title: string; slices: CategorySlice[] }) {
  return (
    <Card>
      <h2 className="mb-3 font-semibold">{title}</h2>
      {slices.length === 0 ? (
        <p className="text-sm text-muted">Sense moviments en aquest període.</p>
      ) : (
        <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr]">
          <div className="mx-auto">
              <PieChart width={176} height={176}>
                <Pie data={slices} dataKey="total" nameKey="name" innerRadius="58%" outerRadius="95%" paddingAngle={1} stroke="none" isAnimationActive={false}>
                  {slices.map((s) => <Cell key={s.categoryId ?? "none"} fill={s.color} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCents(Number(v))} contentStyle={tooltipStyle} itemStyle={{ color: "var(--text)" }} />
              </PieChart>
          </div>
          <ul className="min-w-0 space-y-2">
            {slices.map((s) => (
              <li key={s.categoryId ?? "none"} className="flex items-center gap-2 text-sm">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
                <span className="min-w-0 flex-1 truncate">{s.icon} {s.name}</span>
                <span className="num shrink-0 text-muted">{formatPercent(s.share, 0)}</span>
                <span className="num shrink-0 text-right font-medium">{formatCents(s.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

export default function StatsPage() {
  const { transactions, categories } = useData();
  const [scope, setScope] = useState<"month" | "year">("month");
  const [month, setMonth] = useState(currentMonthKey());

  const period = useMemo(() => {
    if (scope === "month") {
      const prev = monthRange(addMonthsToKey(month, -1));
      return { ...monthRange(month), prevFrom: prev.from, prevTo: prev.to };
    }
    // Any mòbil: els 12 mesos que acaben en el mes triat, comparats amb els 12 anteriors.
    return {
      from: monthRange(addMonthsToKey(month, -11)).from,
      to: monthRange(month).to,
      prevFrom: monthRange(addMonthsToKey(month, -23)).from,
      prevTo: monthRange(addMonthsToKey(month, -12)).to,
    };
  }, [scope, month]);

  const cur = useMemo(() => totals(transactions, period.from, period.to), [transactions, period]);
  const prev = useMemo(() => totals(transactions, period.prevFrom, period.prevTo), [transactions, period]);
  const expenseSlices = useMemo(() => byCategory(transactions, categories, "expense", period.from, period.to), [transactions, categories, period]);
  const incomeSlices = useMemo(() => byCategory(transactions, categories, "income", period.from, period.to), [transactions, categories, period]);
  const monthly = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => addMonthsToKey(month, i - 11));
    return monthlyTotals(transactions, months).map((m) => ({ month: formatMonthShort(m.month), Ingressos: m.income / 100, Despeses: m.expense / 100 }));
  }, [transactions, month]);
  const topExpenses = useMemo(
    () => transactions.filter((t) => t.kind === "expense" && t.date >= period.from && t.date <= period.to).sort((a, b) => b.amount_cents - a.amount_cents).slice(0, 5),
    [transactions, period],
  );
  const catName = new Map(categories.map((c) => [c.id, c.name]));

  if (transactions.length === 0) {
    return (
      <>
        <PageHeader title="Estadístiques" />
        <EmptyState title="Encara no hi ha dades per analitzar" hint="Quan apuntis ingressos i despeses, aquí veuràs on van els teus diners." />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Estadístiques" />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-52"><Segmented value={scope} onChange={setScope} options={[{ value: "month", label: "Mes" }, { value: "year", label: "12 mesos" }]} /></div>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Ingressos" value={formatCents(cur.income)} tone="income" sub={<Delta ratio={change(cur.income, prev.income)} goodWhenUp />} />
        <Stat label="Despeses" value={formatCents(cur.expense)} tone="expense" sub={<Delta ratio={change(cur.expense, prev.expense)} goodWhenUp={false} />} />
        <Stat label="Estalvi net" value={formatCents(cur.net)} tone={cur.net >= 0 ? "income" : "expense"} />
        <Stat label="Taxa d'estalvi" value={formatPercent(cur.savingsRate, 0)} sub="Part dels ingressos que no has gastat" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Breakdown title="Despeses per categoria" slices={expenseSlices} />
        <Breakdown title="Ingressos per categoria" slices={incomeSlices} />
      </div>

      <Card className="mt-4">
        <h2 className="mb-3 font-semibold">Ingressos i despeses, últims 12 mesos</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 5, right: 5, bottom: 0, left: 0 }} barGap={2}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "var(--muted)", fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} tickLine={false} axisLine={false} width={64} tickFormatter={(v: number) => formatCentsCompact(v * 100)} />
              <Tooltip formatter={(v) => formatCents(Number(v) * 100)} contentStyle={tooltipStyle} cursor={{ fill: "var(--surface-2)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Ingressos" fill="var(--income)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despeses" fill="var(--expense)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="mb-3 font-semibold">Despeses més grans del període</h2>
        {topExpenses.length === 0 ? (
          <p className="text-sm text-muted">Sense despeses en aquest període.</p>
        ) : (
          <ol className="divide-y divide-border">
            {topExpenses.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{t.description || catName.get(t.category_id ?? "") || "Sense concepte"}</span>
                  <span className="block text-xs text-muted">{formatDate(t.date)} · {catName.get(t.category_id ?? "") ?? "Sense categoria"}</span>
                </span>
                <span className="num font-semibold text-expense">{formatCents(t.amount_cents)}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </>
  );
}
