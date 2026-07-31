begin;

-- Keep denormalized organization ownership aligned with the parent project.
-- The trigger runs as the table owner so the invariant cannot be bypassed by
-- an authenticated write that is otherwise permitted by RLS.
create or replace function public.enforce_project_task_parent_integrity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not exists (
    select 1
    from public.projects p
    where p.id = new.project_id
      and p.organization_id = new.organization_id
  ) then
    raise exception 'project_tasks project is invalid for organization';
  end if;

  if tg_op = 'UPDATE'
     and old.organization_id is distinct from new.organization_id then
    raise exception 'project_tasks.organization_id is immutable';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_project_task_parent_integrity() from public;

drop trigger if exists enforce_project_task_parent_integrity
  on public.project_tasks;
create trigger enforce_project_task_parent_integrity
before insert or update on public.project_tasks
for each row
execute function public.enforce_project_task_parent_integrity();

create or replace function public.enforce_project_organization_integrity()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if old.organization_id is distinct from new.organization_id then
    raise exception 'projects.organization_id is immutable';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_project_organization_integrity() from public;

drop trigger if exists enforce_project_organization_integrity on public.projects;
create trigger enforce_project_organization_integrity
before update on public.projects
for each row
execute function public.enforce_project_organization_integrity();

commit;
