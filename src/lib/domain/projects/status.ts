// Canonical project lifecycle states for the MVP.
// Keep this list aligned with the database constraint `projects_status_check`.
export const PROJECT_STATUSES = [
  "scheduled",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export function isProjectStatus(value: string): value is ProjectStatus {
  return PROJECT_STATUSES.includes(value as ProjectStatus);
}
