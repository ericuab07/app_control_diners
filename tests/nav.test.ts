import { describe, expect, it } from "vitest";
import { isDinersPath, sectionOf } from "../src/lib/nav";

describe("nav", () => {
  it("sectionOf", () => {
    expect(sectionOf("/")).toBe("avui");
    for (const p of ["/diners", "/ingressos", "/despeses/x", "/estadistiques"]) expect(sectionOf(p)).toBe("diners");
    expect(sectionOf("/configuracio")).toBe("configuracio");
    expect(sectionOf("/diners-extra")).toBeNull();
    expect(sectionOf("/habits")).toBe("habits");
    expect(sectionOf("/habits-x")).toBeNull();
    expect(sectionOf("/objectius")).toBe("objectius");
    expect(sectionOf("/estudis/x")).toBe("estudis");
  });
  it("isDinersPath", () => {
    expect(isDinersPath("/accions")).toBe(true);
    expect(isDinersPath("/")).toBe(false);
  });
});
