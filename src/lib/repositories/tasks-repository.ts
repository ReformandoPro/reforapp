import type { ProjectTaskListItem } from "@/lib/types";

export interface TasksRepository {
  getProjectTasks(projectId: string): ProjectTaskListItem[];
}
