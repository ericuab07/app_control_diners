-- Esquema inicial. Aplicat al projecte Supabase jmmeioofkbvkxhlfjbhg el 2026-11-10.
-- Imports en cèntims (bigint). Cada taula té RLS: un usuari només veu les seves files.

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'checking' check (type in ('checking','savings','cash','broker','other')),
  initial_balance_cents bigint not null default 0,
  color text not null default '#2563eb',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income','expense')),
  color text not null default '#64748b',
  icon text not null default '🏷️',
  created_at timestamptz not null default now(),
  unique (user_id, kind, name)
);

create table public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  kind text not null check (kind in ('income','expense')),
  amount_cents bigint not null check (amount_cents > 0),
  description text not null default '',
  frequency text not null check (frequency in ('weekly','monthly','yearly')),
  start_date date not null,
  end_date date,
  next_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  kind text not null check (kind in ('income','expense','transfer')),
  amount_cents bigint not null check (amount_cents > 0),
  date date not null,
  description text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  transfer_account_id uuid references public.accounts(id) on delete cascade,
  recurring_rule_id uuid references public.recurring_rules(id) on delete set null,
  created_at timestamptz not null default now(),
  check ((kind = 'transfer') = (transfer_account_id is not null)),
  check (transfer_account_id is null or transfer_account_id <> account_id),
  -- Evita duplicar el moviment d'una regla recurrent si dos dispositius el generen alhora.
  unique (recurring_rule_id, date)
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade, -- null = pressupost global
  amount_cents bigint not null check (amount_cents > 0),
  created_at timestamptz not null default now()
);
create unique index budgets_user_category_key
  on public.budgets (user_id, coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid));

create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  symbol text not null,
  name text not null default '',
  side text not null check (side in ('buy','sell')),
  quantity numeric not null check (quantity > 0),
  price numeric not null check (price >= 0),
  currency text not null default 'EUR',
  fx_rate numeric not null default 1 check (fx_rate > 0),
  fee_cents bigint not null default 0 check (fee_cents >= 0),
  date date not null,
  account_id uuid references public.accounts(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.price_cache (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  symbol text not null,
  name text not null default '',
  price numeric not null,
  currency text not null default 'EUR',
  fx_rate numeric not null default 1,
  manual boolean not null default false,
  fetched_at timestamptz not null default now(),
  primary key (user_id, symbol)
);

create index accounts_user_idx on public.accounts (user_id);
create index categories_user_idx on public.categories (user_id);
create index recurring_user_idx on public.recurring_rules (user_id);
create index recurring_account_idx on public.recurring_rules (account_id);
create index recurring_category_idx on public.recurring_rules (category_id);
create index transactions_user_date_idx on public.transactions (user_id, date desc);
create index transactions_account_idx on public.transactions (account_id);
create index transactions_category_idx on public.transactions (category_id);
create index transactions_transfer_idx on public.transactions (transfer_account_id);
create index budgets_category_idx on public.budgets (category_id);
create index trades_user_idx on public.trades (user_id, date);
create index trades_account_idx on public.trades (account_id);

do $$
declare t text;
begin
  foreach t in array array['accounts','categories','recurring_rules','transactions','budgets','trades','price_cache'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
  end loop;
end $$;
