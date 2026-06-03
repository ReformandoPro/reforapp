import type { TaskStatus } from "@/lib/domain/tasks/status";

import {
  getProjectTasks as getProjectTasksFromData,
  updateProjectTaskStatus,
} from "@/lib/data";
import type { ProjectTaskListItem } from "@/lib/types";

export function getProjectTasks(projectId: string): ProjectTaskListItem[] {
  return getProjectTasksFromData(projectId);
}

export function updateTaskStatus(
  taskId: string,
  status: TaskStatus
): ProjectTaskListItem | null {
  return updateProjectTaskStatus(taskId, status);
}
