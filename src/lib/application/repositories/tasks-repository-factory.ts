import { MockTasksRepository } from "../../repositories/mock-tasks-repository";
import type { TasksRepository } from "../../repositories/tasks-repository";

export type TasksRepositoryDataSource = "mock";

export type CreateTasksRepositoryOptions = {
  dataSource?: TasksRepositoryDataSource;
};

function normalizeTasksRepositoryFactoryInput(
  input?: CreateTasksRepositoryOptions
): Required<CreateTasksRepositoryOptions> {
  return {
    dataSource: input?.dataSource ?? "mock",
  };
}

/**
 * Minimal application-layer composition point for tasks repositories.
 *
 * UI must keep consuming `services` and must not use this factory directly.
 * Only the mock datasource is operational for now.
 */
export function createTasksRepository(): TasksRepository;
export function createTasksRepository(
  options: CreateTasksRepositoryOptions
): TasksRepository;
export function createTasksRepository(
  input?: CreateTasksRepositoryOptions
): TasksRepository {
  normalizeTasksRepositoryFactoryInput(input);

  return new MockTasksRepository();
}
