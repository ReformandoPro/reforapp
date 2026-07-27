begin;

do $$
begin
  if not exists (select 1 from public.b18_grant_baseline) then
    raise exception 'B18 grant rollback requires its baseline snapshot';
  end if;
  if not (select had_privilege from public.b18_grant_baseline where privilege_key = 'memberships_select') then
    execute 'revoke select on table public.memberships from authenticated';
  end if;
  if not (select had_privilege from public.b18_grant_baseline where privilege_key = 'projects_select') then
    execute 'revoke select on table public.projects from authenticated';
  end if;
  if not (select had_privilege from public.b18_grant_baseline where privilege_key = 'project_tasks_select') then
    execute 'revoke select on table public.project_tasks from authenticated';
  end if;
  if not (select had_privilege from public.b18_grant_baseline where privilege_key = 'issues_select') then
    execute 'revoke select on table public.project_task_issues from authenticated';
  end if;
  if not (select had_privilege from public.b18_grant_baseline where privilege_key = 'issues_insert') then
    execute 'revoke insert on table public.project_task_issues from authenticated';
  end if;
end;
$$;

drop table public.b18_grant_baseline;

commit;
