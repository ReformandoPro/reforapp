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

begin;

-- -----------------------------------------------------------------------------
-- 0) Placeholders sanity check (fail fast if someone forgot to replace)
-- -----------------------------------------------------------------------------
DO $$
begin
  if '__OWNER1_USER_ID__' like '%__%' then
    raise exception 'Placeholders not replaced: __OWNER1_USER_ID__';
  end if;
  if '__MEMBER1_USER_ID__' like '%__%' then
    raise exception 'Placeholders not replaced: __MEMBER1_USER_ID__';
  end if;
  if '__OWNER2_USER_ID__' like '%__%' then
    raise exception 'Placeholders not replaced: __OWNER2_USER_ID__';
  end if;
  if '__NO_MEMBERSHIP_USER_ID__' like '%__%' then
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
    'in_progress',
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
    'scheduled',
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
    'budgeting',
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
    'in_progress',
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

-- 6.1) Phases (for project 1)
insert into public.project_phases (
  id, organization_id, project_id, title, description, status, start_date, end_date, sort_order
)
values
  ('eeeeeeee-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', 'Demolición', 'Retirada de sanitarios y alicatado antiguo.', 'done', '2026-06-01', '2026-06-03', 10),
  ('eeeeeeee-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', 'Instalaciones', 'Fontanería y electricidad.', 'in_progress', '2026-06-04', null, 20),
  ('eeeeeeee-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', 'Acabados', 'Alicatado, pintura y montaje.', 'planned', null, null, 30)
on conflict (id) do update
set title = excluded.title,
    description = excluded.description,
    status = excluded.status,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    sort_order = excluded.sort_order,
    updated_at = now();

-- 6.2) Tasks (project 1, some assigned to member1)
insert into public.project_tasks (
  id, organization_id, project_id, title, description, status, priority, due_date, assignee_user_id, phase_id
)
values
  ('ffffffff-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', 'Retirar sanitarios', null, 'done', 'high', '2026-06-02', '__MEMBER1_USER_ID__'::uuid, 'eeeeeeee-0000-0000-0000-000000000001'),
  ('ffffffff-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', 'Revisión fontanería', 'Comprobar tomas y desagües.', 'in_progress', 'urgent', '2026-06-06', '__OWNER1_USER_ID__'::uuid, 'eeeeeeee-0000-0000-0000-000000000002'),
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

-- 6.3) Progress updates (project 1)
insert into public.project_progress_updates (
  id, organization_id, project_id, author_user_id, progress, note
)
values
  ('99999999-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', '__OWNER1_USER_ID__'::uuid, 15, 'Demolición completada.'),
  ('99999999-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', '__MEMBER1_USER_ID__'::uuid, 35, 'Instalaciones en marcha; pendiente revisión de fontanería.')
on conflict (id) do update
set progress = excluded.progress,
    note = excluded.note;

-- 6.4) Costs (project 1)
insert into public.project_costs (
  id, organization_id, project_id, created_by_user_id, title, description, category, amount, tax_rate, cost_date, supplier_name, document_id
)
values
  ('88888888-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', '__OWNER1_USER_ID__'::uuid, 'Fontanería (material)', 'Tuberías, juntas, selladores.', 'material', 320.50, 21, '2026-06-04', 'Suministros Centro', null),
  ('88888888-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', '__OWNER1_USER_ID__'::uuid, 'Mano de obra demolición', null, 'labor', 450.00, 21, '2026-06-02', null, null)
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

-- 6.5) Budget + lines (project 1)
insert into public.project_budgets (
  id, organization_id, project_id, title, status, notes
)
values
  ('77777777-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', 'Presupuesto baño (demo)', 'draft', 'Presupuesto demo para QA. Sin validez comercial.')
on conflict (id) do update
set title = excluded.title,
    status = excluded.status,
    notes = excluded.notes,
    updated_at = now();

insert into public.project_budget_lines (
  id, organization_id, budget_id, project_id, description, quantity, unit_price, tax_rate, sort_order
)
values
  ('66666666-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '77777777-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'Retirada de sanitarios', 1, 280.00, 21, 10),
  ('66666666-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '77777777-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'Instalación fontanería', 1, 520.00, 21, 20),
  ('66666666-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '77777777-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'Alicatado y pintura', 1, 740.00, 21, 30)
on conflict (id) do update
set description = excluded.description,
    quantity = excluded.quantity,
    unit_price = excluded.unit_price,
    tax_rate = excluded.tax_rate,
    sort_order = excluded.sort_order,
    updated_at = now();

-- 6.6) Purchases + items (project 1)
insert into public.project_purchases (
  id, organization_id, project_id, created_by_user_id, title, supplier_name, status, expected_date, received_date, notes
)
values
  ('55555555-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', '__OWNER1_USER_ID__'::uuid, 'Compra materiales fontanería', 'Suministros Centro', 'ordered', '2026-06-05', null, 'Pedido demo para QA.')
on conflict (id) do update
set title = excluded.title,
    supplier_name = excluded.supplier_name,
    status = excluded.status,
    expected_date = excluded.expected_date,
    received_date = excluded.received_date,
    notes = excluded.notes,
    updated_at = now();

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

commit;
