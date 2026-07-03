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

alter table public.organizations enable row level security;

-- RLS policies

-- SELECT: only members of the organization.
drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member
  on public.organizations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = organizations.id
        and m.user_id = auth.uid()
    )
  );

-- INSERT: allow any authenticated user to create an organization.
-- Defense-in-depth for duplicates is handled at app layer.
drop policy if exists organizations_insert_authenticated on public.organizations;
create policy organizations_insert_authenticated
  on public.organizations
  for insert
  to authenticated
  with check (true);

-- UPDATE: owner/admin only.
drop policy if exists organizations_update_owner_admin on public.organizations;
create policy organizations_update_owner_admin
  on public.organizations
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = organizations.id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  )
  with check (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = organizations.id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

-- DELETE: owner/admin only.
drop policy if exists organizations_delete_owner_admin on public.organizations;
create policy organizations_delete_owner_admin
  on public.organizations
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = organizations.id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

commit;
