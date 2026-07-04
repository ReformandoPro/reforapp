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

-- Compatibility guards for a pre-existing legacy public.profiles table that
-- may be missing one or more of the columns above. These are no-ops when
-- the table was just freshly created by the statement above.
alter table public.profiles
  add column if not exists user_id uuid;

alter table public.profiles
  add column if not exists display_name text not null default '';

alter table public.profiles
  add column if not exists email text;

alter table public.profiles
  add column if not exists phone text;

alter table public.profiles
  add column if not exists created_at timestamptz not null default now();

alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

-- Safely (re)establish user_id as the primary key. This is a no-op if the
-- table was freshly created above (it already has profiles_pkey). For a
-- pre-existing legacy table we only succeed if every row already has a
-- non-null, unique user_id; otherwise we deliberately skip instead of
-- performing any destructive fix (e.g. deleting or guessing data), and
-- leave a notice so this can be resolved deliberately in a follow-up
-- migration once the legacy data has been reviewed.
do $$
begin
  begin
    alter table public.profiles
      add constraint profiles_pkey primary key (user_id);
  exception
    when duplicate_object then
      null; -- primary key already present, nothing to do
    when not_null_violation then
      raise notice 'public.profiles has legacy rows with a null user_id; skipping PRIMARY KEY to avoid a destructive migration. Backfill user_id manually, then add the primary key in a follow-up migration.';
    when unique_violation then
      raise notice 'public.profiles has duplicate user_id values; skipping PRIMARY KEY. Deduplicate manually, then add the primary key in a follow-up migration.';
  end;
end $$;

-- Safely (re)establish the FK to auth.users. Skipped (with a notice) if
-- legacy rows reference a user_id with no matching auth.users row, rather
-- than deleting or altering those legacy rows.
do $$
begin
  begin
    alter table public.profiles
      add constraint profiles_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  exception
    when duplicate_object then
      null; -- FK already present, nothing to do
    when foreign_key_violation then
      raise notice 'public.profiles has user_id values with no matching auth.users row; skipping foreign key to avoid failing on orphaned legacy data.';
  end;
end $$;

alter table public.profiles enable row level security;

-- Keep updated_at in sync.
drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles
before update on public.profiles
for each row
execute function public.set_updated_at();

-- Backfill profiles for existing users (best effort). Uses a NOT EXISTS
-- check rather than ON CONFLICT so it keeps working even when the PRIMARY
-- KEY above was skipped for legacy-data-safety reasons. This never deletes
-- or overwrites any existing row.
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
  begin
    insert into public.profiles (user_id, email)
    values (new.id, new.email)
    on conflict (user_id) do update set email = excluded.email;
  exception
    when invalid_column_reference then
      -- Legacy public.profiles without a unique/PK constraint on user_id
      -- yet (see guards above). Fall back to an existence check so new
      -- signups still get a profile row instead of failing outright.
      if not exists (select 1 from public.profiles p where p.user_id = new.id) then
        insert into public.profiles (user_id, email) values (new.id, new.email);
      end if;
  end;
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
