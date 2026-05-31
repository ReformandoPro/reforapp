import { describe, expect, it } from "vitest";

import {
  createTasksRepository,
  type CreateTasksRepositoryOptions,
} from "../../src/lib/application/repositories/tasks-repository-factory";
import { mockProjectTasks } from "../../src/lib/mock/tasks";
import type { TasksRepository } from "../../src/lib/repositories/tasks-repository";

describe("createTasksRepository", () => {
  it("returns an object compatible with TasksRepository without arguments", () => {
    const repository: TasksRepository = createTasksRepository();

    expect(repository).toHaveProperty("getProjectTasks");
    expect(typeof repository.getProjectTasks).toBe("function");
  });

  it("returns the current mock implementation without arguments", () => {
    const repository = createTasksRepository();

    expect(repository.getProjectTasks("project_obra_centro")).toEqual(
      mockProjectTasks
    );
  });

  it("returns the current mock implementation with dataSource mock", () => {
    const options: CreateTasksRepositoryOptions = {
      dataSource: "mock",
    };

    const repository = createTasksRepository(options);

    expect(repository.getProjectTasks("project_obra_centro")).toEqual(
      mockProjectTasks
    );
  });

  it("returns an empty array for an unknown project id", () => {
    const repository = createTasksRepository();

    expect(repository.getProjectTasks("unknown")).toEqual([]);
  });

  it("does not require Supabase configuration or environment variables", () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => createTasksRepository().getProjectTasks("project_obra_centro")).not.toThrow();
      expect(() =>
        createTasksRepository({ dataSource: "mock" }).getProjectTasks(
          "project_obra_centro"
        )
      ).not.toThrow();
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
