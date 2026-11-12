/** Hores com a text "HH:MM" (Postgres `time` torna "HH:MM:SS"; s'accepta igualment). */

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function nowHHMM(d: Date = new Date()): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function greeting(hour: number): string {
  if (hour >= 6 && hour < 14) return "Bon dia";
  if (hour >= 14 && hour < 21) return "Bona tarda";
  return "Bona nit";
}
