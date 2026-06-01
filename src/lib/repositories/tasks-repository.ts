import type { TaskStatus } from "@/lib/domain/tasks/status";
import type { ProjectTaskListItem } from "@/lib/types";

export interface TasksRepository {
  getProjectTasks(projectId: string): ProjectTaskListItem[];
  updateTaskStatus(taskId: string, status: TaskStatus): ProjectTaskListItem | null;
}
