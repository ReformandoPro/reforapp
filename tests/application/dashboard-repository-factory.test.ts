import { describe, expect, it } from "vitest";

import {
  createDashboardRepository,
  type CreateDashboardRepositoryOptions,
} from "../../src/lib/application/repositories/dashboard-repository-factory";
import { mockDashboardSummary } from "../../src/lib/mock/dashboard";
import type { DashboardRepository } from "../../src/lib/repositories/dashboard-repository";

describe("createDashboardRepository", () => {
  it("returns an object compatible with DashboardRepository without arguments", () => {
    const repository: DashboardRepository = createDashboardRepository();

    expect(repository).toHaveProperty("getDashboardSummary");
    expect(typeof repository.getDashboardSummary).toBe("function");
  });

  it("returns the current mock implementation without arguments", () => {
    const repository = createDashboardRepository();

    expect(repository.getDashboardSummary()).toEqual(mockDashboardSummary);
  });

  it("returns the current mock implementation with dataSource mock", () => {
    const options: CreateDashboardRepositoryOptions = {
      dataSource: "mock",
    };

    const repository = createDashboardRepository(options);

    expect(repository.getDashboardSummary()).toEqual(mockDashboardSummary);
  });

  it("throws explicitly when supabase datasource is requested", () => {
    expect(() =>
      createDashboardRepository({ dataSource: "supabase" })
    ).toThrow(
      "SupabaseDashboardRepository is not available from the application factory yet"
    );
  });

  it("does not require Supabase configuration or environment variables", () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => createDashboardRepository().getDashboardSummary()).not.toThrow();
      expect(() =>
        createDashboardRepository({ dataSource: "mock" }).getDashboardSummary()
      ).not.toThrow();
      expect(() =>
        createDashboardRepository({ dataSource: "supabase" })
      ).toThrow(
        "SupabaseDashboardRepository is not available from the application factory yet"
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
