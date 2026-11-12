import { describe, expect, it } from "vitest";
import { doneDates, isDueOn, streaks, weeklyCompliance } from "../src/lib/calc/habits";
import { healthItems } from "../src/lib/calc/health";
import type { HealthLog } from "../src/lib/types";

const today = "2026-10-29"; // dijous
const daily = { target_per_week: 7 };
const thrice = { target_per_week: 3 };
const twice = { target_per_week: 2 };
const set = (...days: string[]) => new Set(days);

describe("doneDates", () => {
  it("dates d'un hàbit", () => {
    const logs = [{ habit_id: "a", date: "2026-10-28" }, { habit_id: "b", date: "2026-10-27" }];
    expect([...doneDates(logs, "a")]).toEqual(["2026-10-28"]);
  });
});

describe("weeklyCompliance", () => {
  it("compta la setmana de dilluns a avui", () => {
    expect(weeklyCompliance(thrice, set("2026-10-26", "2026-10-28", "2026-10-19"), today)).toMatchObject({ done: 2, target: 3 });
    expect(weeklyCompliance(daily, set("2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29"), today)).toMatchObject({ done: 4, target: 7 });
  });
});

describe("isDueOn", () => {
  it("diari sempre toca", () => expect(isDueOn(daily, set(), today)).toBe(true));
  it("setmanal ja complert no toca", () => expect(isDueOn(thrice, set("2026-10-26", "2026-10-27", "2026-10-28"), today)).toBe(false));
  it("setmanal pendent toca", () => expect(isDueOn(thrice, set("2026-10-26", "2026-10-27"), today)).toBe(true));
  it("el dia que s'ha fet toca", () => expect(isDueOn(thrice, set("2026-10-26", "2026-10-27", "2026-10-29"), today)).toBe(true));
});

describe("streaks", () => {
  it("diari sense fer avui compta fins ahir", () => {
    expect(streaks(daily, set("2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28"), today)).toEqual({ current: 4, best: 4, unit: "dies" });
  });
  it("diari fet avui", () => {
    expect(streaks(daily, set("2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29"), today).current).toBe(5);
  });
  it("millor ratxa anterior", () => {
    expect(streaks(daily, set("2026-10-20", "2026-10-21", "2026-10-22", "2026-10-27", "2026-10-28"), today)).toEqual({ current: 2, best: 3, unit: "dies" });
  });
  it("sense registres", () => expect(streaks(daily, set(), today)).toEqual({ current: 0, best: 0, unit: "dies" }));
  it("setmanal en setmanes", () => {
    const base = ["2026-10-13", "2026-10-15", "2026-10-20", "2026-10-22", "2026-10-27"];
    expect(streaks(twice, set(...base), today)).toEqual({ current: 2, best: 2, unit: "setmanes" });
    expect(streaks(twice, set(...base, "2026-10-28"), today)).toEqual({ current: 3, best: 3, unit: "setmanes" });
  });
});

describe("healthItems", () => {
  const goals = { step_goal: 8000, water_goal: 8, sleep_goal_minutes: 450 };
  const log = (p: Partial<HealthLog>): HealthLog => ({ id: "h", date: today, sleep_minutes: null, steps: null, water_glasses: 0, workout: null, ...p });
  const done = (items: { key: string; done: boolean }[], key: string) => items.find((i) => i.key === key)?.done;
  it("sense registre: 4 metes pendents", () => {
    const items = healthItems(undefined, goals);
    expect(items).toHaveLength(4);
    expect(items.every((i) => !i.done)).toBe(true);
  });
  it("cada meta", () => {
    expect(done(healthItems(log({ water_glasses: 8 }), goals), "water")).toBe(true);
    expect(done(healthItems(log({ steps: 7999 }), goals), "steps")).toBe(false);
    expect(done(healthItems(log({ sleep_minutes: 450 }), goals), "sleep")).toBe(true);
    expect(done(healthItems(log({ workout: "rest" }), goals), "workout")).toBe(true);
  });
});
