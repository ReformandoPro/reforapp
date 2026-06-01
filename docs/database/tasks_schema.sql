-- docs/database/tasks_schema.sql
--
-- Documentation-only schema draft.
--
-- This file is NOT executed by the app and must not be wired to any migration
-- or deploy automation. It exists to align the future Supabase `tasks` table
-- with the current TypeScript contracts and mappers.
--
-- Domain statuses (src/lib/domain/tasks/status.ts):
--   todo | in_progress | blocked | done | cancelled
--
-- Notes:
-- - `isDelayed` is derived at read time from `due_date < today` (simple ISO date
--   comparison for MVP), and should not be persisted.
-- - `isBlocked` is derived at read time from `status = 'blocked'` OR
--   `blocked_reason IS NOT NULL`.

create table if not exists public.tasks (
  id text primary key,
  project_id text not null,
  title text not null,
  status text not null check (status in ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
  priority text not null check (priority in ('low', 'medium', 'high', 'urgent')),
  assignee_name text,
  due_date date,
  blocked_reason text,
  section_label text,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Recommended indexes for the expected access patterns.
create index if not exists tasks_project_id_idx on public.tasks (project_id);
create index if not exists tasks_project_id_sort_order_idx on public.tasks (project_id, sort_order);
