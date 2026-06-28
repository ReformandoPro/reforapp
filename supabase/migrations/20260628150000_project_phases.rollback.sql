begin;

-- Remove FK + column from tasks first
DO $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'project_tasks_phase_fk'
  ) then
    alter table public.project_tasks drop constraint project_tasks_phase_fk;
  end if;
end $$;

alter table public.project_tasks drop column if exists phase_id;

drop table if exists public.project_phases;

commit;
