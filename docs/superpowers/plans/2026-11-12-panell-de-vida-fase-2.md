# Panell de vida — Fase 2 (Hàbits i salut) — Pla d'implementació

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hàbits amb ratxes (pàgina `/habits` i targeta a «Avui») i «El teu dia en números» (aigua amb gotes, son, passos, entreno), tot sumat al cercle de progrés del dia.

**Architecture:** Lògica pura a `src/lib/calc/habits.ts` i `src/lib/calc/health.ts` amb tests; tres taules noves (migració de fase) carregades pel `LifeProvider`, que guanya `upsert`; components a `src/components/avui/` i `src/components/habits/`.

**Tech Stack:** Next.js 16, TypeScript, Tailwind 4, Supabase (RLS), vitest, lucide-react.

**Spec:** `docs/superpowers/specs/2026-11-12-panell-de-vida-design.md` · Pla anterior: `docs/superpowers/plans/2026-11-12-panell-de-vida-fases-0-1.md`

## Global Constraints

- Les mateixes que el pla de les Fases 0–1 (català, colors via variables CSS, dates ISO, `weekday` 0 = dilluns, `DataProvider` intacte, una migració per fase aplicada amb el connector i `get_advisors`).
- Taules (spec): `habits` (`name`, `icon`, `target_per_week` 1–7 on 7 = diari, `archived`); `habit_logs` (`habit_id` FK cascade, `date`, `unique(habit_id, date)`; que existeixi = fet); `health_logs` (`date` amb `unique(user_id, date)`, `sleep_minutes`, `steps`, `water_glasses`, `workout` `done`/`rest`/null).
- Metes de salut des de `settings`: `step_goal`, `water_goal`, `sleep_goal_minutes`.
- Progrés del dia = tasques del dia + hàbits que toquen avui + 4 metes de salut (aigua, passos, son, entreno).
- Polítiques RLS amb `(select auth.uid())` i índex a cada FK (skill `supabase-postgres-best-practices`).

## Decisions d'aquesta fase (l'spec no les fixa)

- **Quan «toca» un hàbit:** diari (7) → cada dia. Amb meta setmanal `n < 7` → toca mentre la setmana (dilluns–diumenge) no ha arribat a `n`, i també el dia que s'ha fet.
- **Ratxa:** hàbit diari en **dies** consecutius; setmanal en **setmanes** consecutives complertes. Si avui (o aquesta setmana) encara no s'ha fet, la ratxa compta fins ahir (o la setmana passada): no es trenca fins que el període acaba.
- **Entreno:** «Entrenat» i «Descans» compten tots dos com a fet (descansar és part del pla).
- Navegació: «Hàbits» a la barra (escriptori i mòbil): Avui · Hàbits · + · Diners · Més.

## Review Focus

1. Hàbit setmanal 3/setmana ja complert dimecres → dijous no ha de sortir com a pendent ni baixar el progrés (T1).
2. Ratxa d'un hàbit diari no fet encara avui → no ha de mostrar 0 a primera hora (T1).
3. Dia sense fila a `health_logs` → números a 0 sense `NaN`, i les 4 metes compten com a pendents (T1).
4. Dos dispositius apuntant aigua alhora → `upsert` per `(user_id, date)`, sense duplicats (T2, BD).
5. Esborrar un hàbit → els seus registres desapareixen (cascade) i la ratxa no peta (T2, BD).

---

### Task 1: Lògica d'hàbits i salut

**Files:** Create `src/lib/calc/habits.ts`, `src/lib/calc/health.ts`; Modify `src/lib/types.ts`; Test `tests/habits-health.test.ts`

**Interfaces — Produces:**
- `interface Habit { id; name; icon; target_per_week: number; archived: boolean }`, `interface HabitLog { id; habit_id; date }`, `type Workout = "done" | "rest"`, `interface HealthLog { id; date; sleep_minutes: number | null; steps: number | null; water_glasses: number; workout: Workout | null }`.
- `habits.ts`: `doneDates(logs: Pick<HabitLog,"habit_id"|"date">[], habitId: string): Set<string>`; `weeklyCompliance(habit: Pick<Habit,"target_per_week">, done: Set<string>, today: string): { done: number; target: number; ratio: number }` (setmana de `mondayOf(today)` a `today`); `isDueOn(habit, done, date): boolean`; `streaks(habit, done, today): { current: number; best: number; unit: "dies" | "setmanes" }`.
- `health.ts`: `healthItems(log: HealthLog | undefined, goals: Pick<Settings,"step_goal"|"water_goal"|"sleep_goal_minutes">): { key: "water"|"steps"|"sleep"|"workout"; done: boolean }[]`.

- [ ] **Step 1: Tests** (avui = `"2026-10-29"`, dijous):
  `weeklyCompliance` 3/setm amb fets 26 i 28 → `{done 2, target 3}`; diari amb 26–29 → `{4, 7}`.
  `isDueOn`: diari sempre `true`; 3/setm amb 26, 27, 28 fets → dijous `false`; amb 26 i 27 → `true`; dia ja fet → `true`.
  `streaks` diari: fets 25–28 (avui no) → `current 4`; fets 25–29 → `5`; fets 20–22 i 27–28 → `current 2, best 3`; cap → `0, 0`, unit `"dies"`.
  `streaks` 2/setm: setmanes del 12-oct i 19-oct complertes, la de 26-oct amb 1 → `current 2`, unit `"setmanes"`; si la del 26-oct ja en té 2 → `3`.
  `healthItems(undefined, goals)` → 4 items tots `done false`; aigua 8/8 → `water true`; passos 7999/8000 → `false`; son 450/450 → `true`; `workout "rest"` → `true`.
- [ ] **Step 2:** `npx vitest run tests/habits-health.test.ts` → falla. **Step 3:** Implementa. **Step 4:** passa; `npm run lint`.
- [ ] **Step 5: Commit** — «Afegeix la lògica d'hàbits i salut».

### Task 2: Taules i `LifeProvider`

**Files:** Create `supabase/migrations/20261112020000_life_habits_health.sql`; Modify `src/components/LifeProvider.tsx`, `scripts/mock-supabase.mjs`

**Interfaces — Produces:** `useLife()` torna també `habits`, `habit_logs`, `health_logs` i `upsert<K>(table: K, row: Partial<LifeTables[K]>, onConflict: string): Promise<LifeTables[K]>`.

- [ ] **Step 1: Migració** amb el patró global: `habits` (`name text not null check length(trim)>0`, `icon text default '✅'`, `target_per_week smallint default 7 check between 1 and 7`, `archived bool default false`); `habit_logs` (`habit_id uuid not null references habits on delete cascade`, `date date not null`, `unique(habit_id, date)`, índexs `(user_id, date)`); `health_logs` (`date not null`, `sleep_minutes int check between 0 and 1440`, `steps int check >= 0`, `water_glasses smallint not null default 0 check between 0 and 30`, `workout text check in ('done','rest')`, `updated_at`, `unique(user_id, date)`).
- [ ] **Step 2:** Aplica-la, `get_advisors` (security) sense avisos de RLS; amb `execute_sql` comprova que esborrar un hàbit esborra els seus logs (dins d'un bloc que acaba amb excepció per desfer-ho).
- [ ] **Step 3:** `LifeProvider`: afegeix les 3 taules a `LifeTables`/`EMPTY`/`reload`; `habit_logs` i `health_logs` a `DATED`; `upsert` amb `.upsert(row, { onConflict }).select().single()` que substitueix o afegeix a l'estat per `id`; `remove("habits")` també treu els `habit_logs` d'aquell hàbit de l'estat. Mock: les 3 taules amb dades d'exemple i `on_conflict` genèric.
- [ ] **Step 4:** `npm run lint && npm run build`. **Step 5: Commit** — «Afegeix hàbits i registres de salut».

### Task 3: Pàgina `/habits` i navegació

**Files:** Create `src/app/(app)/habits/page.tsx`, `src/components/habits/HabitForm.tsx`, `src/components/habits/HabitRow.tsx`; Modify `src/lib/nav.ts`, `tests/nav.test.ts`, `src/components/AppShell.tsx`

- [ ] **Step 1: Test** a `tests/nav.test.ts`: `sectionOf("/habits") = "habits"`, `sectionOf("/habits-x") = null` → falla; afegeix `"habits"` a `Section` → passa.
- [ ] **Step 2:** `HabitForm` (Modal): nom, icona (emoji), «Cada dia» o «N cops per setmana» (1–6), arxivar, esborrar amb confirmació («S'esborrarà tot el seu historial»).
- [ ] **Step 3:** `HabitRow`: icona, nom, ratxa (`🔥 N dies/setmanes`, millor ratxa), compliment setmanal, i una tira dels últims 7 dies amb botons per marcar/desmarcar cada dia (`insert`/`remove` de `habit_logs`; no es poden marcar dies futurs).
- [ ] **Step 4:** Pàgina: `PageHeader` «Hàbits» amb botó «Nou hàbit», llista d'actius, secció plegable d'arxivats, `EmptyState` amb exemples.
- [ ] **Step 5:** `AppShell`: «Hàbits» (`/habits`, icona `Flame`, `bar`) després d'Avui.
- [ ] **Step 6:** lint, test, build. **Commit** — «Afegeix la pàgina d'hàbits».

### Task 4: Targetes d'«Avui» i progrés complet

**Files:** Create `src/components/avui/HabitsCard.tsx`, `src/components/avui/NumbersCard.tsx`; Modify `src/components/avui/DayCard.tsx`, `src/app/(app)/page.tsx`, `src/components/QuickAdd.tsx`

- [ ] **Step 1:** `HabitsCard` «Hàbits d'avui»: els que `isDueOn(avui)` amb casella (insert/remove del log d'avui) i ratxa; buit → enllaç «Crea el teu primer hàbit» a `/habits`.
- [ ] **Step 2:** `NumbersCard` «El teu dia en números»: aigua com a fila de `water_goal` gotes clicables (la gota `i` posa `water_glasses = i+1`, tornar a clicar l'última la treu), passos i son amb camp numèric que desa en perdre el focus (son en hores, es desa en minuts), entreno amb `Segmented` Entrenat/Descans (tornar a clicar el triat el treu). Tot amb `upsert("health_logs", {...log, date}, "user_id,date")` i barres/indicadors contra la meta.
- [ ] **Step 3:** `DayCard`: `dayProgress([...tasques d'avui, ...hàbits que toquen avui (fet = log d'avui), ...healthItems(log d'avui, settings)])`.
- [ ] **Step 4:** Pàgina: fila 2 d'escriptori = El teu dia + Números + Hàbits; fila 3 = Comptes enrere + Diners. Mòbil: capçalera, focus, El teu dia, Les 3, Agenda, Números, Hàbits, Comptes enrere, Diners. `QuickAdd` guanya «Nou hàbit».
- [ ] **Step 5:** lint, test, build; prova amb `scripts/mock-supabase.mjs` a 1280 px fosc i 375 px clar.
- [ ] **Step 6:** `CLAUDE.md` («Estat», «Pendent», «Convencions»), **commit** — «Afegeix hàbits i números a Avui» i `git push`.
