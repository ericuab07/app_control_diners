-- Diners · Súper: catàleg de productes amb l'últim preu i línies de cada compra.
-- Additiva: només taules noves, RLS amb la política "own rows".
-- Els productes els omple Claude a partir de les fotos dels tiquets (upsert per user_id, name).

create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0 and length(name) <= 80),
  -- Últim preu pagat (per unitat; als productes a pes, el que va costar l'últim paquet).
  price_cents integer not null check (price_cents >= 0),
  by_weight boolean not null default false,
  archived boolean not null default false,
  price_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null check (length(trim(name)) > 0 and length(name) <= 80),
  quantity integer not null default 1 check (quantity > 0 and quantity <= 999),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  created_at timestamptz not null default now()
);
create index purchase_items_user_idx on public.purchase_items (user_id);
create index purchase_items_transaction_idx on public.purchase_items (transaction_id);
create index purchase_items_product_idx on public.purchase_items (product_id);

alter table public.products enable row level security;
create policy "own rows" on public.products for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter table public.purchase_items enable row level security;
create policy "own rows" on public.purchase_items for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
