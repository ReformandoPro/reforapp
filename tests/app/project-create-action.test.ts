import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  getOrganizationContextForRequest: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("../../src/lib/services/org-context", () => ({
  getOrganizationContextForRequest: mocks.getOrganizationContextForRequest,
}));
vi.mock("../../src/lib/supabase/ssr", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));

import { createProjectAction } from "../../src/app/app/projects/new/actions";
import { INITIAL_CREATE_PROJECT_STATE } from "../../src/app/app/projects/new/state";

const ORGANIZATION_ID = "10000000-0000-4000-8000-000000000001";
const CLIENT_ID = "20000000-0000-4000-8000-000000000001";
const PROJECT_ID = "30000000-0000-4000-8000-000000000001";

function validForm(values: Record<string, string> = {}) {
  const data = new FormData();
  data.set("name", "Reforma Centro");
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

function configureSupabase(options: {
  client?: { data: unknown; error: unknown };
  insert?:
    | { data: unknown; error: unknown }
    | Array<{ data: unknown; error: unknown }>;
} = {}) {
  const clientResult = options.client ?? {
    data: { id: CLIENT_ID, display_name: "Cliente A" },
    error: null,
  };
  const insertResults = Array.isArray(options.insert)
    ? options.insert
    : [options.insert ?? { data: { id: PROJECT_ID }, error: null }];
  const clientEqCalls: Array<[string, string]> = [];
  const clientQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn((column: string, value: string) => {
      clientEqCalls.push([column, value]);
      return clientQuery;
    }),
    maybeSingle: vi.fn().mockResolvedValue(clientResult),
  };
  const insertPayloads: unknown[] = [];
  const projectQuery = {
    insert: vi.fn((payload: unknown) => {
      insertPayloads.push(payload);
      return projectQuery;
    }),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(async () => insertResults.shift() ?? insertResults[0]),
  };
  const supabase = {
    from: vi.fn((table: string) => {
      if (table === "clients") return clientQuery;
      if (table === "projects") return projectQuery;
      throw new Error(`Unexpected table: ${table}`);
    }),
    clientEqCalls,
    insertPayloads,
  };
  mocks.createServerSupabaseClient.mockResolvedValue(supabase);
  return supabase;
}

async function run(formData = validForm()) {
  return createProjectAction(INITIAL_CREATE_PROJECT_STATE, formData);
}

describe("createProjectAction", () => {
  beforeEach(() => {
    mocks.getOrganizationContextForRequest.mockResolvedValue({
      ok: true,
      organizationId: ORGANIZATION_ID,
      role: "owner",
      user: { id: "user-owner" },
    });
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates a project for the authenticated organization without accepting organization_id", async () => {
    const supabase = configureSupabase();
    const formData = validForm({
      organization_id: "attacker-org",
      description: "Reforma integral",
      start_date: "2026-08-01",
      expected_end_date: "2026-10-30",
    });

    await expect(run(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(supabase.insertPayloads[0]).toMatchObject({
      id: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      ),
      organization_id: ORGANIZATION_ID,
      client_id: null,
      name: "Reforma Centro",
      description: "Reforma integral",
      start_date: "2026-08-01",
      expected_end_date: "2026-10-30",
      status: "in_progress",
      progress: 0,
    });
    expect(supabase.insertPayloads[0]).not.toMatchObject({ organization_id: "attacker-org" });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/app/projects");
    expect(mocks.redirect).toHaveBeenCalledWith("/app/projects");
  });

  it("validates an optional client inside the active organization", async () => {
    const supabase = configureSupabase();

    await expect(run(validForm({ client_id: CLIENT_ID }))).rejects.toThrow("NEXT_REDIRECT");

    expect(supabase.clientEqCalls).toEqual([
      ["organization_id", ORGANIZATION_ID],
      ["id", CLIENT_ID],
    ]);
    expect(supabase.insertPayloads[0]).toMatchObject({
      client_id: CLIENT_ID,
      client_name: "Cliente A",
    });
  });

  it("retries only the legacy project status constraint with compatible active aliases", async () => {
    const supabase = configureSupabase({
      insert: [
        {
          data: null,
          error: {
            code: "23514",
            message:
              'new row for relation "projects" violates check constraint "projects_status_check"',
          },
        },
        { data: { id: PROJECT_ID }, error: null },
      ],
    });

    await expect(run()).rejects.toThrow("NEXT_REDIRECT");

    expect(supabase.insertPayloads).toHaveLength(2);
    expect(supabase.insertPayloads[0]).toMatchObject({ status: "in_progress" });
    expect(supabase.insertPayloads[1]).toMatchObject({ status: "active" });
    expect(supabase.insertPayloads[1]).toMatchObject({
      id: (supabase.insertPayloads[0] as { id: string }).id,
    });
  });

  it("does not retry unrelated insert failures", async () => {
    const supabase = configureSupabase({
      insert: {
        data: null,
        error: { code: "42501", message: "row-level security policy rejected the insert" },
      },
    });

    await expect(run()).resolves.toMatchObject({ status: "error" });

    expect(supabase.insertPayloads).toHaveLength(1);
  });

  it("rejects a client outside the active organization", async () => {
    const supabase = configureSupabase({ client: { data: null, error: null } });

    await expect(run(validForm({ client_id: CLIENT_ID }))).resolves.toMatchObject({
      status: "error",
      fieldErrors: { clientId: expect.any(String) },
    });
    expect(supabase.clientEqCalls).toContainEqual(["organization_id", ORGANIZATION_ID]);
    expect(supabase.insertPayloads).toHaveLength(0);
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

  it("returns validation errors before resolving organization context", async () => {
    await expect(run(validForm({ name: " " }))).resolves.toMatchObject({
      status: "error",
      fieldErrors: { name: expect.any(String) },
    });
    expect(mocks.getOrganizationContextForRequest).not.toHaveBeenCalled();
    expect(mocks.createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it("sanitizes Supabase insert errors", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    configureSupabase({
      insert: { data: null, error: { message: "sensitive SQL details", code: "42501" } },
    });

    const result = await run();

    expect(result.status).toBe("error");
    expect(JSON.stringify(result)).not.toContain("sensitive SQL");
    expect(consoleError).toHaveBeenCalledWith("[project-create]", {
      reason: "insert_failed",
    });
  });
});
