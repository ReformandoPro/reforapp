-- STAGING DEMO SEED (Reformando.app)
-- =================================
-- ⚠️ DO NOT RUN IN PRODUCTION.
--
-- This script is intentionally NOT part of supabase/migrations.
-- It is meant to be run manually in the Supabase Dashboard (SQL Editor)
-- for a *staging* project with fake/demo data.
--
-- How to use:
-- 1) Create 4 Auth users manually in Supabase Staging (Dashboard → Authentication → Users)
-- 2) Copy their UUIDs
-- 3) Replace the placeholders below (search/replace) with real UUIDs:
--    - __OWNER1_USER_ID__
--    - __MEMBER1_USER_ID__
--    - __OWNER2_USER_ID__
--    - __NO_MEMBERSHIP_USER_ID__
-- 4) Run the script.
--
-- Notes:
-- - profiles are handled as **best-effort**:
--   the repo migrations create a trigger to auto-create profiles on auth.users insert.
--   This seed also includes an idempotent **fallback upsert** to ensure minimal
--   profiles exist for the demo users (safe with the trigger due to ON CONFLICT).
-- - project_documents are NOT seeded here (requires Storage + real files).

-- - project_task_comments are NOT seeded here either (kept as a future optional module).
-- - This seed is LEGACY-AWARE: optional module tables (project_phases,
--   project_progress_updates, project_budgets/project_budget_lines, project_costs,
--   project_purchases/project_purchase_items) are only seeded when their table
--   (and required columns, e.g. project_tasks.phase_id) already exist in this
--   environment. If a module/column is missing or incompatible, the seed emits a
--   RAISE NOTICE and skips just that module instead of failing. The core
--   (organizations, memberships, clients, projects) and project_tasks (when the
--   table exists) are always seeded.
begin;

-- -----------------------------------------------------------------------------
-- 0) Placeholders sanity check (fail fast if someone forgot to replace)
-- -----------------------------------------------------------------------------
DO $$
begin
  if position('__' in '__OWNER1_USER_ID__') > 0 then
    raise exception 'Placeholders not replaced: __OWNER1_USER_ID__';
  end if;
  if position('__' in '__MEMBER1_USER_ID__') > 0 then
    raise exception 'Placeholders not replaced: __MEMBER1_USER_ID__';
  end if;
  if position('__' in '__OWNER2_USER_ID__') > 0 then
    raise exception 'Placeholders not replaced: __OWNER2_USER_ID__';
  end if;
  if position('__' in '__NO_MEMBERSHIP_USER_ID__') > 0 then
    raise exception 'Placeholders not replaced: __NO_MEMBERSHIP_USER_ID__';
  end if;
end $$;

-- Cast placeholders (after replacement they will be UUID literals)
DO $$
declare
  owner1 uuid := '__OWNER1_USER_ID__'::uuid;
  member1 uuid := '__MEMBER1_USER_ID__'::uuid;
  owner2 uuid := '__OWNER2_USER_ID__'::uuid;
  nomem uuid := '__NO_MEMBERSHIP_USER_ID__'::uuid;
begin
  -- Ensure all are distinct (common copy/paste mistake)
  if owner1 = member1 or owner1 = owner2 or owner1 = nomem or member1 = owner2 or member1 = nomem or owner2 = nomem then
    raise exception 'Auth user UUIDs must be distinct (owner1/member1/owner2/nomembership).';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 1) Deterministic IDs for seeded entities (keep stable for idempotency)
-- -----------------------------------------------------------------------------
-- Organizations
-- Org 1: Reformas Ágiles S.L.
-- Org 2: Construcciones Seguras Ltda.

-- We use deterministic UUIDs for entities so the seed is re-runnable.
-- (Do NOT reuse these UUIDs in production.)

-- Org IDs
-- 11111111-... and 22222222-... are intentionally easy to recognize.

-- Org 1
--   id: 11111111-1111-1111-1111-111111111111
-- Org 2
--   id: 22222222-2222-2222-2222-222222222222

-- Clients (Org 1)
--   Familia Pérez:                     aaaaaaaa-0000-0000-0000-000000000001
--   Oficinas Central S.A.:             aaaaaaaa-0000-0000-0000-000000000002
--   Comunidad C/ Mayor, 22:            aaaaaaaa-0000-0000-0000-000000000003
-- Client (Org 2)
--   Cliente demo:                      bbbbbbbb-0000-0000-0000-000000000001

-- Projects (Org 1)
--   Reforma Integral Baño:             cccccccc-0000-0000-0000-000000000001
--   Habilitación Oficina Planta 3:     cccccccc-0000-0000-0000-000000000002
--   Reparación Fachada:                cccccccc-0000-0000-0000-000000000003
-- Project (Org 2)
--   Proyecto demo:                     dddddddd-0000-0000-0000-000000000001

-- Some module rows (phases/tasks/costs/budgets/purchases/progress updates)
-- are only created for the Org1 projects to keep the dataset small.

-- -----------------------------------------------------------------------------
-- 2) Organizations
-- -----------------------------------------------------------------------------
insert into public.organizations (id, name, slug)
values
  ('11111111-1111-1111-1111-111111111111', 'Reformas Ágiles S.L.', 'reformas-agiles'),
  ('22222222-2222-2222-2222-222222222222', 'Construcciones Seguras Ltda.', 'construcciones-seguras')
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    updated_at = now();

-- -----------------------------------------------------------------------------
-- 3) Memberships
-- -----------------------------------------------------------------------------
-- Org 1
insert into public.memberships (organization_id, user_id, role)
values
  ('11111111-1111-1111-1111-111111111111', '__OWNER1_USER_ID__'::uuid, 'owner'),
  ('11111111-1111-1111-1111-111111111111', '__MEMBER1_USER_ID__'::uuid, 'member')
on conflict (organization_id, user_id) do update
set role = excluded.role,
    updated_at = now();

-- Org 2
insert into public.memberships (organization_id, user_id, role)
values
  ('22222222-2222-2222-2222-222222222222', '__OWNER2_USER_ID__'::uuid, 'owner')
on conflict (organization_id, user_id) do update
set role = excluded.role,
    updated_at = now();

-- Intentionally NO membership for __NO_MEMBERSHIP_USER_ID__ (to test onboarding)

-- -----------------------------------------------------------------------------
-- 4) Clients
-- -----------------------------------------------------------------------------
insert into public.clients (id, organization_id, display_name, email, phone, address, notes)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Familia Pérez', null, null, 'C/ Jardines 7, Madrid', 'Cliente demo para reforma de baño.'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Oficinas Central S.A.', null, null, 'Av. Empresa 12, Barcelona', 'Cliente demo para obra en oficina.'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Comunidad de Vecinos C/ Mayor, 22', null, null, 'C/ Mayor 22, Valencia', 'Cliente demo para reparación de fachada.'),

  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Cliente Demo Org 2', null, null, 'C/ Segura 3, Sevilla', 'Cliente demo para probar aislamiento entre organizaciones.')
on conflict (id) do update
set display_name = excluded.display_name,
    email = excluded.email,
    phone = excluded.phone,
    address = excluded.address,
    notes = excluded.notes,
    updated_at = now();

-- -----------------------------------------------------------------------------
-- 5) Projects
-- -----------------------------------------------------------------------------
-- Note: projects has both (name) and legacy columns (title, client_name, start_date)

-- Resolve a projects.status value that the REAL projects_status_check
-- constraint (deployed in this environment) actually accepts. Two prior
-- attempts hardcoded a value from the canonical status list in
-- supabase/migrations/20260627090300_projects.sql ('budgeting', then
-- 'lead') and BOTH were rejected by the real legacy constraint on staging,
-- which differs from that migration (its "create table if not exists" is
-- a no-op against an already-existing legacy projects table). Instead of
-- guessing another literal, inspect the real constraint at runtime and use
-- the first candidate it actually allows for every demo project below.
create temporary table if not exists __seed_runtime_values (
  key text primary key,
  value text
  );

do $$
  declare
  constraint_def text;
allowed_values text[];
candidates text[] := array['scheduled', 'in_progress', 'active', 'open', 'draft', 'pending', 'completed'];
chosen text;
candidate text;
begin
  select pg_get_constraintdef(con.oid)
  into constraint_def
  from pg_constraint con
  where con.conname = 'projects_status_check'
  and con.conrelid = 'public.projects'::regclass;

if constraint_def is null then
  raise exception 'Seed aborted: could not find constraint projects_status_check on public.projects. Refusing to guess a projects.status value.';
end if;

select coalesce(array_agg(m[1]), array[]::text[])
  into allowed_values
  from regexp_matches(constraint_def, '''([^'']*)''', 'g') as m;

foreach candidate in array candidates loop
  if candidate = any (allowed_values) then
  chosen := candidate;
exit;
end if;
end loop;

if chosen is null then
  raise exception 'Seed aborted: none of the candidate projects.status values (%) are accepted by the real constraint. projects_status_check definition: %. Update the candidate list in supabase/seed/staging-demo.sql with a value this environment actually allows.', candidates, constraint_def;
end if;

insert into __seed_runtime_values (key, value) values ('project_status', chosen)
  on conflict (key) do update set value = excluded.value;

raise notice 'Seed: resolved projects.status = % (constraint allows: %)', chosen, allowed_values;
end $$;

insert into public.projects (
  id,
  organization_id,
  client_id,
  name,
  title,
  client_name,
  start_date,
  status,
  address,
  type,
  progress
)
values
  (
    'cccccccc-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Reforma Integral Baño - Familia Pérez',
    'Reforma Integral Baño - Familia Pérez',
    'Familia Pérez',
    '2026-06-01T00:00:00Z',
      (select value from __seed_runtime_values where key = 'project_status'),
      'C/ Jardines 7, Madrid',
        'bathroom',
  35
  ),
  (
    'cccccccc-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-0000-0000-0000-000000000002',
    'Habilitación Oficina Planta 3 - Oficinas Central S.A.',
    'Habilitación Oficina Planta 3 - Oficinas Central S.A.',
    'Oficinas Central S.A.',
    '2026-05-15T00:00:00Z',
      (select value from __seed_runtime_values where key = 'project_status'),
        'Av. Empresa 12, Barcelona',
          'office',
    0
  ),
  (
    'cccccccc-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-0000-0000-0000-000000000003',
    'Reparación Fachada - Comunidad C/ Mayor, 22',
    'Reparación Fachada - Comunidad C/ Mayor, 22',
    'Comunidad de Vecinos C/ Mayor, 22',
    '2026-04-20T00:00:00Z',
(select value from __seed_runtime_values where key = 'project_status'),
  'C/ Mayor 22, Valencia',
    'facade',
    10
  ),

  (
    'dddddddd-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'Proyecto Demo Org 2',
    'Proyecto Demo Org 2',
    'Cliente Demo Org 2',
    '2026-06-10T00:00:00Z',
(select value from __seed_runtime_values where key = 'project_status'),
  'C/ Segura 3, Sevilla',
    'general',
    20
  )
on conflict (id) do update
set client_id = excluded.client_id,
    name = excluded.name,
    title = excluded.title,
    client_name = excluded.client_name,
    start_date = excluded.start_date,
    status = excluded.status,
    address = excluded.address,
    type = excluded.type,
    progress = excluded.progress,
    updated_at = now();

-- -----------------------------------------------------------------------------
-- 6) Optional: module data (Org 1 only)
-- -----------------------------------------------------------------------------
-- Many module tables reference public.profiles(user_id).
-- The repo migrations create a trigger on auth.users to create profiles automatically,
-- but we also do a safe fallback upsert here to avoid seed blocking if profiles
-- weren't created yet for any reason.
--
-- NOTE: This does not create Auth users. Auth users must already exist.
insert into public.profiles (user_id, display_name, email)
values
  ('__OWNER1_USER_ID__'::uuid, 'Owner Org 1 (demo)', null),
  ('__MEMBER1_USER_ID__'::uuid, 'Member Org 1 (demo)', null),
  ('__OWNER2_USER_ID__'::uuid, 'Owner Org 2 (demo)', null),
  ('__NO_MEMBERSHIP_USER_ID__'::uuid, 'No Membership (demo)', null)
on conflict (user_id) do update
set display_name = excluded.display_name,
    updated_at = now();

-- Hard check: profiles must exist now (FK targets)
DO $$
begin
  if not exists (select 1 from public.profiles where user_id = '__OWNER1_USER_ID__'::uuid) then
    raise exception 'Missing public.profiles for OWNER1_USER_ID even after upsert.';
  end if;
  if not exists (select 1 from public.profiles where user_id = '__MEMBER1_USER_ID__'::uuid) then
    raise exception 'Missing public.profiles for MEMBER1_USER_ID even after upsert.';
  end if;
  if not exists (select 1 from public.profiles where user_id = '__OWNER2_USER_ID__'::uuid) then
    raise exception 'Missing public.profiles for OWNER2_USER_ID even after upsert.';
  end if;
  if not exists (select 1 from public.profiles where user_id = '__NO_MEMBERSHIP_USER_ID__'::uuid) then
    raise exception 'Missing public.profiles for NO_MEMBERSHIP_USER_ID even after upsert.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 6) Optional module data (Org 1 only) - LEGACY-AWARE
-- -----------------------------------------------------------------------------
-- Each optional module below is only seeded when its table (and any required
-- columns) already exist in this environment. These tables are created by
-- dedicated migrations that are themselves legacy-safe: on a staging project
-- where public.projects.id is still `text` (pre-uuid-normalization), those
-- migrations intentionally skip creating the module tables. When that happens,
-- this seed emits a RAISE NOTICE and continues instead of failing.

-- 6.1) Phases (for project 1) - optional module
do $$
begin
  if to_regclass('public.project_phases') is null then
    raise notice 'project_phases: skipped seed module because table public.project_phases does not exist (legacy staging schema not yet migrated for this module).';
  elsif not exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'project_phases' and column_name = 'project_id'
      ) then
    raise notice 'project_phases: skipped seed module because column public.project_phases.project_id does not exist.';
  else
    execute $ins$
      insert into public.project_phases (
            id, organization_id, project_id, title, description, status, start_date, end_date, sort_order
          )
      values
        ('eeeeeeee-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', 'Demolicion', 'Retirada de sanitarios y alicatado antiguo.', 'done', '2026-06-01', '2026-06-03', 10),
        ('eeeeeeee-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', 'Instalaciones', 'Fontaneria y electricidad.', 'in_progress', '2026-06-04', null, 20),
        ('eeeeeeee-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', 'Acabados', 'Alicatado, pintura y montaje.', 'planned', null, null, 30)
      on conflict (id) do update
      set title = excluded.title,
          description = excluded.description,
          status = excluded.status,
          start_date = excluded.start_date,
          end_date = excluded.end_date,
          sort_order = excluded.sort_order,
          updated_at = now();
    $ins$;
    raise notice 'project_phases: seeded demo rows (table exists and is compatible).';
  end if;
end $$;

-- 6.2) Tasks (project 1, some assigned to member1) - core module, legacy-aware for phase_id
do $$
declare
  has_phase_id boolean;
begin
  if to_regclass('public.project_tasks') is null then
    raise notice 'project_tasks: skipped seed module because table public.project_tasks does not exist.';
  else
    select exists (
          select 1 from information_schema.columns
          where table_schema = 'public' and table_name = 'project_tasks' and column_name = 'phase_id'
        ) into has_phase_id;

    if has_phase_id then
      execute $ins$
        insert into public.project_tasks (
                id, organization_id, project_id, title, description, status, priority, due_date, assignee_user_id, phase_id
              )
        values
          ('ffffffff-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', 'Retirar sanitarios', null, 'done', 'high', '2026-06-02', '__MEMBER1_USER_ID__'::uuid, 'eeeeeeee-0000-0000-0000-000000000001'),
          ('ffffffff-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', 'Revision fontaneria', 'Comprobar tomas y desagues.', 'in_progress', 'urgent', '2026-06-06', '__OWNER1_USER_ID__'::uuid, 'eeeeeeee-0000-0000-0000-000000000002'),
          ('ffffffff-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', 'Preparar presupuesto de acabados', null, 'pending', 'medium', '2026-06-12', null, 'eeeeeeee-0000-0000-0000-000000000003')
        on conflict (id) do update
        set title = excluded.title,
            description = excluded.description,
            status = excluded.status,
            priority = excluded.priority,
            due_date = excluded.due_date,
            assignee_user_id = excluded.assignee_user_id,
            phase_id = excluded.phase_id,
            updated_at = now();
      $ins$;
      raise notice 'project_tasks: seeded demo rows including phase_id (column present).';
    else
      execute $ins$
        insert into public.project_tasks (
                id, organization_id, project_id, title, description, status, priority, due_date, assignee_user_id
              )
        values
          ('ffffffff-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', 'Retirar sanitarios', null, 'done', 'high', '2026-06-02', '__MEMBER1_USER_ID__'::uuid),
          ('ffffffff-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', 'Revision fontaneria', 'Comprobar tomas y desagues.', 'in_progress', 'urgent', '2026-06-06', '__OWNER1_USER_ID__'::uuid),
          ('ffffffff-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', 'Preparar presupuesto de acabados', null, 'pending', 'medium', '2026-06-12', null)
        on conflict (id) do update
        set title = excluded.title,
            description = excluded.description,
            status = excluded.status,
            priority = excluded.priority,
            due_date = excluded.due_date,
            assignee_user_id = excluded.assignee_user_id,
            updated_at = now();
      $ins$;
      raise notice 'project_tasks: seeded demo rows WITHOUT phase_id because column public.project_tasks.phase_id does not exist (project_phases module not installed on this legacy staging schema).';
    end if;
  end if;
end $$;

-- 6.3) Progress updates (project 1) - optional module
do $$
begin
  if to_regclass('public.project_progress_updates') is null then
    raise notice 'project_progress_updates: skipped seed module because table public.project_progress_updates does not exist (legacy staging schema not yet migrated for this module).';
  elsif not exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'project_progress_updates' and column_name = 'project_id'
      ) then
    raise notice 'project_progress_updates: skipped seed module because column public.project_progress_updates.project_id does not exist.';
  else
    execute $ins$
      insert into public.project_progress_updates (
            id, organization_id, project_id, author_user_id, progress, note
          )
      values
        ('99999999-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', '__OWNER1_USER_ID__'::uuid, 15, 'Demolicion completada.'),
        ('99999999-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', '__MEMBER1_USER_ID__'::uuid, 35, 'Instalaciones en marcha; pendiente revision de fontaneria.')
      on conflict (id) do update
      set progress = excluded.progress,
          note = excluded.note;
    $ins$;
    raise notice 'project_progress_updates: seeded demo rows (table exists and is compatible).';
  end if;
end $$;

-- 6.4) Costs (project 1) - optional module
do $$
begin
  if to_regclass('public.project_costs') is null then
    raise notice 'project_costs: skipped seed module because table public.project_costs does not exist (legacy staging schema not yet migrated for this module).';
  elsif not exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'project_costs' and column_name = 'project_id'
      ) then
    raise notice 'project_costs: skipped seed module because column public.project_costs.project_id does not exist.';
  else
    execute $ins$
      insert into public.project_costs (
            id, organization_id, project_id, created_by_user_id, title, description, category, amount, tax_rate, cost_date, supplier_name, document_id
          )
      values
        ('88888888-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', '__OWNER1_USER_ID__'::uuid, 'Fontaneria (material)', 'Tuberias, juntas, selladores.', 'material', 320.50, 21, '2026-06-04', 'Suministros Centro', null),
        ('88888888-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', '__OWNER1_USER_ID__'::uuid, 'Mano de obra demolicion', null, 'labor', 450.00, 21, '2026-06-02', null, null)
      on conflict (id) do update
      set title = excluded.title,
          description = excluded.description,
          category = excluded.category,
          amount = excluded.amount,
          tax_rate = excluded.tax_rate,
          cost_date = excluded.cost_date,
          supplier_name = excluded.supplier_name,
          document_id = excluded.document_id,
          updated_at = now();
    $ins$;
    raise notice 'project_costs: seeded demo rows (table exists and is compatible).';
  end if;
end $$;

-- 6.5) Budget + lines (project 1) - optional module
do $$
begin
  if to_regclass('public.project_budgets') is null then
    raise notice 'project_budgets: skipped seed module because table public.project_budgets does not exist (legacy staging schema not yet migrated for this module).';
  elsif not exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'project_budgets' and column_name = 'project_id'
      ) then
    raise notice 'project_budgets: skipped seed module because column public.project_budgets.project_id does not exist.';
  else
    execute $ins$
      insert into public.project_budgets (
            id, organization_id, project_id, title, status, notes
          )
      values
        ('77777777-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', 'Presupuesto bano (demo)', 'draft', 'Presupuesto demo para QA. Sin validez comercial.')
      on conflict (id) do update
      set title = excluded.title,
          status = excluded.status,
          notes = excluded.notes,
          updated_at = now();
    $ins$;
    raise notice 'project_budgets: seeded demo rows (table exists and is compatible).';
  end if;

  if to_regclass('public.project_budget_lines') is null then
    raise notice 'project_budget_lines: skipped seed module because table public.project_budget_lines does not exist (legacy staging schema not yet migrated for this module).';
  elsif not exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'project_budget_lines' and column_name = 'budget_id'
      ) then
    raise notice 'project_budget_lines: skipped seed module because column public.project_budget_lines.budget_id does not exist.';
  elsif to_regclass('public.project_budgets') is null then
    raise notice 'project_budget_lines: skipped seed module because parent table public.project_budgets does not exist.';
  else
    execute $ins$
      insert into public.project_budget_lines (
            id, organization_id, budget_id, project_id, description, quantity, unit_price, tax_rate, sort_order
          )
      values
        ('66666666-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '77777777-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'Retirada de sanitarios', 1, 280.00, 21, 10),
        ('66666666-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '77777777-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'Instalacion fontaneria', 1, 520.00, 21, 20),
        ('66666666-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '77777777-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'Alicatado y pintura', 1, 740.00, 21, 30)
      on conflict (id) do update
      set description = excluded.description,
          quantity = excluded.quantity,
          unit_price = excluded.unit_price,
          tax_rate = excluded.tax_rate,
          sort_order = excluded.sort_order,
          updated_at = now();
    $ins$;
    raise notice 'project_budget_lines: seeded demo rows (table exists and is compatible).';
  end if;
end $$;

-- 6.6) Purchases + items (project 1) - optional module
do $$
begin
  if to_regclass('public.project_purchases') is null then
    raise notice 'project_purchases: skipped seed module because table public.project_purchases does not exist (legacy staging schema not yet migrated for this module).';
  elsif not exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'project_purchases' and column_name = 'project_id'
      ) then
    raise notice 'project_purchases: skipped seed module because column public.project_purchases.project_id does not exist.';
  else
    execute $ins$
      insert into public.project_purchases (
            id, organization_id, project_id, created_by_user_id, title, supplier_name, status, expected_date, received_date, notes
          )
      values
        ('55555555-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', '__OWNER1_USER_ID__'::uuid, 'Compra materiales fontaneria', 'Suministros Centro', 'ordered', '2026-06-05', null, 'Pedido demo para QA.')
      on conflict (id) do update
      set title = excluded.title,
          supplier_name = excluded.supplier_name,
          status = excluded.status,
          expected_date = excluded.expected_date,
          received_date = excluded.received_date,
          notes = excluded.notes,
          updated_at = now();
    $ins$;
    raise notice 'project_purchases: seeded demo rows (table exists and is compatible).';
  end if;

  if to_regclass('public.project_purchase_items') is null then
    raise notice 'project_purchase_items: skipped seed module because table public.project_purchase_items does not exist (legacy staging schema not yet migrated for this module).';
  elsif not exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'project_purchase_items' and column_name = 'purchase_id'
      ) then
    raise notice 'project_purchase_items: skipped seed module because column public.project_purchase_items.purchase_id does not exist.';
  elsif to_regclass('public.project_purchases') is null then
    raise notice 'project_purchase_items: skipped seed module because parent table public.project_purchases does not exist.';
  else
    execute $ins$
      insert into public.project_purchase_items (
            id, organization_id, purchase_id, project_id, description, quantity, unit, unit_price, tax_rate, sort_order
          )
      values
        ('44444444-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '55555555-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'Tubo PVC 32mm', 12, 'm', 4.50, 21, 10),
        ('44444444-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '55555555-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'Codos y uniones', 1, 'lote', 25.00, 21, 20)
      on conflict (id) do update
      set description = excluded.description,
          quantity = excluded.quantity,
          unit = excluded.unit,
          unit_price = excluded.unit_price,
          tax_rate = excluded.tax_rate,
          sort_order = excluded.sort_order,
          updated_at = now();
    $ins$;
    raise notice 'project_purchase_items: seeded demo rows (table exists and is compatible).';
  end if;
end $$;

-- 6.7) Task comments - optional module, NOT seeded on purpose
-- (kept for parity with project_documents: no demo comments are inserted here;
-- this just reports whether the table exists on this environment)
do $$
begin
  if to_regclass('public.project_task_comments') is null then
    raise notice 'project_task_comments: table does not exist on this environment (legacy staging schema); nothing to seed.';
  else
    raise notice 'project_task_comments: table exists but is intentionally NOT seeded by this script (optional module, no demo rows defined).';
  end if;
end $$;

commit;
