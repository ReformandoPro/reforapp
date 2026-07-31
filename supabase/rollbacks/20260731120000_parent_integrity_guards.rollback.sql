begin;

drop trigger if exists enforce_project_task_parent_integrity
  on public.project_tasks;
drop function if exists public.enforce_project_task_parent_integrity();

drop trigger if exists enforce_project_organization_integrity on public.projects;
drop function if exists public.enforce_project_organization_integrity();

commit;
