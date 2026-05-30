import type { ProjectStatus } from "@/lib/domain/projects/status";

export type ProjectCard = {
  id: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  delayedTasksCount: number;
  blockedTasksCount: number;
  pendingApprovalsCount: number;
};
