# Panell de vida (abans «Control de diners»)

Panell de vida personal (un usuari) en català: portada «Avui» amb el dia i la vida; els diners són un mòdul més. Aquest fitxer és el quadern de seguiment:
**actualitza'l al final de cada sessió** (seccions «Estat» i «Pendent»).

@AGENTS.md

## Ordres

```bash
npm run dev      # servidor local a http://localhost:3000
npm test         # tests unitaris (vitest) de src/lib
npm run lint     # eslint
npm run build    # compilació de producció (inclou comprovació de tipus)
node scripts/mock-supabase.mjs   # Supabase simulat (port 54399) per veure l'app sense login
```

**Veure l'app amb dades simulades:** `node scripts/mock-supabase.mjs` i, en un altre terminal,
`NEXT_PUBLIC_SUPABASE_URL=http://localhost:54399 npx next dev -p 3100` (a Windows `cmd`:
`set NEXT_PUBLIC_SUPABASE_URL=http://localhost:54399&& npx next dev -p 3100`). Obre
http://localhost:3100, executa a la consola el `seed` de http://localhost:54399/session i recarrega.

## Arquitectura

- **Next.js 16 (App Router) + TypeScript + Tailwind 4 + Recharts.** Aquesta versió de Next té canvis
  importants: consulta `node_modules/next/dist/docs/` abans de tocar APIs del framework.
- **Supabase** (projecte `jmmeioofkbvkxhlfjbhg`, regió eu-west-3): Postgres + Auth amb email i contrasenya.
  Les claus de `.env` són públiques per disseny; la seguretat és el **RLS** (`user_id = auth.uid()`).
  Qualsevol taula nova ha de tenir RLS i la mateixa política.
- **Tot és client-side.** `src/components/DataProvider.tsx` carrega totes les taules en memòria en
  iniciar sessió i exposa `insert / update / remove`. Les pàgines calculen amb funcions pures.
- **Única ruta de servidor:** `src/app/api/quotes/route.ts` (cotitzacions de Yahoo Finance; exigeix sessió).

```
src/lib/calc/        lògica pura i testada: balances, budgets, stats, recurring, portfolio, csv,
                     week (setmana, focus), agenda, dayProgress, countdowns, tasks, habits, health,
                     goals, study, journal
src/lib/             types, money (cèntims), dates (ISO YYYY-MM-DD), time (HH:MM), nav, defaults, supabase
src/components/      DataProvider, LifeProvider, AppShell (navegació), DinersTabs, TransactionForm/List,
                     ui, settings/* (Perfil inclòs), avui/* (targetes de la portada), habits/*,
                     goals/*, study/*, journal/*, QuickAdd («+» fora de Diners)
src/app/(app)/       pàgines amb sessió: / (Avui), habits, objectius, estudis, diari, diners (balanç), ingressos,
                     despeses, accions,
                     pressupostos, estadistiques, configuracio
src/app/login/       inici de sessió i registre
supabase/migrations/ esquema SQL (ja aplicat al projecte)
docs/superpowers/specs/  document de disseny amb les decisions i el perquè
```

## Convencions

- Imports sempre en **cèntims enters**; `parseAmountToCents` / `formatCents` a `src/lib/money.ts`.
- Dates com a cadena ISO `YYYY-MM-DD` en hora local (`src/lib/dates.ts`), mai `Date` a l'estat.
- Les transferències no compten com a ingrés ni despesa a estadístiques ni pressupostos.
- La lògica de càlcul nova va a `src/lib/calc/` amb el seu test a `tests/`.
- Text de la interfície en català. Colors via variables CSS de `globals.css` (clar i fosc automàtic).
- Canvis d'esquema: fitxer nou a `supabase/migrations/` i aplicar-lo amb el connector de Supabase.
  Una migració per fase del panell; només taules noves; després `get_advisors` (security).
- Hores com a text `HH:MM` (`src/lib/time.ts`); Postgres `time` torna `HH:MM:SS` i el `LifeProvider`
  ho normalitza en carregar.
- `weekday` = 0–6 amb **0 = dilluns … 6 = diumenge** (`weekdayOf` a `calc/week.ts`), mai el `getDay()` de JS.
- Hàbits: amb meta setmanal `n < 7` «toquen» mentre la setmana no arriba a `n`; la ratxa no es
  trenca fins que acaba el dia/setmana en curs. Entreno: «Entrenat» i «Descans» compten com a fet.
- Objectius: «Vas bé» si el progrés és ≥ fracció de l'any transcorreguda menys una setmana de marge.
- Files d'una per dia (`health_logs`): sempre `upsert(..., "user_id,date")` del `LifeProvider`.
- Taula nova del panell: afegir-la a `LifeTables`, `EMPTY` i `reload` del `LifeProvider`
  (i a `DATED` si és diària), i al `db` de `scripts/mock-supabase.mjs`.

## Estat (2026-11-12)

Panell de vida en curs (spec `docs/superpowers/specs/2026-11-12-panell-de-vida-design.md`):

- [x] **Fase 0 · Base:** pell editorial (fosc càlid, terracota, serif), navegació Avui/Diners, balanç a
      `/diners`, taula `settings` + `LifeProvider`, portada amb salutació, focus de la setmana, targeta de
      diners i pestanya «Perfil» (nom i metes).
- [x] **Fase 1 · El dia:** les 3 d'avui (amb frase), cercle «El teu dia», agenda amb línia «ara» i
      «En X min» (puntuals i setmanals), comptes enrere, «+» contextual (Diners → moviment; resta →
      prioritat o esdeveniment). Provat amb dades simulades a 1280 px fosc i 375 px clar.
- [x] **Fase 2 · Hàbits i salut:** `/habits` (diaris o N cops/setmana, ratxes en dies o setmanes,
      últims 7 dies per marcar, arxivar), «Hàbits d'avui» i «El teu dia en números» (gotes d'aigua,
      passos, son, entrenat/descans). El cercle suma tasques + hàbits que toquen + 4 metes de salut.
- [x] **Fase 3 · Llarg termini:** `/objectius` (barra amb marca del ritme esperat, ±1 ràpid, per anys),
      `/estudis` (assignatures, entregues/exàmens amb vençuts en vermell, minuts per setmana), targetes
      «Objectius» i «Properes entregues» a Avui. Navegació final: mòbil Avui · Hàbits · + · Objectius · Més.
- [x] **Fase 4 · Diari:** `/diari` (ànim 1–5 amb emoji, nota fins a 2000 caràcters, qualsevol dia
      passat, gràfic de 30 dies amb buits on no hi ha entrada, llista d'entrades), targeta «Com estàs
      avui?» a Avui i frase del dia rotativa (12 frases a `QUOTES`).

Taules del panell (totes amb RLS «own rows», migracions `20261112*` ja aplicades al Supabase real):
`settings`, `tasks`, `events`, `countdowns`, `habits`, `habit_logs`, `health_logs`, `goals`, `courses`,
`study_items`, `study_logs`, `journal_entries`. Plans de cada fase a `docs/superpowers/plans/`.

### v1 de diners (2026-11-10)

v1 completa i provada de punta a punta en navegador contra el Supabase real:

- [x] Login i registre, dades aïllades per usuari (RLS)
- [x] Comptes múltiples, transferències, arxivar
- [x] Ingressos i despeses: alta ràpida, edició, filtres i cerca
- [x] Categories amb icona i color (18 per defecte, editables)
- [x] Pressupostos mensuals, global i per categoria, avisos al 80 % i 100 %, previsió a final de mes
- [x] Estadístiques: per categoria, 12 mesos, taxa d'estalvi, comparativa amb el període anterior
- [x] Accions: operacions, posicions, cost mitjà, guany latent i realitzat, preus automàtics i manuals
- [x] Moviments recurrents (setmanal, mensual, anual)
- [x] Importar CSV del banc (categoria suggerida, duplicats) i exportar CSV / JSON
- [x] PWA instal·lable, disseny adaptat a mòbil i escriptori

## Pendent

- [ ] **Prova a mà contra el Supabase real** (Claude no té la contrasenya de l'usuari de proves; s'ha
      provat amb `scripts/mock-supabase.mjs`): iniciar sessió, desar focus i perfil, afegir 3 prioritats i
      intentar la 4a, esdeveniment setmanal, compte enrere, targeta de diners i pestanyes de Diners.
- [ ] En `next dev` surten avisos «Could not validate that a segment … has instant navigation» a totes
      les rutes (també les de la v1): l'app es renderitza tota al client darrere la sessió. Només surt en
      desenvolupament; es podria silenciar amb `export const instant = false` si molesta.
- [ ] Decisions preses sense preguntar (revisa-les si no t'agraden): «Comença per una» en lloc de
      «Empeça per una» (errada a l'spec); objectius «Vas bé» amb una setmana de marge; hàbits setmanals
      «toquen» fins complir la meta; «Descans» compta com a entreno fet; targeta «Properes entregues» a Avui
      (l'spec no la dibuixava); frases del dia escrites de nou (sense cites amb drets).
- [ ] Petites millores per més endavant: veure i recuperar comptes enrere arxivats o passats; tasques
      que no siguin de «les 3»; editar una sola ocurrència d'un esdeveniment setmanal (fora de l'abast del v1).
- [ ] `/find-skills` no ha trobat skills externes fiables per a hàbits, objectius, diari o gràfics
      (només paquets amb molt poques instal·lacions); s'han fet servir les locals.
- [ ] Supabase avisa «Leaked password protection disabled» (Auth → Providers → Email). Activar-ho és
      opcional; no s'ha tocat perquè és configuració d'Auth.

- [ ] **Desplegar a Vercel** (encara no està publicada). Després, a Supabase → Authentication → URL
      Configuration, posar la URL de producció com a «Site URL» perquè l'enllaç del correu de
      confirmació del registre hi apunti (ara apunta a localhost).
- [ ] Esborrar l'usuari de proves `e2e-test@example.com` de Supabase (Authentication → Users). No té dades.
- [ ] Idees: historial del valor de la cartera, dividends, importar Excel, regles de categorització
      editables, mode fora de línia, selector manual de tema clar/fosc.

## Skills utilitzades

- `find-skills`: cerca de skills a l'inici de cada fase.
- `supabase-postgres-best-practices` (oficial de Supabase, instal·lada amb `npx skills add supabase/agent-skills`):
  polítiques RLS amb `(select auth.uid())`, índexs a les FK i a `user_id`, restriccions `check`.
- `superpowers:executing-plans` / `test-driven-development`: execució tasca a tasca amb test en vermell primer.
- `superpowers:writing-plans`: plans de les fases 2, 3 i 4 a `docs/superpowers/plans/`.
- `dataviz`: gràfic d'ànim (una sèrie sense llegenda, línia 2 px, punts 8 px, graella discreta, buits,
  tooltip i la llista com a vista textual).
- Navegador integrat de Claude + `scripts/mock-supabase.mjs`: proves visuals a 1280 px fosc i 375 px clar.

## Limitacions conegudes

- Yahoo Finance és una API no oficial: pot fallar o canviar. L'app mostra l'últim preu conegut i
  permet posar-lo a mà.
- El gràfic d'evolució del saldo no inclou el valor històric de la cartera.
- Sense connexió no es pot fer servir (no hi ha service worker).
