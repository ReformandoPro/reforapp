begin;

create table public.r1_acl_baseline (
  schema_name text not null, table_name text not null, role_name text not null,
  privilege_type text not null, had_privilege boolean not null,
  had_grant_option boolean not null, primary key (schema_name, table_name, role_name, privilege_type)
);
create table public.r1_rls_baseline (
  schema_name text not null, table_name text primary key,
  had_row_security boolean not null, had_force_row_security boolean not null
);
create table public.r1_default_acl_baseline (
  grantor text not null, schema_name text not null, role_name text not null,
  privilege_type text not null, had_grant_option boolean not null,
  was_managed boolean not null, was_modified boolean not null,
  modification_supported boolean not null,
  primary key (grantor, schema_name, role_name, privilege_type)
);
create table public.r1_table_manifest (table_name text primary key);
create table public.r1_manifest_keys (key text primary key);

do $$
declare
  app_tables text[] := array[
    'organizations','memberships','clients','projects','profiles','project_tasks',
    'project_task_comments','project_documents','project_progress_updates',
    'project_budgets','project_costs','project_purchases','project_phases',
    'organization_invitations','project_templates','project_template_phases',
    'project_template_tasks','project_task_issues','budgets','budget_items',
    'materials','notifications','tasks'
  ];
  roles text[] := array['public','anon','authenticated','service_role'];
  privileges text[] := array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN'];
  orphan_tables text[] := array['budgets','budget_items','materials','notifications','tasks'];
  authenticated_allow text[] := array[
    'memberships:SELECT','projects:SELECT','project_tasks:SELECT',
    'project_task_issues:SELECT','project_task_issues:INSERT',
    'projects:INSERT','project_tasks:INSERT'
  ];
  service_allow text[] := array[
    'organizations:SELECT','organizations:INSERT','organizations:UPDATE','organizations:DELETE',
    'memberships:SELECT','memberships:INSERT','memberships:UPDATE','memberships:DELETE',
    'clients:SELECT','clients:INSERT','clients:UPDATE','clients:DELETE',
    'projects:SELECT','projects:INSERT','projects:UPDATE','projects:DELETE',
    'profiles:SELECT','profiles:INSERT','profiles:UPDATE','profiles:DELETE',
    'project_phases:SELECT','project_phases:INSERT','project_phases:UPDATE','project_phases:DELETE',
    'project_tasks:SELECT','project_tasks:INSERT','project_tasks:UPDATE','project_tasks:DELETE'
  ];
  t text; r text; p text; owner_name name; key_value text;
begin
  foreach t in array app_tables loop
    if to_regclass(format('public.%I', t)) is not null then
      insert into public.r1_table_manifest values (t);
    end if;
  end loop;

  -- The owner guard is checked for every target before any target is changed.
  for t, owner_name in
    select m.table_name, c.relowner::regrole
    from public.r1_table_manifest m
    join pg_catalog.pg_class c on c.relname = m.table_name
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
  loop
    if owner_name is distinct from current_user::name then
      raise exception 'Unsupported owner for R1 target: public.% owner=%', t, owner_name;
    end if;
  end loop;

  insert into public.r1_acl_baseline
  select 'public', m.table_name, r, p,
    has_table_privilege(r, format('public.%I',m.table_name),p),
    has_table_privilege(r, format('public.%I',m.table_name),p || ' WITH GRANT OPTION')
  from public.r1_table_manifest m, unnest(roles) r, unnest(privileges) p;

  insert into public.r1_manifest_keys
  select format('%s:%s:%s:%s',schema_name,table_name,role_name,privilege_type)
  from public.r1_acl_baseline;

  insert into public.r1_rls_baseline
  select n.nspname,c.relname,c.relrowsecurity,c.relforcerowsecurity
  from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  join public.r1_table_manifest m on m.table_name=c.relname
  where n.nspname='public' and c.relkind in ('r','p');

  insert into public.r1_default_acl_baseline
  select owners.owner_name,'public',r,p,false,
    owners.owner_name=current_user::name,false,owners.owner_name=current_user::name
  from (select distinct c.relowner::regrole::text owner_name
        from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
        join public.r1_table_manifest m on m.table_name=c.relname
        where n.nspname='public') owners,
       unnest(roles) r, unnest(privileges) p;

  -- Capture evidence for actual default grants; supabase_admin is observed but
  -- deliberately unmanaged unless this migration is run by that owner.
  update public.r1_default_acl_baseline b
  set had_grant_option = coalesce((
    select bool_or(a.is_grantable) from pg_catalog.pg_default_acl d
    join pg_catalog.pg_namespace n on n.oid=d.defaclnamespace
    cross join lateral aclexplode(d.defaclacl) a
    join pg_catalog.pg_roles g on g.oid=a.grantee
    where pg_get_userbyid(d.defaclrole)=b.grantor and n.nspname='public'
      and g.rolname=b.role_name and a.privilege_type=b.privilege_type and d.defaclobjtype='r'
  ),false);

  -- Every manifest key must be represented exactly once.
  if (select count(*) from public.r1_acl_baseline) <>
     (select count(*) from public.r1_table_manifest)*4*8 then
    raise exception 'R1 ACL baseline manifest count mismatch';
  end if;

  alter table public.r1_acl_baseline enable row level security;
  alter table public.r1_rls_baseline enable row level security;
  alter table public.r1_default_acl_baseline enable row level security;
  alter table public.r1_table_manifest enable row level security;
  alter table public.r1_manifest_keys enable row level security;
  revoke all on public.r1_acl_baseline,public.r1_rls_baseline,public.r1_default_acl_baseline,
    public.r1_table_manifest,public.r1_manifest_keys from public,anon,authenticated,service_role;

  foreach t in array app_tables loop
    if to_regclass(format('public.%I',t)) is not null then
      execute format('revoke all on table public.%I from public,anon,authenticated,service_role',t);
      if t = any(orphan_tables) then
        execute format('alter table public.%I enable row level security',t);
      end if;
    end if;
  end loop;

  -- Authenticated receives only the versioned application contract.
  foreach key_value in array authenticated_allow loop
    t := split_part(key_value,':',1); p := split_part(key_value,':',2);
    if to_regclass(format('public.%I',t)) is not null then
      execute format('grant %s on table public.%I to authenticated',p,t);
    end if;
  end loop;
  -- Service role receives only the demonstrated fixture/server contract.
  foreach key_value in array service_allow loop
    t := split_part(key_value,':',1); p := split_part(key_value,':',2);
    if to_regclass(format('public.%I',t)) is not null then
      execute format('grant %s on table public.%I to service_role',p,t);
    end if;
  end loop;

  -- Only the current owner is managed. supabase_admin remains evidence and a
  -- residual operational risk; postgres cannot alter its defaults safely.
  for owner_name in select distinct grantor::name from public.r1_default_acl_baseline
    where was_managed loop
    execute format('alter default privileges for role %I in schema public revoke all on tables from public,anon,authenticated,service_role',owner_name);
    update public.r1_default_acl_baseline set was_modified=true
      where grantor=owner_name and was_managed;
  end loop;
end;
$$;

commit;
