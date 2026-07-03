begin;

-- Rollback: clients core bootstrap.

drop trigger if exists set_updated_at_clients on public.clients;

drop index if exists clients_org_updated_at_idx;
drop index if exists clients_org_display_name_idx;

drop table if exists public.clients;

commit;
