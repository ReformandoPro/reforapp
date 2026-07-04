begin;

-- This migration creates the project_progress_updates module only when the
-- legacy staging schema is fully compatible with the canonical uuid-based
-- model (organizations.id and projects.id as uuid, and profiles.user_id
-- backed by a usable primary key/unique constraint). If any of these
-- conditions are not met, table/index/policy creation is skipped with a
-- RAISE NOTICE instead of failing the migration (e.g. avoids SQLSTATE 42804
-- when projects.id is legacy text).
do $outer$
declare
  organizations_id_is_uuid boolean;
  projects_id_is_uuid boolean;
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
    and profiles_user_id_is_unique;

  if schema_is_compatible then
    execute $inner$
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
      drop policy if exists project_progress_updates_select_member on public.project_progress_updates;
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
      drop policy if exists project_progress_updates_insert_owner_admin on public.project_progress_updates;
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
      drop policy if exists project_progress_updates_update_author_or_owner_admin on public.project_progress_updates;
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
      drop policy if exists project_progress_updates_delete_author_or_owner_admin on public.project_progress_updates;
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
    $inner$;

    raise notice 'project_progress_updates: legacy schema is compatible (organizations.id and projects.id are uuid, profiles.user_id has a usable primary key/unique constraint); table, indexes and policies created/ensured.';
  else
    raise notice 'project_progress_updates: skipped table/index/policy creation because legacy staging schema is not compatible with the canonical uuid model (organizations.id uuid=%, projects.id uuid=%, profiles.user_id PK/UNIQUE=%). This avoids leaving a partial project_progress_updates table/policies while legacy columns are still text and will be normalized in a follow-up migration.',
      organizations_id_is_uuid, projects_id_is_uuid, profiles_user_id_is_unique;
  end if;
end
$outer$;

commit;
