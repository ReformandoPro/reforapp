begin;

do $$
declare r record; t text;
begin
  if (select count(*) from public.r1_acl_baseline) <> (select count(*) from public.r1_manifest_keys)
     or (select count(*) from public.r1_acl_baseline)=0
     or exists (select 1 from public.r1_acl_baseline b where not exists
       (select 1 from public.r1_manifest_keys k where k.key=format('%s:%s:%s:%s',b.schema_name,b.table_name,b.role_name,b.privilege_type))) then
    raise exception 'R1 rollback baseline manifest mismatch';
  end if;
  if exists (select 1 from public.r1_acl_baseline where role_name not in ('public','anon','authenticated','service_role')
    or privilege_type not in ('SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN')) then
    raise exception 'R1 rollback allow-list violation';
  end if;

  for r in select * from public.r1_acl_baseline order by table_name,role_name,privilege_type loop
    if r.had_privilege then
      execute format('grant %s on table %I.%I to %s%s',r.privilege_type,r.schema_name,r.table_name,case when r.role_name='public' then 'PUBLIC' else quote_ident(r.role_name) end,
        case when r.had_grant_option then ' with grant option' else '' end);
    else execute format('revoke %s on table %I.%I from %s',r.privilege_type,r.schema_name,r.table_name,case when r.role_name='public' then 'PUBLIC' else quote_ident(r.role_name) end);
    end if;
  end loop;
  for r in select * from public.r1_rls_baseline loop
    execute format('alter table %I.%I %s row level security',r.schema_name,r.table_name,case when r.had_row_security then 'enable' else 'disable' end);
    execute format('alter table %I.%I %s force row level security',r.schema_name,r.table_name,case when r.had_force_row_security then '' else 'no' end);
  end loop;
  for r in select * from public.r1_default_acl_baseline where was_modified loop
    execute format('alter default privileges for role %I in schema %I revoke all on tables from public,anon,authenticated,service_role',r.grantor,r.schema_name);
  end loop;
  for r in select * from public.r1_default_acl_baseline where was_modified and modification_supported and had_grant_option loop
    execute format('alter default privileges for role %I in schema %I grant %s on tables to %I with grant option',r.grantor,r.schema_name,r.privilege_type,r.role_name);
  end loop;
  for r in select * from public.r1_default_acl_baseline where was_modified and modification_supported and not had_grant_option loop
    execute format('alter default privileges for role %I in schema %I grant %s on tables to %I',r.grantor,r.schema_name,r.privilege_type,r.role_name);
  end loop;
  if exists (select 1 from public.r1_acl_baseline b where has_table_privilege(b.role_name,format('%I.%I',b.schema_name,b.table_name),b.privilege_type) is distinct from b.had_privilege) then
    raise exception 'R1 rollback privilege verification failed';
  end if;
  if exists (select 1 from public.r1_acl_baseline b where has_table_privilege(b.role_name,format('%I.%I',b.schema_name,b.table_name),b.privilege_type || ' WITH GRANT OPTION') is distinct from b.had_grant_option) then
    raise exception 'R1 rollback grant option verification failed';
  end if;
  if exists (select 1 from public.r1_rls_baseline b join pg_catalog.pg_class c on c.relname=b.table_name join pg_catalog.pg_namespace n on n.oid=c.relnamespace and n.nspname=b.schema_name where c.relrowsecurity is distinct from b.had_row_security or c.relforcerowsecurity is distinct from b.had_force_row_security) then
    raise exception 'R1 rollback RLS verification failed';
  end if;
  raise notice 'Rollback restores pre-R1 exposure by design';
  drop table public.r1_manifest_keys,public.r1_table_manifest,public.r1_default_acl_baseline,public.r1_rls_baseline,public.r1_acl_baseline;
end;
$$;

commit;
