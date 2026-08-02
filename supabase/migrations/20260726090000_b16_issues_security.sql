begin;

-- B16 text contract: trim only the explicit Unicode edge-whitespace set used
-- by the TypeScript service; internal whitespace is preserved.
create or replace function public.trim_project_task_issue_whitespace(input text)
returns text
language sql
immutable
strict
set search_path = pg_catalog, public
as $$
  select btrim(
    input,
    chr(9) || chr(10) || chr(11) || chr(12) || chr(13) || chr(32)
      || chr(160) || chr(5760)
      || chr(8192) || chr(8193) || chr(8194) || chr(8195) || chr(8196)
      || chr(8197) || chr(8198) || chr(8199) || chr(8200) || chr(8201) || chr(8202)
      || chr(8232) || chr(8233) || chr(8239) || chr(8287) || chr(12288) || chr(65279)
  );
$$;

do $$
declare
  incoherent_relationships bigint;
  invalid_descriptions bigint;
  missing_projects bigint;
  missing_tasks bigint;
  missing_reporters bigint;
begin
  select count(*)
  into incoherent_relationships
  from public.project_task_issues i
  left join public.projects p
    on p.id = i.project_id
   and p.organization_id = i.organization_id
  left join public.project_tasks t
    on t.id = i.task_id
   and t.project_id = i.project_id
   and t.organization_id = i.organization_id
  where p.id is null
     or t.id is null;

  select count(*)
  into invalid_descriptions
  from public.project_task_issues
  where description is null
     or char_length(public.trim_project_task_issue_whitespace(description)) not between 1 and 2000;

  select count(*)
  into missing_projects
  from public.project_task_issues i
  left join public.projects p on p.id = i.project_id
  where p.id is null;

  select count(*)
  into missing_tasks
  from public.project_task_issues i
  left join public.project_tasks t on t.id = i.task_id
  where t.id is null;

  select count(*)
  into missing_reporters
  from public.project_task_issues i
  left join public.profiles p on p.user_id = i.reporter_user_id
  where p.user_id is null;

  if incoherent_relationships > 0
     or invalid_descriptions > 0
     or missing_projects > 0
     or missing_tasks > 0
     or missing_reporters > 0 then
    raise exception
      'project_task_issues validation failed: relationships=%, descriptions=%, missing_projects=%, missing_tasks=%, missing_reporters=%',
      incoherent_relationships,
      invalid_descriptions,
      missing_projects,
      missing_tasks,
      missing_reporters;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_task_issues_description_check'
      and conrelid = 'public.project_task_issues'::regclass
  ) then
    alter table public.project_task_issues
      add constraint project_task_issues_description_check
      check (
        char_length(public.trim_project_task_issue_whitespace(description)) between 1 and 2000
      );
  end if;
end $$;

create or replace function public.validate_project_task_issue_relationship()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not exists (
    select 1
    from public.projects p
    where p.id = new.project_id
      and p.organization_id = new.organization_id
  ) then
    raise exception 'project_task_issues project does not belong to organization';
  end if;

  if not exists (
    select 1
    from public.project_tasks t
    where t.id = new.task_id
      and t.project_id = new.project_id
      and t.organization_id = new.organization_id
  ) then
    raise exception 'project_task_issues task does not belong to project and organization';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_project_task_issue_relationship() from public;

drop trigger if exists validate_project_task_issue_relationship on public.project_task_issues;
create trigger validate_project_task_issue_relationship
before insert or update on public.project_task_issues
for each row
execute function public.validate_project_task_issue_relationship();

alter table public.project_task_issues enable row level security;

drop policy if exists project_task_issues_select_member on public.project_task_issues;
create policy project_task_issues_select_member
on public.project_task_issues
for select
to authenticated
using (
  auth.uid() is not null
  and exists (
    select 1
    from public.memberships m
    where m.organization_id = project_task_issues.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'member')
  )
  and exists (
    select 1
    from public.projects p
    where p.id = project_task_issues.project_id
      and p.organization_id = project_task_issues.organization_id
  )
  and exists (
    select 1
    from public.project_tasks t
    where t.id = project_task_issues.task_id
      and t.project_id = project_task_issues.project_id
      and t.organization_id = project_task_issues.organization_id
  )
);

drop policy if exists project_task_issues_insert_member on public.project_task_issues;
create policy project_task_issues_insert_member
on public.project_task_issues
for insert
to authenticated
with check (
  auth.uid() is not null
  and exists (
    select 1
    from public.memberships m
    where m.organization_id = project_task_issues.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'member')
  )
  and project_task_issues.reporter_user_id = auth.uid()
  and exists (
    select 1
    from public.projects p
    where p.id = project_task_issues.project_id
      and p.organization_id = project_task_issues.organization_id
  )
  and exists (
    select 1
    from public.project_tasks t
    where t.id = project_task_issues.task_id
      and t.project_id = project_task_issues.project_id
      and t.organization_id = project_task_issues.organization_id
  )
);

commit;
