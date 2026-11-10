# Control de diners

App de finances personals (un usuari) en català. Aquest fitxer és el quadern de seguiment:
**actualitza'l al final de cada sessió** (seccions «Estat» i «Pendent»).

@AGENTS.md

## Ordres

```bash
npm run dev      # servidor local a http://localhost:3000
npm test         # tests unitaris (vitest) de src/lib
npm run lint     # eslint
npm run build    # compilació de producció (inclou comprovació de tipus)
```

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
src/lib/calc/        lògica pura i testada: balances, budgets, stats, recurring, portfolio, csv
src/lib/             types, money (cèntims), dates (ISO YYYY-MM-DD), defaults, supabase
src/components/      DataProvider, AppShell (navegació), TransactionForm/List, ui, settings/*
src/app/(app)/       pàgines amb sessió: / (balanç), ingressos, despeses, accions,
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

## Estat (2026-11-10)

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

- [ ] **Desplegar a Vercel** (encara no està publicada). Després, a Supabase → Authentication → URL
      Configuration, posar la URL de producció com a «Site URL» perquè l'enllaç del correu de
      confirmació del registre hi apunti (ara apunta a localhost).
- [ ] Esborrar l'usuari de proves `e2e-test@example.com` de Supabase (Authentication → Users). No té dades.
- [ ] Idees: historial del valor de la cartera, dividends, importar Excel, regles de categorització
      editables, mode fora de línia, selector manual de tema clar/fosc.

## Limitacions conegudes

- Yahoo Finance és una API no oficial: pot fallar o canviar. L'app mostra l'últim preu conegut i
  permet posar-lo a mà.
- El gràfic d'evolució del saldo no inclou el valor històric de la cartera.
- Sense connexió no es pot fer servir (no hi ha service worker).
