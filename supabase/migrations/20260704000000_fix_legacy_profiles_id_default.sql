begin;

-- Fix: creating/inviting Auth users in staging fails with
--   null value in column "id" of relation "profiles" violates not-null constraint
--
-- Root cause: a legacy public.profiles table already existed in this project
-- before 20260628132500_profiles.sql introduced the canonical user_id-based
-- model. That legacy table has its own primary key column "id" that is
-- NOT NULL with no default. Because 20260628132500_profiles.sql deliberately
-- skips touching an existing primary key (to avoid destructive changes to
-- legacy data), "id" was left without a default. public.handle_new_auth_user()
-- (created by that same migration) only inserts (user_id, email), so every
-- new auth.users row -- including the ones created by Supabase Auth's
-- invite/create-user endpoints -- fails on the NOT NULL "id" column.
--
-- This migration is additive, idempotent and non-destructive: it does not
-- drop or rename any column, does not touch existing rows, does not change
-- any column's data type, and keeps user_id as the canonical FK to
-- auth.users. It is a no-op on a canonical schema where profiles.id does
-- not exist.

-- 1) If legacy public.profiles.id is uuid, NOT NULL and has no default,
--    give it a default so plain inserts that omit "id" keep working.
do $$
declare
  v_data_type text;
  v_has_default boolean;
begin
  select data_type, (column_default is not null)
  into v_data_type, v_has_default
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name = 'id';

  if v_data_type is null then
    raise notice 'public.profiles has no "id" column; nothing to backfill, skipping.';
  elsif v_has_default then
    raise notice 'public.profiles.id already has a default; skipping.';
  elsif v_data_type = 'uuid' then
    create extension if not exists pgcrypto;
    execute 'alter table public.profiles alter column id set default gen_random_uuid()';
    raise notice 'Set default gen_random_uuid() on public.profiles.id.';
  else
    raise notice 'public.profiles.id exists, is NOT NULL without a default, but is type % (not uuid); skipping default to avoid an incompatible type change. Relying on the handle_new_auth_user() fallback instead.', v_data_type;
  end if;
end $$;

-- 2) Defense in depth: harden the trigger function so user creation also
--    succeeds when "id" is NOT NULL without a default and step (1) above
--    could not set a safe default (e.g. a non-uuid legacy type). Behavior
--    for schemas without a legacy "id" column is unchanged: the original
--    insert (user_id, email) and the existing invalid_column_reference
--    fallback are preserved exactly as before.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_id_column boolean;
begin
  select exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = 'id'
    ) into v_has_id_column;

  begin
    insert into public.profiles (user_id, email)
    values (new.id, new.email)
    on conflict (user_id) do update set email = excluded.email;
  exception
    when invalid_column_reference then
      -- Legacy public.profiles without a unique/PK constraint on user_id
      -- yet (see guards in 20260628132500_profiles.sql). Fall back to an
      -- existence check so new signups still get a profile row instead of
      -- failing outright.
      if not exists (select 1 from public.profiles p where p.user_id = new.id) then
        insert into public.profiles (user_id, email) values (new.id, new.email);
      end if;
    when not_null_violation then
      -- Legacy public.profiles.id is NOT NULL without a usable default
      -- (e.g. non-uuid type that step 1 above intentionally left alone).
      -- Retry once, generating an id explicitly, but only if that column
      -- actually exists; otherwise re-raise the original error unchanged.
      if v_has_id_column then
        execute 'insert into public.profiles (id, user_id, email) values (gen_random_uuid(), $1, $2) on conflict (user_id) do update set email = excluded.email'
          using new.id, new.email;
      else
        raise;
      end if;
  end;
  return new;
end;
$$;

commit;
