begin;

-- Seed starter global project templates (organization_id is null)
-- Idempotent: safe to run multiple times; it will not create duplicates.

-- Ensure only one global default template can exist.
-- NOTE: the existing per-org unique index does not prevent multiple global defaults because organization_id is NULL.
create unique index if not exists project_templates_one_global_default
  on public.project_templates ((1))
  where organization_id is null and is_default;

-- Upsert templates by name (global scope)
with
  ensure_integral as (
    insert into public.project_templates (organization_id, name, description, is_default)
    select null, 'Reforma integral (base)', 'Plantilla base para una reforma integral con fases y tareas mínimas.', true
    where not exists (
      select 1 from public.project_templates t
      where t.organization_id is null and t.name = 'Reforma integral (base)'
    )
    returning id
  ),
  integral as (
    select id from ensure_integral
    union all
    select t.id from public.project_templates t
    where t.organization_id is null and t.name = 'Reforma integral (base)'
    limit 1
  ),
  ensure_quick as (
    insert into public.project_templates (organization_id, name, description, is_default)
    select null, 'Baño/Cocina (rápida)', 'Plantilla rápida para baño o cocina con estructura mínima.', false
    where not exists (
      select 1 from public.project_templates t
      where t.organization_id is null and t.name = 'Baño/Cocina (rápida)'
    )
    returning id
  ),
  quick as (
    select id from ensure_quick
    union all
    select t.id from public.project_templates t
    where t.organization_id is null and t.name = 'Baño/Cocina (rápida)'
    limit 1
  )
-- Normalize template flags (idempotent): integral is global default, quick is not.
update public.project_templates t
set is_default = case when t.name = 'Reforma integral (base)' then true else false end,
    updated_at = now()
where t.organization_id is null and t.name in ('Reforma integral (base)', 'Baño/Cocina (rápida)');

-- Re-seed phases/tasks deterministically.
-- Since global templates are not editable via app RLS, it's safe to replace their children.

-- Reforma integral (base)
with tpl as (
  select id as template_id
  from public.project_templates
  where organization_id is null and name = 'Reforma integral (base)'
  limit 1
),
cleanup as (
  delete from public.project_template_phases p
  using tpl
  where p.template_id = tpl.template_id
),
phases as (
  insert into public.project_template_phases (template_id, title, description, sort_order, default_status)
  select tpl.template_id, v.title, null, v.sort_order, 'planned'
  from tpl
  cross join (values
    (0, 'Preparación y medición'),
    (1, 'Demolición y desescombro'),
    (2, 'Instalaciones'),
    (3, 'Albañilería y revestimientos'),
    (4, 'Acabados'),
    (5, 'Revisión y entrega')
  ) as v(sort_order, title)
  returning id, title
),
tasks as (
  insert into public.project_template_tasks (
    template_phase_id,
    title,
    description,
    sort_order,
    default_status,
    default_priority
  )
  select p.id,
         t.title,
         null,
         t.sort_order,
         'pending',
         'medium'
  from phases p
  join (
    -- Preparación y medición
    select 'Preparación y medición'::text as phase_title, 0 as sort_order, 'Revisar alcance con cliente'::text as title
    union all select 'Preparación y medición', 1, 'Confirmar mediciones'
    union all select 'Preparación y medición', 2, 'Revisar permisos/licencias necesarios'

    -- Demolición y desescombro
    union all select 'Demolición y desescombro', 0, 'Proteger zonas comunes'
    union all select 'Demolición y desescombro', 1, 'Ejecutar demolición'
    union all select 'Demolición y desescombro', 2, 'Retirar escombros'

    -- Instalaciones
    union all select 'Instalaciones', 0, 'Revisar puntos de electricidad'
    union all select 'Instalaciones', 1, 'Revisar fontanería/climatización'
    union all select 'Instalaciones', 2, 'Validar rozas y pasos'

    -- Albañilería y revestimientos
    union all select 'Albañilería y revestimientos', 0, 'Levantar/regularizar paramentos'
    union all select 'Albañilería y revestimientos', 1, 'Colocar revestimientos principales'
    union all select 'Albañilería y revestimientos', 2, 'Revisar niveles y encuentros'

    -- Acabados
    union all select 'Acabados', 0, 'Pintura y remates'
    union all select 'Acabados', 1, 'Montaje de elementos finales'
    union all select 'Acabados', 2, 'Limpieza previa a entrega'

    -- Revisión y entrega
    union all select 'Revisión y entrega', 0, 'Revisar remates pendientes'
    union all select 'Revisión y entrega', 1, 'Validar checklist de entrega'
    union all select 'Revisión y entrega', 2, 'Confirmar entrega con cliente'
  ) t on t.phase_title = p.title
)
select 1;

-- Baño/Cocina (rápida)
with tpl as (
  select id as template_id
  from public.project_templates
  where organization_id is null and name = 'Baño/Cocina (rápida)'
  limit 1
),
cleanup as (
  delete from public.project_template_phases p
  using tpl
  where p.template_id = tpl.template_id
),
phases as (
  insert into public.project_template_phases (template_id, title, description, sort_order, default_status)
  select tpl.template_id, v.title, null, v.sort_order, 'planned'
  from tpl
  cross join (values
    (0, 'Preparación'),
    (1, 'Demolición'),
    (2, 'Instalaciones'),
    (3, 'Revestimientos y montaje'),
    (4, 'Remates y entrega')
  ) as v(sort_order, title)
  returning id, title
),
tasks as (
  insert into public.project_template_tasks (
    template_phase_id,
    title,
    description,
    sort_order,
    default_status,
    default_priority
  )
  select p.id,
         t.title,
         null,
         t.sort_order,
         'pending',
         'medium'
  from phases p
  join (
    -- Preparación
    select 'Preparación'::text as phase_title, 0 as sort_order, 'Confirmar diseño y materiales'::text as title
    union all select 'Preparación', 1, 'Proteger accesos y zonas comunes'

    -- Demolición
    union all select 'Demolición', 0, 'Retirar elementos existentes'
    union all select 'Demolición', 1, 'Gestionar escombros'

    -- Instalaciones
    union all select 'Instalaciones', 0, 'Revisar puntos de agua y electricidad'
    union all select 'Instalaciones', 1, 'Validar conexiones antes de cerrar'

    -- Revestimientos y montaje
    union all select 'Revestimientos y montaje', 0, 'Colocar revestimientos'
    union all select 'Revestimientos y montaje', 1, 'Montar sanitarios/mobiliario/equipos'

    -- Remates y entrega
    union all select 'Remates y entrega', 0, 'Revisar juntas y acabados'
    union all select 'Remates y entrega', 1, 'Limpiar zona de trabajo'
    union all select 'Remates y entrega', 2, 'Confirmar entrega con cliente'
  ) t on t.phase_title = p.title
)
select 1;

commit;
