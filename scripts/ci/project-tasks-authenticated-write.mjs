import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.CI_FIXTURE_PASSWORD;

if (!url || !anonKey || !serviceRoleKey || !password) {
  throw new Error("Missing local Supabase integration environment");
}

const mode = new Set(process.argv.slice(2));
const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ORGANIZATION_A = "81000000-0000-4000-8000-000000000001";
const ORGANIZATION_B = "81000000-0000-4000-8000-000000000002";
const USER_OWNER_A = "82000000-0000-4000-8000-000000000001";
const USER_MEMBER_A = "82000000-0000-4000-8000-000000000002";
const USER_OWNER_B = "82000000-0000-4000-8000-000000000003";
const USER_NONE = "82000000-0000-4000-8000-000000000004";
const CLIENT_A = "83000000-0000-4000-8000-000000000001";
const CLIENT_B = "83000000-0000-4000-8000-000000000002";
const PROJECT_A = "84000000-0000-4000-8000-000000000001";
const PROJECT_B = "84000000-0000-4000-8000-000000000002";
const PHASE_A = "85000000-0000-4000-8000-000000000001";
const PHASE_B = "85000000-0000-4000-8000-000000000002";
const CREATED_TASK = "86000000-0000-4000-8000-000000000001";

const users = {
  ownerA: { id: USER_OWNER_A, email: "task-write-owner-a@example.invalid" },
  memberA: { id: USER_MEMBER_A, email: "task-write-member-a@example.invalid" },
  ownerB: { id: USER_OWNER_B, email: "task-write-owner-b@example.invalid" },
  none: { id: USER_NONE, email: "task-write-none@example.invalid" },
};

function log(message) {
  process.stdout.write(`${message}\n`);
}

async function ensureUser({ id, email }) {
  const { error } = await admin.auth.admin.createUser({
    id,
    email,
    password,
    email_confirm: true,
  });
  if (error && !String(error.message).toLowerCase().includes("already")) throw error;
}

async function insert(table, rows) {
  const { error } = await admin.from(table).insert(rows);
  if (error) throw new Error(`Fixture insertion failed for ${table}: ${error.code ?? "unknown"}`);
}

async function signedIn(user) {
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email: user.email, password });
  if (error) throw new Error(`Fixture sign-in failed: ${error.status ?? "unknown"}`);
  return client;
}

async function expectInsertDenied(client, payload, label) {
  const { data, error } = await client
    .from("project_tasks")
    .insert(payload)
    .select("id");
  if (!error || (Array.isArray(data) && data.length > 0)) {
    throw new Error(`${label} unexpectedly inserted a project task`);
  }
  log(`case:passed name=${label} result=denied`);
}

if (mode.has("--fixtures")) {
  await Promise.all(Object.values(users).map(ensureUser));
  await insert("organizations", [
    { id: ORGANIZATION_A, name: "Task Write Org A", slug: "task-write-org-a" },
    { id: ORGANIZATION_B, name: "Task Write Org B", slug: "task-write-org-b" },
  ]);
  await insert("memberships", [
    { organization_id: ORGANIZATION_A, user_id: USER_OWNER_A, role: "owner" },
    { organization_id: ORGANIZATION_A, user_id: USER_MEMBER_A, role: "member" },
    { organization_id: ORGANIZATION_B, user_id: USER_OWNER_B, role: "owner" },
  ]);
  await insert("clients", [
    { id: CLIENT_A, organization_id: ORGANIZATION_A, display_name: "Task Write Client A" },
    { id: CLIENT_B, organization_id: ORGANIZATION_B, display_name: "Task Write Client B" },
  ]);
  await insert("projects", [
    {
      id: PROJECT_A,
      organization_id: ORGANIZATION_A,
      client_id: CLIENT_A,
      name: "Task Write Project A",
      title: "Task Write Project A",
      client_name: "Task Write Client A",
      start_date: new Date().toISOString(),
      status: "in_progress",
      address: "CI A",
      type: "reform",
    },
    {
      id: PROJECT_B,
      organization_id: ORGANIZATION_B,
      client_id: CLIENT_B,
      name: "Task Write Project B",
      title: "Task Write Project B",
      client_name: "Task Write Client B",
      start_date: new Date().toISOString(),
      status: "in_progress",
      address: "CI B",
      type: "reform",
    },
  ]);
  await insert("project_phases", [
    { id: PHASE_A, organization_id: ORGANIZATION_A, project_id: PROJECT_A, title: "Phase A", status: "planned", sort_order: 1 },
    { id: PHASE_B, organization_id: ORGANIZATION_B, project_id: PROJECT_B, title: "Phase B", status: "planned", sort_order: 1 },
  ]);
  log("fixtures: owner/member/no-membership, two organizations, projects and phases created");
}

if (mode.has("--authorized")) {
  const ownerA = await signedIn(users.ownerA);
  const { data, error } = await ownerA
    .from("project_tasks")
    .insert({
      id: CREATED_TASK,
      organization_id: ORGANIZATION_A,
      project_id: PROJECT_A,
      phase_id: PHASE_A,
      title: "Authenticated write task",
      description: null,
      status: "pending",
      priority: "medium",
      due_date: null,
    })
    .select("id, organization_id, project_id, phase_id, status")
    .single();
  if (error) throw new Error(`Authorized task insert failed: ${error.code ?? "unknown"}`);
  if (
    data.id !== CREATED_TASK ||
    data.organization_id !== ORGANIZATION_A ||
    data.project_id !== PROJECT_A ||
    data.phase_id !== PHASE_A ||
    data.status !== "pending"
  ) {
    throw new Error("Authorized task insert returned inconsistent data");
  }

  const { data: verified, error: verifyError } = await admin
    .from("project_tasks")
    .select("id, organization_id, project_id, phase_id, status")
    .eq("id", CREATED_TASK)
    .single();
  if (verifyError || verified.organization_id !== ORGANIZATION_A || verified.status !== "pending") {
    throw new Error("Inserted task could not be verified safely");
  }
  log("case:passed name=authorized owner insert result=verified_pending_row");
}

if (mode.has("--denied")) {
  const memberA = await signedIn(users.memberA);
  const ownerB = await signedIn(users.ownerB);
  const none = await signedIn(users.none);
  const anonymous = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const basePayload = {
    organization_id: ORGANIZATION_A,
    project_id: PROJECT_A,
    phase_id: PHASE_A,
    title: "Denied task",
    status: "pending",
    priority: "medium",
  };

  await expectInsertDenied(memberA, basePayload, "member without write role");
  await expectInsertDenied(none, basePayload, "user without membership");
  await expectInsertDenied(anonymous, basePayload, "anonymous session");
  await expectInsertDenied(ownerB, basePayload, "owner from another organization");
  await expectInsertDenied(
    await signedIn(users.ownerA),
    { ...basePayload, phase_id: PHASE_B },
    "phase from another organization and project"
  );

  const { count, error } = await admin
    .from("project_tasks")
    .select("id", { count: "exact", head: true })
    .neq("id", CREATED_TASK);
  if (error) throw new Error(`Cross-insert verification failed: ${error.code ?? "unknown"}`);
  if (count !== 0) throw new Error(`Denied cases created ${count} unexpected task row(s)`);
  log("denied: member, no-membership, anonymous and cross-organization inserts created zero rows");
}
