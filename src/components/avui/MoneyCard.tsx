"use client";

import { Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { accountBalances, totalBalance } from "@/lib/calc/balances";
import { budgetStatuses } from "@/lib/calc/budgets";
import { computePositions, valuePortfolio } from "@/lib/calc/portfolio";
import { totals } from "@/lib/calc/stats";
import { currentMonthKey, monthRange, todayISO } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { useData } from "../DataProvider";
import { Card, cx } from "../ui";

/** Resum de diners a la portada: patrimoni, estalvi del mes i avisos de pressupost. */
export function MoneyCard() {
  const { accounts, transactions, trades, budgets, quotes, refreshQuotes } = useData();
  const [month] = useState(currentMonthKey);

  useEffect(() => {
    void refreshQuotes();
  }, [refreshQuotes]);

  const cash = useMemo(() => totalBalance(accountBalances(accounts, transactions, trades)), [accounts, transactions, trades]);
  const portfolio = useMemo(() => valuePortfolio(computePositions(trades), quotes), [trades, quotes]);
  const { from, to } = monthRange(month);
  const net = useMemo(() => totals(transactions, from, to).net, [transactions, from, to]);
  const alerts = useMemo(() => budgetStatuses(budgets, transactions, month, todayISO()).filter((s) => s.level !== "ok").length, [budgets, transactions, month]);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold"><Wallet size={18} className="text-primary" aria-hidden /> Diners</h2>
        <Link href="/diners" className="text-sm text-primary hover:underline">Veure diners</Link>
      </div>
      {accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-3 py-6 text-center">
          <p className="text-sm text-muted">Encara no tens cap compte.</p>
          <Link href="/configuracio" className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-fg">Crear un compte</Link>
        </div>
      ) : (
        <dl className="space-y-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Patrimoni</dt>
            <dd className="num font-serif text-2xl font-semibold">{formatCents(cash + portfolio.valueCents)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <dt className="text-muted">Estalvi del mes</dt>
            <dd className={cx("num font-semibold", net >= 0 ? "text-income" : "text-expense")}>{formatCents(net)}</dd>
          </div>
          {alerts > 0 && (
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <dt className="text-muted">Pressupostos a vigilar</dt>
              <dd><Link href="/pressupostos" className="font-semibold text-warn hover:underline">{alerts}</Link></dd>
            </div>
          )}
        </dl>
      )}
    </Card>
  );
}
