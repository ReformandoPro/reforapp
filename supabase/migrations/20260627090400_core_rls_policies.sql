begin;

-- Core bootstrap: RLS + policies (applied after core tables exist).
-- This migration intentionally avoids policies that query memberships directly
-- (which can trigger RLS recursion). Instead, it uses SECURITY DEFINER helpers.

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER)
-- ---------------------------------------------------------------------------

create or replace function public.is_org_member(org_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Prevent policy recursion by bypassing row security inside this helper.
  perform set_config('row_security', 'off', true);

  if auth.uid() is null then
    return false;
  end if;

  return exists(
    select 1
    from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
  );
end;
$$;

create or replace function public.is_org_admin(org_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('row_security', 'off', true);

  if auth.uid() is null then
    return false;
  end if;

  return exists(
    select 1
    from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  );
end;
$$;

create or replace function public.org_has_any_membership(org_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('row_security', 'off', true);

  return exists(
    select 1
    from public.memberships m
    where m.organization_id = org_id
  );
end;
$$;

create or replace function public.is_client_in_org(client_id uuid, org_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('row_security', 'off', true);

  return exists(
    select 1
    from public.clients c
    where c.id = client_id
      and c.organization_id = org_id
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;

-- ---------------------------------------------------------------------------
-- Policies: organizations
-- ---------------------------------------------------------------------------

drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member
  on public.organizations
  for select
  to authenticated
  using (public.is_org_member(organizations.id));

drop policy if exists organizations_insert_authenticated on public.organizations;
create policy organizations_insert_authenticated
  on public.organizations
  for insert
  to authenticated
  with check (true);

drop policy if exists organizations_update_owner_admin on public.organizations;
create policy organizations_update_owner_admin
  on public.organizations
  for update
  to authenticated
  using (public.is_org_admin(organizations.id))
  with check (public.is_org_admin(organizations.id));

drop policy if exists organizations_delete_owner_admin on public.organizations;
create policy organizations_delete_owner_admin
  on public.organizations
  for delete
  to authenticated
  using (public.is_org_admin(organizations.id));

-- ---------------------------------------------------------------------------
-- Policies: memberships
-- ---------------------------------------------------------------------------

drop policy if exists memberships_select_member on public.memberships;
create policy memberships_select_member
  on public.memberships
  for select
  to authenticated
  using (public.is_org_member(memberships.organization_id));

-- INSERT: owner/admin OR bootstrap (first owner)
drop policy if exists memberships_insert_owner_admin_or_bootstrap on public.memberships;
create policy memberships_insert_owner_admin_or_bootstrap
  on public.memberships
  for insert
  to authenticated
  with check (
    public.is_org_admin(memberships.organization_id)
    or (
      memberships.user_id = auth.uid()
      and memberships.role = 'owner'
      and not public.org_has_any_membership(memberships.organization_id)
    )
  );

drop policy if exists memberships_update_owner_admin on public.memberships;
create policy memberships_update_owner_admin
  on public.memberships
  for update
  to authenticated
  using (public.is_org_admin(memberships.organization_id))
  with check (public.is_org_admin(memberships.organization_id));

drop policy if exists memberships_delete_owner_admin on public.memberships;
create policy memberships_delete_owner_admin
  on public.memberships
  for delete
  to authenticated
  using (public.is_org_admin(memberships.organization_id));

-- ---------------------------------------------------------------------------
-- Policies: clients
-- ---------------------------------------------------------------------------

drop policy if exists clients_select_member on public.clients;
create policy clients_select_member
  on public.clients
  for select
  to authenticated
  using (public.is_org_member(clients.organization_id));

drop policy if exists clients_insert_owner_admin on public.clients;
create policy clients_insert_owner_admin
  on public.clients
  for insert
  to authenticated
  with check (public.is_org_admin(clients.organization_id));

drop policy if exists clients_update_owner_admin on public.clients;
create policy clients_update_owner_admin
  on public.clients
  for update
  to authenticated
  using (public.is_org_admin(clients.organization_id))
  with check (public.is_org_admin(clients.organization_id));

drop policy if exists clients_delete_owner_admin on public.clients;
create policy clients_delete_owner_admin
  on public.clients
  for delete
  to authenticated
  using (public.is_org_admin(clients.organization_id));

-- ---------------------------------------------------------------------------
-- Policies: projects
-- ---------------------------------------------------------------------------

drop policy if exists projects_select_member on public.projects;
create policy projects_select_member
  on public.projects
  for select
  to authenticated
  using (public.is_org_member(projects.organization_id));

-- INSERT: owner/admin only + client must belong to org
Drop policy if exists projects_insert_owner_admin on public.projects;
create policy projects_insert_owner_admin
  on public.projects
  for insert
  to authenticated
  with check (
    public.is_org_admin(projects.organization_id)
    and public.is_client_in_org(projects.client_id, projects.organization_id)
  );

-- UPDATE: owner/admin only + client must belong to org
Drop policy if exists projects_update_owner_admin on public.projects;
create policy projects_update_owner_admin
  on public.projects
  for update
  to authenticated
  using (public.is_org_admin(projects.organization_id))
  with check (
    public.is_org_admin(projects.organization_id)
    and public.is_client_in_org(projects.client_id, projects.organization_id)
  );

-- DELETE: owner/admin only
Drop policy if exists projects_delete_owner_admin on public.projects;
create policy projects_delete_owner_admin
  on public.projects
  for delete
  to authenticated
  using (public.is_org_admin(projects.organization_id));

commit;
