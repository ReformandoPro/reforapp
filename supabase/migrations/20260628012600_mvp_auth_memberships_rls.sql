begin;

-- MVP Auth + memberships + RLS
-- Decisions:
-- - Keep public demo anon SELECT strictly limited to demo org + demo rows.
-- - Authenticated users read their org (membership).
-- - owner/admin can insert/update (no delete) within their org.
-- - No writes to anon.
-- - No invitations yet (memberships are bootstrapped manually).

-- ---------------------------------------------------------------------------
-- 0) updated_at trigger (audit: none existed)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Ensure triggers are present (idempotent-ish via drop/create)
drop trigger if exists set_updated_at_projects on public.projects;
create trigger set_updated_at_projects
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_clients on public.clients;
create trigger set_updated_at_clients
before update on public.clients
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 1) Extend clients for MVP quick-create (optional fields)
-- ---------------------------------------------------------------------------
alter table public.clients
  add column if not exists email text,
  add column if not exists phone text;

alter table public.clients
  alter column created_at set default now(),
  alter column updated_at set default now();

-- ---------------------------------------------------------------------------
-- 2) memberships
-- ---------------------------------------------------------------------------
create table if not exists public.memberships (
  organization_id uuid not null references public.organizations(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memberships_pkey primary key (organization_id, user_id),
  constraint memberships_role_check check (role in ('owner','admin','member'))
);

alter table public.memberships enable row level security;

drop trigger if exists set_updated_at_memberships on public.memberships;
create trigger set_updated_at_memberships
before update on public.memberships
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3) Backfill legacy projects so we can enforce NOT NULL
-- ---------------------------------------------------------------------------
-- NOTE: we do NOT delete legacy rows automatically.
-- If you prefer to remove legacy staging rows (e.g. p1/p2), do it manually
-- before applying this migration.

-- Backfill organization_id for legacy rows.
update public.projects
set organization_id = '11111111-1111-1111-1111-111111111111'::uuid
where organization_id is null;

-- Backfill name from title.
update public.projects
set name = coalesce(name, title)
where name is null;

-- Backfill client_id using clients.display_name (client_name is NOT NULL today,
-- but we still guard with COALESCE to keep this safe).
with needed as (
  select distinct
    p.organization_id,
    coalesce(p.client_name, 'Cliente sin nombre') as display_name
  from public.projects p
  where p.client_id is null
),
to_insert as (
  select n.*
  from needed n
  where not exists (
    select 1
    from public.clients c
    where c.organization_id = n.organization_id
      and c.display_name = n.display_name
  )
),
inserted as (
  insert into public.clients (id, organization_id, display_name, created_at, updated_at)
  select gen_random_uuid(), organization_id, display_name, now(), now()
  from to_insert
  returning id, organization_id, display_name
),
clients_all as (
  -- Force execution of the INSERT CTE by referencing it.
  select id, organization_id, display_name from public.clients
  union all
  select id, organization_id, display_name from inserted
),
client_pick as (
  -- pick a stable client id per (org, display_name)
  select organization_id, display_name, (array_agg(id order by id))[1] as id
  from clients_all
  group by organization_id, display_name
)
update public.projects p
set client_id = cp.id
from client_pick cp
where p.client_id is null
  and p.organization_id = cp.organization_id
  and coalesce(p.client_name, 'Cliente sin nombre') = cp.display_name;

-- Safety check: abort if still nulls.
do $$
begin
  if exists (select 1 from public.projects where organization_id is null) then
    raise exception 'projects.organization_id still has NULL after backfill';
  end if;

  if exists (select 1 from public.projects where client_id is null) then
    raise exception 'projects.client_id still has NULL after backfill';
  end if;

  if exists (select 1 from public.projects where name is null) then
    raise exception 'projects.name still has NULL after backfill';
  end if;
end $$;

alter table public.projects
  alter column organization_id set not null,
  alter column client_id set not null,
  alter column name set not null,
  alter column updated_at set default now();

-- ---------------------------------------------------------------------------
-- 4) RLS policies (authenticated)
-- Keep anon demo policies intact (already strictly limited).
-- ---------------------------------------------------------------------------

-- memberships: users can read their memberships (no writes in MVP)
drop policy if exists memberships_select_own on public.memberships;
create policy memberships_select_own
on public.memberships
for select
to authenticated
using (user_id = auth.uid());

-- organizations: authenticated can read orgs they belong to
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

-- clients: authenticated members can read; owner/admin can write
drop policy if exists clients_select_member on public.clients;
create policy clients_select_member
on public.clients
for select
to authenticated
using (
  exists (
    select 1
    from public.memberships m
    where m.organization_id = clients.organization_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists clients_insert_owner_admin on public.clients;
create policy clients_insert_owner_admin
on public.clients
for insert
to authenticated
with check (
  exists (
    select 1
    from public.memberships m
    where m.organization_id = clients.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  )
);

drop policy if exists clients_update_owner_admin on public.clients;
create policy clients_update_owner_admin
on public.clients
for update
to authenticated
using (
  exists (
    select 1
    from public.memberships m
    where m.organization_id = clients.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  )
)
with check (
  exists (
    select 1
    from public.memberships m
    where m.organization_id = clients.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  )
);

-- projects: authenticated members can read; owner/admin can write
drop policy if exists projects_select_member on public.projects;
create policy projects_select_member
on public.projects
for select
to authenticated
using (
  exists (
    select 1
    from public.memberships m
    where m.organization_id = projects.organization_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists projects_insert_owner_admin on public.projects;
create policy projects_insert_owner_admin
on public.projects
for insert
to authenticated
with check (
  exists (
    select 1
    from public.memberships m
    where m.organization_id = projects.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  )
);

drop policy if exists projects_update_owner_admin on public.projects;
create policy projects_update_owner_admin
on public.projects
for update
to authenticated
using (
  exists (
    select 1
    from public.memberships m
    where m.organization_id = projects.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  )
)
with check (
  exists (
    select 1
    from public.memberships m
    where m.organization_id = projects.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  )
);

-- No DELETE policies in MVP.

commit;

