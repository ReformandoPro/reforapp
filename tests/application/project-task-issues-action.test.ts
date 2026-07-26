import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  getOrganizationContextForRequest: vi.fn(),
  redirect: vi.fn((url: string) => {
    const error = new Error("NEXT_REDIRECT");
    Object.assign(error, { url });
    throw error;
  }),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("../../src/lib/services/org-context", () => ({
  getOrganizationContextForRequest: mocks.getOrganizationContextForRequest,
}));
vi.mock("../../src/lib/supabase/ssr", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));

import { createTaskIssueAction } from "../../src/app/app/projects/[id]/tasks/[taskId]/actions";

function createSupabaseMock(params: {
  task?: { id: string; organization_id: string; project_id: string } | null;
  taskError?: unknown;
  insertError?: unknown;
}) {
  const taskQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: params.task ?? null,
      error: params.taskError ?? null,
    }),
  };
  const insert = vi.fn().mockResolvedValue({ error: params.insertError ?? null });

  return {
    from: vi.fn((table: string) =>
      table === "project_tasks" ? taskQuery : { insert }
    ),
    insert,
  };
}

function createFormData(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

function expectRedirect(promise: Promise<unknown>, expected: string) {
  return expect(promise).rejects.toMatchObject({ url: expected });
}

describe("createTaskIssueAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getOrganizationContextForRequest.mockResolvedValue({
      ok: true,
      organizationId: "org-a",
      role: "member",
      user: { id: "user-a" },
    });
  });

  it("redirects unauthenticated users to login", async () => {
    mocks.getOrganizationContextForRequest.mockResolvedValue({ ok: false });

    await expectRedirect(
      createTaskIssueAction(
        createFormData({ projectId: "project-a", taskId: "task-a", description: "Falta material" })
      ),
      "/login?redirectTo=/app/projects/project-a/tasks/task-a"
    );
  });

  it("redirects users without an active organization to login", async () => {
    mocks.getOrganizationContextForRequest.mockResolvedValue({ ok: false });

    await expectRedirect(
      createTaskIssueAction(
        createFormData({ projectId: "project-a", taskId: "task-a", description: "Falta material" })
      ),
      "/login?redirectTo=/app/projects/project-a/tasks/task-a"
    );
  });

  it("rejects a user without an allowed role", async () => {
    mocks.getOrganizationContextForRequest.mockResolvedValue({
      ok: true,
      organizationId: "org-a",
      role: "outsider",
      user: { id: "user-a" },
    });

    await expectRedirect(
      createTaskIssueAction(
        createFormData({ projectId: "project-a", taskId: "task-a", description: "Falta material" })
      ),
      "/app/projects/project-a/tasks/task-a?issueError=No+tienes+permisos+para+crear+incidencias."
    );
  });

  it.each(["", "   ", "a".repeat(2001)])("rejects invalid descriptions", async (description) => {
    mocks.createServerSupabaseClient.mockResolvedValue(
      createSupabaseMock({
        task: { id: "task-a", organization_id: "org-a", project_id: "project-a" },
      })
    );

    await expect(
      createTaskIssueAction(
        createFormData({ projectId: "project-a", taskId: "task-a", description })
      )
    ).rejects.toMatchObject({ url: expect.stringContaining("issueError=") });
  });

  it("rejects a File submitted instead of description text", async () => {
    const data = new FormData();
    data.set("projectId", "project-a");
    data.set("taskId", "task-a");
    data.set("description", new File(["not text"], "issue.txt"));

    await expect(createTaskIssueAction(data)).rejects.toMatchObject({
      url: expect.stringContaining("issueError=")
    });
  });

  it("rejects a task read error without attempting an insert", async () => {
    const supabase = createSupabaseMock({
      task: null,
      taskError: { code: "PGRST500", message: "read failed" },
    });
    mocks.createServerSupabaseClient.mockResolvedValue(supabase);

    await expectRedirect(
      createTaskIssueAction(
        createFormData({ projectId: "project-a", taskId: "task-a", description: "Falta material" })
      ),
      "/app/projects/project-a/tasks/task-a?issueError=Tarea+no+encontrada."
    );
    expect(supabase.insert).not.toHaveBeenCalled();
  });

  it("rejects a task from another organization", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue(
      createSupabaseMock({
        task: { id: "task-a", organization_id: "org-b", project_id: "project-a" },
      })
    );

    await expectRedirect(
      createTaskIssueAction(
        createFormData({ projectId: "project-a", taskId: "task-a", description: "Falta material" })
      ),
      "/app/projects/project-a/tasks/task-a?issueError=Tarea+inv%C3%A1lida+para+esta+obra."
    );
  });

  it("rejects a task from another project", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue(
      createSupabaseMock({
        task: { id: "task-a", organization_id: "org-a", project_id: "project-b" },
      })
    );

    await expectRedirect(
      createTaskIssueAction(
        createFormData({ projectId: "project-a", taskId: "task-a", description: "Falta material" })
      ),
      "/app/projects/project-a/tasks/task-a?issueError=Tarea+inv%C3%A1lida+para+esta+obra."
    );
  });

  it("rejects a manipulated task id", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue(
      createSupabaseMock({
        task: { id: "task-b", organization_id: "org-a", project_id: "project-a" },
      })
    );

    await expectRedirect(
      createTaskIssueAction(
        createFormData({ projectId: "project-a", taskId: "task-a", description: "Falta material" })
      ),
      "/app/projects/project-a/tasks/task-a?issueError=Tarea+inv%C3%A1lida+para+esta+obra."
    );
  });

  it("creates an issue with the session user as reporter", async () => {
    const supabase = createSupabaseMock({
      task: { id: "task-a", organization_id: "org-a", project_id: "project-a" },
    });
    mocks.createServerSupabaseClient.mockResolvedValue(supabase);

    await expectRedirect(
      createTaskIssueAction(
        createFormData({ projectId: "project-a", taskId: "task-a", description: "  Falta material  " })
      ),
      "/app/projects/project-a/tasks/task-a"
    );

    expect(supabase.insert).toHaveBeenCalledWith({
      organization_id: "org-a",
      project_id: "project-a",
      task_id: "task-a",
      reporter_user_id: "user-a",
      description: "Falta material",
    });
  });

  it("logs a sanitized insert error and returns a user-safe message", async () => {
    const supabase = createSupabaseMock({
      task: { id: "task-a", organization_id: "org-a", project_id: "project-a" },
      insertError: { code: "42501", message: "Bearer secret-token cookie=session-token" },
    });
    mocks.createServerSupabaseClient.mockResolvedValue(supabase);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expectRedirect(
      createTaskIssueAction(
        createFormData({ projectId: "project-a", taskId: "task-a", description: "Falta material" })
      ),
      "/app/projects/project-a/tasks/task-a?issueError=No+pudimos+registrar+la+incidencia."
    );

    expect(consoleError).toHaveBeenCalledWith("[b16] create_task_issue_failed", {
      operation: "create_task_issue",
      projectId: "project-a",
      taskId: "task-a",
      userId: "user-a",
      errorCode: "42501",
      errorMessage: "Bearer [redacted] cookie=[redacted]",
    });
    consoleError.mockRestore();
  });
});
