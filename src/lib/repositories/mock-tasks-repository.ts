import { mockProjectTasks } from "@/lib/mock/tasks";

import type { TasksRepository } from "./tasks-repository";

export class MockTasksRepository implements TasksRepository {
  getProjectTasks(projectId: string) {
    return mockProjectTasks.filter((task) => task.projectId === projectId);
  }
}
