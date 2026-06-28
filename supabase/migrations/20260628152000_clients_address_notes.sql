begin;

-- Optional columns for CRM notes.
alter table public.clients
  add column if not exists address text;

alter table public.clients
  add column if not exists notes text;

commit;
