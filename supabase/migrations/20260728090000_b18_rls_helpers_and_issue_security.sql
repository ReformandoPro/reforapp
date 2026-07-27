begin;

-- B18 deliberately does not grant table privileges. The current application
-- uses the authenticated SSR/browser client, but the required ACL contract
-- must be established from a rebuilt baseline before grants are added.

-- Keep the existing public signatures while making the SECURITY DEFINER
-- helpers safe for use by RLS policies. row_security is restored on every
-- normal and exceptional path; current_setting() always has a value for this
-- GUC in PostgreSQL, so restoration is deterministic.
do $$
declare
  helper_name text;
  helper_owner text;
begin
  foreach helper_name in array array[
    'public.is_org_member(uuid)',
    'public.is_org_admin(uuid)',
    'public.org_has_any_membership(uuid)',
    'public.is_client_in_org(uuid,uuid)'
  ] loop
    select pg_get_userbyid(p.proowner)
      into helper_owner
    from pg_proc as p
    where p.oid = helper_name::regprocedure;

    if helper_owner is distinct from current_user then
      raise exception 'B18 helper owner mismatch for %: expected %, got %',
        helper_name, current_user, helper_owner;
    end if;
  end loop;
end;
$$;

create or replace function public.is_org_member(org_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  previous_row_security text := current_setting('row_security');
  result boolean;
begin
  perform set_config('row_security', 'off', true);
  begin
    if auth.uid() is null then
      perform set_config('row_security', previous_row_security, true);
      return false;
    end if;

    result := exists (
      select 1
      from public.memberships as m
      where m.organization_id = is_org_member.org_id
        and m.user_id = auth.uid()
    );
    perform set_config('row_security', previous_row_security, true);
    return result;
  exception when others then
    perform set_config('row_security', previous_row_security, true);
    raise;
  end;
end;
$$;

create or replace function public.is_org_admin(org_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  previous_row_security text := current_setting('row_security');
  result boolean;
begin
  perform set_config('row_security', 'off', true);
  begin
    if auth.uid() is null then
      perform set_config('row_security', previous_row_security, true);
      return false;
    end if;

    result := exists (
      select 1
      from public.memberships as m
      where m.organization_id = is_org_admin.org_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    );
    perform set_config('row_security', previous_row_security, true);
    return result;
  exception when others then
    perform set_config('row_security', previous_row_security, true);
    raise;
  end;
end;
$$;

create or replace function public.org_has_any_membership(org_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  previous_row_security text := current_setting('row_security');
  result boolean;
begin
  perform set_config('row_security', 'off', true);
  begin
    -- A non-member must not be able to use this RPC as an organization
    -- existence oracle. Bootstrap uses the separate definer-only helper below.
    if auth.uid() is null then
      perform set_config('row_security', previous_row_security, true);
      return false;
    end if;
    if not exists (
      select 1 from public.memberships as caller_membership
      where caller_membership.user_id = auth.uid()
        and caller_membership.organization_id = org_has_any_membership.org_id
    ) then
      perform set_config('row_security', previous_row_security, true);
      return false;
    end if;

    result := exists (
      select 1
      from public.memberships as m
      where m.organization_id = org_has_any_membership.org_id
    );
    perform set_config('row_security', previous_row_security, true);
    return result;
  exception when others then
    perform set_config('row_security', previous_row_security, true);
    raise;
  end;
end;
$$;

create or replace function public.org_is_empty_for_bootstrap(org_id uuid)
returns boolean
language sql
security definer
set search_path = pg_catalog, public
as $$
  select not exists (select 1 from public.memberships where organization_id = $1);
$$;

revoke all on function public.org_is_empty_for_bootstrap(uuid) from public;
grant execute on function public.org_is_empty_for_bootstrap(uuid) to authenticated;

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

create or replace function public.is_client_in_org(client_id uuid, org_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  previous_row_security text := current_setting('row_security');
  result boolean;
begin
  perform set_config('row_security', 'off', true);
  begin
    if auth.uid() is null or not exists (
      select 1 from public.memberships as caller_membership
      where caller_membership.user_id = auth.uid()
        and caller_membership.organization_id = is_client_in_org.org_id
    ) then
      perform set_config('row_security', previous_row_security, true);
      return false;
    end if;

    result := exists (
      select 1
      from public.clients as c
      where c.id = is_client_in_org.client_id
        and c.organization_id = is_client_in_org.org_id
    );
    perform set_config('row_security', previous_row_security, true);
    return result;
  exception when others then
    perform set_config('row_security', previous_row_security, true);
    raise;
  end;
end;
$$;

-- Helpers are only called by authenticated RLS policies. Direct invocation by
-- PUBLIC is intentionally disabled; no service_role grant is needed here.
revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.is_org_admin(uuid) from public;
revoke all on function public.org_has_any_membership(uuid) from public;
revoke all on function public.is_client_in_org(uuid, uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;
grant execute on function public.org_has_any_membership(uuid) to authenticated;
grant execute on function public.is_client_in_org(uuid, uuid) to authenticated;

alter table public.project_task_issues enable row level security;

-- A differently named policy could silently widen access. Refuse that state
-- rather than deleting an unknown policy or combining it with B18 policies.
do $$
declare
  unexpected_policy text;
begin
  select policyname
    into unexpected_policy
  from pg_policies
  where schemaname = 'public'
    and tablename = 'project_task_issues'
    and policyname not in (
      'project_task_issues_select_member',
      'project_task_issues_insert_member'
    )
  limit 1;

  if unexpected_policy is not null then
    raise exception 'B18 refuses unexpected project_task_issues policy: %', unexpected_policy;
  end if;
end;
$$;

drop policy if exists project_task_issues_select_member on public.project_task_issues;
create policy project_task_issues_select_member
  on public.project_task_issues
  for select
  to authenticated
  using (
    public.is_org_member(project_task_issues.organization_id)
    and exists (
      select 1
      from public.projects as p
      where p.id = project_task_issues.project_id
        and p.organization_id = project_task_issues.organization_id
    )
    and exists (
      select 1
      from public.project_tasks as t
      where t.id = project_task_issues.task_id
        and t.project_id = project_task_issues.project_id
        and t.organization_id = project_task_issues.organization_id
    )
  );

drop policy if exists project_task_issues_insert_member on public.project_task_issues;
create policy project_task_issues_insert_member
  on public.project_task_issues
  for insert
  to authenticated
  with check (
    project_task_issues.reporter_user_id = auth.uid()
    and public.is_org_member(project_task_issues.organization_id)
    and exists (
      select 1
      from public.projects as p
      where p.id = project_task_issues.project_id
        and p.organization_id = project_task_issues.organization_id
    )
    and exists (
      select 1
      from public.project_tasks as t
      where t.id = project_task_issues.task_id
        and t.project_id = project_task_issues.project_id
        and t.organization_id = project_task_issues.organization_id
    )
  );

-- No table grants are changed in B18. The migration must be preceded by a
-- separately reviewed ACL contract once the rebuilt baseline is available.
commit;
