begin;

-- Rollback: projects core bootstrap.

drop trigger if exists set_updated_at_projects on public.projects;

drop index if exists projects_org_status_idx;
drop index if exists projects_org_client_idx;
drop index if exists projects_org_updated_at_idx;

drop table if exists public.projects;

commit;
