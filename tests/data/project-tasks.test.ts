import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  getOrganizationContextForRequest: vi.fn(),
}));

vi.mock("../../src/lib/supabase/ssr", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));
vi.mock("../../src/lib/services/org-context", () => ({
  getOrganizationContextForRequest: mocks.getOrganizationContextForRequest,
}));

import {
  getProjectTasksForRequest,
  groupProjectTasksByPhase,
  groupProjectTasksByStatus,
} from "../../src/lib/data/projects";

function taskRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "task-a",
    organization_id: "org-a",
    project_id: "project-a",
    phase_id: "phase-a",
    title: "Preparar superficie",
    description: "Retirar restos antes de pintar",
    status: "pending",
    priority: "medium",
    due_date: "2026-08-03",
    created_at: "2026-07-27T10:00:00.000Z",
    phase: {
      id: "phase-a",
      organization_id: "org-a",
      project_id: "project-a",
      title: "Preparación",
    },
    ...overrides,
  };
}

function mockQuery(result: { data: unknown; error: unknown }) {
  const orderId = vi.fn().mockResolvedValue(result);
  const orderCreatedAt = vi.fn().mockReturnValue({ order: orderId });
  const orderDueDate = vi.fn().mockReturnValue({ order: orderCreatedAt });
  const eqOrganization = vi.fn().mockReturnValue({ order: orderDueDate });
  const eqProject = vi.fn().mockReturnValue({ eq: eqOrganization });
  const select = vi.fn().mockReturnValue({ eq: eqProject });
  const from = vi.fn().mockReturnValue({ select });
  mocks.createServerSupabaseClient.mockResolvedValue({ from });
  return {
    from,
    select,
    eqProject,
    eqOrganization,
    orderDueDate,
    orderCreatedAt,
    orderId,
  };
}

function configureAuthenticatedOrganization() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
  mocks.getOrganizationContextForRequest.mockResolvedValue({
    ok: true,
    organizationId: "org-a",
    role: "member",
    user: { id: "user-a" },
  });
}

describe("project tasks real read", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    mocks.createServerSupabaseClient.mockReset();
    mocks.getOrganizationContextForRequest.mockReset();
  });

  it("filters by project and authenticated organization with deterministic order", async () => {
    configureAuthenticatedOrganization();
    const query = mockQuery({ data: [taskRow()], error: null });

    await expect(getProjectTasksForRequest("project-a")).resolves.toMatchObject([
      { id: "task-a", phaseId: "phase-a", phaseTitle: "Preparación" },
    ]);
    expect(query.from).toHaveBeenCalledWith("project_tasks");
    expect(query.eqProject).toHaveBeenCalledWith("project_id", "project-a");
    expect(query.eqOrganization).toHaveBeenCalledWith("organization_id", "org-a");
    expect(query.orderDueDate).toHaveBeenCalledWith("due_date", {
      ascending: true,
      nullsFirst: false,
    });
    expect(query.orderCreatedAt).toHaveBeenCalledWith("created_at", {
      ascending: true,
    });
    expect(query.orderId).toHaveBeenCalledWith("id", { ascending: true });
  });

  it("does not use a public organization variable", async () => {
    configureAuthenticatedOrganization();
    vi.stubEnv("NEXT_PUBLIC_ORGANIZATION_ID", "org-public");
    const query = mockQuery({ data: [], error: null });

    await expect(getProjectTasksForRequest("project-a")).resolves.toEqual([]);
    expect(query.eqOrganization).toHaveBeenCalledWith("organization_id", "org-a");
    expect(query.eqOrganization).not.toHaveBeenCalledWith(
      "organization_id",
      "org-public"
    );
  });

  it("returns a valid empty collection for another project or organization", async () => {
    configureAuthenticatedOrganization();
    mockQuery({ data: [], error: null });

    await expect(getProjectTasksForRequest("project-b")).resolves.toEqual([]);
  });

  it("rejects rows from another project or organization", async () => {
    configureAuthenticatedOrganization();
    mockQuery({ data: [taskRow({ project_id: "project-b" })], error: null });
    await expect(getProjectTasksForRequest("project-a")).rejects.toThrow(
      "Unable to load project tasks from Supabase"
    );

    mockQuery({ data: [taskRow({ organization_id: "org-b" })], error: null });
    await expect(getProjectTasksForRequest("project-a")).rejects.toThrow(
      "Unable to load project tasks from Supabase"
    );
  });

  it("groups tasks by phase and keeps unphased tasks separately", () => {
    const phased = {
      id: "task-a",
      phaseId: "phase-a",
      phaseTitle: "Preparación",
      title: "A",
      description: null,
      status: "pending" as const,
      priority: "low" as const,
      dueDate: null,
    };
    const unphased = {
      ...phased,
      id: "task-b",
      phaseId: null,
      phaseTitle: null,
    };

    const groups = groupProjectTasksByPhase([phased, unphased]);
    expect(groups.get("phase-a")).toEqual([phased]);
    expect(groups.get(null)).toEqual([unphased]);
  });

  it("groups tasks into stable Kanban columns without reordering cards", () => {
    const baseTask = {
      id: "task-a",
      phaseId: null,
      phaseTitle: null,
      title: "A",
      description: null,
      status: "pending" as const,
      priority: "low" as const,
      dueDate: null,
    };
    const tasks = [
      { ...baseTask, id: "pending-2" },
      { ...baseTask, id: "done-1", status: "done" as const },
      { ...baseTask, id: "pending-1" },
    ];

    const columns = groupProjectTasksByStatus(tasks);

    expect(columns.map((column) => column.status)).toEqual([
      "pending",
      "in_progress",
      "blocked",
      "done",
    ]);
    expect(columns[0].tasks.map((task) => task.id)).toEqual([
      "pending-2",
      "pending-1",
    ]);
    expect(columns[1].tasks).toEqual([]);
    expect(columns[2].tasks).toEqual([]);
    expect(columns[3].tasks.map((task) => task.id)).toEqual(["done-1"]);
  });

  it("sanitizes Supabase errors", async () => {
    configureAuthenticatedOrganization();
    mockQuery({
      data: null,
      error: { code: "42501", message: "secret SQL and table detail" },
    });

    await expect(getProjectTasksForRequest("project-a")).rejects.toThrow(
      "Unable to load project tasks from Supabase"
    );
  });

  it("rejects missing membership", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    mocks.getOrganizationContextForRequest.mockResolvedValue({
      ok: false,
      reason: "missing_membership",
    });

    await expect(getProjectTasksForRequest("project-a")).rejects.toThrow(
      "active organization"
    );
  });

  it.each([
    ["status", { status: "unknown" }],
    ["priority", { priority: "critical" }],
  ])("rejects an invalid %s", async (_field, overrides) => {
    configureAuthenticatedOrganization();
    mockQuery({ data: [taskRow(overrides)], error: null });

    await expect(getProjectTasksForRequest("project-a")).rejects.toThrow(
      "Unable to load project tasks from Supabase"
    );
  });

  it("rejects a phase relationship from another project", async () => {
    configureAuthenticatedOrganization();
    mockQuery({
      data: [
        taskRow({
          phase: {
            id: "phase-a",
            organization_id: "org-a",
            project_id: "project-b",
            title: "Preparación",
          },
        }),
      ],
      error: null,
    });

    await expect(getProjectTasksForRequest("project-a")).rejects.toThrow(
      "Unable to load project tasks from Supabase"
    );
  });
});
