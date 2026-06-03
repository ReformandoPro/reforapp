# Supabase MVP RLS Policies

## Role Model

MVP roles live in `organization_members.role`:

- `owner`: full control over organization data.
- `admin`: full operational control except destructive organization-level ownership changes.
- `project_manager`: jefe de obra/reformista; can manage projects, tasks, budgets, incidents, approvals and documents inside the organization.
- `worker`: operario; can read assigned/organization operational data and update own task progress in a limited way.
- `client`: cliente final; can read client-visible project, budget approval and document data only.

MVP simplification:

- `owner`, `admin` and `project_manager` can be treated as the same write group for business tables.
- `worker` write access should start with task status updates only.
- `client` should be read-only plus approval decisions only.

No client-side code should use a service role key.

## Helper Functions

The SQL proposal defines two helper functions:

- `public.is_org_member(target_organization_id uuid)`
- `public.has_org_role(target_organization_id uuid, allowed_roles text[])`

These keep RLS policies readable. They rely on `auth.uid()` and active rows in `organization_members`.

## Table Policies

### `organizations`

Read:

- active organization members.

Insert:

- not required from product UI in MVP.
- first organizations can be created by seed/migration/admin tooling.

Update:

- `owner`, `admin`.

Delete:

- not allowed in MVP.

Risk:

- organization creation flow is deferred. Do not expose public insert yet.

### `profiles`

Read:

- users can read their own profile.
- organization members can read profiles of members in shared organizations.

Insert:

- user can insert own profile after auth signup.
- seed/admin tooling can create demo profiles.

Update:

- user can update own profile.

Delete:

- not allowed in MVP.

Risk:

- email visibility. For MVP, sharing profile display data within the same organization is acceptable.

### `organization_members`

Read:

- active members can read memberships in their own organizations.

Insert:

- `owner`, `admin`.

Update:

- `owner`, `admin`.

Delete:

- `owner` only, or no delete in MVP.

Risk:

- role escalation. `worker` and `client` must not update memberships.

### `clients`

Read:

- `owner`, `admin`, `project_manager`.
- `worker` can read client display name only if needed through project views. Full client table read can be deferred.
- `client` should not read all clients; only through assigned project/client access in a future client portal.

Insert:

- `owner`, `admin`, `project_manager`.

Update:

- `owner`, `admin`, `project_manager`.

Delete:

- not allowed in MVP; use soft archive later if needed.

Risk:

- exposing full client list to workers/clients. Keep worker/client access constrained until portal routes exist.

### `projects`

Read:

- active organization members.
- for stricter MVP, clients should only read projects linked to their client identity or explicit membership, but that identity mapping is deferred.

Insert:

- `owner`, `admin`, `project_manager`.

Update:

- `owner`, `admin`, `project_manager`.

Delete:

- not allowed in MVP.

Risk:

- client role reading all organization projects if added too early. Do not enable client route until client-project scoping is implemented.

### `tasks`

Read:

- active organization members.

Insert:

- `owner`, `admin`, `project_manager`.

Update:

- `owner`, `admin`, `project_manager`.
- `worker` can update operational fields in later implementation; first policy may allow update but runtime should restrict payload to status changes.

Delete:

- `owner`, `admin`, `project_manager` only, or not allowed until CRUD is fully designed.

Risk:

- RLS cannot easily restrict individual columns without extra views/RPC. For worker task status, prefer a narrow server action/RPC in the implementation branch.

### `budgets`

Read:

- `owner`, `admin`, `project_manager`.
- `client` can later read approved/client-visible budget fields through a portal-specific view.

Insert:

- `owner`, `admin`, `project_manager`.

Update:

- `owner`, `admin`, `project_manager`.

Delete:

- not allowed in MVP.

Risk:

- budgets contain internal margins. Do not expose direct `budgets` reads to `client` role until client-safe views exist.

### `budget_lines`

Read:

- `owner`, `admin`, `project_manager`.
- not direct to `client` in MVP because lines may include internal cost/margin.

Insert:

- `owner`, `admin`, `project_manager`.

Update:

- `owner`, `admin`, `project_manager`.

Delete:

- `owner`, `admin`, `project_manager` if budget is editable. Runtime should enforce budget status transitions.

Risk:

- high sensitivity: `unit_cost_cents`, `subtotal_cost_cents` and `margin_rate` are internal.

### `approvals`

Read:

- active organization members.
- future `client` portal should read only approvals addressed to that client/project.

Insert:

- `owner`, `admin`, `project_manager`.

Update:

- `owner`, `admin`, `project_manager`.
- `client` can later update `status` to `approved` or `rejected` only through a constrained endpoint/RPC.

Delete:

- not allowed in MVP.

Risk:

- approval decisions are legally/business relevant. Use append-only audit later; MVP records `decided_at`.

### `incidents`

Read:

- active organization members.

Insert:

- `owner`, `admin`, `project_manager`, `worker`.

Update:

- `owner`, `admin`, `project_manager`.
- `worker` can update own incident in a later constrained path.

Delete:

- not allowed in MVP.

Risk:

- incidents may include internal notes. Do not expose to clients until `visible_to_client` or portal-specific filtering exists.

### `documents`

Read:

- `owner`, `admin`, `project_manager`, `worker` within organization.
- `client` only where `visible_to_client = true`, later via storage policies too.

Insert:

- `owner`, `admin`, `project_manager`, `worker`.

Update:

- `owner`, `admin`, `project_manager`.
- uploader can update metadata in future if needed.

Delete:

- not allowed in MVP, or only admin/project manager after storage deletion plan exists.

Risk:

- table RLS is not enough for file security. Supabase Storage policies must be designed before real uploads.

## MVP Acceptable Simplification

For the first private MVP, it is acceptable to:

- support only `owner`, `admin`, `project_manager` and `worker`;
- defer `client` direct access until the client portal exists;
- disable deletes;
- perform writes from server actions using anon user session, never service role;
- enforce complex field-level rules in application code until stable RPCs are introduced.

## Non-Acceptable Shortcuts

Do not:

- disable RLS on business tables;
- read/write with service role from browser code;
- expose internal budget margins to clients;
- allow `worker` or `client` to update memberships or roles;
- use organization IDs supplied by UI without validating membership.
