import { afterEach, describe, expect, it } from "vitest";

import {
  getBudgetById,
  getBudgets,
  getDashboardSummary,
  getDataAdapterMode,
  getProjectById,
  getProjects,
  getProjectTasks,
  updateProjectTaskStatus,
} from "../../src/lib/data";
import { mockBudgetSummaries, mockBudgetView } from "../../src/lib/mock/budget";
import { mockDashboardSummary } from "../../src/lib/mock/dashboard";
import { mockProjectCards, mockProjectOverview } from "../../src/lib/mock/project";
import { mockProjectTasks } from "../../src/lib/mock/tasks";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function restoreEnv() {
  if (originalUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  }

  if (originalAnonKey === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
  }
}

describe("data adapter foundation", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("uses mock mode when Supabase public env vars are missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(getDataAdapterMode()).toBe("mock");
  });

  it("detects configured Supabase while keeping current mock fallback", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    expect(getDataAdapterMode()).toBe("supabase-configured-mock-fallback");
    expect(getProjects()).toEqual(mockProjectCards);
  });

  it("centralizes current dashboard, project, task and budget reads", () => {
    expect(getDashboardSummary()).toEqual(mockDashboardSummary);
    expect(getProjects()).toEqual(mockProjectCards);
    expect(getProjectById(mockProjectOverview.id)).toEqual(mockProjectOverview);
    expect(getProjectTasks("project_obra_centro")).toEqual(mockProjectTasks);
    expect(getBudgets()).toEqual(mockBudgetSummaries);
    expect(getBudgetById(mockBudgetView.id)).toEqual(mockBudgetView);
  });

  it("updates task status through mock fallback without Supabase env vars", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const taskId = "task_demolicion_remates";

    expect(getDataAdapterMode()).toBe("mock");

    const updated = updateProjectTaskStatus(taskId, "done");

    expect(updated).toMatchObject({
      id: taskId,
      projectId: "project_obra_centro",
      title: "Cerrar remates de demolición en cocina",
      status: "done",
      priority: "medium",
    });

    expect(getProjectTasks("project_obra_centro")).toContainEqual(
      expect.objectContaining({
        id: taskId,
        status: "done",
      })
    );

    const reopened = updateProjectTaskStatus(taskId, "todo");

    expect(reopened).toMatchObject({
      id: taskId,
      status: "todo",
    });
  });
});
