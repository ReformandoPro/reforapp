import type { ProjectStatus } from "./status";

export const PROJECT_STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  scheduled: ["in_progress", "on_hold", "cancelled"],
  in_progress: ["on_hold", "completed", "cancelled"],
  on_hold: ["scheduled", "in_progress", "cancelled"],
  completed: [],
  cancelled: [],
};

export function canTransitionProjectStatus(
  from: ProjectStatus,
  to: ProjectStatus
): boolean {
  return PROJECT_STATUS_TRANSITIONS[from].includes(to);
}
