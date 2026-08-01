begin;

do $$
declare
  baseline record;
begin
  if to_regclass('public.authenticated_operational_grant_baseline') is null then
    raise exception 'Operational grant rollback requires its baseline snapshot';
  end if;

  if (
    select count(*)
    from public.authenticated_operational_grant_baseline
  ) <> 8
  or exists (
    select 1
    from public.authenticated_operational_grant_baseline
    where privilege_key not in (
      'project_phases_select',
      'projects_update',
      'project_tasks_update',
      'project_phases_insert',
      'project_phases_update',
      'project_phases_delete',
      'projects_delete',
      'project_tasks_delete'
    )
  ) then
    raise exception 'Operational grant rollback requires a coherent baseline snapshot';
  end if;

  for baseline in
    select * from public.authenticated_operational_grant_baseline
  loop
    if baseline.had_privilege then
      execute format(
        'grant %s on table %s to authenticated',
        baseline.privilege_name,
        baseline.table_name
      );
    else
      execute format(
        'revoke %s on table %s from authenticated',
        baseline.privilege_name,
        baseline.table_name
      );
    end if;

    if has_table_privilege(
      'authenticated',
      baseline.table_name,
      baseline.privilege_name
    ) is distinct from baseline.had_privilege then
      raise exception 'Privilege % was not restored to its baseline state', baseline.privilege_key;
    end if;
  end loop;
end;
$$;

drop table public.authenticated_operational_grant_baseline;

commit;
