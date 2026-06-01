# Tasks — Supabase persistence plan (design only)

> **Design-only branch:** `openclaw/tasks-supabase-design`
>
> This document prepares the jump from **server-side in-memory persistence** to **real persistence in Supabase** for the Tasks module.
>
> **Constraints (explicit):**
> - No UI changes.
> - No runtime behavior changes.
> - No migrations / no real Supabase connection.
> - No Auth / roles / RLS implementation (only notes).

## 1) Current state (as of `main` merge commit `78d5a5a`)

### Runtime flow today

`/projects/[id]/tasks` currently uses:

- UI client island: `src/app/projects/[id]/tasks/ProjectTasksClient.tsx`
- Server Action: `src/app/projects/[id]/tasks/actions.ts`
- Service: `src/lib/services/tasks.ts`
- Repository (active): `src/lib/repositories/mock-tasks-repository.ts`

Flow:

1. UI calls `updateTaskStatusAction(taskId, status)`
2. Server Action validates `TaskStatus` and calls `services/tasks.updateTaskStatus()`
3. Service delegates to `TasksRepository.updateTaskStatus()`
4. `MockTasksRepository` persists via an in-memory `Map` (process lifetime)

### In-memory persistence semantics (today)

- **Not product persistence.** It survives only while the server process lives.
- A task can be marked `done` and later “reopened”.
- Reopen tries to restore the previous status (tracked in-memory); otherwise falls back to `todo`.

### Supabase status in the repo

Supabase client utilities exist:

- `src/lib/supabase/browser.ts`
- `src/lib/supabase/server.ts`

Env vars expected:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

Supabase repository skeleton exists only for projects:

- `src/lib/repositories/supabase-projects-repository.ts` (stub, not connected)
- `src/lib/repositories/supabase-projects-mapper.ts`

There is **no** `SupabaseTasksRepository` yet.

## 2) Task model today (contracts)

UI read contract:

- `ProjectTaskListItem` (`src/lib/types/project-task.ts`)

Status domain:

- `TaskStatus` (`src/lib/domain/tasks/status.ts`)
  - `todo | in_progress | blocked | done | cancelled`

Repository boundary:

- `TasksRepository` (`src/lib/repositories/tasks-repository.ts`)
  - `getProjectTasks(projectId): ProjectTaskListItem[]`
  - `updateTaskStatus(taskId, status): ProjectTaskListItem | null`

## 3) Proposed minimal Supabase design

### 3.1 Minimal table: `tasks`

Goal: support **only** the current `/projects/[id]/tasks` read model and the mutation: mark done / reopen.

Proposed minimal columns (Postgres / Supabase):

- `id` (text / uuid) — primary key
- `organization_id` (text / uuid, nullable initially if we decide to defer org scope)
- `project_id` (text / uuid) — required
- `title` (text) — required
- `status` (text) — required, must match `TaskStatus`
- `priority` (text) — required, must match current `TaskPriority`
- `assignee_name` (text, nullable) — keep as text for MVP (no users yet)
- `due_date` (date, nullable)
- `blocked_reason` (text, nullable)
- `section_label` (text, nullable)
- `created_at` (timestamptz, default now)
- `updated_at` (timestamptz, default now)

Notes:
- `isDelayed` and `isBlocked` **should be derived** in the repository from `due_date` and `status/blocked_reason`.
- The repo should not expose DB table shapes to UI.

### 3.2 Mapping DB → `ProjectTaskListItem`

Proposed repository-internal row shape (example):

```ts
type SupabaseTaskRow = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  priority: string;
  assignee_name: string | null;
  due_date: string | null; // ISO date
  blocked_reason: string | null;
  section_label: string | null;
};
```

Mapping rules:
- validate `status` with `isTaskStatus` (throw or return error)
- validate priority with existing domain guard (if missing, add `isTaskPriority` later)
- `projectId = project_id`
- `assigneeName = assignee_name ?? undefined`
- `dueDate = due_date ?? undefined`
- `blockedReason = blocked_reason ?? undefined`
- `sectionLabel = section_label ?? undefined`
- `isBlocked = status === "blocked" || !!blocked_reason`
- `isDelayed = !!due_date && due_date < today && status !== "done" && status !== "cancelled"`

### 3.3 Mutation: `updateTaskStatus(taskId, status)`

Minimum behavior:
- update `tasks.status`
- optionally update `updated_at`
- return the updated row mapped to `ProjectTaskListItem`

#### “previousStatus” strategy

For Supabase persistence we have two options:

1) **No previousStatus persisted (recommended for minimal scope):**
   - “Reabrir” sets `status = "todo"` (or `in_progress` if we decide later).
   - Simple schema and no extra state.

2) **Persist previousStatus:**
   - add `previous_status` column and manage it on transitions.
   - more complexity; adds more rules and edge cases.

Recommendation for the first Supabase iteration:
- **Do not persist** `previousStatus`.
- Keep reopen behavior deterministic: `done → todo`.

We can keep the current in-memory “restore previous status” behavior only in the mock path.

## 4) Fallback strategy (no Supabase configured)

Requirement: keep the app usable when Supabase env is missing.

Proposed approach:
- Extend `TasksRepositoryDataSource` to include `"supabase"`.
- In `createTasksRepository`, select datasource like:
  - if env vars exist: use `SupabaseTasksRepository`
  - else: use `MockTasksRepository`

Important:
- The selection should be inside the application layer (factory/context), not in UI.
- `services/tasks.ts` stays stable.

## 5) Risks / open decisions

### Risks
- Status mismatch between DB and domain (`TaskStatus`).
- Organization scoping (`organization_id`) not decided yet → risk of cross-org access.
- Without RLS, any anon client could update tasks if we expose a public route (must stay server-side).

### Decisions deferred (document only)
- Auth (Supabase Auth or not) and how to obtain `organization_id`.
- RLS policies.
- Whether IDs are UUIDs or text.
- Whether `assignee` becomes a relation later.

## 6) Incremental implementation plan (2–3 small branches)

### Branch A — “repository skeleton + mapping (not connected)”
Goal: add code (types/mappers/repository) but keep runtime on mock.

- Add `SupabaseTasksRepository` (server-side only) under `src/lib/repositories/`.
- Add `supabase-tasks-mapper.ts` to map internal rows → `ProjectTaskListItem`.
- Update tasks repository factory to support `dataSource: "supabase"`, but keep default as `mock`.
- Add tests for mapper + repository guard behavior.

Acceptance:
- lint/build/test pass.
- no runtime change.

### Branch B — “opt-in datasource switch via env presence”
Goal: still minimal, but enable real runtime selection.

- In `createTasksRepository`, pick Supabase only when env exists.
- Keep safe failure behavior (if env present but query fails → return error consistently).

Acceptance:
- App still works without Supabase env.
- With Supabase env (in beta), tasks read works.

### Branch C — “enable updateTaskStatus against Supabase”
Goal: activate real persistence.

- Implement `updateTaskStatus` in `SupabaseTasksRepository`.
- Keep mutation server-side (Server Action stays).
- Decide reopen behavior: set to `todo`.

Acceptance:
- Mark done persists after refresh.
- Reopen persists after refresh.
- Error handling remains stable (no inconsistent UI state).

## 7) Acceptance criteria (future implementation branch)

- `/projects/project_obra_centro/tasks` shows tasks from Supabase (when configured).
- Clicking “Marcar hecha” persists status in DB and survives refresh.
- Clicking “Reabrir” persists the chosen reopen status and survives refresh.
- If Supabase is not configured, the app falls back to mock and still works.
- `npm run lint`, `npm run build`, `npm run test` pass.
