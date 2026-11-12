import { describe, expect, it } from "vitest";
import { isDinersPath, sectionOf } from "../src/lib/nav";

describe("nav", () => {
  it("sectionOf", () => {
    expect(sectionOf("/")).toBe("avui");
    for (const p of ["/diners", "/ingressos", "/despeses/x", "/estadistiques"]) expect(sectionOf(p)).toBe("diners");
    expect(sectionOf("/configuracio")).toBe("configuracio");
    expect(sectionOf("/diners-extra")).toBeNull();
  });
  it("isDinersPath", () => {
    expect(isDinersPath("/accions")).toBe(true);
    expect(isDinersPath("/")).toBe(false);
  });
});
