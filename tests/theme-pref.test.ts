import { describe, expect, it } from "vitest";
import { applyThemePref, parseThemePref, THEME_KEY, themeScript } from "../src/lib/theme";

/** Executa l'script inicial amb un localStorage i un <html> falsos. */
function runScript(stored: string | null, throws = false) {
  const attrs = new Map<string, string>();
  const doc = { documentElement: { setAttribute: (k: string, v: string) => attrs.set(k, v) } };
  const storage = { getItem: (k: string) => { if (throws) throw new Error("bloquejat"); return k === THEME_KEY ? stored : null; } };
  new Function("document", "localStorage", themeScript)(doc, storage);
  return attrs.get("data-theme");
}

describe("preferència de tema", () => {
  it("parseThemePref només accepta light/dark; la resta és auto", () => {
    expect(parseThemePref("dark")).toBe("dark");
    expect(parseThemePref("light")).toBe("light");
    expect(parseThemePref("auto")).toBe("auto");
    expect(parseThemePref(null)).toBe("auto");
    expect(parseThemePref("blau")).toBe("auto");
  });
  it("l'script inicial posa data-theme només amb un valor vàlid", () => {
    expect(runScript("dark")).toBe("dark");
    expect(runScript("light")).toBe("light");
    expect(runScript(null)).toBeUndefined();
    expect(runScript("<script>")).toBeUndefined();
    expect(runScript("dark", true)).toBeUndefined();
  });
  it("applyThemePref posa o treu l'atribut i desa la preferència", () => {
    const attrs = new Map<string, string>();
    const store = new Map<string, string>();
    const el = { setAttribute: (k: string, v: string) => attrs.set(k, v), removeAttribute: (k: string) => attrs.delete(k) };
    const storage = { setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) };
    applyThemePref("dark", el, storage);
    expect(attrs.get("data-theme")).toBe("dark");
    expect(store.get(THEME_KEY)).toBe("dark");
    applyThemePref("auto", el, storage);
    expect(attrs.has("data-theme")).toBe(false);
    expect(store.has(THEME_KEY)).toBe(false);
  });
});
