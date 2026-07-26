begin;

do $$
begin
  if to_regclass('public.project_tasks') is null
     or to_regclass('public.memberships') is null
     or to_regclass('public.projects') is null
     or to_regclass('public.project_phases') is null then
    raise exception 'canonical B15 task policy schema is required for rollback';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'project_tasks'
      and column_name in ('organization_id', 'project_id', 'phase_id', 'assignee_user_id')
    group by table_schema, table_name
    having count(*) = 4
  ) then
    raise exception 'canonical project_tasks columns are required for rollback';
  end if;
end $$;

drop policy if exists project_tasks_insert_owner_admin on public.project_tasks;
drop policy if exists project_tasks_insert_member on public.project_tasks;
create policy project_tasks_insert_owner_admin
on public.project_tasks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.memberships m
    where m.organization_id = project_tasks.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  )
  and exists (
    select 1
    from public.projects p
    where p.organization_id = project_tasks.organization_id
      and p.id = project_tasks.project_id
  )
  and (
    project_tasks.assignee_user_id is null
    or exists (
      select 1
      from public.memberships am
      where am.organization_id = project_tasks.organization_id
        and am.user_id = project_tasks.assignee_user_id
    )
  )
  and (
    project_tasks.phase_id is null
    or exists (
      select 1
      from public.project_phases ph
      where ph.organization_id = project_tasks.organization_id
        and ph.project_id = project_tasks.project_id
        and ph.id = project_tasks.phase_id
    )
  )
);

drop policy if exists project_tasks_update_owner_admin on public.project_tasks;
drop policy if exists project_tasks_update_member on public.project_tasks;
create policy project_tasks_update_owner_admin
on public.project_tasks
for update
to authenticated
using (
  exists (
    select 1
    from public.memberships m
    where m.organization_id = project_tasks.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  )
)
with check (
  exists (
    select 1
    from public.memberships m
    where m.organization_id = project_tasks.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  )
  and exists (
    select 1
    from public.projects p
    where p.organization_id = project_tasks.organization_id
      and p.id = project_tasks.project_id
  )
  and (
    project_tasks.assignee_user_id is null
    or exists (
      select 1
      from public.memberships am
      where am.organization_id = project_tasks.organization_id
        and am.user_id = project_tasks.assignee_user_id
    )
  )
  and (
    project_tasks.phase_id is null
    or exists (
      select 1
      from public.project_phases ph
      where ph.organization_id = project_tasks.organization_id
        and ph.project_id = project_tasks.project_id
        and ph.id = project_tasks.phase_id
    )
  )
);

commit;
