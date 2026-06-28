begin;

alter table public.projects
  drop column if exists archived_at;

commit;

