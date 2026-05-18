-- ============================================================
-- BizlERP — Supabase PostgreSQL Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- USERS
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text unique not null,
  password_hash text not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- INVENTORY
create table if not exists public.inventory (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  name          text not null,
  category      text,
  stock         numeric default 0,
  unit          text default 'pcs',
  min_stock     numeric default 0,
  cost_per_unit numeric default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- EXPENSES
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  description text not null,
  date        date not null default current_date,
  amount      numeric not null default 0,
  category    text,
  supplier    text,
  status      text default 'Paid' check (status in ('Paid', 'Pending', 'Overdue')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- CONTACTS
create table if not exists public.contacts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  name       text not null,
  type       text default 'Supplier' check (type in ('Supplier', 'Customer')),
  category   text,
  email      text,
  phone      text,
  notes      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- INDEXES for fast user-scoped queries
create index if not exists idx_inventory_user  on public.inventory(user_id);
create index if not exists idx_expenses_user   on public.expenses(user_id);
create index if not exists idx_expenses_date   on public.expenses(date desc);
create index if not exists idx_contacts_user   on public.contacts(user_id);

-- ROW LEVEL SECURITY
-- Users can only see their own rows (extra safety on top of JWT checks in API)
alter table public.inventory enable row level security;
alter table public.expenses  enable row level security;
alter table public.contacts  enable row level security;
alter table public.users     enable row level security;

-- The backend uses the service role key which bypasses RLS,
-- so these policies protect against any direct client access.
create policy "users_own_inventory" on public.inventory
  using (auth.uid() = user_id);

create policy "users_own_expenses" on public.expenses
  using (auth.uid() = user_id);

create policy "users_own_contacts" on public.contacts
  using (auth.uid() = user_id);

create policy "users_own_profile" on public.users
  using (auth.uid() = id);
