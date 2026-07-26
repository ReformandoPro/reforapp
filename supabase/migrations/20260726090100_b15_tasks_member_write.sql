begin;

do $$
begin
  if to_regclass('public.project_tasks') is null then
    raise exception 'project_tasks is required for B15 member-write policy correction';
  end if;

  if to_regclass('public.memberships') is null then
    raise exception 'memberships is required for B15 member-write policy correction';
  end if;

  if to_regclass('public.projects') is null then
    raise exception 'projects is required for B15 member-write policy correction';
  end if;

  if to_regclass('public.project_phases') is null then
    raise exception 'project_phases is required for B15 member-write policy correction';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'project_tasks'
      and column_name = 'organization_id'
  ) then
    raise exception 'project_tasks.organization_id is required for B15 member-write policy correction';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'project_tasks'
      and column_name = 'project_id'
  ) then
    raise exception 'project_tasks.project_id is required for B15 member-write policy correction';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'project_tasks'
      and column_name = 'phase_id'
  ) then
    raise exception 'project_tasks.phase_id is required for B15 member-write policy correction';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'project_tasks'
      and column_name = 'assignee_user_id'
  ) then
    raise exception 'project_tasks.assignee_user_id is required for B15 member-write policy correction';
  end if;
end $$;

drop policy if exists project_tasks_insert_owner_admin on public.project_tasks;
drop policy if exists project_tasks_insert_member on public.project_tasks;
create policy project_tasks_insert_member
on public.project_tasks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.memberships m
    where m.organization_id = project_tasks.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin','member')
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
create policy project_tasks_update_member
on public.project_tasks
for update
to authenticated
using (
  exists (
    select 1
    from public.memberships m
    where m.organization_id = project_tasks.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin','member')
  )
)
with check (
  exists (
    select 1
    from public.memberships m
    where m.organization_id = project_tasks.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin','member')
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
