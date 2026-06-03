-- Reformando.app Supabase MVP schema proposal
-- Date: 2026-06-03
--
-- This file is documentation/proposed SQL only in this branch.
-- Do not execute against production without review, staging validation and rollback plan.

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'project_manager', 'worker', 'client')),
  status text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  display_name text not null,
  email text,
  phone text,
  tax_id text,
  billing_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  name text not null,
  status text not null check (
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
  ),
  address text,
  project_type text,
  start_date date,
  end_date date,
  responsible_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  assignee_profile_id uuid references public.profiles(id) on delete set null,
  assignee_name_snapshot text,
  due_date date,
  blocked_reason text,
  section_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  code text,
  status text not null default 'draft' check (
    status in ('draft', 'sent', 'viewed', 'change_requested', 'approved', 'rejected', 'expired', 'archived')
  ),
  currency text not null default 'EUR',
  surface_square_meters numeric(12, 2),
  estimated_cost_cents integer not null default 0 check (estimated_cost_cents >= 0),
  sale_price_cents integer not null default 0 check (sale_price_cents >= 0),
  target_margin_rate numeric(7, 4) not null default 0,
  actual_margin_rate numeric(7, 4) not null default 0,
  contingency_amount_cents integer not null default 0 check (contingency_amount_cents >= 0),
  client_visible_total_cents integer not null default 0 check (client_visible_total_cents >= 0),
  sent_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budget_lines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  budget_id uuid not null references public.budgets(id) on delete cascade,
  chapter_id uuid,
  code text,
  name text not null,
  description text,
  kind text not null check (kind in ('material', 'labor', 'subcontract', 'equipment', 'other')),
  quantity numeric(12, 3) not null check (quantity >= 0),
  unit text not null,
  unit_cost_cents integer not null default 0 check (unit_cost_cents >= 0),
  waste_rate numeric(7, 4),
  subtotal_cost_cents integer not null default 0 check (subtotal_cost_cents >= 0),
  margin_rate numeric(7, 4),
  sale_price_cents integer not null default 0 check (sale_price_cents >= 0),
  client_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  budget_id uuid references public.budgets(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  requested_by_profile_id uuid references public.profiles(id) on delete set null,
  requested_to_profile_id uuid references public.profiles(id) on delete set null,
  kind text not null check (
    kind in ('budget', 'extra', 'material_change', 'deadline_change', 'phase_delivery', 'other')
  ),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  title text not null,
  description text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  reported_by_profile_id uuid references public.profiles(id) on delete set null,
  level text not null default 'info' check (level in ('info', 'warning', 'danger')),
  status text not null default 'open' check (status in ('open', 'resolved', 'cancelled')),
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  uploaded_by_profile_id uuid references public.profiles(id) on delete set null,
  kind text not null default 'document' check (kind in ('photo', 'document', 'contract', 'invoice', 'other')),
  title text not null,
  storage_bucket text,
  storage_path text,
  mime_type text,
  size_bytes integer check (size_bytes is null or size_bytes >= 0),
  visible_to_client boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_members_profile_status_idx
  on public.organization_members (profile_id, status);

create index if not exists organization_members_org_role_idx
  on public.organization_members (organization_id, role);

create index if not exists clients_org_display_name_idx
  on public.clients (organization_id, display_name);

create index if not exists clients_org_email_idx
  on public.clients (organization_id, email);

create index if not exists projects_org_status_idx
  on public.projects (organization_id, status);

create index if not exists projects_org_client_idx
  on public.projects (organization_id, client_id);

create index if not exists projects_org_updated_at_idx
  on public.projects (organization_id, updated_at desc);

create index if not exists tasks_org_project_idx
  on public.tasks (organization_id, project_id);

create index if not exists tasks_org_status_idx
  on public.tasks (organization_id, status);

create index if not exists tasks_org_due_date_idx
  on public.tasks (organization_id, due_date);

create index if not exists tasks_project_status_due_date_idx
  on public.tasks (project_id, status, due_date);

create index if not exists budgets_org_project_idx
  on public.budgets (organization_id, project_id);

create index if not exists budgets_org_status_idx
  on public.budgets (organization_id, status);

create unique index if not exists budgets_org_code_unique_idx
  on public.budgets (organization_id, code)
  where code is not null;

create index if not exists budget_lines_org_budget_order_idx
  on public.budget_lines (organization_id, budget_id, sort_order);

create index if not exists budget_lines_budget_idx
  on public.budget_lines (budget_id);

create index if not exists approvals_org_project_status_idx
  on public.approvals (organization_id, project_id, status);

create index if not exists approvals_org_status_idx
  on public.approvals (organization_id, status);

create index if not exists approvals_budget_idx
  on public.approvals (budget_id)
  where budget_id is not null;

create index if not exists incidents_org_project_status_idx
  on public.incidents (organization_id, project_id, status);

create index if not exists incidents_org_status_level_idx
  on public.incidents (organization_id, status, level);

create index if not exists incidents_task_idx
  on public.incidents (task_id)
  where task_id is not null;

create index if not exists documents_org_project_created_at_idx
  on public.documents (organization_id, project_id, created_at desc);

create index if not exists documents_task_idx
  on public.documents (task_id)
  where task_id is not null;

create index if not exists documents_project_visible_client_idx
  on public.documents (project_id, visible_to_client);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_lines enable row level security;
alter table public.approvals enable row level security;
alter table public.incidents enable row level security;
alter table public.documents enable row level security;

create or replace function public.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.profile_id = auth.uid()
      and om.status = 'active'
  );
$$;

create or replace function public.has_org_role(target_organization_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.profile_id = auth.uid()
      and om.status = 'active'
      and om.role = any(allowed_roles)
  );
$$;

create or replace function public.shares_org_with_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members current_member
    join public.organization_members target_member
      on target_member.organization_id = current_member.organization_id
    where current_member.profile_id = auth.uid()
      and current_member.status = 'active'
      and target_member.profile_id = target_profile_id
      and target_member.status = 'active'
  );
$$;

-- RLS policies

drop policy if exists "organizations_select_for_members" on public.organizations;
drop policy if exists "organizations_update_for_admins" on public.organizations;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_shared_org" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "organization_members_select_for_members" on public.organization_members;
drop policy if exists "organization_members_insert_for_admins" on public.organization_members;
drop policy if exists "organization_members_update_for_admins" on public.organization_members;
drop policy if exists "clients_select_for_managers" on public.clients;
drop policy if exists "clients_insert_for_managers" on public.clients;
drop policy if exists "clients_update_for_managers" on public.clients;
drop policy if exists "projects_select_for_members" on public.projects;
drop policy if exists "projects_insert_for_managers" on public.projects;
drop policy if exists "projects_update_for_managers" on public.projects;
drop policy if exists "tasks_select_for_members" on public.tasks;
drop policy if exists "tasks_insert_for_managers" on public.tasks;
drop policy if exists "tasks_update_for_operational_roles" on public.tasks;
drop policy if exists "budgets_select_for_managers" on public.budgets;
drop policy if exists "budgets_insert_for_managers" on public.budgets;
drop policy if exists "budgets_update_for_managers" on public.budgets;
drop policy if exists "budget_lines_select_for_managers" on public.budget_lines;
drop policy if exists "budget_lines_insert_for_managers" on public.budget_lines;
drop policy if exists "budget_lines_update_for_managers" on public.budget_lines;
drop policy if exists "budget_lines_delete_for_managers" on public.budget_lines;
drop policy if exists "approvals_select_for_members" on public.approvals;
drop policy if exists "approvals_insert_for_managers" on public.approvals;
drop policy if exists "approvals_update_for_managers" on public.approvals;
drop policy if exists "incidents_select_for_members" on public.incidents;
drop policy if exists "incidents_insert_for_operational_roles" on public.incidents;
drop policy if exists "incidents_update_for_managers" on public.incidents;
drop policy if exists "documents_select_for_members" on public.documents;
drop policy if exists "documents_insert_for_operational_roles" on public.documents;
drop policy if exists "documents_update_for_managers" on public.documents;

create policy "organizations_select_for_members"
  on public.organizations
  for select
  using (public.is_org_member(id));

create policy "organizations_update_for_admins"
  on public.organizations
  for update
  using (public.has_org_role(id, array['owner', 'admin']))
  with check (public.has_org_role(id, array['owner', 'admin']));

create policy "profiles_select_own"
  on public.profiles
  for select
  using (id = auth.uid());

create policy "profiles_select_shared_org"
  on public.profiles
  for select
  using (public.shares_org_with_profile(id));

create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "organization_members_select_for_members"
  on public.organization_members
  for select
  using (public.is_org_member(organization_id));

create policy "organization_members_insert_for_admins"
  on public.organization_members
  for insert
  with check (public.has_org_role(organization_id, array['owner', 'admin']));

create policy "organization_members_update_for_admins"
  on public.organization_members
  for update
  using (public.has_org_role(organization_id, array['owner', 'admin']))
  with check (public.has_org_role(organization_id, array['owner', 'admin']));

create policy "clients_select_for_managers"
  on public.clients
  for select
  using (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']));

create policy "clients_insert_for_managers"
  on public.clients
  for insert
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']));

create policy "clients_update_for_managers"
  on public.clients
  for update
  using (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']))
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']));

create policy "projects_select_for_members"
  on public.projects
  for select
  using (public.is_org_member(organization_id));

create policy "projects_insert_for_managers"
  on public.projects
  for insert
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']));

create policy "projects_update_for_managers"
  on public.projects
  for update
  using (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']))
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']));

create policy "tasks_select_for_members"
  on public.tasks
  for select
  using (public.is_org_member(organization_id));

create policy "tasks_insert_for_managers"
  on public.tasks
  for insert
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']));

create policy "tasks_update_for_operational_roles"
  on public.tasks
  for update
  using (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager', 'worker']))
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager', 'worker']));

create policy "budgets_select_for_managers"
  on public.budgets
  for select
  using (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']));

create policy "budgets_insert_for_managers"
  on public.budgets
  for insert
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']));

create policy "budgets_update_for_managers"
  on public.budgets
  for update
  using (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']))
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']));

create policy "budget_lines_select_for_managers"
  on public.budget_lines
  for select
  using (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']));

create policy "budget_lines_insert_for_managers"
  on public.budget_lines
  for insert
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']));

create policy "budget_lines_update_for_managers"
  on public.budget_lines
  for update
  using (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']))
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']));

create policy "budget_lines_delete_for_managers"
  on public.budget_lines
  for delete
  using (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']));

create policy "approvals_select_for_members"
  on public.approvals
  for select
  using (public.is_org_member(organization_id));

create policy "approvals_insert_for_managers"
  on public.approvals
  for insert
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']));

create policy "approvals_update_for_managers"
  on public.approvals
  for update
  using (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']))
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']));

create policy "incidents_select_for_members"
  on public.incidents
  for select
  using (public.is_org_member(organization_id));

create policy "incidents_insert_for_operational_roles"
  on public.incidents
  for insert
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager', 'worker']));

create policy "incidents_update_for_managers"
  on public.incidents
  for update
  using (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']))
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']));

create policy "documents_select_for_members"
  on public.documents
  for select
  using (public.is_org_member(organization_id));

create policy "documents_insert_for_operational_roles"
  on public.documents
  for insert
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager', 'worker']));

create policy "documents_update_for_managers"
  on public.documents
  for update
  using (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']))
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'project_manager']));

-- Seed data note:
-- Demo seed should be added in a separate reviewed seed file after auth demo
-- users exist, because profiles.id references auth.users(id).
