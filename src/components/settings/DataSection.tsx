"use client";

import { Download, LogOut } from "lucide-react";
import { todayISO } from "@/lib/dates";
import { useData } from "../DataProvider";
import { Button, Card } from "../ui";

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const csvCell = (v: string) => (/[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function DataSection() {
  const { session, accounts, categories, transactions, recurring_rules, budgets, trades, signOut } = useData();

  const exportJson = () =>
    download(`diners-${todayISO()}.json`, JSON.stringify({ exported_at: new Date().toISOString(), accounts, categories, transactions, recurring_rules, budgets, trades }, null, 2), "application/json");

  const exportCsv = () => {
    const acc = new Map(accounts.map((a) => [a.id, a.name]));
    const cat = new Map(categories.map((c) => [c.id, c.name]));
    const kinds = { income: "Ingrés", expense: "Despesa", transfer: "Transferència" };
    const lines = [...transactions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((t) => [
        t.date, kinds[t.kind], (t.amount_cents / 100).toFixed(2).replace(".", ","), t.description,
        cat.get(t.category_id ?? "") ?? "", acc.get(t.account_id) ?? "", acc.get(t.transfer_account_id ?? "") ?? "",
      ].map(csvCell).join(";"));
    // BOM perquè l'Excel reconegui els accents.
    download(`moviments-${todayISO()}.csv`, `﻿Data;Tipus;Import;Concepte;Categoria;Compte;Compte destí\n${lines.join("\n")}\n`, "text/csv;charset=utf-8");
  };

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-semibold">Exportar</h3>
        <p className="mt-1 text-sm text-muted">Una còpia de les teves dades. El CSV s&apos;obre amb Excel; el JSON ho inclou tot.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportCsv}><Download size={16} /> Moviments (CSV)</Button>
          <Button variant="secondary" onClick={exportJson}><Download size={16} /> Tot (JSON)</Button>
        </div>
      </Card>
      <Card>
        <h3 className="font-semibold">Sessió</h3>
        <p className="mt-1 text-sm text-muted">Has iniciat sessió com a {session.user.email}.</p>
        <Button variant="secondary" onClick={() => void signOut()} className="mt-3"><LogOut size={16} /> Tancar sessió</Button>
      </Card>
    </div>
  );
}
