begin;

do $$
begin
  if to_regclass('public.authenticated_project_write_grant_baseline') is not null then
    raise exception 'Authenticated project write grant snapshot already exists';
  end if;

  if not exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and tablename = 'projects'
      and rowsecurity
  ) then
    raise exception 'Authenticated project write grants require projects RLS';
  end if;

  if not exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and tablename = 'project_tasks'
      and rowsecurity
  ) then
    raise exception 'Authenticated project write grants require project_tasks RLS';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'projects'
      and policyname = 'projects_insert_owner_admin'
      and cmd = 'INSERT'
      and roles = array['authenticated']::name[]
      and qual is null
      and with_check is not null
  ) then
    raise exception 'Authenticated project write grants require projects_insert_owner_admin';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'project_tasks'
      and policyname = 'project_tasks_insert_owner_admin'
      and cmd = 'INSERT'
      and roles = array['authenticated']::name[]
      and qual is null
      and with_check is not null
  ) then
    raise exception 'Authenticated project write grants require project_tasks_insert_owner_admin';
  end if;
end;
$$;

create table public.authenticated_project_write_grant_baseline (
  privilege_key text primary key,
  had_privilege boolean not null
);

revoke all on table public.authenticated_project_write_grant_baseline
  from public, anon, authenticated;

alter table public.authenticated_project_write_grant_baseline enable row level security;

insert into public.authenticated_project_write_grant_baseline (
  privilege_key,
  had_privilege
)
values
  (
    'projects_insert',
    has_table_privilege('authenticated', 'public.projects', 'INSERT')
  ),
  (
    'project_tasks_insert',
    has_table_privilege('authenticated', 'public.project_tasks', 'INSERT')
  );

grant insert on table public.projects to authenticated;
grant insert on table public.project_tasks to authenticated;

commit;
