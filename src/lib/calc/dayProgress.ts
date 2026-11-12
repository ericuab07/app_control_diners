export interface DayProgress {
  done: number;
  total: number;
  ratio: number;
  label: string;
}

/** Progrés del dia: fet / total amb etiqueta per trams (mai NaN amb 0 elements). */
export function dayProgress(items: { done: boolean }[]): DayProgress {
  const total = items.length;
  const done = items.filter((i) => i.done).length;
  if (total === 0) return { done: 0, total: 0, ratio: 0, label: "Afegeix la teva primera tasca" };
  const ratio = done / total;
  const label = ratio >= 1 ? "Dia validat" : ratio >= 0.7 ? "Gairebé" : ratio >= 0.3 ? "Bon ritme" : "Comença per una";
  return { done, total, ratio, label };
}
