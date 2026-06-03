# Supabase first real read spec

Date: 2026-06-03

Branch: `codex/supabase-first-real-read-spec`

Base branch: `main`

Scope: documentation only. This branch does not modify runtime code.

## 1. Initial entity decision

Recommended first real entity: `projects`

Reasoning:

- `projects` already has a partial Supabase repository skeleton and mapper in the repo:
  - `src/lib/repositories/supabase-projects-repository.ts`
  - `src/lib/repositories/supabase-projects-mapper.ts`
- `projects` gives immediate visible value through existing routes:
  - `/projects`
  - `/projects/[id]`
- the first safe read can be narrowed to `ProjectCard[]`, which needs only `projects + clients` and does not require task writes, budget math or document storage.
- `projects` is the natural backbone for later reads:
  - dashboard active projects
  - project detail
  - task/project joins
  - budget/project joins

Why not `tasks` first:

- `tasks` are tightly coupled to an existing mutation path (`updateTaskStatusAction`).
- a tasks-first read invites early pressure to connect writes in the same branch.
- `tasks` depend more directly on delayed/blocked derivation and assignee display.

Why not `budgets` first:

- `budgets` are more sensitive because they carry internal cost and margin fields.
- a safe first read should avoid mixing business-sensitive totals with client-visible concerns.

Current mock equivalents:

- `src/lib/mock/project.ts`
  - `mockProjectCards`
  - `mockProjectOverview`

Schema support:

- main table: `projects`
- supporting join: `clients`
- future counters: `tasks`, `approvals`, `incidents`

## 2. Current contract

This section combines current `main` contracts with the adapter foundation contract proposed in `codex/data-supabase-adapter-foundation`.

### Current `main` service contract

File: `src/lib/services/projects.ts`

Functions:

- `getProjectCards(): ProjectCard[]`
- `getProjectOverview(projectId: string): ProjectOverview | undefined`

Characteristics:

- synchronous
- mock-backed through `createProjectsRepository({ dataSource: "mock" })`
- consumed directly by App Router pages

Consumers:

- `/projects` uses `getProjectCards()`
- `/projects/[id]` uses `getProjectOverview(id)`
- `/projects/[id]/tasks` uses `getProjectOverview(id)` for route header context

Risk if contract changes:

- high, because these routes currently call sync functions during render.
- converting them to async changes route signatures and the service boundary.

### Adapter foundation contract

If `codex/data-supabase-adapter-foundation` lands, the data seam becomes:

- `getProjects(): ProjectCard[]`
- `getProjectById(projectId: string): ProjectOverview | undefined`

Service aliases remain:

- `getProjectCards(): ProjectCard[]`
- `getProjectOverview(projectId: string): ProjectOverview | undefined`

Meaning:

- the future first real read should target the adapter-level function names first.
- the service contract should remain stable for routes.

### Contract table

| Function | Current signature | Sync/async | Return type | Consumers | Risk if changed |
|---|---|---|---|---|---|
| `getProjects()` | adapter-only in foundation | sync today | `ProjectCard[]` | future services | medium |
| `getProjectById(id)` | adapter-only in foundation | sync today | `ProjectOverview \| undefined` | future services | high |
| `getProjectCards()` | `(): ProjectCard[]` | sync today | `ProjectCard[]` | `/projects` | high |
| `getProjectOverview(id)` | `(id: string): ProjectOverview \| undefined` | sync today | `ProjectOverview \| undefined` | `/projects/[id]`, `/projects/[id]/tasks` | high |

## 3. Safe implementation strategy

### Phase A: real repository isolated

Goal:

- implement a real Supabase read path for project cards only.

Behavior:

- create/complete a Supabase-backed `ProjectsRepository` path for `getProjectCards()`.
- do not connect `getProjectOverview()` to real data in the same first step unless the async migration is already accepted.
- use mock fallback when:
  - env vars are missing
  - Supabase client is unavailable
  - query fails
  - row mapping fails

Expected touched files in the future implementation branch:

- `src/lib/repositories/supabase-projects-repository.ts`
- `src/lib/repositories/supabase-projects-mapper.ts`
- `src/lib/application/repositories/projects-repository-factory.ts`
- `src/lib/data/index.ts` if foundation is merged
- `src/lib/services/projects.ts`

### Phase B: adapter selection with controlled fallback

Goal:

- use Supabase only when the public runtime is configured and the real read path is explicitly enabled.

Recommended behavior:

- if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing: return mock.
- if repository selection resolves to `supabase` but client creation fails: return mock.
- if query returns error: return mock and emit a controlled server log.
- if query succeeds: return normalized `ProjectCard[]`.

Recommended implementation guard:

- keep the decision in the adapter/application layer, not in pages.

### Phase C: tests

Required test matrix:

- env absent -> mock path
- env present but client unavailable -> mock path
- env present and query success -> normalized `ProjectCard[]`
- env present and query error -> mock path
- service contract remains unchanged for route consumers

## 4. Sync vs async

Conclusion: the first real Supabase read should be implemented as `async`.

Reason:

- Supabase reads are asynchronous.
- pretending otherwise would require hidden caching tricks or blocking wrappers that add more risk than value.

Routes affected if `projects` becomes real:

- `/projects`
- `/projects/[id]` if `getProjectOverview()` also becomes real
- `/projects/[id]/tasks` if header context continues to depend on real overview

Risk in App Router:

- the current routes already use async page functions for dynamic params in some places, so Next App Router itself is not the blocker.
- the real risk is widening the async change too far and touching list, detail and tasks context in a single branch.

Recommended minimization:

1. First real read branch should connect only project cards for `/projects`.
2. Keep `getProjectOverview()` on mock for the first implementation if necessary.
3. Convert only the minimal service/adapter path to async for the list route.
4. Delay overview read until the list path has proven stable.

Recommended technical direction:

- introduce async adapter/service variants rather than forcing fake sync behavior.
- update `/projects` first.
- leave `/projects/[id]` and `/projects/[id]/tasks` on mock-backed overview temporarily if needed.

This means the first real read is still `projects`, but specifically `ProjectCard[]` before full `ProjectOverview`.

## 5. Proposed Supabase query

First query target: project cards for `/projects`

Primary table:

- `projects`

Minimum join:

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
  .eq("organization_id", activeOrganizationId)
  .order("updated_at", { ascending: false })
```

Notes:

- no task counters in the first real read query unless they are provided by a safe view or a second aggregate query.
- counters can stay controlled as `0` or fallback/mock-controlled in first iteration, matching the current mapper skeleton.
- no service role.
- organization scope must be resolved before repository call, not provided by UI.

Potential second-step query for overview:

- same `projects + clients` base
- separate aggregate reads from `tasks`, `approvals`, `incidents`
- compose into `ProjectOverview`

## 6. Data mapping

First iteration mapping for `ProjectCard[]`

| Supabase column | Supabase type | Current TS type | Mock equivalent | Transformation |
|---|---|---|---|---|
| `projects.id` | `uuid` | `string` | `mockProjectCard.id` | none |
| `projects.name` | `text` | `string` | `mockProjectCard.name` | none |
| `projects.status` | `text` | `ProjectStatus` | `mockProjectCard.status` | validate with `isProjectStatus()` |
| `projects.client_id` | `uuid` | internal only | implicit | not exposed in UI contract |
| `clients.display_name` | `text` | `string` | `mockProjectCard.clientName` | map to `clientName` |
| derived delayed tasks | aggregate or fallback value | `number` | `mockProjectCard.delayedTasksCount` | keep `0` or controlled value in first real read |
| derived blocked tasks | aggregate or fallback value | `number` | `mockProjectCard.blockedTasksCount` | keep `0` or controlled value in first real read |
| derived approvals pending | aggregate or fallback value | `number` | `mockProjectCard.pendingApprovalsCount` | keep `0` or controlled value in first real read |

Mapping implication:

- the existing `mapSupabaseProjectCardPartialRowToProjectCard()` is already aligned with this partial query.

## 7. RLS and security

Required RLS conditions for the read to work:

- `owner/admin` can read organization projects.
- `project_manager` can read organization projects.
- `worker` can read organization projects if worker portal and task routing depend on project context.
- `client` should not read all organization projects by default.

Practical MVP recommendation:

- enable project reads first only for:
  - `owner`
  - `admin`
  - `project_manager`
  - optionally `worker`
- defer direct `client` project reads until client-project scoping exists.

Tables that need working policies for first read:

- `projects`
- `clients`
- `organization_members`
- `profiles` only if context resolution needs it

Security requirements:

- no service role
- no bypass from UI-supplied organization id without membership validation
- no direct client access to internal counters or unrelated projects

## 8. Proposed tests

Suggested future test names:

- `uses mock projects when supabase env vars are missing`
- `uses mock projects when supabase client cannot be created`
- `maps supabase project rows into project cards`
- `falls back to mock projects when supabase query returns error`
- `rejects invalid project status from supabase row`
- `keeps projects service contract stable for projects page`
- `does not require route changes outside projects list for first real read`

If overview is included later:

- `maps project overview from project plus aggregate counters`
- `returns undefined when project overview is not found`

## 9. Acceptance criteria

Approve the future implementation branch only if:

- `npm run lint` passes
- `npm run build` passes
- `npm run test` passes
- no beta/deploy happens
- no package changes unless strictly justified
- mock fallback remains operational
- `/projects` does not break when env vars are missing
- `/projects` returns real Supabase data when env vars are present and query succeeds
- no service role is introduced
- no runtime path bypasses RLS
- no unrelated routes are migrated in the same branch

## 10. Risks and rollback

Technical risks:

- async conversion can spread beyond the intended route if not contained.
- organization context resolution may not yet exist cleanly in `main`.
- first real query may expose mismatch between seeded schema and current mock assumptions.
- counters in `ProjectCard` may confuse users if they drop to `0` before aggregate reads are implemented.

Data risks:

- incomplete `clients` rows would break `clientName`.
- invalid `status` values would fail mapper validation.
- missing organization membership would make otherwise valid records invisible under RLS.

Rollback:

- switch repository selection back to mock in the adapter/application layer.
- keep Supabase tables untouched.
- no route rollback needed if the service contract is preserved.

How to disable Supabase and return to mock:

- remove or unset `NEXT_PUBLIC_SUPABASE_URL`
- remove or unset `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- or force repository selection to `mock` in the adapter/application layer

## 11. Future implementation prompt

Use this prompt for the future implementation branch:

```text
Implement the first real Supabase read for Reformando.app using the existing adapter foundation and keeping mock fallback intact.

Branch:
codex/data-supabase-project-cards-read

Scope:
- connect only the `projects` list read first
- target `/projects`
- keep `ProjectOverview` mock-backed unless clearly safe to migrate in the same branch

Rules:
- do not use service role
- do not touch AppShell/layout/design-reference
- do not add dependencies
- keep fallback mock if env is missing, client fails, or query fails
- preserve current route UX and contract shape

Expected files:
- src/lib/repositories/supabase-projects-repository.ts
- src/lib/repositories/supabase-projects-mapper.ts
- src/lib/application/repositories/projects-repository-factory.ts
- src/lib/data/index.ts if adapter foundation is merged
- src/lib/services/projects.ts
- tests for mock fallback, query success, query failure and mapper validation

Query:
- read from `projects`
- join `clients(display_name)`
- filter by active organization
- order by `updated_at desc`

Acceptance:
- `/projects` works with mock when env is absent
- `/projects` shows real Supabase rows when env is present
- lint/build/test pass
- no package changes
- no beta/deploy
```
