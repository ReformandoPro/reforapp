# MVP gap analysis — Reformando.app

Date: 2026-06-02

Branch: `codex/mvp-gap-analysis`

Base commit audited: `bf84fbc` (`merge: add dashboard visual alignment spec`)

Scope: documentation only. No product code was changed in this branch.

## Executive summary

Reformando.app has a credible technical foundation for a reformista MVP, but it is not yet a usable MVP for a real reforms company.

The current app is best described as a contract-first prototype:

- routes exist for dashboard, projects, project detail, project tasks, budgets, budget detail and design reference;
- domain states exist for projects, tasks and budgets;
- read models exist for dashboard, project cards, project overview, tasks and budgets;
- a budget calculation engine exists and is tested;
- services and repository interfaces exist;
- mocks are the active runtime data source;
- Supabase client utilities and repository skeletons exist but are not connected;
- Odoo is documented as a future integration, not active product functionality.

The main gap is persistence and real business workflow. A reformista cannot yet create clients, create obras, create budgets, create tasks, assign workers, upload documents, manage materials, communicate with clients, or operate against authenticated multi-company data.

Estimated global MVP progress: **18%**.

This percentage reflects a useful architecture/design foundation, not product usability. If measuring only production-usable reformista workflow, the progress is closer to **8-10%**.

## 1. Current product state

### What is in place

- Next.js App Router application.
- Shared UI primitives: `Card`, `Badge`, `Button`, `ProgressBar`, `ListItem`, `EmptyState`, `ErrorState`, `LoadingState`, `MetricCard`.
- AppShell with top header and bottom navigation.
- Real `/` dashboard route connected to `getDashboardSummary()`.
- Project list and project detail routes.
- Project tasks route with a client island and Server Action.
- Budget list and budget detail routes.
- Internal `/design-reference` route.
- Mock-backed services for dashboard, projects, tasks and budgets.
- Domain status definitions and transition maps for projects and budgets.
- Domain status/priority definitions for tasks.
- Minimal budget computation engine.
- Supabase client helpers.
- Supabase repository skeletons for projects and tasks.
- Tests for services, budget engine, repository factories and mappers.
- Documentation for design system, Supabase project-card read model, tasks persistence plan and architecture.

### What is not in place

- Authentication.
- Organizations / tenant isolation at runtime.
- Users, memberships and roles.
- Real Supabase runtime selection.
- Real DB migrations applied by the app.
- CRUD for clients.
- CRUD for projects.
- CRUD for tasks.
- CRUD for budgets.
- Budget line items / partidas.
- Budget approval workflow.
- Real dashboard aggregation.
- Materials / purchasing workflow.
- Documents / photos.
- Client portal.
- Worker portal beyond a read-only-like task list and local status mutation.
- Notifications.
- Messaging/comments.
- Real uploads/storage.
- Odoo integration.
- Billing/invoicing/accounting.

## 2. Existing routes and behavior

| Route | File | Current behavior | Real vs mock/demo | MVP value |
|---|---|---|---|---|
| `/` | `src/app/page.tsx` | Loads `getDashboardSummary()` and renders `ReformistDashboardScreen` | Mock-backed service | Useful dashboard shell, not production data |
| `/projects` | `src/app/projects/page.tsx` | Lists project cards; disabled `Nueva obra` button | Mock-backed service | Useful read-model prototype |
| `/projects/[id]` | `src/app/projects/[id]/page.tsx` | Shows project overview and link to tasks | Mock-backed service | Useful route and layout; no real CRUD |
| `/projects/[id]/tasks` | `src/app/projects/[id]/tasks/page.tsx` | Lists tasks for a project | Mock-backed service | Useful task screen prototype |
| `/projects/[id]/tasks` action | `src/app/projects/[id]/tasks/actions.ts` | Validates status and updates task status | In-memory mock persistence | Only mutation path today; not durable |
| `/budgets` | `src/app/budgets/page.tsx` | Lists budget summaries; disabled `Nuevo presupuesto` button | Mock-backed service | Useful budget summary prototype |
| `/budgets/[id]` | `src/app/budgets/[id]/page.tsx` | Shows budget summary/detail | Mock-backed service | Useful read-only budget detail |
| `/design-reference` | `src/app/design-reference/page.tsx` | Internal static visual reference | Static demo, intentionally non-product | Design reference only |

Route gaps for MVP:

- no `/login`;
- no `/clients`;
- no `/projects/new`;
- no `/projects/[id]/edit`;
- no `/projects/[id]/tasks/new`;
- no `/budgets/new`;
- no `/budgets/[id]/edit`;
- no `/materials`;
- no `/documents`;
- no client-facing portal routes;
- no worker-specific route;
- no settings/organization/team routes.

## 3. Real functionality vs mock/demo

### Runtime currently real

- App routing.
- UI rendering.
- Server Action boundary for task status updates.
- Domain guards for task status.
- Domain status definitions.
- Budget calculation functions.
- Test coverage for current service/mapping behavior.

### Runtime currently mock/demo

- Dashboard data.
- Project list and detail data.
- Budget list and detail data.
- Task list data.
- Task update persistence.
- Project counters.
- Budget values.
- Operational alerts.
- Client names.
- Project overview sections.

### Runtime not active

- Supabase repositories.
- Supabase table reads.
- Supabase writes.
- Auth.
- RLS.
- Organization scoping.
- Odoo connector.
- File storage.
- Notifications.

Important detail: `MockTasksRepository` stores task status overrides in a process-lifetime `Map`. This validates the UI -> Server Action -> service -> repository flow, but it is not product persistence and will not survive process restart.

## 4. What is missing for a minimum usable MVP

A minimum usable MVP for a reforms company should allow a reformista/jefe de obra to complete this loop with real data:

1. Login as a user in an organization.
2. Create or view clients.
3. Create an obra/project linked to a client.
4. Create a basic budget for that obra.
5. Add budget line items/partidas with costs, sale price and margin.
6. Mark/send/approve a budget at least internally.
7. Create tasks for the obra.
8. Assign tasks at least by assignee text or simple user.
9. Update task status durably.
10. See dashboard aggregations from real projects/tasks/budgets.
11. Track basic blockers/incidents or at minimum blocked task reasons.
12. Keep data scoped to organization.

The current product does not yet complete that loop because creation/editing, persistence, auth and tenancy are missing.

## 5. Prioritization by phases

### Phase A: essential for MVP

These are blockers for a usable MVP:

1. Supabase connection strategy with mock fallback.
2. Minimal database schema and migrations for:
   - organizations;
   - users/memberships or profile mapping;
   - clients;
   - projects;
   - tasks;
   - budgets;
   - budget line items.
3. Authentication and active organization context.
4. Basic role model:
   - owner/admin;
   - reformista/jefe de obra;
   - worker/operario;
   - client can be deferred if portal is not in first MVP.
5. Project CRUD:
   - create;
   - list;
   - detail;
   - update status.
6. Task CRUD:
   - create;
   - list by project;
   - update status;
   - blocked reason;
   - due date;
   - assignee.
7. Budget CRUD:
   - create budget for project;
   - add/edit/delete line items;
   - compute totals/margins from line items;
   - change budget status.
8. Dashboard from real repositories:
   - active projects count;
   - delayed tasks;
   - blocked tasks;
   - pending budgets;
   - open incidents or blocked task count;
   - pending approvals if approval table exists, otherwise defer.
9. Basic validation and error states.
10. Seed/demo data for one organization.

### Phase B: important but not blocking MVP

These improve usefulness but can follow after first real loop:

1. Materials list per project/task.
2. Material requests.
3. Basic purchases table without Odoo integration.
4. Documents/photos upload through Supabase Storage.
5. Incidents as first-class entities.
6. Comments on task/project.
7. Client-visible budget approval state.
8. Basic client portal view.
9. Worker-specific task view.
10. Better project phases/sections.
11. Dashboard visual alignment according to `docs/design/dashboard-visual-alignment-spec.md`.
12. Notifications as in-app notification list.

### Phase C: post-MVP

These are strategically important but should not block validation:

1. Odoo integration.
2. Supplier purchase orders.
3. Inventory/warehouse.
4. Accounting/fiscal invoicing.
5. Advanced client approvals/signatures.
6. Full document management.
7. Real-time chat.
8. Native mobile app.
9. Advanced scheduling/calendar.
10. Workforce time tracking/legal attendance.
11. Cost-to-complete and live margin from real purchases/hours.
12. Advanced permissions/RLS beyond MVP role gates.
13. Automated notifications.
14. Analytics/reporting exports.

## 6. Module gap analysis

### 6.1 Authentication

Estimated current completion: **0%**

Current files related:

- `src/lib/supabase/browser.ts`
- `src/lib/supabase/server.ts`
- `docs/architecture/application-repository-gateway.md`

Current state:

- Supabase client helpers exist.
- No auth routes.
- No session handling.
- No middleware.
- No user profile model.
- No login/logout UI.

Gaps:

- choose Supabase Auth strategy;
- add login route;
- add logout/session handling;
- protect product routes;
- resolve current user server-side;
- decide fallback behavior for local/mock mode.

First implementation:

- Add `/login` with Supabase Auth email/password or magic link.
- Add server-side helper for current session.
- Keep mocks available in development/test.
- Do not implement full RLS in the same branch.

### 6.2 Users / roles

Estimated current completion: **5%**

Current files related:

- `docs/architecture/application-repository-gateway.md`
- `docs/data/project-cards-organization-scope-decision.md`
- `src/lib/application/context/projects-application-context.ts`

Current state:

- `organizationId` is documented and represented in application context.
- No runtime roles.
- No memberships table.
- No UI role filtering.

Gaps:

- organizations;
- memberships;
- role enum;
- active organization;
- role-aware route access;
- role-aware data scope.

First implementation:

- Define `organizations`, `profiles`, `memberships`.
- Add role enum: `owner`, `admin`, `reformist`, `worker`, `client`.
- For MVP, enforce organization scope in repositories before fine-grained UI permissioning.

### 6.3 Obras / projects

Estimated current completion: **22%**

Current files related:

- `src/app/projects/page.tsx`
- `src/app/projects/[id]/page.tsx`
- `src/components/screens/ProjectOverviewScreen.tsx`
- `src/lib/types/project.ts`
- `src/lib/types/project-overview.ts`
- `src/lib/domain/projects/status.ts`
- `src/lib/domain/projects/transitions.ts`
- `src/lib/services/projects.ts`
- `src/lib/repositories/projects-repository.ts`
- `src/lib/repositories/mock-projects-repository.ts`
- `src/lib/repositories/supabase-projects-repository.ts`
- `src/lib/repositories/supabase-projects-mapper.ts`
- `docs/data/project-cards-*`

Current state:

- list and detail routes exist;
- read models exist;
- statuses and transitions exist;
- Supabase mapper/stub exists;
- only mock runtime is active;
- create/edit/status update do not exist.

Gaps:

- real projects table;
- real clients table;
- create project form;
- edit project form;
- status update;
- organization scoping;
- real counters from tasks/approvals;
- project detail sections backed by real entities.

First implementation:

- Connect partial Supabase read for `ProjectCard[]` from `projects + clients`.
- Keep counters controlled initially.
- Then add create project form with client selection.
- Then add project detail read from Supabase.

### 6.4 Tasks

Estimated current completion: **28%**

Current files related:

- `src/app/projects/[id]/tasks/page.tsx`
- `src/app/projects/[id]/tasks/ProjectTasksClient.tsx`
- `src/app/projects/[id]/tasks/actions.ts`
- `src/lib/types/project-task.ts`
- `src/lib/domain/tasks/status.ts`
- `src/lib/domain/tasks/priority.ts`
- `src/lib/services/tasks.ts`
- `src/lib/repositories/tasks-repository.ts`
- `src/lib/repositories/mock-tasks-repository.ts`
- `src/lib/repositories/supabase-tasks-repository.ts`
- `docs/database/tasks_schema.sql`
- `docs/technical/tasks-supabase-persistence-plan.md`

Current state:

- route exists;
- task read model exists;
- task status update flow exists;
- mutation uses Server Action;
- mock in-memory persistence exists;
- Supabase skeleton exists;
- documented schema exists.

Gaps:

- real Supabase table/migration;
- real read;
- real status update persistence;
- create task;
- edit task;
- delete/cancel task;
- assignee relation;
- due date validation;
- blocked reason mutation;
- derived counters feeding projects/dashboard.

First implementation:

- Implement Supabase task mapper/repository behind factory without changing UI.
- Add opt-in datasource selection.
- Persist status updates.
- Then add create/edit task forms.

### 6.5 Presupuestos / budgets

Estimated current completion: **24%**

Current files related:

- `src/app/budgets/page.tsx`
- `src/app/budgets/[id]/page.tsx`
- `src/components/screens/BudgetSummaryScreen.tsx`
- `src/lib/types/budget.ts`
- `src/lib/types/budget-view.ts`
- `src/lib/types/budget-line.ts`
- `src/lib/types/budget-detail.ts`
- `src/lib/domain/budgets/status.ts`
- `src/lib/domain/budgets/transitions.ts`
- `src/lib/engine/budget.ts`
- `src/lib/services/budgets.ts`
- `src/lib/repositories/budgets-repository.ts`
- `src/lib/repositories/mock-budgets-repository.ts`
- `tests/engine/budget.test.ts`
- `tests/services/budgets.test.ts`

Current state:

- list/detail routes exist;
- mock summaries/detail exist;
- status domain exists;
- budget calculation functions exist and are tested;
- no real budget CRUD;
- no line-item UI;
- no approval flow.

Gaps:

- budgets table;
- budget_versions table or versioning decision;
- budget_lines table;
- create/edit budget form;
- line item CRUD;
- totals calculated from line items;
- approval/sent/viewed state mutations;
- project relation;
- client-visible vs internal views from real data.

First implementation:

- Create Supabase-backed budget + budget_lines read/write model.
- Implement budget create for a project.
- Implement budget line item CRUD.
- Use existing engine to compute totals/margins.
- Keep advanced versioning for Phase B unless simple version field is cheap.

### 6.6 Compras / materiales

Estimated current completion: **5%**

Current files related:

- `src/lib/types/project-overview.ts` includes `materials` section key.
- `mockProjectOverview.pendingMaterialRequestsCount`.
- `docs/architecture.md`
- `src/lib/odoo/README.md`

Current state:

- Materials are only represented as counters/section labels in project overview.
- No route, entity, repository or UI workflow.
- Odoo is documented as future ERP integration.

Gaps:

- material request model;
- project/task material lines;
- status lifecycle;
- supplier/provider model if needed;
- purchase request workflow;
- connection to tasks;
- Odoo handoff not defined in code.

First implementation:

- Phase B: add `material_requests` with project/task relation, status and requester.
- Keep Odoo purchase orders out of MVP.

### 6.7 Documents

Estimated current completion: **0%**

Current files related:

- `ProjectOverviewSectionKey` includes `documents`.
- `mockProjectOverview.availableSections` marks documents disabled.

Current state:

- Documents are only a disabled section label.
- No storage integration.
- No upload UI.

Gaps:

- Supabase Storage or external storage decision;
- document metadata table;
- project/document relation;
- permissions;
- upload/delete/download;
- client visibility flag.

First implementation:

- Phase B: project documents table + Supabase Storage upload.
- Start with internal documents only.
- Add client visibility later.

### 6.8 Cliente

Estimated current completion: **6%**

Current files related:

- `ProjectCard.clientName`
- `ProjectOverview.clientName`
- `docs/data/project-cards-supabase-schema.md`

Current state:

- Client is a string in read models and mocks.
- Documentation proposes `clients` table.
- No client CRUD.
- No client portal.
- No client auth.

Gaps:

- clients table;
- client create/edit/list;
- project-client relation;
- client contact details;
- client portal permissions;
- approvals visible to client.

First implementation:

- Phase A: internal `clients` table and basic create/select for projects.
- Phase B/C: client portal and approvals.

### 6.9 Reporting / dashboard

Estimated current completion: **25%**

Current files related:

- `src/app/page.tsx`
- `src/components/screens/ReformistDashboardScreen.tsx`
- `src/lib/types/dashboard.ts`
- `src/lib/services/dashboard.ts`
- `src/lib/repositories/dashboard-repository.ts`
- `src/lib/repositories/mock-dashboard-repository.ts`
- `src/lib/mock/dashboard.ts`
- `docs/design/dashboard-visual-alignment-spec.md`

Current state:

- dashboard screen exists;
- summary contract exists;
- mock data exists;
- visual spec exists;
- no real aggregation.

Gaps:

- real dashboard repository;
- aggregate counts from projects/tasks/budgets;
- real operational alerts;
- organization scoping;
- loading/error states if data fails.

First implementation:

- After projects/tasks/budgets persistence, implement `SupabaseDashboardRepository`.
- Derive counts in repository from real rows.
- Keep dashboard UI contract stable.

### 6.10 Notifications / communication

Estimated current completion: **0%**

Current files related:

- `DashboardSummary.operationalAlerts`
- `OperationalAlert` type
- `mockDashboardSummary.operationalAlerts`

Current state:

- Alerts are mock dashboard items only.
- No notifications table.
- No comments/messages.
- No client/team communication.

Gaps:

- notification model;
- comment model;
- message visibility (`internal` vs `client`);
- read/unread status;
- relation to project/task/budget/incident;
- delivery mechanism.

First implementation:

- Phase B: comments on project/task.
- Phase B/C: notifications table derived from task/budget events.
- Client/team messaging should wait until core project/task/budget workflows are real.

## 7. Phase A detailed MVP definition

The smallest realistic MVP should target one reformista organization using the app internally.

Minimum scope:

- login;
- one organization context;
- internal clients;
- projects CRUD;
- tasks CRUD with durable status updates;
- budget CRUD with line items;
- dashboard real aggregates;
- no client portal yet;
- no materials/purchases yet unless represented as simple blocked reason/manual note;
- no Odoo integration.

This MVP lets a jefe de obra:

- enter a client;
- create an obra;
- create a budget;
- create tasks;
- update task progress;
- see operational dashboard counts.

That is enough to validate product value without rebuilding ERP, documents, chat or inventory.

## 8. Estimated global MVP progress

Overall MVP progress estimate: **18%**.

Weighted reasoning:

| Area | Weight for MVP | Current completion | Weighted contribution |
|---|---:|---:|---:|
| Architecture/service/repository foundation | 15% | 55% | 8.25% |
| Auth/roles/organization | 15% | 2% | 0.30% |
| Projects/clients | 20% | 18% | 3.60% |
| Tasks | 20% | 28% | 5.60% |
| Budgets | 20% | 24% | 4.80% |
| Dashboard/reporting | 5% | 25% | 1.25% |
| Documents/materials/communication | 5% | 2% | 0.10% |

Rounded and adjusted for missing persistence/auth: **18%**.

Important caveat: visible UI progress can feel higher than 18%, but production usability depends on real persistence, auth and CRUD.

## 9. Technical risks

1. Mock-to-real transition risk
   - Services currently force `dataSource: "mock"`.
   - Need environment/context-driven repository selection without breaking tests.

2. Organization scoping risk
   - `organizationId` is documented but not runtime active.
   - Real Supabase reads without tenant scope would be unsafe.

3. Auth/RLS sequencing risk
   - Connecting Supabase before deciding Auth/RLS can create security debt.

4. Contract drift risk
   - TypeScript status enums and database constraints can diverge.

5. Dashboard aggregation risk
   - Counts can become expensive or inconsistent if not derived carefully.

6. Budget complexity risk
   - Budget engine has calculations, but real budgets need line items, versions, approvals and visibility rules.

7. Visual migration distraction risk
   - UI styling work can consume effort while core MVP persistence is still missing.

8. Odoo scope creep
   - Odoo integration is valuable but should not block Reformando Core MVP.

9. Incomplete role model risk
   - Reformista, worker and client have different data visibility requirements.

10. Testing gap risk
   - Existing tests cover mocks and pure functions, not real repository integration, auth or route behavior.

## 10. Recommended sequence of small branches

### Codex documentation/spec branches

1. `codex/mvp-supabase-core-spec`
   - Define final Phase A schema: organizations, clients, projects, tasks, budgets, budget_lines.
   - Include RLS/Auth assumptions but do not implement.

2. `codex/mvp-auth-roles-spec`
   - Define roles, membership model and route access matrix.

3. `codex/mvp-projects-crud-spec`
   - Define exact routes/forms/repository contracts for clients/projects.

4. `codex/mvp-budgets-crud-spec`
   - Define budget line item model, calculations and minimal approval states.

5. `codex/mvp-dashboard-real-data-spec`
   - Define dashboard aggregation contract from real tables.

### Openclaw implementation branches

1. `openclaw/supabase-core-safe-connection`
   - Add datasource selection while preserving mock fallback.
   - Do not change UI.

2. `openclaw/supabase-projects-partial-read`
   - Implement real `ProjectCard[]` read from `projects + clients`.
   - Keep counters controlled.

3. `openclaw/projects-clients-minimal-crud`
   - Add clients table/use case and create project flow.

4. `openclaw/tasks-supabase-read-write`
   - Implement tasks table, read and status update persistence.
   - Keep existing task screen.

5. `openclaw/tasks-minimal-crud`
   - Add create/edit task flow.

6. `openclaw/budgets-supabase-read-write`
   - Implement budget and budget line persistence.
   - Use existing budget engine for calculations.

7. `openclaw/budgets-minimal-crud`
   - Add create/edit budget and line items UI.

8. `openclaw/dashboard-real-aggregates`
   - Replace mock dashboard repository with Supabase aggregates when configured.

9. `openclaw/ui-dashboard-visual-alignment`
   - Apply visual dashboard spec after real data path is stable or in parallel if kept strictly visual.

10. `openclaw/mvp-smoke-tests`
   - Add route/integration tests for MVP loop.

## 11. Recommended immediate next step

The next implementation should not be visual. It should be:

`openclaw/supabase-core-safe-connection`

Goal:

- keep mocks working;
- add a safe repository datasource switch;
- make Supabase opt-in;
- add tests proving app still works without Supabase env;
- prepare the first real `projects + clients` read.

After that, implement `projects + clients` partial read, then task persistence. This sequence validates the core architectural path before tackling budget CRUD, which is more complex.
