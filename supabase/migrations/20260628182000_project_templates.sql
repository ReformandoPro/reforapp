begin;

-- Project templates (global + organization-scoped)
create table if not exists public.project_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure at most one default per organization (including global defaults).
-- We keep this simple: one default per organization_id value.
create unique index if not exists project_templates_one_default_per_org
  on public.project_templates (organization_id)
  where is_default;

create index if not exists project_templates_org_idx on public.project_templates (organization_id);
create index if not exists project_templates_name_idx on public.project_templates (name);

-- Keep updated_at fresh
drop trigger if exists set_updated_at_project_templates on public.project_templates;
create trigger set_updated_at_project_templates
before update on public.project_templates
for each row execute function public.set_updated_at();

alter table public.project_templates enable row level security;

-- SELECT: global templates visible to all authenticated
drop policy if exists project_templates_select_global_authenticated on public.project_templates;
create policy project_templates_select_global_authenticated
  on public.project_templates
  for select
  to authenticated
  using (organization_id is null);

-- SELECT: org templates visible to members
drop policy if exists project_templates_select_member on public.project_templates;
create policy project_templates_select_member
  on public.project_templates
  for select
  to authenticated
  using (
    organization_id is not null
    and exists (
      select 1
      from public.memberships m
      where m.organization_id = project_templates.organization_id
        and m.user_id = auth.uid()
    )
  );

-- INSERT: owner/admin only, org-scoped only (no global templates from app)
drop policy if exists project_templates_insert_owner_admin on public.project_templates;
create policy project_templates_insert_owner_admin
  on public.project_templates
  for insert
  to authenticated
  with check (
    organization_id is not null
    and exists (
      select 1
      from public.memberships m
      where m.organization_id = project_templates.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

-- UPDATE: owner/admin only, org-scoped only
drop policy if exists project_templates_update_owner_admin on public.project_templates;
create policy project_templates_update_owner_admin
  on public.project_templates
  for update
  to authenticated
  using (
    organization_id is not null
    and exists (
      select 1
      from public.memberships m
      where m.organization_id = project_templates.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  )
  with check (
    organization_id is not null
    and exists (
      select 1
      from public.memberships m
      where m.organization_id = project_templates.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

-- DELETE: owner/admin only, org-scoped only
drop policy if exists project_templates_delete_owner_admin on public.project_templates;
create policy project_templates_delete_owner_admin
  on public.project_templates
  for delete
  to authenticated
  using (
    organization_id is not null
    and exists (
      select 1
      from public.memberships m
      where m.organization_id = project_templates.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

-- Phases for templates
create table if not exists public.project_template_phases (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.project_templates(id) on delete cascade,
  title text not null,
  description text,
  sort_order integer not null default 0,
  default_status text not null default 'planned',
  created_at timestamptz not null default now()
);

alter table public.project_template_phases
  add constraint project_template_phases_default_status_check
  check (default_status in ('planned','in_progress','done','blocked','cancelled'));

create index if not exists project_template_phases_template_idx
  on public.project_template_phases (template_id);

create index if not exists project_template_phases_sort_idx
  on public.project_template_phases (template_id, sort_order);

alter table public.project_template_phases enable row level security;

-- SELECT: same as template visibility
drop policy if exists project_template_phases_select_authenticated on public.project_template_phases;
create policy project_template_phases_select_authenticated
  on public.project_template_phases
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.project_templates t
      where t.id = project_template_phases.template_id
        and (
          t.organization_id is null
          or exists (
            select 1
            from public.memberships m
            where m.organization_id = t.organization_id
              and m.user_id = auth.uid()
          )
        )
    )
  );

-- Writes: only owner/admin of org-scoped templates
-- (Global templates are never writable via normal app)
drop policy if exists project_template_phases_insert_owner_admin on public.project_template_phases;
create policy project_template_phases_insert_owner_admin
  on public.project_template_phases
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.project_templates t
      join public.memberships m on m.organization_id = t.organization_id
      where t.id = project_template_phases.template_id
        and t.organization_id is not null
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

drop policy if exists project_template_phases_update_owner_admin on public.project_template_phases;
create policy project_template_phases_update_owner_admin
  on public.project_template_phases
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.project_templates t
      join public.memberships m on m.organization_id = t.organization_id
      where t.id = project_template_phases.template_id
        and t.organization_id is not null
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  )
  with check (
    exists (
      select 1
      from public.project_templates t
      join public.memberships m on m.organization_id = t.organization_id
      where t.id = project_template_phases.template_id
        and t.organization_id is not null
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

drop policy if exists project_template_phases_delete_owner_admin on public.project_template_phases;
create policy project_template_phases_delete_owner_admin
  on public.project_template_phases
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.project_templates t
      join public.memberships m on m.organization_id = t.organization_id
      where t.id = project_template_phases.template_id
        and t.organization_id is not null
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

-- Tasks for template phases
create table if not exists public.project_template_tasks (
  id uuid primary key default gen_random_uuid(),
  template_phase_id uuid not null references public.project_template_phases(id) on delete cascade,
  title text not null,
  description text,
  sort_order integer not null default 0,
  default_status text not null default 'pending',
  default_priority text not null default 'medium',
  created_at timestamptz not null default now()
);

alter table public.project_template_tasks
  add constraint project_template_tasks_default_status_check
  check (default_status in ('pending','in_progress','done','blocked'));

alter table public.project_template_tasks
  add constraint project_template_tasks_default_priority_check
  check (default_priority in ('low','medium','high','urgent'));

create index if not exists project_template_tasks_phase_idx
  on public.project_template_tasks (template_phase_id);

create index if not exists project_template_tasks_sort_idx
  on public.project_template_tasks (template_phase_id, sort_order);

alter table public.project_template_tasks enable row level security;

-- SELECT: inherited from parent template via phase->template
drop policy if exists project_template_tasks_select_authenticated on public.project_template_tasks;
create policy project_template_tasks_select_authenticated
  on public.project_template_tasks
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.project_template_phases p
      join public.project_templates t on t.id = p.template_id
      where p.id = project_template_tasks.template_phase_id
        and (
          t.organization_id is null
          or exists (
            select 1
            from public.memberships m
            where m.organization_id = t.organization_id
              and m.user_id = auth.uid()
          )
        )
    )
  );

-- Writes: only owner/admin of org-scoped templates

drop policy if exists project_template_tasks_insert_owner_admin on public.project_template_tasks;
create policy project_template_tasks_insert_owner_admin
  on public.project_template_tasks
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.project_template_phases p
      join public.project_templates t on t.id = p.template_id
      join public.memberships m on m.organization_id = t.organization_id
      where p.id = project_template_tasks.template_phase_id
        and t.organization_id is not null
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

drop policy if exists project_template_tasks_update_owner_admin on public.project_template_tasks;
create policy project_template_tasks_update_owner_admin
  on public.project_template_tasks
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.project_template_phases p
      join public.project_templates t on t.id = p.template_id
      join public.memberships m on m.organization_id = t.organization_id
      where p.id = project_template_tasks.template_phase_id
        and t.organization_id is not null
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  )
  with check (
    exists (
      select 1
      from public.project_template_phases p
      join public.project_templates t on t.id = p.template_id
      join public.memberships m on m.organization_id = t.organization_id
      where p.id = project_template_tasks.template_phase_id
        and t.organization_id is not null
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

drop policy if exists project_template_tasks_delete_owner_admin on public.project_template_tasks;
create policy project_template_tasks_delete_owner_admin
  on public.project_template_tasks
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.project_template_phases p
      join public.project_templates t on t.id = p.template_id
      join public.memberships m on m.organization_id = t.organization_id
      where p.id = project_template_tasks.template_phase_id
        and t.organization_id is not null
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

commit;
