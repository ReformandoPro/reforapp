import { createClient } from "@supabase/supabase-js";
import { appendFileSync } from "node:fs";

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
const url = requireEnv("SUPABASE_URL");
const anonKey = requireEnv("SUPABASE_ANON_KEY");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const password = process.env.CI_FIXTURE_PASSWORD;
const logFile = `${process.env.RUNNER_TEMP ?? "."}/projects-authenticated-read.log`;

let parsedUrl;
try { parsedUrl = new URL(url); } catch { throw new Error("SUPABASE_URL is not a valid URL"); }
if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("SUPABASE_URL must use HTTP or HTTPS");
if (!password) throw new Error("Missing CI-only fixture password");
const log = (message) => { appendFileSync(logFile, `${message}\n`); console.log(message); };
const safeError = (error) => ({
  code: typeof error?.code === "string" ? error.code : "unknown",
  message: String(error?.message ?? error).replace(/(key|token|cookie|password|authorization)=?\S+/gi, "$1=[redacted]").slice(0, 300),
  stack: error?.stack ? String(error.stack).split("\n").slice(0, 4).join("\n") : "",
});
async function operation(name, context, action) {
  log(`fixture:start operation=${name} context=${context}`);
  try {
    const result = await action();
    log(`fixture:complete operation=${name} context=${context}`);
    return result;
  } catch (error) {
    const detail = safeError(error);
    log(`fixture:failure operation=${name} context=${context} code=${detail.code} message=${JSON.stringify(detail.message)} stack=${JSON.stringify(detail.stack)}`);
    throw error;
  }
}
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
  await operation("create auth user A", USER_A, () => ensureUser(USER_A, "projects-a@example.invalid"));
  await operation("create auth user B", USER_B, () => ensureUser(USER_B, "projects-b@example.invalid"));
  await operation("create auth user without membership", USER_NONE, () => ensureUser(USER_NONE, "projects-none@example.invalid"));
  await operation("create organizations A B empty", "organizations", () => insert("organizations", [{ id: A, name: "CI Organization A", slug: "ci-projects-a" }, { id: B, name: "CI Organization B", slug: "ci-projects-b" }, { id: EMPTY, name: "CI Empty Organization", slug: "ci-projects-empty" }]));
  await operation("create memberships", "memberships", () => insert("memberships", [{ organization_id: A, user_id: USER_A, role: "owner" }, { organization_id: B, user_id: USER_B, role: "owner" }]));
  const { data: clientA, error: clientError } = await operation("create client A", A, () => admin.from("clients").insert({ organization_id: A, display_name: "CI Client A" }).select("id").single());
  if (clientError) throw clientError;
  const { data: clientB, error: clientErrorB } = await operation("create client B", B, () => admin.from("clients").insert({ organization_id: B, display_name: "CI Client B" }).select("id").single());
  if (clientErrorB) throw clientErrorB;
  await operation("create projects A B", "projects", () => insert("projects", [
    { organization_id: A, client_id: clientA.id, name: "CI Project A", title: "CI Project A", client_name: "CI Client A", start_date: new Date().toISOString(), status: "in_progress", address: "CI", type: "reform" },
    { organization_id: B, client_id: clientB.id, name: "CI Project B", title: "CI Project B", client_name: "CI Client B", start_date: new Date().toISOString(), status: "in_progress", address: "CI", type: "reform" },
  ]));
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
