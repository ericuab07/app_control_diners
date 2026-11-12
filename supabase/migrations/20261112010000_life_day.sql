-- Panell de vida · Fase 1: el dia (tasques, agenda i comptes enrere).
-- Additiva: només taules noves, RLS amb la política "own rows".

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  date date not null,
  top_rank smallint check (top_rank between 1 and 3),
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
-- Cada rang de «les 3 d'avui» només una vegada per dia.
create unique index tasks_user_date_rank_key on public.tasks (user_id, date, top_rank) where top_rank is not null;
create index tasks_user_date_idx on public.tasks (user_id, date);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  start_time time not null,
  end_time time not null,
  kind text not null default 'other' check (kind in ('class','work','personal','other')),
  date date,
  weekday smallint check (weekday between 0 and 6),
  repeat_until date,
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  check ((date is null) <> (weekday is null))
);
comment on column public.events.weekday is '0 = dilluns … 6 = diumenge (esdeveniment setmanal)';
create index events_user_idx on public.events (user_id);

create table public.countdowns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  emoji text not null default '📌',
  start_date date not null,
  target_date date not null,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  check (target_date >= start_date)
);
create index countdowns_user_idx on public.countdowns (user_id);

do $$
declare t text;
begin
  foreach t in array array['tasks','events','countdowns'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
  end loop;
end $$;
