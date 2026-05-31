import { describe, expect, it } from "vitest";

import { createProjectsRepository } from "../../src/lib/application/repositories/projects-repository-factory";
import type { ProjectsRepository } from "../../src/lib/repositories/projects-repository";

describe("createProjectsRepository", () => {
  it("returns an object compatible with ProjectsRepository", () => {
    const repository: ProjectsRepository = createProjectsRepository();

    expect(repository).toHaveProperty("getProjectCards");
    expect(repository).toHaveProperty("getProjectOverview");
    expect(typeof repository.getProjectCards).toBe("function");
    expect(typeof repository.getProjectOverview).toBe("function");
  });

  it("uses the current mock implementation for getProjectCards", () => {
    const repository = createProjectsRepository();
    const projectCards = repository.getProjectCards();

    expect(projectCards.length).toBeGreaterThan(0);
    expect(projectCards[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      clientName: expect.any(String),
      status: expect.any(String),
    });
  });

  it("does not require Supabase configuration to return the mock repository", () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const repository = createProjectsRepository();

      expect(() => repository.getProjectCards()).not.toThrow();
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
