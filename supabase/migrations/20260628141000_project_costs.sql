begin;

-- This migration creates the project_costs module only when the legacy
-- staging schema is fully compatible with the canonical uuid-based model
-- (organizations.id and projects.id as uuid, profiles.user_id backed by a
-- usable primary key/unique constraint, and project_documents.id backed by
-- a usable uuid primary key/unique constraint whenever that table exists).
-- If any of these conditions are not met, table/index/trigger/constraint/
-- policy creation is skipped with a RAISE NOTICE instead of failing the
-- migration (e.g. avoids SQLSTATE 42804 when projects.id is legacy text, or
-- a missing/incompatible project_documents table breaking the document_id
-- foreign key). If project_documents does not exist (e.g. skipped by a
-- prior legacy-safe migration), the check below returns false instead of
-- raising an error.
do $outer$
declare
  organizations_id_is_uuid boolean;
  projects_id_is_uuid boolean;
  profiles_user_id_is_unique boolean;
  project_documents_id_is_usable boolean;
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

  select (
        exists (
          select 1
          from information_schema.columns
          where table_schema = 'public'
            and table_name = 'project_documents'
            and column_name = 'id'
            and data_type = 'uuid'
        )
        and exists (
          select 1
          from pg_constraint c
          join pg_attribute a
            on a.attrelid = c.conrelid
           and a.attnum = any(c.conkey)
          where c.conrelid = to_regclass('public.project_documents')
            and c.contype in ('p', 'u')
            and a.attname = 'id'
        )
      ) into project_documents_id_is_usable;

  schema_is_compatible :=
    organizations_id_is_uuid
    and projects_id_is_uuid
    and profiles_user_id_is_unique
    and project_documents_id_is_usable;

  if schema_is_compatible then
    execute $inner$
      create table if not exists public.project_costs (
            id uuid primary key default gen_random_uuid(),
            organization_id uuid not null references public.organizations(id) on delete restrict,
            project_id uuid not null references public.projects(id) on delete restrict,
            created_by_user_id uuid not null references public.profiles(user_id) on delete restrict,
            title text not null,
            description text,
            category text not null default 'other',
            amount numeric not null,
            tax_rate numeric not null default 21,
            cost_date date not null default current_date,
            supplier_name text,
            document_id uuid references public.project_documents(id) on delete set null,
            created_at timestamptz not null default now(),
            updated_at timestamptz not null default now(),
            constraint project_costs_category_check check (category in ('labor','material','subcontractor','transport','permit','tool','other')),
            constraint project_costs_amount_check check (amount >= 0),
            constraint project_costs_tax_rate_check check (tax_rate >= 0 and tax_rate <= 100)
          );

      create index if not exists project_costs_org_project_date_idx
      on public.project_costs(organization_id, project_id, cost_date desc, created_at desc);

      create index if not exists project_costs_org_project_category_idx
      on public.project_costs(organization_id, project_id, category);

      alter table public.project_costs enable row level security;

      drop trigger if exists set_updated_at_project_costs on public.project_costs;
      create trigger set_updated_at_project_costs
      before update on public.project_costs
      for each row
      execute function public.set_updated_at();

      -- RLS

      drop policy if exists project_costs_select_member on public.project_costs;
      create policy project_costs_select_member
      on public.project_costs
      for select
      to authenticated
      using (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_costs.organization_id
                    and m.user_id = auth.uid()
                )
              );

      -- Writes: owner/admin. Insert enforces created_by_user_id=auth.uid(). Update enforces project/doc consistency.

      -- INSERT

      drop policy if exists project_costs_insert_owner_admin on public.project_costs;
      create policy project_costs_insert_owner_admin
      on public.project_costs
      for insert
      to authenticated
      with check (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_costs.organization_id
                    and m.user_id = auth.uid()
                    and m.role in ('owner','admin')
                )
                and exists (
                  select 1
                  from public.projects p
                  where p.organization_id = project_costs.organization_id
                    and p.id = project_costs.project_id
                )
                and project_costs.created_by_user_id = auth.uid()
                and (
                  project_costs.document_id is null
                  or exists (
                    select 1
                    from public.project_documents d
                    where d.organization_id = project_costs.organization_id
                      and d.project_id = project_costs.project_id
                      and d.id = project_costs.document_id
                  )
                )
              );

      -- UPDATE

      drop policy if exists project_costs_update_owner_admin on public.project_costs;
      create policy project_costs_update_owner_admin
      on public.project_costs
      for update
      to authenticated
      using (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_costs.organization_id
                    and m.user_id = auth.uid()
                    and m.role in ('owner','admin')
                )
              )
      with check (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_costs.organization_id
                    and m.user_id = auth.uid()
                    and m.role in ('owner','admin')
                )
                and exists (
                  select 1
                  from public.projects p
                  where p.organization_id = project_costs.organization_id
                    and p.id = project_costs.project_id
                )
                and (
                  project_costs.document_id is null
                  or exists (
                    select 1
                    from public.project_documents d
                    where d.organization_id = project_costs.organization_id
                      and d.project_id = project_costs.project_id
                      and d.id = project_costs.document_id
                  )
                )
              );

      -- DELETE

      drop policy if exists project_costs_delete_owner_admin on public.project_costs;
      create policy project_costs_delete_owner_admin
      on public.project_costs
      for delete
      to authenticated
      using (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_costs.organization_id
                    and m.user_id = auth.uid()
                    and m.role in ('owner','admin')
                )
              );
    $inner$;

    raise notice 'project_costs: legacy schema is compatible (organizations.id and projects.id are uuid, profiles.user_id has a usable primary key/unique constraint, project_documents.id is uuid and usable); table, indexes, constraints, trigger and policies created/ensured.';
  else
    raise notice 'project_costs: skipped table/index/trigger/constraint/policy creation because legacy staging schema is not compatible with the canonical uuid model (organizations.id uuid=%, projects.id uuid=%, profiles.user_id PK/UNIQUE=%, project_documents.id usable=%). This avoids leaving a partial project_costs module while legacy columns are still text and will be normalized in a follow-up migration.',
      organizations_id_is_uuid, projects_id_is_uuid, profiles_user_id_is_unique, project_documents_id_is_usable;
  end if;
end
$outer$;

commit;
