-- Run this if 001_schema.sql failed partway (e.g. trigger already exists)
-- Safe to run multiple times

create extension if not exists "pgcrypto";

-- Tables (skip if already created)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  otp_hash text not null,
  purpose text not null check (purpose in ('register', 'login')),
  metadata jsonb default '{}'::jsonb,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists email_otps_email_idx on public.email_otps (email);
create index if not exists email_otps_expires_idx on public.email_otps (expires_at);

create table if not exists public.erp_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sku text not null,
  name text not null,
  quantity integer not null default 0 check (quantity >= 0),
  unit_price numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.erp_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_number text not null,
  status text not null default 'draft' check (status in ('draft', 'confirmed', 'shipped', 'cancelled')),
  total_amount numeric(12, 2) not null default 0,
  notes text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.pos_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  price numeric(12, 2) not null default 0,
  stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.pos_sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  receipt_no text not null,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12, 2) not null default 0,
  tax numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  payment_method text not null default 'cash',
  created_at timestamptz not null default now()
);

create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  status text not null default 'lead' check (status in ('lead', 'active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.crm_deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  contact_id uuid references public.crm_contacts (id) on delete set null,
  title text not null,
  value numeric(12, 2) not null default 0,
  stage text not null default 'prospect' check (stage in ('prospect', 'proposal', 'negotiation', 'won', 'lost')),
  created_at timestamptz not null default now()
);

create table if not exists public.app_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  system text not null check (system in ('erp', 'pos', 'crm', 'auth', 'admin')),
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Functions
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, email_verified)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'email_verified')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers (replace if they already exist)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.email_otps enable row level security;
alter table public.erp_products enable row level security;
alter table public.erp_orders enable row level security;
alter table public.pos_products enable row level security;
alter table public.pos_sales enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.crm_deals enable row level security;
alter table public.app_activity enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Policies (drop then recreate)
drop policy if exists "Create profile on signup" on public.profiles;
create policy "Create profile on signup"
  on public.profiles for insert
  with check (exists (select 1 from auth.users where auth.users.id = profiles.id));

drop policy if exists "Users read own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Admins update any profile role" on public.profiles;
create policy "Users read own profile" on public.profiles for select
  using (auth.uid() = id or public.is_admin());
create policy "Users update own profile" on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));
create policy "Admins update any profile role" on public.profiles for update
  using (public.is_admin());

drop policy if exists "No direct OTP access" on public.email_otps;
create policy "No direct OTP access" on public.email_otps for all using (false);

drop policy if exists "ERP products own data" on public.erp_products;
drop policy if exists "ERP orders own data" on public.erp_orders;
create policy "ERP products own data" on public.erp_products for all
  using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id);
create policy "ERP orders own data" on public.erp_orders for all
  using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id);

drop policy if exists "POS products own data" on public.pos_products;
drop policy if exists "POS sales own data" on public.pos_sales;
create policy "POS products own data" on public.pos_products for all
  using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id);
create policy "POS sales own data" on public.pos_sales for all
  using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id);

drop policy if exists "CRM contacts own data" on public.crm_contacts;
drop policy if exists "CRM deals own data" on public.crm_deals;
create policy "CRM contacts own data" on public.crm_contacts for all
  using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id);
create policy "CRM deals own data" on public.crm_deals for all
  using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id);

drop policy if exists "Users insert own activity" on public.app_activity;
drop policy if exists "Users read own activity" on public.app_activity;
create policy "Users insert own activity" on public.app_activity for insert
  with check (auth.uid() = user_id);
create policy "Users read own activity" on public.app_activity for select
  using (auth.uid() = user_id or public.is_admin());

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant select on public.profiles to authenticated;
