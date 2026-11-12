-- Panell de vida · Fase 2: hàbits i salut.
-- Additiva: només taules noves, RLS amb la política "own rows".

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  icon text not null default '✅',
  target_per_week smallint not null default 7 check (target_per_week between 1 and 7),
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index habits_user_idx on public.habits (user_id);

-- Que existeixi la fila = l'hàbit es va fer aquell dia.
create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);
create index habit_logs_user_date_idx on public.habit_logs (user_id, date);

create table public.health_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  sleep_minutes integer check (sleep_minutes between 0 and 1440),
  steps integer check (steps >= 0),
  water_glasses smallint not null default 0 check (water_glasses between 0 and 30),
  workout text check (workout in ('done','rest')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

do $$
declare t text;
begin
  foreach t in array array['habits','habit_logs','health_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
  end loop;
end $$;
