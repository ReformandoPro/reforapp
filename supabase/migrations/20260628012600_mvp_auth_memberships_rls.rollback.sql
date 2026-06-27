begin;

-- Rollback for:
--   20260628012600_mvp_auth_memberships_rls.sql
--
-- Notes:
-- - This rollback aims to restore pre-migration behaviour and schema permissiveness.
-- - It does NOT attempt to delete data created after the migration.
-- - It keeps existing anon demo SELECT policies intact (they predate the migration).

-- Drop authenticated policies (leave anon demo policies as-is)
drop policy if exists projects_update_owner_admin on public.projects;
drop policy if exists projects_insert_owner_admin on public.projects;
drop policy if exists projects_select_member on public.projects;

drop policy if exists clients_update_owner_admin on public.clients;
drop policy if exists clients_insert_owner_admin on public.clients;
drop policy if exists clients_select_member on public.clients;

drop policy if exists organizations_select_member on public.organizations;

drop policy if exists memberships_select_own on public.memberships;

-- Remove triggers created by the migration
drop trigger if exists set_updated_at_projects on public.projects;
drop trigger if exists set_updated_at_clients on public.clients;
drop trigger if exists set_updated_at_memberships on public.memberships;

-- Drop memberships table
drop table if exists public.memberships;

-- Drop updated_at helper function (safe now that triggers are removed)
drop function if exists public.set_updated_at();

-- Relax NOT NULL enforcement on projects
alter table public.projects
  alter column organization_id drop not null,
  alter column client_id drop not null,
  alter column name drop not null;

-- Remove defaults added by the migration
alter table public.projects
  alter column updated_at drop default;

alter table public.clients
  alter column created_at drop default,
  alter column updated_at drop default;

-- Optional (commented): remove quick-create columns if you want to fully revert schema
-- alter table public.clients drop column if exists email;
-- alter table public.clients drop column if exists phone;

commit;

