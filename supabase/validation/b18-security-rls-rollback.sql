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

  if exists (
    select 1
    from (values
      ('project_task_issues', 'SELECT'), ('project_task_issues', 'INSERT'),
      ('projects', 'SELECT'), ('project_tasks', 'SELECT'), ('memberships', 'SELECT')
    ) as required(table_name, privilege_name)
    join pg_class c on c.relname = required.table_name
    join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
    cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) acl
    where acl.grantee = 'authenticated'::regrole
      and acl.privilege_type = required.privilege_name
  ) then
    raise exception 'B18 rollback left issue table privileges';
  end if;

  if to_regclass('public.b18_grant_baseline') is not null then
    raise exception 'B18 rollback left its ACL baseline table';
  end if;
end;
$$;
