# Supabase staging/demo smoke plan — `/projects` first real read

Date: 2026-06-03

Scope: **documentation only**.

This plan describes a controlled way to configure and validate the first real Supabase read for **`/projects`** (ProjectCard list) in a **staging/demo** Supabase project.

Constraints (explicit):

- do **not** run migrations against production;
- do **not** touch Supabase remote automatically from this repo;
- do **not** deploy beta;
- do **not** commit `.env` files or secrets;
- read-only smoke test only.

---

## 1) Current state (what is already implemented)

As of `origin/main` at `327a27c`, Reformando.app has a safe Supabase foundation and a first real read path gated behind environment variables:

- `/projects` is **async** and calls `getProjectCardsForProjectsPage()`.
- The app attempts a **read-only** Supabase query for `ProjectCard[]` **only** for `/projects`.
- If any condition is not safe, the app **falls back to mocks**.

Fallback triggers for `/projects`:

- missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Supabase client is `null` → mock fallback;
- missing `NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID` → mock fallback;
- Supabase query error → mock fallback;
- query returns **no rows** → mock fallback;
- row mapping error (missing client display name / invalid project status) → mock fallback.

Security/operations:

- **No service role** key is used.
- **No writes** are performed (no inserts/updates/deletes/upserts).
- Supabase is not “touched” unless you manually configure env vars locally.

---

## 2) Required environment variables (staging/demo)

Create a local-only `.env.local` (never commit) with:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID=

# Optional: enable debug warnings for fallback diagnosis.
NEXT_PUBLIC_SUPABASE_DEBUG=1
```

Rules:

- **Do not commit** `.env.local`.
- Do not paste real keys into GitHub issues, PRs, or chat logs.
- `NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID` is a **temporary activation/filter** for staging/demo.
  - It is **not** a definitive multi-tenant solution.
  - Real security must come from **Auth + memberships + RLS**.

---

## 3) Supabase staging checklist (before trying `/projects`)

Before running the app with env vars, the Supabase staging/demo project should have:

### 3.1 Minimum tables

At minimum for the current `/projects` query:

- `organizations`
- `clients`
- `projects`

And the join fields used by the query:

- `projects.organization_id`
- `projects.client_id`
- `clients.display_name`

### 3.2 RLS status

For staging smoke tests you must decide one of these two modes:

- **Mode A (recommended, realistic):** RLS enabled and correctly configured.
  - Requires that the request has a valid auth context that RLS accepts.
  - With the current app (anon client, no auth wired), this may legitimately return 0 rows.

- **Mode B (temporary for demo only):** relaxed access for the staging dataset.
  - This is not acceptable for production.
  - Document the exact temporary setting and plan to revert.

Important: with the current implementation, if RLS blocks reads, `/projects` will likely fall back to mocks (because the query returns 0 rows).

### 3.3 Minimum seed dataset

- At least **1** organization.
- At least **1** client with `display_name`.
- At least **2** projects:
  - each project has `organization_id` matching `NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID`;
  - each project has a valid `client_id`.

Statuses must match the app’s `ProjectStatus` enum values (see `src/lib/domain/projects/status`).

---

## 4) Minimal SQL for a staging/local smoke dataset (NOT for production)

**Warning:** this is for a local/staging demo database only. Do not run on production.

This is a *minimal* subset designed to satisfy the current `/projects` query shape.

```sql
-- Minimal smoke dataset for staging/local only.
-- Do NOT run in production.

-- Use deterministic UUIDs to simplify env configuration.
-- Organization
insert into public.organizations (id, name, slug)
values (
  '11111111-1111-1111-1111-111111111111',
  'Reformando Demo',
  'reformando-demo'
);

-- Client
insert into public.clients (id, organization_id, display_name)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Cliente Demo — Familia Ortega'
);

-- Projects (2)
insert into public.projects (id, organization_id, client_id, name, status)
values
(
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'Reforma demo — Calle Mayor 18',
  'in_progress'
),
(
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'Reforma demo — Ático Serrano',
  'scheduled'
);
```

Notes:

- If your staging schema enforces additional `not null` columns, add the minimal required fields.
- If your schema uses different column names, adjust the query or the seed.

---

## 5) Local test steps (no runtime changes)

1) Create/update `.env.local` (manually) with the variables above.
2) Run:

```bash
npm run build
```

3) Run one of:

```bash
npm run dev
# or
npm run start
```

4) Open:

- `http://localhost:3000/projects`

5) Confirm behavior:

- With env vars **missing** → `/projects` renders **mock** projects.
- With env vars **present** and dataset accessible → `/projects` renders **Supabase** projects.

6) If you need to diagnose fallback:

- temporarily set `NEXT_PUBLIC_SUPABASE_DEBUG=1` and restart.

---

## 6) Smoke checks via curl (safe)

```bash
curl -I http://localhost:3000/projects
curl -s -L http://localhost:3000/projects | head -n 40
```

Optional heuristic grep (do not rely on exact text):

```bash
curl -s -L http://localhost:3000/projects \
  | grep -E "Demo|Calle|Ático|Cliente" \
  | sed -n '1,80p'
```

---

## 7) How to distinguish Supabase vs mock (at least 3 ways)

1) **Seed naming:** use obvious staging-only names (e.g. “Reforma demo — …”) that do not exist in mocks.
2) **Debug flag:** set `NEXT_PUBLIC_SUPABASE_DEBUG=1` to confirm whether fallbacks are happening (warnings are opt-in).
3) **HTML inspection:** view-source / search in rendered HTML for your seeded project names.
4) (If available) Supabase project logs/analytics in staging (manual inspection) to confirm SELECTs.

---

## 8) Acceptance criteria

This smoke test is considered successful if:

- Without env vars, `/projects` keeps working using mocks.
- With env vars + accessible seed data, `/projects` shows Supabase project cards.
- If RLS/query breaks, `/projects` falls back to mocks (no crash).
- `npm run lint`, `npm run build`, `npm run test` remain green.
- No service role is introduced.
- No writes are performed.
- No unrelated routes are changed.

---

## 9) Rollback (runtime-only)

Rollback is immediate and does not require code changes:

- remove/unset `NEXT_PUBLIC_SUPABASE_URL`
- remove/unset `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- remove/unset `NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID`
- restart the app

The system returns to mock fallback.

---

## 10) Risks

- `NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID` is **not** a real multi-tenant solution.
- Project counters may remain `0` for real data until aggregates are implemented.
- RLS may return 0 rows (expected without auth/membership), which triggers mock fallback.
- Schema drift between proposed docs and actual staging schema can cause mapping fallback.
- Accidental sharing of `.env.local` values (public anon key is still sensitive operationally).
- Never use production data for demo.

---

## 11) Next phase after smoke

If the smoke test passes:

1) Resolve **organizationId** from real auth + `organization_members` instead of env var.
2) Add minimal observability (controlled, not noisy) for fallback frequency.
3) Then consider connecting `/projects/[id]` (ProjectOverview) in a separate, reviewed branch.
4) Keep `/projects` read-only until RLS/auth are stable.
