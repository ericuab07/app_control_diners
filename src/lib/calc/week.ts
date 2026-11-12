import { addDaysISO, fromISO } from "../dates";

/** Dia de la setmana amb 0 = dilluns … 6 = diumenge (no el getDay() de JS). */
export function weekdayOf(iso: string): number {
  return (fromISO(iso).getDay() + 6) % 7;
}

export function mondayOf(iso: string): string {
  return addDaysISO(iso, -weekdayOf(iso));
}

/** Número de setmana ISO 8601: el dijous de la setmana decideix l'any. */
export function isoWeekNumber(iso: string): number {
  const thursday = fromISO(addDaysISO(iso, 3 - weekdayOf(iso)));
  const year = thursday.getFullYear();
  const dayOfYear = Math.round((Date.UTC(year, thursday.getMonth(), thursday.getDate()) - Date.UTC(year, 0, 1)) / 86_400_000);
  return Math.floor(dayOfYear / 7) + 1;
}

/** El focus és vigent si es va desar la mateixa setmana (dilluns) que avui. */
export function focusIsCurrent(focusMonday: string | null, today: string): boolean {
  return focusMonday !== null && focusMonday === mondayOf(today);
}
