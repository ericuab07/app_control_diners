# Panell de vida — Fase 3 (Llarg termini) — Pla d'implementació

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Objectius de l'any amb barra i ritme esperat, i el mòdul «Estudis UAB» (assignatures, entregues/exàmens i minuts d'estudi), amb targetes a «Avui» i la navegació final.

**Architecture:** Lògica pura a `src/lib/calc/goals.ts` i `src/lib/calc/study.ts` amb tests; quatre taules noves en una migració; pàgines `/objectius` i `/estudis`; targetes a `src/components/avui/`.

**Tech Stack:** Next.js 16, TypeScript, Tailwind 4, Supabase (RLS), vitest.

**Spec:** `docs/superpowers/specs/2026-11-12-panell-de-vida-design.md` · Plans anteriors a `docs/superpowers/plans/`.

## Global Constraints

- Les dels plans anteriors (català, variables CSS, ISO, `DataProvider` intacte, migració per fase + `get_advisors`, `(select auth.uid())`, índex a cada FK).
- Taules (spec): `goals` (`title`, `year`, `target_value`, `current_value`, `unit`); `courses` (`name`, `color`, `semester`, `archived`); `study_items` (`course_id`, `title`, `kind` entrega/examen/estudi, `due_date`, `done`); `study_logs` (`course_id`, `date`, `minutes`).
- Navegació final (spec): escriptori Avui · Hàbits · Objectius · Estudis · (Diari a la fase 4) · Diners · Configuració; mòbil Avui · Hàbits · + · Objectius · Més (Diners passa a «Més» amb Estudis i Configuració).

## Decisions d'aquesta fase

- **Ritme esperat** d'un objectiu = fracció de l'any `goal.year` transcorreguda a `today` (0 si l'any encara no ha començat, 1 si ja ha acabat). Estat: `done` si ràtio ≥ 1; `ahead` si ràtio ≥ esperat; `behind` si no. Textos: «Fet!», «Vas bé», «Per sota del ritme».
- `numeric` de Postgres arriba com a text: el `LifeProvider` el converteix a número (`target_value`, `current_value`).
- A «Avui» s'hi afegeix una targeta compacta «Properes entregues» (només si n'hi ha en 14 dies): l'spec no la dibuixa però és el que fa útil el mòdul d'estudis cada matí.
- Esborrar una assignatura esborra en cascada les seves entregues i minuts (avís a la confirmació).

## Review Focus

1. Objectiu amb `target_value` 0 o negatiu → rebutjat per la BD i pel formulari (T1, T2).
2. Objectiu d'un any passat o futur → ritme 1 o 0, sense `NaN` (T1).
3. Entrega vençuda i no feta → surt destacada com a «Fa N dies», no desapareix (T1).
4. Any de traspàs (366 dies) → fracció correcta el 31-des (T1).
5. Minuts d'estudi ≤ 0 → rebutjats (T2, BD).

---

### Task 1: Lògica d'objectius i estudis

**Files:** Create `src/lib/calc/goals.ts`, `src/lib/calc/study.ts`; Modify `src/lib/types.ts`; Test `tests/goals-study.test.ts`

**Produces:**
- Tipus `Goal { id; title; year: number; target_value: number; current_value: number; unit: string }`, `Course { id; name; color; semester: string; archived }`, `StudyKind = "entrega" | "examen" | "estudi"`, `StudyItem { id; course_id; title; kind; due_date: string; done }`, `StudyLog { id; course_id; date; minutes }`.
- `yearFraction(year: number, today: string): number`; `goalProgress(g: Pick<Goal,"year"|"target_value"|"current_value">, today): { ratio: number; expected: number; status: "done"|"ahead"|"behind" }`; `goalStatusLabel(status): string`.
- `upcomingItems(items, today, days = 14): StudyItem[]` (no fets amb `due_date <= today + days`, incloent els vençuts; ordenats per data); `dueLabel(due: string, today: string): string` («Avui», «Demà», «En N dies», «Fa N dies»); `minutesThisWeek(logs, today): Map<string, number>` per `course_id` des de `mondayOf(today)`.

- [ ] **Step 1: Tests:** `yearFraction(2026,"2026-01-01")` ≈ `0`; `(2026,"2026-07-02")` ≈ `0.5` (±0.01); `(2026,"2026-12-31")` ≈ `1` (±0.01, el dia en curs compta sencer); `(2028,"2028-12-31")` ≈ 1 (traspàs); `(2027,"2026-10-01") = 0`; `(2025,"2026-10-01") = 1`. `goalProgress` 12 de 24 llibres el 2026-07-02 → `ahead`; 6/24 → `behind`; 24/24 → `done`; ràtio màx. 1. `dueLabel` 0 → «Avui», 1 → «Demà», 5 → «En 5 dies», −2 → «Fa 2 dies». `upcomingItems` inclou un vençut no fet, exclou fets i els de >14 dies, ordena. `minutesThisWeek` suma només des de dilluns.
- [ ] **Step 2:** executa → falla. **Step 3:** implementa. **Step 4:** passa + lint. **Step 5: Commit** — «Afegeix la lògica d'objectius i estudis».

### Task 2: Taules i `LifeProvider`

**Files:** Create `supabase/migrations/20261112030000_life_long_term.sql`; Modify `src/components/LifeProvider.tsx`, `scripts/mock-supabase.mjs`

- [ ] **Step 1: Migració:** `goals` (`title` no buit, `year smallint check between 2000 and 2100`, `target_value numeric check > 0`, `current_value numeric default 0 check >= 0`, `unit text default ''`); `courses` (`name` no buit, `color text default '#b5522f'`, `semester text default ''`, `archived`); `study_items` (`course_id` FK cascade, `title` no buit, `kind check in (...)` default `'entrega'`, `due_date date not null`, `done bool default false`; índexs `course_id`, `(user_id, due_date)`); `study_logs` (`course_id` FK cascade, `date`, `minutes int check between 1 and 1440`; índexs `course_id`, `(user_id, date)`). RLS «own rows».
- [ ] **Step 2:** aplica, `get_advisors`, i comprova amb `execute_sql` que `target_value 0` i `minutes 0` es rebutgen (bloc que acaba amb excepció).
- [ ] **Step 3:** `LifeProvider`: 4 taules noves; `study_logs` a `DATED`; normalitza `goals.target_value/current_value` a `Number`; `remove("courses")` treu de l'estat els seus `study_items` i `study_logs`. Mock amb dades d'exemple.
- [ ] **Step 4:** lint + build. **Commit** — «Afegeix objectius i estudis a la base de dades».

### Task 3: Pàgina `/objectius` i navegació final

**Files:** Create `src/app/(app)/objectius/page.tsx`, `src/components/goals/GoalForm.tsx`, `src/components/goals/GoalBar.tsx`; Modify `src/lib/nav.ts`, `tests/nav.test.ts`, `src/components/AppShell.tsx`

- [ ] **Step 1: Test nav:** `sectionOf("/objectius")="objectius"`, `sectionOf("/estudis/x")="estudis"` → falla; afegeix-les a `Section`/`SIMPLE` → passa.
- [ ] **Step 2:** `GoalBar`: barra de progrés amb una marca vertical al ritme esperat i el text `current / target unit · Vas bé` (accessible: `role="progressbar"`).
- [ ] **Step 3:** `GoalForm`: títol, any (per defecte l'actual), meta (> 0), valor actual (≥ 0), unitat; esborrar amb confirmació.
- [ ] **Step 4:** Pàgina: selector d'any (anys amb objectius + l'actual), llista amb `GoalBar` i botons «−1» / «+1» per actualitzar ràpid el valor actual, `EmptyState`.
- [ ] **Step 5:** `AppShell`: `NAV` = Avui (bar) · Hàbits (bar) · Objectius (`Target`, bar) · Estudis (`GraduationCap`, more) · Diners (more) · Configuració (more). La barra lateral mostra tots en aquest ordre.
- [ ] **Step 6:** lint/test/build. **Commit** — «Afegeix la pàgina d'objectius i la navegació final».

### Task 4: Pàgina `/estudis`

**Files:** Create `src/app/(app)/estudis/page.tsx`, `src/components/study/CourseForm.tsx`, `src/components/study/StudyItemForm.tsx`, `src/components/study/StudyLogForm.tsx`

- [ ] **Step 1:** `CourseForm`: nom, color (`ColorPicker`), semestre (text lliure, ex. «2n quad. 2026-27»), arxivar/esborrar (avís de cascada).
- [ ] **Step 2:** `StudyItemForm`: assignatura, títol, tipus (`Segmented` Entrega/Examen/Estudi), data; editar/esborrar.
- [ ] **Step 3:** `StudyLogForm`: assignatura, data (avui), minuts (enter 1–1440; dreceres 25/50/90).
- [ ] **Step 4:** Pàgina: «Properes» (`upcomingItems`, casella per marcar feta, `dueLabel`, vençudes en `text-expense`), «Aquesta setmana» (minuts per assignatura amb `formatDuration`), «Assignatures» (targetes amb color, pendents i botó d'editar), estat buit amb acció.
- [ ] **Step 5:** lint/test/build. **Commit** — «Afegeix la pàgina d'estudis».

### Task 5: Targetes a «Avui» i tancament

**Files:** Create `src/components/avui/GoalsCard.tsx`, `src/components/avui/StudyCard.tsx`; Modify `src/app/(app)/page.tsx`, `src/components/QuickAdd.tsx`, `CLAUDE.md`

- [ ] **Step 1:** `GoalsCard` «Objectius {any}»: fins a 4 objectius de l'any actual amb `GoalBar`; buit → enllaç a `/objectius`.
- [ ] **Step 2:** `StudyCard` «Properes entregues»: fins a 4 `upcomingItems` amb color de l'assignatura i `dueLabel`; no es renderitza si no n'hi ha.
- [ ] **Step 3:** Pàgina: fila 3 d'escriptori = Comptes enrere + Objectius + Diners (2/2/2), «Properes entregues» al costat de l'agenda (sota «Les 3»). Mòbil: … Hàbits, Entregues, Comptes enrere, Objectius, Diners. `QuickAdd` + «Entrega o examen» i «Temps d'estudi».
- [ ] **Step 4:** lint/test/build, prova amb el mock (1280 fosc, 375 clar), `CLAUDE.md`, **commit** — «Afegeix objectius i entregues a Avui» i `git push`.
