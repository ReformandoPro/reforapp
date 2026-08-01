-- R1: ACL hardening and deny-all for unmanaged (orphan) tables.
--
-- SCOPE AND DELIBERATE LIMITATION
-- --------------------------------
-- R1 removes every privilege held by PUBLIC and anon on every table of the
-- public schema, revokes TRUNCATE and MAINTAIN from authenticated, narrows
-- service_role to a contract derived from scripts/ci, and enables row level
-- security on tables that had none (which denies non-owner DML, but not
-- TRUNCATE - hence the explicit TRUNCATE revocation).
--
-- R1 does NOT establish a minimal ACL for authenticated. src/ uses the
-- authenticated client on 20 tables with SELECT/INSERT/UPDATE/DELETE, so a
-- closed allow-list cannot be derived safely yet; revoking would break the
-- deployed application. The existing authenticated DML is therefore preserved
-- on purpose. This migration must not be described as complete authenticated
-- hardening.
--
-- Default privileges are narrowed only for grantors this role can alter.
-- supabase_admin default privileges are recorded as observed, not manageable
-- and not modified: postgres cannot alter them, so tables created later by
-- supabase_admin will still grant DML to anon. That residual risk is captured
-- in public.r1_default_acl_baseline and must be closed by an authorised
-- operator outside R1.
begin;

create table public.r1_table_manifest (
  table_name text primary key
);

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
  grantee text not null,
  privilege_type text not null,
  had_privilege boolean not null,
  had_grant_option boolean not null,
  modification_supported boolean not null,
  was_modified boolean not null,
  primary key (grantor, schema_name, grantee, privilege_type)
);

-- Independent integrity record: counts plus digests over the immutable columns
-- of every baseline. The rollback recomputes them, so a row that is deleted,
-- added or edited in any baseline - or in the manifest - is detected even when
-- the tampering is internally consistent.
create table public.r1_integrity (
  id integer primary key,
  manifest_count integer not null,
  acl_count integer not null,
  rls_count integer not null,
  default_acl_count integer not null,
  manifest_digest text not null,
  acl_digest text not null,
  rls_digest text not null,
  default_acl_digest text not null,
  constraint r1_integrity_single_row check (id = 1)
);

do $$
declare
  v_roles text[] := array['public', 'anon', 'authenticated', 'service_role'];
  v_privileges text[] := array[
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'
  ];
  -- Own bookkeeping tables are never targets.
  v_self text[] := array[
    'r1_table_manifest', 'r1_acl_baseline', 'r1_rls_baseline',
    'r1_default_acl_baseline', 'r1_integrity'
  ];
  -- service_role contract, derived from the only repository consumers of the
  -- service key: scripts/ci/projects-authenticated-read.mjs,
  -- scripts/ci/projects-authenticated-write.mjs and
  -- scripts/ci/project-tasks-authenticated-write.mjs. They insert, upsert and
  -- select on these six tables. DELETE is included because verifiable
  -- ephemeral fixture teardown requires it and is exercised by
  -- scripts/ci/r1-acl-orphan-tables-smoke.mjs --authorized.
  -- TRUNCATE and MAINTAIN are deliberately excluded: no consumer needs them.
  v_service_tables text[] := array[
    'organizations', 'memberships', 'clients', 'projects', 'project_phases', 'project_tasks'
  ];
  v_service_privileges text[] := array['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
  v_table text;
  v_privilege text;
  v_owner text;
  v_grantor text;
begin
  -- 1. Manifest: every existing table of the public schema, discovered from the
  -- catalog rather than hardcoded, so no exposed table can be omitted.
  insert into public.r1_table_manifest (table_name)
  select c.relname
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
    and not (c.relname = any (v_self));

  if not exists (select 1 from public.r1_table_manifest) then
    raise exception 'R1 found no target tables in schema public';
  end if;

  -- 2. Owner guard for every target, before any privilege or RLS change.
  for v_table, v_owner in
    select m.table_name, pg_catalog.pg_get_userbyid(c.relowner)
    from public.r1_table_manifest m
    join pg_catalog.pg_class c on c.relname = m.table_name
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
    where c.relkind in ('r', 'p')
    order by m.table_name
  loop
    if v_owner is distinct from current_user then
      raise exception 'Unsupported owner for R1 target: public.% owner=%', v_table, v_owner;
    end if;
  end loop;

  -- 3. Table ACL baseline, including the PUBLIC pseudo-role.
  insert into public.r1_acl_baseline
    (schema_name, table_name, role_name, privilege_type, had_privilege, had_grant_option)
  select 'public',
         m.table_name,
         rl.role_name,
         pv.privilege_type,
         has_table_privilege(rl.role_name, format('public.%I', m.table_name), pv.privilege_type),
         has_table_privilege(rl.role_name, format('public.%I', m.table_name),
                             pv.privilege_type || ' WITH GRANT OPTION')
  from public.r1_table_manifest m
  cross join unnest(v_roles) as rl(role_name)
  cross join unnest(v_privileges) as pv(privilege_type);

  -- 4. RLS baseline.
  insert into public.r1_rls_baseline
    (schema_name, table_name, had_row_security, had_force_row_security)
  select n.nspname, c.relname, c.relrowsecurity, c.relforcerowsecurity
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  join public.r1_table_manifest m on m.table_name = c.relname
  where n.nspname = 'public' and c.relkind in ('r', 'p');

  -- 5. Default ACL baseline: one row per (grantor, grantee, privilege) with the
  -- real presence of the grant, whether this role may alter that grantor, and
  -- whether R1 ended up modifying it.
  insert into public.r1_default_acl_baseline
    (grantor, schema_name, grantee, privilege_type, had_privilege, had_grant_option,
     modification_supported, was_modified)
  select g.grantor,
         'public',
         rl.role_name,
         pv.privilege_type,
         coalesce(present.is_present, false),
         coalesce(present.is_grantable, false),
         g.grantor = current_user,
         false
  from (
    select distinct pg_catalog.pg_get_userbyid(d.defaclrole) as grantor
    from pg_catalog.pg_default_acl d
    join pg_catalog.pg_namespace n on n.oid = d.defaclnamespace
    where n.nspname = 'public' and d.defaclobjtype = 'r'
  ) g
  cross join unnest(v_roles) as rl(role_name)
  cross join unnest(v_privileges) as pv(privilege_type)
  left join lateral (
    select true as is_present, bool_or(a.is_grantable) as is_grantable
    from pg_catalog.pg_default_acl d
    join pg_catalog.pg_namespace n on n.oid = d.defaclnamespace
    cross join lateral aclexplode(d.defaclacl) a
    where n.nspname = 'public'
      and d.defaclobjtype = 'r'
      and pg_catalog.pg_get_userbyid(d.defaclrole) = g.grantor
      and case when a.grantee = 0 then 'public' else pg_catalog.pg_get_userbyid(a.grantee) end = rl.role_name
      and a.privilege_type = pv.privilege_type
    group by 1
  ) present on true;

  -- 6. Integrity record over the immutable columns.
  insert into public.r1_integrity (
    id, manifest_count, acl_count, rls_count, default_acl_count,
    manifest_digest, acl_digest, rls_digest, default_acl_digest
  )
  select 1,
    (select count(*) from public.r1_table_manifest),
    (select count(*) from public.r1_acl_baseline),
    (select count(*) from public.r1_rls_baseline),
    (select count(*) from public.r1_default_acl_baseline),
    (select md5(coalesce(string_agg(table_name, '|' order by table_name), ''))
       from public.r1_table_manifest),
    (select md5(coalesce(string_agg(
        format('%s.%s.%s.%s.%s.%s', schema_name, table_name, role_name, privilege_type,
               had_privilege, had_grant_option),
        '|' order by schema_name, table_name, role_name, privilege_type), ''))
       from public.r1_acl_baseline),
    (select md5(coalesce(string_agg(
        format('%s.%s.%s.%s', schema_name, table_name, had_row_security, had_force_row_security),
        '|' order by table_name), ''))
       from public.r1_rls_baseline),
    (select md5(coalesce(string_agg(
        format('%s.%s.%s.%s.%s.%s.%s', grantor, schema_name, grantee, privilege_type,
               had_privilege, had_grant_option, modification_supported),
        '|' order by grantor, schema_name, grantee, privilege_type), ''))
       from public.r1_default_acl_baseline);

  if (select acl_count from public.r1_integrity where id = 1) <>
     (select count(*) from public.r1_table_manifest) * array_length(v_roles, 1) * array_length(v_privileges, 1) then
    raise exception 'R1 ACL baseline cardinality mismatch';
  end if;

  -- 7. Protect the bookkeeping tables.
  alter table public.r1_table_manifest enable row level security;
  alter table public.r1_acl_baseline enable row level security;
  alter table public.r1_rls_baseline enable row level security;
  alter table public.r1_default_acl_baseline enable row level security;
  alter table public.r1_integrity enable row level security;
  revoke all on table
    public.r1_table_manifest, public.r1_acl_baseline, public.r1_rls_baseline,
    public.r1_default_acl_baseline, public.r1_integrity
    from public, anon, authenticated, service_role;

  -- 8. Table-level hardening.
  for v_table in select table_name from public.r1_table_manifest order by table_name loop
    -- PUBLIC and anon lose everything.
    execute format('revoke all on table public.%I from public, anon', v_table);
    -- authenticated keeps its existing DML on purpose (see header) but must not
    -- be able to truncate or run maintenance operations.
    execute format('revoke truncate, maintain on table public.%I from authenticated', v_table);
    -- service_role is reduced to the derived contract.
    execute format('revoke all on table public.%I from service_role', v_table);
  end loop;

  foreach v_table in array v_service_tables loop
    if exists (select 1 from public.r1_table_manifest where table_name = v_table) then
      foreach v_privilege in array v_service_privileges loop
        execute format('grant %s on table public.%I to service_role', v_privilege, v_table);
      end loop;
    end if;
  end loop;

  -- 9. Tables that had no row level security are switched to deny-all. With no
  -- policy, non-owner SELECT returns zero rows and non-owner writes are
  -- rejected. Derived from the baseline, so it is not limited to a hardcoded
  -- list of orphan tables.
  for v_table in
    select b.table_name from public.r1_rls_baseline b
    where not b.had_row_security order by b.table_name
  loop
    execute format('alter table public.%I enable row level security', v_table);
  end loop;

  -- 10. Default privileges: only grantors this role may alter.
  for v_grantor in
    select distinct grantor from public.r1_default_acl_baseline
    where modification_supported order by 1
  loop
    execute format(
      'alter default privileges for role %I in schema public revoke all on tables from public, anon, authenticated, service_role',
      v_grantor
    );
    update public.r1_default_acl_baseline
      set was_modified = true
      where grantor = v_grantor and modification_supported;
  end loop;
end;
$$;

commit;
