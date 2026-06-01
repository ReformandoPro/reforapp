import type { ProjectTaskListItem } from "@/lib/types";

import type { TasksRepository } from "./tasks-repository";

/**
 * Future Supabase-backed implementation for tasks.
 *
 * This is intentionally a safe skeleton:
 * - it is not connected to runtime yet
 * - it does not execute Supabase queries
 * - it must not be used by services yet
 */
export class SupabaseTasksRepository implements TasksRepository {
  getProjectTasks(projectId: string): ProjectTaskListItem[] {
    void projectId;

    throw new Error("SupabaseTasksRepository is not connected yet");
  }

  updateTaskStatus(
    taskId: string,
    status: ProjectTaskListItem["status"]
  ): ProjectTaskListItem | null {
    void taskId;
    void status;

    throw new Error("SupabaseTasksRepository is not connected yet");
  }
}
