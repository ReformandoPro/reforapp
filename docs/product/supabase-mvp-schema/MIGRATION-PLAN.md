# Supabase MVP Schema Migration Plan

## Guiding Rule

Do not connect UI to Supabase before the schema, RLS and seed data have been reviewed and validated in a non-production Supabase project.

## Phase 1: Schema, RLS And Seed Only

Recommended branch:

- `openclaw/supabase-mvp-schema-migration`

Goal:

- turn this specification into a real migration artifact;
- run it against a local or staging Supabase project;
- do not connect the UI yet.

Likely files:

- `supabase/migrations/<timestamp>_mvp_schema.sql` or project-equivalent migration path;
- optional seed file under `supabase/seed.sql`;
- no `src/` changes.

Acceptance criteria:

- tables exist;
- RLS is enabled on all business tables;
- owner/admin/project_manager can read demo organization data;
- unauthenticated requests cannot read business tables;
- seed data supports dashboard, projects, tasks and budgets;
- `npm run lint`, `npm run build`, `npm run test` still pass.

Rollback:

- drop migration in local/staging before production;
- do not apply to production until reviewed.

Risks:

- auth seed requires real `auth.users` records or a controlled Supabase seed process;
- policies may be too permissive for future client portal if enabled too early.

## Phase 2: Connect One Read Path

Recommended branch:

- `codex/data-supabase-project-cards-read`

Goal:

- connect only `getProjectCards()` / `/projects` to Supabase when env vars are configured;
- keep mock fallback when not configured or query fails in a controlled way.

Likely files:

- `src/lib/repositories/supabase-projects-repository.ts`;
- `src/lib/repositories/supabase-projects-mapper.ts`;
- `src/lib/application/repositories/projects-repository-factory.ts`;
- `src/lib/data/index.ts` if adapter branch is merged;
- tests for mapper/repository fallback.

Acceptance criteria:

- `/projects` renders real Supabase projects in staging;
- missing env vars still render mocks;
- invalid project status is rejected by mapper;
- no route or UI restructuring.

Rollback:

- force data adapter mode back to mock;
- no schema rollback required.

Risks:

- current route/service contracts are synchronous in `main`; this may require a deliberate async migration after adapter review.

## Phase 3: Connect Dashboard Reads

Recommended branch:

- `codex/data-supabase-dashboard-read`

Goal:

- compute dashboard summary from `projects`, `tasks`, `budgets`, `approvals` and `incidents`.

Likely files:

- `src/lib/repositories/supabase-dashboard-repository.ts` if created;
- `src/lib/repositories/dashboard-repository.ts`;
- `src/lib/services/dashboard.ts`;
- `src/app/page.tsx` only if async route migration is required.

Acceptance criteria:

- dashboard counters match seeded data;
- operational alerts come from open incidents and pending approvals;
- active projects are organization scoped;
- mock fallback remains intact.

Rollback:

- switch dashboard repository back to mock.

Risks:

- aggregate queries can become complex; keep MVP counts simple and indexed.

## Phase 4: Minimal Write Path

Recommended branch:

- `codex/data-supabase-task-status-write`

Goal:

- persist `updateTaskStatus(taskId, status)` to Supabase.

Likely files:

- `src/lib/repositories/supabase-tasks-repository.ts`;
- `src/lib/repositories/supabase-tasks-mapper.ts`;
- `src/app/projects/[id]/tasks/actions.ts` only if needed for async/error handling;
- tests for valid/invalid status, not found and RLS failure.

Acceptance criteria:

- task status survives refresh/restart;
- invalid status is rejected before write;
- worker role cannot modify unrelated organization tasks;
- task list updates after write;
- mock fallback still supports local no-env mode.

Rollback:

- route action returns to mock repository;
- no data deletion needed.

Risks:

- worker field-level restrictions are hard with table-level RLS. Consider a narrow RPC for task status updates after initial staging validation.

## Phase 5: Budget Reads And Lines

Recommended branch:

- `codex/data-supabase-budget-read`

Goal:

- load budget summaries and detail from `budgets` and `budget_lines`.

Likely files:

- new Supabase budgets repository and mapper;
- budget repository factory;
- budget tests.

Acceptance criteria:

- `/budgets` shows seeded budgets;
- `/budgets/[id]` shows detail from real header data;
- internal margin fields are not exposed to client routes.

Rollback:

- switch budgets repository back to mock.

Risks:

- current `BudgetView` does not yet include lines. Avoid over-expanding UI in this phase.

## Recommended Sequence After Adapter Approval

1. Merge/review `codex/data-supabase-adapter-foundation`.
2. Review this schema spec.
3. Create migration branch against staging/local Supabase.
4. Connect `/projects` read only.
5. Connect `/projects/[id]/tasks` read only.
6. Persist task status update.
7. Connect dashboard aggregation.
8. Connect budgets read.

This order validates persistence without attacking every route at once.
