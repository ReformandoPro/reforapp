begin;

do $$
begin
  if not exists (
    select 1 from pg_tables
    where schemaname = 'public'
      and tablename = 'project_task_issues'
      and rowsecurity
  ) then
    raise exception 'B18 table grants require project_task_issues RLS';
  end if;

  if (select count(*) from pg_policies
      where schemaname = 'public'
        and tablename = 'project_task_issues') <> 2 then
    raise exception 'B18 table grants require exactly two issue policies';
  end if;
end;
$$;

-- Parent SELECT is required because the issue policies verify project/task
-- relationships with subqueries executed as authenticated.
grant select on table public.memberships, public.projects, public.project_tasks
  to authenticated;
grant select, insert on table public.project_task_issues to authenticated;

commit;
