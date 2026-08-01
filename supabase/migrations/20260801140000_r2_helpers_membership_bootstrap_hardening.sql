-- R2: hardening of the B18 helper functions and of the memberships bootstrap
-- policy. Implements docs/reconciliation/r2-helpers-membership-bootstrap-spec.md.
--
-- WHY THIS MUST BE ATOMIC
-- -----------------------
-- The bootstrap branch of memberships_insert_owner_admin_or_bootstrap currently
-- relies on NOT org_has_any_membership(organization_id). R2 hardens
-- org_has_any_membership so that a caller who is not a member of the
-- organisation always gets false, which would silently turn that expression
-- into "always true" and let anyone insert a first owner. The helper bodies, the
-- ACL and the policy are therefore replaced inside a single transaction, in the
-- order mandated by the specification, and verified before COMMIT. No other
-- session can observe an intermediate state.
--
-- WHAT IS FIXED
-- -------------
-- 1. row_security is saved on entry and restored on the early return, on the
--    normal return and in an exception handler that re-raises.
-- 2. search_path is pinned to pg_catalog, public.
-- 3. org_has_any_membership and is_client_in_org no longer work as existence
--    oracles: a caller who is not a member of the organisation gets false
--    before any row of the target table is read.
-- 4. is_client_in_org(NULL, org_id) returns false without querying clients.
-- 5. org_is_empty_for_bootstrap is created; it requires an authenticated caller.
-- 6. EXECUTE is revoked from PUBLIC and anon and granted only to authenticated.
--    service_role receives nothing: the specification requires independent
--    evidence and explicit approval for that, and neither exists yet.
--
-- The rollback restores the definitions captured here, not the bodies in this
-- file, so it is valid even when the pre-existing remote bodies differ from the
-- repository history.
begin;

-- ---------------------------------------------------------------------------
-- Baseline captured BEFORE anything is modified.
-- ---------------------------------------------------------------------------
create table public.r2_function_baseline (
  function_key text primary key,
  schema_name text not null,
  function_name text not null,
  identity_arguments text not null,
  existed boolean not null,
  definition text,
  owner_name text,
  is_security_definer boolean,
  proconfig text,
  execute_public boolean,
  execute_anon boolean,
  execute_authenticated boolean,
  execute_service_role boolean
);

create table public.r2_policy_baseline (
  policy_key text primary key,
  schema_name text not null,
  table_name text not null,
  policy_name text not null,
  existed boolean not null,
  permissive text,
  command text,
  roles text,
  using_expression text,
  check_expression text
);

create table public.r2_integrity (
  id integer primary key,
  function_count integer not null,
  policy_count integer not null,
  function_digest text not null,
  policy_digest text not null,
  constraint r2_integrity_single_row check (id = 1)
);

do $r2$
declare
  -- Canonical signatures. Parameter names are kept exactly as they exist
  -- remotely (org_id, and client_id/org_id) because CREATE OR REPLACE FUNCTION
  -- cannot rename an input parameter: doing so aborts with 42P13.
  v_targets text[] := array[
    'public.is_org_member(uuid)',
    'public.is_org_admin(uuid)',
    'public.org_has_any_membership(uuid)',
    'public.is_client_in_org(uuid,uuid)',
    'public.org_is_empty_for_bootstrap(uuid)'
  ];
  -- The four helpers that must already exist. org_is_empty_for_bootstrap is the
  -- one R2 creates, so its absence is recorded rather than fatal.
  v_required text[] := array[
    'public.is_org_member(uuid)',
    'public.is_org_admin(uuid)',
    'public.org_has_any_membership(uuid)',
    'public.is_client_in_org(uuid,uuid)'
  ];
  v_target text;
  v_oid oid;
  v_target_oids oid[] := array[]::oid[];
  v_owner text;
  v_policy record;
  v_unexpected text;
  v_missing text;
begin
  -- 1. Capture every target function.
  foreach v_target in array v_targets loop
    begin
      v_oid := v_target::regprocedure;
    exception when undefined_function or invalid_text_representation then
      v_oid := null;
    end;

    if v_oid is null then
      if v_target = any (v_required) then
        raise exception 'R2 stop criterion: required helper % is missing', v_target;
      end if;
      insert into public.r2_function_baseline (
        function_key, schema_name, function_name, identity_arguments, existed
      ) values (v_target, 'public', split_part(split_part(v_target, '.', 2), '(', 1), 'uuid', false);
    else
      v_target_oids := v_target_oids || v_oid;

      select pg_catalog.pg_get_userbyid(p.proowner) into v_owner
      from pg_catalog.pg_proc p where p.oid = v_oid;

      insert into public.r2_function_baseline (
        function_key, schema_name, function_name, identity_arguments, existed,
        definition, owner_name, is_security_definer, proconfig,
        execute_public, execute_anon, execute_authenticated, execute_service_role
      )
      select v_target, n.nspname, p.proname,
             pg_catalog.pg_get_function_identity_arguments(p.oid),
             true,
             pg_catalog.pg_get_functiondef(p.oid),
             pg_catalog.pg_get_userbyid(p.proowner),
             p.prosecdef,
             coalesce(array_to_string(p.proconfig, ','), ''),
             has_function_privilege('public', p.oid, 'EXECUTE'),
             has_function_privilege('anon', p.oid, 'EXECUTE'),
             has_function_privilege('authenticated', p.oid, 'EXECUTE'),
             has_function_privilege('service_role', p.oid, 'EXECUTE')
      from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
      where p.oid = v_oid;

      -- Stop criterion: an owner R2 cannot act for makes the replacement unsafe.
      if v_owner is distinct from current_user then
        raise exception 'R2 stop criterion: helper % is owned by %, expected %',
          v_target, v_owner, current_user;
      end if;
    end if;
  end loop;

  -- Stop criterion: an unexpected overload of any target name. Compared by oid,
  -- because pg_get_function_identity_arguments includes parameter names.
  select string_agg(format('%s(%s)', p.proname,
           pg_catalog.pg_get_function_identity_arguments(p.oid)), ', ')
    into v_unexpected
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('is_org_member', 'is_org_admin', 'org_has_any_membership',
                      'is_client_in_org', 'org_is_empty_for_bootstrap')
    and not (p.oid = any (v_target_oids));
  if v_unexpected is not null then
    raise exception 'R2 stop criterion: unexpected helper overload(s): %', v_unexpected;
  end if;

  -- 2. Capture every policy on memberships, so the ones R2 does not touch can be
  -- proven intact afterwards.
  for v_policy in
    select p.policyname, p.permissive, p.cmd, p.roles::text as roles, p.qual, p.with_check
    from pg_catalog.pg_policies p
    where p.schemaname = 'public' and p.tablename = 'memberships'
    order by p.policyname
  loop
    insert into public.r2_policy_baseline (
      policy_key, schema_name, table_name, policy_name, existed,
      permissive, command, roles, using_expression, check_expression
    ) values (
      format('public.memberships.%s', v_policy.policyname), 'public', 'memberships',
      v_policy.policyname, true, v_policy.permissive, v_policy.cmd, v_policy.roles,
      v_policy.qual, v_policy.with_check
    );
  end loop;

  -- Stop criterion: a bootstrap policy under an unexpected name would leave two
  -- insert paths behind.
  select string_agg(policyname, ', ') into v_unexpected
  from pg_catalog.pg_policies
  where schemaname = 'public' and tablename = 'memberships' and cmd = 'INSERT'
    and policyname <> 'memberships_insert_owner_admin_or_bootstrap';
  if v_unexpected is not null then
    raise exception 'R2 stop criterion: unknown memberships INSERT policy: %', v_unexpected;
  end if;

  if not exists (
    select 1 from public.r2_policy_baseline
    where policy_name = 'memberships_insert_owner_admin_or_bootstrap'
  ) then
    insert into public.r2_policy_baseline (
      policy_key, schema_name, table_name, policy_name, existed
    ) values (
      'public.memberships.memberships_insert_owner_admin_or_bootstrap',
      'public', 'memberships', 'memberships_insert_owner_admin_or_bootstrap', false
    );
  end if;

  -- 3. Integrity record, independent of the baselines themselves.
  insert into public.r2_integrity (id, function_count, policy_count, function_digest, policy_digest)
  select 1,
    (select count(*) from public.r2_function_baseline),
    (select count(*) from public.r2_policy_baseline),
    (select md5(coalesce(string_agg(
        format('%s|%s|%s|%s|%s|%s|%s|%s|%s|%s', function_key, existed,
               coalesce(definition, ''), coalesce(owner_name, ''),
               coalesce(is_security_definer::text, ''), coalesce(proconfig, ''),
               coalesce(execute_public::text, ''), coalesce(execute_anon::text, ''),
               coalesce(execute_authenticated::text, ''), coalesce(execute_service_role::text, '')),
        E'\n' order by function_key), ''))
     from public.r2_function_baseline),
    (select md5(coalesce(string_agg(
        format('%s|%s|%s|%s|%s|%s|%s', policy_key, existed, coalesce(permissive, ''),
               coalesce(command, ''), coalesce(roles, ''), coalesce(using_expression, ''),
               coalesce(check_expression, '')),
        E'\n' order by policy_key), ''))
     from public.r2_policy_baseline);

  if (select function_count from public.r2_integrity where id = 1) <> array_length(v_targets, 1) then
    raise exception 'R2 function baseline cardinality mismatch';
  end if;

  alter table public.r2_function_baseline enable row level security;
  alter table public.r2_policy_baseline enable row level security;
  alter table public.r2_integrity enable row level security;
  revoke all on table public.r2_function_baseline, public.r2_policy_baseline, public.r2_integrity
    from public, anon, authenticated, service_role;

  select string_agg(function_key, ', ') into v_missing
  from public.r2_function_baseline where existed and definition is null;
  if v_missing is not null then
    raise exception 'R2 failed to capture the definition of %', v_missing;
  end if;
end;
$r2$;

-- ---------------------------------------------------------------------------
-- Step 1 of the atomic order: replace the five helper bodies.
-- ---------------------------------------------------------------------------
create or replace function public.is_org_member(org_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_previous_row_security text := current_setting('row_security');
  v_result boolean;
begin
  perform set_config('row_security', 'off', true);
  begin
    if auth.uid() is null then
      perform set_config('row_security', v_previous_row_security, true);
      return false;
    end if;

    v_result := exists (
      select 1
      from public.memberships as m
      where m.organization_id = is_org_member.org_id
        and m.user_id = auth.uid()
    );

    perform set_config('row_security', v_previous_row_security, true);
    return v_result;
  exception when others then
    perform set_config('row_security', v_previous_row_security, true);
    raise;
  end;
end;
$fn$;

create or replace function public.is_org_admin(org_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_previous_row_security text := current_setting('row_security');
  v_result boolean;
begin
  perform set_config('row_security', 'off', true);
  begin
    if auth.uid() is null then
      perform set_config('row_security', v_previous_row_security, true);
      return false;
    end if;

    v_result := exists (
      select 1
      from public.memberships as m
      where m.organization_id = is_org_admin.org_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    );

    perform set_config('row_security', v_previous_row_security, true);
    return v_result;
  exception when others then
    perform set_config('row_security', v_previous_row_security, true);
    raise;
  end;
end;
$fn$;

-- Not an existence oracle: a caller who is not a member of the organisation is
-- rejected before any membership of that organisation is counted.
create or replace function public.org_has_any_membership(org_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_previous_row_security text := current_setting('row_security');
  v_result boolean;
begin
  perform set_config('row_security', 'off', true);
  begin
    if auth.uid() is null then
      perform set_config('row_security', v_previous_row_security, true);
      return false;
    end if;

    if not exists (
      select 1
      from public.memberships as caller
      where caller.organization_id = org_has_any_membership.org_id
        and caller.user_id = auth.uid()
    ) then
      perform set_config('row_security', v_previous_row_security, true);
      return false;
    end if;

    v_result := exists (
      select 1
      from public.memberships as m
      where m.organization_id = org_has_any_membership.org_id
    );

    perform set_config('row_security', v_previous_row_security, true);
    return v_result;
  exception when others then
    perform set_config('row_security', v_previous_row_security, true);
    raise;
  end;
end;
$fn$;

-- A null client_id returns false without reading public.clients at all, and a
-- caller who is not a member of the organisation cannot probe client existence.
create or replace function public.is_client_in_org(client_id uuid, org_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_previous_row_security text := current_setting('row_security');
  v_result boolean;
begin
  perform set_config('row_security', 'off', true);
  begin
    if is_client_in_org.client_id is null
       or is_client_in_org.org_id is null
       or auth.uid() is null then
      perform set_config('row_security', v_previous_row_security, true);
      return false;
    end if;

    if not exists (
      select 1
      from public.memberships as caller
      where caller.organization_id = is_client_in_org.org_id
        and caller.user_id = auth.uid()
    ) then
      perform set_config('row_security', v_previous_row_security, true);
      return false;
    end if;

    v_result := exists (
      select 1
      from public.clients as c
      where c.id = is_client_in_org.client_id
        and c.organization_id = is_client_in_org.org_id
    );

    perform set_config('row_security', v_previous_row_security, true);
    return v_result;
  exception when others then
    perform set_config('row_security', v_previous_row_security, true);
    raise;
  end;
end;
$fn$;

-- Bootstrap helper. Emptiness of an organisation is only disclosed to an
-- authenticated caller, and EXECUTE is granted to authenticated only.
create or replace function public.org_is_empty_for_bootstrap(org_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_previous_row_security text := current_setting('row_security');
  v_result boolean;
begin
  perform set_config('row_security', 'off', true);
  begin
    if auth.uid() is null or org_is_empty_for_bootstrap.org_id is null then
      perform set_config('row_security', v_previous_row_security, true);
      return false;
    end if;

    v_result := not exists (
      select 1
      from public.memberships as m
      where m.organization_id = org_is_empty_for_bootstrap.org_id
    );

    perform set_config('row_security', v_previous_row_security, true);
    return v_result;
  exception when others then
    perform set_config('row_security', v_previous_row_security, true);
    raise;
  end;
end;
$fn$;

-- ---------------------------------------------------------------------------
-- Step 2 of the atomic order: exact ACL.
-- ---------------------------------------------------------------------------
revoke all on function public.is_org_member(uuid) from public, anon;
revoke all on function public.is_org_admin(uuid) from public, anon;
revoke all on function public.org_has_any_membership(uuid) from public, anon;
revoke all on function public.is_client_in_org(uuid, uuid) from public, anon;
revoke all on function public.org_is_empty_for_bootstrap(uuid) from public, anon;

grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;
grant execute on function public.org_has_any_membership(uuid) to authenticated;
grant execute on function public.is_client_in_org(uuid, uuid) to authenticated;
grant execute on function public.org_is_empty_for_bootstrap(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Steps 3 and 4: replace the bootstrap policy in the same transaction.
-- The owner/admin branch is exactly is_org_admin: no redundant membership check
-- is repeated, because it would neither widen security nor change the result.
-- ---------------------------------------------------------------------------
drop policy if exists memberships_insert_owner_admin_or_bootstrap on public.memberships;
create policy memberships_insert_owner_admin_or_bootstrap
  on public.memberships
  for insert
  to authenticated
  with check (
    public.is_org_admin(memberships.organization_id)
    or (
      memberships.user_id = auth.uid()
      and memberships.role = 'owner'
      and public.org_is_empty_for_bootstrap(memberships.organization_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Step 5: verify signatures, attributes, grants and policies before COMMIT.
-- ---------------------------------------------------------------------------
do $r2v$
declare
  v_targets text[] := array[
    'public.is_org_member(uuid)',
    'public.is_org_admin(uuid)',
    'public.org_has_any_membership(uuid)',
    'public.is_client_in_org(uuid,uuid)',
    'public.org_is_empty_for_bootstrap(uuid)'
  ];
  v_target text;
  v_oid oid;
  v_row record;
  v_policy record;
  v_drift text;
begin
  foreach v_target in array v_targets loop
    v_oid := v_target::regprocedure;

    select p.prosecdef,
           coalesce(array_to_string(p.proconfig, ','), '') as proconfig,
           pg_catalog.pg_get_userbyid(p.proowner) as owner_name,
           l.lanname,
           pg_catalog.pg_get_function_identity_arguments(p.oid) as args,
           pg_catalog.pg_get_functiondef(p.oid) as definition
      into v_row
    from pg_catalog.pg_proc p
    join pg_catalog.pg_language l on l.oid = p.prolang
    where p.oid = v_oid;

    if not v_row.prosecdef then
      raise exception 'R2 verification failed: % is not SECURITY DEFINER', v_target;
    end if;
    if v_row.proconfig <> 'search_path=pg_catalog, public' then
      raise exception 'R2 verification failed: % has search_path %', v_target, v_row.proconfig;
    end if;
    if v_row.owner_name is distinct from current_user then
      raise exception 'R2 verification failed: % is owned by %', v_target, v_row.owner_name;
    end if;
    if v_row.lanname <> 'plpgsql' then
      raise exception 'R2 verification failed: % is %, expected plpgsql', v_target, v_row.lanname;
    end if;
    -- row_security must be restored on the early return, the normal return and
    -- the exception path: three restores plus the declaration and the disable.
    if (length(v_row.definition) - length(replace(v_row.definition, 'v_previous_row_security', ''))) / length('v_previous_row_security') < 4 then
      raise exception 'R2 verification failed: % does not restore row_security on every path', v_target;
    end if;
    if position('exception when others' in v_row.definition) = 0 then
      raise exception 'R2 verification failed: % has no exception handler', v_target;
    end if;

    if has_function_privilege('public', v_oid, 'EXECUTE') then
      raise exception 'R2 verification failed: PUBLIC retains EXECUTE on %', v_target;
    end if;
    if has_function_privilege('anon', v_oid, 'EXECUTE') then
      raise exception 'R2 verification failed: anon retains EXECUTE on %', v_target;
    end if;
    if not has_function_privilege('authenticated', v_oid, 'EXECUTE') then
      raise exception 'R2 verification failed: authenticated lacks EXECUTE on %', v_target;
    end if;
    -- The specification mandates revoking PUBLIC and anon and granting
    -- authenticated. It does not authorise touching service_role, which holds
    -- EXECUTE through the function default ACL of schema public. R2 therefore
    -- asserts that service_role is unchanged rather than absent: granting it
    -- would need independent evidence, and revoking it is out of scope.
    if has_function_privilege('service_role', v_oid, 'EXECUTE')
       is distinct from coalesce(
         (select b.execute_service_role from public.r2_function_baseline b
          where b.function_key = v_target and b.existed),
         has_function_privilege('service_role', v_oid, 'EXECUTE'))
    then
      raise exception 'R2 verification failed: service_role EXECUTE on % changed', v_target;
    end if;
  end loop;

  -- Bootstrap policy is present with the expected shape.
  select p.cmd, p.roles::text as roles, p.qual, p.with_check
    into v_policy
  from pg_catalog.pg_policies p
  where p.schemaname = 'public' and p.tablename = 'memberships'
    and p.policyname = 'memberships_insert_owner_admin_or_bootstrap';
  -- FOUND, not "v_policy is null": a record is only IS NULL when every field is
  -- null, and this policy legitimately has a null qual.
  if not found then
    raise exception 'R2 verification failed: bootstrap policy is missing';
  end if;
  if v_policy.cmd <> 'INSERT' or v_policy.roles <> '{authenticated}' or v_policy.qual is not null
     or v_policy.with_check is null then
    raise exception 'R2 verification failed: bootstrap policy shape is wrong (cmd=%, roles=%)',
      v_policy.cmd, v_policy.roles;
  end if;
  if position('org_is_empty_for_bootstrap' in v_policy.with_check) = 0
     or position('is_org_admin' in v_policy.with_check) = 0 then
    raise exception 'R2 verification failed: bootstrap policy does not use the expected helpers';
  end if;
  if position('org_has_any_membership' in v_policy.with_check) > 0 then
    raise exception 'R2 verification failed: bootstrap policy still relies on org_has_any_membership';
  end if;

  -- Every other memberships policy must be byte-identical to the baseline.
  select string_agg(b.policy_name, ', ') into v_drift
  from public.r2_policy_baseline b
  where b.existed
    and b.policy_name <> 'memberships_insert_owner_admin_or_bootstrap'
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
    raise exception 'R2 verification failed: other memberships policies changed: %', v_drift;
  end if;
end;
$r2v$;

commit;
