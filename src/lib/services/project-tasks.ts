export const PROJECT_TASK_STATUSES = ["pending", "in_progress", "done", "blocked"] as const;
export type ProjectTaskStatus = (typeof PROJECT_TASK_STATUSES)[number];

export function isProjectTaskStatus(value: string): value is ProjectTaskStatus {
  return PROJECT_TASK_STATUSES.includes(value as ProjectTaskStatus);
}

export const PROJECT_TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type ProjectTaskPriority = (typeof PROJECT_TASK_PRIORITIES)[number];

export function isProjectTaskPriority(value: string): value is ProjectTaskPriority {
  return PROJECT_TASK_PRIORITIES.includes(value as ProjectTaskPriority);
}

