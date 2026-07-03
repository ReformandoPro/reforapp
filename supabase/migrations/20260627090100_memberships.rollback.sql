begin;

-- Rollback: memberships core bootstrap.

drop trigger if exists set_updated_at_memberships on public.memberships;

drop index if exists memberships_org_role_idx;
drop index if exists memberships_user_id_idx;

drop table if exists public.memberships;

commit;
