# Panell de vida — disseny

Data: 2026-11-12 · Estat: aprovat

## Objectiu

Convertir l'app de finances en un **panell de vida personal** inspirat en el de victorcorral_ia (vídeo
de TikTok): una portada «Avui» que s'obre cada matí i mostra, en una sola pantalla, com va el dia i la
vida. **Els diners passen a ser un mòdul més**, no el centre.

Només per a un usuari (jo). Tot en català. Dades sincronitzades entre mòbil i ordinador (Supabase).

### Què s'ha pres del vídeo

- Salutació («Bon dia, Eric») amb data, número de setmana i **focus de la setmana**.
- **Agenda d'avui** amb línia horària, marca «ara» i avís «en 32 min».
- **Les 3 d'avui**: 3 prioritats amb casella i una frase.
- **Progrés del dia** en cercle («50 % · bon ritme · 5 de 10 coses fetes»).
- **«El teu dia en números»**: son, passos, aigua (gotes), entrenament/descans.
- **Hàbits amb ratxes**, **objectius de l'any** amb barra de progrés, **comptes enrere** (el viatge).
- Pestanyes amb icones, mode clar i fosc, aspecte editorial (fosc càlid, accent terracota, serif).

## Decisions

| Tema | Decisió | Motiu |
|---|---|---|
| On viu | Dins l'app actual; `/` passa a ser «Avui», el balanç passa a `/diners` | Mateix login, Supabase i dades de diners per a la targeta resum |
| Mòduls | Agenda, les 3 d'avui, hàbits, salut, objectius, estudis UAB, ànim i diari, comptes enrere/focus, diners | Triats per l'usuari |
| Entrada de dades | Tot manual dins el panell | v1 net i fiable; Google Calendar i mòbil a una v2 |
| Aspecte | Estil del vídeo a **tota** l'app (variables CSS, clar/fosc automàtic) | Un sol producte coherent |
| Tipografia | Pila serif del sistema (Georgia / Iowan Old Style) per a títols i xifres grans | Sense dependències externes |
| Dades | Taules tipades per mòdul + `LifeProvider` propi | Restriccions de BD, consultes netes; `DataProvider` no es toca |
| Seguretat | RLS `user_id = auth.uid()` a cada taula nova | Convenció del projecte |
| Agenda | Esdeveniments puntuals + repetició setmanal | L'horari de classes és setmanal |
| Públic | Només per a mi | Valors per defecte i textos per a un sol usuari |

## Navegació

Escriptori (barra lateral): **Avui · Hàbits · Objectius · Estudis · Diari · Diners · Configuració**.
«Diners» agrupa les rutes actuals (`/diners`, `/ingressos`, `/despeses`, `/accions`, `/pressupostos`,
`/estadistiques`) amb una barra de pestanyes secundària; aquestes rutes **no canvien de URL**, només
el balanç es trasllada de `/` a `/diners`.

Mòbil (barra inferior): Avui · Hàbits · «+» · Objectius · Més. El «+» és contextual: dins Diners obre
«Nou moviment»; a la resta obre «Nova tasca / Apunt ràpid».

## Portada «Avui»

- **Capçalera:** salutació, data, setmana i focus de la setmana (editable; caduca sol el dilluns).
- **Escriptori:** fila superior amb *Agenda d'avui* (ampla) i *Les 3 d'avui* + frase; a sota una graella
  amb *El teu dia en números* (amb el cercle de progrés), *Hàbits d'avui*, *Comptes enrere*,
  *Objectius* i *Diners* (patrimoni, estalvi del mes, avisos de pressupost, reutilitzant `calc/`).
- **Mòbil:** una columna: salutació, progrés, les 3, agenda, números, hàbits, comptes enrere, objectius, diners.
- **Progrés del dia** = fet / total, on total = tasques del dia + hàbits que toquen avui + objectius de
  salut amb meta (aigua, passos, son, entreno). Etiquetes: `< 30 %` «Empeça per una», `30–69 %` «Bon
  ritme», `70–99 %` «Gairebé», `100 %` «Dia validat».
- Cada targeta té un **estat buit** amb l'acció per afegir-hi la primera cosa.

## Model de dades

Totes les taules: `id uuid`, `user_id uuid default auth.uid()` (FK a `auth.users`, `on delete cascade`),
`created_at`, **RLS** `user_id = auth.uid()` (select/insert/update/delete). Dates ISO local
`YYYY-MM-DD`; hores com a `time` (es treballen com a text `HH:MM`). Una migració per fase.

| Taula | Camps clau | Fase |
|---|---|---|
| `settings` (1 fila/usuari, `unique(user_id)`) | `display_name`, `week_focus`, `week_focus_monday`, `step_goal`, `water_goal`, `sleep_goal_minutes` | 0 |
| `tasks` | `title`, `date`, `top_rank smallint` (1–3, única per dia i usuari si no és null), `done`, `done_at` | 1 |
| `events` | `title`, `start_time`, `end_time`, `kind` (classe/feina/personal/altre), `date` (puntual) o `weekday` 0–6 + `repeat_until` (setmanal); check: exactament un de `date`/`weekday` | 1 |
| `countdowns` | `title`, `emoji`, `start_date`, `target_date`, `archived` | 1 |
| `habits` | `name`, `icon`, `target_per_week` (1–7; 7 = diari), `archived` | 2 |
| `habit_logs` | `habit_id` (FK cascade), `date`, `unique(habit_id, date)`; que existeixi = fet | 2 |
| `health_logs` | `date` (`unique(user_id, date)`), `sleep_minutes`, `steps`, `water_glasses`, `workout` (`done`/`rest`/null) | 2 |
| `goals` | `title`, `year`, `target_value`, `current_value`, `unit` | 3 |
| `courses` | `name`, `color`, `semester`, `archived` | 3 |
| `study_items` | `course_id`, `title`, `kind` (entrega/examen/estudi), `due_date`, `done` | 3 |
| `study_logs` | `course_id`, `date`, `minutes` | 3 |
| `journal_entries` | `date` (`unique(user_id, date)`), `mood` 1–5, `note` | 4 |

### `LifeProvider`

Es munta al layout de `(app)` al costat de `DataProvider` (que no es modifica). Mateix patró:
càrrega inicial, `insert / update / remove`, més `upsert` per a files d'una per dia (`health_logs`,
`journal_entries`, `settings`). Carrega senceres les taules petites i els logs diaris dels últims ~400
dies. Mateixa pantalla de càrrega i error amb reintent. Una mica de codi repetit amb `DataProvider`
és acceptat per no arriscar el que ja funciona.

## Lògica pura (`src/lib/calc/`, amb tests a `tests/`)

- `dayProgress`: fet/total i etiqueta.
- `habits`: ratxa actual i millor ratxa; compliment setmanal segons `target_per_week`.
- `agenda`: expansió d'esdeveniments setmanals a un dia concret, ordenació, estat «ara» i «en X min».
- `goals`: ràtio de progrés i ritme esperat segons la data de l'any.
- `countdowns`: dies que falten i progrés entre `start_date` i `target_date`.
- `week`: número de setmana, dilluns de la setmana, caducitat del focus.

Helpers d'hora a `src/lib/time.ts` (mai `Date` a l'estat; convenció de `dates.ts`).

## Fases

Cada fase deixa l'app funcionant i es pot provar i desplegar sola.

| Fase | Contingut |
|---|---|
| **0 · Base** | Pell nova a tota l'app (tokens CSS, serif, `ui.tsx`), nova navegació, balanç a `/diners`, `LifeProvider`, taula `settings`, portada «Avui» amb salutació, focus i targeta de diners |
| **1 · El dia** | Les 3 d'avui, cercle de progrés, agenda (puntuals + setmanal), comptes enrere |
| **2 · Hàbits i salut** | Hàbits amb ratxes, «el teu dia en números» |
| **3 · Llarg termini** | Objectius de l'any, Estudis UAB |
| **4 · Diari** | Ànim 1–5 + nota, gràfic d'evolució, frase del dia, repàs final i actualització de `CLAUDE.md` |

## Errors i proves

- Estats de càrrega, error i buit a cada targeta i pàgina.
- Tests vitest per a tota la lògica de `calc/` (TDD).
- Després de cada migració: `get_advisors` de Supabase per verificar RLS.
- A cada fase: `npm run lint`, `npm test` i `npm run build`.
- Smoke test amb Playwright en navegador contra Supabase, com a la v1.

## Fora de l'abast del v1

Excepcions d'una sola ocurrència d'un esdeveniment setmanal, notificacions, sincronització amb Google
Calendar, importació de dades de salut, mode fora de línia, multiusuari, desplegament a Vercel (ja és
una tasca pendent separada).
