begin;

alter table public.projects
  alter column client_id drop not null,
  alter column start_date drop not null,
  add column if not exists description text,
  add column if not exists expected_end_date date;

alter table public.projects
  drop constraint if exists projects_dates_check;

alter table public.projects
  add constraint projects_dates_check
  check (
    expected_end_date is null
    or start_date is null
    or expected_end_date >= start_date::date
  );

drop policy if exists projects_insert_owner_admin on public.projects;
create policy projects_insert_owner_admin
  on public.projects
  for insert
  to authenticated
  with check (
    public.is_org_admin(projects.organization_id)
    and (
      projects.client_id is null
      or public.is_client_in_org(projects.client_id, projects.organization_id)
    )
  );

drop policy if exists projects_update_owner_admin on public.projects;
create policy projects_update_owner_admin
  on public.projects
  for update
  to authenticated
  using (public.is_org_admin(projects.organization_id))
  with check (
    public.is_org_admin(projects.organization_id)
    and (
      projects.client_id is null
      or public.is_client_in_org(projects.client_id, projects.organization_id)
    )
  );

commit;
