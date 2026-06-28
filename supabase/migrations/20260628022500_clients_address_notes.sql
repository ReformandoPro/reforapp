begin;

-- Optional fields for MVP client management.
alter table public.clients
  add column if not exists address text,
  add column if not exists notes text;

commit;

