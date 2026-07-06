begin;

create table if not exists public.project_task_issues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete restrict,
  task_id uuid not null references public.project_tasks(id) on delete cascade,
  reporter_user_id uuid not null references public.profiles(user_id) on delete restrict,
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists project_task_issues_task_id_idx
  on public.project_task_issues(task_id);

create index if not exists project_task_issues_org_id_idx
  on public.project_task_issues(organization_id);

commit;
