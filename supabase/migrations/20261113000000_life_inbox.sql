-- Panell de vida · Apunt ràpid: safata d'entrada per capturar coses i classificar-les després.
-- Additiva: només una taula nova, RLS amb la política "own rows".

create table public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text text not null check (length(trim(text)) > 0 and length(text) <= 500),
  created_at timestamptz not null default now()
);
create index inbox_items_user_idx on public.inbox_items (user_id, created_at);

alter table public.inbox_items enable row level security;
create policy "own rows" on public.inbox_items for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
