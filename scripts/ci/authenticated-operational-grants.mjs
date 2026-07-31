import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.CI_FIXTURE_PASSWORD;

if (!url || !anonKey || !serviceRoleKey || !password) {
  throw new Error("Missing local Supabase integration environment");
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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

function log(name, result) {
  process.stdout.write(`case:passed name=${name} result=${result}\n`);
}

async function signedIn(user) {
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email: user.email, password });
  if (error) throw new Error(`Fixture sign-in failed: ${error.status ?? "unknown"}`);
  return client;
}

async function expectDenied(client, operation, label) {
  const { error } = await operation(client);
  if (!error) throw new Error(`${label} unexpectedly succeeded`);
  log(label, "denied");
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
  const memberA = await signedIn(users.memberA);
  const ownerB = await signedIn(users.ownerB);
  const anonymous = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await expectDenied(
    memberA,
    (client) => client.from("projects").update({ description: "not allowed" }).eq("id", PROJECT_OWNER),
    "member project update"
  );
  await expectDenied(
    memberA,
    (client) => client.from("project_tasks").update({ description: "not allowed" }).eq("id", TASK_A),
    "member task update"
  );
  await expectDenied(
    ownerB,
    (client) => client.from("projects").update({ description: "cross org" }).eq("id", PROJECT_OWNER),
    "other organization project update"
  );
  await expectDenied(
    ownerB,
    (client) => client.from("project_tasks").update({ description: "cross org" }).eq("id", TASK_A),
    "other organization task update"
  );
  await expectDenied(
    anonymous,
    (client) => client.from("projects").update({ description: "anonymous" }).eq("id", PROJECT_OWNER),
    "anonymous project update"
  );
  await expectDenied(
    anonymous,
    (client) => client.from("project_tasks").update({ description: "anonymous" }).eq("id", TASK_A),
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

  const { data: isolated, error: isolatedError } = await admin
    .from("projects")
    .select("id")
    .eq("organization_id", ORGANIZATION_B)
    .eq("id", PROJECT_B);
  if (isolatedError || isolated.length !== 1) throw isolatedError ?? new Error("Isolation fixture missing");
  log("tenant isolation", "verified");
}

if (process.argv.includes("--privileges")) {
  const { data, error } = await admin
    .from("information_schema.role_table_grants")
    .select("table_name, privilege_type")
    .eq("grantee", "authenticated")
    .in("table_name", ["project_phases", "projects", "project_tasks"]);
  if (error) throw error;
  const allowed = new Set([
    "project_phases:SELECT",
    "projects:UPDATE",
    "project_tasks:UPDATE",
  ]);
  for (const grant of data) {
    if (allowed.has(`${grant.table_name}:${grant.privilege_type}`)) continue;
    if (["INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"].includes(grant.privilege_type)) {
      throw new Error(`Unexpected authenticated privilege: ${grant.table_name}:${grant.privilege_type}`);
    }
  }
  log("absence of excessive privileges", "verified");
}
