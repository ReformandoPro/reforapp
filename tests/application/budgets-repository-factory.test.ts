import { describe, expect, it } from "vitest";

import {
  createBudgetsRepository,
  type CreateBudgetsRepositoryOptions,
} from "../../src/lib/application/repositories/budgets-repository-factory";
import { mockBudgetSummaries, mockBudgetView } from "../../src/lib/mock/budget";
import type { BudgetsRepository } from "../../src/lib/repositories/budgets-repository";

describe("createBudgetsRepository", () => {
  it("returns an object compatible with BudgetsRepository without arguments", () => {
    const repository: BudgetsRepository = createBudgetsRepository();

    expect(repository).toHaveProperty("getBudgetSummary");
    expect(repository).toHaveProperty("getBudgetSummaries");
    expect(typeof repository.getBudgetSummary).toBe("function");
    expect(typeof repository.getBudgetSummaries).toBe("function");
  });

  it("returns the current mock implementation without arguments", () => {
    const repository = createBudgetsRepository();

    expect(repository.getBudgetSummaries()).toEqual(mockBudgetSummaries);
    expect(repository.getBudgetSummary(mockBudgetView.id)).toEqual(mockBudgetView);
  });

  it("returns the current mock implementation with dataSource mock", () => {
    const options: CreateBudgetsRepositoryOptions = {
      dataSource: "mock",
    };

    const repository = createBudgetsRepository(options);

    expect(repository.getBudgetSummaries()).toEqual(mockBudgetSummaries);
    expect(repository.getBudgetSummary(mockBudgetView.id)).toEqual(mockBudgetView);
  });

  it("throws explicitly when supabase datasource is requested", () => {
    expect(() => createBudgetsRepository({ dataSource: "supabase" })).toThrow(
      "SupabaseBudgetsRepository is not available from the application factory yet"
    );
  });

  it("does not require Supabase configuration or environment variables", () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => createBudgetsRepository().getBudgetSummaries()).not.toThrow();
      expect(() =>
        createBudgetsRepository({ dataSource: "mock" }).getBudgetSummaries()
      ).not.toThrow();
      expect(() => createBudgetsRepository({ dataSource: "supabase" })).toThrow(
        "SupabaseBudgetsRepository is not available from the application factory yet"
      );
    } finally {
      if (previousUrl === undefined) {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      } else {
        process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
      }

      if (previousAnonKey === undefined) {
        delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      } else {
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousAnonKey;
      }
    }
  });
});
