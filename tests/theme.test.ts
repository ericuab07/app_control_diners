import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "../src/app/globals.css"), "utf8");

function block(source: string, start: number): string {
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}" && --depth === 0) return source.slice(open + 1, i);
  }
  throw new Error("bloc sense tancar");
}

function tokens(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

const light = tokens(block(css, css.indexOf(":root")));
const darkMedia = block(css, css.indexOf("@media (prefers-color-scheme: dark)"));
const dark = tokens(block(darkMedia, darkMedia.indexOf(":root")));
const forcedDark = tokens(block(css, css.indexOf(':root[data-theme="dark"]')));

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const PAIRS: [string, string][] = [
  ["--text", "--bg"],
  ["--muted", "--surface"],
  ["--primary-fg", "--primary"],
];

describe("tema", () => {
  it("contrast mínim 4.5 en clar i fosc", () => {
    for (const [name, scheme] of [["clar", light], ["fosc", dark]] as const) {
      expect(scheme["--done"], `${name}: falta --done`).toBeDefined();
      expect(scheme["--done-bg"], `${name}: falta --done-bg`).toBeDefined();
      for (const [fg, bg] of PAIRS) {
        expect(contrast(scheme[fg], scheme[bg]), `${name}: ${fg} sobre ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("el tema triat a mà guanya al del sistema", () => {
    // El fosc automàtic no s'aplica si l'usuari ha triat clar.
    expect(css).toContain(':root:not([data-theme="light"])');
    // El fosc forçat té exactament els mateixos colors que el fosc automàtic.
    expect(forcedDark).toEqual(dark);
    expect(css).toMatch(/:root\[data-theme="light"\]\s*\{\s*color-scheme:\s*light/);
    expect(css).toMatch(/:root\[data-theme="dark"\]\s*\{[^}]*color-scheme:\s*dark/);
  });
});
