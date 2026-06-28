begin;

alter table public.project_tasks
  drop constraint if exists project_tasks_assignee_profile_fk;

-- best effort: re-add original FK to auth.users
DO $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_tasks_assignee_user_fk'
  ) then
    alter table public.project_tasks
      add constraint project_tasks_assignee_user_fk
      foreign key (assignee_user_id)
      references auth.users(id)
      on delete set null;
  end if;
end $$;

commit;
