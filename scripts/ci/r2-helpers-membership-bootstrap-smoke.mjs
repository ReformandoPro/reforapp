// R2 smoke: helper hardening and memberships bootstrap policy.
//
//   --acl        EXECUTE contract of the five helpers
//   --helpers    behaviour per role, including the anti-oracle guarantees
//   --bootstrap  the insert policy end to end through PostgREST
//   --exception  row_security is restored when a helper raises
//
// Helper behaviour is exercised through psql with `set local role authenticated`
// and `set local request.jwt.claim.sub`, which is how auth.uid() resolves. The
// bootstrap policy is exercised through PostgREST with real sessions, because
// that is the path the application uses.
import { createClient } from "@supabase/supabase-js";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const HELPERS = [
  "public.is_org_member(uuid)",
  "public.is_org_admin(uuid)",
  "public.org_has_any_membership(uuid)",
  "public.is_client_in_org(uuid,uuid)",
  "public.org_is_empty_for_bootstrap(uuid)",
];

const url = process.env.SUPABASE_URL?.trim();
const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const dbUrl = process.env.SUPABASE_DB_URL?.trim();
const password = process.env.CI_FIXTURE_PASSWORD?.trim() || "R2-only-password-123456789!";
const mode = new Set(process.argv.slice(2));
if (mode.size === 0) ["--acl", "--helpers", "--bootstrap", "--exception"].forEach((m) => mode.add(m));
if (!url || !anonKey || !serviceRoleKey) {
  throw new Error("SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are required");
}
if (!dbUrl) throw new Error("SUPABASE_DB_URL is required: helper behaviour is exercised through psql");

const safe = (value) => {
  const text = String(value?.message ?? value ?? "").trim();
  return (text.replace(/(key|token|password|authorization)=?\S+/gi, "$1=[redacted]") || "(no message)").slice(0, 300);
};
const describe = (error) => `code=${error?.code ?? "none"} status=${error?.status ?? "none"} message=${safe(error)}`;
const pass = (name, detail) => console.log(`case:passed name=${name}${detail ? ` ${detail}` : ""}`);

function psql(sql, { allowError = false, ignoreErrors = false } = {}) {
  // -q suppresses command tags such as BEGIN and SET, which would otherwise be
  // interleaved with the result rows. ignoreErrors drops ON_ERROR_STOP so a
  // script can continue past an expected error and recover with a savepoint.
  // The script is fed through stdin rather than -c: psql sends -c as a single
  // query, so an expected error would abort the whole block and a savepoint
  // could never recover it.
  const args = [dbUrl, "-q", "-At", "-F", "\t"];
  if (!ignoreErrors) args.push("-v", "ON_ERROR_STOP=1");
  const result = spawnSync("psql", args, { encoding: "utf8", input: sql });
  if (result.status !== 0) {
    if (allowError) return { failed: true, stderr: safe(result.stderr) };
    throw new Error(`psql harness failed: ${safe(result.stderr)}`);
  }
  return { failed: false, rows: result.stdout.trim().split("\n").filter(Boolean) };
}
// The last row is the result of the final SELECT in a multi-statement script.
const one = (sql) => { const r = psql(sql).rows; return r[r.length - 1]; };

// Calls an expression as `authenticated` with a given auth.uid().
const asUser = (userId, expression) =>
  one(`begin; set local role authenticated; set local request.jwt.claim.sub = '${userId}'; select (${expression})::text; rollback;`);
const asAnon = (expression, opts) =>
  psql(`begin; set local role anon; set local request.jwt.claim.sub = ''; select (${expression})::text; rollback;`, opts);

const ORG_A = randomUUID();
const ORG_EMPTY = randomUUID();
const ORG_B = randomUUID();
const OWNER_A = randomUUID();
const ADMIN_A = randomUUID();
const MEMBER_A = randomUUID();
const OWNER_B = randomUUID();
const BOOTSTRAPPER = randomUUID();
const NEWCOMER = randomUUID();
const users = [
  ["ownerA", OWNER_A], ["adminA", ADMIN_A], ["memberA", MEMBER_A],
  ["ownerB", OWNER_B], ["bootstrapper", BOOTSTRAPPER], ["newcomer", NEWCOMER],
];
const email = (label) => `r2-smoke-${label}-${ORG_A}@example.invalid`;
const service = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const anonymous = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function signIn(label) {
  const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email: email(label), password });
  if (error) throw new Error(`sign-in failed for ${label}: ${describe(error)}`);
  return client;
}

async function seed() {
  for (const [label, id] of users) {
    const { error } = await service.auth.admin.createUser({ id, email: email(label), password, email_confirm: true });
    if (error) throw new Error(`ephemeral user ${label} failed: ${describe(error)}`);
  }
  // gotrue rejects null token columns, and the fixtures must be owner-created so
  // they do not depend on the policy under test.
  psql(`update auth.users set confirmation_token=coalesce(confirmation_token,''),
        recovery_token=coalesce(recovery_token,''), email_change_token_new=coalesce(email_change_token_new,''),
        email_change=coalesce(email_change,''), email_change_token_current=coalesce(email_change_token_current,''),
        phone_change=coalesce(phone_change,''), phone_change_token=coalesce(phone_change_token,''),
        reauthentication_token=coalesce(reauthentication_token,'')
        where email like 'r2-smoke-%${ORG_A}@example.invalid'`);
  psql(`insert into public.organizations (id, name) values
        ('${ORG_A}','R2 org A'), ('${ORG_EMPTY}','R2 org empty'), ('${ORG_B}','R2 org B')`);
  psql(`insert into public.memberships (organization_id, user_id, role) values
        ('${ORG_A}','${OWNER_A}','owner'), ('${ORG_A}','${ADMIN_A}','admin'),
        ('${ORG_A}','${MEMBER_A}','member'), ('${ORG_B}','${OWNER_B}','owner')`);
  const clientId = one(`insert into public.clients (organization_id, display_name)
        values ('${ORG_A}','R2 client A') returning id`);
  return { clientId };
}

async function cleanup() {
  psql(`delete from public.memberships where organization_id in ('${ORG_A}','${ORG_EMPTY}','${ORG_B}')`);
  psql(`delete from public.clients where organization_id in ('${ORG_A}','${ORG_EMPTY}','${ORG_B}')`);
  psql(`delete from public.organizations where id in ('${ORG_A}','${ORG_EMPTY}','${ORG_B}')`);
  for (const [, id] of users) await service.auth.admin.deleteUser(id).catch(() => {});
  const left = psql(`select count(*) from public.organizations where id in ('${ORG_A}','${ORG_EMPTY}','${ORG_B}')`).rows[0];
  if (left !== "0") throw new Error(`ephemeral fixture cleanup incomplete: organizations=${left}`);
}

async function main() {
  if (mode.has("--acl")) {
    for (const helper of HELPERS) {
      const row = one(`select has_function_privilege('public','${helper}','EXECUTE')::text || ',' ||
        has_function_privilege('anon','${helper}','EXECUTE')::text || ',' ||
        has_function_privilege('authenticated','${helper}','EXECUTE')::text`);
      const [pub, anon, auth] = row.split(",");
      if (pub !== "false") throw new Error(`PUBLIC retains EXECUTE on ${helper}`);
      if (anon !== "false") throw new Error(`anon retains EXECUTE on ${helper}`);
      if (auth !== "true") throw new Error(`authenticated lacks EXECUTE on ${helper}`);
      const attrs = one(`select l.lanname || ',' || p.prosecdef::text || ',' || coalesce(array_to_string(p.proconfig,','),'')
        from pg_catalog.pg_proc p join pg_catalog.pg_language l on l.oid = p.prolang where p.oid = '${helper}'::regprocedure`);
      const [lang, secdef, config] = attrs.split(",", 3);
      if (lang !== "plpgsql") throw new Error(`${helper} is ${lang}, expected plpgsql`);
      if (secdef !== "true") throw new Error(`${helper} is not SECURITY DEFINER`);
      if (!config.startsWith("search_path=pg_catalog")) throw new Error(`${helper} has search_path ${config}`);
      pass(`acl ${helper}`, "public=false anon=false authenticated=true secdef=true search_path=pg_catalog, public");
    }
  }

  if (mode.has("--helpers") || mode.has("--bootstrap") || mode.has("--exception")) {
    const { clientId } = await seed();
    try {
      if (mode.has("--helpers")) {
        const expect = (label, expression, expected, userId) => {
          const actual = asUser(userId, expression);
          if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
          pass(label, `result=${actual}`);
        };
        expect("owner is_org_member", `public.is_org_member('${ORG_A}')`, "true", OWNER_A);
        expect("owner is_org_admin", `public.is_org_admin('${ORG_A}')`, "true", OWNER_A);
        expect("admin is_org_admin", `public.is_org_admin('${ORG_A}')`, "true", ADMIN_A);
        expect("member is_org_member", `public.is_org_member('${ORG_A}')`, "true", MEMBER_A);
        expect("member is_org_admin denied", `public.is_org_admin('${ORG_A}')`, "false", MEMBER_A);
        expect("owner org_has_any_membership", `public.org_has_any_membership('${ORG_A}')`, "true", OWNER_A);
        // Anti-oracle: a member of another organisation learns nothing about A.
        expect("other org org_has_any_membership no oracle", `public.org_has_any_membership('${ORG_A}')`, "false", OWNER_B);
        expect("other org is_org_member", `public.is_org_member('${ORG_A}')`, "false", OWNER_B);
        expect("owner is_client_in_org", `public.is_client_in_org('${clientId}','${ORG_A}')`, "true", OWNER_A);
        expect("other org is_client_in_org no oracle", `public.is_client_in_org('${clientId}','${ORG_A}')`, "false", OWNER_B);
        expect("null client_id", `public.is_client_in_org(null,'${ORG_A}')`, "false", OWNER_A);
        expect("empty org is_empty_for_bootstrap", `public.org_is_empty_for_bootstrap('${ORG_EMPTY}')`, "true", BOOTSTRAPPER);
        expect("non empty org is_empty_for_bootstrap", `public.org_is_empty_for_bootstrap('${ORG_A}')`, "false", BOOTSTRAPPER);

        // anon cannot execute any helper: the ACL rejects it before any logic runs.
        for (const call of [
          `public.is_org_member('${ORG_A}')`,
          `public.is_org_admin('${ORG_A}')`,
          `public.org_has_any_membership('${ORG_A}')`,
          `public.is_client_in_org('${clientId}','${ORG_A}')`,
          `public.org_is_empty_for_bootstrap('${ORG_EMPTY}')`,
        ]) {
          const result = asAnon(call, { allowError: true });
          if (!result.failed || !/permission denied for function/i.test(result.stderr)) {
            throw new Error(`anon was not rejected by the ACL on ${call}: ${result.failed ? result.stderr : result.rows?.join()}`);
          }
        }
        pass("anon cannot execute helpers", "result=permission_denied_for_function");
      }

      if (mode.has("--bootstrap")) {
        const bootstrapper = await signIn("bootstrapper");
        const newcomer = await signIn("newcomer");
        const memberA = await signIn("memberA");
        const adminA = await signIn("adminA");

        // Someone else's user_id must be rejected even in an empty organisation.
        const impostor = await bootstrapper.from("memberships")
          .insert({ organization_id: ORG_EMPTY, user_id: NEWCOMER, role: "owner" });
        if (!impostor.error) throw new Error("bootstrap accepted an owner row for another user");
        pass("bootstrap for another user rejected", `result=${describe(impostor.error)}`);

        // First owner, by the user themself, in an empty organisation.
        const first = await bootstrapper.from("memberships")
          .insert({ organization_id: ORG_EMPTY, user_id: BOOTSTRAPPER, role: "owner" });
        if (first.error) throw new Error(`first owner bootstrap was rejected: ${describe(first.error)}`);
        // Verified as owner: PostgREST cannot read it back because the SELECT
        // policy is applied to RETURNING rows, which is pre-existing behaviour
        // of memberships_select_member and outside R2's scope.
        if (one(`select count(*) from public.memberships where organization_id='${ORG_EMPTY}' and user_id='${BOOTSTRAPPER}' and role='owner'`) !== "1") {
          throw new Error("first owner bootstrap reported success but no row exists");
        }
        pass("first owner bootstrap allowed", "result=inserted_and_verified_as_owner");

        // The organisation is no longer empty: a second owner must be rejected.
        const second = await newcomer.from("memberships")
          .insert({ organization_id: ORG_EMPTY, user_id: NEWCOMER, role: "owner" });
        if (!second.error) throw new Error("bootstrap accepted a second owner in a non-empty organisation");
        pass("second owner rejected", `result=${describe(second.error)}`);

        // A plain member cannot add anybody.
        const byMember = await memberA.from("memberships")
          .insert({ organization_id: ORG_A, user_id: NEWCOMER, role: "member" });
        if (!byMember.error) throw new Error("member was allowed to insert a membership");
        pass("member insert rejected", `result=${describe(byMember.error)}`);

        // An admin can, through the is_org_admin branch.
        const byAdmin = await adminA.from("memberships")
          .insert({ organization_id: ORG_A, user_id: NEWCOMER, role: "member" });
        if (byAdmin.error) throw new Error(`admin insert was rejected: ${describe(byAdmin.error)}`);
        if (one(`select count(*) from public.memberships where organization_id='${ORG_A}' and user_id='${NEWCOMER}'`) !== "1") {
          throw new Error("admin insert reported success but no row exists");
        }
        pass("admin insert allowed", "result=inserted_and_verified_as_owner");

        // A member of another organisation cannot insert into A.
        const byOther = await (await signIn("ownerB")).from("memberships")
          .insert({ organization_id: ORG_A, user_id: OWNER_B, role: "admin" });
        if (!byOther.error) throw new Error("a member of another organisation was allowed to insert");
        pass("other organisation insert rejected", `result=${describe(byOther.error)}`);

        const byAnon = await anonymous.from("memberships")
          .insert({ organization_id: ORG_EMPTY, user_id: NEWCOMER, role: "owner" });
        if (!byAnon.error) throw new Error("anon was allowed to insert a membership");
        pass("anon insert rejected", `result=${describe(byAnon.error)}`);
      }

      if (mode.has("--exception")) {
        // Force the inner query of a helper to fail by renaming the table it
        // reads, inside a transaction that is rolled back. The exception handler
        // must restore row_security and re-raise.
        // A claim is required: without it the helper takes its early return and
        // never reaches the query that the rename is meant to break.
        const probe = psql(
          `begin;
           set local row_security = on;
           set local request.jwt.claim.sub = '${OWNER_A}';
           alter table public.memberships rename to memberships_r2_probe;
           select public.is_org_member('${ORG_A}');
           rollback;`,
          { allowError: true }
        );
        if (!probe.failed) throw new Error("the exception probe did not raise: the helper swallowed the error");
        if (!/memberships/i.test(probe.stderr)) throw new Error(`unexpected probe failure: ${probe.stderr}`);
        pass("helper re-raises on exception", `result=${probe.stderr.split("\n")[0].slice(0, 90)}`);

        // The caller must never be left with row_security off. Note the honest
        // limitation: PostgreSQL restores GUCs set with is_local when the
        // subtransaction aborts, so this asserts the end-to-end guarantee rather
        // than isolating the explicit restore inside the handler. The presence of
        // that restore on all three paths is asserted structurally by the
        // migration itself before COMMIT.
        const recovery = psql(
          `begin;
           set local row_security = on;
           set local request.jwt.claim.sub = '${OWNER_A}';
           savepoint s;
           alter table public.memberships rename to memberships_r2_probe;
           select public.is_org_member('${ORG_A}');
           rollback to savepoint s;
           select current_setting('row_security');
           rollback;`,
          { ignoreErrors: true }
        );
        const restored = recovery.rows[recovery.rows.length - 1];
        if (restored !== "on") throw new Error(`row_security was not restored: got ${restored}`);
        pass("row_security restored after exception", `result=${restored}`);

        const normal = one(
          `begin; set local role authenticated; set local request.jwt.claim.sub = '${OWNER_A}';
           set local row_security = on;
           select public.is_org_member('${ORG_A}')::text || ',' || current_setting('row_security'); rollback;`
        );
        const [value, guc] = normal.split(",");
        if (value !== "true" || guc !== "on") throw new Error(`normal path left row_security=${guc} value=${value}`);
        pass("row_security restored after normal return", `result=${guc}`);

        const early = one(
          `begin; set local role authenticated;
           set local row_security = on;
           select public.is_org_member('${ORG_A}')::text || ',' || current_setting('row_security'); rollback;`
        );
        const [earlyValue, earlyGuc] = early.split(",");
        if (earlyValue !== "false" || earlyGuc !== "on") {
          throw new Error(`early return left row_security=${earlyGuc} value=${earlyValue}`);
        }
        pass("row_security restored after early return", `result=${earlyGuc}`);
      }
    } finally {
      await cleanup();
    }
    pass("ephemeral fixtures cleaned up", "result=verified");
  }
}

await main();
