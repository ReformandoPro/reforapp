begin;

-- This migration creates the project_purchases and project_purchase_items
-- module only when the legacy staging schema is fully compatible with the
-- canonical uuid-based model (organizations.id and projects.id as uuid, and
-- profiles.user_id backed by a usable primary key/unique constraint). If any
-- of these conditions are not met, table/index/trigger/constraint/policy
-- creation is skipped with a RAISE NOTICE instead of failing the migration
-- (e.g. avoids SQLSTATE 42804 when projects.id is legacy text). No check is
-- needed for project_purchases.id before creating project_purchase_items,
-- since project_purchases is created as uuid primary key within the same
-- compatible branch. This migration does not reference clients.id,
-- project_documents.id or project_tasks.id, so no additional compatibility
-- checks for those tables are required.
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
      create table if not exists public.project_purchases (
            id uuid primary key default gen_random_uuid(),
            organization_id uuid not null references public.organizations(id) on delete restrict,
            project_id uuid not null references public.projects(id) on delete restrict,
            created_by_user_id uuid not null references public.profiles(user_id) on delete restrict,
            title text not null,
            supplier_name text,
            status text not null default 'planned',
            expected_date date,
            received_date date,
            notes text,
            created_at timestamptz not null default now(),
            updated_at timestamptz not null default now(),
            constraint project_purchases_status_check check (status in ('planned','ordered','received','cancelled'))
          );

      create index if not exists project_purchases_org_project_updated_idx
      on public.project_purchases(organization_id, project_id, updated_at desc);

      alter table public.project_purchases enable row level security;

      drop trigger if exists set_updated_at_project_purchases on public.project_purchases;
      create trigger set_updated_at_project_purchases
      before update on public.project_purchases
      for each row
      execute function public.set_updated_at();

      create table if not exists public.project_purchase_items (
                id uuid primary key default gen_random_uuid(),
                organization_id uuid not null references public.organizations(id) on delete restrict,
                purchase_id uuid not null references public.project_purchases(id) on delete cascade,
                project_id uuid not null references public.projects(id) on delete restrict,
                description text not null,
                quantity numeric not null,
                unit text,
                unit_price numeric not null default 0,
                tax_rate numeric not null default 21,
                sort_order integer not null default 0,
                created_at timestamptz not null default now(),
                updated_at timestamptz not null default now(),
                constraint project_purchase_items_quantity_check check (quantity >= 0),
                constraint project_purchase_items_unit_price_check check (unit_price >= 0),
                constraint project_purchase_items_tax_rate_check check (tax_rate >= 0 and tax_rate <= 100)
              );

      create index if not exists project_purchase_items_org_purchase_sort_idx
      on public.project_purchase_items(organization_id, purchase_id, sort_order);

      create index if not exists project_purchase_items_org_project_idx
      on public.project_purchase_items(organization_id, project_id);

      alter table public.project_purchase_items enable row level security;

      drop trigger if exists set_updated_at_project_purchase_items on public.project_purchase_items;
      create trigger set_updated_at_project_purchase_items
      before update on public.project_purchase_items
      for each row
      execute function public.set_updated_at();

      -- RLS

      -- Purchases SELECT: org members

      drop policy if exists project_purchases_select_member on public.project_purchases;
      create policy project_purchases_select_member
      on public.project_purchases
      for select
      to authenticated
      using (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_purchases.organization_id
                    and m.user_id = auth.uid()
                )
              );

      -- Purchases INSERT: owner/admin + project in org + created_by_user_id=auth.uid()

      drop policy if exists project_purchases_insert_owner_admin on public.project_purchases;
      create policy project_purchases_insert_owner_admin
      on public.project_purchases
      for insert
      to authenticated
      with check (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_purchases.organization_id
                    and m.user_id = auth.uid()
                    and m.role in ('owner','admin')
                )
                and exists (
                  select 1
                  from public.projects p
                  where p.organization_id = project_purchases.organization_id
                    and p.id = project_purchases.project_id
                )
                and project_purchases.created_by_user_id = auth.uid()
              );

      -- Purchases UPDATE: owner/admin + project in org

      drop policy if exists project_purchases_update_owner_admin on public.project_purchases;
      create policy project_purchases_update_owner_admin
      on public.project_purchases
      for update
      to authenticated
      using (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_purchases.organization_id
                    and m.user_id = auth.uid()
                    and m.role in ('owner','admin')
                )
              )
      with check (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_purchases.organization_id
                    and m.user_id = auth.uid()
                    and m.role in ('owner','admin')
                )
                and exists (
                  select 1
                  from public.projects p
                  where p.organization_id = project_purchases.organization_id
                    and p.id = project_purchases.project_id
                )
              );

      -- Purchases DELETE: owner/admin

      drop policy if exists project_purchases_delete_owner_admin on public.project_purchases;
      create policy project_purchases_delete_owner_admin
      on public.project_purchases
      for delete
      to authenticated
      using (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_purchases.organization_id
                    and m.user_id = auth.uid()
                    and m.role in ('owner','admin')
                )
              );

      -- Items SELECT: org members

      drop policy if exists project_purchase_items_select_member on public.project_purchase_items;
      create policy project_purchase_items_select_member
      on public.project_purchase_items
      for select
      to authenticated
      using (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_purchase_items.organization_id
                    and m.user_id = auth.uid()
                )
              );

      -- Items INSERT: owner/admin + project in org + purchase in org+project

      drop policy if exists project_purchase_items_insert_owner_admin on public.project_purchase_items;
      create policy project_purchase_items_insert_owner_admin
      on public.project_purchase_items
      for insert
      to authenticated
      with check (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_purchase_items.organization_id
                    and m.user_id = auth.uid()
                    and m.role in ('owner','admin')
                )
                and exists (
                  select 1
                  from public.projects p
                  where p.organization_id = project_purchase_items.organization_id
                    and p.id = project_purchase_items.project_id
                )
                and exists (
                  select 1
                  from public.project_purchases pu
                  where pu.organization_id = project_purchase_items.organization_id
                    and pu.project_id = project_purchase_items.project_id
                    and pu.id = project_purchase_items.purchase_id
                )
              );

      -- Items UPDATE: owner/admin + project in org + purchase in org+project

      drop policy if exists project_purchase_items_update_owner_admin on public.project_purchase_items;
      create policy project_purchase_items_update_owner_admin
      on public.project_purchase_items
      for update
      to authenticated
      using (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_purchase_items.organization_id
                    and m.user_id = auth.uid()
                    and m.role in ('owner','admin')
                )
              )
      with check (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_purchase_items.organization_id
                    and m.user_id = auth.uid()
                    and m.role in ('owner','admin')
                )
                and exists (
                  select 1
                  from public.projects p
                  where p.organization_id = project_purchase_items.organization_id
                    and p.id = project_purchase_items.project_id
                )
                and exists (
                  select 1
                  from public.project_purchases pu
                  where pu.organization_id = project_purchase_items.organization_id
                    and pu.project_id = project_purchase_items.project_id
                    and pu.id = project_purchase_items.purchase_id
                )
              );

      -- Items DELETE: owner/admin

      drop policy if exists project_purchase_items_delete_owner_admin on public.project_purchase_items;
      create policy project_purchase_items_delete_owner_admin
      on public.project_purchase_items
      for delete
      to authenticated
      using (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_purchase_items.organization_id
                    and m.user_id = auth.uid()
                    and m.role in ('owner','admin')
                )
              );
    $inner$;

    raise notice 'project_purchases: legacy schema is compatible (organizations.id and projects.id are uuid, profiles.user_id has a usable primary key/unique constraint); project_purchases, project_purchase_items, indexes, constraints, triggers and policies created/ensured.';
  else
    raise notice 'project_purchases: skipped table/index/trigger/constraint/policy creation (project_purchases and project_purchase_items) because legacy staging schema is not compatible with the canonical uuid model (organizations.id uuid=%, projects.id uuid=%, profiles.user_id PK/UNIQUE=%). This avoids leaving a partial project_purchases/project_purchase_items module while legacy columns are still text and will be normalized in a follow-up migration.',
      organizations_id_is_uuid, projects_id_is_uuid, profiles_user_id_is_unique;
  end if;
end
$outer$;

commit;
