// R1 ACL smoke. Four modes, all read-only with respect to privileges:
//
//   --privileges   exact set comparison of the ACL layer, independent of RLS
//   --authorized   every operation the service_role contract declares
//   --denied       ACL denial and effective denial, verified separately
//   --adversarial  injects excesses and requires --privileges logic to reject
//
// The ACL layer is always read from pg_class through psql as the owner, never
// through PostgREST, so RLS can never mask a missing or extra GRANT.
import { createClient } from "@supabase/supabase-js";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";

// Contract mirrored from supabase/migrations/20260801130000_r1_acl_orphan_tables_hardening.sql
const SERVICE_TABLES = ["organizations", "memberships", "clients", "projects", "project_phases", "project_tasks"];
const SERVICE_PRIVILEGES = ["SELECT", "INSERT", "UPDATE", "DELETE"];
// R1 deliberately preserves authenticated DML (see the migration header), so the
// authenticated contract is expressed as an invariant rather than an exact set.
const AUTHENTICATED_FORBIDDEN = ["TRUNCATE"];
const CLIENT_ROLES_WITHOUT_ACCESS = ["PUBLIC", "anon"];
const AUDITED_ROLES = ["PUBLIC", "anon", "authenticated", "service_role"];

const url = process.env.SUPABASE_URL?.trim();
const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const dbUrl = process.env.SUPABASE_DB_URL?.trim();
const mode = new Set(process.argv.slice(2));
if (mode.size === 0) mode.add("--privileges");
if (!url || !anonKey || !serviceRoleKey) {
  throw new Error("SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are required");
}
if (!dbUrl) throw new Error("SUPABASE_DB_URL is required: the ACL layer is audited through psql, not PostgREST");

const service = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const anonymous = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });

const safe = (value) => {
  const text = String(value?.message ?? value ?? "").trim();
  const redacted = text.replace(/(key|token|password|authorization)=?\S+/gi, "$1=[redacted]");
  return (redacted || "(no message)").slice(0, 300);
};
const describeError = (error) =>
  `code=${error?.code ?? "none"} status=${error?.status ?? "none"} details=${safe(error?.details ?? "")} message=${safe(error)}`;

function psql(sql) {
  const result = spawnSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-At", "-F", "\t", "-c", sql], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`psql harness failed: ${safe(result.stderr)}`);
  return result.stdout.trim().split("\n").filter(Boolean);
}
const maintainSupported = Number(psql("select current_setting('server_version_num')")[0]) >= 170000;
if (maintainSupported) AUTHENTICATED_FORBIDDEN.push("MAINTAIN");

function manifestTables() {
  const rows = psql(`
    select c.relname
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r','p') and c.relname not like 'r1\\_%'
    order by 1`);
  if (!rows.length) throw new Error("no tables found in schema public");
  return rows;
}

// Tables R1 switched to deny-all: recorded in the baseline while applied, and
// identified as the RLS-less set otherwise.
function denyAllTables() {
  const present = psql("select to_regclass('public.r1_rls_baseline') is not null")[0] === "t";
  if (present) {
    return psql("select table_name from public.r1_rls_baseline where not had_row_security order by 1");
  }
  return psql(`
    select c.relname from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and c.relkind in ('r','p') and c.relname not like 'r1\\_%'
      and not c.relrowsecurity order by 1`);
}

function aclRows() {
  return psql(`
    select case when a.grantee = 0 then 'PUBLIC' else pg_catalog.pg_get_userbyid(a.grantee) end
             || '|' || c.relname || '|' || a.privilege_type
             || '|' || case when a.is_grantable then 't' else 'f' end
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) a
    where n.nspname = 'public'
      and c.relkind in ('r','p')
      and c.relname not like 'r1\\_%'
      and (case when a.grantee = 0 then 'PUBLIC' else pg_catalog.pg_get_userbyid(a.grantee) end)
          = any (array['PUBLIC','anon','authenticated','service_role'])
      and (a.privilege_type <> 'MAINTAIN' or current_setting('server_version_num')::integer >= 170000)
    order by 1`);
}

// Throws with literal added / removed / grant_option_added lists.
function assertPrivilegeContract() {
  const tables = new Set(manifestTables());
  const actual = aclRows();
  const expectedService = new Set();
  for (const table of SERVICE_TABLES) {
    if (!tables.has(table)) continue;
    for (const privilege of SERVICE_PRIVILEGES) expectedService.add(`service_role|${table}|${privilege}|f`);
  }

  const added = [];
  const grantOptionAdded = [];
  for (const row of actual) {
    const [role, table, privilege, grantable] = row.split("|");
    if (grantable === "t") grantOptionAdded.push(`${role}:${table}:${privilege}`);
    if (CLIENT_ROLES_WITHOUT_ACCESS.includes(role)) {
      added.push(`${role}:${table}:${privilege}`);
    } else if (role === "authenticated") {
      if (AUTHENTICATED_FORBIDDEN.includes(privilege)) added.push(`${role}:${table}:${privilege}`);
    } else if (role === "service_role") {
      if (!expectedService.has(`service_role|${table}|${privilege}|${grantable}`)) {
        added.push(`${role}:${table}:${privilege}`);
      }
    }
  }
  const actualSet = new Set(actual);
  const removed = [...expectedService]
    .filter((row) => !actualSet.has(row))
    .map((row) => { const [r, t, p] = row.split("|"); return `${r}:${t}:${p}`; });

  if (added.length || removed.length || grantOptionAdded.length) {
    throw new Error(
      `R1 privilege contract mismatch` +
      ` added=[${added.sort().join(", ") || "none"}]` +
      ` removed=[${removed.sort().join(", ") || "none"}]` +
      ` grant_option_added=[${grantOptionAdded.sort().join(", ") || "none"}]`
    );
  }
  return { tables: tables.size, audited: AUDITED_ROLES.length, rows: actual.length };
}

async function main() {
  if (mode.has("--privileges")) {
    const summary = assertPrivilegeContract();
    console.log(`maintain_supported=${maintainSupported}`);
    console.log(`privileges: exact ACL contract holds over ${summary.tables} tables and ${summary.audited} roles (${summary.rows} grants)`);
  }

  if (mode.has("--authorized")) {
    const tables = new Set(manifestTables());
    for (const table of SERVICE_TABLES) {
      if (!tables.has(table)) throw new Error(`service_role contract names a table that does not exist: ${table}`);
    }
    const orgId = randomUUID();
    const userId = randomUUID();
    const email = `r1-smoke-${userId}@example.invalid`;
    const created = [];
    const expect = async (label, promise) => {
      const { data, error } = await promise;
      if (error) throw new Error(`service_role contract failed on ${label}: ${describeError(error)}`);
      return data;
    };
    try {
      const { error: userError } = await service.auth.admin.createUser({
        id: userId, email, password: `r1-${userId}`, email_confirm: true,
      });
      if (userError) throw new Error(`ephemeral auth user creation failed: ${describeError(userError)}`);

      await expect("organizations INSERT", service.from("organizations").insert({ id: orgId, name: "R1 smoke org" }).select("id"));
      created.push("organizations");
      await expect("organizations SELECT", service.from("organizations").select("id").eq("id", orgId).single());
      await expect("organizations UPDATE", service.from("organizations").update({ name: "R1 smoke org 2" }).eq("id", orgId).select("id"));

      await expect("memberships INSERT", service.from("memberships").insert({ organization_id: orgId, user_id: userId, role: "owner" }).select("organization_id"));
      created.push("memberships");
      await expect("memberships SELECT", service.from("memberships").select("role").eq("organization_id", orgId));
      await expect("memberships UPDATE", service.from("memberships").update({ role: "admin" }).eq("organization_id", orgId).select("role"));

      const client = await expect("clients INSERT", service.from("clients").insert({ organization_id: orgId, display_name: "R1 smoke client" }).select("id").single());
      created.push("clients");
      await expect("clients SELECT", service.from("clients").select("id").eq("id", client.id).single());
      await expect("clients UPDATE", service.from("clients").update({ display_name: "R1 smoke client 2" }).eq("id", client.id).select("id"));

      const project = await expect("projects INSERT", service.from("projects").insert({
        organization_id: orgId, name: "R1 smoke project", title: "R1 smoke project",
        client_name: "R1 smoke client", status: "in_progress", address: "R1 1", type: "renovation",
      }).select("id").single());
      created.push("projects");
      await expect("projects SELECT", service.from("projects").select("id").eq("id", project.id).single());
      await expect("projects UPDATE", service.from("projects").update({ address: "R1 2" }).eq("id", project.id).select("id"));

      const phase = await expect("project_phases INSERT", service.from("project_phases").insert({
        organization_id: orgId, project_id: project.id, title: "R1 smoke phase",
      }).select("id").single());
      created.push("project_phases");
      await expect("project_phases SELECT", service.from("project_phases").select("id").eq("id", phase.id).single());
      await expect("project_phases UPDATE", service.from("project_phases").update({ title: "R1 smoke phase 2" }).eq("id", phase.id).select("id"));

      const task = await expect("project_tasks INSERT", service.from("project_tasks").insert({
        organization_id: orgId, project_id: project.id, title: "R1 smoke task", status: "pending", priority: "medium",
      }).select("id").single());
      created.push("project_tasks");
      await expect("project_tasks SELECT", service.from("project_tasks").select("id").eq("id", task.id).single());
      await expect("project_tasks UPDATE", service.from("project_tasks").update({ title: "R1 smoke task 2" }).eq("id", task.id).select("id"));

      await expect("project_tasks DELETE", service.from("project_tasks").delete().eq("id", task.id).select("id"));
      await expect("project_phases DELETE", service.from("project_phases").delete().eq("id", phase.id).select("id"));
      await expect("projects DELETE", service.from("projects").delete().eq("id", project.id).select("id"));
      await expect("clients DELETE", service.from("clients").delete().eq("id", client.id).select("id"));
      await expect("memberships DELETE", service.from("memberships").delete().eq("organization_id", orgId).select("organization_id"));
      await expect("organizations DELETE", service.from("organizations").delete().eq("id", orgId).select("id"));
      for (const privilege of SERVICE_PRIVILEGES) console.log(`authorized: service_role ${privilege} verified on ${SERVICE_TABLES.join(", ")}`);
    } finally {
      // Verifiable cleanup: nothing the smoke created may survive.
      await service.from("project_tasks").delete().eq("organization_id", orgId);
      await service.from("project_phases").delete().eq("organization_id", orgId);
      await service.from("projects").delete().eq("organization_id", orgId);
      await service.from("clients").delete().eq("organization_id", orgId);
      await service.from("memberships").delete().eq("organization_id", orgId);
      await service.from("organizations").delete().eq("id", orgId);
      await service.auth.admin.deleteUser(userId).catch(() => {});
    }
    const leftovers = psql(`
      select 'organizations' t, count(*) n from public.organizations where id = '${orgId}'
      union all select 'memberships', count(*) from public.memberships where organization_id = '${orgId}'
      union all select 'clients', count(*) from public.clients where organization_id = '${orgId}'
      union all select 'projects', count(*) from public.projects where organization_id = '${orgId}'
      union all select 'project_phases', count(*) from public.project_phases where organization_id = '${orgId}'
      union all select 'project_tasks', count(*) from public.project_tasks where organization_id = '${orgId}'
      union all select 'auth_users', count(*) from auth.users where id = '${userId}'`)
      .map((row) => row.split("\t"))
      .filter(([, n]) => n !== "0");
    if (leftovers.length) throw new Error(`ephemeral fixture cleanup incomplete: ${leftovers.map(([t, n]) => `${t}=${n}`).join(", ")}`);
    console.log("authorized: ephemeral fixtures cleaned up and verified empty");
  }

  if (mode.has("--denied")) {
    // Layer 1: the ACL. Read as owner, so RLS cannot mask anything.
    const forbidden = aclRows().filter((row) => CLIENT_ROLES_WITHOUT_ACCESS.includes(row.split("|")[0]));
    if (forbidden.length) {
      throw new Error(`anon/PUBLIC retain ACL privileges: ${forbidden.map((r) => r.split("|").slice(0, 3).join(":")).join(", ")}`);
    }
    console.log(`denied: ACL layer clean, anon and PUBLIC hold no privilege on any of ${manifestTables().length} tables`);

    // Layer 2: the effect, classified explicitly and never used as a substitute
    // for the ACL check. Post-conditions are read as owner through psql.
    for (const table of denyAllTables()) {
      const before = psql(`select count(*) from public.${table}`)[0];
      const result = await anonymous.from(table).select("*", { count: "exact" });
      let verdict;
      if (result.error) {
        const code = String(result.error.code ?? "");
        if (code === "42501") verdict = "acl_denied_42501";
        else if (code === "401" || code === "403") verdict = `auth_rejected_${code}`;
        else verdict = `rejected_${code || "unknown"}`;
      } else if (Array.isArray(result.data) && result.data.length === 0) {
        verdict = "rls_noop_zero_rows";
      } else {
        throw new Error(`anon obtained ${result.data?.length ?? "non-array"} rows from ${table}`);
      }
      const after = psql(`select count(*) from public.${table}`)[0];
      if (before !== after) throw new Error(`anon probe changed ${table}: ${before} -> ${after}`);
      console.log(`denied: ${table} verdict=${verdict} rows_before=${before} rows_after=${after} error=${result.error ? describeError(result.error) : "none"}`);
    }
  }

  if (mode.has("--adversarial")) {
    const snapshotBefore = aclRows().join("\n");
    const injections = [
      { role: "anon", privilege: "SELECT", table: denyAllTables()[0] },
      { role: "anon", privilege: "DELETE", table: denyAllTables()[0] },
      { role: "authenticated", privilege: "TRUNCATE", table: denyAllTables()[0] },
      { role: "service_role", privilege: "TRUNCATE", table: SERVICE_TABLES[0] },
    ];
    for (const { role, privilege, table } of injections) {
      if (!table) throw new Error("adversarial injection has no target table");
      const had = psql(`select has_table_privilege('${role}','public.${table}','${privilege}')`)[0];
      psql(`grant ${privilege} on table public.${table} to ${role}`);
      let rejected = false;
      let message = "";
      try {
        assertPrivilegeContract();
      } catch (error) {
        rejected = true;
        message = safe(error);
      } finally {
        if (had === "t") psql(`grant ${privilege} on table public.${table} to ${role}`);
        else psql(`revoke ${privilege} on table public.${table} from ${role}`);
      }
      if (!rejected) throw new Error(`--privileges failed to reject injected ${role}:${table}:${privilege}`);
      if (!message.includes(`${role}:${table}:${privilege}`)) {
        throw new Error(`--privileges rejected but did not name ${role}:${table}:${privilege}: ${message}`);
      }
      console.log(`adversarial: rejected and named ${role}:${table}:${privilege}`);
    }
    // Removal must be detected too.
    const removalTable = SERVICE_TABLES[0];
    psql(`revoke select on table public.${removalTable} from service_role`);
    let removalRejected = false;
    let removalMessage = "";
    try {
      assertPrivilegeContract();
    } catch (error) {
      removalRejected = true;
      removalMessage = safe(error);
    } finally {
      psql(`grant select on table public.${removalTable} to service_role`);
    }
    if (!removalRejected) throw new Error(`--privileges failed to reject removed service_role:${removalTable}:SELECT`);
    if (!removalMessage.includes(`service_role:${removalTable}:SELECT`)) {
      throw new Error(`--privileges rejected removal but did not name it: ${removalMessage}`);
    }
    console.log(`adversarial: rejected and named removed service_role:${removalTable}:SELECT`);

    const snapshotAfter = aclRows().join("\n");
    if (snapshotBefore !== snapshotAfter) throw new Error("adversarial mode did not restore the exact ACL snapshot");
    console.log("adversarial: ACL snapshot restored exactly");
  }
}

await main();
