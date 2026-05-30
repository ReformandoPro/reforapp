import type { ProjectStatus } from "./status";

export const PROJECT_STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  lead: ["budgeting", "cancelled"],
  budgeting: ["approved", "cancelled"],
  approved: ["scheduled", "cancelled"],
  scheduled: ["in_progress", "paused", "cancelled"],
  in_progress: ["paused", "completed", "cancelled"],
  paused: ["scheduled", "in_progress", "cancelled"],
  completed: ["delivered", "closed"],
  delivered: ["closed"],
  closed: [],
  cancelled: [],
};

export function canTransitionProjectStatus(
  from: ProjectStatus,
  to: ProjectStatus
): boolean {
  return PROJECT_STATUS_TRANSITIONS[from].includes(to);
}
