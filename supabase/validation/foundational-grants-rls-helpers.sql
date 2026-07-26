\set ON_ERROR_STOP on

-- Run from a disposable database reconstructed from main. The script captures
-- the reproducible main baseline, applies the correction and rollback, compares
-- the rollback state exactly, then reapplies the correction.
create temp table validation_baseline_tables as
select c.oid, n.nspname, c.relname, c.relacl
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r';
create temp table validation_baseline_schema as
select oid, nspname, nspacl from pg_namespace where nspname = 'public';
create temp table validation_baseline_functions as
select p.oid::regprocedure::text as signature, p.proacl, p.proconfig,
       pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_org_member', 'is_org_admin', 'org_has_any_membership', 'is_client_in_org');

-- Run only against a freshly reconstructed disposable database. This is a
-- validation script, not a migration and it does not create fixtures.

select table_name, privilege_type, grantee
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('authenticated', 'service_role')
order by grantee, table_name, privilege_type;

select has_schema_privilege('authenticated', 'public', 'USAGE') as authenticated_schema_usage,
       has_schema_privilege('service_role', 'public', 'USAGE') as service_role_schema_usage;

select p.oid::regprocedure as function_signature,
       p.prosecdef,
       p.proconfig,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
       has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_org_member', 'is_org_admin', 'org_has_any_membership', 'is_client_in_org')
order by p.oid::regprocedure::text;

-- The helpers must restore row_security after each call in one transaction.
begin;
select current_setting('row_security') as before_helpers;
select public.is_org_member('00000000-0000-0000-0000-000000000001'::uuid);
select current_setting('row_security') as after_is_org_member;
select public.is_org_admin('00000000-0000-0000-0000-000000000001'::uuid);
select current_setting('row_security') as after_is_org_admin;
select public.org_has_any_membership('00000000-0000-0000-0000-000000000001'::uuid);
select current_setting('row_security') as after_org_has_any_membership;
select public.is_client_in_org(
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid
);
select current_setting('row_security') as after_is_client_in_org;
rollback;

-- Apply this migration and use isolated authenticated sessions for the matrix:
-- owner/admin/member of org_a: only org_a rows and policy-allowed operations;
-- org_b-only, no-membership, anon and unauthenticated: no business rows;
-- service_role: administrative DML, never exposed through application clients.
select 'RLS matrix requires synthetic fixtures and authenticated JWT claims' as pending;

-- Verify apply -> rollback -> reapply by running this script after each phase.
select 'rollback and reapply require disposable PostgreSQL/Supabase execution' as pending;

-- The following phase is intentionally executable, not a claim of prior
-- execution. It must be run by Claude Code with the repository root as the
-- working directory and a complete schema reconstructed from main.
\ir ../migrations/20260727090000_supabase_foundational_grants_rls_helpers.sql

select 'post-apply ACL snapshot' as phase;
select c.relname, c.relacl from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;

\ir ../rollbacks/20260727090000_supabase_foundational_grants_rls_helpers.rollback.sql

do $$
begin
  if exists (
    (select oid, nspname, relname, relacl from validation_baseline_tables)
    except
    (select c.oid, n.nspname, c.relname, c.relacl from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r')
  ) or exists (
    (select c.oid, n.nspname, c.relname, c.relacl from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r')
    except
    (select oid, nspname, relname, relacl from validation_baseline_tables)
  ) then raise exception 'table ACL/state mismatch after rollback'; end if;
  if exists (select 1 from validation_baseline_schema b full join pg_namespace n on n.oid = b.oid where b.nspacl is distinct from n.nspacl) then raise exception 'schema ACL mismatch after rollback'; end if;
  if exists (select 1 from validation_baseline_functions b full join (select p.oid::regprocedure::text signature, p.proacl, p.proconfig, pg_get_functiondef(p.oid) definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('is_org_member','is_org_admin','org_has_any_membership','is_client_in_org')) f on f.signature=b.signature where b.proacl is distinct from f.proacl or b.proconfig is distinct from f.proconfig or b.definition is distinct from f.definition) then raise exception 'helper definition/ACL mismatch after rollback'; end if;
end $$;

\ir ../migrations/20260727090000_supabase_foundational_grants_rls_helpers.sql
select 'reapply completed' as phase;
