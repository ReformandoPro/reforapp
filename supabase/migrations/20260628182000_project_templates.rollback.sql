begin;

-- Drop policies (safe if missing)
drop policy if exists project_template_tasks_delete_owner_admin on public.project_template_tasks;
drop policy if exists project_template_tasks_update_owner_admin on public.project_template_tasks;
drop policy if exists project_template_tasks_insert_owner_admin on public.project_template_tasks;
drop policy if exists project_template_tasks_select_authenticated on public.project_template_tasks;

drop policy if exists project_template_phases_delete_owner_admin on public.project_template_phases;
drop policy if exists project_template_phases_update_owner_admin on public.project_template_phases;
drop policy if exists project_template_phases_insert_owner_admin on public.project_template_phases;
drop policy if exists project_template_phases_select_authenticated on public.project_template_phases;

drop policy if exists project_templates_delete_owner_admin on public.project_templates;
drop policy if exists project_templates_update_owner_admin on public.project_templates;
drop policy if exists project_templates_insert_owner_admin on public.project_templates;
drop policy if exists project_templates_select_member on public.project_templates;
drop policy if exists project_templates_select_global_authenticated on public.project_templates;

-- Drop triggers
 drop trigger if exists set_updated_at_project_templates on public.project_templates;

-- Drop indexes
 drop index if exists public.project_template_tasks_sort_idx;
 drop index if exists public.project_template_tasks_phase_idx;
 drop index if exists public.project_template_phases_sort_idx;
 drop index if exists public.project_template_phases_template_idx;
 drop index if exists public.project_templates_name_idx;
 drop index if exists public.project_templates_org_idx;
 drop index if exists public.project_templates_one_default_per_org;

-- Drop tables (children first)
 drop table if exists public.project_template_tasks;
 drop table if exists public.project_template_phases;
 drop table if exists public.project_templates;

commit;
