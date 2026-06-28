begin;

-- Basic user profiles directory.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Keep updated_at in sync.
drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles
before update on public.profiles
for each row
execute function public.set_updated_at();

-- Backfill profiles for existing users (best effort).
insert into public.profiles (user_id, email)
select u.id, u.email
from auth.users u
where not exists (
  select 1 from public.profiles p where p.user_id = u.id
);

-- Auto-create profile on new auth user.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do update set email = excluded.email;
  return new;
end;
$$;

-- Trigger in auth schema.
drop trigger if exists on_auth_user_created_profiles on auth.users;
create trigger on_auth_user_created_profiles
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- RLS policies
-- 1) each user can read their own profile
-- 2) members of same org can read each other's profiles via memberships

drop policy if exists profiles_select_self_or_org_member on public.profiles;
create policy profiles_select_self_or_org_member
  on public.profiles
  for select
  to authenticated
  using (
    profiles.user_id = auth.uid()
    or exists (
      select 1
      from public.memberships me
      join public.memberships other
        on other.organization_id = me.organization_id
      where me.user_id = auth.uid()
        and other.user_id = profiles.user_id
    )
  );

-- Allow user to insert their own profile (normally created by trigger).
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
  on public.profiles
  for insert
  to authenticated
  with check (profiles.user_id = auth.uid());

-- Allow user to update their own profile.
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
  on public.profiles
  for update
  to authenticated
  using (profiles.user_id = auth.uid())
  with check (profiles.user_id = auth.uid());

commit;
