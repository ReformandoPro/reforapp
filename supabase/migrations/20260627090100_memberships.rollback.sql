begin;

-- Rollback: memberships core bootstrap.

drop policy if exists memberships_delete_owner_admin on public.memberships;
drop policy if exists memberships_update_owner_admin on public.memberships;
drop policy if exists memberships_insert_owner_admin_or_bootstrap on public.memberships;
drop policy if exists memberships_select_member on public.memberships;

drop trigger if exists set_updated_at_memberships on public.memberships;

drop table if exists public.memberships;

commit;
