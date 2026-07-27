\set ON_ERROR_STOP on

-- Disposable PostgreSQL-only Supabase compatibility layer. Never run this on
-- staging or production. It supplies only auth.uid(), auth.users and roles
-- required by the historical migrations. The storage objects below are only a
-- minimal PostgreSQL CI compatibility layer, not a Supabase Storage model;
-- never run this bootstrap on staging or production.
create extension if not exists pgcrypto;

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);

create or replace function auth.uid()
returns uuid
language sql
stable
set search_path = pg_catalog, public, auth
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

do $$
declare
  role_name text;
begin
  foreach role_name in array array['anon', 'authenticated', 'service_role'] loop
    if not exists (select 1 from pg_roles where rolname = role_name) then
      execute format('create role %I noinherit nologin', role_name);
    end if;
  end loop;
end;
$$;

grant anon, authenticated, service_role to postgres;
grant usage on schema auth to authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;

-- Minimal auth.jwt() compatibility for PostgreSQL CI. This is not the full
-- Supabase Auth implementation and must never be run on staging or production.
create or replace function auth.jwt()
returns jsonb
language sql
stable
set search_path = pg_catalog, public, auth
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb,
    jsonb_build_object(
      'sub', nullif(current_setting('request.jwt.claim.sub', true), ''),
      'email', nullif(current_setting('request.jwt.claim.email', true), '')
    )
  )
$$;

revoke all on function auth.jwt() from public;
grant execute on function auth.jwt() to anon, authenticated, service_role;

-- Verify both claim sources and restore the session settings before any
-- historical migration runs. These checks are CI-only compatibility checks.
do $$
declare
  previous_claims text := current_setting('request.jwt.claims', true);
  previous_email text := current_setting('request.jwt.claim.email', true);
begin
  perform set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-000000000001","email":"invitee@example.com"}',
    false
  );
  if auth.jwt() ->> 'email' <> 'invitee@example.com' then
    raise exception 'auth.jwt() claims check failed';
  end if;

  perform set_config('request.jwt.claims', '', false);
  perform set_config('request.jwt.claim.email', 'fallback@example.com', false);
  if auth.jwt() ->> 'email' <> 'fallback@example.com' then
    raise exception 'auth.jwt() fallback check failed';
  end if;

  perform set_config('request.jwt.claims', coalesce(previous_claims, ''), false);
  perform set_config('request.jwt.claim.email', coalesce(previous_email, ''), false);
exception when others then
  perform set_config('request.jwt.claims', coalesce(previous_claims, ''), false);
  perform set_config('request.jwt.claim.email', coalesce(previous_email, ''), false);
  raise;
end;
$$;

-- Minimal Supabase Storage compatibility for historical migrations that create
-- storage buckets and storage.objects RLS policies. This deliberately omits
-- the rest of Supabase Storage and must never be used in staging or production.
create schema if not exists storage;

create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text,
  name text,
  owner uuid,
  created_at timestamptz,
  updated_at timestamptz,
  last_accessed_at timestamptz,
  metadata jsonb
);

alter table storage.objects enable row level security;

grant usage on schema storage to anon, authenticated, service_role;
grant select on table storage.buckets to anon, authenticated, service_role;
grant select, insert, update, delete on table storage.objects to anon, authenticated, service_role;
