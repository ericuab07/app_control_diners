const eur = new Intl.NumberFormat("ca-ES", { style: "currency", currency: "EUR" });
const eurCompact = new Intl.NumberFormat("ca-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatCents(cents: number): string {
  return eur.format(cents / 100);
}

export function formatCentsCompact(cents: number): string {
  return eurCompact.format(cents / 100);
}

export function formatPercent(ratio: number, digits = 1): string {
  if (!Number.isFinite(ratio)) return "—";
  return `${(ratio * 100).toLocaleString("ca-ES", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} %`;
}

export function formatNumber(n: number, maxDigits = 4): string {
  return n.toLocaleString("ca-ES", { maximumFractionDigits: maxDigits });
}

/**
 * Interpreta un import escrit per una persona o exportat per un banc.
 * Accepta "1.234,56", "1,234.56", "12,5", "-12.50", "12 €", "(12,00)".
 * Retorna cèntims (amb signe) o null si no és un número.
 */
export function parseAmountToCents(input: string): number | null {
  let s = input.trim();
  if (!s) return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[^\d.,+-]/g, "");
  if (s.startsWith("-") || s.endsWith("-")) negative = !negative;
  s = s.replace(/[+-]/g, "");
  if (!/\d/.test(s)) return null;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let decimalSep: string | null = null;
  if (lastComma >= 0 && lastDot >= 0) {
    decimalSep = lastComma > lastDot ? "," : ".";
  } else {
    const sep = lastComma >= 0 ? "," : lastDot >= 0 ? "." : null;
    if (sep) {
      const count = s.split(sep).length - 1;
      const digitsAfter = s.length - s.lastIndexOf(sep) - 1;
      // "1.234" o "1,234,567" són separadors de milers; "12,5" o "12.50" són decimals.
      const thousands = count > 1 || (digitsAfter === 3 && sep === ".");
      decimalSep = thousands ? null : sep;
    }
  }
  let intPart = s;
  let decPart = "";
  if (decimalSep) {
    const idx = s.lastIndexOf(decimalSep);
    intPart = s.slice(0, idx);
    decPart = s.slice(idx + 1);
  }
  intPart = intPart.replace(/[.,]/g, "") || "0";
  const value = Number(`${intPart}.${decPart || "0"}`);
  if (!Number.isFinite(value)) return null;
  const cents = Math.round(value * 100);
  return negative ? -cents : cents;
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
