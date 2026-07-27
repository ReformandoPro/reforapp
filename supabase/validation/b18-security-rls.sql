\set ON_ERROR_STOP on

-- Run with psql against a disposable Supabase/PostgreSQL database.
-- This script is executable evidence, not a claim that it has run here.

select current_database(), current_user, version();

select tablename, rowsecurity, forcerowsecurity
from pg_tables
where schemaname = 'public' and tablename = 'project_task_issues';

select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'project_task_issues'
order by policyname;

select has_table_privilege('anon', 'public.project_task_issues', 'SELECT') as anon_select,
       has_table_privilege('anon', 'public.project_task_issues', 'INSERT') as anon_insert,
       has_table_privilege('authenticated', 'public.project_task_issues', 'SELECT') as authenticated_select,
       has_table_privilege('authenticated', 'public.project_task_issues', 'INSERT') as authenticated_insert;

select p.oid::regprocedure as signature,
       pg_get_userbyid(p.proowner) as owner,
       p.prosecdef as security_definer,
       p.proconfig,
       p.proacl
from pg_proc as p
join pg_namespace as n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_org_member', 'is_org_admin', 'org_has_any_membership', 'is_client_in_org')
order by signature::text;

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
      raise exception 'B18 validation helper owner mismatch for %', helper_name;
    end if;
  end loop;
end;
$$;

-- Deterministic synthetic fixtures. The script is run as the disposable
-- postgres owner before switching to client roles.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'alpha-owner@test.invalid'),
  ('00000000-0000-0000-0000-000000000002', 'alpha-member@test.invalid'),
  ('00000000-0000-0000-0000-000000000003', 'beta-owner@test.invalid'),
  ('00000000-0000-0000-0000-000000000004', 'beta-member@test.invalid'),
  ('00000000-0000-0000-0000-000000000005', 'outsider@test.invalid')
on conflict (id) do nothing;

insert into public.organizations (id, name, slug)
values
  ('10000000-0000-0000-0000-000000000001', 'Alpha', 'b18-alpha'),
  ('10000000-0000-0000-0000-000000000002', 'Beta', 'b18-beta')
on conflict (id) do nothing;

insert into public.memberships (organization_id, user_id, role)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'owner'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'member'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'owner'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'member')
on conflict do nothing;

insert into public.clients (id, organization_id, display_name)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Alpha client'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Beta client')
on conflict (id) do nothing;

insert into public.projects
  (id, organization_id, client_id, name, title, client_name, start_date, status, address, type)
values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Alpha project', 'Alpha project', 'Alpha client', now(), 'in_progress', 'Alpha address', 'reform'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Beta project', 'Beta project', 'Beta client', now(), 'in_progress', 'Beta address', 'reform')
on conflict (id) do nothing;

insert into public.project_tasks
  (id, organization_id, project_id, title, status, priority)
values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Alpha task', 'pending', 'medium'),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'Beta task', 'pending', 'medium')
on conflict (id) do nothing;

insert into public.project_task_issues
  (id, organization_id, project_id, task_id, reporter_user_id, description)
values
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Alpha issue'),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Beta issue')
on conflict (id) do nothing;

commit;

-- Controlled exception path. The temporary auth.uid() replacement is
-- transactional and is rolled back, so it cannot alter the test database.
begin;
create or replace function auth.uid()
returns uuid
language plpgsql
as $$
begin
  raise exception using errcode = 'P0001', message = 'B18 controlled helper fault';
end;
$$;
set local role authenticated;
do $$
declare
  helper_name text;
  before_value text := current_setting('row_security');
  actual_state text;
  actual_message text;
begin
  foreach helper_name in array array[
    'member', 'admin', 'any_membership', 'client'
  ] loop
    begin
      if helper_name = 'member' then
        perform public.is_org_member('10000000-0000-0000-0000-000000000001');
      elsif helper_name = 'admin' then
        perform public.is_org_admin('10000000-0000-0000-0000-000000000001');
      elsif helper_name = 'any_membership' then
        perform public.org_has_any_membership('10000000-0000-0000-0000-000000000001');
      else
        perform public.is_client_in_org('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001');
      end if;
      raise exception 'B18 expected helper exception was not raised';
    exception when others then
      get stacked diagnostics actual_state = returned_sqlstate, actual_message = message_text;
      if actual_message = 'B18 expected helper exception was not raised' then
        raise;
      end if;
      if actual_state <> 'P0001' or actual_message <> 'B18 controlled helper fault' then
        raise exception 'unexpected helper exception: % %', actual_state, actual_message;
      end if;
    end;
    if current_setting('row_security') <> before_value then
      raise exception 'row_security changed after exception in % helper', helper_name;
    end if;
  end loop;
end;
$$;
rollback;

-- Helpers: normal result, false result, early return and repeated calls must
-- preserve the caller's GUC value.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
do $$
declare before_value text := current_setting('row_security');
begin
  if not public.is_org_member('10000000-0000-0000-0000-000000000001') then
    raise exception 'member helper rejected Alpha member';
  end if;
  if current_setting('row_security') <> before_value then
    raise exception 'row_security changed after true helper result';
  end if;
  if public.is_org_member('10000000-0000-0000-0000-000000000002') then
    raise exception 'member helper accepted cross-organization membership';
  end if;
  if current_setting('row_security') <> before_value then
    raise exception 'row_security changed after false helper result';
  end if;
end;
$$;
set local request.jwt.claim.sub = '';
do $$
declare before_value text := current_setting('row_security');
begin
  if public.is_org_member('10000000-0000-0000-0000-000000000001') then
    raise exception 'member helper accepted unauthenticated identity';
  end if;
  if current_setting('row_security') <> before_value then
    raise exception 'row_security changed after early return';
  end if;
end;
$$;
commit;

-- Alpha authenticated RLS cases.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
do $$
declare visible_count integer;
begin
  select count(*) into visible_count from public.project_task_issues;
  if visible_count <> 1 then raise exception 'Alpha SELECT expected 1, got %', visible_count; end if;
  if exists (select 1 from public.project_task_issues where organization_id = '10000000-0000-0000-0000-000000000002') then
    raise exception 'Alpha can read Beta issue';
  end if;
end;
$$;

do $$
begin
  insert into public.project_task_issues
    (organization_id, project_id, task_id, reporter_user_id, description)
  values
    ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Alpha inserted');
exception when others then
  raise exception 'Alpha legitimate INSERT failed: %', sqlerrm;
end;
$$;

do $$
begin
  begin
    insert into public.project_task_issues
      (organization_id, project_id, task_id, reporter_user_id, description)
    values
      ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'fake reporter');
    raise exception 'reporter forgery was accepted';
  exception when others then
    if sqlerrm = 'reporter forgery was accepted' then raise; end if;
  end;
  begin
    insert into public.project_task_issues
      (organization_id, project_id, task_id, reporter_user_id, description)
    values
      ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'cross project');
    raise exception 'cross-project insert was accepted';
  exception when others then
    if sqlerrm = 'cross-project insert was accepted' then raise; end if;
  end;
  begin
    insert into public.project_task_issues
      (organization_id, project_id, task_id, reporter_user_id, description)
    values
      ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'cross task');
    raise exception 'cross-task insert was accepted';
  exception when others then
    if sqlerrm = 'cross-task insert was accepted' then raise; end if;
  end;
end;
$$;
rollback;

-- Beta, outsider, anon, UPDATE and DELETE denial cases.
begin
  set local role authenticated;
  set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000004';
  do $$ declare n integer; begin select count(*) into n from public.project_task_issues; if n <> 1 then raise exception 'Beta SELECT expected 1, got %', n; end if; end $$;
  rollback;

begin
  set local role authenticated;
  set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000005';
  do $$ declare n integer; begin select count(*) into n from public.project_task_issues; if n <> 0 then raise exception 'outsider saw rows'; end if; end $$;
  rollback;

begin
  set local role anon;
  do $$
  begin
    begin
      perform 1 from public.project_task_issues;
      raise exception 'anon SELECT was accepted';
    exception when insufficient_privilege then null; end;
    begin
      insert into public.project_task_issues values (gen_random_uuid(), '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', null, 'anon');
      raise exception 'anon INSERT was accepted';
    exception when insufficient_privilege then null; end;
  end;
  $$;
  rollback;

begin
  set local role authenticated;
  set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
  do $$
  begin
    begin update public.project_task_issues set description = 'x'; raise exception 'UPDATE accepted'; exception when insufficient_privilege then null; end;
    begin delete from public.project_task_issues; raise exception 'DELETE accepted'; exception when insufficient_privilege then null; end;
  end;
  $$;
  rollback;

-- Execute the following assertions only after fixtures exist and the session
-- is configured as the corresponding role with auth.uid() claims.
do $$
begin
  if not exists (
    select 1 from pg_tables
    where schemaname = 'public'
      and tablename = 'project_task_issues'
      and rowsecurity
  ) then
    raise exception 'B18 validation failed: project_task_issues RLS is disabled';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_task_issues'
      and (
        lower(btrim(coalesce(qual, ''))) in ('true', '(true)')
        or lower(btrim(coalesce(with_check, ''))) in ('true', '(true)')
      )
  ) then
    raise exception 'B18 validation failed: permissive project_task_issues policy';
  end if;

  if (select count(*) from pg_policies
      where schemaname = 'public'
        and tablename = 'project_task_issues') <> 2 then
    raise exception 'B18 validation failed: expected exactly two issue policies';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_task_issues'
      and (
        (policyname = 'project_task_issues_select_member'
         and (cmd <> 'SELECT' or roles <> array['authenticated']::name[] or with_check is not null))
        or
        (policyname = 'project_task_issues_insert_member'
         and (cmd <> 'INSERT' or roles <> array['authenticated']::name[] or qual is not null))
        or policyname not in ('project_task_issues_select_member', 'project_task_issues_insert_member')
      )
  ) then
    raise exception 'B18 validation failed: issue policy shape is incorrect';
  end if;

  if has_table_privilege('anon', 'public.project_task_issues', 'SELECT')
     or has_table_privilege('anon', 'public.project_task_issues', 'INSERT')
     or not has_table_privilege('authenticated', 'public.project_task_issues', 'SELECT')
     or not has_table_privilege('authenticated', 'public.project_task_issues', 'INSERT')
     or not has_table_privilege('authenticated', 'public.projects', 'SELECT')
     or not has_table_privilege('authenticated', 'public.project_tasks', 'SELECT')
     or not has_table_privilege('authenticated', 'public.memberships', 'SELECT')
     or has_table_privilege('authenticated', 'public.project_task_issues', 'UPDATE')
     or has_table_privilege('authenticated', 'public.project_task_issues', 'DELETE') then
    raise exception 'B18 validation failed: unexpected issue table privilege';
  end if;
end;
$$;

-- Required fixture assertions:
-- * Alpha member can SELECT/INSERT only Alpha rows with own reporter_user_id.
-- * Alpha member cannot SELECT/INSERT Beta rows or cross-linked project/task rows.
-- * Beta member cannot access Alpha rows.
-- * anon and a user without membership are denied.
-- * UPDATE and DELETE are denied because B18 creates no such policies.
-- * Before and after each helper call, current_setting('row_security') is
--   byte-for-byte identical, including early return and exception paths.
-- * The same checks pass after apply -> rollback -> reapply.
