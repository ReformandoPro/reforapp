import { createTasksRepository } from "@/lib/application";
import type { ProjectTaskListItem } from "@/lib/types";

const tasksRepository = createTasksRepository({ dataSource: "mock" });

export function getProjectTasks(projectId: string): ProjectTaskListItem[] {
  return tasksRepository.getProjectTasks(projectId);
}
