# Supabase projects first read

Date: 2026-06-03

Branch: `codex/supabase-projects-first-read`

Base commit: `03bcabf` (`merge: add Supabase adapter foundation`)

## 1. Current `/projects` state

Current route:

- `src/app/projects/page.tsx`

Current route behavior:

- reads `getProjectCards()`
- renders a list of `ProjectCard`
- is fully mock-backed today

Current route contract:

- route expects a synchronous `ProjectCard[]`
- route renders project `id`, `name`, `clientName`, `status`
- route also displays `delayedTasksCount`, `blockedTasksCount`, `pendingApprovalsCount`

## 2. Exact function consumed by `/projects`

Current call chain:

1. `/projects` calls `getProjectCards()`
2. `src/lib/services/projects.ts` delegates to `getProjects()` in `src/lib/data/index.ts`
3. `src/lib/data/index.ts` delegates to the mock projects repository

## 3. Current `ProjectCard[]` contract

Type:

- `src/lib/types/project.ts`

Shape:

- `id: string`
- `name: string`
- `clientName: string`
- `status: ProjectStatus`
- `delayedTasksCount: number`
- `blockedTasksCount: number`
- `pendingApprovalsCount: number`

Current mock source:

- `src/lib/mock/project.ts`

## 4. Required async change

Real Supabase reads are asynchronous.

To avoid breaking other routes, this branch will:

- keep `getProjectCards()` synchronous and mock-backed
- add an async function specific to the projects list route
- convert only `/projects` to await the async function

Recommended new flow:

1. `/projects` calls async `getProjectCardsForProjectsPage()`
2. service delegates to async adapter helper
3. helper tries Supabase if safely activatable
4. helper falls back to mock otherwise

Routes intentionally not touched:

- `/projects/[id]`
- `/projects/[id]/tasks`
- `/`
- `/budgets`
- `/budgets/[id]`

## 5. Files to touch

Allowed and expected:

- `docs/product/supabase-projects-first-read.md`
- `src/lib/data/index.ts`
- `src/lib/data/projects.ts`
- `src/lib/services/projects.ts`
- `src/app/projects/page.tsx`
- `tests/data/projects-first-read.test.ts`
- `tests/services/projects.test.ts`

No other runtime files should be necessary.

## 6. Proposed Supabase query

Primary table:

- `projects`

Join:

- `clients`

Conceptual query:

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
  .eq("organization_id", organizationId)
  .order("updated_at", { ascending: false });
```

## 7. Supabase -> `ProjectCard` mapping

Expected mapping:

- `projects.id` -> `ProjectCard.id`
- `projects.name` -> `ProjectCard.name`
- `clients.display_name` -> `ProjectCard.clientName`
- `projects.status` -> `ProjectCard.status`
- counters -> `0` in this first real read

Reason for controlled zero counters:

- `tasks` and `approvals` aggregates are not being connected in this branch
- the existing mapper already assumes those counters remain controlled values in first iteration

## 8. Fallback mock strategy

Fallback should happen when:

- public Supabase env vars are missing
- Supabase client cannot be created
- `organizationId` cannot be resolved explicitly
- query fails
- query returns no rows
- query returns rows that cannot be mapped safely

Fallback target:

- current mock `ProjectCard[]`

This keeps `/projects` usable during partial rollout.

## 9. `organizationId` status

Current blocker:

- the app still has no authenticated organization context wired into runtime
- using anon client without auth means RLS may legitimately return no rows

Safe temporary strategy for this branch:

- require explicit `NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID`
- only attempt the Supabase read when that value is present
- still rely on RLS; this env var is only a filter, not a privilege bypass

If `NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID` is absent:

- fallback to mock

## 10. Risks

- no auth/session yet means even a valid query may return no rows under correct RLS
- counters remain zero on successful Supabase reads in this first iteration
- route `/projects` becomes async while the rest of project routes stay sync/mock-backed
- if schema differs from the documented MVP schema, mapping will fail and route will fallback to mock

## 11. Rollback

Rollback is simple:

- revert `/projects` to synchronous `getProjectCards()`
- remove async helper usage
- leave adapter foundation untouched

At runtime, rollback can also be achieved by:

- unsetting `NEXT_PUBLIC_SUPABASE_URL`
- unsetting `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- unsetting `NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID`

## 12. Acceptance

This branch is acceptable if:

- `/projects` can read real Supabase cards when all activation conditions are met
- `/projects` falls back to mock for every unsafe or unavailable case
- no other routes are migrated
- no service role appears
- lint/build/test pass

## Debug logging

Fallback warnings are disabled by default.

To enable them temporarily (staging/demo), set:

- `NEXT_PUBLIC_SUPABASE_DEBUG=1`

This only affects console warnings; it does not change data access rules or security.
