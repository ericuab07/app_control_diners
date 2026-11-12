-- Panell de vida · Fase 4: diari (ànim 1–5 i nota, una entrada per dia).
-- Additiva: només una taula nova, RLS amb la política "own rows".

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  mood smallint not null check (mood between 1 and 5),
  note text not null default '' check (length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.journal_entries enable row level security;
create policy "own rows" on public.journal_entries for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
