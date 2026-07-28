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

const ORGANIZATION_A = "91000000-0000-4000-8000-000000000001";
const ORGANIZATION_B = "91000000-0000-4000-8000-000000000002";
const USER_OWNER_A = "92000000-0000-4000-8000-000000000001";
const USER_ADMIN_A = "92000000-0000-4000-8000-000000000002";
const USER_MEMBER_A = "92000000-0000-4000-8000-000000000003";
const USER_OWNER_B = "92000000-0000-4000-8000-000000000004";
const CLIENT_A = "93000000-0000-4000-8000-000000000001";
const CLIENT_B = "93000000-0000-4000-8000-000000000002";
const PROJECT_OWNER = "94000000-0000-4000-8000-000000000001";
const PROJECT_ADMIN = "94000000-0000-4000-8000-000000000002";

const users = {
  ownerA: { id: USER_OWNER_A, email: "project-write-owner-a@example.invalid" },
  adminA: { id: USER_ADMIN_A, email: "project-write-admin-a@example.invalid" },
  memberA: { id: USER_MEMBER_A, email: "project-write-member-a@example.invalid" },
  ownerB: { id: USER_OWNER_B, email: "project-write-owner-b@example.invalid" },
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

function projectPayload(overrides = {}) {
  return {
    organization_id: ORGANIZATION_A,
    client_id: null,
    name: "Authenticated Project",
    title: "Authenticated Project",
    client_name: "Sin cliente",
    description: "Created by authenticated CI validation",
    start_date: null,
    expected_end_date: "2026-12-31",
    status: "in_progress",
    address: "",
    type: "",
    progress: 0,
    ...overrides,
  };
}

async function expectInsertDenied(client, payload, label) {
  const { data, error } = await client.from("projects").insert(payload).select("id");
  if (!error || (Array.isArray(data) && data.length > 0)) {
    throw new Error(`${label} unexpectedly inserted a project`);
  }
  log(`case:passed name=${label} result=denied`);
}

if (mode.has("--fixtures")) {
  await Promise.all(Object.values(users).map(ensureUser));
  await insert("organizations", [
    { id: ORGANIZATION_A, name: "Project Write Org A", slug: "project-write-org-a" },
    { id: ORGANIZATION_B, name: "Project Write Org B", slug: "project-write-org-b" },
  ]);
  await insert("memberships", [
    { organization_id: ORGANIZATION_A, user_id: USER_OWNER_A, role: "owner" },
    { organization_id: ORGANIZATION_A, user_id: USER_ADMIN_A, role: "admin" },
    { organization_id: ORGANIZATION_A, user_id: USER_MEMBER_A, role: "member" },
    { organization_id: ORGANIZATION_B, user_id: USER_OWNER_B, role: "owner" },
  ]);
  await insert("clients", [
    { id: CLIENT_A, organization_id: ORGANIZATION_A, display_name: "Project Write Client A" },
    { id: CLIENT_B, organization_id: ORGANIZATION_B, display_name: "Project Write Client B" },
  ]);
  log("fixtures: owner/admin/member, two organizations and isolated clients created");
}

if (mode.has("--authorized")) {
  const ownerA = await signedIn(users.ownerA);
  const adminA = await signedIn(users.adminA);

  const { data: ownerProject, error: ownerError } = await ownerA
    .from("projects")
    .insert(projectPayload({ id: PROJECT_OWNER }))
    .select("id, organization_id, client_id, description, start_date, expected_end_date")
    .single();
  if (ownerError) throw new Error(`Authorized owner insert failed: ${ownerError.code ?? "unknown"}`);
  if (
    ownerProject.id !== PROJECT_OWNER ||
    ownerProject.organization_id !== ORGANIZATION_A ||
    ownerProject.client_id !== null ||
    ownerProject.start_date !== null ||
    ownerProject.expected_end_date !== "2026-12-31"
  ) {
    throw new Error("Authorized owner insert returned inconsistent data");
  }

  const { data: adminProject, error: adminError } = await adminA
    .from("projects")
    .insert(
      projectPayload({
        id: PROJECT_ADMIN,
        client_id: CLIENT_A,
        client_name: "Project Write Client A",
        name: "Admin Project",
        title: "Admin Project",
      })
    )
    .select("id, organization_id, client_id")
    .single();
  if (adminError) throw new Error(`Authorized admin insert failed: ${adminError.code ?? "unknown"}`);
  if (adminProject.client_id !== CLIENT_A || adminProject.organization_id !== ORGANIZATION_A) {
    throw new Error("Authorized admin insert returned inconsistent data");
  }
  log("case:passed name=owner/admin project inserts result=verified_rows");
}

if (mode.has("--denied")) {
  const memberA = await signedIn(users.memberA);
  const ownerA = await signedIn(users.ownerA);
  const ownerB = await signedIn(users.ownerB);
  const anonymous = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await expectInsertDenied(memberA, projectPayload(), "member without write role");
  await expectInsertDenied(anonymous, projectPayload(), "anonymous session");
  await expectInsertDenied(ownerB, projectPayload(), "owner from another organization");
  await expectInsertDenied(
    ownerA,
    projectPayload({ client_id: CLIENT_B, client_name: "Project Write Client B" }),
    "client from another organization"
  );

  const { count, error } = await admin
    .from("projects")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(`Cross-insert verification failed: ${error.code ?? "unknown"}`);
  if (count !== 2) throw new Error(`Denied cases changed project count to ${count}`);
  log("denied: member, anonymous and cross-organization inserts created zero rows");
}
