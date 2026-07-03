begin;

alter table public.clients drop column if exists notes;
alter table public.clients drop column if exists address;

commit;
