import type { ProjectTaskPriority, ProjectTaskStatus } from "./project-tasks";

export type ProjectTaskFilterRow = {
  status: ProjectTaskStatus;
  priority: ProjectTaskPriority;
};

export type ProjectTaskFilters = {
  status: ProjectTaskStatus | null;
  priority: ProjectTaskPriority | null;
};

export function parseProjectTaskFilters(params: {
  status?: string;
  priority?: string;
}): ProjectTaskFilters {
  const status = params.status;
  const priority = params.priority;

  return {
    status:
      status === "pending" || status === "in_progress" || status === "blocked" || status === "done"
        ? status
        : null,
    priority:
      priority === "low" || priority === "medium" || priority === "high" || priority === "urgent"
        ? priority
        : null,
  };
}

export function filterProjectTasks<T extends ProjectTaskFilterRow>(
  rows: T[],
  filters: ProjectTaskFilters
): T[] {
  return rows.filter((row) => {
    if (filters.status && row.status !== filters.status) return false;
    if (filters.priority && row.priority !== filters.priority) return false;
    return true;
  });
}
