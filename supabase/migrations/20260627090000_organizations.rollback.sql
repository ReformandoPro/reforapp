begin;

-- Rollback: organizations core bootstrap.

drop policy if exists organizations_delete_owner_admin on public.organizations;
drop policy if exists organizations_update_owner_admin on public.organizations;
drop policy if exists organizations_insert_authenticated on public.organizations;
drop policy if exists organizations_select_member on public.organizations;

drop trigger if exists set_updated_at_organizations on public.organizations;

drop table if exists public.organizations;

commit;
