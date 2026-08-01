import { createClient } from "@supabase/supabase-js";
import { spawnSync } from "node:child_process";

const tables = ["budgets", "budget_items", "materials", "notifications", "tasks"];
const url = process.env.SUPABASE_URL?.trim();
const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !anonKey || !serviceRoleKey) {
  throw new Error("SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are required");
}

const service = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const anonymous = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
const mode = new Set(process.argv.slice(2));
if (mode.size === 0) mode.add("--authorized");

function errorText(error) {
  return String(error?.message ?? error).replace(/(key|token|password|authorization)=?\S+/gi, "$1=[redacted]").slice(0, 240);
}

async function count(client, table) {
  const { count, error } = await client.from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(`${table}: count failed: ${errorText(error)}`);
  return count ?? 0;
}

if (mode.has("--authorized")) {
  for (const table of tables) {
    const before = await count(service, table);
    const { error } = await service.from(table).select("*", { count: "exact", head: true });
    if (error) throw new Error(`service_role lost required read contract for ${table}: ${errorText(error)}`);
    const after = await count(service, table);
    if (before !== after) throw new Error(`service_role post-condition changed ${table}: ${before} -> ${after}`);
    console.log(`authorized: ${table} count=${before} unchanged`);
  }
}

if (mode.has("--denied")) {
  for (const table of tables) {
    const before = await count(service, table);
    const { data, error } = await anonymous.from(table).select("*", { count: "exact" });
    if (error) {
      console.log(`denied: ${table} rejected code=${error.code ?? "unknown"}`);
      continue;
    }
    if (!Array.isArray(data) || data.length !== 0) {
      throw new Error(`anon effective read on ${table}: returned ${data?.length ?? "non-array"} rows`);
    }
    const after = await count(service, table);
    if (before !== after) throw new Error(`anon read changed ${table}: ${before} -> ${after}`);
    console.log(`denied: ${table} returned zero rows and preserved count=${before}`);
  }
}

if (mode.has("--adversarial")) {
  const dbUrl = process.env.SUPABASE_DB_URL?.trim();
  if (!dbUrl) throw new Error("SUPABASE_DB_URL is required for --adversarial");
  const runSql = (sql) => {
    const result = spawnSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-Atqc", sql], { encoding: "utf8" });
    if (result.status !== 0) throw new Error(`local SQL harness failed: ${errorText(result.stderr)}`);
    return result.stdout.trim();
  };
  const assertInjected = (role, privilege, table) => {
    runSql(`grant ${privilege} on table public.${table} to ${role}`);
    try {
      const actual = runSql(`select has_table_privilege('${role}', 'public.${table}', '${privilege}')`);
      if (actual !== "t") throw new Error(`adversarial injection was not visible: ${role} ${privilege} ${table}`);
      console.log(`adversarial: detected injected ${privilege} for ${role} on ${table}`);
    } finally {
      runSql(`revoke ${privilege} on table public.${table} from ${role}`);
    }
  };
  assertInjected("anon", "DELETE", "budgets");
  assertInjected("authenticated", "TRUNCATE", "budgets");
  runSql("revoke select on table public.projects from service_role");
  try {
    const actual = runSql("select has_table_privilege('service_role', 'public.projects', 'SELECT')");
    if (actual !== "f") throw new Error("service_role privilege removal was not detected");
    console.log("adversarial: detected removed service_role SELECT contract");
  } finally {
    runSql("grant select on table public.projects to service_role");
  }
}
