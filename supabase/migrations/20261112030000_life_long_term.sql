-- Panell de vida · Fase 3: objectius de l'any i Estudis UAB.
-- Additiva: només taules noves, RLS amb la política "own rows".

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  year smallint not null check (year between 2000 and 2100),
  target_value numeric not null check (target_value > 0),
  current_value numeric not null default 0 check (current_value >= 0),
  unit text not null default '',
  created_at timestamptz not null default now()
);
create index goals_user_year_idx on public.goals (user_id, year);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  color text not null default '#b5522f',
  semester text not null default '',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index courses_user_idx on public.courses (user_id);

create table public.study_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  kind text not null default 'entrega' check (kind in ('entrega','examen','estudi')),
  due_date date not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index study_items_course_idx on public.study_items (course_id);
create index study_items_user_due_idx on public.study_items (user_id, due_date);

create table public.study_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  date date not null,
  minutes integer not null check (minutes between 1 and 1440),
  created_at timestamptz not null default now()
);
create index study_logs_course_idx on public.study_logs (course_id);
create index study_logs_user_date_idx on public.study_logs (user_id, date);

do $$
declare t text;
begin
  foreach t in array array['goals','courses','study_items','study_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
  end loop;
end $$;
