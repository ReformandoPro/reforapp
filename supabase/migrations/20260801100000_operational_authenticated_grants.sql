begin;

do $$
begin
  if to_regclass('public.authenticated_operational_grant_baseline') is not null then
    raise exception 'Authenticated operational grant baseline already exists';
  end if;

  if not exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and tablename in ('project_phases', 'projects', 'project_tasks')
    group by schemaname
    having count(*) = 3
  ) then
    raise exception 'Authenticated operational grants require the three target tables';
  end if;

  if exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and tablename in ('project_phases', 'projects', 'project_tasks')
      and not rowsecurity
  ) then
    raise exception 'Authenticated operational grants require RLS on every target table';
  end if;
end;
$$;

create table public.authenticated_operational_grant_baseline (
  privilege_key text primary key,
  table_name text not null,
  privilege_name text not null,
  had_privilege boolean not null,
  constraint authenticated_operational_grant_baseline_key_check
    check (privilege_key in ('project_phases_select', 'projects_update', 'project_tasks_update'))
);

revoke all on table public.authenticated_operational_grant_baseline
  from public, anon, authenticated;

alter table public.authenticated_operational_grant_baseline enable row level security;

do $$
declare
  baseline_owner oid;
begin
  select c.relowner
  into baseline_owner
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'authenticated_operational_grant_baseline';

  if baseline_owner is distinct from (select oid from pg_roles where rolname = current_user) then
    raise exception 'Operational grant baseline ownership is not held by the migration owner';
  end if;

  if has_table_privilege('anon', 'public.authenticated_operational_grant_baseline', 'SELECT')
     or has_table_privilege('authenticated', 'public.authenticated_operational_grant_baseline', 'SELECT') then
    raise exception 'Operational grant baseline ACL exposes the baseline to application roles';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'authenticated_operational_grant_baseline'
  ) then
    raise exception 'Operational grant baseline must not have policies';
  end if;
end;
$$;

insert into public.authenticated_operational_grant_baseline (
  privilege_key,
  table_name,
  privilege_name,
  had_privilege
)
values
  (
    'project_phases_select',
    'public.project_phases',
    'SELECT',
    has_table_privilege('authenticated', 'public.project_phases', 'SELECT')
  ),
  (
    'projects_update',
    'public.projects',
    'UPDATE',
    has_table_privilege('authenticated', 'public.projects', 'UPDATE')
  ),
  (
    'project_tasks_update',
    'public.project_tasks',
    'UPDATE',
    has_table_privilege('authenticated', 'public.project_tasks', 'UPDATE')
  );

grant select on table public.project_phases to authenticated;
grant update on table public.projects to authenticated;
grant update on table public.project_tasks to authenticated;

do $$
begin
  if not has_table_privilege('authenticated', 'public.project_phases', 'SELECT')
     or not has_table_privilege('authenticated', 'public.projects', 'UPDATE')
     or not has_table_privilege('authenticated', 'public.project_tasks', 'UPDATE') then
    raise exception 'Authenticated operational grants were not applied';
  end if;

  if has_table_privilege('authenticated', 'public.project_phases', 'INSERT')
     or has_table_privilege('authenticated', 'public.project_phases', 'UPDATE')
     or has_table_privilege('authenticated', 'public.project_phases', 'DELETE')
     or has_table_privilege('authenticated', 'public.projects', 'DELETE')
     or has_table_privilege('authenticated', 'public.project_tasks', 'DELETE') then
    raise exception 'Operational grant migration applied excessive privileges';
  end if;
end;
$$;

commit;
