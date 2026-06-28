begin;

-- Adds soft-archive support for projects without changing ProjectStatus contract.
alter table public.projects
  add column if not exists archived_at timestamptz;

commit;

