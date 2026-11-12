"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { addMonthsToKey, currentMonthKey, formatMonth } from "@/lib/dates";
import { PALETTE } from "@/lib/defaults";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cx("rounded-2xl border border-border bg-surface p-4 sm:p-5", className)}>{children}</section>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" };

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3.5 text-sm font-medium transition-colors disabled:opacity-50",
        variant === "primary" && "bg-primary text-primary-fg hover:opacity-90",
        variant === "secondary" && "border border-border bg-surface hover:bg-surface-2",
        variant === "danger" && "border border-expense/40 text-expense hover:bg-expense/10",
        variant === "ghost" && "text-muted hover:bg-surface-2 hover:text-text",
        className,
      )}
    />
  );
}

export const inputClass =
  "w-full min-h-10 rounded-lg border border-border bg-surface px-3 py-2 text-text placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const titleId = useId();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="sheet-in flex max-h-[92dvh] w-full flex-col rounded-t-2xl border border-border bg-surface sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Tancar" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  if (!message) return null;
  return <p role="alert" className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">{message}</p>;
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center">
      <p className="font-medium">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, tone, sub, className }: { label: string; value: string; tone?: "income" | "expense" | "neutral"; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={cx("rounded-2xl border border-border bg-surface p-4", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={cx("num mt-1 font-serif text-xl font-semibold sm:text-2xl", tone === "income" && "text-income", tone === "expense" && "text-expense")}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function ProgressBar({ ratio, level }: { ratio: number; level: "ok" | "warn" | "over" }) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={Math.round(ratio * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx("h-full rounded-full", level === "ok" && "bg-income", level === "warn" && "bg-warn", level === "over" && "bg-expense")} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function MonthPicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const isCurrent = value === currentMonthKey();
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5">
      <button onClick={() => onChange(addMonthsToKey(value, -1))} aria-label="Mes anterior" className="grid size-9 place-items-center rounded-md hover:bg-surface-2">
        <ChevronLeft size={18} />
      </button>
      <span className="min-w-32 text-center text-sm font-medium">{formatMonth(value)}</span>
      <button onClick={() => onChange(addMonthsToKey(value, 1))} disabled={isCurrent} aria-label="Mes següent" className="grid size-9 place-items-center rounded-md hover:bg-surface-2 disabled:opacity-30">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

export function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PALETTE.map((c) => (
        <button key={c} type="button" onClick={() => onChange(c)} aria-label={`Color ${c}`} aria-pressed={value === c}
          className={cx("size-8 rounded-full border-2", value === c ? "border-text" : "border-transparent")} style={{ background: c }} />
      ))}
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-lg border border-border bg-surface-2 p-0.5">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)} aria-pressed={value === o.value}
          className={cx("min-h-9 flex-1 rounded-md px-3 text-sm font-medium", value === o.value ? "bg-surface shadow-sm" : "text-muted")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Executa una acció asíncrona exposant estat d'ocupat i missatge d'error. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, setError, run };
}
