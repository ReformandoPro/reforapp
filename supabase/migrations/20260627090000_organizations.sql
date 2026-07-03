begin;

-- Core bootstrap: organizations.
-- NOTE: kept minimal to match current /app/** usage.

-- Required for gen_random_uuid()
create extension if not exists pgcrypto;

-- Ensure updated_at helper exists (shared across migrations).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- slug is optional (onboarding retries without it if column missing).
-- We keep it but do not enforce NOT NULL to preserve compatibility.
create unique index if not exists organizations_slug_unique
  on public.organizations (slug)
  where slug is not null;

create index if not exists organizations_created_at_idx
  on public.organizations (created_at);

-- updated_at trigger
drop trigger if exists set_updated_at_organizations on public.organizations;
create trigger set_updated_at_organizations
before update on public.organizations
for each row
execute function public.set_updated_at();

-- RLS/policies are applied in a later migration once all core tables exist.

commit;
