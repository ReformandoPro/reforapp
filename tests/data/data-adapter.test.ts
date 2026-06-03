import { afterEach, describe, expect, it } from "vitest";

import {
  getBudgetById,
  getBudgets,
  getDashboardSummary,
  getDataAdapterMode,
  getProjectById,
  getProjects,
  getProjectTasks,
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
});
