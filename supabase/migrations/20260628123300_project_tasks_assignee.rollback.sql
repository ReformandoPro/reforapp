begin;

-- Best effort rollback.
alter table public.project_tasks
  drop constraint if exists project_tasks_assignee_user_fk;

alter table public.project_tasks
  drop column if exists assignee_user_id;

commit;
