begin;

do $$
declare
  r record;
  owner_name name;
begin
  if not exists (select 1 from public.r1_acl_baseline)
     or not exists (select 1 from public.r1_rls_baseline)
     or not exists (select 1 from public.r1_table_manifest) then
    raise exception 'R1 rollback baseline is missing or incomplete';
  end if;

  for r in
    select b.*
    from public.r1_acl_baseline b
    order by b.schema_name, b.table_name, b.role_name, b.privilege_type
  loop
    if r.had_privilege then
      execute format('grant %s on table %I.%I to %I', r.privilege_type, r.schema_name, r.table_name, r.role_name);
      if r.had_grant_option then
        execute format('grant %s on table %I.%I to %I with grant option', r.privilege_type, r.schema_name, r.table_name, r.role_name);
      end if;
    else
      execute format('revoke %s on table %I.%I from %I', r.privilege_type, r.schema_name, r.table_name, r.role_name);
    end if;
  end loop;

  for r in
    select * from public.r1_rls_baseline order by table_name
  loop
    if r.had_row_security then
      execute format('alter table %I.%I enable row level security', r.schema_name, r.table_name);
    else
      execute format('alter table %I.%I disable row level security', r.schema_name, r.table_name);
    end if;
    if r.had_force_row_security then
      execute format('alter table %I.%I force row level security', r.schema_name, r.table_name);
    else
      execute format('alter table %I.%I no force row level security', r.schema_name, r.table_name);
    end if;
  end loop;

  for r in
    select distinct grantor::name as grantor
    from public.r1_default_acl_baseline
    where schema_name = 'public'
  loop
    owner_name := r.grantor;
    execute format(
      'alter default privileges for role %I in schema public revoke all on tables from public, anon, authenticated',
      owner_name
    );
  end loop;

  for r in select * from public.r1_default_acl_baseline loop
    execute format(
      'alter default privileges for role %I in schema %I grant %s on tables to %I%s',
      r.grantor, r.schema_name, r.privilege_type, r.role_name,
      case when r.had_grant_option then ' with grant option' else '' end
    );
  end loop;

  if exists (
    select 1
    from public.r1_acl_baseline b
    where has_table_privilege(b.role_name, format('%I.%I', b.schema_name, b.table_name), b.privilege_type)
      is distinct from b.had_privilege
  ) then
    raise exception 'R1 rollback privilege verification failed';
  end if;

  if exists (
    select 1
    from public.r1_rls_baseline b
    join pg_catalog.pg_class c on c.relname = b.table_name
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace and n.nspname = b.schema_name
    where c.relrowsecurity is distinct from b.had_row_security
       or c.relforcerowsecurity is distinct from b.had_force_row_security
  ) then
    raise exception 'R1 rollback RLS verification failed';
  end if;

  drop table public.r1_table_manifest;
  drop table public.r1_default_acl_baseline;
  drop table public.r1_rls_baseline;
  drop table public.r1_acl_baseline;
end;
$$;

commit;
