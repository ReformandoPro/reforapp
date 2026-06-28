begin;

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

commit;
