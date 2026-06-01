import type { TaskStatus } from "@/lib/domain/tasks/status";
import { mockProjectTasks } from "@/lib/mock/tasks";

import type { TasksRepository } from "./tasks-repository";

type TaskStatusOverride = {
  status: TaskStatus;
  previousStatus?: TaskStatus;
};

/**
 * In-memory overrides to validate the mutation flow UI → server → service → repository.
 *
 * This is not product persistence. It survives only while the server process lives.
 */
const statusOverrides = new Map<string, TaskStatusOverride>();

function getEffectiveStatus(taskId: string, baseStatus: TaskStatus): TaskStatus {
  return statusOverrides.get(taskId)?.status ?? baseStatus;
}

export class MockTasksRepository implements TasksRepository {
  getProjectTasks(projectId: string) {
    return mockProjectTasks
      .filter((task) => task.projectId === projectId)
      .map((task) => ({
        ...task,
        status: getEffectiveStatus(task.id, task.status),
      }));
  }

  updateTaskStatus(taskId: string, status: TaskStatus) {
    const baseTask = mockProjectTasks.find((task) => task.id === taskId);

    if (!baseTask) {
      return null;
    }

    const currentOverride = statusOverrides.get(taskId);
    const currentStatus = currentOverride?.status ?? baseTask.status;

    if (status === "done" && currentStatus !== "done") {
      statusOverrides.set(taskId, {
        status: "done",
        previousStatus: currentStatus,
      });
    } else if (status === "todo" && currentStatus === "done" && currentOverride?.previousStatus) {
      statusOverrides.set(taskId, {
        status: currentOverride.previousStatus,
        previousStatus: undefined,
      });
    } else {
      statusOverrides.set(taskId, {
        status,
        previousStatus: currentOverride?.previousStatus,
      });
    }

    const nextStatus = statusOverrides.get(taskId)?.status ?? status;

    return {
      ...baseTask,
      status: nextStatus,
    };
  }
}
