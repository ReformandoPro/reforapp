-- Rollback for R2.
--
-- WARNING: this restores the definitions captured by R2 before it ran, which
-- means it restores the pre-R2 behaviour: whatever row_security handling those
-- bodies had, PUBLIC/anon EXECUTE as they were, and the previous bootstrap
-- policy. If the captured bodies were the leaky ones, the leak comes back. Do
-- not run it casually.
--
-- It replays the captured definitions, never the bodies of the R2 migration, so
-- it is valid even when the pre-existing remote bodies differed from the
-- repository history. It is fail-closed: the baselines are re-verified against
-- the independent integrity record before anything is restored, and the
-- restored state is verified before the bookkeeping tables are dropped.
begin;

do $r2rb$
declare
  v_expected public.r2_integrity;
  v_row record;
  v_policy record;
  v_roles text;
  v_sql text;
  v_drift text;
  v_current text;
begin
  if to_regclass('public.r2_integrity') is null
     or to_regclass('public.r2_function_baseline') is null
     or to_regclass('public.r2_policy_baseline') is null then
    raise exception 'R2 rollback requires all three bookkeeping tables';
  end if;

  select * into v_expected from public.r2_integrity where id = 1;
  if not found then
    raise exception 'R2 rollback integrity record is missing';
  end if;

  -- 1. Integrity guards.
  if (select count(*) from public.r2_function_baseline) <> v_expected.function_count
     or (select count(*) from public.r2_policy_baseline) <> v_expected.policy_count then
    raise exception 'R2 rollback baseline count mismatch';
  end if;

  if (select md5(coalesce(string_agg(
        format('%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s', function_key, existed,
               coalesce(definition, ''), coalesce(owner_name, ''),
               coalesce(is_security_definer::text, ''), coalesce(proconfig, ''),
               coalesce(execute_public::text, ''), coalesce(execute_anon::text, ''),
               coalesce(execute_authenticated::text, ''), coalesce(execute_service_role::text, ''),
               coalesce(acl_literal, ''),
               coalesce(direct_public::text, ''), coalesce(direct_public_grant_option::text, ''),
               coalesce(direct_anon::text, ''), coalesce(direct_anon_grant_option::text, ''),
               coalesce(direct_authenticated::text, ''), coalesce(direct_authenticated_grant_option::text, ''),
               coalesce(direct_service_role::text, ''), coalesce(direct_service_role_grant_option::text, ''),
               coalesce(execute_service_role_grant_option::text, '')),
        E'\n' order by function_key), ''))
      from public.r2_function_baseline) <> v_expected.function_digest then
    raise exception 'R2 rollback function baseline digest mismatch';
  end if;

  if (select md5(coalesce(string_agg(
        format('%s|%s|%s|%s|%s|%s|%s', policy_key, existed, coalesce(permissive, ''),
               coalesce(command, ''), coalesce(roles, ''), coalesce(using_expression, ''),
               coalesce(check_expression, '')),
        E'\n' order by policy_key), ''))
      from public.r2_policy_baseline) <> v_expected.policy_digest then
    raise exception 'R2 rollback policy baseline digest mismatch';
  end if;

  if exists (select 1 from public.r2_function_baseline where existed and definition is null) then
    raise exception 'R2 rollback baseline has an existing function without a captured definition';
  end if;

  -- 2. Drop the bootstrap policy first. R2's policy references
  -- org_is_empty_for_bootstrap, so a function R2 created cannot be dropped while
  -- that policy still depends on it.
  drop policy if exists memberships_insert_owner_admin_or_bootstrap on public.memberships;

  -- 3. Restore every captured function, or drop the ones R2 created.
  for v_row in select * from public.r2_function_baseline order by function_key loop
    if v_row.existed then
      execute v_row.definition;
      -- The literal ACL is restored from the DIRECT grants captured per grantee,
      -- not from effective access: a role whose access came only through PUBLIC
      -- must not end up with a grant of its own. The four cases are covered —
      -- only-through-PUBLIC, direct grant, direct grant WITH GRANT OPTION, and no
      -- access at all — because each grantee is re-granted if and only if it held
      -- a direct grant, with its own grant option.
      execute format('revoke all on function %s from public, anon, authenticated, service_role', v_row.function_key);
      if v_row.direct_public then
        execute format('grant execute on function %s to public%s', v_row.function_key,
          case when v_row.direct_public_grant_option then ' with grant option' else '' end);
      end if;
      if v_row.direct_anon then
        execute format('grant execute on function %s to anon%s', v_row.function_key,
          case when v_row.direct_anon_grant_option then ' with grant option' else '' end);
      end if;
      if v_row.direct_authenticated then
        execute format('grant execute on function %s to authenticated%s', v_row.function_key,
          case when v_row.direct_authenticated_grant_option then ' with grant option' else '' end);
      end if;
      if v_row.direct_service_role then
        execute format('grant execute on function %s to service_role%s', v_row.function_key,
          case when v_row.direct_service_role_grant_option then ' with grant option' else '' end);
      end if;
    else
      execute format('drop function if exists %s', v_row.function_key);
    end if;
  end loop;

  -- 4. Re-create the bootstrap policy exactly as captured, or leave it absent.
  select * into v_policy
  from public.r2_policy_baseline
  where policy_name = 'memberships_insert_owner_admin_or_bootstrap';
  -- FOUND, not "v_policy is not null": a record is only IS NOT NULL when every
  -- field is non-null, and an INSERT policy has a null using_expression.
  if found and v_policy.existed then
    -- roles is stored as the text form of a name[] such as {authenticated}
    select string_agg(case when r = 'public' then 'PUBLIC' else quote_ident(r) end, ', ')
      into v_roles
    from unnest(string_to_array(btrim(v_policy.roles, '{}'), ',')) as t(r);

    v_sql := format('create policy %I on %I.%I as %s for %s to %s',
      v_policy.policy_name, v_policy.schema_name, v_policy.table_name,
      case when upper(v_policy.permissive) = 'RESTRICTIVE' then 'restrictive' else 'permissive' end,
      lower(v_policy.command), coalesce(v_roles, 'PUBLIC'));
    if v_policy.using_expression is not null then
      v_sql := v_sql || format(' using (%s)', v_policy.using_expression);
    end if;
    if v_policy.check_expression is not null then
      v_sql := v_sql || format(' with check (%s)', v_policy.check_expression);
    end if;
    execute v_sql;
  end if;

  -- 5. Verify the restored state against the baseline before dropping anything.
  for v_row in select * from public.r2_function_baseline order by function_key loop
    if v_row.existed then
      select pg_catalog.pg_get_functiondef(v_row.function_key::regprocedure) into v_current;
      if v_current is distinct from v_row.definition then
        raise exception 'R2 rollback definition verification failed for %', v_row.function_key;
      end if;
      if has_function_privilege('public', v_row.function_key::regprocedure, 'EXECUTE') is distinct from v_row.execute_public
         or has_function_privilege('anon', v_row.function_key::regprocedure, 'EXECUTE') is distinct from v_row.execute_anon
         or has_function_privilege('authenticated', v_row.function_key::regprocedure, 'EXECUTE') is distinct from v_row.execute_authenticated
         or has_function_privilege('service_role', v_row.function_key::regprocedure, 'EXECUTE') is distinct from v_row.execute_service_role
         or has_function_privilege('service_role', v_row.function_key::regprocedure, 'EXECUTE WITH GRANT OPTION')
            is distinct from v_row.execute_service_role_grant_option then
        raise exception 'R2 rollback EXECUTE verification failed for %', v_row.function_key;
      end if;

      -- Literal ACL: compare the restored grant set against the captured one,
      -- as a set of (grantee, privilege, grantable). A NULL proacl materialises
      -- into its default when granted, so the sets must match even though the
      -- stored text may order entries differently.
      if exists (
        select 1
        from (
          select case when a.grantee = 0 then 'public'
                      else pg_catalog.pg_get_userbyid(a.grantee) end as grantee_name,
                 a.privilege_type, a.is_grantable
          from pg_catalog.pg_proc p
          cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
          where p.oid = v_row.function_key::regprocedure
        ) current_acl
        full join (
          select case when a.grantee = 0 then 'public'
                      else pg_catalog.pg_get_userbyid(a.grantee) end as grantee_name,
                 a.privilege_type, a.is_grantable
          from aclexplode(v_row.acl_literal::aclitem[]) a
        ) captured_acl
          on current_acl.grantee_name = captured_acl.grantee_name
         and current_acl.privilege_type = captured_acl.privilege_type
         and current_acl.is_grantable = captured_acl.is_grantable
        where current_acl.grantee_name is null or captured_acl.grantee_name is null
      ) then
        raise exception 'R2 rollback literal ACL verification failed for %', v_row.function_key;
      end if;
    else
      if to_regprocedure(v_row.function_key) is not null then
        raise exception 'R2 rollback failed to drop %', v_row.function_key;
      end if;
    end if;
  end loop;

  select string_agg(b.policy_name, ', ') into v_drift
  from public.r2_policy_baseline b
  where b.existed
    and not exists (
      select 1 from pg_catalog.pg_policies p
      where p.schemaname = b.schema_name and p.tablename = b.table_name
        and p.policyname = b.policy_name
        and p.permissive = b.permissive and p.cmd = b.command
        and p.roles::text = b.roles
        and coalesce(p.qual, '') = coalesce(b.using_expression, '')
        and coalesce(p.with_check, '') = coalesce(b.check_expression, '')
    );
  if v_drift is not null then
    raise exception 'R2 rollback policy verification failed for %', v_drift;
  end if;

  if exists (
    select 1 from pg_catalog.pg_policies p
    where p.schemaname = 'public' and p.tablename = 'memberships'
      and not exists (
        select 1 from public.r2_policy_baseline b
        where b.existed and b.policy_name = p.policyname
      )
  ) then
    raise exception 'R2 rollback left an unexpected memberships policy behind';
  end if;

  raise notice 'R2 rollback complete: pre-R2 helper bodies, grants and bootstrap policy have been restored by design';

  drop table public.r2_integrity;
  drop table public.r2_policy_baseline;
  drop table public.r2_function_baseline;
end;
$r2rb$;

commit;
