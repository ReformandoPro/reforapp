\set ON_ERROR_STOP on

-- Baseline snapshot before B18. This is diagnostic evidence for the
-- compensating rollback contract, not production state.
select c.relname, c.relrowsecurity, c.relacl
from pg_class as c
join pg_namespace as n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('project_task_issues')
order by c.relname;

select p.oid::regprocedure as signature,
       pg_get_userbyid(p.proowner) as owner,
       p.prosecdef,
       p.proconfig,
       p.proacl
from pg_proc as p
join pg_namespace as n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_org_member', 'is_org_admin', 'org_has_any_membership', 'is_client_in_org')
order by signature::text;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'project_task_issues';
