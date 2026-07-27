begin;

create table if not exists public.b18_grant_baseline (
  privilege_key text primary key,
  had_privilege boolean not null
);

do $$
begin
  if exists (select 1 from public.b18_grant_baseline) then
    raise exception 'B18 grant snapshot already exists; refusing to overwrite it';
  end if;
end;
$$;

insert into public.b18_grant_baseline (privilege_key, had_privilege)
select required.privilege_key,
       exists (
         select 1
         from pg_class as c
         join pg_namespace as n on n.oid = c.relnamespace
         cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) as acl
         where n.nspname = required.schema_name
           and c.relname = required.table_name
           and acl.grantee = 'authenticated'::regrole
           and acl.privilege_type = required.privilege_name
       )
from (values
  ('memberships_select', 'public', 'memberships', 'SELECT'),
  ('projects_select', 'public', 'projects', 'SELECT'),
  ('project_tasks_select', 'public', 'project_tasks', 'SELECT'),
  ('issues_select', 'public', 'project_task_issues', 'SELECT'),
  ('issues_insert', 'public', 'project_task_issues', 'INSERT')
) as required(privilege_key, schema_name, table_name, privilege_name);

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

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_task_issues'
      and (
        (policyname = 'project_task_issues_select_member'
         and (cmd <> 'SELECT' or roles <> array['authenticated']::name[] or qual is null or with_check is not null))
        or
        (policyname = 'project_task_issues_insert_member'
         and (cmd <> 'INSERT' or roles <> array['authenticated']::name[] or qual is not null or with_check is null))
        or policyname not in ('project_task_issues_select_member', 'project_task_issues_insert_member')
      )
  ) then
    raise exception 'B18 table grants require the exact two issue policy definitions';
  end if;
end;
$$;

-- Parent SELECT is required because the issue policies verify project/task
-- relationships with subqueries executed as authenticated.
do $$
begin
  if not (select had_privilege from public.b18_grant_baseline where privilege_key = 'memberships_select') then
    execute 'grant select on table public.memberships to authenticated';
  end if;
  if not (select had_privilege from public.b18_grant_baseline where privilege_key = 'projects_select') then
    execute 'grant select on table public.projects to authenticated';
  end if;
  if not (select had_privilege from public.b18_grant_baseline where privilege_key = 'project_tasks_select') then
    execute 'grant select on table public.project_tasks to authenticated';
  end if;
  if not (select had_privilege from public.b18_grant_baseline where privilege_key = 'issues_select') then
    execute 'grant select on table public.project_task_issues to authenticated';
  end if;
  if not (select had_privilege from public.b18_grant_baseline where privilege_key = 'issues_insert') then
    execute 'grant insert on table public.project_task_issues to authenticated';
  end if;
end;
$$;

commit;
