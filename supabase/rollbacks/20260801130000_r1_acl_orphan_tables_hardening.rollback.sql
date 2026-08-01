-- Rollback for R1.
--
-- WARNING: this restores the exact pre-R1 state, which means it restores the
-- pre-R1 exposure: PUBLIC and anon regain whatever privileges they held, and
-- tables that had no row level security have it disabled again. Do not run it
-- casually.
--
-- It is fail-closed. Every baseline is re-verified against the independent
-- integrity record before anything is restored, and the restored state is
-- verified against the baseline before the bookkeeping tables are dropped. Any
-- mismatch aborts the transaction with the baselines intact.
begin;

do $$
declare
  v_roles text[] := array['public', 'anon', 'authenticated', 'service_role'];
  v_privileges text[] := array[
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'
  ];
  v_row record;
  v_expected public.r1_integrity;
  v_grantee_sql text;
  v_mismatch text;
begin
  if to_regclass('public.r1_integrity') is null
     or to_regclass('public.r1_table_manifest') is null
     or to_regclass('public.r1_acl_baseline') is null
     or to_regclass('public.r1_rls_baseline') is null
     or to_regclass('public.r1_default_acl_baseline') is null then
    raise exception 'R1 rollback requires all five bookkeeping tables';
  end if;

  select * into v_expected from public.r1_integrity where id = 1;
  if v_expected is null then
    raise exception 'R1 rollback integrity record is missing';
  end if;

  -- 1. Integrity: counts and digests must match the record written by R1.
  if (select count(*) from public.r1_table_manifest) <> v_expected.manifest_count
     or (select count(*) from public.r1_acl_baseline) <> v_expected.acl_count
     or (select count(*) from public.r1_rls_baseline) <> v_expected.rls_count
     or (select count(*) from public.r1_default_acl_baseline) <> v_expected.default_acl_count then
    raise exception 'R1 rollback baseline count mismatch';
  end if;

  if (select md5(coalesce(string_agg(table_name, '|' order by table_name), ''))
        from public.r1_table_manifest) <> v_expected.manifest_digest then
    raise exception 'R1 rollback manifest digest mismatch';
  end if;

  if (select md5(coalesce(string_agg(
        format('%s.%s.%s.%s.%s.%s', schema_name, table_name, role_name, privilege_type,
               had_privilege, had_grant_option),
        '|' order by schema_name, table_name, role_name, privilege_type), ''))
        from public.r1_acl_baseline) <> v_expected.acl_digest then
    raise exception 'R1 rollback ACL baseline digest mismatch';
  end if;

  if (select md5(coalesce(string_agg(
        format('%s.%s.%s.%s', schema_name, table_name, had_row_security, had_force_row_security),
        '|' order by table_name), ''))
        from public.r1_rls_baseline) <> v_expected.rls_digest then
    raise exception 'R1 rollback RLS baseline digest mismatch';
  end if;

  if (select md5(coalesce(string_agg(
        format('%s.%s.%s.%s.%s.%s.%s', grantor, schema_name, grantee, privilege_type,
               had_privilege, had_grant_option, modification_supported),
        '|' order by grantor, schema_name, grantee, privilege_type), ''))
        from public.r1_default_acl_baseline) <> v_expected.default_acl_digest then
    raise exception 'R1 rollback default ACL baseline digest mismatch';
  end if;

  -- 2. Closed allow-list before any dynamic statement is built.
  if exists (
    select 1 from public.r1_acl_baseline
    where not (role_name = any (v_roles)) or not (privilege_type = any (v_privileges))
  ) then
    raise exception 'R1 rollback ACL baseline allow-list violation';
  end if;
  if exists (
    select 1 from public.r1_default_acl_baseline
    where not (grantee = any (v_roles)) or not (privilege_type = any (v_privileges))
  ) then
    raise exception 'R1 rollback default ACL allow-list violation';
  end if;
  if exists (
    select 1 from public.r1_acl_baseline b
    where not exists (select 1 from public.r1_table_manifest m where m.table_name = b.table_name)
  ) or exists (
    select 1 from public.r1_rls_baseline b
    where not exists (select 1 from public.r1_table_manifest m where m.table_name = b.table_name)
  ) then
    raise exception 'R1 rollback baseline references a table outside the manifest';
  end if;

  -- 3. Restore table privileges, including grant options and PUBLIC.
  for v_row in
    select * from public.r1_acl_baseline
    order by schema_name, table_name, role_name, privilege_type
  loop
    v_grantee_sql := case when v_row.role_name = 'public' then 'PUBLIC' else quote_ident(v_row.role_name) end;
    if v_row.had_privilege then
      execute format('grant %s on table %I.%I to %s%s',
        v_row.privilege_type, v_row.schema_name, v_row.table_name, v_grantee_sql,
        case when v_row.had_grant_option then ' with grant option' else '' end);
    else
      execute format('revoke %s on table %I.%I from %s',
        v_row.privilege_type, v_row.schema_name, v_row.table_name, v_grantee_sql);
    end if;
  end loop;

  -- 4. Restore RLS.
  for v_row in select * from public.r1_rls_baseline order by table_name loop
    execute format('alter table %I.%I %s row level security',
      v_row.schema_name, v_row.table_name,
      case when v_row.had_row_security then 'enable' else 'disable' end);
    execute format('alter table %I.%I %s force row level security',
      v_row.schema_name, v_row.table_name,
      case when v_row.had_force_row_security then '' else 'no' end);
  end loop;

  -- 5. Restore default privileges only for grantors R1 actually modified.
  -- Grantors recorded as observed but not manageable (supabase_admin) are never
  -- touched, on the way in or on the way out.
  for v_row in
    select distinct grantor, schema_name from public.r1_default_acl_baseline
    where was_modified and modification_supported order by 1, 2
  loop
    execute format(
      'alter default privileges for role %I in schema %I revoke all on tables from public, anon, authenticated, service_role',
      v_row.grantor, v_row.schema_name);
  end loop;

  for v_row in
    select * from public.r1_default_acl_baseline
    where was_modified and modification_supported and had_privilege
    order by grantor, schema_name, grantee, privilege_type
  loop
    v_grantee_sql := case when v_row.grantee = 'public' then 'PUBLIC' else quote_ident(v_row.grantee) end;
    execute format('alter default privileges for role %I in schema %I grant %s on tables to %s%s',
      v_row.grantor, v_row.schema_name, v_row.privilege_type, v_grantee_sql,
      case when v_row.had_grant_option then ' with grant option' else '' end);
  end loop;

  -- 6. Verify the restored state against the baseline before dropping anything.
  select format('%s.%s %s %s', b.schema_name, b.table_name, b.role_name, b.privilege_type)
    into v_mismatch
  from public.r1_acl_baseline b
  where has_table_privilege(b.role_name, format('%I.%I', b.schema_name, b.table_name), b.privilege_type)
        is distinct from b.had_privilege
     or has_table_privilege(b.role_name, format('%I.%I', b.schema_name, b.table_name),
                            b.privilege_type || ' WITH GRANT OPTION')
        is distinct from b.had_grant_option
  limit 1;
  if v_mismatch is not null then
    raise exception 'R1 rollback table privilege verification failed at %', v_mismatch;
  end if;

  select b.table_name into v_mismatch
  from public.r1_rls_baseline b
  join pg_catalog.pg_class c on c.relname = b.table_name and c.relkind in ('r', 'p')
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace and n.nspname = b.schema_name
  where c.relrowsecurity is distinct from b.had_row_security
     or c.relforcerowsecurity is distinct from b.had_force_row_security
  limit 1;
  if v_mismatch is not null then
    raise exception 'R1 rollback RLS verification failed at %', v_mismatch;
  end if;

  select format('%s %s %s', b.grantor, b.grantee, b.privilege_type) into v_mismatch
  from public.r1_default_acl_baseline b
  where b.was_modified
    and b.had_privilege is distinct from exists (
      select 1 from pg_catalog.pg_default_acl d
      join pg_catalog.pg_namespace n on n.oid = d.defaclnamespace
      cross join lateral aclexplode(d.defaclacl) a
      where n.nspname = b.schema_name
        and d.defaclobjtype = 'r'
        and pg_catalog.pg_get_userbyid(d.defaclrole) = b.grantor
        and case when a.grantee = 0 then 'public' else pg_catalog.pg_get_userbyid(a.grantee) end = b.grantee
        and a.privilege_type = b.privilege_type
    )
  limit 1;
  if v_mismatch is not null then
    raise exception 'R1 rollback default privilege verification failed at %', v_mismatch;
  end if;

  raise notice 'R1 rollback complete: pre-R1 exposure has been restored by design';

  drop table public.r1_integrity;
  drop table public.r1_default_acl_baseline;
  drop table public.r1_rls_baseline;
  drop table public.r1_acl_baseline;
  drop table public.r1_table_manifest;
end;
$$;

commit;
