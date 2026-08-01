import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const exceptionsPath = new URL("../../docs/reconciliation/public-table-security-exceptions.json", import.meta.url);
const exceptions = JSON.parse(readFileSync(exceptionsPath, "utf8"));
if (!Array.isArray(exceptions)) throw new Error("Exceptions file must contain an array");

const exceptionKey = (table, rule) => `${table}:${rule}`;
const exceptionSet = new Set(exceptions.map((entry) => {
  for (const field of ["table", "rule", "justification", "responsible", "expires_at"]) {
    if (typeof entry?.[field] !== "string" || entry[field].trim() === "") {
      throw new Error(`Invalid exception field: ${field}`);
    }
  }
  if (Number.isNaN(Date.parse(entry.expires_at)) || Date.parse(entry.expires_at) <= Date.now()) {
    throw new Error(`Expired exception: ${entry.table}:${entry.rule}`);
  }
  return exceptionKey(entry.table, entry.rule);
}));

const dbUrl = process.env.SUPABASE_STAGING_DB_URL ?? process.env.DATABASE_URL;
if (!dbUrl) throw new Error("Missing SUPABASE_STAGING_DB_URL or DATABASE_URL");

const sql = String.raw`
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '5s';
SELECT
  current_setting('server_version_num'),
  c.relname,
  pg_get_userbyid(c.relowner),
  c.relrowsecurity,
  COUNT(DISTINCT p.policyname)::text,
  COALESCE(string_agg(CASE WHEN x.grantee = 0 THEN 'PUBLIC' ELSE r.rolname END || ':' ||
    CASE x.privilege_type
      WHEN 'SELECT' THEN 'SELECT'
      WHEN 'INSERT' THEN 'INSERT'
      WHEN 'UPDATE' THEN 'UPDATE'
      WHEN 'DELETE' THEN 'DELETE'
      WHEN 'REFERENCES' THEN 'REFERENCES'
      WHEN 'TRIGGER' THEN 'TRIGGER'
      WHEN 'TRUNCATE' THEN 'TRUNCATE'
      WHEN 'MAINTAIN' THEN 'MAINTAIN'
      ELSE x.privilege_type
    END, ',' ORDER BY r.rolname, x.privilege_type), '')
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_catalog.pg_policies p ON p.schemaname = n.nspname AND p.tablename = c.relname
LEFT JOIN LATERAL aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) x ON true
LEFT JOIN pg_catalog.pg_roles r ON r.oid = x.grantee
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
GROUP BY current_setting('server_version_num'), c.relname, c.relowner, c.relrowsecurity
ORDER BY c.relname;
COMMIT;
`;

const result = spawnSync("psql", [dbUrl, "-X", "-v", "ON_ERROR_STOP=1", "-At", "-F", "\t", "-c", sql], {
  encoding: "utf8",
  env: { ...process.env, PGPASSWORD: undefined },
  maxBuffer: 8 * 1024 * 1024,
});
if (result.error) throw new Error(`psql unavailable: ${result.error.message}`);
if (result.status !== 0) throw new Error(`Read-only security query failed with exit ${result.status}`);

const lines = result.stdout.trim() === "" ? [] : result.stdout.trimEnd().split("\n");
const versionNum = Number(lines[0]?.split("\t")[0] ?? 0);
if (!Number.isInteger(versionNum) || versionNum < 150000) throw new Error("Unsupported PostgreSQL version");
const maintainSupported = versionNum >= 170000;
console.log(`maintain_supported=${maintainSupported}`);

const authenticatedPolicyRequired = new Set([
  "organizations", "memberships", "clients", "projects", "project_phases", "project_tasks",
]);
const violations = [];
for (const line of lines) {
  const [rowVersion, table, owner, rls, policyCount, grants] = line.split("\t");
  if (rowVersion !== String(versionNum)) throw new Error(`Nondeterministic PostgreSQL version for ${table}`);
  const grantSet = new Set(grants ? grants.split(",") : []);
  for (const grant of grantSet) {
    const [role, privilege] = grant.split(":");
    if (role === "PUBLIC" || role === "anon") violations.push(`acl=${role}:${table}:${privilege}`);
    if (role === "authenticated" && ["TRUNCATE", ...(maintainSupported ? ["MAINTAIN"] : [])].includes(privilege)) {
      violations.push(`acl=authenticated:${table}:${privilege}`);
    }
  }
  if (owner === "supabase_admin" && !exceptionSet.has(exceptionKey(table, "owner_supabase_admin"))) {
    violations.push(`owner=${table}:supabase_admin`);
  }
  if (rls !== "t" && !exceptionSet.has(exceptionKey(table, "rls_disabled"))) violations.push(`rls_disabled=${table}`);
  if (rls === "t" && authenticatedPolicyRequired.has(table) && policyCount === "0" &&
      !exceptionSet.has(exceptionKey(table, "no_authenticated_policy"))) {
    violations.push(`missing_authenticated_policy=${table}`);
  }
  console.log(`table=${table} owner=${owner} rls=${rls} policies=${policyCount}`);
}
if (violations.length > 0) {
  console.error("public_table_security=FAIL");
  for (const violation of violations.sort()) console.error(`violation=${violation}`);
  process.exit(1);
}
console.log("public_table_security=PASS");
