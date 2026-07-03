begin;

-- Rollback: projects core bootstrap.

drop policy if exists projects_delete_owner_admin on public.projects;
drop policy if exists projects_update_owner_admin on public.projects;
drop policy if exists projects_insert_owner_admin on public.projects;
drop policy if exists projects_select_member on public.projects;

drop trigger if exists set_updated_at_projects on public.projects;

drop table if exists public.projects;

commit;
