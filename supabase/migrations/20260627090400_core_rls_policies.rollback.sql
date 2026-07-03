begin;

-- Rollback: core RLS + policies + helpers.

-- Policies: projects
Drop policy if exists projects_delete_owner_admin on public.projects;
Drop policy if exists projects_update_owner_admin on public.projects;
Drop policy if exists projects_insert_owner_admin on public.projects;
Drop policy if exists projects_select_member on public.projects;

-- Policies: clients
Drop policy if exists clients_delete_owner_admin on public.clients;
Drop policy if exists clients_update_owner_admin on public.clients;
Drop policy if exists clients_insert_owner_admin on public.clients;
Drop policy if exists clients_select_member on public.clients;

-- Policies: memberships
Drop policy if exists memberships_delete_owner_admin on public.memberships;
Drop policy if exists memberships_update_owner_admin on public.memberships;
Drop policy if exists memberships_insert_owner_admin_or_bootstrap on public.memberships;
Drop policy if exists memberships_select_member on public.memberships;

-- Policies: organizations
Drop policy if exists organizations_delete_owner_admin on public.organizations;
Drop policy if exists organizations_update_owner_admin on public.organizations;
Drop policy if exists organizations_insert_authenticated on public.organizations;
Drop policy if exists organizations_select_member on public.organizations;

-- Disable RLS
alter table public.projects disable row level security;
alter table public.clients disable row level security;
alter table public.memberships disable row level security;
alter table public.organizations disable row level security;

-- Helpers
Drop function if exists public.is_client_in_org(uuid, uuid);
Drop function if exists public.org_has_any_membership(uuid);
Drop function if exists public.is_org_admin(uuid);
Drop function if exists public.is_org_member(uuid);

commit;
