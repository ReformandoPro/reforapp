import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const exceptionsPath = new URL("../../docs/reconciliation/public-table-security-exceptions.json", import.meta.url);
const exceptions = JSON.parse(readFileSync(exceptionsPath, "utf8"));
const exceptionSet = new Set();
for (const entry of exceptions) {
  for (const field of ["table", "rule", "justification", "responsible", "expires_at"]) {
    if (typeof entry?.[field] !== "string" || entry[field].trim() === "") throw new Error(`Invalid exception field: ${field}`);
  }
  if (Date.parse(entry.expires_at) <= Date.now()) throw new Error(`Expired exception: ${entry.table}:${entry.rule}`);
  exceptionSet.add(`${entry.table}:${entry.rule}`);
}

const dbUrl = process.env.SUPABASE_STAGING_DB_URL ?? process.env.DATABASE_URL;
const report = [
  "status=started",
  "server_version_num=unavailable",
  "rules_completed=none",
  "rules_not_verified=server_version,public_acl,anon_acl,authenticated_unsafe_privileges,owner,rls,policies",
];
const printReport = () => {
  report[0] = report[0].startsWith("status=") ? report[0] : `status=${report[0]}`;
  console.log(report.join("\n"));
};
const fail = (message) => {
  report[0] = "status=error";
  report.push(`error=${String(message).replace(/[\r\n]+/g, " ").slice(0, 500)}`);
  printReport();
  process.exitCode = 1;
};

if (!dbUrl) {
  fail("Missing SUPABASE_STAGING_DB_URL or DATABASE_URL");
} else {
  const sql = String.raw`
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '5s';
SHOW server_version_num;
SELECT
  current_setting('server_version_num'),
  c.relname,
  pg_get_userbyid(c.relowner),
  c.relrowsecurity,
  COUNT(DISTINCT p.policyname)::text,
  COALESCE(string_agg(CASE WHEN x.grantee = 0 THEN 'PUBLIC' ELSE r.rolname END || ':' || x.privilege_type, ',' ORDER BY r.rolname, x.privilege_type), '')
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_catalog.pg_policies p ON p.schemaname = n.nspname AND p.tablename = c.relname
LEFT JOIN LATERAL aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) x ON true
LEFT JOIN pg_catalog.pg_roles r ON r.oid = x.grantee
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
GROUP BY current_setting('server_version_num'), c.relname, c.relowner, c.relrowsecurity
ORDER BY c.relname;
COMMIT;
`;
  const result = spawnSync("psql", [dbUrl, "-X", "-v", "ON_ERROR_STOP=1", "-At", "-F", "\t", "-c", sql], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error) {
    fail(`psql unavailable: ${result.error.message}`);
  } else if (result.status !== 0) {
    fail(`read-only query failed with exit ${result.status}`);
  } else {
    const outputLines = result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const versionLine = outputLines.find((line) => /^\d+$/.test(line));
    const versionNum = Number(versionLine ?? 0);
    if (versionLine) report[1] = `server_version_num=${versionLine}`;
    if (!Number.isInteger(versionNum) || versionNum < 150000) {
      fail(`Unsupported PostgreSQL server_version_num=${versionLine ?? "unavailable"}`);
    } else if (versionNum >= 180000) {
      fail(`Unsupported PostgreSQL server_version_num=${versionNum}`);
    } else {
      const maintainSupported = versionNum >= 170000;
      const dataLines = outputLines.filter((line) => line.startsWith(`${versionLine}\t`));
      const violations = [];
      const authenticatedPolicyRequired = new Set(["organizations", "memberships", "clients", "projects", "project_phases", "project_tasks"]);
      const completed = new Set(["public_acl", "anon_acl", "owner", "rls"]);
      for (const line of dataLines) {
        const [rowVersion, table, owner, rls, policyCount, grants] = line.split("\t");
        if (rowVersion !== versionLine) continue;
        const grantSet = new Set(grants ? grants.split(",") : []);
        for (const grant of grantSet) {
          const [role, privilege] = grant.split(":");
          if (role === "PUBLIC") violations.push(`acl=PUBLIC:${table}:${privilege}`);
          if (role === "anon") violations.push(`acl=anon:${table}:${privilege}`);
          if (role === "authenticated" && (privilege === "TRUNCATE" || (maintainSupported && privilege === "MAINTAIN"))) {
            violations.push(`acl=authenticated:${table}:${privilege}`);
          }
        }
        if (owner === "supabase_admin" && !exceptionSet.has(`${table}:owner_supabase_admin`)) violations.push(`owner=${table}:supabase_admin`);
        if (rls !== "t" && !exceptionSet.has(`${table}:rls_disabled`)) violations.push(`rls_disabled=${table}`);
        if (rls === "t" && authenticatedPolicyRequired.has(table) && policyCount === "0" && !exceptionSet.has(`${table}:no_authenticated_policy`)) {
          violations.push(`missing_authenticated_policy=${table}`);
        }
      }
      completed.add("policies");
      if (maintainSupported) completed.add("maintain_authenticated");
      else report.push("maintain_authenticated=not_evaluated");
      report[2] = `rules_completed=${[...completed].sort().join(",")}`;
      report[3] = "rules_not_verified=none";
      if (violations.length) {
        report[0] = "status=violation";
        report.push(`violations=${violations.sort().join(",")}`);
        printReport();
        process.exitCode = 1;
      } else {
        report[0] = "status=pass";
        report.push(`exceptions_applied=${exceptionSet.size}`);
        printReport();
      }
    }
  }
}
