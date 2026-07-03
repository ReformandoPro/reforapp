begin;

-- Core bootstrap: projects.
-- Includes legacy columns required by current /app/** code: title, client_name, start_date.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,

  name text not null,
  -- Legacy (required today)
  title text not null,
  client_name text not null,
  start_date timestamptz not null,

  status text not null,
  address text not null,
  type text not null,
  progress integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint projects_progress_check check (progress >= 0 and progress <= 100),
  constraint projects_status_check check (
    status in (
      'lead',
      'budgeting',
      'approved',
      'scheduled',
      'in_progress',
      'paused',
      'completed',
      'delivered',
      'closed',
      'cancelled'
    )
  )
);

create index if not exists projects_org_updated_at_idx
  on public.projects (organization_id, updated_at desc);

create index if not exists projects_org_client_idx
  on public.projects (organization_id, client_id);

create index if not exists projects_org_status_idx
  on public.projects (organization_id, status);

-- updated_at trigger
drop trigger if exists set_updated_at_projects on public.projects;
create trigger set_updated_at_projects
before update on public.projects
for each row
execute function public.set_updated_at();

alter table public.projects enable row level security;

-- RLS policies

-- SELECT: org members
Drop policy if exists projects_select_member on public.projects;
create policy projects_select_member
  on public.projects
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = projects.organization_id
        and m.user_id = auth.uid()
    )
  );

-- INSERT: owner/admin only + client must belong to org
Drop policy if exists projects_insert_owner_admin on public.projects;
create policy projects_insert_owner_admin
  on public.projects
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = projects.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
    and exists (
      select 1
      from public.clients c
      where c.id = projects.client_id
        and c.organization_id = projects.organization_id
    )
  );

-- UPDATE: owner/admin only + client must belong to org
Drop policy if exists projects_update_owner_admin on public.projects;
create policy projects_update_owner_admin
  on public.projects
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = projects.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  )
  with check (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = projects.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
    and exists (
      select 1
      from public.clients c
      where c.id = projects.client_id
        and c.organization_id = projects.organization_id
    )
  );

-- DELETE: owner/admin only
Drop policy if exists projects_delete_owner_admin on public.projects;
create policy projects_delete_owner_admin
  on public.projects
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = projects.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

commit;
