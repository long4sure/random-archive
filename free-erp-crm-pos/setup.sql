-- Run once in Supabase → SQL Editor

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 'user');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create policy "profiles_select" on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

create table public.erp_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null, sku text not null,
  quantity integer not null default 0 check (quantity >= 0),
  unit_price numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);
alter table public.erp_products enable row level security;
create policy "erp_own" on public.erp_products for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "erp_admin_read" on public.erp_products for select using (public.is_admin());

create table public.pos_sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_name text not null, quantity integer not null default 1,
  total numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);
alter table public.pos_sales enable row level security;
create policy "pos_own" on public.pos_sales for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pos_admin_read" on public.pos_sales for select using (public.is_admin());

create table public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null, email text, phone text, company text,
  status text not null default 'lead',
  created_at timestamptz not null default now()
);
alter table public.crm_contacts enable row level security;
create policy "crm_own" on public.crm_contacts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "crm_admin_read" on public.crm_contacts for select using (public.is_admin());
