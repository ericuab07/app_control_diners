"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { PALETTE } from "@/lib/defaults";
import type { Category, CategoryKind } from "@/lib/types";
import { useData } from "../DataProvider";
import { Button, ColorPicker, ErrorNote, Field, inputClass, Modal, Segmented, useAction } from "../ui";

function CategoryForm({ existing, defaultKind, onClose }: { existing?: Category; defaultKind: CategoryKind; onClose: () => void }) {
  const { categories, insert, update, remove } = useData();
  const [name, setName] = useState(existing?.name ?? "");
  const [kind, setKind] = useState<CategoryKind>(existing?.kind ?? defaultKind);
  const [icon, setIcon] = useState(existing?.icon ?? "🏷️");
  const [color, setColor] = useState(existing?.color ?? PALETTE[categories.length % PALETTE.length]);
  const { busy, error, setError, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (categories.some((c) => c.id !== existing?.id && c.kind === kind && c.name.toLowerCase() === clean.toLowerCase())) {
      return setError("Ja tens una categoria amb aquest nom.");
    }
    const row = { name: clean, kind, icon: icon.trim() || "🏷️", color };
    void run(async () => {
      if (existing) await update("categories", existing.id, row);
      else await insert("categories", row);
      onClose();
    });
  };

  return (
    <Modal title={existing ? "Editar categoria" : "Nova categoria"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {!existing && <Segmented value={kind} onChange={setKind} options={[{ value: "expense", label: "Despesa" }, { value: "income", label: "Ingrés" }]} />}
        <div className="grid grid-cols-[5rem_1fr] gap-3">
          <Field label="Icona">
            <input className={`${inputClass} text-center text-xl`} value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} aria-describedby="icon-hint" />
          </Field>
          <Field label="Nom">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} autoFocus={!existing} />
          </Field>
        </div>
        <p id="icon-hint" className="-mt-2 text-xs text-muted">La icona és un emoji: escriu-lo amb el teclat d&apos;emojis.</p>
        <Field label="Color"><ColorPicker value={color} onChange={setColor} /></Field>
        <ErrorNote message={error} />
        <div className="flex gap-2">
          {existing && (
            <Button type="button" variant="danger" disabled={busy}
              onClick={() => confirm(`Vols esborrar «${existing.name}»? Els seus moviments quedaran sense categoria i se n'esborrarà el pressupost.`) && void run(async () => { await remove("categories", existing.id); onClose(); })}>
              Esborrar
            </Button>
          )}
          <Button type="submit" disabled={busy} className="flex-1">Desar</Button>
        </div>
      </form>
    </Modal>
  );
}

export function CategoriesSection() {
  const { categories } = useData();
  const [kind, setKind] = useState<CategoryKind>("expense");
  const [form, setForm] = useState<{ existing?: Category } | null>(null);
  const list = categories.filter((c) => c.kind === kind).sort((a, b) => a.name.localeCompare(b.name, "ca"));
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="w-56"><Segmented value={kind} onChange={setKind} options={[{ value: "expense", label: "Despeses" }, { value: "income", label: "Ingressos" }]} /></div>
        <Button onClick={() => setForm({})}><Plus size={18} /> Categoria</Button>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {list.map((c) => (
          <li key={c.id}>
            <button onClick={() => setForm({ existing: c })} className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-left hover:bg-surface-2">
              <span className="grid size-9 place-items-center rounded-full text-lg" style={{ background: `${c.color}26` }} aria-hidden>{c.icon}</span>
              <span className="flex-1 truncate font-medium">{c.name}</span>
              <span className="size-3 rounded-full" style={{ background: c.color }} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      {form && <CategoryForm existing={form.existing} defaultKind={kind} onClose={() => setForm(null)} />}
    </>
  );
}
