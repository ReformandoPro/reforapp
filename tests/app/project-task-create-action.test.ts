import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  getOrganizationContextForRequest: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("../../src/lib/supabase/ssr", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));
vi.mock("../../src/lib/services/org-context", () => ({
  getOrganizationContextForRequest: mocks.getOrganizationContextForRequest,
}));

import {
  createProjectTaskAction,
  INITIAL_CREATE_PROJECT_TASK_STATE,
} from "../../src/app/projects/[id]/actions";

const ORGANIZATION_ID = "10000000-0000-4000-8000-000000000001";
const OTHER_ORGANIZATION_ID = "10000000-0000-4000-8000-000000000002";
const PROJECT_ID = "20000000-0000-4000-8000-000000000001";
const OTHER_PROJECT_ID = "20000000-0000-4000-8000-000000000002";
const PHASE_ID = "30000000-0000-4000-8000-000000000001";

function validForm(overrides: Record<string, string> = {}) {
  const data = new FormData();
  data.set("title", "Preparar paredes");
  data.set("description", "Retirar restos");
  data.set("priority", "high");
  data.set("due_date", "2026-08-10");
  for (const [key, value] of Object.entries(overrides)) data.set(key, value);
  return data;
}

function query(result: { data: unknown; error: unknown }) {
  const eqCalls: Array<[string, unknown]> = [];
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockImplementation((field: string, value: unknown) => {
    eqCalls.push([field, value]);
    return builder;
  });
  return { builder, eqCalls };
}

function configureSupabase(options: {
  project?: { data: unknown; error: unknown };
  phase?: { data: unknown; error: unknown };
  insert?: { data: unknown; error: unknown };
} = {}) {
  const project = query(options.project ?? { data: { id: PROJECT_ID }, error: null });
  const phase = query(options.phase ?? { data: { id: PHASE_ID }, error: null });
  const insertPayloads: unknown[] = [];
  const insertBuilder = {
    insert: vi.fn((payload: unknown) => {
      insertPayloads.push(payload);
      return insertBuilder;
    }),
    select: vi.fn(() => insertBuilder),
    single: vi.fn().mockResolvedValue(
      options.insert ?? { data: { id: "40000000-0000-4000-8000-000000000001" }, error: null }
    ),
  };
  const from = vi.fn((table: string) => {
    if (table === "projects") return project.builder;
    if (table === "project_phases") return phase.builder;
    if (table === "project_tasks") return insertBuilder;
    throw new Error(`Unexpected table: ${table}`);
  });
  mocks.createServerSupabaseClient.mockResolvedValue({ from });
  return { from, project, phase, insertBuilder, insertPayloads };
}

async function run(formData = validForm()) {
  return createProjectTaskAction(
    PROJECT_ID,
    INITIAL_CREATE_PROJECT_TASK_STATE,
    formData
  );
}

describe("createProjectTaskAction", () => {
  beforeEach(() => {
    mocks.getOrganizationContextForRequest.mockResolvedValue({
      ok: true,
      organizationId: ORGANIZATION_ID,
      role: "owner",
      user: { id: "user-a" },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mocks.createServerSupabaseClient.mockReset();
    mocks.getOrganizationContextForRequest.mockReset();
    mocks.revalidatePath.mockReset();
  });

  it("inserts a valid task with verified values and revalidates the project", async () => {
    const supabase = configureSupabase();

    await expect(run(validForm({ phase_id: PHASE_ID }))).resolves.toMatchObject({
      status: "success",
    });
    expect(supabase.insertPayloads).toEqual([
      {
        organization_id: ORGANIZATION_ID,
        project_id: PROJECT_ID,
        phase_id: PHASE_ID,
        title: "Preparar paredes",
        description: "Retirar restos",
        priority: "high",
        due_date: "2026-08-10",
        status: "pending",
      },
    ]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/projects/${PROJECT_ID}`);
  });

  it("takes organization only from authenticated context and ignores client organization/status", async () => {
    const supabase = configureSupabase();

    await run(
      validForm({
        organization_id: OTHER_ORGANIZATION_ID,
        status: "done",
      })
    );

    expect(supabase.project.eqCalls).toContainEqual(["organization_id", ORGANIZATION_ID]);
    expect(supabase.insertPayloads[0]).toMatchObject({
      organization_id: ORGANIZATION_ID,
      status: "pending",
    });
    expect(supabase.insertPayloads[0]).not.toHaveProperty("status", "done");
  });

  it("rejects a project outside the active organization before inserting", async () => {
    const supabase = configureSupabase({ project: { data: null, error: null } });

    await expect(run()).resolves.toMatchObject({ status: "error" });
    expect(supabase.project.eqCalls).toContainEqual(["organization_id", ORGANIZATION_ID]);
    expect(supabase.project.eqCalls).toContainEqual(["id", PROJECT_ID]);
    expect(supabase.insertBuilder.insert).not.toHaveBeenCalled();
  });

  it("accepts a phase only after filtering by organization and project", async () => {
    const supabase = configureSupabase();

    await expect(run(validForm({ phase_id: PHASE_ID }))).resolves.toMatchObject({
      status: "success",
    });
    expect(supabase.phase.eqCalls).toEqual([
      ["organization_id", ORGANIZATION_ID],
      ["project_id", PROJECT_ID],
      ["id", PHASE_ID],
    ]);
  });

  it("rejects a phase from another project", async () => {
    const supabase = configureSupabase({ phase: { data: null, error: null } });

    await expect(run(validForm({ phase_id: PHASE_ID }))).resolves.toMatchObject({
      status: "error",
      fieldErrors: { phaseId: expect.any(String) },
    });
    expect(supabase.phase.eqCalls).toContainEqual(["project_id", PROJECT_ID]);
    expect(supabase.insertBuilder.insert).not.toHaveBeenCalled();
  });

  it("rejects a phase from another organization", async () => {
    const supabase = configureSupabase({ phase: { data: null, error: null } });

    await run(validForm({ phase_id: PHASE_ID }));

    expect(supabase.phase.eqCalls).toContainEqual(["organization_id", ORGANIZATION_ID]);
    expect(supabase.phase.eqCalls).not.toContainEqual([
      "organization_id",
      OTHER_ORGANIZATION_ID,
    ]);
    expect(supabase.insertBuilder.insert).not.toHaveBeenCalled();
  });

  it("creates a task without phase using null", async () => {
    const supabase = configureSupabase();

    await expect(run(validForm({ phase_id: "" }))).resolves.toMatchObject({
      status: "success",
    });
    expect(supabase.from).not.toHaveBeenCalledWith("project_phases");
    expect(supabase.insertPayloads[0]).toMatchObject({ phase_id: null });
  });

  it("rejects missing membership and roles without write permission", async () => {
    mocks.getOrganizationContextForRequest.mockResolvedValueOnce({
      ok: false,
      reason: "missing_membership",
    });
    await expect(run()).resolves.toMatchObject({ status: "error" });
    expect(mocks.createServerSupabaseClient).not.toHaveBeenCalled();

    mocks.getOrganizationContextForRequest.mockResolvedValueOnce({
      ok: true,
      organizationId: ORGANIZATION_ID,
      role: "member",
      user: { id: "user-member" },
    });
    await expect(run()).resolves.toMatchObject({ status: "error" });
    expect(mocks.createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it("returns validation errors without querying Supabase", async () => {
    await expect(run(validForm({ title: " ", priority: "invalid" }))).resolves.toMatchObject({
      status: "error",
      fieldErrors: {
        title: expect.any(String),
        priority: expect.any(String),
      },
    });
    expect(mocks.getOrganizationContextForRequest).not.toHaveBeenCalled();
    expect(mocks.createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it("sanitizes Supabase errors", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    configureSupabase({
      insert: {
        data: null,
        error: { message: "sensitive SQL and table details", code: "42501" },
      },
    });

    const result = await run();

    expect(result.status).toBe("error");
    expect(JSON.stringify(result)).not.toContain("sensitive SQL");
    expect(JSON.stringify(result)).not.toContain("42501");
    expect(consoleError).toHaveBeenCalledWith("[project-task-create]", {
      reason: "insert_failed",
    });
  });

  it("never queries or inserts into a different project", async () => {
    const supabase = configureSupabase();

    await run();

    expect(supabase.project.eqCalls).not.toContainEqual(["id", OTHER_PROJECT_ID]);
    expect(supabase.insertPayloads[0]).toMatchObject({ project_id: PROJECT_ID });
  });
});
