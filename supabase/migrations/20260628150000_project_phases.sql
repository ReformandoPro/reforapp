begin;

-- Project phases + optional task linkage: only applied when the legacy
-- staging schema is already on the canonical uuid model. In legacy staging,
-- organizations.id and/or projects.id may still be text, and public.project_tasks
-- may not yet be fully on the uuid model either, so project_phases.project_id
-- (uuid) cannot reference projects.id, and altering project_tasks with a uuid
-- phase_id column, FK, index and updated policies would leave the module in a
-- partial state. This migration does not reference public.profiles.user_id,
-- public.clients.id or public.project_documents.id.
do $outer$
declare
  organizations_id_is_uuid boolean;
  projects_id_is_uuid boolean;
  project_tasks_id_is_uuid boolean;
  project_tasks_project_id_is_uuid boolean;
  schema_is_compatible boolean;
begin
  select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'organizations'
        and column_name = 'id' and data_type = 'uuid'
    ) into organizations_id_is_uuid;

  select exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'projects'
          and column_name = 'id' and data_type = 'uuid'
      ) into projects_id_is_uuid;

  select exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'project_tasks'
          and column_name = 'id' and data_type = 'uuid'
      ) into project_tasks_id_is_uuid;

  select exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'project_tasks'
          and column_name = 'project_id' and data_type = 'uuid'
      ) into project_tasks_project_id_is_uuid;

  schema_is_compatible :=
    organizations_id_is_uuid
    and projects_id_is_uuid
    and project_tasks_id_is_uuid
    and project_tasks_project_id_is_uuid;

  if schema_is_compatible then
    execute $inner$
      create table if not exists public.project_phases (
            id uuid primary key default gen_random_uuid(),
            organization_id uuid not null references public.organizations(id) on delete restrict,
            project_id uuid not null references public.projects(id) on delete restrict,
            title text not null,
            description text,
            status text not null default 'planned',
            start_date date,
            end_date date,
            sort_order integer not null default 0,
            created_at timestamptz not null default now(),
            updated_at timestamptz not null default now(),
            constraint project_phases_status_check check (status in ('planned','in_progress','done','blocked','cancelled'))
          );

      create index if not exists project_phases_org_project_sort_idx
        on public.project_phases(organization_id, project_id, sort_order);

      create index if not exists project_phases_org_project_status_idx
        on public.project_phases(organization_id, project_id, status);

      alter table public.project_phases enable row level security;

      drop trigger if exists set_updated_at_project_phases on public.project_phases;
      create trigger set_updated_at_project_phases
      before update on public.project_phases
      for each row
      execute function public.set_updated_at();

      -- Optional task linkage
      alter table public.project_tasks
      add column if not exists phase_id uuid null;

      do $fk$
      begin
        if not exists (
                  select 1
                  from pg_constraint
                  where conname = 'project_tasks_phase_fk'
                ) then
          alter table public.project_tasks
          add constraint project_tasks_phase_fk
          foreign key (phase_id)
          references public.project_phases(id)
          on delete set null;
        end if;
      end $fk$;

      create index if not exists project_tasks_phase_id_idx
        on public.project_tasks(phase_id);

      -- RLS: phases

      drop policy if exists project_phases_select_member on public.project_phases;
      create policy project_phases_select_member
      on public.project_phases
      for select
      to authenticated
      using (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_phases.organization_id
                  and m.user_id = auth.uid()
                )
              );

      -- Writes: owner/admin + project belongs to org

      drop policy if exists project_phases_insert_owner_admin on public.project_phases;
      create policy project_phases_insert_owner_admin
      on public.project_phases
      for insert
      to authenticated
      with check (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_phases.organization_id
                  and m.user_id = auth.uid()
                  and m.role in ('owner','admin')
                )
                and exists (
                  select 1
                  from public.projects p
                  where p.organization_id = project_phases.organization_id
                  and p.id = project_phases.project_id
                )
              );

      drop policy if exists project_phases_update_owner_admin on public.project_phases;
      create policy project_phases_update_owner_admin
      on public.project_phases
      for update
      to authenticated
      using (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_phases.organization_id
                  and m.user_id = auth.uid()
                  and m.role in ('owner','admin')
                )
              )
      with check (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_phases.organization_id
                  and m.user_id = auth.uid()
                  and m.role in ('owner','admin')
                )
                and exists (
                  select 1
                  from public.projects p
                  where p.organization_id = project_phases.organization_id
                  and p.id = project_phases.project_id
                )
              );

      drop policy if exists project_phases_delete_owner_admin on public.project_phases;
      create policy project_phases_delete_owner_admin
      on public.project_phases
      for delete
      to authenticated
      using (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_phases.organization_id
                  and m.user_id = auth.uid()
                  and m.role in ('owner','admin')
                )
              );

      -- Update task policies to validate phase belongs to same org+project (if set) and preserve assignee constraints.

      drop policy if exists project_tasks_insert_owner_admin on public.project_tasks;
      create policy project_tasks_insert_owner_admin
      on public.project_tasks
      for insert
      to authenticated
      with check (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_tasks.organization_id
                  and m.user_id = auth.uid()
                  and m.role in ('owner','admin')
                )
                and exists (
                  select 1
                  from public.projects p
                  where p.organization_id = project_tasks.organization_id
                  and p.id = project_tasks.project_id
                )
                and (
                  project_tasks.assignee_user_id is null
                  or exists (
                    select 1
                    from public.memberships am
                    where am.organization_id = project_tasks.organization_id
                    and am.user_id = project_tasks.assignee_user_id
                  )
                )
                and (
                  project_tasks.phase_id is null
                  or exists (
                    select 1
                    from public.project_phases ph
                    where ph.organization_id = project_tasks.organization_id
                    and ph.project_id = project_tasks.project_id
                    and ph.id = project_tasks.phase_id
                  )
                )
              );

      drop policy if exists project_tasks_update_owner_admin on public.project_tasks;
      create policy project_tasks_update_owner_admin
      on public.project_tasks
      for update
      to authenticated
      using (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_tasks.organization_id
                  and m.user_id = auth.uid()
                  and m.role in ('owner','admin')
                )
              )
      with check (
                exists (
                  select 1
                  from public.memberships m
                  where m.organization_id = project_tasks.organization_id
                  and m.user_id = auth.uid()
                  and m.role in ('owner','admin')
                )
                and exists (
                  select 1
                  from public.projects p
                  where p.organization_id = project_tasks.organization_id
                  and p.id = project_tasks.project_id
                )
                and (
                  project_tasks.assignee_user_id is null
                  or exists (
                    select 1
                    from public.memberships am
                    where am.organization_id = project_tasks.organization_id
                    and am.user_id = project_tasks.assignee_user_id
                  )
                )
                and (
                  project_tasks.phase_id is null
                  or exists (
                    select 1
                    from public.project_phases ph
                    where ph.organization_id = project_tasks.organization_id
                    and ph.project_id = project_tasks.project_id
                    and ph.id = project_tasks.phase_id
                  )
                )
              );
    $inner$;
  else
    raise notice 'project_phases: skipped table/index/trigger/constraint/policy creation (project_phases) and project_tasks phase linkage (column/FK/index/policies) because legacy staging schema is not compatible with the canonical uuid model (organizations.id uuid=%, projects.id uuid=%, project_tasks.id uuid=%, project_tasks.project_id uuid=%). This avoids leaving a partial project_phases module or a partial project_tasks alteration while legacy columns are still text and will be normalized in a follow-up migration.',
      organizations_id_is_uuid, projects_id_is_uuid, project_tasks_id_is_uuid, project_tasks_project_id_is_uuid;
  end if;
end
$outer$;

commit;
