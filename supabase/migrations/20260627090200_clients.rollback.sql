begin;

-- Rollback: clients core bootstrap.

drop policy if exists clients_delete_owner_admin on public.clients;
drop policy if exists clients_update_owner_admin on public.clients;
drop policy if exists clients_insert_owner_admin on public.clients;
drop policy if exists clients_select_member on public.clients;

drop trigger if exists set_updated_at_clients on public.clients;

drop table if exists public.clients;

commit;
