-- Panell de vida · Fase 0: preferències de l'usuari (una fila per usuari).
-- Additiva: no toca cap taula existent. RLS amb la mateixa política "own rows".

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  display_name text not null default '',
  week_focus text not null default '',
  week_focus_monday date,
  step_goal integer not null default 8000 check (step_goal > 0),
  water_goal integer not null default 8 check (water_goal > 0),
  sleep_goal_minutes integer not null default 450 check (sleep_goal_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.settings enable row level security;
create policy "own rows" on public.settings for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
