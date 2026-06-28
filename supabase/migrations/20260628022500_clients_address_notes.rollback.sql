begin;

alter table public.clients
  drop column if exists address,
  drop column if exists notes;

commit;

