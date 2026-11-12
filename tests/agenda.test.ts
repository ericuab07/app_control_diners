import { describe, expect, it } from "vitest";
import { eventStatus, eventsOn, isValidTimeRange, minutesUntilStart, startsInLabel } from "../src/lib/calc/agenda";
import type { LifeEvent } from "../src/lib/types";

let seq = 0;
const ev = (p: Partial<LifeEvent>): LifeEvent => ({
  id: `e${seq++}`, title: "", start_time: "09:00", end_time: "10:00", kind: "other", date: null, weekday: null, repeat_until: null, ...p,
});

describe("eventsOn", () => {
  it("setmanal surt el seu dia de la setmana", () => {
    const e = ev({ weekday: 1 });
    expect(eventsOn([e], "2026-10-27")).toEqual([e]);
    expect(eventsOn([e], "2026-10-28")).toEqual([]);
  });
  it("weekday 6 és diumenge", () => {
    const e = ev({ weekday: 6 });
    expect(eventsOn([e], "2026-10-25")).toEqual([e]);
  });
  it("repeat_until el fa desaparèixer després", () => {
    const e = ev({ weekday: 1, repeat_until: "2026-10-20" });
    expect(eventsOn([e], "2026-10-27")).toEqual([]);
    expect(eventsOn([e], "2026-10-20")).toEqual([e]);
  });
  it("puntual per date", () => {
    const e = ev({ date: "2026-10-27" });
    expect(eventsOn([e], "2026-10-27")).toEqual([e]);
    expect(eventsOn([e], "2026-10-28")).toEqual([]);
  });
  it("ordena per hora, també amb HH:MM:SS", () => {
    const a = ev({ date: "2026-10-27", start_time: "12:00:00", end_time: "13:00:00" });
    const b = ev({ date: "2026-10-27", start_time: "09:30:00", end_time: "10:00:00" });
    const c = ev({ weekday: 1, start_time: "10:15", end_time: "11:00" });
    expect(eventsOn([a, b, c], "2026-10-27")).toEqual([b, c, a]);
  });
});

describe("isValidTimeRange", () => {
  it("fi posterior a l'inici, sense travessar mitjanit", () => {
    expect(isValidTimeRange("09:30", "11:30")).toBe(true);
    expect(isValidTimeRange("11:30", "09:30")).toBe(false);
    expect(isValidTimeRange("10:00", "10:00")).toBe(false);
    expect(isValidTimeRange("23:00", "00:30")).toBe(false);
    expect(isValidTimeRange("09:30:00", "10:00:00")).toBe(true);
  });
});

describe("eventStatus", () => {
  it("done / current / upcoming", () => {
    expect(eventStatus({ start_time: "08:00", end_time: "08:45" }, "09:30")).toBe("done");
    expect(eventStatus({ start_time: "09:30", end_time: "11:30" }, "09:30")).toBe("current");
    expect(eventStatus({ start_time: "12:00", end_time: "12:30" }, "09:30")).toBe("upcoming");
    expect(eventStatus({ start_time: "09:30", end_time: "11:30" }, "11:30")).toBe("done");
  });
});

describe("minutesUntilStart i startsInLabel", () => {
  it("minuts fins a l'inici", () => {
    expect(minutesUntilStart({ start_time: "09:30" }, "09:00")).toBe(30);
    expect(minutesUntilStart({ start_time: "09:00" }, "09:30")).toBeLessThan(0);
  });
  it("etiqueta «En X»", () => {
    expect(startsInLabel(32)).toBe("En 32 min");
    expect(startsInLabel(70)).toBe("En 1 h 10 min");
    expect(startsInLabel(0)).toBeNull();
    expect(startsInLabel(-5)).toBeNull();
    expect(startsInLabel(181)).toBeNull();
  });
});
