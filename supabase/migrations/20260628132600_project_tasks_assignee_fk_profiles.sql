begin;

-- Switch assignee FK to profiles directory (keeps reference to auth.users indirectly).
alter table public.project_tasks
  drop constraint if exists project_tasks_assignee_user_fk;

DO $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_tasks_assignee_profile_fk'
  ) then
    alter table public.project_tasks
      add constraint project_tasks_assignee_profile_fk
      foreign key (assignee_user_id)
      references public.profiles(user_id)
      on delete set null;
  end if;
end $$;

commit;
