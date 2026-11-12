/** Totes les dates de l'app són cadenes ISO "YYYY-MM-DD" en hora local. */

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISO(new Date());
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysISO(iso: string, n: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

/** "YYYY-MM" d'una data ISO */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function currentMonthKey(): string {
  return monthKey(todayISO());
}

export function addMonthsToKey(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthRange(key: string): { from: string; to: string } {
  const [y, m] = key.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${key}-01`, to: `${key}-${String(last).padStart(2, "0")}` };
}

export function daysInMonth(key: string): number {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

const monthLong = new Intl.DateTimeFormat("ca-ES", { month: "long", year: "numeric" });
const monthShort = new Intl.DateTimeFormat("ca-ES", { month: "short" });
const dayFmt = new Intl.DateTimeFormat("ca-ES", { day: "numeric", month: "short", year: "numeric" });

export function formatMonth(key: string): string {
  const s = monthLong.format(fromISO(`${key}-01`));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatMonthShort(key: string): string {
  return `${monthShort.format(fromISO(`${key}-01`)).replace(".", "")} ${key.slice(2, 4)}`;
}

const longFmt = new Intl.DateTimeFormat("ca-ES", { weekday: "long", day: "numeric", month: "long" });

/** «Dimarts, 27 d'octubre» */
export function formatLongDate(iso: string): string {
  const s = longFmt.format(fromISO(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatDate(iso: string): string {
  return dayFmt.format(fromISO(iso));
}

/**
 * Interpreta dates d'extractes bancaris: "31/12/2025", "31-12-25", "2025-12-31", "31.12.2025".
 * Retorna ISO o null.
 */
export function parseFlexibleDate(input: string): string | null {
  const s = input.trim().split(/[ T]/)[0];
  let y: number, m: number, d: number;
  let match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s);
  if (match) {
    [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else {
    match = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/.exec(s);
    if (!match) return null;
    [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
    if (y < 100) y += 2000;
  }
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return toISO(date);
}
