export type ProjectStatus =
  | "lead"
  | "budgeting"
  | "approved"
  | "scheduled"
  | "in_progress"
  | "paused"
  | "completed"
  | "delivered"
  | "closed"
  | "cancelled";

export type ProjectCard = {
  id: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  delayedTasksCount: number;
  blockedTasksCount: number;
  pendingApprovalsCount: number;
};
