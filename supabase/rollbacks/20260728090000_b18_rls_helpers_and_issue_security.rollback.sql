begin;

-- Rollback is fail-closed. The main baseline creates project_task_issues
-- without RLS, so disabling RLS here would recreate an unsafe table. Keep RLS
-- enabled and remove only the B18 policies; the table then denies access until
-- a reviewed replacement policy is installed.
drop policy if exists project_task_issues_select_member on public.project_task_issues;
drop policy if exists project_task_issues_insert_member on public.project_task_issues;
alter table public.project_task_issues enable row level security;

-- The four helpers predate B18. Their corrected definitions are intentionally
-- retained: restoring the historical row_security leak would be unsafe. The
-- rollback therefore documents this non-reversible security hardening rather
-- than silently restoring insecure behavior or PUBLIC EXECUTE.
revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.is_org_admin(uuid) from public;
revoke all on function public.org_has_any_membership(uuid) from public;
revoke all on function public.is_client_in_org(uuid, uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;
grant execute on function public.org_has_any_membership(uuid) to authenticated;
grant execute on function public.is_client_in_org(uuid, uuid) to authenticated;

commit;
