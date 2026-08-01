begin;

-- R1 is intentionally self-contained. The baseline is created and populated
-- before any privilege or RLS change, then protected by RLS with no policies.
create table public.r1_acl_baseline (
  schema_name text not null,
  table_name text not null,
  role_name text not null,
  privilege_type text not null,
  had_privilege boolean not null,
  had_grant_option boolean not null,
  primary key (schema_name, table_name, role_name, privilege_type)
);

create table public.r1_rls_baseline (
  schema_name text not null,
  table_name text primary key,
  had_row_security boolean not null,
  had_force_row_security boolean not null
);

create table public.r1_default_acl_baseline (
  grantor text not null,
  schema_name text not null,
  role_name text not null,
  privilege_type text not null,
  had_grant_option boolean not null,
  primary key (grantor, schema_name, role_name, privilege_type)
);

create table public.r1_table_manifest (
  table_name text primary key
);

do $$
declare
  expected text[] := array[
    'organizations', 'memberships', 'clients', 'projects', 'profiles',
    'project_tasks', 'project_task_comments', 'project_documents',
    'project_progress_updates', 'project_budgets', 'project_budget_lines',
    'project_costs', 'project_purchases', 'project_purchase_items',
    'project_phases', 'organization_invitations', 'project_templates',
    'project_template_phases', 'project_template_tasks', 'project_task_issues',
    'budgets', 'budget_items', 'materials', 'notifications', 'tasks'
  ];
  candidate text;
  unexpected text;
  object_owner name;
begin
  if exists (select 1 from public.r1_acl_baseline)
     or exists (select 1 from public.r1_rls_baseline)
     or exists (select 1 from public.r1_default_acl_baseline)
     or exists (select 1 from public.r1_table_manifest) then
    raise exception 'R1 baseline already exists or contains unexpected state';
  end if;

  foreach candidate in array expected loop
    if to_regclass(format('public.%I', candidate)) is not null then
      insert into public.r1_table_manifest(table_name) values (candidate);
    end if;
  end loop;

  select c.relowner::regrole
    into object_owner
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'r1_acl_baseline';

  if object_owner is distinct from current_user::name then
    raise exception 'R1 baseline owner mismatch: expected current owner %, got %', current_user, object_owner;
  end if;

  select m.table_name into unexpected
  from public.r1_table_manifest m
  where not exists (
    select 1 from unnest(expected) e(table_name) where e.table_name = m.table_name
  ) limit 1;
  if unexpected is not null then
    raise exception 'R1 manifest contains unexpected table %', unexpected;
  end if;

  insert into public.r1_rls_baseline
    (schema_name, table_name, had_row_security, had_force_row_security)
  select n.nspname, c.relname, c.relrowsecurity, c.relforcerowsecurity
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  join public.r1_table_manifest m on m.table_name = c.relname
  where n.nspname = 'public' and c.relkind in ('r', 'p');

  if exists (
    select 1
    from public.r1_table_manifest m
    where exists (
      select 1 from pg_catalog.pg_policies p
      where p.schemaname = 'public'
        and p.tablename = m.table_name
        and m.table_name in ('budgets', 'budget_items', 'materials', 'notifications', 'tasks')
    )
  ) then
    raise exception 'R1 refuses orphan tables with pre-existing policies';
  end if;

  insert into public.r1_acl_baseline
    (schema_name, table_name, role_name, privilege_type, had_privilege, had_grant_option)
  select 'public', m.table_name, r.role_name, p.privilege_type,
         has_table_privilege(r.role_name, format('public.%I', m.table_name), p.privilege_type),
         has_table_privilege(r.role_name, format('public.%I', m.table_name), p.privilege_type || ' WITH GRANT OPTION')
  from public.r1_table_manifest m
  cross join (values ('anon'), ('authenticated'), ('service_role')) r(role_name)
  cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
                     ('TRUNCATE'), ('REFERENCES'), ('TRIGGER'), ('MAINTAIN')) p(privilege_type);

  insert into public.r1_default_acl_baseline
    (grantor, schema_name, role_name, privilege_type, had_grant_option)
  select pg_get_userbyid(d.defaclrole), n.nspname, grantee.rolname,
         acl.privilege_type, acl.is_grantable
  from pg_catalog.pg_default_acl d
  join pg_catalog.pg_namespace n on n.oid = d.defaclnamespace
  cross join lateral aclexplode(d.defaclacl) acl
  join pg_catalog.pg_roles grantee on grantee.oid = acl.grantee
  where n.nspname = 'public'
    and d.defaclobjtype = 'r'
    and grantee.rolname in ('anon', 'authenticated', 'service_role');

  alter table public.r1_acl_baseline enable row level security;
  alter table public.r1_rls_baseline enable row level security;
  alter table public.r1_default_acl_baseline enable row level security;
  alter table public.r1_table_manifest enable row level security;
  revoke all on table public.r1_acl_baseline, public.r1_rls_baseline,
    public.r1_default_acl_baseline, public.r1_table_manifest
    from public, anon, authenticated, service_role;

  -- Public and anon receive no access to any R1 table. Authenticated keeps
  -- existing application grants except on the orphan deny-all set.
  foreach candidate in array expected loop
    if to_regclass(format('public.%I', candidate)) is not null then
      execute format('revoke all on table public.%I from public, anon', candidate);
      execute format('revoke truncate, maintain on table public.%I from authenticated', candidate);
      if candidate in ('budgets', 'budget_items', 'materials', 'notifications', 'tasks') then
        execute format('revoke all on table public.%I from authenticated', candidate);
      end if;
      execute format('alter table public.%I enable row level security', candidate);
    end if;
  end loop;

  -- Default ACLs are narrowed only for public and client roles. service_role
  -- is intentionally preserved because it is the backend/fixture role.
  for object_owner in
    select distinct grantor::name from public.r1_default_acl_baseline
    where schema_name = 'public'
  loop
    execute format(
      'alter default privileges for role %I in schema public revoke all on tables from public, anon, authenticated',
      object_owner
    );
  end loop;
end;
$$;

commit;
