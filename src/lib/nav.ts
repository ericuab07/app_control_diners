export type Section = "avui" | "diners" | "habits" | "objectius" | "estudis" | "configuracio";

/** Seccions d'una sola ruta base (la URL coincideix amb el nom). */
const SIMPLE: Section[] = ["habits", "objectius", "estudis", "configuracio"];

/** Rutes que formen el mòdul «Diners» (les URL no canvien; només el balanç es va moure a /diners). */
export const DINERS_PATHS: readonly string[] = ["/diners", "/ingressos", "/despeses", "/accions", "/pressupostos", "/estadistiques"];

const matches = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

export function isDinersPath(pathname: string): boolean {
  return DINERS_PATHS.some((p) => matches(pathname, p));
}

export function sectionOf(pathname: string): Section | null {
  if (pathname === "/") return "avui";
  if (isDinersPath(pathname)) return "diners";
  return SIMPLE.find((s) => matches(pathname, `/${s}`)) ?? null;
}
