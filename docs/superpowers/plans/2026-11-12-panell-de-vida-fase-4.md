# Panell de vida — Fase 4 (Diari) — Pla d'implementació

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Diari amb ànim 1–5 i nota per dia, gràfic d'evolució, frase del dia rotativa, i repàs final del projecte amb `CLAUDE.md` al dia.

**Architecture:** Lògica pura a `src/lib/calc/journal.ts` amb test; taula `journal_entries` (una per dia, `upsert`); pàgina `/diari` amb Recharts; targeta «Com estàs?» a Avui.

**Tech Stack:** Next.js 16, TypeScript, Tailwind 4, Supabase (RLS), Recharts, vitest.

**Spec:** `docs/superpowers/specs/2026-11-12-panell-de-vida-design.md` · Plans anteriors a `docs/superpowers/plans/`.

## Global Constraints

- Les dels plans anteriors. Taula (spec): `journal_entries` (`date` amb `unique(user_id, date)`, `mood` 1–5, `note`).
- Gràfic (skill `dataviz`): una sola sèrie (sense llegenda; el títol la nomena), línia 2 px amb `var(--primary)`, punts ≥ 8 px, eix Y fix 1–5 amb emojis, graella recessiva, tooltip en passar per sobre, buits on no hi ha registre (sense unir), i la llista d'entrades com a vista textual.

## Decisions d'aquesta fase

- Escala d'ànim: 1 😞 Molt malament · 2 🙁 Malament · 3 😐 Normal · 4 🙂 Bé · 5 😄 Molt bé.
- `note` pot ser buida; `mood` és obligatori (sense ànim no es desa l'entrada).
- `quoteOfDay` determinista per data (mateixa frase tot el dia, a tots els dispositius); les frases són pròpies, en català, sense citar obres amb drets.
- Navegació: «Diari» (`NotebookPen`) a la barra lateral després d'Estudis; al mòbil, dins «Més».

## Review Focus

1. Dia sense entrada → el gràfic mostra un buit, no un 0 (T1).
2. Mitjana sense cap entrada → `null` («—»), sense `NaN` (T1).
3. Dos dispositius desant el mateix dia → `upsert` per `(user_id, date)` (T2).
4. Ànim fora de 1–5 → rebutjat per la BD (T2).
5. La frase del dia no canvia en recarregar el mateix dia (T1).

---

### Task 1: Lògica del diari i frases

**Files:** Create `src/lib/calc/journal.ts`; Modify `src/lib/types.ts`, `src/lib/defaults.ts` (`QUOTES` ≥ 12 frases); Test `tests/journal.test.ts`

**Produces:** `type Mood = 1|2|3|4|5`; `interface JournalEntry { id; date; mood: Mood; note: string }`; `MOODS: { value: Mood; emoji: string; label: string }[]`; `moodSeries(entries, today, days = 30): { date: string; mood: Mood | null }[]` (de més antic a avui); `averageMood(entries, from, to): number | null`; `quoteOfDay(iso: string, quotes: string[]): string`.

- [ ] **Step 1: Tests:** `moodSeries` de 3 dies amb entrada només el del mig → `[null, 4, null]` i dates correctes; `averageMood` buit → `null`, de 2 i 4 → `3`, ignora fora de rang; `quoteOfDay` mateix dia → mateixa frase, dos dies consecutius → frases diferents, llista d'un element → aquell element.
- [ ] **Step 2–4:** falla → implementa (índex = dies des de 1970-01-01 en UTC mòdul la llargada) → passa. **Step 5: Commit** — «Afegeix la lògica del diari».

### Task 2: Taula, `LifeProvider` i mock

**Files:** Create `supabase/migrations/20261112040000_life_journal.sql`; Modify `src/components/LifeProvider.tsx`, `scripts/mock-supabase.mjs`

- [ ] **Step 1:** Migració: `journal_entries` (`date not null`, `mood smallint not null check between 1 and 5`, `note text not null default ''`, `updated_at`, `unique(user_id, date)`), RLS «own rows». Aplica, `get_advisors`, comprova amb `execute_sql` que `mood 6` es rebutja.
- [ ] **Step 2:** `LifeProvider`: `journal_entries` a `LifeTables`, `EMPTY`, `reload`, `DATED`. Mock amb ~20 dies d'exemple. lint + build. **Commit** — «Afegeix la taula del diari».

### Task 3: Pàgina `/diari`, targeta i frase del dia

**Files:** Create `src/app/(app)/diari/page.tsx`, `src/components/journal/MoodPicker.tsx`, `src/components/journal/MoodChart.tsx`, `src/components/avui/MoodCard.tsx`; Modify `src/lib/nav.ts` + test, `src/components/AppShell.tsx`, `src/components/avui/TopThree.tsx`, `src/app/(app)/page.tsx`

- [ ] **Step 1: Test nav** `sectionOf("/diari") = "diari"` → falla → afegeix → passa.
- [ ] **Step 2:** `MoodPicker` (5 botons amb emoji, `aria-pressed`, etiqueta visible a la seleccionada).
- [ ] **Step 3:** `MoodChart`: `moodSeries` 30 dies, Recharts `LineChart` segons les restriccions globals; mitjana dels 30 dies al títol.
- [ ] **Step 4:** Pàgina: editor d'avui (o del dia triat amb `<input type="date">`): ànim + nota (`textarea`, màx. 2000) i «Desar» amb `upsert(..., "user_id,date")`; gràfic; llista de les últimes entrades (data llarga, emoji, nota) que obre l'edició d'aquell dia.
- [ ] **Step 5:** `MoodCard` a Avui: «Com estàs avui?» amb `MoodPicker` que desa directament i enllaç «Escriu al diari»; si ja hi ha entrada, mostra l'ànim i el principi de la nota. `TopThree` mostra `quoteOfDay(today, QUOTES)`.
- [ ] **Step 6:** Nav: «Diari» (`more`). lint/test/build, prova amb mock. **Commit** — «Afegeix el diari».

### Task 4: Repàs final

- [ ] **Step 1:** `npm run lint && npm test && npm run build` en verd; repàs de totes les pàgines amb el mock (1280 fosc, 375 clar) i de la consola.
- [ ] **Step 2:** Auto-revisió de tota la branca (skill `code-reviewer` sense subagent) contra els Review Focus de cada pla; correccions amb test.
- [ ] **Step 3:** `CLAUDE.md` final («Estat», «Pendent», «Convencions», «Skills utilitzades»), **commit** — «Tanca el panell de vida» i `git push`.
