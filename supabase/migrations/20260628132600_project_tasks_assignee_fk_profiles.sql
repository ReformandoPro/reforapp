begin;

-- Switch assignee FK to profiles directory (keeps reference to auth.users
-- indirectly), but only when it is actually safe to do so.
--
-- public.profiles.user_id may not have a usable PRIMARY KEY/UNIQUE
-- constraint in a legacy staging database (see 20260628132500_profiles.sql,
-- which skips adding profiles_pkey when a legacy primary key already
-- exists on public.profiles). Postgres requires the referenced column of a
-- foreign key to be backed by a unique or primary key constraint, so
-- blindly dropping project_tasks_assignee_user_fk and pointing at
-- profiles(user_id) can either fail outright (SQLSTATE 42830) or, if done
-- carelessly, leave project_tasks without any assignee FK at all.
--
-- To stay safe: only drop the direct auth.users FK and add the profiles FK
-- when profiles.user_id is confirmed to be unique/PK-backed. Otherwise,
-- keep the existing direct FK to auth.users untouched and leave a notice.
DO $$
declare
  profiles_user_id_is_unique boolean;
begin
  select exists (
      select 1
      from pg_constraint c
      join pg_attribute a
        on a.attrelid = c.conrelid
       and a.attnum = any (c.conkey)
      where c.conrelid = 'public.profiles'::regclass
        and c.contype in ('p', 'u')
        and a.attname = 'user_id'
    )
  into profiles_user_id_is_unique;

  if profiles_user_id_is_unique then
    alter table public.project_tasks
      drop constraint if exists project_tasks_assignee_user_fk;

    if not exists (
            select 1
            from pg_constraint
            where conname = 'project_tasks_assignee_profile_fk'
              and conrelid = 'public.project_tasks'::regclass
          ) then
      alter table public.project_tasks
        add constraint project_tasks_assignee_profile_fk
        foreign key (assignee_user_id)
        references public.profiles(user_id)
        on delete set null;
    end if;
  else
    raise notice 'public.profiles.user_id is not unique/primary key in this database; keeping project_tasks_assignee_user_fk (direct FK to auth.users) and skipping project_tasks_assignee_profile_fk until profiles is normalized in a follow-up migration.';
  end if;
end $$;

commit;
