\set ON_ERROR_STOP on

-- B18 uses a compensating, fail-closed rollback. It intentionally does not
-- compare against the insecure historical baseline.
select tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename = 'project_task_issues';

do $$
begin
  if not exists (
    select 1 from pg_tables
    where schemaname = 'public'
      and tablename = 'project_task_issues'
      and rowsecurity
  ) then
    raise exception 'B18 rollback failed closed: RLS was disabled';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_task_issues'
  ) then
    raise exception 'B18 rollback left project_task_issues policies';
  end if;

  if has_table_privilege('authenticated', 'public.project_task_issues', 'SELECT')
     or has_table_privilege('authenticated', 'public.project_task_issues', 'INSERT')
     or has_table_privilege('authenticated', 'public.projects', 'SELECT')
     or has_table_privilege('authenticated', 'public.project_tasks', 'SELECT')
     or has_table_privilege('authenticated', 'public.memberships', 'SELECT') then
    raise exception 'B18 rollback left issue table privileges';
  end if;
end;
$$;
