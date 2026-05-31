import { describe, expect, it } from "vitest";

import type { ProjectsApplicationContext } from "../../src/lib/application/context/projects-application-context";
import {
  createProjectsRepository,
  type CreateProjectsRepositoryOptions,
} from "../../src/lib/application/repositories/projects-repository-factory";
import type { ProjectsRepository } from "../../src/lib/repositories/projects-repository";

function expectMockProjectCards(repository: ProjectsRepository) {
  const projectCards = repository.getProjectCards();

  expect(projectCards.length).toBeGreaterThan(0);
  expect(projectCards[0]).toMatchObject({
    id: expect.any(String),
    name: expect.any(String),
    clientName: expect.any(String),
    status: expect.any(String),
  });
}

describe("createProjectsRepository", () => {
  it("returns an object compatible with ProjectsRepository without arguments", () => {
    const repository: ProjectsRepository = createProjectsRepository();

    expect(repository).toHaveProperty("getProjectCards");
    expect(repository).toHaveProperty("getProjectOverview");
    expect(typeof repository.getProjectCards).toBe("function");
    expect(typeof repository.getProjectOverview).toBe("function");
  });

  it("returns the current mock implementation without arguments", () => {
    const repository = createProjectsRepository();

    expectMockProjectCards(repository);
  });

  it("accepts ProjectsApplicationContext and still returns the current mock implementation", () => {
    const context: ProjectsApplicationContext = {
      organizationId: "org_123",
    };

    const repository = createProjectsRepository(context);

    expectMockProjectCards(repository);
  });

  it("returns the current mock implementation with dataSource mock", () => {
    const options: CreateProjectsRepositoryOptions = {
      dataSource: "mock",
    };

    const repository = createProjectsRepository(options);

    expectMockProjectCards(repository);
  });

  it("returns the current mock implementation with context and implicit mock datasource", () => {
    const options: CreateProjectsRepositoryOptions = {
      context: {
        organizationId: "org_456",
      },
    };

    const repository = createProjectsRepository(options);

    expectMockProjectCards(repository);
  });

  it("returns the current mock implementation with context and dataSource mock", () => {
    const options: CreateProjectsRepositoryOptions = {
      context: {
        organizationId: "org_789",
      },
      dataSource: "mock",
    };

    const repository = createProjectsRepository(options);

    expectMockProjectCards(repository);
  });

  it("throws explicitly when supabase datasource is requested", () => {
    expect(() =>
      createProjectsRepository({ dataSource: "supabase" })
    ).toThrow(
      "SupabaseProjectsRepository is not available from the application factory yet"
    );
  });

  it("does not require Supabase configuration or environment variables", () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const repositoryWithoutArguments = createProjectsRepository();
      const repositoryWithContext = createProjectsRepository({
        organizationId: "org_local",
      });
      const repositoryWithMockOptions = createProjectsRepository({
        dataSource: "mock",
      });
      const repositoryWithContextOnlyOptions = createProjectsRepository({
        context: { organizationId: "org_demo" },
      });
      const repositoryWithContextAndMockOptions = createProjectsRepository({
        context: { organizationId: "org_stage" },
        dataSource: "mock",
      });

      expect(() => expectMockProjectCards(repositoryWithoutArguments)).not.toThrow();
      expect(() => expectMockProjectCards(repositoryWithContext)).not.toThrow();
      expect(() => expectMockProjectCards(repositoryWithMockOptions)).not.toThrow();
      expect(() =>
        expectMockProjectCards(repositoryWithContextOnlyOptions)
      ).not.toThrow();
      expect(() =>
        expectMockProjectCards(repositoryWithContextAndMockOptions)
      ).not.toThrow();
      expect(() =>
        createProjectsRepository({ dataSource: "supabase" })
      ).toThrow(
        "SupabaseProjectsRepository is not available from the application factory yet"
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
