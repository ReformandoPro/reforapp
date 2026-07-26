begin;

drop trigger if exists protect_project_task_integrity on public.project_tasks;
drop function if exists public.protect_project_task_integrity();
drop trigger if exists protect_project_organization_integrity on public.projects;
drop function if exists public.protect_project_organization_integrity();

commit;
