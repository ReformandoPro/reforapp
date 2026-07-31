import { execFileSync } from "node:child_process";

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const password = process.env.CI_FIXTURE_PASSWORD;

if (!url || !anonKey || !password) throw new Error("Missing local Supabase integration environment");

const users = {
  ownerA: { email: "project-write-owner-a@example.invalid" },
  adminA: { email: "project-write-admin-a@example.invalid" },
  memberA: { email: "project-write-member-a@example.invalid" },
  ownerB: { email: "project-write-owner-b@example.invalid" },
};

const ORGANIZATION_A = "91000000-0000-4000-8000-000000000001";
const ORGANIZATION_B = "91000000-0000-4000-8000-000000000002";
const PROJECT_OWNER = "94000000-0000-4000-8000-000000000001";
const PROJECT_ADMIN = "94000000-0000-4000-8000-000000000002";
const PROJECT_B = "94000000-0000-4000-8000-000000000003";
const TASK_A = "86000000-0000-4000-8000-000000000001";
const PHASE_A = "85000000-0000-4000-8000-000000000001";

function log(name, result, details = "") {
  process.stdout.write(`case:passed name=${name} result=${result}${details ? ` ${details}` : ""}\n`);
}

async function signedIn(user) {
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email: user.email, password });
  if (error) throw new Error(`Fixture sign-in failed: ${error.status ?? "unknown"}`);
  return client;
}

async function readRow(client, table, id, columns) {
  const { data, error } = await client.from(table).select(columns).eq("id", id).single();
  if (error) throw error;
  return data;
}

async function expectDenied(client, reader, operation, table, id, columns, before, label) {
  const { data, error } = await operation(client);
  if (error) {
    log(label, "denied_by_grant_or_rls", `code=${error.code ?? error.status ?? "unknown"}`);
  } else if (Array.isArray(data) && data.length === 0) {
    log(label, "no_op_by_rls");
  } else if (data == null) {
    throw new Error(`${label} returned no result metadata; cannot prove zero rows changed`);
  } else {
    throw new Error(`${label} unexpectedly modified a row`);
  }

  const after = await readRow(reader, table, id, columns);
  if (JSON.stringify(after) !== JSON.stringify(before)) {
    throw new Error(`${label} changed ${table}.${id}`);
  }
  log(`${label} unchanged`, "verified");
}

function runSql(sql) {
  const databaseUrl = process.env.SUPABASE_DB_URL ?? process.env.SUPABASE_STAGING_DB_URL;
  if (!databaseUrl) throw new Error("Missing SUPABASE_DB_URL for direct privilege audit");
  try {
    const { PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD, ...safeEnv } = process.env;
    return execFileSync("psql", ["--dbname", databaseUrl, "-X", "-v", "ON_ERROR_STOP=1", "-At", "-F", "\t", "-c", sql], {
      env: safeEnv,
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
    }).trim();
  } catch (error) {
    if (error?.code === "ENOENT") throw new Error("psql is required for --privileges but was not found");
    throw error;
  }
}

if (process.argv.includes("--authorized")) {
  const ownerA = await signedIn(users.ownerA);
  const adminA = await signedIn(users.adminA);

  const projectUpdate = await ownerA
    .from("projects")
    .update({ description: "Updated by owner" })
    .eq("id", PROJECT_OWNER);
  if (projectUpdate.error) throw projectUpdate.error;
  log("owner project update", "allowed_by_rls");

  const adminUpdate = await adminA
    .from("projects")
    .update({ description: "Updated by admin" })
    .eq("id", PROJECT_ADMIN);
  if (adminUpdate.error) throw adminUpdate.error;
  log("admin project update", "allowed_by_rls");

  const taskUpdate = await ownerA
    .from("project_tasks")
    .update({ description: "Updated by owner" })
    .eq("id", TASK_A);
  if (taskUpdate.error) throw taskUpdate.error;
  log("owner task update", "allowed_by_rls");

  const adminTaskUpdate = await adminA
    .from("project_tasks")
    .update({ description: "Updated by admin" })
    .eq("id", TASK_A);
  if (adminTaskUpdate.error) throw adminTaskUpdate.error;
  log("admin task update", "allowed_by_rls");

  const phaseRead = await ownerA
    .from("project_phases")
    .select("id, project_id, organization_id")
    .eq("id", PHASE_A)
    .single();
  if (phaseRead.error || phaseRead.data.project_id !== PROJECT_OWNER) {
    throw phaseRead.error ?? new Error("Phase lookup returned inconsistent data");
  }
  log("task phase evaluation", "readable");
}

if (process.argv.includes("--denied")) {
  const ownerA = await signedIn(users.ownerA);
  const memberA = await signedIn(users.memberA);
  const ownerB = await signedIn(users.ownerB);
  const anonymous = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const projectOwnerBefore = await readRow(ownerA, "projects", PROJECT_OWNER, "id, description");
  const taskBefore = await readRow(ownerA, "project_tasks", TASK_A, "id, description");

  await expectDenied(
    memberA,
    ownerA,
    (client) => client.from("projects").update({ description: "not allowed" }).eq("id", PROJECT_OWNER).select("id, description"),
    "projects", PROJECT_OWNER, "id, description", projectOwnerBefore,
    "member project update"
  );
  await expectDenied(
    memberA,
    ownerA,
    (client) => client.from("project_tasks").update({ description: "not allowed" }).eq("id", TASK_A).select("id, description"),
    "project_tasks", TASK_A, "id, description", taskBefore,
    "member task update"
  );
  await expectDenied(
    ownerB,
    ownerA,
    (client) => client.from("projects").update({ description: "cross org" }).eq("id", PROJECT_OWNER).select("id, description"),
    "projects", PROJECT_OWNER, "id, description", projectOwnerBefore,
    "other organization project update"
  );
  await expectDenied(
    ownerB,
    ownerA,
    (client) => client.from("project_tasks").update({ description: "cross org" }).eq("id", TASK_A).select("id, description"),
    "project_tasks", TASK_A, "id, description", taskBefore,
    "other organization task update"
  );
  await expectDenied(
    anonymous,
    ownerA,
    (client) => client.from("projects").update({ description: "anonymous" }).eq("id", PROJECT_OWNER).select("id, description"),
    "projects", PROJECT_OWNER, "id, description", projectOwnerBefore,
    "anonymous project update"
  );
  await expectDenied(
    anonymous,
    ownerA,
    (client) => client.from("project_tasks").update({ description: "anonymous" }).eq("id", TASK_A).select("id, description"),
    "project_tasks", TASK_A, "id, description", taskBefore,
    "anonymous task update"
  );

  const { data: crossOrgPhases, error: phaseError } = await memberA
    .from("project_phases")
    .select("id")
    .eq("organization_id", ORGANIZATION_B);
  if (phaseError || crossOrgPhases.length !== 0) {
    throw phaseError ?? new Error("member unexpectedly read another organization phase");
  }
  log("member cross organization phase read", "denied_by_rls");

  const { data: isolated, error: isolatedError } = await ownerB
    .from("projects")
    .select("id")
    .eq("organization_id", ORGANIZATION_B)
    .eq("id", PROJECT_B);
  if (isolatedError || isolated.length !== 1) throw isolatedError ?? new Error("Isolation fixture missing");
  log("tenant isolation", "verified");
}

if (process.argv.includes("--privileges")) {
  const baseline = runSql(`
    select privilege_key, had_privilege
    from public.authenticated_operational_grant_baseline
    order by privilege_key;
  `).split("\n").filter(Boolean).map((line) => line.split("\t"));
  const current = runSql(`
    select table_name, privilege_type
    from information_schema.role_table_grants
    where grantee = 'authenticated'
      and table_schema = 'public'
      and table_name in ('project_phases', 'projects', 'project_tasks')
    order by table_name, privilege_type;
  `).split("\n").filter(Boolean).map((line) => line.split("\t"));
  const baselineByKey = new Map(baseline.map(([key, value]) => [key, value === "t"]));
  const expectedDelta = new Set(["project_phases:SELECT", "projects:UPDATE", "project_tasks:UPDATE"]);
  const knownPreexisting = new Set([
    "projects:SELECT", "projects:INSERT",
    "project_tasks:SELECT", "project_tasks:INSERT",
  ]);
  const actual = new Set(current.map(([table, privilege]) => `${table}:${privilege}`));
  for (const [key, hadPrivilege] of baselineByKey) {
    const [table, privilege] = key === "project_phases_select"
      ? ["project_phases", "SELECT"]
      : key === "projects_update" ? ["projects", "UPDATE"] : ["project_tasks", "UPDATE"];
    if (!actual.has(`${table}:${privilege}`)) throw new Error(`Missing required privilege ${key}`);
    log(`baseline ${key}`, hadPrivilege ? "preexisting" : "granted_by_migration");
  }
  for (const privilege of expectedDelta) {
    if (!actual.has(privilege)) throw new Error(`Missing expected privilege ${privilege}`);
  }
  const delta = new Set([...actual].filter((privilege) => !knownPreexisting.has(privilege)));
  if (delta.size !== expectedDelta.size || [...expectedDelta].some((privilege) => !delta.has(privilege))) {
    const unexpected = [...delta].filter((privilege) => !expectedDelta.has(privilege));
    throw new Error(`Unauthorized privilege delta: ${unexpected.join(", ") || "missing expected privilege"}`);
  }
  for (const privilege of actual) {
    if (expectedDelta.has(privilege)) log(`delta ${privilege}`, "granted_by_migration");
    else log(`preexisting ${privilege}`, "not_attributed_to_migration");
  }
  log("absence of excessive privileges", "verified");
}
