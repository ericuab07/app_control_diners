import { describe, expect, it } from "vitest";
import { carryOverPlan, isEvening, leftovers } from "../src/lib/calc/closeDay";
import type { Task } from "../src/lib/types";

let n = 0;
const t = (p: Partial<Task>): Task => ({ id: `t${n++}`, title: "x", date: "2026-11-12", top_rank: null, done: false, done_at: null, ...p });

describe("isEvening", () => {
  it("a partir de les 20:00", () => {
    expect(isEvening("19:59")).toBe(false);
    expect(isEvening("20:00")).toBe(true);
    expect(isEvening("23:30")).toBe(true);
    expect(isEvening("03:00")).toBe(false);
  });
});

describe("leftovers", () => {
  it("tasques no fetes d'un dia, ordenades per rang", () => {
    const a = t({ top_rank: 2 }), b = t({ top_rank: 1 }), fet = t({ top_rank: 3, done: true }), altre = t({ date: "2026-11-11", top_rank: 1 });
    expect(leftovers([a, b, fet, altre], "2026-11-12").map((x) => x.id)).toEqual([b.id, a.id]);
  });
});

describe("carryOverPlan", () => {
  it("assigna els rangs lliures de l'endemà en ordre", () => {
    const a = t({ top_rank: 1 }), b = t({ top_rank: 3 });
    const dema = t({ date: "2026-11-13", top_rank: 1 });
    expect(carryOverPlan([a, b, dema], "2026-11-12", "2026-11-13")).toEqual([
      { task: a, rank: 2 },
      { task: b, rank: 3 },
    ]);
  });
  it("si l'endemà és ple, rang null (va a la safata)", () => {
    const a = t({ top_rank: 1 });
    const ple = [1, 2, 3].map((r) => t({ date: "2026-11-13", top_rank: r as 1 | 2 | 3 }));
    expect(carryOverPlan([a, ...ple], "2026-11-12", "2026-11-13")).toEqual([{ task: a, rank: null }]);
  });
  it("només les tasques que es demanen, si se'n passa una llista", () => {
    const a = t({ top_rank: 1 }), b = t({ top_rank: 2 });
    expect(carryOverPlan([a, b], "2026-11-12", "2026-11-13", [b.id])).toEqual([{ task: b, rank: 1 }]);
  });
});
