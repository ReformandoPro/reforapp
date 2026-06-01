import type { TaskStatus } from "@/lib/domain/tasks/status";

import { createTasksRepository } from "@/lib/application";
import type { ProjectTaskListItem } from "@/lib/types";

const tasksRepository = createTasksRepository({ dataSource: "mock" });

export function getProjectTasks(projectId: string): ProjectTaskListItem[] {
  return tasksRepository.getProjectTasks(projectId);
}

export function updateTaskStatus(
  taskId: string,
  status: TaskStatus
): ProjectTaskListItem | null {
  return tasksRepository.updateTaskStatus(taskId, status);
}
