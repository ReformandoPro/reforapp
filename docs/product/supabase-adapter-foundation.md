# Supabase adapter foundation

Date: 2026-06-03

Branch: `codex/data-supabase-adapter-foundation`

Base commit: `905cf6a` (`merge: add MVP gap analysis`)

## 1. Purpose

This branch introduces the first safe data-access foundation for moving Reformando.app from mock-only runtime toward Supabase-backed data.

The implementation is intentionally conservative:

- current routes keep working;
- current mocks remain available;
- missing Supabase environment variables do not break build or runtime;
- no remote Supabase instance is touched;
- no migrations are executed;
- no product screens are replaced;
- no UI or visual migration is included.

## 2. Current data state before this branch

### Mock data locations

Current mock data lives in:

- `src/lib/mock/dashboard.ts`
- `src/lib/mock/project.ts`
- `src/lib/mock/tasks.ts`
- `src/lib/mock/budget.ts`

These mocks feed the current product routes through services and repositories.

### Current data consumers

| Area | Route/component | Current service |
|---|---|---|
| Dashboard | `src/app/page.tsx`, `ReformistDashboardScreen` | `getDashboardSummary()` |
| Projects list | `src/app/projects/page.tsx` | `getProjectCards()` |
| Project detail | `src/app/projects/[id]/page.tsx` | `getProjectOverview(id)` |
| Project tasks | `src/app/projects/[id]/tasks/page.tsx` | `getProjectTasks(projectId)` |
| Task status update | `src/app/projects/[id]/tasks/actions.ts` | `updateTaskStatus(taskId, status)` |
| Budgets list | `src/app/budgets/page.tsx` | `getBudgetSummaries()` |
| Budget detail | `src/app/budgets/[id]/page.tsx` | `getBudgetSummary(id)` |

### Current types/contracts

Relevant contracts live in:

- `src/lib/types/dashboard.ts`
- `src/lib/types/project.ts`
- `src/lib/types/project-overview.ts`
- `src/lib/types/project-task.ts`
- `src/lib/types/budget.ts`
- `src/lib/types/budget-view.ts`
- `src/lib/domain/projects/status.ts`
- `src/lib/domain/tasks/status.ts`
- `src/lib/domain/tasks/priority.ts`
- `src/lib/domain/budgets/status.ts`

### Existing Supabase code before this branch

Supabase dependency already exists in `package.json`:

- `@supabase/supabase-js`

Existing Supabase helpers before this branch:

- `src/lib/supabase/browser.ts`
- `src/lib/supabase/server.ts`

Existing Supabase repository skeletons:

- `src/lib/repositories/supabase-projects-repository.ts`
- `src/lib/repositories/supabase-projects-mapper.ts`
- `src/lib/repositories/supabase-tasks-repository.ts`
- `src/lib/repositories/supabase-tasks-mapper.ts`

Those repositories are not active in runtime yet.

## 3. Files changed in this branch

Code:

- `src/lib/env.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/browser.ts`
- `src/lib/supabase/server.ts`
- `src/lib/data/index.ts`
- `src/lib/services/dashboard.ts`
- `src/lib/services/projects.ts`
- `src/lib/services/budgets.ts`
- `src/lib/services/tasks.ts`

Tests:

- `tests/data/env.test.ts`
- `tests/data/data-adapter.test.ts`

Documentation:

- `docs/product/supabase-adapter-foundation.md`

Files intentionally not touched:

- `src/app/layout.tsx`
- `src/components/layout/AppShell.tsx`
- `src/app/design-reference/**`
- `src/components/screens/DesignReferenceScreen.*`
- global styles
- package files
- remote Supabase state
- beta/deploy configuration

## 4. Environment variables

The safe public Supabase configuration reads:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

New helper:

- `src/lib/env.ts`

Exports:

- `getSupabaseConfig()`
- `isSupabaseConfigured()`

Behavior:

- If both vars exist and are non-empty, `getSupabaseConfig()` returns `{ url, anonKey }`.
- If either var is missing, it returns `null`.
- It does not throw.

This branch does not use `SUPABASE_SERVICE_ROLE_KEY`.

## 5. Safe Supabase client behavior

New helper:

- `src/lib/supabase/client.ts`

Exports:

- `createOptionalSupabaseClient()`
- `isSupabaseClientAvailable()`

Behavior:

- If Supabase public env vars are configured, it creates a Supabase client with anon key.
- If env vars are missing, it returns `null`.
- It does not throw on missing env vars.
- It does not use service role key.

Updated helpers:

- `src/lib/supabase/browser.ts`
- `src/lib/supabase/server.ts`

Those now use the optional anon client path for regular public client creation.

## 6. Data adapter behavior

New central access point:

- `src/lib/data/index.ts`

Exports:

- `getDataAdapterMode()`
- `getDashboardSummary()`
- `getProjects()`
- `getProjectById(id)`
- `getProjectTasks(projectId)`
- `updateProjectTaskStatus(taskId, status)`
- `getBudgets()`
- `getBudgetById(id)`

Current runtime behavior:

- Without Supabase env vars: `getDataAdapterMode()` returns `mock`.
- With Supabase env vars: `getDataAdapterMode()` returns `supabase-configured-mock-fallback`.
- Data reads/writes still use the existing mock repositories.

Reason for conservative behavior:

- current route/service contracts are synchronous;
- real Supabase reads are asynchronous;
- table names and migrations are not active yet;
- the product must not break when env vars are present but tables are absent.

This branch creates the seam for the next branch to add async Supabase repositories deliberately.

## 7. Service centralization

The existing service files now delegate to `src/lib/data`.

Updated services:

- `src/lib/services/dashboard.ts`
- `src/lib/services/projects.ts`
- `src/lib/services/budgets.ts`
- `src/lib/services/tasks.ts`

Public service names remain the same, so current routes and screens do not need to change.

This preserves the current UI contract:

- `getDashboardSummary()`
- `getProjectCards()`
- `getProjectOverview(id)`
- `getProjectTasks(projectId)`
- `updateTaskStatus(taskId, status)`
- `getBudgetSummaries()`
- `getBudgetSummary(id)`

## 8. Behavior without Supabase configured

If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing:

- `getSupabaseConfig()` returns `null`;
- `createOptionalSupabaseClient()` returns `null`;
- app data access uses mock repositories;
- dashboard, projects, budgets and tasks keep working as before;
- task status updates continue using the in-memory mock repository;
- build/runtime should not fail because of missing Supabase env vars.

## 9. Behavior with Supabase configured

If both public Supabase env vars are configured:

- `getSupabaseConfig()` returns the public config;
- `createOptionalSupabaseClient()` can create an anon Supabase client;
- `getDataAdapterMode()` reports `supabase-configured-mock-fallback`;
- current product data still uses mock repositories.

This is intentional for the foundation branch. The next implementation branch should introduce opt-in Supabase reads for one contract at a time.

## 10. What still uses mocks

Everything still uses mock repositories in this branch:

- dashboard summary;
- project cards;
- project overview;
- project tasks;
- task status updates;
- budget summaries;
- budget detail.

This avoids breaking the app while the real schema and async repository path are still incomplete.

## 11. Minimal future table proposal

No migrations are added in this branch.

Minimum future tables for first real reads:

### `organizations`

- `id`
- `name`
- `created_at`

### `clients`

- `id`
- `organization_id`
- `display_name`
- `email`
- `phone`
- `created_at`

### `projects`

- `id`
- `organization_id`
- `client_id`
- `name`
- `status`
- `created_at`
- `updated_at`

First project query expected:

```ts
supabase
  .from("projects")
  .select(`
    id,
    name,
    status,
    client_id,
    client:clients (
      id,
      display_name
    )
  `)
  .eq("organization_id", organizationId);
```

### `tasks`

- `id`
- `organization_id`
- `project_id`
- `title`
- `status`
- `priority`
- `assignee_name`
- `due_date`
- `blocked_reason`
- `section_label`
- `sort_order`
- `created_at`
- `updated_at`

### `budgets`

- `id`
- `organization_id`
- `project_id`
- `status`
- `title`
- `target_margin_rate`
- `created_at`
- `updated_at`

### `budget_lines`

- `id`
- `organization_id`
- `budget_id`
- `description`
- `quantity`
- `unit`
- `estimated_cost`
- `sale_price`
- `sort_order`
- `created_at`
- `updated_at`

## 12. Risks

### Sync contracts vs async Supabase

Current services/routes are synchronous. Supabase reads are asynchronous. A future branch must decide whether to:

- make services async and update App Router pages to `await`;
- or add separate async repository functions behind server-only routes.

Do not hide async behavior behind unsafe synchronous APIs.

### Supabase configured but schema missing

Env vars may exist before tables do. This branch avoids runtime failure by keeping mock fallback active.

### Organization scoping

`organizationId` is still not resolved from Auth/session. Real Supabase reads must not launch without a safe organization context.

### RLS/Auth not implemented

This branch does not solve Auth or RLS. Future Supabase work must address access control before production usage.

### False sense of persistence

Task status updates are still in-memory mock updates. They are not durable.

## 13. Recommended next branches

1. `codex/data-supabase-async-read-spec`
   - Define how current sync services become async safely.
   - Decide App Router page changes.

2. `openclaw/data-projects-supabase-partial-read`
   - Implement real `ProjectCard[]` read from `projects + clients`.
   - Keep fallback mock if env/schema missing.

3. `openclaw/data-tasks-supabase-read-write`
   - Implement task reads and status persistence against Supabase.
   - Keep existing Server Action.

4. `openclaw/data-budgets-supabase-foundation`
   - Add budget and budget line persistence.
   - Use existing budget engine for totals/margins.

5. `openclaw/dashboard-real-aggregates`
   - Replace mock dashboard summary with real derived counts after projects/tasks/budgets are backed by Supabase.

## 14. Acceptance checklist for this branch

- No UI replacement.
- No route changes.
- No AppShell/layout changes.
- No `/design-reference` changes.
- No dependency additions.
- No migrations.
- No remote Supabase access.
- App data functions still return current mock data without env vars.
- Supabase config helpers do not throw when env vars are missing.
- Tests cover missing env fallback and configured-env detection.
