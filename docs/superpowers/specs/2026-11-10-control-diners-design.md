# Control de diners — disseny

Data: 2026-11-10 · Estat: aprovat i implementat (v1)

## Objectiu

App web de finances personals per a un sol usuari, usable des del mòbil i l'ordinador amb les dades
sincronitzades: balanç, ingressos, despeses, accions, categories, estadístiques i pressupostos.

## Decisions

| Tema | Decisió | Motiu |
|---|---|---|
| Stack | Next.js (App Router) + TypeScript + Tailwind + Recharts | Un sol projecte amb interfície i ruta de servidor |
| Dades i login | Supabase (Postgres + Auth, email i contrasenya) | Sincronització entre dispositius sense servidor propi |
| Seguretat | Row Level Security a totes les taules (`user_id = auth.uid()`) | La clau pública viatja al navegador; el RLS és la barrera |
| Accés a dades | Client de navegador; tot l'estat es carrega en memòria (`DataProvider`) | Volum petit (milers de files); càlculs instantanis i testables |
| Imports | Cèntims enters (`bigint`) | Evita errors d'arrodoniment |
| Comptes | Diversos, amb transferències | Les transferències no són ingrés ni despesa |
| Cotitzacions | Yahoo Finance (no oficial) via `/api/quotes`, memòria cau a `price_cache` (15 min) | Sense clau, cobreix borses EU i US. Si falla: últim preu conegut o preu manual |
| Moneda | Base EUR; cada operació desa el canvi del dia | Valors en USD/GBP es converteixen |
| Cartera | Cost mitjà ponderat | Simple i suficient per a seguiment personal |
| Recurrents | Es generen en obrir l'app; clau única `(recurring_rule_id, date)` | Sense cron; idempotent entre dispositius |
| CSV | Mapatge de columnes, previsualització, categoria suggerida, duplicats | Extractes de bancs diferents |
| Instal·lació | Manifest PWA (sense service worker) | Icona a la pantalla d'inici; sense mode fora de línia |

## Model de dades

`accounts`, `categories`, `transactions` (income / expense / transfer), `recurring_rules`, `budgets`
(`category_id` null = global), `trades`, `price_cache`. Esquema a `supabase/migrations/`.

- Saldo d'un compte = saldo inicial + ingressos − despeses ± transferències ± operacions de borsa
  liquidades contra el compte (`trades.account_id`).
- Patrimoni = suma de saldos + valor de mercat de la cartera.

## Pantalles

Balanç · Ingressos · Despeses · Accions · Pressupostos · Estadístiques · Configuració (comptes,
categories, recurrents, importar CSV, exportar i sessió).

## Fora de la v1

Connexió bancària directa (PSD2), dades compartides entre usuaris, criptomonedes, dividends,
notificacions push, mode fora de línia, historial del valor de la cartera.
