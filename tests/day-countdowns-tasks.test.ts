import { describe, expect, it } from "vitest";
import { countdownLabel, countdownProgress, daysUntil } from "../src/lib/calc/countdowns";
import { dayProgress } from "../src/lib/calc/dayProgress";
import { nextFreeRank } from "../src/lib/calc/tasks";

const items = (done: number, total: number) => Array.from({ length: total }, (_, i) => ({ done: i < done }));

describe("dayProgress", () => {
  it("dia buit: 0 de 0 sense NaN", () => {
    const p = dayProgress([]);
    expect(p).toEqual({ done: 0, total: 0, ratio: 0, label: "Afegeix la teva primera tasca" });
  });
  it("etiquetes per trams", () => {
    expect(dayProgress(items(3, 11)).label).toBe("Comença per una");
    expect(dayProgress(items(3, 10)).label).toBe("Bon ritme");
    expect(dayProgress(items(5, 10)).label).toBe("Bon ritme");
    expect(dayProgress(items(7, 10)).label).toBe("Gairebé");
    expect(dayProgress(items(10, 10)).label).toBe("Dia validat");
    expect(dayProgress(items(5, 10)).ratio).toBe(0.5);
  });
});

describe("countdowns", () => {
  it("daysUntil", () => {
    expect(daysUntil("2026-12-05", "2026-10-27")).toBe(39);
    expect(daysUntil("2026-10-26", "2026-10-24")).toBe(2);
    expect(daysUntil("2026-10-20", "2026-10-27")).toBe(-7);
  });
  it("countdownProgress", () => {
    const c = { start_date: "2026-10-01", target_date: "2026-12-05" };
    expect(countdownProgress(c, "2026-10-27")).toBeCloseTo(0.4, 2);
    expect(countdownProgress(c, "2026-12-10")).toBe(1);
    expect(countdownProgress(c, "2026-09-01")).toBe(0);
    const same = { start_date: "2026-12-05", target_date: "2026-12-05" };
    expect(countdownProgress(same, "2026-12-05")).toBe(1);
    expect(countdownProgress(same, "2026-12-04")).toBe(0);
  });
  it("countdownLabel", () => {
    expect(countdownLabel(39)).toBe("Falten 39 dies");
    expect(countdownLabel(1)).toBe("Demà");
    expect(countdownLabel(0)).toBe("Avui");
    expect(countdownLabel(-1)).toBe("Ahir");
    expect(countdownLabel(-3)).toBe("Fa 3 dies");
  });
});

describe("nextFreeRank", () => {
  const d = "2026-10-27";
  it("primer rang lliure del dia", () => {
    expect(nextFreeRank([], d)).toBe(1);
    expect(nextFreeRank([{ date: d, top_rank: 1 }, { date: d, top_rank: 3 }], d)).toBe(2);
    expect(nextFreeRank([{ date: d, top_rank: 1 }, { date: d, top_rank: 2 }, { date: d, top_rank: 3 }], d)).toBeNull();
    expect(nextFreeRank([{ date: "2026-10-26", top_rank: 1 }, { date: d, top_rank: null }], d)).toBe(1);
  });
});
