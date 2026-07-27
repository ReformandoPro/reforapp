\set ON_ERROR_STOP on

-- Disposable PostgreSQL-only Supabase compatibility layer. Never run this on
-- staging or production. It supplies only auth.uid(), auth.users and roles
-- required by the historical migrations.
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
