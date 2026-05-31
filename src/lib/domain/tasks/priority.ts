export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export function isTaskPriority(value: string): value is TaskPriority {
  return TASK_PRIORITIES.includes(value as TaskPriority);
}
