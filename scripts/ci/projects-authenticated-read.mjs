import { createClient } from "@supabase/supabase-js";
import { appendFileSync } from "node:fs";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.CI_FIXTURE_PASSWORD;
const logFile = `${process.env.RUNNER_TEMP ?? "."}/projects-authenticated-read.log`;

if (!url || !anonKey || !serviceRoleKey || !password) throw new Error("Missing CI-only Supabase configuration");
const log = (message) => { appendFileSync(logFile, `${message}\n`); console.log(message); };
const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const A = "00000000-0000-0000-0000-0000000000a1";
const B = "00000000-0000-0000-0000-0000000000b1";
const EMPTY = "00000000-0000-0000-0000-0000000000e1";
const USER_A = "00000000-0000-0000-0000-0000000000a2";
const USER_B = "00000000-0000-0000-0000-0000000000b2";
const USER_NONE = "00000000-0000-0000-0000-0000000000c2";

async function ensureUser(id, email) {
  const { error } = await admin.auth.admin.createUser({ id, email, password, email_confirm: true });
  if (error && !/already registered|already exists/i.test(error.message)) throw error;
}
async function insert(table, rows) {
  const { error } = await admin.from(table).upsert(rows);
  if (error) throw error;
}
async function signedIn(id, email) {
  const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw error ?? new Error(`No session for ${id}`);
  return client;
}
async function projects(client, expectedOrg, forbiddenOrg) {
  const { data, error } = await client.from("projects").select("id, organization_id, name").order("updated_at", { ascending: false });
  if (error) throw error;
  if (data.some((row) => row.organization_id !== expectedOrg || row.organization_id === forbiddenOrg)) throw new Error("Organization isolation failed");
  return data;
}

const mode = new Set(process.argv.slice(2));
if (mode.has("--fixtures")) {
  await ensureUser(USER_A, "projects-a@example.invalid");
  await ensureUser(USER_B, "projects-b@example.invalid");
  await ensureUser(USER_NONE, "projects-none@example.invalid");
  await insert("organizations", [{ id: A, name: "CI Organization A", slug: "ci-projects-a" }, { id: B, name: "CI Organization B", slug: "ci-projects-b" }, { id: EMPTY, name: "CI Empty Organization", slug: "ci-projects-empty" }]);
  await insert("memberships", [{ organization_id: A, user_id: USER_A, role: "owner" }, { organization_id: B, user_id: USER_B, role: "owner" }]);
  const { data: clientA, error: clientError } = await admin.from("clients").insert({ organization_id: A, display_name: "CI Client A" }).select("id").single();
  if (clientError) throw clientError;
  const { data: clientB, error: clientErrorB } = await admin.from("clients").insert({ organization_id: B, display_name: "CI Client B" }).select("id").single();
  if (clientErrorB) throw clientErrorB;
  await insert("projects", [
    { organization_id: A, client_id: clientA.id, name: "CI Project A", title: "CI Project A", client_name: "CI Client A", start_date: new Date().toISOString(), status: "in_progress", address: "CI", type: "reform" },
    { organization_id: B, client_id: clientB.id, name: "CI Project B", title: "CI Project B", client_name: "CI Client B", start_date: new Date().toISOString(), status: "in_progress", address: "CI", type: "reform" },
  ]);
  log("fixtures: organizations A/B/empty; users A/B/no-membership; projects A/B");
}
if (mode.has("--authenticated")) {
  const a = await signedIn(USER_A, "projects-a@example.invalid");
  const b = await signedIn(USER_B, "projects-b@example.invalid");
  const none = await signedIn(USER_NONE, "projects-none@example.invalid");
  const aRows = await projects(a, A, B); if (aRows.length !== 1) throw new Error("User A expected one project");
  const bRows = await projects(b, B, A); if (bRows.length !== 1) throw new Error("User B expected one project");
  const noneRows = await none.from("projects").select("id"); if (!noneRows.error) throw new Error("No-membership user was not denied");
  log("authenticated: A/B isolation and no-membership denial passed");
}
if (mode.has("--anonymous")) {
  const anonymous = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await anonymous.from("projects").select("id");
  if (!error && data?.length) throw new Error("Anonymous user received projects");
  log("anonymous: no project access passed");
}
if (mode.has("--isolation")) log("isolation: sequential clients use independent sessions");
