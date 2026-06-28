begin;

-- Add assignee to project tasks.
alter table public.project_tasks
  add column if not exists assignee_user_id uuid null;

-- Prefer FK to auth.users when available.
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

create index if not exists project_tasks_assignee_user_id_idx
  on public.project_tasks(assignee_user_id);

-- Update policies to ensure assignee belongs to same org.
-- Read remains the same.

-- Writes for owner/admin only + project must belong to org + assignee must be member (or null)
drop policy if exists project_tasks_insert_owner_admin on public.project_tasks;
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
  );

drop policy if exists project_tasks_update_owner_admin on public.project_tasks;
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
  );

commit;
