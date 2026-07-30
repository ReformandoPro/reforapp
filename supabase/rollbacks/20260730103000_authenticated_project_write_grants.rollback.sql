begin;

do $$
declare
  projects_baseline boolean;
  project_tasks_baseline boolean;
begin
  if to_regclass('public.authenticated_project_write_grant_baseline') is null then
    raise exception 'Authenticated project write grant rollback requires its baseline snapshot';
  end if;

  if (
    select count(*)
    from public.authenticated_project_write_grant_baseline
  ) <> 2
  or exists (
    select 1
    from public.authenticated_project_write_grant_baseline
    where privilege_key not in ('projects_insert', 'project_tasks_insert')
  )
  or not exists (
    select 1
    from public.authenticated_project_write_grant_baseline
    where privilege_key = 'projects_insert'
  )
  or not exists (
    select 1
    from public.authenticated_project_write_grant_baseline
    where privilege_key = 'project_tasks_insert'
  ) then
    raise exception 'Authenticated project write grant rollback requires a coherent baseline snapshot';
  end if;

  select had_privilege
  into projects_baseline
  from public.authenticated_project_write_grant_baseline
  where privilege_key = 'projects_insert';

  select had_privilege
  into project_tasks_baseline
  from public.authenticated_project_write_grant_baseline
  where privilege_key = 'project_tasks_insert';

  if projects_baseline then
    grant insert on table public.projects to authenticated;
  else
    revoke insert on table public.projects from authenticated;
  end if;

  if has_table_privilege('authenticated', 'public.projects', 'INSERT') is distinct from projects_baseline then
    raise exception 'Authenticated project INSERT privilege did not restore to baseline';
  end if;

  if project_tasks_baseline then
    grant insert on table public.project_tasks to authenticated;
  else
    revoke insert on table public.project_tasks from authenticated;
  end if;

  if has_table_privilege('authenticated', 'public.project_tasks', 'INSERT') is distinct from project_tasks_baseline then
    raise exception 'Authenticated project task INSERT privilege did not restore to baseline';
  end if;
end;
$$;

drop table public.authenticated_project_write_grant_baseline;

commit;
