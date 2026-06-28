begin;

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  project_id text not null references public.projects(id) on delete restrict,
  title text not null,
  description text,
  status text not null,
  priority text not null,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table public.project_tasks
  add constraint project_tasks_status_check
  check (status in ('pending','in_progress','done','blocked'));

alter table public.project_tasks
  add constraint project_tasks_priority_check
  check (priority in ('low','medium','high','urgent'));

create index if not exists project_tasks_org_idx on public.project_tasks(organization_id);
create index if not exists project_tasks_project_idx on public.project_tasks(project_id);
create index if not exists project_tasks_status_idx on public.project_tasks(status);
create index if not exists project_tasks_due_date_idx on public.project_tasks(due_date);

alter table public.project_tasks enable row level security;

-- Read for members (incl. owner/admin)
drop policy if exists project_tasks_select_member on public.project_tasks;
create policy project_tasks_select_member
  on public.project_tasks
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = project_tasks.organization_id
        and m.user_id = auth.uid()
    )
  );

-- Writes for owner/admin only
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
  );

-- Keep updated_at in sync.
drop trigger if exists set_project_tasks_updated_at on public.project_tasks;
create trigger set_project_tasks_updated_at
before update on public.project_tasks
for each row
execute function public.set_updated_at();

commit;

