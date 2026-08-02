begin;

create or replace function public.protect_project_task_integrity()
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

  if tg_op = 'UPDATE' and old.organization_id is distinct from new.organization_id then
    raise exception 'project_tasks.organization_id is immutable';
  end if;

  if new.phase_id is not null and not exists (
    select 1
    from public.project_phases ph
    where ph.id = new.phase_id
      and ph.organization_id = new.organization_id
      and ph.project_id = new.project_id
  ) then
    raise exception 'project_tasks phase is invalid for task';
  end if;

  if new.assignee_user_id is not null and not exists (
    select 1
    from public.memberships m
    where m.organization_id = new.organization_id
      and m.user_id = new.assignee_user_id
  ) then
    raise exception 'project_tasks assignee is invalid for organization';
  end if;

  if tg_op = 'UPDATE' and old.project_id is distinct from new.project_id
     and exists (
       select 1
       from public.project_task_issues i
       where i.task_id = old.id
     ) then
    raise exception 'project_tasks.project_id cannot change while task has issues';
  end if;

  return new;
end;
$$;

revoke all on function public.protect_project_task_integrity() from public;

drop trigger if exists protect_project_task_integrity on public.project_tasks;
create trigger protect_project_task_integrity
before insert or update on public.project_tasks
for each row
execute function public.protect_project_task_integrity();

create or replace function public.protect_project_organization_integrity()
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

revoke all on function public.protect_project_organization_integrity() from public;

drop trigger if exists protect_project_organization_integrity on public.projects;
create trigger protect_project_organization_integrity
before update on public.projects
for each row
execute function public.protect_project_organization_integrity();

commit;
