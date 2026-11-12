# Panell de vida — Fases 0 i 1 — Pla d'implementació

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir l'app en un panell de vida: pell nova a tota l'app, navegació amb «Avui» com a portada i els diners com a mòdul, i la portada «Avui» amb salutació, focus de la setmana, les 3 d'avui, progrés del dia, agenda, comptes enrere i targeta de diners.

**Architecture:** Next.js client-side com ara. Lògica pura a `src/lib/calc/` amb tests; un `LifeProvider` nou (al costat de `DataProvider`, que no es toca) carrega les taules noves de Supabase; components de la portada a `src/components/avui/`.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind 4, Supabase (RLS), vitest, lucide-react, Playwright (ja instal·lat) per al smoke test.

**Spec:** `docs/superpowers/specs/2026-11-12-panell-de-vida-design.md`

**Abast d'aquest pla:** Fases 0 i 1 al detall. Les Fases 2–4 s'esbossen al final i **cadascuna tindrà el seu pla** (skill `writing-plans`) quan hi arribem.

## Global Constraints

- Tot el text de la interfície en **català**. Colors només via variables CSS de `globals.css` (clar i fosc automàtic). Tipografia serif = pila del sistema `Georgia, "Iowan Old Style", "Palatino Linotype", serif`, sense fonts externes.
- Dates com a cadena ISO `YYYY-MM-DD` en hora local (`src/lib/dates.ts`); **mai `Date` a l'estat**. Hores com a text `HH:MM` (Postgres `time` torna `HH:MM:SS`: es normalitza a `HH:MM` en carregar).
- `weekday` = 0–6 amb **0 = dilluns … 6 = diumenge** (no el `getDay()` de JS).
- Taula nova ⇒ `id uuid`, `user_id uuid not null default auth.uid()` (FK `auth.users` `on delete cascade`), `created_at`, RLS `user_id = auth.uid()` amb la mateixa política `"own rows"` de la migració inicial. Una migració per fase a `supabase/migrations/`, aplicada amb el connector de Supabase (projecte `jmmeioofkbvkxhlfjbhg`); després `get_advisors` (seguretat) sense avisos de RLS per a les taules noves.
- `DataProvider.tsx` **no es modifica**. La lògica nova va a `src/lib/calc/` amb el test a `tests/` (imports relatius `../src/lib/...`, com `tests/calc.test.ts`).
- Etiquetes de progrés del dia: `< 30 %` «Empeça per una», `30–69 %` «Bon ritme», `70–99 %` «Gairebé», `100 %` «Dia validat».
- Abans de tocar APIs del framework Next, llegeix la guia rellevant de `node_modules/next/dist/docs/` (AGENTS.md).
- Branca `ccr-02d68289-ugjdrz`. Missatges de commit en català, imperatiu, acabats amb les línies d'atribució que la sessió indiqui. Cada tasca acaba amb `npm run lint && npm test` en verd (la fase sencera, a més, `npm run build`).

## Review Focus

Entrades que l'spec no esmenta i que fallarien primer (cada una té test a la tasca indicada):

1. Una 4a prioritat el mateix dia (no queda `top_rank` lliure) → missatge d'error clar, sense petar (T7, T9).
2. Esdeveniment amb fi ≤ inici o que travessa mitjanit → rebutjat; hores `HH:MM:SS` de Postgres s'accepten (T6).
3. Diumenge (JS `getDay()=0`) mal mapat a `weekday`; esdeveniment setmanal després de `repeat_until` (T2, T6).
4. Dia sense cap tasca/hàbit → cercle «0 de 0» sense `NaN %` (T7).
5. Compte enrere ja passat, o `start_date ≥ target_date`, o canvi d'hora d'estiu fent sortir un dia de menys (T7).

Altres (focus de setmanes anteriors, primera sessió sense fila a `settings`) es cobreixen a T2 i T4.

---

## Fase 0 — Base

### Task 1: Pell del vídeo a tota l'app

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx` (`themeColor`), `src/app/manifest.ts` (`background_color`, `theme_color`), `src/components/ui.tsx` (`PageHeader` h1 i valor de `Stat` en serif)
- Test: `tests/theme.test.ts`

**Interfaces:**
- Produces: tokens CSS nous `--done`, `--done-bg` i `--font-serif`, i classes Tailwind `text-done`, `bg-done-bg`, `font-serif` (via `@theme inline`).

- [ ] **Step 1: Instal·la i comprova la base.** `npm ci && npm test` → els tests existents passen.
- [ ] **Step 2: Escriu `tests/theme.test.ts`.** Llegeix `src/app/globals.css`, extreu el bloc `:root { … }` (clar) i el de `@media (prefers-color-scheme: dark) { :root { … } }`, i comprova per a cada esquema el contrast WCAG (`≥ 4.5`) dels parells `--text`/`--bg`, `--muted`/`--surface`, `--primary-fg`/`--primary`. Nom del test: `"contrast mínim 4.5 en clar i fosc"`. Ha de **fallar** abans de canviar la paleta si falta el parser o els tokens `--done` (comprova també que existeixin `--done` i `--done-bg` als dos esquemes).
- [ ] **Step 3: Aplica la paleta.** Clar: `--bg #f7f3ee`, `--surface #fffdfa`, `--surface-2 #f0e9e0`, `--border #e3d9cc`, `--text #2a211a`, `--muted #7d6e5f`, `--primary #b5522f`, `--primary-fg #ffffff`, `--income #1f8a5b`, `--expense #c9453a`, `--warn #b86e00`, `--done #1f8a5b`, `--done-bg #e3f1e8`. Fosc: `--bg #14100e`, `--surface #1c1713`, `--surface-2 #261f19`, `--border #352a21`, `--text #f1e9df`, `--muted #a39382`, `--primary #d97757`, `--primary-fg #1a120d`, `--income #5fbf8f`, `--expense #ff7a6b`, `--warn #f0b23e`, `--done #5fbf8f`, `--done-bg #1d3328`. Si un parell no arriba a 4.5, enfosqueix/aclareix `--muted` o `--primary` fins que passi. Afegeix `--font-serif` i els `--color-done*` a `@theme inline`; `themeColor` = `#f7f3ee` / `#14100e`; manifest `background_color #14100e`, `theme_color #d97757`.
- [ ] **Step 4: Serif a `ui.tsx`.** `PageHeader` h1 i el `<p>` de valor de `Stat` reben `font-serif`.
- [ ] **Step 5: Verifica.** `npm test` (theme passa) i `npm run build`.
- [ ] **Step 6: Commit** `git add -A && git commit` — «Aplica la pell del panell de vida».

### Task 2: Helpers de temps, setmana i dates

**Files:**
- Create: `src/lib/time.ts`, `src/lib/calc/week.ts`
- Modify: `src/lib/dates.ts` (afegeix `addDaysISO`, `formatLongDate`)
- Test: `tests/time-week.test.ts`

**Interfaces:**
- Produces (`time.ts`): `toMinutes(hhmm: string): number` (accepta `"09:30"` i `"09:30:00"`), `nowHHMM(d?: Date): string`, `formatDuration(minutes: number): string` (`"45 min"`, `"2 h"`, `"1 h 30 min"`), `greeting(hour: number): string`.
- Produces (`week.ts`): `weekdayOf(iso: string): number` (0 = dilluns), `mondayOf(iso: string): string`, `isoWeekNumber(iso: string): number`, `focusIsCurrent(focusMonday: string | null, today: string): boolean`.
- Produces (`dates.ts`): `addDaysISO(iso: string, n: number): string`, `formatLongDate(iso: string): string` (ca-ES, primera lletra en majúscula, p. ex. «Dimarts, 27 d'octubre»).

- [ ] **Step 1: Tests** (`describe` per fitxer) amb aquests valors:
  `toMinutes("09:30")=570`, `toMinutes("09:30:00")=570`; `formatDuration(45)="45 min"`, `(120)="2 h"`, `(90)="1 h 30 min"`;
  `greeting(6)="Bon dia"`, `(13)="Bon dia"`, `(14)="Bona tarda"`, `(20)="Bona tarda"`, `(21)="Bona nit"`, `(3)="Bona nit"`;
  `weekdayOf("2026-10-27")=1`, `weekdayOf("2026-10-25")=6` (diumenge), `weekdayOf("2026-10-26")=0`;
  `mondayOf("2026-10-27")="2026-10-26"`, `mondayOf("2026-10-25")="2026-10-19"`, `mondayOf("2026-10-26")="2026-10-26"`;
  `isoWeekNumber("2026-10-27")=44`, `isoWeekNumber("2026-01-01")=1`, `isoWeekNumber("2027-01-03")=53`;
  `focusIsCurrent("2026-10-26","2026-10-30")=true`, `("2026-10-19","2026-10-27")=false` (focus caducat), `(null,"2026-10-27")=false`;
  `addDaysISO("2026-10-31",1)="2026-11-01"`, `addDaysISO("2026-03-01",-1)="2026-02-28"`; `formatLongDate("2026-10-27")` conté `"octubre"` i `"27"`.
- [ ] **Step 2:** Executa `npx vitest run tests/time-week.test.ts` → falla (mòduls inexistents).
- [ ] **Step 3: Implementa** els helpers. `week.ts` i `addDaysISO` es calculen amb `Date` local construït per components (com `dates.ts`); `isoWeekNumber` segons ISO 8601 (el dijous de la setmana decideix l'any).
- [ ] **Step 4:** Mateix test → passa. `npm run lint`.
- [ ] **Step 5: Commit** — «Afegeix helpers de temps i setmana».

### Task 3: Navegació amb «Avui» i el grup «Diners»

**Files:**
- Create: `src/lib/nav.ts`, `src/components/DinersTabs.tsx`, `src/app/(app)/diners/page.tsx`
- Modify: `src/components/AppShell.tsx`, `src/app/(app)/page.tsx` (queda un placeholder «Avui» fins a T5), `src/app/layout.tsx` (títol), `src/app/manifest.ts` (noms)
- Test: `tests/nav.test.ts`

**Interfaces:**
- Produces (`nav.ts`): `type Section = "avui" | "diners" | "configuracio"`, `DINERS_PATHS: readonly string[]` (`/diners`, `/ingressos`, `/despeses`, `/accions`, `/pressupostos`, `/estadistiques`), `sectionOf(pathname: string): Section | null`, `isDinersPath(pathname: string): boolean`.
- Produces: `<DinersTabs />` (pestanyes secundàries Balanç · Ingressos · Despeses · Accions · Pressupostos · Estadístiques, desplaçables en horitzontal, `aria-current` a l'activa).

- [ ] **Step 1: Test `tests/nav.test.ts`:** `sectionOf("/")="avui"`; `"/diners"`, `"/ingressos"`, `"/despeses/x"`, `"/estadistiques"` → `"diners"`; `"/configuracio"` → `"configuracio"`; `"/diners-extra"` → `null` (límit de segment); `isDinersPath("/accions")=true`, `isDinersPath("/")=false`.
- [ ] **Step 2:** Executa el test → falla. **Step 3:** Implementa `nav.ts` → passa.
- [ ] **Step 4: Mou el balanç.** Llegeix a `node_modules/next/dist/docs/` la guia de rutes/layouts i mou el contingut actual de `src/app/(app)/page.tsx` a `src/app/(app)/diners/page.tsx` (`git mv`; renombra el component a `DinersPage`; res més canvia). `page.tsx` queda com a placeholder amb `PageHeader title="Avui"`.
- [ ] **Step 5: `AppShell`.** `NAV` passa a ser dades `{ section, href, label, icon, mobile: "bar" | "more" }` amb: Avui (`/`, bar), Diners (`/diners`, bar), Configuració (`/configuracio`, more). L'actiu es calcula amb `sectionOf`. Barra inferior: `[...bar a l'esquerra, botó «+», ...resta de bar, «Més» amb els items "more"]` amb `grid-flow-col auto-cols-fr`. El botó «Nou moviment» (a la barra lateral i el «+» de la barra inferior) només es mostra al grup Diners (`isDinersPath`); a la resta no apareix fins a T11, que el fa contextual. Renderitza `<DinersTabs />` sobre `{children}` quan `isDinersPath(pathname)`. Marca de la barra lateral: «🌅 Panell de vida».
- [ ] **Step 6: Metadades.** Títol `"Panell de vida"` i descripció adaptada a `layout.tsx`; `name: "Panell de vida"`, `short_name: "Panell"` al manifest.
- [ ] **Step 7: Verifica.** `npm run lint && npm test && npm run build`; `npm run dev` i comprova a mà que `/diners`, `/ingressos` i `/configuracio` carreguen i que les pestanyes de Diners naveguen.
- [ ] **Step 8: Commit** — «Reorganitza la navegació: Avui i Diners».

### Task 4: Taula `settings` i `LifeProvider`

**Files:**
- Create: `supabase/migrations/20261112000000_life_settings.sql`, `src/components/LifeProvider.tsx`
- Modify: `src/lib/types.ts` (`Settings`), `src/lib/defaults.ts` (`DEFAULT_SETTINGS`), `src/app/(app)/layout.tsx` (munta `LifeProvider` dins de `DataProvider`)

**Interfaces:**
- Produces: `interface Settings { display_name: string; week_focus: string; week_focus_monday: string | null; step_goal: number; water_goal: number; sleep_goal_minutes: number }`; `DEFAULT_SETTINGS: Settings` (`""`, `""`, `null`, `8000`, `8`, `450`).
- Produces: `<LifeProvider session={Session}>` i `useLife(): { settings: Settings; saveSettings(patch: Partial<Settings>): Promise<void> }` (T8 hi afegirà taules).

- [ ] **Step 1: Migració.** Taula `public.settings` amb `unique(user_id)`, les 6 columnes de `Settings` amb els defaults de `DEFAULT_SETTINGS` i `check (> 0)` a les tres metes, `updated_at timestamptz default now()`, més la política `"own rows"` (mateix patró que la migració inicial).
- [ ] **Step 2: Aplica-la** amb `mcp__Supabase__apply_migration` (projecte `jmmeioofkbvkxhlfjbhg`) i executa `mcp__Supabase__get_advisors` (security) → cap avís de RLS per a `settings`. És additiva: no toca cap taula existent.
- [ ] **Step 3: `LifeProvider`.** Mateix patró que `DataProvider` (estat `loading | ready | error`, mateixos textos i botó «Tornar-ho a provar», recàrrega quan canvia `session.user.id`). Carrega `settings` amb `select().maybeSingle()`; **si no hi ha fila, usa `DEFAULT_SETTINGS` sense escriure res**. `saveSettings` fa `upsert({...settings, ...patch}, { onConflict: "user_id" })` i actualitza l'estat (així la primera sessió o dos dispositius alhora no creen duplicats).
- [ ] **Step 4: Munta'l** a `(app)/layout.tsx`: `DataProvider > LifeProvider > AppShell`.
- [ ] **Step 5: Verifica** `npm run lint && npm run build`; a `npm run dev` l'app carrega com abans.
- [ ] **Step 6: Commit** — «Afegeix la taula settings i el LifeProvider».

### Task 5: Portada «Avui» (fase 0) i perfil

**Files:**
- Create: `src/components/avui/GreetingHeader.tsx`, `src/components/avui/WeekFocus.tsx`, `src/components/avui/MoneyCard.tsx`, `src/components/settings/ProfileSection.tsx`
- Modify: `src/app/(app)/page.tsx`, `src/app/(app)/configuracio/page.tsx` (pestanya «Perfil» la primera), `CLAUDE.md`

**Interfaces:**
- Consumes: `useLife`, `greeting`, `formatLongDate`, `isoWeekNumber`, `mondayOf`, `focusIsCurrent`, `todayISO`; de `useData()` i `calc/` el mateix que ja usa el balanç (`accountBalances`, `totalBalance`, `computePositions`, `valuePortfolio`, `totals`, `budgetStatuses`, `refreshQuotes`).
- Produces: `<GreetingHeader />`, `<WeekFocus />`, `<MoneyCard />` (sense props).

- [ ] **Step 1: `GreetingHeader`.** «`{greeting(hora)}`, *`{display_name}`*» (nom en cursiva serif i `text-primary`; sense nom, només la salutació), i sota `formatLongDate(today) · setmana {isoWeekNumber}`.- [ ] **Step 2: `WeekFocus`.** Mostra «Focus de la setmana: …» si `focusIsCurrent(settings.week_focus_monday, today)`; si no, «Quin és el teu focus d'aquesta setmana?» com a botó. Edició en línia; desa `{ week_focus, week_focus_monday: mondayOf(today) }` amb `useAction` i `ErrorNote`.
- [ ] **Step 3: `MoneyCard`.** `Card` amb patrimoni total (comptes + cartera), estalvi del mes, i el nombre d'avisos de pressupost (només si > 0), amb enllaç «Veure diners» a `/diners`. Sense comptes: `EmptyState` amb enllaç a `/configuracio`.
- [ ] **Step 4: `ProfileSection`** (patró de `AccountsSection`): nom, passos diaris, gots d'aigua, hores de son (s'emmagatzema en minuts). Valida que les metes siguin enters > 0.
- [ ] **Step 5: Pàgina.** `page.tsx` → `GreetingHeader`, `WeekFocus` i `MoneyCard` en una columna (la graella completa arriba a T9–T11).
- [ ] **Step 6: Verifica** `npm run lint && npm test && npm run build`. Prova a `npm run dev` en clar i fosc, a 390 px i 1280 px (captures amb Playwright, `deviceScaleFactor: 2`): salutació, focus editable, perfil desat, targeta de diners.
- [ ] **Step 7: `CLAUDE.md`.** Actualitza «Arquitectura» (nova portada «Avui», `LifeProvider`, `src/components/avui/`, `/diners`) i «Estat» (Fase 0 feta).
- [ ] **Step 8: Commit i push** — «Afegeix la portada Avui i el perfil»; `git push -u origin ccr-02d68289-ugjdrz`.

---

## Fase 1 — El dia

### Task 6: Lògica de l'agenda

**Files:**
- Create: `src/lib/calc/agenda.ts`
- Modify: `src/lib/types.ts` (`EventKind`, `LifeEvent`)
- Test: `tests/agenda.test.ts`

**Interfaces:**
- Consumes: `toMinutes`, `formatDuration` (T2), `weekdayOf` (T2).
- Produces: `type EventKind = "class" | "work" | "personal" | "other"`; `interface LifeEvent { id: string; title: string; start_time: string; end_time: string; kind: EventKind; date: string | null; weekday: number | null; repeat_until: string | null }`.
- Produces (`agenda.ts`): `eventsOn(events: LifeEvent[], date: string): LifeEvent[]` (ordenats per `start_time`), `isValidTimeRange(start: string, end: string): boolean`, `eventStatus(ev: Pick<LifeEvent,"start_time"|"end_time">, now: string): "done" | "current" | "upcoming"`, `minutesUntilStart(ev: Pick<LifeEvent,"start_time">, now: string): number`, `startsInLabel(minutes: number): string | null`.

- [ ] **Step 1: Tests** (factory `ev(partial)`):
  `eventsOn`: setmanal `weekday 1` surt el `"2026-10-27"` (dimarts) i no el `"2026-10-28"`; `weekday 6` surt el `"2026-10-25"`; `repeat_until "2026-10-20"` el fa desaparèixer el `"2026-10-27"` però surt el `"2026-10-20"`; puntual per `date`; resultat ordenat per hora; hores `"09:30:00"` ordenen bé.
  `isValidTimeRange`: `("09:30","11:30")=true`, `("11:30","09:30")=false`, `("10:00","10:00")=false`, `("23:00","00:30")=false`, `("09:30:00","10:00:00")=true`.
  `eventStatus` amb `now="09:30"`: 08:00–08:45 → `done`; 09:30–11:30 → `current` (inici inclòs); 12:00–12:30 → `upcoming`; amb `now="11:30"` el 09:30–11:30 → `done` (fi exclosa).
  `minutesUntilStart`: `"09:30"` des de `"09:00"` = 30; ja començat = negatiu.
  `startsInLabel`: `32→"En 32 min"`, `70→"En 1 h 10 min"`, `0→null`, `-5→null`, `181→null`.
- [ ] **Step 2:** Executa → falla. **Step 3:** Implementa → passa. `npm run lint`.
- [ ] **Step 4: Commit** — «Afegeix la lògica de l'agenda».

### Task 7: Lògica de progrés, comptes enrere i prioritats

**Files:**
- Create: `src/lib/calc/dayProgress.ts`, `src/lib/calc/countdowns.ts`, `src/lib/calc/tasks.ts`
- Modify: `src/lib/types.ts` (`Task`, `Countdown`)
- Test: `tests/day-countdowns-tasks.test.ts`

**Interfaces:**
- Produces: `interface Task { id: string; title: string; date: string; top_rank: 1 | 2 | 3 | null; done: boolean; done_at: string | null }`; `interface Countdown { id: string; title: string; emoji: string; start_date: string; target_date: string; archived: boolean }`.
- Produces: `dayProgress(items: { done: boolean }[]): { done: number; total: number; ratio: number; label: string }`; `daysUntil(target: string, today: string): number`; `countdownProgress(c: Pick<Countdown,"start_date"|"target_date">, today: string): number` (0..1); `countdownLabel(days: number): string`; `nextFreeRank(tasks: Pick<Task,"date"|"top_rank">[], date: string): 1 | 2 | 3 | null`.

- [ ] **Step 1: Tests:**
  `dayProgress([])` → `ratio 0`, `total 0`, `label "Afegeix la teva primera tasca"`, mai `NaN`; 3 de 11 → «Empeça per una»; 3 de 10 → «Bon ritme»; 5 de 10 → «Bon ritme»; 7 de 10 → «Gairebé»; 10 de 10 → «Dia validat».
  `daysUntil("2026-12-05","2026-10-27")=39`; `daysUntil("2026-10-26","2026-10-24")=2` (travessa el canvi d'hora del 25-oct); `daysUntil("2026-10-20","2026-10-27")=-7`.
  `countdownProgress` amb inici `2026-10-01`, destí `2026-12-05`, avui `2026-10-27` ≈ `0.4`; avui passat el destí → `1`; abans de l'inici → `0`; `start >= target` → `1` si avui ≥ destí, si no `0`.
  `countdownLabel`: `39→"Falten 39 dies"`, `1→"Demà"`, `0→"Avui"`, `-1→"Ahir"`, `-3→"Fa 3 dies"`.
  `nextFreeRank`: buit → `1`; rangs 1 i 3 ocupats → `2`; 1, 2 i 3 ocupats → `null`; tasques d'un altre dia s'ignoren.
- [ ] **Step 2:** Executa → falla. **Step 3:** Implementa (`daysUntil` amb `Date.UTC` perquè l'horari d'estiu no desquadri) → passa. `npm run lint`.
- [ ] **Step 4: Commit** — «Afegeix la lògica de progrés, comptes enrere i prioritats».

### Task 8: Taules del dia i extensió del `LifeProvider`

**Files:**
- Create: `supabase/migrations/20261112010000_life_day.sql`
- Modify: `src/components/LifeProvider.tsx`

**Interfaces:**
- Consumes: `Task`, `LifeEvent`, `Countdown` (T6, T7), `addDaysISO`, `todayISO`.
- Produces: `useLife()` passa a tornar també `tasks: Task[]`, `events: LifeEvent[]`, `countdowns: Countdown[]`, i `insert<K>(table: "tasks" | "events" | "countdowns", rows: Partial<…> | Partial<…>[]): Promise<…[]>`, `update<K>(table: K, id: string, patch: Partial<…>): Promise<void>`, `remove(table: K, id: string): Promise<void>` (mateixa semàntica que `DataProvider`).

- [ ] **Step 1: Migració** amb tres taules (patró global d'RLS):
  `tasks`: `title text not null`, `date date not null`, `top_rank smallint` (`check between 1 and 3`), `done boolean default false`, `done_at timestamptz`; índex únic parcial `(user_id, date, top_rank) where top_rank is not null`; índex `(user_id, date)`.
  `events`: `title`, `start_time time not null`, `end_time time not null` (`check end_time > start_time`), `kind` (`check in ('class','work','personal','other')`, default `'other'`), `date date`, `weekday smallint` (`check between 0 and 6`), `repeat_until date`; `check ((date is null) <> (weekday is null))`; comentari que `weekday 0 = dilluns`.
  `countdowns`: `title`, `emoji text default '📌'`, `start_date date`, `target_date date` (`check target_date >= start_date`), `archived boolean default false`.
- [ ] **Step 2: Aplica-la** i `get_advisors` (security), com a T4.
- [ ] **Step 3: Extén `LifeProvider`.** Càrrega a `Promise.all` amb la paginació de 1000 files de `DataProvider`: `tasks` amb `date >= addDaysISO(todayISO(), -400)`, `events` i `countdowns` senceres. Normalitza `start_time`/`end_time` a `HH:MM` (`slice(0,5)`). `insert/update/remove` actualitzen l'estat local. Els errors de Postgres (p. ex. violació de la unicitat de rang) es llancen com `Error(message)`.
- [ ] **Step 4: Verifica** `npm run lint && npm run build`; amb `execute_sql` comprova que un insert amb `top_rank 4` i un amb `end_time <= start_time` es rebutgen (i fes rollback dins de la mateixa consulta).
- [ ] **Step 5: Commit** — «Afegeix tasques, esdeveniments i comptes enrere».

### Task 9: «Les 3 d'avui» i progrés del dia

**Files:**
- Create: `src/components/avui/TopThree.tsx`, `src/components/avui/TaskForm.tsx`, `src/components/avui/ProgressRing.tsx`, `src/components/avui/DayCard.tsx`, `src/components/avui/useNow.ts`
- Modify: `src/lib/defaults.ts` (`QUOTES: string[]`, de moment la frase de «Hàbits atòmics»: «No puges al nivell de les teves metes. Caus al nivell dels teus sistemes.»), `src/app/(app)/page.tsx`

**Interfaces:**
- Consumes: `useLife` (T8), `nextFreeRank`, `dayProgress` (T7), `todayISO`.
- Produces: `useNow(): { today: string; now: string }` (s'actualitza cada 30 s; `now` en `HH:MM`); `<TaskForm onClose />` (Modal amb un camp de títol que crea la tasca d'avui amb `top_rank = nextFreeRank(...)`); `<ProgressRing ratio={number} caption={string} />` (SVG accessible amb `role="img"`).

- [ ] **Step 1: `TopThree`.** Les tasques d'avui ordenades per `top_rank`, amb casella que fa `update("tasks", id, { done, done_at })`, esborrar amb confirmació, i fins a 3 ranures buides «Afegeix la prioritat n» que obren `TaskForm`. Dins la targeta, la frase (`QUOTES[0]`).
- [ ] **Step 2: `TaskForm`.** Si `nextFreeRank` torna `null`, mostra `ErrorNote` «Ja tens les 3 prioritats d'avui. Acaba'n o esborra'n una.» i no envia res.
- [ ] **Step 3: `DayCard`.** «El teu dia»: `ProgressRing` amb `dayProgress(tasks d'avui)` (percentatge, etiqueta, «X de Y coses fetes»); amb 0 tasques mostra «0 de 0» i l'etiqueta d'inici, mai `NaN`.
- [ ] **Step 4: Pàgina.** Afegeix `DayCard` (a dalt al mòbil) i `TopThree` a la graella.
- [ ] **Step 5: Verifica** `npm run lint && npm test && npm run build`; a mà: afegir 3 prioritats, intentar la 4a (error), marcar-ne una i veure el cercle canviar.
- [ ] **Step 6: Commit** — «Afegeix les 3 d'avui i el progrés del dia».

### Task 10: Agenda d'avui

**Files:**
- Create: `src/components/avui/AgendaCard.tsx`, `src/components/avui/EventForm.tsx`
- Modify: `src/app/(app)/page.tsx`

**Interfaces:**
- Consumes: `eventsOn`, `eventStatus`, `minutesUntilStart`, `startsInLabel`, `isValidTimeRange` (T6), `weekdayOf` (T2), `useNow` (T9), `useLife`.
- Produces: `<EventForm existing?: LifeEvent onClose />` (Modal), `<AgendaCard />`.

- [ ] **Step 1: `AgendaCard`.** Línia horària amb els esdeveniments d'`eventsOn(events, today)`: color per `kind`, l'hora i la durada (`formatDuration`), els `done` atenuats, una línia «ara» entre l'últim `done` i el primer pendent, i la pastilla `startsInLabel` només al primer `upcoming`. Compte «N pendents». Estat buit amb botó «Afegeix un esdeveniment».
- [ ] **Step 2: `EventForm`.** Títol, `Segmented` de `kind`, hores amb `<input type="time">`, `Segmented` «Només un dia / Cada setmana». Un dia → `date` (per defecte avui) i `weekday null`; cada setmana → `weekday = weekdayOf(data triada)`, `date null` i `repeat_until` opcional. Valida amb `isValidTimeRange` («L'hora de fi ha de ser posterior a la d'inici.»). Editar i esborrar un existent des de la targeta.
- [ ] **Step 3: Pàgina.** Afegeix `AgendaCard` a la graella de `page.tsx`.
- [ ] **Step 4: Verifica** `npm run lint && npm test && npm run build`; a mà: un esdeveniment puntual, un de setmanal avui, un de passat (surt atenuat) i l'avís «En X min».
- [ ] **Step 5: Commit** — «Afegeix l'agenda d'avui».

### Task 11: Comptes enrere i «+» contextual

**Files:**
- Create: `src/components/avui/CountdownsCard.tsx`, `src/components/avui/CountdownForm.tsx`, `src/components/QuickAdd.tsx`
- Modify: `src/components/AppShell.tsx`, `src/app/(app)/page.tsx`

**Interfaces:**
- Consumes: `daysUntil`, `countdownProgress`, `countdownLabel` (T7), `TaskForm` (T9), `EventForm` (T10), `ProgressBar` (`ui.tsx`).
- Produces: `<CountdownsCard />`, `<CountdownForm existing?: Countdown onClose />`, `<QuickAdd onClose />` (Modal amb «Nova prioritat d'avui» i «Nou esdeveniment»).

- [ ] **Step 1: `CountdownsCard`.** Fins a 3 comptes enrere no arxivats amb `daysUntil >= 0`, ordenats per `target_date`: emoji, títol, `countdownLabel`, barra amb `countdownProgress`. Els ja passats no es mostren (queden a la BD). Estat buit amb acció.
- [ ] **Step 2: `CountdownForm`.** Títol, emoji (text), `start_date` (per defecte avui), `target_date`; valida «La data final no pot ser anterior a l'inici.».
- [ ] **Step 3: «+» contextual.** A `AppShell`, el botó de la barra inferior i el de la barra lateral: dins de Diners → `TransactionForm` com ara; a la resta de seccions → `QuickAdd`. El text del botó lateral: «Nou moviment» o «Afegir».
- [ ] **Step 4: Pàgina.** Disposició final de «Avui» segons l'spec (escriptori: fila 1 = Agenda ampla + Les 3; fila 2 = El teu dia + Comptes enrere + Diners; mòbil: una columna amb l'ordre capçalera, focus, El teu dia, Les 3, Agenda, Comptes enrere, Diners).
- [ ] **Step 5: Verifica** `npm run lint && npm test && npm run build`.
- [ ] **Step 6: Commit** — «Afegeix els comptes enrere i el botó + contextual».

### Task 12: Verificació de la Fase 1 i quadern

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Suite completa.** `npm run lint && npm test && npm run build` en verd.
- [ ] **Step 2: Smoke test amb Playwright** contra Supabase (usuari de proves de `CLAUDE.md`; **demana la contrasenya a l'usuari**, no la guardis al repo). Comprova: inici de sessió → «Avui»; focus de setmana desat; afegir 3 prioritats i marcar-ne una (el cercle puja); esdeveniment setmanal d'avui amb avís «En X min»; compte enrere amb barra; targeta de diners; `/diners` i `/configuracio` segueixen funcionant. Captures a 390 px i 1280 px, clar i fosc (`deviceScaleFactor: 2`) i revisa-les. Esborra les dades de prova en acabar. Si el sandbox no arriba a Supabase, digues-ho i demana a l'usuari que l'executi des del seu ordinador.
- [ ] **Step 3: `CLAUDE.md`.** Actualitza «Estat» (Fases 0–1 fetes), «Pendent» (Fases 2–4, desplegar a Vercel segueix pendent) i «Convencions» (`weekday` 0 = dilluns, hores `HH:MM`).
- [ ] **Step 4: Commit i push** — «Verifica la fase 1 i actualitza el quadern»; `git push -u origin ccr-02d68289-ugjdrz`. No es crea cap PR sense que l'usuari ho demani.

---

## Fases 2–4 (esbós; cada una tindrà el seu pla)

| Fase | Tasques previstes | Interfícies clau |
|---|---|---|
| **2 · Hàbits i salut** | calc d'hàbits; migració `habits`, `habit_logs`, `health_logs`; pàgina `/habits` + targeta d'avui; «el teu dia en números» (aigua amb gotes, son, passos, entreno) que s'afegeix al `dayProgress` | `currentStreak(logs, today)`, `weeklyCompliance(habit, logs, today)`, `upsert` al `LifeProvider`; la barra mòbil guanya «Hàbits» |
| **3 · Llarg termini** | calc d'objectius; migració `goals`, `courses`, `study_items`, `study_logs`; pàgines `/objectius` i `/estudis` + targetes | `goalProgress(goal, today)` (ràtio i ritme esperat); barra mòbil final: Avui · Hàbits · + · Objectius · Més (Diners passa a «Més») |
| **4 · Diari** | migració `journal_entries`; `/diari` amb ànim 1–5 i gràfic (Recharts); `QUOTES` rotativa; repàs final i `CLAUDE.md` | `upsert` per dia; `quoteOfDay(iso, quotes)` |

Fora de l'abast (com a l'spec): excepcions d'una sola ocurrència, notificacions, Google Calendar, importació de salut, mode fora de línia, multiusuari i el desplegament a Vercel.
