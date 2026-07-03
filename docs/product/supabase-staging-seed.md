# Supabase Staging — Demo seed (B4)

This doc explains how to create a **Supabase Staging** project (no real data), apply repo migrations, create **Auth demo users**, and load a **demo dataset** for QA.

> ⚠️ **Never run this seed in production.**
> 
> This seed is designed only for a staging project with fake data.

---

## What this seed creates

### Organizations
- Org 1: **Reformas Ágiles S.L.**
- Org 2: **Construcciones Seguras Ltda.**

### Users (created manually in Auth)
You will create these users manually in Supabase Auth and copy their UUIDs:
- `OWNER1_USER_ID` (Org 1 owner)
- `MEMBER1_USER_ID` (Org 1 member)
- `OWNER2_USER_ID` (Org 2 owner)
- `NO_MEMBERSHIP_USER_ID` (no org membership; used to test onboarding / missing membership)

Suggested emails (do **not** store passwords/real credentials in git):
- `owner1@example.test`
- `member1@example.test`
- `owner2@example.test`
- `nomembership@example.test`

### Demo data
Org 1 clients:
- Familia Pérez
- Oficinas Central S.A.
- Comunidad de Vecinos C/ Mayor, 22

Org 1 projects:
- Reforma Integral Baño - Familia Pérez
- Habilitación Oficina Planta 3 - Oficinas Central S.A.
- Reparación Fachada - Comunidad C/ Mayor, 22

Org 2:
- 1 client
- 1 project

### Optional module data
If the schema exists (it does in current repo migrations), the seed also creates **some** module rows for Org 1 (project 1):
- phases
- tasks (some assigned to MEMBER1)
- progress updates
- costs
- budget + lines
- purchases + items

### Explicitly NOT seeded
- **project_documents**: not seeded on purpose (real flow requires Storage + real files). Bucket stays empty; upload should be tested from UI in a later block.

### `public.profiles`
- Auth users must be created manually.
- The repo migrations define a trigger to auto-create `public.profiles` for new `auth.users`.
- The seed also includes a safe fallback **upsert** to ensure minimal profile rows exist for the demo users (idempotent, and compatible with the trigger).

---

## Step-by-step (Staging only)

### 1) Create a Supabase **Staging** project
In Supabase:
- Create a new project with a name like `reformando-staging`.
- Ensure it is **not** production.

### 2) Apply repo migrations to staging
From the repo (on a machine with Docker), run migrations into the staging DB using the normal Supabase workflow you already use for staging.

(We’re not connecting app-beta yet in this block.)

### 3) Create Auth demo users manually
In Supabase Dashboard → Authentication → Users:
- Create 4 users (owner1, member1, owner2, nomembership).
- Copy each user UUID.

### 4) Confirm you are NOT in production
Before running any SQL:
- Double-check the **project name** says `staging`.
- Double-check the dashboard URL / project ref.

### 5) Prepare the seed SQL
Open:
- `supabase/seed/staging-demo.sql`

Replace these placeholders (search/replace) with real UUIDs:
- `__OWNER1_USER_ID__`
- `__MEMBER1_USER_ID__`
- `__OWNER2_USER_ID__`
- `__NO_MEMBERSHIP_USER_ID__`

### 6) Run the seed
Supabase Dashboard → SQL Editor:
- Paste the edited SQL
- Run it

The seed is **idempotent** (safe to run multiple times) thanks to deterministic UUIDs + `ON CONFLICT` upserts.

---

## About `public.profiles`
Some module tables (`project_costs`, `project_purchases`, `project_progress_updates`) reference `public.profiles(user_id)`.

The repo migrations create `public.profiles` and a trigger on `auth.users` to auto-create a profile row when a new auth user is created.

To reduce friction, the seed also performs an idempotent **upsert fallback** into `public.profiles` for the four demo users.

If the seed fails with a foreign key error to `public.profiles`, verify that the Auth users exist and then run:

```sql
select user_id, display_name, email
from public.profiles
where user_id in (
  '__OWNER1_USER_ID__'::uuid,
  '__MEMBER1_USER_ID__'::uuid,
  '__OWNER2_USER_ID__'::uuid,
  '__NO_MEMBERSHIP_USER_ID__'::uuid
);
```

---

## Verification queries (SQL Editor)
After seeding, you can run:

```sql
select o.name, count(*) as memberships
from public.organizations o
left join public.memberships m on m.organization_id = o.id
group by o.name
order by o.name;

select o.name, count(*) as clients
from public.organizations o
left join public.clients c on c.organization_id = o.id
group by o.name
order by o.name;

select o.name, count(*) as projects
from public.organizations o
left join public.projects p on p.organization_id = o.id
group by o.name
order by o.name;
```

---

## What to save for the next block (but DO NOT apply yet)
For the next block (connecting the deployed app to staging), you’ll need:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> Do **not** add these to Hostinger / app-beta yet in B4.
