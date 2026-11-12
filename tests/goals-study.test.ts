import { describe, expect, it } from "vitest";
import { goalProgress, goalStatusLabel, yearFraction } from "../src/lib/calc/goals";
import { dueLabel, minutesThisWeek, upcomingItems } from "../src/lib/calc/study";
import type { StudyItem } from "../src/lib/types";

describe("yearFraction", () => {
  it("fracció de l'any transcorreguda", () => {
    expect(yearFraction(2026, "2026-01-01")).toBeCloseTo(0, 2);
    expect(Math.abs(yearFraction(2026, "2026-07-02") - 0.5)).toBeLessThan(0.01);
    expect(Math.abs(yearFraction(2026, "2026-12-31") - 1)).toBeLessThan(0.01);
    expect(Math.abs(yearFraction(2028, "2028-12-31") - 1)).toBeLessThan(0.01);
  });
  it("any futur o passat", () => {
    expect(yearFraction(2027, "2026-10-01")).toBe(0);
    expect(yearFraction(2025, "2026-10-01")).toBe(1);
  });
});

describe("goalProgress", () => {
  const g = (current: number) => ({ year: 2026, target_value: 24, current_value: current });
  it("estat segons el ritme", () => {
    expect(goalProgress(g(12), "2026-07-02").status).toBe("ahead");
    expect(goalProgress(g(6), "2026-07-02").status).toBe("behind");
    expect(goalProgress(g(24), "2026-07-02").status).toBe("done");
    expect(goalProgress(g(30), "2026-07-02").ratio).toBe(1);
  });
  it("etiquetes", () => {
    expect(goalStatusLabel("done")).toBe("Fet!");
    expect(goalStatusLabel("ahead")).toBe("Vas bé");
    expect(goalStatusLabel("behind")).toBe("Per sota del ritme");
  });
});

describe("study", () => {
  it("dueLabel", () => {
    expect(dueLabel("2026-10-27", "2026-10-27")).toBe("Avui");
    expect(dueLabel("2026-10-28", "2026-10-27")).toBe("Demà");
    expect(dueLabel("2026-11-01", "2026-10-27")).toBe("En 5 dies");
    expect(dueLabel("2026-10-25", "2026-10-27")).toBe("Fa 2 dies");
  });
  it("upcomingItems", () => {
    const item = (id: string, due_date: string, done = false): StudyItem => ({ id, course_id: "c", title: id, kind: "entrega", due_date, done });
    const list = upcomingItems([item("b", "2026-11-05"), item("vençut", "2026-10-20"), item("fet", "2026-10-28", true), item("lluny", "2026-11-30"), item("a", "2026-10-29")], "2026-10-27");
    expect(list.map((i) => i.id)).toEqual(["vençut", "a", "b"]);
  });
  it("minutesThisWeek", () => {
    const logs = [
      { id: "1", course_id: "c", date: "2026-10-26", minutes: 50 },
      { id: "2", course_id: "c", date: "2026-10-27", minutes: 25 },
      { id: "3", course_id: "c", date: "2026-10-25", minutes: 90 },
      { id: "4", course_id: "d", date: "2026-10-27", minutes: 30 },
    ];
    const m = minutesThisWeek(logs, "2026-10-27");
    expect(m.get("c")).toBe(75);
    expect(m.get("d")).toBe(30);
  });
});
