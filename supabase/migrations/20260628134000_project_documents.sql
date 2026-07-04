begin;

-- This migration creates the project_documents module only when the legacy
-- staging schema is fully compatible with the canonical uuid-based model
-- (organizations.id and projects.id as uuid, and profiles.user_id backed by
-- a usable primary key/unique constraint). If any of these conditions are not
-- met, bucket/table/index/policy creation is skipped with a RAISE NOTICE
-- instead of failing the migration (e.g. avoids SQLSTATE 42804 when
-- projects.id is legacy text).
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
      -- ---------------------------------------------------------------------------
      -- Storage bucket (private)
      -- ---------------------------------------------------------------------------
      insert into storage.buckets (id, name, public)
      values ('project-documents', 'project-documents', false)
      on conflict (id) do update set public = excluded.public;

      -- ---------------------------------------------------------------------------
      -- Table: project_documents
      -- ---------------------------------------------------------------------------
      create table if not exists public.project_documents (
        id uuid primary key default gen_random_uuid(),
        organization_id uuid not null references public.organizations(id) on delete restrict,
        project_id uuid not null references public.projects(id) on delete restrict,
        uploaded_by_user_id uuid not null references public.profiles(user_id) on delete restrict,
        file_path text not null,
        file_name text not null,
        mime_type text not null,
        size_bytes bigint not null,
        category text not null,
        description text,
        created_at timestamptz not null default now()
      );

      do $$
      begin
        if not exists (
          select 1
          from pg_constraint
          where conname = 'project_documents_category_check'
            and conrelid = 'public.project_documents'::regclass
        ) then
          alter table public.project_documents
            add constraint project_documents_category_check
            check (category in ('general','budget','invoice','photo','license','plan','report'));
        end if;
      end $$;

      create index if not exists project_documents_org_project_created_idx
        on public.project_documents(organization_id, project_id, created_at desc);

      create index if not exists project_documents_uploader_idx
        on public.project_documents(uploaded_by_user_id, created_at desc);

      create unique index if not exists project_documents_file_path_unique
        on public.project_documents(file_path);

      alter table public.project_documents enable row level security;

      -- SELECT: members of org
      drop policy if exists project_documents_select_member on public.project_documents;
      create policy project_documents_select_member
        on public.project_documents
        for select
        to authenticated
        using (
          exists (
            select 1
            from public.memberships m
            where m.organization_id = project_documents.organization_id
              and m.user_id = auth.uid()
          )
        );

      -- INSERT: owner/admin only (can be relaxed later)
      drop policy if exists project_documents_insert_owner_admin on public.project_documents;
      create policy project_documents_insert_owner_admin
        on public.project_documents
        for insert
        to authenticated
        with check (
          exists (
            select 1
            from public.memberships m
            where m.organization_id = project_documents.organization_id
              and m.user_id = auth.uid()
              and m.role in ('owner','admin')
          )
          and project_documents.uploaded_by_user_id = auth.uid()
          and exists (
            select 1
            from public.projects p
            where p.organization_id = project_documents.organization_id
              and p.id = project_documents.project_id
          )
        );

      -- DELETE: owner/admin OR uploader
      drop policy if exists project_documents_delete_uploader_or_owner_admin on public.project_documents;
      create policy project_documents_delete_uploader_or_owner_admin
        on public.project_documents
        for delete
        to authenticated
        using (
          exists (
            select 1
            from public.memberships m
            where m.organization_id = project_documents.organization_id
              and m.user_id = auth.uid()
              and (
                project_documents.uploaded_by_user_id = auth.uid()
                or m.role in ('owner','admin')
              )
          )
        );

      -- ---------------------------------------------------------------------------
      -- Storage RLS: storage.objects for bucket `project-documents`
      -- Path convention: {organization_id}/{project_id}/{document_id}-{safe_filename}
      -- ---------------------------------------------------------------------------

      -- Read objects only if member of org and object belongs to a document row in that org.
      drop policy if exists project_documents_storage_select_member on storage.objects;
      create policy project_documents_storage_select_member
        on storage.objects
        for select
        to authenticated
        using (
          bucket_id = 'project-documents'
          and exists (
            select 1
            from public.memberships m
            where m.organization_id = split_part(name,'/',1)::uuid
              and m.user_id = auth.uid()
          )
          and exists (
            select 1
            from public.project_documents d
            where d.file_path = name
              and d.organization_id = split_part(name,'/',1)::uuid
          )
        );

      -- Insert objects only for owner/admin, and only into org/project folders that exist.
      drop policy if exists project_documents_storage_insert_owner_admin on storage.objects;
      create policy project_documents_storage_insert_owner_admin
        on storage.objects
        for insert
        to authenticated
        with check (
          bucket_id = 'project-documents'
          and exists (
            select 1
            from public.memberships m
            where m.organization_id = split_part(name,'/',1)::uuid
              and m.user_id = auth.uid()
              and m.role in ('owner','admin')
          )
          and exists (
            select 1
            from public.projects p
            where p.organization_id = split_part(name,'/',1)::uuid
              and p.id = split_part(name,'/',2)::uuid
          )
        );

      -- Delete objects if uploader OR owner/admin (by looking up project_documents row)
      drop policy if exists project_documents_storage_delete_uploader_or_owner_admin on storage.objects;
      create policy project_documents_storage_delete_uploader_or_owner_admin
        on storage.objects
        for delete
        to authenticated
        using (
          bucket_id = 'project-documents'
          and exists (
            select 1
            from public.project_documents d
            join public.memberships m
              on m.organization_id = d.organization_id
            where d.file_path = name
              and m.user_id = auth.uid()
              and (
                d.uploaded_by_user_id = auth.uid()
                or m.role in ('owner','admin')
              )
          )
        );
    $inner$;

    raise notice 'project_documents: legacy schema is compatible (organizations.id and projects.id are uuid, profiles.user_id has a usable primary key/unique constraint); bucket, table, indexes, constraint and policies created/ensured.';
  else
    raise notice 'project_documents: skipped bucket/table/index/constraint/policy creation because legacy staging schema is not compatible with the canonical uuid model (organizations.id uuid=%, projects.id uuid=%, profiles.user_id PK/UNIQUE=%). This avoids partially configuring project documents/storage while legacy columns are still text and will be normalized in a follow-up migration.',
      organizations_id_is_uuid, projects_id_is_uuid, profiles_user_id_is_unique;
  end if;
end
$outer$;

commit;
