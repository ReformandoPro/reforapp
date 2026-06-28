begin;

create table if not exists public.project_task_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete restrict,
  task_id uuid not null references public.project_tasks(id) on delete restrict,
  author_user_id uuid not null references public.profiles(user_id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_task_comments_org_task_idx
  on public.project_task_comments(organization_id, task_id, created_at);

create index if not exists project_task_comments_author_idx
  on public.project_task_comments(author_user_id, created_at);

alter table public.project_task_comments enable row level security;

-- updated_at trigger
drop trigger if exists set_updated_at_project_task_comments on public.project_task_comments;
create trigger set_updated_at_project_task_comments
before update on public.project_task_comments
for each row
execute function public.set_updated_at();

-- SELECT: members of org
Drop policy if exists project_task_comments_select_member on public.project_task_comments;
create policy project_task_comments_select_member
  on public.project_task_comments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = project_task_comments.organization_id
        and m.user_id = auth.uid()
    )
  );

-- INSERT: members of org, author must be current user, and project/task must belong to org and match
Drop policy if exists project_task_comments_insert_member on public.project_task_comments;
create policy project_task_comments_insert_member
  on public.project_task_comments
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = project_task_comments.organization_id
        and m.user_id = auth.uid()
    )
    and project_task_comments.author_user_id = auth.uid()
    and exists (
      select 1
      from public.projects p
      where p.organization_id = project_task_comments.organization_id
        and p.id = project_task_comments.project_id
    )
    and exists (
      select 1
      from public.project_tasks t
      where t.organization_id = project_task_comments.organization_id
        and t.project_id = project_task_comments.project_id
        and t.id = project_task_comments.task_id
    )
  );

-- UPDATE: author OR owner/admin. Also keep org/project/task consistency.
Drop policy if exists project_task_comments_update_author_or_owner_admin on public.project_task_comments;
create policy project_task_comments_update_author_or_owner_admin
  on public.project_task_comments
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = project_task_comments.organization_id
        and m.user_id = auth.uid()
        and (
          project_task_comments.author_user_id = auth.uid()
          or m.role in ('owner','admin')
        )
    )
  )
  with check (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = project_task_comments.organization_id
        and m.user_id = auth.uid()
        and (
          project_task_comments.author_user_id = auth.uid()
          or m.role in ('owner','admin')
        )
    )
    and exists (
      select 1
      from public.projects p
      where p.organization_id = project_task_comments.organization_id
        and p.id = project_task_comments.project_id
    )
    and exists (
      select 1
      from public.project_tasks t
      where t.organization_id = project_task_comments.organization_id
        and t.project_id = project_task_comments.project_id
        and t.id = project_task_comments.task_id
    )
  );

-- DELETE: author OR owner/admin
Drop policy if exists project_task_comments_delete_author_or_owner_admin on public.project_task_comments;
create policy project_task_comments_delete_author_or_owner_admin
  on public.project_task_comments
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = project_task_comments.organization_id
        and m.user_id = auth.uid()
        and (
          project_task_comments.author_user_id = auth.uid()
          or m.role in ('owner','admin')
        )
    )
  );

commit;
