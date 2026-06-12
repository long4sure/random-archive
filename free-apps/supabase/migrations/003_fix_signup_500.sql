-- Run this in Supabase SQL Editor if register/login returns 500
-- Cause: new users could not insert into profiles (RLS blocked the signup trigger)

drop policy if exists "Create profile on signup" on public.profiles;
create policy "Create profile on signup"
  on public.profiles
  for insert
  with check (
    exists (select 1 from auth.users where auth.users.id = profiles.id)
  );
