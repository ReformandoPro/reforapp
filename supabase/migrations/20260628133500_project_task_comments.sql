begin;

-- This migration creates public.project_task_comments only when the legacy
-- staging schema is fully compatible with the canonical uuid-based model
-- (organizations.id, projects.id, project_tasks.id, project_tasks.project_id
-- as uuid, and profiles.user_id backed by a usable primary key/unique
-- constraint). If any of these conditions are not met, table/index/trigger/
-- policy creation is skipped with a RAISE NOTICE instead of failing the
-- migration (e.g. avoids SQLSTATE 42804 when projects.id is legacy text).
do $outer$
declare
  organizations_id_is_uuid boolean;
  projects_id_is_uuid boolean;
  project_tasks_id_is_uuid boolean;
  project_tasks_project_id_is_uuid boolean;
  profiles_user_id_is_unique boolean;
  schema_is_compatible boolean;
begin
  select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'organizations'
        and column_name = 'id'
        and data_type = 'uuid'
    ) into organizations_id_is_uuid;

  select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'projects'
          and column_name = 'id'
          and data_type = 'uuid'
      ) into projects_id_is_uuid;

  select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'project_tasks'
          and column_name = 'id'
          and data_type = 'uuid'
      ) into project_tasks_id_is_uuid;

  select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'project_tasks'
          and column_name = 'project_id'
          and data_type = 'uuid'
      ) into project_tasks_project_id_is_uuid;

  select exists (
        select 1
        from pg_constraint c
        join pg_attribute a
          on a.attrelid = c.conrelid
         and a.attnum = any(c.conkey)
        where c.conrelid = 'public.profiles'::regclass
          and c.contype in ('p', 'u')
          and a.attname = 'user_id'
      ) into profiles_user_id_is_unique;

  schema_is_compatible :=
    organizations_id_is_uuid
    and projects_id_is_uuid
    and project_tasks_id_is_uuid
    and project_tasks_project_id_is_uuid
    and profiles_user_id_is_unique;

  if schema_is_compatible then
    execute $inner$
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
      drop policy if exists project_task_comments_select_member on public.project_task_comments;
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
      drop policy if exists project_task_comments_insert_member on public.project_task_comments;
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
      drop policy if exists project_task_comments_update_author_or_owner_admin on public.project_task_comments;
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
      drop policy if exists project_task_comments_delete_author_or_owner_admin on public.project_task_comments;
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
    $inner$;

    raise notice 'project_task_comments: legacy schema is compatible (organizations.id, projects.id, project_tasks.id/project_id are uuid and profiles.user_id has a usable primary key/unique constraint); table, indexes, trigger and policies created/ensured.';
  else
    raise notice 'project_task_comments: skipped table/index/trigger/policy creation because legacy staging schema is not compatible with the canonical uuid model (organizations.id uuid=%, projects.id uuid=%, project_tasks.id uuid=%, project_tasks.project_id uuid=%, profiles.user_id PK/UNIQUE=%). This will be normalized in a follow-up migration once the legacy columns are migrated to uuid.',
      organizations_id_is_uuid, projects_id_is_uuid, project_tasks_id_is_uuid, project_tasks_project_id_is_uuid, profiles_user_id_is_unique;
  end if;
end
$outer$;

commit;
