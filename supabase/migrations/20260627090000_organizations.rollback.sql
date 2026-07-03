begin;

-- Rollback: organizations core bootstrap.

drop trigger if exists set_updated_at_organizations on public.organizations;

drop index if exists organizations_created_at_idx;
drop index if exists organizations_slug_unique;

drop table if exists public.organizations;

commit;
