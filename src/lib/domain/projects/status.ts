export const PROJECT_STATUSES = [
  "lead",
  "budgeting",
  "approved",
  "scheduled",
  "in_progress",
  "paused",
  "completed",
  "delivered",
  "closed",
  "cancelled",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export function isProjectStatus(value: string): value is ProjectStatus {
  return PROJECT_STATUSES.includes(value as ProjectStatus);
}
