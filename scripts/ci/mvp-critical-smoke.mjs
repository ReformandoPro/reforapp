import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.CI_FIXTURE_PASSWORD;

if (!url || !anonKey || !serviceRoleKey || !password) {
  throw new Error(
    "Missing SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY or CI_FIXTURE_PASSWORD"
  );
}

const runId = randomUUID();
const ids = {
  user: randomUUID(),
  noMembershipUser: randomUUID(),
  otherOrganizationUser: randomUUID(),
  organization: randomUUID(),
  otherOrganization: randomUUID(),
  client: randomUUID(),
  project: randomUUID(),
  phase: randomUUID(),
  task: randomUUID(),
  issue: randomUUID(),
  budget: randomUUID(),
  budgetLine: randomUUID(),
  noMembershipClient: randomUUID(),
  otherClient: randomUUID(),
  otherTask: randomUUID(),
};

const emails = {
  user: `mvp-smoke-owner-${runId}@example.invalid`,
  noMembershipUser: `mvp-smoke-none-${runId}@example.invalid`,
  otherOrganizationUser: `mvp-smoke-other-${runId}@example.invalid`,
};

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function clientForSession() {
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function log(step, result, details = "") {
  process.stdout.write(
    `runId=${runId} step=${step} result=${result}${details ? ` ${details}` : ""}\n`
  );
}

function safeMessage(error) {
  const message = String(error?.message ?? "unknown error")
    .replace(/[\r\n]+/g, " ")
    .replace(/(jwt|token|authorization|password|secret|key)\s*[:=]\s*\S+/gi, "$1=[redacted]");
  return message.slice(0, 240);
}

function fail(step, error, table = "") {
  const code = error?.code ?? error?.status ?? "unknown";
  log(step, "failed", `code=${String(code)}${table ? ` table=${table}` : ""} message=${safeMessage(error)}`);
  throw new Error(`${step} failed`, { cause: error });
}

async function expectNoError(step, operation, table) {
  const result = await operation();
  if (result.error) fail(step, result.error, table);
  return result.data;
}

async function signIn(email) {
  const client = clientForSession();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) fail("login", error, "auth");
  return client;
}

async function createUser(id, email) {
  const { error } = await admin.auth.admin.createUser({
    id,
    email,
    password,
    email_confirm: true,
  });
  if (error) fail("create_test_user", error, "auth.users");
}

async function deleteUser(id) {
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error && error.status !== 404) throw error;
}

async function deleteById(table, id) {
  const { error } = await admin.from(table).delete().eq("id", id);
  if (error) throw error;
}

async function deleteMembership(organizationId, userId) {
  const { error } = await admin
    .from("memberships")
    .delete()
    .eq("organization_id", organizationId)
    .eq("user_id", userId);
  if (error) throw error;
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function computeBudgetTotals(lines) {
  let subtotal = 0;
  let tax = 0;
  for (const line of lines) {
    const lineSubtotal = line.quantity * line.unitPrice;
    subtotal += lineSubtotal;
    tax += lineSubtotal * (line.taxRate / 100);
  }
  subtotal = round2(subtotal);
  tax = round2(tax);
  return { subtotal, tax, total: round2(subtotal + tax) };
}

async function cleanup() {
  const errors = [];
  const resources = [
    ["project_budget_lines", ids.budgetLine],
    ["project_budgets", ids.budget],
    ["project_task_issues", ids.issue],
    ["project_tasks", ids.task],
    ["project_tasks", ids.otherTask],
    ["project_phases", ids.phase],
    ["projects", ids.project],
    ["clients", ids.client],
    ["clients", ids.noMembershipClient],
    ["clients", ids.otherClient],
  ];

  for (const [table, id] of resources) {
    try {
      await deleteById(table, id);
    } catch (error) {
      errors.push(`${table}:${id}:${safeMessage(error)}`);
    }
  }

  for (const userId of [ids.user, ids.noMembershipUser, ids.otherOrganizationUser]) {
    for (const organizationId of [ids.organization, ids.otherOrganization]) {
      try {
        await deleteMembership(organizationId, userId);
      } catch (error) {
        errors.push(`memberships:${organizationId}:${userId}:${safeMessage(error)}`);
      }
    }
  }

  for (const organizationId of [ids.organization, ids.otherOrganization]) {
    try {
      await deleteById("organizations", organizationId);
    } catch (error) {
      errors.push(`organizations:${organizationId}:${safeMessage(error)}`);
    }
  }

  for (const userId of [ids.user, ids.noMembershipUser, ids.otherOrganizationUser]) {
    try {
      await deleteUser(userId);
    } catch (error) {
      errors.push(`auth.users:${userId}:${safeMessage(error)}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`cleanup failed: ${errors.join(" | ")}`);
  }
}

async function verifyAdminPersistence() {
  const resources = [
    ["organizations", ids.organization],
    ["memberships", ids.user],
    ["clients", ids.client],
    ["projects", ids.project],
    ["project_phases", ids.phase],
    ["project_tasks", ids.task],
    ["project_task_issues", ids.issue],
    ["project_budgets", ids.budget],
    ["project_budget_lines", ids.budgetLine],
  ];

  for (const [table, id] of resources) {
    const query = table === "memberships"
      ? admin.from(table).select("user_id").eq("user_id", id).eq("organization_id", ids.organization)
      : admin.from(table).select("id").eq("id", id);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`administrative persistence check found no row in ${table}`);
  }
  log("verify_admin_persistence", "passed");
}

async function assertAdminAbsent(table, id, step) {
  const { data, error } = await admin.from(table).select("id").eq("id", id).limit(1);
  if (error) throw error;
  if (Array.isArray(data) && data.length > 0) {
    fail(step, new Error(`unexpected row ${id} exists after denied write`), table);
  }
}

let functionalError;
let cleanupError;

try {
  await createUser(ids.user, emails.user);
  await createUser(ids.noMembershipUser, emails.noMembershipUser);
  await createUser(ids.otherOrganizationUser, emails.otherOrganizationUser);
  log("create_test_users", "passed");

  const owner = await signIn(emails.user);
  log("login", "passed");

  await expectNoError(
    "create_organization",
    () => owner.from("organizations").insert({ id: ids.organization, name: `MVP Smoke ${runId}` }),
    "organizations"
  );
  log("create_organization", "passed");

  await expectNoError(
    "create_initial_membership",
    () => owner.from("memberships").insert({ organization_id: ids.organization, user_id: ids.user, role: "owner" }),
    "memberships"
  );
  log("create_initial_membership", "passed");

  await expectNoError(
    "create_client",
    () => owner.from("clients").insert({ id: ids.client, organization_id: ids.organization, display_name: `Smoke Client ${runId}` }),
    "clients"
  );
  const clientRow = await expectNoError(
    "read_client",
    () => owner.from("clients").select("id, organization_id").eq("id", ids.client).single(),
    "clients"
  );
  if (clientRow.id !== ids.client || clientRow.organization_id !== ids.organization) fail("read_client", new Error("inconsistent client row"), "clients");
  log("create_client", "passed");
  log("read_client", "passed");

  await expectNoError(
    "create_project",
    () => owner.from("projects").insert({
      id: ids.project,
      organization_id: ids.organization,
      client_id: ids.client,
      name: `Smoke Project ${runId}`,
      title: `Smoke Project ${runId}`,
      client_name: `Smoke Client ${runId}`,
      start_date: new Date().toISOString(),
      status: "in_progress",
      address: "Smoke address",
      type: "reform",
      progress: 0,
    }),
    "projects"
  );
  const projectRow = await expectNoError(
    "read_project",
    () => owner.from("projects").select("id, organization_id, client_id").eq("id", ids.project).single(),
    "projects"
  );
  if (projectRow.id !== ids.project || projectRow.organization_id !== ids.organization || projectRow.client_id !== ids.client) fail("read_project", new Error("inconsistent project row"), "projects");
  log("create_project", "passed");
  log("read_project", "passed");

  await expectNoError(
    "create_phase",
    () => owner.from("project_phases").insert({ id: ids.phase, organization_id: ids.organization, project_id: ids.project, title: `Smoke Phase ${runId}`, status: "planned", sort_order: 1 }),
    "project_phases"
  );
  log("create_phase", "passed");

  await expectNoError(
    "create_task",
    () => owner.from("project_tasks").insert({ id: ids.task, organization_id: ids.organization, project_id: ids.project, phase_id: ids.phase, title: `Smoke Task ${runId}`, description: null, status: "pending", priority: "medium", due_date: null }),
    "project_tasks"
  );
  const taskRow = await expectNoError(
    "read_task",
    () => owner.from("project_tasks").select("id, organization_id, project_id, phase_id").eq("id", ids.task).single(),
    "project_tasks"
  );
  if (taskRow.id !== ids.task || taskRow.organization_id !== ids.organization || taskRow.project_id !== ids.project || taskRow.phase_id !== ids.phase) fail("read_task", new Error("inconsistent task row"), "project_tasks");
  log("create_task", "passed");
  log("read_task", "passed");

  await expectNoError(
    "create_issue",
    () => owner.from("project_task_issues").insert({ id: ids.issue, organization_id: ids.organization, project_id: ids.project, task_id: ids.task, reporter_user_id: ids.user, description: `Smoke issue ${runId}` }),
    "project_task_issues"
  );
  log("create_issue", "passed");

  await expectNoError(
    "create_budget",
    () => owner.from("project_budgets").insert({ id: ids.budget, organization_id: ids.organization, project_id: ids.project, title: `Smoke Budget ${runId}`, status: "draft", notes: null }),
    "project_budgets"
  );
  log("create_budget", "passed");

  const line = { description: "Smoke line", quantity: 2, unitPrice: 125.5, taxRate: 21, sortOrder: 1 };
  await expectNoError(
    "create_budget_line",
    () => owner.from("project_budget_lines").insert({ id: ids.budgetLine, budget_id: ids.budget, organization_id: ids.organization, project_id: ids.project, description: line.description, quantity: line.quantity, unit_price: line.unitPrice, tax_rate: line.taxRate, sort_order: line.sortOrder }),
    "project_budget_lines"
  );
  const lineRows = await expectNoError(
    "read_budget_lines",
    () => owner.from("project_budget_lines").select("id, budget_id, quantity, unit_price, tax_rate").eq("budget_id", ids.budget),
    "project_budget_lines"
  );
  if (!Array.isArray(lineRows) || lineRows.length !== 1 || lineRows[0].id !== ids.budgetLine) fail("read_budget_lines", new Error("budget line persistence mismatch"), "project_budget_lines");
  log("create_budget_line", "passed");
  log("read_budget_lines", "passed");

  const totals = computeBudgetTotals(lineRows.map((row) => ({ quantity: Number(row.quantity), unitPrice: Number(row.unit_price), taxRate: Number(row.tax_rate) })));
  const expected = { subtotal: 251, tax: 52.71, total: 303.71 };
  if (JSON.stringify(totals) !== JSON.stringify(expected)) fail("verify_totals", new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(totals)}`), "project_budget_lines");
  log("verify_totals", "passed", `subtotal=${totals.subtotal} tax=${totals.tax} total=${totals.total}`);

  await verifyAdminPersistence();

  const noMembership = await signIn(emails.noMembershipUser);
  const otherOrganization = await signIn(emails.otherOrganizationUser);
  await expectNoError(
    "create_other_organization",
    () => otherOrganization.from("organizations").insert({ id: ids.otherOrganization, name: `MVP Smoke Other ${runId}` }),
    "organizations"
  );
  await expectNoError(
    "create_other_organization_membership",
    () => otherOrganization.from("memberships").insert({ organization_id: ids.otherOrganization, user_id: ids.otherOrganizationUser, role: "owner" }),
    "memberships"
  );
  const ownOrganization = await expectNoError(
    "read_other_organization",
    () => otherOrganization.from("organizations").select("id").eq("id", ids.otherOrganization).single(),
    "organizations"
  );
  if (ownOrganization.id !== ids.otherOrganization) fail("read_other_organization", new Error("own organization was not returned"), "organizations");
  log("create_other_organization", "passed");
  log("create_other_organization_membership", "passed");
  log("read_other_organization", "passed");

  for (const [label, client] of [["no_membership", noMembership], ["other_organization", otherOrganization]]) {
    const { data, error } = await client.from("projects").select("id").eq("id", ids.project);
    if (error) fail(`negative_read_${label}`, error, "projects");
    if (Array.isArray(data) && data.length !== 0) fail(`negative_read_${label}`, new Error("protected project was returned"), "projects");
    log(`negative_read_${label}`, "passed", "result=empty_due_to_rls");
  }

  const { data: noMembershipWriteData, error: noMembershipWriteError } = await noMembership
    .from("clients")
    .insert({ id: ids.noMembershipClient, organization_id: ids.organization, display_name: `No membership ${runId}` })
    .select("id");
  await assertAdminAbsent("clients", ids.noMembershipClient, "negative_write_no_membership");
  if (!noMembershipWriteError && Array.isArray(noMembershipWriteData) && noMembershipWriteData.length > 0) fail("negative_write_no_membership", new Error("no-membership write unexpectedly succeeded"), "clients");
  log("negative_write_no_membership", "passed", `result=${noMembershipWriteError ? "explicitly_denied" : "empty_due_to_rls"}`);

  const { data: anonymousData, error: anonymousError } = await clientForSession().from("clients").insert({ id: ids.otherClient, organization_id: ids.organization, display_name: `Anonymous ${runId}` }).select("id");
  await assertAdminAbsent("clients", ids.otherClient, "negative_write_anonymous");
  if (!anonymousError && Array.isArray(anonymousData) && anonymousData.length > 0) fail("negative_write_anonymous", new Error("anonymous write unexpectedly succeeded"), "clients");
  log("negative_write_anonymous", "passed", `result=${anonymousError ? "explicitly_denied" : "empty_due_to_rls"}`);

  const { data: otherWriteData, error: otherWriteError } = await otherOrganization.from("project_tasks").insert({ id: ids.otherTask, organization_id: ids.organization, project_id: ids.project, phase_id: ids.phase, title: `Unexpected ${runId}`, status: "pending", priority: "medium" }).select("id");
  await assertAdminAbsent("project_tasks", ids.otherTask, "negative_write_other_organization");
  if (!otherWriteError && Array.isArray(otherWriteData) && otherWriteData.length > 0) fail("negative_write_other_organization", new Error("cross-organization write unexpectedly succeeded"), "project_tasks");
  log("negative_write_other_organization", "passed", `result=${otherWriteError ? "explicitly_denied" : "empty_due_to_rls"}`);
} catch (error) {
  functionalError = error;
} finally {
  try {
    await cleanup();
    log("cleanup", "passed");
  } catch (error) {
    cleanupError = error;
    log("cleanup", "failed", `message=${safeMessage(error)}`);
  }
}

if (functionalError) {
  log("smoke", "failed", `message=${safeMessage(functionalError)}`);
  if (cleanupError) log("smoke_cleanup", "failed", `message=${safeMessage(cleanupError)}`);
  process.exitCode = 1;
} else if (cleanupError) {
  log("smoke", "failed", `message=${safeMessage(cleanupError)}`);
  process.exitCode = 1;
} else {
  log("smoke", "passed");
}
