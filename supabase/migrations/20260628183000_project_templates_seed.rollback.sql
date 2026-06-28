begin;

-- Remove only the seeded global templates (and their children via cascade).

delete from public.project_templates
where organization_id is null
  and name in ('Reforma integral (base)', 'Baño/Cocina (rápida)');

-- Drop the global-default uniqueness index added in this migration.
drop index if exists public.project_templates_one_global_default;

commit;
