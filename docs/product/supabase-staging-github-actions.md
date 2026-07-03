# Supabase Staging Ops via GitHub Actions (B5)

Goal: operate the **Supabase staging** project without using a terminal.

This repo provides a manual GitHub Actions workflow:
- `.github/workflows/supabase-staging-ops.yml`

It supports 4 modes (run one at a time):
- `backup_only`
- `db_push`
- `seed`
- `verify`

> ⚠️ Safety rules
> - Never run against production.
> - Never store secrets in git.
> - Never use service role key in frontend.
> - This workflow does **not** touch app-beta or Hostinger.

---

## 0) Staging project identity (must match)
- Project name: `reformando-staging`
- Project ref: `hafljwojvblyfljddjcr`

All modes require input `confirm_project_ref` and will fail unless it equals exactly:
- `hafljwojvblyfljddjcr`

---

## 1) GitHub Secrets to configure
Go to:
GitHub repo → Settings → Secrets and variables → Actions → New repository secret

### Required
#### `SUPABASE_STAGING_DB_URL`
- Must be the **Session Pooler** Postgres connection string (full URI) including password.
- This is used for:
  - `backup_only`
  - `seed`
  - `verify`

**Important:**
- Do not paste it into the repo.
- Do not print it in logs.

### Recommended (db_push only)
#### `SUPABASE_ACCESS_TOKEN`
Used only by `db_push`.

Why it is needed:
- `supabase db push` typically requires authenticating the CLI against Supabase API for the project ref.

How to create:
- Supabase Dashboard → Account → Access Tokens → Create token

After B5/B6:
- Revoke the token.

---

## 2) How to run: backup_only
1. GitHub → Actions → **Supabase Staging Ops (manual)**
2. Run workflow:
   - `mode`: `backup_only`
   - `confirm_project_ref`: `hafljwojvblyfljddjcr`
3. Wait for completion.
4. Download the artifact:
   - Open the workflow run
   - Artifacts → download `supabase-staging-backup-public-schema`

Expected:
- Artifact contains: `reformando-staging-before-b5-<timestamp>.sql`

If it fails:
- Do not run db_push.
- Fix DB URL/permissions/connectivity first.

---

## 3) How to run: db_push (apply migrations)
**Precondition:** you have already generated AND downloaded the backup artifact.

1. GitHub → Actions → Supabase Staging Ops (manual) → Run workflow:
   - `mode`: `db_push`
   - `confirm_project_ref`: `hafljwojvblyfljddjcr`
   - `backup_confirmed`: `I_HAVE_DOWNLOADED_BACKUP`

Notes:
- This step applies repo migrations from `supabase/migrations/`.
- It must NOT drop/reset.
- If there are conflicts (existing tables incompatible), it should fail.

If it fails with conflicts:
- Stop.
- Decide on an alternative plan:
  - controlled reset after backup (explicit approval)
  - or use a different staging project

---

## 4) Create Auth demo users (Supabase Dashboard)
Supabase Dashboard → Authentication → Users → Add user:
- `owner1@example.test`
- `member1@example.test`
- `owner2@example.test`
- `nomembership@example.test`

Copy their UUIDs:
- `OWNER1_USER_ID`
- `MEMBER1_USER_ID`
- `OWNER2_USER_ID`
- `NO_MEMBERSHIP_USER_ID`

---

## 5) How to run: seed
1. GitHub → Actions → Supabase Staging Ops (manual) → Run workflow:
   - `mode`: `seed`
   - `confirm_project_ref`: `hafljwojvblyfljddjcr`
   - `OWNER1_USER_ID`: <uuid>
   - `MEMBER1_USER_ID`: <uuid>
   - `OWNER2_USER_ID`: <uuid>
   - `NO_MEMBERSHIP_USER_ID`: <uuid>

Notes:
- The workflow renders a temporary SQL file in `$RUNNER_TEMP`.
- It replaces placeholders from `supabase/seed/staging-demo.sql`.
- It executes the seed against staging.
- It deletes the rendered file at the end.
- It does NOT seed documents.

If it fails:
- Verify that the Auth users exist.
- Verify migrations were applied.

---

## 6) How to run: verify
1. GitHub → Actions → Supabase Staging Ops (manual) → Run workflow:
   - `mode`: `verify`
   - `confirm_project_ref`: `hafljwojvblyfljddjcr`
   - `NO_MEMBERSHIP_USER_ID`: <uuid>

Expected output:
- counts for:
  - organizations, memberships, clients, projects
  - project_phases, project_tasks, project_budgets, project_costs, project_purchases
- invariant:
  - `no_membership_user_memberships = 0`
  - `project_documents_count = 0` (seed does not insert)

---

## 7) What if something fails?

### backup_only fails
- Stop.
- Fix `SUPABASE_STAGING_DB_URL` secret.
- Ensure pooler connection is reachable.

### db_push fails
- If it fails due to conflicts with existing tables:
  - Stop.
  - Do not drop/reset automatically.
  - Decide next steps explicitly.

### seed fails
- Usually indicates:
  - missing Auth users
  - schema mismatch / migrations not applied
  - RLS/policy blocking (less likely)

### verify fails
- Usually indicates:
  - missing tables (db_push not applied)
  - missing seed data

---

## 8) Rotation / cleanup (after B5/B6)
- Rotate the staging DB password.
- Revoke `SUPABASE_ACCESS_TOKEN`.
- Review GitHub Actions logs to ensure no secrets were printed.

---

## Scope notes
- This workflow does not deploy anything.
- It does not touch app-beta or Hostinger.
- It does not touch production.
