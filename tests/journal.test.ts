import { describe, expect, it } from "vitest";
import { averageMood, MOODS, moodSeries, quoteOfDay } from "../src/lib/calc/journal";
import type { JournalEntry } from "../src/lib/types";

const e = (date: string, mood: JournalEntry["mood"]): JournalEntry => ({ id: date, date, mood, note: "" });

describe("journal", () => {
  it("MOODS té les 5 opcions", () => {
    expect(MOODS.map((m) => m.value)).toEqual([1, 2, 3, 4, 5]);
  });
  it("moodSeries deixa buits on no hi ha entrada", () => {
    expect(moodSeries([e("2026-10-26", 4)], "2026-10-27", 3)).toEqual([
      { date: "2026-10-25", mood: null },
      { date: "2026-10-26", mood: 4 },
      { date: "2026-10-27", mood: null },
    ]);
  });
  it("averageMood", () => {
    expect(averageMood([], "2026-10-01", "2026-10-31")).toBeNull();
    expect(averageMood([e("2026-10-02", 2), e("2026-10-03", 4), e("2026-09-30", 5)], "2026-10-01", "2026-10-31")).toBe(3);
  });
  it("quoteOfDay és estable i canvia cada dia", () => {
    const q = ["a", "b", "c"];
    expect(quoteOfDay("2026-10-27", q)).toBe(quoteOfDay("2026-10-27", q));
    expect(quoteOfDay("2026-10-27", q)).not.toBe(quoteOfDay("2026-10-28", q));
    expect(quoteOfDay("2026-10-27", ["única"])).toBe("única");
  });
});
