import { createClient } from "@supabase/supabase-js";
import { spawnSync } from "node:child_process";

const orphanTables = ["budgets", "budget_items", "materials", "notifications", "tasks"];
const serviceTables = ["organizations", "memberships", "clients", "projects", "profiles", "project_phases", "project_tasks"];
const privileges = ["SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER", "MAINTAIN"];
const url = process.env.SUPABASE_URL?.trim();
const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const dbUrl = process.env.SUPABASE_DB_URL?.trim();
const mode = new Set(process.argv.slice(2));
if (mode.size === 0) mode.add("--privileges");
if (!url || !anonKey || !serviceRoleKey) throw new Error("SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are required");

const service = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const anonymous = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
const safe = (value) => String(value?.message ?? value).replace(/(key|token|password|authorization)=?\S+/gi, "$1=[redacted]").slice(0, 240);
const psql = (sql) => {
  if (!dbUrl) throw new Error("SUPABASE_DB_URL is required for this mode");
  const result = spawnSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-At", "-F", "\t", "-c", sql], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`local SQL harness failed: ${safe(result.stderr)}`);
  return result.stdout.trim().split("\n").filter(Boolean);
};
const present = (table) => {
  const rows = psql(`select to_regclass('public.${table}') is not null`);
  return rows[0] === "t";
};
async function count(client, table) {
  const result = await client.from(table).select("*", { count: "exact", head: true });
  if (result.error) throw new Error(`${table}: ${safe(result.error)}`);
  return result.count ?? 0;
}

if (mode.has("--privileges")) {
  const rows = psql(`
    select case when acl.grantee=0 then 'public' else pg_get_userbyid(acl.grantee) end, c.relname, acl.privilege_type, acl.is_grantable
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid=c.relnamespace
    cross join lateral aclexplode(coalesce(c.relacl, acldefault('r',c.relowner))) acl
    where n.nspname='public'
      and c.relname in ('organizations','memberships','clients','projects','profiles','project_phases','project_tasks','project_task_comments','project_documents','project_progress_updates','project_budgets','project_costs','project_purchases','project_task_issues','budgets','budget_items','materials','notifications','tasks')
      and grantee.rolname in ('public','anon','authenticated','service_role')
    order by 1,2,3`);
  const actual = new Set(rows);
  const expected = new Set();
  const add = (role, table, privilege) => { if (present(table)) expected.add(`${role}\t${table}\t${privilege}\tf`); };
  for (const table of [...serviceTables, ...orphanTables]) for (const privilege of privileges) {
    if (serviceTables.includes(table) && ["SELECT","INSERT","UPDATE","DELETE"].includes(privilege)) add("service_role", table, privilege);
  }
  for (const key of ["memberships:SELECT","projects:SELECT","project_tasks:SELECT","project_task_issues:SELECT","project_task_issues:INSERT","projects:INSERT","project_tasks:INSERT"]) {
    const [table, privilege] = key.split(":"); add("authenticated", table, privilege);
  }
  const added = [...actual].filter((x) => !expected.has(x));
  const missing = [...expected].filter((x) => !actual.has(x));
  if (added.length || missing.length) throw new Error(`privilege contract mismatch added=${added.join(",")} missing=${missing.join(",")}`);
  console.log("privileges: exact service_role/authenticated contract passed");
}

if (mode.has("--authorized")) {
  for (const table of serviceTables) if (present(table)) {
    const before = await count(service, table);
    const after = await count(service, table);
    if (before !== after) throw new Error(`service_role post-condition changed ${table}`);
    console.log(`authorized: ${table} count=${before} unchanged`);
  }
}

if (mode.has("--denied")) {
  for (const table of orphanTables) if (present(table)) {
    const before = await count(service, table);
    const result = await anonymous.from(table).select("*", { count: "exact" });
    if (!result.error && (!Array.isArray(result.data) || result.data.length !== 0)) throw new Error(`anon effective read on ${table}`);
    const after = await count(service, table);
    if (before !== after) throw new Error(`anon post-condition changed ${table}`);
    console.log(`denied: ${table} preserved count=${before}`);
  }
}

if (mode.has("--adversarial")) {
  if (!dbUrl) throw new Error("SUPABASE_DB_URL is required for --adversarial");
  const injection = (role, privilege, table) => {
    const before = psql(`select has_table_privilege('${role}','public.${table}','${privilege}')`)[0];
    psql(`grant ${privilege} on table public.${table} to ${role}`);
    try {
      const injected = psql(`select has_table_privilege('${role}','public.${table}','${privilege}')`)[0];
      if (injected !== "t") throw new Error(`injection setup failed for ${role}:${table}:${privilege}`);
      const rows = psql(`select case when a.grantee=0 then 'public' else pg_get_userbyid(a.grantee) end, c.relname, a.privilege_type, a.is_grantable from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a where n.nspname='public' and c.relname='${table}' and (case when a.grantee=0 then 'public' else pg_get_userbyid(a.grantee) end)='${role}' and a.privilege_type='${privilege}'`);
      if (!rows.length) throw new Error(`privileges smoke failed to detect added=${role}:${table}:${privilege}`);
      console.log(`adversarial: detected added=${role}:${table}:${privilege}`);
    } finally {
      psql(before === "t" ? `grant ${privilege} on table public.${table} to ${role}` : `revoke ${privilege} on table public.${table} from ${role}`);
    }
  };
  injection("anon", "DELETE", "budgets");
  injection("authenticated", "TRUNCATE", "budgets");
  console.log("adversarial: restored exact pre-state");
}
