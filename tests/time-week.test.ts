import { describe, expect, it } from "vitest";
import { focusIsCurrent, isoWeekNumber, mondayOf, weekdayOf } from "../src/lib/calc/week";
import { addDaysISO, formatLongDate } from "../src/lib/dates";
import { formatDuration, greeting, nowHHMM, toMinutes } from "../src/lib/time";

describe("time", () => {
  it("toMinutes accepta HH:MM i HH:MM:SS", () => {
    expect(toMinutes("09:30")).toBe(570);
    expect(toMinutes("09:30:00")).toBe(570);
  });
  it("formatDuration", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(120)).toBe("2 h");
    expect(formatDuration(90)).toBe("1 h 30 min");
  });
  it("greeting segons l'hora", () => {
    expect(greeting(6)).toBe("Bon dia");
    expect(greeting(13)).toBe("Bon dia");
    expect(greeting(14)).toBe("Bona tarda");
    expect(greeting(20)).toBe("Bona tarda");
    expect(greeting(21)).toBe("Bona nit");
    expect(greeting(3)).toBe("Bona nit");
  });
  it("nowHHMM", () => {
    expect(nowHHMM(new Date(2026, 9, 27, 7, 5))).toBe("07:05");
  });
});

describe("week", () => {
  it("weekdayOf amb 0 = dilluns", () => {
    expect(weekdayOf("2026-10-27")).toBe(1);
    expect(weekdayOf("2026-10-25")).toBe(6);
    expect(weekdayOf("2026-10-26")).toBe(0);
  });
  it("mondayOf", () => {
    expect(mondayOf("2026-10-27")).toBe("2026-10-26");
    expect(mondayOf("2026-10-25")).toBe("2026-10-19");
    expect(mondayOf("2026-10-26")).toBe("2026-10-26");
  });
  it("isoWeekNumber", () => {
    expect(isoWeekNumber("2026-10-27")).toBe(44);
    expect(isoWeekNumber("2026-01-01")).toBe(1);
    expect(isoWeekNumber("2027-01-03")).toBe(53);
  });
  it("focusIsCurrent", () => {
    expect(focusIsCurrent("2026-10-26", "2026-10-30")).toBe(true);
    expect(focusIsCurrent("2026-10-19", "2026-10-27")).toBe(false);
    expect(focusIsCurrent(null, "2026-10-27")).toBe(false);
  });
});

describe("dates", () => {
  it("addDaysISO", () => {
    expect(addDaysISO("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDaysISO("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("formatLongDate", () => {
    const s = formatLongDate("2026-10-27");
    expect(s).toContain("octubre");
    expect(s).toContain("27");
    expect(s.charAt(0)).toBe(s.charAt(0).toUpperCase());
  });
});
