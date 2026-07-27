begin;

-- These are the only table privileges added by B18. The baseline has no
-- authenticated SELECT/INSERT contract for project_task_issues.
revoke select on table public.memberships, public.projects, public.project_tasks
  from authenticated;
revoke select, insert on table public.project_task_issues from authenticated;

commit;
