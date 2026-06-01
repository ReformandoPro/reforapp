"use server";

import { isTaskStatus, type TaskStatus } from "@/lib/domain/tasks/status";
import { updateTaskStatus } from "@/lib/services/tasks";

export type UpdateTaskStatusResult =
  | { ok: true; taskId: string; status: TaskStatus }
  | { ok: false; error: string };

export async function updateTaskStatusAction(
  taskId: string,
  status: TaskStatus
): Promise<UpdateTaskStatusResult> {
  if (!taskId) {
    return { ok: false, error: "Missing task id" };
  }

  if (!isTaskStatus(status)) {
    return { ok: false, error: "Invalid status" };
  }

  try {
    const updated = updateTaskStatus(taskId, status);

    if (!updated) {
      return { ok: false, error: "Task not found" };
    }

    return { ok: true, taskId: updated.id, status: updated.status };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
