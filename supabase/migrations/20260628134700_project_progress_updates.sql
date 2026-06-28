begin;

create table if not exists public.project_progress_updates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete restrict,
  author_user_id uuid not null references public.profiles(user_id) on delete restrict,
  progress integer not null,
  note text not null,
  created_at timestamptz not null default now(),
  constraint project_progress_updates_progress_check check (progress >= 0 and progress <= 100)
);

create index if not exists project_progress_updates_org_project_created_idx
  on public.project_progress_updates(organization_id, project_id, created_at desc);

create index if not exists project_progress_updates_author_created_idx
  on public.project_progress_updates(author_user_id, created_at desc);

alter table public.project_progress_updates enable row level security;

-- SELECT: members of org
Drop policy if exists project_progress_updates_select_member on public.project_progress_updates;
create policy project_progress_updates_select_member
  on public.project_progress_updates
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = project_progress_updates.organization_id
        and m.user_id = auth.uid()
    )
  );

-- INSERT: owner/admin only, author must be current user, project must belong to org
Drop policy if exists project_progress_updates_insert_owner_admin on public.project_progress_updates;
create policy project_progress_updates_insert_owner_admin
  on public.project_progress_updates
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = project_progress_updates.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
    and project_progress_updates.author_user_id = auth.uid()
    and exists (
      select 1
      from public.projects p
      where p.organization_id = project_progress_updates.organization_id
        and p.id = project_progress_updates.project_id
    )
  );

-- UPDATE: author OR owner/admin, project must belong to org
Drop policy if exists project_progress_updates_update_author_or_owner_admin on public.project_progress_updates;
create policy project_progress_updates_update_author_or_owner_admin
  on public.project_progress_updates
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = project_progress_updates.organization_id
        and m.user_id = auth.uid()
        and (
          project_progress_updates.author_user_id = auth.uid()
          or m.role in ('owner','admin')
        )
    )
  )
  with check (
    exists (
      select 1
      from public.projects p
      where p.organization_id = project_progress_updates.organization_id
        and p.id = project_progress_updates.project_id
    )
  );

-- DELETE: author OR owner/admin
Drop policy if exists project_progress_updates_delete_author_or_owner_admin on public.project_progress_updates;
create policy project_progress_updates_delete_author_or_owner_admin
  on public.project_progress_updates
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = project_progress_updates.organization_id
        and m.user_id = auth.uid()
        and (
          project_progress_updates.author_user_id = auth.uid()
          or m.role in ('owner','admin')
        )
    )
  );

commit;
