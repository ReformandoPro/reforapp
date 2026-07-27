import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getProjectDetail: vi.fn(),
  getProjectPhasesForRequest: vi.fn(),
  getProjectTasksForRequest: vi.fn(),
  groupProjectTasksByStatus: vi.fn(),
  getOrganizationContextForRequest: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement("a", { href, ...props }, children),
}));
vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));
vi.mock("../../src/components/layout", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) =>
    React.createElement("main", null, children),
}));
vi.mock("../../src/components/screens/ProjectOverviewScreen", () => ({
  ProjectOverviewScreen: () => React.createElement("div", null, "Resumen"),
}));
vi.mock("../../src/components/tasks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/components/tasks")>();
  return {
    ...actual,
    CreateProjectTaskForm: () => React.createElement("div", null, "Nueva tarea"),
  };
});
vi.mock("../../src/lib/services/org-context", () => ({
  getOrganizationContextForRequest: mocks.getOrganizationContextForRequest,
}));
vi.mock("../../src/lib/data", () => ({
  getProjectDetail: mocks.getProjectDetail,
  getProjectPhasesForRequest: mocks.getProjectPhasesForRequest,
  getProjectTasksForRequest: mocks.getProjectTasksForRequest,
  groupProjectTasksByStatus: mocks.groupProjectTasksByStatus,
}));

import ProjectDetailPage from "../../src/app/projects/[id]/page";

const project = {
  id: "project-a",
  name: "Proyecto A",
  clientName: "Cliente A",
  status: "in_progress",
  address: "Calle A",
  startDate: "2026-07-01",
  type: "reform",
};

const phase = {
  id: "phase-a",
  title: "Preparación",
  description: null,
  status: "planned",
  startDate: null,
  endDate: null,
  sortOrder: 1,
};

async function renderPage() {
  const element = await ProjectDetailPage({
    params: Promise.resolve({ id: "project-a" }),
  });
  return renderToStaticMarkup(element);
}

describe("project tasks detail page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the authenticated task board and creation action for an owner", async () => {
    mocks.getOrganizationContextForRequest.mockResolvedValue({
      ok: true,
      organizationId: "org-a",
      role: "owner",
      user: { id: "user-a" },
    });
    mocks.getProjectDetail.mockResolvedValue(project);
    mocks.getProjectPhasesForRequest.mockResolvedValue([phase]);
    mocks.getProjectTasksForRequest.mockResolvedValue([]);
    mocks.groupProjectTasksByStatus.mockReturnValue([]);

    const html = await renderPage();
    expect(html).toContain("Tablero de tareas");
    expect(html).toContain("Nueva tarea");
  });

  it("shows the general empty state when the project has no tasks", async () => {
    mocks.getOrganizationContextForRequest.mockResolvedValue({
      ok: true,
      organizationId: "org-a",
      role: "member",
      user: { id: "user-member" },
    });
    mocks.getProjectDetail.mockResolvedValue(project);
    mocks.getProjectPhasesForRequest.mockResolvedValue([]);
    mocks.getProjectTasksForRequest.mockResolvedValue([]);
    mocks.groupProjectTasksByStatus.mockReturnValue([
      { status: "pending", tasks: [] },
      { status: "in_progress", tasks: [] },
      { status: "blocked", tasks: [] },
      { status: "done", tasks: [] },
    ]);

    const html = await renderPage();
    expect(html).toContain("Este proyecto todavía no tiene tareas.");
  });

  it("preserves notFound for an inaccessible project", async () => {
    mocks.getProjectDetail.mockResolvedValue(null);
    mocks.notFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(
      ProjectDetailPage({ params: Promise.resolve({ id: "project-b" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.getProjectTasksForRequest).not.toHaveBeenCalled();
  });
});
