begin;

drop policy if exists project_task_issues_insert_member on public.project_task_issues;
drop policy if exists project_task_issues_select_member on public.project_task_issues;
drop trigger if exists validate_project_task_issue_relationship on public.project_task_issues;
drop function if exists public.validate_project_task_issue_relationship();
alter table public.project_task_issues
  drop constraint if exists project_task_issues_description_check;
drop function if exists public.trim_project_task_issue_whitespace(text);
alter table public.project_task_issues disable row level security;

commit;
