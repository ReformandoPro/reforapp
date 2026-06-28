begin;

create table if not exists public.project_budgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete restrict,
  title text not null,
  status text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_budgets_status_check check (status in ('draft','sent','accepted','rejected'))
);

create index if not exists project_budgets_org_project_updated_idx
  on public.project_budgets(organization_id, project_id, updated_at desc);

alter table public.project_budgets enable row level security;

drop trigger if exists set_updated_at_project_budgets on public.project_budgets;
create trigger set_updated_at_project_budgets
before update on public.project_budgets
for each row
execute function public.set_updated_at();

create table if not exists public.project_budget_lines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  budget_id uuid not null references public.project_budgets(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete restrict,
  description text not null,
  quantity numeric not null,
  unit_price numeric not null,
  tax_rate numeric not null default 21,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_budget_lines_quantity_check check (quantity >= 0),
  constraint project_budget_lines_unit_price_check check (unit_price >= 0),
  constraint project_budget_lines_tax_rate_check check (tax_rate >= 0 and tax_rate <= 100)
);

create index if not exists project_budget_lines_org_budget_sort_idx
  on public.project_budget_lines(organization_id, budget_id, sort_order);

create index if not exists project_budget_lines_org_project_idx
  on public.project_budget_lines(organization_id, project_id);

alter table public.project_budget_lines enable row level security;

drop trigger if exists set_updated_at_project_budget_lines on public.project_budget_lines;
create trigger set_updated_at_project_budget_lines
before update on public.project_budget_lines
for each row
execute function public.set_updated_at();

-- RLS: SELECT members, writes owner/admin. Ensure project belongs to org. Ensure line belongs to same org+project+budget.

drop policy if exists project_budgets_select_member on public.project_budgets;
create policy project_budgets_select_member
  on public.project_budgets
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = project_budgets.organization_id
        and m.user_id = auth.uid()
    )
  );

-- Writes: owner/admin + project belongs to org

drop policy if exists project_budgets_write_owner_admin on public.project_budgets;
create policy project_budgets_write_owner_admin
  on public.project_budgets
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = project_budgets.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  )
  with check (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = project_budgets.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
    and exists (
      select 1
      from public.projects p
      where p.organization_id = project_budgets.organization_id
        and p.id = project_budgets.project_id
    )
  );

-- Lines

drop policy if exists project_budget_lines_select_member on public.project_budget_lines;
create policy project_budget_lines_select_member
  on public.project_budget_lines
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = project_budget_lines.organization_id
        and m.user_id = auth.uid()
    )
  );

-- Writes: owner/admin + project belongs to org + budget belongs to org+project

drop policy if exists project_budget_lines_write_owner_admin on public.project_budget_lines;
create policy project_budget_lines_write_owner_admin
  on public.project_budget_lines
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = project_budget_lines.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  )
  with check (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = project_budget_lines.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
    and exists (
      select 1
      from public.projects p
      where p.organization_id = project_budget_lines.organization_id
        and p.id = project_budget_lines.project_id
    )
    and exists (
      select 1
      from public.project_budgets b
      where b.organization_id = project_budget_lines.organization_id
        and b.project_id = project_budget_lines.project_id
        and b.id = project_budget_lines.budget_id
    )
  );

commit;
